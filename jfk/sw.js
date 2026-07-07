const CACHE_VERSION = 'workflows-v1-2026-07-07';
const CACHE_NAME = `jfk-workflows-${CACHE_VERSION}`;
const BASE_URL = new URL('./', self.registration.scope);
const OFFLINE_FALLBACK = new URL('workflows.html', BASE_URL).toString();
const APP_SHELL = [
  OFFLINE_FALLBACK,
  new URL('styles.css', BASE_URL).toString(),
  new URL('feedback-submit.js', BASE_URL).toString(),
  new URL('manifest.webmanifest', BASE_URL).toString(),
  new URL('icon-192.png', BASE_URL).toString(),
  new URL('icon-512.png', BASE_URL).toString(),
  new URL('icon-maskable-512.png', BASE_URL).toString(),
  new URL('apple-touch-icon.png', BASE_URL).toString()
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_FALLBACK))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return networkResponse;
      });
    })
  );
});
