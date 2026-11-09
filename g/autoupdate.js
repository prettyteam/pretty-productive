/* Auto-update (Alexandra, Nov 9 2026: "make sure any changes automatically update whatever version is in Pretty Life").
   While a page is open (Pretty Life, Marketing Proofs, the team apps), this checks the site for a newer copy
   when the window comes back into view and every 3 minutes. When there is one, the page reloads itself at a fresh
   address (so a Home Screen or Chrome app can't show the old copy), keeping the link after #.
   It never reloads while someone is typing or has unsaved edits: it waits and tries again.
   Pages can add more files to watch with window.__ppWatch = ['data.json', ...] (relative to the page). */
(function () {
  if (window.__ppAuto) return; window.__ppAuto = 1;
  try { if (window.self !== window.top) return } catch (e) { return }
  var page = location.href.split('#')[0].split('?')[0];
  var mine = Date.parse(document.lastModified) || 0;
  var base = {};            // first Last-Modified seen for each extra file
  var busy = false;

  function lm(url) {
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'au=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { return r.ok ? (Date.parse(r.headers.get('last-modified') || '') || 0) : 0 })
      .catch(function () { return 0 });
  }
  function editing() {
    var a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return true;
    if (document.querySelector('[data-dirty]')) return true;
    if (window.__ppUnsaved && window.__ppUnsaved()) return true;
    var b = Array.prototype.slice.call(document.querySelectorAll('button'));
    for (var i = 0; i < b.length; i++) if (/^\s*Save changes\s*$/i.test(b[i].textContent) && !b[i].disabled && b[i].offsetParent) return true;
    return false;
  }
  function reload() {
    var u = new URL(page); u.searchParams.set('_r', Date.now().toString(36));
    location.replace(u.toString() + location.hash);
  }
  function check() {
    if (busy || document.hidden) return; busy = true;
    var watch = [page].concat((window.__ppWatch || []).map(function (w) { return new URL(w, page).toString() }));
    Promise.all(watch.map(lm)).then(function (t) {
      var newer = false;
      if (t[0] && mine && t[0] > mine + 1000) newer = true;
      for (var i = 1; i < watch.length; i++) {
        if (!t[i]) continue;
        if (base[watch[i]] == null) base[watch[i]] = t[i];
        else if (t[i] > base[watch[i]] + 1000) newer = true;
      }
      busy = false;
      if (!newer) return;
      if (editing()) { setTimeout(check, 30000); return }
      reload();
    });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check() });
  window.addEventListener('focus', check);
  setInterval(check, 3 * 60 * 1000);
  setTimeout(check, 1500);
})();
