(function () {
  'use strict';

  var PROJECT_REF = 'gfkhjbztayjyojsgdpgk';
  var SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';

  var STORAGE_KEY = 'zo2y-auth-v2';
  var LEGACY_STORAGE_KEY = 'zo2y-auth-v1';
  var SUPABASE_SDK_STORAGE_KEY = 'sb-' + PROJECT_REF + '-auth-token';
  var PERSIST_STORAGE_KEY = 'zo2y-auth-persist-v2';
  var OLD_PERSIST_STORAGE_KEY = 'zo2y-auth-persist-v1';
  var DURABLE_STORAGE_KEY = 'zo2y-auth-durable-v2';
  var OLD_DURABLE_STORAGE_KEY = 'zo2y-auth-durable-v1';
  var EXPLICIT_SIGNOUT_KEY = 'zo2y-auth-explicit-signout-v2';
  var OLD_EXPLICIT_SIGNOUT_KEY = 'zo2y-auth-explicit-signout-v1';
  var POST_AUTH_REDIRECT_KEY = 'zo2y-auth-post-auth-redirect-v2';
  var OLD_POST_AUTH_REDIRECT_KEY = 'postAuthRedirect';
  var OAUTH_FLOW_KEY = 'zo2y-auth-oauth-flow-v2';
  var OLD_OAUTH_FLOW_KEY = 'oauthFlow';
  var POST_AUTH_BOOTSTRAP_KEY = 'zo2y-post-auth-bootstrap-v2';
  var OLD_POST_AUTH_BOOTSTRAP_KEY = 'zo2y_post_auth_bootstrap_v1';
  var ONBOARDING_PENDING_PREFIX = 'zo2y-auth-onboarding-pending-v2-';
  var OLD_ONBOARDING_PENDING_PREFIX = 'zo2y_onboarding_pending_v1_';
  var ONBOARDING_SESSION_PREFIX = 'zo2y-auth-onboarding-session-v2-';
  var OLD_ONBOARDING_SESSION_PREFIX = 'zo2y_onboarding_session_v1_';
  var AUTH_DEBUG_KEY = 'zo2y_auth_debug';
  var AUTH_RETURN_VERSION = '20260424e';
  var AUTH_DEBUG_MAX_EVENTS = 120;
  var PRIMARY_DOMAIN = 'zo2y.com';
  var LEGACY_WWW_DOMAIN = 'www.zo2y.com';

  var PUBLIC_PAGE_RESUME_VERIFY_THROTTLE_MS = 1000 * 60 * 8;
  var PROTECTED_PAGE_RESUME_VERIFY_THROTTLE_MS = 1000 * 60;
  var EXPLICIT_SIGNOUT_TTL_MS = 1000 * 60 * 10;

  var PUBLIC_PAGE_KEYS = new Set([
    'index',
    'login',
    'sign-up',
    'signup',
    'auth-callback',
    'update-password',
    'privacy',
    'terms',
    'support',
    'movies',
    'movies-mobile',
    'movie',
    'tvshows',
    'tvshows-mobile',
    'tvshow',
    'animes',
    'animes-mobile',
    'anime',
    'games',
    'games-mobile',
    'game',
    'books',
    'books-mobile',
    'book',
    'music',
    'song',
    'travel',
    'travel-mobile',
    'country',
    'sports',
    'sports-mobile',
    'team',
    'reviews',
    'fashion',
    'food',
    'cars',
    'brand',
    'restaurant',
    'restraunts',
    'credits'
  ]);

  var RESERVED_PROFILE_USERNAMES = new Set([
    'admin', 'api', 'app', 'auth', 'authcallback', 'blog', 'book', 'books',
    'country', 'edit', 'explore', 'game', 'games', 'help', 'home', 'index',
    'login', 'movie', 'movies', 'music', 'new', 'privacy', 'profile',
    'resetpassword', 'reviews', 'search', 'settings', 'signup', 'support',
    'terms', 'travel', 'tv', 'tvshow', 'tvshows', 'updatepassword', 'user',
    'users', 'zo2y'
  ]);

  var AUTH_ENTRY_PAGES = new Set(['login', 'sign-up', 'signup', 'auth-callback', 'update-password']);

  function enforcePrimaryDomainRedirect() {
    var hostname = String(window.location && window.location.hostname || '').trim().toLowerCase();
    if (hostname !== LEGACY_WWW_DOMAIN) return false;
    try {
      var target = new URL(window.location.href);
      target.protocol = 'https:';
      target.hostname = PRIMARY_DOMAIN;
      window.location.replace(target.toString());
      return true;
    } catch (_err) {
      return false;
    }
  }

  if (enforcePrimaryDomainRedirect()) {
    return;
  }

  var pageKey = normalizePageKey(window.location && window.location.pathname);
  var verifyInFlight = null;
  var activeSessionPromise = null;
  var lastVerifyAt = 0;
  var authStateVerifyTimer = null;
  var profileBootstrapPromises = new Map();
  var profileLabelCache = new Map();
  var lastKnownSessionSnapshot = null;
  var authDebugEvents = [];

  try {
    if (!window.__ZO2Y_SUPABASE_CONFIG) {
      window.__ZO2Y_SUPABASE_CONFIG = {
        url: SUPABASE_URL,
        key: SUPABASE_KEY,
        projectRef: PROJECT_REF
      };
    }
  } catch (_err) {}

  function normalizePageKey(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function authDebugEnabled() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      if (params.get('debug_auth') === '1') {
        if (window.localStorage) window.localStorage.setItem(AUTH_DEBUG_KEY, '1');
        return true;
      }
    } catch (_err) {}
    try {
      return !!(window.localStorage && window.localStorage.getItem(AUTH_DEBUG_KEY) === '1');
    } catch (_err2) {
      return false;
    }
  }

  function authDebug(label, payload) {
    if (!authDebugEnabled()) return;
    if (payload === undefined) {
      console.log('[ZO2Y AUTH]', label);
      return;
    }
    console.log('[ZO2Y AUTH]', label, payload);
  }

  function pushAuthDebugEvent(label, payload) {
    var safeLabel = String(label || 'event');
    var safePayload = payload && typeof payload === 'object'
      ? payload
      : (payload === undefined ? {} : { value: payload });
    var event = {
      t: Date.now(),
      label: safeLabel,
      payload: safePayload
    };
    authDebugEvents.push(event);
    if (authDebugEvents.length > AUTH_DEBUG_MAX_EVENTS) {
      authDebugEvents.splice(0, authDebugEvents.length - AUTH_DEBUG_MAX_EVENTS);
    }
    try {
      window.__ZO2Y_AUTH_DEBUG_EVENTS = authDebugEvents.slice(-AUTH_DEBUG_MAX_EVENTS);
    } catch (_errStore) {}
    try {
      window.dispatchEvent(new CustomEvent('zo2y-auth-debug', {
        detail: event
      }));
    } catch (_errEvent) {}
    authDebug(safeLabel, safePayload);
    return event;
  }

  function getAuthDebugSnapshot() {
    var snapshot = getStoredSessionSnapshot();
    return {
      pageKey: pageKey,
      debugEnabled: authDebugEnabled(),
      hasStoredSession: hasStoredSupabaseSession(),
      hasRecentExplicitSignout: hasRecentExplicitSignout(),
      verifyInFlight: !!verifyInFlight,
      activeSessionInFlight: !!activeSessionPromise,
      lastVerifyAt: lastVerifyAt || 0,
      sessionPreview: snapshot ? {
        userId: String(snapshot.user && snapshot.user.id || '').trim() || null,
        email: String(snapshot.user && snapshot.user.email || '').trim() || null,
        expiresAt: snapshot.expires_at || null
      } : null,
      recentEvents: authDebugEvents.slice(-40)
    };
  }

  function getAuthStorageKeys(key) {
    var value = String(key || '').trim();
    if (!value) return [];
    if (
      value === STORAGE_KEY ||
      value === LEGACY_STORAGE_KEY ||
      value === SUPABASE_SDK_STORAGE_KEY ||
      value === PERSIST_STORAGE_KEY ||
      value === OLD_PERSIST_STORAGE_KEY
    ) {
      return [STORAGE_KEY];
    }
    if (value === DURABLE_STORAGE_KEY || value === OLD_DURABLE_STORAGE_KEY) {
      return [DURABLE_STORAGE_KEY];
    }
    if (value === EXPLICIT_SIGNOUT_KEY || value === OLD_EXPLICIT_SIGNOUT_KEY) {
      return [EXPLICIT_SIGNOUT_KEY];
    }
    if (value === POST_AUTH_REDIRECT_KEY || value === OLD_POST_AUTH_REDIRECT_KEY) {
      return [POST_AUTH_REDIRECT_KEY];
    }
    if (value === OAUTH_FLOW_KEY || value === OLD_OAUTH_FLOW_KEY) {
      return [OAUTH_FLOW_KEY];
    }
    if (value === POST_AUTH_BOOTSTRAP_KEY || value === OLD_POST_AUTH_BOOTSTRAP_KEY) {
      return [POST_AUTH_BOOTSTRAP_KEY];
    }
    return [value];
  }

  function removeStorageKeyEverywhere(key) {
    safeRemoveLocalStorage(key);
    safeRemoveSessionStorage(key);
  }

  function purgeLegacyAuthArtifacts() {
    removeStorageKeyEverywhere(LEGACY_STORAGE_KEY);
    removeStorageKeyEverywhere(SUPABASE_SDK_STORAGE_KEY);
    removeStorageKeyEverywhere(OLD_PERSIST_STORAGE_KEY);
    removeStorageKeyEverywhere(OLD_DURABLE_STORAGE_KEY);
    removeStorageKeyEverywhere(OLD_EXPLICIT_SIGNOUT_KEY);
    removeStorageKeyEverywhere(OLD_POST_AUTH_REDIRECT_KEY);
    removeStorageKeyEverywhere(OLD_OAUTH_FLOW_KEY);
    removeStorageKeyEverywhere(OLD_POST_AUTH_BOOTSTRAP_KEY);
    try {
      if (!window.localStorage) return;
      var keysToRemove = [];
      for (var i = 0; i < window.localStorage.length; i += 1) {
        var key = String(window.localStorage.key(i) || '');
        if (!key) continue;
        if (
          key.indexOf(OLD_ONBOARDING_PENDING_PREFIX) === 0 ||
          key.indexOf(OLD_ONBOARDING_SESSION_PREFIX) === 0 ||
          key.indexOf('zo2y_onboarding_pending_v2_') === 0 ||
          key.indexOf('zo2y_onboarding_seen_v2_') === 0 ||
          key.indexOf('zo2y_onboarding_seen_once_v1_') === 0 ||
          key.indexOf('zo2y_onboarding_seen_v1_') === 0
        ) {
          keysToRemove.push(key);
        }
      }
      for (var j = 0; j < keysToRemove.length; j += 1) {
        window.localStorage.removeItem(keysToRemove[j]);
      }
    } catch (_err) {}
    try {
      if (!window.sessionStorage) return;
      var sessionKeysToRemove = [];
      for (var k = 0; k < window.sessionStorage.length; k += 1) {
        var sessionKey = String(window.sessionStorage.key(k) || '');
        if (!sessionKey) continue;
        if (
          sessionKey.indexOf(OLD_ONBOARDING_SESSION_PREFIX) === 0 ||
          sessionKey.indexOf('zo2y_onboarding_session_v2_') === 0
        ) {
          sessionKeysToRemove.push(sessionKey);
        }
      }
      for (var m = 0; m < sessionKeysToRemove.length; m += 1) {
        window.sessionStorage.removeItem(sessionKeysToRemove[m]);
      }
    } catch (_err2) {}
  }

  function safeGetLocalStorage(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeGetAnyLocalStorage(keys) {
    var list = Array.isArray(keys) ? keys : [keys];
    for (var i = 0; i < list.length; i += 1) {
      var value = safeGetLocalStorage(list[i]);
      if (value !== null && value !== undefined && value !== '') return value;
    }
    return null;
  }

  function safeSetLocalStorage(key, value) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function safeRemoveLocalStorage(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
    } catch (_err) {}
  }

  function safeGetSessionStorage(key) {
    try {
      return window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeSetSessionStorage(key, value) {
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(key, value);
    } catch (_err) {}
  }

  function safeRemoveSessionStorage(key) {
    try {
      if (window.sessionStorage) window.sessionStorage.removeItem(key);
    } catch (_err) {}
  }

  function safeGetStorageItem(key) {
    var keys = getAuthStorageKeys(key);
    for (var i = 0; i < keys.length; i += 1) {
      var localValue = safeGetLocalStorage(keys[i]);
      if (localValue !== null && localValue !== undefined && localValue !== '') return localValue;
    }
    for (var j = 0; j < keys.length; j += 1) {
      var sessionValue = safeGetSessionStorage(keys[j]);
      if (sessionValue !== null && sessionValue !== undefined && sessionValue !== '') {
        if (keys[j] === STORAGE_KEY || keys[j] === LEGACY_STORAGE_KEY || keys[j] === PERSIST_STORAGE_KEY) {
          safeSetAuthStorage(keys[j], sessionValue);
          safeRemoveSessionStorage(keys[j]);
        }
        return sessionValue;
      }
    }
    return null;
  }

  function safeSetAuthStorage(key, value) {
    var keys = getAuthStorageKeys(key);
    var wrote = false;
    for (var i = 0; i < keys.length; i += 1) {
      wrote = safeSetLocalStorage(keys[i], value) || wrote;
      safeRemoveSessionStorage(keys[i]);
    }
    return wrote;
  }

  function safeRemoveAuthStorage(key) {
    var keys = getAuthStorageKeys(key);
    for (var i = 0; i < keys.length; i += 1) {
      safeRemoveLocalStorage(keys[i]);
      safeRemoveSessionStorage(keys[i]);
    }
  }

  function getAuthStorageBridge() {
    if (window.__ZO2Y_AUTH_STORAGE_BRIDGE) return window.__ZO2Y_AUTH_STORAGE_BRIDGE;
    window.__ZO2Y_AUTH_STORAGE_BRIDGE = {
      getItem: function (key) {
        return safeGetStorageItem(key);
      },
      setItem: function (key, value) {
        safeSetAuthStorage(key, value);
      },
      removeItem: function (key) {
        safeRemoveAuthStorage(key);
      }
    };
    return window.__ZO2Y_AUTH_STORAGE_BRIDGE;
  }

  function getHashParams() {
    var rawHash = window.location.hash || '';
    if (rawHash.charAt(0) === '#') rawHash = rawHash.slice(1);
    return new URLSearchParams(rawHash);
  }

  function extractSessionFromPayload(payload) {
    if (!payload) return null;
    if (payload.currentSession) return extractSessionFromPayload(payload.currentSession);
    if (payload.session) return extractSessionFromPayload(payload.session);
    if (payload.data && payload.data.session) return extractSessionFromPayload(payload.data.session);
    if (payload.access_token || payload.refresh_token) return payload;
    return null;
  }

  function getStoredSessionSnapshot() {
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = safeGetStorageItem(keys[i]);
      if (!raw) continue;
      try {
        var parsed = JSON.parse(raw);
        var session = extractSessionFromPayload(parsed);
        if (session && session.access_token && session.refresh_token) return session;
      } catch (_err) {}
    }
    var durableRaw = safeGetLocalStorage(DURABLE_STORAGE_KEY);
    if (!durableRaw) return null;
    try {
      var durableParsed = JSON.parse(durableRaw);
      var durableSession = extractSessionFromPayload(durableParsed);
      if (durableSession && durableSession.access_token && durableSession.refresh_token) return durableSession;
    } catch (_err2) {}
    return null;
  }

  function persistSessionSnapshot(session) {
    if (!session || !session.access_token || !session.refresh_token) return false;
    try {
      lastKnownSessionSnapshot = session;
      var payload = JSON.stringify(session);
      safeSetAuthStorage(STORAGE_KEY, payload);
      safeSetAuthStorage(PERSIST_STORAGE_KEY, payload);
      safeSetLocalStorage(DURABLE_STORAGE_KEY, JSON.stringify({
        session: session,
        savedAt: Date.now()
      }));
      clearExplicitSignoutMarker();
      pushAuthDebugEvent('session:persist', {
        userId: String(session.user && session.user.id || '').trim() || null,
        expiresAt: session.expires_at || null
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  function clearPersistedSessionSnapshots() {
    lastKnownSessionSnapshot = null;
    safeRemoveAuthStorage(STORAGE_KEY);
    removeStorageKeyEverywhere(LEGACY_STORAGE_KEY);
    removeStorageKeyEverywhere(PERSIST_STORAGE_KEY);
    removeStorageKeyEverywhere(SUPABASE_SDK_STORAGE_KEY);
    removeStorageKeyEverywhere(OLD_PERSIST_STORAGE_KEY);
    removeStorageKeyEverywhere(DURABLE_STORAGE_KEY);
    removeStorageKeyEverywhere(OLD_DURABLE_STORAGE_KEY);
    pushAuthDebugEvent('session:cleared');
  }

  function hasStoredSupabaseSession() {
    return !!getStoredSessionSnapshot();
  }

  function hydrateCanonicalAuthStorageFromDurable() {
    var session = getStoredSessionSnapshot();
    if (!session || !session.access_token || !session.refresh_token) return false;
    return persistSessionSnapshot(session);
  }

  function getAuthErrorDetails(error) {
    return {
      status: Number(error && (error.status || error.statusCode) || 0),
      code: String(error && error.code || '').trim().toLowerCase(),
      message: String(error && error.message || '').trim().toLowerCase()
    };
  }

  function shouldClearPersistedSessionForError(error) {
    var details = getAuthErrorDetails(error);
    if (!details.message && !details.code && !details.status) return false;
    if (details.message.indexOf('refresh token already used') !== -1) return false;
    if (details.message.indexOf('already been used') !== -1) return false;
    return (
      details.message.indexOf('invalid refresh token') !== -1 ||
      details.message.indexOf('refresh token not found') !== -1 ||
      details.message.indexOf('invalid grant') !== -1 ||
      details.message.indexOf('session missing') !== -1 ||
      details.message.indexOf('session not found') !== -1 ||
      details.message.indexOf('user from sub claim in jwt does not exist') !== -1 ||
      details.message.indexOf('invalid api key') !== -1 ||
      (details.message.indexOf('apikey') !== -1 && details.message.indexOf('invalid') !== -1) ||
      details.code === 'refresh_token_not_found' ||
      details.code === 'session_not_found'
    );
  }

  function isRecoverableSessionRaceError(error) {
    var details = getAuthErrorDetails(error);
    return (
      details.message.indexOf('refresh token already used') !== -1 ||
      details.message.indexOf('already been used') !== -1
    );
  }

  function markExplicitSignout() {
    safeSetLocalStorage(EXPLICIT_SIGNOUT_KEY, String(Date.now()));
  }

  function clearExplicitSignoutMarker() {
    safeRemoveLocalStorage(EXPLICIT_SIGNOUT_KEY);
  }

  function hasRecentExplicitSignout() {
    var raw = safeGetLocalStorage(EXPLICIT_SIGNOUT_KEY);
    if (!raw) return false;
    var timestamp = Number(raw || 0);
    if (!timestamp) {
      clearExplicitSignoutMarker();
      return false;
    }
    if ((Date.now() - timestamp) > EXPLICIT_SIGNOUT_TTL_MS) {
      clearExplicitSignoutMarker();
      return false;
    }
    return true;
  }

  function sanitizeNextPath(raw) {
    var value = String(raw || '').trim();
    if (!value) return 'index.html';
    if (/^https?:\/\//i.test(value) || value.indexOf('//') === 0) return 'index.html';
    var normalized = value.charAt(0) === '/' ? (value.slice(1) || 'index.html') : value;
    try {
      var target = new URL(normalized, window.location.origin);
      ['auth_return', 'authv', 'native_oauth', 'code', 'state', 'error', 'error_description'].forEach(function (key) {
        target.searchParams.delete(key);
      });
      return (target.pathname.replace(/^\//, '') || 'index.html') + target.search + target.hash;
    } catch (_err) {
      return normalized;
    }
  }

  function getSanitizedCurrentPath() {
    return sanitizeNextPath(
      (window.location.pathname || '/')
      + (window.location.search || '')
      + (window.location.hash || '')
    );
  }

  function buildCleanAuthReturnUrl(rawNext) {
    var safeNext = sanitizeNextPath(rawNext || getSanitizedCurrentPath());
    var target = new URL(safeNext, window.location.origin);
    [
      'flow',
      'next',
      'code',
      'state',
      'error',
      'error_description',
      'scope',
      'authuser',
      'prompt',
      'native_oauth',
      'auth_return',
      'authv'
    ].forEach(function (key) {
      target.searchParams.delete(key);
    });

    var hashParams = new URLSearchParams((target.hash || '').replace(/^#/, ''));
    [
      'access_token',
      'refresh_token',
      'expires_at',
      'expires_in',
      'provider_token',
      'provider_refresh_token',
      'token_type',
      'type',
      'error',
      'error_description'
    ].forEach(function (key) {
      hashParams.delete(key);
    });
    var cleanHash = hashParams.toString();
    target.hash = cleanHash ? ('#' + cleanHash) : '';
    return target;
  }

  function replaceCurrentUrlAfterAuth(rawNext) {
    clearPostAuthIntent();
    var cleanTarget = buildCleanAuthReturnUrl(rawNext);
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState({}, document.title, cleanTarget.pathname + cleanTarget.search + cleanTarget.hash);
      return true;
    }
    window.location.replace(cleanTarget.toString());
    return true;
  }

  function buildPostAuthRedirectTarget(rawNext) {
    var safeNext = sanitizeNextPath(rawNext || 'index.html');
    try {
      var target = new URL(safeNext, window.location.origin);
      target.searchParams.set('auth_return', '1');
      target.searchParams.set('authv', AUTH_RETURN_VERSION);
      return (target.pathname.replace(/^\//, '') || 'index.html') + target.search + target.hash;
    } catch (_err) {
      return safeNext;
    }
  }

  function buildLoginRedirectTarget(rawNext) {
    var next = sanitizeNextPath(rawNext || (window.location.pathname + window.location.search + window.location.hash));
    safeSetLocalStorage(POST_AUTH_REDIRECT_KEY, next);
    return 'login.html?next=' + encodeURIComponent(next);
  }

  function readRequestedNextPath(rawSearch) {
    try {
      var params = new URLSearchParams(String(rawSearch || window.location.search || ''));
      var next = params.get('next') || safeGetAnyLocalStorage([POST_AUTH_REDIRECT_KEY, OLD_POST_AUTH_REDIRECT_KEY]) || 'index.html';
      return sanitizeNextPath(next);
    } catch (_err) {
      return 'index.html';
    }
  }

  function setPostAuthIntent(flow, nextPath) {
    var safeNext = sanitizeNextPath(nextPath || 'index.html');
    safeSetLocalStorage(OAUTH_FLOW_KEY, String(flow || '').trim().toLowerCase());
    safeSetLocalStorage(OLD_OAUTH_FLOW_KEY, String(flow || '').trim().toLowerCase());
    safeSetLocalStorage(POST_AUTH_REDIRECT_KEY, safeNext);
    safeSetLocalStorage(OLD_POST_AUTH_REDIRECT_KEY, safeNext);
  }

  function clearPostAuthIntent() {
    safeRemoveLocalStorage(OAUTH_FLOW_KEY);
    safeRemoveLocalStorage(OLD_OAUTH_FLOW_KEY);
    safeRemoveLocalStorage(POST_AUTH_REDIRECT_KEY);
    safeRemoveLocalStorage(OLD_POST_AUTH_REDIRECT_KEY);
  }

  function getOnboardingPendingKey(userId) {
    return ONBOARDING_PENDING_PREFIX + String(userId || '').trim();
  }

  function hasOnboardingPending(userId) {
    return safeGetLocalStorage(getOnboardingPendingKey(userId)) === '1';
  }

  function markOnboardingPending(userId) {
    safeSetLocalStorage(getOnboardingPendingKey(userId), '1');
  }

  function clearOnboardingPending(userId) {
    safeRemoveLocalStorage(getOnboardingPendingKey(userId));
    safeRemoveSessionStorage(ONBOARDING_SESSION_PREFIX + String(userId || '').trim());
  }

  function wasOnboardingRedirectedThisSession(userId) {
    return safeGetSessionStorage(ONBOARDING_SESSION_PREFIX + String(userId || '').trim()) === '1';
  }

  function markOnboardingRedirectedThisSession(userId) {
    safeSetSessionStorage(ONBOARDING_SESSION_PREFIX + String(userId || '').trim(), '1');
  }

  function normalizeProfileUsername(value, fallbackValue) {
    function cleanUsernamePart(input) {
      return String(input || '')
        .trim()
        .replace(/^@+/, '')
        .toLowerCase()
        .replace(/[\u0027\u2019]/g, '')
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);
    }

    var normalized = cleanUsernamePart(value);
    if (!normalized) normalized = cleanUsernamePart(fallbackValue);
    if (!normalized) normalized = 'user';
    if (normalized.length < 3) normalized = cleanUsernamePart('user_' + normalized);
    if (!normalized) normalized = 'user';
    return normalized.slice(0, 30);
  }

  function isReservedProfileUsername(value) {
    return RESERVED_PROFILE_USERNAMES.has(String(value || '').replace(/_/g, ''));
  }

  function getUserEmailPrefix(user) {
    var email = String(user && user.email || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) return '';
    return email.split('@')[0] || '';
  }

  function buildPreferredProfileUsername(user) {
    var userData = user && user.user_metadata ? user.user_metadata : {};
    var userId = String(user && user.id || '').trim();
    var fallback = userId || 'user';
    var base = normalizeProfileUsername(
      userData.preferred_username ||
      userData.zo2y_username ||
      userData.username ||
      userData.full_name ||
      userData.name ||
      fallback,
      fallback
    );

    if (isReservedProfileUsername(base)) {
      return profileUsernameWithSuffix(base, userId || 'user');
    }
    return base;
  }

  function profileUsernameWithSuffix(base, suffix) {
    var normalizedBase = normalizeProfileUsername(base || 'user');
    var normalizedSuffix = normalizeProfileUsername(suffix || 'user').slice(0, 8) || 'user';
    var limit = Math.max(3, 30 - normalizedSuffix.length - 1);
    return (normalizedBase.slice(0, limit) + '_' + normalizedSuffix).slice(0, 30);
  }

  function getGeneratedPlaceholderProfileUsername(user) {
    var userId = String(user && user.id || '').trim();
    if (!userId) return 'user';
    return profileUsernameWithSuffix('user', userId.replace(/-/g, '').slice(0, 6) || 'user');
  }

  function isValidProfileUsername(value) {
    return /^[a-z0-9_]{3,30}$/.test(String(value || '').trim());
  }

  function isPlaceholderProfileUsername(profileUsername, user) {
    var normalizedProfile = normalizeProfileUsername(profileUsername || '');
    if (!normalizedProfile) return true;
    if (!isValidProfileUsername(normalizedProfile)) return true;
    if (normalizedProfile === 'user') return true;
    return normalizedProfile === getGeneratedPlaceholderProfileUsername(user);
  }

  function getAuthProfileSnapshot(user) {
    var userData = user && user.user_metadata ? user.user_metadata : {};
    var fullName = String(userData.full_name || userData.name || '').trim().slice(0, 80);
    return {
      id: String(user && user.id || '').trim() || null,
      email: String(user && user.email || '').trim() || null,
      full_name: fullName || null,
      avatar_icon: String(userData.avatar_icon || '').trim() || null,
      onboarding_completed_at: String(userData.zo2y_onboarded_at || userData.onboarding_completed_at || '').trim() || null,
      username: null
    };
  }

  async function readAuthProfileRow(client, userId) {
    var safeUserId = String(userId || '').trim();
    if (!client || !safeUserId || !client.from) return null;
    try {
      var byId = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .eq('id', safeUserId)
        .maybeSingle();
      if (!byId || !byId.error) {
        return byId && byId.data ? byId.data : null;
      }
      var byUserId = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .eq('user_id', safeUserId)
        .maybeSingle();
      if (!byUserId || !byUserId.error) {
        return byUserId && byUserId.data ? byUserId.data : null;
      }
    } catch (_err) {}
    return null;
  }

  function buildProfileLabelFromSources(user, profileRow) {
    var rowUsername = String(profileRow && profileRow.username || '').trim();
    if (rowUsername && !isPlaceholderProfileUsername(rowUsername, user)) {
      return '@' + rowUsername;
    }
    var authUsername = normalizeProfileUsername(
      user && user.user_metadata && (user.user_metadata.zo2y_username || user.user_metadata.username) || ''
    );
    if (authUsername && !isPlaceholderProfileUsername(authUsername, user)) {
      return '@' + authUsername;
    }
    return 'Profile';
  }

  function profileNeedsConcreteUsername(profile, user) {
    var username = String(profile && profile.username || '').trim();
    if (!username) return true;
    return isPlaceholderProfileUsername(username, user);
  }

  async function resolveProfileLabel(client, user, options) {
    var userId = String(user && user.id || '').trim();
    var fallbackLabel = buildProfileLabelFromSources(user, null);
    if (!userId) return fallbackLabel;
    var opts = options || {};
    var ttlMs = Number(opts.ttlMs || 60000);
    var cached = profileLabelCache.get(userId);
    if (cached && cached.label && (Date.now() - Number(cached.savedAt || 0)) < ttlMs) {
      return cached.label;
    }
    var profileRow = await readAuthProfileRow(client, userId);
    var label = buildProfileLabelFromSources(user, profileRow);
    profileLabelCache.set(userId, {
      label: label,
      savedAt: Date.now(),
      profile: profileRow || null
    });
    return label;
  }

  function profileNeedsOnboarding(profile) {
    if (!profile) return true;
    return profileNeedsConcreteUsername(profile);
  }

  async function ensureAuthProfile(_client, user) {
    if (!user || !user.id) {
      return { ok: false, created: false, profile: null, needsUsername: false, needsOnboarding: false };
    }

    var userId = String(user.id || '').trim();
    if (!userId) {
      return { ok: false, created: false, profile: null, needsUsername: false, needsOnboarding: false };
    }

    if (profileBootstrapPromises.has(userId)) {
      return profileBootstrapPromises.get(userId);
    }

    var promise = (async function () {
      try {
        var profile = getAuthProfileSnapshot(user);
        var profileRow = await readAuthProfileRow(_client, userId);
        if (profileRow) {
          var rowUsername = String(profileRow.username || '').trim();
          var rowFullName = String(profileRow.full_name || '').trim();
          if (rowUsername && !isPlaceholderProfileUsername(rowUsername, user)) {
            profile.username = rowUsername;
          }
          if (rowFullName) {
            profile.full_name = rowFullName.slice(0, 80);
          }
        } else {
          var authUsername = normalizeProfileUsername(
            user && user.user_metadata && (user.user_metadata.zo2y_username || user.user_metadata.username) || ''
          );
          if (authUsername && !isPlaceholderProfileUsername(authUsername, user)) {
            profile.username = authUsername;
          }
        }
        var needsUsername = profileNeedsConcreteUsername(profile, user);
        var needsOnboarding = profileNeedsOnboarding(profile);
        if (needsOnboarding) {
          markOnboardingPending(userId);
        } else {
          clearOnboardingPending(userId);
        }
        profileLabelCache.set(userId, {
          label: buildProfileLabelFromSources(user, profileRow || profile),
          savedAt: Date.now(),
          profile: profileRow || profile
        });
        return {
          ok: true,
          created: false,
          profile: profile,
          needsUsername: needsUsername,
          needsOnboarding: needsOnboarding
        };
      } catch (error) {
        return { ok: false, created: false, profile: null, needsUsername: false, needsOnboarding: false, error: error };
      }
    })();

    profileBootstrapPromises.set(userId, promise);
    try {
      return await promise;
    } finally {
      profileBootstrapPromises.delete(userId);
    }
  }

  async function ensureUsernameAvailable(client, username, currentProfileId) {
    var normalizedUsername = normalizeProfileUsername(username);
    if (!isValidProfileUsername(normalizedUsername)) {
      throw new Error('Username must be 3-30 characters and use only letters, numbers, or underscores.');
    }
    if (RESERVED_PROFILE_USERNAMES.has(normalizedUsername.replace(/_/g, ''))) {
      throw new Error('That username is reserved. Choose another one.');
    }
    var result = await client
      .from('user_profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .limit(10);
    if (result && result.error) throw result.error;
    var isTaken = Array.isArray(result && result.data) && result.data.some(function (row) {
      return String(row && row.id || '') !== String(currentProfileId || '');
    });
    if (isTaken) {
      throw new Error('That username is already taken.');
    }
    return normalizedUsername;
  }

  function buildClientOptions(options) {
    var next = Object.assign({}, options || {});
    if (Object.prototype.hasOwnProperty.call(next, '__zo2yIsolated')) {
      delete next.__zo2yIsolated;
    }
    var auth = Object.assign({}, next.auth || {});
    auth.storage = getAuthStorageBridge();
    auth.storageKey = STORAGE_KEY;
    // Always enable auth session persistence to avoid losing session on refresh
    auth.persistSession = true;
    if (auth.autoRefreshToken === undefined) auth.autoRefreshToken = true;
    if (auth.detectSessionInUrl === undefined) auth.detectSessionInUrl = false;
    if (auth.flowType === undefined) auth.flowType = 'implicit';
    next.auth = auth;
    return next;
  }

  function attachClientListeners(client) {
    if (!client || client.__zo2yAuthListenersBound || !client.auth || typeof client.auth.onAuthStateChange !== 'function') {
      return client;
    }
    client.__zo2yAuthListenersBound = true;
    client.auth.onAuthStateChange(function (event, session) {
      var normalizedEvent = String(event || '').trim().toUpperCase();
      lastKnownSessionSnapshot = session && session.access_token && session.refresh_token ? session : null;
      if (session && session.access_token && session.refresh_token) {
        persistSessionSnapshot(session);
      }
      pushAuthDebugEvent('auth:event', {
        event: normalizedEvent,
        userId: String(session && session.user && session.user.id || '').trim() || null,
        hasSession: !!(session && session.access_token && session.refresh_token)
      });
      if (normalizedEvent === 'SIGNED_OUT') {
        if (hasRecentExplicitSignout()) {
          clearPersistedSessionSnapshots();
          clearExplicitSignoutMarker();
        }
      }
      if (client === window.__ZO2Y_SUPABASE_CLIENT) {
        if (authStateVerifyTimer) window.clearTimeout(authStateVerifyTimer);
        authStateVerifyTimer = window.setTimeout(function () {
          void verifyAndApplySession(true);
        }, normalizedEvent === 'SIGNED_IN' ? 0 : 80);
      }
    });
    return client;
  }

  function createClientWithFactory(factory, options) {
    var createOptions = buildClientOptions(options);
    var isolated = !!(options && options.__zo2yIsolated);
    var shouldShare = !isolated && !(options && options.auth && options.auth.detectSessionInUrl === true);

    hydrateCanonicalAuthStorageFromDurable();

    if (shouldShare && window.__ZO2Y_SUPABASE_CLIENT) {
      attachClientListeners(window.__ZO2Y_SUPABASE_CLIENT);
      return window.__ZO2Y_SUPABASE_CLIENT;
    }

    var client = factory(SUPABASE_URL, SUPABASE_KEY, createOptions);
    attachClientListeners(client);
    if (shouldShare) {
      window.__ZO2Y_SUPABASE_CLIENT = client;
    }
    return client;
  }

  function patchSupabaseNamespace(namespace) {
    if (!namespace || typeof namespace.createClient !== 'function' || namespace.__zo2yCreateClientPatched) return false;

    var originalCreateClient = namespace.createClient.bind(namespace);
    namespace.createClient = function (url, key, options) {
      var normalizedUrl = String(url || '').trim();
      var normalizedKey = String(key || '').trim();
      if (normalizedUrl === SUPABASE_URL && normalizedKey === SUPABASE_KEY) {
        return createClientWithFactory(originalCreateClient, options || {});
      }
      return originalCreateClient(url, key, options);
    };
    namespace.__zo2yCreateClientPatched = true;
    window.__ZO2Y_SUPABASE_CREATE_CLIENT_ORIGINAL = originalCreateClient;
    return true;
  }

  function installSupabasePatch() {
    var currentSupabase = window.supabase;
    try {
      Object.defineProperty(window, 'supabase', {
        configurable: true,
        enumerable: true,
        get: function () {
          return currentSupabase;
        },
        set: function (value) {
          currentSupabase = value;
          patchSupabaseNamespace(currentSupabase);
        }
      });
    } catch (_err) {}

    if (currentSupabase) patchSupabaseNamespace(currentSupabase);

    var attempts = 0;
    var pollTimer = window.setInterval(function () {
      attempts += 1;
      if (patchSupabaseNamespace(window.supabase) || attempts > 200) {
        window.clearInterval(pollTimer);
      }
    }, 50);
  }

  async function waitForSupabase(timeoutMs) {
    var startedAt = Date.now();
    var limit = Number(timeoutMs || 8000) || 8000;
    while ((Date.now() - startedAt) < limit) {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        patchSupabaseNamespace(window.supabase);
        return true;
      }
      await wait(40);
    }
    return !!(window.supabase && typeof window.supabase.createClient === 'function');
  }

  function ensureSharedSupabaseClient(options) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    patchSupabaseNamespace(window.supabase);
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      attachClientListeners(window.__ZO2Y_SUPABASE_CLIENT);
      return window.__ZO2Y_SUPABASE_CLIENT;
    }
    var factory = window.__ZO2Y_SUPABASE_CREATE_CLIENT_ORIGINAL || window.supabase.createClient.bind(window.supabase);
    return createClientWithFactory(factory, options || {});
  }

  function createIsolatedSupabaseClient(options) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    patchSupabaseNamespace(window.supabase);
    var factory = window.__ZO2Y_SUPABASE_CREATE_CLIENT_ORIGINAL || window.supabase.createClient.bind(window.supabase);
    return createClientWithFactory(factory, Object.assign({}, options || {}, { __zo2yIsolated: true }));
  }

  async function restoreClientSessionFromSnapshot(client) {
    if (hasRecentExplicitSignout()) return null;
    var activeClient = client || ensureSharedSupabaseClient();
    if (!activeClient || !activeClient.auth || typeof activeClient.auth.setSession !== 'function') return null;
    async function tryRestore(storedSession) {
      if (!storedSession || !storedSession.access_token || !storedSession.refresh_token) {
        return { session: null, error: null };
      }
      try {
        var result = await activeClient.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        });
        var session = result && result.data ? result.data.session : null;
        if (session && session.access_token && session.refresh_token) {
          persistSessionSnapshot(session);
          return { session: session, error: null };
        }
        return {
          session: null,
          error: result && result.error ? result.error : null
        };
      } catch (error) {
        return { session: null, error: error };
      }
    }

    var storedSession = getStoredSessionSnapshot();
    if (!storedSession || !storedSession.access_token || !storedSession.refresh_token) return null;
    pushAuthDebugEvent('session:restore:start', {
      userId: String(storedSession.user && storedSession.user.id || '').trim() || null,
      expiresAt: storedSession.expires_at || null
    });

    var restoreResult = await tryRestore(storedSession);
    if (restoreResult.session) {
      pushAuthDebugEvent('session:restore:success', {
        userId: String(restoreResult.session.user && restoreResult.session.user.id || '').trim() || null
      });
      return restoreResult.session;
    }

    if (isRecoverableSessionRaceError(restoreResult.error)) {
      pushAuthDebugEvent('session:restore:race', {
        message: String(restoreResult.error && restoreResult.error.message || restoreResult.error || '')
      });
      await wait(120);
      var latestStoredSession = getStoredSessionSnapshot();
      var changedTokens = !!(
        latestStoredSession &&
        latestStoredSession.access_token &&
        latestStoredSession.refresh_token &&
        (
          latestStoredSession.access_token !== storedSession.access_token ||
          latestStoredSession.refresh_token !== storedSession.refresh_token
        )
      );

      if (changedTokens) {
        restoreResult = await tryRestore(latestStoredSession);
        if (restoreResult.session) {
          pushAuthDebugEvent('session:restore:success', {
            userId: String(restoreResult.session.user && restoreResult.session.user.id || '').trim() || null,
            source: 'rotated'
          });
          return restoreResult.session;
        }
      }

      try {
        var liveSessionResult = await activeClient.auth.getSession();
        var liveSession = liveSessionResult && liveSessionResult.data ? liveSessionResult.data.session : null;
        if (liveSession && liveSession.access_token && liveSession.refresh_token) {
          persistSessionSnapshot(liveSession);
          pushAuthDebugEvent('session:restore:success', {
            userId: String(liveSession.user && liveSession.user.id || '').trim() || null,
            source: 'live'
          });
          return liveSession;
        }
      } catch (_liveError) {}
    }

    if (shouldClearPersistedSessionForError(restoreResult.error)) {
      clearPersistedSessionSnapshots();
    }
    pushAuthDebugEvent('session:restore:failed', {
      message: String(restoreResult.error && restoreResult.error.message || restoreResult.error || '')
    });
    return null;
  }

  // Expose a bootstrap helper to attempt restoring a session on app load.
  // This is used by a bootstrap script to prehydrate auth state before UI renders.
  try {
    if (typeof window !== 'undefined') {
      window.__ZO2Y_BOOTSTRAP_RESTORE_SESSION = async function () {
        try {
          // Make sure Supabase client exists or is initializeable
          var ok = await waitForSupabase(8000);
          if (!ok) return null;
          var client = ensureSharedSupabaseClient();
          if (!client || !client.auth || typeof client.auth.getSession !== 'function') {
            return null;
          }
          var res = await client.auth.getSession();
          var session = res && res.data ? res.data.session : null;
          if (session && session.access_token && session.refresh_token) {
            persistSessionSnapshot(session);
            return session;
          }
          // If no session in response, return null
          return null;
        } catch (_err) {
          return null;
        }
      };
    }
  } catch (_e) {}

  async function getActiveSession(client, options) {
    if (activeSessionPromise) {
      pushAuthDebugEvent('session:get:join');
      return activeSessionPromise;
    }

    var opts = options || {};
    var activeClient = client || ensureSharedSupabaseClient();
    if (!activeClient || !activeClient.auth || typeof activeClient.auth.getSession !== 'function') return null;

    activeSessionPromise = (async function () {
      var startedAt = Date.now();
      var initialSessionError = null;
      try {
        var sessionResult = await activeClient.auth.getSession();
        var session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
        if (session && session.access_token && session.refresh_token) {
          persistSessionSnapshot(session);
          pushAuthDebugEvent('session:get:live', {
            userId: String(session.user && session.user.id || '').trim() || null,
            ms: Date.now() - startedAt
          });
          return session;
        }
        if (sessionResult && sessionResult.error) {
          initialSessionError = sessionResult.error;
          pushAuthDebugEvent('session:get:error', {
            source: 'getSession',
            message: String(sessionResult.error && sessionResult.error.message || sessionResult.error || ''),
            ms: Date.now() - startedAt
          });
        }
      } catch (_err) {
        initialSessionError = _err;
        pushAuthDebugEvent('session:get:error', {
          source: 'getSession:throw',
          message: String(_err && _err.message || _err || ''),
          ms: Date.now() - startedAt
        });
      }

      if (opts.restore !== false) {
        var restored = await restoreClientSessionFromSnapshot(activeClient);
        if (restored && restored.user) {
          pushAuthDebugEvent('session:get:restored', {
            userId: String(restored.user && restored.user.id || '').trim() || null,
            ms: Date.now() - startedAt
          });
          return restored;
        }
      }

      if (opts.refreshIfNeeded !== false && typeof activeClient.auth.refreshSession === 'function' && hasStoredSupabaseSession() && !hasRecentExplicitSignout()) {
        try {
          var refreshResult = await activeClient.auth.refreshSession();
          var refreshed = refreshResult && refreshResult.data ? refreshResult.data.session : null;
          if (refreshed && refreshed.access_token && refreshed.refresh_token) {
            persistSessionSnapshot(refreshed);
            pushAuthDebugEvent('session:get:refreshed', {
              userId: String(refreshed.user && refreshed.user.id || '').trim() || null,
              ms: Date.now() - startedAt
            });
            return refreshed;
          }
          if (refreshResult && refreshResult.error && shouldClearPersistedSessionForError(refreshResult.error)) {
            clearPersistedSessionSnapshots();
          }
        } catch (error) {
          if (shouldClearPersistedSessionForError(error)) {
            clearPersistedSessionSnapshots();
          }
        }
      }

      if (initialSessionError && shouldClearPersistedSessionForError(initialSessionError) && opts.restore === false) {
        clearPersistedSessionSnapshots();
      }

      pushAuthDebugEvent('session:get:none', {
        restore: opts.restore !== false,
        refresh: opts.refreshIfNeeded !== false,
        hadInitialError: !!initialSessionError,
        ms: Date.now() - startedAt
      });
      return null;
    })();

    try {
      return await activeSessionPromise;
    } finally {
      activeSessionPromise = null;
    }
  }

  async function getVerifiedUser(client) {
    var session = await getActiveSession(client, { refreshIfNeeded: true, restore: true });
    if (session && session.user) return session.user;
    return null;
  }

  async function signOut(client) {
    markExplicitSignout();
    clearPersistedSessionSnapshots();
    clearPostAuthIntent();
    safeRemoveLocalStorage(POST_AUTH_BOOTSTRAP_KEY);
    safeRemoveLocalStorage(OLD_POST_AUTH_BOOTSTRAP_KEY);
    var activeClient = client || ensureSharedSupabaseClient();
    if (activeClient && activeClient.auth && typeof activeClient.auth.signOut === 'function') {
      try {
        await activeClient.auth.signOut({ scope: 'local' });
      } catch (_err) {}
    }
    return true;
  }

  function buildPostAuthBootstrapPayload(flow, session) {
    var user = session && session.user ? session.user : null;
    if (!user || !user.id) return null;
    return {
      flow: String(flow || 'login').trim().toLowerCase() || 'login',
      userId: user.id,
      email: String(user.email || '').trim(),
      fullName: String(user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name) || '').trim(),
      createdAt: Date.now()
    };
  }

  function setPendingPostAuthBootstrap(payload) {
    if (!payload || !payload.userId) return false;
    var raw = JSON.stringify(Object.assign({}, payload, {
      createdAt: Number(payload.createdAt || Date.now())
    }));
    var wrotePrimary = safeSetLocalStorage(POST_AUTH_BOOTSTRAP_KEY, raw);
    var wroteLegacy = safeSetLocalStorage(OLD_POST_AUTH_BOOTSTRAP_KEY, raw);
    return wrotePrimary || wroteLegacy;
  }

  function readPendingPostAuthBootstrap() {
    var raw = safeGetAnyLocalStorage([POST_AUTH_BOOTSTRAP_KEY, OLD_POST_AUTH_BOOTSTRAP_KEY]);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_err) {
      return null;
    }
  }

  function clearPendingPostAuthBootstrap() {
    safeRemoveLocalStorage(POST_AUTH_BOOTSTRAP_KEY);
    safeRemoveLocalStorage(OLD_POST_AUTH_BOOTSTRAP_KEY);
  }

  async function triggerWelcomeEmail(session, flow) {
    var accessToken = String(session && session.access_token || '').trim();
    if (!accessToken) return false;
    try {
      var response = await fetch('/api/emails/welcome/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
          appUrl: window.location.origin,
          flow: flow || null
        })
      });
      return response.ok;
    } catch (_err) {
      return false;
    }
  }

  async function persistReferralMetadata(client, user) {
    if (!client || !client.auth || typeof client.auth.updateUser !== 'function' || !window.ZO2Y_REFERRALS || !user || !user.id) {
      return false;
    }
    var referral = String(window.ZO2Y_REFERRALS.getStoredReferral() || '').trim().toLowerCase();
    if (!referral) return false;
    if (String(user.user_metadata && user.user_metadata.referred_by_username || '').trim().toLowerCase() === referral) {
      window.ZO2Y_REFERRALS.markReferralConsumed(user.id, referral);
      return true;
    }
    if (window.ZO2Y_REFERRALS.getConsumedReferral(user.id) === referral) return true;
    try {
      var updateResult = await client.auth.updateUser({
        data: {
          referred_by_username: referral
        }
      });
      if (updateResult && updateResult.error) return false;
      window.ZO2Y_REFERRALS.markReferralConsumed(user.id, referral);
      return true;
    } catch (_err) {
      return false;
    }
  }

  async function updateAuthMetadataUsername(client, username) {
    if (!client || !client.auth || typeof client.auth.updateUser !== 'function') return false;
    try {
      await client.auth.updateUser({
        data: {
          zo2y_username: username,
          username: username
        }
      });
      return true;
    } catch (_err) {
      return false;
    }
  }

  async function syncUserProfileRecord(client, user, profileUpdates) {
    var safeUserId = String(user && user.id || '').trim();
    if (!client || !safeUserId || !client.from) return null;

    var payload = Object.assign({}, profileUpdates || {});
    payload.id = safeUserId;
    if (!Object.prototype.hasOwnProperty.call(payload, 'updated_at')) {
      payload.updated_at = new Date().toISOString();
    }

    function shouldStripColumn(error, columnName) {
      var message = String(error && error.message || '').toLowerCase();
      return message.indexOf(String(columnName || '').toLowerCase()) !== -1;
    }

    function withoutOptionalColumns(source, error) {
      var next = Object.assign({}, source);
      if (shouldStripColumn(error, 'user_id')) delete next.user_id;
      if (shouldStripColumn(error, 'onboarding_completed_at')) delete next.onboarding_completed_at;
      return next;
    }

    try {
      var byIdPayload = payload;
      var byId = await client
        .from('user_profiles')
        .update(byIdPayload)
        .eq('id', safeUserId)
        .select('id, username, full_name, onboarding_completed_at')
        .limit(1);
      if (byId.error && (shouldStripColumn(byId.error, 'onboarding_completed_at'))) {
        byIdPayload = withoutOptionalColumns(payload, byId.error);
        byId = await client
          .from('user_profiles')
          .update(byIdPayload)
          .eq('id', safeUserId)
          .select('id, username, full_name')
          .limit(1);
      }
      if (!byId.error && Array.isArray(byId.data) && byId.data[0]) {
        return byId.data[0];
      }
      if (byId.error && String(byId.error.code || '') !== 'PGRST116') {
        throw byId.error;
      }
    } catch (_byIdError) {}

    try {
      var byUserIdPayload = payload;
      var byUserId = await client
        .from('user_profiles')
        .update(byUserIdPayload)
        .eq('user_id', safeUserId)
        .select('id, username, full_name, onboarding_completed_at')
        .limit(1);
      if (byUserId.error && (shouldStripColumn(byUserId.error, 'user_id') || shouldStripColumn(byUserId.error, 'onboarding_completed_at'))) {
        byUserIdPayload = withoutOptionalColumns(payload, byUserId.error);
        byUserId = await client
          .from('user_profiles')
          .update(byUserIdPayload)
          .eq('user_id', safeUserId)
          .select('id, username, full_name')
          .limit(1);
      }
      if (!byUserId.error && Array.isArray(byUserId.data) && byUserId.data[0]) {
        return byUserId.data[0];
      }
      if (byUserId.error && String(byUserId.error.code || '') !== 'PGRST116') {
        throw byUserId.error;
      }
    } catch (_byUserIdError) {}

    var insertPayload = Object.assign({
      id: safeUserId,
      user_id: safeUserId,
      created_at: new Date().toISOString()
    }, payload);

    try {
      var inserted = await client
        .from('user_profiles')
        .upsert(insertPayload, { onConflict: 'id' })
        .select('id, username, full_name, onboarding_completed_at')
        .limit(1);
      if (inserted.error && (shouldStripColumn(inserted.error, 'user_id') || shouldStripColumn(inserted.error, 'onboarding_completed_at'))) {
        insertPayload = withoutOptionalColumns(insertPayload, inserted.error);
        var retry = await client
          .from('user_profiles')
          .upsert(insertPayload, { onConflict: 'id' })
          .select('id, username, full_name')
          .limit(1);
        if (!retry.error && Array.isArray(retry.data) && retry.data[0]) {
          return retry.data[0];
        }
        inserted = retry;
      }
      if (!inserted.error && Array.isArray(inserted.data) && inserted.data[0]) {
        return inserted.data[0];
      }
    } catch (_insertError) {}

    return readAuthProfileRow(client, safeUserId);
  }

  function redirectToOnboarding(rawNext, userId) {
    var next = sanitizeNextPath(rawNext || 'index.html');
    if (userId) {
      markOnboardingPending(userId);
      markOnboardingRedirectedThisSession(userId);
    }
    safeSetLocalStorage(POST_AUTH_REDIRECT_KEY, next);
    window.location.replace('onboarding.html?onboarding=1&next=' + encodeURIComponent(next));
  }

  function redirectToPostAuthTarget(rawNext, options) {
    var opts = options || {};
    var next = sanitizeNextPath(rawNext || 'index.html');
    if (opts.inPlace === true && getSanitizedCurrentPath() === next) {
      return replaceCurrentUrlAfterAuth(next);
    }
    clearPostAuthIntent();
    window.location.replace(buildPostAuthRedirectTarget(next));
    return true;
  }

  async function finishAuthRedirect(options) {
    var opts = Object.assign({}, options || {});
    var flow = String(opts.flow || 'login').trim().toLowerCase() || 'login';
    var nextPath = sanitizeNextPath(opts.next || readRequestedNextPath(''));
    var client = opts.client || ensureSharedSupabaseClient();
    var session = opts.session || await getActiveSession(client, { refreshIfNeeded: true, restore: true });
    if (!session || !session.access_token || !session.refresh_token || !session.user || !session.user.id) {
      throw new Error('Authentication was not completed. Please try again.');
    }

    persistSessionSnapshot(session);
    pushAuthDebugEvent('redirect:finish:start', {
      flow: flow,
      userId: String(session.user && session.user.id || '').trim() || null,
      next: nextPath
    });
    if (flow === 'login') {
      void persistReferralMetadata(client, session.user);
      void ensureAuthProfile(client, session.user);
      redirectToPostAuthTarget(nextPath, {
        inPlace: opts.inPlace === true
      });
      return true;
    }
    if (flow === 'signup') {
      var bootstrapPayload = buildPostAuthBootstrapPayload(flow, session);
      if (bootstrapPayload) setPendingPostAuthBootstrap(bootstrapPayload);
      void triggerWelcomeEmail(session, flow);
    }

    void persistReferralMetadata(client, session.user);

    var profileResult = await ensureAuthProfile(client, session.user);
    if (profileResult && profileResult.ok && !profileResult.needsOnboarding && flow !== 'signup') {
      clearOnboardingPending(session.user.id);
      redirectToPostAuthTarget(nextPath, {
        inPlace: opts.inPlace === true
      });
      return true;
    }

    if (profileResult && profileResult.ok && profileResult.needsOnboarding) {
      redirectToOnboarding(nextPath, session.user.id);
      return true;
    }

    if (flow === 'signup') {
      redirectToOnboarding(nextPath, session.user.id);
      return true;
    }

    redirectToPostAuthTarget(nextPath, {
      inPlace: opts.inPlace === true
    });
    return true;
  }

  async function startGoogleOAuth(options) {
    var opts = Object.assign({}, options || {});
    var flow = String(opts.flow || 'login').trim().toLowerCase() === 'signup' ? 'signup' : 'login';
    var nextPath = sanitizeNextPath(opts.next || readRequestedNextPath(''));
    var client = opts.client || ensureSharedSupabaseClient();
    if (!client || !client.auth || typeof client.auth.signInWithOAuth !== 'function') {
      throw new Error('Google sign-in is not available right now.');
    }
    setPostAuthIntent(flow, nextPath);
    var callbackUrl = new URL(nextPath || 'index.html', window.location.origin);
    callbackUrl.searchParams.set('flow', flow);
    callbackUrl.searchParams.set('next', nextPath);
    var oauthResult = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (oauthResult && oauthResult.error) throw oauthResult.error;
    return true;
  }

  async function completeOAuthCallback(options) {
    var opts = Object.assign({}, options || {});
    var client = opts.client || ensureSharedSupabaseClient();
    if (!client || !client.auth) {
      throw new Error('Auth library unavailable.');
    }

    var params = new URLSearchParams(window.location.search || '');
    var hashParams = getHashParams();
    var oauthError = params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error');
    if (oauthError) {
      throw new Error(String(oauthError).trim() || 'Google sign-in failed.');
    }

    var code = params.get('code');
    var accessToken = hashParams.get('access_token');
    var refreshToken = hashParams.get('refresh_token');
    var session = null;

    if (code && typeof client.auth.exchangeCodeForSession === 'function') {
      try {
        var exchangeResult = await client.auth.exchangeCodeForSession(code);
        if (exchangeResult && exchangeResult.error) throw exchangeResult.error;
        session = exchangeResult && exchangeResult.data ? exchangeResult.data.session : null;
      } catch (exchangeError) {
        var exchangeMessage = String(exchangeError && exchangeError.message || '').toLowerCase();
        if (
          exchangeMessage.indexOf('code verifier') === -1 &&
          exchangeMessage.indexOf('pkce') === -1 &&
          exchangeMessage.indexOf('verifier') === -1
        ) {
          throw exchangeError;
        }
        session = await getActiveSession(client, { refreshIfNeeded: true, restore: true });
        if (!session || !session.user || !session.user.id) {
          throw exchangeError;
        }
      }
    } else if (accessToken && refreshToken && typeof client.auth.setSession === 'function') {
      var setResult = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (setResult && setResult.error) throw setResult.error;
      session = setResult && setResult.data ? setResult.data.session : null;
    }

    if (!session) {
      session = await getActiveSession(client, { refreshIfNeeded: true, restore: true });
    }
    if (!session || !session.access_token || !session.refresh_token || !session.user || !session.user.id) {
      throw new Error('Authentication was not completed. Please try again.');
    }

    persistSessionSnapshot(session);
    return session;
  }

  async function bootstrapRecoverySession(client) {
    var activeClient = client || createIsolatedSupabaseClient({
      auth: {
        detectSessionInUrl: false,
        autoRefreshToken: false
      }
    });
    if (!activeClient || !activeClient.auth) return null;

    var params = new URLSearchParams(window.location.search || '');
    var hashParams = getHashParams();
    var code = params.get('code');
    var accessToken = hashParams.get('access_token');
    var refreshToken = hashParams.get('refresh_token');

    if (code && typeof activeClient.auth.exchangeCodeForSession === 'function') {
      try {
        await activeClient.auth.exchangeCodeForSession(code);
      } catch (_err) {}
    } else if (accessToken && refreshToken && typeof activeClient.auth.setSession === 'function') {
      try {
        await activeClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
      } catch (_err2) {}
    }

    return getActiveSession(activeClient, { refreshIfNeeded: false, restore: true });
  }

  function applyShellState(authenticated, currentPageKey, options) {
    var opts = options || {};
    var verified = opts.verified !== false;
    var shell = opts.shell || (currentPageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app');

    document.documentElement.dataset.authenticated = authenticated ? '1' : '0';
    document.documentElement.dataset.authShell = shell;
    document.documentElement.dataset.authVerified = verified ? '1' : '0';

    if (document.body) {
      document.body.dataset.authenticated = authenticated ? '1' : '0';
      document.body.dataset.authShell = shell;
      document.body.dataset.authVerified = verified ? '1' : '0';
    }

    window.ZO2Y_AUTH_GATE = {
      pageKey: currentPageKey,
      authenticated: authenticated,
      protectedPage: !PUBLIC_PAGE_KEYS.has(currentPageKey),
      authShell: shell,
      verified: verified
    };
  }

  function dispatchGateVerified(authenticated) {
    window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
      detail: {
        authenticated: authenticated,
        pageKey: pageKey,
        protectedPage: !PUBLIC_PAGE_KEYS.has(pageKey),
        verified: true
      }
    }));
  }

  function redirectToLogin(rawNext) {
    window.location.replace(buildLoginRedirectTarget(rawNext));
  }

  function shouldVerifyCurrentPage() {
    return pageKey === 'index' || !PUBLIC_PAGE_KEYS.has(pageKey);
  }

  function maybeRedirectUnexpectedAuthCallback() {
    if (pageKey === 'auth-callback' || pageKey === 'update-password') return false;
    var params = new URLSearchParams(window.location.search || '');
    var hashParams = getHashParams();
    var hasPayload =
      params.has('code') ||
      params.has('error') ||
      params.has('error_description') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('error') ||
      hashParams.has('error_description');

    if (!hasPayload) return false;

    var recoveryType = String(params.get('type') || hashParams.get('type') || '').trim().toLowerCase();
    if (recoveryType !== 'recovery') return false;

    var flow = String(params.get('flow') || safeGetAnyLocalStorage([OAUTH_FLOW_KEY, OLD_OAUTH_FLOW_KEY]) || '').trim().toLowerCase();
    var targetPage = 'update-password.html';
    var target = new URL(targetPage, window.location.origin);

    if (window.location.search) target.search = window.location.search;
    if (window.location.hash) target.hash = window.location.hash;
    if (flow && !target.searchParams.has('flow')) target.searchParams.set('flow', flow);
    if (!target.searchParams.has('next')) {
      target.searchParams.set('next', readRequestedNextPath(''));
    }
    window.location.replace(target.toString());
    return true;
  }

  function maybeHandleInlineOAuthReturn() {
    if (pageKey === 'auth-callback' || pageKey === 'update-password') return false;

    var params = new URLSearchParams(window.location.search || '');
    var hashParams = getHashParams();
    var hasPayload =
      params.has('code') ||
      params.has('error') ||
      params.has('error_description') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('error') ||
      hashParams.has('error_description');

    if (!hasPayload) return false;

    var recoveryType = String(params.get('type') || hashParams.get('type') || '').trim().toLowerCase();
    if (recoveryType === 'recovery') return false;

    var flow = String(params.get('flow') || safeGetAnyLocalStorage([OAUTH_FLOW_KEY, OLD_OAUTH_FLOW_KEY]) || 'login').trim().toLowerCase();
    if (flow !== 'signup') flow = 'login';
    var nextPath = sanitizeNextPath(params.get('next') || readRequestedNextPath('') || getSanitizedCurrentPath());

    pushAuthDebugEvent('oauth:inline:start', {
      pageKey: pageKey,
      flow: flow,
      next: nextPath
    });

    void (async function () {
      try {
        await waitForSupabase(8000);
        var client = ensureSharedSupabaseClient();
        if (!client) throw new Error('Google sign-in is unavailable right now.');
        var session = await completeOAuthCallback({
          client: client
        });
        await finishAuthRedirect({
          client: client,
          session: session,
          flow: flow,
          next: nextPath,
          inPlace: true
        });
      } catch (error) {
        pushAuthDebugEvent('oauth:inline:error', {
          pageKey: pageKey,
          flow: flow,
          message: String(error && error.message || error || '').slice(0, 180)
        });
        var fallback = new URL(flow === 'signup' ? 'sign-up.html' : 'login.html', window.location.origin);
        fallback.searchParams.set('next', nextPath);
        window.location.replace(fallback.toString());
      }
    })();

    return true;
  }

  async function verifyAndApplySession(force) {
    if (verifyInFlight) return verifyInFlight;

    verifyInFlight = (async function () {
      var startedAt = Date.now();
      var authenticated = false;
      pushAuthDebugEvent('verify:start', {
        force: !!force,
        pageKey: pageKey
      });
      try {
        if (!(await waitForSupabase(7000))) {
          authenticated = hasStoredSupabaseSession();
          applyShellState(authenticated, pageKey, {
            verified: !shouldVerifyCurrentPage(),
            shell: pageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app'
          });
          if (!authenticated && !PUBLIC_PAGE_KEYS.has(pageKey) && !AUTH_ENTRY_PAGES.has(pageKey)) {
            redirectToLogin(window.location.pathname + window.location.search + window.location.hash);
            return false;
          }
          dispatchGateVerified(authenticated);
          pushAuthDebugEvent('verify:done', {
            authenticated: authenticated,
            source: 'storage-only',
            ms: Date.now() - startedAt
          });
          return authenticated;
        }

        var client = ensureSharedSupabaseClient();
        var session = await getActiveSession(client, {
          refreshIfNeeded: true,
          restore: true
        });
        authenticated = !!(session && session.user);
        if (authenticated) {
          persistSessionSnapshot(session);
        }

        if (authenticated && !AUTH_ENTRY_PAGES.has(pageKey) && pageKey !== 'onboarding') {
          var userId = String(session.user.id || '').trim();
          var onboardingParam = false;
          try {
            onboardingParam = new URLSearchParams(window.location.search || '').get('onboarding') === '1';
          } catch (_errSearch) {}
          if (userId && !onboardingParam) {
            var profileResult = await ensureAuthProfile(client, session.user);
            if (profileResult && profileResult.ok && profileResult.needsOnboarding && !wasOnboardingRedirectedThisSession(userId)) {
              redirectToOnboarding(window.location.pathname + window.location.search + window.location.hash, userId);
              return true;
            }
          }
        }

        applyShellState(authenticated, pageKey, {
          verified: true,
          shell: pageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app'
        });

        if (!authenticated && !PUBLIC_PAGE_KEYS.has(pageKey) && !AUTH_ENTRY_PAGES.has(pageKey)) {
          redirectToLogin(window.location.pathname + window.location.search + window.location.hash);
          return false;
        }

        dispatchGateVerified(authenticated);
        lastVerifyAt = Date.now();
        pushAuthDebugEvent('verify:done', {
          authenticated: authenticated,
          source: 'live',
          ms: Date.now() - startedAt
        });
        return authenticated;
      } catch (error) {
        pushAuthDebugEvent('verify:error', {
          message: String(error && error.message || error || '')
        });
        if (shouldClearPersistedSessionForError(error)) {
          clearPersistedSessionSnapshots();
          authenticated = false;
        } else {
          authenticated = hasStoredSupabaseSession();
        }
        applyShellState(authenticated, pageKey, {
          verified: true,
          shell: pageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app'
        });
        dispatchGateVerified(authenticated);
        if (!authenticated && !PUBLIC_PAGE_KEYS.has(pageKey) && !AUTH_ENTRY_PAGES.has(pageKey)) {
          redirectToLogin(window.location.pathname + window.location.search + window.location.hash);
          return false;
        }
        pushAuthDebugEvent('verify:done', {
          authenticated: authenticated,
          source: 'error-fallback',
          ms: Date.now() - startedAt
        });
        return authenticated;
      } finally {
        verifyInFlight = null;
      }
    })();

    return verifyInFlight;
  }

  async function persistLiveClientSession() {
    var session = lastKnownSessionSnapshot || getStoredSessionSnapshot();
    if (!session || !session.access_token || !session.refresh_token) return false;
    return persistSessionSnapshot(session);
  }

  function shouldThrottleResumeVerification() {
    if (!lastVerifyAt) return false;
    var throttleMs = PUBLIC_PAGE_KEYS.has(pageKey)
      ? PUBLIC_PAGE_RESUME_VERIFY_THROTTLE_MS
      : PROTECTED_PAGE_RESUME_VERIFY_THROTTLE_MS;
    return (Date.now() - lastVerifyAt) < throttleMs;
  }

  function bindLifecycleListeners() {
    if (window.__ZO2Y_AUTH_GATE_LIFECYCLE_BOUND) return;
    window.__ZO2Y_AUTH_GATE_LIFECYCLE_BOUND = true;

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        void persistLiveClientSession();
        return;
      }
      if (!shouldThrottleResumeVerification()) {
        void verifyAndApplySession(false);
      }
    });

    window.addEventListener('focus', function () {
      if (!shouldThrottleResumeVerification()) {
        void verifyAndApplySession(false);
      }
    });

    window.addEventListener('pageshow', function () {
      if (!shouldThrottleResumeVerification()) {
        void verifyAndApplySession(false);
      }
    });

    window.addEventListener('pagehide', function () {
      void persistLiveClientSession();
    });

    window.addEventListener('beforeunload', function () {
      void persistLiveClientSession();
    });

    window.addEventListener('storage', function (event) {
      var key = String(event && event.key || '').trim();
      if (
        key === STORAGE_KEY ||
        key === LEGACY_STORAGE_KEY ||
        key === PERSIST_STORAGE_KEY ||
        key === DURABLE_STORAGE_KEY ||
        key === EXPLICIT_SIGNOUT_KEY
      ) {
        void verifyAndApplySession(true);
      }
    });
  }

  function exposeAuthRuntime() {
    window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE = hydrateCanonicalAuthStorageFromDurable;
    window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT = restoreClientSessionFromSnapshot;
    window.__ZO2Y_HAS_STORED_AUTH_SESSION = hasStoredSupabaseSession;
    window.__ZO2Y_PERSIST_SESSION_SNAPSHOT = persistSessionSnapshot;
    window.__ZO2Y_ENSURE_SUPABASE_CLIENT = ensureSharedSupabaseClient;
    window.__ZO2Y_ENSURE_AUTH_PROFILE = ensureAuthProfile;
    window.__ZO2Y_MARK_EXPLICIT_SIGNOUT = markExplicitSignout;
    window.__ZO2Y_CLEAR_EXPLICIT_SIGNOUT = clearExplicitSignoutMarker;
    window.__ZO2Y_AUTH_DIAGNOSTICS = function () {
      var snapshot = getAuthDebugSnapshot();
      snapshot.oauthFlow = safeGetAnyLocalStorage([OAUTH_FLOW_KEY, OLD_OAUTH_FLOW_KEY]);
      snapshot.postAuthRedirect = safeGetAnyLocalStorage([POST_AUTH_REDIRECT_KEY, OLD_POST_AUTH_REDIRECT_KEY]);
      snapshot.pendingBootstrap = readPendingPostAuthBootstrap();
      return snapshot;
    };
    window.__ZO2Y_SET_AUTH_DEBUG = function (enabled) {
      if (enabled) return safeSetLocalStorage(AUTH_DEBUG_KEY, '1');
      safeRemoveLocalStorage(AUTH_DEBUG_KEY);
      return true;
    };
    window.__ZO2Y_AUTH_DEBUG = {
      snapshot: getAuthDebugSnapshot,
      setEnabled: window.__ZO2Y_SET_AUTH_DEBUG
    };

    window.ZO2Y_AUTH = {
      config: {
        projectRef: PROJECT_REF,
        url: SUPABASE_URL,
        key: SUPABASE_KEY
      },
      keys: {
        storage: STORAGE_KEY,
        legacyStorage: LEGACY_STORAGE_KEY,
        persistStorage: PERSIST_STORAGE_KEY,
        durableStorage: DURABLE_STORAGE_KEY,
        onboardingPendingPrefix: ONBOARDING_PENDING_PREFIX,
        postAuthBootstrap: POST_AUTH_BOOTSTRAP_KEY
      },
      waitForSupabase: waitForSupabase,
      ensureClient: ensureSharedSupabaseClient,
      createClient: createIsolatedSupabaseClient,
      getActiveSession: getActiveSession,
      getVerifiedUser: getVerifiedUser,
      persistSessionSnapshot: persistSessionSnapshot,
      restoreSessionFromSnapshot: restoreClientSessionFromSnapshot,
      clearPersistedSession: clearPersistedSessionSnapshots,
      hasStoredSession: hasStoredSupabaseSession,
      sanitizeNextPath: sanitizeNextPath,
      readRequestedNextPath: readRequestedNextPath,
      buildPostAuthRedirectTarget: buildPostAuthRedirectTarget,
      setPostAuthIntent: setPostAuthIntent,
      clearPostAuthIntent: clearPostAuthIntent,
      getOnboardingPendingKey: getOnboardingPendingKey,
      hasOnboardingPending: hasOnboardingPending,
      markOnboardingPending: markOnboardingPending,
      clearOnboardingPending: clearOnboardingPending,
      normalizeUsername: normalizeProfileUsername,
      isPlaceholderUsername: isPlaceholderProfileUsername,
      isValidUsername: isValidProfileUsername,
      ensureUsernameAvailable: ensureUsernameAvailable,
      ensureProfileBootstrap: ensureAuthProfile,
      resolveProfileLabel: resolveProfileLabel,
      updateAuthMetadataUsername: updateAuthMetadataUsername,
      syncUserProfileRecord: syncUserProfileRecord,
      triggerWelcomeEmail: triggerWelcomeEmail,
      persistReferralMetadata: persistReferralMetadata,
      buildPostAuthBootstrapPayload: buildPostAuthBootstrapPayload,
      setPendingPostAuthBootstrap: setPendingPostAuthBootstrap,
      readPendingPostAuthBootstrap: readPendingPostAuthBootstrap,
      clearPendingPostAuthBootstrap: clearPendingPostAuthBootstrap,
      startGoogleOAuth: startGoogleOAuth,
      completeOAuthCallback: completeOAuthCallback,
      finishAuthRedirect: finishAuthRedirect,
      bootstrapRecoverySession: bootstrapRecoverySession,
      signOut: signOut,
      markExplicitSignout: markExplicitSignout,
      clearExplicitSignout: clearExplicitSignoutMarker,
      hasRecentExplicitSignout: hasRecentExplicitSignout,
      getDebugSnapshot: getAuthDebugSnapshot,
      redirectToOnboarding: redirectToOnboarding,
      redirectToPostAuthTarget: redirectToPostAuthTarget
    };
  }

  installSupabasePatch();
  exposeAuthRuntime();

  if (maybeRedirectUnexpectedAuthCallback()) {
    return;
  }

  if (maybeHandleInlineOAuthReturn()) {
    return;
  }

  purgeLegacyAuthArtifacts();
  hydrateCanonicalAuthStorageFromDurable();

  var initiallyAuthenticated = !AUTH_ENTRY_PAGES.has(pageKey) && hasStoredSupabaseSession();
  applyShellState(initiallyAuthenticated, pageKey, {
    verified: AUTH_ENTRY_PAGES.has(pageKey),
    shell: pageKey === 'index'
      ? (initiallyAuthenticated ? 'app' : 'pending')
      : 'app'
  });

  bindLifecycleListeners();

  if (shouldVerifyCurrentPage()) {
    void verifyAndApplySession(false);
  }
})();
