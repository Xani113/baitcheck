/**
 * BaitCheck Service Worker (sw.js)
 * Fully offline asset caching. Zero external network egress.
 */

const CACHE_NAME = 'baitcheck-v2.6.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './tests.html',
  './test-inputs.json',
  './js/app.js',
  './js/router.js',
  './js/pattern-matcher.js',
  './js/engine-message.js',
  './js/engine-link.js',
  './js/engine-email.js',
  './js/engine-number.js',
  './js/engine-qr.js',
  './js/engine-website.js',
  './data/rules.json',
  './data/known-scams.json',
  './data/brands.json',
  './data/tlds.json',
  './data/shorteners.json',
  './data/disposable-domains.json',
  './data/scams.json',
  './data/guides.json',
  './i18n/en.json',
  './i18n/hi.json',
  './i18n/as.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching BaitCheck offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
