(function() {
  'use strict';
  if (window.BooksApp) return;

  const API_BASE = '/api/books';
  const FALLBACK_IMAGE = '/images/fallback/book.svg';
  const API_PAGE_SIZE = 40;
  const CACHE_PREFIX = 'zo2y_books_v5:';
  const CACHE_TTL = 1000 * 60 * 60 * 2;

  var activeController = null;
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
    try {
      const res = await fetch(API_BASE + path, { signal: activeController.signal });
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

  function normalizeSeedText(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function scoreSeededBookMatch(row, seed) {
    var nTitle = normalizeSeedText(row && (row.title || row.name || ''));
    var nAuthor = normalizeSeedText(Array.isArray(row && row.author_name) ? row.author_name[0] : (row && (row.authors || row.author || '')));
    var sTitle = normalizeSeedText(seed && seed.title || '');
    var sAuthor = normalizeSeedText(seed && seed.author || '');
    var score = 0;
    if (nTitle && sTitle) {
      if (nTitle === sTitle) score += 120;
      else if (nTitle.indexOf(sTitle) === 0 || sTitle.indexOf(nTitle) === 0) score += 80;
      else if (nTitle.indexOf(sTitle) >= 0 || sTitle.indexOf(nTitle) >= 0) score += 48;
    }
    if (nAuthor && sAuthor) {
      if (nAuthor === sAuthor) score += 70;
      else if (nAuthor.indexOf(sAuthor) >= 0 || sAuthor.indexOf(nAuthor) >= 0) score += 42;
    }
    if (row && (row._googleThumbnail || row.coverImage || row.cover || row.thumbnail || row.cover_i)) score += 16;
    if (row && (row.first_publish_year || row.publishedDate || row.published_date)) score += 8;
    return score;
  }

  function assessJunk(raw) {
    var title = String(raw.title || raw.name || '').toLowerCase();
    var desc = String(raw.description || raw.subtitle || '').toLowerCase();
    var junkPatterns = ['report', 'manual', 'document', 'catalog', 'catalogue', 'bulletin', 'proceedings', 'conference', 'symposium', 'workshop', 'thesis', 'dissertation', 'treatise', 'technical report', 'white paper', 'specification', 'standard', 'government publication', 'public domain', 'metadata', 'bibliographic record', 'marc record', 'library catalog', 'volume ', 'vol. ', 'index to', 'abstract', 'newspaper', 'magazine', 'archive'];
    for (var i = 0; i < junkPatterns.length; i++) {
      if (title.indexOf(junkPatterns[i]) >= 0 || desc.indexOf(junkPatterns[i]) >= 0) return true;
    }
    return false;
  }

  function isSuggestiveText(text) {
    var patterns = [/\bhentai\b/i, /\becchi\b/i, /\bnsfw\b/i, /\b18\+\b/i, /\berotic(?:a|ism)?\b/i, /\bsex(?:ual|y)?\b/i, /\bnud(?:e|ity)\b/i, /\buncensored\b/i, /\bfetish\b/i, /\bharem\b/i, /\bmature audiences?\b/i, /\badult[-\s]?(?:only|content|themes?|audiences?)\b/i, /\bxxx\b/i];
    var val = String(text || '').trim();
    if (!val) return false;
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(val)) return true;
    }
    return false;
  }

  function isContentSafe(book) {
    if (!book) return false;
    var maturity = String(book.maturityRating || '').trim().toLowerCase();
    if (maturity.indexOf('mature') >= 0 && maturity.indexOf('not_mature') < 0) return false;
    var isAdult = book.isAdult === true || String(book.isAdult || '').trim().toLowerCase() === 'true';
    if (isAdult) return false;
    var title = String(book.title || '');
    if (isSuggestiveText(title)) return false;
    var desc = String(book.description || book.subtitle || '');
    if (isSuggestiveText(desc)) return false;
    return true;
  }

  function getYear(raw) {
    var pd = String(raw.publishedDate || raw.published_date || raw.first_publish_year || '');
    var m = pd.match(/\d{4}/);
    return m ? Number(m[0]) : 0;
  }

  function scoreRecency(book) {
    var year = getYear(book);
    if (!year) return 0;
    var age = new Date().getFullYear() - year;
    if (age <= 1) return 5;
    if (age <= 3) return 4;
    if (age <= 5) return 3;
    if (age <= 10) return 2;
    if (age <= 20) return 1;
    return 0;
  }

  function isEnglish(raw) {
    var lang = String(raw.language || '').trim().toLowerCase();
    if (lang === 'en' || lang === 'eng' || lang === 'english') return true;
    if (!lang || lang === 'unknown') {
      if (/^[a-zA-Z0-9\s\-'.,!?":;()]+$/.test(String(raw.title || ''))) return true;
    }
    return false;
  }

  function hasUsableCover(coverUrl) {
    var c = String(coverUrl || '');
    if (!c || c === FALLBACK_IMAGE || c.indexOf('fallback') >= 0 || c.indexOf('nocover') >= 0) return false;
    return c.indexOf('http') === 0;
  }

  function isHighResCover(coverUrl) {
    var c = String(coverUrl || '');
    if (!c) return false;
    if (c.indexOf('zoom=1') >= 0 || c.indexOf('&edge') >= 0 || c.indexOf('?fife=') >= 0) return true;
    if (/[&?]sz=\d{3,}/.test(c)) return true;
    if (c.indexOf('books.google.com') >= 0 && c.indexOf('pg=') >= 0) return true;
    if (c.indexOf('openlibrary.org') >= 0 && /-\w\.jpg$/.test(c)) return true;
    return false;
  }

  function assessCoverQuality(coverUrl) {
    var c = String(coverUrl || '');
    if (!hasUsableCover(c)) return 0;
    var quality = 1;
    if (isHighResCover(c)) quality = 3;
    else if (c.indexOf('books.google.com') >= 0 || c.indexOf('openlibrary.org') >= 0) quality = 2;
    var smallIndicators = ['&edge=curl', 'zoom=0', '&w=', 'small', '&ez=', 'sz=50'];
    for (var i = 0; i < smallIndicators.length; i++) {
      if (c.indexOf(smallIndicators[i]) >= 0) { quality = Math.min(quality, 1); break; }
    }
    return quality;
  }

  function normalizeBook(raw) {
    if (!raw) return null;
    var coverUrl = String(raw.thumbnail || raw.cover || raw.image || raw.coverImage || raw._googleThumbnail || '');
    return {
      id: String(raw.id || raw._googleVolumeId || raw.key || ''),
      title: String(raw.title || raw.name || 'Unknown Book').trim(),
      authors: Array.isArray(raw.authors) ? raw.authors.join(', ') : Array.isArray(raw.author_name) ? raw.author_name.join(', ') : String(raw.authors || raw.author || 'Unknown Author').trim(),
      description: String(raw.description || raw.subtitle || '').trim(),
      coverUrl: coverUrl,
      publishedDate: String(raw.publishedDate || raw.published_date || raw.first_publish_year || ''),
      pageCount: Number(raw.pageCount || raw.page_count || 0),
      categories: Array.isArray(raw.categories) || Array.isArray(raw.subject) ? [...(raw.categories || raw.subject || [])] : [],
      language: String(raw.language || '').trim(),
      maturityRating: String(raw.maturityRating || '').trim(),
      _googleVolumeId: String(raw._googleVolumeId || '').trim(),
      _coverQuality: assessCoverQuality(coverUrl)
    };
  }

  function dedupe(arr) {
    var seen = new Set();
    return arr.filter(function(x) { var k = String(x && x.id || '').toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }

  async function fetchPage(query, page, sort) {
    var key = getCacheKey(query, page, sort);
    var cached = readCache(key);
    if (cached) return cached;

    var limit = API_PAGE_SIZE;
    var orderBy = sort === 'newest' ? 'newest' : 'relevance';
    var books = [];
    var totalFound = 0;

    if (query) {
      var json = await apiFetch('/search?q=' + encodeURIComponent(query) + '&limit=' + limit + '&page=' + page + '&language=en&orderBy=' + orderBy);
      if (!json) return null;
      books = (json.books || []).map(normalizeBook).filter(Boolean).filter(isContentSafe).filter(function(b) { return !assessJunk(b); });
      totalFound = Number(json.meta && json.meta.numFound || books.length || 0);

      if (books.length < 5 && page === 1) {
        var olJson = await apiFetch('/search?q=' + encodeURIComponent(query) + '&limit=' + limit + '&page=1&language=en&orderBy=' + orderBy);
        if (olJson && olJson.books) {
          var more = olJson.books.map(normalizeBook).filter(Boolean).filter(isContentSafe);
          books = dedupe([].concat(books).concat(more));
          totalFound = Math.max(totalFound, more.length);
        }
      }
    } else {
      var trending = await apiFetch('/trending?period=weekly&limit=' + limit);
      if (trending && trending.books) {
        books = trending.books.map(normalizeBook).filter(Boolean).filter(isContentSafe);
        totalFound = books.length;
      }
      if (books.length < 30) {
        var popular = await apiFetch('/popular?subject=fiction&limit=' + limit + '&page=' + page + '&language=en&orderBy=relevance');
        if (popular && popular.books) {
          var popBooks = popular.books.map(normalizeBook).filter(Boolean).filter(isContentSafe);
          books = dedupe([].concat(books).concat(popBooks));
          totalFound = Math.max(totalFound, Number(popular.meta && popular.meta.numFound || popBooks.length));
        }
      }
      if (books.length < 20 && page === 1) {
        var currentYear = new Date().getFullYear();
        var fallback = await apiFetch('/search?q=' + encodeURIComponent('bestseller fiction ' + currentYear) + '&limit=' + limit + '&page=1&language=en&orderBy=relevance');
        if (fallback && fallback.books) {
          var fbBooks = fallback.books.map(normalizeBook).filter(Boolean).filter(isContentSafe);
          books = dedupe([].concat(books).concat(fbBooks));
          totalFound = Math.max(totalFound, fbBooks.length);
        }
      }
    }

    books = books.filter(isContentSafe);
    var result = { books: books, totalFound: Math.max(totalFound, books.length) };
    writeCache(key, result);
    return result;
  }

  async function fetchAllPages(query, maxPages) {
    var seen = new Set();
    var allBooks = [];
    var totalFound = 0;
    for (var p = 1; p <= maxPages; p++) {
      var result = await fetchPage(query, p, 'relevance');
      if (!result || !result.books.length) break;
      for (var i = 0; i < result.books.length; i++) {
        var b = result.books[i];
        var k = String(b && b.id || '').toLowerCase();
        if (k && !seen.has(k)) { seen.add(k); allBooks.push(b); }
      }
      totalFound = Math.max(totalFound, result.totalFound);
    }
    return { books: allBooks, totalFound: Math.max(totalFound, allBooks.length) };
  }

  async function fetchDiscoverySections() {
    var sections = {};
    var cacheKey = CACHE_PREFIX + 'sections_v3';
    var cached = readCache(cacheKey);
    if (cached) return cached;

    var seedPool = Array.isArray(window.ZO2Y_CURATED_BOOK_SEEDS) ? window.ZO2Y_CURATED_BOOK_SEEDS : [];
    var shuffled = seedPool.slice().sort(function () { return Math.random() - 0.5; });
    var seedSlice = shuffled.slice(0, 24);

    var currentYear = new Date().getFullYear();

    var seedResults = seedSlice.length
      ? await Promise.allSettled(seedSlice.map(function (seed) {
          return apiFetchParams('/search', {
            title: seed.title,
            author: seed.author,
            limit: 5,
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
        return scoreSeededBookMatch(b, seed) - scoreSeededBookMatch(a, seed);
      })[0];
      if (!best) return;
      if (assessJunk(best)) return;
      if (!isContentSafe(best)) return;
      var n = normalizeBook(best);
      if (!n || !n.id) return;
      var key = String(n.id || n.title || '').toLowerCase();
      if (key && !seenSeeds.has(key)) { seenSeeds.add(key); popularBooks.push(n); }
    });

    popularBooks = popularBooks.filter(isContentSafe);

    // Use multiple targeted queries for new releases instead of "2025"
    var newReleaseQueries = [
      'bestseller fiction ' + currentYear,
      'new release fiction ' + currentYear,
      'award winning fiction ' + currentYear,
      'popular fiction ' + currentYear
    ];

    var trendingPromise = apiFetch('/trending?period=weekly&limit=40');
    var newReleasePromises = newReleaseQueries.map(function(q) {
      return apiFetch('/search?q=' + encodeURIComponent(q) + '&limit=40&page=1&language=en&orderBy=newest');
    });

    var allResults = await Promise.allSettled([trendingPromise].concat(newReleasePromises));

    var trendingResult = allResults[0];
    var newReleaseResults = allResults.slice(1);

    var trendingBooks = [];
    if (trendingResult.status === 'fulfilled' && trendingResult.value && trendingResult.value.books) {
      trendingBooks = trendingResult.value.books.map(normalizeBook).filter(Boolean).filter(isContentSafe);
    }

    var newReleaseBooks = [];
    var seenNR = new Set();
    newReleaseResults.forEach(function(result) {
      if (result.status !== 'fulfilled' || !result.value || !result.value.books) return;
      result.value.books.map(normalizeBook).filter(Boolean).filter(isContentSafe).forEach(function(b) {
        var k = String(b.id || '').toLowerCase();
        if (k && !seenNR.has(k)) { seenNR.add(k); newReleaseBooks.push(b); }
      });
    });

    trendingBooks.sort(function (a, b) {
      var ra = scoreRecency(a);
      var rb = scoreRecency(b);
      if (rb !== ra) return rb - ra;
      var ea = isEnglish(a) ? 1 : 0;
      var eb = isEnglish(b) ? 1 : 0;
      if (eb !== ea) return eb - ea;
      var cqa = assessCoverQuality(a.coverUrl);
      var cqb = assessCoverQuality(b.coverUrl);
      if (cqb !== cqa) return cqb - cqa;
      return 0;
    });

    newReleaseBooks.sort(function (a, b) {
      var ya = getYear(a);
      var yb = getYear(b);
      if (yb !== ya) return yb - ya;
      var ea = isEnglish(a) ? 1 : 0;
      var eb = isEnglish(b) ? 1 : 0;
      if (eb !== ea) return eb - ea;
      var cqa = assessCoverQuality(a.coverUrl);
      var cqb = assessCoverQuality(b.coverUrl);
      if (cqb !== cqa) return cqb - cqa;
      return 0;
    });

    if (popularBooks.length) sections.popular = dedupe(popularBooks).slice(0, 24);
    if (trendingBooks.length) sections.trending = dedupe(trendingBooks).slice(0, 30);
    if (newReleaseBooks.length) sections.newReleases = dedupe(newReleaseBooks).slice(0, 30);

    writeCache(cacheKey, sections);
    return sections;
  }

  async function fetchBestSellers() {
    var currentYear = new Date().getFullYear();
    return await fetchPage('bestseller fiction ' + currentYear, 1, 'relevance');
  }

  window.BooksApp = {
    escape: escape,
    fetchPage: fetchPage,
    fetchAllPages: fetchAllPages,
    fetchDiscoverySections: fetchDiscoverySections,
    fetchBestSellers: fetchBestSellers,
    normalizeBook: normalizeBook,
    dedupe: dedupe,
    isContentSafe: isContentSafe,
    assessJunk: assessJunk,
    isEnglish: isEnglish,
    getYear: getYear,
    scoreRecency: scoreRecency,
    scoreSeededBookMatch: scoreSeededBookMatch,
    API_BASE: API_BASE,
    API_PAGE_SIZE: API_PAGE_SIZE,
    FALLBACK_IMAGE: FALLBACK_IMAGE,
    abort: function () { if (activeController) activeController.abort(); }
  };
})();
