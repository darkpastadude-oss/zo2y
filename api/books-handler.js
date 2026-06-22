import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "backend/authRoutes/.env" });

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

const DISCOVERY_CACHE = new Map();
const DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;

function toHttpsUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  return str.replace(/^http:/i, 'https:');
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
  // 1. TRENDING (OpenLibrary Subjects API)
  // ==========================================
  if (section === "trending") {
    const genre = String(query.genre || 'fiction').trim().toLowerCase();
    const limit = Math.min(Number(query.limit) || 20, 50);
    const offset = Math.min(Number(query.offset) || 0, 1000);

    const cacheKey = `trending:${genre}:${limit}:${offset}`;
    const now = Date.now();
    const cached = DISCOVERY_CACHE.get(cacheKey);
    if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(cached.v);
    }

    try {
      const olUrl = new URL(`https://openlibrary.org/subjects/${encodeURIComponent(genre)}.json`);
      olUrl.searchParams.set("limit", String(limit));
      olUrl.searchParams.set("offset", String(offset));

      const response = await fetch(olUrl.toString(), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`OpenLibrary HTTP ${response.status}`);
      const data = await response.json();

      const books = (data.works || []).map(work => {
        const coverId = Number(work.cover_id || 0);
        const authors = (work.authors || []).map(a => String(a.name || '').trim()).filter(Boolean);
        return {
          id: String(work.key || '').replace(/^\/works\//, ''),
          title: String(work.title || '').trim(),
          author: authors.length ? authors.join(", ") : "Unknown Author",
          year: Number(work.first_publish_year || 0) || null,
          cover: coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "/images/fallback/book.svg",
          description: "", // Subjects API rarely returns desc, could fetch later if needed
          _source: "open-library"
        };
      }).filter(b => b.title);

      const payload = { ok: true, books, total: data.work_count || books.length };
      DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });
      
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      return res.json(payload);
    } catch (error) {
      console.error("[Books API] Trending error:", error);
      return res.status(502).json({ ok: false, message: "Trending fetch failed" });
    }
  }

  // ==========================================
  // 2. SEARCH (Google Books API)
  // ==========================================
  if (section === "search") {
    const q = String(query.q || '').trim();
    if (!q) return res.status(400).json({ ok: false, message: "Missing search query" });
    
    const limit = Math.min(Number(query.limit) || 20, 40);
    const startIndex = Math.min(Number(query.offset) || 0, 1000);
    const orderBy = query.sort === 'newest' ? 'newest' : 'relevance';

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
    if (relativePath === "popular") relativePath = "volumes";
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
