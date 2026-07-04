const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com/api";
const SPOTIFY_API = "https://api.spotify.com/v1";
const APPLE_RSS = "https://rss.applemarketingtools.com/api/v2/us/music";

const spotifyConfig = {
  clientId: String(process.env.SPOTIFY_CLIENT_ID || "").trim(),
  clientSecret: String(process.env.SPOTIFY_CLIENT_SECRET || "").trim()
};

let spotifyToken = null;
let spotifyTokenExpires = 0;

const ARTIST_CACHE = new Map();
const ARTIST_CACHE_TTL = 3600 * 1000;

const DEFAULT_GENRES = [
  "pop", "hip-hop", "rap", "r&b", "rock", "country",
  "latin", "indie", "k-pop", "dance", "electronic",
  "alternative", "soul", "jazz", "reggaeton", "metal",
  "punk", "folk", "blues", "classical"
];

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

async function spotifyFetch(endpoint, params = {}, timeoutMs = 8000) {
  const token = await getSpotifyToken();
  if (!token) return null;
  const url = new URL(`${SPOTIFY_API}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

async function appleRssFetch(endpoint, timeoutMs = 7000) {
  const url = `${APPLE_RSS}/${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json();
  } catch (_) { clearTimeout(timeout); return null; }
}

function normalizeSpotifyArtist(artist) {
  if (!artist) return null;
  const images = artist.images || [];
  const image = images.length > 0 ? images[0].url : "";
  return {
    id: String(artist.id || ""),
    mediaType: "artist",
    title: String(artist.name || "").trim(),
    subtitle: String((artist.genres || []).slice(0, 2).join(", ") || "Music").trim(),
    image: image,
    popularity: Number(artist.popularity || 0),
    followers: Number(artist.followers?.total || 0),
    externalUrl: String(artist.external_urls?.spotify || "").trim(),
    provider: "spotify"
  };
}

async function spotifySearchArtists(query, limit = 50) {
  const data = await spotifyFetch("search", { q: query, type: "artist", limit: String(limit) });
  if (!data || !data.artists) return [];
  return (data.artists.items || []).map(normalizeSpotifyArtist).filter(Boolean);
}

async function spotifyGetRelatedArtists(id, limit = 20) {
  const data = await spotifyFetch(`artists/${encodeURIComponent(id)}/related-artists`);
  if (!data || !data.artists) return [];
  return data.artists.slice(0, limit).map(normalizeSpotifyArtist).filter(Boolean);
}

async function spotifyGetTopArtistsByGenres(genres, perGenre = 5) {
  const results = [];
  const seen = new Set();
  for (const genre of genres) {
    if (results.length >= 100) break;
    const artists = await spotifySearchArtists(`genre:${genre}`, perGenre + 5);
    for (const artist of artists) {
      if (seen.has(artist.id)) continue;
      seen.add(artist.id);
      results.push(artist);
      if (results.length >= 100) break;
    }
  }
  return results;
}

async function getArtistsFromRss(limit = 20) {
  const data = await appleRssFetch(`most-played/${Math.min(limit * 3, 50)}/songs.json`);
  if (!data || !data.feed || !data.feed.results) return [];
  const seen = new Set();
  const artists = [];
  data.feed.results.forEach((song) => {
    const key = String(song.artistId || song.artistName || "").toLowerCase();
    if (!key || seen.has(key)) return;
    if (artists.length >= limit) return;
    seen.add(key);
    let image = song.artworkUrl100 || "";
    image = image.replace("100x100bb.jpg", "600x600bb.jpg");
    artists.push({
      id: String(song.artistId || ""),
      mediaType: "artist",
      title: String(song.artistName || "").trim(),
      subtitle: String(song.genres?.[0]?.name || "Music").trim(),
      image: image,
      popularity: 0,
      externalUrl: String(song.artistUrl || "").trim(),
      provider: "apple"
    });
  });
  return artists.filter(Boolean);
}

function dedupeById(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchHomeArtists(targetCount = 12) {
  const cacheKey = "home_artists";
  const cached = ARTIST_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < ARTIST_CACHE_TTL) return cached.items;

  let artists = [];

  const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
  if (spotifyWorks) {
    try {
      const genres = shuffle(DEFAULT_GENRES).slice(0, 8);
      const spotifyArtists = await spotifyGetTopArtistsByGenres(genres, 4);
      artists.push(...spotifyArtists);
    } catch (_) {}
  }

  if (artists.length < targetCount) {
    try {
      const rssArtists = await getArtistsFromRss(30);
      artists.push(...rssArtists);
    } catch (_) {}
  }

  artists = dedupeById(artists);
  artists = shuffle(artists);

  ARTIST_CACHE.set(cacheKey, { items: artists, ts: Date.now() });
  return artists;
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const id = String(pathParts[1] || "").trim();

  if (!section) {
    setResponseCache(res, { maxAge: 900, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", type: "artists", routes: ["/artists", "/search"] });
  }

  if (section === "health") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "music", type: "artists", spotifyConfigured: !!spotifyConfig.clientId });
  }

  if (section === "artists") {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    const limit = clampInt(query.limit, 1, 50, 20);
    const artists = await fetchHomeArtists(limit);
    return res.json({ count: artists.length, results: artists.slice(0, limit), source: "multi" });
  }

  if (section === "search") {
    setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 1800 });
    const q = String(query.q || "").trim().slice(0, 200);
    if (!q) return res.status(400).json({ message: "Missing q parameter" });
    const limit = clampInt(query.limit, 1, 50, 20);

    let artists = [];

    const spotifyWorks = !!(spotifyConfig.clientId && spotifyConfig.clientSecret);
    if (spotifyWorks) {
      try {
        artists = await spotifySearchArtists(q, limit);
      } catch (_) {}
    }

    if (!artists.length) {
      try {
        const data = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=${limit}`);
        if (data.ok) {
          const json = await data.json();
          artists = (json.results || []).map(a => ({
            id: String(a.artistId || ""),
            mediaType: "artist",
            title: String(a.artistName || "").trim(),
            subtitle: String(a.primaryGenreName || "Music").trim(),
            image: String(a.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg"),
            externalUrl: String(a.artistLinkUrl || "").trim(),
            provider: "apple"
          })).filter(Boolean);
        }
      } catch (_) {}
    }

    artists = dedupeById(artists);
    return res.json({ count: artists.length, limit, offset: 0, results: artists.slice(0, limit) });
  }

  setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
  return res.json({ ok: true, service: "music", type: "artists" });
}
