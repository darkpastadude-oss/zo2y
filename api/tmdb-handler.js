import express from "express";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NzVjMDM5N2IxZGUxYzU3NjQ4ZmRiNjJiZGQ5NmI0OSIsIm5iZiI6MTc3MDU4Mzk1NC42NTc5OTk4LCJzdWIiOiI2OTg4Zjc5MmFlYTFkN2NjNjcyY2VlNDciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.1RMWLft0Yl73gfhkCXtnqBIzRQHdaoLfZFYXYN7jm7s";

function getTmdbToken() {
  return String(
    TMDB_DEFAULT_TOKEN ||
    process.env.TMDB_TOKEN ||
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

app.get("/api/tmdb/*", async (req, res) => {
  try {
    const token = getTmdbToken();
    if (!token) {
      return res.status(500).json({ message: "TMDB is not configured" });
    }

    const relativePath = req.path.replace(/^\/api\/tmdb\//, "");
    const url = new URL(`${TMDB_BASE}/${relativePath}`);
    Object.entries(req.query || {}).forEach(([key, value]) => pushQueryParam(url.searchParams, key, value));

    const tmdbRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await tmdbRes.text();
    res.status(tmdbRes.status);
    res.setHeader("content-type", tmdbRes.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(text);
  } catch (error) {
    return res.status(500).json({ message: error.message || "TMDB proxy error" });
  }
});

app.get("/api/tmdb", (req, res) => {
  res.json({ ok: true, service: "tmdb-proxy", configured: Boolean(getTmdbToken()) });
});

export default function handler(req, res) {
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
  req.url = `/api/tmdb${suffix}${search ? `?${search}` : ""}`;
  return app(req, res);
}
