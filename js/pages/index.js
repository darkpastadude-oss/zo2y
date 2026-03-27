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
    const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
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
    const HOME_FEED_CACHE_KEY = 'zo2y_home_feed_cache_v12';
    const HOME_FEED_CACHE_MAX_AGE_MS = 1000 * 60 * 30;
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
    const HOME_CHANNEL_TIMEOUT_MS = 4200;
    const HOME_BOOKS_FETCH_TIMEOUT_MS = 1200;
    const HOME_LOCAL_FALLBACK_IMAGE = '/newlogo.webp';
    const SPOTLIGHT_ROTATE_MS = 5000;
    const HOME_CHANNEL_TARGET_ITEMS = 16;
    const HOME_SPOTLIGHT_POOL_SIZE = 20;
    const HOME_NEW_RELEASES_TARGET_ITEMS = 16;
    const HOME_NEW_RELEASES_TIMEOUT_MS = 5600;
    const HOME_NEW_RELEASES_REFRESH_MS = 1000 * 60 * 12;
const HOME_EAGER_IMAGE_COUNT = 1;
const HOME_HIGH_PRIORITY_IMAGE_COUNT = 1;
    const HOME_PRELOAD_PER_CHANNEL = 0;
    const HOME_PRELOAD_SPOTLIGHT_COUNT = 1;
    const HOME_UNIFIED_TARGET_ITEMS = 24;
    const HOME_BECAUSE_SIGNAL_CACHE_MS = 1000 * 60 * 3;
    const HOME_BECAUSE_MAX_FOLLOWED_USERS = 24;
    const HOME_BECAUSE_SIGNAL_RECENCY_HOURS = 24 * 21;
    const HOME_MENU_PRIME_IDLE_DELAY_MS = 2500;
    const HOME_ONBOARDING_VERSION = 'v1';
    const HOME_POST_AUTH_BOOTSTRAP_KEY = 'zo2y_post_auth_bootstrap_v1';
    const PROFILE_USERNAME_MAX_LENGTH = 30;
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
    let homeSpotlightTimer = null;
    let homeSpotlightItems = [];
    let homeSpotlightIndex = 0;
    let homeSpotlightImageToken = 0;
    let homeOnboardingIndex = 0;
    let homeOnboardingUserId = null;
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
        try {
          const response = await fetch(HOME_BRAND_BACKGROUND_MANIFEST_URL, {
            signal,
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) return null;
          const payload = await response.json();
          homeBrandBackgroundManifest = normalizeHomeBrandBackgroundManifest(payload);
          return homeBrandBackgroundManifest;
        } catch (_err) {
          return null;
        } finally {
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
      const title = String(row?.name || row?.title || '').trim();
      const domainRaw = String(row?.domain || '').trim();
      const logoOnly = ['fashion', 'food', 'car'].includes(String(mediaType || '').toLowerCase());
      if (title) {
        const params = new URLSearchParams();
        params.set('title', title);
        if (domainRaw) params.set('domain', domainRaw);
        if (logoOnly) params.set('mode', 'logo');
        return `/api/logo?${params.toString()}`;
      }
      const candidate = domainRaw;
      if (!candidate) return '';
      if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate)) {
        return `/api/logo?domain=${encodeURIComponent(candidate)}&size=128${logoOnly ? '&mode=logo' : ''}`;
      }
      if (/^https?:\/\//i.test(candidate)) {
        const match = candidate.match(/\/\/([^\/\?]+)/i);
        if (match && match[1]) return `/api/logo?domain=${encodeURIComponent(match[1])}&size=128${logoOnly ? '&mode=logo' : ''}`;
        return candidate;
      }
      return '';
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
      const reason = document.getElementById('spotlightReason');
      const trend = document.getElementById('spotlightTrend');
      const openBtn = document.getElementById('spotlightOpenBtn');
      const spotlightInner = document.getElementById('spotlightInner');
      if (!bg || !spotlightSection || !mediaWrap || !mediaImage || !title || !kicker || !summary || !reason || !trend || !openBtn) return;

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
      const fallbackItems = filterHomeSafeItems(buildNewReleasesFallback(feedMap));

      if (homeNewReleasesState.length) {
        renderOrDeferHomeRail('newReleasesRail', filterHomeSafeItems(homeNewReleasesState), railOptions);
      } else if (fallbackItems.length) {
        renderOrDeferHomeRail('newReleasesRail', fallbackItems, railOptions);
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
        } else if (!homeNewReleasesState.length && fallbackItems.length) {
          renderOrDeferHomeRail('newReleasesRail', fallbackItems, railOptions);
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
      const fallbackItems = buildUnifiedFeed(localPool, getHomeUnifiedTargetItems());

      if (!homeCurrentUser?.id) {
        renderOrDeferHomeRail('unifiedRail', fallbackItems, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
        return;
      }

      const signalPayload = await getActivitySignalsCached();
      if (seq !== homeBecauseRefreshSeq) return;
      const boostedPool = applyActivitySignalsToPool(localPool, signalPayload);
      const unified = buildUnifiedFeed(boostedPool, getHomeUnifiedTargetItems());
      renderOrDeferHomeRail('unifiedRail', unified.length ? unified : fallbackItems, {
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
      return weights;
    }

    async function ensureHomeSupabase() {
      if (homeSupabaseClient) return homeSupabaseClient;
      if (window.__ZO2Y_SUPABASE_CLIENT) {
        homeSupabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
        return homeSupabaseClient;
      }
      if (!window.supabase || !window.supabase.createClient) return null;
      homeSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
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
        movie: makeSeedItems('movie', ['Popular Movies', 'Now in Theaters', 'Award Winners', 'Critics Picks', 'Weekend Watch'], 'movies.html'),
        tv: makeSeedItems('tv', ['Top TV Shows', 'Binge Picks', 'New Seasons', 'Global Hits', 'Fan Favorites'], 'tvshows.html'),
        anime: makeSeedItems('anime', ['Top Anime', 'Fan Favorites', 'Must Watch Series', 'Shonen Hits', 'Classic Anime'], 'animes.html'),
        ...(ENABLE_GAMES ? {
          game: makeSeedItems('game', ['Top Games', 'New Releases', 'Community Picks', 'Multiplayer Hits', 'Story Games'], 'games.html')
        } : {}),
        music: makeSeedItems('music', ['Global Hits', 'Viral Tracks', 'Fresh Releases', 'Chill Vibes', 'Late Night Mix'], 'music.html'),
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

    function getHomeRailFallbackItems(channelKey) {
      const key = String(channelKey || '').trim();
      if (!key) return [];
      const fallbackFeed = buildInstantFallbackFeed();
      const items = Array.isArray(fallbackFeed?.[key]) ? fallbackFeed[key] : [];
      return items.filter(Boolean);
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
        ...(ENABLE_FASHION ? [{ key: 'fashion', railId: 'fashionRail', loader: loadFashionBrands, opts: { mediaType: 'fashion' }, timeoutMs: 6200 }] : []),
        ...(ENABLE_FOOD ? [{ key: 'food', railId: 'foodRail', loader: loadFoodBrands, opts: { mediaType: 'food' }, timeoutMs: 6200 }] : []),
        ...(ENABLE_CARS ? [{ key: 'car', railId: 'carRail', loader: loadCarBrands, opts: { mediaType: 'car' }, timeoutMs: 6200 }] : []),
        { key: 'travel', railId: 'travelRail', loader: loadTravel, opts: { mediaType: 'travel' }, timeoutMs: 6800 },
        { key: 'sports', railId: 'sportsRail', loader: loadSports, opts: { mediaType: 'sports', landscape: false }, timeoutMs: 6800 }
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
      const list = Array.isArray(channels) ? channels : [];
      if (isHomeSlowNetwork()) return list.slice(0, 2);
      if (isHomeCompactViewport()) return list.slice(0, 3);
      return list.slice(0, 4);
    }

    function getHomeInitialChannelConcurrency() {
      if (isHomeSlowNetwork()) return 1;
      if (isHomeCompactViewport()) return 2;
      return 3;
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
      homePendingRailRenderState.delete(key);
      clearHomeRailDeferredPlaceholder(key);
      renderRail(key, Array.isArray(items) ? items : [], opts || {});
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
      const fallbackItems = filterHomeSafeItems(
        homeNewReleasesState.length ? homeNewReleasesState : buildNewReleasesFallback(feedMap)
      );
      renderOrDeferHomeRail('newReleasesRail', fallbackItems, railOptions);
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

    function applyHomeFeedMap(feedMap, options = {}) {
      const normalizedFeed = normalizeHomeFeedMap(feedMap) || Object.fromEntries(
        getHomeChannels().map((channel) => [channel.key, []])
      );
      const channels = getHomeChannels();
      resetHomeImageRequestBudget();
      warmHomeFeedImages(normalizedFeed);
      let activeChannels = 0;
      channels.forEach((channel) => {
        const items = Array.isArray(normalizedFeed?.[channel.key]) ? normalizedFeed[channel.key] : [];
        const railItems = items.length ? items : getHomeRailFallbackItems(channel.key);
        homeFeedState[channel.key] = items;
        renderOrDeferHomeRail(channel.railId, railItems, channel.opts);
        if (items.length) activeChannels += 1;
      });

      const scoredPool = buildScoredDiscoveryPool(homeFeedState);
      const unified = buildUnifiedFeed(scoredPool, getHomeUnifiedTargetItems());
      renderOrDeferHomeRail('unifiedRail', unified, { mediaType: 'mixed', uniformMedia: true, restaurantComposite: true });
      if (options.refreshSecondary !== false) {
        scheduleHomeNewReleasesRefresh(homeFeedState);
        scheduleHomeMixedRefresh(homeFeedState, scoredPool);
      }
      hydrateSpotlightFromPool(scoredPool);

      return { activeChannels, scoredPool, channelsCount: channels.length };
    }

    async function refreshHomePersonalization() {
      const hasItems = Object.values(homeFeedState).some((items) => Array.isArray(items) && items.length);
      if (!hasItems) return;
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
        const fallbackImage = escapeHtml(itemData.fallbackImage || '');
        const safeImage = image || listImage || (mediaTypeRaw === 'travel' ? fallbackImage : '');
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
        if (mediaTypeRaw === 'fashion' || mediaTypeRaw === 'food' || mediaTypeRaw === 'car') mediaClasses.push('brand-cover');
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

    const BRAND_RAIL_MEDIA_TYPES = new Set(['fashion', 'food', 'car']);
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
          if (!card) return;
          const rail = card.parentElement;
          card.remove();
          if (rail && !rail.querySelector('.card')) {
            rail.innerHTML = '<div class="empty">No items right now.</div>';
          }
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
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-flex';
        if (mobileSignupBtn) mobileSignupBtn.style.display = 'inline-flex';
        if (profileBtn) profileBtn.style.display = 'none';
        if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
        if (sidebarProfileBtn) sidebarProfileBtn.style.display = 'none';
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

    function buildHomeInterestOptionsMarkup(kind = '') {
      const filtered = HOME_INTEREST_OPTIONS.filter((option) => !kind || option.kind === kind);
      return filtered.map((option) => `
        <button type="button" class="onboarding-chip" data-interest-id="${escapeHtml(option.id)}" data-interest-kind="${escapeHtml(option.kind)}">
          ${escapeHtml(option.label)}
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

      const metadata = homeCurrentUser.user_metadata || {};
      const emailPrefix = String(homeCurrentUser.email || '').split('@')[0] || 'user';
      const baseSeed = normalizeProfileUsername(
        metadata.username ||
        metadata.preferred_username ||
        metadata.full_name ||
        metadata.name ||
        emailPrefix ||
        'user'
      ) || 'user';
      const suffixSeed = String(homeCurrentUser.id || '').replace(/-/g, '').slice(0, 6) || 'user';
      let username = '';
      try {
        username = await ensureHomeUsernameAvailable(baseSeed, homeCurrentUser.id);
      } catch (_baseErr) {
        try {
          username = await ensureHomeUsernameAvailable(`${baseSeed.slice(0, 22)}_${suffixSeed}`, homeCurrentUser.id);
        } catch (_suffixErr) {
          username = `${baseSeed.slice(0, 22)}_${suffixSeed}`.slice(0, PROFILE_USERNAME_MAX_LENGTH);
        }
      }
      const fullName = String(metadata.full_name || metadata.name || emailPrefix || username).trim().slice(0, 80);

      const { data: createdProfile, error: createError } = await client
        .from('user_profiles')
        .insert({
          id: homeCurrentUser.id,
          username,
          full_name: fullName || null
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
        await ensureHomeProfileSeeded();
        localStorage.setItem(getOnboardingPendingKey(homeCurrentUser.id), '1');
        clearPendingHomePostAuthBootstrap();
        const client = await ensureHomeSupabase();
        const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } };
        void triggerHomeWelcomeEmail(sessionData?.session || null, String(pending?.flow || 'signup'));
        return true;
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

    function getHomeOnboardingSteps() {
      return [
        {
          id: 'welcome',
          title: 'Welcome to Zo2y',
          body: 'A quick tour to personalize your feed, save to lists, and keep everything in one clean profile.',
            art: `
              <div class="onboarding-photo-grid">
                <img src="/images/onboarding/onboard-media.svg" alt="Media mix" loading="lazy">
                <img src="/images/onboarding/onboard-food.svg" alt="Food finds" loading="lazy">
                <img src="/images/onboarding/onboard-travel.svg" alt="Travel spots" loading="lazy">
                <img src="/images/onboarding/onboard-fashion.svg" alt="Fashion brands" loading="lazy">
              </div>
              <div class="onboarding-photo-caption">Save what you love across fashion, food, travel, movies, music, and more.</div>
            `,
          actionLabel: null,
          action: null
        },
        {
          id: 'username-setup',
          title: 'Claim Your Username',
          body: 'Pick a unique @username. This is your profile link everywhere on Zo2y.',
          art: `
            <div class="onboarding-split">
                <div class="onboarding-photo-card">
                  <div class="onboarding-photo-frame">
                    <img src="/images/onboarding/onboard-profile.svg" alt="Profile preview" loading="lazy">
                  </div>
                  <div class="onboarding-photo-meta">
                  <span class="photo-label">Profile preview</span>
                  <strong>@yourname</strong>
                  <span>Your lists and reviews live here.</span>
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
          id: 'interests-setup',
          title: 'Tune Your Feed',
          body: 'Choose formats and genres so the ï¿½For Youï¿½ feed starts on the right note.',
          art: `
              <div class="onboarding-interest-layout">
                <div class="onboarding-interest-photos">
                  <div class="onboarding-photo-grid compact">
                    <img src="/images/onboarding/onboard-interests.svg" alt="Interest picks" loading="lazy">
                    <img src="/images/onboarding/onboard-media.svg" alt="Media formats" loading="lazy">
                    <img src="/images/onboarding/onboard-fashion.svg" alt="Fashion vibes" loading="lazy">
                    <img src="/images/onboarding/onboard-food.svg" alt="Food finds" loading="lazy">
                  </div>
                  <div class="onboarding-photo-caption">Pick what you want more of. You can edit this later.</div>
                </div>
              <div class="onboarding-interest-panel">
                <div class="onboarding-label">Formats</div>
                <div class="onboarding-chip-grid">
                  ${buildHomeInterestOptionsMarkup('type')}
                </div>
                <div class="onboarding-label">Genres & Vibes</div>
                <div class="onboarding-chip-grid">
                  ${buildHomeInterestOptionsMarkup('tag')}
                </div>
                <div id="homeOnboardingInterestStatus" class="onboarding-status">Pick at least one interest to continue.</div>
              </div>
            </div>
          `,
          nextLabel: 'Save Interests',
          requiresSave: true
        },
        {
          id: 'lists',
          title: 'Add Places To Lists',
          body: 'On any card, tap the three-dot menu. Use quick list buttons, or choose Custom Lists to organize it your way.',
          art: `
              <div class="onboarding-illustration">
                <div class="mini-card">
                  <div class="mini-photo">
                    <img src="/images/onboarding/onboard-food.svg" alt="List demo" loading="lazy">
                  </div>
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
          id: 'custom-lists',
          title: 'Create Your Own Lists',
          body: 'In the Custom Lists modal, enter a list name, pick an icon, then press Create.',
          art: `
              <div class="onboarding-illustration">
                <div class="mini-card">
                  <div class="mini-photo">
                    <img src="/images/onboarding/onboard-fashion.svg" alt="Custom list demo" loading="lazy">
                  </div>
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
          id: 'profile',
          title: 'View Your Profile',
          body: 'Head to your profile to see every list, rating, and save in one place.',
          art: `
              <div class="onboarding-illustration">
                <div class="mini-card">
                  <div class="mini-photo">
                    <img src="/images/onboarding/onboard-profile.svg" alt="Profile overview" loading="lazy">
                  </div>
                <div class="friend-row"><span><i class="fas fa-user-circle"></i> Your lists</span><span class="friend-pill">Open</span></div>
                <div class="friend-row"><span><i class="fas fa-star"></i> Reviews</span><span class="friend-pill">View</span></div>
                <div class="friend-row"><span><i class="fas fa-heart"></i> Favorites</span><span class="friend-pill">See all</span></div>
              </div>
            </div>
          `,
          actionLabel: 'Go To My Profile',
          action: () => {
            closeHomeOnboarding(true);
            window.location.href = 'index.html';
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
              width: min(760px, 96vw);
              background:
                radial-gradient(circle at top left, rgba(245,158,11,0.18), transparent 45%),
                radial-gradient(circle at 85% 20%, rgba(59,130,246,0.22), transparent 48%),
                linear-gradient(180deg, rgba(15,30,61,0.98), rgba(8,18,42,0.98));
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 16px;
              box-shadow: 0 30px 80px rgba(0,0,0,0.45);
              padding: 24px;
              color: #fff;
              display: flex;
              flex-direction: column;
              gap: 12px;
              max-height: min(92vh, 860px);
              overflow: auto;
              overscroll-behavior: contain;
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
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
            gap: 18px;
            align-items: start;
          }
          .onboarding-interest-panel {
            background: rgba(10,20,40,0.65);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 14px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .onboarding-interest-panel .onboarding-chip-grid {
            max-height: 170px;
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
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .onboarding-chip {
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 12px;
            color: rgba(226,236,255,0.8);
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255,255,255,0.12);
            cursor: pointer;
          }
          .onboarding-chip:hover {
            border-color: rgba(255,255,255,0.3);
          }
          .onboarding-chip.selected {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(249, 115, 22, 0.35));
            border-color: rgba(245, 158, 11, 0.75);
            color: #fff7ed;
          }
            .home-onboarding-art {
              margin-top: 4px;
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 14px;
              padding: 14px;
              background: linear-gradient(145deg, rgba(14,28,58,0.9), rgba(8,18,42,0.9));
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
              gap: 8px;
              box-shadow: 0 18px 46px rgba(0,0,0,0.4);
            }
            .home-onboarding-top {
              margin-bottom: 4px;
              font-size: 11px;
            }
            .home-onboarding-title {
              font-size: 20px;
              margin: 0 0 4px;
            }
            .home-onboarding-body {
              font-size: 13px;
              line-height: 1.45;
              min-height: 0;
            }
            .home-onboarding-art {
              padding: 10px;
              min-height: 0;
            }
            .home-onboarding-actions {
              position: sticky;
              bottom: 0;
              padding-top: 10px;
              background: linear-gradient(180deg, rgba(8,18,42,0) 0%, rgba(8,18,42,0.9) 35%, rgba(8,18,42,0.98) 100%);
              margin-top: auto;
            }
            .home-onboarding-left,
            .home-onboarding-right {
              flex: 1;
            }
            .home-onboarding-right {
              justify-content: flex-end;
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
              max-height: 220px;
              overflow-y: auto;
            }
            .onboarding-chip {
              width: 100%;
              text-align: center;
              padding: 9px 10px;
              font-size: 12px;
              min-height: 42px;
            }
            .onboarding-input-wrap {
              padding: 10px 12px;
            }
            .onboarding-input {
              font-size: 16px;
            }
            .home-onboarding-btn {
              min-height: 42px;
              padding: 10px 14px;
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
              showHomeToast('Tour completed. You can start saving now.');
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
              showHomeToast('Tour completed. You can start saving now.');
              return;
            }
            homeOnboardingIndex += 1;
            renderHomeOnboardingStep();
          });
          return;
        }
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

    async function maybeShowHomeOnboarding() {
      const userId = homeCurrentUser?.id;
      if (!userId) return;

      const pendingOnboarding = isOnboardingPending(userId) && !hasSeenOnboarding(userId);
      let shouldShow = pendingOnboarding;
      try {
        const client = await ensureHomeSupabase();
        if (!client) return;
        const { data: profile } = await client
          .from('user_profiles')
          .select('username')
          .eq('id', userId)
          .maybeSingle();
        const username = String(profile?.username || '').trim();
        shouldShow = pendingOnboarding || !username;
      } catch (_err) {
        shouldShow = pendingOnboarding;
      }

      if (!shouldShow) {
        if (!hasSeenOnboarding(userId)) {
          markOnboardingSeen(userId);
        }
        clearOnboardingPending(userId);
        return;
      }

      localStorage.setItem(getOnboardingPendingKey(userId), '1');
      homeOnboardingUserId = userId;
      homeOnboardingIndex = 0;
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

      async function loadFashionBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        const backgroundManifestPromise = ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_FASHION_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'fashion', index)),
          'fashion:fallback'
        ).slice(0, target);
        if (!client) return fallbackItems.slice(0, target);

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('fashion_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        await backgroundManifestPromise;
        const items = dedupeHomeBrandRows(data || []).map((row, index) => mapHomeBrandItem(row, 'fashion', index));
        return stableShuffleHomeItems(items, 'fashion:home').slice(0, target);
      }

      async function loadFoodBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        const backgroundManifestPromise = ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_FOOD_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'food', index)),
          'food:fallback'
        ).slice(0, target);
        if (!client) return fallbackItems.slice(0, target);

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('food_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        await backgroundManifestPromise;
        const items = dedupeHomeBrandRows(data || []).map((row, index) => mapHomeBrandItem(row, 'food', index));
        return stableShuffleHomeItems(items, 'food:home').slice(0, target);
      }

      async function loadCarBrands() {
        const client = await ensureHomeSupabase();
        const target = Math.max(1, Number(getHomeChannelTargetItems() || HOME_CHANNEL_TARGET_ITEMS));
        const backgroundManifestPromise = ensureHomeBrandBackgroundManifest();
        const fallbackItems = stableShuffleHomeItems(
          HOME_CAR_FALLBACKS.map((row, index) => mapHomeBrandItem(row, 'car', index)),
          'car:fallback'
        ).slice(0, target);
        if (!client) return fallbackItems.slice(0, target);

        const fetchLimit = Math.max(target * 4, target);
        const { data, error } = await client
          .from('car_brands')
          .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
          .limit(fetchLimit);
        if (error || !data || !data.length) return fallbackItems.slice(0, target);
        await backgroundManifestPromise;
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
      const targetCount = Math.max(getHomeChannelTargetItems(), isHomeSlowNetwork() ? 18 : 28);
        const mapToItem = (row) => {
          const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
          const genres = Array.isArray(extra?.genres) ? extra.genres : (Array.isArray(row?.genres) ? row.genres : []);
          const cover = resolveHomeGameCover(row);
          const hero = resolveHomeGameHero(row, '') || cover;
          const presentation = getHomeGamePresentation(cover, hero);
          const visual = cover || hero || '/newlogo.webp';
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
            subtitle: releaseDate ? releaseDate.slice(0, 10) : '',
            extra: [genreText, ratingText].filter(Boolean).join(' | '),
            image: visual,
            backgroundImage: hero || visual,
            spotlightImage: hero || visual,
            spotlightMediaImage: visual,
            spotlightMediaFit: presentation.spotlightFit,
            spotlightMediaShape: presentation.spotlightShape,
            gameCardMode: presentation.plain ? 'plain' : 'hero',
            fallbackImage: '',
            href: id ? `game.html?id=${encodeURIComponent(String(id))}` : 'games.html'
          };
        };

      try {
        const client = await ensureHomeSupabase();
        if (!client) return [];
        try {
            const { data, error } = await client
              .from('games')
              .select('id,title,release_date,rating,rating_count,cover_url,hero_url,extra,slug,source')
              .order('rating_count', { ascending: false, nullsFirst: false })
              .order('rating', { ascending: false, nullsFirst: false })
              .limit(Math.max(targetCount * 12, 192));
          if (error) return [];
          const primaryRows = Array.isArray(data) ? data : [];
          const titlePool = Array.from(new Set(primaryRows.map((row) => String(row?.title || '').trim()).filter(Boolean))).slice(0, Math.max(targetCount * 3, 48));
          const slugPool = Array.from(new Set(primaryRows.map((row) => String(row?.slug || '').trim()).filter(Boolean))).slice(0, Math.max(targetCount * 3, 48));
          let combinedRows = primaryRows.slice();
          if (titlePool.length) {
              const { data: altRows, error: altError } = await client
                .from('games')
                .select('id,title,release_date,rating,rating_count,cover_url,hero_url,extra,slug,source')
                .in('title', titlePool);
            if (!altError && Array.isArray(altRows) && altRows.length) {
              combinedRows = primaryRows.concat(altRows);
            }
          }
          if (slugPool.length) {
              const { data: altSlugRows, error: altSlugError } = await client
                .from('games')
                .select('id,title,release_date,rating,rating_count,cover_url,hero_url,extra,slug,source')
                .in('slug', slugPool);
            if (!altSlugError && Array.isArray(altSlugRows) && altSlugRows.length) {
              combinedRows = combinedRows.concat(altSlugRows);
            }
          }
            const dedupedRows = dedupeHomeGameRows(combinedRows, targetCount * 6);
            const selectedRows = dedupedRows.slice(0, targetCount * 4);
            const mappedItems = selectedRows
              .map((row) => mapToItem(row))
              .filter((item) => item && String(item.itemId || '').trim());
            return mappedItems.slice(0, targetCount);
        } catch (_localGamesError) {
          return [];
        }
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
      script.src = 'js/pages/index-home-heavy-loaders.js?v=20260325d';
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
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadTravel === 'function' ? loaders.loadTravel(signal) : [];
    }

    async function loadSports(signal) {
      const loaders = await ensureHomeHeavyLoaders();
      return typeof loaders.loadSports === 'function' ? loaders.loadSports(signal) : [];
    }

    async function initUniversalHome() {
      const initSeq = ++homeFeedInitSeq;
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
      let quickFallbackFeed = null;
      const precomputedFeedPromise = loadPrecomputedHomeFeed().catch(() => null);
      const blankFeed = Object.fromEntries(initialChannels.map((channel) => [channel.key, []]));
      const freshLoadedKeys = new Set();
      let workingFeed = normalizeHomeFeedMap(baselineFeed) || blankFeed;

      if (baselineFeed) {
        const cachedResult = applyHomeFeedMap(baselineFeed);
        if (cachedResult.scoredPool.length) {
          setStatus(cachedFeed ? 'Feed ready from cache. Syncing live data...' : 'Feed ready. Syncing live data...', false);
        }
      }

      const loadChannel = async (channel) => {
        const items = await loadHomeChannelWithTimeout(channel.loader, Number(channel.timeoutMs || HOME_CHANNEL_TIMEOUT_MS));
        if (initSeq === homeFeedInitSeq && Array.isArray(items) && items.length) {
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
      const precomputedFeed = await withTimeout(precomputedFeedPromise, 450, null);
      if (initSeq !== homeFeedInitSeq) return;
      if (!baselineFeed && precomputedFeed == null) {
        quickFallbackFeed = buildInstantFallbackFeed();
        const quickResult = applyHomeFeedMap(quickFallbackFeed);
        if (quickResult.scoredPool.length) {
          setStatus('Quick feed ready. Syncing live data...', false);
        }
        workingFeed = normalizeHomeFeedMap(quickFallbackFeed) || blankFeed;
      }
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

      const healthyChannelFloor = Math.min(initialChannelsCount, 3);
      if (freshActiveChannels >= healthyChannelFloor) {
        if (homeWeakFeedRetryTimer) {
          clearTimeout(homeWeakFeedRetryTimer);
          homeWeakFeedRetryTimer = null;
        }
        homeWeakFeedRetryCount = 0;
      } else if (homeWeakFeedRetryCount < 1 && !homeWeakFeedRetryTimer) {
        homeWeakFeedRetryTimer = setTimeout(() => {
          homeWeakFeedRetryTimer = null;
          homeWeakFeedRetryCount += 1;
          void initUniversalHome();
        }, 1600);
      }

      scheduleHomeMenuCachePrime();
    }

    let landingExperienceInitialized = false;

    function initLandingExperience() {
      if (landingExperienceInitialized) return;
      landingExperienceInitialized = true;
      document.body?.classList.add('landing-mode');
      const authNotice = document.getElementById('landingAuthNotice');
      const revealNodes = Array.from(document.querySelectorAll('[data-landing-reveal]'));
      const params = new URLSearchParams(window.location.search || '');
      const next = sanitizeHomeNextPath(params.get('next') || localStorage.getItem('postAuthRedirect') || 'index.html');
      const authRequired = params.get('auth') === 'required';

      if (authRequired && authNotice) {
        authNotice.hidden = false;
        authNotice.textContent = 'Sign in to continue into Zo2y.';
      }

      document.querySelectorAll('[data-auth-entry]').forEach((link) => {
        link.addEventListener('click', () => {
          localStorage.setItem('postAuthRedirect', 'index.html');
        });
      });

      initLandingMascot();

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







