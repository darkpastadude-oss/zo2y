(function() {
  'use strict';
  if (window.BooksApp) return;

  const API_BASE = '/api/books';
  const FALLBACK_IMAGE = '/images/fallback/book.svg';
  const API_PAGE_SIZE = 40;
  const CACHE_PREFIX = 'zo2y_books_v3:';
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

    const cacheKey = CACHE_PREFIX + 'sections_v1';
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const [trending, trendingMonthly, fantasy, scifi, romance, thriller, nonfiction, newReleases] = await Promise.all([
      apiFetch('/trending?period=weekly&limit=40'),
      apiFetch('/trending?period=monthly&limit=40'),
      apiFetch('/popular?subject=fantasy&limit=40&page=1&language=en'),
      apiFetch('/popular?subject=science+fiction&limit=40&page=1&language=en'),
      apiFetch('/popular?subject=romance&limit=40&page=1&language=en'),
      apiFetch('/popular?subject=thriller&limit=40&page=1&language=en'),
      apiFetch('/popular?subject=nonfiction&limit=40&page=1&language=en'),
      apiFetch('/search?q=2025&limit=40&page=1&language=en&orderBy=newest')
    ]);

    if (trending) sections.trending = dedupe(trending.books.map(normalizeBook)).slice(0, 30);
    if (trendingMonthly) sections.popularThisYear = dedupe(trendingMonthly.books.map(normalizeBook)).slice(0, 30);
    if (fantasy) sections.fantasy = dedupe(fantasy.books.map(normalizeBook)).slice(0, 30);
    if (scifi) sections.scifi = dedupe(scifi.books.map(normalizeBook)).slice(0, 30);
    if (romance) sections.romance = dedupe(romance.books.map(normalizeBook)).slice(0, 30);
    if (thriller) sections.thriller = dedupe(thriller.books.map(normalizeBook)).slice(0, 30);
    if (nonfiction) sections.nonfiction = dedupe(nonfiction.books.map(normalizeBook)).slice(0, 30);
    if (newReleases) sections.newReleases = dedupe(newReleases.books.map(normalizeBook)).slice(0, 30);

    writeCache(cacheKey, sections);
    return sections;
  }

  async function fetchBestSellers() {
    return await fetchPage('bestsellers 2025 fiction', 1, 'relevance');
  }

  window.BooksApp = {
    escape,
    fetchPage,
    fetchAllPages,
    fetchDiscoverySections,
    fetchBestSellers,
    normalizeBook,
    dedupe,
    API_BASE,
    API_PAGE_SIZE,
    FALLBACK_IMAGE,
    abort() { if (activeController) activeController.abort(); }
  };
})();
