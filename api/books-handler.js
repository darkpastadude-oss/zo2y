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

const POPULAR_BOOK_QUERIES = [];

const POPULAR_BOOKS = [
  { id: 'gb_atomic_habits', title: 'Atomic Habits', author: 'James Clear', year: 2018, cover: 'https://covers.openlibrary.org/b/olid/O152868-M.jpg' },
  { id: 'gb_surrounded_idiots', title: 'Surrounded by Idiots', author: 'Thomas Erikson', year: 2019, cover: 'https://covers.openlibrary.org/b/olid/O1003987209-M.jpg' },
  { id: 'gb_ittw', title: 'It Ends with Us', author: 'Colleen Hoover', year: 2016, cover: 'https://covers.openlibrary.org/b/olid/O839371005-M.jpg' },
  { id: 'gb_silent_patient', title: 'The Silent Patient', author: 'Alex Michaelides', year: 2019, cover: 'https://covers.openlibrary.org/b/olid/O843699440-M.jpg' },
  { id: 'gb_fourth_wing', title: 'Fourth Wing', author: 'Rebecca Yarros', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1435105758-M.jpg' },
  { id: 'gb_iron_flame', title: 'Iron Flame', author: 'Rebecca Yarros', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1464049227-M.jpg' },
  { id: 'gb_happy_place', title: 'Happy Place', author: 'Emily Henry', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1421955821-M.jpg' },
  { id: 'gb_verity', title: 'Verity', author: 'Colleen Hoover', year: 2018, cover: 'https://covers.openlibrary.org/b/olid/O843697400-M.jpg' },
  { id: 'gb_acotar', title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', year: 2015, cover: 'https://covers.openlibrary.org/b/olid/O757538692-M.jpg' },
  { id: 'gb_housemaid', title: 'The Housemaid', author: 'Freida McFadden', year: 2022, cover: 'https://covers.openlibrary.org/b/olid/O1335010676-M.jpg' },
  { id: 'gb_beach_read', title: 'Beach Read', author: 'Emily Henry', year: 2020, cover: 'https://covers.openlibrary.org/b/olid/O1002982254-M.jpg' },
  { id: 'gb_normal_people', title: 'Normal People', author: 'Sally Rooney', year: 2018, cover: 'https://covers.openlibrary.org/b/olid/O826571009-M.jpg' },
  { id: 'gb_lessons_chem', title: 'Lessons in Chemistry', author: 'Bonnie Garmus', year: 2022, cover: 'https://covers.openlibrary.org/b/olid/O1013380182-M.jpg' },
  { id: 'gb_seven_husbands', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', year: 2017, cover: 'https://covers.openlibrary.org/b/olid/O843330940-M.jpg' },
  { id: 'gb_piranesi', title: 'Piranesi', author: 'Susanna Clarke', year: 2020, cover: 'https://covers.openlibrary.org/b/olid/O1004065809-M.jpg' },
  { id: 'gb_tiktok_romance', title: 'Twisted Love', author: 'Ana Huang', year: 2021, cover: 'https://covers.openlibrary.org/b/olid/O1014159349-M.jpg' },
  { id: 'gb_clover_strauss', title: 'The Love Hypothesis', author: 'Ali Hazelwood', year: 2021, cover: 'https://covers.openlibrary.org/b/olid/O1013966461-M.jpg' },
  { id: 'gb_daisy_jones', title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', year: 2019, cover: 'https://covers.openlibrary.org/b/olid/O843330991-M.jpg' },
  { id: 'gb_circe', title: 'Circe', author: 'Madeline Miller', year: 2018, cover: 'https://covers.openlibrary.org/b/olid/O827048689-M.jpg' },
  { id: 'gb_midnight_library', title: 'The Midnight Library', author: 'Matt Haig', year: 2020, cover: 'https://covers.openlibrary.org/b/olid/O1004066498-M.jpg' },
  { id: 'gb_remarkable_thing', title: 'A Remarkable Ordinary', author: 'Timothy Keller', year: 2022, cover: 'https://covers.openlibrary.org/b/olid/O1008254390-M.jpg' },
  { id: 'gb_project_hail_mary', title: 'Project Hail Mary', author: 'Andy Weir', year: 2021, cover: 'https://covers.openlibrary.org/b/olid/O1014155280-M.jpg' },
  { id: 'gb_song_achilles', title: 'The Song of Achilles', author: 'Madeline Miller', year: 2012, cover: 'https://covers.openlibrary.org/b/olid/O827048688-M.jpg' },
  { id: 'gb_manacled', title: 'Manacled', author: 'SenLinYu', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1430912151-M.jpg' },
  { id: 'gb_today_tomorrow', title: 'The Today, Tomorrow, Yesterday', author: 'Micalea Smeltzer', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1440659480-M.jpg' },
  { id: 'gb_people_meeting', title: 'People We Meet on Vacation', author: 'Emily Henry', year: 2021, cover: 'https://covers.openlibrary.org/b/olid/O1007555600-M.jpg' },
  { id: 'gb_mexican_gothic', title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', year: 2020, cover: 'https://covers.openlibrary.org/b/olid/O1002982257-M.jpg' },
  { id: 'gb_starter_villain', title: 'Starter Villain', author: 'John Scalzi', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1451081288-M.jpg' },
  { id: 'gb_very_bad_ideas', title: 'Very Bad Ideas', author: 'Tara Crescent', year: 2023, cover: 'https://covers.openlibrary.org/b/olid/O1454257489-M.jpg' }
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
  // 1. TRENDING (curated popular books + Google Books search)
  // ==========================================
  if (section === "trending") {
    const genre = String(query.genre || 'fiction').trim().toLowerCase();
    const limit = Math.min(Number(query.limit) || 20, 50);

    const cacheKey = `trending-v3:${genre}:${limit}`;
    const now = Date.now();
    const cached = DISCOVERY_CACHE.get(cacheKey);
    if (cached && (now - cached.t) < DISCOVERY_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1800");
      return res.json(cached.v);
    }

    let books = shuffleArray(POPULAR_BOOKS).slice(0, limit);

    try {
      const searchQueries = [
        'inauthor:colleen hoover fiction',
        'inauthor:emily henry fiction',
        'inauthor:sarah j maas fiction',
        'inauthor:rebecca yarros fiction',
        'inauthor:freida mcfadden fiction',
        'subject:booktok fiction',
        'inauthor:sally rooney fiction',
        'inauthor:alex michaelides fiction'
      ];
      const q = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const gbUrl = new URL(`${GOOGLE_BOOKS_BASE}/volumes`);
      gbUrl.searchParams.set("q", q);
      gbUrl.searchParams.set("maxResults", "20");
      gbUrl.searchParams.set("orderBy", "relevance");
      gbUrl.searchParams.set("printType", "books");
      if (process.env.GOOGLE_BOOKS_API_KEY) gbUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

      const response = await fetch(gbUrl.toString(), { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        const seen = new Set();
        const apiBooks = [];
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
          apiBooks.push({
            id: item.id,
            title: vol.title || "Unknown Title",
            author: authors.length ? authors.join(", ") : "Unknown Author",
            year,
            cover,
            description: vol.description || "",
            _source: "google-books"
          });
        }
        if (apiBooks.length >= 8) books = shuffleArray(apiBooks).slice(0, limit);
      }
    } catch (_err) { /* use curated list */ }

    const payload = { ok: true, books, total: books.length };
    DISCOVERY_CACHE.set(cacheKey, { v: payload, t: now });

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

