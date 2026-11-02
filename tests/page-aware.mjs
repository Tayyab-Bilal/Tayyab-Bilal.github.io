// Page-aware Bolt: allowlist, HTML->passages, scoring, validator. Run: node tests/page-aware.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { pagePath, htmlToPassages, pickPassages, checkOutput, grep } from "../worker/bolt-worker.js";

// allowlist
for (const [p, want] of [["/", "/index.html"], ["/index.html", "/index.html"], ["/work.html", "/work.html"], ["/work", "/work.html"],
  ["/blog/", "/blog/index.html"], ["/blog/index.html", "/blog/index.html"], ["/blog/no-code-sandbox.html", "/blog/no-code-sandbox.html"],
  ["/blog/grep-first", "/blog/grep-first.html"]]) assert.equal(pagePath(p), want, p);
for (const p of ["//evil.com", "/blog/../x", "/blog/x.html?y", "https://evil.com/", "http://tayyab-bilal.github.io/", "/blog/_template.html",
  "/blog//x.html", "/other.html", "/blog/x.html#a", "", null, undefined, 5, { a: 1 }, "/" + "a".repeat(80), "/blog/a.b.html", "/index.html/"])
  assert.equal(pagePath(p), null, String(p));

// extraction on the real article
const ps = htmlToPassages(readFileSync(new URL("../blog/no-code-sandbox.html", import.meta.url), "utf8"));
const all = ps.map(p => p.t).join("\n");
assert(ps.length > 15);
assert(all.includes("I didn't give my agent a code sandbox"), "entities decoded");
assert(all.includes("Memory | 310 to 390 MB per process | +1.3 MB"), "table rows");
assert(!/<|set_authorizer\(authorizer\)|Skip to content|Light mode|GitHub ·/.test(all), "no tags, code, nav or footer noise");

// scoring
const a = pickPassages(ps, "what is the sqlite authorizer");
assert(/authorizer/i.test(a[0].text) && /SQLite has a feature/.test(a[0].text), a[0].text);
const m = pickPassages(ps, "how much memory did the sandbox use");
assert(m.some(x => /310 to 390 MB/.test(x.text)), "sandbox memory numbers");
assert(pickPassages(ps, "what is the weather today").length === 0);
assert(pickPassages(ps, "sandbox memory authorizer sqlite wasm", 300).reduce((n, x) => n + x.text.length, 0) <= 300, "cap");

// blog index
const idx = htmlToPassages(readFileSync(new URL("../blog/index.html", import.meta.url), "utf8")).map(p => p.t).join("\n");
assert(idx.includes("Everyone's first answer is a vector database. Mine was grep.") && idx.includes("1 to 2 minutes down to about 16 seconds"));

// validator: page-backed wording ok, invented number rejected
const pages = m.map(x => x.text);
assert(checkOutput("the wasm sandbox ate 310 to 390 MB of memory per warm process. I ate a bolt.", [], pages, true));
assert(!checkOutput("the wasm sandbox ate 900 MB of memory per warm process.", [], pages, true), "invented number");
assert(!checkOutput("beep. dunno lol", [], pages, true), "ungrounded");
assert(!checkOutput("see https://x.io sandbox memory process", [], pages, true));
// facts + extra page detail: numbers from the page are allowed, fact still required
const f = grep("what is his stack backend");
assert(checkOutput("backend: python, fastapi, postgresql, redis, qdrant, pytest and github actions. 310 MB.", f, pages, false));
// blog fact exists
assert(grep("does he have a blog").some(x => x.includes("/blog/") && x.includes("vector database")));

// handler end to end with a fake fetch + fake AI (no network, no Cloudflare)
import worker from "../worker/bolt-worker.js";
const html = readFileSync(new URL("../blog/no-code-sandbox.html", import.meta.url), "utf8");
const urls = [];
globalThis.fetch = async u => { urls.push(String(u)); return new Response(html, { headers: { "content-type": "text/html" } }); };
let prompt = "";
const env = { AI: { run: async (_m, o) => { prompt = o.messages[1].content; return { response: "the wasm sandbox used 310 to 390 MB of memory per warm process. beep." }; } } };
const call = (body, ip) => worker.fetch(new Request("https://w/", { method: "POST", headers: { origin: "http://127.0.0.1:8765", "content-type": "application/json", "cf-connecting-ip": ip }, body: JSON.stringify(body) }), env).then(r => r.json());
let r = await call({ q: "how much memory did the sandbox use", page: "/blog/no-code-sandbox.html" }, "2.2.2.2");
assert(r.answer.includes("310 to 390 MB") && prompt.includes("From the page he is reading"));
assert.deepEqual(urls, ["https://tayyab-bilal.github.io/blog/no-code-sandbox.html"]);
urls.length = 0;
r = await call({ q: "how much memory did the sandbox use", page: "//evil.com/x" }, "2.2.2.3");
assert.equal(urls.length, 0, "bad page path never fetched");
globalThis.fetch = async () => { throw new Error("down"); };
r = await call({ q: "has he done rag", page: "/blog/no-code-sandbox.html" }, "2.2.2.4");
assert(typeof r.answer === "string" && r.answer.length > 0, "fetch failure falls back");
console.log("page-aware ok");
