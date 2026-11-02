// Theme toggle for pages that don't load main.js (blog, work). Same behaviour as main.js.
(function () {
  var root = document.documentElement, btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function current() { return root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); }
  function label() { btn.textContent = current() === "light" ? "Dark mode" : "Light mode"; }
  btn.addEventListener("click", function () {
    root.dataset.theme = current() === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    label();
  });
  label();
})();
