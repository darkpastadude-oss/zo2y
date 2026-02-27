import express from "express";
import { applyApiGuardrails } from "./_guardrails.js";

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-igdb", max: 240 });

const STEAM_ID_OFFSET = 8_000_000_000_000;
const STEAM_LIST_CACHE_TTL_MS = 1000 * 60 * 10;

let steamListCache = {
  results: [],
  expiresAt: 0
};

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

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  return raw;
}

function normalizeSteamDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function encodeSteamId(appId) {
  const id = Number(appId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return STEAM_ID_OFFSET + id;
}

function decodeSteamId(value) {
  const id = Number(value);
  if (!Number.isFinite(id)) return null;
  if (id > STEAM_ID_OFFSET) {
    const decoded = id - STEAM_ID_OFFSET;
    return Number.isFinite(decoded) && decoded > 0 ? decoded : null;
  }
  return id > 0 ? id : null;
}

function normalizeSteamListItem(item) {
  const appId = Number(item?.id || item?.steam_appid || 0);
  if (!Number.isFinite(appId) || appId <= 0) return null;
  const header = toHttpsUrl(item?.header_image || item?.large_capsule_image || item?.small_capsule_image || "");
  const cover = toHttpsUrl(item?.large_capsule_image || item?.header_image || item?.small_capsule_image || "");
  const release = normalizeSteamDate(item?.release_date?.date || "");
  const screenshots = [toHttpsUrl(item?.header_image || ""), toHttpsUrl(item?.small_capsule_image || "")]
    .filter(Boolean);
  return {
    id: encodeSteamId(appId),
    steam_appid: appId,
    name: String(item?.name || "Game").trim(),
    slug: String(item?.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    released: release,
    cover: cover || header || "",
    hero: header || cover || "",
    screenshots,
    background_image: header || cover || "",
    short_screenshots: screenshots.map((image, index) => ({ id: index + 1, image })),
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres: [],
    platforms: [{ platform: { name: "PC" } }],
    source: "steam"
  };
}

async function fetchJson(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSteamFeaturedGames(country = "US") {
  const now = Date.now();
  if (steamListCache.expiresAt > now && Array.isArray(steamListCache.results) && steamListCache.results.length) {
    return steamListCache.results;
  }

  const cc = String(country || "US").trim().slice(0, 2).toLowerCase() || "us";
  const json = await fetchJson(`https://store.steampowered.com/api/featuredcategories?cc=${encodeURIComponent(cc)}&l=en`, 7000);
  const buckets = [
    ...(Array.isArray(json?.new_releases?.items) ? json.new_releases.items : []),
    ...(Array.isArray(json?.top_sellers?.items) ? json.top_sellers.items : []),
    ...(Array.isArray(json?.specials?.items) ? json.specials.items : []),
    ...(Array.isArray(json?.coming_soon?.items) ? json.coming_soon.items : [])
  ];

  const seen = new Set();
  const rows = [];
  buckets.forEach((item) => {
    const row = normalizeSteamListItem(item);
    if (!row) return;
    const key = String(row.steam_appid || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  });

  steamListCache = {
    results: rows,
    expiresAt: Date.now() + STEAM_LIST_CACHE_TTL_MS
  };
  return rows;
}

function mapSteamDetailPayload(appId, payload) {
  const data = payload && typeof payload === "object" ? payload.data : null;
  if (!data || !data.success) return null;
  const details = data.data || {};
  const name = String(details?.name || "Game").trim();
  const screenshots = (Array.isArray(details?.screenshots) ? details.screenshots : [])
    .map((row) => toHttpsUrl(row?.path_full || row?.path_thumbnail || ""))
    .filter(Boolean);
  const header = toHttpsUrl(details?.header_image || "");
  const hero = screenshots[0] || header || "";
  const releaseDate = normalizeSteamDate(details?.release_date?.date || "");
  const website = toHttpsUrl(details?.website || "");
  const developers = (Array.isArray(details?.developers) ? details.developers : [])
    .map((nameValue) => ({ name: String(nameValue || "").trim() }))
    .filter((row) => !!row.name);
  const publishers = (Array.isArray(details?.publishers) ? details.publishers : [])
    .map((nameValue) => ({ name: String(nameValue || "").trim() }))
    .filter((row) => !!row.name);
  const genres = (Array.isArray(details?.genres) ? details.genres : [])
    .map((genre) => ({
      id: Number(genre?.id || 0),
      name: String(genre?.description || "").trim(),
      slug: String(genre?.description || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }))
    .filter((row) => !!row.name);

  return {
    id: encodeSteamId(appId),
    steam_appid: appId,
    name,
    slug: String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    description_raw: String(details?.short_description || "").trim(),
    description: String(details?.short_description || "").trim(),
    released: releaseDate,
    playtime: null,
    cover: header || hero,
    hero: hero || header,
    screenshots,
    background_image: hero || header,
    short_screenshots: screenshots.map((image, index) => ({ id: index + 1, image })),
    genres,
    rating: null,
    ratings_count: 0,
    metacritic: Number.isFinite(Number(details?.metacritic?.score || NaN))
      ? Number(details.metacritic.score)
      : null,
    esrb_rating: null,
    platforms: [{ platform: { name: "PC" } }],
    developers,
    publishers,
    stores: [{ store: { name: "Steam" } }],
    website,
    reddit_url: "",
    clip: null,
    youtube_url: "",
    source: "steam"
  };
}

async function fetchSteamGameDetails(appId, country = "US") {
  const cc = String(country || "US").trim().slice(0, 2).toLowerCase() || "us";
  const json = await fetchJson(
    `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(String(appId))}&cc=${encodeURIComponent(cc)}&l=en`,
    7000
  );
  const payload = json?.[String(appId)] || null;
  return mapSteamDetailPayload(appId, payload);
}

app.get("/api/igdb", (_req, res) => {
  return res.json({
    ok: true,
    service: "igdb-proxy",
    configured: false,
    auth_mode: "steam_fallback",
    providers: {
      igdb: false,
      rawg: false,
      steam: true
    },
    routes: ["/genres", "/games", "/games/:id"]
  });
});

app.get("/api/igdb/genres", (_req, res) => {
  return res.json({
    count: 0,
    source: "unavailable",
    results: []
  });
});

app.get("/api/igdb/games", async (req, res) => {
  const page = clampInt(req.query.page, 1, 100000, 1);
  const pageSize = clampInt(req.query.page_size, 1, 50, 20);
  const query = String(req.query.search || "").trim().toLowerCase();
  const country = String(req.query.country || req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";

  try {
    const rows = await fetchSteamFeaturedGames(country);
    const filtered = query
      ? rows.filter((row) => String(row?.name || "").toLowerCase().includes(query))
      : rows;
    const offset = (page - 1) * pageSize;
    const paged = filtered.slice(offset, offset + pageSize);
    return res.json({
      count: filtered.length,
      page,
      page_size: pageSize,
      results: paged,
      sources: {
        igdb: false,
        rawg: false,
        steam: true
      }
    });
  } catch (error) {
    console.warn("[igdb-handler] steam list fallback failed:", String(error?.message || error));
    return res.json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      sources: {
        igdb: false,
        rawg: false,
        steam: false
      }
    });
  }
});

app.get("/api/igdb/games/:id", async (req, res) => {
  const decoded = decodeSteamId(req.params.id);
  if (!decoded) {
    return res.status(400).json({ message: "Invalid game id." });
  }

  const country = String(req.query.country || req.query.market || "US").trim().slice(0, 2).toUpperCase() || "US";
  try {
    const details = await fetchSteamGameDetails(decoded, country);
    if (!details) return res.status(404).json({ message: "Game not found." });
    return res.json(details);
  } catch (error) {
    console.warn("[igdb-handler] steam details fallback failed:", String(error?.message || error));
    return res.status(404).json({ message: "Game not found." });
  }
});

app.use("/api/igdb/*", (_req, res) => {
  return res.status(404).json({ message: "Not found" });
});

app.use((error, req, res, _next) => {
  console.error("[igdb-handler] unexpected error", {
    method: req.method,
    path: req.originalUrl || req.url,
    message: String(error?.message || error)
  });
  if (res.headersSent) return;
  return res.json({
    count: 0,
    page: clampInt(req.query?.page, 1, 100000, 1),
    page_size: clampInt(req.query?.page_size, 1, 50, 20),
    results: [],
    sources: {
      igdb: false,
      rawg: false,
      steam: false
    }
  });
});

export default function handler(req, res) {
  try {
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
    req.url = `/api/igdb${suffix}${search ? `?${search}` : ""}`;
    return app(req, res);
  } catch (error) {
    console.error("[igdb-handler] invocation fallback:", String(error?.message || error));
    if (res.headersSent) return;
    return res.json({
      count: 0,
      page: 1,
      page_size: 20,
      results: [],
      sources: {
        igdb: false,
        rawg: false,
        steam: false
      }
    });
  }
}
