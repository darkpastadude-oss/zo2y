import express from "express";

const router = express.Router();

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const TOKEN_REFRESH_SKEW_MS = 60_000;

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
    routes: ["/search", "/tracks/:id"]
  });
});

router.get("/search", async (req, res) => {
  try {
    if (!hasSpotifyCredentials()) {
      return res.status(503).json({ message: "Spotify credentials are not configured on the server." });
    }

    const q = String(req.query.q || "").trim().slice(0, 120);
    if (!q) {
      return res.status(400).json({ message: "Missing q query parameter." });
    }

    const limit = clampInt(req.query.limit, 1, 50, 20);
    const offset = clampInt(req.query.offset, 0, 500, 0);
    const market = String(req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";

    const json = await spotifyRequest("/search", {
      q,
      type: "track",
      limit,
      offset,
      market
    });

    const tracks = Array.isArray(json?.tracks?.items) ? json.tracks.items : [];
    return res.json({
      count: Number(json?.tracks?.total || tracks.length || 0),
      limit,
      offset,
      results: tracks.map(normalizeTrackRow)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search music.", error: String(error?.message || error) });
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

export default router;
