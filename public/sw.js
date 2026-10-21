/*
  Service worker: makes repeat visits open instantly, even on weak mobile data.
  - pages: network first (so a new deploy shows up straight away), the cached copy if offline or slow
  - /assets/* (file names change on every build): cache first, kept forever
  - images, fonts, the resume: show the cached copy, refresh it in the background
  - /api/* (live stats, chatbot) and form posts are never cached here
  Bump VERSION to throw every old cache away.
*/
const VERSION = "v1";
const PAGES = `pages-${VERSION}`, ASSETS = `assets-${VERSION}`, MEDIA = `media-${VERSION}`;
const SLOW_MS = 3500; // on a slow connection, fall back to the cached page after this long

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const trim = async (name, max) => {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k);
};

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  const net = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  const cached = await cache.match(req, { ignoreSearch: true });
  if (!cached) return net;
  const slow = new Promise((r) => setTimeout(() => r(cached), SLOW_MS));
  return Promise.race([net.catch(() => cached), slow]);
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) (await caches.open(ASSETS)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(MEDIA);
  const cached = await cache.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(req, res.clone()).then(() => trim(MEDIA, 120));
      return res;
    })
    .catch(() => cached);
  return cached || net;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;

  if (req.mode === "navigate") return e.respondWith(networkFirst(req));
  if (url.pathname.startsWith("/assets/")) return e.respondWith(cacheFirst(req));
  if (fonts || /\.(webp|jpe?g|png|svg|ico|pdf|woff2?)$/i.test(url.pathname)) return e.respondWith(staleWhileRevalidate(req));
});
