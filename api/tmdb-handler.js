import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const TMDB_BASE = "https://api.themoviedb.org/3";

function setResponseCache(res, { maxAge = 300, staleWhileRevalidate = 900 } = {}) {
  const age = Math.max(0, Math.floor(Number(maxAge) || 0));
  const swr = Math.max(0, Math.floor(Number(staleWhileRevalidate) || 0));
  res.setHeader("Cache-Control", `public, s-maxage=${age}, stale-while-revalidate=${swr}`);
}

function getTmdbCacheProfile(path = "") {
  const normalized = String(path || "").toLowerCase();
  if (normalized.includes("/configuration")) return { maxAge: 3600, staleWhileRevalidate: 86400 };
  if (normalized.includes("/genre/")) return { maxAge: 1800, staleWhileRevalidate: 43200 };
  if (normalized.includes("/watch/providers")) return { maxAge: 1800, staleWhileRevalidate: 43200 };
  if (normalized.includes("/images") || normalized.includes("/videos")) return { maxAge: 1800, staleWhileRevalidate: 21600 };
  if (normalized.includes("/search")) return { maxAge: 120, staleWhileRevalidate: 600 };
  if (normalized.includes("/discover") || normalized.includes("/trending") || normalized.includes("/popular")) {
    return { maxAge: 300, staleWhileRevalidate: 1200 };
  }
  return { maxAge: 300, staleWhileRevalidate: 900 };
}

function getTmdbToken() {
  return String(
    process.env.TMDB_TOKEN ||
    process.env.TMDB_API_KEY ||
    process.env.TMDB_ACCESS_TOKEN ||
    process.env.TMDB_BEARER_TOKEN ||
    process.env.TMDB_API_READ_TOKEN ||
    ""
  ).trim();
}

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

function buildTmdbFallbackPayload(relativePath, query = {}) {
  const path = `/${String(relativePath || "").trim().toLowerCase()}`;
  const page = Math.max(1, Number(query?.page || 1) || 1);

  if (path.endsWith("/genre/movie/list") || path.endsWith("/genre/tv/list")) {
    return { genres: [] };
  }
  if (path.endsWith("/credits")) {
    return { id: 0, cast: [], crew: [] };
  }
  if (path.endsWith("/videos")) {
    return { id: 0, results: [] };
  }
  if (path.endsWith("/images")) {
    return { id: 0, backdrops: [], posters: [], logos: [] };
  }
  if (path.includes("/watch/providers")) {
    return { id: 0, results: {} };
  }
  return {
    page,
    results: [],
    total_pages: 1,
    total_results: 0
  };
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}

function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "")
    .split("/")
    .filter(Boolean);
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const relativePath = pathParts.join("/");
  const strictMode = String(query?.strict || "").trim().toLowerCase();
  const shouldFailOpen = !["1", "true", "yes", "on"].includes(strictMode);

  if (!relativePath) {
    setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 3600 });
    return res.json({ ok: true, service: "tmdb-proxy", configured: Boolean(getTmdbToken()) });
  }

  const fallbackPayload = buildTmdbFallbackPayload(relativePath, query);
  setResponseCache(res, getTmdbCacheProfile(relativePath));

  try {
    const token = getTmdbToken();
    if (!token) {
      const status = shouldFailOpen ? 200 : 503;
      return res.status(status).json({
        ...fallbackPayload,
        source: "tmdb-fallback",
        message: "TMDB is not configured"
      });
    }

    const url = new URL(`${TMDB_BASE}/${relativePath}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam(url.searchParams, key, value);
    });

    const tmdbRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!tmdbRes.ok) {
      const status = shouldFailOpen ? 200 : tmdbRes.status;
      return res.status(status).json({
        ...fallbackPayload,
        source: "tmdb-fallback",
        upstream_status: tmdbRes.status
      });
    }

    const text = await tmdbRes.text();
    res.status(tmdbRes.status);
    res.setHeader("content-type", tmdbRes.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(text);
  } catch (error) {
    const status = shouldFailOpen ? 200 : 502;
    return res.status(status).json({
      ...fallbackPayload,
      source: "tmdb-fallback",
      message: error?.message || "TMDB proxy error"
    });
  }
}
