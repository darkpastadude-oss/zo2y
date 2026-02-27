const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_REST_BASE = "https://en.wikipedia.org/api/rest_v1";
const WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
const WIKI_REQUEST_TIMEOUT_MS = 7000;
const WIKIDATA_VIDEO_GAME_QID = "Q7889";
const WIKI_SUMMARY_TTL_MS = 1000 * 60 * 30;
const WIKI_LIST_TTL_MS = 1000 * 60 * 4;
const WIKI_DETAIL_TTL_MS = 1000 * 60 * 30;
const WIKI_ENTITY_TTL_MS = 1000 * 60 * 60;
const WIKI_MEDIA_TTL_MS = 1000 * 60 * 60;
const MAX_CACHE_ENTRIES = 500;
const POPULAR_SEED_BATCH_SIZE = 42;
const WIKI_YEAR_CANDIDATE_LIMIT = 20;

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
const mediaCache = new Map();

const POPULAR_GAME_TITLE_SEEDS = [
  "Minecraft",
  "Grand Theft Auto V",
  "Fortnite Battle Royale",
  "Roblox",
  "League of Legends",
  "Valorant",
  "Counter-Strike 2",
  "Dota 2",
  "Apex Legends",
  "Call of Duty: Warzone",
  "Elden Ring",
  "Baldur's Gate 3",
  "The Legend of Zelda: Tears of the Kingdom",
  "The Legend of Zelda: Breath of the Wild",
  "Cyberpunk 2077",
  "Red Dead Redemption 2",
  "The Witcher 3: Wild Hunt",
  "God of War Ragnarök",
  "Hades",
  "Helldivers 2",
  "Palworld",
  "Black Myth: Wukong",
  "Final Fantasy VII Rebirth",
  "Alan Wake 2",
  "Metaphor: ReFantazio",
  "Dragon's Dogma 2",
  "Hollow Knight",
  "Hollow Knight: Silksong",
  "Persona 5",
  "Persona 3 Reload",
  "Like a Dragon: Infinite Wealth",
  "Resident Evil 4 (2023 video game)",
  "Silent Hill 2 (2024 video game)",
  "Dead Space (2023 video game)",
  "Resident Evil Village",
  "Stardew Valley",
  "Terraria",
  "No Man's Sky",
  "Sea of Thieves",
  "Destiny 2",
  "Rainbow Six Siege",
  "Overwatch 2",
  "Rocket League",
  "Genshin Impact",
  "Honkai: Star Rail",
  "Zenless Zone Zero",
  "Marvel Rivals",
  "PUBG: Battlegrounds",
  "Escape from Tarkov",
  "Path of Exile",
  "Path of Exile 2",
  "Diablo IV",
  "World of Warcraft",
  "Final Fantasy XIV",
  "Monster Hunter: World",
  "Monster Hunter Wilds",
  "EA Sports FC 25",
  "NBA 2K25",
  "Madden NFL 25",
  "Gran Turismo 7",
  "Forza Horizon 5",
  "Need for Speed Unbound",
  "Tekken 8",
  "Street Fighter 6",
  "Mortal Kombat 1",
  "Super Smash Bros. Ultimate",
  "Super Mario Odyssey",
  "Super Mario Bros. Wonder",
  "Animal Crossing: New Horizons",
  "Pokémon Scarlet and Violet",
  "Pokémon Legends: Arceus",
  "Splatoon 3",
  "Fire Emblem Engage",
  "Metroid Dread",
  "Starfield (video game)",
  "Avowed",
  "S.T.A.L.K.E.R. 2: Heart of Chornobyl",
  "Lies of P",
  "Lethal Company",
  "Phasmophobia",
  "Among Us",
  "The Finals",
  "Remnant II",
  "Warframe",
  "The Last of Us Part II",
  "Ghost of Tsushima",
  "Death Stranding",
  "Assassin's Creed Valhalla",
  "Assassin's Creed Shadows",
  "Hogwarts Legacy",
  "Marvel's Spider-Man 2",
  "The Elder Scrolls V: Skyrim",
  "Fallout 4",
  "Fallout: New Vegas",
  "Nier: Automata",
  "Sekiro: Shadows Die Twice",
  "Bloodborne",
  "Dark Souls III",
  "Clair Obscur: Expedition 33"
];

const POPULAR_SEARCH_SEEDS = [
  "best-selling video games",
  "most played video games",
  "game of the year video game",
  "top video games"
];

const POPULAR_TITLE_RANK = new Map(
  POPULAR_GAME_TITLE_SEEDS.map((title, index) => [normalizeGameKey(title), index + 1])
);

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

async function runWithConcurrency(items = [], concurrency = 6, worker) {
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

function normalizeMediaUrl(url) {
  return toHttpsUrl(url).replace(/\?.*$/, "").trim().toLowerCase();
}

function expandWikimediaThumbUrl(url) {
  const raw = toHttpsUrl(url);
  if (!raw.includes("/thumb/")) return raw;
  const match = raw.match(/^(https:\/\/upload\.wikimedia\.org\/[^/]+)\/thumb\/(.+)\/([^/]+)$/i);
  if (!match) return raw;
  const base = match[1];
  const thumbPath = match[2];
  const sourcePath = thumbPath.replace(/\/[^/]+$/, "");
  if (!sourcePath) return raw;
  return `${base}/${sourcePath}`;
}

function resolveMediaItemImageUrl(item) {
  const srcset = Array.isArray(item?.srcset) ? item.srcset : [];
  const sorted = [...srcset].sort((a, b) => {
    const aScale = Number(String(a?.scale || "1").replace(/[^\d.]/g, "")) || 1;
    const bScale = Number(String(b?.scale || "1").replace(/[^\d.]/g, "")) || 1;
    return bScale - aScale;
  });
  const candidate = String(
    sorted[0]?.src ||
    item?.src ||
    item?.original?.source ||
    item?.thumbnail?.source ||
    ""
  ).trim();
  if (!candidate) return "";
  return expandWikimediaThumbUrl(candidate);
}

function isLikelyScreenshotMediaItem(item) {
  const title = String(item?.title || "").toLowerCase();
  const caption = String(item?.caption?.text || "").toLowerCase();
  const text = `${title} ${caption}`;
  if (!text.trim()) return false;
  if (/\b(gameplay|in-?game|screenshot|screen|battle|combat|mission|map|level|hud|boss)\b/i.test(text)) return true;
  if (/\b(cover|box art|logo|wordmark|icon|portrait|awards?|developer|director|actor)\b/i.test(text)) return false;
  return !item?.leadImage;
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

async function fetchSpotlightScreenshot(title, fallbackCover = "") {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle) return toHttpsUrl(fallbackCover);
  const cacheKey = normalizedTitle.toLowerCase();
  const cached = readTimedCache(mediaCache, cacheKey);
  if (cached !== null) return cached;

  const fallbackUrl = toHttpsUrl(fallbackCover);
  const fallbackNormalized = normalizeMediaUrl(fallbackUrl);
  let selected = "";
  try {
    const mediaJson = await fetchJson(`${WIKIPEDIA_REST_BASE}/page/media-list/${encodeTitle(normalizedTitle)}`);
    const items = (Array.isArray(mediaJson?.items) ? mediaJson.items : [])
      .filter((item) => String(item?.type || "").toLowerCase() === "image");
    const prioritized = [];
    const secondary = [];
    items.forEach((item) => {
      const url = resolveMediaItemImageUrl(item);
      if (!url) return;
      const normalizedUrl = normalizeMediaUrl(url);
      if (!normalizedUrl || (fallbackNormalized && normalizedUrl === fallbackNormalized)) return;
      if (isLikelyScreenshotMediaItem(item)) {
        prioritized.push(url);
      } else {
        secondary.push(url);
      }
    });
    selected = prioritized[0] || secondary[0] || fallbackUrl;
  } catch (_error) {
    selected = fallbackUrl;
  }

  writeTimedCache(mediaCache, cacheKey, selected || "", WIKI_MEDIA_TTL_MS);
  return selected || "";
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

function mapSummaryBackfillRow(summary) {
  const pageid = Number(summary?.pageid || 0);
  const name = String(summary?.title || "").trim();
  const cover = toHttpsUrl(summary?.originalimage?.source || summary?.thumbnail?.source || "");
  if (pageid <= 0 || !name || !cover) return null;
  const releaseText = `${summary?.description || ""} ${summary?.extract || ""}`.trim();
  const released = extractYearFallback(releaseText);
  return {
    id: pageid,
    name,
    slug: normalizeGameKey(name).replace(/\s+/g, "-"),
    released,
    cover,
    hero: cover,
    screenshots: [cover],
    background_image: cover,
    short_screenshots: [{ id: 1, image: cover }],
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres: [],
    platforms: [],
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

function mergeScreenshotUrls(primary = [], secondary = []) {
  const seen = new Set();
  const out = [];
  [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])].forEach((value) => {
    const url = toHttpsUrl(value);
    if (!url) return;
    const key = normalizeMediaUrl(url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(url);
  });
  return out;
}

async function enrichRowsWithSpotlightScreenshots(rows = [], maxToEnrich = 20) {
  const baseRows = Array.isArray(rows) ? rows : [];
  const out = [...baseRows];
  const limit = clampInt(maxToEnrich, 1, Math.max(1, out.length), Math.min(20, out.length || 1));
  await runWithConcurrency(out.slice(0, limit).map((row, index) => ({ row, index })), 8, async ({ row, index }) => {
    if (!row || !row.name) return;
    const cover = toHttpsUrl(row.cover || "");
    const hero = await fetchSpotlightScreenshot(row.name, cover).catch(() => cover);
    if (!hero || normalizeMediaUrl(hero) === normalizeMediaUrl(cover)) return;
    const screenshots = mergeScreenshotUrls([hero, cover], row.screenshots || []);
    out[index] = {
      ...row,
      hero,
      background_image: hero,
      screenshots,
      short_screenshots: screenshots.map((image, idx) => ({ id: idx + 1, image }))
    };
  });
  return out;
}

async function hydrateRows(candidates = []) {
  const deduped = [];
  const seen = new Set();
  (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
    const pageid = Number(candidate?.pageid || 0);
    const title = normalizeTitle(candidate?.title || "");
    if (!title || isExcludedTitle(title)) return;
    const key = pageid > 0 ? `${pageid}:${title.toLowerCase()}` : `title:${title.toLowerCase()}`;
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
  for (let year = maxYear; year >= minYear && out.length < WIKI_YEAR_CANDIDATE_LIMIT; year -= 1) out.push(year);
  if (!out.length) out.push(currentYear);
  return out;
}

async function fetchCategoryCandidates(datesRaw = "", target = 80) {
  const years = parseRequestedYears(datesRaw);
  const out = [];
  const seen = new Set();
  for (const year of years) {
    if (out.length >= target) break;
    let cmcontinue = "";
    for (let pass = 0; pass < 2; pass += 1) {
      const json = await wikiQuery({
        list: "categorymembers",
        cmtitle: `Category:${year}_video_games`,
        cmnamespace: "0",
        cmtype: "page",
        cmlimit: "50",
        cmcontinue
      }).catch(() => null);
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
      cmcontinue = String(json?.continue?.cmcontinue || "").trim();
      if (!cmcontinue || out.length >= target) break;
    }
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

async function fetchPopularSeedCandidates(limit = POPULAR_SEED_BATCH_SIZE) {
  const take = clampInt(limit, 12, POPULAR_GAME_TITLE_SEEDS.length, POPULAR_SEED_BATCH_SIZE);
  return POPULAR_GAME_TITLE_SEEDS
    .slice(0, take)
    .map((title) => ({ pageid: 0, title: normalizeTitle(title) }))
    .filter((row) => !!row.title && !isExcludedTitle(row.title));
}

async function fetchPopularSearchSeedCandidates() {
  const buckets = await Promise.all(POPULAR_SEARCH_SEEDS.map((seed) => fetchSearchCandidates(seed, 0, 22).catch(() => ({ rows: [] }))));
  const seen = new Set();
  const out = [];
  buckets.forEach((bucket) => {
    (Array.isArray(bucket?.rows) ? bucket.rows : []).forEach((row) => {
      const pageid = Number(row?.pageid || 0);
      const title = normalizeTitle(row?.title || "");
      if (pageid <= 0 || !title || isExcludedTitle(title)) return;
      const key = `${pageid}:${title.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ pageid, title });
    });
  });
  return out;
}

async function fetchSummaryBackfillRows(limit = 12, excludedIds = new Set()) {
  const take = clampInt(limit, 1, POPULAR_GAME_TITLE_SEEDS.length, 12);
  const rows = [];
  for (const title of POPULAR_GAME_TITLE_SEEDS) {
    if (rows.length >= take) break;
    const summary = await fetchSummary(title).catch(() => null);
    const mapped = mapSummaryBackfillRow(summary);
    if (!mapped) continue;
    if (excludedIds.has(mapped.id)) continue;
    excludedIds.add(mapped.id);
    rows.push(mapped);
  }
  return rows;
}

function sortRowsByPopularity(rows = [], orderingRaw = "") {
  const ordering = String(orderingRaw || "").trim().toLowerCase();
  const popularOrdering = ordering === "-rating" || ordering === "-metacritic" || ordering === "-added" || ordering === "";
  if (!popularOrdering) return sortRows(rows, orderingRaw);
  const list = [...(Array.isArray(rows) ? rows : [])];
  list.sort((a, b) => {
    const rankA = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(a?.name || "")) || 9999);
    const rankB = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(b?.name || "")) || 9999);
    if (rankA !== rankB) return rankA - rankB;
    const releaseDiff = toSortEpoch(b?.released) - toSortEpoch(a?.released);
    if (releaseDiff) return releaseDiff;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
  return list;
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
  const hero = await fetchSpotlightScreenshot(mapped.name, mapped.cover).catch(() => mapped.cover || "");
  const screenshots = mergeScreenshotUrls([hero, mapped.cover], mapped.screenshots || []);
  const normalized = {
    ...mapped,
    hero: hero || mapped.hero || mapped.cover || "",
    background_image: hero || mapped.background_image || mapped.cover || "",
    screenshots,
    short_screenshots: screenshots.map((image, idx) => ({ id: idx + 1, image }))
  };
  writeTimedCache(detailCache, String(id), normalized, WIKI_DETAIL_TTL_MS);
  return normalized;
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
    const totalCount = rows.length;
    rows = rows.slice(0, safePageSize);
    rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(10, safePageSize));
    return { count: totalCount, results: rows };
  }

  const cacheKey = JSON.stringify({ safePage, safePageSize, search: String(search || "").trim().toLowerCase(), ordering: String(ordering || "").trim().toLowerCase(), dates: String(dates || "").trim(), genres: String(genres || "").trim().toLowerCase() });
  const cached = readTimedCache(listCache, cacheKey);
  if (cached) return cached;

  let rows = [];
  let count = 0;
  if (String(search || "").trim()) {
    const searched = await fetchSearchCandidates(search, offset, Math.max(36, safePageSize * 4));
    const popularSeeds = await fetchPopularSeedCandidates(36);
    rows = await hydrateRows(searched.rows);
    if (rows.length < safePageSize) {
      const popularBackfill = await hydrateRows(popularSeeds);
      rows = [...rows, ...popularBackfill];
    }
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    if (String(ordering || "").trim().toLowerCase() !== "-added") {
      rows = sortRowsByPopularity(rows, ordering);
    }
    rows = rows.slice(0, safePageSize);
    rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(10, safePageSize));
    count = Math.max(Number(searched.totalHits || 0), offset + rows.length);
  } else {
    const candidateTarget = Math.min(Math.max(offset + safePageSize + 8, 56), 84);
    const candidates = await fetchCategoryCandidates(dates, candidateTarget);
    const popularCandidates = await fetchPopularSeedCandidates(POPULAR_SEED_BATCH_SIZE);
    const popularSearchCandidates = await fetchPopularSearchSeedCandidates();
    const blendedCandidates = [
      ...popularCandidates,
      ...popularSearchCandidates,
      ...candidates
    ].slice(0, Math.max(offset + safePageSize + 8, 56));
    rows = await hydrateRows(blendedCandidates);
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    rows = sortRowsByPopularity(rows, ordering);
    const neededPoolSize = offset + safePageSize;
    if (rows.length < neededPoolSize) {
      const excludedIds = new Set(rows.map((row) => Number(row?.id || 0)).filter((id) => Number.isFinite(id) && id > 0));
      const backfillRows = await fetchSummaryBackfillRows(Math.max(neededPoolSize - rows.length, 0) + 8, excludedIds);
      rows = sortRowsByPopularity([...rows, ...backfillRows], ordering);
    }
    count = Math.max(rows.length, offset + safePageSize);
    rows = rows.slice(offset, offset + safePageSize);
    rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(12, safePageSize));
  }

  const payload = { count: Number(count || rows.length || 0), results: rows };
  writeTimedCache(listCache, cacheKey, payload, WIKI_LIST_TTL_MS);
  return payload;
}
