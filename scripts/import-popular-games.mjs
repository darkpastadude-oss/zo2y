import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: "backend/.env", override: true });

const ENV_FILE_VALUES = readEnvFile("backend/.env");

const RAWG_ID_OFFSET = 9_000_000_000_000;
const WIKIPEDIA_ID_OFFSET = 8_000_000_000_000;
const GAMEBRAIN_ID_OFFSET = 7_000_000_000_000;
const RAWG_API_BASE = "https://api.rawg.io/api";
const RAWG_BACKUP_KEY = "83b2a55ac54c4c1db7099212e740f680";

const DEFAULT_BASE_URL = normalizeBaseUrl(
  process.env.IMPORT_SOURCE_BASE_URL ||
  process.env.APP_BASE_URL ||
  process.env.BASE_URL ||
  "https://www.zo2y.com"
);
const DEFAULT_LIMIT = 300;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ORDERING = "-rating";
const DEFAULT_DATES = "1990-01-01,2035-12-31";
const DEFAULT_MAX_PAGES = 40;
const DEFAULT_DETAIL_CONCURRENCY = 6;
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_RAWG_PAGE_SIZE = 40;
const DEFAULT_RAWG_MAX_PAGES = 80;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    if (!token.startsWith("--")) continue;
    const withoutPrefix = token.slice(2);
    if (!withoutPrefix) continue;

    const eqIndex = withoutPrefix.indexOf("=");
    if (eqIndex >= 0) {
      const key = withoutPrefix.slice(0, eqIndex);
      const value = withoutPrefix.slice(eqIndex + 1);
      parsed[key] = value;
      continue;
    }

    const next = String(argv[i + 1] || "");
    if (next && !next.startsWith("--")) {
      parsed[withoutPrefix] = next;
      i += 1;
    } else {
      parsed[withoutPrefix] = "true";
    }
  }
  return parsed;
}

function printHelp() {
  console.log(
    [
      "Bulk import popular games into Supabase (public.games).",
      "",
      "Usage:",
      "  node scripts/import-popular-games.mjs [options]",
      "",
      "Options:",
      "  --base-url <url>            Source API base URL (default: https://www.zo2y.com)",
      "  --limit <n>                 Number of games to import (default: 300)",
      "  --page-size <n>             Items per source page, max 50 (default: 50)",
      "  --max-pages <n>             Max pages to scan (default: 40)",
      "  --ordering <value>          Source ordering (default: -rating)",
      "  --dates <start,end>         Date range filter (default: 1990-01-01,2035-12-31)",
      "  --genres <csv>              Optional genre ids/slugs/names",
      "  --search <text>             Optional search text",
      "  --with-details <bool>       Enrich each game via /api/igdb/games/:id (default: true)",
      "  --detail-concurrency <n>    Parallel detail requests (default: 6)",
      "  --batch-size <n>            Supabase upsert batch size (default: 200)",
      "  --rawg-key <key>            Optional RAWG API key (fallback source)",
      "  --rawg-page-size <n>        RAWG page size, max 40 (default: 40)",
      "  --rawg-max-pages <n>        RAWG max pages to scan (default: 80)",
      "  --dry-run <bool>            Fetch/map only, do not write (default: false)",
      "  --help                      Show help",
      "",
      "Env required for write mode:",
      "  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
      "",
      "Examples:",
      "  node scripts/import-popular-games.mjs --limit=500",
      "  node scripts/import-popular-games.mjs --limit=800 --with-details=false",
      "  node scripts/import-popular-games.mjs --dry-run=true --limit=50"
    ].join("\n")
  );
}

function readEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  try {
    const text = fs.readFileSync(filepath, "utf8");
    const out = {};
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) return;
      const key = trimmed.slice(0, separator).trim();
      if (!key) return;
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    });
    return out;
  } catch (_error) {
    return {};
  }
}

function toNumberOrNull(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toPositiveIntOrNull(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function toHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toIsoDateOrNull(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{4})(?:-(\d{2})-(\d{2}))?/);
  if (!match) return null;
  if (match[2] && match[3]) {
    const parsed = Date.parse(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    if (!Number.isFinite(parsed)) return null;
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return `${match[1]}-01-01`;
}

function normalizeSource(value) {
  const source = String(value || "").trim().toLowerCase();
  if (source === "rawg") return "rawg";
  if (source === "wikipedia") return "wikipedia";
  if (source === "gamebrain") return "gamebrain";
  return "igdb";
}

function decodeRawgId(value) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= RAWG_ID_OFFSET) return null;
  const decoded = id - RAWG_ID_OFFSET;
  return Number.isFinite(decoded) && decoded > 0 ? Math.floor(decoded) : null;
}

function resolveRawgApiKey(options = {}) {
  return String(
    options.rawgKey ||
    process.env.RAWG_API_KEY ||
    process.env.RAWG_KEY ||
    ENV_FILE_VALUES.RAWG_API_KEY ||
    ENV_FILE_VALUES.RAWG_KEY ||
    RAWG_BACKUP_KEY ||
    ""
  ).trim();
}

function mapOrderingToRawg(orderingRaw) {
  const ordering = String(orderingRaw || "").trim().toLowerCase();
  if (ordering === "-released") return "-released";
  if (ordering === "-rating") return "-rating";
  if (ordering === "-metacritic") return "-metacritic";
  if (ordering === "-name") return "name";
  if (ordering === "released") return "released";
  if (ordering === "rating") return "rating";
  if (ordering === "name") return "name";
  return "-added";
}

function toRawgGenresParam(genresRaw) {
  return String(genresRaw || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .filter((token) => !/^\d+$/.test(token))
    .join(",");
}

function normalizeGenres(input) {
  const rows = Array.isArray(input) ? input : [];
  const out = [];
  const seen = new Set();
  rows.forEach((row) => {
    const name = String(row?.name || "").trim();
    if (!name) return;
    const slug = String(row?.slug || name).trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    out.push({
      id: toPositiveIntOrNull(row?.id),
      name,
      slug
    });
  });
  return out.slice(0, 10);
}

function normalizePlatforms(input) {
  const rows = Array.isArray(input) ? input : [];
  const out = [];
  const seen = new Set();
  rows.forEach((row) => {
    const name = String(row?.platform?.name || row?.name || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(name);
  });
  return out.slice(0, 12);
}

function normalizeScreenshots(row) {
  const out = [];
  const seen = new Set();
  const candidates = [
    ...(Array.isArray(row?.screenshots) ? row.screenshots : []),
    ...(Array.isArray(row?.short_screenshots) ? row.short_screenshots.map((entry) => entry?.image) : [])
  ];
  candidates.forEach((value) => {
    const url = toHttpsUrl(value);
    if (!url) return;
    if (seen.has(url)) return;
    seen.add(url);
    out.push(url);
  });
  return out.slice(0, 16);
}

function compactObject(input) {
  const out = {};
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    out[key] = value;
  });
  return out;
}

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function mergeCandidate(base, next) {
  if (!base) return next;
  const merged = { ...base };
  const assignIfPresent = (key) => {
    if (!isBlank(next[key])) merged[key] = next[key];
  };
  [
    "slug",
    "title",
    "description",
    "coverUrl",
    "heroUrl",
    "releaseDate"
  ].forEach(assignIfPresent);

  if (Number.isFinite(Number(next.rating))) merged.rating = Number(next.rating);
  if (Number.isFinite(Number(next.ratingCount))) merged.ratingCount = Math.floor(Number(next.ratingCount));
  if (Number.isFinite(Number(next.igdbId)) && Number(next.igdbId) > 0) merged.igdbId = Number(next.igdbId);
  if (Number.isFinite(Number(next.rawgId)) && Number(next.rawgId) > 0) merged.rawgId = Number(next.rawgId);

  if (Array.isArray(next.genres) && next.genres.length) merged.genres = next.genres;
  if (Array.isArray(next.platforms) && next.platforms.length) merged.platforms = next.platforms;
  if (Array.isArray(next.screenshots) && next.screenshots.length) merged.screenshots = next.screenshots;

  const nextExtra = next.extra && typeof next.extra === "object" ? next.extra : {};
  const baseExtra = merged.extra && typeof merged.extra === "object" ? merged.extra : {};
  merged.extra = { ...baseExtra, ...nextExtra };

  return merged;
}

function mapProviderRowToCandidate(row) {
  const source = normalizeSource(row?.source);
  const sourceItemId = toPositiveIntOrNull(row?.id);
  if (!sourceItemId) return null;

  let canonicalId = sourceItemId;
  let igdbId = null;
  let rawgId = toPositiveIntOrNull(row?.rawg_id);

  if (source === "rawg") {
    rawgId = rawgId || decodeRawgId(sourceItemId);
    if (rawgId) canonicalId = RAWG_ID_OFFSET + rawgId;
  } else if (source === "wikipedia") {
    canonicalId = WIKIPEDIA_ID_OFFSET + sourceItemId;
  } else if (source === "gamebrain") {
    canonicalId = GAMEBRAIN_ID_OFFSET + sourceItemId;
  } else {
    igdbId = toPositiveIntOrNull(row?.igdb_id) || sourceItemId;
  }

  const title = String(row?.name || row?.title || "").trim();
  if (!title) return null;

  const releaseDate = toIsoDateOrNull(row?.released || row?.release_date);
  const rating = toNumberOrNull(row?.rating);
  const ratingCount = toPositiveIntOrNull(row?.ratings_count || row?.rating_count) || 0;
  const coverUrl = toHttpsUrl(row?.cover || row?.cover_url || "");
  const heroUrl = toHttpsUrl(row?.hero || row?.background_image || row?.hero_url || coverUrl);
  const genres = normalizeGenres(row?.genres);
  const platforms = normalizePlatforms(row?.platforms);
  const screenshots = normalizeScreenshots(row);
  const description = String(row?.description_raw || row?.description || "").trim();

  return {
    canonicalId,
    sourceItemId,
    detailLookupId: sourceItemId,
    source,
    igdbId,
    rawgId,
    slug: String(row?.slug || "").trim() || undefined,
    title,
    description: description || undefined,
    coverUrl: coverUrl || undefined,
    heroUrl: heroUrl || undefined,
    releaseDate: releaseDate || undefined,
    rating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : undefined,
    ratingCount,
    genres,
    platforms,
    screenshots,
    extra: compactObject({
      imported_from: "api/igdb",
      metacritic: toNumberOrNull(row?.metacritic),
      source_item_id: sourceItemId
    })
  };
}

function mapRawgRowToCandidate(row) {
  const rawgId = toPositiveIntOrNull(row?.id);
  if (!rawgId) return null;
  const title = String(row?.name || row?.title || "").trim();
  if (!title) return null;

  const shortScreenshots = Array.isArray(row?.short_screenshots)
    ? row.short_screenshots.map((entry) => entry?.image)
    : [];
  const screenshots = normalizeScreenshots({ short_screenshots: shortScreenshots });
  const coverUrl = toHttpsUrl(
    row?.cover ||
    row?.cover_url ||
    row?.background_image ||
    row?.background_image_additional ||
    screenshots[0] ||
    ""
  );
  const heroUrl = toHttpsUrl(
    row?.hero ||
    row?.hero_url ||
    row?.background_image_additional ||
    row?.background_image ||
    screenshots[0] ||
    coverUrl
  );
  const releaseDate = toIsoDateOrNull(row?.released || row?.release_date);
  const rating = toNumberOrNull(row?.rating);
  const ratingCount = toPositiveIntOrNull(row?.ratings_count || row?.rating_count) || 0;
  const genres = normalizeGenres(row?.genres);
  const platforms = normalizePlatforms(row?.platforms);

  return {
    canonicalId: RAWG_ID_OFFSET + rawgId,
    sourceItemId: rawgId,
    detailLookupId: null,
    source: "rawg",
    igdbId: null,
    rawgId,
    slug: String(row?.slug || "").trim() || undefined,
    title,
    description: stripHtml(row?.description_raw || row?.description || "") || undefined,
    coverUrl: coverUrl || undefined,
    heroUrl: heroUrl || undefined,
    releaseDate: releaseDate || undefined,
    rating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : undefined,
    ratingCount,
    genres,
    platforms,
    screenshots,
    extra: compactObject({
      imported_from: "rawg/api",
      metacritic: toNumberOrNull(row?.metacritic),
      source_item_id: rawgId
    })
  };
}

async function fetchJson(url, { timeoutMs = 12000, retries = 2 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const err = new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 240)}`);
        err.status = response.status;
        if (response.status < 500 && response.status !== 429) throw err;
        lastError = err;
      } else {
        return await response.json();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError || new Error(`Request failed for ${url}`);
}

function buildGamesListUrl(baseUrl, options, page) {
  const url = new URL("/api/igdb/games", `${baseUrl}/`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(options.pageSize));
  if (options.ordering) url.searchParams.set("ordering", options.ordering);
  if (options.dates) url.searchParams.set("dates", options.dates);
  if (options.genres) url.searchParams.set("genres", options.genres);
  if (options.search) url.searchParams.set("search", options.search);
  return url.toString();
}

function buildGameDetailUrl(baseUrl, detailLookupId) {
  const encodedId = encodeURIComponent(String(detailLookupId));
  return new URL(`/api/igdb/games/${encodedId}`, `${baseUrl}/`).toString();
}

function buildRawgListUrl(options, page) {
  const rawgKey = resolveRawgApiKey(options);
  if (!rawgKey) return "";
  const url = new URL(`${RAWG_API_BASE}/games`);
  url.searchParams.set("key", rawgKey);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(options.rawgPageSize || DEFAULT_RAWG_PAGE_SIZE));
  url.searchParams.set("ordering", mapOrderingToRawg(options.ordering));
  if (options.search) url.searchParams.set("search", options.search);
  if (options.dates) url.searchParams.set("dates", options.dates);
  const rawgGenres = toRawgGenresParam(options.genres);
  if (rawgGenres) url.searchParams.set("genres", rawgGenres);
  return url.toString();
}

function chunkArray(values, size) {
  const out = [];
  const safeSize = Math.max(1, Number(size) || 1);
  for (let i = 0; i < values.length; i += safeSize) {
    out.push(values.slice(i, i + safeSize));
  }
  return out;
}

async function collectPopularCandidates(baseUrl, options) {
  const byId = new Map();
  let page = 1;
  let pagesFetched = 0;
  let exhausted = false;

  while (byId.size < options.limit && page <= options.maxPages) {
    const url = buildGamesListUrl(baseUrl, options, page);
    const payload = await fetchJson(url, { timeoutMs: 15000, retries: 2 });
    pagesFetched += 1;

    const rows = Array.isArray(payload?.results) ? payload.results : [];
    if (!rows.length) {
      exhausted = true;
      break;
    }

    rows.forEach((row) => {
      const mapped = mapProviderRowToCandidate(row);
      if (!mapped) return;
      const existing = byId.get(mapped.canonicalId);
      byId.set(mapped.canonicalId, mergeCandidate(existing, mapped));
    });

    if (rows.length < options.pageSize) {
      exhausted = true;
      break;
    }
    page += 1;
  }

  return {
    candidates: [...byId.values()].slice(0, options.limit),
    pagesFetched,
    exhausted
  };
}

async function collectRawgCandidates(options, seedCandidates = []) {
  const rawgKey = resolveRawgApiKey(options);
  if (!rawgKey) {
    return {
      candidates: [...seedCandidates],
      pagesFetched: 0,
      exhausted: true,
      added: 0
    };
  }

  const byId = new Map();
  (seedCandidates || []).forEach((candidate) => {
    if (!candidate?.canonicalId) return;
    byId.set(candidate.canonicalId, candidate);
  });

  let page = 1;
  let pagesFetched = 0;
  let exhausted = false;
  const maxPages = Math.max(1, Number(options.rawgMaxPages || DEFAULT_RAWG_MAX_PAGES));

  while (byId.size < options.limit && page <= maxPages) {
    const url = buildRawgListUrl(options, page);
    if (!url) break;
    let payload = null;
    try {
      payload = await fetchJson(url, { timeoutMs: 15000, retries: 2 });
    } catch (_error) {
      break;
    }
    pagesFetched += 1;

    const rows = Array.isArray(payload?.results) ? payload.results : [];
    if (!rows.length) {
      exhausted = true;
      break;
    }

    rows.forEach((row) => {
      const mapped = mapRawgRowToCandidate(row);
      if (!mapped) return;
      const existing = byId.get(mapped.canonicalId);
      byId.set(mapped.canonicalId, mergeCandidate(existing, mapped));
    });

    const hasNext = !!payload?.next;
    if (!hasNext || rows.length < Number(options.rawgPageSize || DEFAULT_RAWG_PAGE_SIZE)) {
      exhausted = true;
      break;
    }
    page += 1;
  }

  const candidates = [...byId.values()].slice(0, options.limit);
  return {
    candidates,
    pagesFetched,
    exhausted,
    added: Math.max(0, candidates.length - (seedCandidates || []).length)
  };
}

async function enrichCandidatesWithDetails(baseUrl, candidates, options) {
  if (!options.withDetails || !candidates.length) {
    return { total: 0, success: 0, failed: 0 };
  }

  const targets = candidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => !!candidate?.detailLookupId);
  if (!targets.length) {
    return { total: 0, success: 0, failed: 0 };
  }

  let cursor = 0;
  let success = 0;
  let failed = 0;
  const total = targets.length;

  const workerCount = Math.max(1, Math.min(options.detailConcurrency, 12));
  const workers = Array.from({ length: workerCount }).map(async () => {
    while (true) {
      const targetIndex = cursor;
      cursor += 1;
      if (targetIndex >= targets.length) return;
      const target = targets[targetIndex];
      const candidate = target.candidate;

      const detailUrl = buildGameDetailUrl(baseUrl, candidate.detailLookupId);
      try {
        const detailPayload = await fetchJson(detailUrl, { timeoutMs: 14000, retries: 1 });
        const mapped = mapProviderRowToCandidate(detailPayload);
        if (!mapped) {
          failed += 1;
          continue;
        }
        candidates[target.index] = mergeCandidate(candidate, mapped);
        success += 1;
      } catch (_error) {
        failed += 1;
      }
    }
  });

  await Promise.all(workers);
  return { total, success, failed };
}

function toDbRow(candidate) {
  const extra = compactObject({
    ...(candidate.extra || {}),
    genres: candidate.genres || [],
    platforms: candidate.platforms || [],
    screenshots: candidate.screenshots || []
  });

  return compactObject({
    id: candidate.canonicalId,
    source: candidate.source,
    igdb_id: candidate.igdbId,
    rawg_id: candidate.rawgId,
    slug: candidate.slug,
    title: candidate.title,
    description: candidate.description,
    cover_url: candidate.coverUrl,
    hero_url: candidate.heroUrl,
    release_date: candidate.releaseDate,
    rating: Number.isFinite(Number(candidate.rating)) ? Number(candidate.rating) : undefined,
    rating_count: Number.isFinite(Number(candidate.ratingCount)) ? Number(candidate.ratingCount) : undefined,
    extra
  });
}

async function upsertRows(supabase, rows, batchSize) {
  let processed = 0;
  const chunks = chunkArray(rows, batchSize);
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const { error } = await supabase
      .from("games")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      throw new Error(`Supabase upsert failed on batch ${i + 1}/${chunks.length}: ${error.message}`);
    }
    processed += chunk.length;
    console.log(`Upserted batch ${i + 1}/${chunks.length} (${chunk.length} rows)`);
  }
  return processed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const options = {
    baseUrl: normalizeBaseUrl(args["base-url"] || DEFAULT_BASE_URL),
    limit: clampInt(args.limit, 1, 5000, DEFAULT_LIMIT),
    pageSize: clampInt(args["page-size"], 1, 50, DEFAULT_PAGE_SIZE),
    maxPages: clampInt(args["max-pages"], 1, 500, DEFAULT_MAX_PAGES),
    ordering: String(args.ordering || DEFAULT_ORDERING).trim(),
    dates: String(args.dates || DEFAULT_DATES).trim(),
    genres: String(args.genres || "").trim(),
    search: String(args.search || "").trim(),
    withDetails: parseBoolean(args["with-details"], true),
    detailConcurrency: clampInt(args["detail-concurrency"], 1, 12, DEFAULT_DETAIL_CONCURRENCY),
    batchSize: clampInt(args["batch-size"], 10, 500, DEFAULT_BATCH_SIZE),
    rawgKey: String(args["rawg-key"] || "").trim(),
    rawgPageSize: clampInt(args["rawg-page-size"], 1, 40, DEFAULT_RAWG_PAGE_SIZE),
    rawgMaxPages: clampInt(args["rawg-max-pages"], 1, 500, DEFAULT_RAWG_MAX_PAGES),
    dryRun: parseBoolean(args["dry-run"], false)
  };

  if (!options.baseUrl) {
    throw new Error("Missing --base-url and no default source URL could be resolved.");
  }

  console.log(`Source API: ${options.baseUrl}`);
  console.log(`Target limit: ${options.limit}`);
  console.log(`Details enrichment: ${options.withDetails ? "on" : "off"}`);

  let { candidates, pagesFetched, exhausted } = await collectPopularCandidates(options.baseUrl, options);
  if (!candidates.length) {
    console.log("No source API candidates found from /api/igdb/games.");
  }

  console.log(`Fetched ${pagesFetched} pages and collected ${candidates.length} unique games.`);
  if (exhausted) console.log("Source exhausted before hitting requested limit.");

  if (candidates.length < options.limit) {
    const rawgSupplement = await collectRawgCandidates(options, candidates);
    candidates = rawgSupplement.candidates;
    if (rawgSupplement.pagesFetched > 0) {
      console.log(
        `RAWG supplement fetched ${rawgSupplement.pagesFetched} pages and added ${rawgSupplement.added} games.`
      );
    }
    if (rawgSupplement.exhausted && candidates.length < options.limit) {
      console.log("RAWG source exhausted before hitting requested limit.");
    }
  }

  if (!candidates.length) {
    console.log("No candidates found. Nothing to import.");
    return;
  }

  const detailStats = await enrichCandidatesWithDetails(options.baseUrl, candidates, options);
  if (options.withDetails) {
    console.log(
      `Details fetched: ${detailStats.success}/${detailStats.total} success, ${detailStats.failed} failed.`
    );
  }

  const rows = candidates.map(toDbRow).filter((row) => Number.isFinite(Number(row?.id)) && !!String(row?.title || "").trim());
  if (!rows.length) {
    console.log("No valid mapped rows after normalization.");
    return;
  }

  if (options.dryRun) {
    console.log(`Dry run complete. ${rows.length} rows mapped.`);
    console.log("Sample rows:");
    rows.slice(0, 3).forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.id} | ${row.title} | ${row.source} | ${row.release_date || "n/a"}`
      );
    });
    return;
  }

  const supabaseUrl = String(
    process.env.SUPABASE_URL ||
    ENV_FILE_VALUES.SUPABASE_URL ||
    ""
  ).trim();
  const supabaseServiceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ENV_FILE_VALUES.SUPABASE_SERVICE_ROLE_KEY ||
    ENV_FILE_VALUES.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for write mode.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const upserted = await upsertRows(supabase, rows, options.batchSize);
  console.log(`Import complete. Upserted ${upserted} rows into public.games.`);
}

main().catch((error) => {
  console.error(`Import failed: ${error.message || error}`);
  process.exit(1);
});
