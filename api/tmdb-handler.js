import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-tmdb", max: 260 });
const TMDB_BASE = "https://api.themoviedb.org/3";

function getTmdbToken() {
  return String(
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

app.get("/api/tmdb/*", async (req, res) => {
  const relativePath = req.path.replace(/^\/api\/tmdb\//, "");
  const fallbackPayload = buildTmdbFallbackPayload(relativePath, req.query || {});
  try {
    const token = getTmdbToken();
    if (!token) {
      return res.status(200).json({
        ...fallbackPayload,
        source: "tmdb-fallback",
        message: "TMDB is not configured"
      });
    }

    const url = new URL(`${TMDB_BASE}/${relativePath}`);
    Object.entries(req.query || {}).forEach(([key, value]) => pushQueryParam(url.searchParams, key, value));

    const tmdbRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!tmdbRes.ok) {
      return res.status(200).json({
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
    return res.status(200).json({
      ...fallbackPayload,
      source: "tmdb-fallback",
      message: error.message || "TMDB proxy error"
    });
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
