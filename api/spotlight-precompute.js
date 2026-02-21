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
  return rows
    .filter((b) => b && b.key && b.title)
    .slice(0, TARGET_ITEMS)
    .map((b, index) => {
      const workKey = String(b.key || "").trim();
      const workId = workKey.startsWith("/works/") ? workKey.replace("/works/", "") : workKey;
      const author = Array.isArray(b.author_name) && b.author_name.length ? b.author_name[0] : "Book";
      const coverId = Number(b.cover_i || 0);
      const cover = Number.isFinite(coverId) && coverId > 0
        ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-L.jpg`
        : "images/logo.png";
      return {
        mediaType: "book",
        itemId: workId || `pre-book-${index + 1}`,
        title: String(b.title || "Book"),
        subtitle: author,
        image: cover,
        backgroundImage: cover,
        spotlightImage: cover,
        spotlightMediaImage: cover,
        spotlightMediaFit: "contain",
        spotlightMediaShape: "poster",
        fallbackImage: cover,
        href: workId ? `book.html?id=${encodeURIComponent(workId)}` : "books.html"
      };
    });
}

function mapMusic(rows = []) {
  return rows
    .filter((track) => track && track.id)
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
        spotlightMediaFit: "cover",
        spotlightMediaShape: "square",
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

  const [moviesJson, tvJson, gamesJson, booksJson, musicJson] = await Promise.all([
    fetchJson(`${baseUrl}/api/tmdb/movie/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/tmdb/tv/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/igdb/games?page_size=32&ordering=-rating&dates=2000-01-01,2026-12-31&page=1`),
    fetchJson(`https://openlibrary.org/search.json?q=${encodeURIComponent("popular books")}&language=eng&limit=28&page=1`),
    fetchJson(`${baseUrl}/api/music/search?q=${encodeURIComponent("global top hits")}&limit=28&market=US`)
  ]);

  const feedPayload = {
    movie: mapMovies(Array.isArray(moviesJson?.results) ? moviesJson.results : []),
    tv: mapTv(Array.isArray(tvJson?.results) ? tvJson.results : []),
    game: mapGames(Array.isArray(gamesJson?.results) ? gamesJson.results : (Array.isArray(gamesJson) ? gamesJson : [])),
    book: mapBooks(Array.isArray(booksJson?.docs) ? booksJson.docs : []),
    music: mapMusic(Array.isArray(musicJson?.results) ? musicJson.results : [])
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
