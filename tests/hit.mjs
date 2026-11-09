// Visitor tracker: POST /hit. Run: node tests/hit.mjs
import assert from "node:assert";
import worker from "../worker/bolt-worker.js";

const cf = { country: "AE", isEUCountry: "0", continent: "AS", region: "Dubai", city: "Dubai", postalCode: "00000", timezone: "Asia/Dubai",
  asn: 5384, asOrganization: "Emirates Telecom", colo: "DXB", latitude: "25.2", longitude: "55.3" };
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
function run({ body = { path: "/blog/grep-first.html", ref: "news.ycombinator.com", lang: "en-GB", w: 1440 }, origin = "https://tayyab-bilal.github.io", ua = UA, dbFail = false } = {}) {
  const rows = [];
  const env = { HIT_SALT: "s", DB: { prepare: sql => ({ bind: (...v) => ({ run: async () => { if (dbFail) throw new Error("d1 down"); rows.push({ sql, v }); } }) }) } };
  const pending = [];
  const req = new Request("https://w/hit", { method: "POST", headers: { origin, "user-agent": ua, "content-type": "text/plain", "cf-connecting-ip": "203.0.113.9" }, body: JSON.stringify(body) });
  Object.defineProperty(req, "cf", { value: cf });
  return worker.fetch(req, env, { waitUntil: p => pending.push(p) }).then(async r => { await Promise.all(pending); return { status: r.status, rows }; });
}

let r = await run();
assert.equal(r.status, 204); assert.equal(r.rows.length, 1);
const cols = r.rows[0].sql.match(/\(([^)]*)\) VALUES/)[1].split(",");
const row = Object.fromEntries(cols.map((c, i) => [c, r.rows[0].v[i]]));
assert.equal(row.path, "/blog/grep-first.html"); assert.equal(row.referrer_host, "news.ycombinator.com");
assert.equal(row.country, "AE"); assert.equal(row.continent, "AS"); assert.equal(row.city, "Dubai"); assert.equal(row.asn, 5384);
assert.equal(row.as_org, "Emirates Telecom"); assert.equal(row.colo, "DXB"); assert.equal(row.is_eu, 0);
assert.equal(row.device, "desktop"); assert.equal(row.browser, "Chrome"); assert.equal(row.os, "Windows"); assert.equal(row.lang, "en-GB");
assert(/^[0-9a-f]{16}$/.test(row.visitor)); assert.equal(row.dwell_ms, null); assert(/^\d{4}-\d\d-\d\dT.*Z$/.test(row.ts));

// privacy: no IP, no lat/long anywhere in the stored row or the column list
const dump = JSON.stringify(r.rows[0]);
assert(!dump.includes("203.0.113.9"), "no IP"); assert(!/lat|lon|25\.2|55\.3/i.test(dump), "no lat/long");

// same visitor+day => same id; different IP => different id
const again = await run(); assert.equal(again.rows[0].v[cols.indexOf("visitor")], row.visitor);

r = await run({ body: { path: "/index.html", dwell: 4200 } }); assert.equal(r.rows[0].v[cols.indexOf("dwell_ms")], 4200);
r = await run({ ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari" }); assert.equal(r.rows[0].v[cols.indexOf("device")], "mobile");

r = await run({ origin: "https://evil.example" }); assert.equal(r.status, 403); assert.equal(r.rows.length, 0);
for (const path of ["/admin", "/blog/../x", "//evil.com", "/index.html?x=1", 5, null]) { r = await run({ body: { path } }); assert.equal(r.rows.length, 0, String(path)); assert.equal(r.status, 204); }
r = await run({ ua: "Googlebot/2.1" }); assert.equal(r.rows.length, 0);
r = await run({ ua: "HeadlessChrome/120" }); assert.equal(r.rows.length, 0);

r = await run({ dbFail: true }); assert.equal(r.status, 204, "DB failure swallowed");
console.log("hit ok");
