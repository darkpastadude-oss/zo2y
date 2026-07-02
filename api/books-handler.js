import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

function getKey() {
  return process.env.GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_KEY || "";
}

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

function normalizeBook(item) {
  const vol = item.volumeInfo || {};
  const id = String(item.id || "");
  const title = String(vol.title || "").trim();
  const subtitle = String(vol.subtitle || "").trim();
  const authors = (vol.authors || []).map(a => String(a).trim()).filter(Boolean);
  const publishedDate = String(vol.publishedDate || "").trim();
  const year = publishedDate ? parseInt(publishedDate.substring(0, 4)) : null;
  const description = String(vol.description || "").trim();
  const categories = (vol.categories || []).map(c => String(c).trim()).filter(Boolean);
  const imageLinks = vol.imageLinks || {};
  const image = toHttps(imageLinks.thumbnail || imageLinks.smallThumbnail || "");
  const pageCount = Number(vol.pageCount) || 0;
  const publisher = String(vol.publisher || "").trim();
  const language = String(vol.language || "").trim();
  const averageRating = Number(vol.averageRating) || 0;
  const ratingsCount = Number(vol.ratingsCount) || 0;
  const previewLink = String(vol.previewLink || "").trim();
  const infoLink = String(vol.infoLink || "").trim();
  const isbn = (vol.industryIdentifiers || []).map(i => i.identifier).filter(Boolean);

  return {
    id,
    mediaType: "book",
    title,
    subtitle,
    authors: authors,
    author: authors.join(", "),
    year,
    description,
    genres: categories,
    categories,
    image,
    backdrop: image,
    rating: averageRating,
    ratingsCount,
    popularity: 0,
    language,
    pageCount,
    publisher,
    previewUrl: previewLink,
    externalUrl: infoLink,
    releaseDate: publishedDate,
    isbn,
    provider: "google-books",
    providerId: id,
    coverColor: ""
  };
}

function normalizeSearchResult(item) {
  const n = normalizeBook(item);
  return {
    id: n.id,
    title: n.title,
    author: n.author,
    year: n.year,
    cover: n.image,
    description: n.description,
    _source: "google-books"
  };
}

function parseQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_) { return {}; }
}

function getPathParts(query) {
  const raw = query?.path;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw || "").split("/").filter(Boolean);
}

export default async function booksHandler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const query = parseQuery(req);
  const pathParts = getPathParts(query);
  const section = String(pathParts[pathParts.length - 1] || "").toLowerCase();
  const key = getKey();

  const googleFetch = async (endpoint, extraParams = {}) => {
    const url = new URL(`${GOOGLE_BOOKS_BASE}/${endpoint}`);
    Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    if (key) url.searchParams.set("key", key);
    return fetchJson(url.toString(), { cacheKey: `gb:${endpoint}:${JSON.stringify(extraParams)}`, ttlMs: 300000 });
  };

  if (section === "search" || section === "volumes") {
    setCache(res, { maxAge: 120, staleWhileRevalidate: 600 });
    const q = String(query.q || "").trim();
    if (!q) return res.status(400).json({ ok: false, message: "Missing query" });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const orderBy = String(query.orderBy || "relevance").trim();
    const langRestrict = String(query.langRestrict || "").trim();
    const startIndex = Math.max(0, Number(query.startIndex) || 0);
    const printType = String(query.printType || "all").trim();
    const filter = String(query.filter || "").trim();

    try {
      const params = { q, maxResults: String(limit), startIndex: String(startIndex) };
      if (orderBy !== "relevance") params.orderBy = orderBy;
      if (langRestrict) params.langRestrict = langRestrict;
      if (printType !== "all") params.printType = printType;
      if (filter) params.filter = filter;

      const data = await googleFetch("volumes", params);
      const items = data.items || [];
      const total = data.totalItems || 0;
      const books = items.map(normalizeSearchResult).filter(b => b.title);
      return res.json({ ok: true, books, total, items: books.map(normalizeBook) });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "trending") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const genre = String(query.genre || "fiction").trim();
    try {
      const data = await googleFetch("volumes", {
        q: `subject:${genre}`,
        maxResults: String(limit),
        orderBy: "relevance"
      });
      const items = data.items || [];
      const books = items.map(normalizeSearchResult).filter(b => b.title);
      return res.json({ ok: true, books, total: books.length, genre });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "new-releases") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    try {
      const data = await googleFetch("volumes", {
        q: "new release 2024 2025 2026",
        maxResults: String(limit),
        orderBy: "newest"
      });
      const items = data.items || [];
      const books = items.map(normalizeSearchResult).filter(b => b.title);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "popular") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    try {
      const data = await googleFetch("volumes", {
        q: "popular books 2024 2025",
        maxResults: String(limit),
        orderBy: "relevance"
      });
      const items = data.items || [];
      const books = items.map(normalizeSearchResult).filter(b => b.title);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "editors-picks") {
    setCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = Math.min(Number(query.limit) || 12, 30);
    try {
      const picks = [
        "subject:fiction orderBy:relevance",
        "subject:nonfiction orderBy:relevance",
        "subject:fantasy orderBy:relevance",
        "subject:romance orderBy:relevance",
        "subject:thriller orderBy:relevance",
        "subject:biography orderBy:relevance",
        "subject:science orderBy:relevance",
        "subject:history orderBy:relevance",
        "subject:self-help orderBy:relevance",
        "subject:poetry orderBy:relevance",
        "subject:mystery orderBy:relevance",
        "subject:young-adult orderBy:relevance"
      ];
      const results = await Promise.all(
        picks.slice(0, limit).map(q => googleFetch("volumes", { q, maxResults: "3" }).catch(() => null))
      );
      const books = [];
      results.forEach(r => {
        if (r && r.items) {
          r.items.forEach(item => {
            const n = normalizeSearchResult(item);
            if (n.title && !books.find(b => b.id === n.id)) books.push(n);
          });
        }
      });
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "recommendations") {
    setCache(res, { maxAge: 3600, staleWhileRevalidate: 86400 });
    const bookId = String(query.id || "").trim();
    if (!bookId) return res.status(400).json({ ok: false, message: "Missing book id" });
    try {
      const detailData = await googleFetch(`volumes/${encodeURIComponent(bookId)}`);
      const vol = detailData.volumeInfo || {};
      const author = (vol.authors || [])[0] || "";
      const category = (vol.categories || [])[0] || "";
      const searchTerms = [category, author].filter(Boolean).join(" ");
      if (!searchTerms) return res.json({ ok: true, books: [], total: 0 });
      const data = await googleFetch("volumes", {
        q: searchTerms,
        maxResults: "12"
      });
      const items = (data.items || []).filter(i => i.id !== bookId);
      const books = items.map(normalizeSearchResult).filter(b => b.title);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "Google Books API error", books: [], total: 0 });
    }
  }

  if (section === "cover") {
    const targetUrl = String(query.url || "").trim();
    if (!targetUrl) return res.status(400).json({ error: "Missing url" });
    try {
      const proxyRes = await fetch(targetUrl, { headers: { "User-Agent": "zo2y-books/1.0" } });
      if (!proxyRes.ok) {
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a2e"/><text x="100" y="150" text-anchor="middle" fill="#666" font-size="14">No Cover</text></svg>'));
      }
      const buffer = await proxyRes.arrayBuffer();
      res.setHeader("Content-Type", proxyRes.headers.get("Content-Type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.end(new Uint8Array(buffer));
    } catch (_) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a2e"/><text x="100" y="150" text-anchor="middle" fill="#666" font-size="14">No Cover</text></svg>'));
    }
  }

  setCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
  return res.json({ ok: true, service: "google-books", configured: !!key });
}
