const APP_SHELL_CACHE = 'zo2y-app-shell-v33';
const PAGE_CACHE = 'zo2y-pages-v53';
const IMAGE_CACHE = 'zo2y-images-v18';
const API_CACHE = 'zo2y-api-v4';
const MAX_IMAGE_CACHE_ENTRIES = 220;
const MAX_API_CACHE_ENTRIES = 260;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/pages/index.css?v=20260307l',
  '/css/shared-header.css?v=20260307f',
  '/js/pages/index.js?v=20260307c',
  '/js/home-desktop-rebrand.js?v=20260301q',
  '/js/shared-header.js?v=20260307e',
  '/js/vercel-analytics.js?v=20260307a',
  '/js/list-utils.js?v=20260301e',
  '/js/universal-search.js?v=20260307b',
  '/js/auth-gate.js?v=20260307b',
  '/js/production-runtime.js?v=20260307a',
  '/js/igdb-client.js?v=20260228a',
  '/js/mobile-webapp.js',
  '/js/mobile-webapp.js?v=20260307c',
  '/js/mobile-app.css',
  '/js/mobile-app.css?v=20260301b',
  '/favicon.ico',
  '/favicon.ico?v=20260307a',
  '/newlogo.webp',
  '/images/apple-touch-icon-180.png'
];

const ACTIVE_CACHES = [APP_SHELL_CACHE, PAGE_CACHE, IMAGE_CACHE, API_CACHE];

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
    return;
  }
  if (cacheName === API_CACHE) {
    await trimCache(API_CACHE, MAX_API_CACHE_ENTRIES);
  }
}

function queueCachePut(cacheName, request, response) {
  const clonedResponse = cloneForCache(response);
  if (!clonedResponse) return;
  void putInCache(cacheName, request, clonedResponse).catch(() => {
    // Silent fail to avoid runtime noise from non-cloneable responses.
  });
}

function isMediaApiRequest(url) {
  if (!url || url.origin !== self.location.origin) return false;
  return /^\/api\/(tmdb|igdb|books|music|openlibrary)(\/|$)/i.test(url.pathname);
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

async function networkFirstWithTimeout(request, cacheName, fallbackPath = '', timeoutMs = 1400) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  let timer = null;
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('network_timeout')), timeoutMs);
      })
    ]);
    if (timer) clearTimeout(timer);
    queueCachePut(cacheName, request, networkResponse);
    return networkResponse;
  } catch (_error) {
    if (timer) clearTimeout(timer);
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
  if (url.origin === self.location.origin && url.pathname === '/sw.js') return;
  if (url.origin === self.location.origin && url.pathname.startsWith('/_vercel/insights/')) return;
  const isImageRequest = request.destination === 'image'
    || /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname);

  if (isImageRequest) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isMediaApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithTimeout(request, PAGE_CACHE, '/index.html'));
    return;
  }

  event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
});


