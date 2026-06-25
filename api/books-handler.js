import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";


const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;

function toHttpsUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  return str.replace(/^http:/i, 'https:');
}

function shuffleArray(arr) {
  const a = [...(Array.isArray(arr) ? arr : [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function booksHandler(req, res) {
  const method = req.method;
  if (method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // Parse path
  const urlParts = req.url.split("?")[0].split("/").filter(Boolean);
  // e.g. /api/books/trending -> urlParts = ["api", "books", "trending"]
  const section = urlParts[urlParts.length - 1];
  const query = req.query || {};

  // ==========================================
  // 1. TRENDING (Google Books API — no hardcoded data)
  // ==========================================
  if (section === "trending") {
    const limit = Math.min(Number(query.limit) || 20, 50);

    const cacheKey = `trending-v4:${limit}`;
    const now = Date.now();
    const cached = DISCOVERY_CACHE.get(cacheKey);
    if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(cached.v);
    }

    const searchQueries = [
      'inauthor:colleen hoover fiction',
      'inauthor:emily henry fiction',
      'inauthor:sarah j maas fiction',
      'inauthor:rebecca yarros fiction',
      'inauthor:freida mcfadden fiction',
      'subject:booktok fiction',
      'inauthor:sally rooney fiction',
      'inauthor:alex michaelides fiction',
      'subject:bestseller fiction 2024 2025',
      'inauthor:matt haig fiction'
    ];

    const seen = new Set();
    const books = [];

    const queriesToUse = shuffleArray(searchQueries).slice(0, 4);

    await Promise.allSettled(queriesToUse.map(async (q) => {
      try {
        const gbUrl = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
        gbUrl.searchParams.set("q", q);
        gbUrl.searchParams.set("maxResults", "10");
        gbUrl.searchParams.set("orderBy", "relevance");
        gbUrl.searchParams.set("printType", "books");
        if (process.env.GOOGLE_BOOKS_API_KEY) gbUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

        const response = await fetch(gbUrl.toString(), { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return;
        const data = await response.json();

        for (const item of (data.items || [])) {
          const vol = item.volumeInfo || {};
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          const year = vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null;
          if (year && year < 2010) continue;
          const authors = vol.authors || [];
          const imageLinks = vol.imageLinks || {};
          let cover = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
          cover = cover.replace("http:", "https:");
          if (!cover) continue;
          books.push({
            id: item.id,
            title: vol.title || "Unknown Title",
            author: authors.length ? authors.join(", ") : "Unknown Author",
            year,
            cover,
            description: vol.description || "",
            _source: "google-books"
          });
          if (books.length >= limit) break;
        }
      } catch (_err) { /* skip this query */ }
    }));

    const payload = { ok: true, books: books.slice(0, limit), total: books.length };
    if (books.length) {
      DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });
    }

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.json(payload);
  }

  // ==========================================
  // 2. SEARCH (Google Books API)
  // ==========================================
  if (section === "search") {
    const q = String(query.q || '').trim();
    if (!q) return res.status(400).json({ ok: false, message: "Missing search query" });
    
    const limit = Math.min(Number(query.limit) || 20, 40);
    const startIndex = Math.min(Number(query.offset) || 0, 1000);
    const orderBy = (query.sort === 'newest' || query.orderBy === 'newest') ? 'newest' : 'relevance';

    try {
      const gbUrl = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
      gbUrl.searchParams.set("q", q);
      gbUrl.searchParams.set("maxResults", String(limit));
      gbUrl.searchParams.set("startIndex", String(startIndex));
      if (orderBy === 'newest') gbUrl.searchParams.set("orderBy", "newest");
      if (process.env.GOOGLE_BOOKS_API_KEY) gbUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

      const response = await fetch(gbUrl.toString());
      if (!response.ok) throw new Error(`Google Books HTTP ${response.status}`);
      const data = await response.json();

      const books = (data.items || []).map(item => {
        const vol = item.volumeInfo || {};
        const authors = vol.authors || [];
        const imageLinks = vol.imageLinks || {};
        const cover = imageLinks.thumbnail || imageLinks.smallThumbnail || "/images/fallback/book.svg";
        
        return {
          id: item.id,
          title: vol.title || "Unknown Title",
          author: authors.length ? authors.join(", ") : "Unknown Author",
          year: vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null,
          cover: cover.replace("http:", "https:"),
          description: vol.description || "",
          _source: "google-books"
        };
      });

      res.setHeader("Cache-Control", "public, max-age=600");
      return res.json({ ok: true, books, total: data.totalItems || books.length });
    } catch (error) {
      console.error("[Books API] Search error:", error);
      return res.status(502).json({ ok: false, message: "Search fetch failed" });
    }
  }

  // ==========================================
  // 3. FALLBACK PROXY (e.g. for fetching details by ID)
  // ==========================================
  try {
    let relativePath = urlParts.slice(urlParts.indexOf("books") + 1).join("/");
    
    if (relativePath === "cover") {
      const targetUrl = query.url;
      if (!targetUrl) return res.status(400).json({ error: "Missing url parameter" });
      try {
        const proxyRes = await fetch(targetUrl, { headers: { "User-Agent": "zo2y-worker/1.0" }});
        if (!proxyRes.ok) {
          res.setHeader("Content-Type", "image/svg+xml");
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.send(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a2e"/><text x="100" y="150" text-anchor="middle" fill="#666" font-size="14" font-family="sans-serif">No Cover</text></svg>'));
        }
        const buffer = await proxyRes.arrayBuffer();
        res.setHeader("Content-Type", proxyRes.headers.get("Content-Type") || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
        return res.end(new Uint8Array(buffer));
      } catch (_err) {
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1a1a2e"/><text x="100" y="150" text-anchor="middle" fill="#666" font-size="14" font-family="sans-serif">No Cover</text></svg>'));
      }
    }

    if (relativePath === "popular") {
      const q = String(query.q || 'subject:fiction').trim();
      const limit = Math.min(Number(query.limit) || 20, 50);
      const page = Math.max(1, Number(query.page) || 1);
      const startIndex = (page - 1) * limit;
      try {
        const gbUrl = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
        gbUrl.searchParams.set("q", q);
        gbUrl.searchParams.set("maxResults", String(limit));
        gbUrl.searchParams.set("startIndex", String(startIndex));
        if (process.env.GOOGLE_BOOKS_API_KEY) gbUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

        const response = await fetch(gbUrl.toString(), { signal: AbortSignal.timeout(8000) });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);

        const books = (data.items || []).map(item => {
          const vol = item.volumeInfo || {};
          const authors = vol.authors || [];
          const imageLinks = vol.imageLinks || {};
          const cover = imageLinks.thumbnail || imageLinks.smallThumbnail || "/images/fallback/book.svg";
          return {
            id: item.id,
            title: vol.title || "Unknown Title",
            author: authors.length ? authors.join(", ") : "Unknown Author",
            year: vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null,
            cover: cover.replace("http:", "https:"),
            description: vol.description || "",
            _source: "google-books"
          };
        });
        res.setHeader("Cache-Control", "public, max-age=600");
        return res.json({ ok: true, books, total: data.totalItems || books.length });
      } catch (err) {
        return res.status(502).json({ ok: false, message: "Popular books fetch failed" });
      }
    }

    const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

    const response = await fetch(url.toString());
    
    // If it's the popular proxy, it expects JSON books format
    if (relativePath === "volumes") {
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      
      const books = (data.items || []).map(item => {
        const vol = item.volumeInfo || {};
        const authors = vol.authors || [];
        const imageLinks = vol.imageLinks || {};
        const cover = imageLinks.thumbnail || imageLinks.smallThumbnail || "/images/fallback/book.svg";
        
        return {
          id: item.id,
          title: vol.title || "Unknown Title",
          author: authors.length ? authors.join(", ") : "Unknown Author",
          year: vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null,
          cover: cover.replace("http:", "https:"),
          description: vol.description || "",
          _source: "google-books"
        };
      });
      res.setHeader("Cache-Control", "public, max-age=600");
      return res.json({ ok: true, books, total: data.totalItems || books.length });
    } else {
      const text = await response.text();
      res.status(response.status);
      res.setHeader("content-type", response.headers.get("content-type") || "application/json");
      return res.send(text);
    }
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Proxy error" });
  }
}

