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

async function fetchJson(url, attempts = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000 + (attempt * 1000));
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return await res.json();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return null;
      lastError = new Error(`http_${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  if (lastError) return null;
  return null;
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
      const title = String(row?.title || "").trim();
      if (!title) return null;
      const author = Array.isArray(row?.author_name) && row.author_name.length ? String(row.author_name[0] || "").trim() : "Book";
      const key = `${title.toLowerCase()}::${author.toLowerCase()}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const coverId = Number(row?.cover_i || 0);
      const isbnRaw = Array.isArray(row?.isbn) ? String(row.isbn[0] || "").trim() : "";
      const isbn = isbnRaw.replace(/[^0-9Xx]/g, "");
      const coverById = coverId ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-L.jpg` : "";
      const coverByIsbn = isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg` : "";
      const googleThumb = String(row?._googleThumbnail || row?.coverImage || "").trim().replace(/^http:\/\//i, "https://");
      const primaryImage = googleThumb || coverById || coverByIsbn || "images/logo.png";
      const workKey = String(row?.key || "").trim();
      const googleVolumeId = String(row?._googleVolumeId || "").trim();
      const itemId = googleVolumeId || workKey.replace(/^\/works\//i, "").trim() || `pre-book-${index + 1}`;
      const year = Number(row?.first_publish_year || 0) || 0;
      const subtitle = year ? `${author} | ${year}` : author;
      const href = itemId
        ? `book.html?id=${encodeURIComponent(itemId)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
        : "books.html";
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
        fallbackImage: coverByIsbn || coverById || primaryImage,
        href
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

  const [moviesJson, tvJson, gamesJson, booksTrendingJson, booksPopularJson, musicBatches] = await Promise.all([
    fetchJson(`${baseUrl}/api/tmdb/movie/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/tmdb/tv/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/igdb/games?page_size=32&ordering=-rating&dates=2000-01-01,2026-12-31&page=1`),
    fetchJson(`${baseUrl}/api/books/trending?period=weekly&limit=36`),
    fetchJson(`${baseUrl}/api/books/popular?subject=fiction&limit=36&page=1&orderBy=relevance`),
    Promise.all([
      fetchJson(`${baseUrl}/api/music/popular?limit=30&market=US`),
      ...POPULAR_MUSIC_QUERIES.map((q) => fetchJson(`${baseUrl}/api/music/search?q=${encodeURIComponent(q)}&limit=24&market=US`))
    ])
  ]);
  const booksRows = [
    ...(Array.isArray(booksTrendingJson?.docs) ? booksTrendingJson.docs : []),
    ...(Array.isArray(booksPopularJson?.docs) ? booksPopularJson.docs : [])
  ];
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
