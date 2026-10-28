// Run: node tests/gate-check.js  (checks the demo matches agent-guardrails rules)
const assert = require("assert");
const { decide } = require("../assets/main.js");

for (const mode of ["auto", "suggest", "disabled", "down"]) {
  // Denied and unknown tools are blocked before any lookup, even when the service is down.
  assert.equal(decide("delete_project", mode).kind, "block");
  assert.equal(decide("archive_everything", mode).kind, "block");
  assert.ok(!decide("archive_everything", mode).trace.some(t => t.includes("load permissions")));
  assert.equal(decide("get_task", mode).kind, "run");
}
assert.equal(decide("update_task", "auto").kind, "run");
assert.equal(decide("update_task", "suggest").kind, "hold");
assert.equal(decide("update_task", "disabled").kind, "block");
const down = decide("create_task", "down");
assert.equal(down.kind, "down");
assert.ok(!/disabled by/i.test(down.msg)); // an outage is never shown as disabled
console.log("gate-check ok");
