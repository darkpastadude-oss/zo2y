import express from "express";
import { applyApiGuardrails } from "./_guardrails.js";

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-igdb", max: 240 });

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GAMEBRAIN_API_BASE = "https://gamebrain.co/api";
const GAMEBRAIN_REQUEST_TIMEOUT_MS = 7000;
const GAMEBRAIN_LIST_SCAN_MULTIPLIER = 4;
const GAMEBRAIN_MAX_FETCH_IDS = 120;
const RAWG_API_BASE = "https://api.rawg.io/api";
const RAWG_ID_OFFSET = 9_000_000_000_000;
const RAWG_BACKUP_KEY = "83b2a55ac54c4c1db7099212e740f680";
const TOKEN_REFRESH_SKEW_MS = 60_000;
const GENRE_CACHE_TTL_MS = 1000 * 60 * 60;
const LIST_CACHE_TTL_MS = 1000 * 60;
const DETAIL_CACHE_TTL_MS = 1000 * 60 * 10;
const MAX_LIST_CACHE_ENTRIES = 200;
const MAX_DETAIL_CACHE_ENTRIES = 300;
const IGDB_REQUEST_TIMEOUT_MS = 8000;
const IGDB_COUNT_TIMEOUT_MS = 1200;
const IGDB_MAX_RETRIES = 2;
const RAWG_IGDB_COVER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_RAWG_IGDB_COVER_CACHE_ENTRIES = 1200;
const IGDB_COVER_LOOKUP_BACKOFF_MS = 1000 * 60;
const RAWG_IGDB_FALLBACK_LOOKUPS_PER_REQUEST = 10;

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
let listCache = new Map();
let detailCache = new Map();
let rawgIgdbCoverCache = new Map();
let igdbCoverLookupBackoffUntil = 0;

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

function readTimedCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= Number(entry.expiresAt || 0)) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function readStaleCache(cache, key) {
  const entry = cache.get(key);
  return entry ? entry.value : null;
}

function writeTimedCache(cache, key, value, ttlMs, maxEntries = 200) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + Math.max(1, Number(ttlMs || 0))
  });
  while (cache.size > Math.max(1, Number(maxEntries || 200))) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

function formatIgdbQuery(rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) return "";
  return /;\s*$/.test(query) ? query : `${query};`;
}

function isTransientIgdbStatus(status) {
  const n = Number(status);
  return n === 429 || n === 500 || n === 502 || n === 503 || n === 504;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function withTimeout(promise, ms) {
  const timeoutMs = Math.max(1, Number(ms) || 1);
  let timer = null;
  return await Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`Timeout after ${timeoutMs}ms`);
        err.code = "TIMEOUT";
        reject(err);
      }, timeoutMs);
    })
  ]);
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
    "TWITCH_API_KEY",
    "TWITCH_API_CLIENT_ID",
    "TWITCH_KEY",
    "IGDB_CLIENT_ID",
    "TWITCH_APP_CLIENT_ID"
  ]);
  const clientSecret = readFirstEnv([
    "TWITCH_CLIENT_SECRET",
    "TWITCH_API_SECRET",
    "TWITCH_API_CLIENT_SECRET",
    "TWITCH_SECRET",
    "IGDB_CLIENT_SECRET",
    "TWITCH_APP_CLIENT_SECRET"
  ]);
  const staticAccessToken = readFirstEnv([
    "TWITCH_ACCESS_TOKEN",
    "TWITCH_BEARER_TOKEN",
    "TWITCH_API_TOKEN",
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
  return String(
    process.env.RAWG_API_KEY ||
    process.env.RAWG_KEY ||
    process.env.RAWG_BACKUP_KEY ||
    RAWG_BACKUP_KEY ||
    ""
  ).trim();
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

function normalizeGameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function yearFromRelease(value) {
  const text = String(value || "").trim();
  const year = text.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

function rawgCoverLookupKey(name, slug, released) {
  const slugKey = String(slug || "").trim().toLowerCase();
  if (slugKey) return `slug:${slugKey}`;
  const normalizedName = normalizeGameKey(name);
  if (!normalizedName) return "";
  const year = yearFromRelease(released);
  return year ? `name:${normalizedName}|${year}` : `name:${normalizedName}`;
}

function pickIgdbCoverImage(game) {
  const imageId = String(game?.cover?.image_id || "").trim();
  if (imageId) return imageUrl(imageId, "t_cover_big");
  const url = toHttpsUrl(game?.cover?.url || "");
  return url || "";
}

function scoreIgdbCoverMatch(row, targetYear = "") {
  const year = Number(targetYear);
  if (!Number.isFinite(year) || year <= 0) return 0;
  const rowYear = Number(toReleaseDate(row?.first_release_date).slice(0, 4));
  if (!Number.isFinite(rowYear) || rowYear <= 0) return 100;
  return Math.abs(rowYear - year);
}

function pickBestIgdbCover(games, targetYear = "") {
  let bestCover = "";
  let bestScore = Number.POSITIVE_INFINITY;
  (Array.isArray(games) ? games : []).forEach((game) => {
    const cover = pickIgdbCoverImage(game);
    if (!cover) return;
    const score = scoreIgdbCoverMatch(game, targetYear);
    if (score < bestScore) {
      bestScore = score;
      bestCover = cover;
    }
  });
  return bestCover;
}

function shouldBackoffIgdbCoverLookup(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("igdb 429") ||
    message.includes("igdb 500") ||
    message.includes("igdb 502") ||
    message.includes("igdb 503") ||
    message.includes("igdb 504") ||
    message.includes("twitch token error")
  );
}

async function runWithConcurrency(items = [], concurrency = 4, worker) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return;
  const queue = [...list];
  const maxWorkers = Math.max(1, Math.min(Number(concurrency) || 1, queue.length));
  await Promise.all(Array.from({ length: maxWorkers }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      await worker(item);
    }
  }));
}

async function lookupIgdbCoverByName(name, released = "") {
  const query = String(name || "").trim();
  if (!query) return "";
  const safeName = escapeIgdbText(query);
  if (!safeName) return "";
  const queryParts = [
    "fields id,name,slug,first_release_date,cover,cover.image_id;",
    `search "${safeName}";`,
    "where cover != null & category = 0;",
    "limit 6;"
  ];
  const rows = await igdbRequest("games", queryParts.join(" "));
  return pickBestIgdbCover(rows, yearFromRelease(released));
}

async function enrichRawgRowsWithIgdbCovers(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length || !hasIgdbCredentials()) return list;
  if (Date.now() < igdbCoverLookupBackoffUntil) return list;

  const pending = [];
  list.forEach((row) => {
    const key = rawgCoverLookupKey(row?.name, row?.slug, row?.released);
    if (!key) return;
    const cached = readTimedCache(rawgIgdbCoverCache, key);
    if (cached !== null) {
      if (cached) row.cover = cached;
      return;
    }
    pending.push({
      row,
      key,
      slug: String(row?.slug || "").trim().toLowerCase()
    });
  });
  if (!pending.length) return list;

  const unresolved = new Set(pending);
  try {
    const slugMap = new Map();
    pending.forEach((entry) => {
      if (!/^[a-z0-9-]+$/.test(entry.slug)) return;
      if (!slugMap.has(entry.slug)) slugMap.set(entry.slug, []);
      slugMap.get(entry.slug).push(entry);
    });

    const slugs = [...slugMap.keys()];
    for (const slugChunk of chunkArray(slugs, 20)) {
      if (!slugChunk.length) continue;
      const slugFilters = slugChunk
        .map((slug) => `slug = "${escapeIgdbText(slug)}"`)
        .join(" | ");
      const query = [
        "fields id,slug,first_release_date,cover,cover.image_id;",
        `where cover != null & category = 0 & (${slugFilters});`,
        `limit ${Math.max(20, slugChunk.length * 3)};`
      ].join(" ");
      const rows = await igdbRequest("games", query);
      (Array.isArray(rows) ? rows : []).forEach((game) => {
        const slug = String(game?.slug || "").trim().toLowerCase();
        const cover = pickIgdbCoverImage(game);
        if (!slug || !cover || !slugMap.has(slug)) return;
        slugMap.get(slug).forEach((entry) => {
          if (!unresolved.has(entry)) return;
          entry.row.cover = cover;
          writeTimedCache(
            rawgIgdbCoverCache,
            entry.key,
            cover,
            RAWG_IGDB_COVER_CACHE_TTL_MS,
            MAX_RAWG_IGDB_COVER_CACHE_ENTRIES
          );
          unresolved.delete(entry);
        });
      });
    }

    const fallbackEntries = pending
      .filter((entry) => unresolved.has(entry))
      .slice(0, RAWG_IGDB_FALLBACK_LOOKUPS_PER_REQUEST);

    await runWithConcurrency(fallbackEntries, 4, async (entry) => {
      const cover = await lookupIgdbCoverByName(entry.row?.name, entry.row?.released);
      if (!cover) return;
      entry.row.cover = cover;
      writeTimedCache(
        rawgIgdbCoverCache,
        entry.key,
        cover,
        RAWG_IGDB_COVER_CACHE_TTL_MS,
        MAX_RAWG_IGDB_COVER_CACHE_ENTRIES
      );
      unresolved.delete(entry);
    });

    pending.forEach((entry) => {
      if (!unresolved.has(entry)) return;
      writeTimedCache(
        rawgIgdbCoverCache,
        entry.key,
        "",
        RAWG_IGDB_COVER_CACHE_TTL_MS,
        MAX_RAWG_IGDB_COVER_CACHE_ENTRIES
      );
    });
  } catch (error) {
    if (shouldBackoffIgdbCoverLookup(error)) {
      igdbCoverLookupBackoffUntil = Date.now() + IGDB_COVER_LOOKUP_BACKOFF_MS;
    }
  }

  return list;
}

async function getIgdbAccessToken(forceRefresh = false) {
  const { clientId, clientSecret, staticAccessToken } = getIgdbCredentials();
  if (!clientId) {
    const err = new Error("Missing Twitch client id. Set TWITCH_CLIENT_ID or TWITCH_API_KEY.");
    err.code = "IGDB_DISABLED";
    throw err;
  }
  if (!clientSecret) {
    if (staticAccessToken) return staticAccessToken;
    const err = new Error("Missing Twitch client secret/token. Set TWITCH_CLIENT_SECRET, TWITCH_API_SECRET, or TWITCH_ACCESS_TOKEN.");
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
      if (staticAccessToken) return staticAccessToken;
      const err = new Error(`Twitch token error ${response.status}: ${body}`);
      err.code = "TWITCH_AUTH_ERROR";
      throw err;
    }

    const json = await response.json();
    const accessToken = String(json?.access_token || "").trim();
    const expiresIn = Number(json?.expires_in || 0);
    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      if (staticAccessToken) return staticAccessToken;
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

async function igdbRequest(endpoint, body, options = {}) {
  const { clientId } = getIgdbCredentials();
  if (!clientId) {
    const err = new Error("IGDB client id is missing.");
    err.code = "IGDB_DISABLED";
    throw err;
  }

  const query = formatIgdbQuery(body);
  if (!query) {
    const err = new Error("IGDB query body is empty.");
    err.code = "IGDB_QUERY_EMPTY";
    throw err;
  }
  const timeoutMs = clampInt(options.timeoutMs, 1000, 30_000, IGDB_REQUEST_TIMEOUT_MS);
  const maxRetries = clampInt(options.maxRetries, 0, 5, IGDB_MAX_RETRIES);
  const retryBackoffMs = clampInt(options.retryBackoffMs, 50, 3000, 260);

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let forceRefreshToken = attempt > 0;
    try {
      const token = await getIgdbAccessToken(forceRefreshToken);
      const response = await fetch(`${IGDB_API_BASE}/${String(endpoint || "").trim()}`, {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain"
        },
        body: query,
        signal: typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined
      });

      if (response.status === 401) {
        tokenCache = { accessToken: "", expiresAt: 0 };
        if (attempt < maxRetries) {
          await delay(retryBackoffMs * (attempt + 1));
          continue;
        }
      }

      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`IGDB ${response.status}: ${text}`);
        err.code = "IGDB_UPSTREAM_ERROR";
        err.status = response.status;
        if (attempt < maxRetries && isTransientIgdbStatus(response.status)) {
          lastError = err;
          await delay(retryBackoffMs * (attempt + 1));
          continue;
        }
        throw err;
      }

      const text = await response.text();
      if (!text.trim()) return [];
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || "");
      const isAbort = error?.name === "AbortError" || message.toLowerCase().includes("timed out");
      if (attempt < maxRetries && isAbort) {
        await delay(retryBackoffMs * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("IGDB request failed.");
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
    "cover != null"
  ];
  const ids = dedupeNumbers(genreIds);
  if (ids.length) clauses.push(`genres = (${ids.join(",")})`);
  if (Number.isFinite(startUnix)) clauses.push(`first_release_date >= ${Math.floor(startUnix)}`);
  if (Number.isFinite(endUnix)) clauses.push(`first_release_date <= ${Math.floor(endUnix)}`);
  return clauses.join(" & ");
}

async function fetchIgdbGamesList({ page, pageSize, orderingRaw, search, whereClause }) {
  const cacheKey = `igdb:${page}:${pageSize}:${orderingRaw}:${search}:${whereClause}`;
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;
  const staleCached = readStaleCache(listCache, cacheKey);

  const offset = Math.max(0, (page - 1) * pageSize);
  try {
    const sortClause = mapOrderingToIgdb(orderingRaw);
    const countPromise = (async () => {
      try {
        const countParts = [];
        if (search) countParts.push(`search "${escapeIgdbText(search)}";`);
        if (whereClause) countParts.push(`where ${whereClause};`);
        const countJson = await igdbRequest("games/count", countParts.join(" "), {
          timeoutMs: IGDB_COUNT_TIMEOUT_MS,
          maxRetries: 0
        });
        return Number(countJson?.count || 0);
      } catch (_error) {
        return 0;
      }
    })();

    const queryParts = [
      "fields id,name,slug,first_release_date,total_rating,total_rating_count,aggregated_rating,cover.image_id,screenshots.image_id,genres.id,genres.name,genres.slug;"
    ];
    if (search) queryParts.push(`search "${escapeIgdbText(search)}";`);
    if (whereClause) queryParts.push(`where ${whereClause};`);
    queryParts.push(`sort ${sortClause};`);
    queryParts.push(`limit ${pageSize};`);
    queryParts.push(`offset ${offset};`);
    const games = await igdbRequest("games", queryParts.join(" "));

    let genreData = null;
    const hasNumericGenreRefs = (Array.isArray(games) ? games : []).some((game) =>
      (Array.isArray(game?.genres) ? game.genres : []).some((genre) => Number.isFinite(Number(genre)))
    );
    if (hasNumericGenreRefs) {
      try {
        genreData = await ensureIgdbGenreCache();
      } catch (_genreError) {
        genreData = null;
      }
    }

    const results = (Array.isArray(games) ? games : []).map((game) => {
      const mappedGenres = (Array.isArray(game?.genres) ? game.genres : [])
        .map((genre) => {
          if (genre && typeof genre === "object") {
            const id = Number(genre?.id || 0);
            const name = String(genre?.name || "").trim();
            const slug = String(genre?.slug || "").trim().toLowerCase();
            if (id > 0 || name) {
              return {
                id: id > 0 ? id : 0,
                name: name || "Genre",
                slug
              };
            }
            return null;
          }
          const genreId = Number(genre);
          if (!Number.isFinite(genreId) || genreId <= 0 || !genreData) return null;
          const mapped = genreData.byId.get(genreId);
          if (!mapped) return null;
          return {
            id: mapped.id,
            name: mapped.name,
            slug: mapped.slug
          };
        })
        .filter(Boolean);

      const coverImage = game?.cover?.image_id ? imageUrl(game.cover.image_id, "t_cover_big") : "";
      const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
        .map((entry) => {
          if (entry && typeof entry === "object" && entry.image_id) {
            return imageUrl(entry.image_id, "t_screenshot_big");
          }
          return "";
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

    const timedCount = await withTimeout(countPromise, IGDB_COUNT_TIMEOUT_MS).catch(() => 0);
    const fallbackCount = offset + results.length + (results.length >= pageSize ? pageSize : 0);
    const payload = {
      count: timedCount || fallbackCount,
      results
    };
    writeTimedCache(listCache, cacheKey, payload, LIST_CACHE_TTL_MS, MAX_LIST_CACHE_ENTRIES);
    return payload;
  } catch (error) {
    if (staleCached) return staleCached;
    throw error;
  }
}

async function fetchIgdbGameDetails(id) {
  const cacheKey = `igdb:${Number(id)}`;
  const cached = readTimedCache(detailCache, cacheKey);
  if (cached) return cached;

  const query = [
    "fields id,name,slug,summary,first_release_date,total_rating,total_rating_count,aggregated_rating,cover.image_id,screenshots.image_id,genres.id,genres.name,genres.slug,platforms.name;",
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

  let genreData = null;
  const hasNumericGenreRefs = (Array.isArray(game?.genres) ? game.genres : [])
    .some((genre) => Number.isFinite(Number(genre)));
  if (hasNumericGenreRefs) {
    try {
      genreData = await ensureIgdbGenreCache();
    } catch (_genreError) {
      genreData = null;
    }
  }

  const platformIds = dedupeNumbers(game?.platforms || []);
  let platformMap = new Map();
  if (platformIds.length) {
    try {
      platformMap = await fetchMapByIds("platforms", platformIds, "id,name");
    } catch (_platformError) {
      platformMap = new Map();
    }
  }

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

  const payload = {
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
      .map((genre) => {
        if (genre && typeof genre === "object") {
          const id = Number(genre?.id || 0);
          const name = String(genre?.name || "").trim();
          const slug = String(genre?.slug || "").trim().toLowerCase();
          if (id > 0 || name) {
            return {
              id: id > 0 ? id : 0,
              name: name || "Genre",
              slug
            };
          }
          return null;
        }
        const genreId = Number(genre);
        if (!Number.isFinite(genreId) || genreId <= 0 || !genreData) return null;
        const mapped = genreData.byId.get(genreId);
        if (!mapped) return null;
        return {
          id: mapped.id,
          name: mapped.name,
          slug: mapped.slug
        };
      })
      .filter(Boolean),
    rating: rating ? Number((rating / 20).toFixed(1)) : null,
    ratings_count: ratingsCount || 0,
    metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
    platforms: (Array.isArray(game?.platforms) ? game.platforms : [])
      .map((platform) => {
        if (platform && typeof platform === "object") {
          const name = String(platform?.name || platform?.platform?.name || "").trim();
          return name ? { platform: { name } } : null;
        }
        const mapped = platformMap.get(Number(platform));
        const name = String(mapped?.name || "").trim();
        return name ? { platform: { name } } : null;
      })
      .filter(Boolean),
    developers: [],
    publishers: [],
    stores: [],
    website: "",
    reddit_url: "",
    clip: null,
    youtube_url: "",
    source: "igdb"
  };
  writeTimedCache(detailCache, cacheKey, payload, DETAIL_CACHE_TTL_MS, MAX_DETAIL_CACHE_ENTRIES);
  return payload;
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
  await enrichRawgRowsWithIgdbCovers(results);
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

  const payload = {
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
  await enrichRawgRowsWithIgdbCovers([payload]);
  return payload;
}

async function gameBrainRequest(path, params = {}, timeoutMs = GAMEBRAIN_REQUEST_TIMEOUT_MS) {
  const url = new URL(`${GAMEBRAIN_API_BASE}${String(path || "").startsWith("/") ? path : `/${String(path || "")}`}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    signal: typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`GAMEBRAIN ${response.status}: ${text}`);
    err.code = "GAMEBRAIN_UPSTREAM_ERROR";
    err.status = response.status;
    throw err;
  }
  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text);
}

async function fetchGameBrainGameInfo(id) {
  const gameId = Number(id);
  if (!Number.isFinite(gameId) || gameId <= 0) return null;
  const payload = await gameBrainRequest("/game-info", { id: gameId });
  if (!payload || typeof payload !== "object") return null;
  return payload;
}

async function fetchGameBrainPlayerScores(gameId, playerId) {
  const safeGameId = Number(gameId);
  const safePlayerId = Number(playerId);
  if (!Number.isFinite(safeGameId) || safeGameId <= 0) return null;
  if (!Number.isFinite(safePlayerId) || safePlayerId <= 0) return null;
  const payload = await gameBrainRequest("/player-scores", {
    game_id: safeGameId,
    player_id: safePlayerId
  });
  if (!payload || typeof payload !== "object") return null;
  return payload;
}

function toGameBrainGenreRows(genreValue) {
  const name = String(genreValue || "").trim();
  if (!name) return [];
  const slug = normalizeGameKey(name).replace(/\s+/g, "-");
  return [{
    id: 0,
    name,
    slug
  }];
}

function mapGameBrainListRow(game) {
  const id = Number(game?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  const title = String(game?.title || "Game").trim() || "Game";
  const slug = normalizeGameKey(title).replace(/\s+/g, "-");
  const released = String(game?.release_date || "").trim();
  const ratingRaw = Number(game?.rating || NaN);
  const rating = Number.isFinite(ratingRaw) ? Number(ratingRaw) : null;

  return {
    id,
    name: title,
    slug,
    released,
    cover: "",
    hero: "",
    screenshots: [],
    background_image: "",
    short_screenshots: [],
    rating,
    ratings_count: 0,
    metacritic: null,
    genres: toGameBrainGenreRows(game?.genre),
    platforms: [],
    source: "gamebrain"
  };
}

function mapGameBrainDetailRow(game, scoresPayload = null) {
  const base = mapGameBrainListRow(game);
  if (!base) return null;
  const scores = Array.isArray(scoresPayload?.scores) ? scoresPayload.scores : [];
  return {
    ...base,
    description_raw: "",
    description: "",
    playtime: null,
    developers: [],
    publishers: [],
    stores: [],
    website: "",
    reddit_url: "",
    clip: null,
    youtube_url: "",
    player_scores: scores
  };
}

function parseIdsQuery(value) {
  return dedupeNumbers(String(value || "")
    .split(",")
    .map((entry) => Number(String(entry || "").trim())));
}

async function fetchGameBrainGamesList({ page = 1, pageSize = 20, search = "", id = "", ids = "" } = {}) {
  const safePage = clampInt(page, 1, 100000, 1);
  const safePageSize = clampInt(pageSize, 1, 50, 20);
  const parsedIds = dedupeNumbers([
    ...parseIdsQuery(ids),
    ...parseIdsQuery(id)
  ]);
  const maybeSearchId = /^\d+$/.test(String(search || "").trim()) ? Number(search) : 0;
  if (maybeSearchId > 0) parsedIds.push(maybeSearchId);
  const explicitIds = dedupeNumbers(parsedIds).slice(0, GAMEBRAIN_MAX_FETCH_IDS);

  let candidateIds = explicitIds;
  if (!candidateIds.length) {
    const offset = (safePage - 1) * safePageSize;
    const scanCount = Math.min(
      GAMEBRAIN_MAX_FETCH_IDS,
      Math.max(safePageSize, safePageSize * GAMEBRAIN_LIST_SCAN_MULTIPLIER)
    );
    candidateIds = Array.from({ length: scanCount }, (_v, idx) => offset + idx + 1);
  }

  const workItems = candidateIds.map((gameId, idx) => ({ gameId, idx }));
  const mapped = new Array(workItems.length).fill(null);
  await runWithConcurrency(workItems, 6, async ({ gameId, idx }) => {
    try {
      const game = await fetchGameBrainGameInfo(gameId);
      mapped[idx] = mapGameBrainListRow(game);
    } catch (_error) {
      mapped[idx] = null;
    }
  });

  const results = mapped.filter(Boolean).slice(0, safePageSize);
  const fallbackCount = (safePage - 1) * safePageSize + results.length + (results.length >= safePageSize ? safePageSize : 0);
  const count = explicitIds.length ? results.length : fallbackCount;

  return {
    count,
    results
  };
}

app.get("/api/igdb", (_req, res) => {
  return res.json({
    ok: true,
    service: "gamebrain-proxy",
    configured: true,
    auth_mode: "gamebrain",
    providers: {
      igdb: false,
      rawg: false,
      gamebrain: true
    },
    routes: ["/genres", "/games", "/games/:id"]
  });
});

app.get("/api/igdb/genres", async (_req, res) => {
  return res.json({
    count: 0,
    source: "gamebrain",
    results: []
  });
});

app.get("/api/igdb/games", async (req, res) => {
  const page = clampInt(req.query.page, 1, 100000, 1);
  const pageSize = clampInt(req.query.page_size, 1, 50, 20);
  const search = String(req.query.search || "").trim().slice(0, 100);
  const id = String(req.query.id || "").trim();
  const ids = String(req.query.ids || "").trim();

  try {
    const payload = await fetchGameBrainGamesList({
      page,
      pageSize: pageSize,
      search,
      id,
      ids
    });
    const results = Array.isArray(payload?.results) ? payload.results : [];

    return res.json({
      count: Number(payload?.count || results.length),
      page,
      page_size: pageSize,
      results: results.slice(0, pageSize),
      sources: {
        igdb: false,
        rawg: false,
        gamebrain: true
      }
    });
  } catch (error) {
    console.warn("[igdb-handler] GameBrain games failed:", String(error?.message || error));
    return res.json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      sources: {
        igdb: false,
        rawg: false,
        gamebrain: true
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
    const details = await fetchGameBrainGameInfo(requestedId);
    if (!details) {
      return res.status(404).json({ message: "Game not found." });
    }
    const playerId = Number(req.query.player_id || 0);
    const scorePayload = Number.isFinite(playerId) && playerId > 0
      ? await fetchGameBrainPlayerScores(requestedId, playerId).catch(() => null)
      : null;
    const mapped = mapGameBrainDetailRow(details, scorePayload);
    if (!mapped) {
      return res.status(404).json({ message: "Game not found." });
    }
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load game details.", error: String(error?.message || error) });
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
      gamebrain: true
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
        gamebrain: true
      }
    });
  }
}
