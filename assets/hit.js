// Privacy-friendly page-view beacon. No cookies, no storage. Sends the page, referrer host, language and screen width to the worker.
(function () {
  var api = (document.querySelector('meta[name="bolt-api"]') || {}).content;
  if (!api || !navigator.sendBeacon) return;
  var host = ""; try { host = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  if (host === location.hostname) host = "";
  var t0 = Date.now(), sent = false;
  function send(extra) {
    var d = { path: location.pathname, ref: host, lang: navigator.language, w: screen.width };
    for (var k in extra) d[k] = extra[k];
    try { navigator.sendBeacon(api + "/hit", JSON.stringify(d)); } catch (e) {} // string body = text/plain, so no CORS preflight
  }
  send({});
  addEventListener("pagehide", function () { if (!sent) { sent = true; send({ dwell: Date.now() - t0 }); } });
})();
