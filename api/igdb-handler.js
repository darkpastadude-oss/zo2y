import express from "express";
import { applyApiGuardrails } from "./_guardrails.js";

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-igdb", max: 240 });

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const RAWG_API_BASE = "https://api.rawg.io/api";
const RAWG_ID_OFFSET = 9_000_000_000_000;
const TOKEN_REFRESH_SKEW_MS = 60_000;
const GENRE_CACHE_TTL_MS = 1000 * 60 * 60;

let tokenCache = {
  accessToken: "",
  expiresAt: 0
};
let tokenRefreshPromise = null;
let genreCache = {
  items: [],
  byId: new Map(),
  bySlug: new Map(),
  byName: new Map(),
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

function escapeIgdbText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .trim();
}

function dedupeNumbers(values = []) {
  const out = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) out.add(n);
  });
  return [...out];
}

function chunkArray(values = [], size = 200) {
  const safeSize = Math.max(1, Number(size) || 200);
  const chunks = [];
  for (let i = 0; i < values.length; i += safeSize) {
    chunks.push(values.slice(i, i + safeSize));
  }
  return chunks;
}

function imageUrl(imageId, size = "t_1080p") {
  const id = String(imageId || "").trim();
  if (!id) return "";
  return `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;
}

function toReleaseDate(unixSeconds) {
  const n = Number(unixSeconds);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Date(n * 1000).toISOString().slice(0, 10);
}

function parseDateToUnix(dateText, endOfDay = false) {
  const text = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const iso = `${text}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

function parseDatesRange(datesRaw) {
  const raw = String(datesRaw || "").trim();
  if (!raw || !raw.includes(",")) return { startUnix: null, endUnix: null };
  const [startText, endText] = raw.split(",", 2);
  return {
    startUnix: parseDateToUnix(startText, false),
    endUnix: parseDateToUnix(endText, true)
  };
}

function readFirstEnv(keys = []) {
  for (const key of keys) {
    const value = String(process.env?.[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function getIgdbCredentials() {
  const clientId = readFirstEnv([
    "TWITCH_CLIENT_ID",
    "IGDB_CLIENT_ID",
    "TWITCH_APP_CLIENT_ID"
  ]);
  const clientSecret = readFirstEnv([
    "TWITCH_CLIENT_SECRET",
    "IGDB_CLIENT_SECRET",
    "TWITCH_APP_CLIENT_SECRET"
  ]);
  const staticAccessToken = readFirstEnv([
    "TWITCH_ACCESS_TOKEN",
    "TWITCH_APP_ACCESS_TOKEN",
    "IGDB_ACCESS_TOKEN"
  ]);
  return { clientId, clientSecret, staticAccessToken };
}

function hasIgdbCredentials() {
  const { clientId, clientSecret, staticAccessToken } = getIgdbCredentials();
  return !!(clientId && (clientSecret || staticAccessToken));
}

function getRawgKey() {
  return String(process.env.RAWG_API_KEY || process.env.RAWG_KEY || "").trim();
}

function hasRawgKey() {
  return !!getRawgKey();
}

function mapOrderingToIgdb(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "first_release_date desc";
  if (ordering === "-rating") return "total_rating desc";
  if (ordering === "-name") return "name asc";
  if (ordering === "released") return "first_release_date asc";
  if (ordering === "rating") return "total_rating asc";
  return "first_release_date desc";
}

function mapOrderingToRawg(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "-released";
  if (ordering === "-rating") return "-rating";
  if (ordering === "-metacritic") return "-metacritic";
  if (ordering === "released") return "released";
  if (ordering === "rating") return "rating";
  return "-added";
}

function encodeRawgId(rawgId) {
  const id = Number(rawgId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return RAWG_ID_OFFSET + id;
}

function decodeRawgId(value) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= RAWG_ID_OFFSET) return null;
  const decoded = id - RAWG_ID_OFFSET;
  if (!Number.isFinite(decoded) || decoded <= 0) return null;
  return decoded;
}

async function getIgdbAccessToken(forceRefresh = false) {
  const { clientId, clientSecret, staticAccessToken } = getIgdbCredentials();
  if (!clientId) {
    const err = new Error("Missing TWITCH_CLIENT_ID / IGDB_CLIENT_ID");
    err.code = "IGDB_DISABLED";
    throw err;
  }
  if (staticAccessToken) {
    return staticAccessToken;
  }
  if (!clientSecret) {
    const err = new Error("Missing TWITCH_CLIENT_SECRET / IGDB_CLIENT_SECRET");
    err.code = "IGDB_DISABLED";
    throw err;
  }

  if (!forceRefresh && tokenCache.accessToken && Date.now() < (tokenCache.expiresAt - TOKEN_REFRESH_SKEW_MS)) {
    return tokenCache.accessToken;
  }
  if (!forceRefresh && tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    const form = new URLSearchParams();
    form.set("client_id", clientId);
    form.set("client_secret", clientSecret);
    form.set("grant_type", "client_credentials");

    const response = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Twitch token error ${response.status}: ${body}`);
      err.code = "TWITCH_AUTH_ERROR";
      throw err;
    }

    const json = await response.json();
    const accessToken = String(json?.access_token || "").trim();
    const expiresIn = Number(json?.expires_in || 0);
    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      const err = new Error("Invalid Twitch token response");
      err.code = "TWITCH_AUTH_INVALID";
      throw err;
    }

    tokenCache = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000
    };
    return accessToken;
  })();

  try {
    return await tokenRefreshPromise;
  } finally {
    tokenRefreshPromise = null;
  }
}

async function igdbRequest(endpoint, body, retry = true) {
  const { clientId } = getIgdbCredentials();
  if (!clientId) {
    const err = new Error("IGDB client id is missing.");
    err.code = "IGDB_DISABLED";
    throw err;
  }

  const token = await getIgdbAccessToken();
  const response = await fetch(`${IGDB_API_BASE}/${String(endpoint || "").trim()}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain"
    },
    body: String(body || "")
  });

  if (response.status === 401 && retry) {
    await getIgdbAccessToken(true);
    return igdbRequest(endpoint, body, false);
  }
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`IGDB ${response.status}: ${text}`);
    err.code = "IGDB_UPSTREAM_ERROR";
    throw err;
  }
  const text = await response.text();
  if (!text.trim()) return [];
  return JSON.parse(text);
}

async function fetchMapByIds(endpoint, ids, fields, mapper = null) {
  const out = new Map();
  const uniqueIds = dedupeNumbers(ids);
  if (!uniqueIds.length) return out;
  const chunks = chunkArray(uniqueIds, 300);
  for (const group of chunks) {
    const query = `fields ${fields}; where id = (${group.join(",")}); limit ${group.length};`;
    const rows = await igdbRequest(endpoint, query);
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const id = Number(row?.id || 0);
      if (!Number.isFinite(id) || id <= 0) return;
      out.set(id, mapper ? mapper(row) : row);
    });
  }
  return out;
}

async function ensureIgdbGenreCache() {
  const now = Date.now();
  if (genreCache.expiresAt > now && genreCache.items.length) {
    return genreCache;
  }
  const rows = await igdbRequest("genres", "fields id,name,slug; sort name asc; limit 500;");
  const items = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(row?.id || 0),
      name: String(row?.name || "").trim(),
      slug: String(row?.slug || "").trim().toLowerCase()
    }))
    .filter((row) => row.id > 0 && !!row.name);
  const byId = new Map();
  const bySlug = new Map();
  const byName = new Map();
  items.forEach((item) => {
    byId.set(item.id, item);
    if (item.slug) bySlug.set(item.slug, item);
    byName.set(item.name.toLowerCase(), item);
  });
  genreCache = {
    items,
    byId,
    bySlug,
    byName,
    expiresAt: now + GENRE_CACHE_TTL_MS
  };
  return genreCache;
}

async function resolveGenreIds(genresRaw) {
  const tokens = String(genresRaw || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) return [];
  const ids = new Set();
  const named = [];
  tokens.forEach((token) => {
    const n = Number(token);
    if (Number.isFinite(n) && n > 0) ids.add(n);
    else named.push(token.toLowerCase());
  });
  if (!named.length) return [...ids];
  const cache = await ensureIgdbGenreCache();
  named.forEach((token) => {
    const match = cache.bySlug.get(token) || cache.byName.get(token);
    if (match?.id) ids.add(match.id);
  });
  return [...ids];
}

function buildIgdbWhereClause({ genreIds = [], startUnix = null, endUnix = null } = {}) {
  const clauses = [
    "category = 0",
    "version_parent = null"
  ];
  const ids = dedupeNumbers(genreIds);
  if (ids.length) clauses.push(`genres = (${ids.join(",")})`);
  if (Number.isFinite(startUnix)) clauses.push(`first_release_date >= ${Math.floor(startUnix)}`);
  if (Number.isFinite(endUnix)) clauses.push(`first_release_date <= ${Math.floor(endUnix)}`);
  return clauses.join(" & ");
}

async function fetchIgdbGamesList({ page, pageSize, orderingRaw, search, whereClause }) {
  const offset = Math.max(0, (page - 1) * pageSize);
  const sortClause = mapOrderingToIgdb(orderingRaw);

  let totalCount = 0;
  try {
    const countParts = [];
    if (search) countParts.push(`search "${escapeIgdbText(search)}";`);
    if (whereClause) countParts.push(`where ${whereClause};`);
    const countJson = await igdbRequest("games/count", countParts.join(" "));
    totalCount = Number(countJson?.count || 0);
  } catch (_err) {
    totalCount = 0;
  }

  const queryParts = [
    "fields id,name,slug,first_release_date,total_rating,total_rating_count,aggregated_rating,cover,cover.image_id,screenshots,screenshots.image_id,genres;"
  ];
  if (search) queryParts.push(`search "${escapeIgdbText(search)}";`);
  if (whereClause) queryParts.push(`where ${whereClause};`);
  queryParts.push(`sort ${sortClause};`);
  queryParts.push(`limit ${pageSize};`);
  queryParts.push(`offset ${offset};`);
  const games = await igdbRequest("games", queryParts.join(" "));

  const genreData = await ensureIgdbGenreCache();
  const coverIds = dedupeNumbers((Array.isArray(games) ? games : []).map((game) => game?.cover));
  const screenshotIds = dedupeNumbers((Array.isArray(games) ? games : []).flatMap((game) => game?.screenshots || []));

  const [coverMap, screenshotMap] = await Promise.all([
    fetchMapByIds("covers", coverIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("screenshots", screenshotIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p"))
  ]);

  const results = (Array.isArray(games) ? games : []).map((game) => {
    const mappedGenres = (Array.isArray(game?.genres) ? game.genres : [])
      .map((genreId) => genreData.byId.get(Number(genreId)))
      .filter(Boolean)
      .map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug
      }));

    const coverImage = game?.cover?.image_id
      ? imageUrl(game.cover.image_id, "t_cover_big")
      : (coverMap.get(Number(game?.cover)) || "");
    const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
      .map((entry) => {
        if (entry && typeof entry === "object" && entry.image_id) {
          return imageUrl(entry.image_id, "t_1080p");
        }
        return screenshotMap.get(Number(entry));
      })
      .filter(Boolean)
      .slice(0, 12);
    const hero = screenshotRows[0] || coverImage || "";
    const rating = Number(game?.total_rating || game?.aggregated_rating || 0);
    const ratingCount = Number(game?.total_rating_count || 0);

    return {
      id: Number(game?.id || 0),
      name: String(game?.name || "Game"),
      slug: String(game?.slug || ""),
      released: toReleaseDate(game?.first_release_date),
      cover: coverImage,
      hero,
      screenshots: screenshotRows,
      background_image: hero || coverImage,
      short_screenshots: screenshotRows.map((image, index) => ({ id: index + 1, image })),
      rating: rating ? Number((rating / 20).toFixed(1)) : null,
      ratings_count: ratingCount || 0,
      metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
      genres: mappedGenres,
      source: "igdb"
    };
  }).filter((row) => row.id > 0);

  return {
    count: totalCount || results.length,
    results
  };
}

async function fetchIgdbGameDetails(id) {
  const query = [
    "fields id,name,slug,summary,first_release_date,total_rating,total_rating_count,aggregated_rating,cover,cover.image_id,screenshots,screenshots.image_id,genres,platforms;",
    `where id = ${Number(id)};`,
    "limit 1;"
  ].join(" ");
  const rows = await igdbRequest("games", query);
  const game = Array.isArray(rows) ? rows[0] : null;
  if (!game) {
    const err = new Error("Game not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const genreData = await ensureIgdbGenreCache();
  const platformIds = dedupeNumbers(game?.platforms || []);
  const platformMap = await fetchMapByIds("platforms", platformIds, "id,name");

  const coverImage = game?.cover?.image_id ? imageUrl(game.cover.image_id, "t_cover_big") : "";
  const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
    .map((entry) => {
      if (entry && typeof entry === "object" && entry.image_id) return imageUrl(entry.image_id, "t_1080p");
      return "";
    })
    .filter(Boolean)
    .slice(0, 16);
  const hero = screenshotRows[0] || coverImage;
  const rating = Number(game?.total_rating || game?.aggregated_rating || 0);
  const ratingsCount = Number(game?.total_rating_count || 0);

  return {
    id: Number(game?.id || 0),
    name: String(game?.name || "Game"),
    slug: String(game?.slug || ""),
    description_raw: String(game?.summary || "").trim(),
    description: String(game?.summary || "").trim(),
    released: toReleaseDate(game?.first_release_date),
    playtime: null,
    cover: coverImage || hero || "",
    hero: hero || coverImage || "",
    screenshots: screenshotRows,
    background_image: hero || coverImage || "",
    short_screenshots: screenshotRows.map((image, index) => ({ id: index + 1, image })),
    genres: (Array.isArray(game?.genres) ? game.genres : [])
      .map((genreId) => genreData.byId.get(Number(genreId)))
      .filter(Boolean)
      .map((genre) => ({ id: genre.id, name: genre.name, slug: genre.slug })),
    rating: rating ? Number((rating / 20).toFixed(1)) : null,
    ratings_count: ratingsCount || 0,
    metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
    platforms: (Array.isArray(game?.platforms) ? game.platforms : [])
      .map((platformId) => platformMap.get(Number(platformId)))
      .filter(Boolean)
      .map((platform) => ({ platform: { name: String(platform?.name || "Platform") } })),
    developers: [],
    publishers: [],
    stores: [],
    website: "",
    reddit_url: "",
    clip: null,
    youtube_url: "",
    source: "igdb"
  };
}

async function rawgRequest(path, params = {}, timeoutMs = 7000) {
  const key = getRawgKey();
  if (!key) {
    const err = new Error("RAWG API key missing.");
    err.code = "RAWG_DISABLED";
    throw err;
  }
  const url = new URL(`${RAWG_API_BASE}${path}`);
  url.searchParams.set("key", key);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || String(v).trim() === "") return;
    url.searchParams.set(k, String(v));
  });
  const response = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`RAWG ${response.status}: ${text}`);
    err.code = "RAWG_UPSTREAM_ERROR";
    throw err;
  }
  return response.json();
}

function mapRawgListRow(row) {
  const rawgId = Number(row?.id || 0);
  const screenshots = (Array.isArray(row?.short_screenshots) ? row.short_screenshots : [])
    .map((item) => toHttpsUrl(item?.image || ""))
    .filter(Boolean);
  const cover = toHttpsUrl(row?.background_image || row?.background_image_additional || screenshots[0] || "");
  return {
    id: encodeRawgId(rawgId),
    rawg_id: rawgId,
    name: String(row?.name || "Game").trim(),
    slug: String(row?.slug || "").trim(),
    released: String(row?.released || "").trim(),
    cover: cover || "",
    hero: screenshots[0] || cover || "",
    screenshots,
    background_image: screenshots[0] || cover || "",
    short_screenshots: screenshots.map((image, index) => ({ id: index + 1, image })),
    rating: Number.isFinite(Number(row?.rating || NaN)) ? Number(row.rating) : null,
    ratings_count: Number(row?.ratings_count || 0),
    metacritic: Number.isFinite(Number(row?.metacritic || NaN)) ? Number(row.metacritic) : null,
    genres: (Array.isArray(row?.genres) ? row.genres : [])
      .map((genre) => ({
        id: Number(genre?.id || 0),
        name: String(genre?.name || "").trim(),
        slug: String(genre?.slug || "").trim().toLowerCase()
      }))
      .filter((genre) => genre.id > 0 && !!genre.name),
    platforms: (Array.isArray(row?.platforms) ? row.platforms : [])
      .map((p) => ({ platform: { name: String(p?.platform?.name || "").trim() } }))
      .filter((p) => !!p.platform.name),
    source: "rawg"
  };
}

async function fetchRawgGamesList({ page, pageSize, orderingRaw, search, dates, genres }) {
  const json = await rawgRequest("/games", {
    page,
    page_size: pageSize,
    ordering: mapOrderingToRawg(orderingRaw),
    search,
    dates,
    genres
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  const results = rows.map(mapRawgListRow).filter((row) => Number(row?.id) > 0);
  return {
    count: Number(json?.count || results.length || 0),
    results
  };
}

async function fetchRawgGameDetails(rawgId) {
  const id = Number(rawgId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const [details, screenshotsRes] = await Promise.all([
    rawgRequest(`/games/${id}`, {}, 7000),
    rawgRequest(`/games/${id}/screenshots`, { page_size: 20 }, 7000).catch(() => ({ results: [] }))
  ]);
  if (!details || typeof details !== "object") return null;

  const screenshotUrls = [
    ...(Array.isArray(screenshotsRes?.results) ? screenshotsRes.results : []).map((row) => toHttpsUrl(row?.image || "")),
    ...(Array.isArray(details?.short_screenshots) ? details.short_screenshots : []).map((row) => toHttpsUrl(row?.image || ""))
  ].filter(Boolean);
  const uniqueScreens = [...new Set(screenshotUrls)];
  const cover = toHttpsUrl(details?.background_image || details?.background_image_additional || uniqueScreens[0] || "");

  return {
    id: encodeRawgId(id),
    rawg_id: id,
    name: String(details?.name || "Game").trim(),
    slug: String(details?.slug || "").trim(),
    description_raw: String(details?.description_raw || details?.description || "").trim(),
    description: String(details?.description || details?.description_raw || "").trim(),
    released: String(details?.released || "").trim(),
    playtime: Number.isFinite(Number(details?.playtime || NaN)) ? Number(details.playtime) : null,
    cover: cover || "",
    hero: uniqueScreens[0] || cover || "",
    screenshots: uniqueScreens,
    background_image: uniqueScreens[0] || cover || "",
    short_screenshots: uniqueScreens.map((image, index) => ({ id: index + 1, image })),
    genres: (Array.isArray(details?.genres) ? details.genres : [])
      .map((genre) => ({
        id: Number(genre?.id || 0),
        name: String(genre?.name || "").trim(),
        slug: String(genre?.slug || "").trim().toLowerCase()
      }))
      .filter((genre) => genre.id > 0 && !!genre.name),
    rating: Number.isFinite(Number(details?.rating || NaN)) ? Number(details.rating) : null,
    ratings_count: Number(details?.ratings_count || 0),
    metacritic: Number.isFinite(Number(details?.metacritic || NaN)) ? Number(details.metacritic) : null,
    platforms: (Array.isArray(details?.platforms) ? details.platforms : [])
      .map((p) => ({ platform: { name: String(p?.platform?.name || "").trim() } }))
      .filter((p) => !!p.platform.name),
    developers: (Array.isArray(details?.developers) ? details.developers : [])
      .map((dev) => ({ name: String(dev?.name || "").trim() }))
      .filter((dev) => !!dev.name),
    publishers: (Array.isArray(details?.publishers) ? details.publishers : [])
      .map((pub) => ({ name: String(pub?.name || "").trim() }))
      .filter((pub) => !!pub.name),
    stores: (Array.isArray(details?.stores) ? details.stores : [])
      .map((store) => ({ store: { name: String(store?.store?.name || "").trim() } }))
      .filter((store) => !!store.store.name),
    website: toHttpsUrl(details?.website || ""),
    reddit_url: toHttpsUrl(details?.reddit_url || ""),
    clip: null,
    youtube_url: "",
    source: "rawg"
  };
}

app.get("/api/igdb", (_req, res) => {
  return res.json({
    ok: true,
    service: "igdb-proxy",
    configured: hasIgdbCredentials(),
    auth_mode: hasIgdbCredentials() ? "twitch-client-credentials" : "fallback-only",
    providers: {
      igdb: hasIgdbCredentials(),
      rawg: hasRawgKey()
    },
    routes: ["/genres", "/games", "/games/:id"]
  });
});

app.get("/api/igdb/genres", async (_req, res) => {
  try {
    if (hasIgdbCredentials()) {
      const cache = await ensureIgdbGenreCache();
      return res.json({
        count: cache.items.length,
        source: "igdb",
        results: cache.items
      });
    }
    if (hasRawgKey()) {
      const json = await rawgRequest("/genres", { page_size: 40 });
      const rows = (Array.isArray(json?.results) ? json.results : [])
        .map((row) => ({
          id: Number(row?.id || 0),
          name: String(row?.name || "").trim(),
          slug: String(row?.slug || "").trim().toLowerCase()
        }))
        .filter((row) => row.id > 0 && !!row.name);
      return res.json({
        count: rows.length,
        source: "rawg",
        results: rows
      });
    }
    return res.json({
      count: 0,
      source: "unavailable",
      results: []
    });
  } catch (_error) {
    return res.json({
      count: 0,
      source: "unavailable",
      results: []
    });
  }
});

app.get("/api/igdb/games", async (req, res) => {
  const page = clampInt(req.query.page, 1, 100000, 1);
  const pageSize = clampInt(req.query.page_size, 1, 50, 20);
  const orderingRaw = String(req.query.ordering || "-added").trim().toLowerCase();
  const search = String(req.query.search || "").trim().slice(0, 100);
  const datesRaw = String(req.query.dates || "").trim();
  const genresRaw = String(req.query.genres || "").trim();

  try {
    if (hasIgdbCredentials()) {
      try {
        const genreIds = await resolveGenreIds(genresRaw);
        const { startUnix, endUnix } = parseDatesRange(datesRaw);
        const whereClause = buildIgdbWhereClause({ genreIds, startUnix, endUnix });
        const payload = await fetchIgdbGamesList({
          page,
          pageSize,
          orderingRaw,
          search,
          whereClause
        });
        const results = Array.isArray(payload?.results) ? payload.results : [];
        if (results.length) {
          return res.json({
            count: Number(payload?.count || results.length),
            page,
            page_size: pageSize,
            results: results.slice(0, pageSize),
            sources: {
              igdb: true,
              rawg: false
            }
          });
        }
      } catch (err) {
        console.warn("[igdb-handler] IGDB games failed:", String(err?.message || err));
      }
    }

    if (hasRawgKey()) {
      try {
        const payload = await fetchRawgGamesList({
          page,
          pageSize,
          orderingRaw,
          search,
          dates: datesRaw,
          genres: genresRaw
        });
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return res.json({
          count: Number(payload?.count || results.length),
          page,
          page_size: pageSize,
          results: results.slice(0, pageSize),
          sources: {
            igdb: false,
            rawg: true
          }
        });
      } catch (err) {
        console.warn("[igdb-handler] RAWG games failed:", String(err?.message || err));
      }
    }

    return res.json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      sources: {
        igdb: false,
        rawg: false
      }
    });
  } catch (_error) {
    return res.json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      sources: {
        igdb: false,
        rawg: false
      }
    });
  }
});

app.get("/api/igdb/games/:id", async (req, res) => {
  const requestedId = Number(req.params.id);
  if (!Number.isFinite(requestedId) || requestedId <= 0) {
    return res.status(400).json({ message: "Invalid game id." });
  }

  try {
    const rawgId = decodeRawgId(requestedId);
    if (rawgId && hasRawgKey()) {
      const details = await fetchRawgGameDetails(rawgId);
      if (details) return res.json(details);
      return res.status(404).json({ message: "Game not found." });
    }

    if (hasIgdbCredentials()) {
      const details = await fetchIgdbGameDetails(requestedId);
      return res.json(details);
    }

    if (hasRawgKey()) {
      const details = await fetchRawgGameDetails(requestedId);
      if (details) return res.json(details);
    }

    return res.status(404).json({ message: "Game not found." });
  } catch (error) {
    if (error?.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Game not found." });
    }
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
      rawg: false
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
        rawg: false
      }
    });
  }
}
