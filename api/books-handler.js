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

const POPULAR_BOOK_QUERIES = [
  'subject:bestsellers+fiction',
  'inauthor:colleen+hoover',
  'inauthor:renee+jones',
  'subject:self+help+popular',
  'inauthor:stephen+king+2024',
  'inauthor:sally+rooney',
  'subject:romance+bestseller',
  'inauthor:rachel+hawkins',
  'subject:psychology+popular',
  'inauthor:hannah+grace',
  'inauthor:fredrik+backman',
  'subject:thriller+bestseller',
  'inauthor:alex+michaelides',
  'inauthor:emily+henry',
  'subject:nonfiction+popular+2024'
];

const FALLBACK_POPULAR_BOOKS = [
  { id: 'ol_fallback_atomic_habits', title: 'Atomic Habits', author: 'James Clear', year: 2018, cover: 'https://books.google.com/books/content?id=9Ie0DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_surrounded_idiots', title: 'Surrounded by Idiots', author: 'Thomas Erikson', year: 2019, cover: 'https://books.google.com/books/content?id=QlO5DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_ittw', title: 'It Ends with Us', author: 'Colleen Hoover', year: 2016, cover: 'https://books.google.com/books/content?id=S5WtDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_da_vinci', title: 'The Silent Patient', author: 'Alex Michaelides', year: 2019, cover: 'https://books.google.com/books/content?id=jjKEDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_tkam', title: 'Fourth Wing', author: 'Rebecca Yarros', year: 2023, cover: 'https://books.google.com/books/content?id=sgrTEAAAMBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_memoirs', title: 'Iron Flame', author: 'Rebecca Yarros', year: 2023, cover: 'https://books.google.com/books/content?id=KmGJEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_dune', title: 'Happy Place', author: 'Emily Henry', year: 2023, cover: 'https://books.google.com/books/content?id=J1OZ0AEACAAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_1984', title: 'It Ends with Us', author: 'Colleen Hoover', year: 2016, cover: 'https://books.google.com/books/content?id=S5WtDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_harry', title: 'Verity', author: 'Colleen Hoover', year: 2018, cover: 'https://books.google.com/books/content?id=yVZbDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_perks', title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', year: 2015, cover: 'https://books.google.com/books/content?id=z3O0DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_gone', title: 'The Housemaid', author: 'Freida McFadden', year: 2022, cover: 'https://books.google.com/books/content?id=dC-fEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_fault', title: 'Beach Read', author: 'Emily Henry', year: 2020, cover: 'https://books.google.com/books/content?id=cWVxDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_maze', title: 'Normal People', author: 'Sally Rooney', year: 2018, cover: 'https://books.google.com/books/content?id=OjCuDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_thg', title: 'Lessons in Chemistry', author: 'Bonnie Garmus', year: 2022, cover: 'https://books.google.com/books/content?id=pCp4DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_mocking', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', year: 2017, cover: 'https://books.google.com/books/content?id=U5iCDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
  { id: 'ol_fallback_catch', title: 'Piranesi', author: 'Susanna Clarke', year: 2020, cover: 'https://books.google.com/books/content?id=kA4OEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' }
];

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
  // 1. TRENDING (Google Books API - popular queries)
  // ==========================================
  if (section === "trending") {
    const genre = String(query.genre || 'fiction').trim().toLowerCase();
    const limit = Math.min(Number(query.limit) || 20, 50);

    const cacheKey = `trending-v2:${genre}:${limit}`;
    const now = Date.now();
    const cached = DISCOVERY_CACHE.get(cacheKey);
    if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(cached.v);
    }

    try {
      const allBooks = [];
      const seenIds = new Set();
      const queries = shuffleArray(POPULAR_BOOK_QUERIES).slice(0, 5);

      for (const q of queries) {
        if (allBooks.length >= limit * 2) break;
        try {
          const gbUrl = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
          gbUrl.searchParams.set("q", q);
          gbUrl.searchParams.set("maxResults", "10");
          gbUrl.searchParams.set("orderBy", "relevance");
          if (process.env.GOOGLE_BOOKS_API_KEY) gbUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

          const response = await fetch(gbUrl.toString(), { signal: AbortSignal.timeout(5000) });
          if (!response.ok) continue;
          const data = await response.json();

          for (const item of (data.items || [])) {
            const vol = item.volumeInfo || {};
            if (seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            const authors = vol.authors || [];
            const imageLinks = vol.imageLinks || {};
            let cover = imageLinks.thumbnail || imageLinks.smallThumbnail || "";
            cover = cover.replace("http:", "https:");
            if (!cover) continue;
            const year = vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : null;
            if (year && year < 1990) continue;
            allBooks.push({
              id: item.id,
              title: vol.title || "Unknown Title",
              author: authors.length ? authors.join(", ") : "Unknown Author",
              year,
              cover,
              description: vol.description || "",
              _source: "google-books"
            });
          }
        } catch (_err) { continue; }
      }

      let books = shuffleArray(allBooks).slice(0, limit);
      if (!books.length) books = shuffleArray(FALLBACK_POPULAR_BOOKS).slice(0, limit);

      const payload = { ok: true, books, total: books.length };
      DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });

      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      return res.json(payload);
    } catch (error) {
      console.error("[Books API] Trending error:", error);
      const fallback = shuffleArray(FALLBACK_POPULAR_BOOKS).slice(0, limit);
      return res.json({ ok: true, books: fallback, total: fallback.length });
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

