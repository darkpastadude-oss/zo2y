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
  const COVER_STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 21;
  const GAME_SEARCH_CACHE_PREFIX = 'zo2y_game_search_cache_v2:';
  const GAME_SEARCH_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const gameSearchCache = new Map();
  const NO_COVER_CACHE_PREFIX = 'zo2y_game_nocover_v1:';
  const NO_COVER_TTL_MS = 1000 * 60 * 60 * 24 * 7;

  const STEAM_COVER_TEMPLATES = [
    (id) => `https://steamcdn-a.akamaihd.net/steam/apps/${id}/library_600x900.jpg`,
    (id) => `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`
  ];
  const CC = window.__zo2yCoverCache;

  const HERO_MIN_WIDTH = 1280;
  const HERO_DESKTOP_WIDTH = 1920;
  const SCREENSHOT_MIN_WIDTH = 1000;

  const BAD_IMAGE_PATTERNS = [
    /\/avatar/i, /\/user\//i, /\/profile/i,
    /\/logo\./i, /\/icon\./i, /\/badge\./i,
    /\/award/i, /\/trophy/i,
    /\/voice[_-]?actor/i, /\/cast/i,
    /\/developer[_-]?avatar/i, /\/publisher[_-]?logo/i,
    /transparent.*logo/i, /logo.*transparent/i
  ];

  const LANDSCAPE_MIN_RATIO = 1.2;

  function normalizeCacheKey(title) {
    return String(title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

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

  function isBadImageUrl(url) {
    const src = String(url || '').toLowerCase();
    if (!src) return true;
    return BAD_IMAGE_PATTERNS.some(p => p.test(src));
  }

  function isLikelyLogoOnlyGameArt(url) {
    const src = String(url || '').toLowerCase();
    if (!src) return false;
    if (src.endsWith('.svg') || src.includes('.svg?')) return true;
    if (src.includes('logo') && !src.includes('cover') && !src.includes('poster')) return true;
    if (src.includes('transparent') && src.includes('logo')) return true;
    if (src.includes('wordmark') || src.includes('icon')) return true;
    return false;
  }

  function stripResizeParams(url) {
    return String(url).replace(/\/resize\/\d+\/-\//, '/').replace(/\/crop\/\d+\/\d+\//, '/');
  }

  function isHeroBackgroundCandidate(url) {
    if (!url) return false;
    if (isBadImageUrl(url)) return false;
    const src = String(url).toLowerCase();
    if (src.includes('pexels.com')) return false;
    if (src.includes('newlogo.webp') || src.includes('fallback')) return false;
    if (isLikelyLogoOnlyGameArt(url)) return false;
    return true;
  }

  function isValidScreenshot(s) {
    if (!s) return false;
    const url = typeof s === 'string' ? s : (s?.image || s?.url || '');
    if (!url) return false;
    if (isBadImageUrl(url)) return false;
    const src = String(url).toLowerCase();
    if (src.includes('pexels.com') || src.includes('newlogo.webp')) return false;
    return true;
  }

  function isLandscapeScreenshot(s) {
    if (!isValidScreenshot(s)) return false;
    if (typeof s === 'object' && s !== null) {
      const w = Number(s.width || 0);
      const h = Number(s.height || 0);
      if (w > 0 && h > 0) {
        if (h > w) return false;
        if (w < SCREENSHOT_MIN_WIDTH) return false;
        return true;
      }
    }
    const url = String(typeof s === 'string' ? s : (s?.image || s?.url || '')).toLowerCase();
    if (url.includes('screenshot') || url.includes('gameplay') || url.includes('media/rawg')) return true;
    if (isLikelyLogoOnlyGameArt(url)) return false;
    return true;
  }

  function chooseValidBackground(candidates) {
    const bg = normalizeGameCoverUrl(candidates.backgroundImage);
    if (bg && isHeroBackgroundCandidate(bg)) return bg;

    const bgAdditional = normalizeGameCoverUrl(candidates.additionalBackground);
    if (bgAdditional && isHeroBackgroundCandidate(bgAdditional)) return bgAdditional;

    const screenshots = Array.isArray(candidates.screenshots) ? candidates.screenshots : [];
    for (const s of screenshots) {
      if (isLandscapeScreenshot(s)) {
        const url = typeof s === 'string' ? s : (s?.image || s?.url || '');
        const normalized = normalizeGameCoverUrl(url);
        if (normalized && isHeroBackgroundCandidate(normalized)) return normalized;
      }
    }

    const localBackdrop = normalizeGameCoverUrl(candidates.localBackdrop);
    if (localBackdrop && isHeroBackgroundCandidate(localBackdrop)) return localBackdrop;

    return '';
  }

  function chooseValidPoster(candidates) {
    const steamAppId = candidates.steamAppId;
    if (steamAppId) {
      const num = String(steamAppId).replace(/\D/g, '');
      if (num.length >= 2) {
        return `https://steamcdn-a.akamaihd.net/steam/apps/${num}/library_600x900.jpg`;
      }
    }

    const primary = normalizeGameCoverUrl(candidates.primary);
    if (primary && !isLikelyLogoOnlyGameArt(primary) && !isBadImageUrl(primary)) return primary;

    const extra = Array.isArray(candidates.extra) ? candidates.extra : [];
    for (const url of extra) {
      const normalized = normalizeGameCoverUrl(url);
      if (normalized && !isLikelyLogoOnlyGameArt(normalized) && !isBadImageUrl(normalized)) return normalized;
    }

    if (primary) return primary;
    return '';
  }

  function generateGradientFallback(posterUrl) {
    const seed = String(posterUrl || 'game').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue1 = (seed * 37) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1},25%,12%) 0%, hsl(${hue2},20%,8%) 100%)`;
  }

  function detectImageType(url) {
    const src = String(url || '').toLowerCase();
    if (!src) return 'unknown';
    if (isLikelyLogoOnlyGameArt(url)) return 'logo';
    if (src.includes('screenshot') || src.includes('gameplay') || src.includes('/media/')) return 'screenshot';
    if (src.includes('background') || src.includes('hero') || src.includes('backdrop') || src.includes('fanart')) return 'hero';
    if (src.includes('cover') || src.includes('poster') || src.includes('library_600x900')) return 'poster';
    return 'unknown';
  }

  function resolveGameCover(row) {
    return chooseValidPoster({
      steamAppId: row?.extra?.steam_appid || row?.steam_appid || row?.steamId,
      primary: row?.cover_url || row?.cover || row?.image || '',
      extra: [
        row?.extra?.cover,
        row?.extra?.poster,
        row?.poster,
        ...(Array.isArray(row?.extra?.local_covers) ? row.extra.local_covers : []),
        ...(Array.isArray(row?.extra?.covers) ? row.extra.covers : []),
        ...(Array.isArray(row?.extra?.official_covers) ? row.extra.official_covers : [])
      ]
    }) || FALLBACK_IMAGE;
  }

  function resolveGameHeroBackground(row) {
    const screenshots = Array.isArray(row?.screenshots) ? row.screenshots : [];
    const shortScreens = Array.isArray(row?.short_screenshots) ? row.short_screenshots : [];

    return chooseValidBackground({
      backgroundImage: row?.hero_background || row?.background_image || '',
      additionalBackground: row?.hero_background_secondary || row?.background_image_additional || '',
      screenshots: [...screenshots, ...shortScreens],
      localBackdrop: row?.hero_url || row?.hero || row?.background || ''
    });
  }

  function resolveGameHeroSecondary(row) {
    return normalizeGameCoverUrl(row?.hero_background_secondary || row?.background_image_additional || '') || '';
  }

  function resolveGameScreenshots(row) {
    const raw = row?.screenshots || row?.short_screenshots || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(s => isValidScreenshot(s))
      .map(s => normalizeGameCoverUrl(stripResizeParams(typeof s === 'string' ? s : (s?.image || s?.url || ''))))
      .filter(Boolean)
      .slice(0, 12);
  }

  function resolveGameAssets(row) {
    const poster = resolveGameCover(row);
    const heroBackground = resolveGameHeroBackground(row);
    const heroBackgroundSecondary = resolveGameHeroSecondary(row);
    const screenshots = resolveGameScreenshots(row);
    const isLogo = isLikelyLogoOnlyGameArt(poster);
    const hasValidHero = !!heroBackground;
    const gradient = (!hasValidHero && poster) ? generateGradientFallback(poster) : '';

    return {
      poster,
      heroBackground: heroBackground || '',
      heroBackgroundSecondary,
      screenshots,
      isLogoOnly: isLogo,
      gradientFallback: gradient,
      imageType: detectImageType(poster)
    };
  }

  function resolveGameHero(row, fallbackCover = '') {
    return resolveGameHeroBackground(row) || normalizeGameCoverUrl(fallbackCover || row?.cover_url || row?.cover || '');
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
    const safe = normalizeCacheKey(title);
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
      const noCoverKey = `${NO_COVER_CACHE_PREFIX}${String(title || '').trim().toLowerCase()}`;
      if (noCoverKey) window.localStorage?.removeItem(noCoverKey);
    } catch (_err) {}
  }

  function isNoCoverCached(title) {
    if (!COVER_STORAGE_ENABLED) return false;
    const key = `${NO_COVER_CACHE_PREFIX}${normalizeCacheKey(title)}`;
    if (key === NO_COVER_CACHE_PREFIX) return false;
    try {
      const raw = window.localStorage ? window.localStorage.getItem(key) : '';
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.t || 0);
      if (!Number.isFinite(savedAt) || (Date.now() - savedAt) > NO_COVER_TTL_MS) {
        window.localStorage?.removeItem(key);
        return false;
      }
      return true;
    } catch (_err) {
      return false;
    }
  }

  function markNoCoverCached(title) {
    if (!COVER_STORAGE_ENABLED) return;
    const key = `${NO_COVER_CACHE_PREFIX}${normalizeCacheKey(title)}`;
    if (key === NO_COVER_CACHE_PREFIX) return;
    try {
      window.localStorage?.setItem(key, JSON.stringify({ t: Date.now() }));
      const coverKey = getCoverStorageKey(title);
      if (coverKey) window.localStorage?.removeItem(coverKey);
    } catch (_err) {}
  }

  async function readCachedCover(title) {
    if (CC) {
      const idb = await CC.getCachedCover(title);
      if (idb) return idb;
    }
    return readCachedCoverFromStorage(title);
  }

  async function writeCachedCover(title, url) {
    coverLookupCache.set(normalizeCacheKey(title), url);
    if (CC) await CC.setCachedCover(title, url);
    writeCachedCoverToStorage(title, url);
  }

  async function isCoverUnavailable(title) {
    if (CC) {
      const nc = await CC.isNoCover(title);
      if (nc) return true;
    }
    return isNoCoverCached(title);
  }

  async function markCoverUnavailable(title) {
    if (CC) await CC.markNoCover(title);
    markNoCoverCached(title);
  }

  async function fetchWikipediaPageImage(pageTitle, signal) {
    const wikiBase = 'https://en.wikipedia.org/w/api.php';
    const pageUrl = new URL(wikiBase);
    pageUrl.searchParams.set('origin', '*');
    pageUrl.searchParams.set('action', 'query');
    pageUrl.searchParams.set('format', 'json');
    pageUrl.searchParams.set('prop', 'pageimages');
    pageUrl.searchParams.set('piprop', 'original|thumbnail');
    pageUrl.searchParams.set('pithumbsize', '900');
    pageUrl.searchParams.set('redirects', '1');
    pageUrl.searchParams.set('titles', pageTitle);

    try {
      const pageRes = await fetch(pageUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!pageRes.ok) return {};
      const pageJson = await pageRes.json().catch(() => null);
      const pages = pageJson?.query?.pages || {};
      const result = {};
      for (const [ns, p] of Object.entries(pages)) {
        if (p && !p.missing) {
          result[p.title] = normalizeGameCoverUrl(p?.original?.source || p?.thumbnail?.source || '');
        }
      }
      return result;
    } catch (_err) {
      return {};
    }
  }

  const WIKI_SEARCH_CACHE = new Map();
  const WIKI_SEARCH_TTL = 1000 * 60 * 60;

  async function findWikipediaPageTitle(title, signal) {
    const q = String(title || '').trim().slice(0, 160);
    if (!q) return '';
    const cacheKey = q.toLowerCase();
    const cached = WIKI_SEARCH_CACHE.get(cacheKey);
    if (cached && (Date.now() - cached.t) < WIKI_SEARCH_TTL) return cached.page || '';

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
      const res = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: signal || undefined
      });
      if (!res.ok) return '';
      const json = await res.json().catch(() => null);
      const first = Array.isArray(json?.query?.search) ? json.query.search[0] : null;
      const pageTitle = String(first?.title || '').trim();
      WIKI_SEARCH_CACHE.set(cacheKey, { page: pageTitle, t: Date.now() });
      return pageTitle;
    } catch (_err) {
      return '';
    }
  }

  async function fetchWikipediaCoverCandidate(title, signal) {
    const q = String(title || '').trim().slice(0, 160);
    if (!q) return '';
    const pageTitle = await findWikipediaPageTitle(q, signal);
    if (!pageTitle) return '';
    const images = await fetchWikipediaPageImage(pageTitle, signal);
    return images[pageTitle] || '';
  }

  async function fetchWikipediaCoversForTitles(titles, signal) {
    const queries = Array.isArray(titles) ? titles.slice(0, 30) : [titles];
    if (!queries.length) return {};
    const results = {};

    const uncached = [];
    for (const t of queries) {
      const pt = await findWikipediaPageTitle(t, signal);
      if (pt) uncached.push(pt);
    }
    if (!uncached.length) return results;

    for (let i = 0; i < uncached.length; i += 20) {
      const batch = uncached.slice(i, i + 20);
      const images = await fetchWikipediaPageImage(batch.join('|'), signal);
      Object.assign(results, images);
    }
    return results;
  }

  async function loadFeaturedGames(signal, options = {}) {
    const limit = Math.max(1, Number(options.limit || 24));
    const client = ensureSupabase();
    if (!client) return [];

    try {
      const query = client
        .from('games')
        .select('id,title,release_date,description,cover_url,hero_url,rating,rating_count,extra,source,slug')
        .gte('release_date', '2026-01-01')
        .lte('release_date', '2026-12-31')
        .order('rating_count', { ascending: false, nullsFirst: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(Math.max(limit * 10, 120));

      const result = signal ? await query.abortSignal(signal) : await query;
      const localData = Array.isArray(result?.data) ? result.data : [];

      let rawgData = [];
      if (localData.length < limit * 2) {
        try {
          const currentYear = new Date().getFullYear();
          const dates = `${currentYear - 1}-01-01,${currentYear + 1}-12-31`;
          const url = new URL(`${IGDB_PROXY_BASE}/games`, window.location.origin);
          url.searchParams.set('page', '1');
          url.searchParams.set('page_size', String(Math.min(limit * 2, 40)));
          url.searchParams.set('ordering', '-added');
          url.searchParams.set('dates', dates);
          const res = await fetch(url.toString(), {
            headers: { 'accept': 'application/json' },
            signal: signal || undefined
          });
          if (res.ok) {
            const data = await res.json();
            rawgData = Array.isArray(data?.results) ? data.results : [];
          }
        } catch (_err) {}
      }

      const allRows = [...localData, ...rawgData];
      if (!allRows.length) return [];

      const seen = new Set();
      const items = [];
      for (const row of allRows) {
        if (!row) continue;
        const id = String(row?.id || row?.slug || '').trim();
        const title = String(row?.title || row?.name || 'Game').trim();
        if (!id || !title) continue;
        const dedupeKey = title.toLowerCase();
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const assets = resolveGameAssets(row);
        const visual = assets.poster || FALLBACK_IMAGE;
        const hero = assets.heroBackground || visual;
        const plain = assets.isLogoOnly || !assets.heroBackground;

        const releaseDate = String(row?.release_date || row?.released || '').trim();
        const ratingValue = Number(row?.rating || 0);
        const genres = Array.isArray(row?.extra?.genres) ? row.extra.genres : (Array.isArray(row?.genres) ? row.genres : []);
        const genreText = genres.length
          ? genres.slice(0, 2).map((entry) => String(entry?.name || entry || '').trim()).filter(Boolean).join(' | ')
          : 'Video Game';
        const ratingText = Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : '';

        const item = {
          mediaType: 'game',
          itemId: id,
          title,
          subtitle: releaseDate ? releaseDate.slice(0, 10) : '',
          extra: [genreText, ratingText].filter(Boolean).join(' | '),
          image: visual,
          backgroundImage: hero,
          heroBackground: assets.heroBackground || '',
          heroBackgroundSecondary: assets.heroBackgroundSecondary,
          screenshots: assets.screenshots,
          spotlightImage: hero,
          spotlightMediaImage: visual,
          spotlightMediaFit: 'contain',
          spotlightMediaShape: plain ? 'landscape' : 'poster',
          gameCardMode: plain ? 'plain' : 'hero',
          fallbackImage: FALLBACK_IMAGE,
          gradientFallback: assets.gradientFallback || '',
          isLogoOnly: assets.isLogoOnly,
          href: `game.html?id=${encodeURIComponent(String(id))}`
        };

        items.push(item);
        if (items.length >= limit) break;
      }

      return items;
    } catch (_err) {
      return [];
    }
  }

  function trySteamCover(result) {
    const steamId = String(result?.steam_app_id || result?.steamId || result?.steam_id || '').trim();
    if (!steamId) return '';
    const numeric = steamId.replace(/\D/g, '');
    if (!numeric || numeric.length < 3) return '';
    for (const tmpl of STEAM_COVER_TEMPLATES) {
      const url = tmpl(numeric);
      if (url) return url;
    }
    return '';
  }

  async function fetchCoverForTitle(title, signal) {
    const key = normalizeCacheKey(title);
    if (!key) return '';
    if (coverLookupCache.has(key)) return coverLookupCache.get(key) || '';

    if (await isCoverUnavailable(title)) {
      coverLookupCache.set(key, '');
      return '';
    }

    const url = new URL(`${IGDB_PROXY_BASE}/games`, window.location.origin);
    url.searchParams.set('search', String(title || '').trim().slice(0, 120));
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', '1');
    url.searchParams.set('title_only', '1');
    url.searchParams.set('cb', Date.now());

    const cached = await readCachedCover(title);
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
        await writeCachedCover(title, cover);
        return cover;
      }

      const steamCover = trySteamCover(pick);
      if (steamCover) {
        await writeCachedCover(title, steamCover);
        return steamCover;
      }

      const [wikiCover] = await Promise.all([
        fetchWikipediaCoverCandidate(title, signal)
      ]);
      if (wikiCover) {
        await writeCachedCover(title, wikiCover);
        return wikiCover;
      }

      await markCoverUnavailable(title);
      return '';
    } catch (_err) {
      const wikiCover = await fetchWikipediaCoverCandidate(title, signal);
      if (wikiCover) {
        await writeCachedCover(title, wikiCover);
        return wikiCover;
      }
      return '';
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

  const ASSETS_CACHE_PREFIX = 'zo2y_game_assets_v1:';
  const ASSETS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const assetsCache = new Map();

  async function ensureGameAssets(gameId, existingRow, signal) {
    const id = String(gameId || '').trim();
    if (!id) return existingRow || {};

    const existingAssets = resolveGameAssets(existingRow || {});
    if (existingAssets.heroBackground && existingAssets.screenshots.length > 0) {
      return existingRow || {};
    }

    const cacheKey = `${ASSETS_CACHE_PREFIX}${id}`;
    if (assetsCache.has(cacheKey)) {
      const cached = assetsCache.get(cacheKey);
      if (cached && (Date.now() - cached.t) < ASSETS_CACHE_TTL_MS) {
        return Object.assign({}, existingRow || {}, cached.data);
      }
    }

    try {
      const res = await fetch(`${IGDB_PROXY_BASE}/games/${encodeURIComponent(id)}?cb=${Date.now()}`, {
        headers: { 'accept': 'application/json' },
        signal
      });
      if (!res.ok) return existingRow || {};
      const data = await res.json();
      if (!data || typeof data !== 'object') return existingRow || {};

      const merged = {
        hero_background: data.hero_background || data.background_image || data.hero_url || '',
        hero_background_secondary: data.hero_background_secondary || data.background_image_additional || '',
        background_image: data.background_image || '',
        background_image_additional: data.background_image_additional || '',
        screenshots: Array.isArray(data.screenshots) ? data.screenshots.slice(0, 12) : [],
        cover: data.cover || existingAssets.poster || '',
        source: data.source || 'rawg'
      };

      assetsCache.set(cacheKey, { data: merged, t: Date.now() });
      return Object.assign({}, existingRow || {}, merged);
    } catch (_err) {
      return existingRow || {};
    }
  }

  async function syncRawgArtworkToSupabase(client, gameId, assets) {
    if (!client || !gameId || !assets) return;
    const updates = {};
    if (assets.hero_background && isHeroBackgroundCandidate(assets.hero_background)) {
      updates.hero_url = assets.hero_background;
    }
    if (assets.background_image) updates.hero_url = updates.hero_url || assets.background_image;
    if (assets.screenshots && assets.screenshots.length > 0) {
      const extra = {};
      if (assets.background_image) extra.background_image = assets.background_image;
      if (assets.background_image_additional) extra.background_image_additional = assets.background_image_additional;
      extra.screenshots = assets.screenshots.slice(0, 6);
      updates.extra = extra;
    }
    updates.last_synced_at = new Date().toISOString();
    if (Object.keys(updates).length <= 1) return;
    try {
      await client.from('games').update(updates).eq('id', gameId);
    } catch (_err) {}
  }

  async function ensureGameInSupabase(client, rawgGame) {
    if (!client || !rawgGame || !rawgGame.id) return;
    const isRawg = rawgGame.source === 'rawg' || String(rawgGame.id).startsWith('rawg_');
    const gameId = isRawg
      ? (String(rawgGame.id).startsWith('rawg_') ? rawgGame.id : `rawg_${rawgGame.id}`)
      : String(rawgGame.id);
    const title = rawgGame.name || rawgGame.title || '';
    const slug = rawgGame.slug || '';
    if (!title) return;
    try {
      const { data: existing } = await client
        .from('games')
        .select('id,extra')
        .eq('id', gameId)
        .maybeSingle();
      const heroBg = normalizeGameCoverUrl(rawgGame.hero_background || rawgGame.background_image || '');
      const heroSec = normalizeGameCoverUrl(rawgGame.hero_background_secondary || rawgGame.background_image_additional || '');
      const screenshots = Array.isArray(rawgGame.screenshots)
        ? rawgGame.screenshots.map(s => stripResizeParams(typeof s === 'string' ? s : (s?.image || s?.url || ''))).filter(Boolean).slice(0, 12)
        : [];
      const poster = normalizeGameCoverUrl(rawgGame.cover || rawgGame.cover_url || rawgGame.poster_image || '');
      const existingExtra = existing?.extra || {};
      const extra = {
        ...existingExtra,
        genres: rawgGame.genres || existingExtra.genres || [],
        platforms: rawgGame.platforms || existingExtra.platforms || [],
        background_image: heroBg || existingExtra.background_image,
        background_image_additional: heroSec || existingExtra.background_image_additional,
        screenshots: screenshots.length ? screenshots : existingExtra.screenshots || []
      };
      if (rawgGame.developers) extra.developers = rawgGame.developers;
      if (rawgGame.publishers) extra.publishers = rawgGame.publishers;
      const row = {
        id: gameId,
        title,
        slug,
        description: rawgGame.description || rawgGame.description_raw || '',
        cover_url: poster,
        hero_url: heroBg,
        hero_background: heroBg,
        hero_background_secondary: heroSec,
        screenshots,
        release_date: rawgGame.released || rawgGame.release_date || '',
        rating: rawgGame.rating || rawgGame.metacritic || 0,
        rating_count: rawgGame.ratings_count || rawgGame.rating_count || 0,
        extra,
        source: rawgGame.source || 'rawg',
        last_synced_at: new Date().toISOString()
      };
      if (existing) {
        await client.from('games').update(row).eq('id', gameId);
      } else {
        await client.from('games').insert(row);
      }
    } catch (_err) {}
  }

  window.__zo2yGamesShared = {
    loadFeaturedGames,
    resolveGameCover,
    resolveGameHeroBackground,
    resolveGameHeroSecondary,
    resolveGameScreenshots,
    resolveGameAssets,
    ensureGameAssets,
    syncRawgArtworkToSupabase,
    ensureGameInSupabase,
    fetchCoverForTitle,
    fetchWikipediaCoverCandidate,
    fetchWikipediaCoversForTitles,
    searchGamesFromWikipedia,
    normalizeGameCoverUrl,
    chooseValidBackground,
    chooseValidPoster,
    isLikelyLogoOnlyGameArt,
    isHeroBackgroundCandidate,
    isValidScreenshot,
    isLandscapeScreenshot,
    generateGradientFallback,
    detectImageType,
    stripResizeParams
  };
})();
