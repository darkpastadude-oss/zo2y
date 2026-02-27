(function initZo2yIgdbClient(global) {
  if (global.ZO2Y_IGDB && typeof global.ZO2Y_IGDB.request === 'function') return;
  const GAME_DATA_REV = 'wiki20260227b';

  function normalizeBase(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
    return `/${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  }

  function toIgdbBase(value, treatAsApiBase) {
    const base = normalizeBase(value);
    if (!base) return '';
    if (base.endsWith('/api/igdb')) return base;
    if (treatAsApiBase || base.endsWith('/api')) return `${base}/igdb`;
    return `${base}/api/igdb`;
  }

  const candidates = [];
  function pushCandidate(value) {
    const next = String(value || '').trim();
    if (!next) return;
    if (!candidates.includes(next)) candidates.push(next);
  }

  pushCandidate(toIgdbBase(global.__ZO2Y_IGDB_BASE, false));
  pushCandidate(toIgdbBase(global.__ZO2Y_API_BASE, true));
  pushCandidate(toIgdbBase(global.document?.querySelector('meta[name="zo2y-igdb-base"]')?.getAttribute('content'), false));
  pushCandidate(toIgdbBase(global.document?.querySelector('meta[name="zo2y-api-base"]')?.getAttribute('content'), true));

  try {
    const storedApiBase = global.localStorage ? global.localStorage.getItem('zo2y_api_base') : '';
    pushCandidate(toIgdbBase(storedApiBase, true));
  } catch (_err) {}

  pushCandidate('/api/igdb');

  const host = String(global.location?.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    pushCandidate('http://localhost:5000/api/igdb');
  }

  function buildUrl(base, path, params = {}) {
    const normalizedBase = String(base || '').replace(/\/+$/, '');
    const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
    const url = new URL(`${normalizedBase}${normalizedPath}`, global.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
    if (!url.searchParams.has('rev')) {
      url.searchParams.set('rev', GAME_DATA_REV);
    }
    return url;
  }

  function tryParseJson(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  async function fetchWithMeta(base, path, params = {}, options = {}) {
    const url = buildUrl(base, path, params);
    const response = await fetch(url.toString(), options);
    const text = await response.text();
    return {
      base,
      path,
      url: url.toString(),
      status: response.status,
      ok: response.ok,
      text,
      data: tryParseJson(text)
    };
  }

  function createRequestError(meta) {
    const message = `IGDB request failed (${meta.status}) ${meta.url}`;
    const error = new Error(message);
    error.status = meta.status;
    error.url = meta.url;
    error.body = meta.text;
    return error;
  }

  let resolvedBase = '';
  let resolvingPromise = null;

  async function probe(base) {
    try {
      const meta = await fetchWithMeta(base, '/genres', { page_size: 1 });
      if (meta.status === 404) return false;
      return true;
    } catch (_err) {
      return false;
    }
  }

  async function resolveBase() {
    if (resolvedBase) return resolvedBase;
    if (resolvingPromise) return resolvingPromise;

    resolvingPromise = (async () => {
      for (const candidate of candidates) {
        const ok = await probe(candidate);
        if (ok) {
          resolvedBase = candidate;
          return resolvedBase;
        }
      }
      resolvedBase = candidates[0] || '/api/igdb';
      return resolvedBase;
    })();

    try {
      return await resolvingPromise;
    } finally {
      resolvingPromise = null;
    }
  }

  async function request(path, params = {}, options = {}) {
    const primaryBase = await resolveBase();
    const orderedBases = [];
    if (primaryBase) orderedBases.push(primaryBase);
    candidates.forEach((base) => {
      if (!orderedBases.includes(base)) orderedBases.push(base);
    });

    let lastError = null;
    for (const base of orderedBases) {
      try {
        const meta = await fetchWithMeta(base, path, params, options);
        if (meta.status === 404) {
          if (base === resolvedBase) resolvedBase = '';
          continue;
        }
        if (!meta.ok) throw createRequestError(meta);
        resolvedBase = base;
        return meta.data;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    throw new Error(`IGDB request failed for ${String(path || '')}`);
  }

  global.ZO2Y_IGDB = {
    request,
    resolveBase,
    getBase: function getBase() {
      return resolvedBase || '';
    },
    candidates: candidates.slice()
  };
})(window);
