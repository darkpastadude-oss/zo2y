import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
const TMDB_SPOT_POSTER = "https://image.tmdb.org/t/p/w780";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const TARGET_ITEMS = 16;

function resolveBaseUrl(req) {
  const protocol = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  if (!host) return "";
  return `${protocol}://${host}`;
}

async function fetchJson(url, attempts = 2) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5500 + (attempt * 800));
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return await res.json();
      if (res.status < 500 && res.status !== 429) return null;
      lastError = new Error(`http_${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 260 * (attempt + 1)));
    }
  }
  if (lastError) return null;
  return null;
}

function mapMovies(rows = []) {
  return rows
    .filter((row) => row && (row.poster_path || row.backdrop_path))
    .slice(0, TARGET_ITEMS)
    .map((row) => ({
      mediaType: "movie",
      itemId: String(row.id || ""),
      title: row.title || "Movie",
      subtitle: row.release_date ? String(row.release_date).slice(0, 4) : "Movie",
      image: row.poster_path ? `${TMDB_POSTER}${row.poster_path}` : "",
      backgroundImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
      spotlightImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
      spotlightMediaImage: row.poster_path
        ? `${TMDB_SPOT_POSTER}${row.poster_path}`
        : (row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : ""),
      spotlightMediaFit: "contain",
      spotlightMediaShape: "poster",
      href: row.id ? `movie.html?id=${encodeURIComponent(String(row.id))}` : "movies.html"
    }));
}

function mapTv(rows = []) {
  return rows
    .filter((row) => row && (row.poster_path || row.backdrop_path))
    .slice(0, TARGET_ITEMS)
    .map((row) => ({
      mediaType: "tv",
      itemId: String(row.id || ""),
      title: row.name || "TV Show",
      subtitle: row.first_air_date ? String(row.first_air_date).slice(0, 4) : "TV Show",
      image: row.poster_path ? `${TMDB_POSTER}${row.poster_path}` : "",
      backgroundImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
      spotlightImage: row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : "",
      spotlightMediaImage: row.poster_path
        ? `${TMDB_SPOT_POSTER}${row.poster_path}`
        : (row.backdrop_path ? `${TMDB_BACKDROP}${row.backdrop_path}` : ""),
      spotlightMediaFit: "contain",
      spotlightMediaShape: "poster",
      href: row.id ? `tvshow.html?id=${encodeURIComponent(String(row.id))}` : "tvshows.html"
    }));
}

function mapGames(rows = []) {
  return rows
    .filter((row) => row && row.id)
    .slice(0, TARGET_ITEMS)
    .map((row) => {
      const cover = String(row.cover || row.cover_url || "").trim();
      const hero = String(row.hero || row.hero_url || row.background_image || "").trim();
      return {
        mediaType: "game",
        itemId: String(row.id || ""),
        title: row.name || "Game",
        subtitle: row.released ? String(row.released).slice(0, 4) : "Game",
        extra: Array.isArray(row.genres) && row.genres.length
          ? row.genres.slice(0, 2).map((entry) => entry?.name).filter(Boolean).join(" | ")
          : "Video Game",
        image: cover || hero,
        backgroundImage: hero || cover,
        spotlightImage: hero || cover,
        spotlightMediaImage: cover || hero,
        spotlightMediaFit: "contain",
        spotlightMediaShape: "poster",
        href: row.id ? `game.html?id=${encodeURIComponent(String(row.id))}` : "games.html"
      };
    })
    .filter((row) => row.image || row.backgroundImage);
}

async function buildLiveFeed(baseUrl) {
  const [moviesJson, tvJson, gamesJson] = await Promise.all([
    fetchJson(`${baseUrl}/api/tmdb/movie/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/tmdb/tv/popular?language=en-US&page=1`),
    fetchJson(`${baseUrl}/api/igdb/games?page_size=28&ordering=-follows&min_rating_count=50&provider=igdb&dates=2000-01-01,2027-12-31&page=1`)
  ]);

  return {
    movie: mapMovies(Array.isArray(moviesJson?.results) ? moviesJson.results : []),
    tv: mapTv(Array.isArray(tvJson?.results) ? tvJson.results : []),
    game: mapGames(Array.isArray(gamesJson?.results) ? gamesJson.results : (Array.isArray(gamesJson) ? gamesJson : []))
  };
}

function isFeedUseful(feed) {
  return ["movie", "tv", "game"].some((key) => Array.isArray(feed?.[key]) && feed[key].length);
}

export default async function handler(req, res) {
  if (String(req.method || "GET").toUpperCase() !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from("home_spotlight_cache")
      .select("feed_payload, generated_at, expires_at")
      .eq("cache_key", "global")
      .maybeSingle();

    const feed = data?.feed_payload;
    if (!error && feed && typeof feed === "object" && isFeedUseful(feed)) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json({
        ok: true,
        source: "supabase-cache",
        generatedAt: data?.generated_at || null,
        expiresAt: data?.expires_at || null,
        feed
      });
    }
  }

  const baseUrl = resolveBaseUrl(req);
  if (!baseUrl) {
    return res.status(503).json({ ok: false, message: "Could not resolve host" });
  }

  const liveFeed = await buildLiveFeed(baseUrl);
  if (!isFeedUseful(liveFeed)) {
    return res.status(503).json({ ok: false, message: "Could not build live feed" });
  }

  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=120, stale-while-revalidate=240");
  return res.status(200).json({
    ok: true,
    source: "live-fallback",
    generatedAt: new Date().toISOString(),
    expiresAt: null,
    feed: liveFeed
  });
}
