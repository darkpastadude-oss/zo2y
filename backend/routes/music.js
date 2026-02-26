import express from "express";

const router = express.Router();

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const TOKEN_REFRESH_SKEW_MS = 60_000;
const POPULAR_PLAYLIST_IDS = [
  "37i9dQZEVXbLRQDuF5jeBp", // Top 50 - USA
  "37i9dQZEVXbMDoHDwVN2tF", // Top 50 - Global
  "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits
  "37i9dQZEVXbKuaTI1Z1Afx"  // Viral 50 - USA
];
const TOP_50_PLAYLIST_IDS = [
  "37i9dQZEVXbLRQDuF5jeBp", // Top 50 - USA
  "37i9dQZEVXbMDoHDwVN2tF"  // Top 50 - Global
];
const ALBUM_DETAILS_CACHE_TTL_MS = 1000 * 60 * 30;
const POPULAR_ALBUMS_CACHE_TTL_MS = 1000 * 60 * 8;
const CURATION_KEYWORDS_BLOCKLIST = [
  "workout",
  "karaoke",
  "tribute",
  "power music",
  "fitness",
  "8d",
  "nightcore",
  "sped up"
];

let spotifyTokenCache = {
  accessToken: "",
  expiresAt: 0
};
const albumDetailsCache = new Map();
const popularAlbumsCache = new Map();

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function getSpotifyCredentials() {
  const clientId = String(process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  return { clientId, clientSecret };
}

function hasSpotifyCredentials() {
  const { clientId, clientSecret } = getSpotifyCredentials();
  return !!(clientId && clientSecret);
}

function normalizeTrackRow(track) {
  const album = track?.album || {};
  const artists = Array.isArray(track?.artists) ? track.artists : [];
  const images = Array.isArray(album.images) ? album.images : [];

  return {
    id: String(track?.id || ""),
    name: String(track?.name || "Track"),
    artists: artists
      .map((artist) => String(artist?.name || "").trim())
      .filter(Boolean),
    artist_ids: artists
      .map((artist) => String(artist?.id || "").trim())
      .filter(Boolean),
    album: {
      id: String(album?.id || ""),
      name: String(album?.name || "").trim(),
      images: images
        .map((img) => ({
          url: String(img?.url || "").trim(),
          width: Number(img?.width || 0),
          height: Number(img?.height || 0)
        }))
        .filter((img) => !!img.url)
    },
    image: String(images?.[0]?.url || "").trim(),
    preview_url: String(track?.preview_url || "").trim(),
    external_url: String(track?.external_urls?.spotify || "").trim(),
    popularity: Number(track?.popularity || 0),
    duration_ms: Number(track?.duration_ms || 0),
    explicit: !!track?.explicit
  };
}

function normalizeAlbumRow(album) {
  const artists = Array.isArray(album?.artists) ? album.artists : [];
  const images = Array.isArray(album?.images) ? album.images : [];
  return {
    id: String(album?.id || ""),
    kind: "album",
    name: String(album?.name || "Album"),
    artists: artists
      .map((artist) => String(artist?.name || "").trim())
      .filter(Boolean),
    artist_ids: artists
      .map((artist) => String(artist?.id || "").trim())
      .filter(Boolean),
    image: String(images?.[0]?.url || "").trim(),
    images: images
      .map((img) => ({
        url: String(img?.url || "").trim(),
        width: Number(img?.width || 0),
        height: Number(img?.height || 0)
      }))
      .filter((img) => !!img.url),
    external_url: String(album?.external_urls?.spotify || "").trim(),
    release_date: String(album?.release_date || "").trim(),
    total_tracks: Number(album?.total_tracks || 0),
    album_type: String(album?.album_type || "").trim(),
    popularity: Number(album?.popularity || 0),
    label: String(album?.label || "").trim(),
    genres: Array.isArray(album?.genres) ? album.genres.map((g) => String(g || "").trim()).filter(Boolean) : [],
    explicit: !!album?.explicit
  };
}

function normalizeArtistRow(artist) {
  const images = Array.isArray(artist?.images) ? artist.images : [];
  const genres = Array.isArray(artist?.genres) ? artist.genres : [];
  return {
    id: String(artist?.id || ""),
    name: String(artist?.name || "Artist"),
    image: String(images?.[0]?.url || "").trim(),
    genres: genres.map((g) => String(g || "").trim()).filter(Boolean),
    followers: Number(artist?.followers?.total || 0),
    popularity: Number(artist?.popularity || 0),
    external_url: String(artist?.external_urls?.spotify || "").trim()
  };
}

function normalizeItunesTrackRow(track) {
  return {
    id: String(track?.trackId || track?.collectionId || ""),
    name: String(track?.trackName || track?.collectionName || "Track"),
    artists: [String(track?.artistName || "").trim()].filter(Boolean),
    album: {
      id: String(track?.collectionId || ""),
      name: String(track?.collectionName || "").trim(),
      images: [String(track?.artworkUrl100 || track?.artworkUrl60 || "").trim()]
        .filter(Boolean)
        .map((url) => ({ url, width: 100, height: 100 }))
    },
    image: String(track?.artworkUrl100 || track?.artworkUrl60 || "").trim(),
    preview_url: String(track?.previewUrl || "").trim(),
    external_url: String(track?.trackViewUrl || "").trim(),
    popularity: 0,
    duration_ms: Number(track?.trackTimeMillis || 0),
    explicit: false
  };
}

function normalizeItunesAlbumRow(album) {
  return {
    id: String(album?.collectionId || album?.id || ""),
    kind: "album",
    name: String(album?.collectionName || "Album"),
    artists: [String(album?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    image: String(album?.artworkUrl100 || album?.artworkUrl60 || "").trim(),
    images: [String(album?.artworkUrl100 || album?.artworkUrl60 || "").trim()]
      .filter(Boolean)
      .map((url) => ({ url, width: 100, height: 100 })),
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

function normalizeAppleChartSongRow(song) {
  const rawArtwork = String(song?.artworkUrl100 || "").trim();
  const hiResArtwork = rawArtwork
    ? rawArtwork
      .replace(/\/[0-9]+x[0-9]+bb\./i, "/640x640bb.")
      .replace(/\/[0-9]+x[0-9]+\./i, "/640x640.")
    : "";
  return {
    id: String(song?.id || song?.url || ""),
    name: String(song?.name || "Track"),
    artists: [String(song?.artistName || "").trim()].filter(Boolean),
    artist_ids: [],
    album: {
      id: "",
      name: String(song?.name || "").trim(),
      images: hiResArtwork ? [{ url: hiResArtwork, width: 640, height: 640 }] : []
    },
    image: hiResArtwork,
    preview_url: "",
    external_url: String(song?.url || "").trim(),
    popularity: 0,
    duration_ms: 0,
    explicit: !!song?.contentAdvisoryRating
  };
}

function isLowSignalTrack(row) {
  const track = String(row?.name || "").toLowerCase();
  const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").toLowerCase() : "";
  const album = String(row?.album?.name || "").toLowerCase();
  const all = `${track} ${artist} ${album}`;
  return CURATION_KEYWORDS_BLOCKLIST.some((term) => all.includes(term));
}

function dedupeTracks(rows = []) {
  const byId = new Set();
  const byKey = new Set();
  const out = [];
  rows.forEach((row) => {
    const id = String(row?.id || "").trim();
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    const key = `${name}::${artist}`;
    if (!name || !artist) return;
    if (id && byId.has(id)) return;
    if (byKey.has(key)) return;
    if (id) byId.add(id);
    byKey.add(key);
    out.push(row);
  });
  return out;
}

function isLowSignalAlbum(row) {
  const name = String(row?.name || "").toLowerCase();
  const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").toLowerCase() : "";
  const type = String(row?.album_type || "").toLowerCase();
  const all = `${name} ${artist} ${type}`;
  return CURATION_KEYWORDS_BLOCKLIST.some((term) => all.includes(term));
}

function dedupeAlbums(rows = []) {
  const byId = new Set();
  const byKey = new Set();
  const out = [];
  rows.forEach((row) => {
    const id = String(row?.id || "").trim();
    const name = String(row?.name || "").trim().toLowerCase();
    const artist = Array.isArray(row?.artists) ? String(row.artists[0] || "").trim().toLowerCase() : "";
    const key = `${name}::${artist}`;
    if (!name || !artist) return;
    if (id && byId.has(id)) return;
    if (byKey.has(key)) return;
    if (id) byId.add(id);
    byKey.add(key);
    out.push(row);
  });
  return out;
}

function chunkArray(items = [], chunkSize = 20) {
  const size = Math.max(1, Number(chunkSize) || 20);
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function readCacheEntry(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (!entry.expiresAt || Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCacheEntry(cache, key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + Math.max(1, Number(ttlMs) || 1)
  });
}

function computeAlbumTrendScore(row) {
  const popularity = Number(row?.popularity || 0);
  const totalTracks = Number(row?.total_tracks || 0);
  const releaseMs = Date.parse(String(row?.release_date || "").trim());
  const recentBoost = Number.isFinite(releaseMs)
    ? Math.max(0, 1 - ((Date.now() - releaseMs) / (1000 * 60 * 60 * 24 * 365 * 8)))
    : 0;
  const tracksBoost = Math.min(24, Math.max(0, totalTracks));
  return Number((popularity * 0.72 + recentBoost * 22 + tracksBoost * 0.35).toFixed(4));
}

async function fetchSpotifyAlbumsByIds(ids = [], { market = "US" } = {}) {
  const uniqueIds = Array.from(new Set(
    (Array.isArray(ids) ? ids : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean)
  ));
  if (!uniqueIds.length) return [];

  const cached = [];
  const missing = [];
  uniqueIds.forEach((id) => {
    const key = `${market}:${id}`;
    const hit = readCacheEntry(albumDetailsCache, key);
    if (hit) {
      cached.push(hit);
    } else {
      missing.push(id);
    }
  });

  const fetched = [];
  const chunks = chunkArray(missing, 20);
  for (const group of chunks) {
    const json = await spotifyRequest("/albums", {
      ids: group.join(","),
      market
    });
    const albums = Array.isArray(json?.albums) ? json.albums : [];
    albums.forEach((album) => {
      const normalized = normalizeAlbumRow(album);
      if (!normalized.id) return;
      writeCacheEntry(albumDetailsCache, `${market}:${normalized.id}`, normalized, ALBUM_DETAILS_CACHE_TTL_MS);
      fetched.push(normalized);
    });
  }

  const mergedById = new Map();
  [...cached, ...fetched].forEach((row) => {
    const id = String(row?.id || "").trim();
    if (!id) return;
    mergedById.set(id, row);
  });

  return uniqueIds
    .map((id) => mergedById.get(id))
    .filter(Boolean);
}

function filterAlbumsByType(rows = [], allowedTypes = ["album"]) {
  const allow = new Set((Array.isArray(allowedTypes) ? allowedTypes : [])
    .map((type) => String(type || "").trim().toLowerCase())
    .filter(Boolean));
  if (!allow.size) return rows;
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const albumType = String(row?.album_type || "").trim().toLowerCase();
    return allow.has(albumType || "album");
  });
}

async function searchItunesTracks({ q, limit }) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(clampInt(limit, 1, 50, 20)));
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = await res.json();
  const rows = Array.isArray(json?.results) ? json.results : [];
  return rows.map(normalizeItunesTrackRow).filter((row) => !!row.id);
}

async function searchItunesAlbums({ q, limit }) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", String(q || "").trim());
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "album");
  url.searchParams.set("limit", String(clampInt(limit, 1, 50, 20)));
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = await res.json();
  const rows = Array.isArray(json?.results) ? json.results : [];
  return rows.map(normalizeItunesAlbumRow).filter((row) => !!row.id);
}

async function fetchAppleMostPlayedSongs({ country = "us", limit = 50 }) {
  const countryCode = String(country || "us").trim().toLowerCase().slice(0, 2) || "us";
  const safeLimit = clampInt(limit, 10, 100, 50);
  const url = `https://rss.applemarketingtools.com/api/v2/${countryCode}/music/most-played/${safeLimit}/songs.json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const rows = Array.isArray(json?.feed?.results) ? json.feed.results : [];
  return rows.map(normalizeAppleChartSongRow).filter((row) => !!row.id);
}

async function getSpotifyAccessToken(forceRefresh = false) {
  if (!forceRefresh && spotifyTokenCache.accessToken && Date.now() < (spotifyTokenCache.expiresAt - TOKEN_REFRESH_SKEW_MS)) {
    return spotifyTokenCache.accessToken;
  }

  const { clientId, clientSecret } = getSpotifyCredentials();
  if (!clientId || !clientSecret) {
    const err = new Error("Spotify credentials are not configured.");
    err.code = "SPOTIFY_DISABLED";
    throw err;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const accessToken = String(json?.access_token || "");
  const expiresIn = Number(json?.expires_in || 0);
  if (!accessToken || !expiresIn) {
    throw new Error("Spotify token response was invalid.");
  }

  spotifyTokenCache = {
    accessToken,
    expiresAt: Date.now() + (expiresIn * 1000)
  };
  return accessToken;
}

async function spotifyRequest(path, params = {}, retry = true) {
  const accessToken = await getSpotifyAccessToken(false);
  const url = new URL(`${SPOTIFY_API_BASE}${String(path || "").startsWith("/") ? path : `/${String(path || "")}`}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (res.status === 401 && retry) {
    spotifyTokenCache = { accessToken: "", expiresAt: 0 };
    return spotifyRequest(path, params, false);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify request failed (${res.status}): ${body}`);
  }

  return res.json();
}

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "spotify-proxy",
    configured: hasSpotifyCredentials(),
    routes: ["/search", "/top-50", "/popular", "/popular-albums", "/featured-playlists", "/new-releases", "/tracks/:id"]
  });
});

router.get("/top-50", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 100, 50);
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";

  try {
    if (!hasSpotifyCredentials()) {
      const [marketChart, usChart] = await Promise.all([
        fetchAppleMostPlayedSongs({ country: market, limit: Math.max(50, limit) }),
        market === "US"
          ? Promise.resolve([])
          : fetchAppleMostPlayedSongs({ country: "US", limit: Math.max(50, limit) })
      ]);
      const fallback = dedupeTracks([...marketChart, ...usChart])
        .filter((row) => !isLowSignalTrack(row))
        .slice(0, limit);
      return res.json({
        count: fallback.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results: fallback
      });
    }

    const chartBatches = await Promise.all(TOP_50_PLAYLIST_IDS.map(async (playlistId) => {
      const json = await spotifyRequest(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
        market,
        limit: 50,
        additional_types: "track",
        offset: 0
      });
      const items = Array.isArray(json?.items) ? json.items : [];
      return items
        .map((row) => normalizeTrackRow(row?.track))
        .filter((row) => !!row.id);
    }));

    const merged = dedupeTracks(chartBatches.flat())
      .filter((row) => !!row.image && !isLowSignalTrack(row))
      .slice(0, limit);

    return res.json({
      count: merged.length,
      limit,
      offset: 0,
      source: "spotify-top-50-playlists",
      playlist_ids: [...TOP_50_PLAYLIST_IDS],
      results: merged
    });
  } catch (error) {
    try {
      const [marketChart, usChart] = await Promise.all([
        fetchAppleMostPlayedSongs({ country: market, limit: Math.max(50, limit) }),
        market === "US"
          ? Promise.resolve([])
          : fetchAppleMostPlayedSongs({ country: "US", limit: Math.max(50, limit) })
      ]);
      const fallback = dedupeTracks([...marketChart, ...usChart])
        .filter((row) => !isLowSignalTrack(row))
        .slice(0, limit);
      return res.json({
        count: fallback.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results: fallback
      });
    } catch (_fallbackError) {
      return res.status(500).json({ message: "Failed to load top 50 music.", error: String(error?.message || error) });
    }
  }
});

router.get("/popular", async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 50, 24);
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";

  try {
    if (!hasSpotifyCredentials()) {
      const [marketChart, usChart] = await Promise.all([
        fetchAppleMostPlayedSongs({ country: market, limit: Math.max(50, limit) }),
        market === "US"
          ? Promise.resolve([])
          : fetchAppleMostPlayedSongs({ country: "US", limit: Math.max(50, limit) })
      ]);
      const fallback = dedupeTracks([...marketChart, ...usChart])
        .filter((row) => !isLowSignalTrack(row))
        .slice(0, limit);
      return res.json({
        count: fallback.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results: fallback
      });
    }

    const perPlaylistLimit = clampInt(Math.max(limit, 24), 10, 50, 24);
    const chartBatches = await Promise.all(POPULAR_PLAYLIST_IDS.map(async (playlistId) => {
      const json = await spotifyRequest(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
        market,
        limit: perPlaylistLimit,
        additional_types: "track",
        offset: 0
      });
      const items = Array.isArray(json?.items) ? json.items : [];
      return items
        .map((row) => normalizeTrackRow(row?.track))
        .filter((row) => !!row.id);
    }));

    const featuredJson = await spotifyRequest("/browse/featured-playlists", {
      country: market,
      locale: "en_US",
      limit: 8
    });
    const featuredPlaylists = Array.isArray(featuredJson?.playlists?.items) ? featuredJson.playlists.items : [];
    const featuredBatches = await Promise.all(featuredPlaylists.slice(0, 6).map(async (playlist) => {
      const playlistId = String(playlist?.id || "").trim();
      if (!playlistId) return [];
      const json = await spotifyRequest(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
        market,
        limit: 10,
        additional_types: "track",
        offset: 0
      });
      const items = Array.isArray(json?.items) ? json.items : [];
      return items
        .map((row) => normalizeTrackRow(row?.track))
        .filter((row) => !!row.id);
    }));

    const newReleasesJson = await spotifyRequest("/browse/new-releases", {
      country: market,
      limit: 10
    });
    const albumItems = Array.isArray(newReleasesJson?.albums?.items) ? newReleasesJson.albums.items : [];
    const albumTrackIds = new Set();
    await Promise.all(albumItems.slice(0, 8).map(async (album) => {
      const albumId = String(album?.id || "").trim();
      if (!albumId) return;
      const albumTracksJson = await spotifyRequest(`/albums/${encodeURIComponent(albumId)}/tracks`, {
        market,
        limit: 2
      });
      const albumTracks = Array.isArray(albumTracksJson?.items) ? albumTracksJson.items : [];
      albumTracks.forEach((track) => {
        const id = String(track?.id || "").trim();
        if (id) albumTrackIds.add(id);
      });
    }));
    let newReleaseTracks = [];
    const idChunks = Array.from(albumTrackIds);
    if (idChunks.length) {
      const tracksJson = await spotifyRequest("/tracks", {
        ids: idChunks.slice(0, 50).join(","),
        market
      });
      const tracks = Array.isArray(tracksJson?.tracks) ? tracksJson.tracks : [];
      newReleaseTracks = tracks.map((row) => normalizeTrackRow(row)).filter((row) => !!row.id);
    }

    const merged = dedupeTracks([
      ...chartBatches.flat(),
      ...featuredBatches.flat(),
      ...newReleaseTracks
    ]).filter((row) => !!row.image && !isLowSignalTrack(row));

    const ranked = merged
      .sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0))
      .slice(0, limit);

    return res.json({
      count: ranked.length,
      limit,
      offset: 0,
      source: "spotify-playlists",
      results: ranked
    });
  } catch (error) {
    try {
      const [marketChart, usChart] = await Promise.all([
        fetchAppleMostPlayedSongs({ country: market, limit: Math.max(50, limit) }),
        market === "US"
          ? Promise.resolve([])
          : fetchAppleMostPlayedSongs({ country: "US", limit: Math.max(50, limit) })
      ]);
      const fallback = dedupeTracks([...marketChart, ...usChart])
        .filter((row) => !isLowSignalTrack(row))
        .slice(0, limit);
      return res.json({
        count: fallback.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        results: fallback
      });
    } catch (_fallbackError) {
      return res.status(500).json({ message: "Failed to load popular music.", error: String(error?.message || error) });
    }
  }
});

router.get("/featured-playlists", async (req, res) => {
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  const limit = clampInt(req.query.limit, 1, 20, 8);
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }
    const json = await spotifyRequest("/browse/featured-playlists", {
      country: market,
      locale: "en_US",
      limit
    });
    const items = Array.isArray(json?.playlists?.items) ? json.playlists.items : [];
    const results = items.map((item) => ({
      id: String(item?.id || "").trim(),
      name: String(item?.name || "").trim(),
      description: String(item?.description || "").trim(),
      image: String(item?.images?.[0]?.url || "").trim(),
      external_url: String(item?.external_urls?.spotify || "").trim()
    })).filter((item) => !!item.id);
    return res.json({ count: results.length, limit, results, source: "spotify" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load featured playlists.", error: String(error?.message || error) });
  }
});

router.get("/popular-albums", async (req, res) => {
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  const limit = clampInt(req.query.limit, 1, 60, 24);
  const albumTypes = String(req.query.album_types || "album")
    .split(",")
    .map((type) => String(type || "").trim().toLowerCase())
    .filter(Boolean);
  const albumTypesKey = albumTypes.join(",") || "album";
  const cacheKey = `${market}:${limit}:${albumTypesKey}`;

  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }

    const cached = readCacheEntry(popularAlbumsCache, cacheKey);
    if (cached) {
      return res.json({
        count: cached.length,
        limit,
        source: "spotify-popular-albums-cache",
        album_types: albumTypesKey,
        results: cached
      });
    }

    const [newReleasesJson, playlistBatches] = await Promise.all([
      spotifyRequest("/browse/new-releases", { country: market, limit: 50 }),
      Promise.all(POPULAR_PLAYLIST_IDS.map(async (playlistId) => {
        const json = await spotifyRequest(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
          market,
          limit: 50,
          additional_types: "track",
          offset: 0
        });
        return Array.isArray(json?.items) ? json.items : [];
      }))
    ]);

    const releaseAlbums = Array.isArray(newReleasesJson?.albums?.items) ? newReleasesJson.albums.items : [];
    const seedAlbumIds = new Set();
    const artistCounts = new Map();

    releaseAlbums.forEach((album) => {
      const id = String(album?.id || "").trim();
      if (id) seedAlbumIds.add(id);
    });

    playlistBatches.flat().forEach((entry) => {
      const track = entry?.track;
      const albumId = String(track?.album?.id || "").trim();
      if (albumId) seedAlbumIds.add(albumId);
      const artists = Array.isArray(track?.artists) ? track.artists : [];
      artists.forEach((artist) => {
        const artistId = String(artist?.id || "").trim();
        if (!artistId) return;
        artistCounts.set(artistId, Number(artistCounts.get(artistId) || 0) + 1);
      });
    });

    const topArtistIds = Array.from(artistCounts.entries())
      .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
      .slice(0, 14)
      .map(([artistId]) => String(artistId || "").trim())
      .filter(Boolean);

    const artistAlbumBatches = await Promise.all(topArtistIds.map(async (artistId) => {
      const json = await spotifyRequest(`/artists/${encodeURIComponent(artistId)}/albums`, {
        include_groups: "album,single,compilation",
        market,
        limit: 18
      });
      const items = Array.isArray(json?.items) ? json.items : [];
      return items;
    }));

    artistAlbumBatches.flat().forEach((album) => {
      const id = String(album?.id || "").trim();
      if (id) seedAlbumIds.add(id);
    });

    const seedIds = Array.from(seedAlbumIds).slice(0, 260);
    const detailedAlbums = await fetchSpotifyAlbumsByIds(seedIds, { market });
    const filtered = filterAlbumsByType(detailedAlbums, albumTypes)
      .filter((row) => !!String(row?.image || "").trim())
      .filter((row) => !isLowSignalAlbum(row));

    const ranked = dedupeAlbums(filtered)
      .map((row) => ({ ...row, trend_score: computeAlbumTrendScore(row) }))
      .sort((a, b) => (
        Number(b?.trend_score || 0) - Number(a?.trend_score || 0) ||
        Number(b?.popularity || 0) - Number(a?.popularity || 0) ||
        Number(Date.parse(String(b?.release_date || "")) || 0) - Number(Date.parse(String(a?.release_date || "")) || 0)
      ))
      .slice(0, limit);

    writeCacheEntry(popularAlbumsCache, cacheKey, ranked, POPULAR_ALBUMS_CACHE_TTL_MS);

    return res.json({
      count: ranked.length,
      limit,
      source: "spotify-popular-albums",
      album_types: albumTypesKey,
      results: ranked
    });
  } catch (error) {
    try {
      const fallbackJson = await spotifyRequest("/browse/new-releases", { country: market, limit: Math.max(limit * 2, 30) });
      const releaseAlbums = Array.isArray(fallbackJson?.albums?.items) ? fallbackJson.albums.items : [];
      const releaseIds = releaseAlbums
        .map((row) => String(row?.id || "").trim())
        .filter(Boolean);
      const detailed = await fetchSpotifyAlbumsByIds(releaseIds, { market });
      const results = dedupeAlbums(
        filterAlbumsByType(detailed, albumTypes)
          .filter((row) => !!String(row?.image || "").trim())
          .filter((row) => !isLowSignalAlbum(row))
      )
        .map((row) => ({ ...row, trend_score: computeAlbumTrendScore(row) }))
        .sort((a, b) => Number(b?.trend_score || 0) - Number(a?.trend_score || 0))
        .slice(0, limit);
      return res.json({
        count: results.length,
        limit,
        source: "spotify-new-releases-fallback",
        album_types: albumTypesKey,
        results
      });
    } catch (_fallbackError) {
      return res.status(500).json({ message: "Failed to load popular albums.", error: String(error?.message || error) });
    }
  }
});

router.get("/new-releases", async (req, res) => {
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  const limit = clampInt(req.query.limit, 1, 50, 20);
  const albumTypes = String(req.query.album_types || "album")
    .split(",")
    .map((type) => String(type || "").trim().toLowerCase())
    .filter(Boolean);
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }
    const json = await spotifyRequest("/browse/new-releases", { country: market, limit });
    const items = Array.isArray(json?.albums?.items) ? json.albums.items : [];
    const seedAlbums = items
      .map((item) => normalizeAlbumRow(item))
      .filter((item) => !!item.id);
    const detailedAlbums = await fetchSpotifyAlbumsByIds(seedAlbums.map((item) => item.id), { market });
    const detailedMap = new Map(detailedAlbums.map((item) => [item.id, item]));
    const merged = seedAlbums.map((seed) => ({
      ...seed,
      ...(detailedMap.get(seed.id) || {})
    }));
    const results = dedupeAlbums(filterAlbumsByType(merged, albumTypes))
      .filter((item) => !!String(item?.image || "").trim())
      .slice(0, limit);
    return res.json({
      count: results.length,
      limit,
      album_types: (albumTypes.join(",") || "album"),
      results,
      source: "spotify"
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load new releases.", error: String(error?.message || error) });
  }
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 120);
  if (!q) {
    return res.status(400).json({ message: "Missing q query parameter." });
  }

  const limit = clampInt(req.query.limit, 1, 50, 20);
  const offset = clampInt(req.query.offset, 0, 500, 0);
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  const rawType = String(req.query.type || "track")
    .split(",")
    .map((part) => String(part || "").trim().toLowerCase())
    .filter(Boolean);
  const allowedTypes = new Set(["track", "album"]);
  const safeTypes = rawType.filter((type) => allowedTypes.has(type));
  if (!safeTypes.length) safeTypes.push("track");
  const includeTracks = safeTypes.includes("track");
  const includeAlbums = safeTypes.includes("album");
  const spotifyType = safeTypes.join(",");
  const albumTypes = String(req.query.album_types || "album")
    .split(",")
    .map((type) => String(type || "").trim().toLowerCase())
    .filter(Boolean);
  const albumTypesKey = albumTypes.join(",") || "album";

  try {
    if (!hasSpotifyCredentials()) {
      const [fallbackTracks, fallbackAlbums] = await Promise.all([
        includeTracks ? searchItunesTracks({ q, limit }) : Promise.resolve([]),
        includeAlbums ? searchItunesAlbums({ q, limit }) : Promise.resolve([])
      ]);
      const fallbackPrimary = includeTracks ? fallbackTracks : fallbackAlbums;
      const fallbackCount = includeTracks && includeAlbums
        ? (fallbackTracks.length + fallbackAlbums.length)
        : fallbackPrimary.length;
      return res.json({
        count: fallbackCount,
        track_count: fallbackTracks.length,
        album_count: fallbackAlbums.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        type: spotifyType,
        album_types: albumTypesKey,
        results: fallbackPrimary,
        tracks: fallbackTracks,
        albums: filterAlbumsByType(fallbackAlbums, albumTypes)
      });
    }

    const json = await spotifyRequest("/search", {
      q,
      type: spotifyType,
      limit,
      offset,
      market
    });
    const trackRows = includeTracks && Array.isArray(json?.tracks?.items) ? json.tracks.items : [];
    const albumRows = includeAlbums && Array.isArray(json?.albums?.items) ? json.albums.items : [];
    const tracks = trackRows.map(normalizeTrackRow).filter((row) => !!row.id);
    const seedAlbums = albumRows.map(normalizeAlbumRow).filter((row) => !!row.id);
    const detailedAlbums = includeAlbums
      ? await fetchSpotifyAlbumsByIds(seedAlbums.map((row) => row.id), { market })
      : [];
    const detailedMap = new Map(detailedAlbums.map((row) => [row.id, row]));
    const albums = filterAlbumsByType(seedAlbums.map((seed) => ({
      ...seed,
      ...(detailedMap.get(seed.id) || {})
    })), albumTypes);
    const primaryResults = includeTracks ? tracks : albums;
    const trackCount = Number(json?.tracks?.total || tracks.length || 0);
    const albumCount = Number(albums.length || json?.albums?.total || 0);
    return res.json({
      count: includeTracks && includeAlbums ? (trackCount + albumCount) : (includeTracks ? trackCount : albumCount),
      track_count: trackCount,
      album_count: albumCount,
      limit,
      offset,
      source: "spotify",
      type: spotifyType,
      album_types: albumTypesKey,
      results: primaryResults,
      tracks,
      albums
    });
  } catch (error) {
    try {
      const [fallbackTracks, fallbackAlbums] = await Promise.all([
        includeTracks ? searchItunesTracks({ q, limit }) : Promise.resolve([]),
        includeAlbums ? searchItunesAlbums({ q, limit }) : Promise.resolve([])
      ]);
      const fallbackPrimary = includeTracks ? fallbackTracks : fallbackAlbums;
      const fallbackCount = includeTracks && includeAlbums
        ? (fallbackTracks.length + fallbackAlbums.length)
        : fallbackPrimary.length;
      return res.json({
        count: fallbackCount,
        track_count: fallbackTracks.length,
        album_count: fallbackAlbums.length,
        limit,
        offset: 0,
        source: "itunes-fallback",
        type: spotifyType,
        album_types: albumTypesKey,
        results: fallbackPrimary,
        tracks: fallbackTracks,
        albums: filterAlbumsByType(fallbackAlbums, albumTypes)
      });
    } catch (_fallbackError) {
      return res.status(500).json({ message: "Failed to search music.", error: String(error?.message || error) });
    }
  }
});

router.get("/tracks/:id", async (req, res) => {
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }

    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Invalid track id." });

    const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
    const json = await spotifyRequest(`/tracks/${encodeURIComponent(id)}`, { market });
    return res.json(normalizeTrackRow(json));
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("(404)")) {
      return res.status(404).json({ message: "Track not found." });
    }
    return res.status(500).json({ message: "Failed to load track details.", error: message });
  }
});

router.get("/artists/:id", async (req, res) => {
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }

    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Invalid artist id." });

    const json = await spotifyRequest(`/artists/${encodeURIComponent(id)}`);
    return res.json(normalizeArtistRow(json));
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("(404)")) {
      return res.status(404).json({ message: "Artist not found." });
    }
    return res.status(500).json({ message: "Failed to load artist details.", error: message });
  }
});

export default router;
