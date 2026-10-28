// Bolt: a clingy little robot-arm pet. Follows the cursor, comments on what you are reading,
// naps when you stop, gets dizzy if you shake it. Scripted lines only: it never makes claims.
(function () {
  if (typeof document === "undefined") return;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  try { if (localStorage.getItem("pet") === "off") return; } catch (e) {}

  var pet = document.createElement("div");
  pet.className = "pet" + (touch ? " parked" : "");
  pet.innerHTML =
    '<div class="pet-bubble"><span></span><button type="button" tabindex="-1" title="Send Bolt to bed">×</button></div>' +
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
    ["current job swsam now production users", "now: Senior AI Engineer at SWSAM. the platform is in production, early release, about 300 users. he led 3 engineers."],
    ["transdata previous job before qwen fine tune fine-tuning qlora inference cost", "at Transdata he fine-tuned Qwen 7B with QLoRA (over 95% accuracy) and cut inference cost about 80% serving it in 4-bit on AWS GPUs."],
    ["quid sol first job chatbots healthcare fintech", "at Quid Sol (2022 to 2024) he built ML apps and chatbots, Rasa assistants, then ReAct agents by hand."],
    ["rag retrieval evaluation eval evals ragas faithfulness", "RAG: yes. he designed a Three-Hook evaluation model (every query, a sampled judge, a CI golden set). public repo: rag-quality-monitor, 165 tests."],
    ["approval gate human in the loop permissions safety guardrails write delete", "the approval gate: every write tool goes through one checkpoint. Autonomous, Suggest Only or Disabled per action. deletes are denied on purpose."],
    ["prompt injection security attack attacks red team", "a 114-attack prompt-injection suite closed 7 holes in his agent kit. that kit is built, not shipped yet. public version: agent-kit."],
    ["cost cheaper model switch planner sonnet 77", "the planner got about 77% cheaper after a model switch, with 24/24 benchmark and 20/20 end-to-end runs passing."],
    ["search grep vector database fast 16 seconds", "grep-first search: finding the right record went from 1 to 2 minutes to about 16 seconds. he wrote a post on it."],
    ["backend python fastapi postgres postgresql redis stack api apis build services", "backend: Python, FastAPI, PostgreSQL, Redis, Qdrant, pytest, GitHub Actions. strong backend side, not just prompts."],
    ["ai coding tools claude code codex cursor stack other stacks fast build", "he ships with Claude Code, Codex, OpenCode, a DeepSeek harness, T3 Code and local Ollama models. AI-accelerated on any stack."],
    ["open source github repos code tests", "10 public repos, 1,100+ passing tests. all clean-room versions of patterns from his work."],
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
    fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: q, facts: g.all.map(function (f) { return f[1]; }) }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { if (!done) { done = true; clearTimeout(t); answer.textContent = (d && d.answer) || local; } })
      .catch(function () { if (!done) { done = true; clearTimeout(t); answer.textContent = local; } });
  }
  chat.addEventListener("submit", function (e) { e.preventDefault(); var q = chat.q.value.trim(); if (q) ask(q); });
  function closeChat() { chatting = false; pet.classList.remove("chatting"); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && chatting) closeChat(); });
  document.addEventListener("click", function (e) { if (chatting && !pet.contains(e.target)) closeChat(); });

  var lines = {
    top: ["hi. I'm Bolt. I follow people.", "he made me. I'm the least tested thing here.", "scroll. go on. I'll come with you."],
    experience: ["5 years. I've been around for 5 minutes.", "SWSAM: 300 people use his stuff. none of them have met me."],
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

  var tx = innerWidth - 120, ty = innerHeight - 140, x = tx, y = ty, lastMove = Date.now(), speed = 0, said = {}, hideT, asleep = false;

  function say(t, ms) {
    bubble.textContent = t; pet.classList.add("talking");
    clearTimeout(hideT); hideT = setTimeout(function () { pet.classList.remove("talking"); }, ms || 3600);
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

  if (!touch) {
    addEventListener("mousemove", function (e) {
      // Clingy but catchable: once the cursor is on top of Bolt, it holds still so you can click it.
      if (chatting || Math.hypot(e.clientX - (x + 32), e.clientY - (y + 32)) < 44) { lastMove = Date.now(); return; }
      var dx = e.clientX + 28 - tx, dy = e.clientY + 22 - ty;
      speed = speed * 0.8 + Math.hypot(dx, dy) * 0.2;
      tx = e.clientX + 28; ty = e.clientY + 22; lastMove = Date.now();
      if (asleep) { asleep = false; pet.classList.remove("asleep"); say("!! I was not sleeping.", 2200); }
      if (speed > 120 && !pet.classList.contains("dizzy")) {
        pet.classList.add("dizzy"); say("whoa. slow down.", 2000);
        setTimeout(function () { pet.classList.remove("dizzy"); }, 1200);
      }
    });
    document.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a.btn, .readcode, .opts label");
      if (a && Math.random() < 0.35) say(pick(["ooh, that one.", "click it. what's the worst that happens.", "good choice. probably."]), 2200);
    });
  }

  pet.addEventListener("click", function (e) {
    if (e.target.closest(".pet-bubble button")) {
      try { localStorage.setItem("pet", "off"); } catch (err) {}
      say("fine. goodnight.", 1200); setTimeout(function () { pet.remove(); }, 1200); return;
    }
    if (chat.contains(e.target)) return;
    if (!chatting) { chatting = true; pet.classList.add("chatting"); pet.classList.remove("talking"); setTimeout(function () { chat.q.focus(); }, 50); }
    else closeChat();
  });
  pet.addEventListener("dblclick", function () { closeChat(); antic(); });
  function antic() { pet.classList.remove("spin"); void pet.offsetWidth; pet.classList.add("spin"); say(pick(clickLines), 2200); }

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
    if (!asleep && Date.now() - lastMove > 9000 && !touch) { asleep = true; pet.classList.add("asleep"); say("zzz", 999999); }
  }, 1000);

  // Animate only while Bolt is catching up; stop the loop once it has arrived.
  var arm = pet.querySelector(".pet-arm"), running = false, lastLean = 0, flipped = false;
  function tick() {
    x += (tx - x) * (still ? 1 : 0.08); y += (ty - y) * (still ? 1 : 0.08);
    var lean = Math.round(Math.max(-25, Math.min(25, (tx - x) * 0.4)));
    pet.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    if (lean !== lastLean) { arm.style.transform = "rotate(" + lean + "deg)"; lastLean = lean; }
    var f = x > innerWidth - 340; if (f !== flipped) { pet.classList.toggle("flip", f); flipped = f; }
    if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) { running = false; return; }
    requestAnimationFrame(tick);
  }
  function wake() { if (!running && !touch) { running = true; requestAnimationFrame(tick); } }
  addEventListener("mousemove", wake, { passive: true });
  wake();
  setTimeout(function () { if (!said.top) { said.top = 1; say(pick(lines.top)); } }, 1500);
})();
