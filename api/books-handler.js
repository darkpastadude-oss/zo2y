import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

const OPENLIB_BASE = "https://openlibrary.org";

function setCache(res, opts = {}) {
  const maxAge = Math.max(0, Number(opts.maxAge) || 300);
  const swr = Math.max(0, Number(opts.staleWhileRevalidate) || 900);
  res.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`);
}

function toHttps(url) {
  if (!url) return "";
  return String(url).replace(/^http:/i, "https:");
}

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) { CACHE.delete(key); return null; }
  return hit.value;
}

function cacheSet(key, value, ttl = CACHE_TTL) {
  CACHE.set(key, { value, expiresAt: Date.now() + ttl });
}

async function fetchJson(url, { cacheKey = "", ttlMs = CACHE_TTL, timeoutMs = 8000 } = {}) {
  if (cacheKey) {
    const hit = cacheGet(cacheKey);
    if (hit) return hit;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (cacheKey) cacheSet(cacheKey, json, ttlMs);
    return json;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function mapOpenLibDoc(doc) {
  const id = doc.key ? doc.key.replace("/works/", "").replace("/books/", "") : "";
  const title = String(doc.title || "").trim();
  const authors = Array.isArray(doc.author_name) ? doc.author_name : (doc.author_name ? [doc.author_name] : []);
  const authorStr = authors.join(", ");
  const year = doc.first_publish_year ? String(doc.first_publish_year) : "";
  const image = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : "";
  const genres = Array.isArray(doc.subject) ? doc.subject : [];
  
  return {
    id,
    mediaType: "book",
    title,
    subtitle: authorStr ? `By ${authorStr}` : "",
    author: authorStr,
    authors: authorStr,
    year,
    cover: image,
    image: image,
    backdrop: image,
    description: "",
    genres,
    categories: genres,
    pageCount: doc.number_of_pages_median || 0,
    publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : "",
    rating: doc.ratings_average || 0,
    ratingsCount: doc.readinglog_count || doc.already_read_count || 0,
    language: Array.isArray(doc.language) ? doc.language[0] : "",
    releaseDate: year,
    previewUrl: `https://openlibrary.org/works/${id}`,
    externalUrl: `https://openlibrary.org/works/${id}`,
    _source: "open-library"
  };
}

function mapOpenLibSubjectDoc(doc) {
  const id = doc.key ? doc.key.replace("/works/", "") : "";
  const title = String(doc.title || "").trim();
  const authors = Array.isArray(doc.authors) ? doc.authors.map(a => a.name) : [];
  const authorStr = authors.join(", ");
  const year = doc.first_publish_year ? String(doc.first_publish_year) : "";
  const image = doc.cover_id ? `https://covers.openlibrary.org/b/id/${doc.cover_id}-L.jpg` : "";
  
  return {
    id,
    mediaType: "book",
    title,
    subtitle: authorStr ? `By ${authorStr}` : "",
    author: authorStr,
    authors: authorStr,
    year,
    cover: image,
    image: image,
    backdrop: image,
    description: "",
    genres: [],
    categories: [],
    pageCount: 0,
    publisher: "",
    rating: 0,
    ratingsCount: 0,
    language: "eng",
    releaseDate: year,
    previewUrl: `https://openlibrary.org/works/${id}`,
    externalUrl: `https://openlibrary.org/works/${id}`,
    _source: "open-library"
  };
}

function parseQuery(req) {
  try {
    if (req.query && Object.keys(req.query).length > 0) return req.query;
    const url = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const q = {};
    for (const [k, v] of url.searchParams.entries()) { q[k] = v; }
    return q;
  } catch (_) { return {}; }
}

function getPathParts(query) {
  if (Array.isArray(query.path)) return query.path;
  if (typeof query.path === "string") return query.path.split("/").filter(Boolean);
  return [];
}

export default async function booksHandler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const query = parseQuery(req);
  const pathParts = getPathParts(query);
  const section = String(pathParts[pathParts.length - 1] || "").toLowerCase();

  const openLibFetch = async (endpoint, extraParams = {}) => {
    const url = new URL(`${OPENLIB_BASE}/${endpoint}`);
    Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    return fetchJson(url.toString(), { cacheKey: `ol:${endpoint}:${JSON.stringify(extraParams)}`, ttlMs: 300000 });
  };

  if (section === "search" || section === "volumes") {
    setCache(res, { maxAge: 120, staleWhileRevalidate: 600 });
    const q = String(query.q || "").trim();
    if (!q) return res.status(400).json({ ok: false, message: "Missing query" });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const startIndex = Math.max(0, Number(query.startIndex) || 0);

    try {
      const data = await openLibFetch("search.json", { q, limit: limit * 2, offset: startIndex });
      const rawItems = data.docs || [];
      const total = data.numFound || 0;
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total, items: books });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "trending") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const genre = String(query.genre || "fiction").trim();
    try {
      const data = await openLibFetch(`subjects/${genre}.json`, { limit: limit * 2 });
      const rawItems = data.works || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_id).map(mapOpenLibSubjectDoc).slice(0, limit);
      return res.json({ ok: true, books, total: books.length, genre });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "new-releases") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const currentYear = new Date().getFullYear();
    try {
      const data = await openLibFetch("search.json", {
        q: `first_publish_year:${currentYear} subject:fiction`,
        limit: limit * 2
      });
      const rawItems = data.docs || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "popular") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    try {
      const data = await openLibFetch("search.json", {
        q: `bestseller`,
        sort: `rating`,
        limit: limit * 2
      });
      const rawItems = data.docs || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "editors-picks") {
    setCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = Math.min(Number(query.limit) || 12, 30);
    try {
      const data = await openLibFetch("search.json", {
        q: `(subject:fantasy OR subject:thriller OR subject:romance OR subject:history)`,
        sort: `rating`,
        limit: limit * 2
      });
      const rawItems = data.docs || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "recommendations") {
    setCache(res, { maxAge: 3600, staleWhileRevalidate: 86400 });
    const bookId = String(query.id || "").trim();
    if (!bookId) return res.status(400).json({ ok: false, message: "Missing book id" });
    try {
      const workData = await openLibFetch(`works/${encodeURIComponent(bookId)}.json`);
      const subjects = workData.subjects || [];
      const subjectTerms = subjects.slice(0, 2).join(" OR ");
      const q = subjectTerms ? `subject:(${subjectTerms})` : "bestseller";
      
      const data = await openLibFetch("search.json", { q, limit: 12 * 2 });
      const items = (data.docs || []).filter(doc => doc.key !== `/works/${bookId}`);
      const books = items.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, 12);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  const possibleVolumeId = String(pathParts[pathParts.length - 1] || "").trim();
  if (possibleVolumeId && possibleVolumeId.length > 2) {
    setCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    try {
      const [workData, searchData] = await Promise.all([
        openLibFetch(`works/${encodeURIComponent(possibleVolumeId)}.json`),
        openLibFetch(`search.json`, { q: `key:/works/${encodeURIComponent(possibleVolumeId)}`, limit: 1 })
      ]);
      
      let baseDoc = (searchData.docs && searchData.docs[0]) || { key: `/works/${possibleVolumeId}` };
      let normalized = mapOpenLibDoc(baseDoc);
      
      if (workData.title) normalized.title = workData.title;
      if (workData.description) {
        normalized.description = typeof workData.description === 'string' 
          ? workData.description 
          : (workData.description.value || "");
      }
      
      if (workData.covers && workData.covers.length > 0) {
        normalized.image = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
        normalized.cover = normalized.image;
        normalized.backdrop = normalized.image;
      }

      return res.json(normalized);
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error" });
    }
  }

  return res.status(404).json({ ok: false, message: "Not found" });
}
