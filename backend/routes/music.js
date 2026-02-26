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
    album_type: String(album?.album_type || "").trim()
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
    album_type: "album"
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
    routes: ["/search", "/top-50", "/popular", "/featured-playlists", "/new-releases", "/tracks/:id"]
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

router.get("/new-releases", async (req, res) => {
  const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  const limit = clampInt(req.query.limit, 1, 50, 20);
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }
    const json = await spotifyRequest("/browse/new-releases", { country: market, limit });
    const items = Array.isArray(json?.albums?.items) ? json.albums.items : [];
    const results = items.map((item) => ({
      id: String(item?.id || "").trim(),
      kind: "album",
      name: String(item?.name || "").trim(),
      artists: Array.isArray(item?.artists) ? item.artists.map((a) => String(a?.name || "").trim()).filter(Boolean) : [],
      image: String(item?.images?.[0]?.url || "").trim(),
      external_url: String(item?.external_urls?.spotify || "").trim(),
      release_date: String(item?.release_date || "").trim(),
      total_tracks: Number(item?.total_tracks || 0),
      album_type: String(item?.album_type || "").trim()
    })).filter((item) => !!item.id);
    return res.json({ count: results.length, limit, results, source: "spotify" });
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
        results: fallbackPrimary,
        tracks: fallbackTracks,
        albums: fallbackAlbums
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
    const albums = albumRows.map(normalizeAlbumRow).filter((row) => !!row.id);
    const primaryResults = includeTracks ? tracks : albums;
    const trackCount = Number(json?.tracks?.total || tracks.length || 0);
    const albumCount = Number(json?.albums?.total || albums.length || 0);
    return res.json({
      count: includeTracks && includeAlbums ? (trackCount + albumCount) : (includeTracks ? trackCount : albumCount),
      track_count: trackCount,
      album_count: albumCount,
      limit,
      offset,
      source: "spotify",
      type: spotifyType,
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
        results: fallbackPrimary,
        tracks: fallbackTracks,
        albums: fallbackAlbums
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
