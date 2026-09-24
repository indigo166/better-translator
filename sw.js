// Better Translator PWA service worker — network-first (always get the newest prototype), cache fallback (works offline).
var CACHE = 'bt-v32';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-maskable.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png']); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;   // API calls (Gemini/OpenAI/Anthropic) pass straight through
  // cache:'no-store' skips the browser's HTTP cache — GitHub Pages sends max-age=600, so a plain fetch could hand an
  // installed iPhone app a 10-minute-old copy. (Fetch by URL: a navigation Request can't be re-wrapped with options.)
  e.respondWith(
    fetch(u.href, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
      var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
