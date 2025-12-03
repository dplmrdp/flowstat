const CACHE_NAME = 'flowstat-cache-v2';
const urlsToCache = [
  '/flowstat/',
  '/flowstat/index.html',
  '/flowstat/style.css',
  '/flowstat/app.js',
  '/flowstat/manifest.json'
];

// SERVICE WORKER - MODO DESARROLLO
// =================================
// Este SW NO utiliza caché.
// Siempre carga la última versión de la app desde el servidor.
// Ideal para desarrollo. NO apto para producción.

self.addEventListener('install', (event) => {
  // Activar automáticamente sin esperar
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tomar control inmediato sobre todas las pestañas
  event.waitUntil(clients.claim());
});

// Interceptar todas las peticiones y NO hacer caching.
// Siempre hace fetch directo.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
