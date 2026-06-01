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
const CURRENT_YEAR = new Date().getUTCFullYear();
const DISCOVERY_QUERIES = [
  "bestseller fiction",
  "new release fiction",
  "award winning fiction",
  "popular fantasy",
  "popular thriller",
  "popular sci fi"
];
const POPULAR_SERIES = [
  "harry potter",
  "the boys",
  "a court of thorns and roses",
  "the hunger games",
  "percy jackson",
  "lord of the rings",
  "dune",
  "wings of fire",
  "diary of a wimpy kid"
];
const KNOWN_AUTHORS = [
  "j k rowling",
  "jk rowling",
  "g t karber",
  "gillian flynn",
  "freida mcfadden",
  "rebecca yarros",
  "andy weir",
  "james clear",
  "matt haig",
  "alex michaelides",
  "r f kuang",
  "gabrielle zevin",
  "kristin hannah",
  "stephen king",
  "suzanne collins",
  "rick riordan",
  "garth ennis",
  "darick robertson"
];
const JUNK_TEXT_PATTERNS = [
  /\b(newspaper|magazine|periodical|journal|proceedings|conference|symposium|report|annual report)\b/i,
  /\b(government|bureau|department|committee|commission|census|gazette|archive|archives)\b/i,
  /\b(manual|catalogue|catalog|directory|bulletin|pamphlet|microform|thesis|dissertation)\b/i,
  /\b(scanned|scan|public domain|historical document|academic pdf|working paper)\b/i,
  /\b(textbook|study guide|workbook|coursebook|student guide|teacher guide)\b/i,
  /\b(newsletter|bulletin|gazette|chronicle|times|herald|tribune|post|observer)\b/i,
  /\b(proceedings|transactions|lecture notes|seminar|workshop|colloquium)\b/i,
  /\b(dissertation|thesis|monograph|treatise|compilation|anthology)\b/i,
  /\b(digitized|microfilm|microfiche|reprint|facsimile|transcription)\b/i
];
const EXPLICIT_TEXT_PATTERNS = [
  /\b(erotica|explicit|adult|pornographic|mature audience|sexual content)\b/i
];

function getBooksKey() {
  return String(process.env.GOOGLE_BOOKS_KEY || "").trim();
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toHttpsUrl(value) {
  return String(value || "").replace(/^http:\/\//i, "https://").trim();
}

function normalizeBook(input) {
  if (!input) return null;

  const title = String(input?.title || input?.name || "").trim();
  if (!title) return null;

  const rawId = String(input?.id || "").trim();
  const rawKey = String(input?.key || "").trim();
  const googleId = String(input?._googleVolumeId || "").trim();
  const idFromKey = rawKey.startsWith("/works/") ? rawKey.replace("/works/", "").trim() : rawKey;
  const id = rawId || googleId || idFromKey || "";

  const authorCandidate = Array.isArray(input?.author_name)
    ? String(input.author_name[0] || "").trim()
    : String(input?.author || input?.authors || "").trim();
  const author = authorCandidate || "Unknown author";

  const year = Number(input?.first_publish_year || input?.published_year || input?.year || 0) || null;
  const coverCandidate = toHttpsUrl(input?.cover || input?.coverImage || input?.thumbnail || input?._googleThumbnail || "");
  const cover = coverCandidate || DEFAULT_BOOK_COVER;

  const source = String(input?._source || input?.source || "").trim()
    || (googleId ? "google-books" : (rawKey ? "openlibrary" : "book"));

  return { id, title, author, year, cover, source };
}

function normalizeRankText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDocAuthors(doc = {}) {
  if (Array.isArray(doc?.author_name)) return doc.author_name.map((entry) => String(entry || "").trim()).filter(Boolean);
  return String(doc?.author || doc?.authors || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getDocText(doc = {}) {
  const parts = [
    doc?.title,
    getDocAuthors(doc).join(" "),
    Array.isArray(doc?.subject) ? doc.subject.join(" ") : doc?.subject,
    Array.isArray(doc?.publisher) ? doc.publisher.join(" ") : doc?.publisher,
    doc?.description,
    doc?.maturityRating,
    doc?._source
  ];
  return parts.map((entry) => String(entry || "").trim()).filter(Boolean).join(" ");
}

function isJunkBookDoc(doc = {}) {
  const text = getDocText(doc);
  if (!String(doc?.title || "").trim()) return true;
  if (EXPLICIT_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (JUNK_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  const maturity = String(doc?.maturityRating || "").toLowerCase();
  if (maturity && maturity !== "not_mature" && maturity.includes("mature")) return true;
  return false;
}

function filterSafeBookDocs(docs = []) {
  return (Array.isArray(docs) ? docs : []).filter((doc) => !isJunkBookDoc(doc));
}

function detectContentType(doc = {}) {
  const text = getDocText(doc);
  const title = String(doc?.title || "").toLowerCase();
  const subjects = Array.isArray(doc?.subject) ? doc.subject.join(" ") : String(doc?.subject || "").toLowerCase();
  const publisher = Array.isArray(doc?.publisher) ? doc.publisher[0] || "" : String(doc?.publisher || "").toLowerCase();
  const haystack = `${title} ${subjects} ${publisher}`;

  if (/\b(newspaper|magazine|periodical|newsletter|gazette|chronicle|bulletin)\b/i.test(haystack)) return "periodical";
  if (/\b(proceedings|conference|symposium|seminar|workshop|colloquium|lecture notes)\b/i.test(haystack)) return "academic";
  if (/\b(textbook|study guide|workbook|coursebook|student guide|teacher guide)\b/i.test(haystack)) return "textbook";
  if (/\b(thesis|dissertation|monograph|treatise)\b/i.test(haystack)) return "academic";
  if (/\b(manual|handbook|guidebook|catalogue|catalog|directory|pamphlet|microform)\b/i.test(haystack)) return "reference";
  if (/\b(report|annual report|government|bureau|department|committee|commission|census)\b/i.test(haystack)) return "report";
  if (/\b(scanned|scan|public domain|historical document|academic pdf|working paper|digitized|microfilm|microfiche|reprint|facsimile)\b/i.test(haystack)) return "archive";
  if (/\b(erotica|explicit|adult|pornographic|mature audience|sexual content)\b/i.test(haystack)) return "explicit";
  return "book";
}

function hasQualityCover(doc = {}) {
  const cover = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || doc?.cover || doc?.thumbnail || "");
  if (!cover || cover === DEFAULT_BOOK_COVER) return false;
  if (/placeholder|nocover|no-cover|default|blank/i.test(cover)) return false;
  return /^https:\/\//i.test(cover);
}

function scoreCoverQuality(doc = {}) {
  if (!hasQualityCover(doc)) return -120;
  const cover = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || "");
  let score = 50;
  if (/zoom=|edge=curl|books\.google/i.test(cover)) score += 30;
  if (/covers\.openlibrary\.org\/b\/id\/.+-L\.jpg/i.test(cover)) score += 18;
  if (doc?._googleThumbnail || doc?._googleVolumeId) score += 24;
  return score;
}

function scoreSeededBookMatch(row, seed) {
  const normalizedTitle = normalizeRankText(row?.title || "");
  const normalizedAuthor = normalizeRankText(getDocAuthors(row)[0] || "");
  const seedTitle = normalizeRankText(seed?.title || "");
  const seedAuthor = normalizeRankText(seed?.author || "");
  const rowYear = Number(row?.first_publish_year || row?.year || 0) || 0;
  const seedYear = Number(seed?.year || 0) || 0;
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
  score += scoreCoverQuality(row);
  if (rowYear) score += 8;
  if (seedYear && rowYear === seedYear) score += 24;
  if (rowYear >= 2020 && rowYear <= CURRENT_YEAR + 1) score += 16;
  return score;
}

function scoreBookSearchResult(doc = {}, query = "") {
  const q = normalizeRankText(query);
  const title = normalizeRankText(doc?.title || "");
  const authors = normalizeRankText(getDocAuthors(doc).join(" "));
  const haystack = normalizeRankText(getDocText(doc));
  const year = Number(doc?.first_publish_year || doc?.year || 0) || 0;
  let score = 0;

  if (q && title) {
    if (title === q) score += 500;
    else if (title.startsWith(q)) score += 360;
    else if (title.includes(q)) score += 260;
    const queryTokens = q.split(" ").filter(Boolean);
    const titleTokenHits = queryTokens.filter((token) => title.includes(token)).length;
    if (queryTokens.length && titleTokenHits === queryTokens.length) score += 180;
  }

  if (q && POPULAR_SERIES.some((series) => q.includes(series) || title.includes(series))) score += 300;
  if (POPULAR_SERIES.some((series) => title.includes(series))) score += 200;
  if (authors && KNOWN_AUTHORS.some((author) => authors.includes(author))) score += 100;
  if (haystack.includes("english") || doc?._source === "google-books") score += 150;
  score += scoreCoverQuality(doc);
  if (year >= 1990 && year <= CURRENT_YEAR + 1) score += 50;
  if (year && year < 1950) score -= 180;
  if (doc?._source === "openlibrary" && !doc?._googleThumbnail) score -= 40;
  if (isJunkBookDoc(doc)) score -= 700;

  return score;
}

function sortBookDocsForQuery(docs = [], query = "") {
  return filterSafeBookDocs(docs).slice().sort((a, b) => {
    const diff = scoreBookSearchResult(b, query) - scoreBookSearchResult(a, query);
    if (diff) return diff;
    return scoreCoverQuality(b) - scoreCoverQuality(a);
  });
}

function buildDiscoveryQuery(page = 1, subject = "") {
  const cleanSubject = String(subject || "").trim();
  if (cleanSubject && cleanSubject !== "fiction") return `popular ${cleanSubject}`;
  const index = Math.max(0, (Number(page || 1) - 1) % DISCOVERY_QUERIES.length);
  return DISCOVERY_QUERIES[index];
}

function normalizeSearchQueryForBooks(raw) {
  const normalized = String(raw || "").trim().replace(/\s+/g, " ");
  const lowered = normalizeRankText(normalized);
  if (lowered === "the boys") return 'intitle:"The Boys" comics graphic novel';
  if (lowered === "housemaid") return 'intitle:"The Housemaid" Freida McFadden';
  if (lowered === "harry potter") return 'intitle:"Harry Potter" J.K. Rowling';
  return normalized;
}

function dedupeBooks(rows = [], limit = 20) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    const title = String(row?.title || "").trim().toLowerCase();
    const author = String(row?.author || "").trim().toLowerCase();
    const id = String(row?.id || "").trim().toLowerCase();
    const key = id || `${title}::${author}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
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
    const joined = value
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .join(", ");
    return joined || null;
  }
  const text = String(value || "").trim();
  return text || null;
}

function normalizeCategories(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .map((entry) => String(entry || "").trim())
    .filter(Boolean)
    .slice(0, 40);
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
    id,
    title,
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

async function testBooksAuth({ supabaseUrl, apikey, bearerToken }) {
  if (!supabaseUrl || !apikey || !bearerToken) {
    return { ok: false, configured: false, status: 0, message: "Missing SUPABASE_URL / apikey / bearer token" };
  }

  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/books?select=id&limit=1`;
  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        apikey,
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json"
      }
    });

    if (upstream.ok) {
      return { ok: true, configured: true, status: upstream.status };
    }

    const text = await upstream.text().catch(() => "");
    return {
      ok: false,
      configured: true,
      status: upstream.status,
      message: text || `Books query failed (${upstream.status})`
    };
  } catch (error) {
    return { ok: false, configured: true, status: 0, message: error?.message || "Network error" };
  }
}

function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === undefined || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}

function buildGoogleQuery(params = {}) {
  const qRaw = normalizeSearchQueryForBooks(params?.q);
  const title = String(params?.title || "").trim();
  const author = String(params?.author || "").trim();
  const subject = String(params?.subject || "").trim();
  const year = String(params?.first_publish_year || params?.year || "").trim();
  const chunks = [];
  if (qRaw) chunks.push(qRaw);
  if (title) chunks.push(`intitle:"${title}"`);
  if (author) chunks.push(`inauthor:"${author}"`);
  if (subject) chunks.push(`subject:${subject}`);
  if (year) chunks.push(year);
  return chunks.join(" ").trim();
}

function buildOpenLibraryCoverUrl(doc = {}, size = "L") {
  const safeSize = ["S", "M", "L"].includes(String(size || "").toUpperCase())
    ? String(size || "L").toUpperCase()
    : "L";
  const coverId = Number(doc?.cover_i || 0) || 0;
  if (coverId > 0) {
    return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
  }
  const isbnRaw = Array.isArray(doc?.isbn) ? String(doc.isbn[0] || "").trim() : "";
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, "");
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${safeSize}.jpg`;
  }
  return "";
}

function normalizeGoogleBookDoc(volume, idx = 0) {
  const info = volume?.volumeInfo || {};
  const title = String(info?.title || `Book ${idx + 1}`).trim();
  if (!title) return null;
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
  const identifiers = Array.isArray(info?.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn = identifiers
    .map((entry) => String(entry?.identifier || "").replace(/[^0-9Xx]/g, ""))
    .filter(Boolean);
  const thumb = toHttpsUrl(info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || "");
  const previewLink = toHttpsUrl(info?.previewLink || "");
  const infoLink = toHttpsUrl(info?.infoLink || "");

  const normalized = {
    key: "",
    title,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: Number.isFinite(year) ? year : null,
    isbn,
    subject: categories,
    publisher: publisher ? [publisher] : [],
    cover_i: null,
    coverImage: thumb || "",
    _googleThumbnail: thumb || "",
    _googleVolumeId: String(volume?.id || "").trim(),
    _source: "google-books",
    _previewLink: previewLink,
    _infoLink: infoLink
  };
  normalized._contentType = detectContentType(normalized);
  return normalized;
}

function normalizeOpenLibraryDoc(doc, idx = 0) {
  const title = String(doc?.title || `Book ${idx + 1}`).trim();
  if (!title) return null;
  const authorNames = Array.isArray(doc?.author_name)
    ? doc.author_name.map((name) => String(name || "").trim()).filter(Boolean)
    : [];
  const coverId = Number(doc?.cover_i || 0) || null;
  const firstYear = Number(doc?.first_publish_year || 0) || null;
  const isbn = Array.isArray(doc?.isbn)
    ? doc.isbn.map((entry) => String(entry || "").replace(/[^0-9Xx]/g, "")).filter(Boolean)
    : [];
  const publishers = Array.isArray(doc?.publisher)
    ? doc.publisher.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const subjects = Array.isArray(doc?.subject)
    ? doc.subject.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const key = String(doc?.key || "").trim();
  const coverImage = buildOpenLibraryCoverUrl({ cover_i: coverId, isbn }, "L");

  const normalized = {
    key,
    title,
    author_name: authorNames.length ? authorNames : ["Unknown author"],
    first_publish_year: firstYear,
    isbn,
    subject: subjects,
    publisher: publishers,
    cover_i: coverId,
    coverImage: coverImage || "",
    _googleThumbnail: "",
    _googleVolumeId: "",
    _source: "openlibrary"
  };
  normalized._contentType = detectContentType(normalized);
  return normalized;
}

function dedupeDocs(rows = [], limit = 20) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (!row) continue;
    const title = String(row?.title || "").trim().toLowerCase();
    const author = String((Array.isArray(row?.author_name) ? row.author_name[0] : "") || "").trim().toLowerCase();
    const key = `${title}::${author}`;
    if (!title || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

function hasUsableCover(doc) {
  const googleThumb = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || "");
  if (googleThumb) return true;
  return !!buildOpenLibraryCoverUrl(doc, "L");
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
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 280 * (attempt + 1)));
    }
  }
  if (lastError) throw lastError;
  throw new Error("Upstream request failed");
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
  if (orderBy === "newest" || orderBy === "relevance") {
    url.searchParams.set("orderBy", orderBy);
  }
  if (key) url.searchParams.set("key", key);

  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "google-books" };
  }

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

async function fetchOpenLibraryDocs(params = {}) {
  const limit = clampInt(params.limit, 1, 40, 20);
  const page = clampInt(params.page, 1, 1000, 1);
  const q = String(params.q || "").trim();
  const title = String(params.title || "").trim();
  const author = String(params.author || "").trim();
  const subject = String(params.subject || "").trim();
  const year = String(params.first_publish_year || params.year || "").trim();

  const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
  if (q) url.searchParams.set("q", q);
  if (!q && title) url.searchParams.set("title", title);
  if (author) url.searchParams.set("author", author);
  if (subject) url.searchParams.set("subject", subject);
  if (year) url.searchParams.set("first_publish_year", year);
  if (!q && !title && !author && !subject && !year) {
    url.searchParams.set("q", "bestseller");
  }
  if (String(params.language || "").trim()) {
    url.searchParams.set("language", String(params.language).trim());
  } else {
    url.searchParams.set("language", "eng");
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

  const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
  if (!upstream.ok) {
    return { docs: [], numFound: 0, source: "openlibrary" };
  }
  const json = await upstream.json();
  const docsRaw = Array.isArray(json?.docs) ? json.docs : [];
  const docs = docsRaw.map((doc, idx) => normalizeOpenLibraryDoc(doc, idx)).filter(Boolean);
  return {
    docs,
    numFound: Number(json?.numFound || 0) || docs.length,
    source: "openlibrary"
  };
}

async function enrichMissingCoversWithGoogle(docs = [], maxLookups = 8) {
  if (!Array.isArray(docs) || !docs.length) return docs;
  const indexed = docs.map((doc, index) => ({ doc, index }));
  const candidates = indexed.filter(({ doc }) => !hasUsableCover(doc)).slice(0, maxLookups);
  if (!candidates.length) return docs;

  const patches = await Promise.all(
    candidates.map(async ({ doc, index }) => {
      const qParts = [];
      const title = String(doc?.title || "").trim();
      const author = String((Array.isArray(doc?.author_name) ? doc.author_name[0] : "") || "").trim();
      if (title) qParts.push(`intitle:"${title}"`);
      if (author) qParts.push(`inauthor:"${author}"`);
      const q = qParts.join(" ").trim() || [title, author].filter(Boolean).join(" ");
      if (!q) return { index, patch: null };
      try {
        const google = await fetchGoogleDocs({ q, limit: 1, page: 1, orderBy: "relevance" });
        const best = Array.isArray(google.docs) ? google.docs[0] : null;
        if (!best) return { index, patch: null };
        return {
          index,
          patch: {
            ...doc,
            isbn: Array.isArray(doc?.isbn) && doc.isbn.length ? doc.isbn : best.isbn || [],
            first_publish_year: doc?.first_publish_year || best.first_publish_year || null,
            _googleThumbnail: toHttpsUrl(best._googleThumbnail || best.coverImage || ""),
            _googleVolumeId: String(best._googleVolumeId || "").trim(),
            coverImage: toHttpsUrl(best.coverImage || best._googleThumbnail || "")
          }
        };
      } catch (_err) {
        return { index, patch: null };
      }
    })
  );

  if (!patches.some((entry) => entry?.patch)) return docs;
  const nextDocs = docs.slice();
  patches.forEach((entry) => {
    if (!entry?.patch) return;
    nextDocs[entry.index] = entry.patch;
  });
  return nextDocs;
}

async function enrichOpenLibraryDocsWithGoogle(docs = [], maxLookups = 10) {
  if (!Array.isArray(docs) || !docs.length) return [];
  const candidates = docs.slice(0, maxLookups);
  const enriched = await Promise.all(
    candidates.map(async (doc) => {
      const title = String(doc?.title || "").trim();
      const author = String(getDocAuthors(doc)[0] || "").trim();
      if (!title) return doc;
      try {
        const google = await fetchGoogleDocs({
          q: [title, author].filter(Boolean).join(" "),
          title,
          author,
          limit: 3,
          page: 1,
          orderBy: "relevance",
          language: "en"
        });
        const best = sortBookDocsForQuery(google.docs || [], title)[0];
        if (!best || scoreSeededBookMatch(best, { title, author }) < 90) return doc;
        return {
          ...doc,
          isbn: Array.isArray(best?.isbn) && best.isbn.length ? best.isbn : doc.isbn || [],
          first_publish_year: best.first_publish_year || doc.first_publish_year || null,
          subject: Array.isArray(best?.subject) && best.subject.length ? best.subject : doc.subject || [],
          publisher: Array.isArray(best?.publisher) && best.publisher.length ? best.publisher : doc.publisher || [],
          coverImage: toHttpsUrl(best.coverImage || best._googleThumbnail || doc.coverImage || ""),
          _googleThumbnail: toHttpsUrl(best._googleThumbnail || best.coverImage || ""),
          _googleVolumeId: String(best._googleVolumeId || "").trim(),
          _source: "google-books+openlibrary"
        };
      } catch (_error) {
        return doc;
      }
    })
  );
  return enriched;
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}

function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "")
    .split("/")
    .filter(Boolean);
}

function getBearerToken(req) {
  const raw = String(
    req?.headers?.authorization
    || req?.headers?.Authorization
    || ""
  ).trim();
  if (!/^bearer\s+/i.test(raw)) return "";
  return raw.replace(/^bearer\s+/i, "").trim();
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const rawSection = String(pathParts[0] || "").trim().toLowerCase();
  const section = rawSection.replace(/\.json$/i, "");

  if (!section) {
    return res.json({ ok: true, service: "books-proxy", configured: !!getBooksKey() });
  }

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

  if (section === "sync" && String(req.method || "").toUpperCase() === "POST") {
    try {
      let client = getSupabaseAdminClient();
      const body = await readJsonBody(req);
      const payload = sanitizeBookPayload(body || {});
      if (!payload) {
        return res.status(400).json({ ok: false, message: "Missing book id" });
      }

      if (!client) {
        const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
        const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
          || getSupabasePublicKeyFromReq(req);
        const bearerToken = getBearerToken(req);
        if (supabaseUrl && supabaseAnonKey && bearerToken) {
          client = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${bearerToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
          });
        } else {
          const urlSet = Boolean(supabaseUrl);
          const serviceRoleSet = Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim());
          const anonSet = Boolean(supabaseAnonKey);
          return res.status(503).json({
            ok: false,
            message: "Supabase admin not configured",
            hint: `Provide SUPABASE_SERVICE_ROLE_KEY, or send Authorization + ${SUPABASE_KEY_HEADER} with a Supabase publishable/anon key.`,
            required_env: ["SUPABASE_URL"],
            required_secrets: ["SUPABASE_SERVICE_ROLE_KEY"],
            optional_fallback_env: ["SUPABASE_ANON_KEY"],
            supabase_url_set: urlSet,
            supabase_service_role_set: serviceRoleSet,
            supabase_anon_set: anonSet
          });
        }
      }

      const { error } = await client
        .from("books")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        const isRls = String(error?.code || "").trim() === "42501"
          || String(error?.message || "").toLowerCase().includes("row-level security")
          || String(error?.message || "").toLowerCase().includes("permission");
        return res.status(isRls ? 403 : 500).json({
          ok: false,
          message: error.message || "Book sync failed",
          code: error.code || null,
          details: error.details || null,
          hint: isRls ? "RLS blocked book upsert. Apply sql/books_rls_write_policy.sql" : null
        });
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Book sync error:", error?.message);
      return res.status(500).json({ ok: false, message: "Book sync failed" });
    }
  }

  if (section === "search") {
    try {
      const limit = clampInt(query.limit, 1, 40, 20);
      const page = clampInt(query.page, 1, 1000, 1);
      const orderByRaw = String(query.orderBy || "").trim().toLowerCase();
      const orderBy = orderByRaw === "newest" ? "newest" : "relevance";
      const params = {
        q: query.q,
        title: query.title,
        author: query.author,
        subject: query.subject,
        first_publish_year: query.first_publish_year,
        year: query.year,
        language: query.language,
        limit,
        page,
        orderBy
      };

      const google = await fetchGoogleDocs(params);
      let source = google.source;
      let docs = filterSafeBookDocs(Array.isArray(google.docs) ? google.docs : []);
      let numFound = Number(google.numFound || 0);

      if (docs.length < limit) {
        const open = await fetchOpenLibraryDocs(params);
        if (Array.isArray(open.docs) && open.docs.length) {
          const openEnriched = await enrichOpenLibraryDocsWithGoogle(filterSafeBookDocs(open.docs), Math.min(10, limit));
          docs = dedupeDocs([...docs, ...openEnriched], limit * 2);
          numFound = Math.max(numFound, Number(open.numFound || docs.length), docs.length);
          source = docs.length > (google.docs?.length || 0) ? "google-books+openlibrary" : source;
        }
      }

      const enriched = await enrichMissingCoversWithGoogle(sortBookDocsForQuery(docs, String(query.q || query.title || "")), 8);
      const books = dedupeBooks(sortBookDocsForQuery(enriched, String(query.q || query.title || "")).map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source,
          page,
          limit,
          numFound: Math.max(numFound, books.length)
        }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Book search failed" });
    }
  }

  if (section === "popular") {
    try {
      const limit = clampInt(query.limit, 1, 40, 20);
      const page = clampInt(query.page, 1, 1000, 1);
      const subject = String(query.subject || "fiction").trim() || "fiction";
      const q = String(query.q || "").trim() || buildDiscoveryQuery(page, subject);
      const google = await fetchGoogleDocs({
        q,
        limit,
        page,
        language: String(query.language || "en").trim() || "en",
        orderBy: String(query.orderBy || "relevance").trim() || "relevance"
      });

      let docs = filterSafeBookDocs(Array.isArray(google.docs) ? google.docs : []);
      let source = google.source;
      let numFound = Number(google.numFound || 0);

      if (docs.length < limit) {
        const open = await fetchOpenLibraryDocs({
          q: String(query.fallback_q || query.q || subject || "fiction"),
          subject,
          limit,
          page: 1,
          language: "eng"
        });
        if (Array.isArray(open.docs) && open.docs.length) {
          const openEnriched = await enrichOpenLibraryDocsWithGoogle(filterSafeBookDocs(open.docs), Math.min(8, limit));
          docs = dedupeDocs([...docs, ...openEnriched], limit * 2);
          numFound = Math.max(numFound, Number(open.numFound || docs.length), docs.length);
          source = "google-books+openlibrary";
        }
      }

      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      const enriched = await enrichMissingCoversWithGoogle(sortBookDocsForQuery(docs, q), 8);
      const books = dedupeBooks(sortBookDocsForQuery(enriched, q).map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source,
          query: q,
          page,
          limit,
          numFound: Math.max(numFound, books.length)
        }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Popular books request failed" });
    }
  }

  if (section === "trending") {
    try {
      const periodRaw = String(query.period || "weekly").trim().toLowerCase();
      const period = ["daily", "weekly", "monthly"].includes(periodRaw) ? periodRaw : "weekly";
      const limit = clampInt(query.limit, 1, 40, 20);

      let docs = [];
      let source = "google-books";

      const popular = await fetchGoogleDocs({
        q: buildDiscoveryQuery(1, "fiction"),
        orderBy: "relevance",
        limit,
        page: 1,
        language: "en"
      });
      docs = Array.isArray(popular.docs) ? popular.docs : [];

      if (!docs.length) {
        try {
          const url = new URL(`${OPEN_LIBRARY_BASE}/trending/${period}.json`);
          const upstream = await fetchWithRetry(url.toString(), { headers: { Accept: "application/json" } }, 3);
          if (upstream.ok) {
            const json = await upstream.json();
            const works = Array.isArray(json?.works) ? json.works : [];
            docs = dedupeDocs(
              works.map((work, idx) => normalizeOpenLibraryDoc(work, idx)).filter(Boolean),
              limit * 2
            );
            if (docs.length > 0) source = "openlibrary-trending";
          }
        } catch (_olError) {}
      }

      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      const googleEnriched = source === "openlibrary-trending"
        ? await enrichOpenLibraryDocsWithGoogle(filterSafeBookDocs(docs), Math.min(10, limit))
        : filterSafeBookDocs(docs);
      const enriched = await enrichMissingCoversWithGoogle(sortBookDocsForQuery(googleEnriched, "popular fiction"), 8);
      const books = dedupeBooks(sortBookDocsForQuery(enriched, "popular fiction").map(normalizeBook).filter(Boolean), limit);
      return res.json({
        ok: true,
        books,
        meta: {
          source,
          period,
          limit,
          numFound: books.length
        }
      });
    } catch (error) {
      return res.status(502).json({ message: error?.message || "Trending books request failed" });
    }
  }

  if (section) {
    try {
      const key = getBooksKey();
      const relativePath = pathParts.join("/");
      const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
      Object.entries(query || {}).forEach(([paramKey, value]) => {
        if (paramKey === "path") return;
        pushQueryParam(url.searchParams, paramKey, value);
      });
      if (key && !url.searchParams.get("key")) {
        url.searchParams.set("key", key);
      }

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
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }

      return res.status(502).json({ message: "Books proxy upstream failure" });
    } catch (error) {
      console.error("Books proxy error:", error.message);
      return res.status(500).json({ message: "Books proxy error" });
    }
  }

  return res.status(404).json({ message: "Not found" });
}
