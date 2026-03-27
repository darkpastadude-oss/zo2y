(function () {
  'use strict';

  var PROJECT_REF = 'gfkhjbztayjyojsgdpgk';
  var STORAGE_KEY = 'zo2y-auth-v1';
  var LEGACY_STORAGE_KEY = 'sb-' + PROJECT_REF + '-auth-token';
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
  var SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';

  function normalizePageKey(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function safeGetStorageItem(key) {
    try {
      var localValue = window.localStorage ? window.localStorage.getItem(key) : null;
      if (localValue !== null && localValue !== undefined && localValue !== '') return localValue;
    } catch (_err) {}
    try {
      return window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeSetStorageItem(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (_err) {}
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return true;
      }
    } catch (_err) {}
    return false;
  }

  function safeRemoveStorageItem(key) {
    try {
      if (window.sessionStorage) window.sessionStorage.removeItem(key);
    } catch (_err) {}
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
    } catch (_err) {}
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

  function maybeRedirectOAuthCallback(pageKey) {
    if (pageKey === 'auth-callback' || pageKey === 'update-password') return;
    var search = new URLSearchParams(window.location.search);
    var hashParams = getHashParams();
    var hasOauthCode = search.has('code') && (search.has('state') || search.has('provider') || search.has('flow'));
    var hasOauthError = search.has('error') || search.has('error_description');
    var hasHashTokens = hashParams.has('access_token') || hashParams.has('error') || hashParams.has('error_description');
    var oauthFlow = safeGetStorageItem('oauthFlow');
    if (!(hasOauthCode || hasOauthError || hasHashTokens || oauthFlow)) return;
    if (!hasOauthCode && !hasOauthError && !hasHashTokens) return;

    var callbackUrl = new URL('auth-callback.html', window.location.origin);
    if (window.location.search) {
      callbackUrl.search = window.location.search;
    }
    if (window.location.hash) {
      callbackUrl.hash = window.location.hash;
    }
    if (oauthFlow && !callbackUrl.searchParams.has('flow')) {
      callbackUrl.searchParams.set('flow', oauthFlow);
    }
    var nextParam = search.get('next') || safeGetStorageItem('postAuthRedirect');
    if (nextParam && !callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', nextParam);
    }
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
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = safeGetStorageItem(keys[i]);
      if (!raw) continue;
      try {
        if (hasSessionPayload(JSON.parse(raw))) return true;
      } catch (_err) {
        if (/access_token|refresh_token|currentSession|expires_at/i.test(String(raw))) return true;
      }
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
    var keys = [STORAGE_KEY, LEGACY_STORAGE_KEY];
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
    migrateLegacySessionStorage();
    var attempts = 0;
    var client = null;
    var protectedPage = !PUBLIC_PAGE_KEYS.has(pageKey);
    var authStateVerifyTimer = null;

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
          client.__zo2yStorageBootstrap.done = true;
          client.__zo2yFutureRetryWaitMs = 0;
        }
        return authenticated;
      } catch (_err) {
        var errorMessage = String((_err && _err.message) || '').toLowerCase();
        if (errorMessage.indexOf('issued in the future') !== -1 || errorMessage.indexOf('clock skew') !== -1 || errorMessage.indexOf('clock for skew') !== -1) {
          client.__zo2yFutureRetryWaitMs = getStoredSessionFutureWaitMs(storedSession);
        } else {
          client.__zo2yFutureRetryWaitMs = 0;
        }
        return false;
      }
    }

    async function verifyAndApply() {
      if (!client || !client.auth || typeof client.auth.getSession !== 'function') return false;
      try {
        var sessionResult = await client.auth.getSession();
        var session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
        var hasStoredSnapshot = !!getStoredSessionSnapshot();
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
        var authenticated = !!(session && session.user);
        var finalAuthenticated = authenticated;
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
          if (!retryAuthenticated && typeof client.auth.refreshSession === 'function') {
            try {
              var refreshedResult = await client.auth.refreshSession();
              var refreshedSession = refreshedResult && refreshedResult.data ? refreshedResult.data.session : null;
              retryAuthenticated = !!(refreshedSession && refreshedSession.user);
            } catch (_refreshErr) {}
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
        var fallbackAuthenticated = hasStoredSupabaseSession();
        applyShellState(fallbackAuthenticated, pageKey, { verified: true });
        window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
          detail: { authenticated: fallbackAuthenticated, pageKey: pageKey, verified: true }
        }));
        return false;
      }
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
          if (window.__ZO2Y_SUPABASE_CLIENT) {
            client = window.__ZO2Y_SUPABASE_CLIENT;
          } else {
            var detectSessionInUrl = pageKey !== 'auth-callback';
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
              auth: {
                storage: getSupabaseStorageBridge(),
                storageKey: STORAGE_KEY,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: detectSessionInUrl
              }
            });
            window.__ZO2Y_SUPABASE_CLIENT = client;
          }
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
          if (!document.hidden) void verifyAndApply();
        });
        window.addEventListener('focus', function () {
          void verifyAndApply();
        });
      }
      if (!window.__ZO2Y_AUTH_GATE_LISTENER_BOUND && client.auth && typeof client.auth.onAuthStateChange === 'function') {
        window.__ZO2Y_AUTH_GATE_LISTENER_BOUND = true;
        client.auth.onAuthStateChange(function (_event, session) {
          if (authStateVerifyTimer) window.clearTimeout(authStateVerifyTimer);
          authStateVerifyTimer = window.setTimeout(function () {
            void verifyAndApply();
          }, session && session.user ? 0 : 120);
        });
      }
    }, 90);
  }

  var pageKey = normalizePageKey(window.location.pathname);
  maybeRedirectOAuthCallback(pageKey);
  var authenticated = hasStoredSupabaseSession();
  var initialShell = pageKey === 'index' ? 'pending' : 'app';
  applyShellState(initialShell === 'app' ? authenticated : false, pageKey, {
    shell: initialShell,
    verified: initialShell !== 'pending'
  });

  if (pageKey === 'index' || !PUBLIC_PAGE_KEYS.has(pageKey)) {
    scheduleSessionVerification(pageKey);
  }
})();
