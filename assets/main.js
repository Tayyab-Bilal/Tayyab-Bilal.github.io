// Mirrors agent-guardrails: resolver.py (TOOL_ACTIONS, ALLOWED_UNGATED, READ_TOOLS, mode_for)
// and gatekeeper.py guard(). Pure function, no network.
var TOOL_ACTIONS = {
  create_task: ["Tasks", "Create Task"],
  update_task: ["Tasks", "Update Task"],
  schedule_meeting: ["Meetings", "Schedule Meeting"]
};
var DENIED_ON_PURPOSE = ["delete_project", "delete_task", "remove_member"];
var READ_TOOLS = ["get_task", "list_tasks"];

function decide(tool, mode) {
  var trace = ["agent proposes " + tool + "(...)"];
  if (READ_TOOLS.indexOf(tool) >= 0) {
    trace.push("on the explicit read list, so it is not gated");
    return { kind: "run", label: "Run now", reason: "Read tools pass through. They cannot change data.", trace: trace, msg: "" };
  }
  trace.push("existing draft for this exact action? none");
  if (!TOOL_ACTIONS[tool]) {
    var denied = DENIED_ON_PURPOSE.indexOf(tool) >= 0;
    trace.push("in the tool-to-action map? no");
    trace.push("blocked here. No permission lookup is made");
    return {
      kind: "block", label: "Block",
      reason: denied
        ? "Denied on purpose. It is never mapped to a nearby action, because allowing edits never meant allowing deletes."
        : "Unknown tool. Anything not in the map is refused before any lookup. A real unclassified tool also fails at startup.",
      trace: trace,
      msg: "NOT ALLOWED: '" + tool + "' has no permission mapping. This is a policy outcome, not an error; do not retry or work around it."
    };
  }
  var action = TOOL_ACTIONS[tool][1];
  trace.push("in the tool-to-action map? yes, " + TOOL_ACTIONS[tool].join(" / "));
  trace.push("load permissions fresh for this call");
  if (mode === "down") {
    trace.push("timeout, retry 1 ... timeout, retry 2 ... timeout");
    trace.push("verdict: UNAVAILABLE, park the run as resumable");
    return {
      kind: "down", label: "Unavailable, retry then park",
      reason: "The permissions service is down. Nothing runs, the run is parked to resume later, and it is never shown as \"disabled\".",
      trace: trace,
      msg: "SYSTEM UNAVAILABLE: the permissions service could not be reached (timeout). Nothing was done. This is not a policy decision. Stop making changes; the run is parked as resumable."
    };
  }
  trace.push("mode for " + action + ": " + { auto: "Autonomous", suggest: "Suggest Only", disabled: "Disabled" }[mode]);
  if (mode === "auto") {
    trace.push("claim a ledger row first, then run the real tool once");
    return { kind: "run", label: "Run now", reason: "Autonomous. A ledger row is claimed first, so a retry or a second worker cannot run it twice.", trace: trace, msg: "" };
  }
  if (mode === "suggest") {
    trace.push("store a draft with signed arguments, write the approval sentence");
    return {
      kind: "hold", label: "Hold for a human",
      reason: "Suggest Only. A draft is stored with the exact arguments. If approved, those stored arguments run, not a fresh model answer.",
      trace: trace,
      msg: "AWAITING APPROVAL: \"" + action + " for 'Draft spec'\" was sent to a human for approval. Do not retry; continue with independent steps."
    };
  }
  trace.push("refused");
  return {
    kind: "block", label: "Block",
    reason: "Disabled by the organisation's settings. This is a policy answer, not an error.",
    trace: trace,
    msg: "NOT ALLOWED: '" + action + "' is disabled by the organisation's settings. This is a policy outcome, not an error; do not retry."
  };
}

if (typeof module !== "undefined") module.exports = { decide: decide };

if (typeof document !== "undefined") {

  // Theme toggle: system setting by default, the choice is remembered per browser.
  var root = document.documentElement, themeBtn = document.getElementById("theme-toggle");
  function current() { return root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); }
  function label() { themeBtn.textContent = current() === "light" ? "Dark mode" : "Light mode"; }
  themeBtn.addEventListener("click", function () {
    root.dataset.theme = current() === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    label();
  });
  label();

  // Phone: keep the dock out of the way on the first screen.
  var dock = document.querySelector(".dock"), hero = document.getElementById("top");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { dock.classList.toggle("away", e[0].isIntersecting); }, { threshold: 0.35 }).observe(hero);
  }

  // Copy email.
  var copyBtn = document.getElementById("copy-email");
  var copyStatus = document.getElementById("copy-status");
  copyBtn.addEventListener("click", function () {
    var text = document.getElementById("email").textContent.trim();
    function done(ok) { copyStatus.textContent = ok ? "Copied." : "Copy failed. Select the address and copy it."; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var r = document.createRange(); r.selectNodeContents(document.getElementById("email"));
      var s = getSelection(); s.removeAllRanges(); s.addRange(r);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      done(ok);
    }
  });

  // Gate demo.
  var form = document.getElementById("gate-form");
  function render() {
    var tool = form.elements.tool.value, mode = form.elements.mode.value;
    var d = decide(tool, mode);
    var v = document.getElementById("verdict");
    v.dataset.kind = d.kind;
    v.querySelector(".label").textContent = d.label;
    v.querySelector(".reason").textContent = d.reason;
    var ol = document.getElementById("trace");
    ol.innerHTML = "";
    d.trace.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ol.appendChild(li); });
    var m = document.getElementById("msg");
    m.hidden = !d.msg;
    m.textContent = d.msg;
  }
  form.addEventListener("change", render);
  render();
}
