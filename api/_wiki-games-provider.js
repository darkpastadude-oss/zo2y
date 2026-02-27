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
  "Civilization VI",
  "Age of Empires IV",
  "StarCraft II",
  "Total War: Warhammer III",
  "XCOM 2",
  "Crusader Kings III",
  "Diablo IV",
  "World of Warcraft",
  "Final Fantasy XIV",
  "Monster Hunter: World",
  "Monster Hunter Wilds",
  "EA Sports FC 25",
  "EA Sports FC 24",
  "FIFA 23",
  "FIFA 22",
  "FIFA 21",
  "FIFA 20",
  "FIFA 19",
  "FIFA 18",
  "FIFA 17",
  "FIFA 16",
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

const GENRE_SEARCH_QUERY_SEEDS = {
  action: ["action video game", "best action games"],
  "action-adventure": ["action-adventure video game", "open world action game"],
  adventure: ["adventure video game"],
  "role-playing": ["role-playing video game", "rpg video game", "jrpg video game"],
  strategy: ["strategy video game", "turn-based strategy game", "real-time strategy game"],
  simulation: ["simulation video game", "simulator video game"],
  sports: ["sports video game", "fifa video game", "ea sports fc", "madden nfl video game", "nba 2k video game"],
  racing: ["racing video game", "forza video game", "gran turismo video game", "need for speed video game"],
  fighting: ["fighting video game", "tekken video game", "street fighter video game"],
  shooter: ["shooter video game", "fps video game", "battle royale video game"],
  platformer: ["platform game", "platformer video game"],
  puzzle: ["puzzle video game"],
  horror: ["horror video game", "survival horror game"],
  stealth: ["stealth video game"],
  survival: ["survival video game"],
  sandbox: ["sandbox video game"],
  mmo: ["mmorpg video game", "massively multiplayer online game"],
  indie: ["indie video game"]
};

const POPULAR_TITLE_RANK = new Map(
  POPULAR_GAME_TITLE_SEEDS.map((title, index) => [normalizeGameKey(title), index + 1])
);

const CANONICAL_GENRE_BY_SLUG = new Map(
  WIKIPEDIA_GAME_GENRES.map((genre) => [String(genre.slug || "").trim().toLowerCase(), genre])
);

const CANONICAL_GENRE_BY_ID = new Map(
  WIKIPEDIA_GAME_GENRES.map((genre) => [Number(genre.id || 0), genre])
);

const GENRE_ALIAS_RULES = [
  { slug: "action-adventure", patterns: [/action adventure/, /action[-\s]?adventure/] },
  { slug: "role-playing", patterns: [/role[-\s]?playing/, /\brpg\b/] },
  { slug: "strategy", patterns: [/strategy/, /real[-\s]?time strategy/, /turn[-\s]?based strategy/, /civilization/, /age of empires/, /starcraft/, /xcom/, /total war/, /crusader kings/, /hearts of iron/] },
  { slug: "simulation", patterns: [/simulation/, /simulator/, /management/] },
  { slug: "sports", patterns: [/sports?/, /football/, /soccer/, /basketball/, /baseball/, /hockey/, /tennis/, /golf/, /fifa/, /madden/, /nba\s*2k/, /ea sports fc/, /wwe\s*2k/, /mlb the show/, /\bufc\b/, /\bpga\b/] },
  { slug: "racing", patterns: [/racing/, /driving/, /kart/, /forza/, /gran turismo/, /need for speed/, /mario kart/, /\bf1\b/, /rally/] },
  { slug: "fighting", patterns: [/fighting/, /beat em up/, /brawler/, /tekken/, /street fighter/, /mortal kombat/, /smash bros/, /super smash/] },
  { slug: "shooter", patterns: [/shooter/, /first person shooter/, /third person shooter/, /\bfps\b/, /call of duty/, /battlefield/, /counter[-\s]?strike/, /rainbow six/, /valorant/] },
  { slug: "platformer", patterns: [/platform/, /platformer/] },
  { slug: "puzzle", patterns: [/puzzle/] },
  { slug: "horror", patterns: [/horror/] },
  { slug: "stealth", patterns: [/stealth/] },
  { slug: "survival", patterns: [/survival/, /survive/] },
  { slug: "sandbox", patterns: [/sandbox/, /open world/] },
  { slug: "mmo", patterns: [/massively multiplayer/, /\bmmo\b/, /\bmmorpg\b/] },
  { slug: "indie", patterns: [/indie/] },
  { slug: "adventure", patterns: [/\badventure\b/] },
  { slug: "action", patterns: [/\baction\b/] }
];

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

function canonicalGenreSlugFromText(value) {
  const normalized = normalizeGameKey(value);
  if (!normalized) return "";
  const compact = normalized.replace(/\s+/g, "-");
  if (CANONICAL_GENRE_BY_SLUG.has(compact)) return compact;
  for (const rule of GENRE_ALIAS_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.slug;
    }
  }
  return "";
}

function toCanonicalGenreRow(value, fallbackId = 0) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const slug = canonicalGenreSlugFromText(raw);
  if (slug && CANONICAL_GENRE_BY_SLUG.has(slug)) {
    const canonical = CANONICAL_GENRE_BY_SLUG.get(slug);
    return {
      id: Number(canonical.id || 0),
      name: String(canonical.name || raw).trim(),
      slug: String(canonical.slug || slug).trim()
    };
  }
  return {
    id: Number(fallbackId || 0),
    name: raw,
    slug: normalizeGameKey(raw).replace(/\s+/g, "-")
  };
}

function resolveGenreFilterToken(token) {
  const text = String(token || "").trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) {
    const byId = CANONICAL_GENRE_BY_ID.get(Number(text));
    return String(byId?.slug || "").trim().toLowerCase();
  }
  const slug = text.toLowerCase();
  if (CANONICAL_GENRE_BY_SLUG.has(slug)) return slug;
  return canonicalGenreSlugFromText(text);
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

function parseGenreFilterTokens(genresRaw) {
  return new Set(String(genresRaw || "")
    .split(",")
    .map((token) => resolveGenreFilterToken(token))
    .filter(Boolean));
}

function filterRowsByGenres(rows, genresRaw) {
  const tokens = parseGenreFilterTokens(genresRaw);
  if (!tokens.size) return [...(Array.isArray(rows) ? rows : [])];
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const genres = Array.isArray(row?.genres) ? row.genres : [];
    return genres.some((genre) => {
      const slug = resolveGenreFilterToken(genre?.slug || genre?.name || "");
      return !!slug && tokens.has(slug);
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

function dedupeRows(rows = []) {
  const out = [];
  const seenIds = new Set();
  const seenNames = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const id = Number(row?.id || 0);
    if (Number.isFinite(id) && id > 0) {
      if (seenIds.has(id)) return;
      seenIds.add(id);
    }
    const nameKey = normalizeGameKey(row?.name || "");
    const yearKey = String(row?.released || "").slice(0, 4);
    const compositeKey = nameKey ? `${nameKey}|${yearKey}` : "";
    if (compositeKey) {
      if (seenNames.has(compositeKey)) return;
      seenNames.add(compositeKey);
    }
    out.push(row);
  });
  return out;
}

async function fetchJson(url, timeoutMs = WIKI_REQUEST_TIMEOUT_MS) {
  const attempts = 2;
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "zo2y-games/1.0 (+https://www.zo2y.com; contact: zo2hyq@gmail.com)",
          "api-user-agent": "zo2y-games/1.0 (+https://www.zo2y.com; contact: zo2hyq@gmail.com)"
        },
        signal: typeof AbortSignal?.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined
      });
      if (response.ok) return await response.json();
      const body = await response.text();
      const status = Number(response.status || 0);
      const retryable = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
      if (retryable && attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      throw new Error(`UPSTREAM ${status}: ${body}`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError || new Error("UPSTREAM REQUEST FAILED");
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

async function fetchSummaryViaQuery(title) {
  const normalized = normalizeTitle(title);
  if (!normalized || isExcludedTitle(normalized)) return null;
  const json = await wikiQuery({
    titles: normalized,
    redirects: "1",
    prop: "description|extracts|pageimages|pageprops",
    exintro: "1",
    explaintext: "1",
    piprop: "original|thumbnail",
    pithumbsize: "900",
    ppprop: "wikibase_item"
  }).catch(() => null);
  const page = Array.isArray(json?.query?.pages) ? json.query.pages[0] : null;
  if (!page || page.missing || isExcludedTitle(page?.title)) return null;
  const payload = {
    type: "standard",
    title: normalizeTitle(page?.title || normalized),
    pageid: Number(page?.pageid || 0),
    extract: String(page?.extract || "").trim(),
    description: String(page?.description || "").trim(),
    wikibase_item: String(page?.pageprops?.wikibase_item || "").trim(),
    thumbnail: page?.thumbnail?.source
      ? { source: toHttpsUrl(page.thumbnail.source), width: Number(page?.thumbnail?.width || 0), height: Number(page?.thumbnail?.height || 0) }
      : null,
    originalimage: page?.original?.source
      ? { source: toHttpsUrl(page.original.source), width: Number(page?.original?.width || 0), height: Number(page?.original?.height || 0) }
      : null
  };
  if (payload.pageid <= 0 || !payload.title) return null;
  return payload;
}

async function fetchSummary(title) {
  const normalized = normalizeTitle(title);
  if (!normalized || isExcludedTitle(normalized)) return null;
  const cached = readTimedCache(summaryCache, normalized.toLowerCase());
  if (cached) return cached;
  let payload = null;
  try {
    payload = await fetchJson(`${WIKIPEDIA_REST_BASE}/page/summary/${encodeTitle(normalized)}`);
  } catch (_error) {
    payload = null;
  }
  if (!payload || payload.type === "disambiguation" || isExcludedTitle(payload?.title) || Number(payload?.pageid || 0) <= 0) {
    payload = await fetchSummaryViaQuery(normalized);
  }
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
  const seen = new Set();
  return claimEntityIds(entity, "P136").map((qid, idx) => {
    const name = String(labels.get(qid) || "").trim();
    if (!name) return null;
    const mapped = toCanonicalGenreRow(name, idx + 1);
    if (!mapped) return null;
    const key = String(mapped.slug || "").trim().toLowerCase() || String(mapped.name || "").toLowerCase();
    if (!key || seen.has(key)) return null;
    seen.add(key);
    return mapped;
  }).filter(Boolean).slice(0, 4);
}

function inferGenresFromText(text) {
  const normalized = normalizeGameKey(text);
  if (!normalized) return [];
  const rows = [];
  const seen = new Set();
  GENRE_ALIAS_RULES.forEach((rule) => {
    if (!rule?.slug || seen.has(rule.slug)) return;
    if (!Array.isArray(rule.patterns) || !rule.patterns.length) return;
    if (!rule.patterns.some((pattern) => pattern.test(normalized))) return;
    const canonical = CANONICAL_GENRE_BY_SLUG.get(rule.slug);
    if (!canonical) return;
    seen.add(rule.slug);
    rows.push({
      id: Number(canonical.id || 0),
      name: String(canonical.name || "").trim() || rule.slug,
      slug: String(canonical.slug || rule.slug).trim()
    });
  });
  return rows.slice(0, 3);
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
  const mappedGenres = mapGenres(entity, labels);
  const inferredGenres = inferGenresFromText(`${summary?.title || ""} ${description}`);
  const genres = [];
  const seenGenreSlugs = new Set();
  [...mappedGenres, ...inferredGenres].forEach((genre) => {
    const slug = String(genre?.slug || "").trim().toLowerCase();
    if (!slug || seenGenreSlugs.has(slug)) return;
    seenGenreSlugs.add(slug);
    genres.push(genre);
  });
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
    genres,
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
  const inferredGenres = inferGenresFromText(`${name} ${releaseText}`);
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
    genres: inferredGenres,
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
  const queryKey = normalizeGameKey(q);
  const queryTokens = queryKey.split(/\s+/).filter(Boolean);
  const json = await wikiQuery({ list: "search", srsearch: `${q} video game`, srnamespace: "0", sroffset: String(Math.max(0, offset)), srlimit: String(clampInt(limit, 1, 50, 40)) }).catch(() => null);
  const rows = (Array.isArray(json?.query?.search) ? json.query.search : [])
    .filter((row) => !isExcludedTitle(row?.title))
    .filter((row) => {
      const title = normalizeTitle(row?.title || "");
      const titleKey = normalizeGameKey(title);
      const snippet = stripHtml(row?.snippet || "").toLowerCase();
      const snippetLooksLikeGame = (
        snippet.includes("video game") ||
        snippet.includes("developed by") ||
        snippet.includes("published by") ||
        snippet.includes(" game")
      );
      const titleMatchesQuery = !!titleKey && (
        titleKey.includes(queryKey) ||
        (queryTokens.length > 0 && queryTokens.every((token) => titleKey.includes(token)))
      );
      return snippetLooksLikeGame || titleMatchesQuery;
    })
    .map((row) => ({ pageid: Number(row?.pageid || 0), title: normalizeTitle(row?.title || "") }))
    .filter((row) => row.pageid > 0 && row.title);
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

async function fetchSummaryBackfillRows(limit = 12, excludedIds = new Set(), genresRaw = "") {
  const take = clampInt(limit, 1, POPULAR_GAME_TITLE_SEEDS.length, 12);
  const preferred = buildGenreSeedCandidates(genresRaw, Math.max(take * 2, 24)).map((row) => row.title);
  const titlePool = [...new Set([...preferred, ...POPULAR_GAME_TITLE_SEEDS].map((row) => normalizeTitle(row)).filter(Boolean))];
  const rows = [];
  for (const title of titlePool) {
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

function sortSearchRowsByQuery(rows = [], query = "") {
  const normalizedQuery = normalizeGameKey(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!normalizedQuery) return [...(Array.isArray(rows) ? rows : [])];
  const scored = (Array.isArray(rows) ? rows : []).map((row, index) => {
    const title = String(row?.name || "").trim();
    const titleKey = normalizeGameKey(title);
    const slugKey = normalizeGameKey(row?.slug || "");
    const combined = `${titleKey} ${slugKey}`.trim();
    let score = 0;
    if (titleKey === normalizedQuery) score += 1200;
    if (combined.startsWith(normalizedQuery)) score += 880;
    if (combined.includes(normalizedQuery)) score += 620;
    queryTokens.forEach((token) => {
      if (!token) return;
      if (combined.startsWith(token)) score += 60;
      if (combined.includes(token)) score += 55;
      else score -= 30;
    });
    if (/\bvideo game\b/i.test(title)) score += 45;
    const popularityRank = Number(POPULAR_TITLE_RANK.get(titleKey) || 0);
    if (popularityRank > 0) score += Math.max(0, 320 - popularityRank);
    score += Math.max(0, Math.min(90, Math.floor(toSortEpoch(row?.released) / (1000 * 60 * 60 * 24 * 365 * 8))));
    return { row, score, index };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const releaseDiff = toSortEpoch(b.row?.released) - toSortEpoch(a.row?.released);
    if (releaseDiff !== 0) return releaseDiff;
    const rankA = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(a.row?.name || "")) || 9999);
    const rankB = Number(POPULAR_TITLE_RANK.get(normalizeGameKey(b.row?.name || "")) || 9999);
    if (rankA !== rankB) return rankA - rankB;
    return a.index - b.index;
  });
  return scored.map((entry) => entry.row);
}

function buildSeedQueryMatchCandidates(query, limit = 20) {
  const queryKey = normalizeGameKey(query);
  const tokens = queryKey.split(/\s+/).filter(Boolean);
  if (!queryKey) return [];
  const matched = POPULAR_GAME_TITLE_SEEDS
    .map((title) => ({ title, key: normalizeGameKey(title) }))
    .filter((entry) => {
      if (!entry.key) return false;
      if (entry.key.includes(queryKey)) return true;
      if (tokens.length && tokens.every((token) => entry.key.includes(token))) return true;
      if (tokens.length === 1 && tokens[0].length >= 3 && entry.key.startsWith(tokens[0])) return true;
      return false;
    })
    .slice(0, clampInt(limit, 1, 40, 20))
    .map((entry) => ({ pageid: 0, title: normalizeTitle(entry.title) }));
  return matched;
}

function titleMatchesGenreTokens(title, genreTokens = new Set()) {
  const tokens = genreTokens instanceof Set ? genreTokens : new Set();
  if (!tokens.size) return false;
  const titleText = normalizeTitle(title);
  if (!titleText) return false;
  const titleKey = normalizeGameKey(titleText);
  if (!titleKey) return false;
  const inferred = inferGenresFromText(titleText);
  if (inferred.some((genre) => tokens.has(resolveGenreFilterToken(genre?.slug || genre?.name || "")))) return true;
  for (const token of tokens) {
    if (!token) continue;
    const rule = GENRE_ALIAS_RULES.find((entry) => entry.slug === token);
    if (Array.isArray(rule?.patterns) && rule.patterns.some((pattern) => pattern.test(titleKey))) return true;
  }
  return false;
}

function buildGenreSeedCandidates(genresRaw = "", limit = 60) {
  const tokens = parseGenreFilterTokens(genresRaw);
  if (!tokens.size) return [];
  const out = [];
  const seen = new Set();
  const maxRows = clampInt(limit, 1, POPULAR_GAME_TITLE_SEEDS.length, 60);
  for (const title of POPULAR_GAME_TITLE_SEEDS) {
    if (out.length >= maxRows) break;
    const normalizedTitle = normalizeTitle(title);
    if (!normalizedTitle || isExcludedTitle(normalizedTitle)) continue;
    if (!titleMatchesGenreTokens(normalizedTitle, tokens)) continue;
    const key = normalizedTitle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ pageid: 0, title: normalizedTitle });
  }
  return out;
}

function buildGenreSearchQueries(genresRaw = "", limit = 8) {
  const tokens = [...parseGenreFilterTokens(genresRaw)];
  if (!tokens.length) return [];
  const out = [];
  const seen = new Set();
  tokens.forEach((token) => {
    if (!token) return;
    const canonical = CANONICAL_GENRE_BY_SLUG.get(token);
    const defaultQuery = `${String(canonical?.name || token).trim()} video game`;
    const genreQueries = [defaultQuery, ...(Array.isArray(GENRE_SEARCH_QUERY_SEEDS[token]) ? GENRE_SEARCH_QUERY_SEEDS[token] : [])];
    genreQueries.forEach((query) => {
      const value = String(query || "").trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(value);
    });
  });
  return out.slice(0, clampInt(limit, 1, 16, 8));
}

async function fetchGenreSearchCandidates(genresRaw = "", limit = 80) {
  const queries = buildGenreSearchQueries(genresRaw, 10);
  if (!queries.length) return [];
  const maxRows = clampInt(limit, 1, 320, 80);
  const perQuery = clampInt(Math.ceil(maxRows / queries.length) + 8, 8, 40, 24);
  const buckets = await Promise.all(queries.map((query) => fetchSearchCandidates(query, 0, perQuery).catch(() => ({ rows: [] }))));
  const out = [];
  const seen = new Set();
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
  return out.slice(0, maxRows);
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
    rows = dedupeRows(sortRows(filterRowsByDates(filterRowsByGenres(rows, genres), dates), ordering));
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
  const genreTokens = parseGenreFilterTokens(genres);
  if (String(search || "").trim()) {
    const searched = await fetchSearchCandidates(search, offset, Math.max(36, safePageSize * 4));
    const popularSeeds = await fetchPopularSeedCandidates(36);
    const seedQueryMatches = buildSeedQueryMatchCandidates(search, 24);
    const genreSeedMatches = buildGenreSeedCandidates(genres, Math.max(18, safePageSize * 2));
    const genreSearchMatches = genreTokens.size ? await fetchGenreSearchCandidates(genres, Math.max(28, safePageSize * 2)) : [];
    rows = await hydrateRows(searched.rows);
    if (rows.length < safePageSize) {
      const [popularBackfill, queryBackfill, genreBackfill, genreQueryBackfill] = await Promise.all([
        hydrateRows(popularSeeds),
        hydrateRows(seedQueryMatches),
        hydrateRows(genreSeedMatches),
        hydrateRows(genreSearchMatches)
      ]);
      rows = [...rows, ...queryBackfill, ...genreBackfill, ...genreQueryBackfill, ...popularBackfill];
    }
    rows = dedupeRows(rows);
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    rows = dedupeRows(rows);
    rows = sortSearchRowsByQuery(rows, search);
    if (String(ordering || "").trim().toLowerCase() !== "-added") {
      rows = sortRowsByPopularity(rows, ordering);
    }
    const hasExtraFilters = !!String(dates || "").trim() || genreTokens.size > 0;
    count = hasExtraFilters
      ? offset + rows.length + (rows.length >= safePageSize ? safePageSize : 0)
      : Math.max(Number(searched.totalHits || 0), offset + rows.length);
    rows = rows.slice(0, safePageSize);
    rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(10, safePageSize));
  } else {
    const candidateTarget = Math.min(Math.max(offset + (safePageSize * 3) + 24, 96), 560);
    const candidates = await fetchCategoryCandidates(dates, candidateTarget);
    const popularCandidates = await fetchPopularSeedCandidates(POPULAR_SEED_BATCH_SIZE);
    const popularSearchCandidates = await fetchPopularSearchSeedCandidates();
    const genreSeedCandidates = buildGenreSeedCandidates(genres, Math.max(30, safePageSize * 3));
    const genreSearchCandidates = genreTokens.size
      ? await fetchGenreSearchCandidates(genres, Math.max(42, safePageSize * 4))
      : [];
    const blendedCandidates = [
      ...genreSeedCandidates,
      ...genreSearchCandidates,
      ...popularCandidates,
      ...popularSearchCandidates,
      ...candidates
    ].slice(0, Math.min(Math.max(offset + (safePageSize * 4) + 48, 160), 720));
    rows = dedupeRows(await hydrateRows(blendedCandidates));
    rows = filterRowsByDates(filterRowsByGenres(rows, genres), dates);
    rows = dedupeRows(rows);
    rows = sortRowsByPopularity(rows, ordering);
    const neededPoolSize = offset + safePageSize;
    if (rows.length < neededPoolSize) {
      const excludedIds = new Set(rows.map((row) => Number(row?.id || 0)).filter((id) => Number.isFinite(id) && id > 0));
      let backfillRows = await fetchSummaryBackfillRows(Math.max(neededPoolSize - rows.length, 0) + 8, excludedIds, genres);
      backfillRows = filterRowsByDates(filterRowsByGenres(backfillRows, genres), dates);
      rows = sortRowsByPopularity(dedupeRows([...rows, ...backfillRows]), ordering);
    }
    count = rows.length;
    rows = rows.slice(offset, offset + safePageSize);
    rows = await enrichRowsWithSpotlightScreenshots(rows, Math.min(12, safePageSize));
  }

  const payload = { count: Number(count || rows.length || 0), results: rows };
  writeTimedCache(listCache, cacheKey, payload, WIKI_LIST_TTL_MS);
  return payload;
}
