/* 放射線科 災害初動アクションカード ─ オフライン用 Service Worker */
const CACHE_NAME = "saigai-card-v1";

/* キャッシュ対象（このアプリの本体一式） */
const ASSETS = [
  "./",
  "./index.html"
];

/* インストール時：アプリ本体をキャッシュに保存 */
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

/* 有効化時：古いキャッシュを掃除 */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 取得時：まずキャッシュ→なければネット。ネット取得できたらキャッシュ更新 */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fromNet = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      // キャッシュがあれば即返し、裏でネット更新（オフラインでも確実に表示）
      return cached || fromNet;
    })
  );
});
