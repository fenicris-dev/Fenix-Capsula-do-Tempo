const CACHE_NAME = "capsula-do-tempo-v2";
const ASSETS = [
  "./capsula-do-tempo.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para o "shell" do app (html/manifest/ícones), passando direto para a rede
// (sem cache) para chamadas do Firebase/Firestore, que já cuidam da própria persistência offline.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  const isFirebase = url.includes("googleapis.com") || url.includes("firebaseio.com") || url.includes("gstatic.com");
  if (isFirebase) return; // deixa o SDK do Firebase lidar com isso

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200 && event.request.method === "GET") {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
