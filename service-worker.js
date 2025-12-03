const CACHE_NAME = 'flowstat-cache-v2';
const urlsToCache = [
  '/flowstat/',
  '/flowstat/index.html',
  '/flowstat/style.css',
  '/flowstat/app.js',
  '/flowstat/manifest.json'
];

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
