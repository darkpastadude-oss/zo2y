import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-music", max: 220 });

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const ITUNES_LOOKUP_URL = "https://itunes.apple.com/lookup";
const APPLE_MARKETING_API_BASE = "https://rss.applemarketingtools.com/api/v2";
const REQUEST_CACHE_TTL_MS = 1000 * 60 * 10;

const requestCache = new Map();

function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === undefined || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  return raw;
}

function upgradeItunesArtwork(url, size = 1200) {
  const src = toHttpsUrl(url);
  if (!src) return "";
  return src
    .replace(/\/[0-9]+x[0-9]+bb\./i, `/${size}x${size}bb.`)
    .replace(/\/[0-9]+x[0-9]+\./i, `/${size}x${size}.`);
}

function normalizeMarket(value = "US") {
  return String(value || "US").trim().slice(0, 2).toUpperCase() || "US";
}

function normalizeMusicTypes(raw) {
  const allowed = new Set(["track", "album"]);
  const rows = String(raw || "track")
    .split(",")
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value) => allowed.has(value));
  return rows.length ? rows : ["track"];
}

function normalizeAlbumTypes(raw) {
  const rows = String(raw || "album")
    .split(",")
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return rows.length ? rows : ["album"];
}

function normalizeItunesTrackRow(track) {
  const collectionType = String(track?.collectionType || "").trim().toLowerCase();
  const rawArtwork = String(track?.artworkUrl100 || track?.artworkUrl60 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl(rawArtwork);
  return {
    source: "itunes",
    kind: "track",
    id: String(track?.trackId || track?.collectionId || ""),
    name: String(track?.trackName || track?.collectionName || "Track"),
    artists: [String(track?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    album: {
      id: String(track?.collectionId || ""),
      name: String(track?.collectionName || "").trim(),
      album_type: collectionType === "single" ? "single" : (collectionType || "album"),
      release_date: String(track?.releaseDate || "").trim().slice(0, 10),
      total_tracks: Number(track?.trackCount || 0),
      images: [hiResArtwork]
        .filter(Boolean)
        .map((url) => ({ url, width: 1200, height: 1200 }))
    },
    image: hiResArtwork,
    preview_url: String(track?.previewUrl || "").trim(),
    external_url: String(track?.trackViewUrl || "").trim(),
    popularity: 0,
    duration_ms: Number(track?.trackTimeMillis || 0),
    explicit: false
  };
}

function normalizeItunesAlbumRow(album) {
  const artistName = String(album?.artistName || "").trim();
  const rawArtwork = String(album?.artworkUrl100 || album?.artworkUrl60 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl(rawArtwork);
  return {
    source: "itunes",
    id: String(album?.collectionId || album?.id || ""),
    kind: "album",
    name: String(album?.collectionName || "Album"),
    artists: [artistName].filter(Boolean),
    artist_ids: [],
    artist_name: artistName,
    artist_id: "",
    image: hiResArtwork,
    images: [hiResArtwork]
      .filter(Boolean)
      .map((url) => ({ url, width: 1200, height: 1200 })),
    external_url: String(album?.collectionViewUrl || "").trim(),
    release_date: String(album?.releaseDate || "").trim().slice(0, 10),
    total_tracks: Number(album?.trackCount || 0),
    album_type: "album",
    popularity: 0,
    label: "",
    genres: [],
    explicit: false
  };
}

function normalizeAppleChartTrackRow(track) {
  const rawArtwork = String(track?.artworkUrl100 || "").trim();
  const hiResArtwork = upgradeItunesArtwork(rawArtwork, 1200) || toHttpsUrl(rawArtwork);
  return {
    source: "apple",
    kind: "track",
    id: String(track?.id || track?.url || ""),
    name: String(track?.name || "Track"),
    artists: [String(track?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    album: {
      id: "",
      name: String(track?.albumName || track?.name || "").trim(),
      album_type: "album",
      release_date: String(track?.releaseDate || "").trim().slice(0, 10),
      total_tracks: Number(track?.trackCount || 0),
      images: hiResArtwork ? [{ url: hiResArtwork, width: 1200, height: 1200 }] : []
    },
    image: hiResArtwork,
    preview_url: "",
    external_url: String(track?.url || "").trim(),
    popularity: 0,
    duration_ms: 0,
    explicit: !!track?.contentAdvisoryRating
  };
}

function dedupeByKey(rows = [], keyBuilder) {
  const seen = new Set();
  const output = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = String(keyBuilder(row) || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(row);
  });
  return output;
}

function dedupeTracks(rows = []) {
  return dedupeByKey(rows, (row) => {
    const id = String(row?.id || "").trim();
    if (id) return `id:${id}`;
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    return `${name}:${artist}`;
  });
}

function dedupeAlbums(rows = []) {
  return dedupeByKey(rows, (row) => {
    const id = String(row?.id || "").trim();
    if (id) return `id:${id}`;
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    return `${name}:${artist}`;
  });
}

function filterAlbumsByType(rows = [], albumTypes = ["album"]) {
  const allow = new Set((Array.isArray(albumTypes) ? albumTypes : []).map((value) => String(value || "").trim().toLowerCase()));
  if (!allow.size) return rows;
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const type = String(row?.album_type || "").trim().toLowerCase() || "album";
    return allow.has(type);
  });
}

function mergeMixedResults(tracks = [], albums = [], maxCount = 20) {
  const t = [...(Array.isArray(tracks) ? tracks : [])];
  const a = [...(Array.isArray(albums) ? albums : [])];
  const mixed = [];
  while (mixed.length < maxCount && (a.length || t.length)) {
    if (a.length) mixed.push(a.shift());
    if (t.length && mixed.length < maxCount) mixed.push(t.shift());
    if (t.length && mixed.length < maxCount) mixed.push(t.shift());
  }
  while (mixed.length < maxCount && a.length) mixed.push(a.shift());
  while (mixed.length < maxCount && t.length) mixed.push(t.shift());
  return mixed.slice(0, maxCount);
}

function readCache(cacheKey) {
  const hit = requestCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() >= Number(hit.expiresAt || 0)) {
    requestCache.delete(cacheKey);
    return null;
  }
  return hit.value;
}

function writeCache(cacheKey, value, ttlMs = REQUEST_CACHE_TTL_MS) {
  requestCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + Math.max(1000, Number(ttlMs) || REQUEST_CACHE_TTL_MS)
  });
}

async function fetchJson(url, { cacheKey = "", ttlMs = 0, timeoutMs = 7000 } = {}) {
  const key = String(cacheKey || "").trim();
  if (key && ttlMs > 0) {
    const hit = readCache(key);
    if (hit) return hit;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 7000));
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();
    if (key && ttlMs > 0) writeCache(key, json, ttlMs);
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchItunesTracks({ q, limit = 20, market = "US" }) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt(limit, 1, 100, 20)));
  const json = await fetchJson(url.toString(), {
    cacheKey: `itunes:tracks:${url.searchParams.toString()}`,
    ttlMs: 1000 * 60 * 6
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  return dedupeTracks(rows.map(normalizeItunesTrackRow).filter((row) => !!row.id));
}

async function searchItunesAlbums({ q, limit = 20, market = "US" }) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "album");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt(limit, 1, 100, 20)));
  const json = await fetchJson(url.toString(), {
    cacheKey: `itunes:albums:${url.searchParams.toString()}`,
    ttlMs: 1000 * 60 * 8
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  return dedupeAlbums(rows.map(normalizeItunesAlbumRow).filter((row) => !!row.id));
}

async function fetchAppleMostPlayedSongs({ market = "US", limit = 50 }) {
  const country = normalizeMarket(market).toLowerCase();
  const safeLimit = clampInt(limit, 1, 100, 50);
  const url = `${APPLE_MARKETING_API_BASE}/${encodeURIComponent(country)}/music/most-played/${safeLimit}/songs.json`;
  const json = await fetchJson(url, {
    cacheKey: `apple:chart:most-played:${country}:${safeLimit}`,
    ttlMs: 1000 * 60 * 8
  });
  const rows = Array.isArray(json?.feed?.results) ? json.feed.results : [];
  return dedupeTracks(rows.map(normalizeAppleChartTrackRow).filter((row) => !!row.id));
}

async function fetchItunesAlbumDetails(id, { market = "US", limit = 120 } = {}) {
  const albumId = String(id || "").trim();
  if (!albumId) return null;

  const url = new URL(ITUNES_LOOKUP_URL);
  url.searchParams.set("id", albumId);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));
  url.searchParams.set("limit", String(clampInt(limit, 1, 200, 120)));

  const json = await fetchJson(url.toString(), {
    cacheKey: `itunes:album:${url.searchParams.toString()}`,
    ttlMs: 1000 * 60 * 8
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  if (!rows.length) return null;

  const collection = rows.find((row) => String(row?.wrapperType || "").toLowerCase() === "collection");
  const trackRows = rows.filter((row) => String(row?.wrapperType || "").toLowerCase() === "track");

  const normalizedCollection = collection ? normalizeItunesAlbumRow(collection) : null;
  const tracks = dedupeTracks(trackRows.map((row) => {
    const normalized = normalizeItunesTrackRow(row);
    if (normalizedCollection) {
      normalized.album = {
        id: normalizedCollection.id,
        name: normalizedCollection.name,
        album_type: normalizedCollection.album_type || "album",
        release_date: normalizedCollection.release_date || "",
        total_tracks: normalizedCollection.total_tracks || 0,
        images: Array.isArray(normalizedCollection.images) ? normalizedCollection.images : []
      };
      normalized.image = normalizedCollection.image || normalized.image;
    }
    return normalized;
  }).filter((row) => !!row.id));

  const album = normalizedCollection || (tracks[0]?.album?.id
    ? {
        source: "itunes",
        id: String(tracks[0].album.id),
        kind: "album",
        name: String(tracks[0].album.name || "Album"),
        artists: Array.isArray(tracks[0].artists) ? tracks[0].artists : [],
        artist_ids: [],
        artist_name: Array.isArray(tracks[0].artists) ? String(tracks[0].artists[0] || "") : "",
        artist_id: "",
        image: String(tracks[0].image || ""),
        images: Array.isArray(tracks[0].album.images) ? tracks[0].album.images : [],
        external_url: String(tracks[0].external_url || ""),
        release_date: String(tracks[0].album.release_date || ""),
        total_tracks: Number(tracks[0].album.total_tracks || tracks.length || 0),
        album_type: String(tracks[0].album.album_type || "album"),
        popularity: 0,
        label: "",
        genres: [],
        explicit: false
      }
    : null);

  if (!album) return null;
  return { album, tracks };
}

async function fetchItunesTrackDetails(id, market = "US") {
  const trackId = String(id || "").trim();
  if (!trackId) return null;

  const url = new URL(ITUNES_LOOKUP_URL);
  url.searchParams.set("id", trackId);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", normalizeMarket(market));

  const json = await fetchJson(url.toString(), {
    cacheKey: `itunes:track:${url.searchParams.toString()}`,
    ttlMs: 1000 * 60 * 8
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  const track = rows.find((row) => String(row?.wrapperType || "").toLowerCase() === "track");
  return track ? normalizeItunesTrackRow(track) : null;
}

app.get("/api/music", (_req, res) => {
  return res.json({
    ok: true,
    service: "music-fallback",
    configured: false,
    source: "itunes-fallback",
    routes: ["/search", "/top-50", "/popular", "/popular-albums", "/featured-playlists", "/new-releases", "/albums/:id", "/tracks/:id"]
  });
});

app.get("/api/music/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "music-fallback",
    source: "itunes-fallback"
  });
});

app.get("/api/music/top-50", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 100, 50);
  const market = normalizeMarket(req.query.market || "US");
  try {
    const chartRows = await fetchAppleMostPlayedSongs({ market, limit: Math.max(50, limit) }).catch(() => []);
    const searchRows = await searchItunesTracks({ q: `top songs ${market}`, limit: Math.max(limit, 24), market }).catch(() => []);
    const results = dedupeTracks([...chartRows, ...searchRows]).slice(0, limit);
    return res.json({
      count: results.length,
      limit,
      offset: 0,
      source: "itunes-fallback",
      results
    });
  } catch (_error) {
    return res.json({
      count: 0,
      limit,
      offset: 0,
      source: "unavailable",
      results: []
    });
  }
});

app.get("/api/music/popular", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 100, 24);
  const market = normalizeMarket(req.query.market || "US");
  try {
    const chartRows = await fetchAppleMostPlayedSongs({ market, limit: Math.max(50, limit) }).catch(() => []);
    const popularRows = await searchItunesTracks({ q: `popular songs ${market}`, limit: Math.max(limit, 24), market }).catch(() => []);
    const globalRows = await searchItunesTracks({ q: "top songs", limit: Math.max(limit, 24), market: "US" }).catch(() => []);
    const results = dedupeTracks([...chartRows, ...popularRows, ...globalRows]).slice(0, limit);
    return res.json({
      count: results.length,
      limit,
      offset: 0,
      source: "itunes-fallback",
      results
    });
  } catch (_error) {
    return res.json({
      count: 0,
      limit,
      offset: 0,
      source: "unavailable",
      results: []
    });
  }
});

app.get("/api/music/popular-albums", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 60, 24);
  const market = normalizeMarket(req.query.market || "US");
  const albumTypes = normalizeAlbumTypes(req.query.album_types || "album");
  const albumTypesKey = albumTypes.join(",") || "album";
  try {
    const rows = await searchItunesAlbums({ q: `top albums ${market}`, limit: Math.max(limit * 2, 40), market });
    const results = filterAlbumsByType(rows, albumTypes).slice(0, limit);
    return res.json({
      count: results.length,
      limit,
      album_types: albumTypesKey,
      source: "itunes-fallback",
      results
    });
  } catch (_error) {
    return res.json({
      count: 0,
      limit,
      album_types: albumTypesKey,
      source: "unavailable",
      results: []
    });
  }
});

app.get("/api/music/new-releases", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 60, 20);
  const market = normalizeMarket(req.query.market || "US");
  const albumTypes = normalizeAlbumTypes(req.query.album_types || "album");
  const albumTypesKey = albumTypes.join(",") || "album";
  try {
    const newRows = await searchItunesAlbums({ q: `new albums ${market}`, limit: Math.max(limit * 2, 40), market }).catch(() => []);
    const trendingRows = await searchItunesAlbums({ q: `top albums ${market}`, limit: Math.max(limit * 2, 40), market }).catch(() => []);
    const merged = dedupeAlbums([...newRows, ...trendingRows]);
    const results = filterAlbumsByType(merged, albumTypes).slice(0, limit);
    return res.json({
      count: results.length,
      limit,
      album_types: albumTypesKey,
      source: "itunes-fallback",
      results
    });
  } catch (_error) {
    return res.json({
      count: 0,
      limit,
      album_types: albumTypesKey,
      source: "unavailable",
      results: []
    });
  }
});

app.get("/api/music/featured-playlists", (req, res) => {
  const limit = clampInt(req.query.limit, 1, 20, 8);
  return res.json({
    count: 0,
    limit,
    source: "unavailable",
    results: []
  });
});

app.get("/api/music/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 120);
  if (!q) {
    return res.status(400).json({ message: "Missing q query parameter." });
  }

  const limit = clampInt(req.query.limit, 1, 50, 20);
  const market = normalizeMarket(req.query.market || "US");
  const types = normalizeMusicTypes(req.query.type || "track");
  const includeTracks = types.includes("track");
  const includeAlbums = types.includes("album");
  const albumTypes = normalizeAlbumTypes(req.query.album_types || "album");
  const albumTypesKey = albumTypes.join(",") || "album";

  try {
    const [tracksRaw, albumsRaw] = await Promise.all([
      includeTracks ? searchItunesTracks({ q, limit: Math.max(limit * 2, 30), market }) : Promise.resolve([]),
      includeAlbums ? searchItunesAlbums({ q, limit: Math.max(limit * 2, 30), market }) : Promise.resolve([])
    ]);

    const tracks = includeTracks ? dedupeTracks(tracksRaw) : [];
    const albums = includeAlbums ? filterAlbumsByType(dedupeAlbums(albumsRaw), albumTypes) : [];
    const primaryResults = includeTracks && includeAlbums
      ? mergeMixedResults(tracks, albums, limit)
      : (includeTracks ? tracks.slice(0, limit) : albums.slice(0, limit));

    return res.json({
      count: includeTracks && includeAlbums ? (tracks.length + albums.length) : (includeTracks ? tracks.length : albums.length),
      track_count: tracks.length,
      album_count: albums.length,
      limit,
      offset: 0,
      source: "itunes-fallback",
      type: types.join(","),
      album_types: albumTypesKey,
      results: primaryResults,
      tracks,
      albums
    });
  } catch (_error) {
    return res.json({
      count: 0,
      track_count: 0,
      album_count: 0,
      limit,
      offset: 0,
      source: "unavailable",
      type: types.join(","),
      album_types: albumTypesKey,
      results: [],
      tracks: [],
      albums: []
    });
  }
});

app.get("/api/music/albums/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ message: "Invalid album id." });

  const market = normalizeMarket(req.query.market || "US");
  const includeTracks = String(req.query.include_tracks || "true").trim().toLowerCase() !== "false";
  const trackLimit = clampInt(req.query.limit, 1, 200, 120);

  try {
    const details = await fetchItunesAlbumDetails(id, { market, limit: trackLimit });
    if (!details?.album) return res.status(404).json({ message: "Album not found." });
    const tracks = includeTracks ? details.tracks : [];
    return res.json({
      album: details.album,
      tracks,
      count: tracks.length,
      source: "itunes-fallback"
    });
  } catch (_error) {
    return res.status(404).json({ message: "Album not found." });
  }
});

app.get("/api/music/tracks/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ message: "Invalid track id." });

  const market = normalizeMarket(req.query.market || "US");
  try {
    const track = await fetchItunesTrackDetails(id, market);
    if (!track) return res.status(404).json({ message: "Track not found." });
    return res.json(track);
  } catch (_error) {
    return res.status(404).json({ message: "Track not found." });
  }
});

app.get("/api/music/artists/:id", (_req, res) => {
  return res.status(404).json({ message: "Artist details are unavailable right now." });
});

app.use("/api/music/*", (_req, res) => {
  return res.status(404).json({ message: "Not found" });
});

app.use((error, req, res, _next) => {
  console.error("[music-handler] unexpected error", {
    method: req.method,
    path: req.originalUrl || req.url,
    message: String(error?.message || error)
  });
  if (res.headersSent) return;
  return res.json({
    count: 0,
    source: "unavailable",
    results: []
  });
});

export default function handler(req, res) {
  try {
    const query = req.query || {};
    const rawPath = query.path;
    const pathParts = Array.isArray(rawPath)
      ? rawPath
      : String(rawPath || "")
        .split("/")
        .filter(Boolean);

    const nextParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam(nextParams, key, value);
    });

    const suffix = pathParts.length ? `/${pathParts.join("/")}` : "";
    const search = nextParams.toString();
    req.url = `/api/music${suffix}${search ? `?${search}` : ""}`;
    return app(req, res);
  } catch (error) {
    console.error("[music-handler] invocation fallback:", String(error?.message || error));
    if (res.headersSent) return;
    return res.json({
      count: 0,
      source: "unavailable",
      results: []
    });
  }
}
