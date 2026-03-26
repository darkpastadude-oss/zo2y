(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__zo2yVercelAnalyticsLoaded) return;
  window.__zo2yVercelAnalyticsLoaded = true;

  const SENSITIVE_QUERY_KEYS = [
    'code',
    'state',
    'token',
    'access_token',
    'refresh_token',
    'error_description',
    'otp',
    'invite_token',
    'recovery_token'
  ];

  const SENSITIVE_HASH_KEYS = [
    'access_token',
    'refresh_token',
    'expires_at',
    'expires_in',
    'token_type',
    'provider_token',
    'provider_refresh_token'
  ];

  function initQueue() {
    if (window.va) return;
    window.va = function va(...params) {
      (window.vaq = window.vaq || []).push(params);
    };
  }

  function isLocalHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
  }

  function sanitizeUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      SENSITIVE_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));

      const hashText = String(url.hash || '').replace(/^#/, '').trim();
      if (hashText) {
        const hashParams = new URLSearchParams(hashText);
        SENSITIVE_HASH_KEYS.forEach((key) => hashParams.delete(key));
        const nextHash = hashParams.toString();
        url.hash = nextHash ? `#${nextHash}` : '';
      }

      return url.toString();
    } catch (_err) {
      return rawUrl;
    }
  }

  function beforeSend(event) {
    if (!event || typeof event !== 'object' || typeof event.url !== 'string') {
      return event;
    }

    const sanitizedUrl = sanitizeUrl(event.url);

    try {
      const parsed = new URL(sanitizedUrl, window.location.origin);
      if (parsed.pathname.endsWith('/auth-callback.html')) {
        return null;
      }
    } catch (_err) {}

    return {
      ...event,
      url: sanitizedUrl
    };
  }

  function injectScript() {
    if (isLocalHost(window.location.hostname) || window.location.protocol === 'file:') {
      return;
    }

    if (!String(window.location.hostname || '').toLowerCase().endsWith('.vercel.app')) {
      return;
    }

    if (document.head.querySelector('script[data-zo2y-vercel-analytics="1"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    script.dataset.sdkn = 'zo2y-static';
    script.dataset.sdkv = '20260307a';
    script.dataset.zo2yVercelAnalytics = '1';
    script.onerror = () => {
      if (window.location.hostname && !isLocalHost(window.location.hostname)) {
        console.log('[Vercel Web Analytics] Failed to load /_vercel/insights/script.js');
      }
    };
    document.head.appendChild(script);
  }

  initQueue();
  window.va('beforeSend', beforeSend);
  injectScript();
})();
