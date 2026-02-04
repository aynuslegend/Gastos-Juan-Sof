const CACHE_NAME = 'gastos-v2';
const urlsToCache = [
  '/Gastos-Juan-Sof/',
  '/Gastos-Juan-Sof/index.html',
  '/Gastos-Juan-Sof/manifest.json',
  '/Gastos-Juan-Sof/icon-192.png',
  '/Gastos-Juan-Sof/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
