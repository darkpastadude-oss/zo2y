(function () {
  'use strict';

  var PROJECT_REF = 'gfkhjbztayjyojsgdpgk';
  var STORAGE_KEY = 'zo2y-auth-v1';
  var LEGACY_STORAGE_KEY = 'sb-' + PROJECT_REF + '-auth-token';
  var PERSIST_STORAGE_KEY = 'zo2y-auth-persist-v1';
  var DURABLE_STORAGE_KEY = 'zo2y-auth-durable-v1';
  var EXPLICIT_SIGNOUT_KEY = 'zo2y-auth-explicit-signout-v1';
  var AUTH_DEBUG_KEY = 'zo2y_auth_debug';
  // Reduce background auth churn when users tab away/return (avoids refresh-token rate limits).
  var PUBLIC_PAGE_RESUME_VERIFY_THROTTLE_MS = 1000 * 60 * 8;
  var PROTECTED_PAGE_RESUME_VERIFY_THROTTLE_MS = 1000 * 60;
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
  var SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  function normalizePageKey(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function getAuthStorageKeys(key) {
    var value = String(key || '').trim();
    if (!value) return [];
    var keys = [value];
    if (value === STORAGE_KEY || value === LEGACY_STORAGE_KEY || value === PERSIST_STORAGE_KEY) {
      keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY];
    }
    return Array.from(new Set(keys));
  }

  function safeGetStorageItem(key) {
    var keys = getAuthStorageKeys(key);
    for (var i = 0; i < keys.length; i += 1) {
      try {
        var localValue = window.localStorage ? window.localStorage.getItem(keys[i]) : null;
        if (localValue !== null && localValue !== undefined && localValue !== '') return localValue;
      } catch (_err) {}
    }
    for (var j = 0; j < keys.length; j += 1) {
      try {
        var sessionValue = window.sessionStorage ? window.sessionStorage.getItem(keys[j]) : null;
        if (sessionValue !== null && sessionValue !== undefined && sessionValue !== '') return sessionValue;
      } catch (_err) {}
    }
    return null;
  }

  function safeSetStorageItem(key, value) {
    var keys = getAuthStorageKeys(key);
    var wroteAny = false;
    for (var i = 0; i < keys.length; i += 1) {
      try {
        if (window.localStorage) {
          var currentLocalValue = window.localStorage.getItem(keys[i]);
          if (currentLocalValue !== value) {
            window.localStorage.setItem(keys[i], value);
            wroteAny = true;
          }
        }
      } catch (_err) {}
    }
    for (var j = 0; j < keys.length; j += 1) {
      try {
        if (window.sessionStorage) {
          var currentSessionValue = window.sessionStorage.getItem(keys[j]);
          if (currentSessionValue !== value) {
            window.sessionStorage.setItem(keys[j], value);
            wroteAny = true;
          }
        }
      } catch (_err) {}
    }
    return wroteAny;
  }

  function safeRemoveStorageItem(key) {
    var keys = getAuthStorageKeys(key);
    for (var i = 0; i < keys.length; i += 1) {
      try {
        if (window.sessionStorage) window.sessionStorage.removeItem(keys[i]);
      } catch (_err) {}
    }
    for (var j = 0; j < keys.length; j += 1) {
      try {
        if (window.localStorage) window.localStorage.removeItem(keys[j]);
      } catch (_err) {}
    }
  }

  function safeGetLocalStorageItem(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeSetLocalStorageItem(key, value) {
    try {
      if (window.localStorage) {
        var currentValue = window.localStorage.getItem(key);
        if (currentValue !== value) {
          window.localStorage.setItem(key, value);
          return true;
        }
        return false;
      }
    } catch (_err) {}
    return false;
  }

  function getSupabaseStorageBridge() {
    if (window.__ZO2Y_AUTH_STORAGE_BRIDGE) return window.__ZO2Y_AUTH_STORAGE_BRIDGE;
    var bridge = {
      getItem: function (key) {
        return safeGetStorageItem(key);
      },
      setItem: function (key, value) {
        safeSetStorageItem(key, value);
      },
      removeItem: function (key) {
        safeRemoveStorageItem(key);
      }
    };
    window.__ZO2Y_AUTH_STORAGE_BRIDGE = bridge;
    return bridge;
  }

  function hasCanonicalSessionInStorage() {
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = safeGetStorageItem(keys[i]);
      if (!raw) continue;
      try {
        var parsed = JSON.parse(raw);
        var session = extractSessionFromPayload(parsed);
        if (session && session.access_token && session.refresh_token) return true;
      } catch (_err) {}
    }
    return false;
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
    var message = details.message;
    var code = details.code;
    if (!message && !code && !details.status) return false;
    if (message.indexOf('refresh token already used') !== -1) return false;
    if (message.indexOf('already been used') !== -1) return false;
    if (message.indexOf('invalid refresh token') !== -1) return true;
    if (message.indexOf('refresh token not found') !== -1) return true;
    if (message.indexOf('invalid grant') !== -1) return true;
    if (message.indexOf('session missing') !== -1) return true;
    if (message.indexOf('session not found') !== -1) return true;
    if (message.indexOf('user from sub claim in jwt does not exist') !== -1) return true;
    if (code === 'refresh_token_not_found' || code === 'session_not_found') return true;
    return false;
  }

  function clearExplicitSignoutMarker() {
    try {
      if (window.localStorage) window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
    } catch (_err) {}
  }

  function markExplicitSignout() {
    return safeSetLocalStorageItem(EXPLICIT_SIGNOUT_KEY, String(Date.now()));
  }

  function hasRecentExplicitSignout() {
    var raw = safeGetLocalStorageItem(EXPLICIT_SIGNOUT_KEY);
    if (!raw) return false;
    var timestamp = Number(raw || 0);
    if (!timestamp) {
      clearExplicitSignoutMarker();
      return false;
    }
    if ((Date.now() - timestamp) > 1000 * 60 * 10) {
      clearExplicitSignoutMarker();
      return false;
    }
    return true;
  }

  function hydrateCanonicalAuthStorageFromDurable() {
    if (hasCanonicalSessionInStorage()) return false;
    var durableSession = getDurableSessionSnapshot();
    if (!durableSession || !durableSession.access_token || !durableSession.refresh_token) return false;
    try {
      var payload = JSON.stringify(durableSession);
      safeSetStorageItem(STORAGE_KEY, payload);
      safeSetStorageItem(LEGACY_STORAGE_KEY, payload);
      safeSetStorageItem(PERSIST_STORAGE_KEY, payload);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function buildZo2yAuthOptions(options) {
    var next = Object.assign({}, options || {});
    var auth = Object.assign({}, next.auth || {});
    var requestedStorageKey = String(auth.storageKey || '').trim();
    var usesZo2yAuth =
      !requestedStorageKey ||
      requestedStorageKey === STORAGE_KEY ||
      requestedStorageKey === LEGACY_STORAGE_KEY ||
      requestedStorageKey === PERSIST_STORAGE_KEY;
    if (usesZo2yAuth) {
      auth.storage = getSupabaseStorageBridge();
      auth.storageKey = STORAGE_KEY;
      if (auth.persistSession === undefined) auth.persistSession = true;
      if (auth.autoRefreshToken === undefined) auth.autoRefreshToken = true;
    }
    next.auth = auth;
    return next;
  }

  function ensureSharedSupabaseClient(options) {
    hydrateCanonicalAuthStorageFromDurable();
    if (window.__ZO2Y_SUPABASE_CLIENT) return window.__ZO2Y_SUPABASE_CLIENT;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    var nextOptions = buildZo2yAuthOptions(options);
    if (!nextOptions.auth) nextOptions.auth = {};
    if (nextOptions.auth.detectSessionInUrl === undefined) {
      nextOptions.auth.detectSessionInUrl = false;
    }
    window.__ZO2Y_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, nextOptions);
    return window.__ZO2Y_SUPABASE_CLIENT;
  }

  function installSupabaseCreateClientPatch() {
    if (window.__ZO2Y_SUPABASE_CREATE_CLIENT_PATCHED) return;

    function patchNow() {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
      if (window.supabase.__zo2yCreateClientPatched) {
        window.__ZO2Y_SUPABASE_CREATE_CLIENT_PATCHED = true;
        return true;
      }
      var originalCreateClient = window.supabase.createClient.bind(window.supabase);
      window.supabase.createClient = function (url, key, options) {
        hydrateCanonicalAuthStorageFromDurable();
        var normalizedUrl = String(url || '').trim();
        var normalizedKey = String(key || '').trim();
        var nextOptions = buildZo2yAuthOptions(options);
        // Ensure every page only owns a single Supabase client for this project.
        // Multiple clients in the same window can race refreshSession() and cause 429 + "lock stolen".
        if (normalizedUrl === SUPABASE_URL && normalizedKey === SUPABASE_KEY) {
          if (window.__ZO2Y_SUPABASE_CLIENT) return window.__ZO2Y_SUPABASE_CLIENT;
          window.__ZO2Y_SUPABASE_CLIENT = originalCreateClient(url, key, nextOptions);
          return window.__ZO2Y_SUPABASE_CLIENT;
        }
        return originalCreateClient(url, key, nextOptions);
      };
      window.supabase.__zo2yCreateClientPatched = true;
      window.__ZO2Y_SUPABASE_CREATE_CLIENT_PATCHED = true;
      return true;
    }

    if (patchNow()) return;

    var attempts = 0;
    var pollTimer = window.setInterval(function () {
      attempts += 1;
      if (patchNow() || attempts > 200) {
        window.clearInterval(pollTimer);
      }
    }, 50);
  }

  function migrateLegacySessionStorage() {
    var current = safeGetStorageItem(STORAGE_KEY);
    if (current) return;
    var legacy = safeGetStorageItem(LEGACY_STORAGE_KEY);
    if (!legacy) return;
    safeSetStorageItem(STORAGE_KEY, legacy);
  }

  function getHashParams() {
    var rawHash = window.location.hash || '';
    if (rawHash.charAt(0) === '#') rawHash = rawHash.slice(1);
    return new URLSearchParams(rawHash);
  }

  function authDebugEnabled() {
    try {
      var params = new URLSearchParams(window.location.search);
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

  function previewSession(session) {
    return session ? {
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
      userId: String(session.user && session.user.id || '').trim() || null,
      email: String(session.user && session.user.email || '').trim() || null,
      provider: String(session.user && session.user.app_metadata && session.user.app_metadata.provider || session.user && session.user.user_metadata && session.user.user_metadata.provider || '').trim() || null,
      expiresAt: session.expires_at || null
    } : null;
  }

  function authDebug(label, payload) {
    if (!authDebugEnabled()) return;
    if (payload === undefined) {
      console.log('[ZO2Y AUTH][gate]', label);
      return;
    }
    console.log('[ZO2Y AUTH][gate]', label, payload);
  }

  function maybeRedirectOAuthCallback(pageKey) {
    if (pageKey === 'auth-callback' || pageKey === 'update-password') return;
    var search = new URLSearchParams(window.location.search);
    var hashParams = getHashParams();
    var inlineOauthReturn = search.get('native_oauth') === '1' && (pageKey === 'login' || pageKey === 'sign-up' || pageKey === 'signup');
    var hasOauthCode = search.has('code') && (search.has('state') || search.has('provider') || search.has('flow'));
    var hasOauthError = search.has('error') || search.has('error_description');
    var hasHashTokens = hashParams.has('access_token') || hashParams.has('error') || hashParams.has('error_description');
    var oauthFlow = safeGetStorageItem('oauthFlow');
    if (inlineOauthReturn && (hasOauthCode || hasOauthError || hasHashTokens)) return;
    if (!(hasOauthCode || hasOauthError || hasHashTokens || oauthFlow)) return;
    if (!hasOauthCode && !hasOauthError && !hasHashTokens) return;

    var callbackTarget = 'auth-callback.html';
    if (oauthFlow === 'login') {
      callbackTarget = 'login.html';
    } else if (oauthFlow === 'signup') {
      callbackTarget = 'sign-up.html';
    }
    var callbackUrl = new URL(callbackTarget, window.location.origin);
    if (window.location.search) {
      callbackUrl.search = window.location.search;
    }
    if (window.location.hash) {
      callbackUrl.hash = window.location.hash;
    }
    if (callbackTarget !== 'auth-callback.html') {
      callbackUrl.searchParams.set('native_oauth', '1');
    }
    if (oauthFlow && !callbackUrl.searchParams.has('flow')) {
      callbackUrl.searchParams.set('flow', oauthFlow);
    }
    var nextParam = search.get('next') || safeGetStorageItem('postAuthRedirect');
    if (nextParam && !callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', nextParam);
    }
    authDebug('maybeRedirectOAuthCallback', {
      pageKey: pageKey,
      oauthFlow: oauthFlow,
      callbackTarget: callbackTarget,
      search: window.location.search,
      hash: window.location.hash
    });
    window.location.replace(callbackUrl.toString());
  }

  function hasSessionPayload(value) {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.some(hasSessionPayload);
    }
    if (typeof value === 'object') {
      if (value.access_token || value.refresh_token) return true;
      if (hasSessionPayload(value.currentSession)) return true;
      if (hasSessionPayload(value.session)) return true;
      if (hasSessionPayload(value.sessions)) return true;
      if (hasSessionPayload(value.user)) return true;
      return false;
    }
    return false;
  }

  function hasStoredSupabaseSession() {
    hydrateCanonicalAuthStorageFromDurable();
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = safeGetStorageItem(keys[i]);
      if (!raw) continue;
      try {
        if (hasSessionPayload(JSON.parse(raw))) return true;
      } catch (_err) {
        if (/access_token|refresh_token|currentSession|expires_at/i.test(String(raw))) return true;
      }
    }
    var durableSession = getDurableSessionSnapshot();
    if (durableSession && durableSession.access_token && durableSession.refresh_token) {
      return true;
    }
    return false;
  }

  function extractSessionFromPayload(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i += 1) {
        var nested = extractSessionFromPayload(value[i]);
        if (nested) return nested;
      }
      return null;
    }
    if (typeof value !== 'object') return null;
    if (value.access_token && value.refresh_token) return value;
    if (value.currentSession) return extractSessionFromPayload(value.currentSession);
    if (value.session) return extractSessionFromPayload(value.session);
    if (value.sessions) return extractSessionFromPayload(value.sessions);
    return null;
  }

  function getStoredSessionSnapshot() {
    hydrateCanonicalAuthStorageFromDurable();
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = safeGetStorageItem(keys[i]);
      if (!raw) continue;
      try {
        var parsed = JSON.parse(raw);
        var session = extractSessionFromPayload(parsed);
        if (session && session.access_token && session.refresh_token) {
          return session;
        }
      } catch (_err) {}
    }
    var durableSession = getDurableSessionSnapshot();
    if (durableSession && durableSession.access_token && durableSession.refresh_token) {
      return durableSession;
    }
    return null;
  }

  function getDurableSessionSnapshot() {
    var raw = safeGetLocalStorageItem(DURABLE_STORAGE_KEY);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      var session = extractSessionFromPayload(parsed && parsed.session ? parsed.session : parsed);
      if (session && session.access_token && session.refresh_token) {
        return session;
      }
    } catch (_err) {}
    return null;
  }

  function clearPersistedSessionSnapshots() {
    safeRemoveStorageItem(STORAGE_KEY);
    safeRemoveStorageItem(LEGACY_STORAGE_KEY);
    safeRemoveStorageItem(PERSIST_STORAGE_KEY);
    try {
      if (window.localStorage) window.localStorage.removeItem(DURABLE_STORAGE_KEY);
    } catch (_err) {}
  }

  function buildDurableSessionPayload(session) {
    if (!session || !session.access_token || !session.refresh_token) return '';
    try {
      return JSON.stringify({
        session: session,
        signature: getStoredSessionSignature(session),
        userId: String(session.user && session.user.id || '').trim() || null,
        expiresAt: Number(session.expires_at || 0) || null
      });
    } catch (_err) {
      return '';
    }
  }

  function persistSessionSnapshot(session) {
    if (!session || !session.access_token || !session.refresh_token) return false;
    try {
      var payload = JSON.stringify(session);
      var durablePayload = buildDurableSessionPayload(session);
      var wroteAny =
        safeSetStorageItem(STORAGE_KEY, payload) ||
        safeSetStorageItem(LEGACY_STORAGE_KEY, payload) ||
        safeSetStorageItem(PERSIST_STORAGE_KEY, payload);
      if (durablePayload) {
        wroteAny = safeSetLocalStorageItem(DURABLE_STORAGE_KEY, durablePayload) || wroteAny;
      }
      clearExplicitSignoutMarker();
      authDebug('persistSessionSnapshot', {
        wroteAny: wroteAny,
        session: previewSession(session)
      });
      return wroteAny;
    } catch (_err) {
      authDebug('persistSessionSnapshot:error', {
        message: String(_err && _err.message || _err || '')
      });
      return false;
    }
  }

  async function restoreClientSessionFromSnapshot(client) {
    if (hasRecentExplicitSignout()) return null;
    if (!client || !client.auth || typeof client.auth.setSession !== 'function') return null;
    var storedSession = getStoredSessionSnapshot();
    if (!storedSession || !storedSession.access_token || !storedSession.refresh_token) return null;
    authDebug('restoreClientSessionFromSnapshot:start', {
      session: previewSession(storedSession)
    });
    try {
      var setResult = await client.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token
      });
      var session = setResult && setResult.data ? setResult.data.session : null;
      if (session && session.access_token && session.refresh_token) {
        persistSessionSnapshot(session);
        authDebug('restoreClientSessionFromSnapshot:success', {
          session: previewSession(session)
        });
        return session;
      }
    } catch (_err) {
      authDebug('restoreClientSessionFromSnapshot:error', {
        message: String(_err && _err.message || _err || '')
      });
      if (shouldClearPersistedSessionForError(_err)) {
        clearPersistedSessionSnapshots();
      }
    }
    return null;
  }

  function getStoredSessionSignature(session) {
    if (!session || !session.access_token || !session.refresh_token) return '';
    return String(session.access_token).slice(0, 24) + '|' + String(session.refresh_token).slice(0, 24);
  }

  function decodeJwtPayload(token) {
    try {
      var parts = String(token || '').split('.');
      if (parts.length < 2) return null;
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var padded = base64 + '==='.slice((base64.length + 3) % 4);
      return JSON.parse(window.atob(padded));
    } catch (_err) {
      return null;
    }
  }

  function getStoredSessionFutureWaitMs(session) {
    var payload = decodeJwtPayload(session && session.access_token);
    var issuedAt = Number(payload && payload.iat ? payload.iat : 0);
    if (!issuedAt) return 0;
    var now = Math.floor(Date.now() / 1000);
    var skewSeconds = issuedAt - now;
    if (skewSeconds <= 1) return 0;
    return Math.min(4500, (skewSeconds + 1) * 1000);
  }

  function normalizeProfileUsername(value) {
    var normalized = String(value || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/[\u0027\u2019]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30);
    if (!normalized) return 'user';
    if (normalized.length < 3) return normalizeProfileUsername('user_' + normalized);
    if (RESERVED_PROFILE_USERNAMES.has(normalized.replace(/_/g, ''))) {
      return (normalized.slice(0, 24) + '_user').slice(0, 30);
    }
    return normalized;
  }

  function profileUsernameWithSuffix(base, suffix) {
    var normalizedBase = normalizeProfileUsername(base || 'user');
    var normalizedSuffix = normalizeProfileUsername(suffix || 'user').slice(0, 8) || 'user';
    var limit = Math.max(3, 30 - normalizedSuffix.length - 1);
    return (normalizedBase.slice(0, limit) + '_' + normalizedSuffix).slice(0, 30);
  }

  async function ensureAuthProfile(client, user) {
    if (!client || typeof client.from !== 'function' || !user || !user.id) {
      return { ok: false, created: false, profile: null };
    }

    try {
      var existingResult = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .eq('id', user.id)
        .maybeSingle();
      var existingProfile = existingResult && existingResult.data ? existingResult.data : null;
      if (existingProfile && existingProfile.id) {
        var existingUsername = String(existingProfile.username || '').trim().toLowerCase();
        var existingNeedsUsername = !existingUsername || existingUsername === 'user' || existingUsername.indexOf('user_') === 0;
        return { ok: true, created: false, profile: existingProfile, needsUsername: existingNeedsUsername };
      }
      if (existingResult && existingResult.error) {
        return { ok: false, created: false, profile: null, error: existingResult.error };
      }

      var userData = user.user_metadata || {};
      var idSuffix = String(user.id || '').replace(/-/g, '').slice(0, 6) || 'user';
      // Do NOT derive username from email / OAuth metadata. Use a neutral placeholder and
      // force users to choose their own handle during onboarding.
      var placeholderUsername = profileUsernameWithSuffix('user', idSuffix);
      var displayName = String(userData.full_name || userData.name || 'User').trim().slice(0, 80) || 'User';
      var usernameCandidates = [placeholderUsername];

      for (var i = 0; i < usernameCandidates.length; i += 1) {
        var username = usernameCandidates[i];
        var createResult = await client
          .from('user_profiles')
          .insert({
            id: user.id,
            username: username,
            full_name: displayName || username
          })
          .select('id, username, full_name')
          .maybeSingle();
        if (!createResult || !createResult.error) {
          return {
            ok: true,
            created: true,
            needsUsername: true,
            profile: createResult && createResult.data ? createResult.data : {
              id: user.id,
              username: username,
              full_name: displayName || username
            }
          };
        }

        var message = String(createResult.error && createResult.error.message || '').toLowerCase();
        var duplicate = message.indexOf('duplicate') !== -1 || message.indexOf('unique') !== -1;
        if (!duplicate) {
          return { ok: false, created: false, profile: null, error: createResult.error };
        }

        var raceResult = await client
          .from('user_profiles')
          .select('id, username, full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (raceResult && raceResult.data && raceResult.data.id) {
          var raceUsername = String(raceResult.data.username || '').trim().toLowerCase();
          var raceNeedsUsername = !raceUsername || raceUsername === 'user' || raceUsername.indexOf('user_') === 0;
          return { ok: true, created: false, profile: raceResult.data, needsUsername: raceNeedsUsername };
        }
      }
    } catch (_err) {
      return { ok: false, created: false, profile: null, error: _err };
    }

    return { ok: false, created: false, profile: null };
  }

  function sanitizeNextPath(raw) {
    var value = String(raw || '').trim();
    if (!value) return 'index.html';
    if (/^https?:\/\//i.test(value) || value.indexOf('//') === 0) return 'index.html';
    if (value.charAt(0) === '/') return value.slice(1) || 'index.html';
    return value;
  }

  function buildRedirectTarget() {
    var target = new URL('index.html', window.location.origin);
    target.searchParams.set('auth', 'required');
    var next = sanitizeNextPath(window.location.pathname + window.location.search + window.location.hash);
    if (next && next !== 'index.html') {
      target.searchParams.set('next', next);
      safeSetStorageItem('postAuthRedirect', next);
    }
    return target.toString();
  }

  function applyShellState(authenticated, pageKey, options) {
    var opts = options || {};
    var verified = opts.verified !== false;
    var shell = opts.shell || (pageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app');
    document.documentElement.dataset.authenticated = authenticated ? '1' : '0';
    document.documentElement.dataset.authShell = shell;
    document.documentElement.dataset.authVerified = verified ? '1' : '0';
    if (document.body) {
      document.body.dataset.authenticated = authenticated ? '1' : '0';
      document.body.dataset.authShell = shell;
      document.body.dataset.authVerified = verified ? '1' : '0';
    }
    window.ZO2Y_AUTH_GATE = {
      pageKey: pageKey,
      authenticated: authenticated,
      protectedPage: !PUBLIC_PAGE_KEYS.has(pageKey),
      authShell: shell,
      verified: verified
    };
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) {
        document.body.dataset.authenticated = authenticated ? '1' : '0';
        document.body.dataset.authShell = shell;
        document.body.dataset.authVerified = verified ? '1' : '0';
      }
    }, { once: true });
  }

  function redirectToLanding() {
    window.location.replace(buildRedirectTarget());
  }

  function scheduleSessionVerification(pageKey) {
    if (typeof window === 'undefined') return;
    hydrateCanonicalAuthStorageFromDurable();
    migrateLegacySessionStorage();
    var attempts = 0;
    var client = null;
    var protectedPage = !PUBLIC_PAGE_KEYS.has(pageKey);
    var authStateVerifyTimer = null;
    var lastVerifyAt = 0;
    var verifyInFlight = null;
    var verifyCooldownUntil = 0;
    var refreshInFlight = null;
    var lastRefreshAttemptAt = 0;
    var refreshCooldownUntil = 0;

    function persistLiveClientSession() {
      // Tab switches should not trigger Supabase session refresh calls. Persist the latest snapshot we
      // already have in storage instead of calling `auth.getSession()` (which can refresh tokens).
      var storedSession = getStoredSessionSnapshot();
      if (storedSession && storedSession.access_token && storedSession.refresh_token) {
        persistSessionSnapshot(storedSession);
      }
      authDebug('persistLiveClientSession', {
        session: previewSession(storedSession)
      });
    }

    async function bootstrapClientSessionFromStorage() {
      if (!client || !client.auth || typeof client.auth.setSession !== 'function') return false;
      var storedSession = getStoredSessionSnapshot();
      if (!storedSession || !storedSession.access_token || !storedSession.refresh_token) return false;
      var sessionSignature = getStoredSessionSignature(storedSession);
      if (!client.__zo2yStorageBootstrap) {
        client.__zo2yStorageBootstrap = {
          done: false,
          attempts: 0,
          signature: ''
        };
      }
      if (client.__zo2yStorageBootstrap.done && client.__zo2yStorageBootstrap.signature === sessionSignature) {
        return false;
      }
      if (client.__zo2yStorageBootstrap.signature !== sessionSignature) {
        client.__zo2yStorageBootstrap.attempts = 0;
        client.__zo2yStorageBootstrap.done = false;
        client.__zo2yStorageBootstrap.signature = sessionSignature;
      }
      if (client.__zo2yStorageBootstrap.attempts >= 4) return false;
      client.__zo2yStorageBootstrap.attempts += 1;
      try {
        var setResult = await client.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        });
        var authenticated = !!(setResult && setResult.data && setResult.data.session && setResult.data.session.user);
        if (authenticated) {
          persistSessionSnapshot(setResult.data.session);
          client.__zo2yStorageBootstrap.done = true;
          client.__zo2yFutureRetryWaitMs = 0;
        }
        return authenticated;
      } catch (_err) {
        var errorMessage = String((_err && _err.message) || '').toLowerCase();
        if (shouldClearPersistedSessionForError(_err)) {
          clearPersistedSessionSnapshots();
        }
        if (errorMessage.indexOf('issued in the future') !== -1 || errorMessage.indexOf('clock skew') !== -1 || errorMessage.indexOf('clock for skew') !== -1) {
          client.__zo2yFutureRetryWaitMs = getStoredSessionFutureWaitMs(storedSession);
        } else {
          client.__zo2yFutureRetryWaitMs = 0;
        }
        return false;
      }
    }

    async function tryRefreshSession(reason) {
      if (!client || !client.auth || typeof client.auth.refreshSession !== 'function') return null;
      var now = Date.now();
      if (refreshCooldownUntil && now < refreshCooldownUntil) return null;
      if (refreshInFlight) return refreshInFlight;
      if (lastRefreshAttemptAt && (now - lastRefreshAttemptAt) < 1000 * 25) return null;
      lastRefreshAttemptAt = now;
      refreshInFlight = (async function () {
        try {
          var refreshResult = await client.auth.refreshSession();
          var refreshError = refreshResult ? refreshResult.error : null;
          if (refreshError) throw refreshError;
          var refreshedSession = refreshResult && refreshResult.data ? refreshResult.data.session : null;
          if (refreshedSession && refreshedSession.access_token && refreshedSession.refresh_token) {
            persistSessionSnapshot(refreshedSession);
          }
          authDebug('tryRefreshSession', {
            reason: String(reason || ''),
            session: previewSession(refreshedSession)
          });
          return refreshedSession || null;
        } catch (_refreshErr) {
          var statusCode = Number(_refreshErr && _refreshErr.status || 0);
          var messageLower = String((_refreshErr && _refreshErr.message) || '').toLowerCase();
          if (statusCode === 429 || messageLower.indexOf('rate limit') !== -1) {
            refreshCooldownUntil = Date.now() + 1000 * 60 * 2;
          } else if (shouldClearPersistedSessionForError(_refreshErr)) {
            clearPersistedSessionSnapshots();
          }
          authDebug('tryRefreshSession:error', {
            reason: String(reason || ''),
            status: statusCode,
            message: String((_refreshErr && _refreshErr.message) || _refreshErr || '')
          });
          return null;
        } finally {
          refreshInFlight = null;
        }
      })();
      return refreshInFlight;
    }

    async function verifyAndApply() {
      if (!client || !client.auth || typeof client.auth.getSession !== 'function') return false;
      if (verifyInFlight) return verifyInFlight;
      var now = Date.now();
      if (verifyCooldownUntil && now < verifyCooldownUntil) return false;
      lastVerifyAt = now;
      verifyInFlight = (async function () {
      try {
        var sessionResult = await client.auth.getSession();
        var session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
        var hasStoredSnapshot = !!getStoredSessionSnapshot();
        authDebug('verifyAndApply:getSession', {
          pageKey: pageKey,
          session: previewSession(session),
          hasStoredSnapshot: hasStoredSnapshot
        });
        if (!session && hasStoredSnapshot) {
          for (var bootstrapAttempt = 0; bootstrapAttempt < 4 && !session; bootstrapAttempt += 1) {
            await bootstrapClientSessionFromStorage();
            if (bootstrapAttempt > 0) {
              await new Promise(function (resolve) {
                window.setTimeout(resolve, 70);
              });
            }
            sessionResult = await client.auth.getSession();
            session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
          }
        } else if (!session) {
          sessionResult = await client.auth.getSession();
          session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
        }
        if (!session && hasStoredSnapshot) {
          var publicRefreshedSession = await tryRefreshSession('verify');
          if (publicRefreshedSession && publicRefreshedSession.user) {
            session = publicRefreshedSession;
          }
        }
        var authenticated = !!(session && session.user);
        var finalAuthenticated = authenticated;
        if (authenticated) persistSessionSnapshot(session);
        authDebug('verifyAndApply:result', {
          authenticated: authenticated,
          session: previewSession(session),
          protectedPage: protectedPage
        });
        if (!authenticated && hasStoredSnapshot && client.__zo2yFutureRetryWaitMs > 0 && pageKey === 'index') {
          applyShellState(false, pageKey, { shell: 'pending', verified: false });
          if (client.__zo2yFutureRetryTimer) window.clearTimeout(client.__zo2yFutureRetryTimer);
          client.__zo2yFutureRetryTimer = window.setTimeout(function () {
            client.__zo2yFutureRetryTimer = null;
            client.__zo2yFutureRetryWaitMs = 0;
            void verifyAndApply();
          }, client.__zo2yFutureRetryWaitMs);
          return false;
        }
        applyShellState(authenticated, pageKey, { verified: true });

        if (!authenticated && protectedPage) {
          // Retry once before redirect to avoid false negatives during token hydration.
          var retryResult = await client.auth.getSession();
          var retrySession = retryResult && retryResult.data ? retryResult.data.session : null;
          var retryAuthenticated = !!(retrySession && retrySession.user);
          if (!retryAuthenticated) {
            var refreshedSession = await tryRefreshSession('protected-retry');
            retryAuthenticated = !!(refreshedSession && refreshedSession.user);
          }
          finalAuthenticated = retryAuthenticated;
          applyShellState(retryAuthenticated, pageKey, { verified: true });
          if (!retryAuthenticated && !hasStoredSupabaseSession()) {
            redirectToLanding();
            return false;
          }
        }

        window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
          detail: { authenticated: finalAuthenticated, pageKey: pageKey, verified: true }
        }));
        return true;
      } catch (_err) {
        var statusCode = Number(_err && _err.status || 0);
        var messageLower = String((_err && _err.message) || '').toLowerCase();
        if (statusCode === 429 || messageLower.indexOf('rate limit') !== -1) {
          verifyCooldownUntil = Date.now() + 1000 * 60;
        }
        var fallbackAuthenticated = hasStoredSupabaseSession();
        authDebug('verifyAndApply:error', {
          message: String(_err && _err.message || _err || ''),
          fallbackAuthenticated: fallbackAuthenticated
        });
        applyShellState(fallbackAuthenticated, pageKey, { verified: true });
        window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
          detail: { authenticated: fallbackAuthenticated, pageKey: pageKey, verified: true }
        }));
        return false;
      } finally {
        verifyInFlight = null;
      }
      })();
      return verifyInFlight;
    }

    function shouldThrottlePublicResumeVerification() {
      if (!lastVerifyAt) return false;
      var throttleMs = protectedPage ? PROTECTED_PAGE_RESUME_VERIFY_THROTTLE_MS : PUBLIC_PAGE_RESUME_VERIFY_THROTTLE_MS;
      return (Date.now() - lastVerifyAt) < throttleMs;
    }

    function maybeVerifyAfterResume(force) {
      if (!client) return;
      if (verifyCooldownUntil && Date.now() < verifyCooldownUntil) return;
      if (!force && shouldThrottlePublicResumeVerification()) return;
      void verifyAndApply();
    }

    var timer = window.setInterval(async function () {
      attempts += 1;
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        if (attempts > 30) {
          window.clearInterval(timer);
          if (protectedPage && !hasStoredSupabaseSession()) redirectToLanding();
        }
        return;
      }
      if (!client) {
        try {
          var detectSessionInUrl = pageKey !== 'auth-callback';
          client = ensureSharedSupabaseClient({
            auth: {
              detectSessionInUrl: detectSessionInUrl
            }
          });
        } catch (_clientErr) {
          client = null;
        }
      }
      if (!client) return;
      window.clearInterval(timer);
      await bootstrapClientSessionFromStorage();
      await verifyAndApply();
      if (!window.__ZO2Y_AUTH_GATE_RESUME_BOUND) {
        window.__ZO2Y_AUTH_GATE_RESUME_BOUND = true;
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) {
            void persistLiveClientSession();
            return;
          }
          maybeVerifyAfterResume(false);
        });
        window.addEventListener('pageshow', function () {
          maybeVerifyAfterResume(false);
        });
        window.addEventListener('focus', function () {
          maybeVerifyAfterResume(false);
        });
        window.addEventListener('pagehide', function () {
          void persistLiveClientSession();
        });
        window.addEventListener('beforeunload', function () {
          void persistLiveClientSession();
        });
      }
      if (!window.__ZO2Y_AUTH_GATE_LISTENER_BOUND && client.auth && typeof client.auth.onAuthStateChange === 'function') {
        window.__ZO2Y_AUTH_GATE_LISTENER_BOUND = true;
        client.auth.onAuthStateChange(function (event, session) {
          authDebug('onAuthStateChange', {
            event: event,
            session: previewSession(session)
          });
          if (session && session.access_token && session.refresh_token) {
            persistSessionSnapshot(session);
          }
          if (authStateVerifyTimer) window.clearTimeout(authStateVerifyTimer);
          if (
            !session &&
            event === 'SIGNED_OUT' &&
            !hasRecentExplicitSignout() &&
            getStoredSessionSnapshot()
          ) {
            authStateVerifyTimer = window.setTimeout(async function () {
              await restoreClientSessionFromSnapshot(client);
              void verifyAndApply();
            }, 40);
            return;
          }
          if (event === 'SIGNED_OUT' && hasRecentExplicitSignout()) {
            clearPersistedSessionSnapshots();
            clearExplicitSignoutMarker();
          }
          authStateVerifyTimer = window.setTimeout(function () {
            maybeVerifyAfterResume(true);
          }, session && session.user ? 0 : 120);
        });
      }
      if (!window.__ZO2Y_AUTH_GATE_STORAGE_BOUND) {
        window.__ZO2Y_AUTH_GATE_STORAGE_BOUND = true;
        window.addEventListener('storage', function (event) {
          var key = String(event && event.key || '').trim();
          if (key === STORAGE_KEY || key === LEGACY_STORAGE_KEY || key === PERSIST_STORAGE_KEY) {
            maybeVerifyAfterResume(true);
          }
        });
      }
    }, 90);
  }

  window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE = hydrateCanonicalAuthStorageFromDurable;
  window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT = restoreClientSessionFromSnapshot;
  window.__ZO2Y_HAS_STORED_AUTH_SESSION = hasStoredSupabaseSession;
  window.__ZO2Y_PERSIST_SESSION_SNAPSHOT = persistSessionSnapshot;
  window.__ZO2Y_ENSURE_SUPABASE_CLIENT = ensureSharedSupabaseClient;
  window.__ZO2Y_ENSURE_AUTH_PROFILE = ensureAuthProfile;
  window.__ZO2Y_MARK_EXPLICIT_SIGNOUT = markExplicitSignout;
  window.__ZO2Y_CLEAR_EXPLICIT_SIGNOUT = clearExplicitSignoutMarker;
  window.__ZO2Y_AUTH_DIAGNOSTICS = function () {
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY, PERSIST_STORAGE_KEY, DURABLE_STORAGE_KEY];
    var storage = {};
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      storage[key] = {
        local: !!safeGetLocalStorageItem(key),
        shared: !!safeGetStorageItem(key)
      };
    }
    var snapshot = getStoredSessionSnapshot();
    return {
      pageKey: pageKey,
      debugEnabled: authDebugEnabled(),
      location: {
        search: window.location.search,
        hash: window.location.hash
      },
      hasStoredSupabaseSession: hasStoredSupabaseSession(),
      hasRecentExplicitSignout: hasRecentExplicitSignout(),
      oauthFlow: safeGetStorageItem('oauthFlow'),
      postAuthRedirect: safeGetStorageItem('postAuthRedirect'),
      storage: storage,
      sessionPreview: snapshot ? {
        hasAccessToken: !!snapshot.access_token,
        hasRefreshToken: !!snapshot.refresh_token,
        userId: String(snapshot.user && snapshot.user.id || '').trim() || null,
        expiresAt: snapshot.expires_at || null
      } : null
    };
  };
  window.__ZO2Y_SET_AUTH_DEBUG = function (enabled) {
    try {
      if (!window.localStorage) return false;
      if (enabled) {
        window.localStorage.setItem(AUTH_DEBUG_KEY, '1');
      } else {
        window.localStorage.removeItem(AUTH_DEBUG_KEY);
      }
      return true;
    } catch (_err) {
      return false;
    }
  };
  installSupabaseCreateClientPatch();
  var pageKey = normalizePageKey(window.location.pathname);
  var AUTH_ENTRY_PAGES = new Set(['login', 'sign-up', 'signup', 'update-password']);
  var isAuthEntryPage = AUTH_ENTRY_PAGES.has(pageKey);
  if (!isAuthEntryPage) {
    hydrateCanonicalAuthStorageFromDurable();
  }
  maybeRedirectOAuthCallback(pageKey);
  var authenticated = !isAuthEntryPage && hasStoredSupabaseSession();
  var initialShell = pageKey === 'index'
    ? (authenticated ? 'app' : 'pending')
    : 'app';
  applyShellState(authenticated, pageKey, {
    shell: initialShell,
    verified: initialShell === 'app'
  });

  if (!isAuthEntryPage && (pageKey === 'index' || !PUBLIC_PAGE_KEYS.has(pageKey))) {
    scheduleSessionVerification(pageKey);
  }
})();
