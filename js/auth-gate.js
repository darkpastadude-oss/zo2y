(function () {
  'use strict';

  var PROJECT_REF = 'gfkhjbztayjyojsgdpgk';
  var STORAGE_KEY = 'sb-' + PROJECT_REF + '-auth-token';
  var PUBLIC_PAGE_KEYS = new Set([
    'index',
    'login',
    'sign-up',
    'signup',
    'auth-callback',
    'update-password',
    'privacy',
    'terms',
    'support'
  ]);
  var SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  var AUTH_GATE_VERSION = '20260326a';

  function normalizePageKey(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function isQuotaExceededStorageError(error) {
    var message = String((error && error.message) || error || '').toLowerCase();
    return message.indexOf('quota') !== -1 || message.indexOf('exceeded the quota') !== -1;
  }

  function isDisposableStorageKey(key) {
    var value = String(key || '').trim().toLowerCase();
    if (!value) return false;
    if (value === STORAGE_KEY.toLowerCase()) return false;
    if (value === 'postauthredirect' || value === 'oauthflow' || value === 'rememberedemail') return false;
    if (value.indexOf('zo2y_onboarding_') === 0) return false;
    if (value.indexOf('zo2y_') === 0) return true;
    if (value.indexOf('books_') === 0 || value.indexOf('books_mobile_') === 0) return true;
    if (value.indexOf('games_') === 0 || value.indexOf('travel_') === 0) return true;
    if (value.indexOf('movies_') === 0 || value.indexOf('tv_') === 0 || value.indexOf('anime_') === 0 || value.indexOf('music_') === 0) return true;
    return value.indexOf('cache') !== -1 || value.indexOf('search') !== -1 || value.indexOf('feed') !== -1 || value.indexOf('rail') !== -1 || value.indexOf('manifest') !== -1 || value.indexOf('page') !== -1 || value.indexOf('photo') !== -1;
  }

  function releaseLocalStoragePressure() {
    try {
      if (!window.localStorage) return 0;
      var candidates = [];
      for (var index = 0; index < window.localStorage.length; index += 1) {
        var key = String(window.localStorage.key(index) || '');
        if (!isDisposableStorageKey(key)) continue;
        var value = window.localStorage.getItem(key) || '';
        candidates.push({ key: key, size: value.length });
      }
      candidates.sort(function (left, right) {
        return right.size - left.size;
      });
      var removed = 0;
      for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        window.localStorage.removeItem(candidates[candidateIndex].key);
        removed += 1;
        if (removed >= 24) break;
      }
      return removed;
    } catch (_err) {
      return 0;
    }
  }

  function safeGetStorageItem(key) {
    try {
      var sessionValue = window.sessionStorage ? window.sessionStorage.getItem(key) : null;
      if (sessionValue !== null && sessionValue !== undefined && sessionValue !== '') return sessionValue;
    } catch (_err) {}
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeSetStorageItem(key, value) {
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(key, value);
    } catch (_err) {}
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (_err) {
      if (isQuotaExceededStorageError(_err)) {
        releaseLocalStoragePressure();
        try {
          if (window.localStorage) {
            window.localStorage.setItem(key, value);
            return true;
          }
        } catch (_retryErr) {}
      }
    }
    return false;
  }

  function getQuotaSafeSupabaseStorage() {
    if (window.__ZO2Y_SUPABASE_AUTH_STORAGE) return window.__ZO2Y_SUPABASE_AUTH_STORAGE;
    window.__ZO2Y_SUPABASE_AUTH_STORAGE = {
      getItem: function (key) {
        return safeGetStorageItem(key);
      },
      setItem: function (key, value) {
        safeSetStorageItem(key, value);
      },
      removeItem: function (key) {
        try {
          if (window.sessionStorage) window.sessionStorage.removeItem(key);
        } catch (_err) {}
        try {
          if (window.localStorage) window.localStorage.removeItem(key);
        } catch (_err) {}
      }
    };
    return window.__ZO2Y_SUPABASE_AUTH_STORAGE;
  }

  window.__ZO2Y_GET_SUPABASE_AUTH_STORAGE = getQuotaSafeSupabaseStorage;

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
    if (window.location.search) callbackUrl.search = window.location.search;
    if (window.location.hash) callbackUrl.hash = window.location.hash;
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
    if (Array.isArray(value)) return value.some(hasSessionPayload);
    if (typeof value === 'object') {
      if (value.access_token || value.refresh_token) return true;
      if (hasSessionPayload(value.currentSession)) return true;
      if (hasSessionPayload(value.session)) return true;
      if (hasSessionPayload(value.sessions)) return true;
      if (hasSessionPayload(value.user)) return true;
    }
    return false;
  }

  function hasStoredSupabaseSession() {
    var raw = safeGetStorageItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      return hasSessionPayload(JSON.parse(raw));
    } catch (_err) {
      return /access_token|refresh_token|currentSession|expires_at/i.test(String(raw));
    }
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

  function applyShellState(authenticated, pageKey) {
    var shell = pageKey === 'index' ? (authenticated ? 'app' : 'landing') : 'app';
    document.documentElement.dataset.authenticated = authenticated ? '1' : '0';
    document.documentElement.dataset.authShell = shell;
    document.documentElement.dataset.authVerified = '1';
    window.ZO2Y_AUTH_GATE = {
      pageKey: pageKey,
      authenticated: authenticated,
      protectedPage: !PUBLIC_PAGE_KEYS.has(pageKey),
      authShell: shell,
      verified: true
    };
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) {
        document.body.dataset.authenticated = authenticated ? '1' : '0';
        document.body.dataset.authShell = shell;
        document.body.dataset.authVerified = '1';
      }
    }, { once: true });
  }

  function redirectToLanding() {
    window.location.replace(buildRedirectTarget());
  }

  function scheduleSessionVerification(pageKey) {
    if (typeof window === 'undefined') return;
    var attempts = 0;
    var client = null;
    var protectedPage = !PUBLIC_PAGE_KEYS.has(pageKey);

    async function verifyAndApply() {
      if (!client || !client.auth || typeof client.auth.getSession !== 'function') return false;
      try {
        var sessionResult = await client.auth.getSession();
        var session = sessionResult && sessionResult.data ? sessionResult.data.session : null;
        var authenticated = !!(session && session.user);
        applyShellState(authenticated, pageKey);

        if (!authenticated && protectedPage) {
          var retryResult = await client.auth.getSession();
          var retrySession = retryResult && retryResult.data ? retryResult.data.session : null;
          var retryAuthenticated = !!(retrySession && retrySession.user);
          applyShellState(retryAuthenticated, pageKey);
          if (!retryAuthenticated && !hasStoredSupabaseSession()) {
            redirectToLanding();
            return false;
          }
        }

        window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
          detail: { authenticated: authenticated, pageKey: pageKey, verified: true }
        }));
        return true;
      } catch (_err) {
        var fallbackAuthenticated = hasStoredSupabaseSession();
        applyShellState(fallbackAuthenticated, pageKey);
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
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
              auth: {
                storageKey: STORAGE_KEY,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: pageKey !== 'auth-callback',
                storage: getQuotaSafeSupabaseStorage()
              }
            });
            window.__ZO2Y_SUPABASE_CLIENT = client;
            window.__ZO2Y_ENSURE_SUPABASE_CLIENT = function () {
              return window.__ZO2Y_SUPABASE_CLIENT;
            };
          }
        } catch (_clientErr) {
          client = null;
        }
      }
      if (!client) return;
      window.clearInterval(timer);
      await verifyAndApply();
      if (!window.__ZO2Y_AUTH_GATE_LISTENER_BOUND && client.auth && typeof client.auth.onAuthStateChange === 'function') {
        window.__ZO2Y_AUTH_GATE_LISTENER_BOUND = true;
        client.auth.onAuthStateChange(function (_event, session) {
          var authenticated = !!(session && session.user);
          applyShellState(authenticated, pageKey);
          if (!authenticated && protectedPage && !hasStoredSupabaseSession()) {
            redirectToLanding();
            return;
          }
          window.dispatchEvent(new CustomEvent('zo2y-auth-gate-verified', {
            detail: { authenticated: authenticated, pageKey: pageKey, verified: true }
          }));
        });
      }
    }, 150);
  }

  var pageKey = normalizePageKey(window.location.pathname);
  maybeRedirectOAuthCallback(pageKey);
  applyShellState(hasStoredSupabaseSession(), pageKey);

  if (pageKey === 'index' || !PUBLIC_PAGE_KEYS.has(pageKey)) {
    scheduleSessionVerification(pageKey);
  }
})();
