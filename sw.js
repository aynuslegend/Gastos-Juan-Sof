const CACHE_NAME = 'gastos-v18'; // Incrementar versión para forzar actualización
const urlsToCache = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación: cachear archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activar inmediatamente el nuevo SW
  );
});

// Activación: limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control inmediatamente
  );
});

// Estrategia de fetch híbrida
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // NO interceptar peticiones a Google Apps Script - dejar que el navegador las maneje
  if (url.hostname.includes('script.google.com')) {
    return; // No interceptar, dejar que pase directamente
  }

  // NO interceptar peticiones a APIs externas
  if (url.hostname.includes('dolarapi.com')) {
    return; // No interceptar, dejar que pase directamente
  }

  // Para index.html: Network First (siempre intentar traer lo nuevo)
  if (event.request.url.includes('index.html') || event.request.url === self.registration.scope) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardar en caché la nueva versión
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, usar caché como fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para assets estáticos (iconos, manifest): Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Cachear assets nuevos
          if (event.request.url.includes('.png') || event.request.url.includes('manifest.json')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
  );
});
