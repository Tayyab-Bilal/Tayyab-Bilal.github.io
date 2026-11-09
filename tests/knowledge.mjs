// Knowledge bank checks. Run: node tests/knowledge.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";
import worker, { grep } from "../worker/bolt-worker.js";
import { KNOWLEDGE } from "../worker/knowledge.js";

const BANNED = [/68\s?%/, /\$\s?0?\.08/, /500\s?ms/i, /yally/i, /#\s?1\b/, /led 3\b/i, /\b5\s?\+/, /nearly 5/i, /\b4\s?\+/, /livekit/i, /allysai/i, /musharp/i, /tixters/i, /ck foods/i,
  /hipaa|soc\s?2|mlflow/i, /github\.com/i, /\+?\d[\d\s-]{8,}\d/, /\b(salary|pay|paid)\b/i, /[–—]/, /\b(pull request|PRs?|commits?|issues?)\b/i, /\blines of code\b/i,
  /led a team of \d|\b(1|one|2|two|3|three|4|four|5|five|6|six|7|seven|8|eight|9|nine|10|11|twelve|\d+) engineers/i];
assert(KNOWLEDGE.length >= 40 && KNOWLEDGE.length <= 80, "size");
for (const [topic, fact] of KNOWLEDGE) {
  assert(topic && fact && fact.length < 220, `shape: ${fact}`);
  for (const re of BANNED) assert(!re.test(fact), `banned ${re} in: ${fact}`);
  if (/agent kit/i.test(fact)) assert(!/shipped/i.test(fact), `agent kit must not say shipped: ${fact}`);
  const emails = fact.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
  assert(emails.every(e => e === "tayyaib055766@gmail.com"), "only his email");
  const li = fact.match(/linkedin\.com\/in\/[\w-]+/g) || [];
  assert(li.every(l => l === "linkedin.com/in/tayyab-bilal-tdev"), "only his linkedin");
}
const all = KNOWLEDGE.map(k => k[1]).join(" ");
assert(all.includes("currently a Senior AI Engineer at SWSAM Solutions"));
assert(all.includes("led a team of engineers"));
assert(all.includes("5 years"));
assert(!/SWSAM[^.]*\b(until|to|ended|left)\b[^.]*20\d\d/i.test(all.replace(/since April 2026/g, "")), "SWSAM has no end date");

// offline answers (pet.js facts + hover lines, bolt-lines.js) follow the same banned list
const rd = f => readFileSync(new URL("../assets/" + f, import.meta.url), "utf8");
const pet = rd("pet.js");
const offline = [pet.match(/var facts = \[[\s\S]*?\n  \];/)[0], pet.match(/var lines = \{[\s\S]*?\n  \};/)[0], pet.match(/var clickLines = .*/)[0], rd("bolt-lines.js")];
assert(offline.every(t => t.length > 50), "offline text found");
for (let t of offline) {
  t = t.replace(/\b[01]{8}( [01]{8})+/g, "binary joke");
  for (const re of BANNED) assert(!re.test(t), `banned ${re} in offline text: ${(t.match(re) || [])[0]}`);
  assert(!/\b(95%|5x|3x|1,100|345K|114|10 public)\b|\b\d+K lines/i.test(t), "no stats beyond the approved facts");
  assert(!/agent kit[^"]*shipped|shipped[^"]*agent kit/i.test(t), "agent kit is built and tested, not shipped");
  assert((t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).every(e => e === "tayyaib055766@gmail.com"), "only his email");
  assert((t.match(/linkedin\.com\/in\/[\w-]+/g) || []).every(l => l === "linkedin.com/in/tayyab-bilal-tdev"), "only his linkedin");
}
assert(/Senior AI Engineer at SWSAM/.test(offline[0]) && /5 years/.test(offline[0]));

// retrieval
assert(grep("what did he do at TransData?").some(f => f.includes("TransData")));
assert(grep("where did he study?").some(f => f.includes("University of Central Punjab")));
assert(grep("what is his education").some(f => f.includes("University of Central Punjab")));
assert(grep("tell me about guardian permissions").some(f => f.includes("Guardian")));
assert.deepEqual(grep("what is the weather like"), []);
assert(grep("who is tayyab").length <= 5);

// handler: ai says something invented, fact fallback is used and logged as "knowledge"
async function ask(q, ai, page) {
  const rows = [], pend = [];
  const env = { AI: { run: async () => ({ response: ai }) }, DB: { prepare: () => ({ bind: (...v) => ({ run: async () => rows.push(v) }) }) } };
  const req = new Request("https://w/", { method: "POST", headers: { origin: "https://tayyab-bilal.github.io", "content-type": "application/json", "cf-connecting-ip": "10.0.0." + Math.floor(Math.random() * 250) }, body: JSON.stringify({ q, page }) });
  const r = await worker.fetch(req, env, { waitUntil: p => pend.push(p) }); await Promise.all(pend);
  return { answer: (await r.json()).answer, source: rows[0] && rows[0][4] };
}
let r = await ask("what did he do at transdata?", "he invented a time machine at some company in 2031", "");
assert(r.answer.includes("TransData") && r.source === "knowledge", JSON.stringify(r));
r = await ask("where did he study?", "he studied at oxford for ten years", "");
assert(r.answer.includes("University of Central Punjab") && r.source === "knowledge", JSON.stringify(r));
r = await ask("how did he cut inference cost?", "at transdata he cut inference cost by about 80% by serving a qwen 7b model in 4 bit with qlora", "");
assert.equal(r.source, "ai");
r = await ask("zzzz qqqq xylophone", "whatever", "");
assert.equal(r.answer, "not sure about that one. ask Tayyab directly: tayyaib055766@gmail.com or linkedin.com/in/tayyab-bilal-tdev"); assert.equal(r.source, "dunno");
r = await ask("is he available for hire and what are his rates?", "yes he is available now for $50 an hour", "");
assert(!/\$|50/.test(r.answer) && r.answer.includes("tayyaib055766@gmail.com") && r.answer.includes("linkedin.com/in/tayyab-bilal-tdev"), JSON.stringify(r));
// live questions, model answer rejected: TransData work facts combined; availability fact intact (leading "If" kept)
r = await ask("what did he do at transdata", "he invented a time machine at some company in 2031", "/blog/");
assert(/microservices/.test(r.answer) && /Bedrock/.test(r.answer) && /80%/.test(r.answer) && !/^His career so far/.test(r.answer) && r.source === "knowledge", JSON.stringify(r));
assert(r.answer.length <= 420 && r.answer.endsWith("."), "bounded whole sentences");
r = await ask("is he available for hire", "you want to know if he is available, open to hire, or what his rates are, ask him directly by email at tayyaib055766@gmail.com", "/blog/");
assert(r.answer.startsWith("If you want to know whether he is available,") && r.source === "knowledge", JSON.stringify(r));
r = await ask("is he available for hire", "garbage 99", "");
assert(r.answer.startsWith("If you want to know whether"), JSON.stringify(r));
console.log("knowledge ok", KNOWLEDGE.length, "facts");
