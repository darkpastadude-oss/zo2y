/*
 * Zo2y Books Engine v4
 * --------------------
 * Client-side books engine that uses the shared data layer.
 *
 * Responsibilities:
 *   - API client with request dedup, abort handling, in-memory + localStorage cache
 *   - Card HTML renderer (reuses the standard Zo2y .card markup)
 *   - List status helpers (mirrors movies/tv/games behavior)
 *   - UI-specific helpers (grid sizing, skeleton loaders)
 *
 * Note: Core data logic (search, ranking, filtering, edition grouping) is now in
 * the shared data layer (books-data-layer.js) to ensure consistency between
 * server and client.
 *
 * Exposes a single global namespace: window.Zo2yBooks
 */
(function () {
  'use strict';
  if (window.Zo2yBooks && window.Zo2yBooks.__sealed) return;

  // ============================================================
  // CONSTANTS
  // ============================================================
  var API_BASE = '/api/books';
  var MEMORY_CACHE_TTL_MS = 30 * 60 * 1000;          // 30 min
  var LS_CACHE_PREFIX = 'zo2y_books_v4:';
  var LS_CACHE_TTL_MS = 60 * 60 * 1000;              // 1 hour
  var DISCOVERY_CACHE_KEY = LS_CACHE_PREFIX + 'discover';
  var DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;       // 15 min
  var SEARCH_DEBOUNCE_MS = 220;
  var MAX_FETCH_RETRIES = 2;

  // Default page sizes are computed from grid columns x 3 rows.
  var DEFAULT_DESKTOP_PAGE_SIZE = 18;
  var DEFAULT_MOBILE_PAGE_SIZE = 12;

  // Get shared data layer functions
  var DataLayer = window.Zo2yBooksDataLayer;
  if (!DataLayer) {
    console.error('Shared books data layer not loaded. Books engine will not work.');
    return;
  }

  var FALLBACK_COVER = DataLayer.DEFAULT_BOOK_COVER;
  var DISCOVERY_SECTIONS = DataLayer.DISCOVERY_SECTIONS.map(function (sec) {
    return {
      id: sec.id,
      label: sec.label,
      desc: sec.desc,
      endpoint: '/popular',
      params: {
        q: sec.query || (sec.subject ? 'popular ' + sec.subject + ' books' : 'bestseller fiction'),
        subject: sec.subject || '',
        limit: sec.limit || 18,
        language: 'en',
        orderBy: sec.orderBy || 'relevance'
      }
    };
  });

  // Genre chips shown above the grid (mapped to subject queries).
  var GENRE_CHIPS = [
    { id: '',                value: '',                    label: 'All' },
    { id: 'fiction',         value: 'fiction',             label: 'Fiction' },
    { id: 'fantasy',         value: 'fantasy',             label: 'Fantasy' },
    { id: 'science-fiction', value: 'science fiction',     label: 'Sci-Fi' },
    { id: 'mystery',         value: 'mystery',             label: 'Mystery' },
    { id: 'thriller',        value: 'thriller',            label: 'Thriller' },
    { id: 'romance',         value: 'romance',             label: 'Romance' },
    { id: 'horror',          value: 'horror',              label: 'Horror' },
    { id: 'young-adult',     value: 'young adult',         label: 'YA' },
    { id: 'biography',       value: 'biography',           label: 'Biography' },
    { id: 'history',         value: 'history',             label: 'History' },
    { id: 'self-help',       value: 'self-help',           label: 'Self-Help' },
    { id: 'business',        value: 'business',            label: 'Business' }
  ];

  // ============================================================
  // SHARED UTILITY HELPERS
  // ============================================================
  function isString(v) { return typeof v === 'string'; }
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function clampInt(v, min, max, fallback) {
    var n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function shuffle(arr) {
    var a = (arr || []).slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(obj, defaults) {
    var out = {};
    if (defaults && typeof defaults === 'object') {
      Object.keys(defaults).forEach(function (k) { out[k] = defaults[k]; });
    }
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(function (k) {
        if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
      });
    }
    return out;
  }

  // Use shared data layer functions
  var normalizeText = DataLayer.normalizeText;
  var rewriteQuery = DataLayer.rewriteSearchQuery;
  var filterSafe = function (books) {
    return asArray(books).filter(function (doc) {
      return !DataLayer.isJunkBookDoc(doc, { strict: true });
    });
  };
  var rankBooks = function (books, opts) {
    return DataLayer.rankDocs(books, opts);
  };
  var groupEditions = function (books, opts) {
    return DataLayer.groupBestEditions(books, opts);
  };
  var normalizeApiBooks = function (arr) {
    return asArray(arr).map(DataLayer.normalizeBook).filter(Boolean);
  };

  // ============================================================
  // CACHE LAYER (in-memory + localStorage)
  // ============================================================
  var memoryCache = new Map();
  function nowMs() { return Date.now(); }
  function cacheGet(key, ttlMs) {
    var hit = memoryCache.get(key);
    if (hit && (nowMs() - hit.t) < ttlMs) return hit.v;
    try {
      var raw = localStorage.getItem(LS_CACHE_PREFIX + key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if ((nowMs() - Number(parsed.t || 0)) > ttlMs) {
        try { localStorage.removeItem(LS_CACHE_PREFIX + key); } catch (_) {}
        return null;
      }
      memoryCache.set(key, { v: parsed.v, t: parsed.t });
      return parsed.v;
    } catch (_) { return null; }
  }
  function cacheSet(key, value) {
    var entry = { v: value, t: nowMs() };
    memoryCache.set(key, entry);
    try {
      var payload = JSON.stringify(entry);
      // Don't try to write extremely large payloads to localStorage (some browsers cap at 5MB total).
      if (payload.length < 600000) localStorage.setItem(LS_CACHE_PREFIX + key, payload);
    } catch (_) { /* quota or disabled */ }
  }

  // ============================================================
  // API CLIENT (with request dedup + abort)
  // ============================================================
  var inflight = new Map();
  function buildUrl(path, params) {
    var url = API_BASE + path;
    var sp = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === '') return;
      sp.set(k, String(v));
    });
    var qs = sp.toString();
    return qs ? url + '?' + qs : url;
  }
  function apiFetch(path, params, opts) {
    opts = opts || {};
    var url = buildUrl(path, params);
    var dedupKey = (opts.dedupKey || url);
    if (inflight.has(dedupKey)) return inflight.get(dedupKey);
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, opts.timeoutMs || 11000);
    var attempt = 0;
    function runOnce() {
      attempt++;
      return fetch(url, {
        headers: { Accept: 'application/json' },
        signal: opts.signal || controller.signal,
        cache: 'default'
      }).then(function (res) {
        if (!res.ok) {
          if (res.status >= 500 && attempt <= MAX_FETCH_RETRIES) {
            return new Promise(function (r) { setTimeout(r, 220 * attempt); }).then(runOnce);
          }
          throw new Error('Books API ' + res.status);
        }
        return res.json();
      });
    }
    var promise = runOnce()
      .then(function (json) { return json; })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return null;
        throw err;
      })
      .finally(function () { clearTimeout(timeoutId); inflight.delete(dedupKey); });
    inflight.set(dedupKey, promise);
    return promise;
  }
  function abortAll() {
    inflight.forEach(function (_, key) { /* nothing - fetches abort on their own controllers */ });
    inflight.clear();
  }

  // ============================================================
  // PUBLIC: SEARCH
  // ============================================================
  function search(query, opts) {
    opts = opts || {};
    var limit = clampInt(opts.limit, 1, 40, 40);
    var page = clampInt(opts.page, 1, 200, 1);
    var rewritten = rewriteQuery(query);
    var key = 'search:' + normalizeText(query) + ':' + page + ':' + limit + ':' + (opts.subject || '') + ':' + (opts.orderBy || '');
    var cached = cacheGet(key, MEMORY_CACHE_TTL_MS);
    if (cached) return Promise.resolve(cached);
    var params = {
      q: rewritten, limit: limit, page: page,
      language: opts.language || 'en',
      orderBy: opts.orderBy || 'relevance'
    };
    if (opts.subject) params.subject = opts.subject;
    if (opts.year_from) params.year_from = opts.year_from;
    if (opts.year_to) params.year_to = opts.year_to;
    return apiFetch('/search', params, { dedupKey: 'search:' + key }).then(function (json) {
      var raw = json && json.books ? json.books : [];
      var books = filterSafe(normalizeApiBooks(raw));
      var ranked = rankBooks(books, { query: query });
      var grouped = groupEditions(ranked, { query: query });
      var result = { books: grouped, numFound: Number(json && json.meta && json.meta.numFound) || grouped.length };
      cacheSet(key, result);
      return result;
    }).catch(function () {
      return { books: [], numFound: 0 };
    });
  }

  // ============================================================
  // PUBLIC: SECTION FETCHER (popular / trending / new releases / etc.)
  // ============================================================
  function fetchSection(section, opts) {
    opts = opts || {};
    var params = pick(opts.params || {}, section.params || {});
    if (opts.page) params.page = opts.page;
    var key = 'section:' + section.id + ':' + (params.page || 1) + ':' + (params.subject || '') + ':' + (params.q || '');
    var cached = cacheGet(key, MEMORY_CACHE_TTL_MS);
    if (cached) return Promise.resolve(cached);
    return apiFetch(section.endpoint || '/popular', params, { dedupKey: 'sect:' + key })
      .then(function (json) {
        var raw = json && json.books ? json.books : [];
        var books = filterSafe(normalizeApiBooks(raw));
        var ranked = rankBooks(books, {});
        var grouped = groupEditions(ranked, {});
        var result = { id: section.id, label: section.label, desc: section.desc, books: grouped };
        cacheSet(key, result);
        return result;
      })
      .catch(function () {
        return { id: section.id, label: section.label, desc: section.desc, books: [] };
      });
  }

  // ============================================================
  // PUBLIC: DISCOVERY (parallel fetch of all sections)
  // ============================================================
  function fetchDiscovery(opts) {
    opts = opts || {};
    var cached = cacheGet('discover:all', DISCOVERY_CACHE_TTL_MS);
    if (cached && !opts.force) return Promise.resolve(cached);
    return Promise.all(DISCOVERY_SECTIONS.map(function (s) { return fetchSection(s); }))
      .then(function (sections) {
        var result = { sections: sections.filter(function (s) { return s && s.books && s.books.length; }) };
        cacheSet('discover:all', result);
        return result;
      });
  }

  // ============================================================
  // PUBLIC: PAGINATED FLAT VIEW (when user selects a section/genre)
  // ============================================================
  function fetchFlat(opts) {
    opts = opts || {};
    var sectionId = opts.section || 'popular';
    var section = DISCOVERY_SECTIONS.find(function (s) { return s.id === sectionId; }) || DISCOVERY_SECTIONS[0];
    var page = clampInt(opts.page, 1, 1000, 1);
    var params = pick({}, section.params);
    params.page = page;
    if (opts.subject) params.subject = opts.subject;
    if (opts.orderBy) params.orderBy = opts.orderBy;
    if (opts.q) params.q = opts.q;
    var key = 'flat:' + sectionId + ':' + page + ':' + (opts.subject || '') + ':' + (opts.orderBy || '');
    var cached = cacheGet(key, MEMORY_CACHE_TTL_MS);
    if (cached) return Promise.resolve(cached);
    return apiFetch(section.endpoint || '/popular', params, { dedupKey: 'flat:' + key })
      .then(function (json) {
        var raw = json && json.books ? json.books : [];
        var books = filterSafe(normalizeApiBooks(raw));
        var ranked = rankBooks(books, {});
        var grouped = groupEditions(ranked, {});
        var result = { books: grouped, page: page };
        cacheSet(key, result);
        return result;
      })
      .catch(function () { return { books: [], page: page }; });
  }

  // ============================================================
  // RENDER HELPERS - reuse the Zo2y .card markup verbatim
  // ============================================================
  function buildOpenLibraryFallbackChain(book) {
    var chain = [];
    var current = String(book && book.cover || '').trim();
    var isbnList = Array.isArray(book && book.isbn) ? book.isbn : [];
    isbnList.forEach(function (entry) {
      var clean = String(entry || '').replace(/[^0-9Xx]/g, '');
      if (!clean) return;
      chain.push('https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(clean) + '-L.jpg');
      chain.push('https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(clean) + '-M.jpg');
    });
    var coverId = Number(book && book.cover_i || 0) || 0;
    if (coverId > 0) {
      chain.push('https://covers.openlibrary.org/b/id/' + encodeURIComponent(String(coverId)) + '-L.jpg');
      chain.push('https://covers.openlibrary.org/b/id/' + encodeURIComponent(String(coverId)) + '-M.jpg');
    }
    var seen = {};
    return chain.filter(function (url) {
      if (!url || url === current || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }

  function cardHtml(book) {
    var coverUrl = book.cover && book.cover.trim() ? book.cover : FALLBACK_COVER;
    var year = book.year ? String(book.year) : '';
    var author = book.author || 'Unknown author';
    var editionsBadge = '';
    if (book._editionCount && book._editionCount > 1) {
      editionsBadge = '<span class="card-edition-badge">' + (book._editionCount) + ' editions</span>';
    }
    var hasRealCover = !!book.cover;
    var olChain = buildOpenLibraryFallbackChain(book);
    // The chain JSON is single-quoted-attribute safe (no unescaped single quotes in URLs).
    var chainAttr = olChain.length
      ? ' data-fallback-chain=\'' + escapeHtml(JSON.stringify(olChain)) + '\''
      : '';
    var finalFallbackAttr = ' data-final-fallback="' + escapeHtml(FALLBACK_COVER) + '"'
      + ' data-final-action="replace-parent"'
      + ' data-final-html="' + escapeHtml('<div class="card-media-fallback"><i class="fa-solid fa-book"></i></div>') + '"';
    var mediaInner = hasRealCover
      ? '<img src="' + escapeHtml(coverUrl) + '" alt="' + escapeHtml(book.title) + '" loading="lazy"'
        + chainAttr + finalFallbackAttr + '>'
      : '<div class="card-media-fallback"><i class="fa-solid fa-book"></i></div>';
    return ''
      + '<article class="card" data-id="' + escapeHtml(book.id) + '" data-title="' + escapeHtml(book.title) + '" data-author="' + escapeHtml(author) + '">'
      +   '<div class="card-media cover">'
      +     mediaInner
      +     editionsBadge
      +   '</div>'
      +   '<div class="card-meta">'
      +     '<span class="card-type"><i class="fa-solid fa-book"></i> Book</span>'
      +     '<div class="card-meta-top"><p class="card-title">' + escapeHtml(book.title) + '</p></div>'
      +     '<p class="card-sub">' + escapeHtml(author) + '</p>'
      +     '<p class="card-extra">' + escapeHtml(year) + '</p>'
      +     '<div class="card-actions">'
      +       '<button class="icon-btn menu-btn" type="button" aria-label="Open list menu"><i class="fas fa-ellipsis-v"></i></button>'
      +     '</div>'
      +   '</div>'
      + '</article>';
  }
  function renderGrid(target, books) {
    var grid = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!grid) return;
    if (!books || !books.length) {
      grid.innerHTML = '<div class="empty">No books found.</div>';
      return;
    }
    var html = books.map(cardHtml).join('');
    grid.innerHTML = html;
  }
  function renderSection(section, opts) {
    opts = opts || {};
    if (!section || !section.books || !section.books.length) return '';
    var books = section.books.slice(0, opts.limit || section.books.length);
    return ''
      + '<section class="section book-section" data-section="' + escapeHtml(section.id) + '">'
      +   '<div class="section-head">'
      +     '<div class="section-head-text">'
      +       '<h2>' + escapeHtml(section.label || '') + '</h2>'
      +       '<p>' + escapeHtml(section.desc || '') + '</p>'
      +     '</div>'
      +     (opts.showMore !== false
        ? '<button class="section-more-btn" type="button" data-more-section="' + escapeHtml(section.id) + '">See all <i class="fas fa-chevron-right"></i></button>'
        : '')
      +   '</div>'
      +   '<div class="grid book-grid">' + books.map(cardHtml).join('') + '</div>'
      + '</section>';
  }
  function skeletonSectionsHtml(count) {
    var n = Math.max(1, Number(count || 3));
    var cards = '';
    for (var i = 0; i < 12; i++) {
      cards += '<article class="card book-skeleton-card"><div class="card-media skeleton-shimmer"></div>'
            + '<div class="card-meta">'
            + '<span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>'
            + '<span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>'
            + '<span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>'
            + '</div></article>';
    }
    var sections = '';
    for (var s = 0; s < n; s++) {
      sections += '<section class="section book-section book-section-skeleton">'
        + '<div class="section-head"><div class="section-head-text">'
        + '<span class="skeleton-line skeleton-line-lg skeleton-shimmer"></span>'
        + '<span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>'
        + '</div></div>'
        + '<div class="grid book-grid">' + cards + '</div>'
        + '</section>';
    }
    return sections;
  }

  // ============================================================
  // GRID PAGE-SIZE HELPER (mirrors movies/tv pattern)
  // ============================================================
  function computeGridPageSize(gridSelector, rowsHint) {
    var grid = (typeof gridSelector === 'string') ? document.querySelector(gridSelector) : gridSelector;
    if (!grid) return DEFAULT_DESKTOP_PAGE_SIZE;
    try {
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      var rows = Number(rowsHint || 3) || 3;
      var sz = cols * rows;
      if (sz < 6) sz = DEFAULT_MOBILE_PAGE_SIZE;
      if (sz > 60) sz = 60;
      return sz;
    } catch (_) { return DEFAULT_DESKTOP_PAGE_SIZE; }
  }

  // ============================================================
  // PUBLIC SURFACE
  // ============================================================
  var Zo2yBooks = {
    __sealed: true,
    version: '4.0.0',
    FALLBACK_COVER: FALLBACK_COVER,
    DISCOVERY_SECTIONS: DISCOVERY_SECTIONS,
    GENRE_CHIPS: GENRE_CHIPS,
    SEARCH_DEBOUNCE_MS: SEARCH_DEBOUNCE_MS,

    // Utilities
    escapeHtml: escapeHtml,
    normalizeText: normalizeText,
    clampInt: clampInt,
    shuffle: shuffle,
    computeGridPageSize: computeGridPageSize,

    // Query / scoring (from shared data layer)
    rewriteQuery: rewriteQuery,
    rankBooks: rankBooks,
    groupEditions: groupEditions,
    filterSafe: filterSafe,

    // Fetchers
    search: search,
    fetchSection: fetchSection,
    fetchDiscovery: fetchDiscovery,
    fetchFlat: fetchFlat,
    abortAll: abortAll,

    // Renderers
    cardHtml: cardHtml,
    renderGrid: renderGrid,
    renderSection: renderSection,
    skeletonSectionsHtml: skeletonSectionsHtml,

    // Cache
    _cacheGet: cacheGet,
    _cacheSet: cacheSet
  };

  // Keep the old global identifier alive for any legacy callers.
  window.Zo2yBooks = Zo2yBooks;
  window.__zo2yBooksEngine = Zo2yBooks;
})();
