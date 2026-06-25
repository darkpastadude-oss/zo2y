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

const BOOK_COVERS_BUCKET = 'book-covers';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function bookCoverUrl(filename) {
  if (!SUPABASE_URL) return `/images/books/${filename}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${BOOK_COVERS_BUCKET}/${filename}`;
}

const BOOKS_CATALOG = [
  { id: 'gb_atomic_habits', title: 'Atomic Habits', author: 'James Clear', year: 2018, cover: bookCoverUrl('atomic-habits.jpg') },
  { id: 'gb_surrounded_idiots', title: 'Surrounded by Idiots', author: 'Thomas Erikson', year: 2019, cover: bookCoverUrl('surrounded-by-idiots.jpg') },
  { id: 'gb_ittw', title: 'It Ends with Us', author: 'Colleen Hoover', year: 2016, cover: bookCoverUrl('it-ends-with-us.jpg') },
  { id: 'gb_silent_patient', title: 'The Silent Patient', author: 'Alex Michaelides', year: 2019, cover: bookCoverUrl('the-silent-patient.jpg') },
  { id: 'gb_fourth_wing', title: 'Fourth Wing', author: 'Rebecca Yarros', year: 2023, cover: bookCoverUrl('fourth-wing.jpg') },
  { id: 'gb_iron_flame', title: 'Iron Flame', author: 'Rebecca Yarros', year: 2023, cover: bookCoverUrl('iron-flame.jpg') },
  { id: 'gb_happy_place', title: 'Happy Place', author: 'Emily Henry', year: 2023, cover: bookCoverUrl('happy-place.jpg') },
  { id: 'gb_verity', title: 'Verity', author: 'Colleen Hoover', year: 2018, cover: bookCoverUrl('verity.jpg') },
  { id: 'gb_acotar', title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', year: 2015, cover: bookCoverUrl('acotar.jpg') },
  { id: 'gb_housemaid', title: 'The Housemaid', author: 'Freida McFadden', year: 2022, cover: bookCoverUrl('the-housemaid.jpg') },
  { id: 'gb_beach_read', title: 'Beach Read', author: 'Emily Henry', year: 2020, cover: bookCoverUrl('beach-read.jpg') },
  { id: 'gb_normal_people', title: 'Normal People', author: 'Sally Rooney', year: 2018, cover: bookCoverUrl('normal-people.jpg') },
  { id: 'gb_lessons_chem', title: 'Lessons in Chemistry', author: 'Bonnie Garmus', year: 2022, cover: bookCoverUrl('lessons-in-chemistry.jpg') },
  { id: 'gb_seven_husbands', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', year: 2017, cover: bookCoverUrl('seven-husbands.jpg') },
  { id: 'gb_piranesi', title: 'Piranesi', author: 'Susanna Clarke', year: 2020, cover: bookCoverUrl('piranesi.jpg') },
  { id: 'gb_tiktok_romance', title: 'Twisted Love', author: 'Ana Huang', year: 2021, cover: bookCoverUrl('twisted-love.jpg') },
  { id: 'gb_clover_strauss', title: 'The Love Hypothesis', author: 'Ali Hazelwood', year: 2021, cover: bookCoverUrl('love-hypothesis.jpg') },
  { id: 'gb_daisy_jones', title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', year: 2019, cover: bookCoverUrl('daisy-jones.jpg') },
  { id: 'gb_circe', title: 'Circe', author: 'Madeline Miller', year: 2018, cover: bookCoverUrl('circe.jpg') },
  { id: 'gb_midnight_library', title: 'The Midnight Library', author: 'Matt Haig', year: 2020, cover: bookCoverUrl('midnight-library.jpg') },
  { id: 'gb_project_hail_mary', title: 'Project Hail Mary', author: 'Andy Weir', year: 2021, cover: bookCoverUrl('project-hail-mary.jpg') },
  { id: 'gb_song_achilles', title: 'The Song of Achilles', author: 'Madeline Miller', year: 2012, cover: bookCoverUrl('song-of-achilles.jpg') },
  { id: 'gb_manacled', title: 'Manacled', author: 'SenLinYu', year: 2023, cover: bookCoverUrl('manacled.jpg') },
  { id: 'gb_midnight_garden', title: 'Midnight in the Garden', author: 'John Berendt', year: 1994, cover: bookCoverUrl('midnight-garden.jpg') },
  { id: 'gb_people_meeting', title: 'People We Meet on Vacation', author: 'Emily Henry', year: 2021, cover: bookCoverUrl('people-we-meet.jpg') },
  { id: 'gb_mexican_gothic', title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', year: 2020, cover: bookCoverUrl('mexican-gothic.jpg') },
  { id: 'gb_starter_villain', title: 'Starter Villain', author: 'John Scalzi', year: 2023, cover: bookCoverUrl('starter-villain.jpg') },
  { id: 'gb_very_bad_ideas', title: 'Very Bad Ideas', author: 'Tara Crescent', year: 2023, cover: bookCoverUrl('very-bad-ideas.jpg') }
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
  // 1. TRENDING (local catalog — no external API)
  // ==========================================
  if (section === "trending") {
    const limit = Math.min(Number(query.limit) || 20, 50);
    const books = shuffleArray(BOOKS_CATALOG).slice(0, limit);
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.json({ ok: true, books, total: books.length });
  }

  // ==========================================
  // 2. SEARCH (local catalog — no external API)
  // ==========================================
  if (section === "search") {
    const q = String(query.q || '').trim().toLowerCase();
    if (!q) return res.status(400).json({ ok: false, message: "Missing search query" });

    const limit = Math.min(Number(query.limit) || 20, 40);
    const results = BOOKS_CATALOG.filter((book) => {
      return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    }).slice(0, limit);

    res.setHeader("Cache-Control", "public, max-age=600");
    return res.json({ ok: true, books: results, total: results.length });
  }

  // ==========================================
  // 3. COVER PROXY & POPULAR
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
      const limit = Math.min(Number(query.limit) || 20, 50);
      const books = shuffleArray(BOOKS_CATALOG).slice(0, limit);
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      return res.json({ ok: true, books, total: books.length });
    }

    const url = new URL(`${GOOGLE_BOOKS_BASE}/${relativePath}`);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);

    const response = await fetch(url.toString());
    
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

