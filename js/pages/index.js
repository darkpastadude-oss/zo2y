    const ENABLE_GAMES = false;
    const ENABLE_RESTAURANTS = false;
    const HOME_BASE_MEDIA_TYPES = ENABLE_GAMES
      ? ['movie', 'tv', 'anime', 'game', 'book', 'music', 'travel']
      : ['movie', 'tv', 'anime', 'book', 'music', 'travel'];
    const HOME_ACTIVE_MEDIA_TYPES = ENABLE_RESTAURANTS
      ? ['restaurant', ...HOME_BASE_MEDIA_TYPES]
      : HOME_BASE_MEDIA_TYPES;
    const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
    const IGDB_PROXY_BASE = '/api/igdb';
    const TMDB_PROXY_BASE = '/api/tmdb';
    const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
    const TMDB_SPOT_POSTER = 'https://image.tmdb.org/t/p/w780';
    const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
    const REST_COUNTRIES_ALL_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,flags';
    const FALLBACK_RESTAURANTS = [
      { id: 'fallback-r1', name: 'Top Rated Picks', category: 'Community', rating: '4.8' },
      { id: 'fallback-r2', name: 'Most Saved', category: 'Trending', rating: '4.7' },
      { id: 'fallback-r3', name: 'Local Favorites', category: 'Local', rating: '4.9' },
      { id: 'fallback-r4', name: 'Date Night', category: 'Curated', rating: '4.7' },
      { id: 'fallback-r5', name: 'Quick Bites', category: 'Casual', rating: '4.6' }
    ];
    const POPULAR_MUSIC_QUERIES = [
      'top 50 usa',
      'top 50 global',
      "today's top hits",
      'viral hits',
      'genre:pop',
      'genre:hip-hop',
      'taylor swift',
      'drake',
      'the weeknd',
      'sabrina carpenter'
    ];
    const FALLBACK_TRAVEL_COUNTRIES = [
      { code: 'US', name: 'United States', region: 'Americas', capital: 'Washington, D.C.' },
      { code: 'JP', name: 'Japan', region: 'Asia', capital: 'Tokyo' },
      { code: 'FR', name: 'France', region: 'Europe', capital: 'Paris' },
      { code: 'IT', name: 'Italy', region: 'Europe', capital: 'Rome' },
      { code: 'EG', name: 'Egypt', region: 'Africa', capital: 'Cairo' },
      { code: 'BR', name: 'Brazil', region: 'Americas', capital: 'Brasilia' },
      { code: 'AU', name: 'Australia', region: 'Oceania', capital: 'Canberra' },
      { code: 'ES', name: 'Spain', region: 'Europe', capital: 'Madrid' }
    ];
    const HOME_MEDIA_META = {
      restaurant: { label: 'Restaurant', icon: 'fa-clapperboard', accent: '#f59e0b' },
      movie: { label: 'Movie', icon: 'fa-film', accent: '#ef4444' },
      tv: { label: 'TV', icon: 'fa-tv', accent: '#22c55e' },
      anime: { label: 'Anime', icon: 'fa-dragon', accent: '#f97316' },
      ...(ENABLE_GAMES ? { game: { label: 'Game', icon: 'fa-gamepad', accent: '#38bdf8' } } : {}),
      book: { label: 'Book', icon: 'fa-book', accent: '#f97316' },
      music: { label: 'Music', icon: 'fa-music', accent: '#f59e0b' },
      travel: { label: 'Travel', icon: 'fa-earth-americas', accent: '#22d3ee' }
    };
    const HOME_RESTAURANT_LIST_META = {
      favorites: { title: 'Favorites', description: 'My favorite restaurants', icon: 'heart' },
      visited: { title: 'Visited', description: 'Places I have been to', icon: 'check' },
      wantToGo: { title: 'Want to Go', description: 'Places I want to try', icon: 'bookmark' }
    };
    const HOME_DEFAULT_LIST_TABLES = {
      movie: { table: 'movie_list_items', itemField: 'movie_id' },
      tv: { table: 'tv_list_items', itemField: 'tv_id' },
      anime: { table: 'anime_list_items', itemField: 'anime_id' },
      ...(ENABLE_GAMES ? { game: { table: 'game_list_items', itemField: 'game_id' } } : {}),
      book: { table: 'book_list_items', itemField: 'book_id' },
      music: { table: 'music_list_items', itemField: 'track_id' },
      travel: { table: 'travel_list_items', itemField: 'country_code' }
    };
    const HOME_FEED_CACHE_KEY = 'zo2y_home_feed_cache_v9';
    const HOME_FEED_CACHE_MAX_AGE_MS = 1000 * 60 * 30;
    const HOME_PRECOMPUTED_FEED_CACHE_KEY = 'zo2y_home_precomputed_feed_v8';
    const HOME_PRECOMPUTED_FEED_MAX_AGE_MS = 1000 * 60 * 20;
    const HOME_PRECOMPUTED_FETCH_TIMEOUT_MS = 900;
    const HOME_HTTP_CACHE_TTL_MS = 1000 * 60 * 5;
    const HOME_PRECOMPUTE_TABLE = 'home_spotlight_cache';
    const HOME_CHANNEL_TIMEOUT_MS = 1600;
    const HOME_BOOKS_FETCH_TIMEOUT_MS = 1200;
    const HOME_LOCAL_FALLBACK_IMAGE = 'images/logo.png';
    const SPOTLIGHT_ROTATE_MS = 5000;
    const HOME_CHANNEL_TARGET_ITEMS = 16;
    const HOME_SPOTLIGHT_POOL_SIZE = 16;
    const HOME_NEW_RELEASES_TARGET_ITEMS = 16;
    const HOME_NEW_RELEASES_TIMEOUT_MS = 5600;
    const HOME_NEW_RELEASES_REFRESH_MS = 1000 * 60 * 12;
    const HOME_EAGER_IMAGE_COUNT = 8;
    const HOME_HIGH_PRIORITY_IMAGE_COUNT = 4;
    const HOME_PRELOAD_PER_CHANNEL = 2;
    const HOME_PRELOAD_SPOTLIGHT_COUNT = 3;
    const HOME_UNIFIED_TARGET_ITEMS = 24;
    const HOME_BECAUSE_SIGNAL_CACHE_MS = 1000 * 60 * 3;
    const HOME_BECAUSE_MAX_FOLLOWED_USERS = 24;
    const HOME_BECAUSE_SIGNAL_RECENCY_HOURS = 24 * 21;
    const HOME_MENU_PRIME_IDLE_DELAY_MS = 2500;
    const HOME_ONBOARDING_VERSION = 'v1';
    const HOME_BOOK_SPOTLIGHT_BG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>
        <defs>
          <linearGradient id='bookGrad' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#0f172a' />
            <stop offset='55%' stop-color='#312e81' />
            <stop offset='100%' stop-color='#7c3aed' />
          </linearGradient>
        </defs>
        <rect width='1600' height='900' fill='url(#bookGrad)' />
        <circle cx='1330' cy='170' r='220' fill='rgba(245,158,11,0.28)' />
        <circle cx='220' cy='760' r='260' fill='rgba(56,189,248,0.18)' />
        <g fill='rgba(255,255,255,0.13)'>
          <rect x='520' y='220' width='56' height='460' rx='12' />
          <rect x='590' y='250' width='68' height='430' rx='12' />
          <rect x='672' y='200' width='64' height='480' rx='12' />
          <rect x='752' y='240' width='60' height='440' rx='12' />
          <rect x='826' y='208' width='72' height='472' rx='12' />
        </g>
      </svg>
    `)}`;
    const HOME_MUSIC_SPOTLIGHT_BG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>
        <defs>
          <linearGradient id='musicGrad' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#042f2e' />
            <stop offset='52%' stop-color='#0f766e' />
            <stop offset='100%' stop-color='#115e59' />
          </linearGradient>
        </defs>
        <rect width='1600' height='900' fill='url(#musicGrad)' />
        <circle cx='1250' cy='170' r='230' fill='rgba(16,185,129,0.28)' />
        <circle cx='260' cy='770' r='250' fill='rgba(59,130,246,0.16)' />
        <g fill='rgba(255,255,255,0.16)'>
          <rect x='400' y='450' width='56' height='170' rx='28' />
          <rect x='490' y='380' width='56' height='240' rx='28' />
          <rect x='580' y='330' width='56' height='290' rx='28' />
          <rect x='670' y='280' width='56' height='340' rx='28' />
          <rect x='760' y='320' width='56' height='300' rx='28' />
          <rect x='850' y='360' width='56' height='260' rx='28' />
        </g>
      </svg>
    `)}`;
    const HOME_SUGGESTIVE_TEXT_PATTERNS = [
      /\bhentai\b/i,
      /\becchi\b/i,
      /\bnsfw\b/i,
      /\b18\+\b/i,
      /\berotic(?:a|ism)?\b/i,
      /\bsex(?:ual|y)?\b/i,
      /\bnud(?:e|ity)\b/i,
      /\buncensored\b/i,
      /\bfetish\b/i,
      /\bharem\b/i,
      /\bmature audiences?\b/i,
      /\badult[-\s]?(only|content|themes?|audiences?)\b/i,
      /\bxxx\b/i
    ];
    const HOME_SUGGESTIVE_TITLE_PATTERNS = [
      /high school dxd/i,
      /interspecies reviewers/i,
      /redo of healer/i,
      /monster musume/i,
      /to love-?ru/i,
      /yosuga no sora/i,
      /prison school/i,
      /kiss x sis/i,
      /shinmai maou/i
    ];

    async function homeIgdbFetch(path, params = {}, signal) {
      if (window.ZO2Y_IGDB && typeof window.ZO2Y_IGDB.request === 'function') {
        return window.ZO2Y_IGDB.request(path, params, signal ? { signal } : undefined);
      }
      const url = new URL(`${IGDB_PROXY_BASE}${path}`, window.location.origin);
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(key, String(value));
      });
      if (!url.searchParams.has('rev')) url.searchParams.set('rev', 'wiki20260228c');
      const cacheKey = `igdb:${url.toString()}`;
      const json = await fetchJsonWithPerfCache(url.toString(), { signal, cacheKey });
      if (!json) throw new Error('IGDB error');
      return json;
    }

    const statusEl = document.getElementById('loadStatus');
    let homeSupabaseClient = null;
    let homeCurrentUser = null;
    let homeAuthListenerReady = false;
    let homeSpotlightTimer = null;
    let homeSpotlightItems = [];
    let homeSpotlightIndex = 0;
    let homeSpotlightImageToken = 0;
    let homeOnboardingIndex = 0;
    let homeOnboardingUserId = null;
    let homeTasteWeights = Object.fromEntries(HOME_ACTIVE_MEDIA_TYPES.map((type) => [type, 1]));
    const homeFeedState = Object.fromEntries(HOME_ACTIVE_MEDIA_TYPES.map((type) => [type, []]));
    const homeHttpCache = new Map();
    const homeCustomListState = {
      mediaType: null,
      itemId: null,
      title: '',
      subtitle: '',
      image: '',
      customLists: [],
      selectedIcon: 'fas fa-list',
      selectedLists: new Set()
    };
    const homePreloadedImageSet = new Set();
    let homeEagerImageBudgetUsed = 0;
    let homeHighPriorityImageBudgetUsed = 0;
    let homeNewReleasesState = [];
    let homeNewReleasesLastFetchAt = 0;
    let homeNewReleasesRequestSeq = 0;
    let homeNewReleasesInFlight = null;
    let homeMenuPrimeScheduled = false;
    let homeBecauseRefreshSeq = 0;
    let homeBecauseSignalCache = {
      userId: '',
      savedAt: 0,
      payload: null
    };
    const homeMusicPreviewState = {
      audio: null,
      btn: null
    };

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function toHttpsUrl(value) {
      return String(value || '').replace(/^http:\/\//i, 'https://');
    }

    function withTimeout(promise, timeoutMs, fallbackValue = null) {
      let timer = null;
      return Promise.race([
        Promise.resolve(promise).finally(() => {
          if (timer) clearTimeout(timer);
        }),
        new Promise((resolve) => {
          timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
        })
      ]);
    }

    function cloneJson(value, fallback = null) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (_err) {
        return fallback;
      }
    }

    async function fetchJsonWithPerfCache(url, options = {}) {
      const key = String(options.cacheKey || url || '').trim();
      const ttlMs = Number(options.ttlMs || HOME_HTTP_CACHE_TTL_MS);
      const now = Date.now();
      if (!key) return null;

      const existing = homeHttpCache.get(key);
      if (existing?.data && now < Number(existing.expiresAt || 0)) {
        return cloneJson(existing.data, null);
      }
      if (existing?.promise) {
        const shared = await existing.promise;
        return cloneJson(shared, null);
      }

      if (options.signal?.aborted) return null;

      const requestUrl = String(url || '').trim();
      const maxAttempts = Math.max(1, Number(options.retries || 2));

      const requestPromise = (async () => {
        let lastError = null;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (options.signal?.aborted) return null;
          const controller = new AbortController();
          const timeoutMs = Number(options.timeoutMs || (9000 + attempt * 750));
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const res = await fetch(requestUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) return await res.json();
            const retryable = res.status === 429 || res.status >= 500;
            if (!retryable) return null;
            lastError = new Error(`http_${res.status}`);
          } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
          }
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
          }
        }
        if (lastError && options.throwOnError) throw lastError;
        return null;
      })().finally(() => {
        const current = homeHttpCache.get(key);
        if (current?.promise) {
          delete current.promise;
          homeHttpCache.set(key, current);
        }
      });

      homeHttpCache.set(key, {
        promise: requestPromise,
        expiresAt: now + ttlMs
      });

      const data = await requestPromise;
      if (data && typeof data === 'object') {
        homeHttpCache.set(key, {
          data: cloneJson(data, null),
          expiresAt: Date.now() + ttlMs
        });
      } else {
        homeHttpCache.delete(key);
      }
      return cloneJson(data, null);
    }

    function resolveRestaurantImage(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return toHttpsUrl(raw);
      const normalized = raw.replace(/^\/+/, '');
      if (/^images\//i.test(normalized)) return toHttpsUrl(normalized);
      return toHttpsUrl(`images/${normalized}`);
    }

    function showHomeToast(message, isError = false) {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.top = '16px';
      toast.style.right = '16px';
      toast.style.zIndex = '99999';
      toast.style.background = isError ? '#dc2626' : '#10b981';
      toast.style.color = '#fff';
      toast.style.padding = '10px 14px';
      toast.style.borderRadius = '10px';
      toast.style.fontSize = '13px';
      toast.style.boxShadow = '0 10px 24px rgba(0,0,0,0.35)';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2200);
    }

    function getHomeMediaMeta(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      return HOME_MEDIA_META[type] || { label: 'Item', icon: 'fa-star', accent: '#f59e0b' };
    }

    function getHomeSpotlightBackgroundByType(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      if (type === 'book') return HOME_BOOK_SPOTLIGHT_BG;
      if (type === 'music') return HOME_MUSIC_SPOTLIGHT_BG;
      return '';
    }

    function isHomeSuggestiveText(text) {
      const value = String(text || '').trim();
      if (!value) return false;
      return HOME_SUGGESTIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value));
    }

    function isHomeSafeContentItem(item) {
      if (!item || typeof item !== 'object') return false;
      if (item.isPlaceholder) return true;
      const isAdult = item.isAdult === true || String(item.isAdult || '').trim().toLowerCase() === 'true';
      const isExplicit = item.explicit === true || String(item.explicit || '').trim().toLowerCase() === 'true';
      if (isAdult || isExplicit) return false;

      const maturityRating = String(item?.maturityRating || '').trim().toLowerCase();
      if (maturityRating.includes('mature') && !maturityRating.includes('not_mature')) {
        return false;
      }

      const title = String(item?.title || '');
      if (HOME_SUGGESTIVE_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
        return false;
      }

      const textFields = [
        item?.title,
        item?.subtitle,
        item?.extra,
        item?.overview,
        item?.description,
        item?.genreText,
        item?.tags,
        item?.maturityRating
      ];
      if (Array.isArray(item?.genres)) textFields.push(item.genres.join(' '));

      return !textFields.some((value) => isHomeSuggestiveText(value));
    }

    function filterHomeSafeItems(items = []) {
      return (Array.isArray(items) ? items : []).filter((item) => isHomeSafeContentItem(item));
    }

    function getSpotlightSectionLabel(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      if (type === 'movie') return 'Movies';
      if (type === 'tv') return 'TV Shows';
      if (type === 'anime') return 'Anime';
      if (type === 'game') return 'Games';
      if (type === 'book') return 'Books';
      if (type === 'music') return 'Music';
      if (type === 'travel') return 'Travel';
      if (type === 'restaurant') return 'Restaurants';
      return 'Discover';
    }

    function supportsHomeLists(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      return HOME_ACTIVE_MEDIA_TYPES.includes(type);
    }

    function getMediaListConfig(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      if (type === 'movie') {
        return {
          customHref: 'movies.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
            { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'tv') {
        return {
          customHref: 'tvshows.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
            { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'anime') {
        return {
          customHref: 'animes.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
            { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'game') {
        return {
          customHref: 'games.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'watched', label: 'Played', icon: 'fas fa-eye' },
            { key: 'watchlist', label: 'Backlog', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'book') {
        return {
          customHref: 'books.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'read', label: 'Read', icon: 'fas fa-eye' },
            { key: 'readlist', label: 'Readlist', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'music') {
        return {
          customHref: 'music.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'listened', label: 'Listened', icon: 'fas fa-eye' },
            { key: 'listenlist', label: 'Listenlist', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (type === 'travel') {
        return {
          customHref: 'travel.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'visited', label: 'Visited', icon: 'fas fa-check' },
            { key: 'bucketlist', label: 'Bucket List', icon: 'fas fa-bookmark' }
          ]
        };
      }
      if (ENABLE_RESTAURANTS && type === 'restaurant') {
        return {
          customHref: 'restraunts.html',
          rows: [
            { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
            { key: 'visited', label: 'Visited', icon: 'fas fa-eye' },
            { key: 'wantToGo', label: 'Want to Go', icon: 'fas fa-bookmark' }
          ]
        };
      }
      return null;
    }

    function buildRailListMenuHtml(item) {
      const cfg = getMediaListConfig(item.mediaType);
      if (!cfg) return '';
      const buttons = cfg.rows.map(row => `
        <button class="rail-menu-item" data-action="save" data-list="${row.key}">
          <span class="rail-menu-item-main"><i class="${row.icon}"></i> ${row.label}</span>
          <span class="rail-menu-state">Add</span>
        </button>
      `).join('');
      return `
        <div class="rail-menu-title">Add to list</div>
        ${buttons}
        <button class="rail-menu-item" data-action="custom" data-href="${cfg.customHref}">
          <span class="rail-menu-item-main"><i class="fas fa-list"></i> Custom Lists</span>
          <span class="rail-menu-state">Open</span>
        </button>
      `;
    }

    function getSpotlightSeedOffset() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const weekOfYear = Math.ceil(dayOfYear / 7);
      const userSeed = homeCurrentUser?.id ? homeCurrentUser.id.slice(-4).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) : 0;
      return dayOfYear + weekOfYear + userSeed;
    }

    function hashString(value) {
      const text = String(value || '');
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
      }
      return Math.abs(hash);
    }

    function getDailySignal(value) {
      const dateKey = new Date().toISOString().slice(0, 10);
      return (hashString(`${value}|${dateKey}`) % 100) / 100;
    }

    function getTrendLabel(item) {
      const buzz = Math.max(52, Math.min(99, Math.round((Number(item.discoveryScore) || 0.62) * 100)));
      return `<i class="fa-solid fa-fire"></i> Global buzz ${buzz}%`;
    }

    function getPersonalReason(item) {
      const type = String(item.mediaType || '').toLowerCase();
      const meta = getHomeMediaMeta(type);
      const weight = Number(homeTasteWeights[type] || 1);
      if (weight >= 1.45) {
        return `<i class="fa-solid fa-sparkles"></i> Tuned to your ${meta.label.toLowerCase()} taste`;
      }
      return `<i class="fa-solid fa-compass"></i> Cross-media discovery pick`;
    }

    function getSpotlightSummary(item) {
      const details = [item.subtitle, item.extra].map(v => String(v || '').trim()).filter(Boolean);
      if (!details.length) return 'Fresh signal from the live discovery engine.';
      return details.join(' | ');
    }

    function renderSpotlightDots() {
      const dotsEl = document.getElementById('spotlightDots');
      if (!dotsEl) return;
      dotsEl.innerHTML = homeSpotlightItems.map((item, index) => {
        const active = index === homeSpotlightIndex ? ' active' : '';
        const title = escapeHtml(item.title || '');
        return `<button class="spotlight-dot${active}" type="button" data-spotlight-index="${index}" aria-label="Spotlight ${index + 1}: ${title}"></button>`;
      }).join('');
      dotsEl.querySelectorAll('[data-spotlight-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-spotlight-index'));
          showSpotlightByIndex(idx, true);
          resetSpotlightTimer();
        });
      });
    }

    function renderSpotlightItem(item, shouldAnimate = false) {
      const bg = document.getElementById('spotlightBackground');
      const spotlightSection = document.getElementById('spotlightSection');
      const mediaWrap = document.getElementById('spotlightMedia');
      const mediaImage = document.getElementById('spotlightImage');
      const title = document.getElementById('spotlightTitle');
      const kicker = document.getElementById('spotlightKicker');
      const summary = document.getElementById('spotlightSummary');
      const reason = document.getElementById('spotlightReason');
      const trend = document.getElementById('spotlightTrend');
      const openBtn = document.getElementById('spotlightOpenBtn');
      const spotlightInner = document.getElementById('spotlightInner');
      if (!bg || !spotlightSection || !mediaWrap || !mediaImage || !title || !kicker || !summary || !reason || !trend || !openBtn) return;

      const meta = getHomeMediaMeta(item.mediaType);
      const fallbackSpotlightBackground = String(item.spotlightImage || item.backgroundImage || item.image || '').trim();
      const spotlightBackground = getHomeSpotlightBackgroundByType(item.mediaType) || fallbackSpotlightBackground;
      const spotlightMediaImage = String(item.spotlightMediaImage || item.image || item.spotlightImage || item.backgroundImage || '').trim();
      const spotlightBackgroundPosition = String(item.spotlightBackgroundPosition || item.backgroundPosition || '').trim() || 'center 28%';
      const spotlightMediaPosition = String(item.spotlightMediaPosition || item.imagePosition || '').trim();
      let spotlightMediaFit = String(item.spotlightMediaFit || '').trim() || 'contain';
      let spotlightMediaShape = String(item.spotlightMediaShape || '').trim() || 'poster';
      if (String(item.mediaType || '').toLowerCase() === 'music') {
        spotlightMediaFit = 'contain';
        spotlightMediaShape = 'poster';
      }
      const usesSquareMedia = spotlightMediaShape === 'square';
      const usesLandscapeMedia = spotlightMediaShape === 'landscape';
      const mediaToken = ++homeSpotlightImageToken;

      spotlightSection.classList.remove('has-square-media', 'has-landscape-media');
      mediaWrap.classList.remove('square', 'landscape');
      if (usesLandscapeMedia) {
        spotlightSection.classList.add('has-landscape-media');
        mediaWrap.classList.add('landscape');
      } else if (usesSquareMedia) {
        spotlightSection.classList.add('has-square-media');
        mediaWrap.classList.add('square');
      }

      if (spotlightBackground) {
        bg.style.backgroundImage = `linear-gradient(120deg, rgba(8, 14, 31, 0.7), rgba(10, 19, 39, 0.42)), url("${spotlightBackground}")`;
      } else {
        bg.style.backgroundImage = 'linear-gradient(120deg, #12203e 0%, #1b2f61 48%, #243b77 100%)';
      }
      bg.style.backgroundPosition = spotlightBackgroundPosition;

      if (spotlightMediaImage) {
        mediaImage.loading = 'eager';
        mediaImage.fetchPriority = 'high';
        mediaImage.style.width = '';
        mediaImage.style.height = '';
        mediaImage.style.padding = '';
        mediaImage.style.borderRadius = '';
        mediaImage.style.background = '';
        mediaImage.style.objectFit = spotlightMediaFit;
        mediaImage.style.objectPosition = spotlightMediaPosition || (usesLandscapeMedia ? 'center center' : 'center 24%');
        mediaImage.style.display = 'block';
        mediaWrap.style.display = 'block';
        spotlightSection.classList.remove('no-media');
        const fallbackCandidates = [
          spotlightMediaImage,
          item.fallbackImage,
          item.image,
          item.spotlightImage,
          item.backgroundImage
        ];
        if (String(item.mediaType || '').toLowerCase() === 'book') {
          fallbackCandidates.push(getBookCoverFallback(item));
        }
        setSpotlightImageWithFallback(mediaImage, fallbackCandidates, mediaToken);
      } else {
        if (mediaImage.__homeSpotlightOnLoad) {
          mediaImage.removeEventListener('load', mediaImage.__homeSpotlightOnLoad);
          mediaImage.__homeSpotlightOnLoad = null;
        }
        if (mediaImage.__homeSpotlightOnError) {
          mediaImage.removeEventListener('error', mediaImage.__homeSpotlightOnError);
          mediaImage.__homeSpotlightOnError = null;
        }
        mediaImage.removeAttribute('src');
        mediaImage.style.width = '';
        mediaImage.style.height = '';
        mediaImage.style.padding = '';
        mediaImage.style.borderRadius = '';
        mediaImage.style.background = '';
        mediaImage.style.objectFit = '';
        mediaImage.style.objectPosition = '';
        mediaWrap.style.display = 'none';
        spotlightSection.classList.remove('has-square-media');
        spotlightSection.classList.remove('has-landscape-media');
        mediaWrap.classList.remove('square');
        mediaWrap.classList.remove('landscape');
        spotlightSection.classList.add('no-media');
      }
      title.textContent = item.title || 'Spotlight';
      kicker.textContent = getSpotlightSectionLabel(item.mediaType);
      summary.textContent = getSpotlightSummary(item);
      reason.innerHTML = getPersonalReason(item);
      trend.innerHTML = getTrendLabel(item);
      openBtn.href = item.href || 'index.html';
      openBtn.onclick = null;
      spotlightSection.dataset.href = String(item.href || '').trim();
      spotlightSection.classList.toggle('is-clickable', !!String(item.href || '').trim());
      spotlightSection.setAttribute('aria-label', `Open spotlight item: ${item.title || 'Spotlight'}`);

      if (shouldAnimate && spotlightInner) {
        spotlightInner.classList.remove('spotlight-fade');
        requestAnimationFrame(() => spotlightInner.classList.add('spotlight-fade'));
      }
      renderSpotlightDots();
    }

    function showSpotlightByIndex(index, shouldAnimate = false) {
      if (!homeSpotlightItems.length) return;
      const normalized = ((Number(index) || 0) % homeSpotlightItems.length + homeSpotlightItems.length) % homeSpotlightItems.length;
      homeSpotlightIndex = normalized;
      renderSpotlightItem(homeSpotlightItems[homeSpotlightIndex], shouldAnimate);
    }

    function getCurrentSpotlightItem() {
      if (!Array.isArray(homeSpotlightItems) || !homeSpotlightItems.length) return null;
      return homeSpotlightItems[homeSpotlightIndex] || null;
    }

    function openCurrentSpotlightItem() {
      const item = getCurrentSpotlightItem();
      const href = String(item?.href || '').trim();
      if (!href) return;
      window.location.href = href;
    }

    function isSpotlightInteractiveTarget(target) {
      if (!(target instanceof Element)) return false;
      return !!target.closest('a, button, input, select, textarea, [data-spotlight-index]');
    }

    function resetSpotlightTimer(shouldStart = true) {
      if (homeSpotlightTimer) clearInterval(homeSpotlightTimer);
      homeSpotlightTimer = null;
      if (!shouldStart || homeSpotlightItems.length < 2) return;
      homeSpotlightTimer = window.setInterval(() => {
        showSpotlightByIndex(homeSpotlightIndex + 1, true);
      }, SPOTLIGHT_ROTATE_MS);
    }

    function buildScoredDiscoveryPool(feedMap) {
      const pool = [];
      Object.entries(feedMap).forEach(([type, items]) => {
        const list = filterHomeSafeItems(Array.isArray(items) ? items : []);
        const weight = Number(homeTasteWeights[type] || 1);
        const maxRank = Math.max(1, list.length);
        list.forEach((item, index) => {
          const rankWeight = 1 - (index / maxRank);
          const dailySignal = getDailySignal(`${type}:${item.itemId || item.title || index}`);
          const trendScore = rankWeight * 0.55 + Math.min(weight, 2.1) * 0.32 + dailySignal * 0.13;
          pool.push({
            ...item,
            mediaType: type,
            discoveryScore: Number(trendScore.toFixed(4))
          });
        });
      });
      pool.sort((a, b) => Number(b.discoveryScore || 0) - Number(a.discoveryScore || 0));
      return pool;
    }

    function buildUnifiedFeed(pool, limit = 32) {
      if (!pool.length) return [];
      const grouped = new Map();
      pool.forEach((item) => {
        const key = String(item.mediaType || 'other');
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      });

      const typeOrder = [...grouped.keys()].sort(
        (a, b) => Number(homeTasteWeights[b] || 1) - Number(homeTasteWeights[a] || 1)
      );
      const stream = [];
      let guard = 0;
      while (stream.length < limit && guard < 800) {
        let addedAny = false;
        for (const type of typeOrder) {
          const queue = grouped.get(type);
          if (!queue || !queue.length) continue;
          const next = queue.shift();
          if (next) {
            stream.push(next);
            addedAny = true;
            if (stream.length >= limit) break;
          }
        }
        if (!addedAny) break;
        guard += 1;
      }
      return stream;
    }

    function dedupeHomeItemsByMediaAndId(items = []) {
      const seen = new Set();
      const out = [];
      (Array.isArray(items) ? items : []).forEach((item, index) => {
        const mediaType = String(item?.mediaType || '').trim().toLowerCase();
        const itemId = String(item?.itemId || '').trim();
        const title = String(item?.title || '').trim().toLowerCase();
        const key = `${mediaType}:${itemId || title || index}`;
        if (!mediaType || seen.has(key)) return;
        seen.add(key);
        out.push(item);
      });
      return out;
    }

    function withReleaseTag(item, releaseLabel, options = {}) {
      const detail = String(options.detail || '').trim();
      const existingExtra = String(options.keepExistingExtra ? (item?.extra || '') : '').trim();
      const parts = [releaseLabel, detail, existingExtra].filter(Boolean);
      return {
        ...(item || {}),
        extra: parts.join(' | ')
      };
    }

    function buildNewReleasesFallback() {
      // Keep this rail strict: do not backfill with generic/trending content.
      return [];
    }

    async function loadNewReleases(signal) {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const recentBookMinYear = Math.max(2018, currentYear - 1);
      const bookReleaseQuery = encodeURIComponent(`bestseller new release fiction ${currentYear}`);
      const toIsoDate = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
      };
      const formatDateLabel = (raw) => {
        const text = String(raw || '').trim();
        if (!text) return '';
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return text.slice(0, 4);
        return `${match[1]}-${match[2]}-${match[3]}`;
      };
      const toSortEpoch = (raw) => {
        const text = String(raw || '').trim();
        if (!text) return 0;
        const parsed = Date.parse(text);
        if (Number.isFinite(parsed)) return parsed;
        const yearMatch = text.match(/^(\d{4})$/);
        if (yearMatch) return Date.UTC(Number(yearMatch[1]), 0, 1);
        return 0;
      };
      const recentEpisodeDate = toIsoDate(new Date(now.getTime() - (1000 * 60 * 60 * 24 * 10)));
      const recentSeasonDate = toIsoDate(new Date(now.getTime() - (1000 * 60 * 60 * 24 * 120)));
      const upcomingDate = toIsoDate(new Date(now.getTime() + (1000 * 60 * 60 * 24 * 120)));
      const todayDate = toIsoDate(now);
      const movieNowPage = 1;
      const movieUpcomingPage = 1;

      const mapMovieRows = (rows, label, takeCount = 6) => {
        const list = Array.isArray(rows) ? rows : [];
        return list.slice(0, takeCount).map((row) => {
          const releaseDate = formatDateLabel(row?.release_date);
          const releaseDateSort = toSortEpoch(row?.release_date || releaseDate);
          const item = {
            mediaType: 'movie',
            itemId: String(row?.id || ''),
            title: String(row?.title || 'Movie').trim() || 'Movie',
            subtitle: releaseDate ? releaseDate.slice(0, 4) : 'Movie',
            image: row?.poster_path ? `${TMDB_POSTER}${row.poster_path}` : '',
            backgroundImage: row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : '',
            spotlightImage: row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : '',
            spotlightMediaImage: row?.poster_path ? `${TMDB_SPOT_POSTER}${row.poster_path}` : (row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : ''),
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            isAdult: row?.adult === true,
            href: row?.id ? `movie.html?id=${encodeURIComponent(row.id)}` : 'movies.html'
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail: releaseDate });
        }).filter((item) => String(item.itemId || '').trim());
      };

      const mapShowRows = (rows, mediaType, label, takeCount = 6, options = {}) => {
        const list = Array.isArray(rows) ? rows : [];
        const detailLabel = String(options.detail || '').trim();
        return list.slice(0, takeCount).map((row) => {
          const firstAir = formatDateLabel(row?.first_air_date);
          const recentAir = formatDateLabel(row?.last_air_date || row?.first_air_date);
          const detail = detailLabel || recentAir;
          const releaseDateSort = toSortEpoch(row?.last_air_date || row?.first_air_date || recentAir);
          const item = {
            mediaType,
            itemId: String(row?.id || ''),
            title: String(row?.name || (mediaType === 'anime' ? 'Anime' : 'TV Show')).trim() || (mediaType === 'anime' ? 'Anime' : 'TV Show'),
            subtitle: firstAir ? firstAir.slice(0, 4) : (mediaType === 'anime' ? 'Anime' : 'TV Show'),
            image: row?.poster_path ? `${TMDB_POSTER}${row.poster_path}` : '',
            backgroundImage: row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : '',
            spotlightImage: row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : '',
            spotlightMediaImage: row?.poster_path ? `${TMDB_SPOT_POSTER}${row.poster_path}` : (row?.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : ''),
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            isAdult: row?.adult === true,
            href: row?.id
              ? `${mediaType === 'anime' ? 'anime.html' : 'tvshow.html'}?id=${encodeURIComponent(row.id)}`
              : (mediaType === 'anime' ? 'animes.html' : 'tvshows.html')
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail });
        }).filter((item) => String(item.itemId || '').trim());
      };

      const mapGameRows = (rows, label, takeCount = 6) => {
        const list = Array.isArray(rows) ? rows : [];
        return list.slice(0, takeCount).map((row) => {
          const releaseDate = formatDateLabel(row?.released || row?.release_date || '');
          const releaseDateSort = toSortEpoch(row?.released || row?.release_date || releaseDate);
          const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
          const cover = String(row?.cover || row?.cover_url || '').trim();
          const image = cover || HOME_LOCAL_FALLBACK_IMAGE;
          const rowId = String(row?.id || row?.igdb_id || row?.rawg_id || '').trim();
          const rowTitle = String(row?.name || row?.title || 'Game').trim() || 'Game';
          const genreText = Array.isArray(extra?.genres)
            ? extra.genres.map((entry) => String(entry?.name || '').trim()).filter(Boolean).slice(0, 2).join(' | ')
            : '';
          const ratingValue = Number(row?.rating || 0);
          const item = {
            mediaType: 'game',
            itemId: rowId,
            title: rowTitle,
            subtitle: releaseDate ? releaseDate.slice(0, 4) : 'Game',
            extra: [genreText, Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : ''].filter(Boolean).join(' | '),
            image,
            backgroundImage: image,
            spotlightImage: image,
            spotlightMediaImage: image,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            fallbackImage: HOME_LOCAL_FALLBACK_IMAGE,
            href: rowId ? `game.html?id=${encodeURIComponent(rowId)}` : 'games.html'
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail: releaseDate });
        }).filter((item) => String(item.itemId || '').trim() && String(item.image || '').trim());
      };

      const mapBookRows = (rows, label, takeCount = 6) => {
        const list = Array.isArray(rows) ? rows : [];
        const buildCover = (row) => {
          const directCover = toHttpsUrl(row?.coverImage || row?.image || row?.thumbnail || '');
          if (directCover) return directCover;
          const coverId = Number(row?.cover_i || 0) || 0;
          if (coverId > 0) return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-L.jpg`;
          const isbnRaw = Array.isArray(row?.isbn) ? String(row.isbn[0] || '').trim() : String(row?.isbn || '').trim();
          const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
          if (isbn) return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
          return '';
        };
        return list.slice(0, takeCount).map((row, idx) => {
          const title = String(row?.title || row?.name || '').trim();
          if (!title) return null;
          const author = Array.isArray(row?.author_name)
            ? String(row.author_name[0] || '').trim()
            : String(row?.author || '').trim();
          const year = Number(row?.first_publish_year || row?.published_year || 0) || 0;
          const cover = buildCover(row);
          if (!cover) return null;
          const key = String(row?.key || row?.id || `book-${idx}`).trim();
          const itemId = key.startsWith('/works/') ? key.replace('/works/', '').trim() : key;
          const href = itemId
            ? `book.html?id=${encodeURIComponent(itemId)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author || 'Unknown author')}`
            : 'books.html';
          const releaseDateSort = year > 0 ? Date.UTC(year, 0, 1) : 0;
          const item = {
            mediaType: 'book',
            itemId: itemId || `book-${idx}`,
            title,
            subtitle: author ? `${author}${year ? ` | ${year}` : ''}` : (year ? String(year) : 'Book'),
            image: cover,
            backgroundImage: cover,
            spotlightImage: cover,
            spotlightMediaImage: cover,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            maturityRating: String(row?.maturityRating || row?.volumeInfo?.maturityRating || '').trim(),
            href,
            fallbackImage: HOME_LOCAL_FALLBACK_IMAGE
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail: year > 0 ? String(year) : '' });
        }).filter(Boolean);
      };

      const mapMusicRows = (trackRows, albumRows, label, takeCount = 6) => {
        const getTrackContainerLabel = (row = {}) => {
          const title = String(row?.name || '').trim().toLowerCase();
          const albumName = String(row?.album?.name || row?.album_name || '').trim();
          const albumType = String(row?.album?.album_type || row?.album_type || '').trim().toLowerCase();
          const totalTracks = Number(row?.album?.total_tracks || row?.total_tracks || 0);
          const sameName = !!title && !!albumName && title === albumName.toLowerCase();
          if (albumType === 'single' && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
          if (/\bsingle\b/i.test(albumName) && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
          return 'Album';
        };
        const tracks = (Array.isArray(trackRows) ? trackRows : []).slice(0, Math.max(takeCount * 2, 8)).map((track, idx) => {
          if (String(track?.kind || '').trim().toLowerCase() === 'album') return null;
          const artists = Array.isArray(track?.artists) ? track.artists.filter(Boolean).join(', ') : '';
          const title = String(track?.name || 'Track').trim() || 'Track';
          const albumName = String(track?.album?.name || track?.album_name || '').trim() || 'Unknown Album';
          const containerLabel = getTrackContainerLabel(track);
          const image = String(track?.image || '').trim();
          const releaseDateSort = Date.now() - (idx * 1000);
          const item = {
            mediaType: 'music',
            itemId: String(track?.id || ''),
            title,
            subtitle: artists || 'Artist',
            image,
            backgroundImage: image,
            spotlightImage: image,
            spotlightMediaImage: image,
            previewUrl: String(track?.preview_url || '').trim(),
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            explicit: track?.explicit === true,
            href: String(track?.id || '').trim() ? `song.html?id=${encodeURIComponent(track.id)}` : 'music.html'
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail: `Song | ${containerLabel}: ${albumName}` });
        }).filter((item) => item && String(item.itemId || '').trim() && String(item.image || '').trim());

        const albums = (Array.isArray(albumRows) ? albumRows : []).slice(0, Math.max(takeCount, 4)).map((album, idx) => {
          const artists = Array.isArray(album?.artists) ? album.artists.filter(Boolean).join(', ') : '';
          const image = String(album?.image || '').trim();
          const albumIdRaw = String(album?.id || '').trim();
          const albumId = albumIdRaw.startsWith('album:') ? albumIdRaw.slice(6) : albumIdRaw;
          const source = String(album?.source || '').trim().toLowerCase() || (/^[0-9]+$/.test(albumId) ? 'itunes' : 'spotify');
          const albumType = String(album?.album_type || 'album').trim().toLowerCase();
          if (albumType && albumType !== 'album') return null;
          const releaseDate = String(album?.release_date || '').trim();
          const parsedRelease = Date.parse(releaseDate);
          const releaseDateSort = Number.isFinite(parsedRelease) ? parsedRelease : (Date.now() - ((idx + 1) * 900));
          const detailBits = [releaseDate ? `Released ${releaseDate}` : '', Number(album?.total_tracks || 0) > 0 ? `${Number(album.total_tracks)} tracks` : ''].filter(Boolean);
          const detail = detailBits.length ? `Album | ${detailBits.join(' | ')}` : 'Album';
          const href = albumId
            ? `song.html?album_id=${encodeURIComponent(albumId)}&source=${encodeURIComponent(source)}`
            : 'music.html';
          const item = {
            mediaType: 'music',
            itemId: albumId ? `album:${albumId}` : '',
            title: String(album?.name || 'Album').trim() || 'Album',
            subtitle: artists || 'Artist',
            image,
            backgroundImage: image,
            spotlightImage: image,
            spotlightMediaImage: image,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            href,
            isMusicAlbum: true
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail });
        }).filter((item) => String(item.itemId || '').trim() && String(item.image || '').trim());

        const mixed = [];
        const trackQueue = [...tracks];
        const albumQueue = [...albums];
        while (mixed.length < takeCount && (trackQueue.length || albumQueue.length)) {
          if (albumQueue.length) mixed.push(albumQueue.shift());
          if (trackQueue.length && mixed.length < takeCount) mixed.push(trackQueue.shift());
          if (albumQueue.length && mixed.length < takeCount) mixed.push(albumQueue.shift());
        }
        while (mixed.length < takeCount && trackQueue.length) mixed.push(trackQueue.shift());
        while (mixed.length < takeCount && albumQueue.length) mixed.push(albumQueue.shift());
        return mixed.slice(0, takeCount);
      };

      const [movieNowRes, movieUpcomingRes, tvEpisodeRes, tvSeasonRes, animeEpisodeRes, animeSeasonRes, gamesRes, booksRes, musicTrackRes, musicAlbumRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/movie/now_playing?language=en-US&page=${movieNowPage}`,
          { signal, cacheKey: `tmdb:new-releases:movie-now:${movieNowPage}` }
        ),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/movie/upcoming?language=en-US&page=${movieUpcomingPage}`,
          { signal, cacheKey: `tmdb:new-releases:movie-upcoming:${movieUpcomingPage}` }
        ),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/tv/airing_today?language=en-US&page=1`,
          { signal, cacheKey: 'tmdb:new-releases:tv-episode' }
        ),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=first_air_date.desc&page=1&first_air_date.gte=${recentSeasonDate}&first_air_date.lte=${todayDate}`,
          { signal, cacheKey: `tmdb:new-releases:tv-season:${recentSeasonDate}:${todayDate}` }
        ),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=popularity.desc&page=1&with_genres=16&with_original_language=ja&air_date.gte=${recentEpisodeDate}&air_date.lte=${todayDate}`,
          { signal, cacheKey: `tmdb:new-releases:anime-episode:${recentEpisodeDate}:${todayDate}` }
        ),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=first_air_date.desc&page=1&with_genres=16&with_original_language=ja&first_air_date.gte=${recentSeasonDate}`,
          { signal, cacheKey: `tmdb:new-releases:anime-season:${recentSeasonDate}` }
        ),
        ENABLE_GAMES
          ? (async () => {
            const client = await ensureHomeSupabase();
            if (!client) return { results: [] };
            const { data } = await client
              .from('games')
              .select('id,title,release_date,rating,rating_count,cover_url,hero_url,extra')
              .gte('release_date', recentSeasonDate)
              .lte('release_date', upcomingDate)
              .order('release_date', { ascending: false, nullsFirst: false })
              .limit(24);
            return { results: Array.isArray(data) ? data : [] };
          })()
          : Promise.resolve({ results: [] }),
        fetchJsonWithPerfCache(
          `/api/books/popular?limit=30&page=1&language=en&orderBy=newest&q=${bookReleaseQuery}`,
          { signal, cacheKey: `books:new-releases:newest:${recentBookMinYear}:${currentYear}` }
        ),
        fetchJsonWithPerfCache(
          '/api/music/top-50?limit=40&market=US',
          { signal, cacheKey: 'music:new-releases:top-50-us-40' }
        ),
        fetchJsonWithPerfCache(
          '/api/music/new-releases?limit=40&market=US&album_types=album',
          { signal, cacheKey: 'music:new-releases:albums-us-40:album' }
        )
      ]);

      const movieNowRows = movieNowRes.status === 'fulfilled' && Array.isArray(movieNowRes.value?.results) ? movieNowRes.value.results : [];
      const movieUpcomingRows = movieUpcomingRes.status === 'fulfilled' && Array.isArray(movieUpcomingRes.value?.results) ? movieUpcomingRes.value.results : [];
      const tvEpisodeRows = tvEpisodeRes.status === 'fulfilled' && Array.isArray(tvEpisodeRes.value?.results) ? tvEpisodeRes.value.results : [];
      const tvSeasonRows = tvSeasonRes.status === 'fulfilled' && Array.isArray(tvSeasonRes.value?.results) ? tvSeasonRes.value.results : [];
      const animeEpisodeRows = animeEpisodeRes.status === 'fulfilled' && Array.isArray(animeEpisodeRes.value?.results) ? animeEpisodeRes.value.results : [];
      const animeSeasonRows = animeSeasonRes.status === 'fulfilled' && Array.isArray(animeSeasonRes.value?.results) ? animeSeasonRes.value.results : [];
      const gameRows = ENABLE_GAMES && gamesRes.status === 'fulfilled'
        ? (Array.isArray(gamesRes.value?.results) ? gamesRes.value.results : (Array.isArray(gamesRes.value) ? gamesRes.value : []))
        : [];
      const rawBookRows = booksRes.status === 'fulfilled'
        ? (Array.isArray(booksRes.value?.docs) ? booksRes.value.docs : (Array.isArray(booksRes.value?.items) ? booksRes.value.items : []))
        : [];
      const strictBookRows = rawBookRows
        .filter((row) => {
          const year = Number(row?.first_publish_year || row?.published_year || 0) || 0;
          return year >= recentBookMinYear;
        })
        .sort((a, b) => {
          const yearA = Number(a?.first_publish_year || a?.published_year || 0) || 0;
          const yearB = Number(b?.first_publish_year || b?.published_year || 0) || 0;
          return yearB - yearA;
        });
      const bookRows = strictBookRows;
      const musicTrackRows = musicTrackRes.status === 'fulfilled' && Array.isArray(musicTrackRes.value?.results)
        ? musicTrackRes.value.results
        : [];
      const musicAlbumRows = musicAlbumRes.status === 'fulfilled' && Array.isArray(musicAlbumRes.value?.results)
        ? musicAlbumRes.value.results
        : [];

      const combined = [
        ...mapShowRows(tvEpisodeRows, 'tv', 'New Episode', 5, { detail: 'Airing Today' }),
        ...mapShowRows(tvSeasonRows, 'tv', 'New Season', 5, { detail: 'Latest Season' }),
        ...mapShowRows(animeEpisodeRows, 'anime', 'New Episode', 4, { detail: 'Latest Episode' }),
        ...mapShowRows(animeSeasonRows, 'anime', 'New Season', 4, { detail: 'Latest Season' }),
        ...mapMovieRows(movieNowRows, 'New Release', 5),
        ...mapMovieRows(movieUpcomingRows, 'Upcoming Release', 3),
        ...(ENABLE_GAMES ? mapGameRows(gameRows, 'New Release', 4) : []),
        ...mapBookRows(bookRows, 'New Release', 4),
        ...mapMusicRows(musicTrackRows, musicAlbumRows, 'Chart Update', 4)
      ];

      const deduped = dedupeHomeItemsByMediaAndId(combined)
        .filter((item) => String(item?.image || '').trim())
        .filter((item) => isHomeSafeContentItem(item));
      deduped.sort((a, b) => Number(b?.releaseDateSort || 0) - Number(a?.releaseDateSort || 0));
      return deduped.slice(0, HOME_NEW_RELEASES_TARGET_ITEMS);
    }

    async function refreshHomeNewReleases(feedMap = homeFeedState, options = {}) {
      const railOptions = { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true };
      const fallbackItems = filterHomeSafeItems(buildNewReleasesFallback(feedMap));

      if (homeNewReleasesState.length) {
        renderRail('newReleasesRail', filterHomeSafeItems(homeNewReleasesState), railOptions);
      } else if (fallbackItems.length) {
        renderRail('newReleasesRail', fallbackItems, railOptions);
      }

      const force = options.force === true;
      const now = Date.now();
      if (!force && homeNewReleasesState.length && (now - homeNewReleasesLastFetchAt) < HOME_NEW_RELEASES_REFRESH_MS) {
        return;
      }

      if (!force && homeNewReleasesInFlight) {
        await homeNewReleasesInFlight;
        return;
      }

      const seq = ++homeNewReleasesRequestSeq;
      const requestTask = (async () => {
        const liveItems = await loadHomeChannelWithTimeout(loadNewReleases, HOME_NEW_RELEASES_TIMEOUT_MS);
        if (seq !== homeNewReleasesRequestSeq) return;
        const safeLiveItems = filterHomeSafeItems(liveItems);
        if (safeLiveItems.length) {
          homeNewReleasesState = safeLiveItems;
          homeNewReleasesLastFetchAt = Date.now();
          renderRail('newReleasesRail', homeNewReleasesState, railOptions);
        } else if (!homeNewReleasesState.length && fallbackItems.length) {
          renderRail('newReleasesRail', fallbackItems, railOptions);
        }
      })();
      homeNewReleasesInFlight = requestTask;
      try {
        await requestTask;
      } finally {
        if (homeNewReleasesInFlight === requestTask) {
          homeNewReleasesInFlight = null;
        }
      }
    }

    function getRecommendationItemKey(mediaType, itemId) {
      const type = String(mediaType || '').toLowerCase().trim();
      const id = String(itemId || '').trim();
      if (!type || !id) return '';
      return `${type}:${id}`;
    }

    function getListTypeWeight(listType) {
      const value = String(listType || '').toLowerCase();
      if (value === 'favorites') return 0.75;
      if (value === 'watched' || value === 'read' || value === 'listened' || value === 'visited') return 0.6;
      if (value === 'watchlist' || value === 'readlist' || value === 'listenlist' || value === 'wanttogo' || value === 'bucketlist') return 0.35;
      return 0.28;
    }

    function getRecencyWeight(createdAt) {
      if (!createdAt) return 0.35;
      const time = new Date(createdAt).getTime();
      if (!Number.isFinite(time) || time <= 0) return 0.35;
      const ageHours = (Date.now() - time) / (1000 * 60 * 60);
      if (!Number.isFinite(ageHours) || ageHours < 0) return 0.35;
      if (ageHours > HOME_BECAUSE_SIGNAL_RECENCY_HOURS) return 0.1;
      return Math.max(0.2, 1 - (ageHours / HOME_BECAUSE_SIGNAL_RECENCY_HOURS));
    }

    async function fetchBecauseYouLikedSignals() {
      if (!homeCurrentUser?.id) return null;
      const client = await ensureHomeSupabase();
      if (!client) return null;

      const { data: followsRows } = await client
        .from('follows')
        .select('followed_id')
        .eq('follower_id', homeCurrentUser.id)
        .limit(HOME_BECAUSE_MAX_FOLLOWED_USERS);

      const followedIds = [...new Set((followsRows || [])
        .map((row) => String(row?.followed_id || '').trim())
        .filter(Boolean))];
      const userIds = [homeCurrentUser.id, ...followedIds].slice(0, HOME_BECAUSE_MAX_FOLLOWED_USERS + 1);
      if (!userIds.length) return null;

      const fetchRowsForSignalTable = async (mediaType, cfg) => {
        const withCreatedAt = await client
          .from(cfg.table)
          .select(`${cfg.itemField}, user_id, list_type, created_at`)
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(220);

        if (!withCreatedAt?.error) {
          return { mediaType, itemField: cfg.itemField, rows: Array.isArray(withCreatedAt?.data) ? withCreatedAt.data : [] };
        }

        // Some deployments do not have created_at on media list tables.
        const withoutCreatedAt = await client
          .from(cfg.table)
          .select(`${cfg.itemField}, user_id, list_type, id`)
          .in('user_id', userIds)
          .order('id', { ascending: false })
          .limit(220);

        if (withoutCreatedAt?.error) {
          return { mediaType, itemField: cfg.itemField, rows: [] };
        }

        const rows = (Array.isArray(withoutCreatedAt?.data) ? withoutCreatedAt.data : []).map((row) => ({
          ...row,
          created_at: null
        }));
        return { mediaType, itemField: cfg.itemField, rows };
      };

      const queryTasks = Object.entries(HOME_DEFAULT_LIST_TABLES).map(([mediaType, cfg]) => {
        return fetchRowsForSignalTable(mediaType, cfg).catch(() => ({ mediaType, itemField: cfg.itemField, rows: [] }));
      });

      const batches = await Promise.all(queryTasks);
      const signalMap = new Map();
      const reasonsMap = new Map();

      batches.forEach(({ mediaType, itemField, rows }) => {
        rows.forEach((row) => {
          const rawItemId = row?.[itemField];
          const itemId = normalizeHomeDefaultItemId(mediaType, rawItemId);
          if (itemId === null || itemId === undefined) return;
          const key = getRecommendationItemKey(mediaType, itemId);
          if (!key) return;

          const sourceUserId = String(row?.user_id || '').trim();
          const isOwn = sourceUserId === String(homeCurrentUser.id);
          const recency = getRecencyWeight(row?.created_at);
          const listWeight = getListTypeWeight(row?.list_type);
          const score = (isOwn ? 2.2 : 1.3) * recency + listWeight;

          signalMap.set(key, Number((Number(signalMap.get(key) || 0) + score).toFixed(4)));

          const existingReason = reasonsMap.get(key) || { ownCount: 0, followingCount: 0, recentAt: '' };
          if (isOwn) existingReason.ownCount += 1;
          else existingReason.followingCount += 1;
          if (!existingReason.recentAt || (row?.created_at && new Date(row.created_at).getTime() > new Date(existingReason.recentAt).getTime())) {
            existingReason.recentAt = String(row?.created_at || '');
          }
          reasonsMap.set(key, existingReason);
        });
      });

      return {
        signalMap,
        reasonsMap,
        followedCount: followedIds.length
      };
    }

    async function getActivitySignalsCached() {
      const userId = String(homeCurrentUser?.id || '').trim();
      if (!userId) return null;
      if (
        homeBecauseSignalCache.userId === userId &&
        homeBecauseSignalCache.payload &&
        (Date.now() - Number(homeBecauseSignalCache.savedAt || 0)) < HOME_BECAUSE_SIGNAL_CACHE_MS
      ) {
        return homeBecauseSignalCache.payload;
      }
      const payload = await fetchBecauseYouLikedSignals();
      homeBecauseSignalCache = {
        userId,
        savedAt: Date.now(),
        payload
      };
      return payload;
    }

    function applyActivitySignalsToPool(scoredPool, signalPayload) {
      const signalMap = signalPayload?.signalMap instanceof Map ? signalPayload.signalMap : new Map();
      const reasonsMap = signalPayload?.reasonsMap instanceof Map ? signalPayload.reasonsMap : new Map();
      if (!Array.isArray(scoredPool) || !scoredPool.length) return [];
      return scoredPool
        .map((item) => {
          const key = getRecommendationItemKey(item?.mediaType, item?.itemId);
          const signal = Number(signalMap.get(key) || 0);
          const reason = reasonsMap.get(key) || { ownCount: 0, followingCount: 0 };
          let reasonText = '';
          if (reason.ownCount > 0 && reason.followingCount > 0) reasonText = 'Saved by you and people you follow';
          else if (reason.ownCount > 0) reasonText = 'From your recent saves';
          else if (reason.followingCount > 0) reasonText = 'Popular with people you follow';
          return {
            ...item,
            extra: reasonText || item.extra || '',
            discoveryScore: Number(item.discoveryScore || 0) + Math.min(4.6, signal * 0.92)
          };
        })
        .sort((a, b) => Number(b.discoveryScore || 0) - Number(a.discoveryScore || 0));
    }

    async function refreshMixedForYouFromActivity(feedMap, scoredPool) {
      const localFeed = feedMap || homeFeedState;
      const localPool = Array.isArray(scoredPool) ? scoredPool : buildScoredDiscoveryPool(localFeed);
      const seq = ++homeBecauseRefreshSeq;
      const fallbackItems = buildUnifiedFeed(localPool, HOME_UNIFIED_TARGET_ITEMS);

      if (!homeCurrentUser?.id) {
        renderRail('unifiedRail', fallbackItems, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
        return;
      }

      const signalPayload = await getActivitySignalsCached();
      if (seq !== homeBecauseRefreshSeq) return;
      const boostedPool = applyActivitySignalsToPool(localPool, signalPayload);
      const unified = buildUnifiedFeed(boostedPool, HOME_UNIFIED_TARGET_ITEMS);
      renderRail('unifiedRail', unified.length ? unified : fallbackItems, {
        mediaType: 'mixed',
        uniformMedia: true,
        restaurantComposite: true
      });
    }

    function invalidateActivitySignals() {
      homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
      void refreshMixedForYouFromActivity(homeFeedState);
    }

    function getHomeSpotlightPoolKey(item, index = 0) {
      const type = String(item?.mediaType || '').trim().toLowerCase();
      const id = String(item?.itemId || '').trim().toLowerCase();
      const title = String(item?.title || '').trim().toLowerCase();
      const image = String(item?.image || '').trim().toLowerCase();
      return `${type}:${id || title || image || index}`;
    }

    function buildBalancedSpotlightShortlist(pool, limit = HOME_SPOTLIGHT_POOL_SIZE) {
      const maxItems = Math.max(1, Number(limit || HOME_SPOTLIGHT_POOL_SIZE));
      const candidates = filterHomeSafeItems(Array.isArray(pool) ? pool : []);
      if (!candidates.length) return [];

      const typePool = (Array.isArray(HOME_ACTIVE_MEDIA_TYPES) && HOME_ACTIVE_MEDIA_TYPES.length)
        ? HOME_ACTIVE_MEDIA_TYPES
        : HOME_BASE_MEDIA_TYPES;
      const grouped = new Map();
      const groupedKeys = new Map();
      typePool.forEach((type) => {
        grouped.set(type, []);
        groupedKeys.set(type, new Set());
      });

      candidates.forEach((item, index) => {
        const type = String(item?.mediaType || '').trim().toLowerCase();
        if (!type) return;
        if (!grouped.has(type)) {
          grouped.set(type, []);
          groupedKeys.set(type, new Set());
        }
        const key = getHomeSpotlightPoolKey(item, index);
        const keySet = groupedKeys.get(type);
        if (!keySet || keySet.has(key)) return;
        keySet.add(key);
        grouped.get(type).push(item);
      });

      const activeTypes = [...grouped.entries()]
        .filter(([, items]) => Array.isArray(items) && items.length)
        .map(([type]) => type);
      if (!activeTypes.length) return candidates.slice(0, maxItems);

      const allocation = new Map(activeTypes.map((type) => [type, 0]));
      const baseCount = Math.floor(maxItems / activeTypes.length);
      activeTypes.forEach((type) => {
        allocation.set(type, Math.min(baseCount, grouped.get(type).length));
      });

      let used = [...allocation.values()].reduce((sum, value) => sum + Number(value || 0), 0);
      while (used < maxItems) {
        const nextType = [...activeTypes]
          .map((type) => {
            const allocated = Number(allocation.get(type) || 0);
            const remaining = grouped.get(type).length - allocated;
            return {
              type,
              remaining,
              weight: Number(homeTasteWeights[type] || 1)
            };
          })
          .filter((entry) => entry.remaining > 0)
          .sort((a, b) => b.remaining - a.remaining || b.weight - a.weight || a.type.localeCompare(b.type))[0];
        if (!nextType) break;
        allocation.set(nextType.type, Number(allocation.get(nextType.type) || 0) + 1);
        used += 1;
      }

      const selectedByType = new Map();
      activeTypes.forEach((type) => {
        const takeCount = Number(allocation.get(type) || 0);
        selectedByType.set(type, grouped.get(type).slice(0, takeCount));
      });

      const roundRobinOrder = [...activeTypes].sort(
        (a, b) => Number(homeTasteWeights[b] || 1) - Number(homeTasteWeights[a] || 1)
      );
      const shortlist = [];
      let guard = 0;
      while (shortlist.length < maxItems && guard < (maxItems * 8)) {
        let added = false;
        roundRobinOrder.forEach((type) => {
          if (shortlist.length >= maxItems) return;
          const queue = selectedByType.get(type);
          if (!queue || !queue.length) return;
          const item = queue.shift();
          if (!item) return;
          shortlist.push(item);
          added = true;
        });
        if (!added) break;
        guard += 1;
      }

      if (shortlist.length < maxItems) {
        const usedKeys = new Set(shortlist.map((item, index) => getHomeSpotlightPoolKey(item, index)));
        candidates.forEach((item, index) => {
          if (shortlist.length >= maxItems) return;
          const key = getHomeSpotlightPoolKey(item, index);
          if (usedKeys.has(key)) return;
          usedKeys.add(key);
          shortlist.push(item);
        });
      }

      return shortlist.slice(0, maxItems);
    }

    function hydrateSpotlightFromPool(pool) {
      const safePool = filterHomeSafeItems(Array.isArray(pool) ? pool : []);
      if (!safePool.length) {
        homeSpotlightItems = [];
        resetSpotlightTimer(false);
        return;
      }

      const topPool = safePool.slice(0, HOME_SPOTLIGHT_POOL_SIZE * 4);
      const mixedCandidates = buildUnifiedFeed(topPool, HOME_SPOTLIGHT_POOL_SIZE * 4);
      const shortlist = buildBalancedSpotlightShortlist(
        mixedCandidates.length ? mixedCandidates : topPool,
        HOME_SPOTLIGHT_POOL_SIZE
      );
      if (!shortlist.length) {
        homeSpotlightItems = safePool.slice(0, HOME_SPOTLIGHT_POOL_SIZE);
      } else {
        const seed = getSpotlightSeedOffset();
        const offset = seed % shortlist.length;
        homeSpotlightItems = [...shortlist.slice(offset), ...shortlist.slice(0, offset)];
      }

      warmSpotlightImages(homeSpotlightItems);
      homeSpotlightIndex = 0;
      showSpotlightByIndex(0, false);
      resetSpotlightTimer(true);
    }

    async function loadTasteWeights() {
      const weights = Object.fromEntries(HOME_ACTIVE_MEDIA_TYPES.map((type) => [type, 1]));
      if (!homeCurrentUser?.id) return weights;

      const client = await ensureHomeSupabase();
      if (!client) return weights;
      try {
        const [movieRes, tvRes, animeRes, gameRes, bookRes, musicRes, travelRes, listRes] = await Promise.all([
          client.from('movie_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id),
          client.from('tv_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id),
          client.from('anime_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id)
            .then((res) => res)
            .catch(() => ({ count: 0 })),
          ENABLE_GAMES
            ? client.from('game_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id)
            : Promise.resolve({ count: 0 }),
          client.from('book_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id),
          client.from('music_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id),
          client.from('travel_list_items').select('id', { count: 'exact', head: true }).eq('user_id', homeCurrentUser.id)
            .then((res) => res)
            .catch(() => ({ count: 0 })),
          ENABLE_RESTAURANTS
            ? client.from('lists').select('id').eq('user_id', homeCurrentUser.id)
            : Promise.resolve({ data: [] })
        ]);

        const listIds = Array.isArray(listRes?.data) ? listRes.data.map((row) => row.id).filter(Boolean) : [];
        let restaurantCount = 0;
        if (ENABLE_RESTAURANTS && listIds.length) {
          const { count } = await client
            .from('lists_restraunts')
            .select('id', { count: 'exact', head: true })
            .in('list_id', listIds);
          restaurantCount = Number(count || 0);
        }

        const counts = {
          movie: Number(movieRes?.count || 0),
          tv: Number(tvRes?.count || 0),
          anime: Number(animeRes?.count || 0),
          ...(ENABLE_GAMES ? { game: Number(gameRes?.count || 0) } : {}),
          book: Number(bookRes?.count || 0),
          music: Number(musicRes?.count || 0),
          travel: Number(travelRes?.count || 0),
          ...(ENABLE_RESTAURANTS ? { restaurant: restaurantCount } : {})
        };
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        if (!total) return weights;

        Object.entries(counts).forEach(([type, value]) => {
          const share = value / total;
          weights[type] = Number((1 + Math.min(1.1, share * 3.2)).toFixed(2));
        });
      } catch (_err) {}
      return weights;
    }

    async function ensureHomeSupabase() {
      if (homeSupabaseClient) return homeSupabaseClient;
      if (!window.supabase || !window.supabase.createClient) return null;
      homeSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          // OAuth callback is handled on auth-callback.html, keep homepage parser off.
          detectSessionInUrl: false
        }
      });
      return homeSupabaseClient;
    }

    function clearHomeAuthParamsFromUrl() {
      const url = new URL(window.location.href);
      const authParams = ['code', 'state', 'error', 'error_description', 'scope', 'authuser', 'prompt'];
      authParams.forEach((key) => url.searchParams.delete(key));
      if (/(access_token|refresh_token|expires_in|token_type|type)=/i.test(window.location.hash || '')) {
        url.hash = '';
      }
      const cleaned = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, document.title, cleaned || 'index.html');
    }

    async function completeHomeOAuthReturnIfNeeded() {
      const searchParams = new URLSearchParams(window.location.search || '');
      const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
      const oauthError = searchParams.get('error_description') || searchParams.get('error');

      if (oauthError) {
        showHomeToast('Google sign-in failed. Please try again.', true);
        clearHomeAuthParamsFromUrl();
        return false;
      }

      const hasCode = !!searchParams.get('code');
      const hasTokens = !!(hashParams.get('access_token') && hashParams.get('refresh_token'));
      if (!hasCode && !hasTokens) return false;

      const client = await ensureHomeSupabase();
      if (!client) return false;

      try {
        if (hasCode) {
          const code = searchParams.get('code');
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { error } = await client.auth.setSession({
            access_token: hashParams.get('access_token'),
            refresh_token: hashParams.get('refresh_token')
          });
          if (error) throw error;
        }
        clearHomeAuthParamsFromUrl();
        return true;
      } catch (error) {
        console.error('Home OAuth completion failed:', error);
        showHomeToast('Could not complete sign-in. Please try again.', true);
        clearHomeAuthParamsFromUrl();
        return false;
      }
    }

    async function ensureRestaurantList(userId, listType) {
      const client = await ensureHomeSupabase();
      if (!client) return null;
      const conf = HOME_RESTAURANT_LIST_META[listType] || HOME_RESTAURANT_LIST_META.favorites;
      const { data: existing } = await client
        .from('lists')
        .select('id')
        .eq('user_id', userId)
        .eq('title', conf.title)
        .limit(1)
        .maybeSingle();
      if (existing?.id) return existing.id;
      const { data: created, error } = await client
        .from('lists')
        .insert({
          user_id: userId,
          title: conf.title,
          description: conf.description,
          icon: conf.icon
        })
        .select('id')
        .single();
      if (error) return null;
      return created?.id || null;
    }

    function getHomeDefaultListTable(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      return HOME_DEFAULT_LIST_TABLES[type] || null;
    }

    function normalizeHomeDefaultItemId(mediaType, itemId) {
      const type = String(mediaType || '').toLowerCase();
      if (type === 'movie' || type === 'tv' || type === 'anime' || type === 'game') {
        const numericId = Number(itemId);
        return Number.isFinite(numericId) ? numericId : null;
      }
      if (type === 'travel') {
        const code = String(itemId || '').trim().toUpperCase();
        return code || null;
      }
      const text = String(itemId || '').trim();
      return text || null;
    }

    function normalizeHomeRestaurantId(itemId) {
      const numericId = Number(itemId);
      return Number.isFinite(numericId) ? numericId : null;
    }

    async function saveToListFromHome(payload) {
      const result = { ok: false, saved: null };
      const client = await ensureHomeSupabase();
      if (!client) {
        showHomeToast('List service unavailable', true);
        return result;
      }
      if (!homeCurrentUser?.id) {
        window.location.href = 'login.html';
        return result;
      }

      const mediaType = String(payload.mediaType || '').toLowerCase();
      const listType = payload.listType;
      const nextSaved = typeof payload.nextSaved === 'boolean' ? payload.nextSaved : null;
      if (!payload.itemId || !listType) return result;
      if (!supportsHomeLists(mediaType)) {
        showHomeToast('Lists are not available for this media yet.');
        return result;
      }

      const ensureLinkedMediaRecord = async (itemId) => {
        if (mediaType === 'book') {
          await client.from('books').upsert({
            id: String(itemId),
            title: payload.title || '',
            authors: payload.subtitle || '',
            thumbnail: payload.image || '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }

        if (mediaType === 'music') {
          await client.from('tracks').upsert({
            id: String(itemId),
            name: payload.title || '',
            artists: payload.subtitle || '',
            image_url: payload.image || '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        }
      };

      try {
        const defaultListTable = getHomeDefaultListTable(mediaType);
        const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

        if (defaultListTable) {
          if (itemId === null) {
            showHomeToast('Could not update list', true);
            return result;
          }
          const { table, itemField } = defaultListTable;

          if (nextSaved === false) {
            const { error: deleteError } = await client
              .from(table)
              .delete()
              .eq('user_id', homeCurrentUser.id)
              .eq(itemField, itemId)
              .eq('list_type', listType);
            if (deleteError) {
              showHomeToast('Could not update list', true);
              return result;
            }
            showHomeToast('Removed from list');
            result.ok = true;
            result.saved = false;
            invalidateActivitySignals();
            return result;
          }

          if (nextSaved === true) {
            await ensureLinkedMediaRecord(itemId);
            const insertRow = { user_id: homeCurrentUser.id, list_type: listType };
            insertRow[itemField] = itemId;
            const { error: insertError } = await client.from(table).insert(insertRow);
            if (insertError && String(insertError.code || '') !== '23505') {
              showHomeToast('Could not add to list', true);
              return result;
            }
            showHomeToast('Added to list');
            result.ok = true;
            result.saved = true;
            invalidateActivitySignals();
            return result;
          }

          const { data: existing } = await client
            .from(table)
            .select('id')
            .eq('user_id', homeCurrentUser.id)
            .eq(itemField, itemId)
            .eq('list_type', listType)
            .limit(1)
            .maybeSingle();
          if (existing?.id) {
            const { error: deleteError } = await client.from(table).delete().eq('id', existing.id);
            if (deleteError) {
              showHomeToast('Could not update list', true);
              return result;
            }
            showHomeToast('Removed from list');
            result.ok = true;
            result.saved = false;
            invalidateActivitySignals();
            return result;
          }

          await ensureLinkedMediaRecord(itemId);
          const insertRow = { user_id: homeCurrentUser.id, list_type: listType };
          insertRow[itemField] = itemId;
          const { error: insertError } = await client.from(table).insert(insertRow);
          if (insertError && String(insertError.code || '') !== '23505') {
            showHomeToast('Could not add to list', true);
            return result;
          }
          showHomeToast('Added to list');
          result.ok = true;
          result.saved = true;
          invalidateActivitySignals();
          return result;
        }

        if (mediaType === 'restaurant') {
          const restaurantId = normalizeHomeRestaurantId(payload.itemId);
          if (restaurantId === null) {
            showHomeToast('Could not update list', true);
            return result;
          }
          const listId = await ensureRestaurantList(homeCurrentUser.id, listType);
          if (!listId) {
            showHomeToast('Could not prepare list', true);
            return result;
          }

          if (nextSaved === false) {
            const { error: deleteError } = await client
              .from('lists_restraunts')
              .delete()
              .eq('list_id', listId)
              .eq('restraunt_id', restaurantId);
            if (deleteError) {
              showHomeToast('Could not update list', true);
              return result;
            }
            showHomeToast('Removed from list');
            result.ok = true;
            result.saved = false;
            invalidateActivitySignals();
            return result;
          }

          if (nextSaved === true) {
            const { error: insertError } = await client
              .from('lists_restraunts')
              .insert({ list_id: listId, restraunt_id: restaurantId });
            if (insertError && String(insertError.code || '') !== '23505') {
              showHomeToast('Could not add to list', true);
              return result;
            }
            showHomeToast('Added to list');
            result.ok = true;
            result.saved = true;
            invalidateActivitySignals();
            return result;
          }

          const { data: existing } = await client
            .from('lists_restraunts')
            .select('id')
            .eq('list_id', listId)
            .eq('restraunt_id', restaurantId)
            .limit(1)
            .maybeSingle();
          if (existing?.id) {
            const { error: deleteError } = await client.from('lists_restraunts').delete().eq('id', existing.id);
            if (deleteError) {
              showHomeToast('Could not update list', true);
              return result;
            }
            showHomeToast('Removed from list');
            result.ok = true;
            result.saved = false;
            invalidateActivitySignals();
            return result;
          }
          const { error: insertError } = await client
            .from('lists_restraunts')
            .insert({ list_id: listId, restraunt_id: restaurantId });
          if (insertError && String(insertError.code || '') !== '23505') {
            showHomeToast('Could not add to list', true);
            return result;
          }
          showHomeToast('Added to list');
          result.ok = true;
          result.saved = true;
          invalidateActivitySignals();
          return result;
        }
      } catch (_err) {
        showHomeToast('Could not add to list', true);
      }
      return result;
    }

    async function getHomeListStatusMap(mediaType, itemId, listKeys) {
      const status = {};
      (listKeys || []).forEach((key) => {
        status[key] = false;
      });
      if (!homeCurrentUser?.id || !listKeys?.length) return status;
      const client = await ensureHomeSupabase();
      if (!client) return status;

      try {
        const defaultListTable = getHomeDefaultListTable(mediaType);
        if (defaultListTable) {
          const normalizedItemId = normalizeHomeDefaultItemId(mediaType, itemId);
          if (normalizedItemId === null) return status;
          const { table, itemField } = defaultListTable;
          const { data } = await client
            .from(table)
            .select('list_type')
            .eq('user_id', homeCurrentUser.id)
            .eq(itemField, normalizedItemId)
            .in('list_type', listKeys);
          (data || []).forEach((row) => {
            const key = String(row.list_type || '');
            if (key in status) status[key] = true;
          });
          return status;
        }

        if (mediaType === 'restaurant') {
          const restaurantId = normalizeHomeRestaurantId(itemId);
          if (restaurantId === null) return status;
          const titleByKey = {};
          listKeys.forEach((key) => {
            const conf = HOME_RESTAURANT_LIST_META[key];
            if (conf?.title) titleByKey[key] = conf.title;
          });
          const titles = Object.values(titleByKey);
          if (!titles.length) return status;

          const { data: lists } = await client
            .from('lists')
            .select('id,title')
            .eq('user_id', homeCurrentUser.id)
            .in('title', titles);

          const listIdToKey = {};
          Object.entries(titleByKey).forEach(([key, title]) => {
            const match = (lists || []).find((row) => String(row.title || '').toLowerCase() === String(title).toLowerCase());
            if (match?.id) listIdToKey[String(match.id)] = key;
          });

          const listIds = Object.keys(listIdToKey);
          if (!listIds.length) return status;

          const { data: links } = await client
            .from('lists_restraunts')
            .select('list_id')
            .eq('restraunt_id', restaurantId)
            .in('list_id', listIds);

          (links || []).forEach((row) => {
            const key = listIdToKey[String(row.list_id)];
            if (key && key in status) status[key] = true;
          });
          return status;
        }
      } catch (_err) {}

      return status;
    }

    async function syncCardMenuListState(card, menu) {
      if (!card || !menu) return;
      const mediaType = String(card.getAttribute('data-media-type') || '').toLowerCase();
      const itemId = card.getAttribute('data-item-id');
      const cfg = getMediaListConfig(mediaType);
      if (!cfg || !Array.isArray(cfg.rows) || !cfg.rows.length) return;

      const listKeys = cfg.rows.map((row) => row.key).filter(Boolean);
      menu.querySelectorAll('.rail-menu-item[data-action="save"]').forEach((btn) => {
        btn.setAttribute('data-saved', '0');
        const stateEl = btn.querySelector('.rail-menu-state');
        if (stateEl) stateEl.textContent = 'Add';
      });

      if (!homeCurrentUser?.id) return;
      const status = await getHomeListStatusMap(mediaType, itemId, listKeys);
      menu.querySelectorAll('.rail-menu-item[data-action="save"]').forEach((btn) => {
        const key = String(btn.getAttribute('data-list') || '');
        const saved = !!status[key];
        btn.setAttribute('data-saved', saved ? '1' : '0');
        const stateEl = btn.querySelector('.rail-menu-state');
        if (stateEl) stateEl.textContent = saved ? 'Saved' : 'Add';
      });
    }

    function getHomeListConfig(mediaType) {
      return window.ListUtils ? ListUtils.getListConfig(mediaType) : null;
    }

    function coerceHomeItemId(mediaType, itemId) {
      return window.ListUtils ? ListUtils.coerceItemId(mediaType, itemId) : itemId;
    }

    const homeItemMenuState = {
      currentItem: null,
      quickRows: [],
      quickStatus: {},
      pendingQuickKeys: new Set(),
      customLists: [],
      selectedCustomLists: new Set(),
      selectedIcon: 'fas fa-list'
    };
    const homeItemMenuCache = {
      quickStatusByItem: new Map(),
      customListsByMediaType: new Map(),
      customMembershipByItem: new Map(),
      primingScopes: new Set()
    };

    function getHomeMenuItemCacheKey(mediaType, itemId) {
      const type = String(mediaType || '').toLowerCase();
      const normalized = coerceHomeItemId(type, itemId);
      return `${type}:${String(normalized)}`;
    }

    function buildHomeMenuBlankQuickStatus(rows) {
      const status = {};
      (rows || []).forEach((row) => {
        const key = String(row?.key || '').trim();
        if (!key) return;
        status[key] = false;
      });
      return status;
    }

    function cloneHomeMenuQuickStatus(status, rows) {
      const cloned = buildHomeMenuBlankQuickStatus(rows);
      if (!status || typeof status !== 'object') return cloned;
      Object.keys(cloned).forEach((key) => {
        cloned[key] = !!status[key];
      });
      return cloned;
    }

    function readHomeMenuQuickStatusCache(mediaType, itemId, rows) {
      const key = getHomeMenuItemCacheKey(mediaType, itemId);
      if (!homeItemMenuCache.quickStatusByItem.has(key)) {
        return buildHomeMenuBlankQuickStatus(rows);
      }
      return cloneHomeMenuQuickStatus(homeItemMenuCache.quickStatusByItem.get(key), rows);
    }

    function writeHomeMenuQuickStatusCache(mediaType, itemId, status, rows) {
      const key = getHomeMenuItemCacheKey(mediaType, itemId);
      homeItemMenuCache.quickStatusByItem.set(key, cloneHomeMenuQuickStatus(status, rows));
    }

    function readHomeMenuCustomListsCache(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      const rows = homeItemMenuCache.customListsByMediaType.get(type);
      return Array.isArray(rows) ? [...rows] : [];
    }

    function writeHomeMenuCustomListsCache(mediaType, rows) {
      const type = String(mediaType || '').toLowerCase();
      homeItemMenuCache.customListsByMediaType.set(type, Array.isArray(rows) ? [...rows] : []);
    }

    function readHomeMenuMembershipCache(mediaType, itemId) {
      const key = getHomeMenuItemCacheKey(mediaType, itemId);
      const rows = homeItemMenuCache.customMembershipByItem.get(key);
      return new Set(Array.isArray(rows) ? rows : []);
    }

    function writeHomeMenuMembershipCache(mediaType, itemId, membership) {
      const key = getHomeMenuItemCacheKey(mediaType, itemId);
      homeItemMenuCache.customMembershipByItem.set(
        key,
        Array.from(membership || []).filter(Boolean)
      );
    }

    function getVisibleHomeItemIdsByType(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      if (!type) return [];
      const cards = document.querySelectorAll(`.card[data-media-type="${type}"][data-item-id]`);
      const seen = new Set();
      const ids = [];
      cards.forEach((card) => {
        const raw = card.getAttribute('data-item-id');
        if (!raw) return;
        const normalized = window.ListUtils && typeof ListUtils.normalizeQueryableItemId === 'function'
          ? ListUtils.normalizeQueryableItemId(type, raw)
          : coerceHomeItemId(type, raw);
        if (normalized === null || normalized === undefined) return;
        const key = String(normalized).trim();
        if (!key) return;
        if (seen.has(key)) return;
        seen.add(key);
        ids.push(normalized);
      });
      return ids;
    }

    async function primeHomeMenuCachesForType(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      if (!type || !homeCurrentUser?.id || !window.ListUtils || !supportsHomeLists(type)) return;
      const scopeKey = `${homeCurrentUser.id}:${type}`;
      if (homeItemMenuCache.primingScopes.has(scopeKey)) return;
      homeItemMenuCache.primingScopes.add(scopeKey);

      try {
        const client = await ensureHomeSupabase();
        if (!client) return;

        const cfg = getMediaListConfig(type);
        const quickRows = Array.isArray(cfg?.rows) ? cfg.rows : [];
        const listKeys = quickRows.map((row) => row.key).filter(Boolean);
        const visibleItemIds = getVisibleHomeItemIdsByType(type);

        const defaultTable = getHomeDefaultListTable(type);
        if (defaultTable && visibleItemIds.length && listKeys.length) {
          const { table, itemField } = defaultTable;
          const { data } = await client
            .from(table)
            .select(`${itemField},list_type`)
            .eq('user_id', homeCurrentUser.id)
            .in(itemField, visibleItemIds)
            .in('list_type', listKeys);
          const grouped = new Map();
          visibleItemIds.forEach((id) => {
            grouped.set(String(id), buildHomeMenuBlankQuickStatus(quickRows));
          });
          (data || []).forEach((row) => {
            const itemKey = String(row?.[itemField] ?? '');
            const listType = String(row?.list_type || '');
            const status = grouped.get(itemKey);
            if (!status || !(listType in status)) return;
            status[listType] = true;
          });
          grouped.forEach((status, itemKey) => {
            writeHomeMenuQuickStatusCache(type, itemKey, status, quickRows);
          });
        } else if (type === 'restaurant' && visibleItemIds.length && listKeys.length) {
          await Promise.all(visibleItemIds.map(async (id) => {
            const status = await getHomeListStatusMap(type, id, listKeys);
            writeHomeMenuQuickStatusCache(type, id, status, quickRows);
          }));
        }

        let customLists = readHomeMenuCustomListsCache(type);
        if (!customLists.length) {
          customLists = await ListUtils.loadCustomLists(client, homeCurrentUser.id, type);
          writeHomeMenuCustomListsCache(type, customLists);
        }

        const listCfg = ListUtils.getListConfig(type);
        const listIds = customLists.map((list) => list.id).filter(Boolean);
        if (!listCfg || !listIds.length || !visibleItemIds.length) return;

        let query = client
          .from(listCfg.itemsTable)
          .select(`list_id,${listCfg.itemIdField}`)
          .in('list_id', listIds)
          .in(listCfg.itemIdField, visibleItemIds);
        const { data: membershipRows } = await query;
        const byItem = new Map();
        visibleItemIds.forEach((id) => {
          byItem.set(String(id), new Set());
        });
        (membershipRows || []).forEach((row) => {
          const itemKey = String(row?.[listCfg.itemIdField] ?? '');
          if (!byItem.has(itemKey)) byItem.set(itemKey, new Set());
          byItem.get(itemKey).add(row.list_id);
        });
        byItem.forEach((membership, itemKey) => {
          writeHomeMenuMembershipCache(type, itemKey, membership);
        });
      } catch (_err) {
        // Keep opening fast even if cache warm-up fails.
      } finally {
        homeItemMenuCache.primingScopes.delete(scopeKey);
      }
    }

    async function primeAllHomeMenuCaches() {
      const types = [...HOME_ACTIVE_MEDIA_TYPES];
      await Promise.all(types.map((type) => primeHomeMenuCachesForType(type)));
    }

    function scheduleHomeMenuCachePrime(delayMs = HOME_MENU_PRIME_IDLE_DELAY_MS) {
      if (!homeCurrentUser?.id || homeMenuPrimeScheduled) return;
      homeMenuPrimeScheduled = true;
      const run = () => {
        void primeAllHomeMenuCaches().finally(() => {
          homeMenuPrimeScheduled = false;
        });
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
          setTimeout(run, delayMs);
        }, { timeout: Math.max(1200, delayMs + 700) });
      } else {
        setTimeout(run, delayMs);
      }
    }

    function playHomeMenuModalFlyUp(modal) {
      if (!modal) return;
      const content = modal.querySelector('.menu-modal-content');
      if (!content) return;
      content.classList.remove('menu-modal-fly-up');
      // Restart animation for repeated opens.
      // eslint-disable-next-line no-unused-expressions
      content.offsetWidth;
      content.classList.add('menu-modal-fly-up');
    }

    function syncMenuModalViewport(modal) {
      if (!modal || !modal.classList.contains('active')) return;
      const visual = window.visualViewport;
      const top = (visual?.offsetTop || 0) + window.scrollY;
      const left = (visual?.offsetLeft || 0) + window.scrollX;
      const width = Math.max(0, Math.ceil(visual?.width || window.innerWidth || document.documentElement.clientWidth || 0));
      const height = Math.max(0, Math.ceil(visual?.height || window.innerHeight || document.documentElement.clientHeight || 0));
      modal.style.top = `${top}px`;
      modal.style.left = `${left}px`;
      modal.style.width = `${width}px`;
      modal.style.height = `${height}px`;
    }

    function syncActiveMenuModalViewports() {
      syncMenuModalViewport(document.getElementById('itemMenuModal'));
      syncMenuModalViewport(document.getElementById('createListModal'));
    }

    function syncMenuModalBodyLock() {
      const itemModal = document.getElementById('itemMenuModal');
      const createModal = document.getElementById('createListModal');
      const anyActive = !!(itemModal?.classList.contains('active') || createModal?.classList.contains('active'));
      const onboardingActive = !!document.getElementById('homeOnboardingOverlay')?.classList.contains('active');
      if (anyActive) {
        syncActiveMenuModalViewports();
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else if (!onboardingActive) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }

    function closeItemMenuModal() {
      const itemModal = document.getElementById('itemMenuModal');
      if (itemModal) {
        itemModal.classList.remove('active');
        itemModal.setAttribute('aria-hidden', 'true');
      }
      homeItemMenuState.pendingQuickKeys = new Set();
      syncMenuModalBodyLock();
    }

    function closeCreateListModal() {
      const createModal = document.getElementById('createListModal');
      if (createModal) {
        createModal.classList.remove('active');
        createModal.setAttribute('aria-hidden', 'true');
      }
      syncMenuModalBodyLock();
    }

    function closeAllItemMenuModals() {
      closeItemMenuModal();
      closeCreateListModal();
    }

    function buildItemMenuPayload() {
      const item = homeItemMenuState.currentItem;
      if (!item) return null;
      return {
        mediaType: item.mediaType,
        itemId: item.itemId,
        title: item.title,
        subtitle: item.subtitle,
        image: item.image
      };
    }

    function buildCustomListItemPayloadForMenu() {
      const item = homeItemMenuState.currentItem;
      if (!item) return null;
      const mediaType = String(item.mediaType || '').toLowerCase();
      if (mediaType === 'book') {
        return {
          id: item.itemId,
          title: item.title || '',
          authors: item.subtitle || '',
          thumbnail: item.image || ''
        };
      }
      if (mediaType === 'music') {
        return {
          id: item.itemId,
          name: item.title || '',
          artists: item.subtitle || '',
          image: item.image || ''
        };
      }
      if (mediaType === 'travel') {
        return {
          id: String(item.itemId || '').toUpperCase(),
          name: item.title || '',
          region: item.subtitle || '',
          image: item.image || ''
        };
      }
      return null;
    }

    function getQuickRowsForMenu(mediaType) {
      const cfg = getMediaListConfig(mediaType);
      return Array.isArray(cfg?.rows) ? cfg.rows : [];
    }

    function renderItemMenuQuickLists() {
      const quickContainer = document.getElementById('menuQuickLists');
      if (!quickContainer) return;
      if (!homeItemMenuState.quickRows.length) {
        quickContainer.innerHTML = '<div class="menu-empty">Lists are not available for this item.</div>';
        return;
      }
      quickContainer.innerHTML = homeItemMenuState.quickRows.map((row) => {
        const isActive = !!homeItemMenuState.quickStatus[row.key];
        const isBusy = homeItemMenuState.pendingQuickKeys.has(row.key);
        return `
          <div class="menu-quick-item ${isActive ? 'active' : ''}" data-quick-key="${row.key}" aria-busy="${isBusy ? 'true' : 'false'}">
            <div class="menu-quick-left">
              <i class="${row.icon}"></i>
              <span>${row.label}</span>
            </div>
            <span class="menu-quick-state">${isActive ? 'Saved' : 'Add'}</span>
          </div>
        `;
      }).join('');

      quickContainer.querySelectorAll('.menu-quick-item').forEach((node) => {
        node.addEventListener('click', async () => {
          const key = node.getAttribute('data-quick-key');
          if (!key) return;
          if (homeItemMenuState.pendingQuickKeys.has(key)) return;
          const payload = buildItemMenuPayload();
          if (!payload) return;
          const previousSaved = !!homeItemMenuState.quickStatus[key];
          const nextSaved = !previousSaved;
          const quickRows = homeItemMenuState.quickRows;
          homeItemMenuState.pendingQuickKeys.add(key);
          homeItemMenuState.quickStatus[key] = nextSaved;
          writeHomeMenuQuickStatusCache(payload.mediaType, payload.itemId, homeItemMenuState.quickStatus, quickRows);
          renderItemMenuQuickLists();
          const saveResult = await saveToListFromHome({ ...payload, listType: key, nextSaved });
          if (!saveResult?.ok) {
            homeItemMenuState.quickStatus[key] = previousSaved;
          } else if (typeof saveResult.saved === 'boolean') {
            homeItemMenuState.quickStatus[key] = saveResult.saved;
          }
          writeHomeMenuQuickStatusCache(payload.mediaType, payload.itemId, homeItemMenuState.quickStatus, quickRows);
          homeItemMenuState.pendingQuickKeys.delete(key);
          renderItemMenuQuickLists();
        });
      });
    }

    function renderItemMenuCustomLists() {
      const customContainer = document.getElementById('menuCustomLists');
      if (!customContainer) return;
      if (!homeCurrentUser?.id) {
        customContainer.innerHTML = '<div class="menu-empty">Sign in to use custom lists.</div>';
        return;
      }
      if (!homeItemMenuState.customLists.length) {
        customContainer.innerHTML = '<div class="menu-empty">No custom lists yet. Create one.</div>';
        return;
      }

      customContainer.innerHTML = homeItemMenuState.customLists.map((list) => {
        const isActive = homeItemMenuState.selectedCustomLists.has(list.id);
        return `
          <div class="menu-custom-item ${isActive ? 'active' : ''}" data-list-id="${list.id}">
            <div class="menu-custom-left">
              ${window.ListUtils ? ListUtils.renderListIcon(list.icon, 'fas fa-list') : '<i class="fas fa-list"></i>'}
              <span>${escapeHtml(list.title || 'Custom List')}</span>
            </div>
            <span class="menu-custom-state">${isActive ? 'Saved' : 'Add'}</span>
          </div>
        `;
      }).join('');

      customContainer.querySelectorAll('.menu-custom-item').forEach((node) => {
        node.addEventListener('click', async () => {
          const listId = node.getAttribute('data-list-id');
          if (!listId) return;
          await toggleMenuCustomList(listId);
        });
      });
    }

    async function refreshItemMenuQuickStatus() {
      const item = homeItemMenuState.currentItem;
      if (!item) return;
      const listKeys = homeItemMenuState.quickRows.map((row) => row.key).filter(Boolean);
      homeItemMenuState.quickStatus = await getHomeListStatusMap(item.mediaType, item.itemId, listKeys);
      writeHomeMenuQuickStatusCache(item.mediaType, item.itemId, homeItemMenuState.quickStatus, homeItemMenuState.quickRows);
    }

    async function loadItemMenuData() {
      const item = homeItemMenuState.currentItem;
      if (!item) return;
      homeItemMenuState.quickRows = getQuickRowsForMenu(item.mediaType);
      homeItemMenuState.pendingQuickKeys = new Set();
      homeItemMenuState.quickStatus = readHomeMenuQuickStatusCache(
        item.mediaType,
        item.itemId,
        homeItemMenuState.quickRows
      );
      if (!homeItemMenuState.customLists.length) {
        homeItemMenuState.customLists = readHomeMenuCustomListsCache(item.mediaType);
      }
      if (!homeItemMenuState.selectedCustomLists.size) {
        homeItemMenuState.selectedCustomLists = readHomeMenuMembershipCache(item.mediaType, item.itemId);
      }
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();

      const cfg = getHomeListConfig(item.mediaType);
      if (!homeCurrentUser?.id || !cfg || !window.ListUtils) {
        homeItemMenuState.customLists = [];
        homeItemMenuState.selectedCustomLists = new Set();
        renderItemMenuQuickLists();
        renderItemMenuCustomLists();
        return;
      }

      const client = await ensureHomeSupabase();
      if (!client) return;
      const [statusMap, customLists] = await Promise.all([
        getHomeListStatusMap(item.mediaType, item.itemId, homeItemMenuState.quickRows.map((row) => row.key).filter(Boolean)),
        ListUtils.loadCustomLists(client, homeCurrentUser.id, item.mediaType)
      ]);
      homeItemMenuState.quickStatus = statusMap;
      writeHomeMenuQuickStatusCache(item.mediaType, item.itemId, homeItemMenuState.quickStatus, homeItemMenuState.quickRows);
      homeItemMenuState.customLists = Array.isArray(customLists) ? customLists : [];
      writeHomeMenuCustomListsCache(item.mediaType, homeItemMenuState.customLists);
      const listIds = homeItemMenuState.customLists.map((l) => l.id).filter(Boolean);
      homeItemMenuState.selectedCustomLists = await ListUtils.loadCustomListMembership(
        client,
        homeCurrentUser.id,
        item.mediaType,
        item.itemId,
        listIds
      );
      writeHomeMenuMembershipCache(item.mediaType, item.itemId, homeItemMenuState.selectedCustomLists);
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();
    }

    async function openItemMenu(card, triggerBtn) {
      if (!card) return;
      const mediaType = String(card.getAttribute('data-media-type') || '').toLowerCase();
      const itemIdRaw = card.getAttribute('data-item-id');
      if (!supportsHomeLists(mediaType) || !itemIdRaw) return;
      const normalizedItemId = window.ListUtils && typeof ListUtils.normalizeQueryableItemId === 'function'
        ? ListUtils.normalizeQueryableItemId(mediaType, itemIdRaw)
        : coerceHomeItemId(mediaType, itemIdRaw);
      if (normalizedItemId === null || normalizedItemId === undefined || String(normalizedItemId).trim() === '') return;

      homeItemMenuState.currentItem = {
        mediaType,
        itemId: normalizedItemId,
        title: card.getAttribute('data-title') || '',
        subtitle: card.getAttribute('data-subtitle') || '',
        image: card.getAttribute('data-list-image') || card.getAttribute('data-image') || ''
      };
      homeItemMenuState.quickRows = getQuickRowsForMenu(mediaType);
      homeItemMenuState.quickStatus = readHomeMenuQuickStatusCache(
        mediaType,
        homeItemMenuState.currentItem.itemId,
        homeItemMenuState.quickRows
      );
      homeItemMenuState.pendingQuickKeys = new Set();
      homeItemMenuState.customLists = readHomeMenuCustomListsCache(mediaType);
      homeItemMenuState.selectedCustomLists = readHomeMenuMembershipCache(
        mediaType,
        homeItemMenuState.currentItem.itemId
      );

      const titleEl = document.getElementById('menuModalTitle');
      if (titleEl) titleEl.textContent = homeItemMenuState.currentItem.title || 'Add to List';
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();

      const itemModal = document.getElementById('itemMenuModal');
      if (itemModal) {
        // Center the modal in the viewport using absolute positioning
        itemModal.style.top = `${window.scrollY}px`;
        itemModal.style.left = `${window.scrollX}px`;
        itemModal.classList.add('active');
        itemModal.setAttribute('aria-hidden', 'false');
        syncMenuModalViewport(itemModal);
        // Center the modal content
        const content = itemModal.querySelector('.menu-modal-content');
        if (content) {
          content.style.position = 'absolute';
          content.style.top = '50%';
          content.style.left = '50%';
          content.style.transform = 'translate(-50%, -50%)';
        }
        playHomeMenuModalFlyUp(itemModal);
      }
      syncMenuModalBodyLock();
      void primeHomeMenuCachesForType(mediaType);
      void loadItemMenuData();
    }

    window.openItemMenu = openItemMenu;

    async function toggleMenuCustomList(listId) {
      const item = homeItemMenuState.currentItem;
      if (!item || !homeCurrentUser?.id || !window.ListUtils) {
        window.location.href = 'login.html';
        return;
      }
      const client = await ensureHomeSupabase();
      if (!client) return;
      const next = new Set(homeItemMenuState.selectedCustomLists);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      const previous = homeItemMenuState.selectedCustomLists;
      homeItemMenuState.selectedCustomLists = next;
      writeHomeMenuMembershipCache(item.mediaType, item.itemId, homeItemMenuState.selectedCustomLists);
      renderItemMenuCustomLists();
      try {
        await ListUtils.saveCustomListChanges(
          client,
          homeCurrentUser.id,
          item.mediaType,
          item.itemId,
          [...next],
          buildCustomListItemPayloadForMenu()
        );
      } catch (_err) {
        homeItemMenuState.selectedCustomLists = previous;
        writeHomeMenuMembershipCache(item.mediaType, item.itemId, homeItemMenuState.selectedCustomLists);
        renderItemMenuCustomLists();
        showHomeToast('Could not update custom list', true);
      }
    }

    function openCreateListModalFromMenu() {
      const item = homeItemMenuState.currentItem;
      if (!item || !homeCurrentUser?.id) {
        window.location.href = 'login.html';
        return;
      }
      const createModal = document.getElementById('createListModal');
      const itemModal = document.getElementById('itemMenuModal');
      const nameInput = document.getElementById('newListNameInput');
      if (nameInput) nameInput.value = '';
      const options = document.querySelectorAll('.menu-icon-option');
      homeItemMenuState.selectedIcon = 'fas fa-list';
      options.forEach((btn) => {
        const icon = btn.getAttribute('data-icon') || '';
        btn.classList.toggle('selected', icon === homeItemMenuState.selectedIcon);
      });
      if (itemModal) itemModal.classList.remove('active');
      if (createModal) {
        createModal.classList.add('active');
        createModal.setAttribute('aria-hidden', 'false');
        if (window.ListUtils) ListUtils.resetTierCreateState(createModal);
        syncMenuModalViewport(createModal);
        playHomeMenuModalFlyUp(createModal);
      }
      syncMenuModalBodyLock();
    }

    async function saveNewCustomListFromMenu() {
      const item = homeItemMenuState.currentItem;
      if (!item || !window.ListUtils || !homeCurrentUser?.id) {
        window.location.href = 'login.html';
        return;
      }
      const nameInput = document.getElementById('newListNameInput');
      const title = String(nameInput?.value || '').trim();
      if (!title) {
        showHomeToast('Please enter a list name', true);
        return;
      }
      const createModal = document.getElementById('createListModal');
      const tierState = window.ListUtils && createModal
        ? ListUtils.readTierCreateState(createModal)
        : { listKind: 'standard', maxRank: null };
      const client = await ensureHomeSupabase();
      if (!client) return;
      const created = await ListUtils.createCustomList(client, homeCurrentUser.id, item.mediaType, {
        title,
        icon: homeItemMenuState.selectedIcon || 'fas fa-list',
        listKind: tierState.listKind,
        maxRank: tierState.maxRank
      });
      if (!created?.id) {
        showHomeToast('Could not create list', true);
        return;
      }
      if (window.ListUtils && createModal) ListUtils.resetTierCreateState(createModal);
      homeItemMenuState.customLists = [
        created,
        ...homeItemMenuState.customLists.filter((list) => String(list.id) !== String(created.id))
      ];
      homeItemMenuState.selectedCustomLists.add(created.id);
      writeHomeMenuCustomListsCache(item.mediaType, homeItemMenuState.customLists);
      writeHomeMenuMembershipCache(item.mediaType, item.itemId, homeItemMenuState.selectedCustomLists);
      closeCreateListModal();
      const itemModal = document.getElementById('itemMenuModal');
      if (itemModal) {
        itemModal.classList.add('active');
        itemModal.setAttribute('aria-hidden', 'false');
        syncMenuModalViewport(itemModal);
        playHomeMenuModalFlyUp(itemModal);
      }
      syncMenuModalBodyLock();
      await loadItemMenuData();
      showHomeToast('List created');
    }

    function renderHomeListsModal() {
      const container = document.getElementById('homeListsContainer');
      if (!container) return;
      container.innerHTML = '';
      if (!homeCustomListState.customLists.length) {
        container.innerHTML = '<div class="chip">No custom lists yet.</div>';
        return;
      }
      homeCustomListState.customLists.forEach(list => {
        const item = document.createElement('div');
        const isActive = homeCustomListState.selectedLists.has(list.id);
        item.className = `modal-list-item${isActive ? ' active' : ''}`;
        item.innerHTML = `
          <span>${window.ListUtils ? ListUtils.renderListIcon(list.icon, homeCustomListState.selectedIcon) : ''} ${list.title}</span>
          <span class="modal-list-actions">
            <span>${isActive ? 'Saved' : 'Add'}</span>
            <button class="list-edit-btn" aria-label="Rename list"><i class="fas fa-pen"></i></button>
          </span>
        `;
        item.onclick = () => {
          if (homeCustomListState.selectedLists.has(list.id)) {
            homeCustomListState.selectedLists.delete(list.id);
          } else {
            homeCustomListState.selectedLists.add(list.id);
          }
          const active = homeCustomListState.selectedLists.has(list.id);
          item.classList.toggle('active', active);
          const label = item.querySelector('.modal-list-actions span');
          if (label) label.textContent = active ? 'Saved' : 'Add';
        };
        const editBtn = item.querySelector('.list-edit-btn');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            renameHomeList(list.id, list.title);
          };
        }
        container.appendChild(item);
      });
    }

    function setHomeModalTitle(mediaType) {
      const title = document.getElementById('homeListsTitle');
      if (!title) return;
      const type = String(mediaType || '').toLowerCase();
      const map = {
        movie: 'Custom Movie Lists',
        tv: 'Custom TV Lists',
        anime: 'Custom Anime Lists',
        game: 'Custom Game Lists',
        book: 'Custom Book Lists',
        music: 'Custom Music Lists',
        travel: 'Custom Travel Lists',
        restaurant: 'Custom Restaurant Lists'
      };
      title.textContent = map[type] || 'Custom Lists';
    }

    function syncHomeIconSelection(nextIcon) {
      const options = document.querySelectorAll('#homeListIconOptions .icon-option');
      let matched = false;
      options.forEach(btn => {
        const icon = btn.getAttribute('data-icon');
        const selected = icon === nextIcon;
        btn.classList.toggle('selected', selected);
        if (selected) matched = true;
      });
      if (!matched && options[0]) {
        options[0].classList.add('selected');
        homeCustomListState.selectedIcon = options[0].getAttribute('data-icon') || 'fas fa-list';
      }
    }

    async function openHomeListsModal(item) {
      if (!homeCurrentUser?.id) {
        window.location.href = 'login.html';
        return;
      }
      const cfg = getHomeListConfig(item.mediaType);
      if (!cfg) return;
      const client = await ensureHomeSupabase();
      if (!client) return;
      homeCustomListState.mediaType = String(item.mediaType || '').toLowerCase();
      homeCustomListState.itemId = coerceHomeItemId(homeCustomListState.mediaType, item.itemId);
      homeCustomListState.title = item.title || '';
      homeCustomListState.subtitle = item.subtitle || '';
      homeCustomListState.image = item.image || '';
      homeCustomListState.selectedIcon = cfg.defaultIcon || 'fas fa-list';
      syncHomeIconSelection(homeCustomListState.selectedIcon);
      setHomeModalTitle(homeCustomListState.mediaType);

      const modal = document.getElementById('homeListsModal');
      const container = document.getElementById('homeListsContainer');
      if (!modal || !container) return;
      container.innerHTML = '<div class="chip">Loading...</div>';
      homeCustomListState.customLists = window.ListUtils
        ? await ListUtils.loadCustomLists(client, homeCurrentUser.id, homeCustomListState.mediaType)
        : [];
      const listIds = homeCustomListState.customLists.map(l => l.id);
      homeCustomListState.selectedLists = window.ListUtils
        ? await ListUtils.loadCustomListMembership(
          client,
          homeCurrentUser.id,
          homeCustomListState.mediaType,
          homeCustomListState.itemId,
          listIds
        )
        : new Set();
      renderHomeListsModal();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeHomeListsModal() {
      const modal = document.getElementById('homeListsModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
      homeCustomListState.mediaType = null;
      homeCustomListState.itemId = null;
      homeCustomListState.customLists = [];
      homeCustomListState.selectedLists = new Set();
    }

    async function saveHomeListChanges() {
      const cfg = getHomeListConfig(homeCustomListState.mediaType);
      const client = await ensureHomeSupabase();
      if (!cfg || !client || !homeCurrentUser?.id || !homeCustomListState.itemId) return;
      if (window.ListUtils) {
        const mediaType = String(homeCustomListState.mediaType || '').toLowerCase();
        let itemPayload = null;
        if (mediaType === 'book') {
          itemPayload = {
            id: homeCustomListState.itemId,
            title: homeCustomListState.title,
            authors: homeCustomListState.subtitle,
            thumbnail: homeCustomListState.image
          };
        } else if (mediaType === 'music') {
          itemPayload = {
            id: homeCustomListState.itemId,
            name: homeCustomListState.title,
            artists: homeCustomListState.subtitle,
            image: homeCustomListState.image
          };
        }
        await ListUtils.saveCustomListChanges(
          client,
          homeCurrentUser.id,
          homeCustomListState.mediaType,
          homeCustomListState.itemId,
          [...homeCustomListState.selectedLists],
          itemPayload
        );
      }
      showHomeToast('Lists updated');
      closeHomeListsModal();
    }

    async function createHomeList() {
      const input = document.getElementById('newHomeListName');
      const client = await ensureHomeSupabase();
      if (!input || !client || !homeCurrentUser?.id) return;
      const title = input.value.trim();
      if (!title) return;
      const exists = homeCustomListState.customLists.some(
        list => String(list.title || '').trim().toLowerCase() === title.toLowerCase()
      );
      if (exists) {
        showHomeToast('List already exists', true);
        return;
      }
      const homeListsModal = document.getElementById('homeListsModal');
      const tierState = window.ListUtils && homeListsModal
        ? ListUtils.readTierCreateState(homeListsModal)
        : { listKind: 'standard', maxRank: null };
      const data = window.ListUtils
        ? await ListUtils.createCustomList(
          client,
          homeCurrentUser.id,
          homeCustomListState.mediaType,
          {
            title,
            icon: homeCustomListState.selectedIcon,
            listKind: tierState.listKind,
            maxRank: tierState.maxRank
          }
        )
        : null;
      if (!data) {
        showHomeToast('Could not create list', true);
        return;
      }
      input.value = '';
      if (window.ListUtils && homeListsModal) ListUtils.resetTierCreateState(homeListsModal);
      homeCustomListState.customLists.unshift(data);
      renderHomeListsModal();
    }

    async function renameHomeList(listId, currentTitle) {
      const nextTitle = prompt('Rename list', currentTitle || '');
      if (!nextTitle || !nextTitle.trim()) return;
      const client = await ensureHomeSupabase();
      if (!client || !homeCurrentUser?.id) return;
      const ok = window.ListUtils
        ? await ListUtils.renameCustomList(
          client,
          homeCurrentUser.id,
          homeCustomListState.mediaType,
          listId,
          nextTitle.trim()
        )
        : false;
      if (!ok) {
        showHomeToast('Could not rename list', true);
        return;
      }
      homeCustomListState.customLists = homeCustomListState.customLists.map(list =>
        list.id === listId ? { ...list, title: nextTitle.trim() } : list
      );
      renderHomeListsModal();
    }

    function setStatus(_text, _isError) {
      if (!statusEl) return;
      statusEl.textContent = '';
    }

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffleArray(input) {
      const arr = [...input];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function isHomeSlowNetwork() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return false;
      if (connection.saveData) return true;
      const effectiveType = String(connection.effectiveType || '').toLowerCase();
      return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
    }

    function getHomePreloadPerChannelBudget() {
      if (isHomeSlowNetwork()) return Math.max(1, HOME_PRELOAD_PER_CHANNEL - 1);
      return HOME_PRELOAD_PER_CHANNEL;
    }

    function getHomeSpotlightPreloadBudget() {
      if (isHomeSlowNetwork()) return Math.max(1, HOME_PRELOAD_SPOTLIGHT_COUNT - 1);
      return HOME_PRELOAD_SPOTLIGHT_COUNT;
    }

    function resetHomeImageRequestBudget() {
      homeEagerImageBudgetUsed = 0;
      homeHighPriorityImageBudgetUsed = 0;
    }

    function consumeHomeImageRequestBudget() {
      const onSlowNetwork = isHomeSlowNetwork();
      const eagerBudget = onSlowNetwork
        ? Math.max(2, HOME_EAGER_IMAGE_COUNT - 3)
        : HOME_EAGER_IMAGE_COUNT;
      const priorityBudget = onSlowNetwork
        ? Math.max(1, HOME_HIGH_PRIORITY_IMAGE_COUNT - 2)
        : HOME_HIGH_PRIORITY_IMAGE_COUNT;
      const useEager = homeEagerImageBudgetUsed < eagerBudget;
      const useHighPriority = homeHighPriorityImageBudgetUsed < priorityBudget;
      if (useEager) homeEagerImageBudgetUsed += 1;
      if (useHighPriority) homeHighPriorityImageBudgetUsed += 1;
      return {
        loading: useEager ? 'eager' : 'lazy',
        priority: useHighPriority ? 'high' : 'low'
      };
    }

    function hasGenreId(item, id) {
      const genreIds = Array.isArray(item?.genre_ids) ? item.genre_ids : [];
      return genreIds.map((entry) => Number(entry)).includes(Number(id));
    }

    function isLikelyAnimeMovieEntry(item) {
      const lang = String(item?.original_language || '').trim().toLowerCase();
      return hasGenreId(item, 16) && lang === 'ja';
    }

    function isLikelyAnimeTvEntry(item) {
      const lang = String(item?.original_language || '').trim().toLowerCase();
      const originCountry = Array.isArray(item?.origin_country)
        ? item.origin_country.map((entry) => String(entry || '').trim().toUpperCase())
        : [];
      const fromJapan = lang === 'ja' || originCountry.includes('JP');
      return hasGenreId(item, 16) && fromJapan;
    }

    function preloadImage(url) {
      const src = String(url || '').trim();
      if (!src) return;
      if (homePreloadedImageSet.has(src)) return;
      homePreloadedImageSet.add(src);
      if (homePreloadedImageSet.size > 1200) {
        const oldest = homePreloadedImageSet.values().next().value;
        if (oldest) homePreloadedImageSet.delete(oldest);
      }
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'lazy';
      img.fetchPriority = 'low';
      img.src = src;
    }

    function warmHomeFeedImages(feedMap) {
      const perChannelBudget = getHomePreloadPerChannelBudget();
      const groups = Object.values(feedMap || {});
      groups.forEach((items) => {
        if (!Array.isArray(items)) return;
        items.slice(0, perChannelBudget).forEach((item) => {
          preloadImage(item.image);
          preloadImage(item.backgroundImage || item.spotlightImage);
        });
      });
    }

    function warmSpotlightImages(items) {
      if (!Array.isArray(items)) return;
      const spotlightBudget = getHomeSpotlightPreloadBudget();
      items.slice(0, spotlightBudget).forEach((item) => {
        preloadImage(item.spotlightImage || item.backgroundImage || item.image);
        preloadImage(item.spotlightMediaImage || item.image || item.spotlightImage || item.backgroundImage);
      });
    }

    function getBookCoverFallback(item) {
      return '';
    }

    function setSpotlightImageWithFallback(imgEl, sources, token) {
      if (!imgEl) return;
      if (imgEl.__homeSpotlightOnLoad) {
        imgEl.removeEventListener('load', imgEl.__homeSpotlightOnLoad);
      }
      if (imgEl.__homeSpotlightOnError) {
        imgEl.removeEventListener('error', imgEl.__homeSpotlightOnError);
      }

      const candidates = [...new Set((sources || [])
        .map((value) => String(value || '').trim())
        .filter(Boolean))];

      if (!candidates.length) {
        imgEl.removeAttribute('src');
        return;
      }

      let pointer = 0;
      const onLoad = () => {
        if (token !== homeSpotlightImageToken) return;
        imgEl.removeAttribute('data-loading');
      };
      const onError = () => {
        if (token !== homeSpotlightImageToken) return;
        pointer += 1;
        if (pointer < candidates.length) {
          imgEl.src = candidates[pointer];
          return;
        }
        imgEl.removeAttribute('src');
        imgEl.removeAttribute('data-loading');
      };

      imgEl.__homeSpotlightOnLoad = onLoad;
      imgEl.__homeSpotlightOnError = onError;
      imgEl.addEventListener('load', onLoad);
      imgEl.addEventListener('error', onError);
      imgEl.setAttribute('data-loading', '1');
      imgEl.src = candidates[pointer];
    }

    function buildInstantFallbackFeed() {
      const fallbackImage = HOME_LOCAL_FALLBACK_IMAGE;
      const makeSeedItems = (mediaType, titles, href) => titles.map((title, index) => ({
        mediaType,
        itemId: `seed-${mediaType}-${index + 1}`,
        title,
        subtitle: 'Loading live picks',
        image: fallbackImage,
        backgroundImage: fallbackImage,
        spotlightImage: fallbackImage,
        spotlightMediaImage: fallbackImage,
        spotlightMediaFit: 'contain',
        spotlightMediaShape: 'poster',
        fallbackImage,
        href,
        isPlaceholder: true
      }));

      return {
        ...(ENABLE_RESTAURANTS ? {
          restaurant: FALLBACK_RESTAURANTS.map((r, index) => ({
            mediaType: 'restaurant',
            itemId: `seed-restaurant-${index + 1}`,
            title: r.name,
            subtitle: `${r.category} | ${r.rating}/5`,
            image: fallbackImage,
            logo: '',
            backgroundImage: fallbackImage,
            spotlightImage: fallbackImage,
            spotlightMediaImage: fallbackImage,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            href: 'restraunts.html',
            fallbackImage,
            isPlaceholder: true
          }))
        } : {}),
        movie: makeSeedItems('movie', ['Popular Movies', 'Now in Theaters', 'Award Winners', 'Critics Picks', 'Weekend Watch'], 'movies.html'),
        tv: makeSeedItems('tv', ['Top TV Shows', 'Binge Picks', 'New Seasons', 'Global Hits', 'Fan Favorites'], 'tvshows.html'),
        anime: makeSeedItems('anime', ['Top Anime', 'Fan Favorites', 'Must Watch Series', 'Shonen Hits', 'Classic Anime'], 'animes.html'),
        ...(ENABLE_GAMES ? {
          game: makeSeedItems('game', ['Top Games', 'New Releases', 'Community Picks', 'Multiplayer Hits', 'Story Games'], 'games.html')
        } : {}),
        music: makeSeedItems('music', ['Global Hits', 'Viral Tracks', 'Fresh Releases', 'Chill Vibes', 'Late Night Mix'], 'music.html'),
        book: makeSeedItems('book', ['Bestselling Books', 'Popular Fiction', 'Book Club Picks', 'Page-Turners', 'Must Read Stories'], 'books.html'),
        travel: makeSeedItems('travel', ['Top Countries', 'Popular Destinations', 'City Break Ideas', 'Bucket List Places', 'Trending Travel Spots'], 'travel.html')
      };
    }

    function getHomeChannels() {
      return [
        ...(ENABLE_RESTAURANTS ? [{ key: 'restaurant', railId: 'restaurantsRail', loader: loadRestaurants, opts: { mediaType: 'restaurant', landscape: true, restaurantComposite: true } }] : []),
        { key: 'movie', railId: 'moviesRail', loader: loadMovies, opts: { mediaType: 'movie' } },
        { key: 'tv', railId: 'tvRail', loader: loadTv, opts: { mediaType: 'tv' } },
        { key: 'anime', railId: 'animeRail', loader: loadAnime, opts: { mediaType: 'anime' } },
        ...(ENABLE_GAMES ? [{ key: 'game', railId: 'gamesRail', loader: loadGames, opts: { mediaType: 'game' }, timeoutMs: 5600 }] : []),
        { key: 'book', railId: 'booksRail', loader: loadBooks, opts: { mediaType: 'book' }, timeoutMs: 8500 },
        { key: 'music', railId: 'musicRail', loader: loadMusic, opts: { mediaType: 'music' }, timeoutMs: 9000 },
        { key: 'travel', railId: 'travelRail', loader: loadTravel, opts: { mediaType: 'travel' }, timeoutMs: 6800 }
      ];
    }

    function normalizeHomeFeedMap(feedMap) {
      if (!feedMap || typeof feedMap !== 'object') return null;
      const channels = getHomeChannels();
      const normalized = {};
      channels.forEach((channel) => {
        const channelItems = Array.isArray(feedMap[channel.key])
          ? feedMap[channel.key].filter((item) => item && typeof item === 'object')
          : [];
        normalized[channel.key] = filterHomeSafeItems(channelItems);
      });
      return normalized;
    }

    function countActiveHomeChannels(feedMap) {
      const normalized = normalizeHomeFeedMap(feedMap);
      if (!normalized) return 0;
      return getHomeChannels().reduce((count, channel) => {
        return count + (Array.isArray(normalized[channel.key]) && normalized[channel.key].length ? 1 : 0);
      }, 0);
    }

    function readPrecomputedHomeFeedCache() {
      try {
        const raw = localStorage.getItem(HOME_PRECOMPUTED_FEED_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        if (!savedAt || (Date.now() - savedAt) > HOME_PRECOMPUTED_FEED_MAX_AGE_MS) return null;
        const expiresAt = Number(parsed?.expiresAt || 0);
        if (expiresAt && expiresAt < Date.now()) return null;
        return normalizeHomeFeedMap(parsed?.feed);
      } catch (_err) {
        return null;
      }
    }

    function writePrecomputedHomeFeedCache(feedMap, options = {}) {
      try {
        const normalized = normalizeHomeFeedMap(feedMap);
        if (!normalized) return;
        const savedAt = Number(options.savedAt || Date.now());
        const expiresAt = Number(options.expiresAt || (savedAt + HOME_PRECOMPUTED_FEED_MAX_AGE_MS));
        localStorage.setItem(HOME_PRECOMPUTED_FEED_CACHE_KEY, JSON.stringify({
          savedAt,
          expiresAt,
          feed: normalized
        }));
      } catch (_err) {}
    }

    async function fetchPrecomputedHomeFeedFromSupabase() {
      const client = await ensureHomeSupabase();
      if (!client) return null;

      const query = client
        .from(HOME_PRECOMPUTE_TABLE)
        .select('feed_payload, generated_at, expires_at')
        .eq('cache_key', 'global')
        .maybeSingle();

      const result = await withTimeout(query, HOME_PRECOMPUTED_FETCH_TIMEOUT_MS, null);
      if (!result || result.error || !result.data) return null;

      const expiresAtMs = result.data.expires_at ? new Date(result.data.expires_at).getTime() : 0;
      if (Number.isFinite(expiresAtMs) && expiresAtMs > 0 && expiresAtMs < Date.now()) {
        return null;
      }

      const feed = normalizeHomeFeedMap(result.data.feed_payload);
      if (!feed || countActiveHomeChannels(feed) === 0) return null;

      const generatedAtMs = result.data.generated_at ? new Date(result.data.generated_at).getTime() : Date.now();
      writePrecomputedHomeFeedCache(feed, {
        savedAt: generatedAtMs,
        expiresAt: expiresAtMs || (generatedAtMs + HOME_PRECOMPUTED_FEED_MAX_AGE_MS)
      });
      return feed;
    }

    async function loadPrecomputedHomeFeed() {
      const cached = readPrecomputedHomeFeedCache();
      if (cached && countActiveHomeChannels(cached) > 0) return cached;
      return fetchPrecomputedHomeFeedFromSupabase();
    }

    function readHomeFeedCache() {
      try {
        const raw = localStorage.getItem(HOME_FEED_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        if (!savedAt || (Date.now() - savedAt) > HOME_FEED_CACHE_MAX_AGE_MS) return null;
        const feed = parsed?.feed;
        if (!feed || typeof feed !== 'object') return null;
        return normalizeHomeFeedMap(feed);
      } catch (_err) {
        return null;
      }
    }

    function writeHomeFeedCache(feedMap) {
      try {
        const normalizedFeed = normalizeHomeFeedMap(feedMap);
        if (!normalizedFeed) return;
        const channels = getHomeChannels();
        const payload = {};
        channels.forEach((channel) => {
          payload[channel.key] = Array.isArray(normalizedFeed?.[channel.key]) ? normalizedFeed[channel.key] : [];
        });
        localStorage.setItem(HOME_FEED_CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          feed: payload
        }));
      } catch (_err) {}
    }

    async function loadHomeChannelWithTimeout(loader, timeoutMs = HOME_CHANNEL_TIMEOUT_MS) {
      let timer = null;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      try {
        const loaderPromise = Promise.resolve().then(() => loader(controller ? controller.signal : undefined));
        const value = await Promise.race([
          loaderPromise,
          new Promise((resolve) => {
            timer = setTimeout(() => {
              if (controller) controller.abort();
              resolve([]);
            }, timeoutMs);
          })
        ]);
        return Array.isArray(value) ? value : [];
      } catch (_err) {
        return [];
      } finally {
        if (controller) controller.abort();
        if (timer) clearTimeout(timer);
      }
    }

    function applyHomeFeedMap(feedMap) {
      const normalizedFeed = normalizeHomeFeedMap(feedMap) || Object.fromEntries(
        getHomeChannels().map((channel) => [channel.key, []])
      );
      const channels = getHomeChannels();
      resetHomeImageRequestBudget();
      warmHomeFeedImages(normalizedFeed);
      let activeChannels = 0;
      channels.forEach((channel) => {
        const items = Array.isArray(normalizedFeed?.[channel.key]) ? normalizedFeed[channel.key] : [];
        homeFeedState[channel.key] = items;
        renderRail(channel.railId, items, channel.opts);
        if (items.length) activeChannels += 1;
      });

      const scoredPool = buildScoredDiscoveryPool(homeFeedState);
      const unified = buildUnifiedFeed(scoredPool, HOME_UNIFIED_TARGET_ITEMS);
      renderRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
      void refreshHomeNewReleases(homeFeedState);
      void refreshMixedForYouFromActivity(homeFeedState, scoredPool);
      hydrateSpotlightFromPool(scoredPool);

      return { activeChannels, scoredPool, channelsCount: channels.length };
    }

    async function refreshHomePersonalization() {
      const hasItems = Object.values(homeFeedState).some((items) => Array.isArray(items) && items.length);
      if (!hasItems) return;
      homeTasteWeights = await loadTasteWeights();
      const scoredPool = buildScoredDiscoveryPool(homeFeedState);
      const unified = buildUnifiedFeed(scoredPool, HOME_UNIFIED_TARGET_ITEMS);
      renderRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
      void refreshHomeNewReleases(homeFeedState);
      void refreshMixedForYouFromActivity(homeFeedState, scoredPool);
      hydrateSpotlightFromPool(scoredPool);
      scheduleHomeMenuCachePrime();
    }

    function renderRail(railId, items, opts) {
      const rail = document.getElementById(railId);
      if (!rail) return;
      rail.classList.toggle('games-rail', String(opts?.mediaType || '').toLowerCase() === 'game');

      if (!items || !items.length) {
        rail.innerHTML = '<div class="empty">No items right now.</div>';
        return;
      }

      rail.innerHTML = items.map((item) => {
        const mediaTypeRaw = String(item.mediaType || opts?.mediaType || '').toLowerCase();
        const media = getHomeMediaMeta(mediaTypeRaw);
        const uniformMedia = !!opts?.uniformMedia;
        const landscape = !uniformMedia && (!!opts?.landscape || mediaTypeRaw === 'restaurant');
        const restaurantComposite = !!opts?.restaurantComposite && mediaTypeRaw === 'restaurant';
        const title = escapeHtml(item.title || 'Untitled');
        const subtitle = escapeHtml(item.subtitle || media.label);
        const extra = escapeHtml(item.extra || '');
        const image = escapeHtml(item.image || '');
        const flagImage = escapeHtml(item.flagImage || '');
        const listImage = escapeHtml(item.listImage || (mediaTypeRaw === 'travel' ? (item.flagImage || '') : (item.image || '')));
        const logo = escapeHtml(item.logo || '');
        const fallbackImage = escapeHtml(item.fallbackImage || '');
        const coverImage = image || logo;
        const hrefRaw = item.href || '#';
        const href = escapeHtml(hrefRaw);
        const mediaType = escapeHtml(mediaTypeRaw);
        const itemId = escapeHtml(item.itemId || '');
        const supportsLists = supportsHomeLists(mediaTypeRaw) && !item.isPlaceholder && item.disableLists !== true;
        const opensExternal = /^https?:\/\//i.test(String(hrefRaw || ''));
        const previewUrlRaw = (mediaTypeRaw === 'music' && !item?.isMusicAlbum)
          ? String(item?.previewUrl || '').trim()
          : '';
        const previewControl = previewUrlRaw
          ? `<button class="card-preview-btn" data-preview="${escapeHtml(previewUrlRaw)}" aria-label="Play preview"><i class="fas fa-play"></i></button>`
          : '';
        const hasVisualImage = restaurantComposite ? !!coverImage || !!logo : !!image;
        const imagePolicy = hasVisualImage
          ? consumeHomeImageRequestBudget()
          : { loading: 'lazy', priority: 'low' };
        const imageLoading = imagePolicy.loading;
        const imagePriority = imagePolicy.priority;
        const mediaClasses = ['card-media'];
        if (landscape) mediaClasses.push('landscape');
        if (mediaTypeRaw === 'game') mediaClasses.push('game-poster');
        if (mediaTypeRaw === 'music') mediaClasses.push('music-cover');
        if (mediaTypeRaw === 'travel') mediaClasses.push('travel-photo');
        if (restaurantComposite) mediaClasses.push('restaurant-composite');
        const mediaHtml = restaurantComposite
          ? `
              ${coverImage ? `<img class="restaurant-cover" src="${coverImage}" alt="${title}" loading="${imageLoading}" fetchpriority="${imagePriority}" decoding="async" data-fallback-image="${fallbackImage || logo}" data-fallback-applied="0">` : '<i class="fa-solid fa-image"></i>'}
              ${logo ? `<span class="restaurant-logo-badge"><img src="${logo}" alt="${title} logo" loading="${imageLoading}" fetchpriority="${imagePriority}" decoding="async" data-fallback-image="${fallbackImage || coverImage}" data-fallback-applied="0"></span>` : ''}
            `
          : `${image ? `<img src="${image}" alt="${title}" loading="${imageLoading}" fetchpriority="${imagePriority}" decoding="async" data-fallback-image="${fallbackImage}" data-fallback-applied="0">` : '<i class="fa-solid fa-image"></i>'}`;
        const extraMarkup = extra ? `<p class="card-extra">${extra}</p>` : '<p class="card-extra placeholder">&nbsp;</p>';
        const titleMarkup = (mediaTypeRaw === 'travel' && flagImage)
          ? `<span class="country-title-wrap"><img class="country-inline-flag" src="${flagImage}" alt="" aria-hidden="true" loading="lazy" decoding="async"><span class="country-title-text">${title}</span></span>`
          : title;
        const trailingControl = supportsLists
          ? `
            <div class="card-menu-wrap">
              ${previewControl}
              <button class="card-menu-btn" aria-label="Add to lists"><i class="fas fa-ellipsis-v"></i></button>
            </div>
          `
          : `
            <div class="card-menu-wrap">
              ${previewControl}
              <a class="card-open-link" href="${href}" ${opensExternal ? 'target="_blank" rel="noopener"' : ''} aria-label="Open item"><i class="fas fa-arrow-up-right-from-square"></i></a>
            </div>
          `;
        return `
          <article class="card" data-href="${href}" data-media-type="${mediaType}" data-item-id="${itemId}" data-title="${title}" data-subtitle="${subtitle}" data-image="${image}" data-list-image="${listImage}">
            <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
            <div class="${mediaClasses.join(' ')}">
              ${mediaHtml}
            </div>
            <div class="card-meta">
              <span class="card-type"><i class="fa-solid ${media.icon}"></i> ${escapeHtml(media.label)}</span>
              <div class="card-meta-top">
                <p class="card-name">${titleMarkup}</p>
                ${trailingControl}
              </div>
              <p class="card-sub">${subtitle}</p>
              ${extraMarkup}
            </div>
          </article>
        `;
      }).join('');

      wireHomeCardMenus(rail);
      wireHomeRailImageFallbacks(rail);
    }

    function wireHomeRailImageFallbacks(scope) {
      scope.querySelectorAll('img[data-fallback-image]').forEach((img) => {
        img.addEventListener('error', () => {
          const fallback = String(img.getAttribute('data-fallback-image') || '').trim();
          const alreadyApplied = img.getAttribute('data-fallback-applied') === '1';
          if (!fallback || alreadyApplied) return;
          img.setAttribute('data-fallback-applied', '1');
          if (String(img.currentSrc || img.src).trim() === fallback) return;
          img.src = fallback;
        });
      });
    }

    function wireHomeCardMenus(scope) {
      scope.querySelectorAll('.card').forEach((card) => {
        const href = card.getAttribute('data-href');
        card.onclick = (e) => {
          if (e.target.closest('.card-menu-btn') || e.target.closest('.card-open-link') || e.target.closest('.card-preview-btn')) return;
          if (href) window.location.href = href;
        };
      });

      scope.querySelectorAll('.card-menu-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = btn.closest('.card');
          if (card) openItemMenu(card, btn);
        });
      });

      scope.querySelectorAll('.card-preview-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const src = String(btn.getAttribute('data-preview') || '').trim();
          if (!src) return;

          if (!homeMusicPreviewState.audio) {
            homeMusicPreviewState.audio = new Audio();
            homeMusicPreviewState.audio.preload = 'none';
            homeMusicPreviewState.audio.addEventListener('ended', () => {
              if (homeMusicPreviewState.btn) {
                homeMusicPreviewState.btn.innerHTML = '<i class="fas fa-play"></i>';
              }
              homeMusicPreviewState.btn = null;
            });
            homeMusicPreviewState.audio.addEventListener('pause', () => {
              if (homeMusicPreviewState.btn) {
                homeMusicPreviewState.btn.innerHTML = '<i class="fas fa-play"></i>';
              }
            });
          }

          const audio = homeMusicPreviewState.audio;
          const sameSource = String(audio.src || '').trim() === src;
          if (sameSource && !audio.paused) {
            audio.pause();
            btn.innerHTML = '<i class="fas fa-play"></i>';
            homeMusicPreviewState.btn = null;
            return;
          }

          if (homeMusicPreviewState.btn && homeMusicPreviewState.btn !== btn) {
            homeMusicPreviewState.btn.innerHTML = '<i class="fas fa-play"></i>';
          }

          audio.src = src;
          audio.play().catch(() => {});
          btn.innerHTML = '<i class="fas fa-pause"></i>';
          homeMusicPreviewState.btn = btn;
        });
      });
    }

    function ensureRailMenuBackdrop() {
      let backdrop = document.getElementById('railMenuBackdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'railMenuBackdrop';
        backdrop.className = 'rail-menu-backdrop';
        backdrop.addEventListener('click', closeAllRailMenus);
        document.body.appendChild(backdrop);
      }
      return backdrop;
    }

    function showRailMenuBackdrop() {
      const backdrop = ensureRailMenuBackdrop();
      backdrop.classList.add('active');
    }

    function hideRailMenuBackdrop() {
      const backdrop = document.getElementById('railMenuBackdrop');
      if (backdrop) backdrop.classList.remove('active');
    }

    function closeAllRailMenus() {
      document.querySelectorAll('.rail-menu.open').forEach((menu) => menu.classList.remove('open'));
      document.querySelectorAll('.card.menu-open').forEach((card) => card.classList.remove('menu-open'));
      hideRailMenuBackdrop();
    }

    async function setupHomeAuthListener() {
      if (homeAuthListenerReady) return;
      const client = await ensureHomeSupabase();
      if (!client) return;
      homeAuthListenerReady = true;

      client.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          homeCurrentUser = session.user;
          homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
        } else if (event === 'SIGNED_OUT') {
          homeCurrentUser = null;
          homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            homeCurrentUser = session.user;
          }
        }

        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          void initAuthUi();
          void refreshHomePersonalization();
        }
      });
    }

    async function getVerifiedHomeUser(client) {
      // Short retry window to avoid race right after OAuth redirect.
      let refreshAttempted = false;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const { data: sessionData } = await client.auth.getSession();
        const session = sessionData?.session || null;
        if (!session) {
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
          return null;
        }

        const { data: userData, error: userError } = await client.auth.getUser();
        if (!userError && userData?.user) {
          return userData.user;
        }

        const errorMessage = String(userError?.message || '').toLowerCase();
        const invalidSession =
          userError?.status === 401 ||
          errorMessage.includes('jwt') ||
          errorMessage.includes('token') ||
          errorMessage.includes('session') ||
          errorMessage.includes('unauthorized');

        if (invalidSession) {
          if (!refreshAttempted) {
            refreshAttempted = true;
            const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
            if (!refreshError && refreshed?.session?.user) {
              return refreshed.session.user;
            }
          }
        }
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        return null;
      }
      return null;
    }

    async function initAuthUi() {
      const client = await ensureHomeSupabase();
      if (!client) return;
      const loginBtn = document.getElementById('loginBtn');
      const signupBtn = document.getElementById('signupBtn');
      const profileBtn = document.getElementById('profileBtn');
      try {
        const user = await getVerifiedHomeUser(client);
        homeCurrentUser = user;
        const isLoggedIn = !!user;
        if (isLoggedIn) {
          if (loginBtn) loginBtn.style.display = 'none';
          if (signupBtn) signupBtn.style.display = 'none';
          let label = 'Profile';
          try {
            const { data: profile } = await client
              .from('user_profiles')
              .select('username, full_name')
              .eq('id', user.id)
              .single();
            const raw = profile?.username || profile?.full_name || '';
            const clean = String(raw || '').trim();
            if (clean) label = clean.startsWith('@') ? clean : `@${clean}`;
          } catch (_profileErr) {}
          if (profileBtn) {
            profileBtn.innerHTML = `<i class=\"fas fa-user\"></i><span>${label}</span>`;
            profileBtn.style.display = 'inline-flex';
          }
        } else {
          if (loginBtn) loginBtn.style.display = 'inline-flex';
          if (signupBtn) signupBtn.style.display = 'inline-flex';
          if (profileBtn) profileBtn.style.display = 'none';
        }
      } catch (_e) {
        homeCurrentUser = null;
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        if (profileBtn) profileBtn.style.display = 'none';
      }
    }

    function getOnboardingStorageKey(userId) {
      return `zo2y_onboarding_seen_${HOME_ONBOARDING_VERSION}_${String(userId || '').trim()}`;
    }

    function getOnboardingPendingKey(userId) {
      return `zo2y_onboarding_pending_${HOME_ONBOARDING_VERSION}_${String(userId || '').trim()}`;
    }

    function hasSeenOnboarding(userId) {
      if (!userId) return true;
      return localStorage.getItem(getOnboardingStorageKey(userId)) === '1';
    }

    function isOnboardingPending(userId) {
      if (!userId) return false;
      return localStorage.getItem(getOnboardingPendingKey(userId)) === '1';
    }

    function markOnboardingSeen(userId) {
      if (!userId) return;
      localStorage.setItem(getOnboardingStorageKey(userId), '1');
    }

    function clearOnboardingPending(userId) {
      if (!userId) return;
      localStorage.removeItem(getOnboardingPendingKey(userId));
    }

    function homeMediaLabel(type) {
      const key = String(type || '').toLowerCase();
      const map = {
        movie: 'Movie',
        tv: 'TV Show',
        anime: 'Anime',
        game: 'Game',
        book: 'Book',
        music: 'Track',
        travel: 'Country'
      };
      return map[key] || 'Pick';
    }

    function getHomeRecommendationPoolByType(type) {
      const key = String(type || '').toLowerCase();
      const raw = Array.isArray(homeFeedState?.[key]) ? homeFeedState[key] : [];
      return raw.filter((item) => !item?.isPlaceholder && String(item?.title || '').trim());
    }

    function getHomeOnboardingSteps() {
      return [
        {
          title: 'Welcome to Zo2y',
          body: 'Quick tour: how to add places to lists, create your own lists, and connect with friends.',
          art: `
            <div class="onboarding-hero">
              <div class="onboarding-hero-badge"><i class="fas fa-star"></i> Fresh account</div>
              <div class="onboarding-hero-row">
                <img src="images/logo.png" alt="Zo2y logo" class="onboarding-hero-logo">
                <div class="onboarding-hero-cards">
                  <span><i class="fas fa-clapperboard"></i> Anime Picks</span>
                  <span><i class="fas fa-film"></i> Movies</span>
                  <span><i class="fas fa-music"></i> Music</span>
                </div>
              </div>
            </div>
          `,
          actionLabel: null,
          action: null
        },
        {
          title: 'Add Places To Lists',
          body: 'On any card, tap the three-dot menu. Use quick list buttons, or choose Custom Lists to organize it your way.',
          art: `
            <div class="onboarding-illustration">
              <div class="mini-card">
                <div class="mini-card-head">
                  <span><i class="fas fa-clapperboard"></i> Spotlight Pick</span>
                  <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="mini-tags">
                  <span>Favorites</span>
                  <span>Want To Go</span>
                  <span>Custom Lists</span>
                </div>
              </div>
            </div>
          `,
          actionLabel: 'Open A Card Menu',
          action: () => {
            const menuBtn = document.querySelector('.card-menu-btn');
            if (!menuBtn) {
              showHomeToast('Cards are still loading. Try again in a moment.', true);
              return;
            }
            closeHomeOnboarding(false);
            menuBtn.click();
          }
        },
        {
          title: 'Create Your Own Lists',
          body: 'In the Custom Lists modal, enter a list name, pick an icon, then press Create.',
          art: `
            <div class="onboarding-illustration">
              <div class="mini-card">
                <div class="mini-input"><i class="fas fa-pen"></i> Date Night Spots</div>
                <div class="mini-icons">
                  <span><i class="fas fa-heart"></i></span>
                  <span><i class="fas fa-star"></i></span>
                  <span><i class="fas fa-bookmark"></i></span>
                </div>
                <div class="mini-create-btn">Create List</div>
              </div>
            </div>
          `,
          actionLabel: 'Open Custom Lists',
          action: () => {
            const firstCard = document.querySelector('.card[data-media-type][data-item-id]');
            if (!firstCard) {
              showHomeToast('Cards are still loading. Try again in a moment.', true);
              return;
            }
            closeHomeOnboarding(false);
            void openItemMenu(firstCard);
          }
        },
        {
          title: 'Add Friends',
          body: 'Open profiles and tap Follow to build your network. You can manage followers and following from your profile.',
          art: `
            <div class="onboarding-illustration">
              <div class="mini-card">
                <div class="friend-row"><span><i class="fas fa-user-circle"></i> @alex</span><span class="friend-pill">Follow</span></div>
                <div class="friend-row"><span><i class="fas fa-user-circle"></i> @sara</span><span class="friend-pill">Following</span></div>
                <div class="friend-row"><span><i class="fas fa-user-circle"></i> @mike</span><span class="friend-pill">Follow</span></div>
              </div>
            </div>
          `,
          actionLabel: 'Go To My Profile',
          action: () => {
            closeHomeOnboarding(true);
            window.location.href = 'profile.html';
          }
        }
      ];
    }

    function ensureHomeOnboardingUi() {
      let style = document.getElementById('homeOnboardingStyle');
      if (!style) {
        style = document.createElement('style');
        style.id = 'homeOnboardingStyle';
        style.textContent = `
          .home-onboarding-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(6, 12, 28, 0.76);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(6px);
          }
          .home-onboarding-overlay.active { display: flex; }
          .home-onboarding-card {
            width: min(680px, 96vw);
            background: linear-gradient(180deg, rgba(19,35,71,0.98), rgba(10,24,54,0.98));
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 16px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.45);
            padding: 24px;
            color: #fff;
          }
          .home-onboarding-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 13px;
            color: rgba(255,255,255,0.78);
          }
          .home-onboarding-skip {
            border: none;
            background: transparent;
            color: rgba(255,255,255,0.78);
            cursor: pointer;
            font-weight: 600;
          }
          .home-onboarding-skip:hover { color: #fff; }
          .home-onboarding-title {
            margin: 6px 0 8px;
            font-size: clamp(24px, 3vw, 32px);
            line-height: 1.2;
          }
          .home-onboarding-body {
            color: rgba(255,255,255,0.88);
            font-size: 16px;
            line-height: 1.55;
            min-height: 56px;
          }
          .home-onboarding-art {
            margin-top: 10px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px;
            padding: 14px;
            background: linear-gradient(145deg, rgba(14,28,58,0.9), rgba(8,18,42,0.9));
            min-height: 138px;
          }
          .onboarding-hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            padding: 5px 10px;
            border-radius: 999px;
            background: rgba(245,158,11,0.2);
            border: 1px solid rgba(245,158,11,0.4);
            margin-bottom: 10px;
          }
          .onboarding-hero-row {
            display: flex;
            gap: 14px;
            align-items: center;
          }
          .onboarding-hero-logo {
            width: 62px;
            height: 62px;
            border-radius: 14px;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          }
          .onboarding-hero-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .onboarding-hero-cards span {
            border: 1px solid rgba(255,255,255,0.16);
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            padding: 7px 10px;
            font-size: 13px;
          }
          .onboarding-illustration {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 108px;
          }
          .mini-card {
            width: min(500px, 100%);
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 10px;
          }
          .mini-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
            opacity: 0.95;
          }
          .mini-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .mini-tags span {
            font-size: 12px;
            border-radius: 999px;
            padding: 6px 9px;
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.06);
          }
          .mini-input {
            border: 1px solid rgba(255,255,255,0.16);
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            font-size: 13px;
            padding: 8px;
          }
          .mini-icons {
            margin-top: 10px;
            margin-bottom: 10px;
            display: flex;
            gap: 8px;
          }
          .mini-icons span {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.16);
          }
          .mini-create-btn {
            display: inline-block;
            border-radius: 8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #0b1633;
            font-weight: 700;
            font-size: 12px;
            padding: 8px 11px;
          }
          .friend-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            padding: 7px 0;
          }
          .friend-pill {
            font-size: 11px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.09);
            padding: 5px 9px;
          }
          .home-onboarding-progress {
            margin-top: 14px;
            margin-bottom: 20px;
            display: flex;
            gap: 8px;
          }
          .home-onboarding-dot {
            height: 6px;
            flex: 1;
            border-radius: 999px;
            background: rgba(255,255,255,0.18);
          }
          .home-onboarding-dot.active { background: #f59e0b; }
          .home-onboarding-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 10px;
          }
          .home-onboarding-left, .home-onboarding-right {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .home-onboarding-btn {
            border: 1px solid rgba(255,255,255,0.22);
            background: rgba(255,255,255,0.06);
            color: #fff;
            border-radius: 10px;
            padding: 10px 14px;
            font-weight: 600;
            cursor: pointer;
          }
          .home-onboarding-btn:hover { background: rgba(255,255,255,0.14); }
          .home-onboarding-btn.primary {
            border-color: rgba(245, 158, 11, 0.9);
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #0b1633;
          }
          .home-onboarding-btn.primary:hover {
            filter: brightness(1.05);
          }
        `;
        document.head.appendChild(style);
      }

      let overlay = document.getElementById('homeOnboardingOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'homeOnboardingOverlay';
        overlay.className = 'home-onboarding-overlay';
        overlay.innerHTML = `
          <div class="home-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="homeOnboardingTitle">
            <div class="home-onboarding-top">
              <span id="homeOnboardingStepText"></span>
              <button class="home-onboarding-skip" id="homeOnboardingSkipBtn">Skip tour</button>
            </div>
            <h2 class="home-onboarding-title" id="homeOnboardingTitle"></h2>
            <p class="home-onboarding-body" id="homeOnboardingBody"></p>
            <div class="home-onboarding-art" id="homeOnboardingArt"></div>
            <div class="home-onboarding-progress" id="homeOnboardingProgress"></div>
            <div class="home-onboarding-actions">
              <div class="home-onboarding-left">
                <button class="home-onboarding-btn" id="homeOnboardingBackBtn">Back</button>
              </div>
              <div class="home-onboarding-right">
                <button class="home-onboarding-btn" id="homeOnboardingTryBtn" style="display:none;"></button>
                <button class="home-onboarding-btn primary" id="homeOnboardingNextBtn">Next</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
    }

    function renderHomeOnboardingStep() {
      const steps = getHomeOnboardingSteps();
      const safeIndex = Math.max(0, Math.min(homeOnboardingIndex, steps.length - 1));
      homeOnboardingIndex = safeIndex;
      const step = steps[safeIndex];
      const overlay = document.getElementById('homeOnboardingOverlay');
      if (!overlay || !step) return;

      const stepText = document.getElementById('homeOnboardingStepText');
      const title = document.getElementById('homeOnboardingTitle');
      const body = document.getElementById('homeOnboardingBody');
      const art = document.getElementById('homeOnboardingArt');
      const progress = document.getElementById('homeOnboardingProgress');
      const backBtn = document.getElementById('homeOnboardingBackBtn');
      const nextBtn = document.getElementById('homeOnboardingNextBtn');
      const tryBtn = document.getElementById('homeOnboardingTryBtn');
      if (!stepText || !title || !body || !art || !progress || !backBtn || !nextBtn || !tryBtn) return;

      stepText.textContent = `Step ${safeIndex + 1} of ${steps.length}`;
      title.textContent = step.title;
      body.textContent = step.body;
      art.innerHTML = step.art || '';
      backBtn.disabled = safeIndex === 0;
      backBtn.style.opacity = safeIndex === 0 ? '0.5' : '1';
      nextBtn.textContent = safeIndex === steps.length - 1 ? 'Finish' : 'Next';

      if (step.actionLabel && typeof step.action === 'function') {
        tryBtn.textContent = step.actionLabel;
        tryBtn.style.display = 'inline-flex';
      } else {
        tryBtn.style.display = 'none';
      }

      progress.innerHTML = '';
      steps.forEach((_s, idx) => {
        const dot = document.createElement('span');
        dot.className = `home-onboarding-dot${idx <= safeIndex ? ' active' : ''}`;
        progress.appendChild(dot);
      });
    }

    function closeHomeOnboarding(markSeen = true) {
      const overlay = document.getElementById('homeOnboardingOverlay');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (markSeen) markOnboardingSeen(homeOnboardingUserId);
    }

    function attachHomeOnboardingEvents() {
      const steps = getHomeOnboardingSteps();
      const skipBtn = document.getElementById('homeOnboardingSkipBtn');
      const backBtn = document.getElementById('homeOnboardingBackBtn');
      const nextBtn = document.getElementById('homeOnboardingNextBtn');
      const tryBtn = document.getElementById('homeOnboardingTryBtn');
      if (!skipBtn || !backBtn || !nextBtn || !tryBtn) return;

      skipBtn.onclick = () => closeHomeOnboarding(true);
      backBtn.onclick = () => {
        homeOnboardingIndex = Math.max(0, homeOnboardingIndex - 1);
        renderHomeOnboardingStep();
      };
      nextBtn.onclick = () => {
        if (homeOnboardingIndex >= steps.length - 1) {
          closeHomeOnboarding(true);
          showHomeToast('Tour completed. You can start saving now.');
          return;
        }
        homeOnboardingIndex += 1;
        renderHomeOnboardingStep();
      };
      tryBtn.onclick = () => {
        const current = steps[homeOnboardingIndex];
        if (!current || typeof current.action !== 'function') return;
        current.action();
      };
    }

    function maybeShowHomeOnboarding() {
      const userId = homeCurrentUser?.id;
      if (!userId) return;
      if (!isOnboardingPending(userId)) return;
      if (hasSeenOnboarding(userId)) {
        clearOnboardingPending(userId);
        return;
      }
      homeOnboardingUserId = userId;
      homeOnboardingIndex = 0;
      // Ensure this is shown only once on first sign-in.
      clearOnboardingPending(userId);
      ensureHomeOnboardingUi();
      attachHomeOnboardingEvents();
      renderHomeOnboardingStep();
      const overlay = document.getElementById('homeOnboardingOverlay');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    async function loadRestaurants() {
      const client = await ensureHomeSupabase();
      if (!client) {
        return FALLBACK_RESTAURANTS.map((r) => ({
          mediaType: 'restaurant',
          itemId: String(r.id),
          title: r.name,
          subtitle: `${r.category} | ${r.rating}/5`,
          image: '',
          logo: '',
          backgroundImage: '',
          spotlightImage: '',
          spotlightMediaImage: '',
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          href: 'restraunts.html'
        }));
      }
      const fetchLimit = Math.max(HOME_CHANNEL_TARGET_ITEMS * 2, HOME_CHANNEL_TARGET_ITEMS);
      const { data, error } = await client
        .from('restraunts')
        .select('id,name,image,category,rating,slug,logo_url')
        .order('rating', { ascending: false })
        .limit(fetchLimit);
      if (error || !data || !data.length) {
        return FALLBACK_RESTAURANTS.map((r) => ({
          mediaType: 'restaurant',
          itemId: String(r.id),
          title: r.name,
          subtitle: `${r.category} | ${r.rating}/5`,
          image: '',
          logo: '',
          backgroundImage: '',
          spotlightImage: '',
          spotlightMediaImage: '',
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          href: 'restraunts.html'
        }));
      }

      const selectedRows = shuffleArray(data).slice(0, HOME_CHANNEL_TARGET_ITEMS);
      const slugs = selectedRows.map((row) => String(row.slug || '').trim()).filter(Boolean);
      const galleryBySlug = {};
      if (slugs.length) {
        const { data: galleryRows } = await client
          .from('restaurant_gallery')
          .select('restaurant_slug, image_url, image_type')
          .in('restaurant_slug', slugs);
        if (Array.isArray(galleryRows)) {
          galleryRows.forEach((row) => {
            const slug = String(row.restaurant_slug || '').trim();
            const url = String(row.image_url || '').trim();
            const imageType = String(row.image_type || '').trim().toLowerCase();
            if (!slug || !url) return;
            if (!galleryBySlug[slug]) {
              galleryBySlug[slug] = {
                cover: '',
                logo: ''
              };
            }
            if (imageType === 'cover' && !galleryBySlug[slug].cover) {
              galleryBySlug[slug].cover = toHttpsUrl(url);
            } else if (imageType === 'logo' && !galleryBySlug[slug].logo) {
              galleryBySlug[slug].logo = toHttpsUrl(url);
            }
          });
        }
      }

      return selectedRows.map((r) => {
        const coverImage = galleryBySlug[r.slug]?.cover || resolveRestaurantImage(r.image);
        const logoImage = galleryBySlug[r.slug]?.logo || resolveRestaurantImage(r.logo_url);
        const hasLogo = String(logoImage || '').trim().length > 0;
        return {
          mediaType: 'restaurant',
          itemId: String(r.id || ''),
          title: r.name || 'Restaurant',
          subtitle: `${r.category || 'Restaurant'}${r.rating ? ` | ${r.rating}/5` : ''}`,
          image: coverImage || logoImage || '',
          logo: logoImage || '',
          backgroundImage: coverImage || '',
          spotlightImage: coverImage || '',
          spotlightMediaImage: hasLogo ? logoImage : (coverImage || ''),
          spotlightMediaFit: hasLogo ? 'contain' : 'cover',
          spotlightMediaShape: hasLogo ? 'square' : 'poster',
          href: r.id ? `restaurant.html?id=${encodeURIComponent(r.id)}` : 'restraunts.html'
        };
      });
    }

    async function loadMovies(signal) {
      const sourceBuilders = shuffleArray([
        () => `${TMDB_PROXY_BASE}/movie/popular?language=en-US&page=${randomInt(1, 5)}`,
        () => `${TMDB_PROXY_BASE}/movie/top_rated?language=en-US&page=${randomInt(1, 5)}`,
        () => `${TMDB_PROXY_BASE}/movie/now_playing?language=en-US&page=${randomInt(1, 4)}`,
        () => `${TMDB_PROXY_BASE}/trending/movie/week?page=${randomInt(1, 3)}`
      ]).slice(0, 2);
      const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
        try {
          const url = buildUrl();
          const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
          if (!json) return [];
          return Array.isArray(json.results) ? json.results : [];
        } catch (_err) {
          return [];
        }
      }));
      const collected = shuffleArray(batches.flat());
      const seen = new Set();
      const results = [];
      for (const item of collected) {
        const key = String(item?.id || '').trim();
        if (!key || seen.has(key)) continue;
        if (isLikelyAnimeMovieEntry(item)) continue;
        if (!item?.poster_path && !item?.backdrop_path) continue;
        seen.add(key);
        results.push(item);
        if (results.length >= HOME_CHANNEL_TARGET_ITEMS) break;
      }
      return results.map(m => ({
        mediaType: 'movie',
        itemId: String(m.id || ''),
        title: m.title || 'Movie',
        subtitle: m.release_date ? m.release_date.slice(0, 4) : 'Movie',
        image: m.poster_path ? `${TMDB_POSTER}${m.poster_path}` : '',
        backgroundImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : '',
        spotlightImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : '',
        spotlightMediaImage: m.poster_path ? `${TMDB_SPOT_POSTER}${m.poster_path}` : (m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : ''),
        spotlightMediaFit: 'contain',
        spotlightMediaShape: 'poster',
        isAdult: m?.adult === true,
        href: m.id ? `movie.html?id=${encodeURIComponent(m.id)}` : 'movies.html'
      })).filter((item) => isHomeSafeContentItem(item));
    }

    async function loadTv(signal) {
      const sourceBuilders = shuffleArray([
        () => `${TMDB_PROXY_BASE}/tv/popular?language=en-US&page=${randomInt(1, 5)}`,
        () => `${TMDB_PROXY_BASE}/tv/top_rated?language=en-US&page=${randomInt(1, 5)}`,
        () => `${TMDB_PROXY_BASE}/tv/airing_today?language=en-US&page=${randomInt(1, 4)}`,
        () => `${TMDB_PROXY_BASE}/trending/tv/week?page=${randomInt(1, 3)}`
      ]).slice(0, 2);
      const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
        try {
          const url = buildUrl();
          const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
          if (!json) return [];
          return Array.isArray(json.results) ? json.results : [];
        } catch (_err) {
          return [];
        }
      }));
      const collected = shuffleArray(batches.flat());
      const seen = new Set();
      const results = [];
      for (const item of collected) {
        const key = String(item?.id || '').trim();
        if (!key || seen.has(key)) continue;
        if (isLikelyAnimeTvEntry(item)) continue;
        if (!item?.poster_path && !item?.backdrop_path) continue;
        seen.add(key);
        results.push(item);
        if (results.length >= HOME_CHANNEL_TARGET_ITEMS) break;
      }
      return results.map(t => ({
        mediaType: 'tv',
        itemId: String(t.id || ''),
        title: t.name || 'TV Show',
        subtitle: t.first_air_date ? t.first_air_date.slice(0, 4) : 'TV Show',
        image: t.poster_path ? `${TMDB_POSTER}${t.poster_path}` : '',
        backgroundImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : '',
        spotlightImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : '',
        spotlightMediaImage: t.poster_path ? `${TMDB_SPOT_POSTER}${t.poster_path}` : (t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : ''),
        spotlightMediaFit: 'contain',
        spotlightMediaShape: 'poster',
        isAdult: t?.adult === true,
        href: t.id ? `tvshow.html?id=${encodeURIComponent(t.id)}` : 'tvshows.html'
      })).filter((item) => isHomeSafeContentItem(item));
    }

    async function loadAnime(signal) {
      const sourceBuilders = shuffleArray([
        () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=popularity.desc&page=${randomInt(1, 5)}&with_genres=16&with_original_language=ja`,
        () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=vote_count.desc&page=${randomInt(1, 5)}&with_genres=16&with_original_language=ja`,
        () => `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=vote_average.desc&page=${randomInt(1, 4)}&with_genres=16&with_original_language=ja&vote_count.gte=120`
      ]).slice(0, 2);
      const batches = await Promise.all(sourceBuilders.map(async (buildUrl) => {
        try {
          const url = buildUrl();
          const json = await fetchJsonWithPerfCache(url, { signal, cacheKey: `tmdb:${url}` });
          if (!json) return [];
          return Array.isArray(json.results) ? json.results : [];
        } catch (_err) {
          return [];
        }
      }));
      const collected = shuffleArray(batches.flat());
      const seen = new Set();
      const results = [];
      for (const item of collected) {
        const key = String(item?.id || '').trim();
        if (!key || seen.has(key)) continue;
        if (!item?.poster_path && !item?.backdrop_path) continue;
        seen.add(key);
        results.push(item);
        if (results.length >= HOME_CHANNEL_TARGET_ITEMS) break;
      }
      return results.map((show) => ({
        mediaType: 'anime',
        itemId: String(show.id || ''),
        title: show.name || 'Anime',
        subtitle: show.first_air_date ? show.first_air_date.slice(0, 4) : 'Anime',
        image: show.poster_path ? `${TMDB_POSTER}${show.poster_path}` : '',
        backgroundImage: show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : '',
        spotlightImage: show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : '',
        spotlightMediaImage: show.poster_path ? `${TMDB_SPOT_POSTER}${show.poster_path}` : (show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : ''),
        spotlightMediaFit: 'contain',
        spotlightMediaShape: 'poster',
        isAdult: show?.adult === true,
        href: show.id ? `anime.html?id=${encodeURIComponent(show.id)}` : 'animes.html'
      })).filter((item) => isHomeSafeContentItem(item));
    }

    async function loadGames(signal) {
      const client = await ensureHomeSupabase();
      if (!client) return [];
      const { data } = await client
        .from('games')
        .select('id,title,release_date,rating,rating_count,cover_url,hero_url,extra')
        .order('rating', { ascending: false, nullsFirst: false })
        .order('rating_count', { ascending: false, nullsFirst: false })
        .order('release_date', { ascending: false, nullsFirst: false })
        .limit(Math.max(HOME_CHANNEL_TARGET_ITEMS * 6, 84));
      if (signal?.aborted) return [];

      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) return [];
      const randomizedRows = shuffleArray(rows);
      return randomizedRows
        .map((row) => {
          const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
          const genres = Array.isArray(extra?.genres) ? extra.genres : [];
          const cover = String(row?.cover_url || '').trim();
          const image = cover || HOME_LOCAL_FALLBACK_IMAGE;
          return {
            mediaType: 'game',
            itemId: String(row?.id || ''),
            title: String(row?.title || 'Game').trim() || 'Game',
            subtitle: row?.release_date ? String(row.release_date).slice(0, 4) : 'Game',
            extra: `${genres.length ? genres.slice(0, 2).map((entry) => entry?.name).filter(Boolean).join(' | ') : 'Video Game'}${row?.rating ? ` | ${Number(row.rating).toFixed(1)}/5` : ''}`,
            image,
            backgroundImage: image,
            spotlightImage: image,
            spotlightMediaImage: image,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            fallbackImage: HOME_LOCAL_FALLBACK_IMAGE,
            href: row?.id ? `game.html?id=${encodeURIComponent(String(row.id))}` : 'games.html'
          };
        })
        .filter((item) => item && String(item.itemId || '').trim())
        .slice(0, HOME_CHANNEL_TARGET_ITEMS);
    }

    async function loadBooks(signal) {
      const buildOpenLibraryCoverUrl = (doc, size = 'L') => {
        const safeSize = ['S', 'M', 'L'].includes(String(size || '').toUpperCase())
          ? String(size || 'L').toUpperCase()
          : 'L';
        const coverId = Number(doc?.cover_i || 0) || 0;
        if (coverId > 0) {
          return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
        }
        const isbnRaw = Array.isArray(doc?.isbn) ? String(doc.isbn[0] || '').trim() : String(doc?.isbn || '').trim();
        const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
        if (isbn) {
          return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${safeSize}.jpg`;
        }
        return '';
      };

      const normalizeBookDoc = (row, idx = 0) => {
        if (!row) return null;
        if (row.volumeInfo) {
          const info = row.volumeInfo || {};
          const title = String(info?.title || '').trim();
          if (!title) return null;
          const author = Array.isArray(info?.authors) && info.authors.length ? String(info.authors[0] || '').trim() : 'Unknown author';
          const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
          const isbn = identifiers
            .map((entry) => String(entry?.identifier || '').replace(/[^0-9Xx]/g, ''))
            .filter(Boolean);
          const published = String(info?.publishedDate || '').trim();
          const yearMatch = published.match(/\d{4}/);
          return {
            key: '',
            title,
            author_name: [author],
            first_publish_year: yearMatch ? Number(yearMatch[0]) : null,
            isbn,
            cover_i: null,
            coverImage: toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || ''),
            _googleThumbnail: toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || ''),
            _googleVolumeId: String(row?.id || '').trim(),
            maturityRating: String(info?.maturityRating || '').trim(),
            _source: 'google-books'
          };
        }
        const title = String(row?.title || '').trim();
        if (!title) return null;
        const author = Array.isArray(row?.author_name) && row.author_name.length
          ? String(row.author_name[0] || '').trim()
          : 'Unknown author';
        const isbn = Array.isArray(row?.isbn)
          ? row.isbn.map((entry) => String(entry || '').replace(/[^0-9Xx]/g, '')).filter(Boolean)
          : (String(row?.isbn || '').trim() ? [String(row.isbn).trim().replace(/[^0-9Xx]/g, '')] : []);
        return {
          key: String(row?.key || '').trim(),
          title,
          author_name: [author],
          first_publish_year: Number(row?.first_publish_year || 0) || null,
          isbn,
          cover_i: Number(row?.cover_i || 0) || null,
          coverImage: toHttpsUrl(row?.coverImage || ''),
          _googleThumbnail: toHttpsUrl(row?._googleThumbnail || ''),
          _googleVolumeId: String(row?._googleVolumeId || '').trim(),
          maturityRating: String(row?.maturityRating || '').trim(),
          _source: String(row?._source || '').trim() || 'book'
        };
      };

      const mapDocsToRailItems = (docs, options = {}) => {
        const minYear = Number(options.minYear || 0);
        const allowMissingYear = !!options.allowMissingYear;
        const seen = new Set();
        return (Array.isArray(docs) ? docs : []).map((doc, idx) => {
          const normalized = normalizeBookDoc(doc, idx);
          if (!normalized) return null;
          const title = String(normalized.title || '').trim();
          const author = String((Array.isArray(normalized.author_name) ? normalized.author_name[0] : '') || '').trim() || 'Unknown author';
          const year = Number(normalized?.first_publish_year || 0) || 0;

          if (!allowMissingYear && !year) return null;
          if (minYear && year && year < minYear) return null;

          const coverCandidates = [
            toHttpsUrl(normalized?._googleThumbnail || ''),
            toHttpsUrl(normalized?.coverImage || ''),
            toHttpsUrl(buildOpenLibraryCoverUrl(normalized, 'L')),
            toHttpsUrl(buildOpenLibraryCoverUrl(normalized, 'M'))
          ].filter(Boolean);
          const cover = coverCandidates[0] || '';
          if (!cover) return null;

          const dedupeKey = `${title.toLowerCase()}::${author.toLowerCase()}`;
          if (seen.has(dedupeKey)) return null;
          seen.add(dedupeKey);

          const subtitle = year ? `${author} | ${year}` : author;
          const googleVolumeId = String(normalized?._googleVolumeId || '').trim();
          const workKey = String(normalized?.key || '').trim();
          let itemId = '';
          if (googleVolumeId) itemId = googleVolumeId;
          if (!itemId && workKey.startsWith('/works/')) itemId = workKey.replace('/works/', '').trim();
          if (!itemId) {
            itemId = `search-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `book-${idx}`}`;
          }
          const isbnRaw = Array.isArray(normalized?.isbn) ? String(normalized.isbn[0] || '').trim() : '';
          const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
          const titleParam = encodeURIComponent(title);
          const authorParam = encodeURIComponent(author);
          const href = `book.html?id=${encodeURIComponent(itemId)}&title=${titleParam}&author=${authorParam}`;

          return {
            mediaType: 'book',
            itemId,
            title,
            subtitle,
            image: cover,
            backgroundImage: cover,
            spotlightImage: cover,
            spotlightMediaImage: cover,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'poster',
            fallbackImage: HOME_LOCAL_FALLBACK_IMAGE,
            maturityRating: String(normalized?.maturityRating || '').trim(),
            isbn,
            href
          };
        }).filter(Boolean);
      };

      const mergeUniqueItems = (...batches) => {
        const seen = new Set();
        const out = [];
        batches.forEach((batch) => {
          (Array.isArray(batch) ? batch : []).forEach((item) => {
            const key = `${String(item?.title || '').trim().toLowerCase()}::${String(item?.subtitle || '').trim().toLowerCase()}`;
            if (!key || seen.has(key)) return;
            seen.add(key);
            out.push(item);
          });
        });
        return out;
      };

      try {
        const limit = Math.max(HOME_CHANNEL_TARGET_ITEMS, 24);
        const booksRequestOptions = { signal, timeoutMs: 4200, retries: 1 };
        const queryUrls = [
          `/api/books/popular?q=${encodeURIComponent('subject:fiction bestseller 2023 2024 2025')}&limit=${limit}&page=1&orderBy=relevance`,
          `/api/books/popular?q=${encodeURIComponent('subject:fantasy bestseller')}&limit=${limit}&page=1&orderBy=relevance`,
          `/api/books/popular?q=${encodeURIComponent('subject:romance bestseller')}&limit=${limit}&page=1&orderBy=relevance`,
          `/api/books/popular?q=${encodeURIComponent('bestseller popular books')}&limit=${limit}&page=1&orderBy=relevance`,
          `/api/books/trending?period=weekly&limit=${limit}`
        ];
        const results = await Promise.allSettled(queryUrls.map((url) => (
          fetchJsonWithPerfCache(url, { ...booksRequestOptions, cacheKey: `books:${url}` })
        )));

        const allDocsRaw = [];
        results.forEach((result) => {
          if (result.status !== 'fulfilled') return;
          const payload = result.value;
          const docs = Array.isArray(payload?.docs)
            ? payload.docs
            : (Array.isArray(payload?.items) ? payload.items : []);
          if (docs.length) allDocsRaw.push(...docs);
        });

        const strictModern = mapDocsToRailItems(allDocsRaw, { minYear: 2005, allowMissingYear: false });
        const modernWithUnknownYear = mapDocsToRailItems(allDocsRaw, { minYear: 2005, allowMissingYear: true });
        const relaxedFallback = mapDocsToRailItems(allDocsRaw, { minYear: 1995, allowMissingYear: true });
        const merged = mergeUniqueItems(strictModern, modernWithUnknownYear, relaxedFallback);
        const safeMerged = filterHomeSafeItems(merged);
        if (safeMerged.length) {
          const shuffled = shuffleArray(safeMerged);
          return shuffled.slice(0, HOME_CHANNEL_TARGET_ITEMS);
        }
      } catch (_e) {}

      return [];
    }

    async function loadMusic(signal) {
      const market = 'US';
      const HOME_MUSIC_MIN_ITEMS = Math.max(8, Math.min(HOME_CHANNEL_TARGET_ITEMS, 12));
      const getTrackContainerLabel = (track = {}) => {
        const title = String(track?.name || '').trim().toLowerCase();
        const albumName = String(track?.album?.name || track?.album_name || '').trim();
        const albumType = String(track?.album?.album_type || track?.album_type || '').trim().toLowerCase();
        const totalTracks = Number(track?.album?.total_tracks || track?.total_tracks || 0);
        const sameName = !!title && !!albumName && title === albumName.toLowerCase();
        if (albumType === 'single' && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
        if (/\bsingle\b/i.test(albumName) && totalTracks > 0 && totalTracks <= 1 && sameName) return 'Single';
        return 'Album';
      };
      const mapTracksToHomeItems = (tracks = []) => tracks.map((track) => {
        if (String(track?.kind || '').trim().toLowerCase() === 'album') return null;
        const artists = Array.isArray(track?.artists) ? track.artists.filter(Boolean).join(', ') : 'Artist';
        const title = String(track?.name || 'Track').trim() || 'Track';
        const albumName = String(track?.album?.name || track?.album_name || '').trim() || 'Unknown Album';
        const containerLabel = getTrackContainerLabel(track);
        const popularity = Number(track?.popularity || 0);
        const image = String(track?.image || '').trim();
        return {
          mediaType: 'music',
          itemId: String(track?.id || ''),
          title,
          subtitle: artists || 'Artist',
          extra: `Song | ${containerLabel}: ${albumName}${popularity ? ` | Popularity ${popularity}/100` : ''}`,
          image,
          backgroundImage: image,
          spotlightImage: image,
          spotlightMediaImage: image,
          previewUrl: String(track?.preview_url || '').trim(),
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          explicit: track?.explicit === true,
          href: String(track?.id || '').trim() ? `song.html?id=${encodeURIComponent(track.id)}` : 'music.html'
        };
      }).filter((item) => item && String(item?.itemId || '').trim());

      const mapAlbumsToHomeItems = (albums = []) => albums.map((album, idx) => {
        const albumIdRaw = String(album?.id || '').trim();
        const albumId = albumIdRaw.startsWith('album:') ? albumIdRaw.slice(6) : albumIdRaw;
        const albumType = String(album?.album_type || 'album').trim().toLowerCase();
        if (albumType && albumType !== 'album') return null;
        if (!albumId) return null;
        const source = String(album?.source || '').trim().toLowerCase() || (/^[0-9]+$/.test(albumId) ? 'itunes' : 'spotify');
        const artists = Array.isArray(album?.artists) ? album.artists.filter(Boolean).join(', ') : 'Artist';
        const image = String(album?.image || '').trim();
        const releaseDate = String(album?.release_date || '').trim();
        const totalTracks = Number(album?.total_tracks || 0);
        const detail = [
          releaseDate ? `Released ${releaseDate}` : '',
          totalTracks > 0 ? `${totalTracks} tracks` : '',
          albumType || ''
        ].filter(Boolean).join(' | ');
        const href = `song.html?album_id=${encodeURIComponent(albumId)}&source=${encodeURIComponent(source)}`;
        return {
          mediaType: 'music',
          itemId: `album:${albumId}`,
          title: String(album?.name || 'Album').trim() || 'Album',
          subtitle: artists || 'Artist',
          extra: `Album${detail ? ` | ${detail}` : ''}`,
          image,
          backgroundImage: image,
          spotlightImage: image,
          spotlightMediaImage: image,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          href,
          isMusicAlbum: true
        };
      }).filter((item) => !!item && String(item?.itemId || '').trim());

      const dedupeMusicTrackRows = (rows = []) => {
        const seenIds = new Set();
        const seenTrackKeys = new Set();
        const deduped = [];
        rows.forEach((row) => {
          const id = String(row?.id || '').trim();
          const trackName = String(row?.name || '').trim().toLowerCase();
          const firstArtist = Array.isArray(row?.artists) && row.artists.length
            ? String(row.artists[0] || '').trim().toLowerCase()
            : '';
          const trackKey = `${trackName}::${firstArtist}`;
          if (!trackName || !firstArtist) return;
          if (id && seenIds.has(id)) return;
          if (seenTrackKeys.has(trackKey)) return;
          if (id) seenIds.add(id);
          seenTrackKeys.add(trackKey);
          deduped.push(row);
        });
        return deduped;
      };

      const dedupeMusicAlbumRows = (rows = []) => {
        const seenIds = new Set();
        const seenAlbumKeys = new Set();
        const deduped = [];
        rows.forEach((row) => {
          const id = String(row?.id || '').trim();
          const albumName = String(row?.name || '').trim().toLowerCase();
          const firstArtist = Array.isArray(row?.artists) && row.artists.length
            ? String(row.artists[0] || '').trim().toLowerCase()
            : '';
          const albumKey = `${albumName}::${firstArtist}`;
          if (!albumName || !firstArtist) return;
          if (id && seenIds.has(id)) return;
          if (seenAlbumKeys.has(albumKey)) return;
          if (id) seenIds.add(id);
          seenAlbumKeys.add(albumKey);
          deduped.push(row);
        });
        return deduped;
      };

      const mixMusicItems = (trackItems = [], albumItems = [], takeCount = HOME_CHANNEL_TARGET_ITEMS) => {
        const trackQueue = [...(Array.isArray(trackItems) ? trackItems : [])];
        const albumQueue = [...(Array.isArray(albumItems) ? albumItems : [])];
        const mixed = [];
        while (mixed.length < takeCount && (trackQueue.length || albumQueue.length)) {
          if (albumQueue.length) mixed.push(albumQueue.shift());
          if (trackQueue.length && mixed.length < takeCount) mixed.push(trackQueue.shift());
          if (albumQueue.length && mixed.length < takeCount) mixed.push(albumQueue.shift());
        }
        while (mixed.length < takeCount && trackQueue.length) mixed.push(trackQueue.shift());
        while (mixed.length < takeCount && albumQueue.length) mixed.push(albumQueue.shift());
        return mixed.slice(0, takeCount);
      };

      const buildMixedMusicItems = (trackRows = [], albumRows = [], takeCount = HOME_CHANNEL_TARGET_ITEMS) => {
        const dedupedTracks = dedupeMusicTrackRows(trackRows);
        const dedupedAlbums = dedupeMusicAlbumRows(albumRows);
        const tracksWithArtwork = dedupedTracks.filter((track) => String(track?.image || '').trim());
        const albumsWithArtwork = dedupedAlbums.filter((album) => String(album?.image || '').trim());
        const trackPool = tracksWithArtwork.length ? tracksWithArtwork : dedupedTracks;
        const albumPool = albumsWithArtwork.length ? albumsWithArtwork : dedupedAlbums;
        const selectedTracks = shuffleArray(trackPool).slice(0, Math.max(takeCount, 16));
        const selectedAlbums = shuffleArray(albumPool).slice(0, Math.max(takeCount * 2, 24));
        const mappedTracks = mapTracksToHomeItems(selectedTracks);
        const mappedAlbums = mapAlbumsToHomeItems(selectedAlbums);
        const mixed = mixMusicItems(mappedTracks, mappedAlbums, takeCount);
        return dedupeHomeItemsByMediaAndId(mixed).slice(0, takeCount);
      };
      const hasAlbumItems = (items = []) => (Array.isArray(items) ? items : [])
        .some((item) => item?.isMusicAlbum === true || String(item?.itemId || '').startsWith('album:'));
      const hasTrackItems = (items = []) => (Array.isArray(items) ? items : [])
        .some((item) => item && !item?.isMusicAlbum && !String(item?.itemId || '').startsWith('album:'));
      const isHealthyMusicBatch = (items = []) => {
        const list = Array.isArray(items) ? items : [];
        return list.length >= HOME_MUSIC_MIN_ITEMS && hasAlbumItems(list) && hasTrackItems(list);
      };
      const collectedTrackRows = [];
      const collectedAlbumRows = [];
      const collectMusicRows = ({ tracks = [], albums = [] } = {}) => {
        if (Array.isArray(tracks) && tracks.length) collectedTrackRows.push(...tracks);
        if (Array.isArray(albums) && albums.length) collectedAlbumRows.push(...albums);
      };
      const getCollectedTrackRows = () => dedupeMusicTrackRows(collectedTrackRows);
      const getCollectedAlbumRows = () => dedupeMusicAlbumRows(collectedAlbumRows);

      const top50Limit = Math.max(HOME_CHANNEL_TARGET_ITEMS * 4, 64);
      const newReleaseLimit = Math.max(HOME_CHANNEL_TARGET_ITEMS * 3, 36);
      const musicFetchOptions = { signal, timeoutMs: 3600, retries: 1 };
      const [top50Res, topAlbumsRes, topReleaseAlbumsRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `/api/music/top-50?limit=${top50Limit}&market=${market}`,
          { ...musicFetchOptions, cacheKey: `music:top-50:${top50Limit}:${market}` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/popular-albums?limit=${newReleaseLimit}&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:popular-albums:${newReleaseLimit}:${market}:album` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/new-releases?limit=${newReleaseLimit}&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:new-releases:${newReleaseLimit}:${market}:album` }
        )
      ]);
      const top50Rows = top50Res.status === 'fulfilled' && Array.isArray(top50Res.value?.results) ? top50Res.value.results : [];
      const topAlbumRows = [
        ...(topAlbumsRes.status === 'fulfilled' && Array.isArray(topAlbumsRes.value?.results) ? topAlbumsRes.value.results : []),
        ...(topReleaseAlbumsRes.status === 'fulfilled' && Array.isArray(topReleaseAlbumsRes.value?.results) ? topReleaseAlbumsRes.value.results : [])
      ];
      collectMusicRows({ tracks: top50Rows, albums: topAlbumRows });
      const topBatch = filterHomeSafeItems(buildMixedMusicItems(top50Rows, topAlbumRows, HOME_CHANNEL_TARGET_ITEMS));
      if (isHealthyMusicBatch(topBatch)) return topBatch;

      const [popularRes, popularAlbumsRes, popularReleaseAlbumsRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `/api/music/popular?limit=50&market=${market}`,
          { ...musicFetchOptions, cacheKey: `music:popular:50:${market}` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/popular-albums?limit=36&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:popular-albums:36:${market}:album` }
        ),
        fetchJsonWithPerfCache(
          `/api/music/new-releases?limit=24&market=${market}&album_types=album`,
          { ...musicFetchOptions, cacheKey: `music:new-releases:24:${market}:album` }
        )
      ]);
      const popularRows = popularRes.status === 'fulfilled' && Array.isArray(popularRes.value?.results) ? popularRes.value.results : [];
      const popularAlbumRows = [
        ...(popularAlbumsRes.status === 'fulfilled' && Array.isArray(popularAlbumsRes.value?.results)
          ? popularAlbumsRes.value.results
          : []),
        ...(popularReleaseAlbumsRes.status === 'fulfilled' && Array.isArray(popularReleaseAlbumsRes.value?.results)
          ? popularReleaseAlbumsRes.value.results
          : [])
      ];
      collectMusicRows({ tracks: popularRows, albums: popularAlbumRows });
      const popularBatch = filterHomeSafeItems(buildMixedMusicItems(popularRows, popularAlbumRows, HOME_CHANNEL_TARGET_ITEMS));
      if (isHealthyMusicBatch(popularBatch)) return popularBatch;

      const searchFallbackTerms = ['top albums and songs', 'new music albums and songs'];
      for (const term of searchFallbackTerms) {
        try {
          const fallbackSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent(term)}&limit=40&market=${market}&type=track,album&album_types=album`,
            { ...musicFetchOptions, cacheKey: `music:search-fallback:${market}:${term}` }
          );
          const fallbackTracks = Array.isArray(fallbackSearch?.tracks) ? fallbackSearch.tracks : [];
          const fallbackAlbums = Array.isArray(fallbackSearch?.albums) ? fallbackSearch.albums : [];
          collectMusicRows({ tracks: fallbackTracks, albums: fallbackAlbums });
          const searchBatch = filterHomeSafeItems(buildMixedMusicItems(fallbackTracks, fallbackAlbums, HOME_CHANNEL_TARGET_ITEMS));
          if (isHealthyMusicBatch(searchBatch)) return searchBatch;
        } catch (_err) {}
      }

      const minimumTrackRows = Math.max(4, Math.ceil(HOME_MUSIC_MIN_ITEMS / 2));
      const minimumAlbumRows = Math.max(4, Math.ceil(HOME_MUSIC_MIN_ITEMS / 2));
      if (getCollectedAlbumRows().length < minimumAlbumRows) {
        try {
          const albumSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent('top albums')}&limit=48&market=${market}&type=album&album_types=album`,
            { ...musicFetchOptions, cacheKey: `music:album-search-backfill:${market}` }
          );
          collectMusicRows({ albums: Array.isArray(albumSearch?.albums) ? albumSearch.albums : [] });
        } catch (_err) {}
      }
      if (getCollectedTrackRows().length < minimumTrackRows) {
        try {
          const trackSearch = await fetchJsonWithPerfCache(
            `/api/music/search?q=${encodeURIComponent('top songs')}&limit=48&market=${market}&type=track`,
            { ...musicFetchOptions, cacheKey: `music:track-search-backfill:${market}` }
          );
          collectMusicRows({ tracks: Array.isArray(trackSearch?.tracks) ? trackSearch.tracks : [] });
        } catch (_err) {}
      }

      const bestEffortBatch = filterHomeSafeItems(
        buildMixedMusicItems(
          getCollectedTrackRows(),
          getCollectedAlbumRows(),
          Math.max(HOME_CHANNEL_TARGET_ITEMS, HOME_MUSIC_MIN_ITEMS)
        )
      );
      if (bestEffortBatch.length) {
        const mixedEnough = hasAlbumItems(bestEffortBatch) && hasTrackItems(bestEffortBatch);
        if (isHealthyMusicBatch(bestEffortBatch) || (mixedEnough && bestEffortBatch.length >= Math.min(6, HOME_MUSIC_MIN_ITEMS))) {
          return bestEffortBatch;
        }
      }

      return [];
    }

    function buildTravelPhotoUrl(countryName, countryCode) {
      const name = String(countryName || '').trim();
      const code = String(countryCode || '').trim().toUpperCase() || 'XX';
      if (!name) return '';
      const query = encodeURIComponent(`${name},country,landscape,travel`);
      return `https://source.unsplash.com/1600x900/?${query}&sig=${encodeURIComponent(code)}`;
    }

    function mapFallbackTravelItems() {
      return FALLBACK_TRAVEL_COUNTRIES.map((row) => {
        const code = String(row?.code || '').trim().toUpperCase();
        const title = String(row?.name || '').trim() || 'Country';
        const region = String(row?.region || '').trim();
        const capital = String(row?.capital || '').trim();
        const subtitle = [capital ? `Capital: ${capital}` : '', region].filter(Boolean).join(' | ') || 'Country';
        const flagImage = code ? `https://flagcdn.com/w640/${code.toLowerCase()}.png` : HOME_LOCAL_FALLBACK_IMAGE;
        const photoImage = buildTravelPhotoUrl(title, code) || flagImage;
        return {
          mediaType: 'travel',
          itemId: code || title.toLowerCase(),
          title,
          subtitle,
          extra: region || 'Travel',
          flagImage,
          listImage: flagImage,
          image: photoImage,
          backgroundImage: photoImage,
          spotlightImage: photoImage,
          spotlightMediaImage: flagImage,
          spotlightMediaFit: 'contain',
          spotlightMediaPosition: 'center center',
          spotlightMediaShape: 'square',
          fallbackImage: flagImage || HOME_LOCAL_FALLBACK_IMAGE,
          href: code ? `country.html?code=${encodeURIComponent(code)}` : 'travel.html'
        };
      }).filter((item) => String(item?.itemId || '').trim());
    }

    function mapTravelCountryToHomeItem(row) {
      const code = String(row?.cca2 || row?.cca3 || '').trim().toUpperCase();
      const title = String(row?.name?.common || row?.name?.official || '').trim();
      if (!code || !title) return null;
      const capital = Array.isArray(row?.capital)
        ? String(row.capital[0] || '').trim()
        : String(row?.capital || '').trim();
      const region = String(row?.region || '').trim();
      const subregion = String(row?.subregion || '').trim();
      const subtitle = [
        capital ? `Capital: ${capital}` : '',
        region
      ].filter(Boolean).join(' | ') || 'Country';
      const extra = [
        subregion && subregion !== region ? subregion : ''
      ].filter(Boolean).join(' | ');
      const flagImage = safeHttps(row?.flags?.png || row?.flags?.svg || '') || `https://flagcdn.com/w640/${code.toLowerCase()}.png`;
      const photoImage = buildTravelPhotoUrl(title, code) || flagImage;
      return {
        mediaType: 'travel',
        itemId: code,
        title,
        subtitle,
        extra: extra || 'Travel',
        flagImage,
        listImage: flagImage,
        image: photoImage,
        backgroundImage: photoImage,
        spotlightImage: photoImage,
        spotlightMediaImage: flagImage,
        spotlightMediaFit: 'contain',
        spotlightMediaPosition: 'center center',
        spotlightMediaShape: 'square',
        fallbackImage: flagImage || HOME_LOCAL_FALLBACK_IMAGE,
        href: `country.html?code=${encodeURIComponent(code)}`
      };
    }

    async function loadTravel(signal) {
      const fallbackItems = mapFallbackTravelItems();
      try {
        const payload = await fetchJsonWithPerfCache(REST_COUNTRIES_ALL_URL, {
          signal,
          cacheKey: 'restcountries:all:v3.1:home',
          ttlMs: 1000 * 60 * 60 * 12,
          timeoutMs: 9500,
          retries: 1
        });
        if (signal?.aborted) return [];
        const rows = Array.isArray(payload) ? payload : [];
        if (!rows.length) return fallbackItems.slice(0, HOME_CHANNEL_TARGET_ITEMS);

        const sortedRows = rows
          .filter((row) => row && (row.cca2 || row.cca3) && (row?.name?.common || row?.name?.official))
          .sort((a, b) => {
            const left = String(a?.name?.common || a?.name?.official || '').trim();
            const right = String(b?.name?.common || b?.name?.official || '').trim();
            return left.localeCompare(right);
          });

        const shortlist = shuffleArray(sortedRows.slice(0, Math.max(HOME_CHANNEL_TARGET_ITEMS * 5, 120)));
        const seenCodes = new Set();
        const out = [];

        const pushRow = (row) => {
          const item = mapTravelCountryToHomeItem(row);
          if (!item) return;
          const code = String(item.itemId || '').trim().toUpperCase();
          if (!code || seenCodes.has(code)) return;
          seenCodes.add(code);
          out.push(item);
        };

        shortlist.forEach(pushRow);
        if (out.length < HOME_CHANNEL_TARGET_ITEMS) {
          sortedRows.forEach(pushRow);
        }

        const safeItems = filterHomeSafeItems(out);
        if (safeItems.length) {
          return safeItems.slice(0, HOME_CHANNEL_TARGET_ITEMS);
        }
      } catch (_err) {}
      return fallbackItems.slice(0, HOME_CHANNEL_TARGET_ITEMS);
    }

    async function initUniversalHome() {
      setStatus('Loading spotlight and live feed...', false);
      resetSpotlightTimer(false);
      const channels = getHomeChannels();
      const initialChannels = channels;
      const cachedFeed = readHomeFeedCache();
      const baselineFeed = cachedFeed || null;
      let quickFallbackFeed = null;
      const precomputedFeedPromise = loadPrecomputedHomeFeed().catch(() => null);

      if (!baselineFeed) {
        quickFallbackFeed = buildInstantFallbackFeed();
        const quickResult = applyHomeFeedMap(quickFallbackFeed);
        if (quickResult.scoredPool.length) {
          setStatus('Quick feed ready. Syncing live data...', false);
        }
      }

      if (baselineFeed) {
        const cachedResult = applyHomeFeedMap(baselineFeed);
        if (cachedResult.scoredPool.length) {
          setStatus(cachedFeed ? 'Feed ready from cache. Syncing live data...' : 'Feed ready. Syncing live data...', false);
        }
      }

      const tastePromise = loadTasteWeights().catch(() => homeTasteWeights);
      void tastePromise.then((weights) => {
        if (weights && typeof weights === 'object') {
          homeTasteWeights = weights;
        }
      }).catch(() => {});
      const loadedPromise = Promise.all(initialChannels.map(async (channel) => {
        const items = await loadHomeChannelWithTimeout(channel.loader, Number(channel.timeoutMs || HOME_CHANNEL_TIMEOUT_MS));
        return { ...channel, items };
      }));
      let mergeBaselineFeed = baselineFeed || quickFallbackFeed;
      const precomputedFeed = await withTimeout(precomputedFeedPromise, 220, null);
      if (precomputedFeed) {
        const precomputedActiveChannels = countActiveHomeChannels(precomputedFeed);
        const baselineActiveChannels = countActiveHomeChannels(baselineFeed);
        if (precomputedActiveChannels > baselineActiveChannels) {
          const precomputedResult = applyHomeFeedMap(precomputedFeed);
          if (precomputedResult.scoredPool.length) {
            setStatus('Spotlight ready from precomputed feed. Syncing live data...', false);
            mergeBaselineFeed = precomputedFeed;
          }
        }
      }

      const loaded = await loadedPromise;

      const mergedFeed = {};
      const loadedByKey = new Map(loaded.map((channel) => [channel.key, channel]));
      channels.forEach((channel) => {
        const loadedChannel = loadedByKey.get(channel.key);
        const freshItems = Array.isArray(loadedChannel?.items) ? loadedChannel.items : [];
        const cachedItems = Array.isArray(mergeBaselineFeed?.[channel.key]) ? mergeBaselineFeed[channel.key] : [];
        mergedFeed[channel.key] = freshItems.length ? freshItems : cachedItems;
      });

      const { scoredPool } = applyHomeFeedMap(mergedFeed);

      if (!scoredPool.length) {
        homeSpotlightItems = [{
          mediaType: 'movie',
          title: 'No live spotlight yet',
          subtitle: 'We are refreshing your feed',
          extra: 'Try again in a moment.',
          image: '',
          spotlightImage: '',
          spotlightMediaImage: '',
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          href: 'movies.html',
          discoveryScore: 0.5
        }];
        showSpotlightByIndex(0, false);
        resetSpotlightTimer(false);
        setStatus('Could not load live feeds right now. Try again shortly.', true);
        return;
      }

      const initialChannelsCount = initialChannels.length;
      const freshActiveChannels = loaded.filter((channel) => Array.isArray(channel.items) && channel.items.length).length;
      if (freshActiveChannels > 0) {
        writeHomeFeedCache(mergedFeed);
        writePrecomputedHomeFeedCache(mergedFeed, {
          savedAt: Date.now(),
          expiresAt: Date.now() + HOME_PRECOMPUTED_FEED_MAX_AGE_MS
        });
      }
      if (freshActiveChannels === initialChannelsCount) {
        setStatus(`Live feed ready. ${freshActiveChannels}/${initialChannelsCount} core channels live.`, false);
      } else if (freshActiveChannels === 0) {
        if (cachedFeed) {
          setStatus('Feed loaded from cache. Live sources are slow right now.', false);
        } else {
          setStatus('Showing quick feed while live sources connect...', false);
        }
      } else {
        setStatus(`Live feed ready. ${freshActiveChannels}/${initialChannelsCount} core channels live.`, false);
      }

      scheduleHomeMenuCachePrime();
    }

    document.addEventListener('DOMContentLoaded', () => {
      void initUniversalHome();

      void (async () => {
        await setupHomeAuthListener();
        await completeHomeOAuthReturnIfNeeded();
        await initAuthUi();
        maybeShowHomeOnboarding();
        void refreshHomePersonalization();
        scheduleHomeMenuCachePrime();
      })();

      const itemMenuModal = document.getElementById('itemMenuModal');
      const createListModal = document.getElementById('createListModal');
      const nextSpotlightBtn = document.getElementById('spotlightNextBtn');
      const spotlightSection = document.getElementById('spotlightSection');

      document.querySelectorAll('.menu-icon-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.menu-icon-option').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          homeItemMenuState.selectedIcon = btn.getAttribute('data-icon') || 'fas fa-list';
        });
      });

      document.getElementById('closeMenuModalBtn')?.addEventListener('click', closeItemMenuModal);
      document.getElementById('closeCreateModalBtn')?.addEventListener('click', closeAllItemMenuModals);
      document.getElementById('cancelCreateBtn')?.addEventListener('click', closeAllItemMenuModals);
      document.getElementById('menuCreateListBtn')?.addEventListener('click', openCreateListModalFromMenu);
      document.getElementById('saveNewListBtn')?.addEventListener('click', () => {
        void saveNewCustomListFromMenu();
      });

      if (nextSpotlightBtn) {
        nextSpotlightBtn.addEventListener('click', () => {
          showSpotlightByIndex(homeSpotlightIndex + 1, true);
          resetSpotlightTimer(true);
        });
      }

      if (spotlightSection) {
        spotlightSection.addEventListener('click', (event) => {
          if (isSpotlightInteractiveTarget(event.target)) return;
          openCurrentSpotlightItem();
        });
        spotlightSection.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          if (isSpotlightInteractiveTarget(event.target)) return;
          event.preventDefault();
          openCurrentSpotlightItem();
        });
      }

      [itemMenuModal, createListModal].forEach((modal) => {
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeAllItemMenuModals();
            }
          });
        }
      });

      if (itemMenuModal) {
        itemMenuModal.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeItemMenuModal();
        });
      }

      const newListNameInput = document.getElementById('newListNameInput');
      if (newListNameInput) {
        newListNameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void saveNewCustomListFromMenu();
          }
        });
      }

      if (window.initUniversalSearch) {
        window.initUniversalSearch({
          input: '#globalSearch',
          fallbackRoute: 'movies.html'
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllRailMenus();
          closeAllItemMenuModals();
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          resetSpotlightTimer(false);
        } else {
          resetSpotlightTimer(true);
        }
      });

      const syncModalViewportOnViewportChange = () => {
        syncActiveMenuModalViewports();
      };
      window.addEventListener('scroll', syncModalViewportOnViewportChange, { passive: true });
      window.addEventListener('resize', syncModalViewportOnViewportChange);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('scroll', syncModalViewportOnViewportChange);
        window.visualViewport.addEventListener('resize', syncModalViewportOnViewportChange);
      }
    });
