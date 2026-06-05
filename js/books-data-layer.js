/**
 * Zo2y Books Data Layer - Shared data layer for books
 * 
 * This is the single source of truth for all books data operations.
 * Used by both server-side (books-handler.js) and client-side (books-engine.js).
 * 
 * Features:
 * - Search with ranking engine
 * - English-first filtering
 * - Junk/academic content filtering
 * - Edition grouping
 * - Cover enrichment
 * - Discovery sections
 * - Caching
 * - Pagination
 */

// ============================================================
// CONSTANTS
// ============================================================

var GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
var OPEN_LIBRARY_BASE = 'https://openlibrary.org';
var DEFAULT_BOOK_COVER = '/images/fallback/book.svg';

// Junk filtering patterns
var JUNK_TITLE_PATTERNS = [
  /\b(proceedings|symposium|conference paper|workshop)\b/i,
  /\b(dissertation|thesis|monograph)\b/i,
  /\b(annual report|technical report|white paper|working paper)\b/i,
  /\b(government printing|federal register|congressional|parliamentary)\b/i,
  /\b(scanned|digitized|microfilm|microfiche|reprint)\b/i,
  /\b(bulletin|gazette|newsletter|periodical)\b/i,
  /\b(study guide|workbook|exam prep|test prep|cliffs notes|sparknotes)\b/i,
  /\b(textbook|coursebook|lecture notes|syllabus)\b/i,
  /\b(hearing before|the committee on|joint hearing)\b/i,
  /\b(catalog|catalogue|directory|almanac|index of)\b/i
];

var JUNK_PUBLISHER_PATTERNS = [
  /\b(government printing office|gpo)\b/i,
  /\b(ieee|acm|springer|elsevier|wiley)\s+(proceedings|symposium)\b/i
];

var EXPLICIT_TEXT_PATTERNS = [
  /\b(porn|erotica|adult content)\b/i
];

// Non-Lin title detection for language filtering
var NON_LATIN_TITLE = /[\u4e00-\u9fff\u0400-\u04FF\u0E00-\u0E7F\u3040-\u309F\u30A0-\u30FF]/;

// Franchise hints for search query rewriting
var FRANCHISE_HINTS = [
  { keys: ["harry potter"],          hint: 'intitle:"Harry Potter" J.K. Rowling' },
  { keys: ["the boys"],              hint: 'intitle:"The Boys" Garth Ennis Dynamite' },
  { keys: ["housemaid"],             hint: 'intitle:"The Housemaid" Freida McFadden' },
  { keys: ["fourth wing"],           hint: '"Fourth Wing" Rebecca Yarros' },
  { keys: ["iron flame"],            hint: '"Iron Flame" Rebecca Yarros' },
  { keys: ["onyx storm"],            hint: '"Onyx Storm" Rebecca Yarros' },
  { keys: ["hunger games"],          hint: 'intitle:"The Hunger Games" Suzanne Collins' },
  { keys: ["percy jackson"],         hint: 'intitle:"Percy Jackson" Rick Riordan' },
  { keys: ["mistborn"],              hint: 'intitle:"Mistborn" Brandon Sanderson' },
  { keys: ["stormlight"],            hint: 'intitle:"Stormlight" Brandon Sanderson' },
  { keys: ["wheel of time"],         hint: 'intitle:"Wheel of Time" Robert Jordan' },
  { keys: ["lord of the rings"],     hint: 'intitle:"The Lord of the Rings" Tolkien' },
  { keys: ["the hobbit"],            hint: 'intitle:"The Hobbit" Tolkien' },
  { keys: ["game of thrones"],       hint: 'George R. R. Martin "A Song of Ice and Fire"' },
  { keys: ["dune"],                  hint: 'Frank Herbert Dune novel' },
  { keys: ["atomic habits"],         hint: 'James Clear "Atomic Habits"' },
  { keys: ["it ends with us"],       hint: 'Colleen Hoover "It Ends with Us"' },
  { keys: ["it starts with us"],     hint: 'Colleen Hoover "It Starts with Us"' },
  { keys: ["project hail mary"],     hint: 'Andy Weir "Project Hail Mary"' },
  { keys: ["the martian"],           hint: 'Andy Weir "The Martian"' },
  { keys: ["1984"],                  hint: 'George Orwell 1984 novel' },
  { keys: ["great gatsby"],          hint: 'F. Scott Fitzgerald "The Great Gatsby"' },
  { keys: ["pride and prejudice"],   hint: 'Jane Austen "Pride and Prejudice"' },
  { keys: ["brandon sanderson"],     hint: "Brandon Sanderson novel fantasy" },
  { keys: ["stephen king"],          hint: "Stephen King novel" },
  { keys: ["james patterson"],       hint: "James Patterson thriller novel" },
  { keys: ["john grisham"],          hint: "John Grisham thriller novel" },
  { keys: ["colleen hoover"],        hint: "Colleen Hoover romance novel" },
  { keys: ["sarah j. maas"],         hint: "Sarah J. Maas fantasy novel" },
  { keys: ["sarah j maas"],          hint: "Sarah J. Maas fantasy novel" },
  { keys: ["rebecca yarros"],        hint: "Rebecca Yarros Empyrean fantasy" },
  { keys: ["freida mcfadden"],       hint: "Freida McFadden thriller novel" },
  { keys: ["emily henry"],           hint: "Emily Henry romance novel" }
];

// Discovery sections
var DISCOVERY_SECTIONS = [
  { id: "popular",     label: "popular right now",
    desc: "The most-read books across Zo2y this week.",
    query: "bestseller fiction novel",     subject: "fiction", orderBy: "relevance", limit: 20 },
  { id: "trending",    label: "trending this week",
    desc: "What everyone is talking about.",
    query: "trending fiction novel 2026",  subject: "fiction", orderBy: "relevance", limit: 20 },
  { id: "new",         label: "new releases",
    desc: "The latest English-language fiction.",
    query: "new release fiction novel 2026", orderBy: "newest", limit: 20 },
  { id: "fantasy",     label: "fantasy essentials",
    desc: "From Tolkien to Sanderson and beyond.",
    subject: "fantasy",          orderBy: "relevance", limit: 16 },
  { id: "scifi",       label: "sci-fi essentials",
    desc: "The science fiction every reader should know.",
    subject: "science fiction",  orderBy: "relevance", limit: 16 },
  { id: "mystery",     label: "mystery essentials",
    desc: "Compelling mysteries and detective stories.",
    subject: "mystery",          orderBy: "relevance", limit: 16 },
  { id: "thriller",    label: "thriller favorites",
    desc: "Gripping thrillers that will keep you up all night.",
    subject: "thriller",         orderBy: "relevance", limit: 16 },
  { id: "romance",     label: "romance favorites",
    desc: "Beloved romance from contemporary to classic.",
    subject: "romance",          orderBy: "relevance", limit: 16 },
  { id: "booktok",     label: "booktok trending",
    desc: "The titles everyone is reading right now.",
    query: "booktok viral romantasy contemporary", orderBy: "relevance", limit: 16 },
  { id: "awards",      label: "award winners",
    desc: "Pulitzer, Booker, Hugo, Nebula, and more.",
    query: "pulitzer booker winner novel",  orderBy: "relevance", limit: 16 },
  { id: "classics",    label: "modern classics",
    desc: "The titles that defined a generation.",
    query: "modern classic novel 20th century", orderBy: "relevance", limit: 16 },
  { id: "editors",     label: "editor's picks",
    desc: "Hand-picked favorites from our editorial team.",
    query: "acclaimed literary fiction contemporary", orderBy: "relevance", limit: 16 }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function toHttpsUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  return str.replace(/^http:/i, 'https:');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function clampInt(value, min, max, defaultValue) {
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}

// ============================================================
// SEARCH QUERY REWRITING
// ============================================================

function rewriteSearchQuery(raw) {
  const clean = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const lower = clean.toLowerCase();
  for (const hint of FRANCHISE_HINTS) {
    for (const k of hint.keys) {
      if (lower === k || lower.startsWith(k) || lower.includes(k)) return hint.hint;
    }
  }
  return clean;
}

// ============================================================
// GOOGLE BOOKS API
// ============================================================

function buildGoogleQuery(params = {}) {
  const qRaw = rewriteSearchQuery(params.q);
  const title = String(params.title || '').trim();
  const author = String(params.author || '').trim();
  const subject = String(params.subject || '').trim();
  const yearFrom = String(params.year_from || '').trim();
  const yearTo = String(params.year_to || '').trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title) chunks.push(`intitle:"${title}"`);
  if (author) chunks.push(`inauthor:"${author}"`);
  if (subject) chunks.push(`subject:${subject}`);
  if (yearFrom && yearTo) chunks.push(`publishedDate:${yearFrom}-${yearTo}`);
  else if (yearFrom) chunks.push(`publishedDate:>=${yearFrom}`);
  else if (yearTo) chunks.push(`publishedDate:<=${yearTo}`);
  return chunks.join(' ').trim();
}

async function fetchGoogleDocs(params = {}, apiKey = '', signal = null) {
  const query = buildGoogleQuery(params);
  if (!query) return { docs: [], numFound: 0, source: 'google-books' };
  
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);
  const startIndex = clampInt(params.startIndex, 0, 2000, (page - 1) * limit);
  const orderBy = String(params.orderBy || '').trim();
  let lang = String(params.language || params.lang || 'en').trim().toLowerCase();
  if (lang === 'eng') lang = 'en';
  if (lang.length > 2) lang = lang.slice(0, 2);

  const url = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
  url.searchParams.set('q', query);
  url.searchParams.set('printType', 'books');
  if (lang) url.searchParams.set('langRestrict', lang);
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('startIndex', String(Math.max(0, startIndex)));
  if (orderBy === 'newest' || orderBy === 'relevance') url.searchParams.set('orderBy', orderBy);
  if (apiKey) url.searchParams.set('key', apiKey);

  const controller = signal || new AbortController();
  // Optimized timeout: 6s for fast fail, but allow longer for slow connections
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  
  try {
    const res = await fetch(url.toString(), { 
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      // Use default cache mode for browser caching
      cache: 'default'
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return { docs: [], numFound: 0, source: 'google-books' };
    
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    const docs = items.map((entry, idx) => normalizeGoogleBookDoc(entry, idx)).filter(Boolean);
    const totalItems = Number(json?.totalItems || 0);
    
    return {
      docs,
      numFound: Number.isFinite(totalItems) && totalItems > 0 ? totalItems : docs.length,
      source: 'google-books'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return { docs: [], numFound: 0, source: 'google-books' };
  }
}

// Generate prefetch URL for the next page (for performance optimization)
function generatePrefetchUrl(params, apiKey = '') {
  const nextPage = clampInt((params.page || 1) + 1, 1, 1000);
  const prefetchParams = { ...params, page: nextPage };
  const query = buildGoogleQuery(prefetchParams);
  if (!query) return null;
  
  const url = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
  url.searchParams.set('q', query);
  url.searchParams.set('printType', 'books');
  if (prefetchParams.language) url.searchParams.set('langRestrict', prefetchParams.language);
  url.searchParams.set('maxResults', String(prefetchParams.limit || 20));
  url.searchParams.set('startIndex', String((nextPage - 1) * (prefetchParams.limit || 20)));
  if (prefetchParams.orderBy) url.searchParams.set('orderBy', prefetchParams.orderBy);
  if (apiKey) url.searchParams.set('key', apiKey);
  
  return url.toString();
}

function normalizeGoogleBookDoc(volume, idx = 0) {
  const info = volume?.volumeInfo || {};
  const sale = volume?.saleInfo || {};
  const title = String(info?.title || '').trim();
  if (!title) return null;
  
  const subtitle = String(info?.subtitle || '').trim();
  const authorNames = Array.isArray(info?.authors)
    ? info.authors.map((name) => String(name || '').trim()).filter(Boolean)
    : [];
  const published = String(info?.publishedDate || '').trim();
  const yearMatch = published.match(/\d{4}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const categories = Array.isArray(info?.categories)
    ? info.categories.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const publisher = String(info?.publisher || '').trim();
  const language = String(info?.language || '').trim().toLowerCase();
  
  // Prefer the largest image link if Google returned multiple sizes.
  const imageLinks = info?.imageLinks || {};
  const thumbRaw = imageLinks.extraLarge || imageLinks.large || imageLinks.medium ||
                   imageLinks.thumbnail || imageLinks.smallThumbnail || '';
  let thumb = toHttpsUrl(thumbRaw);
  
  // Strip `&edge=curl` and `&zoom=N` and use zoom=2 for better quality covers.
  if (thumb && /books\.google/i.test(thumb)) {
    thumb = thumb.replace(/&edge=curl/i, '').replace(/&zoom=\d/i, '');
    if (!/zoom=/i.test(thumb)) thumb += '&zoom=2';
  }
  
  // Extract ISBN identifiers
  const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn = identifiers
    .map((entry) => String(entry?.identifier || '').replace(/[^0-9Xx]/g, ''))
    .filter(Boolean);
  
  return {
    id: String(volume?.id || '').trim() || null,
    title: subtitle ? title : title,
    subtitle: subtitle,
    author_name: authorNames.length ? authorNames : ['Unknown author'],
    first_publish_year: Number.isFinite(year) ? year : null,
    isbn,
    subject: categories,
    publisher: publisher ? [publisher] : [],
    coverImage: thumb || '',
    description: String(info?.description || '').trim(),
    language: language || '',
    rating: Number(info?.averageRating || 0) || 0,
    ratingCount: Number(info?.ratingsCount || 0) || 0,
    saleability: String(sale?.saleability || '').toLowerCase(),
    maturityRating: String(info?.maturityRating || '').trim(),
    pageCount: Number(info?.pageCount || 0) || 0,
    _googleThumbnail: thumb || '',
    _googleVolumeId: String(volume?.id || '').trim(),
    _source: 'google-books'
  };
}

// ============================================================
// CONTENT TYPE DETECTION
// ============================================================

function detectContentType(doc) {
  const title = String(doc?.title || '');
  const publisher = Array.isArray(doc?.publisher) ? doc.publisher.join(' ') : String(doc?.publisher || '');
  const subjects = Array.isArray(doc?.subject) ? doc.subject.join(' ')
                 : Array.isArray(doc?.subjects) ? doc.subjects.join(' ') : String(doc?.subjects || '');
  const all = [title, publisher, subjects].join(' ');
  
  if (/\b(proceedings|symposium|conference|dissertation|thesis|workshop|colloquium)\b/i.test(all)) return 'academic';
  if (/\b(annual report|technical report|white paper|working paper|hearing before|federal register|congressional|gpo)\b/i.test(all)) return 'report';
  if (/\b(bulletin|gazette|newsletter|periodical|magazine|journal of)\b/i.test(all)) return 'periodical';
  if (/\b(study guide|workbook|exam prep|test prep|cliffs notes|sparknotes|textbook|syllabus)\b/i.test(all)) return 'study-aid';
  if (/\b(catalog|catalogue|directory|almanac|encyclopedia|dictionary)\b/i.test(all)) return 'reference';
  if (/\b(comic|graphic novel)\b/i.test(all)) return 'graphic';
  return 'book';
}

// ============================================================
// JUNK FILTERING
// ============================================================

function getDocText(doc = {}) {
  const parts = [
    doc?.title, doc?.subtitle,
    Array.isArray(doc?.author_name) ? doc.author_name.join(' ') : doc?.author || doc?.authors,
    Array.isArray(doc?.subject) ? doc.subject.join(' ') : doc?.subject,
    Array.isArray(doc?.publisher) ? doc.publisher.join(' ') : doc?.publisher,
    doc?.description, doc?.maturityRating, doc?._source
  ];
  return parts.map((entry) => String(entry || '').trim()).filter(Boolean).join(' ');
}

function isJunkBookDoc(doc = {}, opts = {}) {
  const title = String(doc?.title || '').trim();
  if (!title) return true;
  
  const text = getDocText(doc);
  if (EXPLICIT_TEXT_PATTERNS.some((p) => p.test(text))) return true;
  
  const maturity = String(doc?.maturityRating || '').toLowerCase();
  if (maturity && maturity !== 'not_mature' && maturity.includes('mature')) return true;
  
  for (const p of JUNK_TITLE_PATTERNS) if (p.test(title)) return true;
  
  const pub = Array.isArray(doc?.publisher) ? doc.publisher.join(' ') : String(doc?.publisher || '');
  if (pub) for (const p of JUNK_PUBLISHER_PATTERNS) if (p.test(pub)) return true;
  
  // For discovery (no query): also strip results that don't look like books at all.
  if (opts.strict !== false) {
    const ct = detectContentType(doc);
    if (ct === 'academic' || ct === 'report' || ct === 'periodical' || ct === 'study-aid') return true;
  }
  
  return false;
}

function filterSafeBookDocs(docs = [], opts = {}) {
  return (Array.isArray(docs) ? docs : []).filter((doc) => !isJunkBookDoc(doc, opts));
}

// ============================================================
// SCORING ENGINE
// ============================================================

function scoreCoverQuality(doc) {
  const url = String(doc?.coverImage || doc?._googleThumbnail || '');
  if (!url) return -40;
  let s = 30;
  if (/zoom=1|zoom=2/i.test(url)) s += 8;
  if (/(books\.google|googleusercontent)/i.test(url)) s += 20;
  if (/(default|placeholder|no[-_]?image)/i.test(url)) s -= 60;
  if (/=w64|_THUMB/i.test(url)) s -= 18;
  return s;
}

function scoreEnglishConfidence(doc) {
  let s = 0;
  const title = String(doc?.title || '');
  const lang = String(doc?.language || '').toLowerCase();
  const description = String(doc?.description || '').toLowerCase();
  const haystack = (title + ' ' + description).toLowerCase();

  // Aggressive English priority (ported from books.html@8a77cc1).
  if (lang === 'en' || lang === 'eng' || lang === 'english') s += 300;
  else if (haystack.includes('english') || doc?._source === 'google-books') s += 150;
  else if (lang && lang !== 'en' && lang !== 'eng' && lang !== 'english') s -= 200;

  // Heavy penalty for non-Latin titles (indicates non-English)
  if (NON_LATIN_TITLE.test(title)) s -= 300;
  
  // Check description for non-English indicators
  const nonEnglishDescPatterns = [
    /\b(cet ouvrage|ce livre|cet livre est)\b/i,  // French
    /\b(dieses buch|dieses buches)\b/i,           // German
    /\b(este libro|este libro es)\b/i,            // Spanish
    /\b(questo libro|quest'opera)\b/i,            // Italian
    /\b(この本|この作品)\b/i,                     // Japanese
    /\b(이 책|이 작품)\b/i,                        // Korean
    /\b(这本书|这部作品)\b/i,                     // Chinese
    /\b(эта книга|этот труд)\b/i                 // Russian
  ];
  
  if (description && nonEnglishDescPatterns.some(p => p.test(description))) {
    s -= 100;
  }
  
  // Boost for English words in description (indicates English content)
  const englishWordPatterns = [
    /\b(the|and|is|in|it|you|that|he|was|for|on|are|as|with|his|they|I|at|be|this|have|from|or|one|had|by|word|but|not|what|all|were|we|when|your|can|said|there|use|an|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|look|two|more|write|go|see|number|no|way|could|people|my|than|first|water|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part)\b/i
  ];
  
  if (description && description.length > 50) {
    const englishWordCount = (description.match(englishWordPatterns[0]) || []).length;
    const totalWords = description.split(/\s+/).length;
    const englishRatio = englishWordCount / totalWords;
    
    if (englishRatio > 0.3) s += 20;
    else if (englishRatio < 0.1) s -= 50;
  }
  
  return s;
}

function scoreMetadata(doc) {
  let s = 0;
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  if (authors.length && authors[0] !== 'Unknown author') s += 20;
  const y = Number(doc?.first_publish_year || 0);
  if (y >= 2024) s += 14;
  else if (y >= 2020) s += 10;
  else if (y >= 2010) s += 6;
  else if (y && y < 1900) s -= 8;
  const cats = Array.isArray(doc?.subject) ? doc.subject : [];
  if (cats.length) s += 5;
  if (String(doc?.description || '').length > 80) s += 6;
  return s;
}

function scorePopularity(doc) {
  let s = 0;
  const rc = Number(doc?.ratingCount || 0);
  const r = Number(doc?.rating || 0);
  if (rc >= 1000) s += 40;
  else if (rc >= 100) s += 20;
  else if (rc >= 10) s += 8;
  if (r >= 4.2) s += 18;
  else if (r >= 4) s += 10;
  else if (r >= 3.5) s += 4;
  return s;
}

function scoreQueryRelevance(doc, query) {
  if (!query) return 0;
  const q = normalizeText(query);
  if (!q) return 0;
  const t = normalizeText(doc?.title || '');
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const a = normalizeText(authors[0] || '');
  let s = 0;
  if (t === q) s += 120;
  else if (t.startsWith(q)) s += 80;
  else if (t.includes(q)) s += 50;

  if (q && t) {
    const queryTokens = q.split(' ').filter(Boolean);
    const titleTokenHits = queryTokens.filter((token) => t.includes(token)).length;
    if (queryTokens.length) {
      if (titleTokenHits === queryTokens.length) s += 80;
      else if (titleTokenHits >= Math.ceil(queryTokens.length / 2)) s += 50;
      else if (titleTokenHits > 0) s += 25;
      if (queryTokens.length >= 2 && titleTokenHits >= 2) s += 30;
    }
    if (q.length >= 3) {
      const titleWords = t.split(' ');
      for (const word of titleWords) {
        if (!word) continue;
        if (word.includes(q) || q.includes(word)) { s += 25; break; }
      }
    }
  }

  if (a && q.includes(a)) s += 30;
  if (a && a.includes(q)) s += 20;
  return s;
}

// Known popular authors (boost their books in ranking)
var POPULAR_AUTHORS = [
  'stephen king', 'j.k. rowling', 'j.k rowling', 'jk rowling',
  'george r.r. martin', 'george r r martin', 'george rr martin',
  'brandon sanderson', 'suzanne collins', 'rick riordan',
  'colleen hoover', 'sarah j. maas', 'sarah j maas',
  'rebecca yarros', 'freida mcfadden', 'emily henry',
  'andy weir', 'james patterson', 'john grisham',
  'agatha christie', 'jane austen', 'f. scott fitzgerald',
  'george orwell', 'harper lee', 'j.d. salinger',
  'paulo coelho', 'james clear', 'mark manson',
  'gillian flynn', 'liane moriarty', 'tana french',
  'taylor jenkins reid', 'christina lauren'
];

function detectSeries(doc) {
  const title = String(doc?.title || '').toLowerCase();
  const subtitle = String(doc?.subtitle || '').toLowerCase();
  const description = String(doc?.description || '').toLowerCase();
  const all = title + ' ' + subtitle + ' ' + description;
  
  // Common series indicators
  if (/\b(book \d+|part \d+|volume \d+|vol\.?\s*\d+|#\d+)\b/i.test(all)) return true;
  if (/\b(the first|the second|the third|the final)\b (book|novel|story)/i.test(all)) return true;
  if (/\b(series|saga|trilogy|quartet|quintet|chronicles|cycle)\b/i.test(all)) return true;
  if (/\b(harry potter|wheel of time|stormlight|mistborn|dark tower|kingkiller|song of ice and fire|dune|foundation|discworld|inheritance|red rising)\b/i.test(all)) return true;
  
  return false;
}

function detectFranchise(doc) {
  const title = String(doc?.title || '').toLowerCase();
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const author = String(authors[0] || '').toLowerCase();
  const all = title + ' ' + author;
  
  for (const hint of FRANCHISE_HINTS) {
    for (const key of hint.keys) {
      if (all.includes(key)) return true;
    }
  }
  
  return false;
}

function scoreAuthorPopularity(doc) {
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const author = String(authors[0] || '').toLowerCase();

  for (const popAuthor of POPULAR_AUTHORS) {
    if (author.includes(popAuthor) || popAuthor.includes(author)) return 100;
  }

  return 0;
}

function scoreSeries(doc) {
  if (detectSeries(doc)) return 200;
  return 0;
}

function scoreFranchise(doc) {
  if (detectFranchise(doc)) return 100;
  return 0;
}

// ============================================================
// CURATED DISCOVERY (ported from index-home-heavy-loaders.js)
// ------------------------------------------------------------
// Given a pool of hand-picked book seeds and a list of API docs,
// boost docs that match the seeds so the home/discover rails are
// populated with the "books Zo2y actually wants to feature" first.
// ============================================================

function normalizeBookSeedText(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCuratedTopBookDoc(doc, seed) {
  const normalizedTitle = normalizeBookSeedText(doc && (doc.title || doc._rawTitle));
  const normalizedAuthor = normalizeBookSeedText(
    doc && (Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author || doc._rawAuthor))
  );
  const seedTitle = normalizeBookSeedText(seed && seed.title);
  const seedAuthor = normalizeBookSeedText(seed && seed.author);
  const seedYear = Number(seed && seed.year || 0) || 0;
  const docYear = Number(doc && (doc.first_publish_year || doc.year) || 0) || 0;
  let score = 0;
  if (normalizedTitle && seedTitle) {
    if (normalizedTitle === seedTitle) score += 120;
    else if (normalizedTitle.startsWith(seedTitle) || seedTitle.startsWith(normalizedTitle)) score += 80;
    else if (normalizedTitle.includes(seedTitle) || seedTitle.includes(normalizedTitle)) score += 48;
  }
  if (normalizedAuthor && seedAuthor) {
    if (normalizedAuthor === seedAuthor) score += 70;
    else if (normalizedAuthor.includes(seedAuthor) || seedAuthor.includes(normalizedAuthor)) score += 42;
  }
  if (String((doc && (doc.coverImage || doc.cover)) || '').trim()) score += 24;
  if (docYear >= 2020) score += 16;
  if (seedYear && docYear === seedYear) score += 24;
  return score;
}

// For each seed, pick the best-matching doc from the pool (if any).
// Returns array of {seed, doc} for seeds that produced a match.
function bestMatchForSeed(docs, seed) {
  if (!seed || !docs || !docs.length) return null;
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < docs.length; i++) {
    const s = scoreCuratedTopBookDoc(docs[i], seed);
    if (s > bestScore) { bestScore = s; best = docs[i]; }
  }
  return bestScore > 0 ? { seed, doc: best, score: bestScore } : null;
}

function runCuratedDiscovery(docs, seeds, opts) {
  opts = opts || {};
  const limit = Number(opts.limit || 18) || 18;
  const pool = Array.isArray(docs) ? docs : [];
  const seedList = Array.isArray(seeds) ? seeds : [];
  if (!pool.length || !seedList.length) return { books: [], matched: 0, totalSeeds: 0 };

  const seen = new Set();
  const matched = [];
  for (let i = 0; i < seedList.length && matched.length < limit; i++) {
    const result = bestMatchForSeed(pool, seedList[i]);
    if (!result || !result.doc) continue;
    const key = normalizeBookSeedText(result.doc.title) + '::' + normalizeBookSeedText(
      Array.isArray(result.doc.author_name) ? result.doc.author_name[0] : (result.doc.author || '')
    );
    if (!key || seen.has(key)) continue;
    seen.add(key);
    matched.push(result.doc);
  }
  return { books: matched, matched: matched.length, totalSeeds: seedList.length };
}

function scoreBookDoc(doc, opts = {}) {
  return scoreCoverQuality(doc)
       + scoreEnglishConfidence(doc)
       + scoreMetadata(doc)
       + scorePopularity(doc)
       + scoreQueryRelevance(doc, opts.query)
       + scoreAuthorPopularity(doc)
       + scoreSeries(doc)
       + scoreFranchise(doc);
}

function rankDocs(docs, opts = {}) {
  return (Array.isArray(docs) ? docs.slice() : []).sort((a, b) => scoreBookDoc(b, opts) - scoreBookDoc(a, opts));
}

// ============================================================
// EDITION GROUPING
// ============================================================

function editionKey(doc) {
  let t = normalizeText(doc?.title || '')
    .replace(/\b(illustrated|deluxe|special|collectors?|anniversary|boxed?\s*set|complete|definitive|annotated|abridged|unabridged|revised|updated|edition|vol(?:ume)?\s*\d+|book\s*\d+|part\s*\d+)\b/g, ' ')
    .replace(/[:|\-].*$/, '')
    .replace(/\s+/g, ' ').trim();
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const a = normalizeText(authors[0] || '').split(' ').slice(0, 3).join(' ');
  if (!t) return '';
  return t + '::' + a;
}

function groupBestEditions(docs, opts = {}) {
  const groups = new Map();
  (Array.isArray(docs) ? docs : []).forEach((doc) => {
    const k = editionKey(doc);
    if (!k) return;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(doc);
  });
  const out = [];
  for (const members of groups.values()) {
    members.sort((a, b) => scoreBookDoc(b, opts) - scoreBookDoc(a, opts));
    const best = members[0];
    if (members.length > 1) best._editionCount = members.length;
    out.push(best);
  }
  return out;
}

// Ensure pagination stability by maintaining consistent scoring across pages
// This prevents quality degradation as users paginate through results
function ensurePaginationStability(docs, opts = {}) {
  // Apply consistent scoring to all documents
  const scored = docs.map((doc) => ({
    doc,
    score: scoreBookDoc(doc, opts)
  }));
  
  // Sort by score to ensure stable ranking
  scored.sort((a, b) => b.score - a.score);
  
  // Return sorted documents
  return scored.map((item) => item.doc);
}

// ============================================================
// COVER ENRICHMENT (High resolution covers, official covers, fallback hierarchy)
// ============================================================

// Build a fallback chain of cover URLs for a book
function buildCoverFallbackChain(doc) {
  const chain = [];
  const current = String(doc?.coverImage || doc?._googleThumbnail || '').trim();
  
  // 1. Start with current cover (if any)
  if (current) chain.push(current);
  
  // 2. Try Open Library by ISBN (highest priority fallback)
  const isbnList = Array.isArray(doc?.isbn) ? doc.isbn : [];
  isbnList.forEach((isbn) => {
    const clean = String(isbn || '').replace(/[^0-9Xx]/g, '');
    if (clean) {
      chain.push(`https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`);
      chain.push(`https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`);
    }
  });
  
  // 3. Try Open Library by cover ID
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    chain.push(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
    chain.push(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
  }
  
  // 4. Try Open Library by title/author search (last resort)
  const title = String(doc?.title || '').trim();
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const author = String(authors[0] || '').trim();
  if (title && author && author !== 'Unknown author') {
    chain.push(`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}/-L.jpg`);
  }
  
  // 5. Fallback to default cover
  chain.push(DEFAULT_BOOK_COVER);
  
  // Remove duplicates while preserving order
  const seen = new Set();
  return chain.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

// Enhance Google Books cover to highest resolution available
function enhanceGoogleCover(doc) {
  const imageLinks = doc?._rawImageLinks || doc?.volumeInfo?.imageLinks || {};
  const current = String(doc?.coverImage || doc?._googleThumbnail || '').trim();
  
  // Try to get the highest resolution cover
  const priorityOrder = [
    'extraLarge',
    'large',
    'medium',
    'thumbnail',
    'smallThumbnail'
  ];
  
  for (const size of priorityOrder) {
    const url = imageLinks[size];
    if (url && url !== current) {
      let enhanced = toHttpsUrl(url);
      // Strip edge=curl and use zoom=2 for better quality
      if (enhanced && /books\.google/i.test(enhanced)) {
        enhanced = enhanced.replace(/&edge=curl/i, '').replace(/&zoom=\d/i, '');
        if (!/zoom=/i.test(enhanced)) enhanced += '&zoom=2';
      }
      if (enhanced && enhanced !== current) {
        doc.coverImage = enhanced;
        doc._googleThumbnail = enhanced;
        return true;
      }
    }
  }
  
  return false;
}

async function enrichMissingCovers(docs) {
  const list = Array.isArray(docs) ? docs : [];
  
  // First, try to enhance existing Google Books covers to highest resolution
  list.forEach((doc) => {
    if (doc && doc.coverImage) {
      enhanceGoogleCover(doc);
    }
  });
  
  // Then, fetch missing covers from Open Library
  const missing = list.filter((d) => d && !d.coverImage);
  if (!missing.length) return list;
  
  await Promise.allSettled(missing.map(async (doc) => {
    try {
      const title = String(doc?.title || '').trim();
      const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
      const author = String(authors[0] || '').trim();
      if (!title) return;
      
      // Try ISBN-based lookup first (most reliable)
      const isbnList = Array.isArray(doc?.isbn) ? doc.isbn : [];
      for (const isbn of isbnList) {
        const clean = String(isbn || '').replace(/[^0-9Xx]/g, '');
        if (!clean) continue;
        
        const isbnUrl = `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`;
        // Check if the cover exists by making a HEAD request
        try {
          const checkRes = await fetch(isbnUrl, { method: 'HEAD' });
          if (checkRes.ok) {
            doc.coverImage = isbnUrl;
            return;
          }
        } catch (_) { /* continue to next method */ }
      }
      
      // Fallback to title/author search
      const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
      url.searchParams.set('title', title);
      if (author && author !== 'Unknown author') url.searchParams.set('author', author);
      url.searchParams.set('limit', '5');
      
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      
      const json = await res.json();
      const works = Array.isArray(json?.docs) ? json.docs : [];
      for (const w of works) {
        const id = w?.cover_i;
        if (id) {
          // Try largest size first
          doc.coverImage = `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
          break;
        }
      }
    } catch (_err) { /* swallow */ }
  }));
  
  // Build fallback chains for all books
  list.forEach((doc) => {
    if (doc) {
      doc._coverFallbackChain = buildCoverFallbackChain(doc);
    }
  });
  
  return list;
}

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeBook(input) {
  if (!input) return null;
  const title = String(input?.title || input?.name || '').trim();
  if (!title) return null;
  
  const rawId = String(input?.id || '').trim();
  const googleId = String(input?._googleVolumeId || '').trim();
  const id = rawId || googleId || '';
  
  const authorCandidate = Array.isArray(input?.author_name)
    ? String(input.author_name[0] || '').trim()
    : String(input?.author || input?.authors || '').trim();
  const author = authorCandidate || 'Unknown author';
  
  const year = Number(input?.first_publish_year || input?.published_year || input?.year || 0) || null;
  const cover = toHttpsUrl(input?.cover || input?.coverImage || input?.thumbnail || input?._googleThumbnail || '') || '';
  const source = String(input?._source || '').trim() || 'google-books';
  
  const rawIsbnSource = Array.isArray(input?.isbn)
    ? input.isbn
    : (input?.isbn ? [input.isbn] : []);
  const isbn = rawIsbnSource
    .map((entry) => String(entry || '').replace(/[^0-9Xx]/g, ''))
    .filter(Boolean);
  
  const coverId = Number(input?.cover_i || input?.coverId || 0) || 0;
  
  return {
    id,
    title,
    author,
    year,
    cover: cover || DEFAULT_BOOK_COVER,
    source,
    language: String(input?.language || '').toLowerCase() || '',
    rating: Number(input?.rating || 0) || 0,
    ratingCount: Number(input?.ratingCount || 0) || 0,
    publisher: Array.isArray(input?.publisher) ? input.publisher[0] : String(input?.publisher || '').trim() || '',
    subjects: Array.isArray(input?.subject) ? input.subject.slice(0, 8)
            : Array.isArray(input?.subjects) ? input.subjects.slice(0, 8)
            : [],
    description: String(input?.description || '').trim(),
    contentType: detectContentType(input),
    maturityRating: String(input?.maturityRating || '').trim(),
    isbn,
    cover_i: coverId > 0 ? coverId : null,
    _editionCount: input?._editionCount || null
  };
}

// ============================================================
// MAIN PIPELINE
// ============================================================

async function runBookPipeline(params, opts = {}, apiKey = '', signal = null) {
  const google = await fetchGoogleDocs(params, apiKey, signal);
  let docs = Array.isArray(google.docs) ? google.docs : [];
  
  docs = filterSafeBookDocs(docs, { strict: opts.strict !== false });
  
  if (opts.enrichCovers !== false) docs = await enrichMissingCovers(docs);
  
  docs = rankDocs(docs, { query: params.q || params.title || '' });
  
  // Ensure pagination stability to prevent quality degradation across pages
  docs = ensurePaginationStability(docs, { query: params.q || params.title || '' });
  
  if (opts.groupEditions !== false) docs = groupBestEditions(docs, { query: params.q || params.title || '' });
  
  const books = docs.map(normalizeBook).filter(Boolean);
  
  return { 
    books, 
    numFound: google.numFound, 
    source: google.source 
  };
}

// ============================================================
// EXPORTS
// ============================================================

// Export object for both browser and server environments
var exports = {
  // Constants
  GOOGLE_BOOKS_BASE,
  OPEN_LIBRARY_BASE,
  DEFAULT_BOOK_COVER,
  JUNK_TITLE_PATTERNS,
  JUNK_PUBLISHER_PATTERNS,
  EXPLICIT_TEXT_PATTERNS,
  FRANCHISE_HINTS,
  DISCOVERY_SECTIONS,
  
  // Utility functions
  toHttpsUrl,
  normalizeText,
  clampInt,
  
  // Search query rewriting
  rewriteSearchQuery,
  
  // Google Books API
  buildGoogleQuery,
  fetchGoogleDocs,
  normalizeGoogleBookDoc,
  
  // Content type detection
  detectContentType,
  
  // Junk filtering
  getDocText,
  isJunkBookDoc,
  filterSafeBookDocs,
  
  // Scoring engine
  scoreCoverQuality,
  scoreEnglishConfidence,
  scoreMetadata,
  scorePopularity,
  scoreQueryRelevance,
  scoreBookDoc,
  rankDocs,

  // Curated discovery
  normalizeBookSeedText,
  scoreCuratedTopBookDoc,
  runCuratedDiscovery,
  
  // Edition grouping
  editionKey,
  groupBestEditions,
  
  // Cover enrichment
  enrichMissingCovers,
  
  // Normalization
  normalizeBook,
  
  // Main pipeline
  runBookPipeline
};

// Browser environment: expose to window for client-side use
if (typeof window !== 'undefined') {
  window.Zo2yBooksDataLayer = exports;
}

// Server environment: use CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = exports;
}
