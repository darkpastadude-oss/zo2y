import express from "express";

const router = express.Router();

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GENRE_CACHE_TTL_MS = 1000 * 60 * 60;
const RAWG_API_BASE = "https://api.rawg.io/api";
const RAWG_ID_OFFSET = 9_000_000_000_000;
const RAWG_CACHE_TTL_MS = 1000 * 60 * 5;
const RAWG_BACKOFF_MS = 1000 * 60 * 2;
const STEAM_API_BASE = "https://store.steampowered.com/api";
const STEAM_ID_OFFSET = 8_000_000_000_000;
const STEAM_LIST_CACHE_TTL_MS = 1000 * 60 * 3;
const STEAM_DETAIL_CACHE_TTL_MS = 1000 * 60 * 10;

let tokenCache = {
  accessToken: "",
  expiresAt: 0
};
let igdbTokenRefreshPromise = null;

let genreCache = {
  items: [],
  byId: new Map(),
  bySlug: new Map(),
  expiresAt: 0
};

let rawgRequestCache = new Map();
let rawgDisabledUntil = 0;
let steamListCache = new Map();
let steamDetailCache = new Map();

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function escapeIgdbText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .trim();
}

function chunkArray(items, size = 300) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function uniqNumbers(values) {
  const set = new Set();
  (values || []).forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) set.add(n);
  });
  return [...set];
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

function imageUrl(imageId, size = "t_1080p") {
  const id = String(imageId || "").trim();
  if (!id) return "";
  return `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;
}

function pickFirstImage(game, coverMap, screenshotMap, artworkMap) {
  const screenshotId = Array.isArray(game?.screenshots) ? game.screenshots[0] : null;
  const artworkId = Array.isArray(game?.artworks) ? game.artworks[0] : null;
  const coverId = game?.cover;
  return (
    screenshotMap.get(Number(screenshotId)) ||
    artworkMap.get(Number(artworkId)) ||
    coverMap.get(Number(coverId)) ||
    ""
  );
}

function mapEsrbRatingName(ratingValue) {
  const rating = Number(ratingValue);
  const map = {
    6: "RP",
    7: "EC",
    8: "E",
    9: "E10+",
    10: "T",
    11: "M",
    12: "AO"
  };
  return map[rating] || "";
}

function guessStoreName(urlValue) {
  const url = String(urlValue || "").toLowerCase();
  if (!url) return "";
  if (url.includes("steampowered.com")) return "Steam";
  if (url.includes("epicgames.com")) return "Epic Games";
  if (url.includes("gog.com")) return "GOG";
  if (url.includes("xbox.com")) return "Xbox";
  if (url.includes("playstation.com")) return "PlayStation";
  if (url.includes("nintendo.com")) return "Nintendo";
  if (url.includes("itch.io")) return "itch.io";
  return "";
}

function normalizeGameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function yearFromRelease(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const year = text.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

function nameYearKey(name, releaseDate) {
  const normalized = normalizeGameKey(name);
  if (!normalized) return "";
  const year = yearFromRelease(releaseDate);
  return year ? `${normalized}|${year}` : normalized;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function toNumberOrNull(value) {
  return isFiniteNumber(value) ? Number(value) : null;
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

function encodeSteamId(appId) {
  const id = Number(appId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return STEAM_ID_OFFSET + id;
}

function decodeSteamId(value) {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= STEAM_ID_OFFSET || id >= RAWG_ID_OFFSET) return null;
  const decoded = id - STEAM_ID_OFFSET;
  if (!Number.isFinite(decoded) || decoded <= 0) return null;
  return decoded;
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

function isRawgEnabled() {
  return !!getRawgKey() && Date.now() >= rawgDisabledUntil;
}

function mapOrderingToRawg(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "-released";
  if (ordering === "-rating") return "-rating";
  if (ordering === "-metacritic") return "-metacritic";
  return "-added";
}

function toRawgGenresParam(genresRaw) {
  const tokens = String(genresRaw || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return "";
  return tokens.filter((token) => !/^\d+$/.test(token)).join(",");
}

function mapRawgGenres(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(row?.id || 0),
      name: String(row?.name || "").trim(),
      slug: String(row?.slug || "").trim().toLowerCase()
    }))
    .filter((row) => row.id > 0 && row.name);
}

function mapRawgPlatformRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const name = String(row?.platform?.name || row?.name || "").trim();
      return name ? { platform: { name } } : null;
    })
    .filter(Boolean);
}

function mapRawgNameRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const name = String(row?.name || "").trim();
      return name ? { name } : null;
    })
    .filter(Boolean);
}

function mapRawgStores(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const name = String(row?.store?.name || row?.name || "").trim();
      return name ? { store: { name } } : null;
    })
    .filter(Boolean);
}

function mapRawgScreenshots(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row, index) => {
      const id = Number(row?.id || index + 1);
      const image = String(row?.image || "").trim();
      if (!image) return null;
      return { id: Number.isFinite(id) && id > 0 ? id : index + 1, image };
    })
    .filter(Boolean);
}

function pickRawgBackground(game) {
  const direct = String(game?.background_image || game?.background_image_additional || "").trim();
  if (direct) return direct;
  const firstShot = (Array.isArray(game?.short_screenshots) ? game.short_screenshots : [])
    .map((row) => String(row?.image || "").trim())
    .find(Boolean);
  return firstShot || "";
}

function pickRawgYoutubeUrl(game) {
  const direct = String(game?.youtube_url || "").trim();
  if (direct) return direct;
  const clip = String(game?.clip?.clip || game?.clip?.clips?.full || "").trim();
  if (/youtu\.?be/i.test(clip)) return clip;
  return "";
}

function mergeNamedRows(primaryRows, secondaryRows) {
  const merged = [];
  const seen = new Set();
  [...(Array.isArray(primaryRows) ? primaryRows : []), ...(Array.isArray(secondaryRows) ? secondaryRows : [])]
    .forEach((row) => {
      const name = String(row?.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({ name });
    });
  return merged;
}

function mergeStoreRows(primaryRows, secondaryRows) {
  const merged = [];
  const seen = new Set();
  [...(Array.isArray(primaryRows) ? primaryRows : []), ...(Array.isArray(secondaryRows) ? secondaryRows : [])]
    .forEach((row) => {
      const name = String(row?.store?.name || row?.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({ store: { name } });
    });
  return merged;
}

function mergeGenreRows(primaryRows, secondaryRows) {
  const merged = [];
  const seen = new Set();
  [...(Array.isArray(primaryRows) ? primaryRows : []), ...(Array.isArray(secondaryRows) ? secondaryRows : [])]
    .forEach((row) => {
      const id = Number(row?.id || 0);
      const name = String(row?.name || "").trim();
      const slug = String(row?.slug || "").trim().toLowerCase();
      const key = id > 0 ? `id:${id}` : `name:${name.toLowerCase()}`;
      if (!name || seen.has(key)) return;
      seen.add(key);
      merged.push({ id: id > 0 ? id : 0, name, slug });
    });
  return merged;
}

function mergeScreenshotRows(primaryRows, secondaryRows) {
  const merged = [];
  const seen = new Set();
  [...(Array.isArray(primaryRows) ? primaryRows : []), ...(Array.isArray(secondaryRows) ? secondaryRows : [])]
    .forEach((row, index) => {
      const image = String(row?.image || "").trim();
      if (!image) return;
      const key = image.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const id = Number(row?.id || index + 1);
      merged.push({ id: Number.isFinite(id) && id > 0 ? id : index + 1, image });
    });
  return merged;
}

function normalizeImageUrls(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

function mapRawgListGame(game) {
  const rawgId = Number(game?.id || 0);
  const encodedId = encodeRawgId(rawgId);
  const backgroundImage = pickRawgBackground(game);
  const screenshots = mapRawgScreenshots(game?.short_screenshots || []);
  const screenshotUrls = normalizeImageUrls(screenshots.map((row) => row.image));
  const coverImage = backgroundImage || (screenshotUrls[0] || "");
  const heroImage = screenshotUrls[0] || backgroundImage || coverImage;

  return {
    id: encodedId || rawgId,
    rawg_id: rawgId || null,
    name: String(game?.name || "Game"),
    slug: String(game?.slug || ""),
    released: String(game?.released || ""),
    cover: coverImage || "",
    hero: heroImage || "",
    screenshots: screenshotUrls,
    background_image: backgroundImage,
    short_screenshots: screenshots,
    rating: toNumberOrNull(game?.rating),
    ratings_count: Number(game?.ratings_count || 0),
    metacritic: toNumberOrNull(game?.metacritic),
    genres: mapRawgGenres(game?.genres || []),
    platforms: mapRawgPlatformRows(game?.platforms || []),
    source: "rawg"
  };
}

function mapRawgDetailGame(game, screenshotRows = []) {
  const rawgId = Number(game?.id || 0);
  const encodedId = encodeRawgId(rawgId);
  const listScreens = mapRawgScreenshots(game?.short_screenshots || []);
  const detailScreens = mapRawgScreenshots(screenshotRows);
  const screenshots = mergeScreenshotRows(listScreens, detailScreens);
  const bg = pickRawgBackground(game) || (screenshots[0] ? screenshots[0].image : "");
  const screenshotUrls = normalizeImageUrls(screenshots.map((row) => row.image));
  const coverImage = bg || (screenshotUrls[0] || "");
  const heroImage = screenshotUrls[0] || bg || coverImage;

  return {
    id: encodedId || rawgId,
    rawg_id: rawgId || null,
    name: String(game?.name || "Game"),
    slug: String(game?.slug || ""),
    description_raw: String(game?.description_raw || game?.description || "").trim(),
    description: String(game?.description || game?.description_raw || "").trim(),
    released: String(game?.released || ""),
    playtime: toNumberOrNull(game?.playtime),
    cover: coverImage || "",
    hero: heroImage || "",
    screenshots: screenshotUrls,
    background_image: bg,
    short_screenshots: screenshots,
    genres: mapRawgGenres(game?.genres || []),
    rating: toNumberOrNull(game?.rating),
    ratings_count: Number(game?.ratings_count || 0),
    metacritic: toNumberOrNull(game?.metacritic),
    esrb_rating: String(game?.esrb_rating?.name || "").trim() ? { name: String(game.esrb_rating.name).trim() } : null,
    platforms: mapRawgPlatformRows(game?.platforms || []),
    developers: mapRawgNameRows(game?.developers || []),
    publishers: mapRawgNameRows(game?.publishers || []),
    stores: mapRawgStores(game?.stores || []),
    website: String(game?.website || "").trim(),
    reddit_url: String(game?.reddit_url || "").trim(),
    clip: game?.clip?.clip || game?.clip?.clips?.full ? {
      clip: String(game?.clip?.clip || game?.clip?.clips?.full || "").trim()
    } : null,
    youtube_url: pickRawgYoutubeUrl(game)
  };
}

function mergeGameListRows(igdbRow, rawgRow) {
  if (!rawgRow) return igdbRow;
  const mergedScreenshots = normalizeImageUrls([
    ...(Array.isArray(igdbRow?.screenshots) ? igdbRow.screenshots : []),
    ...(Array.isArray(rawgRow?.screenshots) ? rawgRow.screenshots : []),
    ...mergeScreenshotRows(igdbRow?.short_screenshots || [], rawgRow?.short_screenshots || []).map((row) => row.image)
  ]);
  const coverImage = String(igdbRow?.cover || "").trim() || String(rawgRow?.cover || "").trim() || String(igdbRow?.background_image || "").trim() || String(rawgRow?.background_image || "").trim();
  const heroImage = String(igdbRow?.hero || "").trim() || String(rawgRow?.hero || "").trim() || mergedScreenshots[0] || String(igdbRow?.background_image || "").trim() || String(rawgRow?.background_image || "").trim() || coverImage;
  return {
    ...igdbRow,
    rawg_id: rawgRow.rawg_id || null,
    cover: coverImage || "",
    hero: heroImage || "",
    screenshots: mergedScreenshots,
    background_image: heroImage || coverImage || "",
    short_screenshots: mergeScreenshotRows(igdbRow?.short_screenshots || [], rawgRow?.short_screenshots || []),
    metacritic: isFiniteNumber(igdbRow?.metacritic) ? Number(igdbRow.metacritic) : toNumberOrNull(rawgRow?.metacritic),
    rating: isFiniteNumber(igdbRow?.rating) ? Number(igdbRow.rating) : toNumberOrNull(rawgRow?.rating),
    ratings_count: Math.max(Number(igdbRow?.ratings_count || 0), Number(rawgRow?.ratings_count || 0)),
    genres: mergeGenreRows(igdbRow?.genres || [], rawgRow?.genres || []),
    platforms: mapRawgPlatformRows(rawgRow?.platforms || [])
  };
}

function mergeGameDetailRows(igdbRow, rawgRow) {
  if (!rawgRow) return igdbRow;

  const primaryDesc = String(igdbRow?.description_raw || igdbRow?.description || "").trim();
  const fallbackDesc = String(rawgRow?.description_raw || rawgRow?.description || "").trim();
  const mergedScreenshots = normalizeImageUrls([
    ...(Array.isArray(igdbRow?.screenshots) ? igdbRow.screenshots : []),
    ...(Array.isArray(rawgRow?.screenshots) ? rawgRow.screenshots : []),
    ...mergeScreenshotRows(igdbRow?.short_screenshots || [], rawgRow?.short_screenshots || []).map((row) => row.image)
  ]);
  const coverImage = String(igdbRow?.cover || "").trim() || String(rawgRow?.cover || "").trim() || String(igdbRow?.background_image || "").trim() || String(rawgRow?.background_image || "").trim();
  const heroImage = String(igdbRow?.hero || "").trim() || String(rawgRow?.hero || "").trim() || mergedScreenshots[0] || String(igdbRow?.background_image || "").trim() || String(rawgRow?.background_image || "").trim() || coverImage;

  return {
    ...igdbRow,
    rawg_id: rawgRow.rawg_id || null,
    description_raw: primaryDesc || fallbackDesc,
    description: String(igdbRow?.description || "").trim() || String(rawgRow?.description || fallbackDesc || "").trim(),
    playtime: igdbRow?.playtime ?? rawgRow?.playtime ?? null,
    cover: coverImage || "",
    hero: heroImage || "",
    screenshots: mergedScreenshots,
    background_image: heroImage || coverImage || "",
    short_screenshots: mergeScreenshotRows(igdbRow?.short_screenshots || [], rawgRow?.short_screenshots || []),
    genres: mergeGenreRows(igdbRow?.genres || [], rawgRow?.genres || []),
    metacritic: isFiniteNumber(igdbRow?.metacritic) ? Number(igdbRow.metacritic) : toNumberOrNull(rawgRow?.metacritic),
    rating: isFiniteNumber(igdbRow?.rating) ? Number(igdbRow.rating) : toNumberOrNull(rawgRow?.rating),
    ratings_count: Math.max(Number(igdbRow?.ratings_count || 0), Number(rawgRow?.ratings_count || 0)),
    esrb_rating: igdbRow?.esrb_rating?.name ? igdbRow.esrb_rating : rawgRow?.esrb_rating || null,
    platforms: mergeStoreRows(
      (igdbRow?.platforms || []).map((row) => ({ store: { name: String(row?.platform?.name || "").trim() } })),
      (rawgRow?.platforms || []).map((row) => ({ store: { name: String(row?.platform?.name || "").trim() } }))
    ).map((row) => ({ platform: { name: row.store.name } })),
    developers: mergeNamedRows(igdbRow?.developers || [], rawgRow?.developers || []),
    publishers: mergeNamedRows(igdbRow?.publishers || [], rawgRow?.publishers || []),
    stores: mergeStoreRows(igdbRow?.stores || [], rawgRow?.stores || []),
    website: String(igdbRow?.website || "").trim() || String(rawgRow?.website || "").trim(),
    reddit_url: String(igdbRow?.reddit_url || "").trim() || String(rawgRow?.reddit_url || "").trim(),
    clip: igdbRow?.clip || rawgRow?.clip || null,
    youtube_url: String(igdbRow?.youtube_url || "").trim() || String(rawgRow?.youtube_url || "").trim()
  };
}

function buildRawgMatchIndexes(rawgRows) {
  const bySlug = new Map();
  const byName = new Map();
  const byNameYear = new Map();

  (Array.isArray(rawgRows) ? rawgRows : []).forEach((row) => {
    const slug = String(row?.slug || "").trim().toLowerCase();
    if (slug && !bySlug.has(slug)) bySlug.set(slug, row);

    const nameKey = normalizeGameKey(row?.name || "");
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, row);

    const nameAndYear = nameYearKey(row?.name || "", row?.released || "");
    if (nameAndYear && !byNameYear.has(nameAndYear)) byNameYear.set(nameAndYear, row);
  });

  return { bySlug, byName, byNameYear };
}

function findRawgMatchForIgdb(igdbRow, index) {
  if (!index) return null;
  const slug = String(igdbRow?.slug || "").trim().toLowerCase();
  if (slug && index.bySlug.has(slug)) return index.bySlug.get(slug);

  const nameAndYear = nameYearKey(igdbRow?.name || "", igdbRow?.released || "");
  if (nameAndYear && index.byNameYear.has(nameAndYear)) return index.byNameYear.get(nameAndYear);

  const nameOnly = normalizeGameKey(igdbRow?.name || "");
  if (nameOnly && index.byName.has(nameOnly)) return index.byName.get(nameOnly);

  return null;
}

function readTimedCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (!entry.expiresAt || Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeTimedCache(cache, key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + Math.max(1, Number(ttlMs) || 1)
  });
}

function parseSteamReleaseDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const directMs = Date.parse(raw.replace(/,/g, ""));
  if (Number.isFinite(directMs)) {
    return new Date(directMs).toISOString().slice(0, 10);
  }
  const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return `${yearMatch[0]}-01-01`;
  }
  return "";
}

function toPlainText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapSteamPlatforms(item = {}) {
  const rows = [];
  if (item?.windows || item?.windows_available) rows.push({ platform: { name: "PC (Windows)" } });
  if (item?.mac || item?.mac_available) rows.push({ platform: { name: "macOS" } });
  if (item?.linux || item?.linux_available) rows.push({ platform: { name: "Linux" } });
  return rows;
}

function mapSteamListGame(item) {
  const appId = Number(item?.id || item?.steam_appid || 0);
  if (!Number.isFinite(appId) || appId <= 0) return null;
  const encodedId = encodeSteamId(appId);
  const coverImage = String(item?.large_capsule_image || item?.small_capsule_image || item?.header_image || "").trim();
  const heroImage = String(item?.header_image || coverImage).trim();
  const releaseDate = parseSteamReleaseDate(item?.release_date?.date || item?.release_date || "");
  const screenshotRows = heroImage ? [{ id: 1, image: heroImage }] : [];

  return {
    id: encodedId || appId,
    steam_appid: appId,
    name: String(item?.name || "Game").trim() || "Game",
    slug: normalizeGameKey(item?.name || "").replace(/\s+/g, "-"),
    released: releaseDate,
    cover: coverImage || heroImage || "",
    hero: heroImage || coverImage || "",
    screenshots: normalizeImageUrls(screenshotRows.map((row) => row.image)),
    background_image: heroImage || coverImage || "",
    short_screenshots: screenshotRows,
    rating: null,
    ratings_count: 0,
    metacritic: null,
    genres: [],
    platforms: mapSteamPlatforms(item),
    source: "steam"
  };
}

function mapSteamDetailGame(appId, details) {
  const encodedId = encodeSteamId(appId);
  const screenshots = (Array.isArray(details?.screenshots) ? details.screenshots : [])
    .map((row, index) => {
      const image = String(row?.path_full || row?.path_thumbnail || "").trim();
      if (!image) return null;
      return { id: Number(row?.id || index + 1), image };
    })
    .filter(Boolean)
    .slice(0, 16);
  const screenshotUrls = normalizeImageUrls(screenshots.map((row) => row.image));

  const headerImage = String(details?.header_image || "").trim();
  const capsuleImage = String(details?.capsule_image || details?.capsule_imagev5 || "").trim();
  const backgroundImage = String(details?.background_raw || details?.background || "").trim();
  const coverImage = headerImage || capsuleImage || screenshotUrls[0] || "";
  const heroImage = backgroundImage || screenshotUrls[0] || headerImage || capsuleImage || coverImage;

  const metacritic = Number(details?.metacritic?.score || 0);
  const recommendationCount = Number(details?.recommendations?.total || 0);
  const clipUrl = String(
    details?.movies?.[0]?.mp4?.max ||
    details?.movies?.[0]?.mp4?.["480"] ||
    details?.movies?.[0]?.webm?.max ||
    ""
  ).trim();

  return {
    id: encodedId || appId,
    steam_appid: appId,
    name: String(details?.name || "Game").trim() || "Game",
    slug: normalizeGameKey(details?.name || "").replace(/\s+/g, "-"),
    description_raw: toPlainText(details?.detailed_description || details?.short_description || ""),
    description: toPlainText(details?.detailed_description || details?.short_description || ""),
    released: parseSteamReleaseDate(details?.release_date?.date || ""),
    playtime: null,
    cover: coverImage || "",
    hero: heroImage || coverImage || "",
    screenshots: screenshotUrls,
    background_image: heroImage || coverImage || "",
    short_screenshots: screenshots,
    genres: (Array.isArray(details?.genres) ? details.genres : [])
      .map((genre) => {
        const name = String(genre?.description || genre?.name || "").trim();
        if (!name) return null;
        const id = Number(genre?.id || 0);
        return { id: Number.isFinite(id) && id > 0 ? id : 0, name, slug: normalizeGameKey(name).replace(/\s+/g, "-") };
      })
      .filter(Boolean),
    rating: null,
    ratings_count: Number.isFinite(recommendationCount) && recommendationCount > 0 ? recommendationCount : 0,
    metacritic: Number.isFinite(metacritic) && metacritic > 0 ? metacritic : null,
    esrb_rating: null,
    platforms: mapSteamPlatforms(details?.platforms || details || {}),
    developers: (Array.isArray(details?.developers) ? details.developers : [])
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .map((name) => ({ name })),
    publishers: (Array.isArray(details?.publishers) ? details.publishers : [])
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .map((name) => ({ name })),
    stores: [{ store: { name: "Steam" } }],
    website: String(details?.website || "").trim(),
    reddit_url: "",
    clip: clipUrl ? { clip: clipUrl } : null,
    youtube_url: ""
  };
}

async function fetchSteamFeaturedItems() {
  const cacheKey = "featured:us:en";
  const cached = readTimedCache(steamListCache, cacheKey);
  if (cached) return cached;

  const url = new URL(`${STEAM_API_BASE}/featuredcategories`);
  url.searchParams.set("cc", "us");
  url.searchParams.set("l", "en");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "User-Agent": "zo2y/1.0"
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Steam featured error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const pools = [
    json?.top_sellers?.items,
    json?.new_releases?.items,
    json?.specials?.items,
    json?.featured_win?.items,
    json?.featured_mac?.items,
    json?.featured_linux?.items
  ];

  const deduped = [];
  const seen = new Set();
  pools.forEach((rows) => {
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const id = Number(row?.id || row?.steam_appid || 0);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return;
      seen.add(id);
      deduped.push(row);
    });
  });

  writeTimedCache(steamListCache, cacheKey, deduped, STEAM_LIST_CACHE_TTL_MS);
  return deduped;
}

async function fetchSteamGamesList({ page = 1, pageSize = 20, search = "" }) {
  const rows = await fetchSteamFeaturedItems();
  const query = normalizeGameKey(search);
  const filtered = rows.filter((row) => {
    const mapped = mapSteamListGame(row);
    if (!mapped) return false;
    if (!query) return true;
    return normalizeGameKey(mapped.name).includes(query);
  });

  const mappedRows = filtered
    .map((row) => mapSteamListGame(row))
    .filter(Boolean);

  const offset = (Math.max(1, Number(page) || 1) - 1) * Math.max(1, Number(pageSize) || 20);
  const paged = mappedRows.slice(offset, offset + Math.max(1, Number(pageSize) || 20));

  return {
    count: mappedRows.length,
    results: paged
  };
}

async function fetchSteamGameDetailsByAppId(appId) {
  const safeId = Number(appId);
  if (!Number.isFinite(safeId) || safeId <= 0) return null;

  const cacheKey = `detail:${safeId}`;
  const cached = readTimedCache(steamDetailCache, cacheKey);
  if (cached) return cached;

  const url = new URL(`${STEAM_API_BASE}/appdetails`);
  url.searchParams.set("appids", String(safeId));
  url.searchParams.set("cc", "us");
  url.searchParams.set("l", "en");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "User-Agent": "zo2y/1.0"
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Steam detail error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const root = json?.[String(safeId)];
  if (!root?.success || !root?.data) return null;

  const mapped = mapSteamDetailGame(safeId, root.data);
  writeTimedCache(steamDetailCache, cacheKey, mapped, STEAM_DETAIL_CACHE_TTL_MS);
  return mapped;
}

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const { clientId, clientSecret, staticAccessToken } = getIgdbCredentials();
  if (!clientId) {
    throw new Error("Missing IGDB credentials. Set TWITCH_CLIENT_ID (or IGDB_CLIENT_ID).");
  }

  if (!clientSecret) {
    if (staticAccessToken) return staticAccessToken;
    throw new Error("Missing IGDB credentials. Set TWITCH_CLIENT_SECRET or TWITCH_ACCESS_TOKEN.");
  }

  if (!forceRefresh && igdbTokenRefreshPromise) {
    return igdbTokenRefreshPromise;
  }

  igdbTokenRefreshPromise = (async () => {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials"
    });

    const res = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!res.ok) {
      const msg = await res.text();
      if (staticAccessToken) return staticAccessToken;
      throw new Error(`Twitch token error ${res.status}: ${msg}`);
    }

    const json = await res.json();
    const accessToken = String(json?.access_token || "");
    const expiresIn = Number(json?.expires_in || 0);
    if (!accessToken || !expiresIn) {
      if (staticAccessToken) return staticAccessToken;
      throw new Error("Invalid Twitch token response.");
    }

    tokenCache = {
      accessToken,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
    return accessToken;
  })();

  try {
    return await igdbTokenRefreshPromise;
  } finally {
    igdbTokenRefreshPromise = null;
  }
}

async function igdbRequest(endpoint, query, retry = true, forceRefresh = false) {
  const { clientId } = getIgdbCredentials();
  if (!clientId) {
    throw new Error("Missing IGDB credentials. Set TWITCH_CLIENT_ID (or IGDB_CLIENT_ID).");
  }
  const accessToken = await getAccessToken(forceRefresh);
  const res = await fetch(`${IGDB_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    },
    body: query
  });

  if (res.status === 401 && retry) {
    tokenCache = { accessToken: "", expiresAt: 0 };
    return igdbRequest(endpoint, query, false, true);
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`IGDB ${endpoint} error ${res.status}: ${msg}`);
  }

  const text = await res.text();
  if (!text.trim()) return [];
  return JSON.parse(text);
}

async function fetchMapByIds(endpoint, ids, fields, mapper) {
  const map = new Map();
  const uniqueIds = uniqNumbers(ids);
  if (!uniqueIds.length) return map;

  const chunks = chunkArray(uniqueIds, 250);
  for (const part of chunks) {
    const query = `fields ${fields}; where id = (${part.join(",")}); limit ${part.length};`;
    const rows = await igdbRequest(endpoint, query);
    (rows || []).forEach((row) => {
      const id = Number(row?.id);
      if (Number.isFinite(id)) map.set(id, mapper ? mapper(row) : row);
    });
  }
  return map;
}

async function ensureGenreCache() {
  if (genreCache.items.length && Date.now() < genreCache.expiresAt) return genreCache;
  const rows = await igdbRequest("genres", "fields id,name,slug; sort name asc; limit 500;");
  const items = (rows || [])
    .map((row) => ({
      id: Number(row?.id),
      name: String(row?.name || ""),
      slug: String(row?.slug || "").toLowerCase()
    }))
    .filter((row) => Number.isFinite(row.id) && row.name);

  const byId = new Map();
  const bySlug = new Map();
  items.forEach((item) => {
    byId.set(item.id, item);
    if (item.slug) bySlug.set(item.slug, item.id);
  });

  genreCache = {
    items,
    byId,
    bySlug,
    expiresAt: Date.now() + GENRE_CACHE_TTL_MS
  };
  return genreCache;
}

async function resolveGenreIds(rawGenreValue) {
  const tokens = String(rawGenreValue || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return [];

  const cache = await ensureGenreCache();
  const ids = new Set();
  tokens.forEach((token) => {
    if (/^\d+$/.test(token)) {
      ids.add(Number(token));
      return;
    }
    const mapped = cache.bySlug.get(token);
    if (mapped) ids.add(mapped);
  });
  return [...ids].filter((id) => Number.isFinite(id) && id > 0);
}

function buildWhereClause({ genreIds, startUnix, endUnix }) {
  const clauses = ["version_parent = null"];
  if (Array.isArray(genreIds) && genreIds.length) {
    clauses.push(`genres = (${genreIds.join(",")})`);
  }
  if (Number.isFinite(startUnix)) clauses.push(`first_release_date >= ${startUnix}`);
  if (Number.isFinite(endUnix)) clauses.push(`first_release_date <= ${endUnix}`);
  return clauses.join(" & ");
}

function sortClauseFromOrdering(orderingRaw) {
  const ordering = String(orderingRaw || "-added").trim().toLowerCase();
  if (ordering === "-released") return "first_release_date desc";
  if (ordering === "-rating") return "total_rating desc";
  if (ordering === "-metacritic") return "aggregated_rating desc";
  return "total_rating_count desc";
}

function pruneRawgCache() {
  const now = Date.now();
  [...rawgRequestCache.keys()].forEach((key) => {
    const entry = rawgRequestCache.get(key);
    if (!entry || now >= entry.expiresAt) rawgRequestCache.delete(key);
  });
  while (rawgRequestCache.size > 180) {
    const firstKey = rawgRequestCache.keys().next().value;
    if (!firstKey) break;
    rawgRequestCache.delete(firstKey);
  }
}

async function rawgRequest(path, params = {}, opts = {}) {
  if (!isRawgEnabled()) return null;

  const key = getRawgKey();
  if (!key) return null;

  const url = new URL(`${RAWG_API_BASE}${String(path || "").startsWith("/") ? path : `/${String(path || "")}`}`);
  url.searchParams.set("key", key);
  Object.entries(params || {}).forEach(([paramKey, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(paramKey, String(value));
  });

  const cacheKey = url.toString();
  const ttlMs = clampInt(opts.ttlMs, 1000, 1000 * 60 * 60, RAWG_CACHE_TTL_MS);

  if (opts.useCache !== false) {
    pruneRawgCache();
    const cached = rawgRequestCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) return cached.payload;
  }

  const res = await fetch(cacheKey);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      rawgDisabledUntil = Date.now() + RAWG_BACKOFF_MS;
    }
    const body = await res.text();
    throw new Error(`RAWG error ${res.status}: ${body}`);
  }

  const payload = await res.json();
  rawgRequestCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttlMs
  });
  pruneRawgCache();
  return payload;
}

async function fetchRawgGamesList({ page, pageSize, ordering, search, dates, genres }) {
  const params = {
    page,
    page_size: pageSize,
    ordering: mapOrderingToRawg(ordering)
  };
  if (search) params.search = search;
  if (dates) params.dates = dates;
  if (genres) params.genres = genres;

  const json = await rawgRequest("/games", params, { ttlMs: 1000 * 60 });
  if (!json) return null;
  const rows = Array.isArray(json.results) ? json.results : [];
  return {
    count: Number(json.count || rows.length || 0),
    results: rows.map(mapRawgListGame).filter((row) => Number(row?.id) > 0)
  };
}

async function fetchRawgGameDetailsByRawgId(rawgId) {
  const id = Number(rawgId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const [details, screenshots] = await Promise.all([
    rawgRequest(`/games/${id}`, {}, { ttlMs: 1000 * 60 * 10 }),
    rawgRequest(`/games/${id}/screenshots`, { page_size: 20 }, { ttlMs: 1000 * 60 * 10 }).catch(() => null)
  ]);

  if (!details || typeof details !== "object") return null;
  return mapRawgDetailGame(details, screenshots?.results || []);
}

async function fetchRawgGameDetailsByName(name, releaseDate = "") {
  const query = String(name || "").trim();
  if (!query) return null;

  const params = {
    search: query,
    search_precise: true,
    page_size: 6
  };

  const year = yearFromRelease(releaseDate);
  if (year) params.dates = `${year}-01-01,${year}-12-31`;

  const listJson = await rawgRequest("/games", params, { ttlMs: 1000 * 60 * 10 });
  const rows = Array.isArray(listJson?.results) ? listJson.results : [];
  if (!rows.length) return null;

  const normalizedTarget = normalizeGameKey(query);
  const withYear = rows.find((row) => {
    if (!year) return false;
    return nameYearKey(row?.name || "", row?.released || "") === `${normalizedTarget}|${year}`;
  });
  const exact = rows.find((row) => normalizeGameKey(row?.name || "") === normalizedTarget);
  const best = withYear || exact || rows[0];
  if (!best?.id) return null;

  return fetchRawgGameDetailsByRawgId(best.id);
}

async function fetchIgdbGamesList({ page, pageSize, orderingRaw, search, whereClause }) {
  if (!hasIgdbCredentials()) {
    const err = new Error("IGDB credentials are not configured.");
    err.code = "IGDB_DISABLED";
    throw err;
  }

  const offset = (page - 1) * pageSize;
  const ordering = sortClauseFromOrdering(orderingRaw);
  let totalCount = 0;

  try {
    const countParts = [];
    if (search) countParts.push(`search "${escapeIgdbText(search)}";`);
    if (whereClause) countParts.push(`where ${whereClause};`);
    const countJson = await igdbRequest("games/count", countParts.join(" "));
    if (countJson && typeof countJson.count === "number") {
      totalCount = Number(countJson.count);
    }
  } catch (_countErr) {}

  const queryParts = [
    "fields id,name,slug,first_release_date,total_rating,total_rating_count,aggregated_rating,aggregated_rating_count,cover,cover.image_id,genres,screenshots,screenshots.image_id,artworks,artworks.image_id;"
  ];
  if (search) queryParts.push(`search "${escapeIgdbText(search)}";`);
  if (whereClause) queryParts.push(`where ${whereClause};`);
  if (!search) queryParts.push(`sort ${ordering};`);
  queryParts.push(`limit ${pageSize};`);
  queryParts.push(`offset ${offset};`);

  const games = await igdbRequest("games", queryParts.join(" "));
  const genreData = await ensureGenreCache();

  const coverIds = uniqNumbers((games || []).map((game) => game?.cover));
  const screenshotIds = uniqNumbers((games || []).flatMap((game) => game?.screenshots || []));
  const artworkIds = uniqNumbers((games || []).flatMap((game) => game?.artworks || []));

  const [coverMap, screenshotMap, artworkMap] = await Promise.all([
    fetchMapByIds("covers", coverIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("screenshots", screenshotIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("artworks", artworkIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p"))
  ]);

    const results = (games || []).map((game) => {
      const rating100 = Number(game?.total_rating ?? game?.aggregated_rating ?? 0);
      const ratingCount = Number(game?.total_rating_count ?? game?.aggregated_rating_count ?? 0);
      const mappedGenres = (game?.genres || [])
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
            return imageUrl(entry.image_id, "t_screenshot_big");
          }
          return screenshotMap.get(Number(entry));
        })
        .filter(Boolean)
        .map((image, index) => ({ id: index + 1, image }))
        .slice(0, 12);
      const screenshotUrls = normalizeImageUrls(screenshotRows.map((row) => row.image));
      const heroImage = screenshotUrls[0] || pickFirstImage(game, coverMap, screenshotMap, artworkMap) || coverImage || "";

      return {
        id: Number(game?.id || 0),
        name: game?.name || "Game",
        slug: game?.slug || "",
        released: toReleaseDate(game?.first_release_date),
        cover: coverImage || "",
        hero: heroImage || "",
        screenshots: screenshotUrls,
        background_image: heroImage || coverImage || "",
        short_screenshots: screenshotRows,
        rating: rating100 ? Number((rating100 / 20).toFixed(1)) : null,
      ratings_count: ratingCount || 0,
      metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
      genres: mappedGenres
    };
  });

  return {
    count: totalCount || results.length,
    results
  };
}

async function fetchIgdbGameDetails(gameId) {
  if (!hasIgdbCredentials()) {
    const err = new Error("IGDB credentials are not configured.");
    err.code = "IGDB_DISABLED";
    throw err;
  }

  const gameRows = await igdbRequest(
    "games",
    `fields id,name,slug,summary,storyline,first_release_date,total_rating,total_rating_count,aggregated_rating,aggregated_rating_count,cover,cover.image_id,genres,screenshots,screenshots.image_id,artworks,artworks.image_id,platforms,involved_companies,websites,videos,age_ratings; where id = ${gameId}; limit 1;`
  );
  const game = Array.isArray(gameRows) ? gameRows[0] : null;
  if (!game) {
    const err = new Error("Game not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const genreData = await ensureGenreCache();
  const coverIds = uniqNumbers([game?.cover]);
  const screenshotIds = uniqNumbers(game?.screenshots || []);
  const artworkIds = uniqNumbers(game?.artworks || []);
  const platformIds = uniqNumbers(game?.platforms || []);
  const involvedCompanyIds = uniqNumbers(game?.involved_companies || []);
  const websiteIds = uniqNumbers(game?.websites || []);
  const videoIds = uniqNumbers(game?.videos || []);
  const ageRatingIds = uniqNumbers(game?.age_ratings || []);

  const [coverMap, screenshotMap, artworkMap, platformMap, involvedMap, websiteMap, videoMap, ageRatingMap] = await Promise.all([
    fetchMapByIds("covers", coverIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("screenshots", screenshotIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("artworks", artworkIds, "id,image_id", (row) => imageUrl(row?.image_id, "t_1080p")),
    fetchMapByIds("platforms", platformIds, "id,name"),
    fetchMapByIds("involved_companies", involvedCompanyIds, "id,company,developer,publisher"),
    fetchMapByIds("websites", websiteIds, "id,url,category"),
    fetchMapByIds("game_videos", videoIds, "id,video_id,name"),
    fetchMapByIds("age_ratings", ageRatingIds, "id,rating,category")
  ]);

  const companyIds = uniqNumbers([...involvedMap.values()].map((row) => row?.company));
  const companyMap = await fetchMapByIds("companies", companyIds, "id,name");

  const mappedGenres = (game?.genres || [])
    .map((genreId) => genreData.byId.get(Number(genreId)))
    .filter(Boolean)
    .map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug
    }));

  const involvedRows = (game?.involved_companies || [])
    .map((id) => involvedMap.get(Number(id)))
    .filter(Boolean);
  const developers = [];
  const publishers = [];
  involvedRows.forEach((row) => {
    const company = companyMap.get(Number(row?.company));
    const companyName = String(company?.name || "").trim();
    if (!companyName) return;
    if (row?.developer) developers.push({ name: companyName });
    if (row?.publisher) publishers.push({ name: companyName });
  });

  const websiteRows = (game?.websites || [])
    .map((id) => websiteMap.get(Number(id)))
    .filter(Boolean);
  let website = "";
  let redditUrl = "";
  const storeNames = new Set();
  websiteRows.forEach((row) => {
    const url = String(row?.url || "").trim();
    if (!url) return;
    const isReddit = /reddit\.com/i.test(url);
    if (isReddit) {
      if (!redditUrl) redditUrl = url;
    } else if (!website) {
      website = url;
    }
    const store = guessStoreName(url);
    if (store) storeNames.add(store);
  });

  const videoRows = (game?.videos || [])
    .map((id) => videoMap.get(Number(id)))
    .filter(Boolean);
  const firstVideo = videoRows[0];
  const youtubeUrl = firstVideo?.video_id ? `https://www.youtube.com/watch?v=${firstVideo.video_id}` : "";

  const esrbAge = (game?.age_ratings || [])
    .map((id) => ageRatingMap.get(Number(id)))
    .find((row) => Number(row?.category) === 1) || (game?.age_ratings || [])
    .map((id) => ageRatingMap.get(Number(id)))
    .find(Boolean);
  const esrbName = mapEsrbRatingName(esrbAge?.rating);

  const totalRating = Number(game?.total_rating ?? game?.aggregated_rating ?? 0);
  const totalRatingCount = Number(game?.total_rating_count ?? game?.aggregated_rating_count ?? 0);
  const coverImage = game?.cover?.image_id
    ? imageUrl(game.cover.image_id, "t_cover_big")
    : (coverMap.get(Number(game?.cover)) || "");
  const backgroundImage = pickFirstImage(game, coverMap, screenshotMap, artworkMap) || coverImage || "";
  const descriptionRaw = String(game?.summary || game?.storyline || "").trim();

  const screenshotRows = (Array.isArray(game?.screenshots) ? game.screenshots : [])
    .map((entry) => {
      if (entry && typeof entry === "object" && entry.image_id) {
        return imageUrl(entry.image_id, "t_screenshot_big");
      }
      return screenshotMap.get(Number(entry));
    })
    .filter(Boolean)
    .map((image, index) => ({ id: index + 1, image }))
    .slice(0, 16);
  const screenshotUrls = normalizeImageUrls(screenshotRows.map((row) => row.image));
  const heroImage = screenshotUrls[0] || backgroundImage || coverImage || "";

  return {
    id: Number(game?.id || 0),
    name: game?.name || "Game",
    slug: game?.slug || "",
    description_raw: descriptionRaw,
    description: descriptionRaw,
    released: toReleaseDate(game?.first_release_date),
    playtime: null,
    cover: coverImage || "",
    hero: heroImage || "",
    screenshots: screenshotUrls,
    background_image: heroImage || coverImage || "",
    short_screenshots: screenshotRows,
    genres: mappedGenres,
    rating: totalRating ? Number((totalRating / 20).toFixed(1)) : null,
    ratings_count: totalRatingCount || 0,
    metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
    esrb_rating: esrbName ? { name: esrbName } : null,
    platforms: (game?.platforms || [])
      .map((id) => platformMap.get(Number(id)))
      .filter(Boolean)
      .map((platform) => ({ platform: { name: platform?.name || "Platform" } })),
    developers,
    publishers,
    stores: [...storeNames].map((name) => ({ store: { name } })),
    website,
    reddit_url: redditUrl,
    clip: null,
    youtube_url: youtubeUrl
  };
}

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "igdb-proxy",
    routes: ["/genres", "/games", "/games/:id"]
  });
});

router.get("/genres", async (req, res) => {
  try {
    const pageSize = clampInt(req.query.page_size, 1, 100, 50);
    const cache = await ensureGenreCache();
    res.json({
      count: cache.items.length,
      results: cache.items.slice(0, pageSize).map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load genres from IGDB.", error: String(error?.message || error) });
  }
});

router.get("/games", async (req, res) => {
  try {
    const page = clampInt(req.query.page, 1, 100000, 1);
    const pageSize = clampInt(req.query.page_size, 1, 50, 20);
    const orderingRaw = String(req.query.ordering || "-added").trim().toLowerCase();
    const search = String(req.query.search || "").trim().slice(0, 100);
    const datesRaw = String(req.query.dates || "").trim();
    const { startUnix, endUnix } = parseDatesRange(datesRaw);
    const rawgGenres = toRawgGenresParam(req.query.genres);

    let genreIds = [];
    try {
      genreIds = await resolveGenreIds(req.query.genres);
    } catch (_genreErr) {
      genreIds = [];
    }
    const whereClause = buildWhereClause({ genreIds, startUnix, endUnix });

    let igdbPayload = null;
    let igdbError = null;
    if (hasIgdbCredentials()) {
      try {
        igdbPayload = await fetchIgdbGamesList({
          page,
          pageSize,
          orderingRaw,
          search,
          whereClause
        });
      } catch (error) {
        igdbError = error;
      }
    }

    const igdbRows = Array.isArray(igdbPayload?.results) ? igdbPayload.results : [];
    if (igdbRows.length > 0) {
      return res.json({
        count: Number(igdbPayload?.count || igdbRows.length || 0),
        page,
        page_size: pageSize,
        results: igdbRows.slice(0, pageSize),
        sources: {
          igdb: true,
          rawg: false
        }
      });
    }

    let rawgPayload = null;
    let rawgError = null;
    if (isRawgEnabled()) {
      try {
        rawgPayload = await fetchRawgGamesList({
          page,
          pageSize,
          ordering: orderingRaw,
          search,
          dates: datesRaw,
          genres: rawgGenres
        });
      } catch (error) {
        rawgError = error;
      }
    }

    const rawgRows = Array.isArray(rawgPayload?.results) ? rawgPayload.results : [];

    if (!rawgRows.length) {
      if (igdbError) throw igdbError;
      if (rawgError) throw rawgError;
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

    const results = rawgRows.slice(0, pageSize);
    const count = Number(rawgPayload?.count || results.length || 0);

    return res.json({
      count,
      page,
      page_size: pageSize,
      results,
      sources: {
        igdb: false,
        rawg: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load games.", error: String(error?.message || error) });
  }
});

router.get("/games/:id", async (req, res) => {
  try {
    const requestedId = Number(req.params.id);
    if (!Number.isFinite(requestedId) || requestedId <= 0) {
      return res.status(400).json({ message: "Invalid game id." });
    }
    const rawgId = decodeRawgId(requestedId);
    if (rawgId) {
      const rawgPayload = await fetchRawgGameDetailsByRawgId(rawgId);
      if (rawgPayload) return res.json(rawgPayload);
    }

    const igdbPayload = await fetchIgdbGameDetails(requestedId);

    if (isRawgEnabled()) {
      try {
        const rawgPayload = await fetchRawgGameDetailsByName(igdbPayload?.name, igdbPayload?.released);
        if (rawgPayload) {
          return res.json(mergeGameDetailRows(igdbPayload, rawgPayload));
        }
      } catch (_rawgErr) {}
    }

    return res.json(igdbPayload);
  } catch (error) {
    if (error?.code === "NOT_FOUND") {
      return res.status(404).json({ message: "Game not found." });
    }
    res.status(500).json({ message: "Failed to load game details.", error: String(error?.message || error) });
  }
});

export default router;

