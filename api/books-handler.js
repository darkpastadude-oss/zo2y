import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";
const SUPABASE_KEY_HEADER = "x-zo2y-supabase-key";

// Server-side cache for discovery responses.
const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;

// Inline discovery sections to avoid import issues in Cloudflare Functions
const DISCOVERY_SECTIONS = [
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

const DEFAULT_BOOK_COVER = '/images/fallback/book.svg';

function toHttpsUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  return str.replace(/^http:/i, 'https:');
}

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_URL = 'https://covers.openlibrary.org';

function buildOpenLibraryQuery(params = {}) {
  const qRaw = rewriteSearchQuery(params.q);
  const title = String(params.title || '').trim();
  const author = String(params.author || '').trim();
  const subject = String(params.subject || '').trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title) chunks.push(title);
  if (author) chunks.push(author);
  if (subject) chunks.push(subject);
  return chunks.join(' ').trim() || 'popular fiction';
}

function normalizeOpenLibraryDoc(doc, idx = 0) {
  const title = String(doc?.title || '').trim();
  if (!title) return null;

  const authorNames = Array.isArray(doc?.author_name)
    ? doc.author_name.map((name) => String(name || '').trim()).filter(Boolean)
    : [];
  const isbnList = Array.isArray(doc?.isbn) ? doc.isbn : [];
  const publisherList = Array.isArray(doc?.publisher) ? doc.publisher : [];
  const subjectList = Array.isArray(doc?.subject) ? doc.subject.slice(0, 8) : [];
  const year = Number(doc?.first_publish_year || 0) || null;
  const coverId = Number(doc?.cover_i || 0) || 0;
  const language = String(
    Array.isArray(doc?.language) ? doc.language[0] :
    typeof doc?.language === 'string' ? doc.language : ''
  ).trim().toLowerCase();
  const workKey = String(doc?.key || '').trim();
  const workId = workKey.replace(/^\/works\//, '').trim();

  return {
    id: workId,
    title,
    author_name: authorNames.length ? authorNames : ['Unknown author'],
    first_publish_year: year,
    isbn: isbnList,
    coverImage: coverId > 0 ? `${OPEN_LIBRARY_COVER_URL}/b/id/${coverId}-L.jpg` : '',
    cover_i: coverId,
    publisher: publisherList,
    subject: subjectList,
    language,
    description: String(doc?.first_sentence?.[0] || '').trim(),
    rating: 0,
    ratingCount: Number(doc?.ratings_count || doc?.want_to_read_count || 0) || 0,
    saleability: '',
    maturityRating: '',
    pageCount: 0,
    _googleThumbnail: '',
    _googleVolumeId: '',
    _source: 'open-library'
  };
}

async function fetchOpenLibraryDocs(params = {}, signal = null) {
  const query = buildOpenLibraryQuery(params);
  if (!query) return { docs: [], numFound: 0, source: 'open-library' };

  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);

  const url = new URL(OPEN_LIBRARY_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('page', String(page));
  // Open Library uses ISO 639-2/B 3-letter codes (e.g. 'eng' not 'en').
  const lang = String(params.language || '').trim().toLowerCase();
  if (lang === 'en' || lang === 'eng') url.searchParams.set('language', 'eng');
  else if (lang) url.searchParams.set('language', lang);
  if (params.first_publish_year) url.searchParams.set('first_publish_year', String(params.first_publish_year));

  const controller = signal || new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.log('[Books API] Open Library response not OK:', res.status);
      return { docs: [], numFound: 0, source: 'open-library' };
    }
    const json = await res.json();
    const items = Array.isArray(json?.docs) ? json.docs : [];
    const docs = items.map((entry, idx) => normalizeOpenLibraryDoc(entry, idx)).filter(Boolean);
    const numFound = Number(json?.numFound || json?.num_found || 0);
    return { docs, numFound, source: 'open-library' };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('[Books API] Open Library fetch error:', error?.message || error);
    return { docs: [], numFound: 0, source: 'open-library' };
  }
}

// ============================================================
// CURATED DISCOVERY (inlined; mirrors js/books-data-layer.js)
// ------------------------------------------------------------
// Inline because Cloudflare Functions can't reliably require()
// the shared data layer. Keep this in sync with the data layer.
// ============================================================

function normalizeBookSeedText(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCuratedTopBookDocServer(doc, seed) {
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
  if (String((doc && (doc.coverImage || doc.cover_i || doc.cover)) || '').trim()) score += 24;
  if (docYear >= 2020) score += 16;
  if (seedYear && docYear === seedYear) score += 24;
  return score;
}

function runCuratedDiscoveryServer(docs, seeds, opts) {
  opts = opts || {};
  const limit = Number(opts.limit || 18) || 18;
  const pool = Array.isArray(docs) ? docs : [];
  const seedList = Array.isArray(seeds) ? seeds : [];
  if (!pool.length || !seedList.length) return { books: [], matched: 0 };

  const seen = new Set();
  const matched = [];
  for (let i = 0; i < seedList.length && matched.length < limit; i++) {
    const seed = seedList[i];
    let best = null;
    let bestScore = 0;
    for (let j = 0; j < pool.length; j++) {
      const s = scoreCuratedTopBookDocServer(pool[j], seed);
      if (s > bestScore) { bestScore = s; best = pool[j]; }
    }
    if (!best || bestScore <= 0) continue;
    const key = normalizeBookSeedText(best.title) + '::' + normalizeBookSeedText(
      Array.isArray(best.author_name) ? best.author_name[0] : (best.author || '')
    );
    if (!key || seen.has(key)) continue;
    seen.add(key);
    matched.push(best);
  }
  return { books: matched, matched: matched.length };
}

// Hand-picked trending seeds per period (subset of js/data/curated-media.js).
// Period = "most recent 6 months" for daily, "this year" for weekly, "last 2 years" for monthly.
const CURATED_BOOK_SEEDS_BY_PERIOD = {
  daily: [
    { title: 'Onyx Storm', author: 'Rebecca Yarros', year: 2025 },
    { title: 'Atmosphere', author: 'Taylor Jenkins Reid', year: 2025 },
    { title: 'Great Big Beautiful Life', author: 'Emily Henry', year: 2025 },
    { title: 'Sunrise on the Reaping', author: 'Suzanne Collins', year: 2025 },
    { title: 'Dream Count', author: 'Chimamanda Ngozi Adichie', year: 2025 },
    { title: 'My Friends', author: 'Fredrik Backman', year: 2025 },
    { title: 'King of Ashes', author: 'S. A. Cosby', year: 2025 },
    { title: 'Wild Dark Shore', author: 'Charlotte McConaghy', year: 2025 },
    { title: 'The Dream Hotel', author: 'Laila Lalami', year: 2025 },
    { title: 'Broken Country', author: 'Clare Leslie Hall', year: 2025 },
    { title: 'The Favorites', author: 'Layne Fargo', year: 2025 },
    { title: "Say You'll Remember Me", author: 'Abby Jimenez', year: 2025 }
  ],
  weekly: [
    { title: 'James', author: 'Percival Everett', year: 2024 },
    { title: 'The Women', author: 'Kristin Hannah', year: 2024 },
    { title: 'All Fours', author: 'Miranda July', year: 2024 },
    { title: 'Intermezzo', author: 'Sally Rooney', year: 2024 },
    { title: 'Martyr!', author: 'Kaveh Akbar', year: 2024 },
    { title: 'The Ministry of Time', author: 'Kaliane Bradley', year: 2024 },
    { title: 'The God of the Woods', author: 'Liz Moore', year: 2024 },
    { title: 'Funny Story', author: 'Emily Henry', year: 2024 },
    { title: 'The Wedding People', author: 'Alison Espach', year: 2024 },
    { title: 'House of Flame and Shadow', author: 'Sarah J. Maas', year: 2024 },
    { title: 'Orbital', author: 'Samantha Harvey', year: 2024 },
    { title: 'Creation Lake', author: 'Rachel Kushner', year: 2024 },
    { title: 'North Woods', author: 'Daniel Mason', year: 2023 }
  ],
  monthly: [
    { title: 'Surrounded by Idiots', author: 'Thomas Erikson', year: 2019 },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', year: 2016 },
    { title: 'Atomic Habits', author: 'James Clear', year: 2018 },
    { title: 'Ikigai', author: 'Hector Garcia', year: 2017 },
    { title: 'The Psychology of Money', author: 'Morgan Housel', year: 2020 },
    { title: 'Make Your Bed', author: 'William H. McRaven', year: 2017 },
    { title: '101 Essays That Will Change The Way You Think', author: 'Brianna Wiest', year: 2016 },
    { title: 'The Mountain Is You', author: 'Brianna Wiest', year: 2020 },
    { title: 'Everything Is F*cked', author: 'Mark Manson', year: 2019 }
  ]
};

// Inline runBookPipeline to avoid import issues in Cloudflare Functions
async function runBookPipeline(params, opts = {}, apiKey = '', signal = null) {
  console.log('[Books API] runBookPipeline called with params:', params);
  let google = await fetchGoogleDocs(params, apiKey, signal);
  let docs = Array.isArray(google.docs) ? google.docs : [];
  console.log('[Books API] Google docs count:', docs.length, 'source:', google.source);

  // FALLBACK: if Google returns 0 (rate-limited, missing API key, or no matches),
  // try Open Library so the books page never appears empty.
  if (docs.length === 0) {
    const ol = await fetchOpenLibraryDocs(params, signal);
    const olDocs = Array.isArray(ol.docs) ? ol.docs : [];
    console.log('[Books API] Open Library fallback docs count:', olDocs.length);
    if (olDocs.length > 0) {
      docs = olDocs;
      google = { docs: olDocs, numFound: ol.numFound, source: 'open-library' };
    }
  }

  docs = filterSafeBookDocs(docs, { strict: opts.strict !== false });
  console.log('[Books API] After filterSafeBookDocs:', docs.length);

  if (opts.enrichCovers !== false) docs = await enrichMissingCovers(docs);

  docs = rankDocs(docs, { query: params.q || params.title || '' });

  docs = ensurePaginationStability(docs, { query: params.q || params.title || '' });

  if (opts.groupEditions !== false) docs = groupBestEditions(docs, { query: params.q || params.title || '' });
  console.log('[Books API] After groupBestEditions:', docs.length);

  const books = docs.map(normalizeBook).filter(Boolean);
  console.log('[Books API] Final books count:', books.length);

  return {
    books,
    numFound: google.numFound,
    source: google.source
  };
}

// Inline helper functions to avoid import issues
function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function rewriteSearchQuery(raw) {
  const clean = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const FRANCHISE_HINTS = [
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
  for (const hint of FRANCHISE_HINTS) {
    for (const k of hint.keys) {
      if (lower === k || lower.startsWith(k) || lower.includes(k)) return hint.hint;
    }
  }
  return clean;
}

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
  console.log('[Books API] Google Books query:', query);
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

  console.log('[Books API] Fetching URL:', url.toString());
  const controller = signal || new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  
  try {
    const res = await fetch(url.toString(), { 
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'default'
    });
    clearTimeout(timeoutId);
    
    console.log('[Books API] Response status:', res.status);
    if (!res.ok) {
      console.log('[Books API] Response not OK');
      return { docs: [], numFound: 0, source: 'google-books' };
    }
    
    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    console.log('[Books API] Total items from Google:', json?.totalItems || 0, 'Items returned:', items.length);
    const docs = items.map((entry, idx) => normalizeGoogleBookDoc(entry, idx)).filter(Boolean);
    console.log('[Books API] Normalized docs:', docs.length);
    const totalItems = Number(json?.totalItems || 0);
    
    return {
      docs,
      numFound: Number.isFinite(totalItems) && totalItems > 0 ? totalItems : docs.length,
      source: 'google-books'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('[Books API] Fetch error:', error.message);
    return { docs: [], numFound: 0, source: 'google-books' };
  }
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
  
  const imageLinks = info?.imageLinks || {};
  const thumbRaw = imageLinks.extraLarge || imageLinks.large || imageLinks.medium ||
                   imageLinks.thumbnail || imageLinks.smallThumbnail || '';
  let thumb = toHttpsUrl(thumbRaw);
  
  if (thumb && /books\.google/i.test(thumb)) {
    thumb = thumb.replace(/&edge=curl/i, '').replace(/&zoom=\d/i, '');
    if (!/zoom=/i.test(thumb)) thumb += '&zoom=2';
  }
  
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
  const EXPLICIT_TEXT_PATTERNS = [/\b(porn|erotica|adult content)\b/i];
  if (EXPLICIT_TEXT_PATTERNS.some((p) => p.test(text))) return true;
  
  const maturity = String(doc?.maturityRating || '').toLowerCase();
  if (maturity && maturity !== 'not_mature' && maturity.includes('mature')) return true;
  
  const JUNK_TITLE_PATTERNS = [
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
  for (const p of JUNK_TITLE_PATTERNS) if (p.test(title)) return true;
  
  const pub = Array.isArray(doc?.publisher) ? doc.publisher.join(' ') : String(doc?.publisher || '');
  const JUNK_PUBLISHER_PATTERNS = [
    /\b(government printing office|gpo)\b/i,
    /\b(ieee|acm|springer|elsevier|wiley)\s+(proceedings|symposium)\b/i
  ];
  if (pub) for (const p of JUNK_PUBLISHER_PATTERNS) if (p.test(pub)) return true;
  
  if (opts.strict !== false) {
    const ct = detectContentType(doc);
    if (ct === 'academic' || ct === 'report' || ct === 'periodical' || ct === 'study-aid') return true;
  }
  
  return false;
}

function filterSafeBookDocs(docs = [], opts = {}) {
  return (Array.isArray(docs) ? docs : []).filter((doc) => !isJunkBookDoc(doc, opts));
}

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
  
  if (lang === 'en' || lang === 'eng') s += 80;
  else if (lang && lang !== 'en') s -= 120;
  
  const NON_LATIN_TITLE = /[\u4e00-\u9fff\u0400-\u04FF\u0E00-\u0E7F\u3040-\u309F\u30A0-\u30FF]/;
  if (NON_LATIN_TITLE.test(title)) s -= 300;
  
  const nonEnglishDescPatterns = [
    /\b(cet ouvrage|ce livre|cet livre est)\b/i,
    /\b(dieses buch|dieses buches)\b/i,
    /\b(este libro|este libro es)\b/i,
    /\b(questo libro|quest'opera)\b/i,
    /\b(この本|この作品)\b/i,
    /\b(이 책|이 작품)\b/i,
    /\b(这本书|这部作品)\b/i,
    /\b(эта книга|этот труд)\b/i
  ];
  
  if (description && nonEnglishDescPatterns.some(p => p.test(description))) {
    s -= 100;
  }
  
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
  if (a && q.includes(a)) s += 30;
  if (a && a.includes(q)) s += 20;
  return s;
}

const POPULAR_AUTHORS = [
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
    if (author.includes(popAuthor) || popAuthor.includes(author)) return 25;
  }
  
  return 0;
}

function scoreSeries(doc) {
  if (detectSeries(doc)) return 15;
  return 0;
}

function scoreFranchise(doc) {
  if (detectFranchise(doc)) return 20;
  return 0;
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

function ensurePaginationStability(docs, opts = {}) {
  const scored = docs.map((doc) => ({
    doc,
    score: scoreBookDoc(doc, opts)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.map((item) => item.doc);
}

async function enrichMissingCovers(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const missing = list.filter((d) => {
    if (!d) return false;
    const img = String(d.coverImage || d._googleThumbnail || '').trim();
    return !img || img === DEFAULT_BOOK_COVER;
  });
  if (!missing.length) return list;
  
  list.forEach((doc) => {
    if (doc && doc.coverImage) {
      enhanceGoogleCover(doc);
    }
  });
  
  await Promise.allSettled(missing.map(async (doc) => {
    try {
      const title = String(doc?.title || '').trim();
      const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
      const author = String(authors[0] || '').trim();
      if (!title) return;
      
      const isbnList = Array.isArray(doc?.isbn) ? doc.isbn : [];
      for (const isbn of isbnList) {
        const clean = String(isbn || '').replace(/[^0-9Xx]/g, '');
        if (!clean) continue;
        
        const isbnUrl = `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`;
        try {
          const checkRes = await fetch(isbnUrl, { method: 'HEAD' });
          if (checkRes.ok) {
            doc.coverImage = isbnUrl;
            return;
          }
        } catch (_) { /* continue to next method */ }
      }
      
      const url = new URL(`https://openlibrary.org/search.json`);
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
          doc.coverImage = `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
          break;
        }
      }
    } catch (_err) { /* swallow */ }
  }));
  
  list.forEach((doc) => {
    if (doc) {
      doc._coverFallbackChain = buildCoverFallbackChain(doc);
    }
  });
  
  return list;
}

function enhanceGoogleCover(doc) {
  const imageLinks = doc?._rawImageLinks || doc?.volumeInfo?.imageLinks || {};
  const current = String(doc?.coverImage || doc?._googleThumbnail || '').trim();
  
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

function buildCoverFallbackChain(doc) {
  const chain = [];
  const current = String(doc?.coverImage || doc?._googleThumbnail || '').trim();
  
  if (current) chain.push(current);
  
  const isbnList = Array.isArray(doc?.isbn) ? doc.isbn : [];
  isbnList.forEach((isbn) => {
    const clean = String(isbn || '').replace(/[^0-9Xx]/g, '');
    if (clean) {
      chain.push(`https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`);
      chain.push(`https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`);
    }
  });
  
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    chain.push(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
    chain.push(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
  }
  
  const title = String(doc?.title || '').trim();
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const author = String(authors[0] || '').trim();
  if (title && author && author !== 'Unknown author') {
    chain.push(`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}/-L.jpg`);
  }
  
  chain.push(DEFAULT_BOOK_COVER);
  
  const seen = new Set();
  return chain.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function normalizeBook(input) {
  if (!input) return null;
  const title = String(input?.title || input?.name || '').trim();
  if (!title) return null;
  
  const rawId = String(input?.id || '').trim();
  const googleId = String(input?._googleVolumeId || '').trim();
  const id = rawId || googleId || null;
  
  const authors = Array.isArray(input?.author_name) ? input.author_name 
              : Array.isArray(input?.authors) ? input.authors 
              : input?.author ? [input.author] : [];
  
  const authorNames = authors.map((a) => String(a || '').trim()).filter(Boolean);
  
  const coverSrc = String(input?.coverImage || input?.image || '').trim() || DEFAULT_BOOK_COVER;
  return {
    id,
    title: String(input?.title || '').trim(),
    subtitle: String(input?.subtitle || '').trim(),
    author_name: authorNames.length ? authorNames : ['Unknown author'],
    first_publish_year: Number(input?.first_publish_year || 0) || null,
    isbn: Array.isArray(input?.isbn) ? input.isbn : [],
    subject: Array.isArray(input?.subject) ? input.subject : [],
    publisher: Array.isArray(input?.publisher) ? input.publisher : [],
    coverImage: coverSrc,
    cover: coverSrc,
    description: String(input?.description || '').trim(),
    language: String(input?.language || '').trim(),
    rating: Number(input?.rating || 0) || 0,
    ratingCount: Number(input?.ratingCount || 0) || 0
  };
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function getBooksKey() { return String(process.env.GOOGLE_BOOKS_KEY || "").trim(); }
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) { return {}; }
}
function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}
function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => { if (entry !== undefined && entry !== null) params.append(key, String(entry)); });
    return;
  }
  params.append(key, String(value));
}
function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithRetry(url, init = {}, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000 + attempt * 1200);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === attempts - 1) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 280 * (attempt + 1)));
  }
  if (lastError) throw lastError;
  throw new Error("Upstream request failed");
}


// ----------------------------------------------------------------------
// Supabase helpers (kept from previous implementation - DO NOT remove)
// ----------------------------------------------------------------------
function getSupabasePublicKeyFromReq(req) {
  const headerGetter = req && typeof req.get === "function" ? req : null;
  const headersObj = req?.headers && typeof req.headers === "object" ? req.headers : {};
  const direct = headerGetter ? String(headerGetter.get(SUPABASE_KEY_HEADER) || "").trim() : "";
  const alt = headerGetter ? String(headerGetter.get("apikey") || headerGetter.get("x-supabase-anon-key") || "").trim() : "";
  const fromObj =
    String(headersObj[SUPABASE_KEY_HEADER] || headersObj[SUPABASE_KEY_HEADER.toLowerCase()] || "").trim()
    || String(headersObj.apikey || headersObj["x-supabase-anon-key"] || "").trim();
  return String(direct || alt || fromObj || "").trim();
}
function getBearerToken(req) {
  const raw = String(req?.headers?.authorization || req?.headers?.Authorization || "").trim();
  if (!/^bearer\s+/i.test(raw)) return "";
  return raw.replace(/^bearer\s+/i, "").trim();
}
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text); } catch (_e) { return null; }
}
function normalizePublishedDate(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const year = Math.floor(value);
    if (year > 0) return `${year}-01-01`;
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const yearMatch = raw.match(/\d{4}/);
  if (yearMatch) return `${yearMatch[0]}-01-01`;
  return null;
}
function normalizeAuthors(value) {
  if (Array.isArray(value)) {
    const joined = value.map((e) => String(e || "").trim()).filter(Boolean).join(", ");
    return joined || null;
  }
  const text = String(value || "").trim();
  return text || null;
}
function normalizeCategories(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((e) => String(e || "").trim()).filter(Boolean).slice(0, 40);
}
function sanitizeBookPayload(body = {}) {
  const id = String(body.id || body.book_id || body.bookId || "").trim();
  if (!id) return null;
  const titleRaw = String(body.title || body.name || "").trim();
  const title = titleRaw || `Book ${id}`;
  const authors = normalizeAuthors(body.authors || body.author_name || body.author || body.subtitle);
  const thumbnail = toHttpsUrl(body.thumbnail || body.image || body.cover || "");
  const publishedDate = normalizePublishedDate(
    body.published_date || body.first_publish_date || body.first_publish_year || body.published || body.year
  );
  const categories = normalizeCategories(body.categories || body.subject);
  const description = String(body.description || "").trim();
  const pageCount = Number(body.page_count || body.pageCount || 0);
  const publisher = String(body.publisher || "").trim();
  return {
    id, title,
    authors: authors || null,
    thumbnail: thumbnail || null,
    published_date: publishedDate,
    categories: categories.length ? categories : null,
    description: description || null,
    page_count: Number.isFinite(pageCount) && pageCount > 0 ? Math.floor(pageCount) : null,
    publisher: publisher || null,
    updated_at: new Date().toISOString()
  };
}
async function testBooksAuth({ supabaseUrl, apikey, bearerToken }) {
  if (!supabaseUrl || !apikey || !bearerToken) {
    return { ok: false, configured: false, status: 0, message: "Missing SUPABASE_URL / apikey / bearer token" };
  }
  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/books?select=id&limit=1`;
  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: { apikey, Authorization: `Bearer ${bearerToken}`, "Content-Type": "application/json" }
    });
    if (upstream.ok) return { ok: true, configured: true, status: upstream.status };
    const text = await upstream.text().catch(() => "");
    return { ok: false, configured: true, status: upstream.status, message: text || `Books query failed (${upstream.status})` };
  } catch (error) {
    return { ok: false, configured: true, status: 0, message: error?.message || "Network error" };
  }
}

// ======================================================================
// MAIN HANDLER
// ======================================================================
export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const rawSection = String(pathParts[0] || "").trim().toLowerCase();
  const section = rawSection.replace(/\.json$/i, "");

  if (!section) {
    return res.json({ ok: true, service: "books-proxy", version: "v3", configured: !!getBooksKey() });
  }

  // -------- diagnostics (unchanged) --------
  if (section === "diagnostics") {
    const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
    const serviceRoleSet = Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim());
    const anonFromEnv = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
    const anonFromHeader = getSupabasePublicKeyFromReq(req);
    const apikey = anonFromEnv || anonFromHeader;
    const bearerToken = getBearerToken(req);
    const rlsProbe = bearerToken && apikey && supabaseUrl
      ? await testBooksAuth({ supabaseUrl, apikey, bearerToken })
      : { ok: false, configured: false, status: 0, message: "Send Authorization + apikey to test auth" };
    return res.json({
      ok: true,
      supabase: {
        url_set: Boolean(supabaseUrl),
        service_role_set: serviceRoleSet,
        anon_key_set: Boolean(anonFromEnv),
        anon_key_from_header: Boolean(anonFromHeader)
      },
      rls_probe: rlsProbe,
      hint_rls_fix_sql: "sql/books_rls_write_policy.sql"
    });
  }

  // -------- sync (unchanged write path) --------
  if (section === "sync" && String(req.method || "").toUpperCase() === "POST") {
    try {
      let client = getSupabaseAdminClient();
      const body = await readJsonBody(req);
      const payload = sanitizeBookPayload(body || {});
      if (!payload) return res.status(400).json({ ok: false, message: "Missing book id" });
      if (!client) {
        const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
        const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || getSupabasePublicKeyFromReq(req);
        const bearerToken = getBearerToken(req);
        if (supabaseUrl && supabaseAnonKey && bearerToken) {
          client = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
          });
        } else {
          return res.status(503).json({
            ok: false, message: "Supabase admin not configured",
            hint: `Provide SUPABASE_SERVICE_ROLE_KEY, or send Authorization + ${SUPABASE_KEY_HEADER} with a Supabase publishable/anon key.`,
            required_env: ["SUPABASE_URL"], required_secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
            supabase_url_set: Boolean(supabaseUrl),
            supabase_anon_set: Boolean(supabaseAnonKey)
          });
        }
      }
      const { error } = await client.from("books").upsert(payload, { onConflict: "id" });
      if (error) {
        const isRls = String(error?.code || "").trim() === "42501"
          || String(error?.message || "").toLowerCase().includes("row-level security")
          || String(error?.message || "").toLowerCase().includes("permission");
        return res.status(isRls ? 403 : 500).json({
          ok: false, message: error.message || "Book sync failed", code: error.code || null,
          details: error.details || null, hint: isRls ? "RLS blocked book upsert. Apply sql/books_rls_write_policy.sql" : null
        });
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error("Book sync error:", error?.message);
      return res.status(500).json({ ok: false, message: "Book sync failed" });
    }
  }

  // -------- SEARCH (now: full pipeline with enrichment + ranking + edition grouping) --------
  if (section === "search") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const page = clampInt(query.page, 1, 1000, 1);
      const orderByRaw = String(query.orderBy || "").trim().toLowerCase();
      const orderBy = orderByRaw === "newest" ? "newest" : "relevance";
      const result = await runBookPipeline({
        q: query.q, title: query.title, author: query.author, subject: query.subject,
        first_publish_year: query.first_publish_year, year: query.year,
        year_from: query.year_from, year_to: query.year_to,
        language: query.language || "en", limit, page, orderBy
      }, { strict: false, enrichCovers: true, groupEditions: true }, getBooksKey());
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=300, stale-while-revalidate=600");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, page, limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Book search failed" });
    }
  }

  // -------- POPULAR (strict junk filter + enrichment + ranking) --------
  if (section === "popular") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const page = clampInt(query.page, 1, 1000, 1);
      const subject = String(query.subject || "").trim();
      const result = await runBookPipeline({
        q: String(query.q || "").trim() || (subject ? `popular ${subject} books` : "bestseller fiction"),
        subject: subject,
        limit, page,
        language: String(query.language || "en").trim() || "en",
        orderBy: String(query.orderBy || "relevance").trim() || "relevance"
      }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());
      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, page, limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Popular books request failed" });
    }
  }

  // -------- TRENDING (period-aware, multi-source cascade) --------
  if (section === "trending") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const period = String(query.period || "weekly").toLowerCase();
      const validPeriod = ["daily", "weekly", "monthly"].includes(period) ? period : "weekly";

      // Cascade:
      //   1. Curated hand-picked seeds for the period (highest quality)
      //   2. Period-tuned query against Google Books / Open Library
      //   3. Generic "trending fiction" query (broadest)
      const periodQueries = {
        daily: "bestseller fiction 2025",
        weekly: "bestseller fiction",
        monthly: "popular fiction classic"
      };

      const seeds = Array.isArray(CURATED_BOOK_SEEDS_BY_PERIOD[validPeriod])
        ? CURATED_BOOK_SEEDS_BY_PERIOD[validPeriod]
        : [];

      let result = await runBookPipeline({
        q: periodQueries[validPeriod],
        orderBy: "relevance", limit: Math.max(limit, 40), page: 1, language: "en"
      }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());

      let books = Array.isArray(result.books) ? result.books : [];

      // If we have curated seeds, prepend the best matches to ensure
      // the hand-picked popular books always lead the rail.
      if (seeds.length && books.length && typeof runCuratedDiscoveryServer === "function") {
        const curated = runCuratedDiscoveryServer(books, seeds, { limit: Math.ceil(limit / 2) });
        if (curated && Array.isArray(curated.books) && curated.books.length) {
          const seen = new Set(curated.books.map((b) => String(b && b.id || "")));
          books = curated.books.concat(books.filter((b) => !seen.has(String(b && b.id || ""))));
          books = books.slice(0, limit);
        }
      }

      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books,
        meta: {
          source: result.source, period: validPeriod, limit,
          numFound: Math.max(Number(result.numFound || 0), books.length),
          curated: seeds.length > 0
        }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Trending books request failed" });
    }
  }

  // -------- DISCOVER (NEW: sectioned discovery, server-cached) --------
  if (section === "discover") {
    try {
      const cacheKey = "discover:all";
      const now = Date.now();
      const cached = DISCOVERY_CACHE.get(cacheKey);
      if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
        res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
        return res.json(cached.v);
      }
      const sections = await Promise.allSettled(DISCOVERY_SECTIONS.map(async (sec) => {
        const result = await runBookPipeline({
          q: sec.query || (sec.subject ? `popular ${sec.subject} books` : "bestseller fiction"),
          subject: sec.subject || "",
          orderBy: sec.orderBy || "relevance",
          limit: sec.limit || 18,
          page: 1, language: "en"
        }, { strict: true, enrichCovers: true, groupEditions: true }, getBooksKey());
        return {
          id: sec.id, label: sec.label, desc: sec.desc,
          books: result.books
        };
      }));
      const payload = {
        ok: true,
        sections: sections
          .map((s) => s.status === "fulfilled" ? s.value : null)
          .filter((s) => s && s.books && s.books.length)
      };
      DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });
      // Trim cache so it doesn't grow forever.
      if (DISCOVERY_CACHE.size > 32) {
        const oldest = DISCOVERY_CACHE.keys().next().value;
        if (oldest) DISCOVERY_CACHE.delete(oldest);
      }
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(payload);
    } catch (error) {
      return res.status(502).json({ ok: false, message: error?.message || "Discover request failed" });
    }
  }

  // -------- Catch-all proxy (volumes/ID etc.) --------
  if (section) {
    try {
      const key = getBooksKey();
      const relativePath = pathParts.join("/");
      const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
      Object.entries(query || {}).forEach(([paramKey, value]) => {
        if (paramKey === "path") return;
        pushQueryParam(url.searchParams, paramKey, value);
      });
      if (key && !url.searchParams.get("key")) url.searchParams.set("key", key);
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const booksRes = await fetch(url.toString());
          const text = await booksRes.text();
          const retryable = booksRes.status === 429 || booksRes.status >= 500;
          if (!retryable || attempt === 2) {
            res.status(booksRes.status);
            res.setHeader("content-type", booksRes.headers.get("content-type") || "application/json; charset=utf-8");
            return res.send(text);
          }
          lastError = new Error(`Google Books error ${booksRes.status}: ${text}`);
        } catch (error) {
          lastError = error;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
      return res.status(502).json({ message: "Books proxy upstream failure" });
    } catch (error) {
      console.error("Books proxy error:", error.message);
      return res.status(500).json({ message: "Books proxy error" });
    }
  }

  return res.status(404).json({ message: "Not found" });
}
