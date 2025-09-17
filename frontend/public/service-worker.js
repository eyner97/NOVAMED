const CACHE_NAME = "novamed-cache-v1";
const API_URL = "/api/rutas"; // endpoint de tu backend
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/"; // patrón para tiles

// 🔵 AÑADIDO: otros endpoints que vas a usar y quieres cachear (SWR)
const API_URLS = [
  "/api/puestos-salud",
  "/api/departamentos",
  "/api/municipios",
  "/api/clinicas",
];

// Archivos estáticos (puedes agregar más si los necesitas)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon_clinic.png",
  "/icons/icon_centro_salud.png",
  "/icons/icon_hospital.png",
  "/icons/user-pin-white.png",
];

// Install → cachea estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate → limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Fetch → intercepta requests
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 1) Cache Stale-While-Revalidate para /api/rutas
  if (request.url.includes(API_URL)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 🔵 AÑADIDO: SWR también para los otros endpoints API
  if (API_URLS.some((u) => request.url.includes(u))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        return cachedResponse || networkFetch || new Response("[]", {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // 2) Cache First para tiles de OpenStreetMap
  if (request.url.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response("Mapa no disponible offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      })
    );
    return;
  }

  // 3) Otros recursos → Cache First con fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
