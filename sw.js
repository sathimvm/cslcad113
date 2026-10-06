const CACHE_NAME = 'csl-cad-view-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/config.js',
  '/js/idb-storage.js',
  '/js/main.js',
  '/js/measure.js',
  '/js/orbit-controls.js',
  '/js/sectionManager.js',
  '/js/lib/cslcad.js',
  '/js/lib/dxf-parser.min.js',
  '/js/lib/occt-import-js.js',
  '/js/lib/rhino3dm.min.js',
  '/js/lib/rhino3dm.wasm',
  '/fonts/KaushanScript-Regular.ttf',
  '/fonts/MaterialIcons-Regular.ttf',
  '/fonts/Roboto-Bold.ttf',
  '/fonts/Roboto-Medium.ttf',
  '/fonts/Roboto-Regular.ttf',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Some assets failed to precache', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through non-GET or API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('/upload')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
