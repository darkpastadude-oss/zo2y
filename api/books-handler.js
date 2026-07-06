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
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (_) { throw new Error("Invalid JSON"); }
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
  const isbn = (Array.isArray(doc.isbn) ? doc.isbn.find(i => i && i.length === 13) : null) || (Array.isArray(doc.isbn) ? doc.isbn[0] : null) || "";
  const rawCover = isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    : (doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : "");
  const image = rawCover ? `/api/books/cover?url=${encodeURIComponent(rawCover)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorStr)}` : "";
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
    rawCover: rawCover,
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
  const rawImage = doc.cover_id ? `https://covers.openlibrary.org/b/id/${doc.cover_id}-L.jpg` : "";
  const image = rawImage ? `/api/books/cover?url=${encodeURIComponent(rawImage)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorStr)}` : "";
  
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
  try {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const query = parseQuery(req);
  const pathParts = getPathParts(query);
  const section = String(pathParts[pathParts.length - 1] || "").toLowerCase();

  const openLibFetch = async (endpoint, extraParams = {}, timeoutMs = 15000) => {
    const url = new URL(`${OPENLIB_BASE}/${endpoint}`);
    Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    return fetchJson(url.toString(), { cacheKey: `ol2:${endpoint}:${JSON.stringify(extraParams)}`, ttlMs: 300000, timeoutMs });
  };

  if (section === "cover") {
    const targetUrl = String(query.url || "").trim();
    if (!targetUrl) return res.status(400).json({ error: "Missing url" });
    const SVG_FALLBACK = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a2e"/><text x="100" y="150" text-anchor="middle" fill="#666" font-size="14">No Cover</text></svg>';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const proxyRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      clearTimeout(timeout);
      if (proxyRes.ok) {
        const buffer = await proxyRes.arrayBuffer();
        if (buffer.byteLength > 500) {
          res.setHeader("Content-Type", proxyRes.headers.get("Content-Type") || "image/jpeg");
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.end(new Uint8Array(buffer));
        }
      }
    } catch (_) {}

    const title = String(query.title || "").trim();
    const author = String(query.author || "").trim();
    if (title) {
      try {
        const gq = `${title}${author ? ' ' + author : ''}`;
        const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gq)}&maxResults=1&fields=items(volumeInfo(imageLinks))`;
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 5000);
        const gRes = await fetch(gUrl, { signal: controller2.signal });
        clearTimeout(timeout2);
        if (gRes.ok) {
          const gData = await gRes.json();
          const thumb = gData.items?.[0]?.volumeInfo?.imageLinks?.thumbnail || gData.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail || '';
          if (thumb) {
            const imgUrl = thumb.replace(/^http:/i, 'https:');
            const controller3 = new AbortController();
            const timeout3 = setTimeout(() => controller3.abort(), 5000);
            const imgRes = await fetch(imgUrl, { signal: controller3.signal, headers: { "User-Agent": "Mozilla/5.0" } });
            clearTimeout(timeout3);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              res.setHeader("Content-Type", imgRes.headers.get("Content-Type") || "image/jpeg");
              res.setHeader("Cache-Control", "public, max-age=86400");
              return res.end(new Uint8Array(buffer));
            }
          }
        }
      } catch (_) {}
    }

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(Buffer.from(SVG_FALLBACK));
  }

  if (section === "search" || section === "volumes") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 600 });
    const q = String(query.q || "").trim();
    if (!q) return res.status(400).json({ ok: false, message: "Missing query" });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const startIndex = Math.max(0, Number(query.startIndex) || 0);

    // Primary: Google Books API (trending/relevant results)
    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&orderBy=relevance&maxResults=${Math.min(limit, 40)}&startIndex=${startIndex}&printType=books`;
      const data = await fetchJson(gbUrl, { cacheKey: `gb:search:${q}:${startIndex}`, ttlMs: 300000 });
      const items = (data.items || []).map(item => {
        const vi = item.volumeInfo || {};
        const imageLinks = vi.imageLinks || {};
        const rawCover = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
        const cover = rawCover ? `/api/books/cover?url=${encodeURIComponent(rawCover)}&title=${encodeURIComponent(vi.title || "")}&author=${encodeURIComponent((vi.authors || []).join(", "))}` : "";
        return {
          id: item.id || "",
          volumeInfo: {
            ...vi,
            imageLinks: rawCover ? { ...imageLinks, thumbnail: cover } : imageLinks
          }
        };
      });
      return res.json({ ok: true, items, books: items, total: data.totalItems || 0 });
    } catch (_) {}

    // Fallback: Open Library search
    try {
      const data = await openLibFetch("search.json", { q, limit: limit * 2, offset: startIndex, sort: "rating" }, 15000);
      const rawItems = data.docs || [];
      const total = data.numFound || 0;
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total, items: books });
    } catch (_) {}

    return res.json({ ok: true, books: [], items: [], total: 0 });
  }

  if (section === "trending") {
    setCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const genre = String(query.genre || "fiction").trim();
    const currentYear = new Date().getFullYear();
    try {
      const data = await openLibFetch("search.json", {
        q: `subject:${genre} first_publish_year:[${currentYear - 10} TO ${currentYear}]`,
        limit: limit * 2,
        sort: "rating"
      });
      const rawItems = data.docs || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
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
        limit: limit * 2,
        sort: "rating"
      });
      const rawItems = data.docs || [];
      const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
      return res.json({ ok: true, books, total: books.length });
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error", books: [], total: 0 });
    }
  }

  if (section === "popular") {
    setCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = Math.min(Number(query.limit) || 20, 40);
    const startIndex = Math.max(0, Number(query.startIndex) || 0);
    const genre = String(query.genre || "").trim().toLowerCase();
    const sort = String(query.sort || "").trim().toLowerCase();

    const genres = genre
      ? [genre]
      : [
          "fiction", "fantasy", "romance", "thriller", "mystery",
          "science fiction", "horror", "young adult", "contemporary",
          "memoir", "biography", "dystopia", "adventure", "poetry",
          "graphic novel", "true crime", "science", "history",
          "philosophy", "self help"
        ];

    const need = startIndex + limit;
    const allBooks = [];
    const seenIds = new Set();
    const seenTitles = new Set();

    try {
      const fetches = genres.map(async (g) => {
        try {
          const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(g)}&orderBy=${sort === 'newest' ? 'newest' : 'relevance'}&maxResults=40&printType=books`;
          return await fetchJson(url, { cacheKey: `gb:pop:${g}:${sort}`, ttlMs: 600000 });
        } catch (_) { return { items: [] }; }
      });

      const results = await Promise.allSettled(fetches);

      for (const result of results) {
        if (allBooks.length >= need) break;
        const data = result.status === "fulfilled" ? result.value : { items: [] };
        for (const item of (data.items || [])) {
          if (allBooks.length >= need) break;
          const id = item.id || "";
          if (!id || seenIds.has(id)) continue;
          const vi = item.volumeInfo || {};
          if (!vi.title) continue;
          seenIds.add(id);
          const imageLinks = vi.imageLinks || {};
          const rawCover = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
          const cover = rawCover ? `/api/books/cover?url=${encodeURIComponent(rawCover)}&title=${encodeURIComponent(vi.title || "")}&author=${encodeURIComponent((vi.authors || []).join(", "))}` : "";
          allBooks.push({
            id,
            volumeInfo: {
              ...vi,
              imageLinks: rawCover ? { ...imageLinks, thumbnail: cover } : imageLinks
            }
          });
        }
      }
    } catch (_) {}

    if (allBooks.length < need) {
      const subjectFetches = genres.slice(0, 10).map(async (subj) => {
        try {
          const data = await openLibFetch(`subjects/${subj}.json`, { limit: 80 }, 15000);
          return { subj, works: data.works || [] };
        } catch (_) { return { subj, works: [] }; }
      });

      const subjectResults = await Promise.allSettled(subjectFetches);
      for (const result of subjectResults) {
        if (allBooks.length >= need) break;
        const data = result.status === "fulfilled" ? result.value : { works: [] };
        for (const doc of data.works) {
          if (allBooks.length >= need) break;
          if (!doc.title || !doc.cover_id) continue;
          if (/[\u3000-\u9fff\uf900-\ufaff]/.test(doc.title)) continue;
          const norm = doc.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
          if (seenTitles.has(norm)) continue;
          seenTitles.add(norm);
          allBooks.push(mapOpenLibSubjectDoc(doc));
        }
      }
    }

    if (sort === "newest") {
      allBooks.sort((a, b) => {
        const yearA = parseInt(a.volumeInfo?.publishedDate || a.year || "0") || 0;
        const yearB = parseInt(b.volumeInfo?.publishedDate || b.year || "0") || 0;
        return yearB - yearA;
      });
    }

    const paged = allBooks.slice(startIndex, startIndex + limit);
    return res.json({ ok: true, items: paged, books: paged, total: allBooks.length });
  }

  if (section === "editors-picks") {
    setCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = Math.min(Number(query.limit) || 12, 30);
    const epAttempts = [
      { q: `(subject:fantasy OR subject:thriller OR subject:romance OR subject:history)`, sort: "rating" },
      { q: `subject:fantasy OR subject:thriller`, sort: "rating" },
      { q: `subject:romance`, sort: "rating" }
    ];
    for (const attempt of epAttempts) {
      try {
        const data = await openLibFetch("search.json", { ...attempt, limit: limit * 2 });
        const rawItems = data.docs || [];
        const books = rawItems.filter(doc => doc.title && doc.cover_i).map(mapOpenLibDoc).slice(0, limit);
        if (books.length > 0) return res.json({ ok: true, books, total: books.length });
      } catch (_) {}
    }
    return res.json({ ok: true, books: [], total: 0 });
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
      
      const data = await openLibFetch("search.json", { q, limit: 12 * 2, sort: "rating" });
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
        openLibFetch(`search.json`, { q: `key:/works/${encodeURIComponent(possibleVolumeId)}`, limit: 1, sort: "rating" })
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
        const rawCover = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
        normalized.image = `/api/books/cover?url=${encodeURIComponent(rawCover)}&title=${encodeURIComponent(normalized.title)}&author=${encodeURIComponent(normalized.author)}`;
        normalized.cover = normalized.image;
        normalized.backdrop = normalized.image;
      }

      return res.json(normalized);
    } catch (e) {
      return res.status(502).json({ ok: false, message: "OpenLibrary API error" });
    }
  }

  return res.status(404).json({ ok: false, message: "Not found" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Internal error", error: String(err?.message || err) });
  }
}
