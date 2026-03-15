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

  function normalizePageKey(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    return file.replace(/\.html?$/i, '') || 'index';
  }

  function safeGetStorageItem(key) {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeSetStorageItem(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, value);
    } catch (_err) {}
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
    window.ZO2Y_AUTH_GATE = {
      pageKey: pageKey,
      authenticated: authenticated,
      protectedPage: !PUBLIC_PAGE_KEYS.has(pageKey),
      authShell: shell
    };
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) {
        document.body.dataset.authenticated = authenticated ? '1' : '0';
        document.body.dataset.authShell = shell;
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
          // Retry once before redirect to avoid false negatives during token hydration.
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
          detail: { authenticated: authenticated, pageKey: pageKey }
        }));
        return true;
      } catch (_err) {
        var fallbackAuthenticated = hasStoredSupabaseSession();
        applyShellState(fallbackAuthenticated, pageKey);
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
                flowType: 'pkce',
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
            detail: { authenticated: authenticated, pageKey: pageKey }
          }));
        });
      }
    }, 150);
  }

  var pageKey = normalizePageKey(window.location.pathname);
  var authenticated = hasStoredSupabaseSession();
  applyShellState(authenticated, pageKey);

  if (pageKey === 'index' || !PUBLIC_PAGE_KEYS.has(pageKey)) {
    scheduleSessionVerification(pageKey);
  }
})();
