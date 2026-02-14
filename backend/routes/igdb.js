import express from "express";

const router = express.Router();

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const GENRE_CACHE_TTL_MS = 1000 * 60 * 60;

let tokenCache = {
  accessToken: "",
  expiresAt: 0
};

let genreCache = {
  items: [],
  byId: new Map(),
  bySlug: new Map(),
  expiresAt: 0
};

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

async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID || process.env.IGDB_CLIENT_ID || "";
  const clientSecret = process.env.TWITCH_CLIENT_SECRET || process.env.IGDB_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    throw new Error("Missing IGDB credentials. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.");
  }

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
    throw new Error(`Twitch token error ${res.status}: ${msg}`);
  }

  const json = await res.json();
  const accessToken = String(json?.access_token || "");
  const expiresIn = Number(json?.expires_in || 0);
  if (!accessToken || !expiresIn) {
    throw new Error("Invalid Twitch token response.");
  }

  tokenCache = {
    accessToken,
    expiresAt: Date.now() + (expiresIn * 1000)
  };
  return accessToken;
}

async function igdbRequest(endpoint, query, retry = true) {
  const clientId = process.env.TWITCH_CLIENT_ID || process.env.IGDB_CLIENT_ID || "";
  const accessToken = await getAccessToken();
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
    return igdbRequest(endpoint, query, false);
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
    const offset = (page - 1) * pageSize;
    const ordering = sortClauseFromOrdering(req.query.ordering);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const { startUnix, endUnix } = parseDatesRange(req.query.dates);
    const genreIds = await resolveGenreIds(req.query.genres);
    const whereClause = buildWhereClause({ genreIds, startUnix, endUnix });

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
      "fields id,name,slug,first_release_date,total_rating,total_rating_count,aggregated_rating,aggregated_rating_count,cover,genres,screenshots,artworks;"
    ];
    if (search) queryParts.push(`search "${escapeIgdbText(search)}";`);
    if (whereClause) queryParts.push(`where ${whereClause};`);
    queryParts.push(`sort ${ordering};`);
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

      return {
        id: Number(game?.id || 0),
        name: game?.name || "Game",
        slug: game?.slug || "",
        released: toReleaseDate(game?.first_release_date),
        background_image: pickFirstImage(game, coverMap, screenshotMap, artworkMap),
        rating: rating100 ? Number((rating100 / 20).toFixed(1)) : null,
        ratings_count: ratingCount || 0,
        metacritic: Number.isFinite(Number(game?.aggregated_rating)) ? Math.round(Number(game.aggregated_rating)) : null,
        genres: mappedGenres
      };
    });

    res.json({
      count: totalCount || results.length,
      page,
      page_size: pageSize,
      results
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load games from IGDB.", error: String(error?.message || error) });
  }
});

router.get("/games/:id", async (req, res) => {
  try {
    const gameId = Number(req.params.id);
    if (!Number.isFinite(gameId) || gameId <= 0) {
      return res.status(400).json({ message: "Invalid game id." });
    }

    const gameRows = await igdbRequest(
      "games",
      `fields id,name,slug,summary,storyline,first_release_date,total_rating,total_rating_count,aggregated_rating,aggregated_rating_count,cover,genres,screenshots,artworks,platforms,involved_companies,websites,videos,age_ratings; where id = ${gameId}; limit 1;`
    );
    const game = Array.isArray(gameRows) ? gameRows[0] : null;
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
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
    const backgroundImage = pickFirstImage(game, coverMap, screenshotMap, artworkMap);
    const descriptionRaw = String(game?.summary || game?.storyline || "").trim();

    res.json({
      id: Number(game?.id || 0),
      name: game?.name || "Game",
      slug: game?.slug || "",
      description_raw: descriptionRaw,
      description: descriptionRaw,
      released: toReleaseDate(game?.first_release_date),
      playtime: null,
      background_image: backgroundImage,
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
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load game details from IGDB.", error: String(error?.message || error) });
  }
});

export default router;
