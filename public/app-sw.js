/* Loadit wallet service worker — app-shell cache for /app.
 * Shell routes: network-first with cache fallback (so an installed wallet
 * still opens offline and shows its address and last-known state).
 * Hashed build assets: cache-first (immutable).
 * API, Horizon and anchor calls: never cached.
 */
const VERSION = "loadit-app-v1";
const SHELL = ["/app", "/app/manifest.webmanifest", "/icon-512.png", "/apple-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Horizon, anchor, CDNs: straight through
  if (url.pathname.startsWith("/api/")) return; // never cache API responses

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }))
    );
    return;
  }

  if (req.mode === "navigate" && url.pathname.startsWith("/app")) {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("/app", copy)); return res; })
        .catch(() => caches.match("/app"))
    );
    return;
  }

  if (SHELL.includes(url.pathname)) {
    event.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req))
    );
  }
});
