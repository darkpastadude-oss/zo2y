const APP_SHELL_CACHE = 'zo2y-app-shell-v5';
const PAGE_CACHE = 'zo2y-pages-v5';
const IMAGE_CACHE = 'zo2y-images-v2';
const MAX_IMAGE_CACHE_ENTRIES = 220;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/js/mobile-webapp.js',
  '/js/mobile-webapp.js?v=20260225c',
  '/js/mobile-app.css',
  '/js/mobile-app.css?v=20260225b',
  '/favicon.ico',
  '/images/logo.png'
];

const ACTIVE_CACHES = [APP_SHELL_CACHE, PAGE_CACHE, IMAGE_CACHE];

function isCacheableResponse(response) {
  return !!response && (response.ok || response.type === 'opaque');
}

function cloneForCache(response) {
  if (!response) return null;
  if (response.bodyUsed) return null;
  try {
    return response.clone();
  } catch (_error) {
    return null;
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((request) => cache.delete(request)));
}

async function putInCache(cacheName, request, response) {
  if (!isCacheableResponse(response)) return;
  if (!response || response.bodyUsed) return;
  const cache = await caches.open(cacheName);
  try {
    await cache.put(request, response);
  } catch (_error) {
    return;
  }
  if (cacheName === IMAGE_CACHE) {
    await trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_ENTRIES);
  }
}

function queueCachePut(cacheName, request, response) {
  const clonedResponse = cloneForCache(response);
  if (!clonedResponse) return;
  void putInCache(cacheName, request, clonedResponse).catch(() => {
    // Silent fail to avoid runtime noise from non-cloneable responses.
  });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const networkResponse = await fetch(request);
  queueCachePut(cacheName, request, networkResponse);
  return networkResponse;
}

async function networkFirst(request, cacheName, fallbackPath = '') {
  try {
    const networkResponse = await fetch(request);
    queueCachePut(cacheName, request, networkResponse);
    return networkResponse;
  } catch (_error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await caches.match(fallbackPath);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      queueCachePut(cacheName, request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || Response.error();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ACTIVE_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isImageRequest = request.destination === 'image'
    || /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname);

  if (isImageRequest) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, '/index.html'));
    return;
  }

  event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
});
