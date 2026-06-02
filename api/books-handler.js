import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const SUPABASE_KEY_HEADER = "x-zo2y-supabase-key";
const DEFAULT_BOOK_COVER = "/images/patterns/open-book-01.svg";

// Discovery sections returned by /discover - paired with the front-end engine.
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
  { id: "mystery",     label: "mystery + thriller",
    desc: "Page-turners that grip you to the last chapter.",
    subject: "mystery thriller", orderBy: "relevance", limit: 16 },
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
    query: "modern classic novel 20th century", orderBy: "relevance", limit: 16 }
];

// Server-side cache for discovery responses.
const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;

// ----------------------------------------------------------------------
// Pattern-based junk / explicit / non-book filtering. Mirrors the engine.
// ----------------------------------------------------------------------
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
const JUNK_PUBLISHER_PATTERNS = [
  /university press$/i,
  /\b(government printing office|gpo|congressional|hmso)\b/i,
  /\b(elsevier|springer|wiley|taylor & francis|sage publications|emerald)\b/i,
  /\b(ieee|acm|nasa|noaa|usda|cdc)\b/i
];
const EXPLICIT_TEXT_PATTERNS = [
  /\b(erotica|pornographic|sexually explicit|adult content only|hardcore sex)\b/i
];
// Cyrillic / CJK / Hebrew / Arabic / Hangul present in the title is treated as non-English.
const NON_LATIN_TITLE = /[\u3040-\u30ff\u4e00-\u9fff\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\uac00-\ud7af]/;

// Known franchise/author intent boosts (server-side mirror of the engine).
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

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function getBooksKey() { return String(process.env.GOOGLE_BOOKS_KEY || "").trim(); }
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
function toHttpsUrl(value) { return String(value || "").replace(/^http:\/\//i, "https://").trim(); }
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
function rewriteSearchQuery(raw) {
  const clean = String(raw || "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const lower = clean.toLowerCase();
  for (const hint of FRANCHISE_HINTS) {
    for (const k of hint.keys) {
      if (lower === k || lower.startsWith(k) || lower.includes(k)) return hint.hint;
    }
  }
  return clean;
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
// Doc -> Book normalization
// ----------------------------------------------------------------------
function normalizeGoogleBookDoc(volume, idx = 0) {
  const info = volume?.volumeInfo || {};
  const sale = volume?.saleInfo || {};
  const title = String(info?.title || "").trim();
  if (!title) return null;
  const subtitle = String(info?.subtitle || "").trim();
  const authorNames = Array.isArray(info?.authors)
    ? info.authors.map((name) => String(name || "").trim()).filter(Boolean)
    : [];
  const published = String(info?.publishedDate || "").trim();
  const yearMatch = published.match(/\d{4}/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const categories = Array.isArray(info?.categories)
    ? info.categories.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const publisher = String(info?.publisher || "").trim();
  const language = String(info?.language || "").trim().toLowerCase();
  // Prefer the largest image link if Google returned multiple sizes.
  const imageLinks = info?.imageLinks || {};
  const thumbRaw = imageLinks.extraLarge || imageLinks.large || imageLinks.medium ||
                   imageLinks.thumbnail || imageLinks.smallThumbnail || "";
  let thumb = toHttpsUrl(thumbRaw);
  // Strip `&edge=curl` and `&zoom=N` and use zoom=2 for better quality covers.
  if (thumb && /books\.google/i.test(thumb)) {
    thumb = thumb.replace(/&edge=curl/i, "").replace(/&zoom=\d/i, "");
    if (!/zoom=/i.test(thumb)) thumb += "&zoom=2";
  }
  return {
    id: String(volume?.id || "").trim() || null,
    title: subtitle ? title : title,
    subtitle: subtitle,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: Number.isFinite(year) ? year : null,
    subject: categories,
    publisher: publisher ? [publisher] : [],
    coverImage: thumb || "",
    description: String(info?.description || "").trim(),
    language: language || "",
    rating: Number(info?.averageRating || 0) || 0,
    ratingCount: Number(info?.ratingsCount || 0) || 0,
    saleability: String(sale?.saleability || "").toLowerCase(),
    maturityRating: String(info?.maturityRating || "").trim(),
    pageCount: Number(info?.pageCount || 0) || 0,
    _googleThumbnail: thumb || "",
    _googleVolumeId: String(volume?.id || "").trim(),
    _source: "google-books"
  };
}

function normalizeBook(input) {
  if (!input) return null;
  const title = String(input?.title || input?.name || "").trim();
  if (!title) return null;
  const rawId = String(input?.id || "").trim();
  const googleId = String(input?._googleVolumeId || "").trim();
  const id = rawId || googleId || "";
  const authorCandidate = Array.isArray(input?.author_name)
    ? String(input.author_name[0] || "").trim()
    : String(input?.author || input?.authors || "").trim();
  const author = authorCandidate || "Unknown author";
  const year = Number(input?.first_publish_year || input?.published_year || input?.year || 0) || null;
  const cover = toHttpsUrl(input?.cover || input?.coverImage || input?.thumbnail || input?._googleThumbnail || "") || "";
  const source = String(input?._source || "").trim() || "google-books";
  return {
    id,
    title,
    author,
    year,
    cover: cover || DEFAULT_BOOK_COVER,
    source,
    language: String(input?.language || "").toLowerCase() || "",
    rating: Number(input?.rating || 0) || 0,
    ratingCount: Number(input?.ratingCount || 0) || 0,
    publisher: Array.isArray(input?.publisher) ? input.publisher[0] : String(input?.publisher || "").trim() || "",
    subjects: Array.isArray(input?.subject) ? input.subject.slice(0, 8)
            : Array.isArray(input?.subjects) ? input.subjects.slice(0, 8)
            : [],
    description: String(input?.description || "").trim(),
    contentType: detectContentType(input),
    maturityRating: String(input?.maturityRating || "").trim()
  };
}

// ----------------------------------------------------------------------
// Content-type classifier
// ----------------------------------------------------------------------
function detectContentType(doc) {
  const title = String(doc?.title || "");
  const publisher = Array.isArray(doc?.publisher) ? doc.publisher.join(" ") : String(doc?.publisher || "");
  const subjects = Array.isArray(doc?.subject) ? doc.subject.join(" ")
                 : Array.isArray(doc?.subjects) ? doc.subjects.join(" ") : String(doc?.subjects || "");
  const all = [title, publisher, subjects].join(" ");
  if (/\b(proceedings|symposium|conference|dissertation|thesis|workshop|colloquium)\b/i.test(all)) return "academic";
  if (/\b(annual report|technical report|white paper|working paper|hearing before|federal register|congressional|gpo)\b/i.test(all)) return "report";
  if (/\b(bulletin|gazette|newsletter|periodical|magazine|journal of)\b/i.test(all)) return "periodical";
  if (/\b(study guide|workbook|exam prep|test prep|cliffs notes|sparknotes|textbook|syllabus)\b/i.test(all)) return "study-aid";
  if (/\b(catalog|catalogue|directory|almanac|encyclopedia|dictionary)\b/i.test(all)) return "reference";
  if (/\b(comic|graphic novel)\b/i.test(all)) return "graphic";
  return "book";
}

// ----------------------------------------------------------------------
// Filtering
// ----------------------------------------------------------------------
function getDocText(doc = {}) {
  const parts = [
    doc?.title, doc?.subtitle,
    Array.isArray(doc?.author_name) ? doc.author_name.join(" ") : doc?.author || doc?.authors,
    Array.isArray(doc?.subject) ? doc.subject.join(" ") : doc?.subject,
    Array.isArray(doc?.publisher) ? doc.publisher.join(" ") : doc?.publisher,
    doc?.description, doc?.maturityRating, doc?._source
  ];
  return parts.map((entry) => String(entry || "").trim()).filter(Boolean).join(" ");
}
function isJunkBookDoc(doc = {}, opts = {}) {
  const title = String(doc?.title || "").trim();
  if (!title) return true;
  const text = getDocText(doc);
  if (EXPLICIT_TEXT_PATTERNS.some((p) => p.test(text))) return true;
  const maturity = String(doc?.maturityRating || "").toLowerCase();
  if (maturity && maturity !== "not_mature" && maturity.includes("mature")) return true;
  for (const p of JUNK_TITLE_PATTERNS) if (p.test(title)) return true;
  const pub = Array.isArray(doc?.publisher) ? doc.publisher.join(" ") : String(doc?.publisher || "");
  if (pub) for (const p of JUNK_PUBLISHER_PATTERNS) if (p.test(pub)) return true;
  // For discovery (no query): also strip results that don't look like books at all.
  if (opts.strict !== false) {
    const ct = detectContentType(doc);
    if (ct === "academic" || ct === "report" || ct === "periodical" || ct === "study-aid") return true;
  }
  return false;
}
function filterSafeBookDocs(docs = [], opts = {}) {
  return (Array.isArray(docs) ? docs : []).filter((doc) => !isJunkBookDoc(doc, opts));
}

// ----------------------------------------------------------------------
// Scoring (English-first, popularity-first, recognition-first)
// ----------------------------------------------------------------------
function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function scoreCoverQuality(doc) {
  const url = String(doc?.coverImage || doc?._googleThumbnail || "");
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
  const title = String(doc?.title || "");
  const lang = String(doc?.language || "").toLowerCase();
  if (lang === "en" || lang === "eng") s += 60;
  else if (lang && lang !== "en") s -= 80;
  if (NON_LATIN_TITLE.test(title)) s -= 220;
  return s;
}
function scoreMetadata(doc) {
  let s = 0;
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  if (authors.length && authors[0] !== "Unknown author") s += 20;
  const y = Number(doc?.first_publish_year || 0);
  if (y >= 2024) s += 14;
  else if (y >= 2020) s += 10;
  else if (y >= 2010) s += 6;
  else if (y && y < 1900) s -= 8;
  const cats = Array.isArray(doc?.subject) ? doc.subject : [];
  if (cats.length) s += 5;
  if (String(doc?.description || "").length > 80) s += 6;
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
  const t = normalizeText(doc?.title || "");
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const a = normalizeText(authors[0] || "");
  let s = 0;
  if (t === q) s += 120;
  else if (t.startsWith(q)) s += 80;
  else if (t.includes(q)) s += 50;
  if (a && q.includes(a)) s += 30;
  if (a && a.includes(q)) s += 20;
  return s;
}
function scoreBookDoc(doc, opts = {}) {
  return scoreCoverQuality(doc)
       + scoreEnglishConfidence(doc)
       + scoreMetadata(doc)
       + scorePopularity(doc)
       + scoreQueryRelevance(doc, opts.query);
}
function rankDocs(docs, opts = {}) {
  return (Array.isArray(docs) ? docs.slice() : []).sort((a, b) => scoreBookDoc(b, opts) - scoreBookDoc(a, opts));
}

// ----------------------------------------------------------------------
// Edition grouping (collapse same work, keep best edition)
// ----------------------------------------------------------------------
function editionKey(doc) {
  let t = normalizeText(doc?.title || "")
    .replace(/\b(illustrated|deluxe|special|collectors?|anniversary|boxed?\s*set|complete|definitive|annotated|abridged|unabridged|revised|updated|edition|vol(?:ume)?\s*\d+|book\s*\d+|part\s*\d+)\b/g, " ")
    .replace(/[:|\-].*$/, "")
    .replace(/\s+/g, " ").trim();
  const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
  const a = normalizeText(authors[0] || "").split(" ").slice(0, 3).join(" ");
  if (!t) return "";
  return t + "::" + a;
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

// ----------------------------------------------------------------------
// Cover enrichment - upgrade missing covers via Open Library
// ----------------------------------------------------------------------
async function enrichMissingCovers(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const missing = list.filter((d) => d && !d.coverImage);
  if (!missing.length) return list;
  await Promise.allSettled(missing.map(async (doc) => {
    try {
      const title = String(doc?.title || "").trim();
      const authors = Array.isArray(doc?.author_name) ? doc.author_name : [];
      const author = String(authors[0] || "").trim();
      if (!title) return;
      const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
      url.searchParams.set("title", title);
      if (author && author !== "Unknown author") url.searchParams.set("author", author);
      url.searchParams.set("limit", "5");
      const res = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 2);
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
  return list;
}

// ----------------------------------------------------------------------
// Google Books query builder + fetcher (always printType=books + langRestrict)
// ----------------------------------------------------------------------
function buildGoogleQuery(params = {}) {
  const qRaw = rewriteSearchQuery(params?.q);
  const title = String(params?.title || "").trim();
  const author = String(params?.author || "").trim();
  const subject = String(params?.subject || "").trim();
  const yearFrom = String(params?.year_from || "").trim();
  const yearTo = String(params?.year_to || "").trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title) chunks.push(`intitle:"${title}"`);
  if (author) chunks.push(`inauthor:"${author}"`);
  if (subject) chunks.push(`subject:${subject}`);
  if (yearFrom && yearTo) chunks.push(`publishedDate:${yearFrom}-${yearTo}`);
  else if (yearFrom) chunks.push(`publishedDate:>=${yearFrom}`);
  else if (yearTo) chunks.push(`publishedDate:<=${yearTo}`);
  return chunks.join(" ").trim();
}
async function fetchGoogleDocs(params = {}) {
  const key = getBooksKey();
  const query = buildGoogleQuery(params);
  if (!query) return { docs: [], numFound: 0, source: "google-books" };
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);
  const startIndex = clampInt(params.startIndex, 0, 2000, (page - 1) * limit);
  const orderBy = String(params.orderBy || "").trim();
  let lang = String(params.language || params.lang || "en").trim().toLowerCase();
  if (lang === "eng") lang = "en";
  if (lang.length > 2) lang = lang.slice(0, 2);

  const url = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
  url.searchParams.set("q", query);
  url.searchParams.set("printType", "books");
  if (lang) url.searchParams.set("langRestrict", lang);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("startIndex", String(Math.max(0, startIndex)));
  if (orderBy === "newest" || orderBy === "relevance") url.searchParams.set("orderBy", orderBy);
  if (key) url.searchParams.set("key", key);

  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) return { docs: [], numFound: 0, source: "google-books" };

  const json = await upstream.json();
  const items = Array.isArray(json?.items) ? json.items : [];
  const docs = items.map((entry, idx) => normalizeGoogleBookDoc(entry, idx)).filter(Boolean);
  const totalItems = Number(json?.totalItems || 0);
  return {
    docs,
    numFound: Number.isFinite(totalItems) && totalItems > 0 ? totalItems : docs.length,
    source: "google-books"
  };
}

// ----------------------------------------------------------------------
// Pipeline: fetch -> filter -> enrich -> rank -> group editions -> normalize
// ----------------------------------------------------------------------
async function runBookPipeline(params, opts = {}) {
  const google = await fetchGoogleDocs(params);
  let docs = Array.isArray(google.docs) ? google.docs : [];
  docs = filterSafeBookDocs(docs, { strict: opts.strict !== false });
  if (opts.enrichCovers !== false) docs = await enrichMissingCovers(docs);
  docs = rankDocs(docs, { query: params.q || params.title || "" });
  if (opts.groupEditions !== false) docs = groupBestEditions(docs, { query: params.q || params.title || "" });
  const books = docs.map(normalizeBook).filter(Boolean);
  return { books, numFound: google.numFound, source: google.source };
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
      }, { strict: false, enrichCovers: true, groupEditions: true });
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
      }, { strict: true, enrichCovers: true, groupEditions: true });
      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, page, limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Popular books request failed" });
    }
  }

  // -------- TRENDING (Google Books primary - no more Open Library primary) --------
  if (section === "trending") {
    try {
      const limit = clampInt(query.limit, 1, 40, 24);
      const result = await runBookPipeline({
        q: "trending fiction novel bestseller 2026",
        orderBy: "relevance", limit, page: 1, language: "en"
      }, { strict: true, enrichCovers: true, groupEditions: true });
      res.setHeader("Cache-Control", "public, max-age=180, s-maxage=600, stale-while-revalidate=1200");
      return res.json({
        ok: true, books: result.books,
        meta: { source: result.source, period: "weekly", limit, numFound: Math.max(Number(result.numFound || 0), result.books.length) }
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
        }, { strict: true, enrichCovers: true, groupEditions: true });
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
