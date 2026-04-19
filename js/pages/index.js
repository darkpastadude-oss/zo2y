    const ENABLE_GAMES = true;
    const ENABLE_RESTAURANTS = false;
    const ENABLE_FASHION = window.ZO2Y_DISABLE_FASHION !== true;
    const ENABLE_FOOD = window.ZO2Y_DISABLE_FOOD !== true;
    const ENABLE_CARS = window.ZO2Y_DISABLE_CARS !== true;
    const HOME_BASE_MEDIA_TYPES = ENABLE_GAMES
      ? ['movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'sports']
      : ['movie', 'tv', 'anime', 'book', 'music', 'travel', 'sports'];
    const HOME_LIFESTYLE_MEDIA_TYPES = [
      ...(ENABLE_FASHION ? ['fashion'] : []),
      ...(ENABLE_FOOD ? ['food'] : []),
      ...(ENABLE_CARS ? ['car'] : []),
      ...(ENABLE_RESTAURANTS ? ['restaurant'] : [])
    ];
    const HOME_ACTIVE_MEDIA_TYPES = [...HOME_BASE_MEDIA_TYPES, ...HOME_LIFESTYLE_MEDIA_TYPES];
    if (window.ZO2Y_SPORTS_LISTS == null) {
      window.ZO2Y_SPORTS_LISTS = true;
    }
    const HOME_LIST_MEDIA_TYPES = HOME_ACTIVE_MEDIA_TYPES.filter((type) => type !== 'sports' || window.ZO2Y_SPORTS_LISTS !== false);
    const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
    const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
    const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
    const IGDB_PROXY_BASE = '/api/igdb';
    const TMDB_PROXY_BASE = '/api/tmdb';
    const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
    const TMDB_SPOT_POSTER = 'https://image.tmdb.org/t/p/w780';
    const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
    const SPORTSDB_PROXY_BASE = String(window.ZO2Y_SPORTSDB_PROXY || '/api/sportsdb').trim() || '/api/sportsdb';
    const SPORTSDB_DIRECT_KEY = String(window.ZO2Y_SPORTSDB_KEY || '3').trim() || '3';
    const SPORTSDB_DIRECT_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_DIRECT_KEY}`;
    const REST_COUNTRIES_ALL_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,flags';
    const FALLBACK_RESTAURANTS = [
      { id: 'fallback-r1', name: 'Top Rated Picks', category: 'Community', rating: '4.8' },
      { id: 'fallback-r2', name: 'Most Saved', category: 'Trending', rating: '4.7' },
      { id: 'fallback-r3', name: 'Local Favorites', category: 'Local', rating: '4.9' },
      { id: 'fallback-r4', name: 'Date Night', category: 'Curated', rating: '4.7' },
      { id: 'fallback-r5', name: 'Quick Bites', category: 'Casual', rating: '4.6' }
    ];
    const HOME_FASHION_FALLBACKS = [
      { id: 'fab6ce34-9e00-4d2a-a4ad-ebb69a8a318c', name: 'Nike', category: 'Sportswear', domain: 'nike.com' },
      { id: '1982d6c7-716d-4f92-8529-039e03d83b72', name: 'Adidas', category: 'Sportswear', domain: 'adidas.com' },
      { id: '520d0db2-1e34-4076-9db7-06b7dccc9643', name: 'Zara', category: 'Fast Fashion', domain: 'zara.com' },
      { id: '1d7003d5-dcce-4506-8cb3-2da40b6e8f24', name: 'Uniqlo', category: 'Basics', domain: 'uniqlo.com' },
      { id: '6c5bbaa5-7007-4c62-b143-e5f89926b649', name: 'H&M', category: 'Fast Fashion', domain: 'hm.com' },
      { id: 'a733512f-2667-4e87-9486-ec2be20fc557', name: 'Gucci', category: 'Luxury', domain: 'gucci.com' },
      { id: '0d44e575-c7d4-40fc-9489-1eaa69cb7663', name: 'Prada', category: 'Luxury', domain: 'prada.com' },
      { id: 'dfe029f5-dee4-434a-bb6c-5015bc36c334', name: 'Louis Vuitton', category: 'Luxury', domain: 'louisvuitton.com' },
      { id: '12cc4be0-7adb-4d3a-95eb-dfa0f7304ba1', name: 'Off-White', category: 'Streetwear', domain: 'offwhite.com' },
      { id: '290578ce-6e4c-4e90-9e89-355a36946174', name: 'Supreme', category: 'Streetwear', domain: 'supremenewyork.com' }
    ];
    const HOME_FOOD_FALLBACKS = [
      { id: 'b5be652a-1f9b-498c-90c8-325cb9e2d887', name: "McDonald's", category: 'Fast Food', domain: 'mcdonalds.com' },
      { id: 'ae58f6af-fc0c-48bc-893b-22b8c9bea2f3', name: 'KFC', category: 'Fast Food', domain: 'kfc.com' },
      { id: 'e89ab03c-f3eb-4e8a-9ac6-7a78dd8cfebf', name: 'Burger King', category: 'Fast Food', domain: 'burgerking.com' },
      { id: 'e43b76c1-9592-4451-a376-beb5cadaead0', name: 'Subway', category: 'Fast Food', domain: 'subway.com' },
      { id: 'dcbdebe1-e413-45f3-b73b-3680c7449687', name: 'Taco Bell', category: 'Fast Food', domain: 'tacobell.com' },
      { id: '212ce36e-df31-4c8e-a8f1-8640b5b47602', name: 'Starbucks', category: 'Coffee', domain: 'starbucks.com' },
      { id: '65836949-6f8c-4d12-9601-1b37030a8d4f', name: "Domino's", category: 'Pizza', domain: 'dominos.com' },
      { id: 'e2e4a465-c9e9-4124-b600-4e587e973b52', name: 'Pizza Hut', category: 'Pizza', domain: 'pizzahut.com' },
      { id: '52404f08-2659-45b4-995a-d2fcddcb262c', name: 'Chipotle', category: 'Fast Casual', domain: 'chipotle.com' },
      { id: '86bfe99e-87a9-46ef-9606-92fe9127a120', name: 'Shake Shack', category: 'Fast Casual', domain: 'shakeshack.com' }
    ];
    const HOME_CAR_FALLBACKS = [
      { id: 'b4bd539e-490f-406a-89b0-6d4c52043154', name: 'Toyota', category: 'Automaker', domain: 'toyota.com' },
      { id: '8d466b94-2cde-446b-b17f-05160ce9c92a', name: 'Honda', category: 'Automaker', domain: 'honda.com' },
      { id: '8a5091a6-a0b6-46ae-9adf-9ef96012fe1d', name: 'BMW', category: 'Luxury', domain: 'bmw.com' },
      { id: 'd569b2c2-8738-4f3a-b2aa-066d6b7a303d', name: 'Mercedes-Benz', category: 'Luxury', domain: 'mercedes-benz.com' },
      { id: '7125a959-48c6-458b-873f-3256ecba9813', name: 'Audi', category: 'Luxury', domain: 'audi.com' },
      { id: '163c6005-e94b-4b0d-ae95-b9210bd20571', name: 'Ford', category: 'Automaker', domain: 'ford.com' },
      { id: 'c65e5725-4f9a-40ab-97b1-51b17ecfd52a', name: 'Chevrolet', category: 'Automaker', domain: 'chevrolet.com' },
      { id: 'ae7822a8-c2cc-462b-84bc-16f70c256992', name: 'Tesla', category: 'EV', domain: 'tesla.com' }
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
    const HOME_SPORTS_SEEDS = [
      'Real Madrid',
      'FC Barcelona',
      'Liverpool',
      'Manchester City',
      'Arsenal',
      'Bayern Munich',
      'Paris Saint-Germain',
      'Inter Miami',
      'Los Angeles Lakers',
      'Golden State Warriors',
      'Boston Celtics',
      'Chicago Bulls',
      'Kansas City Chiefs',
      'Dallas Cowboys',
      'New York Yankees',
      'Los Angeles Dodgers',
      'Toronto Maple Leafs',
      'Ferrari',
      'Mercedes AMG Petronas',
      'Red Bull Racing',
      'Mumbai Indians',
      'New Zealand All Blacks'
    ];
    const HOME_MEDIA_META = {
      restaurant: { label: 'Restaurant', icon: 'fa-clapperboard', accent: '#f59e0b' },
      fashion: { label: 'Fashion', icon: 'fa-shirt', accent: '#38bdf8' },
      food: { label: 'Food', icon: 'fa-burger', accent: '#f59e0b' },
      car: { label: 'Cars', icon: 'fa-car', accent: '#ef4444' },
      movie: { label: 'Movie', icon: 'fa-film', accent: '#ef4444' },
      tv: { label: 'TV', icon: 'fa-tv', accent: '#22c55e' },
      anime: { label: 'Anime', icon: 'fa-dragon', accent: '#f97316' },
      ...(ENABLE_GAMES ? { game: { label: 'Game', icon: 'fa-gamepad', accent: '#38bdf8' } } : {}),
      book: { label: 'Book', icon: 'fa-book', accent: '#f97316' },
      music: { label: 'Music', icon: 'fa-music', accent: '#f59e0b' },
      travel: { label: 'Travel', icon: 'fa-earth-americas', accent: '#22d3ee' },
      sports: { label: 'Sports', icon: 'fa-futbol', accent: '#f59e0b' }
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
      travel: { table: 'travel_list_items', itemField: 'country_code' },
      ...(ENABLE_FASHION ? { fashion: { table: 'fashion_list_items', itemField: 'brand_id' } } : {}),
      ...(ENABLE_FOOD ? { food: { table: 'food_list_items', itemField: 'brand_id' } } : {}),
      ...(ENABLE_CARS ? { car: { table: 'car_list_items', itemField: 'brand_id' } } : {})
    };
    const HOME_REVIEW_SIGNAL_TABLES = {
      movie: { table: 'movie_reviews', itemField: 'movie_id' },
      tv: { table: 'tv_reviews', itemField: 'tv_id' },
      anime: { table: 'anime_reviews', itemField: 'anime_id' },
      ...(ENABLE_GAMES ? { game: { table: 'game_reviews', itemField: 'game_id' } } : {}),
      book: { table: 'book_reviews', itemField: 'book_id' },
      music: { table: 'music_reviews', itemField: 'track_id' },
      travel: { table: 'travel_reviews', itemField: 'country_code' }
    };
    const HOME_FEED_CACHE_KEY = 'zo2y_home_feed_cache_v12';
    const HOME_FEED_CACHE_MAX_AGE_MS = 1000 * 60 * 90;
    const HOME_PRECOMPUTED_FEED_CACHE_KEY = 'zo2y_home_precomputed_feed_v12';
    const HOME_PRECOMPUTED_FEED_MAX_AGE_MS = 1000 * 60 * 20;
    const HOME_TRAVEL_PHOTO_CACHE_KEY = 'zo2y_travel_photo_cache_v7';
    const HOME_TRAVEL_PHOTO_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
    const HOME_TRAVEL_COUNTRY_ROWS_CACHE_KEY = 'zo2y_travel_country_rows_v4';
    const HOME_TRAVEL_COUNTRY_ROWS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12;
    const HOME_TRAVEL_ITEMS_CACHE_KEY = 'zo2y_home_travel_items_v4';
    const HOME_TRAVEL_ITEMS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
    const HOME_TRAVEL_BUCKET_NAME = 'travel-photos';
    const HOME_SPOTLIGHT_BUCKET_NAME = 'home-spotlights';
    const HOME_BRAND_BACKGROUND_BUCKET_NAME = 'brand-backgrounds';
    const HOME_TRAVEL_BUCKET_MANIFEST_CACHE_KEY = 'zo2y_travel_bucket_manifest_v1';
    const HOME_TRAVEL_BUCKET_MANIFEST_TTL_MS = 1000 * 60 * 60 * 24 * 7;
    const HOME_TRAVEL_BUCKET_MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/${HOME_TRAVEL_BUCKET_NAME}/manifest/travel-photo-manifest.json`;
    const HOME_BRAND_BACKGROUND_MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/${HOME_BRAND_BACKGROUND_BUCKET_NAME}/manifest/brand-backgrounds.json`;
    const HOME_TRAVEL_FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>
        <defs>
          <linearGradient id='sky' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#0b1c35'/>
            <stop offset='45%' stop-color='#143a6a'/>
            <stop offset='100%' stop-color='#0f274b'/>
          </linearGradient>
          <linearGradient id='glow' x1='0' y1='1' x2='1' y2='0'>
            <stop offset='0%' stop-color='#1fb5ff' stop-opacity='0.2'/>
            <stop offset='70%' stop-color='#f59e0b' stop-opacity='0.12'/>
            <stop offset='100%' stop-color='#fef08a' stop-opacity='0.25'/>
          </linearGradient>
        </defs>
        <rect width='1600' height='900' fill='url(#sky)'/>
        <circle cx='1220' cy='180' r='180' fill='#f59e0b' opacity='0.18'/>
        <path d='M0 620 C 260 520 520 640 800 560 C 1080 480 1320 580 1600 520 L1600 900 L0 900 Z' fill='#0a1a31'/>
        <path d='M0 700 C 280 620 560 720 860 640 C 1120 570 1360 640 1600 600 L1600 900 L0 900 Z' fill='#101f3b'/>
        <rect width='1600' height='900' fill='url(#glow)'/>
      </svg>
    `)}`;
    const HOME_TRAVEL_FALLBACKS = [
      { code: 'US', name: 'United States', capital: 'Washington, D.C.', region: 'North America', subregion: 'Northern America' },
      { code: 'GB', name: 'United Kingdom', capital: 'London', region: 'Europe', subregion: 'Northern Europe' },
      { code: 'FR', name: 'France', capital: 'Paris', region: 'Europe', subregion: 'Western Europe' },
      { code: 'IT', name: 'Italy', capital: 'Rome', region: 'Europe', subregion: 'Southern Europe' },
      { code: 'JP', name: 'Japan', capital: 'Tokyo', region: 'Asia', subregion: 'Eastern Asia' },
      { code: 'EG', name: 'Egypt', capital: 'Cairo', region: 'Africa', subregion: 'Northern Africa' },
      { code: 'SA', name: 'Saudi Arabia', capital: 'Riyadh', region: 'Asia', subregion: 'Western Asia' },
      { code: 'AE', name: 'United Arab Emirates', capital: 'Abu Dhabi', region: 'Asia', subregion: 'Western Asia' },
      { code: 'BR', name: 'Brazil', capital: 'Brasilia', region: 'South America', subregion: 'South America' },
      { code: 'MX', name: 'Mexico', capital: 'Mexico City', region: 'North America', subregion: 'Central America' },
      { code: 'AU', name: 'Australia', capital: 'Canberra', region: 'Oceania', subregion: 'Australia and New Zealand' },
      { code: 'ZA', name: 'South Africa', capital: 'Pretoria', region: 'Africa', subregion: 'Southern Africa' }
    ];
    const HOME_SPORTS_ITEMS_CACHE_KEY = 'zo2y_home_sports_items_v1';
    const HOME_SPORTS_ITEMS_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
    const HOME_PRECOMPUTED_FETCH_TIMEOUT_MS = 900;
    const HOME_HTTP_CACHE_TTL_MS = 1000 * 60 * 5;
    const HOME_PRECOMPUTE_TABLE = 'home_spotlight_cache';
    const HOME_PUBLIC_FEED_ENDPOINT = '/api/home-feed';
    const HOME_CHANNEL_TIMEOUT_MS = 8000;
    const HOME_BOOKS_FETCH_TIMEOUT_MS = 2200;
    const HOME_LOCAL_FALLBACK_IMAGE = '/newlogo.webp';
    const SPOTLIGHT_ROTATE_MS = 5000;
    const HOME_CHANNEL_TARGET_ITEMS = 16;
    const HOME_SPOTLIGHT_POOL_SIZE = 20;
    const HOME_NEW_RELEASES_TARGET_ITEMS = 16;
    const HOME_NEW_RELEASES_TIMEOUT_MS = 5600;
    const HOME_NEW_RELEASES_REFRESH_MS = 1000 * 60 * 45;
const HOME_EAGER_IMAGE_COUNT = 1;
const HOME_HIGH_PRIORITY_IMAGE_COUNT = 1;
    const HOME_PRELOAD_PER_CHANNEL = 0;
    const HOME_PRELOAD_SPOTLIGHT_COUNT = 1;
    const HOME_UNIFIED_TARGET_ITEMS = 24;
    const HOME_BECAUSE_SIGNAL_CACHE_MS = 1000 * 60 * 3;
    const HOME_BECAUSE_MAX_FOLLOWED_USERS = 24;
    const HOME_BECAUSE_SIGNAL_RECENCY_HOURS = 24 * 21;
    const HOME_TASTE_PROFILE_TOKEN_LIMIT = 56;
    const HOME_TASTE_PROFILE_REVIEW_LIMIT = 84;
    const HOME_TASTE_MIN_TOKEN_LENGTH = 3;
    const HOME_TASTE_STOPWORDS = new Set([
      'about', 'after', 'again', 'all', 'and', 'are', 'around', 'back', 'best', 'but',
      'day', 'days', 'episode', 'film', 'for', 'from', 'game', 'gets', 'has', 'have',
      'into', 'its', 'just', 'latest', 'live', 'more', 'movie', 'new', 'now', 'off',
      'one', 'only', 'our', 'out', 'over', 'pick', 'picks', 'show', 'shows', 'song',
      'still', 'that', 'the', 'their', 'them', 'this', 'title', 'top', 'track', 'tv',
      'watch', 'with', 'your'
    ]);
    const HOME_MENU_PRIME_IDLE_DELAY_MS = 2500;
    const HOME_ONBOARDING_VERSION = 'v2';
    const HOME_POST_AUTH_BOOTSTRAP_KEY = 'zo2y_post_auth_bootstrap_v1';
    const PROFILE_USERNAME_MAX_LENGTH = 30;
    const HOME_RESUME_REFRESH_THROTTLE_MS = 1000 * 60 * 15;
    const HOME_PERSONALIZATION_THROTTLE_MS = 1000 * 60 * 5;

    const HOME_DEBUG_STORAGE_KEY = 'zo2y_home_debug_v1';
    const HOME_DEBUG_MAX_EVENTS = 160;

    function isHomeDebugEnabled() {
      try {
        const params = new URLSearchParams(window.location.search || '');
        if (params.get('debug') === '1') return true;
      } catch (_err) {}
      try {
        return String(localStorage.getItem(HOME_DEBUG_STORAGE_KEY) || '') === '1';
      } catch (_err) {
        return false;
      }
    }

    function setHomeDebugEnabled(enabled) {
      try {
        localStorage.setItem(HOME_DEBUG_STORAGE_KEY, enabled ? '1' : '0');
      } catch (_err) {}
    }

    const homeDebugState = {
      enabled: false,
      channels: new Map(),
      events: [],
      panel: null,
      panelBody: null,
      lastRenderAt: 0
    };

    function homeDebugNow() {
      try {
        return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      } catch (_err) {
        return Date.now();
      }
    }

    function homeDebugEvent(type, payload = {}) {
      if (!homeDebugState.enabled) return;
      const safe = payload && typeof payload === 'object' ? payload : { value: payload };
      homeDebugState.events.push({
        t: Date.now(),
        type: String(type || 'event'),
        ...safe
      });
      if (homeDebugState.events.length > HOME_DEBUG_MAX_EVENTS) {
        homeDebugState.events.splice(0, homeDebugState.events.length - HOME_DEBUG_MAX_EVENTS);
      }
      scheduleHomeDebugRender();
    }

    function formatHomeDebugTime(ts) {
      const d = new Date(ts);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function ensureHomeDebugPanel() {
      if (!homeDebugState.enabled) return null;
      if (homeDebugState.panel && homeDebugState.panelBody) return homeDebugState.panel;
      try {
        const panel = document.createElement('div');
        panel.id = 'homeDebugPanel';
        panel.style.cssText = [
          'position:fixed',
          'right:12px',
          'bottom:12px',
          'z-index:99999',
          'width:min(520px, calc(100vw - 24px))',
          'max-height:min(70vh, 520px)',
          'overflow:hidden',
          'border:1px solid rgba(255,255,255,0.14)',
          'border-radius:14px',
          'background:rgba(10, 18, 40, 0.92)',
          'backdrop-filter: blur(10px)',
          'box-shadow: 0 18px 60px rgba(0,0,0,0.45)',
          'color:#e6edf3',
          'font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace'
        ].join(';');

        const head = document.createElement('div');
        head.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 10px;border-bottom:1px solid rgba(255,255,255,0.10)';
        head.innerHTML = `
          <div style="display:flex;gap:10px;align-items:center;min-width:0">
            <strong style="font-weight:800;letter-spacing:0.2px">Home Debug</strong>
            <span style="color:rgba(230,237,243,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">?debug=1 / localStorage:${HOME_DEBUG_STORAGE_KEY}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button type="button" data-home-debug-action="copy" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#e6edf3;border-radius:10px;padding:6px 8px;cursor:pointer">Copy</button>
            <button type="button" data-home-debug-action="close" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#e6edf3;border-radius:10px;padding:6px 8px;cursor:pointer">Close</button>
          </div>
        `;

        const body = document.createElement('div');
        body.style.cssText = 'padding:10px;overflow:auto;max-height:calc(min(70vh, 520px) - 44px)';

        panel.appendChild(head);
        panel.appendChild(body);
        document.body.appendChild(panel);

        panel.addEventListener('click', async (e) => {
          const btn = e.target?.closest?.('button[data-home-debug-action]');
          if (!btn) return;
          const action = String(btn.getAttribute('data-home-debug-action') || '').trim();
          if (action === 'close') {
            setHomeDebugEnabled(false);
            homeDebugState.enabled = false;
            try { panel.remove(); } catch (_err) {}
            return;
          }
          if (action === 'copy') {
            try {
              const text = JSON.stringify(buildHomeDebugSnapshot(), null, 2);
              if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
              }
            } catch (_err) {}
          }
        });

        homeDebugState.panel = panel;
        homeDebugState.panelBody = body;
        return panel;
      } catch (_err) {
        return null;
      }
    }

    function buildHomeDebugSnapshot() {
      const channels = {};
      homeDebugState.channels.forEach((value, key) => {
        channels[key] = value;
      });
      return {
        at: new Date().toISOString(),
        authGate: (() => {
          try { return getHomeAuthGateState(); } catch (_err) { return null; }
        })(),
        channels,
        events: homeDebugState.events.slice(-80)
      };
    }

    function scheduleHomeDebugRender() {
      if (!homeDebugState.enabled) return;
      const now = Date.now();
      if (homeDebugState.lastRenderAt && (now - homeDebugState.lastRenderAt) < 120) return;
      homeDebugState.lastRenderAt = now;
      requestAnimationFrame(() => {
        renderHomeDebugPanel();
      });
    }

    function escapeHomeDebugHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderHomeDebugPanel() {
      if (!homeDebugState.enabled) return;
      ensureHomeDebugPanel();
      const body = homeDebugState.panelBody;
      if (!body) return;

      const rows = [];
      const sorted = Array.from(homeDebugState.channels.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      sorted.forEach(([key, state]) => {
        const last = state?.last || {};
        const status = escapeHomeDebugHtml(last.status || 'unknown');
        const ms = Number.isFinite(Number(last.ms)) ? `${Math.round(Number(last.ms))}ms` : '';
        const items = Number.isFinite(Number(last.items)) ? `${Number(last.items)} items` : '';
        const when = last.endedAt ? formatHomeDebugTime(Number(last.endedAt)) : '';
        const reason = escapeHomeDebugHtml(last.reason || '');
        rows.push(`<div style="display:grid;grid-template-columns: 92px 1fr;gap:10px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.08)">
          <div style="color:rgba(230,237,243,0.85)"><strong>${escapeHomeDebugHtml(key)}</strong></div>
          <div style="color:rgba(230,237,243,0.72)">
            <span style="color:${status === 'ok' ? '#34d399' : (status === 'timeout' ? '#f59e0b' : (status === 'error' ? '#fb7185' : '#93c5fd'))};font-weight:800">${status}</span>
            <span style="margin-left:8px">${escapeHomeDebugHtml(items)}</span>
            <span style="margin-left:8px">${escapeHomeDebugHtml(ms)}</span>
            <span style="margin-left:8px">${escapeHomeDebugHtml(when)}</span>
            ${reason ? `<div style="margin-top:4px;color:rgba(230,237,243,0.55)">${reason}</div>` : ''}
          </div>
        </div>`);
      });

      const tailEvents = homeDebugState.events.slice(-10).map((ev) => {
        const time = formatHomeDebugTime(ev.t);
        const line = `${time} ${String(ev.type || 'event')}`;
        const detail = Object.entries(ev)
          .filter(([k]) => k !== 't' && k !== 'type')
          .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(' ');
        return `<div style="padding:2px 0;color:rgba(230,237,243,0.55)">${escapeHomeDebugHtml(line)} ${escapeHomeDebugHtml(detail)}</div>`;
      }).join('');

      body.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="color:rgba(230,237,243,0.72)">Channels (last attempt)</div>
          <div style="color:rgba(230,237,243,0.55)">Tip: open DevTools Console for stack traces.</div>
        </div>
        <div>${rows.join('') || '<div style="color:rgba(230,237,243,0.55)">No channel data yet.</div>'}</div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.10)">
          <div style="color:rgba(230,237,243,0.72);margin-bottom:6px">Recent events</div>
          ${tailEvents || '<div style="color:rgba(230,237,243,0.55)">No events yet.</div>'}
        </div>
      `;
    }
    const HOME_TASTE_WEIGHTS_CACHE_MS = 1000 * 60 * 10;
const HOME_DEFERRED_IMAGE_ROOT_MARGIN = '80px 0px';
    const HOME_TRAVEL_VARIANT_SESSION_SEED = Math.floor(Math.random() * 2147483647);
    const HOME_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
        <rect width='24' height='24' fill='#10224a'/>
      </svg>
    `)}`;
    function getHomePublicBucketUrl(bucketName, filePath) {
      const bucket = String(bucketName || '').trim();
      const targetPath = String(filePath || '').trim().replace(/^\/+/, '');
      if (!bucket || !targetPath) return '';
      const encodedPath = targetPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
    }
    const HOME_BOOK_SPOTLIGHT_BG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>
        <defs>
          <linearGradient id='paperGrad' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#f7f0e4' />
            <stop offset='52%' stop-color='#efe5d2' />
            <stop offset='100%' stop-color='#f4e9d8' />
          </linearGradient>
        </defs>
        <rect width='1600' height='900' fill='url(#paperGrad)' />
        <circle cx='1320' cy='200' r='220' fill='rgba(248,200,138,0.22)' />
        <circle cx='260' cy='740' r='260' fill='rgba(188,214,240,0.18)' />
        <circle cx='940' cy='660' r='190' fill='rgba(205,231,214,0.18)' />
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
    const HOME_FASHION_SPOTLIGHT_BG = getHomePublicBucketUrl(HOME_SPOTLIGHT_BUCKET_NAME, 'fashion.jpg');
    const HOME_FOOD_SPOTLIGHT_BG = getHomePublicBucketUrl(HOME_SPOTLIGHT_BUCKET_NAME, 'food.jpg');
    const HOME_CAR_SPOTLIGHT_BG = getHomePublicBucketUrl(HOME_SPOTLIGHT_BUCKET_NAME, 'cars.jpg');
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
    const HOME_INTEREST_OPTIONS = [
      { id: 'movie', label: 'Movies', kind: 'type', tags: ['movie', 'movies'] },
      { id: 'tv', label: 'TV Shows', kind: 'type', tags: ['tv', 'television', 'show', 'series'] },
      { id: 'anime', label: 'Anime', kind: 'type', tags: ['anime'] },
      ...(ENABLE_GAMES ? [{ id: 'game', label: 'Games', kind: 'type', tags: ['game', 'games', 'gaming'] }] : []),
      { id: 'book', label: 'Books', kind: 'type', tags: ['book', 'books', 'reading'] },
      { id: 'music', label: 'Music', kind: 'type', tags: ['music'] },
      { id: 'travel', label: 'Travel', kind: 'type', tags: ['travel'] },
      { id: 'sports', label: 'Sports', kind: 'type', tags: ['sports'] },
      ...(ENABLE_FASHION ? [{ id: 'fashion', label: 'Fashion', kind: 'type', tags: ['fashion', 'style', 'clothing'] }] : []),
      ...(ENABLE_FOOD ? [{ id: 'food', label: 'Food', kind: 'type', tags: ['food', 'restaurants', 'fast food', 'dining'] }] : []),
      { id: 'action', label: 'Action', kind: 'tag', tags: ['action'] },
      { id: 'adventure', label: 'Adventure', kind: 'tag', tags: ['adventure'] },
      { id: 'animation', label: 'Animation', kind: 'tag', tags: ['animation', 'animated'] },
      { id: 'comedy', label: 'Comedy', kind: 'tag', tags: ['comedy', 'funny'] },
      { id: 'crime', label: 'Crime', kind: 'tag', tags: ['crime', 'true crime'] },
      { id: 'documentary', label: 'Documentary', kind: 'tag', tags: ['documentary', 'doc'] },
      { id: 'drama', label: 'Drama', kind: 'tag', tags: ['drama'] },
      { id: 'family', label: 'Family', kind: 'tag', tags: ['family'] },
      { id: 'fantasy', label: 'Fantasy', kind: 'tag', tags: ['fantasy'] },
      { id: 'history', label: 'History', kind: 'tag', tags: ['history', 'historical'] },
      { id: 'horror', label: 'Horror', kind: 'tag', tags: ['horror'] },
      { id: 'mystery', label: 'Mystery', kind: 'tag', tags: ['mystery'] },
      { id: 'romance', label: 'Romance', kind: 'tag', tags: ['romance', 'rom-com', 'romcom'] },
      { id: 'sci-fi', label: 'Sci-Fi', kind: 'tag', tags: ['sci-fi', 'scifi', 'science fiction'] },
      { id: 'thriller', label: 'Thriller', kind: 'tag', tags: ['thriller'] },
      { id: 'war', label: 'War', kind: 'tag', tags: ['war', 'military'] },
      { id: 'western', label: 'Western', kind: 'tag', tags: ['western'] },
      { id: 'musical', label: 'Musical', kind: 'tag', tags: ['music', 'musical'] },
      { id: 'reality', label: 'Reality TV', kind: 'tag', tags: ['reality', 'unscripted'] },
      { id: 'soccer', label: 'Soccer', kind: 'tag', tags: ['soccer', 'football'] },
      { id: 'basketball', label: 'Basketball', kind: 'tag', tags: ['basketball'] },
      { id: 'boxing', label: 'Boxing', kind: 'tag', tags: ['boxing'] },
      { id: 'mma', label: 'MMA', kind: 'tag', tags: ['mma', 'ufc'] },
      { id: 'motorsport', label: 'Motorsport', kind: 'tag', tags: ['motorsport', 'formula 1', 'f1', 'racing'] },
      { id: 'tennis', label: 'Tennis', kind: 'tag', tags: ['tennis'] },
      { id: 'esports', label: 'Esports', kind: 'tag', tags: ['esports', 'e-sports', 'gaming'] },
      { id: 'streetwear', label: 'Streetwear', kind: 'tag', tags: ['streetwear', 'sneakers'] },
      { id: 'luxury', label: 'Luxury', kind: 'tag', tags: ['luxury', 'couture', 'designer'] },
      { id: 'fastfood', label: 'Fast Food', kind: 'tag', tags: ['fast food', 'fastfood'] },
      { id: 'coffee', label: 'Coffee', kind: 'tag', tags: ['coffee', 'cafe'] },
      { id: 'dessert', label: 'Dessert', kind: 'tag', tags: ['dessert', 'sweet'] },
      { id: 'pizza', label: 'Pizza', kind: 'tag', tags: ['pizza'] },
      { id: 'burgers', label: 'Burgers', kind: 'tag', tags: ['burger', 'burgers'] }
    ];
    const HOME_ONBOARDING_TAG_IDS = [
      'action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi',
      'thriller', 'documentary', 'soccer', 'basketball', 'motorsport', 'streetwear'
    ];
    const HOME_INTEREST_CARD_META = {
      movie: { icon: 'fas fa-film', hint: 'Watchlists and favorites', fallback: '/images/onboarding/onboard-media.svg' },
      tv: { icon: 'fas fa-tv', hint: 'Series and rewatches', fallback: '/images/onboarding/onboard-profile.svg' },
      anime: { icon: 'fas fa-dragon', hint: 'Shonen and classics', fallback: '/images/onboarding/onboard-interests.svg' },
      game: { icon: 'fas fa-gamepad', hint: 'Backlogs and finishes', fallback: '/images/onboarding/onboard-interests.svg' },
      book: { icon: 'fas fa-book', hint: 'Read piles and standouts', fallback: '/images/onboarding/onboard-travel.svg' },
      music: { icon: 'fas fa-music', hint: 'Albums and tracks', fallback: '/images/onboarding/onboard-media.svg' },
      travel: { icon: 'fas fa-earth-americas', hint: 'Trips and countries', fallback: '/images/onboarding/onboard-travel.svg' },
      sports: { icon: 'fas fa-futbol', hint: 'Teams and leagues', fallback: '/images/onboarding/onboard-media.svg' },
      fashion: { icon: 'fas fa-shirt', hint: 'Brands and style', fallback: '/images/onboarding/onboard-fashion.svg' },
      food: { icon: 'fas fa-utensils', hint: 'Spots and cravings', fallback: '/images/onboarding/onboard-food.svg' },
      action: { icon: 'fas fa-bolt', hint: 'Fast and intense', fallback: '/images/onboarding/onboard-media.svg' },
      comedy: { icon: 'fas fa-face-laugh', hint: 'Light and fun', fallback: '/images/onboarding/onboard-food.svg' },
      drama: { icon: 'fas fa-theater-masks', hint: 'Character driven', fallback: '/images/onboarding/onboard-profile.svg' },
      horror: { icon: 'fas fa-ghost', hint: 'Dark and tense', fallback: '/images/onboarding/onboard-media.svg' },
      romance: { icon: 'fas fa-heart', hint: 'Warm and emotional', fallback: '/images/onboarding/onboard-fashion.svg' },
      'sci-fi': { icon: 'fas fa-rocket', hint: 'Big worlds and ideas', fallback: '/images/onboarding/onboard-interests.svg' },
      thriller: { icon: 'fas fa-user-secret', hint: 'Suspense and twists', fallback: '/images/onboarding/onboard-media.svg' },
      documentary: { icon: 'fas fa-camera-retro', hint: 'Real stories', fallback: '/images/onboarding/onboard-travel.svg' },
      soccer: { icon: 'fas fa-futbol', hint: 'Club and country', fallback: '/images/onboarding/onboard-media.svg' },
      basketball: { icon: 'fas fa-basketball', hint: 'NBA and beyond', fallback: '/images/onboarding/onboard-media.svg' },
      motorsport: { icon: 'fas fa-flag-checkered', hint: 'F1 and racing', fallback: '/images/onboarding/onboard-interests.svg' },
      streetwear: { icon: 'fas fa-shoe-prints', hint: 'Sneakers and drops', fallback: '/images/onboarding/onboard-fashion.svg' }
    };

    async function homeIgdbFetch(path, params = {}, signal) {
      const requestParams = { ...(params || {}) };
      if (requestParams.search) delete requestParams.ordering;
      if (window.ZO2Y_IGDB && typeof window.ZO2Y_IGDB.request === 'function') {
        return window.ZO2Y_IGDB.request(path, requestParams, signal ? { signal } : undefined);
      }
      const url = new URL(`${IGDB_PROXY_BASE}${path}`, window.location.origin);
      Object.entries(requestParams).forEach(([key, value]) => {
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
    function getHomeAuthGateState() {
      return window.ZO2Y_AUTH_GATE || null;
    }

    function isHomeLandingMode() {
      const authShell = document.documentElement?.dataset?.authShell || document.body?.dataset?.authShell || '';
      if (authShell) return authShell === 'landing';
      const authed = document.documentElement?.dataset?.authenticated === '1' || document.body?.dataset?.authenticated === '1';
      return !!document.getElementById('homeLandingPage') && !authed;
    }
    let homeSupabaseClient = null;
    let homeCurrentUser = null;
    let homeAuthListenerReady = false;
    let homeAuthUiSyncPromise = null;
    let homeAuthUiSyncQueued = false;
    let homeAuthSyncTimer = null;
    let homeAuthSyncNeedsPersonalization = false;
    let homeSpotlightTimer = null;
    let homeSpotlightItems = [];
    let homeSpotlightIndex = 0;
    let homeSpotlightImageToken = 0;
    let homeOnboardingIndex = 0;
    let homeOnboardingUserId = null;
    let homeOnboardingEvaluatedUserId = '';
    let homeOnboardingProfile = {
      username: '',
      types: new Set(),
      tags: new Set(),
      usernameStatus: 'idle',
      interestsStatus: 'idle'
    };
    let homeTasteWeights = Object.fromEntries(HOME_ACTIVE_MEDIA_TYPES.map((type) => [type, 1]));
    let homeInterestProfile = { types: [], tags: [] };
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
    let homeDeferredImageObserver = null;
    let homeRailViewportObserver = null;
    let homeEagerImageBudgetUsed = 0;
    let homeHighPriorityImageBudgetUsed = 0;
    let homeNewReleasesState = [];
    let homeNewReleasesLastFetchAt = 0;
    let homeNewReleasesRequestSeq = 0;
    let homeNewReleasesInFlight = null;
    let homeNewReleasesRefreshScheduled = false;
    let homePendingNewReleasesRefresh = false;
    let homeFeedInitSeq = 0;
    let homeWeakFeedRetryTimer = null;
    let homeWeakFeedRetryCount = 0;
    let homeSupabaseSdkWaitPromise = null;

    function waitForHomeSupabaseSdk(timeoutMs = 2200) {
      if (window.supabase?.createClient) return Promise.resolve(true);
      if (homeSupabaseSdkWaitPromise) return homeSupabaseSdkWaitPromise;
      homeSupabaseSdkWaitPromise = new Promise((resolve) => {
        const startedAt = Date.now();
        const tick = () => {
          if (window.supabase?.createClient) {
            homeSupabaseSdkWaitPromise = null;
            resolve(true);
            return;
          }
          if ((Date.now() - startedAt) >= timeoutMs) {
            homeSupabaseSdkWaitPromise = null;
            resolve(false);
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      });
      return homeSupabaseSdkWaitPromise;
    }
    let homeMixedRefreshScheduled = false;
    let homePendingMixedRefresh = false;
    let homePendingMixedRefreshArgs = null;
    let homeMenuPrimeScheduled = false;
    let homeUserInteracted = false;
    let homeInteractionWatchBound = false;
    let homeBecauseRefreshSeq = 0;
    let homeBecauseSignalCache = {
      userId: '',
      savedAt: 0,
      payload: null
    };
    let homeLastGoodFeedAt = 0;
    let homeLastUniversalInitAt = 0;
    let homeLastPersonalizationAt = 0;
    let homeTasteWeightsCache = {
      userId: '',
      savedAt: 0,
      weights: null
    };
    let homeProfileLabelLookupPromise = null;
    let homeProfileLabelCache = {
      userId: '',
      label: '',
      fetchedAt: 0,
      failedAt: 0
    };
    const homeTravelPhotoCache = new Map();
    let homeTravelPhotoCacheSaveTimer = null;
    let homeTravelBucketManifestPromise = null;
    let homeBrandBackgroundManifest = null;
    let homeBrandBackgroundManifestPromise = null;
    let homeTravelHydrationPromise = null;
    const homePendingRailRenderState = new Map();
    const homeDeferredChannelState = new Map();
    const homeMusicPreviewState = {
      audio: null,
      btn: null
    };
    const homeCountryCityHints = {
      US: ['New York', 'Los Angeles', 'Chicago'],
      JP: ['Tokyo', 'Kyoto', 'Osaka'],
      FR: ['Paris', 'Lyon', 'Nice'],
      IT: ['Rome', 'Florence', 'Milan'],
      ES: ['Madrid', 'Barcelona', 'Seville'],
      BR: ['Rio de Janeiro', 'Sao Paulo', 'Salvador'],
      EG: ['Cairo', 'Alexandria', 'Luxor'],
      AU: ['Sydney', 'Melbourne', 'Brisbane'],
      GB: ['London', 'Edinburgh', 'Manchester'],
      DE: ['Berlin', 'Munich', 'Hamburg'],
      CA: ['Toronto', 'Vancouver', 'Montreal'],
      MX: ['Mexico City', 'Guadalajara', 'Merida'],
      TR: ['Istanbul', 'Ankara', 'Antalya'],
      TH: ['Bangkok', 'Chiang Mai', 'Phuket'],
      ID: ['Bali', 'Jakarta', 'Yogyakarta'],
      ZA: ['Cape Town', 'Johannesburg', 'Durban']
    };
    const homeCountryIndex = {
      byName: new Map(),
      byCode: new Map()
    };
    let homeCountryIndexPromise = null;
    let homeCountryIndexReady = false;

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function unwrapCloudflareImageUrl(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const marker = '/cdn-cgi/image/';
      const markerIndex = raw.indexOf(marker);
      if (markerIndex === -1) return raw;
      const tail = raw.slice(markerIndex + marker.length);
      const remoteMatch = tail.match(/(?:^|\/)(https?:\/\/.+)$/i);
      if (!remoteMatch || !remoteMatch[1]) return raw;
      let unwrapped = String(remoteMatch[1] || '').trim();
      try {
        unwrapped = decodeURI(unwrapped);
      } catch (_err) {}
      if (unwrapped.startsWith('//')) unwrapped = `https:${unwrapped}`;
      return unwrapped.replace(/^http:\/\//i, 'https://');
    }

    function shouldProxyHomeImageThroughCloudflare(normalized) {
      const src = String(normalized || '').trim();
      if (!src) return false;
      if (!/^https:\/\//i.test(src)) return false;
      if (typeof window === 'undefined' || !window.location?.origin) return false;
      return src.startsWith(window.location.origin);
    }

    function buildCloudflareImageUrl(value, options = {}) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      let normalized = unwrapCloudflareImageUrl(raw);
      if (normalized.startsWith('//')) normalized = `https:${normalized}`;
      normalized = normalized.replace(/^http:\/\//i, 'https://');
      if (!/^https:\/\//i.test(normalized)) return normalized;
      if (/\.svg(?:[?#].*)?$/i.test(normalized) || /\.gif(?:[?#].*)?$/i.test(normalized)) return normalized;
      if (!shouldProxyHomeImageThroughCloudflare(normalized)) return normalized;
      const width = Math.max(32, Number(options?.width || 520) || 520);
      const quality = Math.max(30, Math.min(90, Number(options?.quality || 75) || 75));
      const transforms = [`format=auto`, `quality=${quality}`, `width=${Math.round(width)}`];
      if (options?.height) transforms.push(`height=${Math.max(32, Math.round(Number(options.height) || 0))}`);
      if (options?.fit) transforms.push(`fit=${String(options.fit)}`);
      if (options?.gravity) transforms.push(`gravity=${String(options.gravity)}`);
      return `/cdn-cgi/image/${transforms.join(',')}/${encodeURI(normalized)}`;
    }

    function toHttpsUrl(value, options = null) {
      return buildCloudflareImageUrl(value, options || undefined);
    }

    function normalizeCountryName(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]+/g, '')
        .replace(/&/g, ' and ')
        .replace(/[\u0027\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/^the\s+/g, '')
        .trim();
    }

    const HOME_COUNTRY_ALIASES = {
      'england': 'united kingdom',
      'scotland': 'united kingdom',
      'wales': 'united kingdom',
      'northern ireland': 'united kingdom',
      'great britain': 'united kingdom',
      'uk': 'united kingdom',
      'usa': 'united states',
      'us': 'united states',
      'u s a': 'united states',
      'u s': 'united states',
      'uae': 'united arab emirates',
      'russia': 'russian federation',
      'south korea': 'korea republic of',
      'north korea': 'korea democratic people s republic of',
      'iran': 'iran islamic republic of',
      'czech republic': 'czechia',
      'ivory coast': 'cote d ivoire',
      'cote divoire': 'cote d ivoire',
      'cote d ivoire': 'cote d ivoire',
      'bolivia': 'bolivia plurinational state of',
      'venezuela': 'venezuela bolivarian republic of',
      'tanzania': 'tanzania united republic of',
      'laos': 'lao people s democratic republic',
      'syria': 'syrian arab republic',
      'moldova': 'moldova republic of',
      'macedonia': 'north macedonia'
    };

    function primeHomeCountryIndex(rows) {
      if (!Array.isArray(rows) || !rows.length) return homeCountryIndex;
      rows.forEach((row) => {
        const flag = toHttpsUrl(row?.flags?.png || row?.flags?.svg || '');
        if (!flag) return;
        const names = [
          row?.name?.common,
          row?.name?.official,
          ...(Array.isArray(row?.altSpellings) ? row.altSpellings : [])
        ];
        names.forEach((name) => {
          const key = normalizeCountryName(name);
          if (!key) return;
          if (!homeCountryIndex.byName.has(key)) {
            homeCountryIndex.byName.set(key, flag);
          }
        });
        const cca2 = String(row?.cca2 || '').trim().toUpperCase();
        const cca3 = String(row?.cca3 || '').trim().toUpperCase();
        if (cca2 && !homeCountryIndex.byCode.has(cca2)) homeCountryIndex.byCode.set(cca2, flag);
        if (cca3 && !homeCountryIndex.byCode.has(cca3)) homeCountryIndex.byCode.set(cca3, flag);
      });
      homeCountryIndexReady = true;
      return homeCountryIndex;
    }

    async function ensureHomeCountryIndex(signal) {
      if (homeCountryIndexReady) return homeCountryIndex;
      if (homeCountryIndexPromise) return homeCountryIndexPromise;
      homeCountryIndexPromise = (async () => {
        try {
          const payload = await fetchJsonWithPerfCache(REST_COUNTRIES_ALL_URL, {
            signal,
            cacheKey: 'restcountries:all:v3.1:home',
            ttlMs: 1000 * 60 * 60 * 12,
            timeoutMs: 9500,
            retries: 1
          });
          primeHomeCountryIndex(Array.isArray(payload) ? payload : []);
        } catch (_err) {}
        return homeCountryIndex;
      })();
      return homeCountryIndexPromise;
    }

    function getHomeCountryFlag(countryName) {
      const key = normalizeCountryName(countryName);
      if (!key) return '';
      if (homeCountryIndex.byName.has(key)) return homeCountryIndex.byName.get(key);
      const aliasKey = HOME_COUNTRY_ALIASES[key] ? normalizeCountryName(HOME_COUNTRY_ALIASES[key]) : '';
      if (aliasKey && homeCountryIndex.byName.has(aliasKey)) return homeCountryIndex.byName.get(aliasKey);
      return '';
    }

    function getHomeCountryFlagByCode(codeRaw) {
      const code = String(codeRaw || '').trim().toUpperCase();
      if (!code) return '';
      if (homeCountryIndex.byCode.has(code)) return homeCountryIndex.byCode.get(code);
      if (code.length === 2) {
        return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
      }
      return '';
    }

    function getHomeCountryFlagEmoji(codeRaw) {
      const code = String(codeRaw || '').trim().toUpperCase();
      if (!code || code.length !== 2 || /[^A-Z]/.test(code)) return '';
      const offset = 127397;
      return String.fromCodePoint(
        code.charCodeAt(0) + offset,
        code.charCodeAt(1) + offset
      );
    }

    function formatTravelTitleWithFlag(titleRaw, codeRaw) {
      const title = String(titleRaw || '').trim();
      return title;
    }

    function canonicalTravelCountryCode(value) {
      const raw = String(value || '').trim().toUpperCase();
      if (raw === 'IL') return 'PS';
      return raw;
    }

    function isLikelyTravelFlagAsset(url) {
      const raw = String(url || '').trim().toLowerCase();
      if (!raw) return false;
      if (raw.includes('flagcdn.com')) return true;
      if (raw.includes('/flags/')) return true;
      if (raw.includes('restcountries.com/data/')) return true;
      if (raw.includes('commons.wikimedia.org') && (raw.includes('flag_of_') || raw.includes('flag-of-'))) return true;
      const blocked = ['coat_of_arms', 'coat-of-arms', 'emblem', 'seal', 'map_of_', 'map-of-', 'painting', 'illustration', 'drawing', 'watercolor', 'etching', 'engraving', 'lithograph', 'oil_on_canvas', 'cartoon', 'sketch', 'render', 'vector', 'banknote', 'stamp', 'crest', 'poster'];
      if (blocked.some((token) => raw.includes(token))) return true;
      return false;
    }

    function isUsableHomeTravelScenicUrl(urlRaw) {
      const raw = String(urlRaw || '').trim();
      if (!raw) return false;
      if (raw.startsWith('data:image/')) return true;
      const url = toHttpsUrl(raw);
      if (!url) return false;
      if (isLikelyTravelFlagAsset(url)) return false;
      const lower = url.toLowerCase();
      if (lower.includes('/newlogo.webp')) return false;
      if (lower.includes('/scared.webp')) return false;
      if (lower.includes('/images/country.jpg')) return false;
      if (lower.includes('/images/logo.png')) return false;
      if (lower.includes('/images/placeholder.jpg')) return false;
      if (lower.includes('source.unsplash.com/')) return false;
      return true;
    }

    function getTravelCommonsCategoryText(page) {
      const categories = Array.isArray(page?.categories) ? page.categories : [];
      return categories
        .map((entry) => String(entry?.title || '').replace(/^Category:/i, '').trim().toLowerCase())
        .filter(Boolean)
        .join(' | ');
    }

    function normalizeHomeTravelPhotoEntry(entry) {
      if (!entry) return { scenic: '', city: '', nature: '' };
      if (typeof entry === 'string') {
        const scenic = toHttpsUrl(String(entry || '').trim());
        return {
          scenic: isUsableHomeTravelScenicUrl(scenic) ? scenic : '',
          city: '',
          nature: ''
        };
      }
      if (typeof entry === 'object') {
        const scenic = toHttpsUrl(String(entry.scenic || entry.photo || entry.image || '').trim());
        const city = toHttpsUrl(String(entry.city || entry.cityPhoto || '').trim());
        const nature = toHttpsUrl(String(entry.nature || entry.naturePhoto || '').trim());
        return {
          scenic: isUsableHomeTravelScenicUrl(scenic) ? scenic : '',
          city: isUsableHomeTravelScenicUrl(city) ? city : '',
          nature: isUsableHomeTravelScenicUrl(nature) ? nature : ''
        };
      }
      return { scenic: '', city: '', nature: '' };
    }

    function getHomeTravelPhotoSet(codeRaw) {
      const code = canonicalTravelCountryCode(codeRaw);
      if (!code) return { scenic: '', city: '', nature: '' };
      return normalizeHomeTravelPhotoEntry(homeTravelPhotoCache.get(code));
    }

    function normalizeHomeTravelBucketManifestEntries(payload) {
      if (!payload || typeof payload !== 'object') return null;
      const entries = payload.countries && typeof payload.countries === 'object'
        ? payload.countries
        : (payload.entries && typeof payload.entries === 'object' ? payload.entries : null);
      return entries && typeof entries === 'object' ? entries : null;
    }

    function mergeHomeTravelBucketManifestEntries(entries) {
      if (!entries || typeof entries !== 'object') return false;
      let changed = false;
      Object.entries(entries).forEach(([codeRaw, entry]) => {
        const code = canonicalTravelCountryCode(codeRaw);
        if (!code) return;
        const normalized = normalizeHomeTravelPhotoEntry(entry);
        if (!normalized.scenic && !normalized.city && !normalized.nature) return;
        const current = normalizeHomeTravelPhotoEntry(homeTravelPhotoCache.get(code));
        const merged = {
          scenic: normalized.scenic || current.scenic || '',
          city: normalized.city || current.city || '',
          nature: normalized.nature || current.nature || ''
        };
        if (merged.scenic === current.scenic && merged.city === current.city && merged.nature === current.nature) return;
        homeTravelPhotoCache.set(code, merged);
        changed = true;
      });
      if (changed) scheduleHomeTravelPhotoCacheSave();
      return changed;
    }

    function readHomeTravelBucketManifestCache() {
      try {
        const raw = localStorage.getItem(HOME_TRAVEL_BUCKET_MANIFEST_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        const entries = normalizeHomeTravelBucketManifestEntries(parsed);
        if (!savedAt || !entries) return null;
        if ((Date.now() - savedAt) > HOME_TRAVEL_BUCKET_MANIFEST_TTL_MS) return null;
        return { savedAt, entries };
      } catch (_err) {
        return null;
      }
    }

    function writeHomeTravelBucketManifestCache(entries) {
      if (!entries || typeof entries !== 'object') return;
      try {
        localStorage.setItem(HOME_TRAVEL_BUCKET_MANIFEST_CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          countries: entries
        }));
      } catch (_err) {}
    }

    function loadHomeTravelBucketManifestFromStorage() {
      const cached = readHomeTravelBucketManifestCache();
      if (!cached || !cached.entries) return false;
      return mergeHomeTravelBucketManifestEntries(cached.entries);
    }

    async function hydrateHomeTravelBucketManifest(signal) {
      if (homeTravelBucketManifestPromise) return homeTravelBucketManifestPromise;
      homeTravelBucketManifestPromise = (async () => {
        try {
          const response = await fetch(HOME_TRAVEL_BUCKET_MANIFEST_URL, {
            signal,
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) return false;
          const payload = await response.json();
          const entries = normalizeHomeTravelBucketManifestEntries(payload);
          if (!entries) return false;
          writeHomeTravelBucketManifestCache(entries);
          return mergeHomeTravelBucketManifestEntries(entries);
        } catch (_err) {
          return false;
        } finally {
          homeTravelBucketManifestPromise = null;
        }
      })();
      return homeTravelBucketManifestPromise;
    }

    function normalizeHomeBrandBackgroundManifest(payload) {
      if (!payload || typeof payload !== 'object') return null;
      const tables = ['fashion_brands', 'food_brands', 'car_brands'];
      const normalized = {};
      let hasEntries = false;
      tables.forEach((table) => {
        const source = payload?.[table];
        if (!source || typeof source !== 'object') return;
        const mapped = {};
        Object.entries(source).forEach(([slugRaw, urlRaw]) => {
          const slug = String(slugRaw || '').trim();
          const url = toHttpsUrl(String(urlRaw || '').trim());
          if (!slug || !url) return;
          mapped[slug] = url;
          hasEntries = true;
        });
        normalized[table] = mapped;
      });
      return hasEntries ? normalized : null;
    }

    async function ensureHomeBrandBackgroundManifest(signal) {
      if (homeBrandBackgroundManifest) return homeBrandBackgroundManifest;
      if (homeBrandBackgroundManifestPromise) return homeBrandBackgroundManifestPromise;
      homeBrandBackgroundManifestPromise = (async () => {
        let timeoutId = null;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        try {
          const mergedSignal = (() => {
            if (!controller) return signal || undefined;
            if (!signal) return controller.signal;
            try {
              if (signal.aborted) controller.abort();
              signal.addEventListener('abort', () => controller.abort(), { once: true });
            } catch (_err) {}
            return controller.signal;
          })();
          // Avoid hanging the homepage on slow/blocked storage manifests.
          timeoutId = setTimeout(() => {
            try { controller?.abort(); } catch (_err) {}
          }, 1400);
          const response = await fetch(HOME_BRAND_BACKGROUND_MANIFEST_URL, {
            signal: mergedSignal,
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) return null;
          const payload = await response.json();
          homeBrandBackgroundManifest = normalizeHomeBrandBackgroundManifest(payload);
          return homeBrandBackgroundManifest;
        } catch (_err) {
          return null;
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          homeBrandBackgroundManifestPromise = null;
        }
      })();
      return homeBrandBackgroundManifestPromise;
    }

    function getHomeBrandTableName(mediaType) {
      const type = String(mediaType || '').trim().toLowerCase();
      if (type === 'fashion') return 'fashion_brands';
      if (type === 'food') return 'food_brands';
      if (type === 'car') return 'car_brands';
      return '';
    }

    function getHomeBrandBackgroundUrl(row, mediaType) {
      const table = getHomeBrandTableName(mediaType);
      if (!table) return '';
      const slug = String(row?.slug || '').trim().toLowerCase();
      const tableManifest = homeBrandBackgroundManifest?.[table];
      if (slug && tableManifest && tableManifest[slug]) {
        return String(tableManifest[slug] || '').trim();
      }
      return '';
    }

    function getHomeTravelFallbackItems(limit = getHomeChannelTargetItems()) {
      const maxCount = Math.max(1, Number(limit || getHomeChannelTargetItems()));
      const items = HOME_TRAVEL_FALLBACKS.map((entry) => {
        const code = String(entry?.code || '').trim().toUpperCase();
        const title = formatTravelTitleWithFlag(String(entry?.name || '').trim(), code);
        if (!code || !title) return null;
        const capital = String(entry?.capital || '').trim();
        const region = String(entry?.region || '').trim();
        const subregion = String(entry?.subregion || '').trim();
        const flagImage = getHomeCountryFlagByCode(code) || `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
        const background = HOME_TRAVEL_FALLBACK_IMAGE;
        const subtitle = [
          capital ? `Capital: ${capital}` : '',
          region
        ].filter(Boolean).join(' | ') || 'Country';
        return {
          mediaType: 'travel',
          itemId: code,
          title,
          subtitle,
          extra: subregion || region || 'Travel',
          cities: [],
          flagImage,
          listImage: background,
          image: background,
          backgroundImage: background,
          spotlightImage: background,
          spotlightMediaImage: flagImage,
          spotlightMediaFit: 'contain',
          spotlightMediaPosition: 'center center',
          spotlightMediaShape: 'square',
          travelPhotos: [],
          travelPhotoSet: { scenic: background, city: '', nature: '' },
          travelNeedsScenicHydration: false,
          fallbackImage: background,
          href: `country.html?code=${encodeURIComponent(code)}`
        };
      }).filter(Boolean);
      return items.slice(0, maxCount);
    }

    function readHomeTravelPhotoCacheFromStorage() {
      try {
        const raw = localStorage.getItem(HOME_TRAVEL_PHOTO_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        const entries = parsed?.entries && typeof parsed.entries === 'object' ? parsed.entries : null;
        if (!savedAt || !entries) return;
        if ((Date.now() - savedAt) > HOME_TRAVEL_PHOTO_CACHE_MAX_AGE_MS) return;
        Object.entries(entries).forEach(([codeRaw, urlRaw]) => {
          const code = canonicalTravelCountryCode(codeRaw);
          if (!code) return;
          const normalized = normalizeHomeTravelPhotoEntry(urlRaw);
          if (!normalized.scenic && !normalized.city && !normalized.nature) return;
          homeTravelPhotoCache.set(code, normalized);
        });
      } catch (_err) {}
    }

    function scheduleHomeTravelPhotoCacheSave() {
      if (homeTravelPhotoCacheSaveTimer) clearTimeout(homeTravelPhotoCacheSaveTimer);
      homeTravelPhotoCacheSaveTimer = setTimeout(() => {
        homeTravelPhotoCacheSaveTimer = null;
        try {
          const entries = {};
          homeTravelPhotoCache.forEach((entry, codeRaw) => {
            const code = canonicalTravelCountryCode(codeRaw);
            if (!code) return;
            const normalized = normalizeHomeTravelPhotoEntry(entry);
            if (!normalized.scenic && !normalized.city && !normalized.nature) return;
            entries[code] = normalized;
          });
          localStorage.setItem(HOME_TRAVEL_PHOTO_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            entries
          }));
        } catch (_err) {}
      }, 160);
    }

    function setHomeTravelPhotoCache(codeRaw, urlRaw, kind = 'scenic') {
      const code = canonicalTravelCountryCode(codeRaw);
      const url = toHttpsUrl(String(urlRaw || '').trim());
      if (!code || !isUsableHomeTravelScenicUrl(url)) return;
      const targetKind = ['scenic', 'city', 'nature'].includes(kind) ? kind : 'scenic';
      const current = normalizeHomeTravelPhotoEntry(homeTravelPhotoCache.get(code));
      if (current[targetKind] === url) return;
      current[targetKind] = url;
      homeTravelPhotoCache.set(code, current);
      scheduleHomeTravelPhotoCacheSave();
    }

    function readHomeItemsCache(storageKey, maxAgeMs, sanitizer) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        if (!savedAt || !items.length) return [];
        if (Number.isFinite(maxAgeMs) && maxAgeMs > 0 && (Date.now() - savedAt) > maxAgeMs) return [];
        const cleaned = typeof sanitizer === 'function' ? items.map((item) => sanitizer(item)).filter(Boolean) : items;
        return Array.isArray(cleaned) ? cleaned : [];
      } catch (_err) {
        return [];
      }
    }

    function writeHomeItemsCache(storageKey, items) {
      try {
        const list = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!list.length) return;
        localStorage.setItem(storageKey, JSON.stringify({
          savedAt: Date.now(),
          items: list
        }));
      } catch (_err) {}
    }

    function getSafeTravelScenicImage(_title, codeRaw, preferredUrl = '') {
      const code = canonicalTravelCountryCode(codeRaw);
      const preferred = toHttpsUrl(String(preferredUrl || '').trim());
      if (isUsableHomeTravelScenicUrl(preferred)) return preferred;
      const cached = getHomeTravelPhotoSet(code);
      if (cached.scenic) return cached.scenic;
      if (cached.city) return cached.city;
      if (cached.nature) return cached.nature;
      if (isUsableHomeTravelScenicUrl(HOME_TRAVEL_FALLBACK_IMAGE)) return HOME_TRAVEL_FALLBACK_IMAGE;
      return '';
    }

    function sanitizeHomeNextPath(raw) {
      const value = String(raw || '').trim();
      if (!value) return 'index.html';
      if (/^https?:\/\//i.test(value) || value.startsWith('//')) return 'index.html';
      if (value.startsWith('/')) return value.slice(1) || 'index.html';
      return value;
    }

    function sanitizeHomeTravelItem(item) {
      if (!item || typeof item !== 'object') return null;
      const rawCode = String(item.itemId || item.code || '').trim().toUpperCase();
      if (rawCode === 'IL') return null;
      const code = canonicalTravelCountryCode(rawCode);
      const rawTitle = String(item.title || item.name || code || 'Country').trim();
      if (/\bisrael\b/i.test(rawTitle)) return null;
      const baseTitle = code === 'PS' ? 'Palestine' : rawTitle;
      const title = formatTravelTitleWithFlag(baseTitle, code);
      const rawImage = toHttpsUrl(String(item.image || '').trim());
      const rawBackground = toHttpsUrl(String(item.backgroundImage || '').trim());
      const rawSpotlight = toHttpsUrl(String(item.spotlightImage || '').trim());
      const rawFlag = toHttpsUrl(String(item.flagImage || item.flag || item.flags?.png || item.flags?.svg || '').trim());
      const flagImage = rawFlag || getHomeCountryFlagByCode(code) || getHomeCountryFlag(title) || '';
      const scenicImage = getSafeTravelScenicImage(baseTitle, code, rawImage || rawBackground || rawSpotlight);
      const safeFallback = isUsableHomeTravelScenicUrl(HOME_TRAVEL_FALLBACK_IMAGE) ? HOME_TRAVEL_FALLBACK_IMAGE : '';
      const heroImage = isUsableHomeTravelScenicUrl(scenicImage) ? scenicImage : safeFallback;
      if (!heroImage) return null;
      if (code) setHomeTravelPhotoCache(code, heroImage, 'scenic');
      const cachedSet = getHomeTravelPhotoSet(code);
      const travelPhotos = [cachedSet.city, cachedSet.nature].filter(Boolean);
      return {
        ...item,
        mediaType: 'travel',
        itemId: code || String(item.itemId || '').trim(),
        flagImage,
        listImage: heroImage,
        image: heroImage,
        backgroundImage: heroImage || '',
        spotlightImage: getSafeTravelScenicImage(baseTitle, code, rawSpotlight || heroImage) || heroImage,
        spotlightMediaImage: flagImage || heroImage,
        spotlightMediaFit: flagImage ? 'contain' : 'cover',
        spotlightMediaPosition: 'center center',
        spotlightMediaShape: 'square',
        travelPhotos,
        travelPhotoSet: {
          scenic: cachedSet.scenic || heroImage,
          city: cachedSet.city || '',
          nature: cachedSet.nature || ''
        },
        travelNeedsScenicHydration: false,
        fallbackImage: safeFallback || heroImage
      };
    }

    function readHomeTravelCountryRowsCache() {
      try {
        const raw = localStorage.getItem(HOME_TRAVEL_COUNTRY_ROWS_CACHE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
        if (!savedAt || !rows.length) return [];
        if ((Date.now() - savedAt) > HOME_TRAVEL_COUNTRY_ROWS_CACHE_MAX_AGE_MS) return [];
        return rows;
      } catch (_err) {
        return [];
      }
    }

    function mapCachedTravelCountryRowToHomeItem(row) {
      const code = canonicalTravelCountryCode(row?.code || row?.cca2 || row?.cca3 || '');
      const baseTitle = String(row?.name || row?.title || '').trim();
      if (!code || !baseTitle || /\bisrael\b/i.test(baseTitle)) return null;
      const resolvedBaseTitle = code === 'PS' ? 'Palestine' : baseTitle;
      const title = formatTravelTitleWithFlag(resolvedBaseTitle, code);
      const capital = String(row?.capital || '').trim();
      const region = String(row?.region || '').trim();
      const subregion = String(row?.subregion || '').trim();
      const cities = Array.isArray(row?.cities)
        ? row.cities.map((value) => String(value || '').trim()).filter(Boolean).slice(0, 3)
        : pickHomeCountryCities(code, capital);
      const flagImage = toHttpsUrl(String(row?.flag || row?.flagImage || '').trim())
        || getHomeCountryFlagByCode(code)
        || getHomeCountryFlag(title)
        || '';
      const subtitle = [
        capital ? `Capital: ${capital}` : '',
        region
      ].filter(Boolean).join(' | ') || 'Country';
      const extraParts = [];
      if (subregion && subregion !== region) extraParts.push(subregion);
      if (cities.length) extraParts.push(`Cities: ${cities.join(', ')}`);
      const scenicRaw = getSafeTravelScenicImage(resolvedBaseTitle, code, row?.photo || row?.image || row?.backgroundImage || row?.spotlightImage || '');
      const scenicImage = isUsableHomeTravelScenicUrl(scenicRaw) ? scenicRaw : '';
      const safeFallback = isUsableHomeTravelScenicUrl(HOME_TRAVEL_FALLBACK_IMAGE) ? HOME_TRAVEL_FALLBACK_IMAGE : '';
      const heroImage = scenicImage || safeFallback;
      if (!heroImage) return null;
      if (heroImage) setHomeTravelPhotoCache(code, heroImage, 'scenic');
      if (row?.photoCity) setHomeTravelPhotoCache(code, row.photoCity, 'city');
      if (row?.photoNature) setHomeTravelPhotoCache(code, row.photoNature, 'nature');
      const cachedSet = getHomeTravelPhotoSet(code);
      return {
        mediaType: 'travel',
        itemId: code,
        title,
        subtitle,
        extra: extraParts.join(' | ') || 'Travel',
        cities,
        flagImage,
        listImage: heroImage,
        image: heroImage,
        backgroundImage: heroImage || '',
        spotlightImage: heroImage || '',
        spotlightMediaImage: flagImage || heroImage,
        spotlightMediaFit: flagImage ? 'contain' : 'cover',
        spotlightMediaPosition: 'center center',
        spotlightMediaShape: 'square',
        travelPhotos: [cachedSet.city, cachedSet.nature].filter(Boolean),
        travelPhotoSet: {
          scenic: cachedSet.scenic || heroImage || '',
          city: cachedSet.city || '',
          nature: cachedSet.nature || ''
        },
        travelNeedsScenicHydration: false,
        fallbackImage: safeFallback || heroImage,
        href: `country.html?code=${encodeURIComponent(code)}`
      };
    }

    function getCachedHomeTravelItems(limit = getHomeChannelTargetItems()) {
      const rows = readHomeTravelCountryRowsCache();
      if (!rows.length) return [];
      const seenCodes = new Set();
      const items = [];
      rows.forEach((row) => {
        const item = mapCachedTravelCountryRowToHomeItem(row);
        const code = String(item?.itemId || '').trim().toUpperCase();
        if (!item || !code || seenCodes.has(code)) return;
        seenCodes.add(code);
        items.push(item);
      });
      return shuffleArray(items).slice(0, Math.max(1, Number(limit || getHomeChannelTargetItems())));
    }

    readHomeTravelPhotoCacheFromStorage();
    loadHomeTravelBucketManifestFromStorage();

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

    function resolveSportsDbBase() {
      const prefersDirect = window.ZO2Y_SPORTSDB_DIRECT === true || window.ZO2Y_SPORTSDB_DIRECT === '1';
      const base = prefersDirect ? SPORTSDB_DIRECT_BASE : SPORTSDB_PROXY_BASE;
      if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '');
      const prefix = base.startsWith('/') ? '' : '/';
      return `${window.location.origin}${prefix}${base}`.replace(/\/+$/, '');
    }

    async function fetchSportsDb(endpoint, params = {}, options = {}) {
      const path = String(endpoint || '').trim().replace(/^\/+/, '');
      if (!path) return null;
      const url = new URL(`${resolveSportsDbBase()}/${path}`);
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(key, String(value));
      });
      const cacheKey = `sportsdb:${url.toString()}`;
      return fetchJsonWithPerfCache(url.toString(), {
        cacheKey,
        signal: options.signal,
        timeoutMs: Number(options.timeoutMs || 0) || 6500,
        retries: Number(options.retries || 0) || 1
      });
    }

    function resolveRestaurantImage(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return toHttpsUrl(raw);
      const normalized = raw.replace(/^\/+/, '');
      if (/^images\//i.test(normalized)) return toHttpsUrl(normalized);
      return toHttpsUrl(`images/${normalized}`);
    }

    function resolveBrandLogo(row, mediaType) {
      const logoValue = String(row?.logo_url || row?.logo || '').trim();
      if (logoValue) {
        if (/^https?:\/\//i.test(logoValue) || logoValue.startsWith('/') || logoValue.startsWith('data:')) {
          return logoValue;
        }
      }
      const typeKey = String(mediaType || '').toLowerCase();
      // No favicons on home rails. If Supabase doesn't provide a logo_url, fall back to local category artwork.
      if (typeKey === 'fashion') return '/images/onboarding/onboard-fashion.svg';
      if (typeKey === 'food') return '/images/onboarding/onboard-food.svg';
      if (typeKey === 'car') return '/images/onboarding/onboard-interests.svg';
      return '/images/icons/star.svg';
    }

    function mapHomeBrandItem(row, type, fallbackIndex = 0) {
      const safeType = String(type || '').toLowerCase();
      const title = String(row?.name || row?.title || '').trim() || 'Brand';
      const category = String(row?.category || '').trim() || (
        safeType === 'fashion'
          ? 'Fashion'
          : (safeType === 'food'
            ? 'Food'
            : (safeType === 'car' ? 'Cars' : 'Brand'))
      );
      const country = String(row?.country || '').trim();
      const founded = row?.founded ? String(row.founded) : '';
      const logo = resolveBrandLogo(row, safeType);
      const subtitle = `${category}${country ? ` \u00B7 ${country}` : ''}`;
      const extra = founded ? `Since ${founded}` : (row?.description ? String(row.description).trim() : '');
      const background = getHomeBrandBackgroundUrl(row, safeType);
      const itemId = String(row?.id || row?.slug || `${safeType}-${fallbackIndex}` || '').trim();
      return {
        mediaType: safeType,
        itemId,
        title,
        subtitle,
        extra,
        description: row?.description || '',
        category,
        country,
        tags: [category, country, row?.tags].filter(Boolean).join(' '),
        image: logo || '',
        listImage: logo || '',
        backgroundImage: background || '',
        spotlightImage: background || '',
        spotlightMediaImage: logo || '',
        spotlightMediaFit: 'contain',
        spotlightMediaShape: 'square',
        mediaFit: 'contain',
        href: itemId ? `brand.html?type=${encodeURIComponent(safeType)}&id=${encodeURIComponent(itemId)}` : `${safeType}.html`
      };
    }

    function dedupeHomeBrandRows(rows = []) {
      const seen = new Set();
      const out = [];
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const name = String(row?.name || row?.title || '').trim().toLowerCase();
        const domain = String(row?.domain || '').trim().toLowerCase();
        const slug = String(row?.slug || '').trim().toLowerCase();
        const key = name || domain || slug;
        if (!key || seen.has(key)) return;
        seen.add(key);
        out.push(row);
      });
      return out;
    }

    function getHomeSessionShuffleSeed(salt = '') {
      const userSeed = String(homeCurrentUser?.id || '').trim();
      const raw = `${HOME_TRAVEL_VARIANT_SESSION_SEED}:${userSeed}:${salt}`;
      let hash = 2166136261;
      for (let index = 0; index < raw.length; index += 1) {
        hash ^= raw.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function stableShuffleHomeItems(items = [], salt = '') {
      const seedBase = getHomeSessionShuffleSeed(salt);
      return [...(Array.isArray(items) ? items : [])]
        .map((item, index) => {
          const key = `${String(item?.itemId || '').trim()}:${String(item?.title || '').trim().toLowerCase()}:${index}`;
          let hash = seedBase || 1;
          for (let cursor = 0; cursor < key.length; cursor += 1) {
            hash ^= key.charCodeAt(cursor);
            hash = Math.imul(hash, 16777619);
          }
          return { item, order: hash >>> 0 };
        })
        .sort((a, b) => a.order - b.order)
        .map((entry) => entry.item);
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
      if (type === 'sports') return 'Sports';
      if (type === 'restaurant') return 'Restaurants';
      if (type === 'fashion') return 'Fashion';
      if (type === 'food') return 'Food';
      if (type === 'car') return 'Cars';
      return 'Discover';
    }

    function supportsHomeLists(mediaType) {
      const type = String(mediaType || '').toLowerCase();
      return HOME_LIST_MEDIA_TYPES.includes(type);
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
        if (type === 'sports') {
          return {
            customHref: 'sports.html',
            rows: [
              { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' }
            ]
          };
        }
        if (type === 'fashion') {
          return {
            customHref: 'fashion.html',
            rows: [
              { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
              { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
              { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
            ]
          };
        }
        if (type === 'food') {
          return {
            customHref: 'food.html',
            rows: [
              { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
              { key: 'tried', label: 'Tried', icon: 'fas fa-check' },
              { key: 'want_to_try', label: 'Want to Try', icon: 'fas fa-bookmark' }
            ]
          };
        }
        if (type === 'car') {
          return {
            customHref: 'cars.html',
            rows: [
              { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
              { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
              { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
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

    function getHomeTravelSpotlightVisual(item) {
      const safeItem = item && typeof item === 'object' ? item : {};
      const code = canonicalTravelCountryCode(safeItem.itemId || safeItem.code || '');
      const title = String(safeItem.title || safeItem.name || '').trim();
      const cachedSet = normalizeHomeTravelPhotoEntry(safeItem.travelPhotoSet || getHomeTravelPhotoSet(code));
      const fallback = getSafeTravelScenicImage(
        title,
        code,
        safeItem.spotlightImage || safeItem.backgroundImage || safeItem.image || cachedSet.scenic || cachedSet.city || ''
      );
      const choices = [
        { kind: 'scenic', src: cachedSet.scenic || fallback },
        { kind: 'city', src: cachedSet.city || '' }
      ].filter((entry) => isUsableHomeTravelScenicUrl(entry.src));
      if (!choices.length) {
        return fallback ? { kind: 'scenic', src: fallback } : null;
      }
      const seedKey = `${HOME_TRAVEL_VARIANT_SESSION_SEED}:${code || title || 'travel'}`;
      const index = hashString(seedKey) % choices.length;
      return choices[index] || choices[0] || null;
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
      const openBtn = document.getElementById('spotlightOpenBtn');
      const spotlightInner = document.getElementById('spotlightInner');
      if (!bg || !spotlightSection || !mediaWrap || !mediaImage || !title || !kicker || !summary || !openBtn) return;

      const mediaTypeKey = String(item.mediaType || '').toLowerCase();
      const meta = getHomeMediaMeta(mediaTypeKey);
      const isTravelSpotlight = mediaTypeKey === 'travel';
      const isGameSpotlight = mediaTypeKey === 'game';
      const isBrandSpotlight = mediaTypeKey === 'fashion' || mediaTypeKey === 'food' || mediaTypeKey === 'car';
      const travelSpotlightVisual = isTravelSpotlight
        ? getHomeTravelSpotlightVisual(item)
        : null;
      const travelScenicImage = isTravelSpotlight
        ? String(travelSpotlightVisual?.src || getSafeTravelScenicImage(item.title, item.itemId, item.spotlightImage || item.backgroundImage || item.image)).trim()
        : '';
      const travelSpotlightBackground = isTravelSpotlight
        ? getOptimizedHomeTravelImage(travelScenicImage, 1600)
        : '';
      const fallbackSpotlightBackground = isTravelSpotlight
        ? (travelSpotlightBackground || travelScenicImage)
        : (isGameSpotlight
          ? String(item.spotlightImage || item.backgroundImage || '').trim()
          : (isBrandSpotlight
            ? String(item.spotlightImage || item.backgroundImage || '').trim()
            : String(item.spotlightImage || item.backgroundImage || item.image || '').trim()));
      const spotlightBackground = getHomeSpotlightBackgroundByType(mediaTypeKey) || fallbackSpotlightBackground;
      const travelAccentA = '';
      const travelAccentB = '';
      const travelFlagImage = String(item.flagImage || '').trim();
      let spotlightMediaImage = String(item.spotlightMediaImage || travelFlagImage || item.image || item.spotlightImage || item.backgroundImage || '').trim();
      if (isTravelSpotlight) {
        spotlightMediaImage = travelFlagImage || spotlightMediaImage || travelScenicImage;
      }
      const spotlightBackgroundPosition = String(item.spotlightBackgroundPosition || item.backgroundPosition || '').trim() || 'center 28%';
      const spotlightMediaPosition = String(item.spotlightMediaPosition || item.imagePosition || '').trim();
      let spotlightMediaFit = String(item.spotlightMediaFit || '').trim() || 'contain';
      let spotlightMediaShape = String(item.spotlightMediaShape || '').trim() || 'poster';
      if (String(item.mediaType || '').toLowerCase() === 'music') {
        spotlightMediaFit = 'contain';
        spotlightMediaShape = 'poster';
      } else if (isTravelSpotlight && travelFlagImage) {
        spotlightMediaFit = 'contain';
        spotlightMediaShape = 'square';
      }
      const usesSquareMedia = spotlightMediaShape === 'square';
      const usesLandscapeMedia = spotlightMediaShape === 'landscape';
      const mediaToken = ++homeSpotlightImageToken;

      spotlightSection.classList.remove('has-square-media', 'has-landscape-media', 'theme-music', 'theme-book', 'theme-travel', 'travel-single-visual');
      mediaWrap.classList.remove('square', 'landscape');
      if (mediaTypeKey === 'music') {
        spotlightSection.classList.add('theme-music');
      } else if (mediaTypeKey === 'book') {
        spotlightSection.classList.add('theme-book');
      } else if (isTravelSpotlight) {
        spotlightSection.classList.add('theme-travel');
        spotlightSection.classList.add('travel-single-visual');
      }
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
      bg.style.setProperty('--spotlight-travel-accent-a', travelAccentA ? `url("${travelAccentA}")` : 'none');
      bg.style.setProperty('--spotlight-travel-accent-b', travelAccentB ? `url("${travelAccentB}")` : 'none');

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
          const interestBoost = getHomeInterestBoost(item);
          const trendScore = rankWeight * 0.55 + Math.min(weight, 2.1) * 0.32 + dailySignal * 0.13 + interestBoost;
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

    function buildNewReleasesFallback(feedMap = homeFeedState) {
      const sourceOrder = ['movie', 'tv', 'anime', 'game', 'book', 'music'];
      const seen = new Set();
      const fallback = [];
      sourceOrder.forEach((key) => {
        const items = Array.isArray(feedMap?.[key]) ? feedMap[key] : [];
        items.forEach((item) => {
          if (!item || fallback.length >= 18) return;
          const dedupeKey = `${String(item.mediaType || key).trim().toLowerCase()}:${String(item.itemId || item.title || '').trim().toLowerCase()}`;
          if (!dedupeKey || seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          fallback.push(item);
        });
      });
      return fallback;
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
          const cover = resolveHomeGameCover(row);
          if (!cover) return null;
          const hero = resolveHomeGameHero(row, '');
          const presentation = getHomeGamePresentation(cover, hero);
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
            subtitle: releaseDate ? releaseDate.slice(0, 10) : '',
            extra: [genreText, Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : ''].filter(Boolean).join(' | '),
            image: cover,
            backgroundImage: hero || cover,
            spotlightImage: hero || cover,
            spotlightMediaImage: cover,
            spotlightMediaFit: presentation.spotlightFit,
            spotlightMediaShape: presentation.spotlightShape,
            gameCardMode: presentation.plain ? 'plain' : 'hero',
            fallbackImage: '',
            href: rowId ? `game.html?id=${encodeURIComponent(rowId)}` : 'games.html'
          };
          return withReleaseTag({ ...item, releaseDateSort }, label, { detail: releaseDate });
        }).filter((item) => item && String(item.itemId || '').trim() && String(item.image || '').trim());
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
            fallbackImage: ''
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

      const includeExtendedSources = !isHomeCompactViewport() && !isHomeSlowNetwork();
      const [movieNowRes, movieUpcomingRes, tvEpisodeRes, tvSeasonRes, animeEpisodeRes, animeSeasonRes, gamesRes, booksRes, musicTrackRes, musicAlbumRes] = await Promise.allSettled([
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/movie/now_playing?language=en-US&page=${movieNowPage}`,
          { signal, cacheKey: `tmdb:new-releases:movie-now:${movieNowPage}` }
        ),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            `${TMDB_PROXY_BASE}/movie/upcoming?language=en-US&page=${movieUpcomingPage}`,
            { signal, cacheKey: `tmdb:new-releases:movie-upcoming:${movieUpcomingPage}` }
          )
          : Promise.resolve({ results: [] }),
        fetchJsonWithPerfCache(
          `${TMDB_PROXY_BASE}/tv/airing_today?language=en-US&page=1`,
          { signal, cacheKey: 'tmdb:new-releases:tv-episode' }
        ),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=first_air_date.desc&page=1&first_air_date.gte=${recentSeasonDate}&first_air_date.lte=${todayDate}`,
            { signal, cacheKey: `tmdb:new-releases:tv-season:${recentSeasonDate}:${todayDate}` }
          )
          : Promise.resolve({ results: [] }),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=popularity.desc&page=1&with_genres=16&with_original_language=ja&air_date.gte=${recentEpisodeDate}&air_date.lte=${todayDate}`,
            { signal, cacheKey: `tmdb:new-releases:anime-episode:${recentEpisodeDate}:${todayDate}` }
          )
          : Promise.resolve({ results: [] }),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            `${TMDB_PROXY_BASE}/discover/tv?language=en-US&sort_by=first_air_date.desc&page=1&with_genres=16&with_original_language=ja&first_air_date.gte=${recentSeasonDate}`,
            { signal, cacheKey: `tmdb:new-releases:anime-season:${recentSeasonDate}` }
          )
          : Promise.resolve({ results: [] }),
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
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            `/api/books/popular?limit=30&page=1&language=en&orderBy=newest&q=${bookReleaseQuery}`,
            { signal, cacheKey: `books:new-releases:newest:${recentBookMinYear}:${currentYear}` }
          )
          : Promise.resolve({ docs: [] }),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            '/api/music/top-50?limit=40&market=US',
            { signal, cacheKey: 'music:new-releases:top-50-us-40' }
          )
          : Promise.resolve({ results: [] }),
        includeExtendedSources
          ? fetchJsonWithPerfCache(
            '/api/music/new-releases?limit=40&market=US&album_types=album',
            { signal, cacheKey: 'music:new-releases:albums-us-40:album' }
          )
          : Promise.resolve({ results: [] })
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

      if (homeNewReleasesState.length) {
        renderOrDeferHomeRail('newReleasesRail', filterHomeSafeItems(homeNewReleasesState), railOptions);
      } else {
        setHomeRailDeferredPlaceholder('newReleasesRail');
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
          renderOrDeferHomeRail('newReleasesRail', homeNewReleasesState, railOptions);
        } else if (!homeNewReleasesState.length) {
          renderOrDeferHomeRail('newReleasesRail', [], { ...railOptions, allowEmptyState: true });
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

    function getReviewSignalWeight(rating) {
      const value = Number(rating || 0);
      if (value >= 5) return 0.95;
      if (value >= 4) return 0.72;
      if (value >= 3) return 0.42;
      return 0.18;
    }

    function splitHomeTastePhrases(value) {
      return String(value || '')
        .split(/[|,/]+|&/g)
        .map((part) => String(part || '').trim().toLowerCase())
        .filter(Boolean);
    }

    function tokenizeHomeTasteText(value) {
      return Array.from(new Set(
        String(value || '')
          .toLowerCase()
          .replace(/[’']/g, '')
          .split(/[^a-z0-9+#-]+/i)
          .map((token) => String(token || '').trim())
          .filter((token) => (
            token.length >= HOME_TASTE_MIN_TOKEN_LENGTH &&
            !HOME_TASTE_STOPWORDS.has(token) &&
            !/^\d+$/.test(token)
          ))
      ));
    }

    function buildHomeItemTasteTokens(item) {
      if (!item || typeof item !== 'object') return [];
      const tokens = new Set();
      const addToken = (token) => {
        const text = String(token || '').trim().toLowerCase();
        if (!text) return;
        if (text.length < HOME_TASTE_MIN_TOKEN_LENGTH && !/[+#-]/.test(text)) return;
        if (HOME_TASTE_STOPWORDS.has(text)) return;
        tokens.add(text);
      };
      const addText = (text) => tokenizeHomeTasteText(text).forEach(addToken);
      const addPhraseParts = (value) => {
        splitHomeTastePhrases(value).forEach((part) => {
          addToken(part);
          addText(part);
        });
      };

      addToken(item.mediaType);
      addPhraseParts(item.genreText);
      addPhraseParts(item.subtitle);
      addPhraseParts(item.extra);
      addPhraseParts(item.category);
      addPhraseParts(item.country);
      addPhraseParts(item.sport);
      addPhraseParts(item.league);
      addPhraseParts(item.maturityRating);
      addText(item.title);
      addText(item.overview);
      addText(item.description);
      if (Array.isArray(item.genres)) item.genres.forEach(addPhraseParts);
      if (Array.isArray(item.tags)) item.tags.forEach(addPhraseParts);
      return Array.from(tokens).slice(0, HOME_TASTE_PROFILE_TOKEN_LIMIT);
    }

    function getHomeRecommendationCandidateIndex(feedMap = homeFeedState) {
      const index = new Map();
      const addItems = (items) => {
        (Array.isArray(items) ? items : []).forEach((item) => {
          const key = getRecommendationItemKey(item?.mediaType, item?.itemId);
          if (!key || !item) return;
          const existing = index.get(key);
          if (!existing || Number(item?.discoveryScore || 0) > Number(existing?.discoveryScore || 0)) {
            index.set(key, item);
          }
        });
      };
      Object.values(feedMap || {}).forEach(addItems);
      addItems(homeNewReleasesState);
      addItems(homeSpotlightItems);
      return index;
    }

    function getHomeRelatedTypeAffinity(mediaType, typeWeights) {
      const type = String(mediaType || '').trim().toLowerCase();
      if (!(typeWeights instanceof Map) || !type) return 0;
      const relatedGroups = {
        movie: ['tv', 'anime', 'book'],
        tv: ['movie', 'anime', 'book'],
        anime: ['tv', 'movie', 'game'],
        game: ['anime', 'movie'],
        book: ['movie', 'tv', 'anime'],
        music: ['book'],
        travel: ['sports'],
        sports: ['travel']
      };
      const related = relatedGroups[type] || [];
      return related.reduce((best, key) => Math.max(best, Number(typeWeights.get(key) || 0)), 0);
    }

    function humanizeHomeTasteToken(token) {
      const value = String(token || '').trim().toLowerCase();
      if (!value) return '';
      const aliases = {
        scifi: 'sci-fi',
        'sci-fi': 'sci-fi',
        romcom: 'rom-com',
        'rom-com': 'rom-com',
        truecrime: 'true crime',
        'true-crime': 'true crime',
        tv: 'tv',
        anime: 'anime',
        nba: 'nba',
        nfl: 'nfl',
        f1: 'f1'
      };
      return aliases[value] || value.replace(/-/g, ' ');
    }

    function buildHomeTasteProfile(signalEntries = [], feedMap = homeFeedState) {
      const candidateIndex = getHomeRecommendationCandidateIndex(feedMap);
      const tokenWeights = new Map();
      const typeWeightsRaw = new Map();
      const consumedKeys = new Set();

      const addTokenWeight = (token, amount) => {
        const key = String(token || '').trim().toLowerCase();
        const weight = Number(amount || 0);
        if (!key || !Number.isFinite(weight) || weight <= 0) return;
        tokenWeights.set(key, Number((Number(tokenWeights.get(key) || 0) + weight).toFixed(4)));
      };

      (Array.isArray(signalEntries) ? signalEntries : []).forEach((entry) => {
        const mediaType = String(entry?.mediaType || '').trim().toLowerCase();
        const itemId = entry?.itemId;
        const key = getRecommendationItemKey(mediaType, itemId);
        const weight = Number(entry?.weight || 0);
        if (!key || !mediaType || !Number.isFinite(weight) || weight <= 0) return;

        if (entry?.isOwn) consumedKeys.add(key);
        typeWeightsRaw.set(mediaType, Number((Number(typeWeightsRaw.get(mediaType) || 0) + weight).toFixed(4)));

        const item = candidateIndex.get(key);
        if (!item) return;
        const tokens = buildHomeItemTasteTokens(item);
        const tokenShare = weight / Math.max(4, Math.min(tokens.length || 1, 10));
        tokens.forEach((token) => addTokenWeight(token, tokenShare));
      });

      (homeInterestProfile?.tags || []).forEach((tag) => {
        splitHomeTastePhrases(tag).forEach((part) => addTokenWeight(part, 0.32));
      });
      (homeInterestProfile?.types || []).forEach((type) => {
        const key = String(type || '').trim().toLowerCase();
        if (!key) return;
        typeWeightsRaw.set(key, Number((Number(typeWeightsRaw.get(key) || 0) + 0.42).toFixed(4)));
      });

      const typeWeights = new Map();
      const maxTypeWeight = Math.max(0, ...Array.from(typeWeightsRaw.values()).map((value) => Number(value || 0)));
      typeWeightsRaw.forEach((value, key) => {
        const normalized = maxTypeWeight > 0 ? (value / maxTypeWeight) : 0;
        typeWeights.set(key, Number(Math.min(1.12, 0.18 + (normalized * 0.94)).toFixed(4)));
      });

      const rankedTokens = Array.from(tokenWeights.entries())
        .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
        .slice(0, HOME_TASTE_PROFILE_TOKEN_LIMIT);
      const rankedTokenMap = new Map(rankedTokens);
      const tokenNorm = Math.max(
        0.9,
        rankedTokens.reduce((sum, [, value]) => sum + Number(value || 0), 0) / Math.max(1, rankedTokens.length)
      );

      return {
        candidateIndex,
        consumedKeys,
        tokenWeights: rankedTokenMap,
        tokenNorm,
        typeWeights,
        signalCount: Array.isArray(signalEntries) ? signalEntries.length : 0
      };
    }

    function scoreHomeTasteProfileMatch(item, tasteProfile) {
      if (!item || typeof item !== 'object' || !tasteProfile) {
        return { score: 0, reason: '', matchedTokens: [] };
      }

      const tokens = buildHomeItemTasteTokens(item);
      const matched = [];
      let tokenScore = 0;
      tokens.forEach((token) => {
        const weight = Number(tasteProfile?.tokenWeights?.get?.(token) || 0);
        if (weight <= 0) return;
        tokenScore += weight;
        matched.push([token, weight]);
      });
      matched.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));

      const mediaType = String(item.mediaType || '').trim().toLowerCase();
      const typeAffinity = Number(tasteProfile?.typeWeights?.get?.(mediaType) || 0);
      const relatedAffinity = getHomeRelatedTypeAffinity(mediaType, tasteProfile?.typeWeights);
      const normalizedTokenScore = Math.min(1.75, tokenScore / Math.max(0.82, Number(tasteProfile?.tokenNorm || 1)));
      const crossMediaBoost = typeAffinity < 0.4 && matched.length >= 2
        ? Math.min(0.42, relatedAffinity * 0.5)
        : Math.min(0.18, relatedAffinity * 0.18);
      const score = Number((normalizedTokenScore * 1.18 + typeAffinity * 0.58 + crossMediaBoost).toFixed(4));

      const matchedTokens = matched
        .slice(0, 2)
        .map(([token]) => humanizeHomeTasteToken(token))
        .filter(Boolean);

      let reason = '';
      if (matchedTokens.length >= 2) {
        reason = `Because you save ${matchedTokens[0]} and ${matchedTokens[1]}`;
      } else if (matchedTokens.length === 1) {
        reason = `Because you save a lot of ${matchedTokens[0]}`;
      } else if (typeAffinity >= 0.95) {
        const meta = getHomeMediaMeta(mediaType);
        reason = `More ${meta.label.toLowerCase()} picks based on your saves`;
      } else if (relatedAffinity >= 0.95) {
        reason = 'Cross-media pick based on your taste';
      }

      return { score, reason, matchedTokens };
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
      const reviewTasks = Object.entries(HOME_REVIEW_SIGNAL_TABLES).map(([mediaType, cfg]) => {
        return client
          .from(cfg.table)
          .select(`${cfg.itemField}, rating, created_at`)
          .eq('user_id', homeCurrentUser.id)
          .gte('rating', 4)
          .order('created_at', { ascending: false })
          .limit(HOME_TASTE_PROFILE_REVIEW_LIMIT)
          .then((res) => ({
            mediaType,
            itemField: cfg.itemField,
            rows: Array.isArray(res?.data) ? res.data : []
          }))
          .catch(() => ({ mediaType, itemField: cfg.itemField, rows: [] }));
      });
      const reviewBatches = await Promise.all(reviewTasks);
      const signalMap = new Map();
      const reasonsMap = new Map();
      const tasteSignalEntries = [];

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
          const profileWeight = (isOwn ? 1.24 : 0.46) * (listWeight + (recency * 0.72));

          signalMap.set(key, Number((Number(signalMap.get(key) || 0) + score).toFixed(4)));
          tasteSignalEntries.push({
            mediaType,
            itemId,
            isOwn,
            listType: row?.list_type,
            createdAt: row?.created_at,
            weight: Number(profileWeight.toFixed(4))
          });

          const existingReason = reasonsMap.get(key) || { ownCount: 0, followingCount: 0, recentAt: '' };
          if (isOwn) existingReason.ownCount += 1;
          else existingReason.followingCount += 1;
          if (!existingReason.recentAt || (row?.created_at && new Date(row.created_at).getTime() > new Date(existingReason.recentAt).getTime())) {
            existingReason.recentAt = String(row?.created_at || '');
          }
          reasonsMap.set(key, existingReason);
        });
      });

      reviewBatches.forEach(({ mediaType, itemField, rows }) => {
        rows.forEach((row) => {
          const rawItemId = row?.[itemField];
          const itemId = normalizeHomeDefaultItemId(mediaType, rawItemId);
          if (itemId === null || itemId === undefined) return;
          const key = getRecommendationItemKey(mediaType, itemId);
          if (!key) return;

          const recency = getRecencyWeight(row?.created_at);
          const reviewWeight = getReviewSignalWeight(row?.rating);
          tasteSignalEntries.push({
            mediaType,
            itemId,
            isOwn: true,
            listType: Number(row?.rating || 0) >= 5 ? 'favorites' : 'review',
            createdAt: row?.created_at,
            weight: Number((reviewWeight * (0.92 + recency)).toFixed(4))
          });

          const reviewBoost = (reviewWeight * 0.34) + (recency * 0.18);
          signalMap.set(key, Number((Number(signalMap.get(key) || 0) + reviewBoost).toFixed(4)));

          const existingReason = reasonsMap.get(key) || { ownCount: 0, followingCount: 0, recentAt: '', reviewCount: 0 };
          existingReason.ownCount += 1;
          existingReason.reviewCount = Number(existingReason.reviewCount || 0) + 1;
          if (!existingReason.recentAt || (row?.created_at && new Date(row.created_at).getTime() > new Date(existingReason.recentAt).getTime())) {
            existingReason.recentAt = String(row?.created_at || '');
          }
          reasonsMap.set(key, existingReason);
        });
      });

      const tasteProfile = buildHomeTasteProfile(tasteSignalEntries, homeFeedState);

      return {
        signalMap,
        reasonsMap,
        followedCount: followedIds.length,
        tasteProfile
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
      const tasteProfile = signalPayload?.tasteProfile || null;
      const consumedKeys = tasteProfile?.consumedKeys instanceof Set ? tasteProfile.consumedKeys : new Set();
      if (!Array.isArray(scoredPool) || !scoredPool.length) return [];
      return scoredPool
        .filter((item) => {
          const key = getRecommendationItemKey(item?.mediaType, item?.itemId);
          return !key || !consumedKeys.has(key);
        })
        .map((item) => {
          const key = getRecommendationItemKey(item?.mediaType, item?.itemId);
          const signal = Number(signalMap.get(key) || 0);
          const reason = reasonsMap.get(key) || { ownCount: 0, followingCount: 0, reviewCount: 0 };
          const tasteMatch = scoreHomeTasteProfileMatch(item, tasteProfile);
          let reasonText = '';
          if (tasteMatch.reason) reasonText = tasteMatch.reason;
          else if (reason.ownCount > 0 && reason.followingCount > 0) reasonText = 'Saved by you and people you follow';
          else if (reason.ownCount > 0 && Number(reason.reviewCount || 0) > 0) reasonText = 'Based on what you save and rate highly';
          else if (reason.ownCount > 0) reasonText = 'From your recent saves';
          else if (reason.followingCount > 0) reasonText = 'Popular with people you follow';
          return {
            ...item,
            extra: reasonText || item.extra || '',
            recommendationReason: reasonText || '',
            discoveryScore: Number(item.discoveryScore || 0) + Math.min(4.6, signal * 0.92) + Number(tasteMatch.score || 0)
          };
        })
        .sort((a, b) => Number(b.discoveryScore || 0) - Number(a.discoveryScore || 0));
    }

    async function refreshMixedForYouFromActivity(feedMap, scoredPool) {
      const localFeed = feedMap || homeFeedState;
      const localPool = Array.isArray(scoredPool) ? scoredPool : buildScoredDiscoveryPool(localFeed);
      const seq = ++homeBecauseRefreshSeq;
      const fallbackItems = buildUnifiedFeed(localPool, getHomeUnifiedTargetItems());

      if (!homeCurrentUser?.id) {
        if (fallbackItems.length) {
          renderOrDeferHomeRail('unifiedRail', fallbackItems, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
        } else {
          setHomeRailDeferredPlaceholder('unifiedRail');
        }
        return;
      }

      const signalPayload = await getActivitySignalsCached();
      if (seq !== homeBecauseRefreshSeq) return;
      const boostedPool = applyActivitySignalsToPool(localPool, signalPayload);
      const unified = buildUnifiedFeed(boostedPool, getHomeUnifiedTargetItems());
      if (boostedPool.length) hydrateSpotlightFromPool(boostedPool);
      if (unified.length) {
        renderOrDeferHomeRail('unifiedRail', unified, {
          mediaType: 'mixed',
          uniformMedia: true,
          restaurantComposite: true
        });
      } else if (fallbackItems.length) {
        renderOrDeferHomeRail('unifiedRail', fallbackItems, {
          mediaType: 'mixed',
          uniformMedia: true,
          restaurantComposite: true
        });
      } else {
        renderOrDeferHomeRail('unifiedRail', [], {
          mediaType: 'mixed',
          uniformMedia: true,
          restaurantComposite: true,
          allowEmptyState: true
        });
      }
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

    function canUseHomeSpotlightItem(item) {
      if (!item || item.isPlaceholder) return false;
      return !!String(
        item?.spotlightImage
        || item?.backgroundImage
        || item?.spotlightMediaImage
        || item?.image
        || ''
      ).trim();
    }

    function buildBalancedSpotlightShortlist(pool, limit = HOME_SPOTLIGHT_POOL_SIZE) {
      const maxItems = Math.max(1, Number(limit || HOME_SPOTLIGHT_POOL_SIZE));
      const candidates = [];
      const usedCandidateKeys = new Set();
      filterHomeSafeItems(Array.isArray(pool) ? pool : []).filter((item) => canUseHomeSpotlightItem(item)).forEach((item, index) => {
        const key = getHomeSpotlightPoolKey(item, index);
        if (!key || usedCandidateKeys.has(key)) return;
        usedCandidateKeys.add(key);
        candidates.push(item);
      });
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

      const hasBackdrop = (item) => !!String(item?.spotlightImage || item?.backgroundImage || '').trim();
      activeTypes.forEach((type) => {
        const items = grouped.get(type);
        if (!Array.isArray(items) || items.length < 2) return;
        const withBackdrop = [];
        const withoutBackdrop = [];
        items.forEach((item) => (hasBackdrop(item) ? withBackdrop : withoutBackdrop).push(item));
        grouped.set(type, withBackdrop.concat(withoutBackdrop));
      });

      const allocation = new Map(activeTypes.map((type) => [type, 0]));
      const PRIMARY_SPOTLIGHT_TYPES = ['game', 'movie', 'tv', 'anime'];
      const primaryTypes = PRIMARY_SPOTLIGHT_TYPES.filter((type) => activeTypes.includes(type));
      const secondaryTypes = activeTypes.filter((type) => !PRIMARY_SPOTLIGHT_TYPES.includes(type));
      const primaryBudget = primaryTypes.length
        ? Math.min(
          maxItems,
          Math.max(Math.floor(maxItems * 0.85), Math.min(maxItems, primaryTypes.length * 2))
        )
        : maxItems;

      const basePrimary = primaryTypes.length ? Math.floor(primaryBudget / primaryTypes.length) : 0;
      primaryTypes.forEach((type) => {
        allocation.set(type, Math.min(basePrimary, grouped.get(type).length));
      });

      let used = [...allocation.values()].reduce((sum, value) => sum + Number(value || 0), 0);
      while (used < primaryBudget) {
        const nextType = [...primaryTypes]
          .map((type) => {
            const allocated = Number(allocation.get(type) || 0);
            const remaining = grouped.get(type).length - allocated;
            const baseWeight = Number(homeTasteWeights[type] || 1);
            const focusBoost = (type === 'game' || type === 'movie' || type === 'tv') ? 0.6 : 0.25;
            return { type, remaining, weight: baseWeight + focusBoost };
          })
          .filter((entry) => entry.remaining > 0)
          .sort((a, b) => b.remaining - a.remaining || b.weight - a.weight || a.type.localeCompare(b.type))[0];
        if (!nextType) break;
        allocation.set(nextType.type, Number(allocation.get(nextType.type) || 0) + 1);
        used += 1;
      }

      while (used < maxItems) {
        const nextSecondary = [...secondaryTypes]
          .map((type) => {
            const allocated = Number(allocation.get(type) || 0);
            const remaining = grouped.get(type).length - allocated;
            return { type, remaining, weight: Number(homeTasteWeights[type] || 1) };
          })
          .filter((entry) => entry.remaining > 0)
          .sort((a, b) => b.weight - a.weight || b.remaining - a.remaining || a.type.localeCompare(b.type))[0];
        if (!nextSecondary) break;
        allocation.set(nextSecondary.type, Number(allocation.get(nextSecondary.type) || 0) + 1);
        used += 1;
      }

      const selectedByType = new Map();
      activeTypes.forEach((type) => {
        const takeCount = Number(allocation.get(type) || 0);
        selectedByType.set(type, grouped.get(type).slice(0, takeCount));
      });

      const roundRobinOrder = [...activeTypes].sort((a, b) => {
        const aPrimary = primaryTypes.includes(a) ? 0 : 1;
        const bPrimary = primaryTypes.includes(b) ? 0 : 1;
        if (aPrimary !== bPrimary) return aPrimary - bPrimary;
        return Number(homeTasteWeights[b] || 1) - Number(homeTasteWeights[a] || 1);
      });
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
      const safePool = filterHomeSafeItems(Array.isArray(pool) ? pool : []).filter((item) => canUseHomeSpotlightItem(item));
      if (!safePool.length) {
        homeSpotlightItems = [];
        resetSpotlightTimer(false);
        return;
      }

      const previousKey = getHomeSpotlightPoolKey(getCurrentSpotlightItem(), homeSpotlightIndex);
      const previousIndex = Number(homeSpotlightIndex || 0);
      const spotlightPoolSize = getHomeSpotlightPoolSize();
      const topPool = safePool.slice(0, spotlightPoolSize * 4);
      const mixedCandidates = buildUnifiedFeed(topPool, spotlightPoolSize * 4);
      const shortlist = buildBalancedSpotlightShortlist(
        mixedCandidates.length ? mixedCandidates : topPool,
        spotlightPoolSize
      );
      if (!shortlist.length) {
        homeSpotlightItems = safePool.slice(0, spotlightPoolSize);
      } else {
        const seed = getSpotlightSeedOffset();
        const offset = seed % shortlist.length;
        homeSpotlightItems = [...shortlist.slice(offset), ...shortlist.slice(0, offset)];
      }

      warmSpotlightImages(homeSpotlightItems);
      const preservedIndex = previousKey
        ? homeSpotlightItems.findIndex((item, index) => getHomeSpotlightPoolKey(item, index) === previousKey)
        : -1;
      homeSpotlightIndex = preservedIndex >= 0
        ? preservedIndex
        : Math.max(0, Math.min(previousIndex, homeSpotlightItems.length - 1));
      showSpotlightByIndex(homeSpotlightIndex, false);
      resetSpotlightTimer(true);
      void hydrateSpotlightAltImages(homeSpotlightItems);
    }

    async function loadTasteWeights() {
      const weights = Object.fromEntries(HOME_ACTIVE_MEDIA_TYPES.map((type) => [type, 1]));
      if (!homeCurrentUser?.id) return weights;
      const now = Date.now();
      if (
        homeTasteWeightsCache
        && homeTasteWeightsCache.weights
        && homeTasteWeightsCache.userId === homeCurrentUser.id
        && (now - Number(homeTasteWeightsCache.savedAt || 0)) < HOME_TASTE_WEIGHTS_CACHE_MS
      ) {
        return homeTasteWeightsCache.weights;
      }

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
        const interestProfile = await loadHomeInterestProfile(client);
        homeInterestProfile = interestProfile;
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        if (!total) {
          if (interestProfile?.types?.length) {
            interestProfile.types.forEach((type) => {
              if (!weights[type]) return;
              weights[type] = Number(Math.min(2.1, weights[type] + 0.35).toFixed(2));
            });
          }
          return weights;
        }

        Object.entries(counts).forEach(([type, value]) => {
          const share = value / total;
          weights[type] = Number((1 + Math.min(1.1, share * 3.2)).toFixed(2));
        });

        if (interestProfile?.types?.length) {
          interestProfile.types.forEach((type) => {
            if (!weights[type]) return;
            weights[type] = Number(Math.min(2.1, weights[type] + 0.35).toFixed(2));
          });
        }
      } catch (_err) {}
      homeTasteWeightsCache = {
        userId: homeCurrentUser.id,
        savedAt: now,
        weights
      };
      return weights;
    }

    async function ensureHomeSupabase() {
      if (typeof window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE === 'function') {
        try {
          window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE();
        } catch (_err) {}
      }
      if (homeSupabaseClient) return homeSupabaseClient;
      if (window.__ZO2Y_SUPABASE_CLIENT) {
        homeSupabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
        return homeSupabaseClient;
      }
      if (!window.supabase?.createClient) {
        await waitForHomeSupabaseSdk();
      }
      if (!window.supabase?.createClient) return null;
      homeSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          storage: window.__ZO2Y_AUTH_STORAGE_BRIDGE || undefined,
          persistSession: true,
          autoRefreshToken: true,
          // OAuth callback is handled on auth-callback.html, keep homepage parser off.
          detectSessionInUrl: false,
          storageKey: 'zo2y-auth-v1'
        }
      });
      window.__ZO2Y_SUPABASE_CLIENT = homeSupabaseClient;
      return homeSupabaseClient;
    }
    window.ensureHomeSupabase = ensureHomeSupabase;

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
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('refresh token already used') || message.includes('already been used')) {
          clearHomeAuthParamsFromUrl();
          return true;
        }
        console.error('Home OAuth completion failed:', error);
        showHomeToast('Could not complete sign-in. Please try again.', true);
        clearHomeAuthParamsFromUrl();
        return false;
      }
    }

    function resetHomeProfileLabelCache() {
      homeProfileLabelLookupPromise = null;
      homeProfileLabelCache = {
        userId: '',
        label: '',
        fetchedAt: 0,
        failedAt: 0
      };
    }

    function queueHomeAuthUiSync(options = {}) {
      if (options && options.refreshPersonalization) {
        homeAuthSyncNeedsPersonalization = true;
      }
      if (homeAuthSyncTimer) return;
      homeAuthSyncTimer = window.setTimeout(() => {
        const shouldRefreshPersonalization = homeAuthSyncNeedsPersonalization;
        homeAuthSyncTimer = null;
        homeAuthSyncNeedsPersonalization = false;
        void initAuthUi();
        if (shouldRefreshPersonalization) {
          void refreshHomePersonalization();
        }
      }, 90);
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
          if (window.ListUtils && typeof ListUtils.ensureBookRecord === 'function') {
            return await ListUtils.ensureBookRecord(client, {
              id: String(itemId),
              title: payload.title || '',
              authors: payload.subtitle || '',
              thumbnail: payload.image || ''
            });
          }
          return false;
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
        return true;
      };

      try {
        if (mediaType === 'sports') {
          const teamId = String(payload.itemId || '').trim();
          if (!teamId) {
            showHomeToast('Could not update list', true);
            return result;
          }
          const subtitle = String(payload.subtitle || '').trim();
          const [leagueRaw, sportRaw] = subtitle.split('|').map((value) => String(value || '').trim());
          const teamName = String(payload.title || teamId).trim() || teamId;
          const teamPayload = {
            id: teamId,
            name: teamName,
            league: leagueRaw || null,
            sport: sportRaw || null,
            banner_url: String(payload.image || '').trim() || null,
            fanart_url: String(payload.image || '').trim() || null,
            updated_at: new Date().toISOString()
          };

          let shouldSave = nextSaved;
          if (shouldSave === null || shouldSave === undefined) {
            const { data: existing } = await client
              .from('user_favorite_teams')
              .select('id')
              .eq('user_id', homeCurrentUser.id)
              .eq('team_id', teamId)
              .maybeSingle();
            shouldSave = !existing?.id;
          }

          if (!shouldSave) {
            const { error: deleteError } = await client
              .from('user_favorite_teams')
              .delete()
              .eq('user_id', homeCurrentUser.id)
              .eq('team_id', teamId);
            if (deleteError) {
              showHomeToast('Could not update list', true);
              return result;
            }
            showHomeToast('Removed from favorites');
            result.ok = true;
            result.saved = false;
            invalidateActivitySignals();
            return result;
          }

          const { error: teamError } = await client
            .from('teams')
            .upsert(teamPayload, { onConflict: 'id' });
          if (teamError) {
            showHomeToast('Could not save team', true);
            return result;
          }

          const { error: insertError } = await client
            .from('user_favorite_teams')
            .upsert({ user_id: homeCurrentUser.id, team_id: teamId }, { onConflict: 'user_id,team_id' });
          if (insertError) {
            showHomeToast('Could not update list', true);
            return result;
          }

            showHomeToast('Added to favorites');
            result.ok = true;
            result.saved = true;
            markStartedHomeListFlow(homeCurrentUser?.id);
            invalidateActivitySignals();
            return result;
        }

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
            const ensured = await ensureLinkedMediaRecord(itemId);
            if (!ensured) {
              showHomeToast('Book info is unavailable right now.', true);
              return result;
            }
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
            markStartedHomeListFlow(homeCurrentUser?.id);
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
          markStartedHomeListFlow(homeCurrentUser?.id);
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
        if (mediaType === 'sports') {
          const teamId = String(itemId || '').trim();
          if (!teamId) return status;
          const { data } = await client
            .from('user_favorite_teams')
            .select('team_id')
            .eq('user_id', homeCurrentUser.id)
            .eq('team_id', teamId)
            .maybeSingle();
          if (data?.team_id && 'favorites' in status) status.favorites = true;
          return status;
        }

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
      selectedIcon: 'fas fa-list',
      hasStartedSaving: false,
      forceShowHelperOnce: false
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

    function moveFocusOutsideModal(modal) {
      if (!modal) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (!modal.contains(active)) return;
      active.blur();
      const fallback = document.getElementById('zo2yMobileMenuBtn')
        || document.getElementById('sidebarToggleBtn')
        || document.querySelector('.zo2y-shared-brand')
        || document.body;
      if (fallback && typeof fallback.focus === 'function') {
        if (fallback === document.body && !document.body.hasAttribute('tabindex')) {
          document.body.setAttribute('tabindex', '-1');
        }
        fallback.focus({ preventScroll: true });
      }
    }

    function closeItemMenuModal() {
      const itemModal = document.getElementById('itemMenuModal');
      if (itemModal) {
        moveFocusOutsideModal(itemModal);
        itemModal.classList.remove('active');
        itemModal.setAttribute('aria-hidden', 'true');
      }
      homeItemMenuState.pendingQuickKeys = new Set();
      homeItemMenuState.forceShowHelperOnce = false;
      syncMenuModalBodyLock();
    }

    function closeCreateListModal() {
      const createModal = document.getElementById('createListModal');
      if (createModal) {
        moveFocusOutsideModal(createModal);
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
        quickContainer.innerHTML = '<div class="menu-empty menu-empty-rich"><div class="menu-empty-title">No quick saves here yet</div><div class="menu-empty-copy">This item type does not have fast-save rows right now, but custom lists can still help you organize it.</div></div>';
        return;
      }
      const hasStartedSaving = !homeCurrentUser?.id || !!homeItemMenuState.hasStartedSaving;
      quickContainer.innerHTML = `
        ${hasStartedSaving ? '' : '<div class="menu-helper">Tap once to save instantly. Use quick lists for speed, then build custom lists underneath.</div>'}
        ${homeItemMenuState.quickRows.map((row) => {
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
      }).join('')}`;

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
        if (homeItemMenuState.hasStartedSaving) {
          customContainer.innerHTML = '';
          return;
        }
        customContainer.innerHTML = `
          <div class="menu-empty menu-empty-rich">
            <div class="menu-empty-title">Create your first custom list</div>
            <div class="menu-empty-copy">Make something like “Weekend movies”, “Games to finish”, or “2026 favorites” and reuse it everywhere.</div>
            <button class="menu-empty-cta" type="button">Create first list</button>
          </div>
        `;
        const createBtn = customContainer.querySelector('.menu-empty-cta');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            openCreateListModalFromMenu();
          });
        }
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
      const startedSavingKeySeen = hasStartedHomeListFlow(homeCurrentUser?.id);
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
      const hasCachedSaving =
        Object.values(homeItemMenuState.quickStatus || {}).some(Boolean)
        || (homeItemMenuState.selectedCustomLists instanceof Set && homeItemMenuState.selectedCustomLists.size > 0)
        || homeItemMenuState.customLists.length > 0;
      if (hasCachedSaving) {
        homeItemMenuState.forceShowHelperOnce = false;
        markStartedHomeListFlow(homeCurrentUser?.id);
      }
      homeItemMenuState.hasStartedSaving = hasCachedSaving || (startedSavingKeySeen && !homeItemMenuState.forceShowHelperOnce);
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
      if (
        Object.values(homeItemMenuState.quickStatus || {}).some(Boolean)
        || (homeItemMenuState.selectedCustomLists instanceof Set && homeItemMenuState.selectedCustomLists.size > 0)
        || homeItemMenuState.customLists.length > 0
      ) {
        homeItemMenuState.hasStartedSaving = true;
        markStartedHomeListFlow(homeCurrentUser?.id);
      }
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
      const shouldShowHelperOnce = !!homeCurrentUser?.id && !hasStartedHomeListFlow(homeCurrentUser.id);
      homeItemMenuState.forceShowHelperOnce = shouldShowHelperOnce;
      if (shouldShowHelperOnce) {
        markStartedHomeListFlow(homeCurrentUser.id);
      }
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
        const addedToList = next.size > previous.size;
        if (addedToList && window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
          window.ZO2Y_ANALYTICS.track('list_item_saved', {
            media_type: item.mediaType,
            source: 'home_menu'
          }, { essential: true });
        }
        if (addedToList && window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
          window.ZO2Y_ANALYTICS.markFirstAction('first_list_item_saved', {
            media_type: item.mediaType,
            user_id: homeCurrentUser?.id || ''
          }, { essential: true });
        }
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
      if (itemModal) {
        itemModal.classList.remove('active');
        itemModal.setAttribute('aria-hidden', 'true');
      }
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
      homeItemMenuState.hasStartedSaving = true;
      markStartedHomeListFlow(homeCurrentUser?.id);
      writeHomeMenuCustomListsCache(item.mediaType, homeItemMenuState.customLists);
      writeHomeMenuMembershipCache(item.mediaType, item.itemId, homeItemMenuState.selectedCustomLists);
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.track === 'function') {
        window.ZO2Y_ANALYTICS.track('custom_list_created', {
          media_type: item.mediaType,
          source: 'home_menu'
        }, { essential: true });
      }
      if (window.ZO2Y_ANALYTICS && typeof window.ZO2Y_ANALYTICS.markFirstAction === 'function') {
        window.ZO2Y_ANALYTICS.markFirstAction('first_custom_list_created', {
          media_type: item.mediaType,
          user_id: homeCurrentUser?.id || ''
        }, { essential: true });
      }
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
        moveFocusOutsideModal(modal);
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

    function getHomeChannelTargetItems() {
      if (isHomeSlowNetwork()) return Math.max(8, HOME_CHANNEL_TARGET_ITEMS - 8);
      if (isHomeCompactViewport()) return Math.max(10, HOME_CHANNEL_TARGET_ITEMS - 4);
      return HOME_CHANNEL_TARGET_ITEMS;
    }

    function getHomeUnifiedTargetItems() {
      return isHomeSlowNetwork()
        ? Math.max(12, HOME_UNIFIED_TARGET_ITEMS - 10)
        : HOME_UNIFIED_TARGET_ITEMS;
    }

    function getHomeSpotlightPoolSize() {
      return isHomeSlowNetwork()
        ? Math.max(8, HOME_SPOTLIGHT_POOL_SIZE - 8)
        : HOME_SPOTLIGHT_POOL_SIZE;
    }

    function getHomeTmdbSourceCount() {
      return isHomeSlowNetwork() ? 1 : 2;
    }

    function shouldUseLightweightHomeBooksLoad() {
      return isHomeSlowNetwork();
    }

    function shouldUseLightweightHomeMusicLoad() {
      return isHomeSlowNetwork();
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
        ? Math.max(1, HOME_EAGER_IMAGE_COUNT - 1)
        : HOME_EAGER_IMAGE_COUNT;
      const priorityBudget = onSlowNetwork
        ? 1
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
      const localBucketPrefix = `${SUPABASE_URL}/storage/v1/object/public/`;
      const sameOrigin = typeof window !== 'undefined' && src.startsWith(window.location.origin);
      const isLocalBucket = src.startsWith(localBucketPrefix);
      if (!sameOrigin && !isLocalBucket && !src.startsWith('/')) return;
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

    function shouldDeferHomeImageLoad(loading) {
      return String(loading || '').toLowerCase() !== 'eager';
    }

    function getHomeImageWrapper(img) {
      return img?.closest?.('.card-media, .game-card-media, .travel-photo-tile') || null;
    }

    function markHomeImageReady(img) {
      if (!img) return;
      img.setAttribute('data-image-ready', '1');
      img.setAttribute('data-home-image-state', 'ready');
      const wrapper = getHomeImageWrapper(img);
      if (wrapper) wrapper.classList.remove('is-loading-media');
    }

    function loadHomeDeferredImage(img) {
      if (!img || !img.hasAttribute('data-home-src')) return;
      const nextSrc = String(img.getAttribute('data-home-src') || '').trim();
      if (!nextSrc) {
        img.removeAttribute('data-home-src');
        markHomeImageReady(img);
        return;
      }
      img.setAttribute('data-home-image-state', 'loading');
      img.removeAttribute('data-home-src');
      img.src = nextSrc;
    }

    function getHomeDeferredImageObserver() {
      if (homeDeferredImageObserver || typeof window.IntersectionObserver !== 'function') {
        return homeDeferredImageObserver;
      }
      homeDeferredImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          observer.unobserve(img);
          loadHomeDeferredImage(img);
        });
      }, {
        rootMargin: HOME_DEFERRED_IMAGE_ROOT_MARGIN,
        threshold: 0.01
      });
      return homeDeferredImageObserver;
    }

    function primeHomeDeferredImages(scope) {
      if (!scope) return;
      const deferredImages = Array.from(scope.querySelectorAll('img[data-home-src]'));
      if (!deferredImages.length) return;
      const observer = getHomeDeferredImageObserver();
      if (!observer) {
        deferredImages.forEach((img) => loadHomeDeferredImage(img));
        return;
      }
      deferredImages.forEach((img) => observer.observe(img));

      // Some browsers occasionally fail to dispatch the initial IntersectionObserver callback
      // after a hard refresh. Proactively load any deferred images already in the viewport.
      const flushVisible = () => {
        const vw = Math.max(0, Number(window.innerWidth || 0));
        const vh = Math.max(0, Number(window.innerHeight || 0));
        if (!vw || !vh) return;
        deferredImages.forEach((img) => {
          if (!img || !img.hasAttribute('data-home-src')) return;
          const rect = img.getBoundingClientRect?.();
          if (!rect) return;
          const visible = rect.bottom >= -120 && rect.right >= -120 && rect.top <= (vh + 120) && rect.left <= (vw + 120);
          if (!visible) return;
          try { observer.unobserve(img); } catch (_err) {}
          loadHomeDeferredImage(img);
        });
      };

      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => flushVisible());
      } else {
        window.setTimeout(flushVisible, 0);
      }
    }

    function buildHomeImageAttrs(src, loading, priority, fallbackImage = '', extra = {}) {
      const actualSrc = String(src || '');
      const fallbackSrc = String(fallbackImage || '');
      const shouldDefer = shouldDeferHomeImageLoad(loading);
      const attrs = [
        `src="${shouldDefer ? HOME_IMAGE_PLACEHOLDER : actualSrc}"`,
        shouldDefer ? `data-home-src="${actualSrc}"` : '',
        `loading="${shouldDefer ? 'lazy' : loading}"`,
        `fetchpriority="${shouldDefer ? 'low' : priority}"`,
        'decoding="async"',
        'referrerpolicy="no-referrer"',
        'data-home-image="1"',
        `data-home-image-state="${shouldDefer ? 'deferred' : 'loading'}"`,
        'data-image-ready="0"',
        `data-fallback-image="${fallbackSrc}"`,
        'data-fallback-applied="0"',
        extra.ariaHidden ? 'aria-hidden="true"' : '',
        extra.altEmpty ? 'alt=""' : ''
      ];
      return attrs.filter(Boolean).join(' ');
    }

    function getOptimizedHomeTravelImage(url, width = 720) {
      const src = toHttpsUrl(String(url || '').trim());
      if (!src) return '';
      const publicMarker = `/storage/v1/object/public/${HOME_TRAVEL_BUCKET_NAME}/`;
      const renderMarker = `/storage/v1/render/image/public/${HOME_TRAVEL_BUCKET_NAME}/`;
      let path = '';
      if (src.includes(publicMarker)) {
        path = src.slice(src.indexOf(publicMarker) + publicMarker.length);
      } else if (src.includes(renderMarker)) {
        path = src.slice(src.indexOf(renderMarker) + renderMarker.length).split('?')[0];
      } else {
        return src;
      }
      if (!path) return src;
      const encodedPath = path
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      return `${SUPABASE_URL}/storage/v1/object/public/${HOME_TRAVEL_BUCKET_NAME}/${encodedPath}`;
    }

    function getHomeTravelVariants(itemData, landscape = false) {
      const travelSet = itemData?.travelPhotoSet || {};
      const candidates = [
        { raw: travelSet.scenic || itemData?.image || '', label: 'Scenic', kind: 'scenic' },
        { raw: travelSet.city || '', label: 'City life', kind: 'city' },
        { raw: travelSet.nature || '', label: 'Nature', kind: 'nature' }
      ];
      const seen = new Set();
      return candidates
        .map((entry) => {
          const src = getOptimizedHomeTravelImage(entry.raw, landscape ? 960 : 720);
          return src ? { ...entry, src } : null;
        })
        .filter(Boolean)
        .filter((entry) => {
          if (seen.has(entry.src)) return false;
          seen.add(entry.src);
          return true;
        });
    }

    function hashHomeTravelVariantSeed(value) {
      const input = String(value || '');
      let hash = 2166136261;
      for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function getStableHomeTravelVariant(itemData, landscape = false) {
      const variants = getHomeTravelVariants(itemData, landscape);
      if (!variants.length) return null;
      const itemKey = [
        String(itemData?.itemId || '').trim(),
        String(itemData?.title || '').trim(),
        String(itemData?.subtitle || '').trim()
      ].filter(Boolean).join('|');
      const index = hashHomeTravelVariantSeed(`${HOME_TRAVEL_VARIANT_SESSION_SEED}:${itemKey}:${landscape ? 'landscape' : 'poster'}`) % variants.length;
      return variants[index] || variants[0] || null;
    }

    function warmHomeFeedImages(feedMap) {
      if (isHomeSlowNetwork()) return;
      const perChannelBudget = getHomePreloadPerChannelBudget();
      if (perChannelBudget <= 0) return;
      const groups = Object.values(feedMap || {}).slice(0, 3);
      groups.forEach((items) => {
        if (!Array.isArray(items)) return;
        items.slice(0, perChannelBudget).forEach((item) => {
          const mediaType = String(item?.mediaType || '').toLowerCase();
          const primaryImage = mediaType === 'travel'
            ? getOptimizedHomeTravelImage(item.listImage || item.image || '', 720)
            : (item.listImage || item.image || '');
          preloadImage(primaryImage);
        });
      });
    }

    function warmSpotlightImages(items) {
      if (!Array.isArray(items)) return;
      const spotlightBudget = getHomeSpotlightPreloadBudget();
      items.slice(0, spotlightBudget).forEach((item) => {
        preloadImage(item.spotlightImage || item.backgroundImage || item.image);
      });
    }

    function getImageKey(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const cleaned = raw.split('?')[0];
      const lastSlash = cleaned.lastIndexOf('/');
      if (lastSlash >= 0) return cleaned.slice(lastSlash + 1);
      return cleaned;
    }

    function isSameImage(a, b) {
      const keyA = getImageKey(a);
      const keyB = getImageKey(b);
      return !!keyA && keyA === keyB;
    }

    function needsAltSpotlightImage(item) {
      if (!item) return false;
      const type = String(item.mediaType || '').toLowerCase();
      if (type !== 'movie' && type !== 'tv') return false;
      const mediaImage = String(item.spotlightMediaImage || item.image || '').trim();
      if (!mediaImage) return false;
      const backgroundImage = String(item.spotlightImage || item.backgroundImage || '').trim();
      if (!backgroundImage) return true;
      return isSameImage(backgroundImage, mediaImage);
    }

    async function hydrateSpotlightAltImages(items) {
      if (!Array.isArray(items)) return;
      const candidates = items
        .filter((item) => needsAltSpotlightImage(item) && !item.__spotlightAltChecked)
        .slice(0, 4);
      if (!candidates.length) return;

      let updated = false;
      await Promise.allSettled(candidates.map(async (item) => {
        const type = String(item.mediaType || '').toLowerCase();
        const id = String(item.itemId || '').trim();
        if (!id) return;
        item.__spotlightAltChecked = true;

        const endpoint = `/api/tmdb/${type === 'movie' ? 'movie' : 'tv'}/${encodeURIComponent(id)}/images`;
        const cacheKey = `tmdb:images:${type}:${id}`;
        const json = await fetchJsonWithPerfCache(endpoint, { cacheKey, timeoutMs: 6500, retries: 1 });
        const backdrops = Array.isArray(json?.backdrops) ? json.backdrops : [];
        if (!backdrops.length) return;

        const mediaKey = getImageKey(item.spotlightMediaImage || item.image || '');
        const picked = backdrops.find((entry) => {
          const filePath = String(entry?.file_path || '').trim();
          if (!filePath) return false;
          const key = getImageKey(filePath);
          return !mediaKey || key !== mediaKey;
        }) || null;
        if (!picked?.file_path) return;

        const nextUrl = `${TMDB_BACKDROP}${picked.file_path}`;
        if (!nextUrl || nextUrl === String(item.spotlightImage || '').trim()) return;
        item.spotlightImage = nextUrl;
        item.backgroundImage = nextUrl;
        updated = true;
      }));

      if (updated) {
        warmSpotlightImages(items);
        renderSpotlightItem(getCurrentSpotlightItem(), false);
      }
    }

    function getBookCoverFallback(item) {
      return String(item?.listImage || item?.image || '').trim();
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
        .map((value) => toHttpsUrl(String(value || '').trim()))
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
      const targetCount = getHomeChannelTargetItems();
      const instantTravelItems = getCachedHomeTravelItems(targetCount);
      const fallbackTravelItems = instantTravelItems.length
        ? instantTravelItems
        : getHomeTravelFallbackItems(targetCount);
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
        movie: [],
        tv: [],
        anime: [],
        ...(ENABLE_GAMES ? {
          game: makeSeedItems('game', ['Top Games', 'New Releases', 'Community Picks', 'Multiplayer Hits', 'Story Games'], 'games.html')
        } : {}),
        music: [],
        book: makeSeedItems('book', ['Bestselling Books', 'Popular Fiction', 'Book Club Picks', 'Page-Turners', 'Must Read Stories'], 'books.html'),
        ...(ENABLE_FASHION ? {
          fashion: HOME_FASHION_FALLBACKS.slice(0, targetCount).map((row, index) => ({
            ...mapHomeBrandItem(row, 'fashion', index),
            subtitle: row.category || 'Fashion',
            extra: row.domain || '',
            isPlaceholder: true
          }))
        } : {}),
        ...(ENABLE_FOOD ? {
          food: HOME_FOOD_FALLBACKS.slice(0, targetCount).map((row, index) => ({
            ...mapHomeBrandItem(row, 'food', index),
            subtitle: row.category || 'Food',
            extra: row.domain || '',
            isPlaceholder: true
          }))
        } : {}),
        ...(ENABLE_CARS ? {
          car: HOME_CAR_FALLBACKS.slice(0, targetCount).map((row, index) => ({
            ...mapHomeBrandItem(row, 'car', index),
            subtitle: row.category || 'Cars',
            extra: row.domain || '',
            isPlaceholder: true
          }))
        } : {}),
        travel: fallbackTravelItems,
        sports: makeSeedItems('sports', ['Top Teams', 'Fan Favorites', 'Legendary Clubs', 'Home Stadiums', 'Rivalry Picks'], 'sports.html')
      };
    }

    function getHomeRailFallbackItems(_channelKey) {
      const key = String(_channelKey || '').trim().toLowerCase();
      const targetCount = getHomeChannelTargetItems();
      if (key === 'game' && ENABLE_GAMES) {
        return [
          'Top Games',
          'New Releases',
          'Community Picks',
          'Multiplayer Hits',
          'Story Games'
        ].slice(0, Math.max(3, Math.min(targetCount, 5))).map((title, index) => ({
          mediaType: 'game',
          itemId: `seed-game-${index + 1}`,
          title,
          subtitle: 'Loading live picks',
          extra: 'Popular now',
          image: HOME_LOCAL_FALLBACK_IMAGE,
          backgroundImage: HOME_LOCAL_FALLBACK_IMAGE,
          spotlightImage: HOME_LOCAL_FALLBACK_IMAGE,
          spotlightMediaImage: HOME_LOCAL_FALLBACK_IMAGE,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          fallbackImage: HOME_LOCAL_FALLBACK_IMAGE,
          href: 'games.html',
          isPlaceholder: true
        }));
      }
      if (key === 'fashion' && ENABLE_FASHION) {
        return HOME_FASHION_FALLBACKS.slice(0, targetCount).map((row, index) => ({
          ...mapHomeBrandItem(row, 'fashion', index),
          subtitle: row.category || 'Fashion',
          extra: row.domain || ''
        }));
      }
      if (key === 'travel') {
        const cached = getCachedHomeTravelItems(targetCount);
        return cached.length ? cached : getHomeTravelFallbackItems(targetCount);
      }
      if (key === 'food' && ENABLE_FOOD) {
        return HOME_FOOD_FALLBACKS.slice(0, targetCount).map((row, index) => ({
          ...mapHomeBrandItem(row, 'food', index),
          subtitle: row.category || 'Food',
          extra: row.domain || ''
        }));
      }
      if (key === 'car' && ENABLE_CARS) {
        return HOME_CAR_FALLBACKS.slice(0, targetCount).map((row, index) => ({
          ...mapHomeBrandItem(row, 'car', index),
          subtitle: row.category || 'Cars',
          extra: row.domain || ''
        }));
      }
      if (key === 'sports') {
        const fallbackImage = HOME_LOCAL_FALLBACK_IMAGE;
        const titles = ['Top Teams', 'Fan Favorites', 'Legendary Clubs', 'Home Stadiums', 'Rivalry Picks'];
        return titles.slice(0, Math.max(3, Math.min(targetCount, titles.length))).map((title, index) => ({
          mediaType: 'sports',
          itemId: `seed-sports-${index + 1}`,
          title,
          subtitle: 'Sports',
          extra: 'Loading teams',
          image: fallbackImage,
          backgroundImage: fallbackImage,
          spotlightImage: fallbackImage,
          spotlightMediaImage: fallbackImage,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          fallbackImage,
          href: 'sports.html',
          isPlaceholder: true
        }));
      }
      return [];
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
        ...(ENABLE_FASHION ? [{ key: 'fashion', railId: 'fashionRail', loader: loadFashionBrands, opts: { mediaType: 'fashion' }, timeoutMs: 12000 }] : []),
        ...(ENABLE_FOOD ? [{ key: 'food', railId: 'foodRail', loader: loadFoodBrands, opts: { mediaType: 'food' }, timeoutMs: 12000 }] : []),
        ...(ENABLE_CARS ? [{ key: 'car', railId: 'carRail', loader: loadCarBrands, opts: { mediaType: 'car' }, timeoutMs: 12000 }] : []),
        { key: 'travel', railId: 'travelRail', loader: loadTravel, opts: { mediaType: 'travel' }, timeoutMs: 12000 },
        { key: 'sports', railId: 'sportsRail', loader: loadSports, opts: { mediaType: 'sports', landscape: false }, timeoutMs: 12000 }
      ];
    }

    function isHomeCompactViewport() {
      const width = Math.max(
        window.innerWidth || 0,
        document.documentElement?.clientWidth || 0,
        0
      );
      return width > 0 && width <= 900;
    }

    function getHomeInitialChannels(channels) {
      const list = Array.isArray(channels) ? channels.slice() : [];
      if (!list.length) return [];

      // User request: load *everything* immediately (no viewport deferrals).
      return list;

      const domOrdered = list.sort((left, right) => {
        const leftWrap = getHomeRailWrap(left?.railId);
        const rightWrap = getHomeRailWrap(right?.railId);
        if (!leftWrap && !rightWrap) return 0;
        if (!leftWrap) return 1;
        if (!rightWrap) return -1;
        if (leftWrap === rightWrap) return 0;
        const position = leftWrap.compareDocumentPosition(rightWrap);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
      });

      const selected = [];
      const seen = new Set();
      const pushChannel = (channel) => {
        const key = String(channel?.key || channel?.railId || '').trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        selected.push(channel);
      };

      const visibleChannels = domOrdered.filter((channel) => isHomeRailNearViewport(channel?.railId));
      visibleChannels.forEach(pushChannel);
      const targetCount = Math.max(budget, visibleChannels.length);
      domOrdered.forEach((channel) => {
        if (selected.length >= targetCount) return;
        pushChannel(channel);
      });

      return selected;
    }

    function getHomeInitialChannelConcurrency() {
      // Aggressive: load all channels fast to avoid “skeleton forever” perceptions.
      if (isHomeSlowNetwork()) return 3;
      if (isHomeCompactViewport()) return 5;
      return 6;
    }

    function getHomeRailViewportMarginPx() {
      if (isHomeSlowNetwork()) return isHomeCompactViewport() ? 180 : 240;
      return isHomeCompactViewport() ? 260 : 420;
    }

    function getHomeRailViewportRootMargin() {
      return `${getHomeRailViewportMarginPx()}px 0px`;
    }

    function getHomeRailWrap(railId) {
      const rail = document.getElementById(String(railId || '').trim());
      if (!rail) return null;
      return rail.closest('.rail-wrap') || rail.parentElement || rail;
    }

    function isHomeRailNearViewport(railId) {
      if (!railId) return true;
      const wrap = getHomeRailWrap(railId);
      if (!wrap || typeof wrap.getBoundingClientRect !== 'function') return true;
      const rect = wrap.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0, 720);
      const margin = getHomeRailViewportMarginPx();
      return rect.top <= (viewportHeight + margin);
    }

    function flushHomeSecondaryQueues() {
      if (homePendingNewReleasesRefresh) {
        homePendingNewReleasesRefresh = false;
        homeNewReleasesRefreshScheduled = false;
        scheduleHomeNewReleasesRefresh(homeFeedState);
      }
      if (homePendingMixedRefresh) {
        homePendingMixedRefresh = false;
        homeMixedRefreshScheduled = false;
        const args = homePendingMixedRefreshArgs || {};
        homePendingMixedRefreshArgs = null;
        scheduleHomeMixedRefresh(args.feedMap || homeFeedState, args.scoredPool);
      }
    }

    function markHomeInteraction() {
      if (homeUserInteracted) return;
      homeUserInteracted = true;
      flushHomeSecondaryQueues();
    }

    function ensureHomeInteractionWatch() {
      if (homeInteractionWatchBound || typeof window === 'undefined') return;
      homeInteractionWatchBound = true;
      const opts = { once: true, passive: true };
      ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((eventName) => {
        window.addEventListener(eventName, markHomeInteraction, opts);
      });
    }

    function buildHomeRailDeferredMarkup(count = 4) {
      const safeCount = Math.max(3, Math.min(6, Number(count) || 4));
      return `
        <div class="rail-placeholder" aria-hidden="true">
          ${Array.from({ length: safeCount }).map(() => `
            <div class="rail-placeholder-card">
              <span class="rail-placeholder-media"></span>
              <span class="rail-placeholder-line rail-placeholder-line-lg"></span>
              <span class="rail-placeholder-line"></span>
              <span class="rail-placeholder-line rail-placeholder-line-sm"></span>
            </div>
          `).join('')}
        </div>
      `;
    }

    function setHomeRailDeferredPlaceholder(railId) {
      const rail = document.getElementById(String(railId || '').trim());
      if (!rail) return;
      if (rail.getAttribute('data-home-deferred-render') === '1') return;
      rail.setAttribute('data-home-deferred-render', '1');
      rail.innerHTML = buildHomeRailDeferredMarkup(isHomeCompactViewport() ? 3 : 4);
    }

    function getHomeChannelKeyByRailId(railId) {
      const target = String(railId || '').trim();
      if (!target) return '';
      const channels = getHomeChannels();
      for (const channel of channels) {
        if (String(channel?.railId || '').trim() === target) return String(channel?.key || '').trim();
      }
      return '';
    }

    function renderHomeFallbackForRail(railId, opts = {}) {
      const key = String(railId || '').trim();
      if (!key) return false;
      const channelKey = getHomeChannelKeyByRailId(key);
      if (!channelKey) return false;
      const fallback = getHomeRailFallbackItems(channelKey);
      const renderOpts = opts && typeof opts === 'object' ? opts : {};
      if (!Array.isArray(fallback) || !fallback.length) return false;
      homePendingRailRenderState.delete(key);
      clearHomeRailDeferredPlaceholder(key);
      renderRail(key, fallback, renderOpts);
      return true;
    }

    function clearHomeRailDeferredPlaceholder(railId) {
      const rail = document.getElementById(String(railId || '').trim());
      if (!rail) return;
      rail.removeAttribute('data-home-deferred-render');
    }

    function flushPendingHomeRailRender(railId) {
      const pending = homePendingRailRenderState.get(railId);
      if (!pending) return false;
      homePendingRailRenderState.delete(railId);
      clearHomeRailDeferredPlaceholder(railId);
      renderRail(railId, pending.items, pending.opts);
      return true;
    }

    async function startHomeDeferredChannelLoad(railId) {
      const key = String(railId || '').trim();
      if (!key) return;
      const state = homeDeferredChannelState.get(key);
      if (!state) return;
      if (state.status === 'loading' || state.status === 'loaded') return state.promise || Promise.resolve();
      if (state.initSeq !== homeFeedInitSeq) {
        homeDeferredChannelState.delete(key);
        return;
      }
      state.status = 'loading';
      state.promise = Promise.resolve()
        .then(() => state.loadChannel(state.channel))
        .catch(() => [])
        .finally(() => {
          const latest = homeDeferredChannelState.get(key);
          if (latest === state) {
            latest.status = 'loaded';
          }
        });
      return state.promise;
    }

    function handleHomeRailViewportEntry(railId) {
      const key = String(railId || '').trim();
      if (!key) return;
      flushPendingHomeRailRender(key);
      void startHomeDeferredChannelLoad(key);
      if (key === 'newReleasesRail' && homePendingNewReleasesRefresh) {
        homePendingNewReleasesRefresh = false;
        homeNewReleasesRefreshScheduled = false;
        scheduleHomeNewReleasesRefresh(homeFeedState);
      }
      if (key === 'unifiedRail' && homePendingMixedRefresh) {
        homePendingMixedRefresh = false;
        homeMixedRefreshScheduled = false;
        const args = homePendingMixedRefreshArgs || {};
        homePendingMixedRefreshArgs = null;
        scheduleHomeMixedRefresh(args.feedMap || homeFeedState, args.scoredPool);
      }
    }

    function getHomeRailViewportObserver() {
      if (homeRailViewportObserver || typeof window.IntersectionObserver !== 'function') return homeRailViewportObserver;
      homeRailViewportObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const railId = String(entry.target?.getAttribute('data-home-rail-id') || '').trim();
          observer.unobserve(entry.target);
          handleHomeRailViewportEntry(railId);
        });
      }, {
        rootMargin: getHomeRailViewportRootMargin(),
        threshold: 0.01
      });
      return homeRailViewportObserver;
    }

    function observeHomeRailViewport(railId) {
      const key = String(railId || '').trim();
      if (!key) return;
      const wrap = getHomeRailWrap(key);
      if (!wrap) {
        handleHomeRailViewportEntry(key);
        return;
      }
      wrap.setAttribute('data-home-rail-id', key);
      const observer = getHomeRailViewportObserver();
      if (!observer) {
        handleHomeRailViewportEntry(key);
        return;
      }
      observer.observe(wrap);
    }

    function renderOrDeferHomeRail(railId, items, opts) {
      const key = String(railId || '').trim();
      if (!key) return;
      const normalizedItems = Array.isArray(items) ? items : [];
      const renderOpts = opts || {};
      if (!normalizedItems.length && renderOpts.allowEmptyState !== true) {
        setHomeRailDeferredPlaceholder(key);
        return;
      }
      homePendingRailRenderState.delete(key);
      clearHomeRailDeferredPlaceholder(key);
      renderRail(key, normalizedItems, renderOpts);
    }

    function resetHomeViewportDeferrals() {
      homePendingRailRenderState.clear();
      homeDeferredChannelState.clear();
      homePendingNewReleasesRefresh = false;
      homeNewReleasesRefreshScheduled = false;
      if (homeRailViewportObserver) {
        homeRailViewportObserver.disconnect();
        homeRailViewportObserver = null;
      }
    }

    function queueHomeDeferredChannel(channel, loadChannel, initSeq) {
      if (!channel || !channel.railId || typeof loadChannel !== 'function') return;
      const key = String(channel.railId).trim();
      homeDeferredChannelState.set(key, {
        channel,
        loadChannel,
        initSeq,
        status: 'idle',
        promise: null
      });
      void startHomeDeferredChannelLoad(key);
    }

    function scheduleHomeMixedRefresh(feedMap, scoredPool) {
      homePendingMixedRefresh = false;
      homePendingMixedRefreshArgs = null;
      if (homeMixedRefreshScheduled) return;
      homeMixedRefreshScheduled = true;
      const run = () => {
        homeMixedRefreshScheduled = false;
        void refreshMixedForYouFromActivity(feedMap, scoredPool);
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => run(), { timeout: isHomeCompactViewport() ? 1800 : 1200 });
      } else {
        window.setTimeout(run, isHomeCompactViewport() ? 1100 : 700);
      }
    }

    async function loadHomeChannelGroup(channels, loadChannel) {
      const queue = Array.isArray(channels) ? channels.slice() : [];
      if (!queue.length || typeof loadChannel !== 'function') return [];
      const concurrency = Math.max(1, Math.min(getHomeInitialChannelConcurrency(), queue.length));
      const results = [];
      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
          const channel = queue.shift();
          if (!channel) return;
          results.push(await loadChannel(channel));
        }
      });
      await Promise.all(workers);
      return results;
    }

    function scheduleHomeNewReleasesRefresh(feedMap = homeFeedState, options = {}) {
      const railOptions = { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true };
      if (homeNewReleasesState.length) {
        renderOrDeferHomeRail('newReleasesRail', filterHomeSafeItems(homeNewReleasesState), railOptions);
      } else {
        setHomeRailDeferredPlaceholder('newReleasesRail');
      }
      homePendingNewReleasesRefresh = false;
      if (homeNewReleasesRefreshScheduled) return;
      homeNewReleasesRefreshScheduled = true;
      const run = () => {
        homeNewReleasesRefreshScheduled = false;
        void refreshHomeNewReleases(feedMap, options);
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => run(), { timeout: isHomeCompactViewport() ? 1800 : 1200 });
      } else {
        window.setTimeout(run, isHomeCompactViewport() ? 900 : 500);
      }
    }

    function normalizeHomeFeedMap(feedMap) {
      if (!feedMap || typeof feedMap !== 'object') return null;
      const channels = getHomeChannels();
      const normalized = {};
      channels.forEach((channel) => {
        const channelItems = Array.isArray(feedMap[channel.key])
          ? feedMap[channel.key].filter((item) => item && typeof item === 'object')
          : [];
        const safeItems = channel.key === 'travel'
          ? channelItems.map((item) => sanitizeHomeTravelItem(item)).filter(Boolean)
          : channelItems;
        normalized[channel.key] = filterHomeSafeItems(safeItems);
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
        const scrubbed = { ...normalized };
        // Same rule as home feed cache: never persist placeholder-only rails.
        getHomeChannels().forEach((channel) => {
          const items = Array.isArray(scrubbed?.[channel.key]) ? scrubbed[channel.key] : [];
          scrubbed[channel.key] = stripHomePlaceholderItems(items);
        });
        const savedAt = Number(options.savedAt || Date.now());
        const expiresAt = Number(options.expiresAt || (savedAt + HOME_PRECOMPUTED_FEED_MAX_AGE_MS));
        localStorage.setItem(HOME_PRECOMPUTED_FEED_CACHE_KEY, JSON.stringify({
          savedAt,
          expiresAt,
          feed: scrubbed
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

    async function fetchPrecomputedHomeFeedFromApi() {
      const payload = await fetchJsonWithPerfCache(HOME_PUBLIC_FEED_ENDPOINT, {
        cacheKey: 'home-public-feed',
        ttlMs: 1000 * 60,
        timeoutMs: 2400,
        retries: 2
      });
      const feed = normalizeHomeFeedMap(payload?.feed);
      if (!feed || countActiveHomeChannels(feed) === 0) return null;

      const generatedAtMs = payload?.generatedAt ? new Date(payload.generatedAt).getTime() : Date.now();
      const expiresAtMs = payload?.expiresAt ? new Date(payload.expiresAt).getTime() : (generatedAtMs + HOME_PRECOMPUTED_FEED_MAX_AGE_MS);
      writePrecomputedHomeFeedCache(feed, {
        savedAt: generatedAtMs,
        expiresAt: expiresAtMs
      });
      return feed;
    }

    async function loadPrecomputedHomeFeed() {
      const cached = readPrecomputedHomeFeedCache();
      if (cached && countActiveHomeChannels(cached) > 0) return cached;
      const apiFeed = await fetchPrecomputedHomeFeedFromApi();
      if (apiFeed && countActiveHomeChannels(apiFeed) > 0) return apiFeed;
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

    function stripHomePlaceholderItems(items) {
      const list = Array.isArray(items) ? items : [];
      if (!list.length) return [];
      return list.filter((item) => !item?.isPlaceholder);
    }

    function writeHomeFeedCache(feedMap) {
      try {
        const normalizedFeed = normalizeHomeFeedMap(feedMap);
        if (!normalizedFeed) return;
        const channels = getHomeChannels();
        const payload = {};
        channels.forEach((channel) => {
          const items = Array.isArray(normalizedFeed?.[channel.key]) ? normalizedFeed[channel.key] : [];
          // Never persist placeholder-only rails; they cause “stuck skeletons” after refresh when live loaders time out.
          payload[channel.key] = stripHomePlaceholderItems(items);
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
      const startedAt = homeDebugNow();
      const loaderName = String(loader?.name || '').trim() || 'anonymous';
      try {
        homeDebugEvent('channel:start', { loader: loaderName, timeoutMs: Number(timeoutMs || 0) });
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
        const endedAt = homeDebugNow();
        const tookMs = endedAt - startedAt;
        const items = Array.isArray(value) ? value : [];
        homeDebugEvent('channel:done', { loader: loaderName, ms: Math.round(tookMs), items: items.length });
        return items;
      } catch (_err) {
        const endedAt = homeDebugNow();
        const tookMs = endedAt - startedAt;
        homeDebugEvent('channel:error', { loader: loaderName, ms: Math.round(tookMs), message: String(_err?.message || _err || '') });
        return [];
      } finally {
        if (controller) controller.abort();
        if (timer) clearTimeout(timer);
      }
    }

    function applyHomeFeedMap(feedMap, options = {}) {
      const normalizedFeed = normalizeHomeFeedMap(feedMap) || Object.fromEntries(
        getHomeChannels().map((channel) => [channel.key, []])
      );
      const channels = getHomeChannels();
      const showEmptyRails = options.showEmptyRails === true;
      resetHomeImageRequestBudget();
      warmHomeFeedImages(normalizedFeed);
      let activeChannels = 0;
      channels.forEach((channel) => {
        const items = Array.isArray(normalizedFeed?.[channel.key]) ? normalizedFeed[channel.key] : [];
        homeFeedState[channel.key] = items;
        if (items.length) {
          renderOrDeferHomeRail(channel.railId, items, channel.opts);
        } else if (showEmptyRails) {
          renderOrDeferHomeRail(channel.railId, [], { ...(channel.opts || {}), allowEmptyState: true });
        } else {
          setHomeRailDeferredPlaceholder(channel.railId);
        }
        if (items.length) activeChannels += 1;
      });

      const scoredPool = buildScoredDiscoveryPool(homeFeedState);
      const unified = buildUnifiedFeed(scoredPool, getHomeUnifiedTargetItems());
      if (unified.length) {
        renderOrDeferHomeRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
      } else if (showEmptyRails) {
        renderOrDeferHomeRail('unifiedRail', [], { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true, allowEmptyState: true });
      } else {
        setHomeRailDeferredPlaceholder('unifiedRail');
      }

      if (options.refreshSecondary !== false) {
        scheduleHomeNewReleasesRefresh(homeFeedState);
        scheduleHomeMixedRefresh(homeFeedState, scoredPool);
      }
      hydrateSpotlightFromPool(scoredPool);

      return { activeChannels, scoredPool, channelsCount: channels.length };
    }

    async function refreshHomePersonalization(options = {}) {
      const hasItems = Object.values(homeFeedState).some((items) => Array.isArray(items) && items.length);
      if (!hasItems) return;
      const now = Date.now();
      const force = !!options.force;
      if (!force && homeLastPersonalizationAt && (now - homeLastPersonalizationAt) < HOME_PERSONALIZATION_THROTTLE_MS) {
        return;
      }
      homeLastPersonalizationAt = now;
      homeTasteWeights = await loadTasteWeights();
      const scoredPool = buildScoredDiscoveryPool(homeFeedState);
      const unified = buildUnifiedFeed(scoredPool, getHomeUnifiedTargetItems());
      renderOrDeferHomeRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
      scheduleHomeMixedRefresh(homeFeedState, scoredPool);
      hydrateSpotlightFromPool(scoredPool);
      scheduleHomeMenuCachePrime();
    }

    function scheduleDeferredHomeStartupTasks() {
      const run = () => {
        void maybeShowHomeOnboarding();
        void refreshHomePersonalization();
        scheduleHomeMenuCachePrime();
      };
      const scheduleRun = () => {
        if (isHomeSlowNetwork()) {
          scheduleHomeNonCritical(() => setTimeout(run, 1800), 2600);
          return;
        }
        scheduleHomeNonCritical(run, 1400);
      };
      if (homeUserInteracted) {
        scheduleRun();
        return;
      }
      ensureHomeInteractionWatch();
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        window.removeEventListener('pointerdown', release);
        window.removeEventListener('keydown', release);
        window.removeEventListener('scroll', release, true);
        scheduleRun();
      };
      window.addEventListener('pointerdown', release, { once: true, passive: true });
      window.addEventListener('keydown', release, { once: true });
      window.addEventListener('scroll', release, { once: true, passive: true, capture: true });
      window.setTimeout(release, isHomeSlowNetwork() ? 5200 : 3200);
    }

    function renderRail(railId, items, opts) {
      const rail = document.getElementById(railId);
      if (!rail) return;
      rail.classList.remove('games-rail');

      if (!items || !items.length) {
        if (railId === 'booksRail') {
          const debug = window.__zo2yHomeBooksDebug || null;
          if (debug) {
            console.error('[home books] books rail rendered empty', debug);
            const stage = escapeHtml(String(debug?.stage || 'unknown'));
            rail.innerHTML = `<div class="empty">Books failed to load. Check console. Stage: ${stage}</div>`;
            return;
          }
        }
        rail.innerHTML = '<div class="empty">No items right now.</div>';
        return;
      }

      const rendered = items.map((item) => {
        const mediaTypeRaw = String(item.mediaType || opts?.mediaType || '').toLowerCase();
        const itemData = mediaTypeRaw === 'travel'
          ? sanitizeHomeTravelItem(item)
          : item;
        if (!itemData) return '';
        const media = getHomeMediaMeta(mediaTypeRaw);
        const uniformMedia = !!opts?.uniformMedia;
        const landscape = !uniformMedia && (!!opts?.landscape || mediaTypeRaw === 'restaurant');
        const restaurantComposite = !!opts?.restaurantComposite && mediaTypeRaw === 'restaurant';
        const rawTitle = String(itemData.title || 'Untitled');
        const cleanedTitle = mediaTypeRaw === 'travel'
          ? rawTitle.replace(/^\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF]\s*/u, '')
          : rawTitle;
        const title = escapeHtml(cleanedTitle);
        const subtitle = escapeHtml(itemData.subtitle || media.label);
        const extra = escapeHtml(itemData.extra || '');
        const image = escapeHtml(itemData.image || '');
        const flagImage = escapeHtml(itemData.flagImage || '');
        const listImage = escapeHtml(itemData.listImage || itemData.image || '');
        const logo = escapeHtml(itemData.logo || '');
        const fallbackImage = escapeHtml(itemData.fallbackImage || HOME_LOCAL_FALLBACK_IMAGE);
        const safeImage = image || listImage || fallbackImage;
        const coverImage = image || listImage || logo;
        const hrefRaw = itemData.href || '#';
        const href = escapeHtml(hrefRaw);
        const mediaType = escapeHtml(mediaTypeRaw);
        const itemId = escapeHtml(itemData.itemId || '');
        const supportsLists = supportsHomeLists(mediaTypeRaw) && !itemData.isPlaceholder && itemData.disableLists !== true;
        const opensExternal = /^https?:\/\//i.test(String(hrefRaw || ''));
        const previewUrlRaw = (mediaTypeRaw === 'music' && !itemData?.isMusicAlbum)
          ? String(itemData?.previewUrl || '').trim()
          : '';
        const previewControl = previewUrlRaw
          ? `<button class="card-preview-btn" data-preview="${escapeHtml(previewUrlRaw)}" aria-label="Play preview"><i class="fas fa-play"></i></button>`
          : '';
        const hasVisualImage = restaurantComposite ? !!coverImage || !!logo : !!safeImage;
        const imagePolicy = hasVisualImage
          ? consumeHomeImageRequestBudget()
          : { loading: 'lazy', priority: 'low' };
        const imageLoading = imagePolicy.loading;
        const imagePriority = imagePolicy.priority;

        const mediaClasses = ['card-media'];
        const mediaFit = String(itemData.mediaFit || '').trim().toLowerCase();
        if (mediaFit === 'cover') mediaClasses.push('cover');
        if (landscape) mediaClasses.push('landscape');
        if (mediaTypeRaw === 'game') mediaClasses.push('game-poster');
        if (mediaTypeRaw === 'music') mediaClasses.push('music-cover');
        if (mediaTypeRaw === 'travel') mediaClasses.push('travel-photo');
        if (mediaTypeRaw === 'fashion' || mediaTypeRaw === 'food' || mediaTypeRaw === 'car' || mediaTypeRaw === 'sports') mediaClasses.push('brand-cover');
        if (restaurantComposite) mediaClasses.push('restaurant-composite');
        if (hasVisualImage) mediaClasses.push('is-loading-media');
        if (restaurantComposite && !coverImage && !logo) return '';
        if (!restaurantComposite && !safeImage) return '';
        const optimizedTravelImage = mediaTypeRaw === 'travel'
          ? getOptimizedHomeTravelImage(safeImage, landscape ? 960 : 720)
          : '';
        let mediaHtml = restaurantComposite
          ? `
              ${coverImage ? `<img class="restaurant-cover" ${buildHomeImageAttrs(coverImage, imageLoading, imagePriority, fallbackImage)} alt="${title}">` : '<i class="fa-solid fa-image"></i>'}
              ${logo ? `<span class="restaurant-logo-badge"><img ${buildHomeImageAttrs(logo, 'lazy', 'low', fallbackImage)} alt="${title} logo"></span>` : ''}
            `
          : `${safeImage ? `<img ${buildHomeImageAttrs(mediaTypeRaw === 'travel' ? optimizedTravelImage : safeImage, imageLoading, imagePriority, fallbackImage)} alt="${title}">` : '<i class="fa-solid fa-image"></i>'}`;

        if (mediaTypeRaw === 'travel') {
          const initialTravelVariant = getStableHomeTravelVariant(itemData, landscape);
          if (initialTravelVariant?.src) {
            mediaHtml = `
              <div class="travel-photo-stage is-loading-media">
                <img ${buildHomeImageAttrs(initialTravelVariant.src, imageLoading, imagePriority, fallbackImage)} alt="${title}">
                <div class="travel-photo-badges" aria-hidden="true">
                  <span class="travel-photo-label" data-kind="${escapeHtml(initialTravelVariant.kind || 'scenic')}">${escapeHtml(initialTravelVariant.label || 'Scenic')}</span>
                </div>
              </div>
            `;
          }
        }
        const extraMarkup = extra ? `<p class="card-extra">${extra}</p>` : '<p class="card-extra placeholder">&nbsp;</p>';
        const titleMarkup = (mediaTypeRaw === 'travel' && flagImage)
          ? `
            <span class="country-title-wrap">
              <img class="country-inline-flag" ${buildHomeImageAttrs(flagImage, 'lazy', 'low', '', { ariaHidden: true, altEmpty: true })}>
              <span class="country-title-text">${title}</span>
            </span>
          `
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
      }).filter(Boolean);

      const html = rendered.join('');
      rail.innerHTML = html || '<div class="empty">No items right now.</div>';
      if (!html) return;

      wireHomeCardMenus(rail);
      wireHomeRailImageFallbacks(rail);
      primeHomeDeferredImages(rail);
    }

    const BRAND_RAIL_MEDIA_TYPES = new Set(['fashion', 'food', 'car', 'sports']);
    const LOGO_PLACEHOLDER_TOKENS = ['logo-placeholder.svg', 'newlogo.webp'];

    function isLogoPlaceholder(url) {
      const src = String(url || '').toLowerCase();
      return LOGO_PLACEHOLDER_TOKENS.some((token) => src.includes(token));
    }

    function markLogoMissing(card, img) {
      if (!card || card.dataset.logoMissing === '1') return;
      card.dataset.logoMissing = '1';
      if (img) {
        img.style.visibility = 'hidden';
        img.style.opacity = '0';
      }
      const rail = card.parentElement;
      if (rail) rail.appendChild(card);
    }

    function wireHomeRailImageFallbacks(scope) {
      scope.querySelectorAll('img[data-fallback-image]').forEach((img) => {
        const card = img.closest('.card');
        const mediaType = String(card?.getAttribute('data-media-type') || '').toLowerCase();
        const isBrandRail = BRAND_RAIL_MEDIA_TYPES.has(mediaType);

        const handleMissing = () => {
          if (isBrandRail) {
            markLogoMissing(card, img);
            return;
          }
          const directSrc = unwrapCloudflareImageUrl(img.currentSrc || img.src || '');
          const currentSrc = String(img.currentSrc || img.src || '').trim();
          if (directSrc && directSrc !== currentSrc && img.getAttribute('data-cf-direct-retry') !== '1') {
            img.setAttribute('data-cf-direct-retry', '1');
            img.setAttribute('data-image-ready', '0');
            img.setAttribute('data-home-image-state', 'loading');
            const wrapper = getHomeImageWrapper(img);
            if (wrapper) wrapper.classList.add('is-loading-media');
            img.src = directSrc;
            return;
          }
          const fallback = String(img.getAttribute('data-fallback-image') || '').trim();
          const applied = String(img.getAttribute('data-fallback-applied') || '');
          if (fallback && applied !== '1') {
            img.setAttribute('data-fallback-applied', '1');
            img.setAttribute('data-image-ready', '0');
            img.setAttribute('data-home-image-state', 'loading');
            const wrapper = getHomeImageWrapper(img);
            if (wrapper) wrapper.classList.add('is-loading-media');
            img.src = fallback;
            return;
          }
          img.setAttribute('data-image-ready', '1');
          img.setAttribute('data-home-image-state', 'ready');
          img.src = HOME_LOCAL_FALLBACK_IMAGE;
          const wrapper = getHomeImageWrapper(img);
          if (wrapper) wrapper.classList.remove('is-loading-media');
        };

        const handleLoaded = () => {
          if (img.hasAttribute('data-home-src')) return;
          markHomeImageReady(img);
          if (isBrandRail && isLogoPlaceholder(img.currentSrc || img.src)) {
            handleMissing();
          }
        };

        img.addEventListener('load', handleLoaded);
        img.addEventListener('error', handleMissing);

        if (img.complete && !img.hasAttribute('data-home-src')) {
          handleLoaded();
        }
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

      client.auth.onAuthStateChange(async (event, session) => {
        const normalizedEvent = String(event || '').trim().toUpperCase();
        const sessionUserId = String(session?.user?.id || '').trim();

        if (normalizedEvent === 'SIGNED_OUT') {
          resetHomeProfileLabelCache();
          homeOnboardingEvaluatedUserId = '';
          homeOnboardingUserId = null;
          homeTasteWeightsCache = { userId: '', savedAt: 0, weights: null };
          homeLastPersonalizationAt = 0;
          if (typeof window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT === 'function') {
            const restoredSession = await window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT(client);
            if (restoredSession?.user) {
              homeCurrentUser = restoredSession.user;
              homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
              queueHomeAuthUiSync({ refreshPersonalization: true });
              return;
            }
          }
          homeCurrentUser = null;
          homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
          queueHomeAuthUiSync({ refreshPersonalization: true });
          return;
        }

        if (sessionUserId) {
          if (String(homeCurrentUser?.id || '').trim() !== sessionUserId) {
            resetHomeProfileLabelCache();
            homeOnboardingEvaluatedUserId = '';
          }
          homeCurrentUser = session.user;
        }

        if (normalizedEvent === 'SIGNED_IN') {
          homeBecauseSignalCache = { userId: '', savedAt: 0, payload: null };
          homeTasteWeightsCache = { userId: '', savedAt: 0, weights: null };
          homeLastPersonalizationAt = 0;
          queueHomeAuthUiSync({ refreshPersonalization: true });
          return;
        }

        if (normalizedEvent === 'USER_UPDATED') {
          resetHomeProfileLabelCache();
          queueHomeAuthUiSync();
        }
      });
    }

    async function getVerifiedHomeUser(client) {
      let refreshAttempted = false;
      let remoteUserAttempted = false;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const { data: sessionData } = await client.auth.getSession();
        const session = sessionData?.session || null;
        const sessionUser = session?.user || null;
        if (sessionUser?.id) {
          return sessionUser;
        }
        if (!session) {
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
          return null;
        }

        if (!remoteUserAttempted && client?.auth && typeof client.auth.getUser === 'function') {
          remoteUserAttempted = true;
          const { data: userData, error: userError } = await client.auth.getUser();
          if (!userError && userData?.user) {
            return userData.user;
          }
        }

        if (!refreshAttempted && client?.auth && typeof client.auth.refreshSession === 'function') {
          refreshAttempted = true;
          const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
          if (!refreshError && refreshed?.session?.user) {
            return refreshed.session.user;
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
    window.getVerifiedHomeUser = getVerifiedHomeUser;

    function getHomeProfileLabelFallback(user) {
      // Never fall back to Gmail/OAuth nicknames or email prefixes.
      // We only show a real chosen username (stored in user_metadata.username),
      // otherwise keep it neutral so onboarding can take over.
      const raw = String(user?.user_metadata?.zo2y_username || '').trim();
      const normalized = normalizeProfileUsername(raw);
      if (
        normalized &&
        isValidProfileUsername(normalized) &&
        !RESERVED_PROFILE_USERNAMES.has(normalized.replace(/_/g, '')) &&
        normalized !== 'user' &&
        !normalized.startsWith('user_')
      ) {
        return `@${normalized}`;
      }
      return '@set username';
    }

    async function getHomeProfileLabel(client, user) {
      const userId = String(user?.id || '').trim();
      const fallbackLabel = getHomeProfileLabelFallback(user);
      if (!userId) {
        return fallbackLabel;
      }

      const now = Date.now();
      const cacheMatchesUser = homeProfileLabelCache.userId === userId;
      if (
        cacheMatchesUser &&
        homeProfileLabelCache.label &&
        (now - homeProfileLabelCache.fetchedAt) < 60000
        ) {
        return homeProfileLabelCache.label;
      }

      homeProfileLabelLookupPromise = null;
      homeProfileLabelCache = {
        userId,
        label: fallbackLabel,
        fetchedAt: Date.now(),
        failedAt: 0
      };
      return fallbackLabel;
    }

    async function initAuthUi() {
      if (homeAuthUiSyncPromise) {
        homeAuthUiSyncQueued = true;
        return homeAuthUiSyncPromise;
      }

      homeAuthUiSyncPromise = (async () => {
        const client = await ensureHomeSupabase();
        if (!client) return;
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const profileBtn = document.getElementById('profileBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileSignupBtn = document.getElementById('mobileSignupBtn');
        const mobileProfileBtn = document.getElementById('mobileProfileBtn');
        const sidebarProfileBtn = document.getElementById('sidebarProfileBtn');
        try {
          const user = await getVerifiedHomeUser(client);
          homeCurrentUser = user;
          const isLoggedIn = !!user;
          if (isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            if (mobileSignupBtn) mobileSignupBtn.style.display = 'none';
            const label = await getHomeProfileLabel(client, user);
            if (profileBtn) {
              profileBtn.innerHTML = `<i class=\"fas fa-user\"></i><span>${label}</span>`;
              profileBtn.title = label;
              profileBtn.style.display = 'inline-flex';
            }
            if (mobileProfileBtn) {
              mobileProfileBtn.innerHTML = `<i class=\"fas fa-user\"></i><span>${label}</span>`;
              mobileProfileBtn.title = label;
              mobileProfileBtn.style.display = 'inline-flex';
            }
            if (sidebarProfileBtn) {
              sidebarProfileBtn.innerHTML = `<i class=\"fas fa-user\"></i><span>${label}</span>`;
              sidebarProfileBtn.title = label;
              sidebarProfileBtn.style.display = 'inline-flex';
            }
          } else {
            resetHomeProfileLabelCache();
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (signupBtn) signupBtn.style.display = 'inline-flex';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-flex';
            if (mobileSignupBtn) mobileSignupBtn.style.display = 'inline-flex';
            if (profileBtn) profileBtn.style.display = 'none';
            if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
            if (sidebarProfileBtn) sidebarProfileBtn.style.display = 'none';
          }
        } catch (_e) {
          homeCurrentUser = null;
          resetHomeProfileLabelCache();
          if (loginBtn) loginBtn.style.display = 'inline-flex';
          if (signupBtn) signupBtn.style.display = 'inline-flex';
          if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-flex';
          if (mobileSignupBtn) mobileSignupBtn.style.display = 'inline-flex';
          if (profileBtn) profileBtn.style.display = 'none';
          if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
          if (sidebarProfileBtn) sidebarProfileBtn.style.display = 'none';
        }
      })();

      try {
        return await homeAuthUiSyncPromise;
      } finally {
        homeAuthUiSyncPromise = null;
        if (homeAuthUiSyncQueued) {
          homeAuthUiSyncQueued = false;
          void initAuthUi();
        }
      }
    }

    function hasStoredLocalFlag(keys) {
      return (Array.isArray(keys) ? keys : []).some((key) => {
        if (!key) return false;
        try {
          return localStorage.getItem(key) === '1';
        } catch (_err) {
          return false;
        }
      });
    }

    function writeStoredLocalFlags(keys) {
      (Array.isArray(keys) ? keys : []).forEach((key) => {
        if (!key) return;
        try {
          localStorage.setItem(key, '1');
        } catch (_err) {}
      });
    }

    function clearStoredLocalFlags(keys) {
      (Array.isArray(keys) ? keys : []).forEach((key) => {
        if (!key) return;
        try {
          localStorage.removeItem(key);
        } catch (_err) {}
      });
    }

    function getOnboardingStorageKeys(userId) {
      const safeUserId = String(userId || '').trim();
      if (!safeUserId) return [];
      return [
        `zo2y_onboarding_seen_once_v1_${safeUserId}`,
        `zo2y_onboarding_seen_${HOME_ONBOARDING_VERSION}_${safeUserId}`,
        `zo2y_onboarding_seen_v1_${safeUserId}`
      ];
    }

    function getOnboardingStorageKey(userId) {
      return getOnboardingStorageKeys(userId)[0] || '';
    }

    function getListHelperDismissKey(userId) {
      return `zo2y_list_helper_seen_v1_${String(userId || '').trim()}`;
    }

    function getListHelperDismissKeys(userId) {
      const key = getListHelperDismissKey(userId);
      return key ? [key] : [];
    }

    function getOnboardingPendingKeys(userId) {
      const safeUserId = String(userId || '').trim();
      if (!safeUserId) return [];
      return [
        `zo2y_onboarding_pending_${HOME_ONBOARDING_VERSION}_${safeUserId}`,
        `zo2y_onboarding_pending_v1_${safeUserId}`
      ];
    }

    function getOnboardingPendingKey(userId) {
      return getOnboardingPendingKeys(userId)[0] || '';
    }

    function hasSeenOnboarding(userId) {
      if (!userId) return true;
      return hasStoredLocalFlag(getOnboardingStorageKeys(userId));
    }

    function isOnboardingPending(userId) {
      if (!userId) return false;
      return hasStoredLocalFlag(getOnboardingPendingKeys(userId));
    }

    function markOnboardingSeen(userId) {
      if (!userId) return;
      writeStoredLocalFlags(getOnboardingStorageKeys(userId));
    }

    function markOnboardingPending(userId) {
      if (!userId) return;
      writeStoredLocalFlags(getOnboardingPendingKeys(userId));
    }

    function clearOnboardingPending(userId) {
      if (!userId) return;
      clearStoredLocalFlags(getOnboardingPendingKeys(userId));
    }

    function hasStartedHomeListFlow(userId) {
      if (!userId) return false;
      return hasStoredLocalFlag(getListHelperDismissKeys(userId));
    }

    function markStartedHomeListFlow(userId) {
      if (!userId) return;
      writeStoredLocalFlags(getListHelperDismissKeys(userId));
    }

    function readPendingHomePostAuthBootstrap() {
      try {
        const raw = localStorage.getItem(HOME_POST_AUTH_BOOTSTRAP_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (_err) {
        return null;
      }
    }

    function clearPendingHomePostAuthBootstrap() {
      try {
        localStorage.removeItem(HOME_POST_AUTH_BOOTSTRAP_KEY);
      } catch (_err) {}
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

    function getHomeOnboardingInterestImage(option, index = 0) {
      const pool = getHomeOnboardingPreviewItems(10);
      const fallback = HOME_INTEREST_CARD_META[option?.id]?.fallback || '/images/onboarding/onboard-media.svg';
      if (!pool.length) return fallback;
      if (option?.kind === 'type') {
        const match = pool.find((item) => String(item?.mediaType || '').toLowerCase() === String(option.id || '').toLowerCase());
        return match?.image || fallback;
      }
      return pool[index % pool.length]?.image || fallback;
    }

    function buildHomeInterestOptionsMarkup(kind = '') {
      let filtered = HOME_INTEREST_OPTIONS.filter((option) => !kind || option.kind === kind);
      if (kind === 'tag') {
        filtered = filtered.filter((option) => HOME_ONBOARDING_TAG_IDS.includes(option.id));
      }
      return filtered.map((option, index) => `
        <button type="button" class="onboarding-chip onboarding-interest-card ${escapeHtml(option.kind)}" data-interest-id="${escapeHtml(option.id)}" data-interest-kind="${escapeHtml(option.kind)}">
          <span class="onboarding-interest-thumb">
            <img src="${escapeHtml(getHomeOnboardingInterestImage(option, index))}" alt="${escapeHtml(option.label)}" loading="lazy">
          </span>
          <span class="onboarding-interest-scrim"></span>
          <span class="onboarding-interest-copy">
            <span class="onboarding-interest-icon"><i class="${escapeHtml(HOME_INTEREST_CARD_META[option.id]?.icon || 'fas fa-star')}"></i></span>
            <span class="onboarding-interest-text">
              <strong>${escapeHtml(option.label)}</strong>
              <small>${escapeHtml(HOME_INTEREST_CARD_META[option.id]?.hint || 'Pick what fits your taste')}</small>
            </span>
          </span>
        </button>
      `).join('');
    }

    const RESERVED_PROFILE_USERNAMES = new Set([
      'admin', 'api', 'app', 'auth', 'authcallback', 'blog', 'book', 'books',
      'country', 'edit', 'explore', 'game', 'games', 'help', 'home', 'index',
      'login', 'movie', 'movies', 'music', 'new', 'privacy', 'profile',
      'resetpassword', 'reviews', 'search', 'settings', 'signup', 'support',
      'terms', 'travel', 'tv', 'tvshow', 'tvshows', 'updatepassword', 'user',
      'users', 'zo2y'
    ]);

    function normalizeProfileUsername(value) {
      const normalized = String(value || '')
        .trim()
        .replace(/^@+/, '')
        .toLowerCase()
        .replace(/[\u0027\u2019]/g, '')
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);
      return normalized;
    }

    function isValidProfileUsername(value) {
      return /^[a-z0-9_]{3,30}$/.test(String(value || ''));
    }

    async function ensureHomeUsernameAvailable(username, currentProfileId = '') {
      const normalizedUsername = normalizeProfileUsername(username);
      if (!isValidProfileUsername(normalizedUsername)) {
        throw new Error('Username must be 3-30 characters and use only letters, numbers, or underscores.');
      }
      if (RESERVED_PROFILE_USERNAMES.has(normalizedUsername.replace(/_/g, ''))) {
        throw new Error('That username is reserved. Choose another one.');
      }
      const client = await ensureHomeSupabase();
      if (!client) throw new Error('Unable to verify username right now.');
      const { data, error } = await client
        .from('user_profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .limit(10);
      if (error) throw error;
      const isTaken = Array.isArray(data) && data.some((row) => String(row?.id || '') !== String(currentProfileId || homeCurrentUser?.id || ''));
      if (isTaken) throw new Error('That username is already taken.');
      return normalizedUsername;
    }

    async function ensureHomeProfileSeeded() {
      if (!homeCurrentUser?.id) return { ok: false, created: false };
      const client = await ensureHomeSupabase();
      if (!client) return { ok: false, created: false };

      const { data: existingProfile, error: lookupError } = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .eq('id', homeCurrentUser.id)
        .maybeSingle();
      if (existingProfile?.id) {
        return { ok: true, created: false, profile: existingProfile };
      }
      if (lookupError) {
        throw lookupError;
      }

      const suffixSeed = String(homeCurrentUser.id || '').replace(/-/g, '').slice(0, 6) || 'user';
      const username = `user_${suffixSeed}`.slice(0, PROFILE_USERNAME_MAX_LENGTH);

      const { data: createdProfile, error: createError } = await client
        .from('user_profiles')
        .insert({
          id: homeCurrentUser.id,
          username,
          full_name: null
        })
        .select('id, username, full_name')
        .maybeSingle();
      if (createError) {
        const message = String(createError?.message || '').toLowerCase();
        if (message.includes('duplicate') || message.includes('unique')) {
          return { ok: true, created: false, profile: null };
        }
        throw createError;
      }
      return { ok: true, created: true, profile: createdProfile || null };
    }

    async function triggerHomeWelcomeEmail(session, flow = 'signup') {
      const accessToken = String(session?.access_token || '').trim();
      if (!accessToken) return false;
      try {
        const response = await fetch('/api/emails/welcome/trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            appUrl: window.location.origin,
            flow
          })
        });
        return response.ok;
      } catch (_err) {
        return false;
      }
    }

    async function finishPendingPostAuthBootstrap() {
      if (!homeCurrentUser?.id) return false;
      const pending = readPendingHomePostAuthBootstrap();
      if (!pending) return false;

      const pendingUserId = String(pending?.userId || '').trim();
      if (pendingUserId && pendingUserId !== String(homeCurrentUser.id)) {
        clearPendingHomePostAuthBootstrap();
        return false;
      }

      const createdAt = Number(pending?.createdAt || 0);
      if (createdAt && (Date.now() - createdAt) > (1000 * 60 * 60 * 24 * 3)) {
        clearPendingHomePostAuthBootstrap();
        return false;
      }

      try {
        const seededProfile = await ensureHomeProfileSeeded();
        const pendingFlow = String(pending?.flow || '').trim().toLowerCase();
        const seededUsername = String(seededProfile?.profile?.username || '').trim().toLowerCase();
        const seededNeedsUsername = !seededUsername || seededUsername === 'user' || seededUsername.startsWith('user_');
        const shouldShowOnboarding =
          pendingFlow === 'signup' ||
          !!seededProfile?.created ||
          !!(seededProfile?.profile && seededNeedsUsername);

        if (shouldShowOnboarding) {
          markOnboardingPending(homeCurrentUser.id);
        } else {
          clearOnboardingPending(homeCurrentUser.id);
        }
        clearPendingHomePostAuthBootstrap();
        if (pendingFlow === 'signup') {
          const client = await ensureHomeSupabase();
          const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } };
          void triggerHomeWelcomeEmail(sessionData?.session || null, 'signup');
        }
        return shouldShowOnboarding;
      } catch (error) {
        console.warn('Pending auth bootstrap failed:', error);
        return false;
      }
    }

    async function loadHomeInterestProfile(client) {
      if (!homeCurrentUser?.id || !client) return { types: [], tags: [] };
      try {
        const { data } = await client
          .from('user_interest_profiles')
          .select('interest_types, interest_tags')
          .eq('user_id', homeCurrentUser.id)
          .maybeSingle();
        const types = Array.isArray(data?.interest_types) ? data.interest_types.map((t) => String(t || '').trim()).filter(Boolean) : [];
        const tags = Array.isArray(data?.interest_tags) ? data.interest_tags.map((t) => String(t || '').trim()).filter(Boolean) : [];
        return { types, tags };
      } catch (_err) {
        return { types: [], tags: [] };
      }
    }

    function getHomeInterestText(item) {
      if (!item || typeof item !== 'object') return '';
      const fields = [
        item.title,
        item.subtitle,
        item.extra,
        item.overview,
        item.description,
        item.genreText,
        item.tags,
        item.category,
        item.maturityRating,
        item.sport,
        item.league,
        item.country
      ];
      if (Array.isArray(item.genres)) fields.push(item.genres.join(' '));
      return fields.map((value) => String(value || '').toLowerCase()).join(' ');
    }

    function getHomeInterestBoost(item) {
      if (!homeInterestProfile?.tags?.length) return 0;
      const text = getHomeInterestText(item);
      if (!text) return 0;
      let matches = 0;
      homeInterestProfile.tags.forEach((tag) => {
        if (text.includes(String(tag || '').toLowerCase())) {
          matches += 1;
        }
      });
      return Math.min(0.6, matches * 0.12);
    }

    function getHomeInterestGenreIds(mediaType) {
      const tags = homeInterestProfile?.tags || [];
      if (!tags.length) return [];
      const type = String(mediaType || '').toLowerCase();
      const mapMovie = {
        action: 28,
        adventure: 12,
        animation: 16,
        comedy: 35,
        crime: 80,
        documentary: 99,
        drama: 18,
        family: 10751,
        fantasy: 14,
        history: 36,
        horror: 27,
        music: 10402,
        musical: 10402,
        mystery: 9648,
        romance: 10749,
        'rom-com': 10749,
        romcom: 10749,
        'sci-fi': 878,
        scifi: 878,
        'science fiction': 878,
        thriller: 53,
        war: 10752,
        western: 37,
        'true crime': 80
      };
      const mapTv = {
        action: 10759,
        adventure: 10759,
        animation: 16,
        comedy: 35,
        crime: 80,
        documentary: 99,
        drama: 18,
        family: 10751,
        fantasy: 10765,
        history: 10768,
        horror: 9648,
        mystery: 9648,
        romance: 18,
        'rom-com': 35,
        romcom: 35,
        'sci-fi': 10765,
        scifi: 10765,
        'science fiction': 10765,
        thriller: 9648,
        war: 10768,
        western: 37,
        musical: 18,
        music: 18,
        reality: 10764,
        'true crime': 80
      };
      const map = type === 'tv' ? mapTv : mapMovie;
      const ids = tags
        .map((tag) => map[String(tag || '').toLowerCase()] || null)
        .filter(Boolean);
      return Array.from(new Set(ids));
    }

    function buildHomeTmdbInterestSources(mediaType) {
      const type = String(mediaType || '').toLowerCase() === 'tv' ? 'tv' : 'movie';
      const ids = getHomeInterestGenreIds(type);
      if (!ids.length) return [];
      const genreParam = ids.slice(0, 3).join(',');
      return [
        () => `${TMDB_PROXY_BASE}/discover/${type}?language=en-US&sort_by=popularity.desc&page=${randomInt(1, 4)}&with_genres=${genreParam}`,
        () => `${TMDB_PROXY_BASE}/discover/${type}?language=en-US&sort_by=vote_count.desc&page=${randomInt(1, 3)}&with_genres=${genreParam}&vote_count.gte=120`
      ];
    }

    function getHomeRecommendationPoolByType(type) {
      const key = String(type || '').toLowerCase();
      const raw = Array.isArray(homeFeedState?.[key]) ? homeFeedState[key] : [];
      return raw.filter((item) => !item?.isPlaceholder && String(item?.title || '').trim());
    }

    function getHomeOnboardingPreviewItems(limit = 6) {
      const liveItems = Array.from(document.querySelectorAll('.card[data-media-type][data-item-id]'))
        .map((card) => {
          const image = String(card.getAttribute('data-list-image') || card.getAttribute('data-image') || '').trim();
          const title = String(card.getAttribute('data-title') || '').trim();
          const subtitle = String(card.getAttribute('data-subtitle') || '').trim();
          const mediaType = String(card.getAttribute('data-media-type') || '').trim().toLowerCase();
          const itemId = String(card.getAttribute('data-item-id') || '').trim();
          if (!image || !title || !itemId) return null;
          return { image, title, subtitle, mediaType, itemId };
        })
        .filter(Boolean);

      const unique = [];
      const seen = new Set();
      liveItems.forEach((item) => {
        const key = `${item.mediaType}:${String(item.itemId || item.title || '').toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(item);
      });

      const fallback = [
        { title: 'Movies', subtitle: 'Save watchlists and favorites.', image: '/images/onboarding/onboard-media.svg', mediaType: 'movie', itemId: 'onboarding-movie' },
        { title: 'Games', subtitle: 'Build backlogs and finish lists.', image: '/images/onboarding/onboard-interests.svg', mediaType: 'game', itemId: 'onboarding-game' },
        { title: 'TV Shows', subtitle: 'Track what you are watching next.', image: '/images/onboarding/onboard-profile.svg', mediaType: 'tv', itemId: 'onboarding-tv' },
        { title: 'Books', subtitle: 'Keep read piles in one place.', image: '/images/onboarding/onboard-travel.svg', mediaType: 'book', itemId: 'onboarding-book' }
      ];

      return (unique.length ? unique : fallback).slice(0, limit);
    }

    function buildHomeOnboardingShelfMarkup(limit = 6) {
      const items = getHomeOnboardingPreviewItems(limit);
      if (!items.length) return '';
      return `
        <div class="onboarding-shelf">
          ${items.map((item) => `
            <figure class="onboarding-shelf-card">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
              <figcaption>${escapeHtml(item.title)}</figcaption>
            </figure>
          `).join('')}
        </div>
      `;
    }

    function getHomeOnboardingPrimaryCard() {
      return Array.from(document.querySelectorAll('.card[data-media-type][data-item-id]'))
        .find((card) => !!card.querySelector('.card-menu-btn'));
    }

    function getHomeOnboardingPrimaryItem() {
      const card = getHomeOnboardingPrimaryCard();
      if (card) {
        return {
          image: String(card.getAttribute('data-list-image') || card.getAttribute('data-image') || '').trim(),
          title: String(card.getAttribute('data-title') || '').trim(),
          subtitle: String(card.getAttribute('data-subtitle') || '').trim(),
          mediaType: String(card.getAttribute('data-media-type') || '').trim().toLowerCase()
        };
      }
      return getHomeOnboardingPreviewItems(1)[0] || null;
    }

    function buildHomeOnboardingSaveDemoMarkup() {
      const item = getHomeOnboardingPrimaryItem();
      const mediaLabels = {
        movie: 'Movie card',
        tv: 'TV show card',
        anime: 'Anime card',
        game: 'Game card',
        book: 'Book card',
        music: 'Music card',
        sport: 'Sports card',
        travel: 'Travel card',
        fashion: 'Fashion card',
        food: 'Food card',
        car: 'Car card'
      };
      const image = item?.image || '/images/onboarding/onboard-media.svg';
      const title = item?.title || 'Your next save';
      const subtitle = item?.subtitle || 'Use the menu to send this into favorites or a custom list.';
      const label = mediaLabels[item?.mediaType] || 'Card menu';
      return `
        <div class="onboarding-save-demo">
          <div class="onboarding-save-card">
            <div class="onboarding-save-poster">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">
            </div>
            <div class="onboarding-save-meta">
              <span class="photo-label">${escapeHtml(label)}</span>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(subtitle)}</span>
            </div>
            <div class="onboarding-save-kebab" aria-hidden="true"><i class="fas fa-ellipsis-v"></i></div>
          </div>
          <div class="onboarding-save-panel">
            <div class="onboarding-save-step"><span>1</span><div><strong>Open the three-dot menu</strong><small>Every card uses the same save entry point.</small></div></div>
            <div class="onboarding-save-step"><span>2</span><div><strong>Use a quick list first</strong><small>Favorites, watched, played, owned, or want to try are one tap away.</small></div></div>
            <div class="onboarding-save-step"><span>3</span><div><strong>Create your own list</strong><small>Make collections like “2026 favorites” or “Games to finish”.</small></div></div>
          </div>
        </div>
      `;
    }

    function launchHomeOnboardingSaveDemo() {
      const card = getHomeOnboardingPrimaryCard();
      const menuBtn = card ? card.querySelector('.card-menu-btn') : null;
      if (!card || !menuBtn) {
        showHomeToast('Cards are still loading. Try the save menu in a moment.', true);
        return;
      }
      closeHomeOnboarding(true);
      try {
        card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } catch (_err) {}
      window.setTimeout(() => {
        menuBtn.click();
        showHomeToast('Start with a quick save, or tap New to create your first custom list.');
      }, 220);
    }

    function getHomeOnboardingSteps() {
      return [
        {
          id: 'welcome',
          title: 'Make Zo2y feel like yours',
          body: 'Save a few favorites and Zo2y starts learning your taste.',
          art: `
            ${buildHomeOnboardingShelfMarkup(5)}
            <div class="onboarding-photo-caption">Start with movies, TV, games, or books. Everything lands in one profile.</div>
          `,
          actionLabel: null,
          action: null
        },
        {
          id: 'username-setup',
          title: 'Claim your profile name',
          body: 'Pick the @username that will sit on your profile.',
          art: `
            <div class="onboarding-split">
              <div class="onboarding-identity-card">
                <div class="onboarding-avatar-preview"><i class="fas fa-user"></i></div>
                <div class="onboarding-photo-meta">
                  <span class="photo-label">Profile preview</span>
                  <strong>@yourname</strong>
                  <span>People will find your lists, reviews, and saves here.</span>
                </div>
              </div>
              <div class="onboarding-form">
                <label class="onboarding-label" for="homeOnboardingUsernameInput">Username</label>
                <div class="onboarding-input-wrap">
                  <span class="onboarding-at">@</span>
                  <input id="homeOnboardingUsernameInput" class="onboarding-input" type="text" autocomplete="off" placeholder="your_name" maxlength="${PROFILE_USERNAME_MAX_LENGTH}" />
                </div>
                <div id="homeOnboardingUsernameStatus" class="onboarding-status">Choose a username to continue.</div>
              </div>
            </div>
          `,
          nextLabel: 'Save Username',
          requiresSave: true
        },
        {
          id: 'save-first',
          title: 'Save your first pick from a card',
          body: 'Use the three-dot menu to save fast, then build your own lists when you want more control.',
          art: buildHomeOnboardingSaveDemoMarkup(),
          actionLabel: 'Try it on a card',
          action: () => launchHomeOnboardingSaveDemo(),
          nextLabel: 'Finish'
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
              width: min(760px, 96vw);
              background:
                radial-gradient(circle at top left, rgba(245,158,11,0.18), transparent 45%),
                radial-gradient(circle at 85% 20%, rgba(59,130,246,0.22), transparent 48%),
                linear-gradient(180deg, rgba(15,30,61,0.98), rgba(8,18,42,0.98));
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 16px;
              box-shadow: 0 28px 72px rgba(0,0,0,0.42);
              padding: 28px;
              color: #fff;
              display: flex;
              flex-direction: column;
              gap: 16px;
              max-height: min(92vh, 860px);
              overflow: auto;
              overscroll-behavior: contain;
            }
          .home-onboarding-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 4px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
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
            margin: 2px 0 0;
            font-size: clamp(28px, 3vw, 36px);
            line-height: 1.08;
            letter-spacing: -0.03em;
          }
          .home-onboarding-body {
            color: rgba(255,255,255,0.88);
            font-size: 14px;
            line-height: 1.55;
            min-height: 0;
            max-width: 54ch;
          }
          .onboarding-kicker {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(245, 158, 11, 0.9);
            margin-bottom: 12px;
          }
          .onboarding-shelf {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
          }
          .onboarding-shelf-card {
            margin: 0;
            display: grid;
            gap: 8px;
          }
          .onboarding-shelf-card img {
            width: 100%;
            aspect-ratio: 0.72;
            object-fit: cover;
            border-radius: 14px;
            display: block;
            background: rgba(10, 22, 50, 0.72);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 16px 32px rgba(0,0,0,0.28);
          }
          .onboarding-shelf-card figcaption {
            font-size: 12px;
            color: rgba(226,236,255,0.74);
            line-height: 1.3;
          }
          .onboarding-bento {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          .onboarding-bento-card {
            display: grid;
            gap: 6px;
            padding: 14px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
          }
          .onboarding-bento-card strong {
            font-size: 15px;
            color: #fff;
          }
          .onboarding-bento-card span {
            font-size: 13px;
            line-height: 1.5;
            color: rgba(226,236,255,0.76);
          }
          .onboarding-photo-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .onboarding-photo-grid.compact {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
            .onboarding-photo-grid img {
              width: 100%;
              height: 110px;
              object-fit: contain;
              background: rgba(10, 22, 50, 0.72);
              border-radius: 12px;
              border: 1px solid rgba(255,255,255,0.18);
              box-shadow: 0 12px 26px rgba(0,0,0,0.35);
            }
          .onboarding-photo-caption {
            margin-top: 10px;
            font-size: 13px;
            color: rgba(226,236,255,0.7);
          }
          .onboarding-identity-card {
            display: grid;
            grid-template-columns: 84px minmax(0, 1fr);
            gap: 14px;
            align-items: center;
            padding: 16px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.04);
          }
          .onboarding-avatar-preview {
            width: 84px;
            height: 84px;
            border-radius: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(145deg, rgba(245, 158, 11, 0.95), rgba(249, 115, 22, 0.9));
            color: #0b1633;
            font-size: 28px;
            box-shadow: 0 18px 30px rgba(245, 158, 11, 0.2);
          }
          .onboarding-split {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 16px;
            align-items: stretch;
          }
          .onboarding-photo-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 14px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .onboarding-photo-frame {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.15);
          }
            .onboarding-photo-frame img {
              width: 100%;
              height: 170px;
              object-fit: contain;
              background: rgba(10, 22, 50, 0.72);
              display: block;
            }
          .onboarding-photo-meta {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 13px;
            color: rgba(226,236,255,0.78);
          }
          .onboarding-photo-meta strong {
            font-size: 18px;
            color: #fff;
          }
          .onboarding-photo-meta .photo-label {
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 10px;
            color: rgba(245,158,11,0.85);
          }
          .onboarding-interest-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
            align-items: start;
          }
          .onboarding-interest-panel {
            background: rgba(10,20,40,0.55);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 18px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .onboarding-interest-panel .onboarding-chip-grid {
            max-height: 260px;
            overflow-y: auto;
            padding-right: 4px;
          }
          .onboarding-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .onboarding-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: rgba(226,236,255,0.65);
          }
          .onboarding-input-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 12px;
            background: rgba(8, 16, 36, 0.7);
            border: 1px solid rgba(255,255,255,0.12);
          }
          .onboarding-at {
            font-weight: 600;
            color: rgba(245, 158, 11, 0.9);
          }
          .onboarding-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #e2ecff;
            font-size: 15px;
            letter-spacing: 0.02em;
          }
          .onboarding-status {
            font-size: 12px;
            color: rgba(226,236,255,0.6);
            min-height: 16px;
          }
          .onboarding-status.ok { color: #34d399; }
          .onboarding-status.bad { color: #fca5a5; }
          .onboarding-chip-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .onboarding-chip {
            border-radius: 16px;
            padding: 0;
            font-size: 12px;
            color: rgba(226,236,255,0.8);
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255,255,255,0.12);
            cursor: pointer;
            overflow: hidden;
            position: relative;
            min-height: 110px;
          }
          .onboarding-chip:hover {
            border-color: rgba(255,255,255,0.3);
          }
          .onboarding-chip.selected {
            border-color: rgba(245, 158, 11, 0.75);
            color: #fff7ed;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.22);
          }
          .onboarding-interest-card {
            display: block;
          }
          .onboarding-interest-thumb,
          .onboarding-interest-thumb img,
          .onboarding-interest-scrim {
            position: absolute;
            inset: 0;
          }
          .onboarding-interest-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .onboarding-interest-scrim {
            background: linear-gradient(180deg, rgba(7,14,32,0.14) 0%, rgba(7,14,32,0.45) 42%, rgba(7,14,32,0.95) 100%);
          }
          .onboarding-interest-copy {
            position: relative;
            z-index: 1;
            min-height: 110px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
          }
          .onboarding-interest-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.14);
            border: 1px solid rgba(255,255,255,0.18);
            color: #fff;
            font-size: 14px;
          }
          .onboarding-interest-text {
            display: grid;
            gap: 3px;
            text-align: left;
          }
          .onboarding-interest-text strong {
            font-size: 15px;
            line-height: 1.1;
            color: #fff;
          }
          .onboarding-interest-text small {
            font-size: 11px;
            line-height: 1.35;
            color: rgba(226,236,255,0.74);
          }
          .onboarding-save-demo {
            display: grid;
            grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
            gap: 16px;
            align-items: stretch;
          }
          .onboarding-save-card {
            display: grid;
            grid-template-columns: 112px minmax(0, 1fr) auto;
            gap: 14px;
            padding: 14px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.04);
            align-items: center;
          }
          .onboarding-save-poster img {
            width: 112px;
            aspect-ratio: 0.72;
            object-fit: cover;
            display: block;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(10, 22, 50, 0.72);
          }
          .onboarding-save-meta {
            display: grid;
            gap: 6px;
            min-width: 0;
          }
          .onboarding-save-meta strong {
            font-size: 18px;
            line-height: 1.15;
            color: #fff;
          }
          .onboarding-save-meta span:last-child {
            color: rgba(226,236,255,0.74);
            font-size: 13px;
            line-height: 1.45;
          }
          .onboarding-save-kebab {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            border: 1px solid rgba(245,158,11,0.4);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: rgba(245,158,11,0.95);
            background: rgba(245,158,11,0.12);
            font-size: 16px;
          }
          .onboarding-save-panel {
            display: grid;
            gap: 10px;
          }
          .onboarding-save-step {
            display: grid;
            grid-template-columns: 32px minmax(0, 1fr);
            gap: 12px;
            align-items: start;
            padding: 12px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
          }
          .onboarding-save-step span {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            color: #0b1633;
            background: linear-gradient(145deg, rgba(245, 158, 11, 0.95), rgba(249, 115, 22, 0.9));
          }
          .onboarding-save-step strong {
            display: block;
            font-size: 14px;
            margin-bottom: 2px;
            color: #fff;
          }
          .onboarding-save-step small {
            display: block;
            font-size: 12px;
            line-height: 1.45;
            color: rgba(226,236,255,0.7);
          }
            .home-onboarding-art {
              margin-top: 4px;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 18px;
              padding: 18px;
              background: linear-gradient(145deg, rgba(14,28,58,0.94), rgba(8,18,42,0.92));
              min-height: 160px;
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
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .mini-photo img {
            width: 100%;
            height: 110px;
            object-fit: contain;
            background: rgba(10, 22, 50, 0.72);
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.15);
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
            margin-top: 4px;
            margin-bottom: 0;
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
            gap: 12px;
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
          @media (max-width: 720px) {
            .home-onboarding-overlay {
              align-items: flex-end;
              padding: 10px;
            }
            .home-onboarding-card {
              width: 100%;
              max-width: 520px;
              padding: 16px;
              border-radius: 20px;
              max-height: 90vh;
              display: grid;
              grid-template-rows: auto auto auto minmax(0, 1fr) auto auto;
              gap: 10px;
              box-shadow: 0 18px 46px rgba(0,0,0,0.4);
              overflow: hidden;
            }
            .home-onboarding-top {
              margin-bottom: 4px;
              font-size: 11px;
            }
            .home-onboarding-title {
              font-size: 18px;
              margin: 0;
            }
            .home-onboarding-body {
              font-size: 12px;
              line-height: 1.45;
              min-height: 0;
              max-width: none;
            }
            .onboarding-shelf {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }
            .onboarding-shelf-card:nth-child(n+4) {
              display: none;
            }
            .onboarding-bento,
            .onboarding-save-demo {
              grid-template-columns: minmax(0, 1fr);
            }
            .onboarding-photo-caption {
              margin-top: 8px;
              font-size: 12px;
              line-height: 1.4;
            }
            .onboarding-identity-card {
              grid-template-columns: 64px minmax(0, 1fr);
              padding: 12px;
            }
            .onboarding-avatar-preview {
              width: 64px;
              height: 64px;
              border-radius: 18px;
              font-size: 22px;
            }
            .onboarding-save-card {
              grid-template-columns: 88px minmax(0, 1fr) auto;
              gap: 10px;
              padding: 12px;
            }
            .onboarding-save-poster img {
              width: 88px;
              border-radius: 12px;
            }
            .onboarding-save-meta strong {
              font-size: 16px;
            }
            .onboarding-save-step {
              padding: 10px 12px;
            }
            .home-onboarding-art {
              padding: 10px;
              min-height: 0;
              overflow-y: auto;
            }
            .home-onboarding-actions {
              position: static;
              padding-top: 0;
              background: none;
              margin-top: 0;
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .home-onboarding-left,
            .home-onboarding-right {
              flex: initial;
              width: 100%;
            }
            .home-onboarding-left {
              justify-content: flex-start;
            }
            .home-onboarding-right {
              justify-content: stretch;
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .onboarding-photo-grid,
            .onboarding-photo-card,
            .onboarding-interest-photos,
            .onboarding-illustration {
              display: none !important;
            }
            .onboarding-photo-caption {
              display: none;
            }
            .onboarding-split,
            .onboarding-interest-layout {
              grid-template-columns: minmax(0, 1fr);
              gap: 12px;
            }
            .onboarding-interest-panel,
            .onboarding-form {
              gap: 10px;
            }
            .onboarding-interest-panel {
              padding: 12px;
            }
            .onboarding-chip-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
              max-height: 240px;
              overflow-y: auto;
            }
            .onboarding-chip {
              width: 100%;
              text-align: center;
              padding: 0;
              font-size: 12px;
              min-height: 96px;
            }
            .onboarding-interest-copy {
              min-height: 96px;
              padding: 10px;
              gap: 8px;
            }
            .onboarding-interest-text strong {
              font-size: 13px;
            }
            .onboarding-interest-text small {
              font-size: 10px;
            }
            .onboarding-input-wrap {
              padding: 10px 12px;
            }
            .onboarding-input {
              font-size: 16px;
            }
            .home-onboarding-btn {
              min-height: 40px;
              padding: 10px 14px;
            }
            .home-onboarding-left .home-onboarding-btn,
            .home-onboarding-right .home-onboarding-btn {
              width: 100%;
            }
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
      const skipBtn = document.getElementById('homeOnboardingSkipBtn');
      if (!stepText || !title || !body || !art || !progress || !backBtn || !nextBtn || !tryBtn) return;

      stepText.textContent = `Step ${safeIndex + 1} of ${steps.length}`;
      title.textContent = step.title;
      body.textContent = step.body;
      art.innerHTML = step.art || '';
      backBtn.disabled = safeIndex === 0;
      backBtn.style.opacity = safeIndex === 0 ? '0.5' : '1';
      nextBtn.textContent = step.nextLabel || (safeIndex === steps.length - 1 ? 'Finish' : 'Next');
      if (skipBtn) {
        const needsUsername = steps.some((s) => s.id === 'username-setup');
        const canSkip = !needsUsername || homeOnboardingProfile.usernameStatus === 'ok';
        skipBtn.style.display = canSkip ? 'inline-flex' : 'none';
        skipBtn.disabled = !canSkip;
      }

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

      if (step.id === 'username-setup') {
        wireHomeOnboardingUsernameStep();
      } else if (step.id === 'interests-setup') {
        wireHomeOnboardingInterestsStep();
      }
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

      skipBtn.onclick = () => {
        const needsUsername = steps.some((s) => s.id === 'username-setup');
        if (needsUsername && homeOnboardingProfile.usernameStatus !== 'ok') {
          showHomeToast('Choose a username to continue.', true);
          return;
        }
        closeHomeOnboarding(true);
      };
      backBtn.onclick = () => {
        homeOnboardingIndex = Math.max(0, homeOnboardingIndex - 1);
        renderHomeOnboardingStep();
      };
      nextBtn.onclick = () => {
        const current = steps[homeOnboardingIndex];
        if (current?.id === 'username-setup') {
          void saveHomeOnboardingUsername().then((ok) => {
            if (!ok) return;
            if (homeOnboardingIndex >= steps.length - 1) {
              closeHomeOnboarding(true);
              showHomeToast('You are set. Use the three-dot menu on any card to save your first pick.');
              return;
            }
            homeOnboardingIndex += 1;
            renderHomeOnboardingStep();
          });
          return;
        }
        if (current?.id === 'interests-setup') {
          void saveHomeOnboardingInterests().then((ok) => {
            if (!ok) return;
            if (homeOnboardingIndex >= steps.length - 1) {
              closeHomeOnboarding(true);
              showHomeToast('You are set. Use the three-dot menu on any card to save your first pick.');
              return;
            }
            homeOnboardingIndex += 1;
            renderHomeOnboardingStep();
          });
          return;
        }
        if (homeOnboardingIndex >= steps.length - 1) {
          closeHomeOnboarding(true);
          showHomeToast('You are set. Use the three-dot menu on any card to save your first pick.');
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

    async function maybeShowHomeOnboarding() {
      const userId = homeCurrentUser?.id;
      if (!userId) return;
      const overlay = document.getElementById('homeOnboardingOverlay');
      const pendingOnboarding = isOnboardingPending(userId);
      const alreadyStartedSaving = hasStartedHomeListFlow(userId);

      if (homeOnboardingEvaluatedUserId === userId) {
        if (overlay?.classList.contains('active') && homeOnboardingUserId === userId) {
          return;
        }
        if (hasSeenOnboarding(userId) || !pendingOnboarding || alreadyStartedSaving) {
          return;
        }
      }
      homeOnboardingEvaluatedUserId = userId;

      const unseenOnboarding = !hasSeenOnboarding(userId);
      const shouldShow = unseenOnboarding && pendingOnboarding && !alreadyStartedSaving;

      if (!shouldShow) {
        if (!hasSeenOnboarding(userId) && (!pendingOnboarding || alreadyStartedSaving)) {
          markOnboardingSeen(userId);
        }
        clearOnboardingPending(userId);
        return;
      }

      markOnboardingSeen(userId);
      clearOnboardingPending(userId);
      homeOnboardingUserId = userId;
      homeOnboardingIndex = 0;
      ensureHomeOnboardingUi();
      attachHomeOnboardingEvents();
      renderHomeOnboardingStep();
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

      async function loadFashionBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        // Fire and forget: don't block the rail on storage manifest fetch.
        void ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_FASHION_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'fashion', index)),
          'fashion:fallback'
        ).slice(0, target);
        if (!client) return [];

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('fashion_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        const items = dedupeHomeBrandRows(data || []).map((row, index) => mapHomeBrandItem(row, 'fashion', index));
        return stableShuffleHomeItems(items, 'fashion:home').slice(0, target);
      }

      async function loadFoodBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        void ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_FOOD_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'food', index)),
          'food:fallback'
        ).slice(0, target);
        if (!client) return [];

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('food_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        const items = dedupeHomeBrandRows(data || []).map((row, index) => mapHomeBrandItem(row, 'food', index));
        return stableShuffleHomeItems(items, 'food:home').slice(0, target);
      }

      async function loadCarBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        void ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_CAR_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'car', index)),
          'car:fallback'
        ).slice(0, target);
        if (!client) return [];

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('car_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        const items = dedupeHomeBrandRows(data || []).map((row, index) => mapHomeBrandItem(row, 'car', index));
        return stableShuffleHomeItems(items, 'car:home').slice(0, target);
      }

    async function loadMovies(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadMovies === 'function' ? loaders.loadMovies(signal) : [];
    }

    async function loadTv(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadTv === 'function' ? loaders.loadTv(signal) : [];
    }

    async function loadAnime(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadAnime === 'function' ? loaders.loadAnime(signal) : [];
    }

    let homeGamesSharedScriptPromise = null;

    function ensureHomeGamesShared() {
      if (window.__zo2yGamesShared) return Promise.resolve(window.__zo2yGamesShared);
      if (homeGamesSharedScriptPromise) return homeGamesSharedScriptPromise;
      homeGamesSharedScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-home-games-shared=\"1\"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.__zo2yGamesShared || {}), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load games loader.')), { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'js/pages/games-shared.js?v=20260419a';
        script.defer = true;
        script.setAttribute('data-home-games-shared', '1');
        script.onload = () => resolve(window.__zo2yGamesShared || {});
        script.onerror = () => reject(new Error('Failed to load games loader.'));
        document.head.appendChild(script);
      });
      return homeGamesSharedScriptPromise;
    }

    function normalizeGameCoverUrl(value) {
      const raw = String(value || '').trim();
      if (!raw || raw === '[object Object]') return '';
      if (raw.startsWith('//')) return `https:${raw}`;
      return toHttpsUrl(raw);
    }

    let homeUsernameCheckTimer = null;
    let homeUsernameCheckToken = 0;

    function setHomeOnboardingUsernameStatus(message, state = '') {
      const status = document.getElementById('homeOnboardingUsernameStatus');
      if (!status) return;
      status.textContent = message;
      status.classList.remove('ok', 'bad');
      if (state === 'ok') status.classList.add('ok');
      if (state === 'bad') status.classList.add('bad');
    }

    function setHomeOnboardingInterestStatus(message, state = '') {
      const status = document.getElementById('homeOnboardingInterestStatus');
      if (!status) return;
      status.textContent = message;
      status.classList.remove('ok', 'bad');
      if (state === 'ok') status.classList.add('ok');
      if (state === 'bad') status.classList.add('bad');
    }

    function getActiveHomeOnboardingStep() {
      const steps = getHomeOnboardingSteps();
      const safeIndex = Math.max(0, Math.min(homeOnboardingIndex, steps.length - 1));
      return steps[safeIndex];
    }

    function updateHomeOnboardingNextState() {
      const nextBtn = document.getElementById('homeOnboardingNextBtn');
      if (!nextBtn) return;
      const current = getActiveHomeOnboardingStep();
      if (!current) {
        nextBtn.disabled = false;
        return;
      }
      if (current.id === 'username-setup') {
        if (homeOnboardingProfile.usernameStatus === 'saving' || homeOnboardingProfile.usernameStatus === 'checking') {
          nextBtn.disabled = true;
          return;
        }
        nextBtn.disabled = homeOnboardingProfile.usernameStatus !== 'ok';
        return;
      }
      if (current.id === 'interests-setup') {
        if (homeOnboardingProfile.interestsStatus === 'saving') {
          nextBtn.disabled = true;
          return;
        }
        const count = homeOnboardingProfile.types.size + homeOnboardingProfile.tags.size;
        nextBtn.disabled = count < 1;
        return;
      }
      nextBtn.disabled = false;
    }

    function resolveOnboardingInterestSelection() {
      const selectedOptions = HOME_INTEREST_OPTIONS.filter((option) => {
        return (option.kind === 'type' && homeOnboardingProfile.types.has(option.id))
          || (option.kind === 'tag' && homeOnboardingProfile.tags.has(option.id));
      });
      const interestTypes = selectedOptions.filter((opt) => opt.kind === 'type').map((opt) => opt.id);
      const interestTags = Array.from(new Set(selectedOptions.flatMap((opt) => opt.tags || [])))
        .map((value) => String(value || '').toLowerCase().trim())
        .filter(Boolean);
      return { interestTypes, interestTags };
    }

    async function checkHomeOnboardingUsername(value) {
      const token = ++homeUsernameCheckToken;
      const normalized = normalizeProfileUsername(value);
      if (!isValidProfileUsername(normalized)) {
        homeOnboardingProfile.usernameStatus = 'bad';
        setHomeOnboardingUsernameStatus(`Use 3-${PROFILE_USERNAME_MAX_LENGTH} letters, numbers, or underscores.`, 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
      if (RESERVED_PROFILE_USERNAMES.has(normalized.replace(/_/g, ''))) {
        homeOnboardingProfile.usernameStatus = 'bad';
        setHomeOnboardingUsernameStatus('That username is reserved.', 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
      setHomeOnboardingUsernameStatus('Checking availability\u2026');
      homeOnboardingProfile.usernameStatus = 'checking';
      updateHomeOnboardingNextState();
      try {
        const available = await ensureHomeUsernameAvailable(normalized, homeCurrentUser?.id);
        if (token !== homeUsernameCheckToken) return false;
        homeOnboardingProfile.username = available;
        homeOnboardingProfile.usernameStatus = 'ok';
        setHomeOnboardingUsernameStatus('Username available.', 'ok');
        updateHomeOnboardingNextState();
        return true;
      } catch (err) {
        if (token !== homeUsernameCheckToken) return false;
        homeOnboardingProfile.usernameStatus = 'bad';
        setHomeOnboardingUsernameStatus(String(err?.message || 'Username unavailable.'), 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
    }

    function seedHomeOnboardingInterests() {
      if (!homeOnboardingProfile.types.size && !homeOnboardingProfile.tags.size) {
        homeInterestProfile.types?.forEach((type) => homeOnboardingProfile.types.add(type));
        homeInterestProfile.tags?.forEach((tag) => {
          const optionMatch = HOME_INTEREST_OPTIONS.find((opt) => opt.kind === 'tag' && opt.tags?.includes(tag));
          if (optionMatch) homeOnboardingProfile.tags.add(optionMatch.id);
        });
      }
    }

    function syncHomeOnboardingInterestChips(chips) {
      chips.forEach((chip) => {
        const id = chip.getAttribute('data-interest-id');
        const kind = chip.getAttribute('data-interest-kind');
        if (!id || !kind) return;
        const selected = kind === 'type'
          ? homeOnboardingProfile.types.has(id)
          : homeOnboardingProfile.tags.has(id);
        chip.classList.toggle('selected', selected);
      });
    }

    function updateHomeOnboardingInterestStatus() {
      const count = homeOnboardingProfile.types.size + homeOnboardingProfile.tags.size;
      if (count > 0) {
        homeOnboardingProfile.interestsStatus = 'ok';
        setHomeOnboardingInterestStatus(`${count} selected`, 'ok');
      } else {
        homeOnboardingProfile.interestsStatus = 'bad';
        setHomeOnboardingInterestStatus('Pick at least one interest to continue.', 'bad');
      }
      updateHomeOnboardingNextState();
    }

    function wireHomeOnboardingUsernameStep() {
      const input = document.getElementById('homeOnboardingUsernameInput');
      if (!input) return;

      if (!homeOnboardingProfile.username) {
        const fallbackSeed = homeCurrentUser?.user_metadata?.username
          || homeCurrentUser?.user_metadata?.full_name
          || homeCurrentUser?.user_metadata?.name
          || (homeCurrentUser?.email || '').split('@')[0]
          || 'user';
        homeOnboardingProfile.username = normalizeProfileUsername(fallbackSeed);
      }

      input.value = homeOnboardingProfile.username || '';
      setHomeOnboardingUsernameStatus('Choose a username to continue.');
      homeOnboardingProfile.usernameStatus = 'idle';
      updateHomeOnboardingNextState();
      void checkHomeOnboardingUsername(input.value);

      input.addEventListener('input', () => {
        const value = input.value;
        homeOnboardingProfile.username = value;
        if (homeUsernameCheckTimer) clearTimeout(homeUsernameCheckTimer);
        homeUsernameCheckTimer = setTimeout(() => {
          void checkHomeOnboardingUsername(value);
        }, 320);
      });

      input.addEventListener('blur', () => {
        void checkHomeOnboardingUsername(input.value);
      });
    }

    function wireHomeOnboardingInterestsStep() {
      const chips = Array.from(document.querySelectorAll('.onboarding-chip'));
      if (!chips.length) return;
      seedHomeOnboardingInterests();
      syncHomeOnboardingInterestChips(chips);
      updateHomeOnboardingInterestStatus();

      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          const id = chip.getAttribute('data-interest-id');
          const kind = chip.getAttribute('data-interest-kind');
          if (!id || !kind) return;
          if (kind === 'type') {
            if (homeOnboardingProfile.types.has(id)) {
              homeOnboardingProfile.types.delete(id);
            } else {
              homeOnboardingProfile.types.add(id);
            }
          } else {
            if (homeOnboardingProfile.tags.has(id)) {
              homeOnboardingProfile.tags.delete(id);
            } else {
              homeOnboardingProfile.tags.add(id);
            }
          }
          syncHomeOnboardingInterestChips(chips);
          updateHomeOnboardingInterestStatus();
        });
      });
    }

    async function saveHomeOnboardingUsername() {
      if (!homeCurrentUser?.id) return false;
      const input = document.getElementById('homeOnboardingUsernameInput');
      const rawUsername = input ? input.value : homeOnboardingProfile.username;
      homeOnboardingProfile.usernameStatus = 'saving';
      updateHomeOnboardingNextState();
      try {
        const normalized = await ensureHomeUsernameAvailable(rawUsername, homeCurrentUser.id);
        homeOnboardingProfile.username = normalized;
        const client = await ensureHomeSupabase();
        if (client) {
          const fullName = homeCurrentUser?.user_metadata?.full_name || homeCurrentUser?.user_metadata?.name || '';
          await client.from('user_profiles').upsert({
            id: homeCurrentUser.id,
            username: normalized,
            full_name: fullName || null
          }, { onConflict: 'id' });
          try {
            await client.auth.updateUser({ data: { username: normalized } });
          } catch (_err) {}
        }
        homeOnboardingProfile.usernameStatus = 'ok';
        setHomeOnboardingUsernameStatus('Username saved.', 'ok');
        updateHomeOnboardingNextState();
        showHomeToast('Username saved.');
        return true;
      } catch (err) {
        homeOnboardingProfile.usernameStatus = 'bad';
        setHomeOnboardingUsernameStatus(String(err?.message || 'Unable to save right now.'), 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
    }

    async function saveHomeOnboardingInterests() {
      if (!homeCurrentUser?.id) return false;
      const { interestTypes, interestTags } = resolveOnboardingInterestSelection();
      if (!interestTypes.length && !interestTags.length) {
        homeOnboardingProfile.interestsStatus = 'bad';
        setHomeOnboardingInterestStatus('Pick at least one interest to continue.', 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
      homeOnboardingProfile.interestsStatus = 'saving';
      updateHomeOnboardingNextState();
      try {
        const client = await ensureHomeSupabase();
        if (client) {
          homeInterestProfile = { types: interestTypes, tags: interestTags };
          await client.from('user_interest_profiles').upsert({
            user_id: homeCurrentUser.id,
            interest_types: interestTypes,
            interest_tags: interestTags,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
        homeOnboardingProfile.interestsStatus = 'ok';
        setHomeOnboardingInterestStatus('Interests saved.', 'ok');
        updateHomeOnboardingNextState();
        showHomeToast('Interests saved. Feed tuned to you.');
        homeTasteWeights = await loadTasteWeights();
        void refreshHomePersonalization();
        return true;
      } catch (err) {
        homeOnboardingProfile.interestsStatus = 'bad';
        setHomeOnboardingInterestStatus(String(err?.message || 'Unable to save right now.'), 'bad');
        updateHomeOnboardingNextState();
        return false;
      }
    }

    function isLikelyBackdropGameUrl(url) {
      const value = String(url || '').trim().toLowerCase();
      if (!value) return false;
      return ['/heroes/', '/hero/', 'background', 'fanart', 'screenshot', 'screenshots', 'backdrop'].some((token) => value.includes(token));
    }

    function pickPreferredGameCoverUrl(candidates = []) {
      const cleaned = candidates.map(normalizeGameCoverUrl).filter(Boolean);
      const likelyCovers = cleaned.filter((url) => !isLikelyBackdropGameUrl(url));
      const pool = likelyCovers.length ? likelyCovers : cleaned;
      return pool.find((url) => /\/game-assets\/covers-official\//.test(url))
        || pool.find((url) => /\/game-assets\/covers\//.test(url))
        || pool.find((url) => /wikimedia|wikipedia/.test(url))
        || pool.find((url) => /igdb|images\.igdb\.com/.test(url))
        || pool.find((url) => /\/game-assets\//.test(url))
        || pool.find((url) => /rawg|media\.rawg/.test(url))
        || pool[0]
        || '';
    }

    function getHomeGameImportedFrom(row) {
      return String(row?.extra?.imported_from || row?.source || '').trim().toLowerCase();
    }

    function hasPosterOfficialGameCover(row) {
      const cover = normalizeGameCoverUrl(row?.cover_url || row?.cover?.url || row?.cover);
      if (!cover || !/\/game-assets\/covers-official\//.test(cover)) return false;
      return Boolean(row?.extra?.official_cover_is_poster);
    }

    function isOfficialGameProviderRow(row) {
      const importedFrom = getHomeGameImportedFrom(row);
      return importedFrom.includes('wikipedia') || importedFrom.includes('igdb');
    }

    function pickOfficialPosterGameUrl(candidates = []) {
      const cleaned = candidates.map(normalizeGameCoverUrl).filter(Boolean);
      const pool = cleaned.filter((url) => !isLikelyBackdropGameUrl(url));
      return pool.find((url) => /\/game-assets\/covers-official\//.test(url))
        || pool.find((url) => /wikimedia|wikipedia/.test(url))
        || '';
    }

    function normalizeHomeGameTitleKey(title) {
      return String(title || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const HOME_UNOFFICIAL_GAME_PATTERNS = [
      /\bprototype\b/i,
      /\btech demo\b/i,
      /\bdemo\b/i,
      /\bfan\s?game\b/i,
      /\bfanmade\b/i,
      /\brom hack\b/i,
      /\bmod\b/i,
      /\bmodded\b/i,
      /\bpictures pack\b/i,
      /\bimages pack\b/i,
      /\bwallpaper pack\b/i,
      /\bsoundtrack\b/i,
      /\bost\b/i,
      /\bupdate\s*\d+\b/i,
      /\bfield trip\b/i,
      /\bcreepy red\b/i,
      /\bradical red\b/i,
      /\bmeta fire\s?red\b/i,
      /\bace ?dragon\b/i
    ];

    function isLikelyRealHomeGameRow(row) {
      const title = String(row?.title || row?.name || row?.slug || '').trim();
      if (!title) return false;
      if (HOME_UNOFFICIAL_GAME_PATTERNS.some((pattern) => pattern.test(title))) return false;
      const importedFrom = getHomeGameImportedFrom(row);
      if (/[[(][^)]+[)\]]/.test(title) && importedFrom.includes('rawg')) return false;
      return true;
    }

    function pickBackdropGameUrl(candidates = [], fallback = '') {
      const cleaned = candidates.map(normalizeGameCoverUrl).filter(Boolean);
      const fallbackUrl = normalizeGameCoverUrl(fallback);
      if (fallbackUrl) {
        const different = cleaned.find((url) => url !== fallbackUrl);
        return different || fallbackUrl;
      }
      return cleaned[0] || '';
    }

    function resolveHomeGameCover(row) {
      if (!row) return '';
      if (hasPosterOfficialGameCover(row)) {
        return pickOfficialPosterGameUrl([row?.cover_url, row?.cover?.url, row?.cover]);
      }
      return pickPreferredGameCoverUrl([
        row?.cover_url,
        row?.cover?.url,
        row?.cover,
        ...(Array.isArray(row?.extra?.local_covers) ? row.extra.local_covers : []),
        ...(Array.isArray(row?.extra?.covers) ? row.extra.covers : []),
        ...(Array.isArray(row?.extra?.official_covers) ? row.extra.official_covers : []),
        ...(Array.isArray(row?.extra?.cover_candidates) ? row.extra.cover_candidates : []),
        isOfficialGameProviderRow(row) ? '' : row?.hero_url,
        isOfficialGameProviderRow(row) ? '' : row?.hero,
        ...(Array.isArray(row?.screenshots) ? row.screenshots : []),
        ...(Array.isArray(row?.short_screenshots) ? row.short_screenshots.map((entry) => entry?.image) : [])
      ]);
    }

    function resolveHomeGameHero(row, fallback) {
      const hero = pickBackdropGameUrl([
        row?.hero_url,
        row?.hero,
        row?.background_image,
        ...(Array.isArray(row?.screenshots) ? row.screenshots : []),
        ...(Array.isArray(row?.short_screenshots) ? row.short_screenshots.map((entry) => entry?.image) : [])
      ], fallback);
      return hero || fallback || '';
    }

    function isLikelyLogoOnlyGameArt(url) {
      const value = String(url || '').trim().toLowerCase();
      if (!value) return false;
      if (value.endsWith('.svg') || value.includes('.svg?')) return true;
      return ['logo', 'wordmark', 'transparent', 'icon'].some((token) => value.includes(token));
    }

    function scoreHomeGameCoverRow(row, hasPreferredAlternatives = false) {
      const cover = resolveHomeGameCover(row);
      const hero = resolveHomeGameHero(row, '');
      const importedFrom = getHomeGameImportedFrom(row);
      if (!cover) return Number.NEGATIVE_INFINITY;
      let score = 0;
      if (/\/game-assets\/covers-official\//.test(cover)) score += 700;
      if (/wikimedia|wikipedia/.test(cover)) score += 420;
      if (importedFrom.includes('igdb') || importedFrom.includes('wikipedia')) score += 220;
      if (/game-assets\/covers\//.test(cover)) score += 80;
      if (hero && hero !== cover) score += 70;
      if (hero && hero === cover) score -= 60;
      if (isLikelyLogoOnlyGameArt(cover)) score += 55;
      if (hasPreferredAlternatives && importedFrom.includes('rawg')) score -= 180;
      return score;
    }

    function scoreHomeGameBaseRow(row, hasPreferredAlternatives = false) {
      if (!row) return Number.NEGATIVE_INFINITY;
      let score = 0;
      score += scoreHomeGameCoverRow(row, hasPreferredAlternatives) * 2.5;
      score += scoreHomeGameHeroRow(row) * 0.35;
      score += Math.min(Number(row?.rating_count || 0), 5000) / 20;
      score += Number(row?.rating || 0) * 8;
      return score;
    }

    function scoreHomeGameHeroRow(row) {
      const cover = resolveHomeGameCover(row);
      const hero = resolveHomeGameHero(row, '');
      const importedFrom = getHomeGameImportedFrom(row);
      if (!hero) return Number.NEGATIVE_INFINITY;
      let score = 0;
      if (/game-assets\/heroes\//.test(hero)) score += 260;
      if (hero && hero !== cover) score += 160;
      if (importedFrom.includes('rawg')) score += 90;
      if (/background|hero|fanart|screenshot/.test(hero)) score += 40;
      if (/wikimedia|wikipedia/.test(hero) && hero === cover) score -= 120;
      return score;
    }

    function mergeHomeGameRows(rows) {
      const list = Array.isArray(rows) ? rows.filter((row) => row && isLikelyRealHomeGameRow(row)) : [];
      if (!list.length) return null;
      if (list.length === 1) return list[0];
      const hasPreferredAlternatives = list.some((row) => {
        const importedFrom = getHomeGameImportedFrom(row);
        return importedFrom.includes('igdb') || importedFrom.includes('wikipedia');
      });
      const sortedBaseRows = list.slice().sort((a, b) => {
        const scoreDiff = scoreHomeGameBaseRow(b, hasPreferredAlternatives) - scoreHomeGameBaseRow(a, hasPreferredAlternatives);
        if (scoreDiff !== 0) return scoreDiff;
        const countDiff = Number(b?.rating_count || 0) - Number(a?.rating_count || 0);
        if (countDiff !== 0) return countDiff;
        const ratingDiff = Number(b?.rating || 0) - Number(a?.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''));
      });
      const baseRow = sortedBaseRows[0];
      const bestCoverRow = list.slice().sort((a, b) => scoreHomeGameCoverRow(b, hasPreferredAlternatives) - scoreHomeGameCoverRow(a, hasPreferredAlternatives))[0] || baseRow;
      const bestHeroRow = list.slice().sort((a, b) => scoreHomeGameHeroRow(b) - scoreHomeGameHeroRow(a))[0] || baseRow;
      const merged = { ...baseRow };
      const mergedCover = resolveHomeGameCover(bestCoverRow) || resolveHomeGameCover(baseRow);
      const mergedHero = resolveHomeGameHero(bestHeroRow, mergedCover || resolveHomeGameCover(baseRow));
      if (mergedCover) merged.cover_url = mergedCover;
      if (mergedHero) merged.hero_url = mergedHero;
      const mergedGenres = list.find((row) => Array.isArray(row?.extra?.genres) && row.extra.genres.length)?.extra?.genres;
      if (mergedGenres?.length) {
        merged.extra = {
          ...(baseRow?.extra && typeof baseRow.extra === 'object' ? baseRow.extra : {}),
          genres: mergedGenres
        };
      }
      return merged;
    }

    function dedupeHomeGameRows(rows, targetCount = 0) {
      const list = Array.isArray(rows) ? rows.filter((row) => row && isLikelyRealHomeGameRow(row)) : [];
      if (!list.length) return [];
      const groups = new Map();
      list.forEach((row) => {
        const titleKey = normalizeHomeGameTitleKey(row?.title || row?.name || '');
        const key = titleKey || String(row?.id || row?.igdb_id || row?.rawg_id || Math.random());
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      });
      const merged = Array.from(groups.values()).map((group) => mergeHomeGameRows(group)).filter(Boolean);
      merged.sort((a, b) => {
        const countDiff = Number(b?.rating_count || 0) - Number(a?.rating_count || 0);
        if (countDiff !== 0) return countDiff;
        const ratingDiff = Number(b?.rating || 0) - Number(a?.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''));
      });
      const limit = Number(targetCount || 0);
      return limit > 0 ? merged.slice(0, limit) : merged;
    }

    function getHomeGamePresentation(cover, hero) {
      const plain = isLikelyLogoOnlyGameArt(cover) || !hero || hero === cover;
      return {
        plain,
        spotlightShape: plain ? 'landscape' : 'poster',
        spotlightFit: 'contain'
      };
    }

    function isPreferredHomeGameRow(row) {
      const cover = resolveHomeGameCover(row);
      if (!cover) return false;
      return hasPosterOfficialGameCover(row) || isOfficialGameProviderRow(row);
    }

    async function loadGames(signal, options = {}) {
      // Keep homepage games logic identical to the previously working implementation (commit b57da823).
      // This version pulls from the existing `/api/igdb/games` aggregator instead of Supabase tables.
      const targetCount = Math.max(getHomeChannelTargetItems(), isHomeSlowNetwork() ? 18 : 28);
      const cacheBust = options?.cacheBust ? Date.now() : 0;
      const cacheParams = cacheBust ? { cache_bust: cacheBust } : {};

      const mapToItem = (row) => {
        const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
        const genres = Array.isArray(extra?.genres) ? extra.genres : (Array.isArray(row?.genres) ? row.genres : []);
        const cover = resolveHomeGameCover(row);
        const hero = resolveHomeGameHero(row, '');
        if (!cover || cover.includes('/newlogo.webp')) return null;
        const id = String(row?.id || row?.igdb_id || row?.rawg_id || '').trim();
        const title = String(row?.title || row?.name || 'Game').trim() || 'Game';
        const releaseDate = String(row?.release_date || row?.released || '').trim();
        const ratingValue = Number(row?.rating || 0);
        const genreText = genres.length
          ? genres.slice(0, 2).map((entry) => String(entry?.name || entry || '').trim()).filter(Boolean).join(' | ')
          : 'Video Game';
        const ratingText = Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : '';
        return {
          mediaType: 'game',
          itemId: id,
          title,
          subtitle: releaseDate ? releaseDate.slice(0, 4) : 'Game',
          extra: [genreText, ratingText].filter(Boolean).join(' | '),
          image: cover,
          backgroundImage: hero || '',
          spotlightImage: hero || '',
          spotlightMediaImage: cover,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: 'poster',
          fallbackImage: '',
          href: id ? `game.html?id=${encodeURIComponent(String(id))}` : 'games.html'
        };
      };

      try {
        const providerList = ['wikipedia', 'igdb'];
        for (const provider of providerList) {
          const baseParams = {
            page_size: Math.min(Math.max(targetCount * 6, 140), 220),
            provider,
            spotlight: 1,
            cache: 1,
            cache_pages: 1
          };
          const requests = [
            { ...baseParams, page: 1, ordering: '-released' },
            { ...baseParams, page: 2, ordering: '-released' },
            { ...baseParams, page: 1, ordering: '-rating' },
            { ...baseParams, page: 1, ordering: '-rating_count' },
            { ...baseParams, page: 1, ordering: '-name' },
            { ...baseParams, page: 1, popularity_type: 1 },
            { ...baseParams, page: 2, popularity_type: 1 }
          ];
          const merged = [];
          const seen = new Set();
          for (const params of requests) {
            if (signal?.aborted) break;
            const payload = await homeIgdbFetch('/games', { ...params, ...cacheParams }, signal);
            const rows = Array.isArray(payload?.results) ? payload.results : [];
            rows.forEach((row) => {
              const id = String(row?.id || row?.igdb_id || row?.rawg_id || '').trim();
              const title = String(row?.title || row?.name || '').trim().toLowerCase();
              const key = id || title;
              if (!key || seen.has(key)) return;
              seen.add(key);
              merged.push(row);
            });
            if (merged.length >= targetCount * 4) break;
          }
          if (!merged.length || signal?.aborted) continue;
          const items = merged
            .map((row) => mapToItem(row))
            .filter((item) => item && String(item.itemId || '').trim() && String(item.image || '').trim())
            .slice(0, targetCount);
          if (items.length) return items;
        }
        return [];
      } catch (_error) {
        return [];
      }
    }

    async function refreshHomeGamesRail() {
      if (!ENABLE_GAMES) return;
      const rail = document.getElementById('gamesRail');
      if (!rail) return;
      rail.innerHTML = '<div class="empty">Refreshing popular games...</div>';
      const items = await loadGames(null, { cacheBust: true });
      if (!items || !items.length) {
        renderRail('gamesRail', [], { mediaType: 'game' });
        return;
      }
      homeFeedState.game = items;
      renderRail('gamesRail', items, { mediaType: 'game' });
    }

    function toggleHomeGamesRailForSearch() {
      // Keep the home games rail visible regardless of global search input,
      // so it always advertises popular games.
      const rail = document.getElementById('gamesRail');
      if (!rail) return;
      const wrap = rail.closest('.rail-wrap') || rail;
      wrap.style.display = '';
    }

    let homeHeavyLoaderScriptPromise = null;

    function ensureHomeHeavyLoaders() {
      if (window.__zo2yHomeHeavyLoaders) return Promise.resolve(window.__zo2yHomeHeavyLoaders);
      if (homeHeavyLoaderScriptPromise) return homeHeavyLoaderScriptPromise;
      homeHeavyLoaderScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-home-heavy-loaders="1"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.__zo2yHomeHeavyLoaders || {}), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load homepage loaders.')), { once: true });
          return;
        }
        const script = document.createElement('script');
      script.src = 'js/pages/index-home-heavy-loaders.js?v=20260329a';
        script.defer = true;
        script.setAttribute('data-home-heavy-loaders', '1');
        script.onload = () => resolve(window.__zo2yHomeHeavyLoaders || {});
        script.onerror = () => reject(new Error('Failed to load homepage loaders.'));
        document.head.appendChild(script);
      });
      return homeHeavyLoaderScriptPromise;
    }

    async function loadBooks(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadBooks === 'function' ? loaders.loadBooks(signal) : [];
    }

    async function loadMusic(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadMusic === 'function' ? loaders.loadMusic(signal) : [];
    }

    async function loadTravel(signal) {
      const targetCount = Math.max(1, Number(getHomeChannelTargetItems() || 16));
      void ensureHomeCountryIndex(signal).catch(() => {});
      const cached = getCachedHomeTravelItems(targetCount);
      if (cached.length) return cached.slice(0, targetCount);
      return getHomeTravelFallbackItems(targetCount);
    }

    async function loadSports(signal) {
      const target = Math.max(8, Math.min(16, Number(getHomeChannelTargetItems() || 12)));
      const seeds = [
        'Real Madrid',
        'Arsenal',
        'Liverpool',
        'Los Angeles Lakers',
        'Boston Celtics',
        'New York Yankees',
        'Kansas City Chiefs',
        'Golden State Warriors'
      ];

      try {
        const queries = seeds.slice(0, target).map((name) => fetchSportsDb('searchteams.php', { t: name }, { signal, timeoutMs: 7000, retries: 1 }));
        const results = await Promise.all(queries);
        const rows = results
          .flatMap((payload) => Array.isArray(payload?.teams) ? payload.teams : [])
          .filter(Boolean);
        const seen = new Set();
        const items = [];
        for (const row of rows) {
          const id = String(row?.idTeam || row?.id || '').trim();
          const title = String(row?.strTeam || row?.name || 'Team').trim() || 'Team';
          const key = id || title.toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          const badge = toHttpsUrl(String(row?.strTeamBadge || row?.strBadge || '').trim());
          const banner = toHttpsUrl(String(row?.strTeamBanner || row?.strBanner || '').trim());
          const stadium = toHttpsUrl(String(row?.strStadiumThumb || '').trim());
          const image = badge || banner || stadium || HOME_LOCAL_FALLBACK_IMAGE;
          const league = String(row?.strLeague || '').trim();
          items.push({
            mediaType: 'sports',
            itemId: id || title,
            title,
            subtitle: league || 'Sports',
            extra: String(row?.strCountry || '').trim(),
            image,
            backgroundImage: banner || stadium || image,
            spotlightImage: banner || stadium || image,
            spotlightMediaImage: image,
            spotlightMediaFit: 'contain',
            spotlightMediaShape: 'square',
            fallbackImage: HOME_LOCAL_FALLBACK_IMAGE,
            href: id ? `team.html?id=${encodeURIComponent(id)}` : 'sports.html'
          });
          if (items.length >= target) break;
        }
        if (items.length) return items;
      } catch (_err) {}

      return [];
    }

    async function initUniversalHome(options = {}) {
      const now = Date.now();
      const force = !!options.force;
      if (!homeDebugState.enabled) {
        homeDebugState.enabled = isHomeDebugEnabled();
        if (homeDebugState.enabled) {
          homeDebugEvent('debug:enabled', { via: 'initUniversalHome' });
          try {
            window.__ZO2Y_HOME_DEBUG = {
              get enabled() { return homeDebugState.enabled; },
              setEnabled: (value) => {
                setHomeDebugEnabled(!!value);
                homeDebugState.enabled = !!value;
                if (homeDebugState.enabled) {
                  homeDebugEvent('debug:enabled', { via: 'setEnabled' });
                }
                scheduleHomeDebugRender();
              },
              snapshot: () => buildHomeDebugSnapshot()
            };
          } catch (_err) {}
          try {
            window.addEventListener('error', (ev) => {
              homeDebugEvent('window:error', {
                message: String(ev?.message || ''),
                file: String(ev?.filename || ''),
                line: Number(ev?.lineno || 0)
              });
            });
            window.addEventListener('unhandledrejection', (ev) => {
              const reason = ev?.reason;
              homeDebugEvent('window:rejection', { message: String(reason?.message || reason || '') });
            });
          } catch (_err) {}
          ensureHomeDebugPanel();
        }
      }
      const hasExistingItems = Object.values(homeFeedState).some((items) => Array.isArray(items) && items.length);
      if (
        !force
        && hasExistingItems
        && homeLastGoodFeedAt
        && (now - homeLastGoodFeedAt) < HOME_RESUME_REFRESH_THROTTLE_MS
      ) {
        resetSpotlightTimer(true);
        return;
      }
      homeLastUniversalInitAt = now;
      const initSeq = ++homeFeedInitSeq;
      homeDebugEvent('home:init', { force, initSeq });
      ensureHomeInteractionWatch();
      resetHomeViewportDeferrals();
      if (homeWeakFeedRetryTimer) {
        clearTimeout(homeWeakFeedRetryTimer);
        homeWeakFeedRetryTimer = null;
      }
      setStatus('Loading spotlight and live feed...', false);
      resetSpotlightTimer(false);
      const channels = getHomeChannels();
      const initialChannels = getHomeInitialChannels(channels);
      const deferredChannels = channels.filter((channel) => !initialChannels.includes(channel));
      const cachedFeed = readHomeFeedCache();
      const baselineFeed = cachedFeed || null;

      if (baselineFeed) {
        const baselineActiveChannels = countActiveHomeChannels(baselineFeed);
        const cacheHealthyFloor = Math.min(initialChannels.length, 3);
        const cacheOnly = !force && baselineActiveChannels >= cacheHealthyFloor;
        const cachedResult = cacheOnly
          ? applyHomeFeedMap(baselineFeed, { refreshSecondary: false })
          : applyHomeFeedMap(baselineFeed);
        if (cachedResult.scoredPool.length) {
          homeLastGoodFeedAt = Date.now();
          setStatus(cacheOnly ? 'Feed ready from cache.' : 'Feed ready from cache. Syncing live data...', false);
        }
        if (cacheOnly && cachedResult.scoredPool.length) {
          resetSpotlightTimer(true);
          return;
        }

        // Fill any empty local rails with fallbacks so refreshes don't get stuck on placeholders.
        try {
          const normalized = normalizeHomeFeedMap(baselineFeed) || {};
          const filled = { ...normalized };
          channels.forEach((channel) => {
            const existing = Array.isArray(filled?.[channel.key]) ? filled[channel.key] : [];
            if (existing.length) return;
            const fallback = getHomeRailFallbackItems(channel.key);
            if (Array.isArray(fallback) && fallback.length) {
              filled[channel.key] = fallback;
            }
          });
          applyHomeFeedMap(filled, { refreshSecondary: false });
        } catch (_err) {}
      }

      if (!baselineFeed) {
        // Ensure local rails never stay on placeholders when remote loaders fail.
        applyHomeFeedMap(buildInstantFallbackFeed(), { refreshSecondary: false });
      }

      const precomputedFeedPromise = loadPrecomputedHomeFeed().catch(() => null);
      const blankFeed = Object.fromEntries(initialChannels.map((channel) => [channel.key, []]));
      const freshLoadedKeys = new Set();
      let workingFeed = normalizeHomeFeedMap(baselineFeed) || blankFeed;

      const loadChannel = async (channel) => {
        const railId = String(channel?.railId || '').trim();
        const key = String(channel?.key || '').trim();
        const attemptStartedAt = Date.now();
        if (key) {
          homeDebugState.channels.set(key, {
            ...(homeDebugState.channels.get(key) || {}),
            last: {
              status: 'loading',
              startedAt: attemptStartedAt,
              timeoutMs: Number(channel.timeoutMs || HOME_CHANNEL_TIMEOUT_MS) || 0,
              railId
            }
          });
          scheduleHomeDebugRender();
        }

        let items = await loadHomeChannelWithTimeout(channel.loader, Number(channel.timeoutMs || HOME_CHANNEL_TIMEOUT_MS));
        if (!Array.isArray(items)) items = [];

        if (!items.length) {
          const existing = Array.isArray(workingFeed?.[channel.key]) ? workingFeed[channel.key] : [];
          if (!existing.length) {
            const fallback = getHomeRailFallbackItems(channel.key);
            if (Array.isArray(fallback) && fallback.length) {
              items = fallback;
            }
          }
        }

        if (key) {
          const last = homeDebugState.channels.get(key)?.last || {};
          const isPlaceholder = Array.isArray(items) ? items.every((it) => !!it?.isPlaceholder) : false;
          const endedAt = Date.now();
          const ms = endedAt - attemptStartedAt;
          const timeoutMs = Number(last.timeoutMs || channel.timeoutMs || HOME_CHANNEL_TIMEOUT_MS) || 0;
          const status = (!items.length)
            ? (ms >= timeoutMs - 30 ? 'timeout' : 'empty')
            : (isPlaceholder ? 'fallback' : 'ok');
          homeDebugState.channels.set(key, {
            ...(homeDebugState.channels.get(key) || {}),
            last: {
              ...last,
              status,
              endedAt,
              ms,
              items: items.length,
              reason: !items.length ? 'No items returned.' : (isPlaceholder ? 'Rendered fallbacks (placeholder items).' : 'Live items rendered.')
            }
          });
          scheduleHomeDebugRender();
        }

        if (initSeq === homeFeedInitSeq && items.length) {
          freshLoadedKeys.add(channel.key);
          workingFeed = {
            ...workingFeed,
            [channel.key]: items
          };
          const progressive = applyHomeFeedMap(workingFeed, { refreshSecondary: false });
          if (progressive.scoredPool.length && freshLoadedKeys.size < channels.length) {
            setStatus(`Loading live feed... ${freshLoadedKeys.size}/${channels.length} channels ready.`, false);
          }
        }
        return { ...channel, items };
      };

      const loadedPromise = loadHomeChannelGroup(initialChannels, loadChannel);
      const precomputedFeed = await withTimeout(precomputedFeedPromise, 1200, null);
      if (initSeq !== homeFeedInitSeq) return;
        if (precomputedFeed) {
        const precomputedActiveChannels = countActiveHomeChannels(precomputedFeed);
        const baselineActiveChannels = countActiveHomeChannels(baselineFeed);
        if (precomputedActiveChannels > baselineActiveChannels) {
          const mergedPrecomputedFeed = {
            ...workingFeed
          };
          const normalizedPrecomputedFeed = normalizeHomeFeedMap(precomputedFeed) || blankFeed;
          channels.forEach((channel) => {
            if (freshLoadedKeys.has(channel.key)) return;
            const items = Array.isArray(normalizedPrecomputedFeed[channel.key]) ? normalizedPrecomputedFeed[channel.key] : [];
            if (items.length) {
              mergedPrecomputedFeed[channel.key] = items;
            }
          });
          workingFeed = mergedPrecomputedFeed;
          const precomputedResult = applyHomeFeedMap(workingFeed, { refreshSecondary: false });
          if (precomputedResult.scoredPool.length) {
            setStatus('Spotlight ready from precomputed feed. Syncing live data...', false);
          }
        }
      }

      await loadedPromise;
      if (initSeq !== homeFeedInitSeq) return;

      deferredChannels.forEach((channel) => queueHomeDeferredChannel(channel, loadChannel, initSeq));

      const mergedFeed = normalizeHomeFeedMap(workingFeed) || blankFeed;
      const initialChannelsCount = initialChannels.length;
      const healthyChannelFloor = Math.min(initialChannelsCount, 3);

      const hasWeakFeed = countActiveHomeChannels(mergedFeed) < healthyChannelFloor;
      const { scoredPool } = applyHomeFeedMap(mergedFeed, { showEmptyRails: !hasWeakFeed });

      if (!scoredPool.length) {
        resetSpotlightTimer(false);
        setStatus('Could not load live feeds right now. Try again shortly.', true);
        return;
      }
      homeLastGoodFeedAt = Date.now();

      const freshActiveChannels = freshLoadedKeys.size;
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

      if (freshActiveChannels >= healthyChannelFloor) {
        if (homeWeakFeedRetryTimer) {
          clearTimeout(homeWeakFeedRetryTimer);
          homeWeakFeedRetryTimer = null;
        }
        homeWeakFeedRetryCount = 0;
        } else if (homeWeakFeedRetryCount < 2 && !homeWeakFeedRetryTimer && !document.hidden) {
          homeWeakFeedRetryTimer = setTimeout(() => {
            homeWeakFeedRetryTimer = null;
            homeWeakFeedRetryCount += 1;
            void initUniversalHome({ force: true });
          }, 1800);
        }

      scheduleHomeMenuCachePrime();
    }

    let landingExperienceInitialized = false;
    let landingPreviewHydrated = false;
    let landingReviewHydrated = false;
    let landingWallHydrated = false;
    let landingSavePromptTimer = null;
    const landingWallRowStates = new Map();
    const landingWallRowRotators = new Map();
    const landingReviewUsers = new Map();
    const landingReviewMeta = new Map();
    const LANDING_REVIEW_LIMIT = 6;
    const LANDING_WALL_SLOT_COUNT = 8;
    const LANDING_WALL_FALLBACK_GAMES = [
      { title: 'Portal 2', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/portal-2.jpg' },
      { title: 'Persona 5', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/persona-5.jpg' },
      { title: 'Titanfall 2', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/titanfall-2.jpg' },
      { title: 'The Witcher 3: Wild Hunt', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/the-witcher-3-wild-hunt.jpg' },
      { title: 'Red Dead Redemption 2', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/red-dead-redemption-2.jpg' },
      { title: 'Resident Evil Village', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/resident-evil-village.png' },
      { title: 'Sifu', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/sifu.jpg' },
      { title: 'Warframe', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/game-assets/covers-official/warframe.png' },
      { title: 'Hades', image: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg' },
      { title: 'Cyberpunk 2077', image: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg' },
      { title: 'Elden Ring', image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg' },
      { title: 'Baldur\'s Gate 3', image: 'https://upload.wikimedia.org/wikipedia/en/1/12/Baldur%27s_Gate_3_cover_art.jpg' }
    ];
    const LANDING_WALL_FALLBACK_LOGOS = {
      sports: [
        { title: 'Real Madrid', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/133738/real-madrid-badge.png' },
        { title: 'Arsenal', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/133604/arsenal-badge.png' },
        { title: 'Liverpool', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/133602/liverpool-badge.png' },
        { title: 'Los Angeles Lakers', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/134867/los-angeles-lakers-badge.png' },
        { title: 'Boston Celtics', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/134860/boston-celtics-badge.png' },
        { title: 'New York Yankees', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/135260/new-york-yankees-badge.png' },
        { title: 'Kansas City Chiefs', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/134931/kansas-city-chiefs-badge.png' },
        { title: 'Golden State Warriors', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/134865/golden-state-warriors-badge.png' }
      ],
      food: [
        { title: 'McDonald\'s', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/mcdonalds-com.svg' },
        { title: 'KFC', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/kfc-com.svg' },
        { title: 'Starbucks', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/starbucks-com.png' },
        { title: 'Taco Bell', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/tacobell-com.jpg' },
        { title: 'Burger King', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/burgerking-com.svg' },
        { title: 'Domino\'s', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/dominos-com.svg' },
        { title: 'Subway', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/subway-com.svg' },
        { title: 'Chipotle', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/chipotle-com.svg' },
        { title: 'Popeyes', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/popeyes-com.svg' },
        { title: 'Wendy\'s', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/wendys-com.svg' },
        { title: 'Pizza Hut', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/pizzahut-com.svg' },
        { title: 'Shake Shack', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/food_brands/shakeshack-com.svg' }
      ],
      fashion: [
        { title: 'Nike', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/nike-com.svg' },
        { title: 'Adidas', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/adidas-com.svg' },
        { title: 'Zara', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/zara-com.jpeg' },
        { title: 'Uniqlo', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/uniqlo-com.svg' },
        { title: 'H&M', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/hm-com.svg' },
        { title: 'Gucci', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/gucci-com.svg' },
        { title: 'Louis Vuitton', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/louisvuitton-com.svg' },
        { title: 'Prada', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/prada-com.svg' },
        { title: 'Dior', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/dior-com.svg' },
        { title: 'Chanel', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/chanel-com.svg' },
        { title: 'Burberry', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/burberry-com.svg' },
        { title: 'Supreme', image: 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/brand-logos/fashion_brands/supremenewyork-com.svg' }
      ]
    };
    const LANDING_REVIEW_SOURCES = [
      { mediaType: 'movie', table: 'movie_reviews', idField: 'movie_id' },
      { mediaType: 'tv', table: 'tv_reviews', idField: 'tv_id' },
      { mediaType: 'anime', table: 'anime_reviews', idField: 'anime_id' },
      { mediaType: 'game', table: 'game_reviews', idField: 'game_id' },
      { mediaType: 'book', table: 'book_reviews', idField: 'book_id' },
      { mediaType: 'music', table: 'music_reviews', idField: 'track_id' },
      { mediaType: 'travel', table: 'travel_reviews', idField: 'country_code' }
    ];

    function normalizeLandingImageUrl(value) {
      const raw = unwrapCloudflareImageUrl(String(value || '').trim());
      if (!raw) return '';
      if (raw.startsWith('//')) return `https:${raw}`;
      if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, 'https://');
      return raw;
    }

    function isRenderableLandingImage(value) {
      const normalized = normalizeLandingImageUrl(value);
      if (!normalized) return false;
      return !isLogoPlaceholder(normalized);
    }

    function getLandingWallTile(slot) {
      const key = String(slot || '').trim();
      if (!key) return null;
      return document.querySelector(`[data-wall-slot="${key}"] img`);
    }

    function getLandingWallFigure(slot) {
      const key = String(slot || '').trim();
      if (!key) return null;
      return document.querySelector(`[data-wall-slot="${key}"]`);
    }

    function getLandingWallSlots(prefix) {
      const base = String(prefix || '').trim();
      if (!base) return [];
      return Array.from({ length: LANDING_WALL_SLOT_COUNT }, (_value, index) => `${base}-${index + 1}`);
    }

    function getLandingWallVisibleCount() {
      return window.matchMedia && window.matchMedia('(max-width: 760px)').matches ? 4 : LANDING_WALL_SLOT_COUNT;
    }

    function isMobileLandingWall() {
      return Boolean(window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
    }

    function getLandingWallMinimumCount(kind) {
      if (isMobileLandingWall()) return kind === 'poster' ? 18 : 16;
      const visibleCount = getLandingWallVisibleCount();
      return kind === 'poster' ? visibleCount * 4 : visibleCount * 3;
    }

    function getLandingWallTrackCount(kind) {
      if (isMobileLandingWall()) return kind === 'poster' ? 18 : 16;
      return kind === 'poster' ? 18 : 14;
    }

    function getLandingWallEagerCount(kind) {
      if (isMobileLandingWall()) return kind === 'poster' ? 3 : 4;
      return kind === 'poster' ? 5 : 6;
    }

    function getLandingWallRow(prefix) {
      const key = String(prefix || '').trim();
      const existing = document.querySelector(`.landing-v4-wall-row[data-wall-prefix="${key}"]`);
      if (existing) return existing;
      const anchor = document.querySelector(`[data-wall-slot="${key}-1"]`);
      return anchor ? anchor.closest('.landing-v4-wall-row') : null;
    }

    function getLandingWallRowKind(prefix) {
      const key = String(prefix || '').trim().toLowerCase();
      return key === 'sports' || key === 'food' || key === 'fashion' ? 'logo' : 'poster';
    }

    function getLandingWallRowDirection(prefix) {
      const key = String(prefix || '').trim().toLowerCase();
      return key === 'tv' || key === 'game' || key === 'food' ? 'right' : 'left';
    }

    function buildLandingWallLoopEntries(entries, minimumCount) {
      const seed = Array.isArray(entries) ? entries.filter(Boolean) : [];
      if (!seed.length) return [];
      const targetCount = Math.max(Number(minimumCount) || 0, seed.length);
      const loop = [];
      while (loop.length < targetCount) {
        loop.push(...seed);
      }
      return loop.slice(0, targetCount);
    }

    function stopLandingWallRowRotation(prefix) {
      const key = String(prefix || '').trim();
      const existing = landingWallRowRotators.get(key);
      if (!existing) return;
      if (existing.interval) window.clearInterval(existing.interval);
      landingWallRowRotators.delete(key);
    }

    function startLandingWallRowRotation(_row, prefix) {
      stopLandingWallRowRotation(prefix);
    }

    function setLandingPosterBackground(figure, image) {
      if (!figure) return;
      const normalized = normalizeLandingImageUrl(image);
      if (!normalized) {
        figure.style.removeProperty('--landing-poster-image');
        return;
      }
      figure.style.setProperty('--landing-poster-image', `url("${String(normalized).replace(/"/g, '%22')}")`);
    }

    function setLandingLogoTileFallback(figure, label) {
      if (!figure) return;
      const cleanLabel = String(label || '').trim() || 'brand';
      figure.classList.add('landing-v4-tile--text-fallback');
      figure.setAttribute('data-logo-text', cleanLabel);
      const image = figure.querySelector('img');
      if (image) {
        image.style.visibility = 'hidden';
        image.style.opacity = '0';
      }
    }

    function clearLandingLogoTileFallback(figure) {
      if (!figure) return;
      figure.classList.remove('landing-v4-tile--text-fallback');
      figure.removeAttribute('data-logo-text');
      const image = figure.querySelector('img');
      if (image) {
        image.style.visibility = '';
        image.style.opacity = '';
      }
    }

    function looksLikeLandingPlaceholder(url) {
      const normalized = normalizeLandingImageUrl(url);
      if (!normalized) return true;
      return isLogoPlaceholder(normalized)
        || normalized.includes('logo-placeholder.svg')
        || normalized.includes('/newlogo.webp');
    }

    function buildLandingWallLogoEntry(input) {
      const source = input && typeof input === 'object'
        ? input
        : { title: String(input || '').trim() };
      const cleanTitle = String(source.title || '').trim();
      const cleanDomain = String(source.domain || '').trim();
      const preferred = normalizeLandingImageUrl(source.image || '');
      if (!cleanTitle) return null;
      return {
        image: preferred || `/api/logo?mode=logo&${cleanDomain ? `domain=${encodeURIComponent(cleanDomain)}` : `title=${encodeURIComponent(cleanTitle)}`}&size=256`,
        fallback: cleanDomain
          ? `/api/logo?mode=logo&title=${encodeURIComponent(cleanTitle)}&size=256`
          : '',
        alt: cleanTitle
      };
    }

    function dedupeLandingWallEntries(entries) {
      const deduped = [];
      const seen = new Set();
      (Array.isArray(entries) ? entries : []).forEach((entry) => {
        const image = normalizeLandingImageUrl(entry?.image || '');
        const fallback = normalizeLandingImageUrl(entry?.fallback || '');
        const alt = String(entry?.alt || '').trim();
        if (!isRenderableLandingImage(image)) return;
        const key = `${image}::${alt.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        deduped.push({ image, fallback, alt });
      });
      return deduped;
    }

    function buildLandingWallEntries(items) {
      return dedupeLandingWallEntries(
        filterHomeSafeItems(Array.isArray(items) ? items : []).map((item) => ({
          image: getLandingPreviewPoster(item),
          alt: String(item?.title || item?.name || '').trim()
        }))
      );
    }

    function mergeLandingWallEntries(primary, fallback) {
      return dedupeLandingWallEntries([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(fallback) ? fallback : [])]);
    }

    function animateLandingWallTile(slot, direction, index) {
      const tile = getLandingWallFigure(slot);
      if (!tile) return;
      const slideClass = direction === 'right' ? 'landing-v4-tile--slide-right' : 'landing-v4-tile--slide-left';
      tile.classList.remove('landing-v4-tile--slide-left', 'landing-v4-tile--slide-right');
      tile.style.setProperty('--landing-tile-delay', `${Math.min(Number(index) || 0, LANDING_WALL_SLOT_COUNT) * 32}ms`);
      void tile.offsetWidth;
      tile.classList.add(slideClass);
      if (tile.__landingSlideTimer) window.clearTimeout(tile.__landingSlideTimer);
      tile.__landingSlideTimer = window.setTimeout(() => {
        tile.classList.remove('landing-v4-tile--slide-left', 'landing-v4-tile--slide-right');
        tile.style.removeProperty('--landing-tile-delay');
      }, LANDING_WALL_ANIMATION_MS + 260);
    }

    function setLandingWallTile(slot, image, alt) {
      const node = getLandingWallTile(slot);
      const normalized = normalizeLandingImageUrl(image);
      if (!node || !isRenderableLandingImage(normalized)) return false;
      const figure = node.closest('.landing-v4-tile');
      if (!node.dataset.fallbackSrc) {
        node.dataset.fallbackSrc = String(node.getAttribute('src') || '').trim();
      }
      node.onload = () => {
        if (figure && figure.classList.contains('landing-v4-tile--logo')) {
          const current = String(node.currentSrc || node.src || '').trim();
          if (looksLikeLandingPlaceholder(current)) {
            setLandingLogoTileFallback(figure, alt);
          } else {
            clearLandingLogoTileFallback(figure);
          }
        }
      };
      node.onerror = () => {
        const fallback = normalizeLandingImageUrl(node.dataset.fallbackSrc || '');
        if (fallback && node.src !== fallback) {
          node.onerror = null;
          node.src = fallback;
          if (figure && figure.classList.contains('landing-v4-tile--poster')) {
            setLandingPosterBackground(figure, fallback);
          }
        } else if (figure && figure.classList.contains('landing-v4-tile--logo')) {
          setLandingLogoTileFallback(figure, alt);
        }
      };
      node.src = normalized;
      node.alt = String(alt || '').trim();
      node.loading = 'eager';
      node.decoding = 'async';
      node.referrerPolicy = 'no-referrer';
      if (figure && figure.classList.contains('landing-v4-tile--poster')) {
        setLandingPosterBackground(figure, normalized);
      }
      return true;
    }

    function createLandingWallTileFigure(entry, kind, eager = false) {
      const figure = document.createElement('figure');
      figure.className = kind === 'logo'
        ? 'landing-v4-tile landing-v4-tile--logo landing-v4-tile--light'
        : 'landing-v4-tile landing-v4-tile--poster';

      const img = document.createElement('img');
      const normalized = normalizeLandingImageUrl(entry?.image || '');
      const fallback = normalizeLandingImageUrl(entry?.fallback || '');
      img.src = normalized || fallback || '/images/landing-wall-poster.svg';
      img.alt = String(entry?.alt || '').trim();
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.loading = eager ? 'eager' : 'lazy';
      img.fetchPriority = eager ? 'high' : 'low';
      img.onload = () => {
        if (kind === 'logo') {
          const current = String(img.currentSrc || img.src || '').trim();
          if (looksLikeLandingPlaceholder(current)) {
            setLandingLogoTileFallback(figure, entry?.alt);
          } else {
            clearLandingLogoTileFallback(figure);
          }
        }
      };
      img.onerror = () => {
        if (fallback && img.src !== fallback) {
          img.onerror = null;
          img.src = fallback;
          if (kind === 'poster') setLandingPosterBackground(figure, fallback);
        } else if (kind === 'logo') {
          setLandingLogoTileFallback(figure, entry?.alt);
        }
      };
      figure.appendChild(img);

      const caption = document.createElement('figcaption');
      caption.textContent = kind === 'logo' ? 'logo' : 'poster';
      figure.appendChild(caption);

      if (kind === 'poster') {
        setLandingPosterBackground(figure, normalized || fallback);
      }

      return figure;
    }

    function renderLandingWallRowTrack(prefix, entries) {
      const row = getLandingWallRow(prefix);
      if (!row) return;

      const kind = getLandingWallRowKind(prefix);
      const direction = getLandingWallRowDirection(prefix);
      const minimumCount = getLandingWallMinimumCount(kind);
      const trackCount = getLandingWallTrackCount(kind);
      const eagerCount = getLandingWallEagerCount(kind);
      const baseEntries = dedupeLandingWallEntries(entries);
      if (!baseEntries.length) return;
      const displayEntries = baseEntries.slice(0, Math.max(minimumCount, Math.min(trackCount, baseEntries.length)));
      if (!displayEntries.length) return;

      row.dataset.rowKind = kind;
      row.dataset.direction = direction;
      row.dataset.wallPrefix = prefix;
      const rowDuration = isMobileLandingWall()
        ? (kind === 'poster' ? 48 : 42)
        : Math.max(38, displayEntries.length * (kind === 'poster' ? 4.6 : 4.0));
      row.style.setProperty('--landing-row-duration', `${rowDuration}s`);
      row.replaceChildren();

      const track = document.createElement('div');
      track.className = 'landing-v4-wall-track';
      const buildStrip = (sourceEntries, eager) => {
        const strip = document.createElement('div');
        strip.className = 'landing-v4-wall-strip';
        sourceEntries.forEach((entry, index) => {
          strip.appendChild(createLandingWallTileFigure(entry, kind, eager && index < eagerCount));
        });
        return strip;
      };

      const desktopEntries = buildLandingWallLoopEntries(baseEntries, Math.max(trackCount, minimumCount));
      track.appendChild(buildStrip(desktopEntries, true));
      track.appendChild(buildStrip(desktopEntries, false));
      row.appendChild(track);
      startLandingWallRowRotation(row, prefix);
    }

    function setLandingWallRowEntries(prefix, entries) {
      const normalized = dedupeLandingWallEntries(entries);
      if (!normalized.length) return;
      landingWallRowStates.set(prefix, { entries: normalized });
      renderLandingWallRowTrack(prefix, normalized);
    }

    async function hydrateLandingSetupWall() {
      if (landingWallHydrated) return;
      landingWallHydrated = true;
      const hasWallTargets = Boolean(getLandingWallTile('movie-1')
        || getLandingWallTile('tv-1')
        || getLandingWallTile('anime-1')
        || getLandingWallTile('game-1')
        || getLandingWallTile('sports-1'));
      if (!hasWallTargets) return;

      const updateWallRow = async (prefix, loader, fallbackEntries = []) => {
        let liveEntries = [];
        try {
          const result = await loader();
          liveEntries = buildLandingWallEntries(result);
        } catch (_error) {
          liveEntries = [];
        }
        const merged = mergeLandingWallEntries(liveEntries, fallbackEntries);
        if (merged.length) setLandingWallRowEntries(prefix, merged);
      };

      void updateWallRow('movie', () => loadMovies(null));
      void updateWallRow('tv', () => loadTv(null));
      void updateWallRow('anime', () => loadAnime(null));
      void updateWallRow(
        'game',
        () => loadGames(null),
        LANDING_WALL_FALLBACK_GAMES.map((entry) => ({
          image: entry.image,
          alt: entry.title
        }))
      );
      void updateWallRow(
        'sports',
        () => loadSports(null),
        LANDING_WALL_FALLBACK_LOGOS.sports.map(buildLandingWallLogoEntry)
      );
      void updateWallRow(
        'food',
        () => loadFoodBrands(),
        LANDING_WALL_FALLBACK_LOGOS.food.map(buildLandingWallLogoEntry)
      );
      void updateWallRow(
        'fashion',
        () => loadFashionBrands(),
        LANDING_WALL_FALLBACK_LOGOS.fashion.map(buildLandingWallLogoEntry)
      );
    }

    function truncateLandingText(value, maxLength = 120) {
      const normalized = String(value || '').replace(/\s+/g, ' ').trim();
      if (!normalized) return '';
      if (normalized.length <= maxLength) return normalized;
      return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
    }

    function getLandingBrowsePath(mediaType) {
      switch (String(mediaType || '').toLowerCase()) {
        case 'movie': return 'movies.html';
        case 'tv': return 'tvshows.html';
        case 'anime': return 'animes.html';
        case 'game': return 'games.html';
        case 'book': return 'books.html';
        case 'music': return 'music.html';
        case 'travel': return 'travel.html';
        case 'sports': return 'sports.html';
        case 'fashion': return 'fashion.html';
        case 'food': return 'food.html';
        case 'car': return 'cars.html';
        default: return 'index.html';
      }
    }

    function getLandingItemNextPath(item) {
      const href = String(item?.href || '').trim();
      return sanitizeHomeNextPath(href || getLandingBrowsePath(item?.mediaType));
    }

    function buildLandingAuthHref(nextPath = 'index.html') {
      const safeNext = sanitizeHomeNextPath(nextPath || 'index.html');
      return `sign-up.html?next=${encodeURIComponent(safeNext)}`;
    }

    function getLandingPreviewPoster(item) {
      if (!item || typeof item !== 'object') return '';
      const type = String(item.mediaType || '').toLowerCase();
      const cover = type === 'game'
        ? resolveHomeGameCover(item)
        : (type === 'book'
          ? (item.spotlightMediaImage || item.image || getBookCoverFallback(item))
          : (type === 'sports'
            ? (item.logo || item.badge || item.flagImage || item.image || item.spotlightMediaImage)
            : (item.spotlightMediaImage || item.image || item.listImage || item.logo || item.badge || item.flagImage)));
      const normalized = normalizeLandingImageUrl(cover);
      return isRenderableLandingImage(normalized) ? normalized : '';
    }

    function getLandingPreviewBackdrop(item) {
      if (!item || typeof item !== 'object') return '';
      const type = String(item.mediaType || '').toLowerCase();
      const backdrop = type === 'game'
        ? pickBackdropGameUrl([
          item.spotlightImage,
          item.backgroundImage,
          item.hero_url,
          item.hero,
          ...(Array.isArray(item?.screenshots) ? item.screenshots : [])
        ], getLandingPreviewPoster(item))
        : (type === 'travel'
          ? (item.spotlightImage || item.backgroundImage || getSafeTravelScenicImage(item.title, item.itemId, item.image))
          : (item.spotlightImage || item.backgroundImage || item.image || item.listImage));
      return normalizeLandingImageUrl(backdrop);
    }

    function getLandingPreviewMeta(item) {
      const meta = getHomeMediaMeta(item?.mediaType);
      const detail = String(item?.subtitle || item?.extra || '').trim();
      return truncateLandingText(detail || `${meta.label} pick from the live feed.`, 72);
    }

    function rotateLandingList(items, offset = 0) {
      const list = Array.isArray(items) ? items.filter(Boolean) : [];
      if (list.length <= 1) return list;
      const safeOffset = ((Number(offset) || 0) % list.length + list.length) % list.length;
      return list.slice(safeOffset).concat(list.slice(0, safeOffset));
    }

    function getLandingRailItems(items, offset = 0, limit = 10) {
      const rotated = rotateLandingList(items, offset);
      if (!rotated.length) return [];
      const preferred = [];
      const fallback = [];
      rotated.forEach((item) => {
        if (!item) return;
        if (isRenderableLandingImage(getLandingPreviewPoster(item))) preferred.push(item);
        else fallback.push(item);
      });
      return preferred.concat(fallback).slice(0, limit);
    }

    function buildLandingPreviewCard(item) {
      const safeItem = item && typeof item === 'object' ? item : {};
      const meta = getHomeMediaMeta(safeItem.mediaType);
      const nextPath = getLandingItemNextPath(safeItem);
      const href = buildLandingAuthHref(nextPath);
      const image = escapeHtml(getLandingPreviewPoster(safeItem) || HOME_IMAGE_PLACEHOLDER);
      const title = escapeHtml(String(safeItem.title || meta.label || 'Item').trim() || 'Item');
      const subtitle = escapeHtml(getLandingPreviewMeta(safeItem));
      return `
        <a class="landing-preview-card" href="${href}" data-auth-entry="signup" data-auth-next="${escapeHtml(nextPath)}" aria-label="Unlock ${title}">
          <div class="landing-preview-card-media">
            <img src="${image}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
          </div>
          <div class="landing-preview-card-body">
            <span class="landing-preview-card-label">${escapeHtml(meta.label)}</span>
            <strong class="landing-preview-card-title">${title}</strong>
            <span class="landing-preview-card-meta">${subtitle}</span>
          </div>
        </a>
      `;
    }

    function buildLandingReviewCard(item) {
      const safeItem = item && typeof item === 'object' ? item : {};
      const meta = getHomeMediaMeta(safeItem.mediaType);
      const image = escapeHtml(getLandingPreviewPoster(safeItem));
      const title = escapeHtml(String(safeItem.title || meta.label || 'Item').trim() || 'Item');
      const summary = escapeHtml(truncateLandingText(getSpotlightSummary(safeItem), 120) || 'Fresh signal from the live discovery engine.');
      return `
        <article class="landing-review-card">
          <div class="landing-review-card-head">
            <div class="landing-review-card-thumb">
              <img src="${image}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            </div>
            <div class="landing-review-card-meta">
              <span>${escapeHtml(meta.label)} review</span>
              <strong>${title}</strong>
            </div>
          </div>
          <p>${summary}</p>
        </article>
      `;
    }

    function wireLandingAuthNextLinks(scope = document) {
      if (!scope || typeof scope.querySelectorAll !== 'function') return;
      scope.querySelectorAll('[data-auth-next]').forEach((link) => {
        if (link.dataset.authNextWired === '1') return;
        link.dataset.authNextWired = '1';
        link.addEventListener('click', () => {
          const next = sanitizeHomeNextPath(link.getAttribute('data-auth-next') || 'index.html');
          localStorage.setItem('postAuthRedirect', next);
        });
      });
    }

    function hideLandingSavePrompt() {
      const prompt = document.getElementById('landingSavePrompt');
      if (!prompt) return;
      prompt.hidden = true;
      if (landingSavePromptTimer) {
        clearTimeout(landingSavePromptTimer);
        landingSavePromptTimer = null;
      }
    }

    function showLandingSavePrompt(message, nextPath = 'index.html') {
      const prompt = document.getElementById('landingSavePrompt');
      const text = document.getElementById('landingSavePromptText');
      const cta = document.getElementById('landingSavePromptCta');
      if (!prompt || !text || !cta) return;
      const safeNext = sanitizeHomeNextPath(nextPath || 'index.html');
      text.textContent = String(message || 'Sign up required to start saving titles, building lists, and shaping your feed.');
      cta.href = buildLandingAuthHref(safeNext);
      cta.setAttribute('data-auth-next', safeNext);
      prompt.hidden = false;
      wireLandingAuthNextLinks(prompt);
      if (landingSavePromptTimer) clearTimeout(landingSavePromptTimer);
      landingSavePromptTimer = window.setTimeout(() => {
        hideLandingSavePrompt();
      }, 4200);
    }

    function lockLandingRailInteractions(scope) {
      if (!scope) return;
      scope.querySelectorAll('.card').forEach((card) => {
        const nextPath = sanitizeHomeNextPath(card.getAttribute('data-href') || 'index.html');
        card.onclick = (event) => {
          if (event.target.closest('.card-menu-btn') || event.target.closest('.card-open-link') || event.target.closest('.card-preview-btn')) return;
          localStorage.setItem('postAuthRedirect', nextPath);
          window.location.href = buildLandingAuthHref(nextPath);
        };
      });

      scope.querySelectorAll('.card-menu-btn').forEach((btn) => {
        const replacement = btn.cloneNode(true);
        btn.replaceWith(replacement);
        replacement.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const card = replacement.closest('.card');
          const nextPath = sanitizeHomeNextPath(card?.getAttribute('data-href') || 'index.html');
          showLandingSavePrompt('Sign up required to start saving, building lists, and tracking your taste.', nextPath);
        });
      });

      scope.querySelectorAll('.card-open-link').forEach((link) => {
        const nextPath = sanitizeHomeNextPath(link.closest('.card')?.getAttribute('data-href') || 'index.html');
        link.setAttribute('href', buildLandingAuthHref(nextPath));
        link.setAttribute('data-auth-next', nextPath);
        link.removeAttribute('target');
        link.removeAttribute('rel');
      });

      wireLandingAuthNextLinks(scope);
    }

    function getLandingReviewKey(mediaType, itemId) {
      const media = String(mediaType || '').trim().toLowerCase();
      const id = String(itemId || '').trim();
      return media && id ? `${media}:${id}` : '';
    }

    function getLandingReviewFallbackMeta(row) {
      const mediaType = String(row?.mediaType || '').trim().toLowerCase();
      const itemId = String(row?.itemId || '').trim();
      const media = getHomeMediaMeta(mediaType);
      let href = getLandingBrowsePath(mediaType);
      if (itemId) {
        if (mediaType === 'movie') href = `movie.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'tv') href = `tvshow.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'anime') href = `anime.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'game') href = `game.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'book') href = `book.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'music') href = `song.html?id=${encodeURIComponent(itemId)}`;
        else if (mediaType === 'travel') href = `country.html?code=${encodeURIComponent(itemId.toUpperCase())}`;
      }
      return {
        title: media.label,
        subtitle: `${media.label} review`,
        image: '/newlogo.webp',
        href
      };
    }

    function getLandingReviewMeta(row) {
      return landingReviewMeta.get(getLandingReviewKey(row?.mediaType, row?.itemId)) || getLandingReviewFallbackMeta(row);
    }

    function getLandingReviewUserLabel(userId) {
      const profile = landingReviewUsers.get(String(userId || '').trim());
      if (!profile) return 'Zo2y member';
      if (profile.username) return `@${profile.username}`;
      return profile.fullName || 'Zo2y member';
    }

    async function fetchLandingReviewRows() {
      const client = await ensureHomeSupabase();
      if (!client) return [];
      const results = await Promise.allSettled(
        LANDING_REVIEW_SOURCES.map(async (source) => {
          const { data, error } = await client
            .from(source.table)
            .select(`id,user_id,rating,comment,created_at,${source.idField}`)
            .order('created_at', { ascending: false })
            .limit(5);
          if (error || !Array.isArray(data)) return [];
          return data
            .map((row) => {
              const itemId = String(row?.[source.idField] || '').trim();
              const comment = String(row?.comment || '').trim();
              if (!itemId || !comment) return null;
              return {
                id: `${source.mediaType}:${String(row?.id || itemId)}`,
                mediaType: source.mediaType,
                itemId,
                userId: String(row?.user_id || '').trim(),
                rating: Math.max(0, Math.min(5, Number(row?.rating || 0))),
                comment,
                createdAt: row?.created_at || ''
              };
            })
            .filter(Boolean);
        })
      );

      return results
        .flatMap((entry) => entry.status === 'fulfilled' ? entry.value : [])
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, LANDING_REVIEW_LIMIT);
    }

    async function loadLandingReviewUsers(rows) {
      const client = await ensureHomeSupabase();
      if (!client) return;
      const ids = [...new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.userId || '').trim()).filter(Boolean))];
      if (!ids.length) return;
      const { data, error } = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', ids);
      if (error || !Array.isArray(data)) return;
      data.forEach((row) => {
        const id = String(row?.id || '').trim();
        if (!id) return;
        landingReviewUsers.set(id, {
          username: String(row?.username || '').trim(),
          fullName: String(row?.full_name || '').trim()
        });
      });
    }

    async function hydrateLandingReviewLocalMeta(rows) {
      const client = await ensureHomeSupabase();
      if (!client) return;
      const safeRows = Array.isArray(rows) ? rows : [];
      const bookIds = [...new Set(safeRows.filter((row) => row.mediaType === 'book').map((row) => row.itemId).filter(Boolean))];
      const trackIds = [...new Set(safeRows.filter((row) => row.mediaType === 'music').map((row) => row.itemId).filter(Boolean))];

      if (bookIds.length) {
        const { data } = await client
          .from('books')
          .select('id,title,authors,thumbnail')
          .in('id', bookIds.slice(0, 40));
        (Array.isArray(data) ? data : []).forEach((row) => {
          const id = String(row?.id || '').trim();
          if (!id) return;
          landingReviewMeta.set(getLandingReviewKey('book', id), {
            title: String(row?.title || 'Book').trim(),
            subtitle: String(row?.authors || 'Book').trim(),
            image: normalizeLandingImageUrl(row?.thumbnail || '') || '/newlogo.webp',
            href: `book.html?id=${encodeURIComponent(id)}`
          });
        });
      }

      if (trackIds.length) {
        const { data } = await client
          .from('tracks')
          .select('id,name,artists,image_url,album_name')
          .in('id', trackIds.slice(0, 40));
        (Array.isArray(data) ? data : []).forEach((row) => {
          const id = String(row?.id || '').trim();
          if (!id) return;
          landingReviewMeta.set(getLandingReviewKey('music', id), {
            title: String(row?.name || 'Track').trim(),
            subtitle: String(row?.artists || row?.album_name || 'Music').trim(),
            image: normalizeLandingImageUrl(row?.image_url || '') || '/newlogo.webp',
            href: `song.html?id=${encodeURIComponent(id)}`
          });
        });
      }
    }

    async function fetchLandingReviewJson(url, timeoutMs = 8000) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let timer = null;
      try {
        if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: controller ? controller.signal : undefined
        });
        if (!response.ok) return null;
        return await response.json();
      } catch (_error) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    async function hydrateLandingReviewRemoteMeta(rows) {
      const uniqueRows = new Map();
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const key = getLandingReviewKey(row?.mediaType, row?.itemId);
        if (!key || uniqueRows.has(key)) return;
        uniqueRows.set(key, row);
      });

      const tasks = [...uniqueRows.values()].map(async (row) => {
        const mediaType = String(row?.mediaType || '').toLowerCase();
        const itemId = String(row?.itemId || '').trim();
        if (!itemId) return;

        if (mediaType === 'movie') {
          const json = await fetchLandingReviewJson(`/api/tmdb/movie/${encodeURIComponent(itemId)}?language=en-US`, 7000);
          if (!json?.title) return;
          landingReviewMeta.set(getLandingReviewKey('movie', itemId), {
            title: String(json.title || 'Movie').trim(),
            subtitle: String(json.release_date || '').slice(0, 4) || 'Movie',
            image: json.poster_path ? `${TMDB_POSTER}${json.poster_path}` : '/newlogo.webp',
            href: `movie.html?id=${encodeURIComponent(itemId)}`
          });
          return;
        }

        if (mediaType === 'tv' || mediaType === 'anime') {
          const json = await fetchLandingReviewJson(`/api/tmdb/tv/${encodeURIComponent(itemId)}?language=en-US`, 7000);
          if (!json?.name) return;
          landingReviewMeta.set(getLandingReviewKey(mediaType, itemId), {
            title: String(json.name || 'Series').trim(),
            subtitle: String(json.first_air_date || '').slice(0, 4) || (mediaType === 'anime' ? 'Anime' : 'TV Show'),
            image: json.poster_path ? `${TMDB_POSTER}${json.poster_path}` : '/newlogo.webp',
            href: `${mediaType === 'anime' ? 'anime' : 'tvshow'}.html?id=${encodeURIComponent(itemId)}`
          });
          return;
        }

        if (mediaType === 'game') {
          const json = await fetchLandingReviewJson(`/api/igdb/games/${encodeURIComponent(itemId)}`, 8000);
          if (!json?.name) return;
          landingReviewMeta.set(getLandingReviewKey('game', itemId), {
            title: String(json.name || 'Game').trim(),
            subtitle: String(json.released || '').slice(0, 4) || 'Game',
            image: normalizeLandingImageUrl(json.cover || json.hero || json.background_image || '') || '/newlogo.webp',
            href: `game.html?id=${encodeURIComponent(itemId)}`
          });
          return;
        }

        if (mediaType === 'travel') {
          const code = itemId.toUpperCase();
          const json = await fetchLandingReviewJson(`https://restcountries.com/v3.1/alpha?codes=${encodeURIComponent(code)}&fields=name,capital,region,flags`, 9000);
          const country = Array.isArray(json) ? json[0] : null;
          if (!country) return;
          const capital = Array.isArray(country?.capital) ? String(country.capital[0] || '').trim() : String(country?.capital || '').trim();
          landingReviewMeta.set(getLandingReviewKey('travel', code), {
            title: String(country?.name?.common || code).trim(),
            subtitle: [capital, String(country?.region || '').trim()].filter(Boolean).join(' | ') || 'Travel',
            image: normalizeLandingImageUrl(country?.flags?.png || country?.flags?.svg || '') || '/newlogo.webp',
            href: `country.html?code=${encodeURIComponent(code)}`
          });
        }
      });

      await Promise.allSettled(tasks);
    }

    function buildLandingLiveReviewCard(review) {
      const meta = getLandingReviewMeta(review);
      const media = getHomeMediaMeta(review?.mediaType);
      const title = escapeHtml(String(meta?.title || media.label || 'Item').trim() || 'Item');
      const subtitle = escapeHtml(String(meta?.subtitle || `${media.label} review`).trim() || `${media.label} review`);
      const image = escapeHtml(normalizeLandingImageUrl(meta?.image || '') || '/newlogo.webp');
      const comment = escapeHtml(truncateLandingText(review?.comment || 'Fresh review from the Zo2y community.', 180));
      const reviewer = escapeHtml(getLandingReviewUserLabel(review?.userId));
      const rating = Number(review?.rating || 0);
      const nextPath = sanitizeHomeNextPath(meta?.href || getLandingBrowsePath(review?.mediaType));
      return `
        <a class="landing-review-card" href="${buildLandingAuthHref(nextPath)}" data-auth-entry="signup" data-auth-next="${escapeHtml(nextPath)}" aria-label="Read ${title}">
          <div class="landing-review-card-head">
            <div class="landing-review-card-thumb">
              <img src="${image}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            </div>
            <div class="landing-review-card-meta">
              <div class="landing-review-card-topline">
                <span>${escapeHtml(media.label)} review</span>
                <span class="landing-review-card-user">${reviewer}</span>
                ${rating > 0 ? `<span class="landing-review-card-rating"><i class="fa-solid fa-star"></i>${rating.toFixed(1)}</span>` : ''}
              </div>
              <strong>${title}</strong>
              <span>${subtitle}</span>
            </div>
          </div>
          <p>${comment}</p>
        </a>
      `;
    }

    function renderLandingHeroStrip(items) {
      const strip = document.getElementById('landingHeroStrip');
      if (!strip) return;
      const safeItems = (Array.isArray(items) ? items : [])
        .filter((item) => item && isRenderableLandingImage(getLandingPreviewPoster(item)))
        .slice(0, 6);
      if (!safeItems.length) return;
      strip.innerHTML = safeItems.map((item) => {
        const nextPath = getLandingItemNextPath(item);
        const image = escapeHtml(getLandingPreviewPoster(item) || HOME_IMAGE_PLACEHOLDER);
        const title = escapeHtml(String(item?.title || 'Title').trim() || 'Title');
        return `
          <a class="landing-hero-poster" href="${buildLandingAuthHref(nextPath)}" data-auth-entry="signup" data-auth-next="${escapeHtml(nextPath)}" aria-label="Open ${title}">
            <img src="${image}" alt="${title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
          </a>
        `;
      }).join('');
      wireLandingAuthNextLinks(strip);
    }

    async function loadLandingLiveFeed() {
      const apiPayload = await fetchJsonWithPerfCache(HOME_PUBLIC_FEED_ENDPOINT, {
        cacheKey: 'landing-public-feed',
        ttlMs: 1000 * 30,
        timeoutMs: 3200,
        retries: 3
      });
      const apiFeed = normalizeHomeFeedMap(apiPayload?.feed);
      if (apiFeed && countActiveHomeChannels(apiFeed) > 0) {
        return {
          movie: filterHomeSafeItems(apiFeed.movie || []),
          tv: filterHomeSafeItems(apiFeed.tv || []),
          game: filterHomeSafeItems(apiFeed.game || [])
        };
      }
      const [movieRes, tvRes, gameRes] = await Promise.allSettled([
        loadMovies(null),
        loadTv(null),
        loadGames(null)
      ]);
      const toItems = (entry) => filterHomeSafeItems(entry?.status === 'fulfilled' ? entry.value : []);
      return {
        movie: toItems(movieRes),
        tv: toItems(tvRes),
        game: toItems(gameRes)
      };
    }

    async function hydrateLandingLiveReviews() {
      if (landingReviewHydrated) return;
      landingReviewHydrated = true;
      const reviewGrid = document.getElementById('landingPreviewReviews');
      if (!reviewGrid) return;

      const rows = await fetchLandingReviewRows();
      if (!rows.length) {
        reviewGrid.innerHTML = '<article class="landing-review-card"><p>Reviews will show up here as soon as the live feed responds.</p></article>';
        return;
      }

      await Promise.allSettled([
        loadLandingReviewUsers(rows),
        hydrateLandingReviewLocalMeta(rows),
        hydrateLandingReviewRemoteMeta(rows)
      ]);

      reviewGrid.innerHTML = rows.map((row) => buildLandingLiveReviewCard(row)).join('');
      wireLandingAuthNextLinks(reviewGrid);
    }

    function renderLandingFeedPreview(feedMap) {
      const normalized = normalizeHomeFeedMap(feedMap);
      if (!normalized || countActiveHomeChannels(normalized) === 0) return false;

      const movies = getLandingRailItems(normalized.movie, 1, 10);
      const games = getLandingRailItems(normalized.game, 2, 10);
      const tv = getLandingRailItems(normalized.tv, 3, 10);
      const sports = getLandingRailItems(normalized.sports, 3, 3);
      const heroStripItems = [
        ...movies.filter((item) => isRenderableLandingImage(getLandingPreviewPoster(item))).slice(0, 2),
        ...tv.filter((item) => isRenderableLandingImage(getLandingPreviewPoster(item))).slice(0, 2),
        ...games.filter((item) => isRenderableLandingImage(getLandingPreviewPoster(item))).slice(0, 2)
      ];
      renderLandingHeroStrip([
        ...heroStripItems
      ]);

      const spotlight = [
        ...movies.slice(0, 2),
        ...games.slice(0, 2),
        ...(Array.isArray(normalized.tv) ? rotateLandingList(normalized.tv, 1).slice(0, 1) : []),
        ...(Array.isArray(normalized.anime) ? rotateLandingList(normalized.anime, 2).slice(0, 1) : []),
        ...sports.slice(0, 1)
      ].find(Boolean) || Object.values(normalized).flat().find(Boolean);

      const spotlightLink = document.getElementById('landingPreviewSpotlightLink');
      const spotlightBackdrop = document.getElementById('landingPreviewSpotlightBackdrop');
      const spotlightPoster = document.getElementById('landingPreviewSpotlightPoster');
      const spotlightType = document.getElementById('landingPreviewSpotlightType');
      const spotlightTitle = document.getElementById('landingPreviewSpotlightTitle');
      const spotlightMeta = document.getElementById('landingPreviewSpotlightMeta');
      const spotlightSummary = document.getElementById('landingPreviewSpotlightSummary');

      if (spotlight && spotlightLink && spotlightBackdrop && spotlightPoster && spotlightType && spotlightTitle && spotlightMeta && spotlightSummary) {
        const nextPath = getLandingItemNextPath(spotlight);
        const meta = getHomeMediaMeta(spotlight.mediaType);
        const poster = getLandingPreviewPoster(spotlight);
        const backdrop = getLandingPreviewBackdrop(spotlight);
        spotlightLink.href = buildLandingAuthHref(nextPath);
        spotlightLink.setAttribute('data-auth-next', nextPath);
        spotlightType.textContent = meta.label;
        spotlightTitle.textContent = String(spotlight.title || `${meta.label} pick`).trim() || `${meta.label} pick`;
        spotlightMeta.textContent = getLandingPreviewMeta(spotlight);
        spotlightSummary.textContent = truncateLandingText(getSpotlightSummary(spotlight), 140) || 'Live pick from the Zo2y feed.';
        spotlightPoster.src = poster || HOME_IMAGE_PLACEHOLDER;
        spotlightPoster.alt = String(spotlight.title || meta.label || 'Item').trim() || meta.label;
        spotlightBackdrop.style.backgroundImage = backdrop
          ? `linear-gradient(90deg, rgba(6, 11, 27, 0.88) 0%, rgba(6, 11, 27, 0.58) 52%, rgba(6, 11, 27, 0.12) 100%), url("${String(backdrop).replace(/"/g, '%22')}")`
          : 'linear-gradient(90deg, rgba(6, 11, 27, 0.88) 0%, rgba(6, 11, 27, 0.58) 52%, rgba(6, 11, 27, 0.12) 100%), linear-gradient(150deg, rgba(14, 27, 60, 0.94), rgba(9, 17, 36, 0.9))';
      }

      renderRail('landingMoviesRail', movies, { mediaType: 'movie' });
      renderRail('landingGamesRail', games, { mediaType: 'game' });
      renderRail('landingTvRail', tv, { mediaType: 'tv' });
      lockLandingRailInteractions(document.getElementById('landingMoviesRail'));
      lockLandingRailInteractions(document.getElementById('landingGamesRail'));
      lockLandingRailInteractions(document.getElementById('landingTvRail'));
      wireLandingAuthNextLinks(document.getElementById('landingAppShell'));
      return true;
    }

    async function hydrateLandingFeedPreview() {
      if (landingPreviewHydrated) return;
      landingPreviewHydrated = true;
      const hasLandingPreviewTargets =
        !!document.getElementById('landingPreviewSpotlightLink') ||
        !!document.getElementById('landingHeroStrip') ||
        !!document.getElementById('landingMoviesRail') ||
        !!document.getElementById('landingGamesRail') ||
        !!document.getElementById('landingTvRail');
      if (!hasLandingPreviewTargets) return;
      let rendered = false;
      let feed = null;
      try {
        feed = await loadPrecomputedHomeFeed();
      } catch (_err) {}
      if (!feed || countActiveHomeChannels(feed) === 0) {
        feed = readHomeFeedCache() || readPrecomputedHomeFeedCache();
      }
      if (feed && countActiveHomeChannels(feed) > 0) {
        rendered = renderLandingFeedPreview(feed);
      }

      try {
        const liveFeed = await loadLandingLiveFeed();
        if (countActiveHomeChannels(liveFeed) > 0) {
          renderLandingFeedPreview(liveFeed);
          rendered = true;
        }
      } catch (_err) {}

      if (!rendered) {
        renderLandingFeedPreview(feed || {});
      }
    }

    function initLandingExperience() {
      if (landingExperienceInitialized) return;
      landingExperienceInitialized = true;
      document.body?.classList.add('landing-mode');
      const authNotice = document.getElementById('landingAuthNotice');
      const revealNodes = Array.from(document.querySelectorAll('[data-landing-reveal]'));
      const params = new URLSearchParams(window.location.search || '');
      const authRequired = params.get('auth') === 'required';
      const savePromptDismiss = document.getElementById('landingSavePromptDismiss');
      const savePromptClose = document.getElementById('landingSavePromptClose');

      if (authRequired && authNotice) {
        authNotice.hidden = false;
        authNotice.textContent = 'Sign in to continue into Zo2y.';
      }

      void ensureHomeHeavyLoaders().catch(() => {});

      document.querySelectorAll('[data-auth-entry]').forEach((link) => {
        link.addEventListener('click', () => {
          localStorage.setItem('postAuthRedirect', 'index.html');
        });
      });

      savePromptDismiss?.addEventListener('click', hideLandingSavePrompt);
      savePromptClose?.addEventListener('click', hideLandingSavePrompt);

      wireLandingAuthNextLinks(document);
      void hydrateLandingSetupWall();
      void hydrateLandingFeedPreview();
      void hydrateLandingLiveReviews();

      if (!revealNodes.length || typeof window.IntersectionObserver !== 'function') {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

      revealNodes.forEach((node, index) => {
        if (index === 0) {
          node.classList.add('is-visible');
          return;
        }
        observer.observe(node);
      });
    }

    function initLandingMascot() {
      const hero = document.querySelector('.landing-hero');
      const mascot = document.getElementById('landingMascot');
      const shell = mascot?.querySelector?.('.landing-mascot-shell');
      if (!hero || !mascot || !shell || mascot.dataset.wired === '1') return;
      mascot.dataset.wired = '1';

      let moveFrame = 0;
      const applyPointer = (clientX, clientY) => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = ((clientX - rect.left) / rect.width) - 0.5;
        const py = ((clientY - rect.top) / rect.height) - 0.5;
        const offsetX = Math.max(-14, Math.min(14, px * 28));
        const offsetY = Math.max(-10, Math.min(10, py * 20));
        const tilt = Math.max(-6, Math.min(6, px * 12));
        shell.style.setProperty('--landing-mascot-x', `${offsetX.toFixed(1)}px`);
        shell.style.setProperty('--landing-mascot-y', `${offsetY.toFixed(1)}px`);
        shell.style.setProperty('--landing-mascot-tilt', `${tilt.toFixed(1)}deg`);
      };
      const resetPointer = () => {
        shell.style.setProperty('--landing-mascot-x', '0px');
        shell.style.setProperty('--landing-mascot-y', '0px');
        shell.style.setProperty('--landing-mascot-tilt', '0deg');
      };
      const queuePointerUpdate = (clientX, clientY) => {
        if (moveFrame) cancelAnimationFrame(moveFrame);
        moveFrame = requestAnimationFrame(() => {
          moveFrame = 0;
          applyPointer(clientX, clientY);
        });
      };

      hero.addEventListener('pointermove', (event) => {
        queuePointerUpdate(event.clientX, event.clientY);
      });
      hero.addEventListener('pointerleave', resetPointer);
      hero.addEventListener('touchmove', (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        queuePointerUpdate(touch.clientX, touch.clientY);
      }, { passive: true });
      hero.addEventListener('touchend', resetPointer, { passive: true });

      const blink = () => {
        mascot.classList.add('is-blinking');
        window.setTimeout(() => mascot.classList.remove('is-blinking'), 120);
        window.setTimeout(blink, 2300 + Math.round(Math.random() * 1900));
      };
      window.setTimeout(blink, 1200);
      resetPointer();
    }

    let homeAppBootPromise = null;
    function scheduleHomeNonCritical(task, timeoutMs = 900) {
      if (typeof task !== 'function') return;
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => task(), { timeout: timeoutMs });
        return;
      }
      window.setTimeout(task, 0);
    }

    function bootAuthenticatedHome() {
      if (homeAppBootPromise) return homeAppBootPromise;
      homeAppBootPromise = (async () => {
        await setupHomeAuthListener();
        await completeHomeOAuthReturnIfNeeded();
        await initAuthUi();
        const bootstrapApplied = await finishPendingPostAuthBootstrap();
        if ((bootstrapApplied || isOnboardingPending(homeCurrentUser?.id)) && !hasSeenOnboarding(homeCurrentUser?.id)) {
          void maybeShowHomeOnboarding();
        }
        await initUniversalHome();
        scheduleDeferredHomeStartupTasks();
      })().catch((error) => {
        homeAppBootPromise = null;
        throw error;
      });
      return homeAppBootPromise;
    }

    document.addEventListener('DOMContentLoaded', () => {
      const authGateState = getHomeAuthGateState();
      if (authGateState?.authShell === 'landing' && authGateState?.verified && !authGateState?.authenticated) {
        initLandingExperience();
      } else if (authGateState?.authShell === 'app' && authGateState?.authenticated) {
        void bootAuthenticatedHome().catch((error) => {
          console.error('Home boot failed:', error);
          setStatus('Could not load your home feed right now. Please refresh.', true);
        });
      }

      window.addEventListener('zo2y-auth-gate-verified', (event) => {
        const authenticated = !!event?.detail?.authenticated;
        if (authenticated) {
          document.body?.classList.remove('landing-mode');
          void bootAuthenticatedHome().catch((error) => {
            console.error('Home boot failed after auth verification:', error);
            setStatus('Could not load your home feed right now. Please refresh.', true);
          });
          return;
        }
        initLandingExperience();
      });

      void ensureHomeHeavyLoaders().catch(() => {});

      const itemMenuModal = document.getElementById('itemMenuModal');
      const createListModal = document.getElementById('createListModal');
      const nextSpotlightBtn = document.getElementById('spotlightNextBtn');
      const spotlightSection = document.getElementById('spotlightSection');
      const popularGamesRefreshBtn = document.getElementById('popularGamesRefreshBtn');

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

      if (popularGamesRefreshBtn) {
        popularGamesRefreshBtn.addEventListener('click', () => {
          popularGamesRefreshBtn.disabled = true;
          refreshHomeGamesRail()
            .catch(() => {})
            .finally(() => {
              popularGamesRefreshBtn.disabled = false;
            });
        });
      }

      if (nextSpotlightBtn) {
        nextSpotlightBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
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

      scheduleHomeNonCritical(() => {
        if (!window.initUniversalSearch) return;
        window.initUniversalSearch({
          input: '#globalSearch',
          fallbackRoute: 'movies.html'
        });
        window.initUniversalSearch({
          input: '#sidebarSearch',
          fallbackRoute: 'movies.html'
        });
        const sidebarInput = document.getElementById('sidebarSearch');
        const sidebarBtn = document.getElementById('sidebarSearchBtn');
        if (sidebarInput && sidebarBtn && sidebarBtn.dataset.wired !== '1') {
          sidebarBtn.dataset.wired = '1';
          sidebarBtn.addEventListener('click', () => {
            sidebarInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          });
        }

        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch && !globalSearch.dataset.gamesRailBound) {
          globalSearch.dataset.gamesRailBound = '1';
          globalSearch.addEventListener('input', toggleHomeGamesRailForSearch);
          globalSearch.addEventListener('blur', toggleHomeGamesRailForSearch);
          globalSearch.addEventListener('focus', toggleHomeGamesRailForSearch);
          toggleHomeGamesRailForSearch();
        }
      }, 1400);

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







