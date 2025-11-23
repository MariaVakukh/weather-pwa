// service-worker.js

// Назва кешу (міняємо версію при змінах, щоб оновити кеш)
const CACHE_NAME = "weather-pwa-v2";

// Статичні ресурси, які кешуються під час встановлення SW
const ASSETS = ["/", "/index.html", "/manifest.json", "/vite.svg"];

// Встановлення SW і кешування статичних ресурсів
self.addEventListener("install", (event) => {
  // Одразу активуємо нову версію SW, не чекаючи закриття вкладок зі старою
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Активація SW і видалення старих кешів
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );

  // Робимо цю версію SW активною для всіх клієнтів одразу
  self.clients.claim();
});

// Обробка HTTP(S) fetch-запитів
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // 1) Не чіпаємо WebSocket (важливо для Vite HMR)
  if (url.startsWith("ws://") || url.startsWith("wss://")) return;

  // 2) Не чіпаємо не-http/https запити (chrome-extension:, data:, file: і т.п.)
  if (!url.startsWith("http")) return;

  // Стратегія: спочатку дивимось у кеш, якщо немає — тягнемо з мережі
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          // Клонуємо відповідь і зберігаємо в кеш на майбутнє
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, cloned)
          );
          return response;
        })
        .catch(() =>
          // Якщо мережі немає та ресурсу в кеші нема —
          // віддаємо index.html (офлайн-фолбек для SPA)
          caches.match("/index.html")
        );
    })
  );
});
