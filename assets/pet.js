// Bolt: a clingy little robot-arm pet. Follows the cursor, comments on what you are reading,
// naps when you stop, gets dizzy if you shake it. Scripted lines only: it never makes claims.
(function () {
  if (typeof document === "undefined") return;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  try { if (localStorage.getItem("pet") === "off") return; } catch (e) {}

  var pet = document.createElement("div");
  pet.className = "pet" + (touch ? " parked" : "");
  pet.setAttribute("aria-hidden", "true");
  pet.innerHTML =
    '<div class="pet-bubble"><span></span><button type="button" tabindex="-1" title="Send Bolt to bed">×</button></div>' +
    '<svg viewBox="0 0 64 64"><g class="pet-body">' +
    '<rect x="16" y="50" width="32" height="8" rx="3" class="pet-base"/>' +
    '<g class="pet-arm"><rect x="28" y="30" width="8" height="22" rx="4"/><circle cx="32" cy="30" r="5" class="pet-joint"/>' +
    '<g class="pet-head"><rect x="22" y="10" width="20" height="16" rx="6"/><circle cx="32" cy="18" r="3.6" class="pet-eye"/>' +
    '<path d="M42 16l7-4M42 20l7 4" class="pet-claw"/></g></g></g></svg>';
  document.body.appendChild(pet);
  var bubble = pet.querySelector(".pet-bubble span");

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
    contact: ["email him. I'll wait here. forever.", "the button is right there. I can see it from here."]
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
      if (Math.hypot(e.clientX - (x + 32), e.clientY - (y + 32)) < 44) { lastMove = Date.now(); return; }
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
    if (e.target.tagName === "BUTTON") {
      try { localStorage.setItem("pet", "off"); } catch (err) {}
      say("fine. goodnight.", 1200); setTimeout(function () { pet.remove(); }, 1200); return;
    }
    pet.classList.remove("spin"); void pet.offsetWidth; pet.classList.add("spin");
    say(pick(clickLines), 2200);
  });

  setInterval(function () {
    if (!asleep && Date.now() - lastMove > 9000 && !touch) { asleep = true; pet.classList.add("asleep"); say("zzz", 999999); }
  }, 1000);

  function tick() {
    if (!touch) {
      x += (tx - x) * (still ? 1 : 0.08); y += (ty - y) * (still ? 1 : 0.08);
      var lean = Math.max(-25, Math.min(25, (tx - x) * 0.4));
      pet.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      pet.style.setProperty("--lean", lean + "deg");
    }
    requestAnimationFrame(tick);
  }
  tick();
  setTimeout(function () { if (!said.top) { said.top = 1; say(pick(lines.top)); } }, 1500);
})();
