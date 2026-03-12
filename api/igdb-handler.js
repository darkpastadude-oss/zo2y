import express from "express";
import { createClient } from "@supabase/supabase-js";
import { applyApiGuardrails } from "./_guardrails.js";
import {
  WIKIPEDIA_GAME_GENRES,
  fetchWikipediaGameDetailsById,
  fetchWikipediaGamesList
} from "./_wiki-games-provider.js";

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-igdb", max: 240 });

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_REST_BASE = "https://en.wikipedia.org/api/rest_v1";
const WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
const WIKI_REQUEST_TIMEOUT_MS = 7000;
const WIKI_SUMMARY_CACHE_TTL_MS = 1000 * 60 * 30;
const WIKI_LIST_CACHE_TTL_MS = 1000 * 60 * 4;
const WIKI_DETAIL_CACHE_TTL_MS = 1000 * 60 * 30;
const WIKI_ENTITY_CACHE_TTL_MS = 1000 * 60 * 60;
const MAX_WIKI_LIST_CACHE_ENTRIES = 220;
const MAX_WIKI_DETAIL_CACHE_ENTRIES = 320;
const MAX_WIKI_ENTITY_CACHE_ENTRIES = 900;
const WIKIDATA_VIDEO_GAME_QID = "Q7889";
const RAWG_API_BASE = "https://api.rawg.io/api";
const RAWG_ID_OFFSET = 9_000_000_000_000;
const WIKI_ID_OFFSET = 8_000_000_000_000;
const GAMEBRAIN_ID_OFFSET = 7_000_000_000_000;
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
const IGDB_COVER_SIZE = "t_cover_big";
const IGDB_SCREENSHOT_SIZE = "t_screenshot_big";
const IGDB_HERO_SIZE = "t_1080p";
const RAWG_IGDB_COVER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_RAWG_IGDB_COVER_CACHE_ENTRIES = 1200;
const IGDB_COVER_LOOKUP_BACKOFF_MS = 1000 * 60;
const RAWG_IGDB_FALLBACK_LOOKUPS_PER_REQUEST = 10;
const IGDB_ADDON_TITLE_PATTERN = /\b(expansion|dlc|add-?on|bundle|pack|pass|season|episode|chapter|story|campaign|multiplayer|co-?op|online|mobile|mod|randomizer|soundtrack|art book|demo|beta|alpha|prologue|collector'?s|deluxe|ultimate|definitive|complete|goty|gold|limited|starter|special|master|edition|anniversary|remaster|remake|director'?s cut|vr|hd|enhanced|update|expansion pass)\b/i;
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://gfkhjbztayjyojsgdpgk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

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
let wikiSummaryCache = new Map();
let wikiListResponseCache = new Map();
let wikiDetailResponseCache = new Map();
let wikiEntityCache = new Map();
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return supabaseAdmin;
}

function setResponseCache(res, { maxAge = 300, staleWhileRevalidate = 900 } = {}) {
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${Math.max(0, Math.floor(maxAge))}, stale-while-revalidate=${Math.max(0, Math.floor(staleWhileRevalidate))}`
  );
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

function isTruthyFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on", "igdb"].includes(normalized);
}

function parseProviderList(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || raw === "all" || raw === "auto") {
    return new Set(["igdb", "rawg", "wikipedia", "gamebrain"]);
  }
  const parts = raw.split(",").map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean);
  const normalized = new Set();
  parts.forEach((part) => {
    if (part === "wiki") normalized.add("wikipedia");
    else if (part === "gb" || part === "game-brain") normalized.add("gamebrain");
    else normalized.add(part);
  });
  return normalized;
}

function toHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  return raw;
}

function normalizeIgdbImageUrl(urlValue, size = IGDB_COVER_SIZE) {
  const url = toHttpsUrl(urlValue);
  if (!url) return "";
  return url.replace(/\/t_[^/]+\//, `/${size}/`);
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

function imageUrl(imageId, size = IGDB_HERO_SIZE) {
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

function getGameBrainApiKey() {
  return String(
    process.env.GAMEBRAIN_API_KEY ||
    process.env.GAME_BRAIN_API_KEY ||
    process.env.GAMEBRAIN_KEY ||
    ""
  ).trim();
}

function hasGameBrainApiKey() {
  return !!getGameBrainApiKey();
}

function mapOrderingToIgdb(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "first_release_date desc";
  if (ordering === "-rating") return "total_rating desc";
  if (ordering === "-rating_count" || ordering === "-ratings_count") return "total_rating_count desc";
  if (ordering === "-follows") return "follows desc";
  if (ordering === "-name") return "name asc";
  if (ordering === "released") return "first_release_date asc";
  if (ordering === "rating") return "total_rating asc";
  if (ordering === "rating_count" || ordering === "ratings_count") return "total_rating_count asc";
  if (ordering === "follows") return "follows asc";
  return "first_release_date desc";
}

function mapOrderingToRawg(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "-released";
  if (ordering === "-rating") return "-rating";
  if (ordering === "-rating_count" || ordering === "-ratings_count") return "-ratings_count";
  if (ordering === "-follows") return "-added";
  if (ordering === "-metacritic") return "-metacritic";
  if (ordering === "released") return "released";
  if (ordering === "rating") return "rating";
  if (ordering === "rating_count" || ordering === "ratings_count") return "ratings_count";
  if (ordering === "follows") return "added";
  return "-added";
}

async function fetchRawgGenres() {
  const json = await rawgRequest("/genres", { page_size: 200 });
  const rows = Array.isArray(json?.results) ? json.results : [];
  const results = rows.map((row) => ({
    id: Number(row?.id || 0),
    name: String(row?.name || "").trim(),
    slug: String(row?.slug || "").trim().toLowerCase()
  })).filter((row) => row.id > 0 && row.name && row.slug);
  return {
    count: Number(json?.count || results.length || 0),
    results
  };
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

function encodeWikiId(rawId) {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return WIKI_ID_OFFSET + id;
}

function decodeWikiId(value) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= WIKI_ID_OFFSET) return null;
  const decoded = id - WIKI_ID_OFFSET;
  if (!Number.isFinite(decoded) || decoded <= 0) return null;
  return decoded;
}

function encodeGameBrainId(rawId) {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return GAMEBRAIN_ID_OFFSET + id;
}

function decodeGameBrainId(value) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= GAMEBRAIN_ID_OFFSET) return null;
  const decoded = id - GAMEBRAIN_ID_OFFSET;
  if (!Number.isFinite(decoded) || decoded <= 0) return null;
  return decoded;
}

function normalizeGameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sanitizeIlikeToken(value) {
  return String(value || "").replace(/[%_]+/g, "").trim();
}

function buildLooseIlikePattern(query) {
  const cleaned = sanitizeIlikeToken(query);
  if (!cleaned) return "";
  const compact = normalizeGameKey(cleaned).replace(/\s+/g, "");
  if (!compact) return "";
  return compact.split("").join("%");
}

function mapSupabaseGameRow(row) {
  if (!row) return null;
  const id = Number(row?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  const cover = toHttpsUrl(row?.cover_url || "");
  if (!cover) return null;
  const hero = toHttpsUrl(row?.hero_url || "");
  const extra = row?.extra && typeof row.extra === "object" ? row.extra : {};
  const screenshots = Array.isArray(extra?.screenshots) ? extra.screenshots : [];
  const normalizedScreens = mergeUniqueStrings([hero, cover], screenshots);
  return {
    id,
    igdb_id: Number(row?.igdb_id || 0) || null,
    rawg_id: Number(row?.rawg_id || 0) || null,
    wiki_id: extra?.wiki_id || null,
    gamebrain_id: extra?.gamebrain_id || null,
    name: String(row?.title || "Game").trim(),
    slug: String(row?.slug || "").trim(),
    released: String(row?.release_date || "").trim(),
    cover,
    hero: hero || cover,
    screenshots: normalizedScreens,
    background_image: hero || cover,
    short_screenshots: normalizedScreens.map((image, index) => ({ id: index + 1, image })),
    rating: Number.isFinite(Number(row?.rating || NaN)) ? Number(row.rating) : null,
    ratings_count: Number(row?.rating_count || 0),
    metacritic: Number.isFinite(Number(extra?.metacritic || NaN)) ? Number(extra.metacritic) : null,
    genres: Array.isArray(extra?.genres) ? extra.genres : [],
    platforms: Array.isArray(extra?.platforms) ? extra.platforms : [],
    source: String(row?.source || extra?.source || "wikipedia").trim().toLowerCase()
  };
}

function mapOrderingToSupabase(orderingRaw) {
  const ordering = String(orderingRaw || "-follows").trim().toLowerCase();
  if (ordering === "-released") return { column: "release_date", ascending: false };
  if (ordering === "released") return { column: "release_date", ascending: true };
  if (ordering === "-rating") return { column: "rating", ascending: false };
  if (ordering === "rating") return { column: "rating", ascending: true };
  if (ordering === "-rating_count" || ordering === "-ratings_count" || ordering === "-follows") {
    return { column: "rating_count", ascending: false };
  }
  if (ordering === "rating_count" || ordering === "ratings_count" || ordering === "follows") {
    return { column: "rating_count", ascending: true };
  }
  if (ordering === "-name") return { column: "title", ascending: true };
  return { column: "rating_count", ascending: false };
}

async function fetchCachedGamesFromSupabase({ search = "", dates = "", ordering = "-follows", page = 1, pageSize = 20, source = "" } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const safeSearch = sanitizeIlikeToken(search);
  const shouldSearch = !!safeSearch;
  const safeSource = String(source || "").trim().toLowerCase();
  const offset = Math.max(0, (Number(page || 1) - 1) * Number(pageSize || 20));
  let query = admin
    .from("games")
    .select("id,title,description,cover_url,hero_url,release_date,rating,rating_count,extra,source,igdb_id,rawg_id,slug", { count: "exact" });

  if (safeSource) {
    query = query.eq("source", safeSource);
  }

  if (shouldSearch) {
    const loosePattern = buildLooseIlikePattern(safeSearch);
    const patterns = [
      `title.ilike.%${safeSearch}%`,
      `slug.ilike.%${safeSearch}%`
    ];
    if (loosePattern && loosePattern !== safeSearch) {
      patterns.push(`title.ilike.%${loosePattern}%`);
      patterns.push(`slug.ilike.%${loosePattern}%`);
    }
    query = query.or(patterns.join(","));
  }

  const { startUnix, endUnix } = parseDatesRange(dates);
  if (Number.isFinite(startUnix)) {
    const startDate = new Date(startUnix * 1000).toISOString().slice(0, 10);
    query = query.gte("release_date", startDate);
  }
  if (Number.isFinite(endUnix)) {
    const endDate = new Date(endUnix * 1000).toISOString().slice(0, 10);
    query = query.lte("release_date", endDate);
  }

  const order = mapOrderingToSupabase(ordering);
  query = query.order(order.column, { ascending: order.ascending, nullsFirst: false });
  query = query.range(offset, offset + Math.max(1, Number(pageSize || 20)) - 1);

  const { data, error, count } = await query;
  if (error) return null;
  const rows = Array.isArray(data) ? data.map(mapSupabaseGameRow).filter(Boolean) : [];
  return { count: Number(count || rows.length || 0), results: rows };
}

function buildGameUpsertPayload(row) {
  if (!row || typeof row !== "object") return null;
  const id = Number(row?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return null;

  const cover = toHttpsUrl(row?.cover || row?.cover_url || row?.image || "");
  if (!cover) return null;

  const shortScreens = (Array.isArray(row?.short_screenshots) ? row.short_screenshots : [])
    .map((entry) => toHttpsUrl(entry?.image || entry || ""))
    .filter(Boolean);
  const screenshots = (Array.isArray(row?.screenshots) ? row.screenshots : [])
    .map((entry) => toHttpsUrl(entry || ""))
    .filter(Boolean);
  const normalizedScreens = mergeUniqueStrings(screenshots, shortScreens).filter(Boolean);
  const hero = toHttpsUrl(row?.hero || row?.background_image || row?.hero_url || normalizedScreens[0] || "");
  const title = String(row?.name || row?.title || "Game").trim();
  if (!title) return null;

  const source = String(row?.source || "").trim().toLowerCase() || "wikipedia";
  const igdbId = Number(row?.igdb_id || 0) || (source === "igdb" ? id : 0);
  const rawgId = Number(row?.rawg_id || 0) || decodeRawgId(id) || 0;
  const wikiId = Number(row?.wiki_id || 0) || decodeWikiId(id) || 0;
  const gamebrainId = Number(row?.gamebrain_id || 0) || decodeGameBrainId(id) || 0;
  const description = String(row?.description || row?.summary || row?.description_raw || "").trim();
  const releaseDate = normalizeReleaseDate(row?.released || row?.release_date || "");
  const rating = Number(row?.rating || row?.total_rating || row?.avg_rating || NaN);
  const ratingCount = Number(row?.ratings_count || row?.rating_count || row?.total_rating_count || 0);
  const slug = String(row?.slug || "").trim();

  const extra = {
    source,
    genres: Array.isArray(row?.genres) ? row.genres : [],
    platforms: Array.isArray(row?.platforms) ? row.platforms : [],
    screenshots: normalizedScreens,
    metacritic: Number.isFinite(Number(row?.metacritic || NaN)) ? Number(row.metacritic) : null,
    wiki_id: wikiId || null,
    gamebrain_id: gamebrainId || null
  };

  return {
    p_id: id,
    p_title: title,
    p_description: description || null,
    p_cover_url: cover,
    p_release_date: releaseDate,
    p_rating: Number.isFinite(rating) ? rating : null,
    p_rating_count: Number.isFinite(ratingCount) ? ratingCount : null,
    p_source: source,
    p_igdb_id: igdbId || null,
    p_rawg_id: rawgId || null,
    p_slug: slug || null,
    p_hero_url: hero || null,
    p_extra: extra
  };
}

async function cacheGamesToSupabase(rows = []) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const payloads = (Array.isArray(rows) ? rows : [])
    .map(buildGameUpsertPayload)
    .filter(Boolean)
    .slice(0, 40);
  if (!payloads.length) return;
  await Promise.allSettled(payloads.map((payload) => (
    admin.rpc("upsert_game_catalog", payload)
  )));
}

function mergeUniqueStrings(...lists) {
  const seen = new Set();
  const out = [];
  lists.flat().forEach((entry) => {
    const value = String(entry || "").trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  });
  return out;
}

function stripAddonSuffix(title) {
  let cleaned = String(title || "").trim();
  if (!cleaned) return "";
  const separators = [" - ", ": "];
  const suffixStrip = /\s+(expansion pass|season pass|expansion|dlc|bundle|pack|pass|edition|collector'?s|deluxe|ultimate|definitive|complete|goty|gold|limited|starter|special|master|anniversary|enhanced|remaster(?:ed)?|remake|director'?s cut|vr|hd).*$/i;
  let changed = true;
  let safety = 0;
  while (changed && safety < 4) {
    safety += 1;
    changed = false;
    for (const sep of separators) {
      if (!cleaned.includes(sep)) continue;
      const parts = cleaned.split(sep);
      if (parts.length < 2) continue;
      const left = parts[0].trim();
      const right = parts.slice(1).join(sep).trim();
      if (right && IGDB_ADDON_TITLE_PATTERN.test(right)) {
        cleaned = left;
        changed = true;
        break;
      }
    }
    const editionMatch = cleaned.match(/^(.*)\s+(collector'?s|deluxe|ultimate|definitive|complete|goty|gold|limited|starter|special|master|anniversary|enhanced|remaster(?:ed)?|remake|director'?s cut|vr|hd|edition|bundle|pack)$/i);
    if (editionMatch) {
      cleaned = editionMatch[1].trim();
      changed = true;
    }
    if (suffixStrip.test(cleaned)) {
      cleaned = cleaned.replace(suffixStrip, "").trim();
      changed = true;
    }
  }
  return cleaned || String(title || "").trim();
}

function normalizeIgdbTitleKey(title) {
  const stripped = stripAddonSuffix(title);
  const normalized = normalizeGameKey(stripped);
  return normalized || normalizeGameKey(title);
}

function scoreIgdbCandidate(game) {
  let score = 0;
  const category = Number(game?.category);
  if (!Number.isFinite(category) || category === 0) score += 1000;
  if (!game?.version_parent && !game?.parent_game) score += 300;
  if (IGDB_ADDON_TITLE_PATTERN.test(String(game?.name || ""))) score -= 200;
  const follows = Number(game?.follows || 0);
  const ratingCount = Number(game?.total_rating_count || 0);
  const rating = Number(game?.total_rating || 0);
  score += Math.min(follows / 1000, 600);
  score += Math.min(ratingCount / 10, 400);
  score += rating;
  return score;
}

function pickBestIgdbCandidate(group) {
  const baseCandidates = group.filter((row) => {
    const category = Number(row?.category);
    const isBaseCategory = !Number.isFinite(category) || category === 0;
    const hasParent = !!row?.version_parent || !!row?.parent_game;
    const hasAddonTitle = IGDB_ADDON_TITLE_PATTERN.test(String(row?.name || ""));
    return isBaseCategory && !hasParent && !hasAddonTitle;
  });
  const pool = baseCandidates.length ? baseCandidates : group;
  let best = null;
  let bestScore = -Infinity;
  pool.forEach((row) => {
    const score = scoreIgdbCandidate(row);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  });
  return best;
}

function dedupeIgdbGames(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;
  const groups = new Map();
  list.forEach((row) => {
    const key = normalizeIgdbTitleKey(row?.name || row?.title || row?.slug || "");
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  const results = [];
  groups.forEach((group) => {
    const best = pickBestIgdbCandidate(group);
    if (best) results.push(best);
  });
  return results;
}

function extractRowTitle(row) {
  return String(row?.name || row?.title || row?.slug || "").trim();
}

function extractRowReleaseDate(row) {
  const released = String(row?.released || row?.release_date || "").trim();
  if (released) return released;
  const unix = Number(row?.first_release_date || 0);
  if (Number.isFinite(unix) && unix > 0) return toReleaseDate(unix);
  return "";
}

function extractRowYear(row) {
  const date = extractRowReleaseDate(row);
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

function buildMergeKey(row) {
  const title = extractRowTitle(row);
  const titleKey = normalizeIgdbTitleKey(title);
  if (!titleKey) return "";
  const year = extractRowYear(row);
  return year ? `${titleKey}|${year}` : titleKey;
}

function sourcePriority(source) {
  const key = String(source || "").trim().toLowerCase();
  if (key === "igdb") return 4;
  if (key === "rawg") return 3;
  if (key === "wikipedia" || key === "wiki") return 2;
  if (key === "gamebrain") return 1;
  return 0;
}

function scoreCoverUrl(value) {
  const url = String(value || "").trim().toLowerCase();
  if (!url) return 0;
  let score = 10;
  if (url.includes("images.igdb.com")) score += 120;
  if (url.includes("media.rawg.io") || url.includes("rawg")) score += 90;
  if (url.includes("wikimedia") || url.includes("wikipedia")) score += 70;
  if (url.includes("t_cover_big")) score += 8;
  if (url.includes("t_1080p")) score += 6;
  if (url.includes("t_720p")) score += 4;
  return score;
}

function pickBestCover(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  const wikiRows = list.filter((row) => String(row?.source || "").trim().toLowerCase() === "wikipedia");
  const pool = wikiRows.length ? wikiRows : list;
  let best = "";
  let bestScore = 0;
  pool.forEach((row) => {
    const candidate = String(row?.cover || row?.hero || "").trim();
    const score = scoreCoverUrl(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });
  if (best) return best;
  // Fallback to any non-wiki cover if wiki is empty.
  list.forEach((row) => {
    const candidate = String(row?.cover || row?.hero || "").trim();
    const score = scoreCoverUrl(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });
  return best;
}

function pickBestHero(rows = [], fallbackCover = "") {
  let best = String(fallbackCover || "").trim();
  let bestScore = scoreCoverUrl(best);
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const candidate = String(row?.hero || row?.background_image || row?.cover || "").trim();
    const score = scoreCoverUrl(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });
  return best;
}

function normalizeGenreEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "object") {
    const name = String(entry?.name || "").trim();
    const slug = String(entry?.slug || name).trim().toLowerCase().replace(/\s+/g, "-");
    const id = Number(entry?.id || 0);
    if (!name && !slug && !Number.isFinite(id)) return null;
    return {
      id: Number.isFinite(id) ? id : 0,
      name: name || "Genre",
      slug
    };
  }
  const name = String(entry || "").trim();
  if (!name) return null;
  return {
    id: 0,
    name,
    slug: normalizeGameKey(name).replace(/\s+/g, "-")
  };
}

function normalizeReleaseDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  const parsed = Date.parse(text);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return null;
}

function mergeGenreRows(rows = []) {
  const out = [];
  const seen = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const genres = Array.isArray(row?.genres) ? row.genres : [];
    genres.forEach((entry) => {
      const normalized = normalizeGenreEntry(entry);
      if (!normalized) return;
      const key = normalized.slug || normalized.name.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(normalized);
    });
  });
  return out;
}

function mergePlatformRows(rows = []) {
  const out = [];
  const seen = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const platforms = Array.isArray(row?.platforms) ? row.platforms : [];
    platforms.forEach((entry) => {
      const name = entry?.platform?.name || entry?.name || entry;
      const normalized = String(name || "").trim();
      if (!normalized) return;
      const key = normalized.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ platform: { name: normalized } });
    });
  });
  return out;
}

function pickBestRatingRow(rows = []) {
  let best = null;
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!best) {
      best = row;
      return;
    }
    const currentCount = Number(row?.ratings_count || row?.rating_count || 0);
    const bestCount = Number(best?.ratings_count || best?.rating_count || 0);
    if (currentCount > bestCount) {
      best = row;
      return;
    }
    const currentRating = Number(row?.rating || 0);
    const bestRating = Number(best?.rating || 0);
    if (currentCount === bestCount && currentRating > bestRating) {
      best = row;
    }
  });
  return best || {};
}

function computePopularityScore(row) {
  const rating = Number(row?.rating || 0);
  const ratingCount = Number(row?.ratings_count || row?.rating_count || 0);
  const follows = Number(row?.follows || 0);
  const coverScore = scoreCoverUrl(row?.cover || row?.hero || "");
  const sourceWeight = sourcePriority(row?.source) * 1000;
  return sourceWeight + coverScore + (rating * 20) + Math.min(ratingCount, 10000) / 2 + Math.min(follows, 500000) / 100;
}

function computeSearchScore(row, query) {
  const normalizedQuery = normalizeGameKey(query);
  const titleKey = normalizeGameKey(extractRowTitle(row));
  let score = 0;
  if (titleKey === normalizedQuery) score += 1400;
  if (titleKey.startsWith(normalizedQuery)) score += 900;
  if (titleKey.includes(normalizedQuery)) score += 600;
  return score + computePopularityScore(row) * 0.2;
}

function mergeGameRows(rows = [], query = "") {
  const grouped = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row) return;
    const key = buildMergeKey(row);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  const merged = [];
  grouped.forEach((group) => {
    const sorted = group.slice().sort((a, b) => computePopularityScore(b) - computePopularityScore(a));
    const primary = sorted[0] ? { ...sorted[0] } : null;
    if (!primary) return;
    const sources = new Set();
    const screenshots = [];
    sorted.forEach((row) => {
      sources.add(String(row?.source || "unknown"));
      screenshots.push(...(Array.isArray(row?.screenshots) ? row.screenshots : []));
      const shortScreens = (Array.isArray(row?.short_screenshots) ? row.short_screenshots : [])
        .map((entry) => {
          if (typeof entry === "string") return entry;
          return entry?.image;
        })
        .filter(Boolean);
      screenshots.push(...shortScreens);
    });

    const bestCover = pickBestCover(sorted) || primary.cover || "";
    const bestHero = pickBestHero(sorted, bestCover) || primary.hero || bestCover || "";
    const mergedScreens = mergeUniqueStrings(bestHero, bestCover, ...screenshots).filter(Boolean);
    const bestRating = pickBestRatingRow(sorted);
    const bestFollows = sorted.reduce((max, row) => Math.max(max, Number(row?.follows || 0)), 0);

    primary.cover = bestCover;
    primary.hero = bestHero;
    primary.background_image = bestHero || bestCover || primary.background_image || "";
    primary.screenshots = mergedScreens;
    primary.short_screenshots = mergedScreens.map((image, idx) => ({ id: idx + 1, image }));
    primary.genres = mergeGenreRows(sorted);
    primary.platforms = mergePlatformRows(sorted);
    if (!Number.isFinite(Number(primary.rating || NaN)) || Number(primary.rating || 0) <= 0) {
      primary.rating = Number(bestRating?.rating || 0) || null;
    }
    if (!Number(primary.ratings_count || 0)) {
      primary.ratings_count = Number(bestRating?.ratings_count || bestRating?.rating_count || 0);
    }
    if (bestFollows > 0) primary.follows = bestFollows;
    primary.sources = Array.from(sources);
    merged.push(primary);
  });

  if (String(query || "").trim()) {
    merged.sort((a, b) => computeSearchScore(b, query) - computeSearchScore(a, query));
  } else {
    merged.sort((a, b) => computePopularityScore(b) - computePopularityScore(a));
  }
  return merged;
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
  if (imageId) return imageUrl(imageId, IGDB_COVER_SIZE);
  const url = normalizeIgdbImageUrl(game?.cover?.url || "", IGDB_COVER_SIZE);
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
  if (hasIgdbCredentials()) {
    const cache = await ensureIgdbGenreCache();
    named.forEach((token) => {
      const match = cache.bySlug.get(token) || cache.byName.get(token);
      if (match?.id) ids.add(match.id);
    });
  } else {
    const wikiMatch = new Map(
      WIKIPEDIA_GAME_GENRES.map((genre) => [
        String(genre.slug || genre.name || "").trim().toLowerCase(),
        genre
      ])
    );
    named.forEach((token) => {
      const match = wikiMatch.get(token);
      if (match?.id) ids.add(match.id);
    });
  }
  return [...ids];
}

function buildIgdbWhereClause({
  genreIds = [],
  startUnix = null,
  endUnix = null,
  minRatingCount = null,
  minFollows = null
} = {}) {
  const clauses = [
    "category = 0",
    "cover != null",
    "version_parent = null",
    "parent_game = null"
  ];
  const ids = dedupeNumbers(genreIds);
  if (ids.length) clauses.push(`genres = (${ids.join(",")})`);
  if (Number.isFinite(startUnix)) clauses.push(`first_release_date >= ${Math.floor(startUnix)}`);
  if (Number.isFinite(endUnix)) clauses.push(`first_release_date <= ${Math.floor(endUnix)}`);
  if (Number.isFinite(minRatingCount) && minRatingCount > 0) {
    clauses.push(`total_rating_count >= ${Math.floor(minRatingCount)}`);
  }
  if (Number.isFinite(minFollows) && minFollows > 0) {
    clauses.push(`follows >= ${Math.floor(minFollows)}`);
  }
  return clauses.join(" & ");
}

function dedupeGamesByNameAndYear(rows = []) {
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const name = String(row?.name || "").trim().toLowerCase();
    if (!name) return;
    const year = String(row?.released || "").slice(0, 4);
    const key = year ? `${name}|${year}` : name;
    const follows = Number(row?.follows || 0);
    const existing = map.get(key);
    if (!existing || follows > Number(existing.follows || 0)) {
      map.set(key, row);
    }
  });
  return Array.from(map.values());
}

async function fetchIgdbGamesList({ page, pageSize, orderingRaw, search, whereClause }) {
  const cacheKey = `igdb:${page}:${pageSize}:${orderingRaw}:${search}:${whereClause}`;
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;
  const staleCached = readStaleCache(listCache, cacheKey);

  const offset = Math.max(0, (page - 1) * pageSize);
  try {
    const hasSearch = !!search;
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
      "fields id,name,slug,summary,first_release_date,total_rating,total_rating_count,follows,category,version_parent,parent_game,cover.url,cover.image_id,screenshots.url,screenshots.image_id,genres.id,genres.name,genres.slug,platforms.name;"
    ];
    if (search) queryParts.push(`search "${escapeIgdbText(search)}";`);
    if (whereClause) queryParts.push(`where ${whereClause};`);
    if (!hasSearch) queryParts.push(`sort ${sortClause};`);
    queryParts.push(`limit ${pageSize};`);
    queryParts.push(`offset ${offset};`);
    let games = null;
    try {
      games = await igdbRequest("games", queryParts.join(" "));
    } catch (error) {
      if (hasSearch) throw error;
      const orderingKey = String(orderingRaw || "").toLowerCase();
      if (orderingKey.includes("follows")) {
        const fallbackParts = [...queryParts];
        const fallbackSort = "total_rating_count desc";
        for (let i = 0; i < fallbackParts.length; i += 1) {
          if (fallbackParts[i].startsWith("sort ")) {
            fallbackParts[i] = `sort ${fallbackSort};`;
          }
        }
        games = await igdbRequest("games", fallbackParts.join(" "));
      } else {
        throw error;
      }
    }

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

    const cleanedGames = dedupeIgdbGames(Array.isArray(games) ? games : []);
    const mappedRows = cleanedGames.map((game) => {
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

      const coverImage = game?.cover?.image_id
        ? imageUrl(game.cover.image_id, IGDB_COVER_SIZE)
        : normalizeIgdbImageUrl(game?.cover?.url || "", IGDB_COVER_SIZE);
      const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
        .map((entry) => {
          if (entry && typeof entry === "object") {
            if (entry.image_id) return imageUrl(entry.image_id, IGDB_SCREENSHOT_SIZE);
            if (entry.url) return normalizeIgdbImageUrl(entry.url, IGDB_SCREENSHOT_SIZE);
          }
          if (typeof entry === "string") return normalizeIgdbImageUrl(entry, IGDB_SCREENSHOT_SIZE);
          return "";
        })
        .filter(Boolean)
        .slice(0, 12);
      const hero = screenshotRows[0] || coverImage || "";
      const rating = Number(game?.total_rating || 0);
      const ratingCount = Number(game?.total_rating_count || 0);
      const summary = String(game?.summary || "").trim();

      return {
        id: Number(game?.id || 0),
        name: String(game?.name || "Game"),
        slug: String(game?.slug || ""),
        released: toReleaseDate(game?.first_release_date),
        summary,
        cover: coverImage,
        hero,
        screenshots: screenshotRows,
        background_image: hero || coverImage,
        short_screenshots: screenshotRows.map((image, index) => ({ id: index + 1, image })),
        rating: rating ? Number((rating / 20).toFixed(1)) : null,
        ratings_count: ratingCount || 0,
        metacritic: null,
        genres: mappedGenres,
        platforms: (Array.isArray(game?.platforms) ? game.platforms : [])
          .map((platform) => {
            if (platform && typeof platform === "object") {
              const name = String(platform?.name || "").trim();
              return name ? { platform: { name } } : null;
            }
            const name = String(platform || "").trim();
            return name ? { platform: { name } } : null;
          })
          .filter(Boolean),
        source: "igdb"
      };
    }).filter((row) => row.id > 0);

    const results = mappedRows;

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

async function fetchIgdbGamesByPopscore({
  page,
  pageSize,
  popularityType,
  minRatingCount = 0,
  minFollows = 0
}) {
  const cacheKey = `igdb:popscore:${popularityType}:${page}:${pageSize}:${minRatingCount}:${minFollows}`;
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;
  const staleCached = readStaleCache(listCache, cacheKey);

  try {
    const offset = Math.max(0, (page - 1) * pageSize);
    const primitiveLimit = clampInt(pageSize * 4, pageSize, 500, pageSize);

    const countPromise = (async () => {
      try {
        const countJson = await igdbRequest(
          "popularity_primitives/count",
          `where popularity_type = ${Math.floor(popularityType)};`,
          { timeoutMs: IGDB_COUNT_TIMEOUT_MS, maxRetries: 0 }
        );
        return Number(countJson?.count || 0);
      } catch (_error) {
        return 0;
      }
    })();

    const primitiveQuery = [
      "fields game_id,value,popularity_type;",
      `where popularity_type = ${Math.floor(popularityType)};`,
      "sort value desc;",
      `limit ${primitiveLimit};`,
      `offset ${offset};`
    ].join(" ");
    const primitives = await igdbRequest("popularity_primitives", primitiveQuery);
    const primitiveRows = Array.isArray(primitives) ? primitives : [];
    const gameIds = primitiveRows
      .map((row) => Number(row?.game_id || 0))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!gameIds.length) {
      return { count: 0, results: [] };
    }

    const idList = dedupeNumbers(gameIds);
    const filters = [
      `id = (${idList.join(",")})`,
      "category = 0",
      "cover != null",
      "version_parent = null",
      "parent_game = null"
    ];
    if (Number.isFinite(minRatingCount) && minRatingCount > 0) {
      filters.push(`total_rating_count >= ${Math.floor(minRatingCount)}`);
    }
    if (Number.isFinite(minFollows) && minFollows > 0) {
      filters.push(`follows >= ${Math.floor(minFollows)}`);
    }

    const gameQuery = [
      "fields id,name,slug,summary,first_release_date,total_rating,total_rating_count,follows,category,version_parent,parent_game,cover.url,cover.image_id,screenshots.url,screenshots.image_id,genres.id,genres.name,genres.slug,platforms.name;",
      `where ${filters.join(" & ")};`,
      `limit ${idList.length};`
    ].join(" ");
    const games = await igdbRequest("games", gameQuery);
    const cleanedGames = dedupeIgdbGames(Array.isArray(games) ? games : []);

    const valueMap = new Map();
    const orderMap = new Map();
    primitiveRows.forEach((row, idx) => {
      const id = Number(row?.game_id || 0);
      if (!Number.isFinite(id) || id <= 0) return;
      if (!orderMap.has(id)) orderMap.set(id, idx);
      valueMap.set(id, Number(row?.value || 0));
    });

    let genreData = null;
    const hasNumericGenreRefs = cleanedGames.some((game) =>
      (Array.isArray(game?.genres) ? game.genres : []).some((genre) => Number.isFinite(Number(genre)))
    );
    if (hasNumericGenreRefs) {
      try {
        genreData = await ensureIgdbGenreCache();
      } catch (_genreError) {
        genreData = null;
      }
    }

    const mappedRows = cleanedGames.map((game) => {
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

      const coverImage = game?.cover?.image_id
        ? imageUrl(game.cover.image_id, IGDB_COVER_SIZE)
        : normalizeIgdbImageUrl(game?.cover?.url || "", IGDB_COVER_SIZE);
      const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
        .map((entry) => {
          if (entry && typeof entry === "object") {
            if (entry.image_id) return imageUrl(entry.image_id, IGDB_SCREENSHOT_SIZE);
            if (entry.url) return normalizeIgdbImageUrl(entry.url, IGDB_SCREENSHOT_SIZE);
          }
          if (typeof entry === "string") return normalizeIgdbImageUrl(entry, IGDB_SCREENSHOT_SIZE);
          return "";
        })
        .filter(Boolean)
        .slice(0, 12);
      const hero = screenshotRows[0] || coverImage || "";
      const rating = Number(game?.total_rating || 0);
      const ratingCount = Number(game?.total_rating_count || 0);
      const summary = String(game?.summary || "").trim();
      const popValue = Number(valueMap.get(Number(game?.id || 0)) || 0);

      return {
        id: Number(game?.id || 0),
        name: String(game?.name || "Game"),
        slug: String(game?.slug || ""),
        released: toReleaseDate(game?.first_release_date),
        summary,
        cover: coverImage,
        hero,
        screenshots: screenshotRows,
        background_image: hero || coverImage,
        short_screenshots: screenshotRows.map((image, index) => ({ id: index + 1, image })),
        rating: rating ? Number((rating / 20).toFixed(1)) : null,
        ratings_count: ratingCount || 0,
        follows: Number(game?.follows || 0),
        popularity_value: popValue,
        metacritic: null,
        genres: mappedGenres,
        platforms: (Array.isArray(game?.platforms) ? game.platforms : [])
          .map((platform) => {
            if (platform && typeof platform === "object") {
              const name = String(platform?.name || "").trim();
              return name ? { platform: { name } } : null;
            }
            const name = String(platform || "").trim();
            return name ? { platform: { name } } : null;
          })
          .filter(Boolean),
        source: "igdb"
      };
    });

    mappedRows.sort((a, b) => {
      const aOrder = orderMap.has(a.id) ? orderMap.get(a.id) : Number.POSITIVE_INFINITY;
      const bOrder = orderMap.has(b.id) ? orderMap.get(b.id) : Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (Number(b.popularity_value || 0) - Number(a.popularity_value || 0));
    });

    const timedCount = await withTimeout(countPromise, IGDB_COUNT_TIMEOUT_MS).catch(() => 0);
    const fallbackCount = offset + mappedRows.length + (mappedRows.length >= pageSize ? pageSize : 0);
    const payload = {
      count: timedCount || fallbackCount,
      results: mappedRows.slice(0, pageSize)
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
    "fields id,name,slug,summary,storyline,first_release_date,total_rating,total_rating_count,cover.url,cover.image_id,screenshots.url,screenshots.image_id,genres.id,genres.name,genres.slug,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,game_modes.name,multiplayer_modes,themes.name,videos.video_id;",
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

  const coverImage = game?.cover?.image_id
    ? imageUrl(game.cover.image_id, IGDB_COVER_SIZE)
    : normalizeIgdbImageUrl(game?.cover?.url || "", IGDB_COVER_SIZE);
  const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
    .map((entry) => {
      if (entry && typeof entry === "object") {
        if (entry.image_id) return imageUrl(entry.image_id, IGDB_HERO_SIZE);
        if (entry.url) return normalizeIgdbImageUrl(entry.url, IGDB_HERO_SIZE);
      }
      if (typeof entry === "string") return normalizeIgdbImageUrl(entry, IGDB_HERO_SIZE);
      return "";
    })
    .filter(Boolean)
    .slice(0, 16);
  const hero = screenshotRows[0] || coverImage;
  const rating = Number(game?.total_rating || 0);
  const ratingsCount = Number(game?.total_rating_count || 0);
  const descriptionRaw = String(game?.summary || game?.storyline || "").trim();
  const involvedCompanies = Array.isArray(game?.involved_companies) ? game.involved_companies : [];
  const developers = involvedCompanies
    .filter((entry) => entry?.developer && entry?.company?.name)
    .map((entry) => ({ name: String(entry.company.name || "").trim() }))
    .filter((entry) => entry.name);
  const publishers = involvedCompanies
    .filter((entry) => entry?.publisher && entry?.company?.name)
    .map((entry) => ({ name: String(entry.company.name || "").trim() }))
    .filter((entry) => entry.name);
  const gameModes = (Array.isArray(game?.game_modes) ? game.game_modes : [])
    .map((mode) => String(mode?.name || "").trim())
    .filter(Boolean);
  const themes = (Array.isArray(game?.themes) ? game.themes : [])
    .map((theme) => String(theme?.name || "").trim())
    .filter(Boolean);
  const videos = (Array.isArray(game?.videos) ? game.videos : [])
    .map((video) => String(video?.video_id || "").trim())
    .filter(Boolean);
  const youtubeUrl = videos.length ? `https://www.youtube.com/watch?v=${videos[0]}` : "";

  const payload = {
    id: Number(game?.id || 0),
    name: String(game?.name || "Game"),
    slug: String(game?.slug || ""),
    description_raw: descriptionRaw,
    description: descriptionRaw,
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
    metacritic: null,
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
    developers,
    publishers,
    stores: [],
    website: "",
    reddit_url: "",
    clip: null,
    youtube_url: youtubeUrl,
    extra: {
      game_modes: gameModes,
      themes,
      multiplayer_modes: Array.isArray(game?.multiplayer_modes) ? game.multiplayer_modes : [],
      videos: videos
    },
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

function mapWikipediaListRow(row) {
  if (!row || typeof row !== "object") return null;
  const wikiId = Number(row?.id || 0);
  if (!Number.isFinite(wikiId) || wikiId <= 0) return null;
  const screenshots = (Array.isArray(row?.screenshots) ? row.screenshots : [])
    .map((entry) => toHttpsUrl(entry || ""))
    .filter(Boolean);
  const cover = toHttpsUrl(row?.cover || row?.image || "");
  const hero = toHttpsUrl(row?.hero || row?.background_image || screenshots[0] || cover || "");
  const background = toHttpsUrl(row?.background_image || hero || cover || "");
  const normalizedScreens = mergeUniqueStrings([hero, cover], screenshots);
  return {
    id: encodeWikiId(wikiId),
    wiki_id: wikiId,
    name: String(row?.name || row?.title || "Game").trim() || "Game",
    slug: String(row?.slug || "").trim(),
    released: String(row?.released || row?.release_date || "").trim(),
    cover: cover || "",
    hero: hero || cover || "",
    screenshots: normalizedScreens,
    background_image: background || "",
    short_screenshots: normalizedScreens.map((image, index) => ({ id: index + 1, image })),
    rating: Number.isFinite(Number(row?.rating || NaN)) ? Number(row.rating) : null,
    ratings_count: Number(row?.ratings_count || row?.rating_count || 0),
    metacritic: Number.isFinite(Number(row?.metacritic || NaN)) ? Number(row.metacritic) : null,
    genres: Array.isArray(row?.genres) ? row.genres : [],
    platforms: Array.isArray(row?.platforms) ? row.platforms : [],
    website: String(row?.website || "").trim(),
    source: "wikipedia"
  };
}

async function fetchRawgGamesList({ page, pageSize, orderingRaw, search, dates, genres, minRatingCount = null }) {
  const json = await rawgRequest("/games", {
    page,
    page_size: pageSize,
    ordering: mapOrderingToRawg(orderingRaw),
    search,
    dates,
    genres
  });
  const rows = Array.isArray(json?.results) ? json.results : [];
  const results = rows
    .map(mapRawgListRow)
    .filter((row) => Number(row?.id) > 0)
    .filter((row) => {
      if (!Number.isFinite(minRatingCount) || minRatingCount <= 0) return true;
      return Number(row?.ratings_count || 0) >= minRatingCount;
    });
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
  const apiKey = getGameBrainApiKey();
  if (!apiKey) {
    const err = new Error("Missing GAMEBRAIN_API_KEY.");
    err.code = "GAMEBRAIN_DISABLED";
    throw err;
  }
  const url = new URL(`${GAMEBRAIN_API_BASE}${String(path || "").startsWith("/") ? path : `/${String(path || "")}`}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey
    },
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
    id: encodeGameBrainId(id),
    gamebrain_id: id,
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

function mapGameDetailToListRow(detail) {
  if (!detail || typeof detail !== "object") return null;
  const id = Number(detail?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    name: String(detail?.name || "Game").trim() || "Game",
    slug: String(detail?.slug || "").trim(),
    released: String(detail?.released || "").trim(),
    cover: toHttpsUrl(detail?.cover || ""),
    hero: toHttpsUrl(detail?.hero || detail?.background_image || detail?.cover || ""),
    screenshots: (Array.isArray(detail?.screenshots) ? detail.screenshots : []).map((entry) => toHttpsUrl(entry || "")).filter(Boolean),
    background_image: toHttpsUrl(detail?.background_image || detail?.hero || detail?.cover || ""),
    short_screenshots: (Array.isArray(detail?.short_screenshots) ? detail.short_screenshots : [])
      .map((entry, index) => ({
        id: Number(entry?.id || index + 1),
        image: toHttpsUrl(entry?.image || "")
      }))
      .filter((entry) => !!entry.image),
    rating: Number.isFinite(Number(detail?.rating || NaN)) ? Number(detail.rating) : null,
    ratings_count: Number(detail?.ratings_count || 0),
    follows: Number(detail?.follows || 0),
    metacritic: Number.isFinite(Number(detail?.metacritic || NaN)) ? Number(detail.metacritic) : null,
    genres: (Array.isArray(detail?.genres) ? detail.genres : []).map((genre) => ({
      id: Number(genre?.id || 0),
      name: String(genre?.name || "").trim(),
      slug: String(genre?.slug || "").trim().toLowerCase()
    })).filter((genre) => genre.id > 0 || !!genre.name),
    platforms: (Array.isArray(detail?.platforms) ? detail.platforms : [])
      .map((platform) => ({ platform: { name: String(platform?.platform?.name || "").trim() } }))
      .filter((platform) => !!platform.platform.name),
    source: String(detail?.source || "").trim() || "rawg"
  };
}

function mapWikipediaDetailToListRow(detail) {
  if (!detail || typeof detail !== "object") return null;
  const rawId = Number(detail?.id || 0);
  if (!Number.isFinite(rawId) || rawId <= 0) return null;
  const row = mapGameDetailToListRow(detail);
  if (!row) return null;
  return {
    ...row,
    id: encodeWikiId(rawId),
    wiki_id: rawId,
    source: "wikipedia"
  };
}

function normalizeWikipediaDetail(detail) {
  if (!detail || typeof detail !== "object") return null;
  const rawId = Number(detail?.id || 0);
  if (!Number.isFinite(rawId) || rawId <= 0) return null;
  return {
    ...detail,
    id: encodeWikiId(rawId),
    wiki_id: rawId,
    source: "wikipedia"
  };
}

function remapLegacyDetailId(detail, requestedId) {
  if (!detail || typeof detail !== "object") return null;
  const safeRequestedId = Number(requestedId);
  if (!Number.isFinite(safeRequestedId) || safeRequestedId <= 0) return detail;
  const fallbackRawgId = Number(detail?.rawg_id || decodeRawgId(detail?.id) || decodeRawgId(safeRequestedId) || 0);
  const normalized = {
    ...detail,
    id: safeRequestedId
  };
  if (Number.isFinite(fallbackRawgId) && fallbackRawgId > 0) {
    normalized.rawg_id = fallbackRawgId;
  }
  return normalized;
}

async function resolveLegacyGameDetailById(requestedId) {
  const safeRequestedId = Number(requestedId);
  if (!Number.isFinite(safeRequestedId) || safeRequestedId <= 0) return null;

  const wikiId = decodeWikiId(safeRequestedId);
  if (wikiId) {
    try {
      const detail = await fetchWikipediaGameDetailsById(wikiId);
      const mapped = mapWikipediaDetailToListRow(detail);
      if (mapped) return mapped;
    } catch (_error) {}
  }

  const rawgId = decodeRawgId(safeRequestedId);
  if (rawgId) {
    try {
      const detail = await fetchRawgGameDetails(rawgId);
      if (detail) return remapLegacyDetailId(detail, safeRequestedId);
    } catch (_error) {
      // Continue to next candidate provider.
    }
  }

  const gamebrainDecoded = decodeGameBrainId(safeRequestedId);
  if (gamebrainDecoded) {
    try {
      const game = await fetchGameBrainGameInfo(gamebrainDecoded);
      const mapped = mapGameBrainDetailRow(game, null);
      if (mapped) {
        return {
          ...mapped,
          id: encodeGameBrainId(gamebrainDecoded)
        };
      }
    } catch (_error) {
      // No-op. Fall through to null.
    }
  }

  if (hasIgdbCredentials() && safeRequestedId < GAMEBRAIN_ID_OFFSET) {
    try {
      const igdbDetail = await fetchIgdbGameDetails(safeRequestedId);
      if (igdbDetail) return igdbDetail;
    } catch (_error) {}
  }

  if (!hasIgdbCredentials()) {
    try {
      const fallbackDetail = await fetchRawgGameDetails(safeRequestedId);
      if (fallbackDetail) return remapLegacyDetailId(fallbackDetail, safeRequestedId);
    } catch (_error) {}
  }
  return null;
}

async function resolveLegacyListRowsByIds(ids = [], limit = 20) {
  const safeLimit = clampInt(limit, 1, 50, 20);
  const out = [];
  const seen = new Set();
  const candidates = dedupeNumbers(ids).slice(0, safeLimit);
  for (const requestedId of candidates) {
    const detail = await resolveLegacyGameDetailById(requestedId);
    if (!detail) continue;
    const row = mapGameDetailToListRow(detail);
    if (!row) continue;
    const key = `${row.id}:${String(row.name || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= safeLimit) break;
  }
  return out;
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
  const igdbEnabled = hasIgdbCredentials();
  const rawgEnabled = hasRawgKey();
  const gamebrainEnabled = hasGameBrainApiKey();
  const { clientId, clientSecret, staticAccessToken } = getIgdbCredentials();
  return res.json({
    ok: true,
    service: "igdb-proxy",
    configured: igdbEnabled,
    auth_mode: igdbEnabled ? "twitch" : "none",
    providers: {
      igdb: igdbEnabled,
      rawg: rawgEnabled,
      wikipedia: true,
      gamebrain: gamebrainEnabled
    },
    igdb_env: {
      client_id: !!clientId,
      client_secret: !!clientSecret,
      access_token: !!staticAccessToken
    },
    routes: ["/genres", "/games", "/games/:id", "/popularity-types", "/popularity-primitives"]
  });
});
app.get("/api/igdb/genres", async (req, res) => {
  setResponseCache(res, { maxAge: 21600, staleWhileRevalidate: 43200 });
  const providerSet = parseProviderList(req.query.provider || req.query.source || "");
  const igdbEnabled = hasIgdbCredentials();
  if (providerSet.has("igdb") && igdbEnabled) {
    try {
      const cache = await ensureIgdbGenreCache();
      const results = Array.from(cache.byId.values()).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug
      }));
      return res.json({
        count: results.length,
        source: "igdb",
        results
      });
    } catch (error) {
      console.warn("[igdb-handler] genres igdb failed:", String(error?.message || error));
    }
  }

  const wikiResults = WIKIPEDIA_GAME_GENRES.map((genre) => ({
    id: genre.id,
    name: genre.name,
    slug: genre.slug
  }));
  return res.json({
    count: wikiResults.length,
    source: "wikipedia",
    results: wikiResults
  });
});
app.get("/api/igdb/popularity-types", async (req, res) => {
  setResponseCache(res, { maxAge: 21600, staleWhileRevalidate: 43200 });
  if (!hasIgdbCredentials()) {
    return res.status(503).json({
      count: 0,
      source: "igdb",
      results: [],
      message: "IGDB credentials are not configured."
    });
  }
  try {
    const rawQuery = String(req.query.q || req.query.query || "").trim();
    const query = rawQuery || "fields id,name,popularity_source,updated_at; sort id asc; limit 50;";
    const rows = await igdbRequest("popularity_types", query);
    const results = Array.isArray(rows) ? rows : [];
    return res.json({
      count: results.length,
      source: "igdb",
      results
    });
  } catch (error) {
    console.warn("[igdb-handler] popularity types failed:", String(error?.message || error));
    return res.status(502).json({
      count: 0,
      source: "igdb",
      results: [],
      message: "IGDB request failed.",
      detail: String(error?.message || error || ""),
      code: String(error?.code || "")
    });
  }
});
app.get("/api/igdb/popularity-primitives", async (req, res) => {
  setResponseCache(res, { maxAge: 120, staleWhileRevalidate: 300 });
  if (!hasIgdbCredentials()) {
    return res.status(503).json({
      count: 0,
      source: "igdb",
      results: [],
      message: "IGDB credentials are not configured."
    });
  }
  try {
    const popularityType = clampInt(req.query.popularity_type, 0, 5000, 0);
    const limit = clampInt(req.query.limit, 1, 500, 50);
    const offset = clampInt(req.query.offset, 0, 1000000, 0);
    const rawQuery = String(req.query.q || req.query.query || "").trim();
    const query = rawQuery || [
      "fields game_id,value,popularity_type;",
      popularityType ? `where popularity_type = ${Math.floor(popularityType)};` : "",
      "sort value desc;",
      `limit ${limit};`,
      `offset ${offset};`
    ].filter(Boolean).join(" ");
    const rows = await igdbRequest("popularity_primitives", query);
    const results = Array.isArray(rows) ? rows : [];
    return res.json({
      count: results.length,
      source: "igdb",
      results
    });
  } catch (error) {
    console.warn("[igdb-handler] popularity primitives failed:", String(error?.message || error));
    return res.status(502).json({
      count: 0,
      source: "igdb",
      results: [],
      message: "IGDB request failed.",
      detail: String(error?.message || error || ""),
      code: String(error?.code || "")
    });
  }
});
app.get("/api/igdb/games", async (req, res) => {
  setResponseCache(res, { maxAge: 300, staleWhileRevalidate: 900 });
  const page = clampInt(req.query.page, 1, 100000, 1);
  const pageSize = clampInt(req.query.page_size, 1, 80, 20);
  const search = String(req.query.search || "").trim().slice(0, 120);
  const id = String(req.query.id || "").trim();
  const ids = String(req.query.ids || "").trim();
  const ordering = String(req.query.ordering || "-follows").trim();
  const popularityType = clampInt(req.query.popularity_type, 0, 5000, 0);
  const dates = String(req.query.dates || "").trim();
  const genres = String(req.query.genres || "").trim();
  const provider = String(req.query.provider || req.query.source || "").trim().toLowerCase();
  const titleOnly = isTruthyFlag(req.query.title_only || req.query.search_title_only || req.query.titleOnly);
  const spotlight = isTruthyFlag(req.query.spotlight || req.query.include_spotlight || req.query.includeSpotlight);
  let providerSet = parseProviderList(provider);
  if (isTruthyFlag(req.query.igdb_only) || isTruthyFlag(req.query.igdbOnly)) {
    providerSet = new Set(["igdb"]);
  }
  const minRatingCount = clampInt(req.query.min_rating_count, 0, 5_000_000, 0);
  const minFollows = clampInt(req.query.min_follows, 0, 50_000_000, 0);
  const explicitIds = dedupeNumbers([
    ...parseIdsQuery(id),
    ...parseIdsQuery(ids)
  ]);

  const igdbEnabled = hasIgdbCredentials();
  const rawgEnabled = hasRawgKey();
  const gamebrainEnabled = hasGameBrainApiKey();
  const wantsIgdb = providerSet.has("igdb");
  const wantsRawg = providerSet.has("rawg");
  const wantsWiki = providerSet.has("wikipedia");
  const wantsGameBrain = providerSet.has("gamebrain");
  const onlyOneProvider = providerSet.size === 1;

  if (onlyOneProvider && wantsIgdb && !igdbEnabled) {
    return res.status(503).json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      message: "IGDB credentials are not configured.",
      sources: { igdb: false, rawg: false, wikipedia: false, gamebrain: false }
    });
  }
  if (onlyOneProvider && wantsRawg && !rawgEnabled) {
    return res.status(503).json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      message: "RAWG API key is not configured.",
      sources: { igdb: false, rawg: false, wikipedia: false, gamebrain: false }
    });
  }
  if (onlyOneProvider && wantsGameBrain && !gamebrainEnabled) {
    return res.status(503).json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      message: "GAMEBRAIN API key is not configured.",
      sources: { igdb: false, rawg: false, wikipedia: false, gamebrain: false }
    });
  }

  try {
    const { startUnix, endUnix } = parseDatesRange(dates);
    const genreIds = await resolveGenreIds(genres);
    const effectiveMinRatingCount = search ? minRatingCount : (minRatingCount || 10);
    const whereClause = buildIgdbWhereClause({
      genreIds,
      startUnix,
      endUnix,
      minRatingCount: effectiveMinRatingCount,
      minFollows: minFollows || null
    });
    if (explicitIds.length) {
      const rows = await resolveLegacyListRowsByIds(explicitIds, Math.max(pageSize, explicitIds.length));
      return res.json({
        count: rows.length,
        page,
        page_size: pageSize,
        results: rows.slice(0, pageSize),
        sources: {
          igdb: igdbEnabled,
          rawg: rawgEnabled,
          wikipedia: true,
          gamebrain: gamebrainEnabled
        }
      });
    }

    const hasGenreFilter = !!String(genres || "").trim();
    const cacheSource = onlyOneProvider
      ? (wantsWiki ? "wikipedia" : wantsRawg ? "rawg" : wantsIgdb ? "igdb" : wantsGameBrain ? "gamebrain" : "")
      : "";
    const supabaseBlockedByPopularity = onlyOneProvider && wantsIgdb && popularityType > 0;
    const shouldUseSupabaseCache = !hasGenreFilter && !supabaseBlockedByPopularity;
    if (shouldUseSupabaseCache) {
      const cached = await fetchCachedGamesFromSupabase({ search, dates, ordering, page, pageSize, source: cacheSource });
      const cacheThreshold = search ? Math.min(pageSize, 6) : pageSize;
      if (cached && Array.isArray(cached.results) && cached.results.length >= cacheThreshold) {
        return res.json({
          count: Number(cached.count || cached.results.length),
          page,
          page_size: pageSize,
          results: cached.results.slice(0, pageSize),
          sources: {
            igdb: cacheSource === "igdb",
            rawg: cacheSource === "rawg",
            wikipedia: cacheSource === "wikipedia",
            gamebrain: cacheSource === "gamebrain",
            supabase: true
          }
        });
      }
    }

    if (onlyOneProvider && wantsIgdb) {
      let payload = null;
      if (popularityType && !search) {
        try {
          payload = await fetchIgdbGamesByPopscore({
            page,
            pageSize,
            popularityType,
            minRatingCount: effectiveMinRatingCount,
            minFollows: minFollows || 0
          });
        } catch (popError) {
          console.warn("[igdb-handler] popscore failed, falling back:", String(popError?.message || popError));
          payload = null;
        }
      }
      if (!payload) {
        payload = await fetchIgdbGamesList({
          page,
          pageSize,
          orderingRaw: ordering,
          search,
          whereClause
        });
      }
      let results = Array.isArray(payload?.results) ? payload.results : [];
      cacheGamesToSupabase(results).catch(() => {});
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results: results.slice(0, pageSize),
        sources: {
          igdb: true,
          rawg: false,
          wikipedia: false,
          gamebrain: false
        }
      });
    }

    if (onlyOneProvider && wantsRawg) {
      const payload = await fetchRawgGamesList({
        page,
        pageSize,
        orderingRaw: ordering,
        search,
        dates,
        genres,
        minRatingCount: effectiveMinRatingCount
      });
      const results = Array.isArray(payload?.results) ? payload.results : [];
      cacheGamesToSupabase(results).catch(() => {});
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results: results.slice(0, pageSize),
        sources: {
          igdb: false,
          rawg: true,
          wikipedia: false,
          gamebrain: false
        }
      });
    }

    if (onlyOneProvider && wantsWiki) {
      const payload = await fetchWikipediaGamesList({
        page,
        pageSize,
        search,
        ordering,
        dates,
        genres,
        titleOnly,
        spotlight
      });
      const results = (Array.isArray(payload?.results) ? payload.results : [])
        .map(mapWikipediaListRow)
        .filter(Boolean);
      cacheGamesToSupabase(results).catch(() => {});
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results: results.slice(0, pageSize),
        sources: {
          igdb: false,
          rawg: false,
          wikipedia: true,
          gamebrain: false
        }
      });
    }

    if (onlyOneProvider && wantsGameBrain) {
      const payload = await fetchGameBrainGamesList({ page, pageSize, search, id, ids });
      const results = Array.isArray(payload?.results) ? payload.results : [];
      cacheGamesToSupabase(results).catch(() => {});
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results: results.slice(0, pageSize),
        sources: {
          igdb: false,
          rawg: false,
          wikipedia: false,
          gamebrain: true
        }
      });
    }

    const aggregateTarget = clampInt(pageSize * Math.min(page, 3), pageSize, 120, pageSize * 2);
    const igdbLimit = Math.min(aggregateTarget, 50);
    const rawgLimit = Math.min(aggregateTarget, 40);
    const wikiLimit = Math.min(aggregateTarget, 50);
    const gamebrainLimit = Math.min(aggregateTarget, 50);

    const tasks = [];
    const counts = [];
    const allRows = [];
    const sourceFlags = {
      igdb: false,
      rawg: false,
      wikipedia: false,
      gamebrain: false
    };

    if (wantsIgdb && igdbEnabled) {
      tasks.push((async () => {
        let payload = null;
        if (popularityType && !search) {
          try {
            payload = await fetchIgdbGamesByPopscore({
              page: 1,
              pageSize: igdbLimit,
              popularityType,
              minRatingCount: effectiveMinRatingCount,
              minFollows: minFollows || 0
            });
          } catch (_error) {
            payload = null;
          }
        }
        if (!payload) {
          payload = await fetchIgdbGamesList({
            page: 1,
            pageSize: igdbLimit,
            orderingRaw: ordering,
            search,
            whereClause
          });
        }
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        sourceFlags.igdb = true;
        counts.push(Number(payload?.count || rows.length || 0));
        allRows.push(...rows);
      })());
    }

    if (wantsRawg && rawgEnabled) {
      tasks.push((async () => {
        const payload = await fetchRawgGamesList({
          page: 1,
          pageSize: rawgLimit,
          orderingRaw: ordering,
          search,
          dates,
          genres,
          minRatingCount: effectiveMinRatingCount
        });
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        sourceFlags.rawg = true;
        counts.push(Number(payload?.count || rows.length || 0));
        allRows.push(...rows);
      })());
    }

    if (wantsWiki) {
      tasks.push((async () => {
        const payload = await fetchWikipediaGamesList({
          page: 1,
          pageSize: wikiLimit,
          search,
          ordering,
          dates,
          genres,
          titleOnly,
          spotlight
        });
        const rows = (Array.isArray(payload?.results) ? payload.results : [])
          .map(mapWikipediaListRow)
          .filter(Boolean);
        sourceFlags.wikipedia = true;
        counts.push(Number(payload?.count || rows.length || 0));
        allRows.push(...rows);
      })());
    }

    if (wantsGameBrain && gamebrainEnabled) {
      tasks.push((async () => {
        const payload = await fetchGameBrainGamesList({ page: 1, pageSize: gamebrainLimit, search, id, ids });
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        sourceFlags.gamebrain = true;
        counts.push(Number(payload?.count || rows.length || 0));
        allRows.push(...rows);
      })());
    }

    await Promise.allSettled(tasks);

    const merged = mergeGameRows(allRows, search);
    const offset = Math.max(0, (page - 1) * pageSize);
    const paged = merged.slice(offset, offset + pageSize);
    const fallbackCount = offset + merged.length + (merged.length >= pageSize ? pageSize : 0);
    const count = Math.max(...counts, fallbackCount, paged.length);

    cacheGamesToSupabase(paged).catch(() => {});
    return res.json({
      count,
      page,
      page_size: pageSize,
      results: paged,
      sources: sourceFlags
    });
  } catch (error) {
    console.warn("[igdb-handler] igdb games failed:", String(error?.message || error));
    return res.status(502).json({
      count: 0,
      page,
      page_size: pageSize,
      results: [],
      message: "IGDB request failed.",
      detail: String(error?.message || error || ""),
      code: String(error?.code || ""),
      sources: { igdb: false, rawg: false, wikipedia: false, gamebrain: false }
    });
  }
});
app.get("/api/igdb/games/:id", async (req, res) => {
  setResponseCache(res, { maxAge: 600, staleWhileRevalidate: 1800 });
  const requestedId = Number(req.params.id);
  if (!Number.isFinite(requestedId) || requestedId <= 0) {
    return res.status(400).json({ message: "Invalid game id." });
  }
  const provider = String(req.query.provider || req.query.source || "").trim().toLowerCase();
  let providerSet = parseProviderList(provider);
  if (isTruthyFlag(req.query.igdb_only) || isTruthyFlag(req.query.igdbOnly)) {
    providerSet = new Set(["igdb"]);
  }
  const igdbEnabled = hasIgdbCredentials();
  const rawgEnabled = hasRawgKey();
  const gamebrainEnabled = hasGameBrainApiKey();
  const wantsIgdb = providerSet.has("igdb");
  const wantsRawg = providerSet.has("rawg");
  const wantsWiki = providerSet.has("wikipedia");
  const wantsGameBrain = providerSet.has("gamebrain");

  if (providerSet.size === 1 && wantsIgdb && !igdbEnabled) {
    return res.status(503).json({ message: "IGDB credentials are not configured." });
  }
  if (providerSet.size === 1 && wantsRawg && !rawgEnabled) {
    return res.status(503).json({ message: "RAWG API key is not configured." });
  }
  if (providerSet.size === 1 && wantsGameBrain && !gamebrainEnabled) {
    return res.status(503).json({ message: "GAMEBRAIN API key is not configured." });
  }

  const wikiId = decodeWikiId(requestedId);
  const rawgId = decodeRawgId(requestedId);
  const gamebrainId = decodeGameBrainId(requestedId);

  if (rawgId && wantsRawg && rawgEnabled) {
    try {
      const detail = await fetchRawgGameDetails(rawgId);
      if (detail) {
        cacheGamesToSupabase([detail]).catch(() => {});
        return res.json(detail);
      }
    } catch (_error) {}
  }

  if (wikiId && wantsWiki) {
    try {
      const detail = await fetchWikipediaGameDetailsById(wikiId);
      const normalized = normalizeWikipediaDetail(detail);
      if (normalized) {
        cacheGamesToSupabase([normalized]).catch(() => {});
        return res.json(normalized);
      }
    } catch (_error) {}
  }

  if (gamebrainId && wantsGameBrain && gamebrainEnabled) {
    try {
      const game = await fetchGameBrainGameInfo(gamebrainId);
      const mapped = mapGameBrainDetailRow(game, null);
      if (mapped) {
        cacheGamesToSupabase([mapped]).catch(() => {});
        return res.json(mapped);
      }
    } catch (_error) {}
  }

  if (wantsIgdb && igdbEnabled) {
    try {
      const igdbDetail = await fetchIgdbGameDetails(requestedId);
      if (igdbDetail) {
        cacheGamesToSupabase([igdbDetail]).catch(() => {});
        return res.json(igdbDetail);
      }
    } catch (error) {
      console.warn("[igdb-handler] igdb detail failed:", String(error?.message || error));
    }
  }

  if (wantsRawg && rawgEnabled) {
    try {
      const detail = await fetchRawgGameDetails(requestedId);
      if (detail) {
        cacheGamesToSupabase([detail]).catch(() => {});
        return res.json(detail);
      }
    } catch (_error) {}
  }

  if (wantsWiki) {
    try {
      const detail = await fetchWikipediaGameDetailsById(requestedId);
      const normalized = normalizeWikipediaDetail(detail);
      if (normalized) {
        cacheGamesToSupabase([normalized]).catch(() => {});
        return res.json(normalized);
      }
    } catch (_error) {}
  }

  if (wantsGameBrain && gamebrainEnabled) {
    try {
      const game = await fetchGameBrainGameInfo(requestedId);
      const mapped = mapGameBrainDetailRow(game, null);
      if (mapped) {
        cacheGamesToSupabase([mapped]).catch(() => {});
        return res.json(mapped);
      }
    } catch (_error) {}
  }

  return res.status(404).json({ message: "Game not found." });
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
    page_size: clampInt(req.query?.page_size, 1, 80, 20),
    results: [],
    sources: {
      igdb: false,
      rawg: false,
      wikipedia: false,
      gamebrain: false
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
        wikipedia: false
      }
    });
  }
}
