const APPLE_SEARCH = "https://itunes.apple.com";
const APPLE_RSS = "https://rss.applemarketingtools.com/api/v2/us/music";

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

async function appleFetch(endpoint, params = {}, timeoutMs = 10000, retries = 3) {
  const url = new URL(`${APPLE_SEARCH}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);
      if (res.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function appleRssFetch(endpoint, timeoutMs = 7000) {
  const url = `${APPLE_RSS}/${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

function normalizeAppleTrack(track) {
  if (!track || track.wrapperType !== "track") return null;
  let image = track.artworkUrl100 || "";
  image = image.replace("100x100bb.jpg", "600x600bb.jpg");
  return {
    id: String(track.trackId || ""),
    mediaType: "music",
    title: String(track.trackName || "").trim(),
    subtitle: String(track.artistName || "").trim(),
    artist: String(track.artistName || "").trim(),
    artists: [String(track.artistName || "").trim()].filter(Boolean),
    albumName: String(track.collectionName || "").trim(),
    albumId: String(track.collectionId || ""),
    albumType: "album",
    image: image,
    backdrop: image,
    previewUrl: String(track.previewUrl || "").trim(),
    externalUrl: String(track.trackViewUrl || track.collectionViewUrl || "").trim(),
    durationMs: Number(track.trackTimeMillis || 0),
    popularity: 0,
    trackNumber: Number(track.trackNumber || 0),
    discNumber: Number(track.discNumber || 1),
    explicit: track.trackExplicitness === "explicit",
    releaseDate: String(track.releaseDate || "").trim(),
    genres: [String(track.primaryGenreName || "").trim()].filter(Boolean),
    totalTracks: Number(track.trackCount || 0),
    language: "",
    rating: 0,
    provider: "apple",
    providerId: String(track.trackId || ""),
    coverColor: ""
  };
}

function normalizeAppleRssTrack(track) {
  if (!track) return null;
  let image = track.artworkUrl100 || "";
  image = image.replace("100x100bb.jpg", "600x600bb.jpg");
  const artist = String(track.artistName || "").trim();
  let genres = [];
  if (track.genres) genres = track.genres.map(g => String(g.name).trim());

  return {
    id: String(track.id || ""),
    mediaType: "music",
    title: String(track.name || "").trim(),
    subtitle: artist,
    artist: artist,
    artists: [artist].filter(Boolean),
    albumName: "",
    albumId: "",
    albumType: "album",
    image: image,
    backdrop: image,
    previewUrl: "",
    externalUrl: String(track.url || "").trim(),
    durationMs: 0,
    popularity: 0,
    trackNumber: 0,
    discNumber: 1,
    explicit: track.contentAdvisoryRating === "Explict",
    releaseDate: String(track.releaseDate || "").trim(),
    genres: genres,
    totalTracks: 0,
    language: "",
    rating: 0,
    provider: "apple",
    providerId: String(track.id || ""),
    coverColor: ""
  };
}

function normalizeAppleAlbum(album) {
  if (!album) return null;
  const isRss = album.kind === "albums";
  if (!isRss && album.wrapperType !== "collection" && album.collectionType !== "Album") return null;
  const id = isRss ? String(album.id || "") : String(album.collectionId || "");
  const artists = [String(album.artistName || "").trim()].filter(Boolean);
  const title = String(album.name || album.collectionName || "").trim();
  const externalUrl = String(album.url || album.collectionViewUrl || "").trim();
  const releaseDate = String(album.releaseDate || "").trim();
  const explicit = album.collectionExplicitness === "explicit" || album.contentAdvisoryRating === "Explict";
  let genres = [];
  if (isRss && album.genres) {
    genres = album.genres.map(g => String(g.name).trim());
  } else if (album.primaryGenreName) {
    genres = [String(album.primaryGenreName).trim()];
  }
  let image = album.artworkUrl100 || "";
  image = image.replace("100x100bb.jpg", "600x600bb.jpg");

  return {
    id: id,
    mediaType: "music",
    title: title || "",
    subtitle: artists.join(", "),
    artist: artists.join(", "),
    artists: artists,
    albumName: title,
    albumId: id,
    albumType: "album",
    image: image,
    backdrop: image,
    previewUrl: "",
    externalUrl: externalUrl,
    durationMs: 0,
    popularity: 0,
    totalTracks: Number(album.trackCount || 0),
    releaseDate: releaseDate,
    genres,
    label: String(album.copyright || "").trim(),
    explicit: explicit,
    language: "",
    rating: 0,
    provider: "apple",
    providerId: id,
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

async function appleSearchTracks(q, limit = 20) {
  const data = await appleFetch("search", { term: q, entity: "song", limit: String(limit) });
  if (!data) return [];
  return (data.results || []).map(normalizeAppleTrack).filter(Boolean);
}

async function appleSearchAlbums(q, limit = 20) {
  const data = await appleFetch("search", { term: q, entity: "album", limit: String(limit) });
  if (!data) return [];
  return (data.results || []).map(normalizeAppleAlbum).filter(Boolean);
}

async function appleGetAlbum(id) {
  const data = await appleFetch("lookup", { id: encodeURIComponent(id), entity: "song" });
  if (!data || !data.results || data.results.length === 0) return null;

  const collection = data.results.find(r => r.wrapperType === "collection");
  const tracksData = data.results.filter(r => r.wrapperType === "track");

  if (!collection) return null;
  const album = normalizeAppleAlbum(collection);
  const tracks = tracksData.map(normalizeAppleTrack).filter(Boolean);
  return { album, tracks };
}

async function appleGetTrack(id) {
  const data = await appleFetch("lookup", { id: encodeURIComponent(id), entity: "song" });
  if (!data || !data.results || data.results.length === 0) return null;
  const track = data.results.find(r => r.wrapperType === "track");
  return track ? normalizeAppleTrack(track) : null;
}

async function appleGetChart(limit = 30) {
  const data = await appleRssFetch(`most-played/${limit}/songs.json`);
  if (!data || !data.feed || !data.feed.results) return [];
  return data.feed.results.map(normalizeAppleRssTrack).filter(Boolean);
}

async function appleGetNewReleases(limit = 20) {
  const data = await appleRssFetch(`most-played/${limit}/albums.json`);
  if (!data || !data.feed || !data.feed.results) return [];
  return data.feed.results.map(normalizeAppleAlbum).filter(Boolean);
}

function normalizeRssArtist(song, rank) {
  if (!song) return null;
  let image = song.artworkUrl100 || "";
  image = image.replace("100x100bb.jpg", "600x600bb.jpg");
  return {
    id: String(song.artistId || ""),
    mediaType: "artist",
    title: String(song.artistName || "").trim(),
    subtitle: String(song.genres?.[0]?.name || "Music").trim(),
    artist: String(song.artistName || "").trim(),
    image: image,
    externalUrl: String(song.artistUrl || "").trim(),
    provider: "apple",
    rank: rank
  };
}

async function appleGetTopArtists(limit = 12) {
  const data = await appleRssFetch(`most-played/${Math.min(limit * 3, 50)}/songs.json`);
  if (!data || !data.feed || !data.feed.results) return [];
  const seen = new Set();
  const artists = [];
  data.feed.results.forEach((song, i) => {
    const key = String(song.artistId || song.artistName || "").toLowerCase();
    if (!key || seen.has(key)) return;
    if (artists.length >= limit) return;
    seen.add(key);
    artists.push(normalizeRssArtist(song, artists.length + 1));
  });
  return artists.filter(Boolean);
}

async function appleGetHomeFeed(artistLimit = 8, albumLimit = 8) {
  const [artists, albums] = await Promise.all([
    appleGetTopArtists(artistLimit),
    appleGetNewReleases(albumLimit)
  ]);
  return { artists, albums };
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const id = String(pathParts[1] || "").trim();

  if (!section) {
    setResponseCache(res, { maxAge: 900, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", provider: "apple", routes: ["/search", "/albums/:id", "/tracks/:id", "/trending", "/new-releases", "/popular"] });
  }

  if (section === "health") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", provider: "apple" });
  }

  if (section === "search") {
    setResponseCache(res, { maxAge: 3600, staleWhileRevalidate: 86400 });
    const q = String(query.q || "").trim().slice(0, 200);
    if (!q) return res.status(400).json({ message: "Missing q parameter" });
    const limit = clampInt(query.limit, 1, 50, 20);
    const type = String(query.type || "track,album").trim().toLowerCase();
    const types = type.split(",").map(t => t.trim()).filter(Boolean);
    const includeTracks = types.includes("track");
    const includeAlbums = types.includes("album");

    let tracks = [];
    let albums = [];

    try {
      if (includeTracks) {
        tracks = await appleSearchTracks(q, Math.min(limit * 2, 50));
      }
      if (includeAlbums) {
        albums = await appleSearchAlbums(q, Math.min(limit * 2, 50));
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
    const appleResult = await appleGetAlbum(id);
    if (appleResult) {
      return res.json({ album: appleResult.album, tracks: appleResult.tracks, count: appleResult.tracks.length, source: "apple" });
    }
    return res.status(404).json({ message: "Album not found" });
  }

  if (section === "tracks") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Missing track id" });
    const appleTrack = await appleGetTrack(id);
    if (appleTrack) return res.json(appleTrack);
    return res.status(404).json({ message: "Track not found" });
  }

  if (section === "artists") {
    setResponseCache(res, { maxAge: 1800, staleWhileRevalidate: 86400 });
    if (!id) return res.status(400).json({ message: "Missing artist id" });
    const data = await appleFetch("lookup", { id: String(id), entity: "musicArtist" });
    if (data && data.results && data.results.length > 0) {
      const artist = data.results[0];
      return res.json({
        id: String(artist.artistId || id || ""),
        name: String(artist.artistName || ""),
        genres: [String(artist.primaryGenreName || "")].filter(Boolean),
        popularity: 0,
        followers: 0,
        image: String(artist.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg"),
        externalUrl: String(artist.artistLinkUrl || ""),
        provider: "apple"
      });
    }
    return res.status(404).json({ message: "Artist not found" });
  }

  if (section === "trending" || section === "popular") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt(query.limit, 1, 50, 24);
    const appleChart = await appleGetChart(limit);
    const results = appleChart.slice(0, limit);
    return res.json({ count: results.length, limit, offset: 0, results, source: "apple" });
  }

  if (section === "new-releases") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt(query.limit, 1, 50, 20);
    const appleData = await appleGetNewReleases(limit);
    const results = appleData.slice(0, limit);
    return res.json({ count: results.length, limit, results, source: "apple" });
  }

  if (section === "popular-albums") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const limit = clampInt(query.limit, 1, 50, 20);
    const appleData = await appleGetNewReleases(limit);
    const results = appleData.slice(0, limit);
    return res.json({ count: results.length, limit, results, source: "apple" });
  }

  if (section === "home") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const artistLimit = clampInt(query.artists, 1, 20, 8);
    const albumLimit = clampInt(query.albums, 1, 20, 8);
    const feed = await appleGetHomeFeed(artistLimit, albumLimit);
    return res.json({ ...feed, artist_count: feed.artists.length, album_count: feed.albums.length, source: "apple" });
  }

  setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
  return res.json({ ok: true, service: "music", provider: "apple" });
}
