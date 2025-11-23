// service-worker.js (GitHub Pages compatible)

const CACHE_NAME = "weather-pwa-v3";

// ВАЖЛИВО: назва репозиторію!
const BASE = "/weather-pwa/";

const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "vite.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((err) => {
        console.error("Cache addAll error:", err);
      })
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (url.startsWith("ws")) return;
  if (!url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
          return response;
        })
        .catch(() => caches.match(BASE + "index.html"));
    })
  );
});
