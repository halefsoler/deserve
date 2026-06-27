/* Deserve — Service Worker (app shell, offline-first) */
const CACHE = 'deserve-v52';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=52',
  './js/db.js?v=52',
  './js/orb.js?v=52',
  './js/store.js?v=52',
  './js/app.js?v=52',
  './manifest.webmanifest',
  './icons/icon-192.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// network-first: sempre entrega a versão mais nova quando há rede;
// cai para o cache (e funciona offline) quando não há.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});
