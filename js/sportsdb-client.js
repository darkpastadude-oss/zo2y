(function initZo2ySportsDbClient(global) {
  if (global.ZO2Y_SPORTSDB && typeof global.ZO2Y_SPORTSDB.request === 'function') return;

  function normalizeBase(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
    return `/${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  }

  const candidates = [];
  function pushCandidate(value) {
    const next = String(value || '').trim();
    if (!next) return;
    if (!candidates.includes(next)) candidates.push(next);
  }

  const host = String(global.location?.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    pushCandidate('/api/sportsdb');
    pushCandidate('http://localhost:5000/api/sportsdb');
  }
  pushCandidate(normalizeBase(global.__ZO2Y_SPORTSDB_BASE));
  pushCandidate(normalizeBase(global.__ZO2Y_API_BASE));
  pushCandidate(normalizeBase(global.document?.querySelector('meta[name="zo2y-sportsdb-base"]')?.getAttribute('content')));
  pushCandidate(normalizeBase(global.document?.querySelector('meta[name="zo2y-api-base"]')?.getAttribute('content')));

  try {
    const storedApiBase = global.localStorage ? global.localStorage.getItem('zo2y_sportsdb_base') : '';
    pushCandidate(normalizeBase(storedApiBase));
  } catch (_err) {}

  pushCandidate('/api/sportsdb');

  let resolvedBase = '';
  let resolvingPromise = null;

  async function resolveBase() {
    if (resolvedBase) return resolvedBase;
    if (resolvingPromise) return resolvingPromise;

    resolvingPromise = (async () => {
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, {
            method: 'HEAD',
            headers: { Accept: 'application/json' }
          });
          if (response.ok) {
            resolvedBase = candidate;
            return resolvedBase;
          }
        } catch (_err) {
          continue;
        }
      }
      resolvedBase = candidates[0] || '/api/sportsdb';
      return resolvedBase;
    })();

    try {
      return await resolvingPromise;
    } finally {
      resolvingPromise = null;
    }
  }

  async function request(endpoint, params = {}, timeoutMs = 8000) {
    const base = await resolveBase();
    const path = String(endpoint || '').trim().replace(/^\/+/, '');
    if (!path) return null;
    
    // `base` can be a relative path like "/api/sportsdb". `new URL('/api/...')` throws
    // unless we provide a base origin, which previously caused ALL requests to return null
    // (and the sports pages would show no teams without obvious console errors).
    const url = new URL(`${base}/${path}`, window.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, value);
    });

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  global.ZO2Y_SPORTSDB = {
    request,
    resolveBase,
    getBase: function getBase() {
      return resolvedBase || '';
    },
    candidates: candidates.slice()
  };
})(window);
