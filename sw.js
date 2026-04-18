const APP_SHELL_CACHE = 'zo2y-app-shell-v209';
const PAGE_CACHE = 'zo2y-pages-v175';
const IMAGE_CACHE = 'zo2y-images-v33';
const API_CACHE = 'zo2y-api-v13';
const MOVIES_PAGE_VERSION = '20260418a';
const MAX_IMAGE_CACHE_ENTRIES = 220;
const MAX_API_CACHE_ENTRIES = 260;
const AUTH_PAGE_PATHS = new Set(['/login.html', '/sign-up.html', '/update-password.html']);

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/credits.html',
  '/manifest.webmanifest',
  '/css/pages/index.css?v=20260329a',
  '/css/pages/index-landing.css?v=20260406a',
  '/css/shared-header.css?v=20260319b',
  '/css/global-lowercase.css?v=20260308a',
  '/js/pages/index.js?v=20260418a',
  '/js/pages/index-home-heavy-loaders.js?v=20260329a',
  '/js/home-desktop-rebrand.js?v=20260323c',
  '/js/referral-utils.js?v=20260319a',
  '/js/shared-header.js?v=20260415b',
  '/js/review-interactions.js?v=20260308a',
  '/js/list-utils.js?v=20260323a',
  '/js/index-list-menu-adapter.js?v=20260324a',
  '/js/universal-search.js?v=20260323a',
  '/js/auth-gate.js?v=20260418f',
  '/js/production-runtime.js?v=20260307a',
  '/js/igdb-client.js?v=20260311c',
  '/js/mobile-webapp.js',
  '/js/mobile-webapp.js?v=20260406a',
  '/js/mobile-app.css',
  '/js/mobile-app.css?v=20260329b',
  '/favicon.ico',
  '/favicon.ico?v=20260307a',
  '/newlogo.webp',
  '/logo-placeholder.svg',
  '/scared.webp',
  '/file-blank.svg',
  '/file.svg',
  '/sports.html',
  '/sports-mobile.html',
  '/css/pages/sports.css?v=20260418a',
  '/js/pages/sports.js?v=20260418a',
  '/fashion.html',
  '/food.html',
  '/cars.html',
  '/brand.html',
  '/css/pages/brands.css?v=20260322c',
  '/css/pages/brand.css?v=20260316b',
  '/js/pages/brands.js?v=20260322e',
  '/js/pages/brand.js?v=20260322a',
  '/team.html',
  '/css/pages/team.css?v=20260314a',
  '/js/pages/team.js?v=20260314d',
  '/images/patterns/open-book-01.svg',
  '/images/icons/star.svg',
  '/images/apple-touch-icon-180.png'
];

const ACTIVE_CACHES = [APP_SHELL_CACHE, PAGE_CACHE, IMAGE_CACHE, API_CACHE];

function offlineResponse() {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connection issue</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #08132b;
      --card: #122247;
      --border: rgba(255,255,255,0.08);
      --text: #f8fafc;
      --muted: #9fb0cf;
      --accent: #ffb020;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at top, rgba(255,176,32,0.12), transparent 32%),
        linear-gradient(180deg, #0b1734, var(--bg));
      color: var(--text);
      font: 500 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .offline-shell {
      width: min(100%, 460px);
      padding: 24px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: rgba(18, 34, 71, 0.94);
      box-shadow: 0 18px 44px rgba(1, 7, 18, 0.32);
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(28px, 5vw, 34px);
      line-height: 1.05;
    }
    p {
      margin: 0 0 18px;
      color: var(--muted);
    }
    .offline-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .offline-actions a,
    .offline-actions button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: #182a56;
      color: var(--text);
      text-decoration: none;
      font: inherit;
      cursor: pointer;
    }
    .offline-actions .primary {
      background: var(--accent);
      color: #08132b;
      border-color: transparent;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="offline-shell">
    <h1>Connection looks shaky.</h1>
    <p>Zo2y could not reach fresh data right now. Try again in a second, or open the home page if it is already cached on this device.</p>
    <div class="offline-actions">
      <button class="primary" type="button" onclick="location.reload()">Try again</button>
      <a href="/index.html">Open home</a>
    </div>
  </main>
</body>
</html>`, {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
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
  return /^\/api\/(tmdb|igdb|igdb-handler|books|music|openlibrary|sportsdb)(\/|$)/i.test(url.pathname);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    queueCachePut(cacheName, request, networkResponse);
    return networkResponse;
  } catch (_error) {
    return cached || offlineResponse();
  }
}

async function networkFirst(request, cacheName, fallbackPath = '') {
  try {
    const networkResponse = await fetch(request, { cache: 'no-store' });
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
    return offlineResponse();
  }
}

async function navigationNetworkOnly(request) {
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch (_error) {
    return offlineResponse();
  }
}

async function networkFirstWithTimeout(request, cacheName, fallbackPath = '', timeoutMs = 1400) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  let timer = null;
  try {
    const networkResponse = await Promise.race([
      fetch(request, { cache: 'no-store' }),
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
    return offlineResponse();
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
  return networkResponse || offlineResponse();
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
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => !ACTIVE_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      await caches.delete(PAGE_CACHE);
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isMoviesHtml = url.origin === self.location.origin && url.pathname === '/movies.html';
  const isMoviesMobileHtml = url.origin === self.location.origin && url.pathname === '/movies-mobile.html';
  if (request.mode === 'navigate' && (isMoviesHtml || isMoviesMobileHtml) && !url.searchParams.has('v')) {
    url.searchParams.set('v', MOVIES_PAGE_VERSION);
    event.respondWith(fetch(url.toString(), { cache: 'no-store' }));
    return;
  }
  const isLatestGamesPage =
    url.origin === self.location.origin &&
    (url.pathname === '/games.html' || url.pathname === '/games-mobile.html' || url.pathname === '/game.html');
  if (url.origin === self.location.origin && url.pathname === '/sw.js') return;
  // OAuth callbacks must always load the real callback page. A timeout fallback to `/index.html`
  // can silently break sign-in (it looks like "landing refreshed" with no error).
  if (
    request.mode === 'navigate' &&
    url.origin === self.location.origin &&
    (url.pathname === '/auth-callback.html' || url.searchParams.has('code') || url.searchParams.has('error') || url.searchParams.has('error_description'))
  ) {
    event.respondWith(fetch(request));
    return;
  }
  if (
    request.mode === 'navigate' &&
    url.origin === self.location.origin &&
    AUTH_PAGE_PATHS.has(url.pathname)
  ) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_error) {
        const cached = await caches.match(request, { ignoreSearch: true }) || await caches.match(url.pathname);
        return cached || Response.error();
      }
    })());
    return;
  }
  if (
    request.mode === 'navigate' &&
    url.origin === self.location.origin &&
    url.searchParams.has('auth_return')
  ) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_error) {
        const cached = await caches.match(request, { ignoreSearch: true })
          || await caches.match(url.pathname || '/')
          || await caches.match('/')
          || await caches.match('/index.html');
        return cached || offlineResponse();
      }
    })());
    return;
  }
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

  if (request.mode === 'navigate' && isLatestGamesPage) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    // Never serve cached HTML shells for app navigations. Fresh documents avoid stale auth/app-shell
    // combinations that can break session restore after login, reopen, or deploys.
    event.respondWith(navigationNetworkOnly(request));
    return;
  }

  event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
});






























