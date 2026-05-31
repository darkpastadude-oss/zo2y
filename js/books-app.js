(function() {
  'use strict';
  if (window.BooksApp) return;

  const API_BASE = '/api/books';
  const FALLBACK_IMAGE = '/images/fallback/book.svg';
  const API_PAGE_SIZE = 40;
  const CACHE_PREFIX = 'zo2y_books_v4:';
  const CACHE_TTL = 1000 * 60 * 30;

  let activeController = null;
  const requestCache = new Map();

  function escape(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function getCacheKey(q, page, sort) {
    return CACHE_PREFIX + (String(q || '').trim().toLowerCase() || '__top__') + ':' + (page || 1) + ':' + (sort || 'relevance');
  }

  function readCache(key) {
    if (requestCache.has(key)) return requestCache.get(key);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      requestCache.set(key, parsed);
      return parsed;
    } catch(e) { return null; }
  }

  function writeCache(key, data) {
    const payload = { ...data, savedAt: Date.now() };
    requestCache.set(key, payload);
    try { localStorage.setItem(key, JSON.stringify(payload)); } catch(e) {}
  }

  async function apiFetch(path) {
    if (activeController) activeController.abort();
    activeController = new AbortController();
    const signal = activeController.signal;
    try {
      const res = await fetch(API_BASE + path, { signal });
      if (!res.ok) return null;
      return await res.json();
    } catch(e) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  }

  async function apiFetchParams(path, params) {
    const url = new URL(API_BASE + path, window.location.origin);
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
    if (activeController) activeController.abort();
    activeController = new AbortController();
    try {
      const res = await fetch(url.toString(), { signal: activeController.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch(e) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  }

  function bookSeedScore(raw, seed) {
    const nTitle = String(raw.title || raw.name || '').trim().toLowerCase();
    const nSeedTitle = String(seed.title || '').trim().toLowerCase();
    const nAuthor = String(raw.authors || (Array.isArray(raw.author_name) ? raw.author_name[0] : '') || raw.author || '').trim().toLowerCase();
    const nSeedAuthor = String(seed.author || '').trim().toLowerCase();
    let score = 0;
    if (nTitle === nSeedTitle) score += 10;
    else if (nTitle.startsWith(nSeedTitle) || nSeedTitle.startsWith(nTitle)) score += 6;
    else if (nTitle.includes(nSeedTitle) || nSeedTitle.includes(nTitle)) score += 3;
    if (nAuthor && nSeedAuthor && (nAuthor.includes(nSeedAuthor) || nSeedAuthor.includes(nAuthor))) score += 5;
    return score;
  }

  function getYear(raw) {
    const pd = String(raw.publishedDate || raw.published_date || raw.first_publish_year || '');
    const m = pd.match(/\d{4}/);
    return m ? Number(m[0]) : 0;
  }

  function scoreRecency(book) {
    const year = getYear(book);
    if (!year) return 0;
    const age = new Date().getFullYear() - year;
    if (age <= 1) return 5;
    if (age <= 3) return 4;
    if (age <= 5) return 3;
    if (age <= 10) return 2;
    if (age <= 20) return 1;
    return 0;
  }

  function isEnglish(raw) {
    const lang = String(raw.language || '').trim().toLowerCase();
    if (lang === 'en' || lang === 'eng' || lang === 'english') return true;
    if (!lang || lang === 'unknown') {
      if (/^[a-zA-Z0-9\s\-'.,!?":;()]+$/.test(String(raw.title || ''))) return true;
    }
    return false;
  }

  function hasUsableCover(coverUrl) {
    const c = String(coverUrl || '');
    if (!c || c === FALLBACK_IMAGE || c.includes('fallback') || c.includes('nocover')) return false;
    return c.startsWith('http');
  }

  function normalizeBook(raw) {
    return {
      id: String(raw.id || raw._googleVolumeId || raw.key || ''),
      title: String(raw.title || raw.name || 'Unknown Book').trim(),
      authors: Array.isArray(raw.authors) ? raw.authors.join(', ') : Array.isArray(raw.author_name) ? raw.author_name.join(', ') : String(raw.authors || raw.author || 'Unknown Author').trim(),
      description: String(raw.description || raw.subtitle || '').trim(),
      coverUrl: String(raw.thumbnail || raw.cover || raw.image || raw.coverImage || raw._googleThumbnail || ''),
      publishedDate: String(raw.publishedDate || raw.published_date || raw.first_publish_year || ''),
      pageCount: Number(raw.pageCount || raw.page_count || 0),
      categories: Array.isArray(raw.categories) || Array.isArray(raw.subject) ? [...(raw.categories || raw.subject || [])] : [],
      language: String(raw.language || '').trim()
    };
  }

  function dedupe(arr) {
    const seen = new Set();
    return arr.filter(x => { const k = String(x.id || '').toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }

  async function fetchPage(query, page, sort) {
    const key = getCacheKey(query, page, sort);
    const cached = readCache(key);
    if (cached) return cached;

    const limit = API_PAGE_SIZE;
    const orderBy = sort === 'newest' ? 'newest' : 'relevance';

    let books = [];
    let totalFound = 0;

    if (query) {
      const json = await apiFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}&language=en&orderBy=${orderBy}`);
      if (!json) return null;
      books = (json.books || []).map(normalizeBook);
      totalFound = Number(json.meta?.numFound || books.length || 0);

      if (books.length < 5 && page === 1) {
        const olJson = await apiFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}&page=1&language=en&orderBy=${orderBy}`);
        if (olJson && olJson.books) {
          const more = olJson.books.map(normalizeBook);
          books = dedupe([...books, ...more]);
          totalFound = Math.max(totalFound, more.length);
        }
      }
    } else {
      const trending = await apiFetch(`/trending?period=weekly&limit=${limit}`);
      if (trending && trending.books) {
        books = trending.books.map(normalizeBook);
        totalFound = books.length;
      }
      if (books.length < 30) {
        const popular = await apiFetch(`/popular?subject=fiction&limit=${limit}&page=${page}&language=en&orderBy=relevance`);
        if (popular && popular.books) {
          const popBooks = popular.books.map(normalizeBook);
          books = dedupe([...books, ...popBooks]);
          totalFound = Math.max(totalFound, Number(popular.meta?.numFound || popBooks.length));
        }
      }
    }

    const result = { books, totalFound: Math.max(totalFound, books.length) };
    writeCache(key, result);
    return result;
  }

  async function fetchAllPages(query, maxPages) {
    const seen = new Set();
    const allBooks = [];
    let totalFound = 0;

    for (let p = 1; p <= maxPages; p++) {
      const result = await fetchPage(query, p, 'relevance');
      if (!result || !result.books.length) break;
      for (const b of result.books) {
        const k = String(b.id || '').toLowerCase();
        if (k && !seen.has(k)) { seen.add(k); allBooks.push(b); }
      }
      totalFound = Math.max(totalFound, result.totalFound);
    }
    return { books: allBooks, totalFound: Math.max(totalFound, allBooks.length) };
  }

  async function fetchDiscoverySections() {
    const sections = {};

    const cacheKey = CACHE_PREFIX + 'sections_v2';
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const seedPool = Array.isArray(window.ZO2Y_CURATED_BOOK_SEEDS) ? window.ZO2Y_CURATED_BOOK_SEEDS : [];
    const shuffled = seedPool.slice().sort(function () { return Math.random() - 0.5; });
    const seedSlice = shuffled.slice(0, 24);

    const seedResults = seedSlice.length
      ? await Promise.allSettled(seedSlice.map(function (seed) {
          return apiFetchParams('/search', {
            title: seed.title,
            author: seed.author,
            limit: 3,
            page: 1,
            language: 'en'
          });
        }))
      : [];

    var popularBooks = [];
    var seenSeeds = new Set();
    seedResults.forEach(function (result, idx) {
      if (result.status !== 'fulfilled' || !result.value) return;
      var docs = Array.isArray(result.value.books) ? result.value.books : [];
      if (!docs.length) return;
      var seed = seedSlice[idx];
      if (!seed) return;
      var best = docs.slice().sort(function (a, b) {
        return bookSeedScore(b, seed) - bookSeedScore(a, seed);
      })[0];
      if (!best) return;
      var n = normalizeBook(best);
      var key = String(n.id || n.title || '').toLowerCase();
      if (key && !seenSeeds.has(key)) { seenSeeds.add(key); popularBooks.push(n); }
    });

    var [trendingResult, newReleasesResult] = await Promise.allSettled([
      apiFetch('/trending?period=weekly&limit=40'),
      apiFetch('/search?q=2025&limit=40&page=1&language=en&orderBy=newest')
    ]);

    var trendingBooks = [];
    if (trendingResult.status === 'fulfilled' && trendingResult.value && trendingResult.value.books) {
      trendingBooks = trendingResult.value.books.map(normalizeBook);
    }

    var newReleaseBooks = [];
    if (newReleasesResult.status === 'fulfilled' && newReleasesResult.value && newReleasesResult.value.books) {
      newReleaseBooks = newReleasesResult.value.books.map(normalizeBook);
    }

    trendingBooks.sort(function (a, b) {
      var ra = scoreRecency(a);
      var rb = scoreRecency(b);
      if (rb !== ra) return rb - ra;
      var ea = isEnglish(a) ? 1 : 0;
      var eb = isEnglish(b) ? 1 : 0;
      if (eb !== ea) return eb - ea;
      var ca = hasUsableCover(a.coverUrl) ? 1 : 0;
      var cb = hasUsableCover(b.coverUrl) ? 1 : 0;
      if (cb !== ca) return cb - ca;
      return 0;
    });

    newReleaseBooks.sort(function (a, b) {
      var ya = getYear(a);
      var yb = getYear(b);
      if (yb !== ya) return yb - ya;
      var ea = isEnglish(a) ? 1 : 0;
      var eb = isEnglish(b) ? 1 : 0;
      if (eb !== ea) return eb - ea;
      return 0;
    });

    if (popularBooks.length) sections.popular = dedupe(popularBooks).slice(0, 24);
    if (trendingBooks.length) sections.trending = dedupe(trendingBooks).slice(0, 30);
    if (newReleaseBooks.length) sections.newReleases = dedupe(newReleaseBooks).slice(0, 30);

    writeCache(cacheKey, sections);
    return sections;
  }

  async function fetchBestSellers() {
    return await fetchPage('bestsellers 2025 fiction', 1, 'relevance');
  }

  window.BooksApp = {
    escape: escape,
    fetchPage: fetchPage,
    fetchAllPages: fetchAllPages,
    fetchDiscoverySections: fetchDiscoverySections,
    fetchBestSellers: fetchBestSellers,
    normalizeBook: normalizeBook,
    dedupe: dedupe,
    API_BASE: API_BASE,
    API_PAGE_SIZE: API_PAGE_SIZE,
    FALLBACK_IMAGE: FALLBACK_IMAGE,
    abort: function () { if (activeController) activeController.abort(); }
  };
})();
