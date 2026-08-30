const CACHE = "today-i-die-v12";
const CORE = [
  "/",
  "/index.html",
  "/src/main.js",
  "/src/style.css",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/game/Today.swf",
  "/ruffle/ruffle.js",
  "/ruffle/core.ruffle.15317142e75ce021ac04.js",
  "/ruffle/core.ruffle.5e30dc5777a75720eae2.js",
  "/ruffle/6ce4f603a1fe7cc88438.wasm",
  "/ruffle/a71cef02d58dcec6f55f.wasm",
];

self.addEventListener("install", (event) => {
  const freshCoreRequests = CORE.map((url) => new Request(url, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(freshCoreRequests)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached || caches.match("/index.html"));

      return cached || network;
    }),
  );
});
