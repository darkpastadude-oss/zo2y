(() => {
  if (window.__zo2yGamesShared) return;

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const FALLBACK_IMAGE = '/newlogo.webp';
  const COVER_STORAGE_ENABLED = window.ZO2Y_GAME_COVER_STORAGE !== false;

  let supabaseClient = null;
  const IGDB_PROXY_BASE = '/api/igdb';
  const coverLookupCache = new Map();
  const COVER_STORAGE_PREFIX = 'zo2y_game_cover_cache_v1:';
  const COVER_STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 21; // 21 days
  const GAME_SEARCH_CACHE_PREFIX = 'zo2y_game_search_cache_v1:';
  const GAME_SEARCH_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
  const gameSearchCache = new Map();

  function toHttpsUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  }

  function normalizeGameCoverUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '[object Object]') return '';
    if (raw.startsWith('//')) return `https:${raw}`;
    return toHttpsUrl(raw);
  }

  function resolveGameCover(row) {
    return normalizeGameCoverUrl(row?.cover_url || row?.cover || row?.image || '');
  }

  function resolveGameHero(row, fallbackCover = '') {
    const hero = normalizeGameCoverUrl(row?.hero_url || row?.hero || row?.background || '');
    return hero || fallbackCover;
  }

  function isLikelyLogoOnlyGameArt(url) {
    const src = String(url || '').toLowerCase();
    if (!src) return false;
    return src.includes('logo') && !src.includes('cover') && !src.includes('poster');
  }

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'zo2y-auth-v2'
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function getCoverStorageKey(title) {
    const safe = String(title || '').trim().toLowerCase();
    if (!safe) return '';
    return `${COVER_STORAGE_PREFIX}${safe}`;
  }

  function readCachedCoverFromStorage(title) {
    if (!COVER_STORAGE_ENABLED) return '';
    const key = getCoverStorageKey(title);
    if (!key) return '';
    try {
      const raw = window.localStorage ? window.localStorage.getItem(key) : '';
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      const url = normalizeGameCoverUrl(parsed?.url || '');
      const savedAt = Number(parsed?.t || 0);
      if (!url) return '';
      if (!Number.isFinite(savedAt) || (Date.now() - savedAt) > COVER_STORAGE_TTL_MS) {
        window.localStorage?.removeItem(key);
        return '';
      }
      return url;
    } catch (_err) {
      return '';
    }
  }

  function writeCachedCoverToStorage(title, url) {
    if (!COVER_STORAGE_ENABLED) return;
    const key = getCoverStorageKey(title);
    const safeUrl = normalizeGameCoverUrl(url);
    if (!key || !safeUrl) return;
    try {
      window.localStorage?.setItem(key, JSON.stringify({ url: safeUrl, t: Date.now() }));
    } catch (_err) {}
  }

  async function fetchWikipediaCoverCandidate(title, signal) {
    const q = String(title || '').trim().slice(0, 160);
    if (!q) return '';

    const wikiBase = 'https://en.wikipedia.org/w/api.php';
    const searchUrl = new URL(wikiBase);
    searchUrl.searchParams.set('origin', '*');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', q);
    searchUrl.searchParams.set('srlimit', '1');
    searchUrl.searchParams.set('srprop', '');

    try {
      const searchRes = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!searchRes.ok) return '';
      const searchJson = await searchRes.json().catch(() => null);
      const first = Array.isArray(searchJson?.query?.search) ? searchJson.query.search[0] : null;
      const pageTitle = String(first?.title || '').trim();
      if (!pageTitle) return '';

      const pageUrl = new URL(wikiBase);
      pageUrl.searchParams.set('origin', '*');
      pageUrl.searchParams.set('action', 'query');
      pageUrl.searchParams.set('format', 'json');
      pageUrl.searchParams.set('prop', 'pageimages');
      pageUrl.searchParams.set('piprop', 'original|thumbnail');
      pageUrl.searchParams.set('pithumbsize', '900');
      pageUrl.searchParams.set('redirects', '1');
      pageUrl.searchParams.set('titles', pageTitle);

      const pageRes = await fetch(pageUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!pageRes.ok) return '';
      const pageJson = await pageRes.json().catch(() => null);
      const pages = pageJson?.query?.pages || {};
      const page = Object.values(pages || {}).find(Boolean) || null;
      return normalizeGameCoverUrl(page?.original?.source || page?.thumbnail?.source || '');
    } catch (_err) {
      return '';
    }
  }

  async function loadFeaturedGames(signal, options = {}) {
    const limit = Math.max(1, Number(options.limit || 24));
    const client = ensureSupabase();
    if (!client) return [];

    try {
      const query = client
        .from('games')
        .select('id,title,release_date,description,cover_url,hero_url,rating,rating_count,extra,source,slug')
        .order('rating_count', { ascending: false, nullsFirst: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(Math.max(limit * 10, 120));

      const result = signal ? await query.abortSignal(signal) : await query;
      const data = Array.isArray(result?.data) ? result.data : [];
      if (!data.length) return [];

      const seen = new Set();
      const items = [];
      for (const row of data) {
        if (!row) continue;
        const id = String(row?.id || row?.slug || '').trim();
        const title = String(row?.title || 'Game').trim();
        if (!id || !title) continue;
        if (seen.has(id)) continue;
        seen.add(id);

        const cover = resolveGameCover(row);
        const hero = resolveGameHero(row, cover);
        const visual = cover || hero || FALLBACK_IMAGE;
        const plain = isLikelyLogoOnlyGameArt(cover) || !hero || hero === cover;
        const releaseDate = String(row?.release_date || '').trim();
        const ratingValue = Number(row?.rating || 0);
        const genres = Array.isArray(row?.extra?.genres) ? row.extra.genres : [];
        const genreText = genres.length
          ? genres.slice(0, 2).map((entry) => String(entry?.name || entry || '').trim()).filter(Boolean).join(' | ')
          : 'Video Game';
        const ratingText = Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : '';

        items.push({
          mediaType: 'game',
          itemId: id,
          title,
          subtitle: releaseDate ? releaseDate.slice(0, 10) : '',
          extra: [genreText, ratingText].filter(Boolean).join(' | '),
          image: visual,
          backgroundImage: hero || visual,
          spotlightImage: hero || visual,
          spotlightMediaImage: visual,
          spotlightMediaFit: plain ? 'contain' : 'contain',
          spotlightMediaShape: plain ? 'landscape' : 'poster',
          gameCardMode: plain ? 'plain' : 'hero',
          fallbackImage: FALLBACK_IMAGE,
          href: `game.html?id=${encodeURIComponent(String(id))}`
        });

        if (items.length >= limit) break;
      }

      return items;
    } catch (_err) {
      return [];
    }
  }

  async function fetchCoverForTitle(title, signal) {
    const key = String(title || '').trim().toLowerCase();
    if (!key) return '';
    if (coverLookupCache.has(key)) return coverLookupCache.get(key) || '';

    const url = new URL(`${IGDB_PROXY_BASE}/games`, window.location.origin);
    url.searchParams.set('search', String(title || '').trim().slice(0, 120));
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', '1');
    url.searchParams.set('title_only', '1');

    const cached = readCachedCoverFromStorage(title);
    if (cached) {
      coverLookupCache.set(key, cached);
      return cached;
    }

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        signal: signal || undefined
      });
      if (!res.ok) throw new Error(`cover lookup failed: ${res.status}`);
      const json = await res.json();
      const results = Array.isArray(json?.results) ? json.results : [];
      const pick = results.find((r) => normalizeGameCoverUrl(r?.cover || r?.image || '')) || results[0] || null;
      const cover = normalizeGameCoverUrl(pick?.cover || pick?.image || '');
      if (cover) {
        coverLookupCache.set(key, cover);
        writeCachedCoverToStorage(title, cover);
        return cover;
      }
      const wikiCover = await fetchWikipediaCoverCandidate(title, signal);
      coverLookupCache.set(key, wikiCover || '');
      if (wikiCover) writeCachedCoverToStorage(title, wikiCover);
      return wikiCover || '';
    } catch (_err) {
      const wikiCover = await fetchWikipediaCoverCandidate(title, signal);
      coverLookupCache.set(key, wikiCover || '');
      if (wikiCover) writeCachedCoverToStorage(title, wikiCover);
      return wikiCover || '';
    }
  }

  function getGameSearchCacheKey(query) {
    const safe = String(query || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (!safe) return '';
    return `${GAME_SEARCH_CACHE_PREFIX}${safe}`;
  }

  function readCachedGameSearch(query) {
    const key = getGameSearchCacheKey(query);
    if (!key) return null;
    if (gameSearchCache.has(key)) return gameSearchCache.get(key);
    try {
      const raw = window.localStorage ? window.localStorage.getItem(key) : '';
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.t || 0);
      if (!Number.isFinite(savedAt) || (Date.now() - savedAt) > GAME_SEARCH_TTL_MS) {
        window.localStorage?.removeItem(key);
        return null;
      }
      const games = Array.isArray(parsed?.games) ? parsed.games : [];
      gameSearchCache.set(key, games);
      return games;
    } catch (_err) {
      return null;
    }
  }

  function writeCachedGameSearch(query, games) {
    const key = getGameSearchCacheKey(query);
    if (!key || !Array.isArray(games) || !games.length) return;
    try {
      window.localStorage?.setItem(key, JSON.stringify({ t: Date.now(), games }));
      gameSearchCache.set(key, games);
    } catch (_err) {}
  }

  function normalizeWikiGameTitle(title) {
    const t = String(title || '').trim();
    if (!t) return '';
    const cleaned = t
      .replace(/\s*\([^)]*\)\s*$/g, '')
      .replace(/\s*\(video game\)\s*$/gi, '')
      .replace(/\s*\(game\)\s*$/gi, '')
      .replace(/\s*\(series\)\s*$/gi, '')
      .replace(/\s*\(franchise\)\s*$/gi, '')
      .trim();
    return cleaned || t;
  }

  function extractYearFromWikiSnippet(snippet) {
    const match = String(snippet || '').match(/\b(19[7-9]\d|20[0-2]\d)\b/);
    return match ? match[1] : '';
  }

  async function searchGamesFromWikipedia(query, signal, limit = 12) {
    const q = String(query || '').trim();
    if (!q) return [];

    const cached = readCachedGameSearch(q);
    if (cached && cached.length) return cached;

    const wikiBase = 'https://en.wikipedia.org/w/api.php';
    const searchUrl = new URL(wikiBase);
    searchUrl.searchParams.set('origin', '*');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', `${q} video game`);
    searchUrl.searchParams.set('srlimit', String(Math.min(limit * 2, 20)));
    searchUrl.searchParams.set('srprop', 'snippet|titlesnippet|sectionsnippet');
    searchUrl.searchParams.set('srwhat', 'text');

    try {
      const searchRes = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!searchRes.ok) return [];
      const searchJson = await searchRes.json().catch(() => null);
      const results = Array.isArray(searchJson?.query?.search) ? searchJson.query.search : [];
      if (!results.length) return [];

      const titles = results
        .map(r => normalizeWikiGameTitle(r?.title))
        .filter(Boolean)
        .slice(0, limit);

      if (!titles.length) return [];

      const pageUrl = new URL(wikiBase);
      pageUrl.searchParams.set('origin', '*');
      pageUrl.searchParams.set('action', 'query');
      pageUrl.searchParams.set('format', 'json');
      pageUrl.searchParams.set('prop', 'pageimages|extracts|info');
      pageUrl.searchParams.set('piprop', 'original|thumbnail');
      pageUrl.searchParams.set('pithumbsize', '600');
      pageUrl.searchParams.set('exintro', '1');
      pageUrl.searchParams.set('explaintext', '1');
      pageUrl.searchParams.set('redirects', '1');
      pageUrl.searchParams.set('titles', titles.join('|'));

      const pageRes = await fetch(pageUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!pageRes.ok) return [];
      const pageJson = await pageRes.json().catch(() => null);
      const pages = pageJson?.query?.pages || {};

      const games = [];
      const seen = new Set();
      for (const page of Object.values(pages)) {
        if (!page || page?.missing) continue;
        const title = normalizeWikiGameTitle(page?.title || '');
        if (!title || seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());

        const cover = normalizeGameCoverUrl(page?.thumbnail?.source || page?.original?.source || '');
        const extract = String(page?.extract || '').trim();
        const year = extractYearFromWikiSnippet(extract);

        games.push({
          id: `wiki_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: title,
          title: title,
          summary: extract.slice(0, 300),
          description: extract,
          cover: cover || '',
          cover_url: cover || '',
          firstReleaseDate: year ? `${year}-01-01` : '',
          release_date: year ? `${year}-01-01` : '',
          releaseDate: year ? `${year}-01-01` : '',
          rating: 0,
          rating_count: 0,
          source: 'wikipedia',
          genres: [],
          platforms: [],
          extra: { source: 'wikipedia' }
        });

        if (games.length >= limit) break;
      }

      writeCachedGameSearch(q, games);
      return games;
    } catch (_err) {
      return [];
    }
  }

  window.__zo2yGamesShared = {
    loadFeaturedGames,
    resolveGameCover,
    fetchCoverForTitle,
    searchGamesFromWikipedia
  };
})();
