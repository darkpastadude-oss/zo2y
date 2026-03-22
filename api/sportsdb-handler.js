import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

function getSportsDbKey() {
  return String(
    process.env.SPORTSDB_API_KEY ||
    process.env.SPORTSDB_KEY ||
    process.env.THESPORTSDB_KEY ||
    "3"
  ).trim() || "3";
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

async function fetchWithRetry(url, init = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000 + (attempt * 1000));
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) return res;
      lastError = new Error(`SportsDB error ${res.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError || new Error("SportsDB request failed");
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

  if (!relativePath) {
    return res.json({ ok: true, service: "sportsdb-proxy", configured: Boolean(getSportsDbKey()) });
  }

  try {
    const sanitizedPath = String(relativePath || "").replace(/^\/+/, "");
    if (!sanitizedPath) {
      return res.status(400).json({ message: "SportsDB path is required." });
    }

    const key = getSportsDbKey();
    const target = new URL(`${SPORTSDB_BASE}/${encodeURIComponent(key)}/${sanitizedPath}`);
    Object.entries(query || {}).forEach(([paramKey, value]) => {
      if (paramKey === "path") return;
      pushQueryParam(target.searchParams, paramKey, value);
    });

    const upstream = await fetchWithRetry(target.toString(), {
      headers: { Accept: "application/json" }
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("cache-control", upstream.ok ? "public, s-maxage=300, stale-while-revalidate=900" : "no-store");
    return res.send(text);
  } catch (error) {
    return res.status(502).json({ message: error?.message || "SportsDB proxy failed" });
  }
}
