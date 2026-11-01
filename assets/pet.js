// Bolt: a clingy little robot-arm pet. Follows the cursor, comments on what you are reading,
// naps when you stop, gets dizzy if you shake it. Scripted lines only: it never makes claims.
(function () {
  if (typeof document === "undefined") return;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  try { localStorage.removeItem("pet"); } catch (e) {} // old "send to bed" flag: Bolt never sleeps in

  var pet = document.createElement("div");
  pet.className = "pet" + (touch ? " parked" : "");
  pet.innerHTML =
    '<div class="pet-bubble"><span></span><button type="button" class="pet-ask">ask me</button></div>' +
    '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="pet-body">' +
    '<rect x="16" y="50" width="32" height="8" rx="3" class="pet-base"/>' +
    '<g class="pet-arm"><rect x="28" y="30" width="8" height="22" rx="4"/><circle cx="32" cy="30" r="5" class="pet-joint"/>' +
    '<g class="pet-head"><rect x="22" y="10" width="20" height="16" rx="6"/><circle cx="32" cy="18" r="3.6" class="pet-eye"/>' +
    '<path d="M42 16l7-4M42 20l7 4" class="pet-claw"/></g></g></g></svg>' +
    '<form class="pet-chat" autocomplete="off"><p class="pet-answer">ask me about Tayyab. I know things. some things.</p>' +
    '<input name="q" maxlength="200" placeholder="has he done RAG?" aria-label="Ask Bolt about Tayyab"><button type="submit">ask</button></form>';
  document.body.appendChild(pet);
  var bubble = pet.querySelector(".pet-bubble span"), chat = pet.querySelector(".pet-chat"), answer = pet.querySelector(".pet-answer"), chatting = false;
  var api = (document.querySelector('meta[name="bolt-api"]') || {}).content || "";

  // What Bolt knows: short facts taken from this page. Grep-first: score by shared words, best match wins.
  var facts = [
    ["who tayyab about intro senior ai engineer years experience long", "Senior AI Engineer in Lahore. 5 years in ML and AI, about 4 of them building agents."],
    ["agents langgraph react rasa agent experience", "about 4 years of agents: Rasa state machines, then hand-written ReAct loops, now LangGraph."],
    ["current job swsam now production users", "now: Senior AI Engineer at SWSAM. the platform is in production with real users, early release. he leads a team of engineers."],
    ["transdata previous job before qwen fine tune fine-tuning qlora inference cost", "at Transdata he fine-tuned Qwen 7B with QLoRA (over 95% accuracy) and cut inference cost about 80% with 5x throughput, serving it in 4-bit on AWS GPUs."],
    ["quid sol first job chatbots healthcare fintech", "at Quid Sol (2022 to 2024) he built ML apps and chatbots, Rasa assistants, then ReAct agents by hand."],
    ["rag retrieval evaluation eval evals ragas faithfulness", "RAG: yes. he designed a Three-Hook evaluation model (every query, a sampled judge, a CI golden set)."],
    ["approval gate human in the loop permissions safety guardrails write delete", "the approval gate: every write tool goes through one checkpoint. Autonomous, Suggest Only or Disabled per action. deletes are denied on purpose."],
    ["prompt injection security attack attacks red team", "his agent kit closed every hole a 114-attack injection suite found. that kit is built, not shipped yet."],
    ["cost cheaper model switch planner sonnet 77", "the planner got about 77% cheaper after a model switch, passing every benchmark and end-to-end case."],
    ["contributor codebase lines commits senior impact reviewer", "he is the #1 contributor to the SWSAM platform's codebase, about 30% of 345K lines, within 5.5 months. he is also the primary code reviewer, catching cross-tenant security bugs."],
  ["ci pipeline build devops faster tests", "he made PR builds about 3x faster (11m20s to 3m44s) with zero changed test results."],
  ["search grep vector database fast 16 seconds", "grep-first search: finding the right record went from 1 to 2 minutes to about 16 seconds. he wrote a post on it."],
    ["backend python fastapi postgres postgresql redis stack api apis build services", "backend: Python, FastAPI, PostgreSQL, Redis, Qdrant, pytest, GitHub Actions. strong backend side, not just prompts."],
    ["ai coding tools claude code codex cursor stack other stacks fast build", "he ships with Claude Code, Codex, OpenCode, a DeepSeek harness, T3 Code and local Ollama models. AI-accelerated on any stack."],
    ["open source github repos code tests", "10 public repos, 1,100+ passing tests. libraries he maintains in the open."],
    ["available hire contact email reach freelance remote hours timezone", "Lahore, UTC+5, open to remote, overlaps the EU day and US mornings. email: tayyaib055766@gmail.com"],
    ["cv resume download", "the Download CV button is at the top. I'd carry it to you but I have one claw."],
    ["bolt you pet robot who are you", "I'm Bolt. a pet. not an agent. I have no tools and no permissions. he made sure."]
  ];
  var stop = " the and has have had does did what how many much who for with about his him is are was can you tell any done ";
  function words(t) { return (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return w.length > 2 && stop.indexOf(" " + w + " ") < 0; }); }
  function grep(q) {
    var qs = words(q).filter(function (w) { return w.length > 2; }), best = null, top = 0;
    // keyword hits count double, so a fact's topic beats a passing mention in another answer
    facts.forEach(function (f) { var k = words(f[0]), b = words(f[1]), n = 0; qs.forEach(function (w) { n += k.indexOf(w) >= 0 ? 2 : b.indexOf(w) >= 0 ? 1 : 0; }); if (n > top) { top = n; best = f; } });
    return { hit: best, all: facts.filter(function (f) { var k = words(f[0]); return qs.some(function (w) { return k.indexOf(w) >= 0; }); }).slice(0, 3) };
  }
  function ask(q) {
    var g = grep(q), local = g.hit ? g.hit[1] : "dunno. not on this page. email him: tayyaib055766@gmail.com";
    answer.textContent = "thinking… (beep)";
    if (!api) { setTimeout(function () { answer.textContent = local; }, 400); return; }
    // Model proposes, code decides: the AI only rephrases facts we pass it; any error falls back to grep.
    var done = false, t = setTimeout(function () { if (!done) { done = true; answer.textContent = local; } }, 6000);
    fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: q }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { if (!done) { done = true; clearTimeout(t); answer.textContent = (d && d.answer) || local; } })
      .catch(function () { if (!done) { done = true; clearTimeout(t); answer.textContent = local; } });
  }
  chat.addEventListener("submit", function (e) { e.preventDefault(); var q = chat.q.value.trim(); if (q) ask(q); });
  function closeChat() { chatting = false; pet.classList.remove("chatting"); setReach(false); follow(); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && chatting) closeChat(); });
  document.addEventListener("click", function (e) { if (chatting && !pet.contains(e.target)) closeChat(); });

  var lines = {
    top: ["hi. I'm Bolt. I follow people.", "he made me. I'm the least tested thing here.", "scroll. go on. I'll come with you."],
    experience: ["5 years. I've been around for 5 minutes.", "SWSAM: real people use his stuff. none of them have met me."],
    "case-gate": ["this is the thing that stops me deleting things.", "I asked for delete rights. denied. on purpose."],
    "case-kit": ["114 attacks. I tried a 115th. it didn't work.", "the code decides, not the model. rude, but fair."],
    "case-auto": ["it runs at 3 a.m. with nobody watching. like me.", "77% cheaper. I'm free, for the record."],
    "case-rag": ["three hooks. I only have one claw.", "the judge checks answers. nobody checks mine."],
    demo: ["press the buttons. I'll watch.", "try delete_project. I dare you."],
    oss: ["1,100+ tests. I have zero. living dangerously.", "all of it is open. go poke it."],
    writing: ["he wrote about grep. I can't read."],
    contact: ["email him. I'll wait here. forever.", "the button is right there. I can see it from here."],
    fit: ["if you nodded at any of these, he's your guy.", "I am also a problem. he can't fix me."],
    offer: ["three things. he's annoyingly good at all three.", "proof under every card. he insists."],
    process: ["step 1 is just an email. even I could do it.", "small proof first. no big scary contract."]
  };
  var clickLines = ["beep.", "*spins for no reason*", "fire? no fire. just checking.", "I dropped a bolt. it was me. I'm the bolt.", "boop."];

  var tx = innerWidth - 120, ty = innerHeight - 140, x = tx, y = ty, lastMove = Date.now(), said = {}, hideT, asleep = false, hover = false, reach = false;
  // Reach = the user deliberately touched Bolt (or its "ask me" button): only then does the bubble area hold Bolt still.
  function setReach(v) { reach = v; pet.classList.toggle("reach", v); }

  // The bubble stays up while the pointer is on Bolt, its bubble or its chat (they are all inside .pet).
  function say(t, ms) {
    bubble.textContent = t; rel = null; pet.classList.add("talking");
    clearTimeout(hideT); hideT = setTimeout(function () { if (hover) return say(bubble.textContent, 1500); pet.classList.remove("talking"); setReach(false); follow(); }, ms || 3600);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Comment once per section as it comes into view.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.id;
        if (e.isIntersecting && lines[id] && !said[id] && !asleep) { said[id] = 1; say(pick(lines[id])); }
      });
    }, { threshold: 0.45 });
    Object.keys(lines).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // In reach mode, a pointer within 24px of the bubble holds Bolt still so the "ask me" button stays put.
  var rel = null, enterT;
  function nearBubble(cx, cy) {
    // Bubble box relative to Bolt, measured once per text/flip change (a layout read on every mousemove made the page janky).
    if (!rel) { var b = bubble.parentNode.getBoundingClientRect(); rel = { l: b.left - x, r: b.right - x, t: b.top - y, b: b.bottom - y }; }
    var dx = Math.max(rel.l + x - cx, 0, cx - rel.r - x), dy = Math.max(rel.t + y - cy, 0, cy - rel.b - y);
    return Math.hypot(dx, dy) < 24;
  }

  // Pointer speed comes from real pointer movement (px per ms), never from how far Bolt's target jumped.
  var px = 0, py = 0, pt = 0, pspeed = 0, fastSince = 0, dizzyOkAt = 0, frozen = false, resumeAt = 0, lean = 0, vx = 0, vy = 0;
  // One decision from the last pointer position; also run when the bubble or chat closes, so Bolt never waits for a mouse move.
  // Cat: stops when you come close (soft stop, a little momentum, only on the transition) but keeps watching you.
  function hold() { if (!frozen) { frozen = true; tx = x + vx * 3; ty = y + vy * 3; } wake(); return true; }
  function follow() {
    if (!pt) return false; // no pointer seen yet (touch never sets pt)
    var talking = pet.classList.contains("talking");
    if (reach && !hover && !(talking && nearBubble(px, py))) setReach(false);
    if (chatting || hover || (reach && talking) || Math.hypot(px - (x + 32), py - (y + 32)) < (frozen ? 64 : 44)) return hold();
    if (frozen) { frozen = false; resumeAt = Date.now(); } // ease in, no snap
    tx = px + 28; ty = py + 22; wake(); return false;
  }
  // Any activity (move, click, key, wheel, scroll) resets the idle timer and eases Bolt out of drowsy or sleep.
  function poke() {
    lastMove = Date.now();
    if (asleep || pet.classList.contains("drowsy")) { lean = lastLean = asleep ? 28 : 12; arm.style.transform = "rotate(" + lean + "deg)"; } // tick() eases the arm up from the sleep tilt, no snap
    if (asleep) { // wake with a little shake (CSS), then the line
      asleep = false; pet.classList.remove("asleep"); pet.classList.add("waking"); setTimeout(function () { pet.classList.remove("waking"); }, 700);
      say("!! I was not sleeping.", 2200);
    } else pet.classList.remove("drowsy");
    wake();
  }
  if (!touch) {
    ["pointerdown", "keydown", "wheel", "scroll"].forEach(function (ev) { addEventListener(ev, poke, { passive: true, capture: true }); });
    addEventListener("mousemove", function (e) {
      var dt = e.timeStamp - pt, v = pt && dt > 0 ? Math.hypot(e.clientX - px, e.clientY - py) / dt : 0;
      px = e.clientX; py = e.clientY; pt = e.timeStamp;
      pspeed = pspeed * 0.7 + v * 0.3;
      poke();
      // Clingy but catchable: once the cursor is on top of Bolt (or in reach mode, its bubble), it holds still so you can click it.
      if (follow()) { pspeed = 0; fastSince = 0; return; }
      // Dizzy needs genuinely frantic shaking: over 3px/ms for 300ms, at most once per 20s, never while a bubble is up.
      if (pspeed < 3) fastSince = 0;
      else if (!fastSince) fastSince = Date.now();
      else if (Date.now() - fastSince > 300 && Date.now() > dizzyOkAt && !pet.classList.contains("talking") && !pet.classList.contains("dizzy")) {
        dizzyOkAt = Date.now() + 20000; fastSince = 0;
        pet.classList.add("dizzy"); say("whoa. slow down.", 2000);
        setTimeout(function () { pet.classList.remove("dizzy"); }, 1200);
      }
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a.btn, .readcode, .opts label");
      if (a && Math.random() < 0.35) say(pick(["ooh, that one.", "click it. what's the worst that happens.", "good choice. probably."]), 2200);
    }, { passive: true });
  }

  // Click Bolt: it does something weird. The "ask me" button in its bubble opens the chat.
  function openChat() { chatting = true; pet.classList.add("chatting"); pet.classList.remove("talking"); setTimeout(function () { chat.q.focus(); }, 50); }
  // Hovering Bolt brings up its bubble, so the "ask me" button is always one hover away.
  // It also freezes in place and enters reach mode: the bubble area holds Bolt still, so a diagonal path to the button works.
  pet.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "touch" || e.timeStamp - pt > 100) return; // not real pointer movement (Bolt glided under a still cursor)
    hover = true; hold(); setReach(true);
    // Only after resting on Bolt for a moment, so flicking the cursor across it does not pop the bubble.
    clearTimeout(enterT);
    enterT = setTimeout(function () { if (hover && !chatting && !pet.classList.contains("talking")) say(pick(["need something?", "ask me stuff. or poke me.", "hi. again."]), 3000); }, 250);
  });
  pet.addEventListener("pointerleave", function () {
    clearTimeout(enterT);
    hover = false;
    if (pet.classList.contains("talking")) say(bubble.textContent, 2500);
  });
  pet.addEventListener("click", function (e) {
    if (e.target.closest(".pet-ask")) { openChat(); return; }
    if (chat.contains(e.target)) return;
    if (chatting) { closeChat(); return; }
    antic();
  });
  // Click lines: a shuffled deck from bolt-lines.js (no repeats until used up); falls back to clickLines.
  var deck = [];
  function clickLine() {
    var all = window.BOLT_LINES;
    if (!all || !all.length) return pick(clickLines);
    if (!deck.length) { deck = all.slice(); for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; } }
    return deck.pop();
  }
  function antic() { pet.classList.remove("spin"); void pet.offsetWidth; pet.classList.add("spin"); say(clickLine(), 2800); }

  // More reactions to what the visitor does.
  function on(sel, ev, fn) { var el = document.querySelector(sel); if (el) el.addEventListener(ev, fn); }
  on("#theme-toggle", "click", function () { say(document.documentElement.dataset.theme === "light" ? "my eyes. MY EYES." : "ahh. darkness. home.", 2200); });
  on("#copy-email", "click", function () { say("copied. I helped. you're welcome.", 2400); });
  on("#gate-form", "change", function () {
    var k = (document.getElementById("verdict") || {}).dataset; k = k && k.kind;
    say({ run: "it ran. once. the ledger says so.", hold: "waiting for a human. could be you.", block: "BLOCKED. good. I tried that once.", down: "service down. nobody panic. it parks." }[k] || "hm.", 2600);
  });
  document.addEventListener("mouseup", function () { var t = String(getSelection()).trim(); if (t.length > 12 && Math.random() < 0.5) say("ooh, highlighting. taking notes?", 2200); });
  var leftAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { leftAt = Date.now(); return; }
    if (Date.now() - leftAt > 20000) say(pick(["you came back!", "where did you go. I counted the pixels."]), 2400);
  });
  var bottomSaid = false;
  addEventListener("scroll", function () { if (!bottomSaid && innerHeight + scrollY >= document.body.scrollHeight - 40) { bottomSaid = true; say("the end. now email him. go.", 3000); } }, { passive: true });
  setInterval(function () { if (!asleep && !chatting && !document.hidden && Math.random() < 0.25) antic(); }, 45000);

  setInterval(function () {
    // Nod off in two steps: drowsy at 7.5s idle, asleep at 9s.
    if (chatting || hover) lastMove = Date.now(); // never nods off mid-chat or with the pointer on Bolt
    var idle = Date.now() - lastMove;
    if (asleep || touch) return;
    if (idle > 9000) { asleep = true; pet.classList.remove("drowsy"); pet.classList.add("asleep"); say("zzz", 999999); }
    else if (idle > 7500) pet.classList.add("drowsy");
  }, 1000);

  // Animate only while Bolt is catching up; stop the loop once it has arrived.
  var arm = pet.querySelector(".pet-arm"), running = false, lastLean = 0, flipped = false;
  function tick() {
    // Glide: 8% of the gap per frame, eased in for 300ms after a freeze, and never more than 36px a frame.
    var k = still ? 1 : 0.08 * Math.min(1, 0.1 + (Date.now() - resumeAt) / 333), sx = (tx - x) * k, sy = (ty - y) * k, m = Math.hypot(sx, sy);
    if (m > 36 && !still) { sx *= 36 / m; sy *= 36 / m; }
    x += sx; y += sy; vx = sx; vy = sy;
    // Lean into the motion; when held still, look toward the cursor. Eased, in 4deg steps (SVG rotates cost a layout each).
    var want = Math.max(-25, Math.min(25, frozen ? (px - (x + 32)) * 0.35 : (tx - x) * 0.4));
    lean += (want - lean) * 0.2;
    var l = Math.round(lean / 4) * 4;
    pet.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)"; // subpixel: no 1px stair-stepping when slowing down
    if (l !== lastLean) { arm.style.transform = "rotate(" + l + "deg)"; lastLean = l; }
    var f = x > innerWidth - 340; if (f !== flipped) { pet.classList.toggle("flip", f); flipped = f; rel = null; }
    if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5 && Math.abs(want - lean) < 2) { running = false; return; }
    requestAnimationFrame(tick);
  }
  function wake() { if (!running && !touch) { running = true; requestAnimationFrame(tick); } }
  wake();
  setTimeout(function () { if (!said.top) { said.top = 1; say(pick(lines.top)); } }, 1500);
})();
