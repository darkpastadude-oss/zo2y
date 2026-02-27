const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_REST_BASE = "https://en.wikipedia.org/api/rest_v1";
const WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
const WIKI_REQUEST_TIMEOUT_MS = 7000;
const WIKIDATA_VIDEO_GAME_QID = "Q7889";
const WIKI_SUMMARY_TTL_MS = 1000 * 60 * 30;
const WIKI_LIST_TTL_MS = 1000 * 60 * 4;
const WIKI_DETAIL_TTL_MS = 1000 * 60 * 30;
const WIKI_ENTITY_TTL_MS = 1000 * 60 * 60;
const MAX_CACHE_ENTRIES = 500;

export const WIKIPEDIA_GAME_GENRES = [
  { id: 1, name: "Action", slug: "action" },
  { id: 2, name: "Action-adventure", slug: "action-adventure" },
  { id: 3, name: "Adventure", slug: "adventure" },
  { id: 4, name: "Role-playing", slug: "role-playing" },
  { id: 5, name: "Strategy", slug: "strategy" },
  { id: 6, name: "Simulation", slug: "simulation" },
  { id: 7, name: "Sports", slug: "sports" },
  { id: 8, name: "Racing", slug: "racing" },
  { id: 9, name: "Fighting", slug: "fighting" },
  { id: 10, name: "Shooter", slug: "shooter" },
  { id: 11, name: "Platformer", slug: "platformer" },
  { id: 12, name: "Puzzle", slug: "puzzle" },
  { id: 13, name: "Horror", slug: "horror" },
  { id: 14, name: "Stealth", slug: "stealth" },
  { id: 15, name: "Survival", slug: "survival" },
  { id: 16, name: "Sandbox", slug: "sandbox" },
  { id: 17, name: "MMO", slug: "mmo" },
  { id: 18, name: "Indie", slug: "indie" }
];

const summaryCache = new Map();
const listCache = new Map();
const detailCache = new Map();
const entityCache = new Map();

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function chunkArray(values = [], size = 40) {
  const out = [];
  const list = Array.isArray(values) ? values : [];
  for (let i = 0; i < list.length; i += Math.max(1, Number(size) || 40)) {
    out.push(list.slice(i, i + Math.max(1, Number(size) || 40)));
  }
  return out;
}

function normalizeGameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeTitle(value) {
  return String(value || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function encodeTitle(value) {
  return encodeURIComponent(normalizeTitle(value).replace(/\s+/g, "_"));
}

function isExcludedTitle(value) {
  const title = String(value || "").trim().toLowerCase();
  if (!title) return true;
  if (title.startsWith("list of ")) return true;
  return (
    title.includes("(film)") ||
    title.includes("(novel)") ||
    title.includes("(book)") ||
    title.includes("(disambiguation)") ||
    title.includes("(album)") ||
    title.includes("(song)")
  );
}

function toHttpsUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("//")) return `https:${text}`;
  if (/^http:\/\//i.test(text)) return text.replace(/^http:\/\//i, "https://");
  return text;
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

function writeTimedCache(cache, key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + Math.max(1, Number(ttlMs) || 1) });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

function parseDateToUnix(dateText, endOfDay = false) {
  const text = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const ms = Date.parse(`${text}T${endOfDay ? "23:59:59" : "00:00:00"}Z`);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

function parseDatesRange(datesRaw) {
  const raw = String(datesRaw || "").trim();
  if (!raw.includes(",")) return { startUnix: null, endUnix: null };
  const [startText, endText] = raw.split(",", 2);
  return {
    startUnix: parseDateToUnix(startText, false),
    endUnix: parseDateToUnix(endText, true)
  };
}

function parseWikidataDate(value) {
  const raw = String(value?.time || "").trim();
  const match = raw.match(/^([+-]\d+)-(\d{2})-(\d{2})T/);
  if (!match) return "";
  const year = match[1].replace(/^\+/, "");
  if (!/^\d{4}$/.test(year)) return "";
  const precision = Number(value?.precision || 0);
  const month = precision >= 10 && match[2] !== "00" ? match[2] : "01";
  const day = precision >= 11 && match[3] !== "00" ? match[3] : "01";
  return `${year}-${month}-${day}`;
}

function extractYearFallback(text) {
  const match = String(text || "").match(/\b(19|20)\d{2}\b/);
  return match ? `${match[0]}-01-01` : "";
}

function claimEntityIds(entity, propertyId) {
  const set = new Set();
  const claims = Array.isArray(entity?.claims?.[propertyId]) ? entity.claims[propertyId] : [];
  claims.forEach((claim) => {
    const id = String(claim?.mainsnak?.datavalue?.value?.id || "").trim();
    if (/^Q\d+$/i.test(id)) set.add(id);
  });
  return [...set];
}

function claimStringValues(entity, propertyId) {
  const out = [];
  const seen = new Set();
  const claims = Array.isArray(entity?.claims?.[propertyId]) ? entity.claims[propertyId] : [];
  claims.forEach((claim) => {
    const value = String(claim?.mainsnak?.datavalue?.value || "").trim();
    if (!value) return;
    if (seen.has(value.toLowerCase())) return;
    seen.add(value.toLowerCase());
    out.push(value);
  });
  return out;
}

function isVideoGameEntity(entity) {
  return claimEntityIds(entity, "P31").includes(WIKIDATA_VIDEO_GAME_QID);
}

function pickLabel(entity) {
  return String(entity?.labels?.en?.value || entity?.labels?.en?.text || "").trim();
}

function extractReleaseDate(entity, fallbackText = "") {
  const rows = [...(Array.isArray(entity?.claims?.P577) ? entity.claims.P577 : []), ...(Array.isArray(entity?.claims?.P571) ? entity.claims.P571 : [])];
  const dates = rows.map((claim) => parseWikidataDate(claim?.mainsnak?.datavalue?.value)).filter(Boolean).sort();
  if (dates.length) return dates[0];
  return extractYearFallback(fallbackText);
}

function toSortEpoch(dateText) {
  const text = String(dateText || "").trim();
  if (!text) return 0;
  const ms = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : 0;
}

function filterRowsByDates(rows, datesRaw) {
  const { startUnix, endUnix } = parseDatesRange(datesRaw);
  if (!startUnix && !endUnix) return [...(Array.isArray(rows) ? rows : [])];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const released = String(row?.released || "").trim();
    if (!released) return false;
    const unix = Math.floor(toSortEpoch(released) / 1000);
    if (!Number.isFinite(unix) || unix <= 0) return false;
    if (Number.isFinite(startUnix) && unix < startUnix) return false;
    if (Number.isFinite(endUnix) && unix > endUnix) return false;
    return true;
  });
}

function filterRowsByGenres(rows, genresRaw) {
  const tokens = new Set(String(genresRaw || "").split(",").map((token) => String(token || "").trim().toLowerCase()).filter(Boolean));
  if (!tokens.size) return [...(Array.isArray(rows) ? rows : [])];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const genres = Array.isArray(row?.genres) ? row.genres : [];
    return genres.some((genre) => {
      const slug = String(genre?.slug || "").trim().toLowerCase();
      const nameSlug = normalizeGameKey(genre?.name || "").replace(/\s+/g, "-");
      const id = String(genre?.id || "").trim().toLowerCase();
      return tokens.has(slug) || tokens.has(nameSlug) || (id && tokens.has(id));
    });
  });
}

function sortRows(rows, orderingRaw = "-added") {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  const list = [...(Array.isArray(rows) ? rows : [])];
  if (ordering === "-name") return list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  if (ordering === "name") return list.sort((a, b) => String(b?.name || "").localeCompare(String(a?.name || "")));
  if (ordering === "released") return list.sort((a, b) => toSortEpoch(a?.released) - toSortEpoch(b?.released));
  return list.sort((a, b) => toSortEpoch(b?.released) - toSortEpoch(a?.released));
}

async function fetchJson(url, timeoutMs = WIKI_REQUEST_TIMEOUT_MS) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined
  });
  if (!response.ok) throw new Error(`UPSTREAM ${response.status}: ${await response.text()}`);
  return await response.json();
}

async function wikiQuery(params = {}) {
  const url = new URL(WIKIPEDIA_API_BASE);
  Object.entries({ action: "query", format: "json", formatversion: "2", origin: "*", ...params }).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });
  return await fetchJson(url.toString());
}

async function wikidataQuery(params = {}) {
  const url = new URL(WIKIDATA_API_BASE);
  Object.entries({ action: "wbgetentities", format: "json", origin: "*", ...params }).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).trim() === "") return;
    url.searchParams.set(key, String(value));
  });
  return await fetchJson(url.toString());
}

async function fetchSummary(title) {
  const normalized = normalizeTitle(title);
  if (!normalized || isExcludedTitle(normalized)) return null;
  const cached = readTimedCache(summaryCache, normalized.toLowerCase());
  if (cached) return cached;
  const payload = await fetchJson(`${WIKIPEDIA_REST_BASE}/page/summary/${encodeTitle(normalized)}`);
  if (!payload || payload.type === "disambiguation" || isExcludedTitle(payload?.title)) return null;
  writeTimedCache(summaryCache, normalized.toLowerCase(), payload, WIKI_SUMMARY_TTL_MS);
  return payload;
}

async function fetchPageById(id) {
  const json = await wikiQuery({ pageids: String(id), prop: "pageprops|info", ppprop: "wikibase_item", inprop: "url" });
  const page = Array.isArray(json?.query?.pages) ? json.query.pages[0] : null;
  return page && !page.missing ? page : null;
}

async function fetchInfoboxCover(title) {
  const json = await wikiQuery({ prop: "pageimages", titles: normalizeTitle(title), piprop: "original|thumbnail", pithumbsize: "900" });
  const page = Array.isArray(json?.query?.pages) ? json.query.pages[0] : null;
  return toHttpsUrl(page?.original?.source || page?.thumbnail?.source || "");
}

async function fetchEntities(ids = [], props = "claims|labels") {
  const uniqueIds = [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter((id) => /^Q\d+$/i.test(id)))];
  if (!uniqueIds.length) return new Map();
  const out = new Map();
  const pending = [];
  uniqueIds.forEach((id) => {
    const key = `${props}:${id}`;
    const cached = readTimedCache(entityCache, key);
    if (cached !== null) out.set(id, cached);
    else pending.push(id);
  });
  for (const chunk of chunkArray(pending, 40)) {
    let entities = {};
    try {
      entities = (await wikidataQuery({ ids: chunk.join("|"), props, languages: "en" }))?.entities || {};
    } catch (_error) {
      entities = {};
    }
    chunk.forEach((id) => {
      const entity = entities?.[id] || null;
      writeTimedCache(entityCache, `${props}:${id}`, entity, WIKI_ENTITY_TTL_MS);
      out.set(id, entity);
    });
  }
  return out;
}

async function labelMapForEntities(ids = []) {
  const map = new Map();
  const entities = await fetchEntities(ids, "labels");
  entities.forEach((entity, id) => {
    const label = pickLabel(entity);
    if (label) map.set(id, label);
  });
  return map;
}

function mapGenres(entity, labels) {
  return claimEntityIds(entity, "P136").map((qid, idx) => {
    const name = String(labels.get(qid) || "").trim();
    if (!name) return null;
    return { id: idx + 1, name, slug: normalizeGameKey(name).replace(/\s+/g, "-") };
  }).filter(Boolean).slice(0, 4);
}

function mapPlatforms(entity, labels) {
  return claimEntityIds(entity, "P400").map((qid) => String(labels.get(qid) || "").trim()).filter(Boolean).slice(0, 6).map((name) => ({ platform: { name } }));
}

function mapCompanies(entity, propertyId, labels) {
  return claimEntityIds(entity, propertyId).map((qid) => String(labels.get(qid) || "").trim()).filter(Boolean).slice(0, 6).map((name) => ({ name }));
}

function mapListRow(summary, entity, labels, infoboxCover = "") {
  const cover = toHttpsUrl(infoboxCover || summary?.originalimage?.source || summary?.thumbnail?.source || "");
  if (!cover) return null;
  const description = String(summary?.description || summary?.extract || "").trim();
  return {
    id: Number(summary?.pageid || 0),
    name: String(summary?.title || "Game").trim() || "Game",
    slug: normalizeGameKey(summary?.title || "").replace(/\s+/g, "-"),
    released: extractReleaseDate(entity, description),
    cover,
    hero: cover,
    screenshots: [cover],
    background_image: cover,
    short_screenshots: [{ id: 1, image: cover }],
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres: mapGenres(entity, labels),
    platforms: mapPlatforms(entity, labels),
    source: "wikipedia"
  };
}

function mapDetailRow(summary, entity, labels, infoboxCover = "") {
  const base = mapListRow(summary, entity, labels, infoboxCover);
  if (!base) return null;
  const summaryText = String(summary?.extract || "").trim();
  const subreddit = claimStringValues(entity, "P3984")[0] || "";
  const website = claimStringValues(entity, "P856")[0] || "";
  return {
    ...base,
    description_raw: summaryText,
    description: summaryText,
    playtime: null,
    developers: mapCompanies(entity, "P178", labels),
    publishers: mapCompanies(entity, "P123", labels),
    stores: [],
    website: toHttpsUrl(website),
    reddit_url: subreddit ? `https://www.reddit.com/r/${encodeURIComponent(subreddit.replace(/^r\//i, ""))}` : "",
    clip: null,
    youtube_url: "",
    player_scores: []
  };
}

async function hydrateRows(candidates = []) {
  const deduped = [];
  const seen = new Set();
  (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
    const pageid = Number(candidate?.pageid || 0);
    const title = normalizeTitle(candidate?.title || "");
    if (pageid <= 0 || !title || isExcludedTitle(title)) return;
    const key = `${pageid}:${title.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({ pageid, title });
  });
  const summaries = (await Promise.all(deduped.map((candidate) => fetchSummary(candidate.title).catch(() => null)))).filter(Boolean);
  const qids = [...new Set(summaries.map((row) => String(row?.wikibase_item || "").trim()).filter((id) => /^Q\d+$/i.test(id)))];
  const entities = await fetchEntities(qids, "claims|labels");
  const linked = new Set();
  [...entities.values()].filter(Boolean).forEach((entity) => ["P136", "P400", "P178", "P123"].forEach((prop) => claimEntityIds(entity, prop).forEach((id) => linked.add(id))));
  const labels = await labelMapForEntities([...linked]);

  return summaries.map((summary) => {
    const qid = String(summary?.wikibase_item || "").trim();
    const entity = entities.get(qid) || {};
    const text = `${summary?.description || ""} ${summary?.extract || ""}`.toLowerCase();
    if (qid && entity && !isVideoGameEntity(entity)) return null;
    if (!qid && !text.includes("video game")) return null;
    return mapListRow(summary, entity, labels);
  }).filter(Boolean);
}

function parseRequestedYears(datesRaw = "") {
  const currentYear = new Date().getUTCFullYear();
  const { startUnix, endUnix } = parseDatesRange(datesRaw);
  const startYear = Number.isFinite(startUnix) ? new Date(startUnix * 1000).getUTCFullYear() : currentYear - 2;
  const endYear = Number.isFinite(endUnix) ? new Date(endUnix * 1000).getUTCFullYear() : currentYear;
  const minYear = Math.max(1970, Math.min(startYear, endYear));
  const maxYear = Math.max(minYear, Math.max(startYear, endYear));
  const out = [];
  for (let year = maxYear; year >= minYear && out.length < 12; year -= 1) out.push(year);
  if (!out.length) out.push(currentYear);
  return out;
}

async function fetchCategoryCandidates(datesRaw = "", target = 80) {
  const years = parseRequestedYears(datesRaw);
  const out = [];
  const seen = new Set();
  for (const year of years) {
    if (out.length >= target) break;
    const json = await wikiQuery({ list: "categorymembers", cmtitle: `Category:${year}_video_games`, cmnamespace: "0", cmtype: "page", cmlimit: "50" }).catch(() => null);
    const rows = Array.isArray(json?.query?.categorymembers) ? json.query.categorymembers : [];
    rows.forEach((row) => {
      const pageid = Number(row?.pageid || 0);
      const title = normalizeTitle(row?.title || "");
      if (pageid <= 0 || !title || isExcludedTitle(title)) return;
      const key = `${pageid}:${title.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ pageid, title });
    });
  }
  return out;
}

async function fetchSearchCandidates(search, offset = 0, limit = 40) {
  const q = String(search || "").trim();
  if (!q) return { rows: [], totalHits: 0 };
  const json = await wikiQuery({ list: "search", srsearch: `${q} video game`, srnamespace: "0", sroffset: String(Math.max(0, offset)), srlimit: String(clampInt(limit, 1, 50, 40)) }).catch(() => null);
  const rows = (Array.isArray(json?.query?.search) ? json.query.search : []).filter((row) => !isExcludedTitle(row?.title)).filter((row) => {
    const snippet = stripHtml(row?.snippet || "").toLowerCase();
    return (
      snippet.includes("video game") ||
      snippet.includes("developed by") ||
      snippet.includes("published by") ||
      snippet.includes(" game")
    );
  }).map((row) => ({ pageid: Number(row?.pageid || 0), title: normalizeTitle(row?.title || "") })).filter((row) => row.pageid > 0 && row.title);
  return { rows, totalHits: Number(json?.query?.searchinfo?.totalhits || 0) };
}

export async function fetchWikipediaGameDetailsById(gameId) {
  const id = Number(gameId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const cached = readTimedCache(detailCache, String(id));
  if (cached) return cached;

  const page = await fetchPageById(id);
  if (!page?.title) return null;
  const summary = await fetchSummary(page.title);
  if (!summary) return null;
  const qid = String(summary?.wikibase_item || page?.pageprops?.wikibase_item || "").trim();
  const entity = (await fetchEntities(qid ? [qid] : [], "claims|labels")).get(qid) || {};
  if (qid && entity && !isVideoGameEntity(entity)) return null;
  const linked = [...new Set(["P136", "P400", "P178", "P123"].flatMap((prop) => claimEntityIds(entity, prop)))];
  const labels = await labelMapForEntities(linked);
  const cover = await fetchInfoboxCover(summary?.title || page?.title || "").catch(() => "");
  const mapped = mapDetailRow(summary, entity, labels, cover);
  if (!mapped) return null;
  writeTimedCache(detailCache, String(id), mapped, WIKI_DETAIL_TTL_MS);
  return mapped;
}

async function fetchGamesByExplicitIds(ids = []) {
  const rows = (await Promise.all((Array.isArray(ids) ? ids : []).slice(0, 60).map((id) => fetchWikipediaGameDetailsById(id).catch(() => null)))).filter(Boolean);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    released: row.released,
    cover: row.cover,
    hero: row.hero,
    screenshots: row.screenshots,
    background_image: row.background_image,
    short_screenshots: row.short_screenshots,
    rating: row.rating,
    ratings_count: row.ratings_count,
    metacritic: row.metacritic,
    genres: row.genres,
    platforms: row.platforms,
    website: row.website,
    source: row.source
  }));
}

export async function fetchWikipediaGamesList({ page = 1, pageSize = 20, search = "", id = "", ids = "", ordering = "-added", dates = "", genres = "" } = {}) {
  const safePage = clampInt(page, 1, 100000, 1);
  const safePageSize = clampInt(pageSize, 1, 50, 20);
  const offset = (safePage - 1) * safePageSize;
  const explicitIds = [...new Set(String(`${ids || ""},${id || ""}`).split(",").map((entry) => Number(String(entry || "").trim())).filter((value) => Number.isFinite(value) && value > 0))];
  const numericSearchId = /^\d+$/.test(String(search || "").trim()) ? Number(search) : 0;
  if (numericSearchId > 0) explicitIds.push(numericSearchId);

  if (explicitIds.length) {
    let rows = await fetchGamesByExplicitIds(explicitIds);
    rows = sortRows(filterRowsByDates(filterRowsByGenres(rows, genres), dates), ordering);
    return { count: rows.length, results: rows.slice(0, safePageSize) };
  }

  const cacheKey = JSON.stringify({ safePage, safePageSize, search: String(search || "").trim().toLowerCase(), ordering: String(ordering || "").trim().toLowerCase(), dates: String(dates || "").trim(), genres: String(genres || "").trim().toLowerCase() });
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;

  let rows = [];
  let count = 0;
  if (String(search || "").trim()) {
    const searched = await fetchSearchCandidates(search, offset, Math.max(24, safePageSize * 3));
    rows = await hydrateRows(searched.rows);
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    if (String(ordering || "").trim().toLowerCase() !== "-added") {
      rows = sortRows(rows, ordering);
    }
    rows = rows.slice(0, safePageSize);
    count = Math.max(Number(searched.totalHits || 0), offset + rows.length);
  } else {
    const candidates = await fetchCategoryCandidates(dates, Math.max(offset + safePageSize * 4, 80));
    const fallback = candidates.length < safePageSize ? await fetchSearchCandidates("top video games", 0, 50) : { rows: [] };
    rows = await hydrateRows([...candidates, ...(fallback.rows || [])]);
    rows = sortRows(filterRowsByDates(filterRowsByGenres(rows, genres), dates), ordering);
    count = Math.max(rows.length, offset + safePageSize);
    rows = rows.slice(offset, offset + safePageSize);
  }

  const payload = { count: Number(count || rows.length || 0), results: rows };
  writeTimedCache(listCache, cacheKey, payload, WIKI_LIST_TTL_MS);
  return payload;
}
