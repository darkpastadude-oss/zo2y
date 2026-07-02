const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com/api";
const SPOTIFY_API = "https://api.spotify.com/v1";
const DEEZER_API = "https://api.deezer.com";

const spotifyConfig = {
  clientId: String(process.env.SPOTIFY_CLIENT_ID || "").trim(),
  clientSecret: String(process.env.SPOTIFY_CLIENT_SECRET || "").trim()
};

let spotifyToken = null;
let spotifyTokenExpires = 0;

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function setResponseCache(res, opts = {}) {
  const maxAge = Math.max(0, Number(opts.maxAge) || 300);
  const swr = Math.max(0, Number(opts.staleWhileRevalidate) || 900);
  res.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toHttps(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  return raw;
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_) { return {}; }
}

function readPathParts(query) {
  const raw = query?.path;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw || "").split("/").filter(Boolean);
}

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpires - 60000) return spotifyToken;
  if (!spotifyConfig.clientId || !spotifyConfig.clientSecret) return null;
  try {
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    const res = await fetch(`${SPOTIFY_ACCOUNTS}/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    if (!res.ok) return null;
    const json = await res.json();
    spotifyToken = json.access_token;
    spotifyTokenExpires = Date.now() + (json.expires_in || 3600) * 1000;
    return spotifyToken;
  } catch (_) { return null; }
}

async function spotifyFetch(endpoint, params = {}, timeoutMs = 7000) {
  const token = await getSpotifyToken();
  if (!token) return null;
  const url = new URL(`${SPOTIFY_API}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) { if (res.status === 429) await new Promise(r => setTimeout(r, 2000)); return null; }
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

async function deezerFetch(endpoint, params = {}, timeoutMs = 7000) {
  const url = new URL(`${DEEZER_API}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

function normalizeSpotifyTrack(track) {
  if (!track) return null;
  const album = track.album || {};
  const images = album.images || [];
  const image = images.length > 0 ? images[0]?.url : "";
  const artists = (track.artists || []).map(a => String(a.name || "").trim()).filter(Boolean);
  return {
    id: String(track.id || ""),
    mediaType: "music",
    title: String(track.name || "").trim(),
    subtitle: artists.join(", "),
    artist: artists.join(", "),
    artists,
    albumName: String(album.name || "").trim(),
    albumId: String(album.id || ""),
    albumType: String(album.album_type || "album"),
    image,
    backdrop: image,
    previewUrl: String(track.preview_url || "").trim(),
    externalUrl: String(track.external_urls?.spotify || "").trim(),
    durationMs: Number(track.duration_ms || 0),
    popularity: Number(track.popularity || 0),
    trackNumber: Number(track.track_number || 0),
    discNumber: Number(track.disc_number || 0),
    explicit: !!track.explicit,
    releaseDate: String(album.release_date || "").trim(),
    genres: (album.genres || []).map(g => String(g).trim()).filter(Boolean),
    totalTracks: Number(album.total_tracks || 0),
    language: "",
    rating: 0,
    provider: "spotify",
    providerId: String(track.id || ""),
    coverColor: ""
  };
}

function normalizeDeezerTrack(track) {
  if (!track) return null;
  const album = track.album || {};
  const artist = track.artist || {};
  const image = String(track.album?.cover_big || track.album?.cover_medium || track.album?.cover || "").trim();
  return {
    id: String(track.id || ""),
    mediaType: "music",
    title: String(track.title || "").trim(),
    subtitle: String(artist.name || "").trim(),
    artist: String(artist.name || "").trim(),
    artists: [String(artist.name || "").trim()].filter(Boolean),
    albumName: String(album.title || "").trim(),
    albumId: String(album.id || ""),
    albumType: "album",
    image: toHttps(image),
    backdrop: toHttps(image),
    previewUrl: String(track.preview || "").trim(),
    externalUrl: String(track.link || "").trim(),
    durationMs: Number(track.duration || 0) * 1000,
    popularity: Number(track.rank || 0),
    trackNumber: Number(track.track_position || 0),
    discNumber: 1,
    explicit: !!track.explicit_lyrics,
    releaseDate: String(album.release_date || "").trim(),
    genres: [],
    totalTracks: 0,
    language: "",
    rating: Number(track.rank || 0),
    provider: "deezer",
    providerId: String(track.id || ""),
    coverColor: ""
  };
}

function normalizeSpotifyAlbum(album) {
  if (!album) return null;
  const images = album.images || [];
  const image = images.length > 0 ? images[0]?.url : "";
  const artists = (album.artists || []).map(a => String(a.name || "").trim()).filter(Boolean);
  const genres = (album.genres || []).map(g => String(g).trim()).filter(Boolean);
  return {
    id: String(album.id || ""),
    mediaType: "music",
    title: String(album.name || "").trim(),
    subtitle: artists.join(", "),
    artist: artists.join(", "),
    artists,
    albumName: String(album.name || "").trim(),
    albumId: String(album.id || ""),
    albumType: String(album.album_type || "album"),
    image,
    backdrop: image,
    previewUrl: "",
    externalUrl: String(album.external_urls?.spotify || "").trim(),
    durationMs: 0,
    popularity: Number(album.popularity || 0),
    totalTracks: Number(album.total_tracks || 0),
    releaseDate: String(album.release_date || "").trim(),
    genres,
    label: String(album.label || "").trim(),
    copyrights: (album.copyrights || []).map(c => String(c.text || "").trim()).filter(Boolean),
    explicit: false,
    language: "",
    rating: 0,
    provider: "spotify",
    providerId: String(album.id || ""),
    coverColor: ""
  };
}

function normalizeDeezerAlbum(album) {
  if (!album) return null;
  const artist = album.artist || {};
  const image = String(album.cover_big || album.cover_medium || album.cover_xl || album.cover || "").trim();
  const genres = (album.genres?.data || []).map(g => String(g.name || "").trim()).filter(Boolean);
  return {
    id: String(album.id || ""),
    mediaType: "music",
    title: String(album.title || "").trim(),
    subtitle: String(artist.name || "").trim(),
    artist: String(artist.name || "").trim(),
    artists: [String(artist.name || "").trim()].filter(Boolean),
    albumName: String(album.title || "").trim(),
    albumId: String(album.id || ""),
    albumType: "album",
    image: toHttps(image),
    backdrop: toHttps(image),
    previewUrl: "",
    externalUrl: String(album.link || "").trim(),
    durationMs: 0,
    popularity: Number(album.rank || 0),
    totalTracks: Number(album.nb_tracks || 0),
    releaseDate: String(album.release_date || "").trim(),
    genres,
    label: String(album.label || "").trim(),
    explicit: !!album.explicit_lyrics,
    language: "",
    rating: Number(album.rank || 0),
    provider: "deezer",
    providerId: String(album.id || ""),
    coverColor: ""
  };
}

function dedupeBy(rows, keyFn) {
  const seen = new Set();
  return (rows || []).filter(r => {
    const k = String(keyFn(r) || "").toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function spotifySearchTracks(q, limit = 20, market = "US") {
  const data = await spotifyFetch("search", { q, type: "track", limit: String(limit), market });
  if (!data) return null;
  return (data.tracks?.items || []).map(normalizeSpotifyTrack).filter(Boolean);
}

async function spotifySearchAlbums(q, limit = 20, market = "US") {
  const data = await spotifyFetch("search", { q, type: "album", limit: String(limit), market });
  if (!data) return null;
  return (data.albums?.items || []).map(normalizeSpotifyAlbum).filter(Boolean);
}

async function deezerSearchTracks(q, limit = 20) {
  const data = await deezerFetch("search/track", { q, limit: String(limit) });
  if (!data) return [];
  return (data.data || []).map(normalizeDeezerTrack).filter(Boolean);
}

async function deezerSearchAlbums(q, limit = 20) {
  const data = await deezerFetch("search/album", { q, limit: String(limit) });
  if (!data) return [];
  return (data.data || []).map(normalizeDeezerAlbum).filter(Boolean);
}

async function deezerGetAlbum(id) {
  const data = await deezerFetch(`album/${encodeURIComponent(id)}`);
  if (!data) return null;
  const album = normalizeDeezerAlbum(data);
  const tracks = (data.tracks?.data || []).map(normalizeDeezerTrack).filter(Boolean);
  return { album, tracks };
}

async function deezerGetTrack(id) {
  const data = await deezerFetch(`track/${encodeURIComponent(id)}`);
  return data ? normalizeDeezerTrack(data) : null;
}

async function deezerGetArtistTop(id, limit = 10) {
  const data = await deezerFetch(`artist/${encodeURIComponent(id)}/top`, { limit: String(limit) });
  if (!data) return [];
  return (data.data || []).map(normalizeDeezerTrack).filter(Boolean);
}

async function deezerGetChart() {
  const data = await deezerFetch("chart/0/tracks", { limit: "30" });
  if (!data) return [];
  return (data.data || []).map(normalizeDeezerTrack).filter(Boolean);
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const id = String(pathParts[1] || "").trim();

  if (!section) {
    setResponseCache(res, { maxAge: 900, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", spotifyConfigured: !!spotifyConfig.clientId, routes: ["/search", "/albums/:id", "/tracks/:id", "/trending", "/new-releases", "/popular"] });
  }

  if (section === "health") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", spotifyConfigured: !!spotifyConfig.clientId });
  }

  if (section === "search") {
    setResponseCache(res, { maxAge: 120, staleWhileRevalidate: 600 });
    const q = String(query.q || "").trim().slice(0, 200);
    if (!q) return res.status(400).json({ message: "Missing q parameter" });
    const limit = clampInt(query.limit, 1, 50, 20);
    const market = String(query.market || "US").trim().toUpperCase();
    const type = String(query.type || "track,album").trim().toLowerCase();
    const types = type.split(",").map(t => t.trim()).filter(Boolean);
    const includeTracks = types.includes("track");
    const includeAlbums = types.includes("album");

    let tracks = [];
    let albums = [];

    try {
      if (includeTracks) {
        const spotifyTracks = await spotifySearchTracks(q, Math.min(limit * 2, 50), market);
        if (spotifyTracks) {
          tracks = spotifyTracks;
        } else {
          tracks = await deezerSearchTracks(q, Math.min(limit * 2, 50));
        }
      }
      if (includeAlbums) {
        const spotifyAlbums = await spotifySearchAlbums(q, Math.min(limit * 2, 50), market);
        if (spotifyAlbums) {
          albums = spotifyAlbums;
        } else {
          albums = await deezerSearchAlbums(q, Math.min(limit * 2, 50));
        }
      }
    } catch (_) {}

    tracks = dedupeBy(tracks, t => t.id);
    albums = dedupeBy(albums, a => a.id);

    const mixed = [];
    const max = Math.max(tracks.length, albums.length);
    for (let i = 0; i < max && mixed.length < limit; i++) {
      if (i < tracks.length) mixed.push(tracks[i]);
      if (i < albums.length && mixed.length < limit) mixed.push(albums[i]);
    }

    return res.json({
      count: mixed.length,
      track_count: tracks.length,
      album_count: albums.length,
      limit,
      offset: 0,
      results: mixed.slice(0, limit),
      tracks: tracks.slice(0, limit),
      albums: albums.slice(0, limit)
    });
  }

  if (section === "albums") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Missing album id" });
    const includeTracks = String(query.include_tracks || "true").trim().toLowerCase() !== "false";
    let album = await spotifyFetch(`albums/${encodeURIComponent(id)}`, { market: "US" });
    if (album) {
      const normalized = normalizeSpotifyAlbum(album);
      let tracks = [];
      if (includeTracks && album.tracks?.items) {
        tracks = album.tracks.items.map(normalizeSpotifyTrack).filter(Boolean);
        let next = album.tracks.next;
        while (next) {
          try {
            const more = await (await fetch(next, { headers: { Authorization: `Bearer ${spotifyToken}` } })).json();
            if (more?.items) { tracks.push(...more.items.map(normalizeSpotifyTrack).filter(Boolean)); next = more.next; }
            else break;
          } catch (_) { break; }
        }
      }
      return res.json({ album: normalized, tracks, count: tracks.length, source: "spotify" });
    }
    const deezerResult = await deezerGetAlbum(id);
    if (deezerResult) {
      return res.json({ album: deezerResult.album, tracks: deezerResult.tracks, count: deezerResult.tracks.length, source: "deezer" });
    }
    return res.status(404).json({ message: "Album not found" });
  }

  if (section === "tracks") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Missing track id" });
    let track = await spotifyFetch(`tracks/${encodeURIComponent(id)}`, { market: "US" });
    if (track) return res.json(normalizeSpotifyTrack(track));
    const deezerTrack = await deezerGetTrack(id);
    if (deezerTrack) return res.json(deezerTrack);
    return res.status(404).json({ message: "Track not found" });
  }

  if (section === "artists") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Missing artist id" });
    const artist = await spotifyFetch(`artists/${encodeURIComponent(id)}`);
    if (artist) {
      return res.json({
        id: String(artist.id || ""),
        name: String(artist.name || ""),
        genres: (artist.genres || []).map(g => String(g).trim()).filter(Boolean),
        popularity: Number(artist.popularity || 0),
        followers: Number(artist.followers?.total || 0),
        image: (artist.images || []).length > 0 ? artist.images[0]?.url : "",
        externalUrl: String(artist.external_urls?.spotify || ""),
        provider: "spotify"
      });
    }
    return res.status(404).json({ message: "Artist not found" });
  }

  if (section === "trending" || section === "popular") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt(query.limit, 1, 50, 24);
    let results = [];
    const spotifyResults = await spotifyFetch("search", { q: "year:2024 2025 2026", type: "track", limit: String(limit), market: "US" });
    if (spotifyResults) {
      results = (spotifyResults.tracks?.items || []).map(normalizeSpotifyTrack).filter(Boolean);
    } else {
      const deezerChart = await deezerGetChart();
      results = deezerChart.slice(0, limit);
    }
    return res.json({ count: results.length, limit, offset: 0, results, source: results[0]?.provider || "deezer" });
  }

  if (section === "new-releases") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt(query.limit, 1, 50, 20);
    let results = [];
    const spotifyResults = await spotifyFetch("browse/new-releases", { limit: String(limit), market: "US", country: "US" });
    if (spotifyResults) {
      results = (spotifyResults.albums?.items || []).map(normalizeSpotifyAlbum).filter(Boolean);
    } else {
      const deezerData = await deezerFetch("chart/0/albums", { limit: String(limit) });
      results = (deezerData?.data || []).map(normalizeDeezerAlbum).filter(Boolean);
    }
    return res.json({ count: results.length, limit, results, source: results[0]?.provider || "deezer" });
  }

  setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
  return res.json({ ok: true, service: "music", spotifyConfigured: !!spotifyConfig.clientId });
}
