(function () {
  'use strict';

  const root = window.__ZO2Y_CONSTANTS = {};

  /* ── TMDB / Media ── */
  root.TMDB_PROXY_BASE = '/api/tmdb';
  root.TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  root.TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
  root.TMDB_SPOT_POSTER = 'https://image.tmdb.org/t/p/w342';

  /* ── Auth Storage Keys ── */
  root.AUTH_STORAGE_KEY = 'zo2y-auth-v2';
  root.LEGACY_AUTH_STORAGE_KEY = 'zo2y-auth-v1';
  root.PERSIST_AUTH_STORAGE_KEY = 'zo2y-auth-persist-v2';
  root.DURABLE_AUTH_STORAGE_KEY = 'zo2y-auth-durable-v2';

  /* ── Feature Flags ── */
  root.ENABLE_CARS = true;
  root.ENABLE_GAMES = true;

  /* ── Breakpoints (px, must match CSS) ── */
  root.BP_SM = 640;
  root.BP_MD = 768;
  root.BP_LG = 1024;
  root.BP_XL = 1280;
  root.BP_2XL = 1536;

  /* ── Home Page Constants ── */
  root.HOME_DEBUG_STORAGE_KEY = 'zo2y_home_debug_v1';
  root.HOME_CACHE_KEY = 'zo2y_home_feed_cache_v3';
  root.HOME_PRECOMPUTED_CACHE_KEY = 'zo2y_home_precomputed_cache_v3';
  root.HOME_MENU_CACHE_KEY = 'zo2y_home_menu_v3';
  root.HOME_SPOTLIGHT_VIEWED_KEY = 'zo2y_home_spotlight_viewed_v3';
  root.HOME_PROFILE_CACHE_KEY = 'zo2y_home_profile_cache_v3';

  root.HOME_CHANNEL_TIMEOUT_MS = 5600;
  root.HOME_NEW_RELEASES_TIMEOUT_MS = 5600;
  root.HOME_NEW_RELEASES_REFRESH_MS = 1000 * 60 * 45;
  root.HOME_NEW_RELEASES_TARGET_ITEMS = 24;
  root.HOME_PERSONALIZATION_THROTTLE_MS = 1000 * 60 * 15;
  root.HOME_PRECOMPUTED_FEED_MAX_AGE_MS = 1000 * 60 * 30;
  root.HOME_RESUME_REFRESH_THROTTLE_MS = 1000 * 60 * 5;

  /* ── Shared Header / UI ── */
  root.NAV_KEY = 'zt-nav';
  root.TRANSITION_MS = 200;
})();
