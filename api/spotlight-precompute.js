import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://gfkhjbztayjyojsgdpgk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const PRECOMPUTE_SECRET = String(process.env.SPOTLIGHT_PRECOMPUTE_SECRET || "").trim();

const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
const TMDB_SPOT_POSTER = "https://image.tmdb.org/t/p/w780";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const TARGET_ITEMS = 24;
const TTL_MINUTES = 20;
const BOOKS_POPULAR_PATH = "/books-popular.json";
const CURATED_POPULAR_BOOKS = [
  { title: "Atomic Habits", author: "James Clear" },
  { title: "The Psychology of Money", author: "Morgan Housel" },
  { title: "It Ends with Us", author: "Colleen Hoover" },
  { title: "Fourth Wing", author: "Rebecca Yarros" },
  { title: "The 48 Laws of Power", author: "Robert Greene" },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid" },
  { title: "Where the Crawdads Sing", author: "Delia Owens" },
  { title: "The Midnight Library", author: "Matt Haig" },
  { title: "The Silent Patient", author: "Alex Michaelides" },
  { title: "The Alchemist", author: "Paulo Coelho" },
  { title: "Sapiens", author: "Yuval Noah Harari" },
  { title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki" },
  { title: "Project Hail Mary", author: "Andy Weir" },
  { title: "Educated", author: "Tara Westover" }
];
const POPULAR_MUSIC_QUERIES = [
  "pop 2025",
  "hip hop 2025",
  "r&b 2025",
  "latin 2025",
  "dance 2025",
  "rock 2025"
];

function resolveBaseUrl(req) {
  const protocol = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  if (!host) return "";
  return `${protocol}://${host}`;
}

function isAuthorized(req) {
  if (!PRECOMPUTE_SECRET) return true;
  const headerSecret = String(req.headers["x-precompute-secret"] || "").trim();
  const querySecret = String(req.query?.secret || "").trim();
  return headerSecret === PRECOMPUTE_SECRET || querySecret === PRECOMPUTE_SECRET;
}

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (_error) {
    return null;
  }
}

function mapMovies(rows = []) {
  return rows
    .filter((m) => m && (m.poster_path || m.backdrop_path))
    .slice(0, TARGET_ITEMS)
    .map((m) => ({
      mediaType: "movie",
      itemId: String(m.id || ""),
      title: m.title || "Movie",
      subtitle: m.release_date ? String(m.release_date).slice(0, 4) : "Movie",
      image: m.poster_path ? `${TMDB_POSTER}${m.poster_path}` : "",
      backgroundImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : "",
      spotlightImage: m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : "",
      spotlightMediaImage: m.poster_path
        ? `${TMDB_SPOT_POSTER}${m.poster_path}`
        : (m.backdrop_path ? `${TMDB_BACKDROP}${m.backdrop_path}` : ""),
      spotlightMediaFit: "contain",
      spotlightMediaShape: "poster",
      href: m.id ? `movie.html?id=${encodeURIComponent(String(m.id))}` : "movies.html"
    }));
}

function mapTv(rows = []) {
  return rows
    .filter((t) => t && (t.poster_path || t.backdrop_path))
    .slice(0, TARGET_ITEMS)
    .map((t) => ({
      mediaType: "tv",
      itemId: String(t.id || ""),
      title: t.name || "TV Show",
      subtitle: t.first_air_date ? String(t.first_air_date).slice(0, 4) : "TV Show",
      image: t.poster_path ? `${TMDB_POSTER}${t.poster_path}` : "",
      backgroundImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : "",
      spotlightImage: t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : "",
      spotlightMediaImage: t.poster_path
        ? `${TMDB_SPOT_POSTER}${t.poster_path}`
        : (t.backdrop_path ? `${TMDB_BACKDROP}${t.backdrop_path}` : ""),
      spotlightMediaFit: "contain",
      spotlightMediaShape: "poster",
      href: t.id ? `tvshow.html?id=${encodeURIComponent(String(t.id))}` : "tvshows.html"
    }));
}

function mapGames(rows = []) {
  return rows
    .filter((g) => g && g.id && g.cover)
    .slice(0, TARGET_ITEMS)
    .map((g) => {
      const coverImage = String(g.cover || "").trim();
      const heroImage = String(g.hero || "").trim();
      const backgroundImage = heroImage || coverImage || "";
      return {
        mediaType: "game",
        itemId: String(g.id || ""),
        title: g.name || "Game",
        subtitle: g.released ? String(g.released).slice(0, 4) : "Game",
        extra: Array.isArray(g.genres) && g.genres.length
          ? g.genres.slice(0, 2).map((x) => x?.name).filter(Boolean).join(" | ")
          : "Video Game",
        image: coverImage,
        backgroundImage,
        spotlightImage: backgroundImage || coverImage,
        spotlightMediaImage: coverImage,
        spotlightMediaFit: "contain",
        spotlightMediaShape: "poster",
        href: g.id ? `game.html?id=${encodeURIComponent(String(g.id))}` : "games.html"
      };
    });
}

function mapBooks(rows = []) {
  const seen = new Set();
  const mapped = rows
    .map((row, index) => {
      const info = row?.volumeInfo || {};
      const title = String(info.title || "").trim();
      if (!title) return null;
      const author = Array.isArray(info.authors) && info.authors.length ? String(info.authors[0] || "").trim() : "Book";
      const key = `${title.toLowerCase()}::${author.toLowerCase()}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const identifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
      const isbnId = identifiers.find((x) => /ISBN_13|ISBN_10/i.test(String(x?.type || "")));
      const isbn = String(isbnId?.identifier || "").replace(/[^0-9Xx]/g, "").trim();
      const imageLinks = info.imageLinks || {};
      const imgRaw = String(imageLinks.thumbnail || imageLinks.smallThumbnail || "").trim();
      const image = imgRaw.replace(/^http:\/\//i, "https://");
      const coverByIsbn = isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg` : "";
      const primaryImage = image || coverByIsbn || "images/logo.png";
      const itemId = String(row?.id || `pre-book-${index + 1}`).trim();
      const publishedDate = String(info.publishedDate || "").trim();
      const year = /^\d{4}/.test(publishedDate) ? publishedDate.slice(0, 4) : "";
      const subtitle = year ? `${author} | ${year}` : author;
      return {
        mediaType: "book",
        itemId,
        title,
        subtitle,
        image: primaryImage,
        backgroundImage: primaryImage,
        spotlightImage: primaryImage,
        spotlightMediaImage: primaryImage,
        spotlightMediaFit: "contain",
        spotlightMediaShape: "poster",
        fallbackImage: coverByIsbn || primaryImage,
        href: itemId ? `book.html?id=${encodeURIComponent(itemId)}` : "books.html"
      };
    })
    .filter(Boolean);
  return mapped.slice(0, TARGET_ITEMS);
}

function mapMusic(rows = []) {
  const seen = new Set();
  return rows
    .filter((track) => {
      const id = String(track?.id || "").trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0))
    .slice(0, TARGET_ITEMS)
    .map((track) => {
      const artists = Array.isArray(track.artists) ? track.artists.filter(Boolean).join(", ") : "Artist";
      const image = String(track.image || "").trim() || "images/logo.png";
      return {
        mediaType: "music",
        itemId: String(track.id || ""),
        title: track.name || "Track",
        subtitle: artists,
        extra: String(track.album?.name || "Album"),
        image,
        backgroundImage: image,
        spotlightImage: image,
        spotlightMediaImage: image,
        spotlightMediaFit: "contain",
        spotlightMediaShape: "poster",
        href: track.id ? `song.html?id=${encodeURIComponent(String(track.id))}` : "music.html"
      };
    });
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(String(req.method || "").toUpperCase())) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ message: "Missing SUPABASE_SERVICE_ROLE_KEY" });
  }

  const baseUrl = resolveBaseUrl(req);
  if (!baseUrl) {
    return res.status(500).json({ message: "Could not resolve request host" });
  }

  const [moviesJson, tvJson, gamesJson, booksSeedsJson, musicBatches] = await Promise.all([
    fetchJson(`${baseUrl}/api/tmdb/movie/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/tmdb/tv/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/igdb/games?page_size=32&ordering=-rating&dates=2000-01-01,2026-12-31&page=1`),
    fetchJson(`${baseUrl}${BOOKS_POPULAR_PATH}`),
    Promise.all([
      fetchJson(`${baseUrl}/api/music/popular?limit=30&market=US`),
      ...POPULAR_MUSIC_QUERIES.map((q) => fetchJson(`${baseUrl}/api/music/search?q=${encodeURIComponent(q)}&limit=24&market=US`))
    ])
  ]);
  const booksSeeds = Array.isArray(booksSeedsJson) && booksSeedsJson.length ? booksSeedsJson : CURATED_POPULAR_BOOKS;
  const bookQueries = booksSeeds
    .map((seed) => ({
      title: String(seed?.title || "").trim(),
      author: String(seed?.author || "").trim()
    }))
    .filter((seed) => seed.title && seed.author)
    .slice(0, Math.max(TARGET_ITEMS, 24));
  const booksBatches = await Promise.all(bookQueries.map((seed) => {
    const q = `intitle:"${seed.title}" inauthor:"${seed.author}"`;
    const url = `${baseUrl}/api/books/volumes?q=${encodeURIComponent(q)}&printType=books&langRestrict=en&orderBy=relevance&maxResults=1`;
    return fetchJson(url);
  }));
  const booksRows = booksBatches.flatMap((json) => {
    const items = Array.isArray(json?.items) ? json.items : [];
    return items.slice(0, 1);
  });
  const musicRows = (Array.isArray(musicBatches) ? musicBatches : []).flatMap((json) => (
    Array.isArray(json?.results) ? json.results : []
  ));

  const feedPayload = {
    movie: mapMovies(Array.isArray(moviesJson?.results) ? moviesJson.results : []),
    tv: mapTv(Array.isArray(tvJson?.results) ? tvJson.results : []),
    game: mapGames(Array.isArray(gamesJson?.results) ? gamesJson.results : (Array.isArray(gamesJson) ? gamesJson : [])),
    book: mapBooks(booksRows),
    music: mapMusic(musicRows)
  };

  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + TTL_MINUTES * 60 * 1000);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error } = await admin
    .from("home_spotlight_cache")
    .upsert(
      {
        cache_key: "global",
        feed_payload: feedPayload,
        generated_at: generatedAt.toISOString(),
        expires_at: expiresAt.toISOString()
      },
      { onConflict: "cache_key" }
    );

  if (error) {
    return res.status(500).json({ message: "Failed to store precompute feed", error: error.message });
  }

  const counts = Object.fromEntries(
    Object.entries(feedPayload).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  );
  return res.status(200).json({
    ok: true,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    counts
  });
}
