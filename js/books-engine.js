/*
 * Zo2y Books Engine v3
 * --------------------
 * Single source of truth for the entire Books experience (desktop + mobile).
 *
 * Responsibilities:
 *   - Search query rewriting (franchise hints, author hints)
 *   - English-first ranking (popular + recognizable first)
 *   - Junk / academic / non-book filtering
 *   - Edition grouping (collapse duplicate editions, pick the best one)
 *   - Cover quality scoring + fallback hierarchy
 *   - Discovery section configuration (Popular, Trending, New Releases, BookTok, etc.)
 *   - API client with request dedup, abort handling, in-memory + localStorage cache
 *   - Card HTML renderer (reuses the standard Zo2y .card markup)
 *   - List status helpers (mirrors movies/tv/games behavior)
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
  var FALLBACK_COVER = '/images/fallback/book.svg';
  var MEMORY_CACHE_TTL_MS = 30 * 60 * 1000;          // 30 min
  var LS_CACHE_PREFIX = 'zo2y_books_v3:';
  var LS_CACHE_TTL_MS = 60 * 60 * 1000;              // 1 hour
  var DISCOVERY_CACHE_KEY = LS_CACHE_PREFIX + 'discover';
  var DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;       // 15 min
  var SEARCH_DEBOUNCE_MS = 220;
  var MAX_FETCH_RETRIES = 2;

  // Default page sizes are computed from grid columns x 3 rows.
  var DEFAULT_DESKTOP_PAGE_SIZE = 18;
  var DEFAULT_MOBILE_PAGE_SIZE = 12;

  // Curated bestseller / classic seed authors and franchises that should ALWAYS appear high.
  // These are used to bias popular/trending results AND to recognize known queries.
  var FRANCHISE_HINTS = [
    { keys: ['harry potter', 'harry potter and'], hint: 'intitle:"Harry Potter" J.K. Rowling' },
    { keys: ['the boys', 'theboys'], hint: 'intitle:"The Boys" Garth Ennis Dynamite' },
    { keys: ['housemaid', 'the housemaid'], hint: 'intitle:"The Housemaid" Freida McFadden' },
    { keys: ['fourth wing', 'iron flame', 'onyx storm'], hint: 'Rebecca Yarros Empyrean' },
    { keys: ['hunger games', 'the hunger games'], hint: 'intitle:"The Hunger Games" Suzanne Collins' },
    { keys: ['percy jackson'], hint: 'intitle:"Percy Jackson" Rick Riordan' },
    { keys: ['mistborn'], hint: 'intitle:"Mistborn" Brandon Sanderson' },
    { keys: ['stormlight'], hint: 'intitle:"Stormlight Archive" Brandon Sanderson' },
    { keys: ['wheel of time'], hint: 'intitle:"Wheel of Time" Robert Jordan' },
    { keys: ['lord of the rings', 'lotr'], hint: 'intitle:"The Lord of the Rings" Tolkien' },
    { keys: ['the hobbit', 'hobbit'], hint: 'intitle:"The Hobbit" Tolkien' },
    { keys: ['game of thrones', 'song of ice and fire'], hint: 'George R. R. Martin "A Song of Ice and Fire"' },
    { keys: ['dune'], hint: 'Frank Herbert Dune novel' },
    { keys: ['foundation'], hint: 'Isaac Asimov Foundation novel' },
    { keys: ['atomic habits'], hint: 'James Clear "Atomic Habits"' },
    { keys: ['the alchemist'], hint: 'Paulo Coelho "The Alchemist"' },
    { keys: ['it ends with us', 'it starts with us'], hint: 'Colleen Hoover novel' },
    { keys: ['project hail mary'], hint: 'Andy Weir "Project Hail Mary"' },
    { keys: ['the martian'], hint: 'Andy Weir "The Martian"' },
    { keys: ['1984'], hint: 'George Orwell 1984 novel' },
    { keys: ['animal farm'], hint: 'George Orwell "Animal Farm"' },
    { keys: ['great gatsby'], hint: 'F. Scott Fitzgerald "The Great Gatsby"' },
    { keys: ['to kill a mockingbird'], hint: 'Harper Lee "To Kill a Mockingbird"' },
    { keys: ['the catcher in the rye'], hint: 'J.D. Salinger "The Catcher in the Rye"' },
    { keys: ['pride and prejudice'], hint: 'Jane Austen "Pride and Prejudice"' },
    { keys: ['brandon sanderson'], hint: 'Brandon Sanderson novel fantasy' },
    { keys: ['stephen king'], hint: 'Stephen King novel' },
    { keys: ['agatha christie'], hint: 'Agatha Christie novel mystery' },
    { keys: ['james patterson'], hint: 'James Patterson novel thriller' },
    { keys: ['john grisham'], hint: 'John Grisham novel thriller' },
    { keys: ['colleen hoover'], hint: 'Colleen Hoover romance novel' },
    { keys: ['sarah j maas', 'sarah j. maas'], hint: 'Sarah J. Maas fantasy novel' },
    { keys: ['rebecca yarros'], hint: 'Rebecca Yarros Empyrean fantasy' },
    { keys: ['freida mcfadden'], hint: 'Freida McFadden thriller novel' },
    { keys: ['emily henry'], hint: 'Emily Henry romance novel' },
    { keys: ['james clear'], hint: 'James Clear self-help "Atomic Habits"' },
    { keys: ['mark manson'], hint: 'Mark Manson self-help' }
  ];

  // High-quality fiction seed set used for discovery sections.
  // These are real, recognizable bestsellers - intentionally English-first.
  var DISCOVERY_SECTIONS = [
    { id: 'popular',     label: 'popular right now',     desc: 'The most-read books across Zo2y this week.',
      endpoint: '/popular',    params: { subject: 'fiction', limit: 24, language: 'en', orderBy: 'relevance' } },
    { id: 'trending',    label: 'trending this week',    desc: 'What everyone is talking about.',
      endpoint: '/popular',    params: { q: 'bestseller fiction', limit: 24, language: 'en', orderBy: 'relevance' } },
    { id: 'new',         label: 'new releases',          desc: 'The latest English-language fiction.',
      endpoint: '/popular',    params: { q: 'new release fiction novel', limit: 24, language: 'en', orderBy: 'newest' } },
    { id: 'fantasy',     label: 'fantasy essentials',    desc: 'From Tolkien to Sanderson and beyond.',
      endpoint: '/popular',    params: { subject: 'fantasy', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'scifi',       label: 'sci-fi essentials',     desc: 'The science fiction every reader should know.',
      endpoint: '/popular',    params: { subject: 'science fiction', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'mystery',     label: 'mystery + thriller',    desc: 'Page-turners that grip you to the last chapter.',
      endpoint: '/popular',    params: { subject: 'mystery thriller', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'romance',     label: 'romance favorites',     desc: 'Beloved romance from contemporary to classic.',
      endpoint: '/popular',    params: { subject: 'romance', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'booktok',     label: 'booktok trending',      desc: 'The titles everyone is reading right now.',
      endpoint: '/popular',    params: { q: 'booktok viral romantasy', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'awards',      label: 'award winners',         desc: 'Pulitzer, Booker, Hugo, Nebula, and more.',
      endpoint: '/popular',    params: { q: 'pulitzer booker winner novel', limit: 18, language: 'en', orderBy: 'relevance' } },
    { id: 'classics',    label: 'modern classics',       desc: 'The titles that defined a generation.',
      endpoint: '/popular',    params: { q: 'modern classic novel', limit: 18, language: 'en', orderBy: 'relevance' } }
  ];

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

  // Junk pattern detection (academic/conference/government/etc.)
  var JUNK_TITLE_PATTERNS = [
    /\b(proceedings|symposium|conference paper|workshop)\b/i,
    /\b(dissertation|thesis|monograph)\b/i,
    /\b(annual report|technical report|white paper|working paper)\b/i,
    /\b(government printing|federal register|congressional|parliamentary)\b/i,
    /\b(scanned|digitized|microfilm|microfiche|reprint)\b/i,
    /\b(bulletin|gazette|newsletter|periodical)\b/i,
    /\b(study guide|workbook|exam prep|test prep|cliffs notes|sparknotes)\b/i,
    /\b(textbook|coursebook|lecture notes|syllabus)\b/i,
    /\b(handbook for|manual for|guide for the|user guide for)\b/i,
    /\b(hearing before|the committee on|joint hearing)\b/i,
    /\b(catalog|catalogue|directory|almanac|index of)\b/i
  ];
  var JUNK_PUBLISHER_PATTERNS = [
    /university press$/i,
    /\b(government printing office|gpo|congressional|hmso)\b/i,
    /\b(elsevier|springer|wiley|taylor & francis|sage publications|emerald)\b/i,
    /\b(ieee|acm|nasa|noaa|usda|cdc)\b/i
  ];
  var JUNK_SUBJECT_PATTERNS = [
    /\b(juvenile nonfiction)\b/i,
    /\b(law reports|legislative|legal documents)\b/i,
    /\b(periodicals)\b/i,
    /\b(scientific reports|technical reports)\b/i
  ];
  var EXPLICIT_PATTERNS = [
    /\b(erotica|pornographic|sexually explicit|adult content only|hardcore sex)\b/i
  ];

  // Latin-script language hint (we accept titles whose authors / metadata indicate English).
  // Aggressive penalty applied to obvious foreign-language results.
  var NON_LATIN_TITLE = /[\u3040-\u30ff\u4e00-\u9fff\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\uac00-\ud7af]/;
  var FOREIGN_TITLE_TOKENS = [
    /\b(et|le|la|les|de|du|des|aux|ist|der|die|das|und|en|el|los|las|une|que|qui)\b/i
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
  function toHttps(value) {
    return String(value || '').replace(/^http:\/\//i, 'https://').trim();
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function normalizeText(value) {
    return String(value || '')
      .trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
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

  // ============================================================
  // QUERY REWRITER  -  push popular intent toward known answers
  // ============================================================
  function rewriteQuery(raw) {
    var clean = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!clean) return '';
    var lower = clean.toLowerCase();
    for (var i = 0; i < FRANCHISE_HINTS.length; i++) {
      var hint = FRANCHISE_HINTS[i];
      for (var j = 0; j < hint.keys.length; j++) {
        var k = hint.keys[j];
        if (lower === k || lower.indexOf(k) === 0 || (' ' + lower + ' ').indexOf(' ' + k + ' ') !== -1) {
          return hint.hint;
        }
      }
    }
    return clean;
  }

  // ============================================================
  // JUNK & SAFE FILTERING
  // ============================================================
  function getBookText(b) {
    return [
      b && b.title, b && b.author, b && b.publisher,
      Array.isArray(b && b.subjects) ? b.subjects.join(' ') : (b && b.subjects),
      b && b.description, b && b.maturityRating
    ].map(function (v) { return String(v || ''); }).join(' ');
  }
  function looksJunk(b) {
    if (!b || !String(b.title || '').trim()) return true;
    var title = String(b.title || '');
    var pub = String(b.publisher || '');
    var subj = Array.isArray(b.subjects) ? b.subjects.join(' ') : String(b.subjects || '');
    var i;
    for (i = 0; i < JUNK_TITLE_PATTERNS.length; i++) if (JUNK_TITLE_PATTERNS[i].test(title)) return true;
    for (i = 0; i < JUNK_PUBLISHER_PATTERNS.length; i++) if (pub && JUNK_PUBLISHER_PATTERNS[i].test(pub)) return true;
    for (i = 0; i < JUNK_SUBJECT_PATTERNS.length; i++) if (subj && JUNK_SUBJECT_PATTERNS[i].test(subj)) return true;
    return false;
  }
  function looksExplicit(b) {
    var maturity = String(b && b.maturityRating || '').toLowerCase();
    if (maturity && maturity !== 'not_mature' && maturity.indexOf('mature') !== -1) return true;
    var text = getBookText(b);
    for (var i = 0; i < EXPLICIT_PATTERNS.length; i++) if (EXPLICIT_PATTERNS[i].test(text)) return true;
    return false;
  }
  function filterSafe(books) {
    return asArray(books).filter(function (b) {
      if (!b) return false;
      if (looksJunk(b)) return false;
      if (looksExplicit(b)) return false;
      return true;
    });
  }

  // ============================================================
  // SCORING - English-first, popularity-first, recognition-first
  // ============================================================
  function scoreEnglishConfidence(b) {
    var score = 0;
    var title = String(b && b.title || '');
    var lang = String(b && b.language || '').toLowerCase();
    if (lang === 'en' || lang === 'eng' || lang === 'english') score += 60;
    else if (lang && lang !== 'en') score -= 80;
    if (NON_LATIN_TITLE.test(title)) score -= 220;
    // Penalize titles that look foreign-language even without an explicit lang tag.
    var foreignHits = 0;
    for (var i = 0; i < FOREIGN_TITLE_TOKENS.length; i++) {
      if (FOREIGN_TITLE_TOKENS[i].test(title)) foreignHits++;
    }
    if (foreignHits >= 2) score -= 60;
    return score;
  }
  function scoreCoverQuality(b) {
    var url = String(b && b.cover || '');
    if (!url) return -40;
    var s = 30;
    if (/zoom=1|zoom=2/i.test(url)) s += 8;
    if (/(books\.google|googleusercontent)/i.test(url)) s += 20;
    if (/openlibrary\.org\/b\//i.test(url)) s += 8;
    if (/(default|placeholder|no[-_]?image)/i.test(url)) s -= 60;
    if (/-S\.jpg|_THUMB|=w64/i.test(url)) s -= 18;
    if (/(=w300|=w400|=w600|=w800|w=720|w=800)/i.test(url)) s += 14;
    return s;
  }
  function scoreMetadataCompleteness(b) {
    var s = 0;
    if (b && String(b.author || '').trim() && b.author !== 'Unknown author') s += 20;
    if (b && b.year && Number(b.year) > 1700) s += 10;
    if (b && Array.isArray(b.subjects) && b.subjects.length) s += 6;
    if (b && String(b.publisher || '').trim()) s += 4;
    if (b && String(b.description || '').trim().length > 80) s += 6;
    return s;
  }
  function scorePopularitySignals(b) {
    var s = 0;
    var ratingCount = Number(b && b.ratingCount || 0);
    var rating = Number(b && b.rating || 0);
    if (ratingCount >= 1000) s += 40;
    else if (ratingCount >= 100) s += 20;
    else if (ratingCount >= 10) s += 8;
    if (rating >= 4.2) s += 18;
    else if (rating >= 4) s += 10;
    else if (rating >= 3.5) s += 4;
    // Recency boost - recent releases trend higher.
    var year = Number(b && b.year || 0);
    if (year >= 2024) s += 14;
    else if (year >= 2020) s += 10;
    else if (year >= 2015) s += 5;
    else if (year && year < 1900) s -= 8; // very old scans often look like junk
    return s;
  }
  function scoreQueryRelevance(b, query) {
    if (!query) return 0;
    var q = normalizeText(query);
    if (!q) return 0;
    var t = normalizeText(b && b.title || '');
    var a = normalizeText(b && b.author || '');
    var s = 0;
    if (t === q) s += 120;
    else if (t.indexOf(q) === 0) s += 80;
    else if (t.indexOf(q) !== -1) s += 50;
    if (a && q.indexOf(a) !== -1) s += 30;
    if (a && a.indexOf(q) !== -1) s += 20;
    // Penalize titles that are absurdly long compared to the query (likely a chapter or compilation).
    if (t.length > q.length * 4 + 20) s -= 14;
    return s;
  }
  function scoreBook(b, opts) {
    opts = opts || {};
    return scoreEnglishConfidence(b)
      + scoreCoverQuality(b)
      + scoreMetadataCompleteness(b)
      + scorePopularitySignals(b)
      + scoreQueryRelevance(b, opts.query)
      + (opts.seedScore || 0);
  }
  function rankBooks(books, opts) {
    return asArray(books).slice().sort(function (a, b) {
      return scoreBook(b, opts) - scoreBook(a, opts);
    });
  }

  // ============================================================
  // EDITION GROUPING - collapse duplicate editions, keep the best
  // ============================================================
  function editionKey(b) {
    var t = normalizeText(b && b.title || '')
      .replace(/\b(illustrated|deluxe|special|collector(?:'s)?|anniversary|box(?:ed)? set|complete|definitive|annotated|abridged|unabridged|revised|updated|edition|vol(?:ume)?\s*\d+|book\s*\d+|part\s*\d+)\b/g, ' ')
      .replace(/[:|-].*$/, '') // drop subtitle after first colon/dash
      .replace(/\s+/g, ' ').trim();
    var a = normalizeText(b && b.author || '').split(' ').slice(0, 3).join(' ');
    if (!t) return '';
    return t + '::' + a;
  }
  function groupEditions(books, opts) {
    opts = opts || {};
    var query = opts.query || '';
    var groups = new Map();
    asArray(books).forEach(function (b) {
      var k = editionKey(b);
      if (!k) return;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(b);
    });
    var out = [];
    groups.forEach(function (members) {
      // Sort members by score and keep the top one.
      members.sort(function (a, b) { return scoreBook(b, { query: query }) - scoreBook(a, { query: query }); });
      var best = members[0];
      if (members.length > 1) best._editionCount = members.length;
      out.push(best);
    });
    return out;
  }

  // ============================================================
  // NORMALIZATION
  // ============================================================
  function normalizeApiBook(raw) {
    if (!raw) return null;
    var title = String(raw.title || '').trim();
    if (!title) return null;
    var id = String(raw.id || raw._googleVolumeId || '').trim();
    if (!id) {
      var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
      id = 'book-' + slug + '-' + Math.floor(Math.random() * 1e6);
    }
    var author = '';
    if (Array.isArray(raw.author_name) && raw.author_name.length) author = String(raw.author_name[0] || '').trim();
    else if (raw.author) author = String(raw.author).trim();
    else if (raw.authors) author = String(raw.authors).trim();
    if (!author) author = 'Unknown author';
    var year = Number(raw.year || raw.first_publish_year || raw.published_year || 0) || null;
    var cover = toHttps(raw.cover || raw.coverImage || raw.thumbnail || raw._googleThumbnail || '');
    var subjects = Array.isArray(raw.subject) ? raw.subject.slice(0, 12)
                : Array.isArray(raw.subjects) ? raw.subjects.slice(0, 12)
                : [];
    var publisher = '';
    if (Array.isArray(raw.publisher)) publisher = String(raw.publisher[0] || '').trim();
    else if (raw.publisher) publisher = String(raw.publisher).trim();
    // Preserve ISBN list (server already strips non-digits) so we can build
    // OpenLibrary cover fallback URLs when the Google Books cover fails to load.
    var isbnList = [];
    if (Array.isArray(raw.isbn)) {
      isbnList = raw.isbn.map(function (entry) { return String(entry || '').replace(/[^0-9Xx]/g, ''); }).filter(Boolean);
    } else if (raw.isbn) {
      var clean = String(raw.isbn).replace(/[^0-9Xx]/g, '');
      if (clean) isbnList = [clean];
    }
    var coverId = Number(raw.cover_i || raw.coverId || 0) || 0;
    return {
      id: id,
      title: title,
      author: author,
      year: year,
      cover: cover,
      subjects: subjects,
      publisher: publisher,
      description: String(raw.description || '').trim(),
      language: String(raw.language || raw._language || '').toLowerCase(),
      source: String(raw.source || raw._source || 'google-books').trim(),
      rating: Number(raw.rating || raw.averageRating || 0) || 0,
      ratingCount: Number(raw.ratingCount || raw.ratingsCount || 0) || 0,
      maturityRating: String(raw.maturityRating || '').trim(),
      isbn: isbnList,
      cover_i: coverId > 0 ? coverId : null
    };
  }
  function normalizeApiBooks(arr) {
    return asArray(arr).map(normalizeApiBook).filter(Boolean);
  }

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
    version: '3.0.0',
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

    // Query / scoring
    rewriteQuery: rewriteQuery,
    scoreBook: scoreBook,
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
