// ASAM Dashboard Service Worker
// CACHE_VERSION must be bumped on every deploy to bust stale caches
const CACHE_VERSION = "asam-v__BUILD_TIME__";
const CACHE = `asam-${CACHE_VERSION}`;

self.addEventListener("install", (e) => {
  // Skip waiting immediately — don't hold onto old cache
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Delete ALL old caches on activate
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache API calls
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } })
      )
    );
    return;
  }

  // HTML navigation requests: NETWORK FIRST — never serve stale shell
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // JS/CSS assets (hashed filenames): cache-first — safe because filenames change on rebuild
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
