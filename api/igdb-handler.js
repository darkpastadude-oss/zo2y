import {
  WIKIPEDIA_GAME_GENRES,
  fetchWikipediaGameDetailsById,
  fetchWikipediaGamesList
} from "../backend/lib/wiki-games-provider.js";

import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isTruthyFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}

function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "")
    .split("/")
    .filter(Boolean);
}

const RAWG_API_CACHE = new Map();

async function fetchFromRAWG(endpoint, params, apiKey) {
  const url = new URL(`https://api.rawg.io/api/${endpoint}`);
  url.searchParams.set("key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  
  const cacheKey = url.toString();
  if (RAWG_API_CACHE.has(cacheKey)) {
    return RAWG_API_CACHE.get(cacheKey);
  }

  const response = await fetch(url.toString(), {
    headers: { "accept": "application/json" }
  });
  
  if (!response.ok) {
    throw new Error(`RAWG error: ${response.status} ${await response.text()}`);
  }
  
  const data = await response.json();
  RAWG_API_CACHE.set(cacheKey, data);
  setTimeout(() => RAWG_API_CACHE.delete(cacheKey), 60000 * 30); // 30 min cache
  return data;
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  
  // Grab the RAWG key from env
  const RAWG_API_KEY = req.env?.RAWG_API_KEY || globalThis.process?.env?.RAWG_API_KEY || "";

  if (!section) {
    return res.json({
      ok: true,
      service: "rawg-proxy",
      configured: !!RAWG_API_KEY,
      source: RAWG_API_KEY ? "rawg" : "wikipedia"
    });
  }

  if (section === "genres") {
    if (RAWG_API_KEY) {
      try {
        const data = await fetchFromRAWG("genres", {}, RAWG_API_KEY);
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.json({
          count: data.count,
          results: data.results.map(g => ({
            id: g.id,
            name: g.name,
            slug: g.slug
          }))
        });
      } catch (e) {
        // Fallback to Wikipedia
      }
    }
    return res.json({
      count: WIKIPEDIA_GAME_GENRES.length,
      results: WIKIPEDIA_GAME_GENRES
    });
  }

  if (section === "games" && pathParts.length === 1) {
    const page = clampInt(query.page, 1, 100000, 1);
    const pageSize = clampInt(query.page_size, 1, 80, 20);
    const search = String(query.search || "").trim().slice(0, 120);
    const ordering = String(query.ordering || "-added").trim();
    
    if (RAWG_API_KEY) {
      try {
        const params = {
          page,
          page_size: pageSize,
          search: search || undefined,
          ordering: search ? undefined : ordering
        };
        const data = await fetchFromRAWG("games", params, RAWG_API_KEY);
        
        const mappedResults = (data.results || []).map(g => ({
          id: `rawg_${g.id}`,
          title: g.name,
          slug: g.slug,
          description: "", // RAWG summary is not in list endpoint
          cover: (g.short_screenshots && g.short_screenshots.length > 1) ? g.short_screenshots[1].image : (g.background_image || ""),
          hero_url: g.background_image || "",
          firstReleaseDate: g.released,
          rating: g.rating,
          rating_count: g.ratings_count,
          genres: g.genres?.map(gn => ({ id: gn.id, name: gn.name, slug: gn.slug })) || [],
          platforms: g.platforms?.map(p => ({ id: p.platform.id, name: p.platform.name, slug: p.platform.slug })) || [],
          source: "rawg",
          steam_appid: "" // Not available in list endpoint
        }));

        res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");
        return res.json({
          count: data.count,
          page,
          page_size: pageSize,
          results: mappedResults,
          sources: { wikipedia: false, igdb: false, rawg: true }
        });
      } catch (error) {
        console.error("RAWG error", error);
        // Fallback to wikipedia
      }
    }

    // WIKIPEDIA FALLBACK
    const dates = String(query.dates || "").trim();
    const genres = String(query.genres || "").trim();
    const titleOnly = isTruthyFlag(query.title_only || query.search_title_only || query.titleOnly);
    const spotlight = isTruthyFlag(query.spotlight || query.include_spotlight || query.includeSpotlight);

    try {
      const payload = await fetchWikipediaGamesList({
        page, pageSize, search, ordering, dates, genres, titleOnly, spotlight
      });

      const results = Array.isArray(payload?.results) ? payload.results : [];
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results,
        sources: { wikipedia: true, igdb: false, rawg: false }
      });
    } catch (error) {
      return res.status(502).json({
        count: 0, page, page_size: pageSize, results: [],
        message: "Wikipedia games request failed.",
        detail: String(error?.message || error || "")
      });
    }
  }

  if (section === "games" && pathParts.length >= 2) {
    const rawId = String(pathParts[1]).trim();
    const isRawg = rawId.startsWith("rawg_");
    const id = isRawg ? parseInt(rawId.replace("rawg_", ""), 10) : parseInt(rawId, 10);
    
    function formatRawgGameResponse(game, outId) {
      let steamId = "";
      if (game.stores) {
        const steamStore = game.stores.find(s => s.store?.slug === "steam");
        if (steamStore && steamStore.url) {
          const match = steamStore.url.match(/app\/(\d+)/);
          if (match) steamId = match[1];
        }
      }
      
      let coverUrl = "";
      if (steamId) {
        coverUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/library_600x900.jpg`;
      } else if (game.background_image) {
        coverUrl = game.background_image;
      } else {
        coverUrl = game.background_image_additional || "";
      }
      
      const heroUrl = game.background_image_additional || game.background_image || "";

      return {
        id: outId,
        title: game.name,
        slug: game.slug,
        description: game.description_raw || game.description,
        cover: coverUrl,
        hero_url: heroUrl,
        firstReleaseDate: game.released,
        rating: game.rating,
        rating_count: game.ratings_count,
        genres: game.genres?.map(gn => ({ id: gn.id, name: gn.name, slug: gn.slug })) || [],
        platforms: game.platforms?.map(p => ({ id: p.platform.id, name: p.platform.name, slug: p.platform.slug })) || [],
        steam_appid: steamId,
        source: "rawg",
        extra: { steam_appid: steamId, hero_url: heroUrl }
      };
    }

    if (RAWG_API_KEY && isRawg && !Number.isNaN(id)) {
      try {
        const game = await fetchFromRAWG(`games/${id}`, {}, RAWG_API_KEY);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=259200");
        return res.json(formatRawgGameResponse(game, `rawg_${game.id}`));
      } catch (e) {
        return res.status(404).json({ message: "Game not found in RAWG." });
      }
    }

    // WIKIPEDIA ID TO RAWG UPGRADE
    if (RAWG_API_KEY && !isRawg && !rawId.includes(":")) {
      try {
        let searchTitle = "";
        try {
          const client = await getSupabaseAdminClient();
          if (client) {
            const { data } = await client.from('games').select('title').eq('id', rawId).single();
            if (data && data.title) searchTitle = data.title;
          }
        } catch(e) {}
        
        if (!searchTitle && Number.isFinite(id)) {
          const wikiDetail = await fetchWikipediaGameDetailsById(id);
          if (wikiDetail && wikiDetail.name) searchTitle = wikiDetail.name;
        }

        if (!searchTitle && Number.isNaN(id) && rawId.startsWith("wiki_")) {
          searchTitle = rawId.replace("wiki_", "").replace(/_/g, " ");
        }

        if (searchTitle) {
          const list = await fetchFromRAWG("games", { search: searchTitle, page_size: 1 }, RAWG_API_KEY);
          if (list.results && list.results.length > 0) {
            const rawgId = list.results[0].id;
            const game = await fetchFromRAWG(`games/${rawgId}`, {}, RAWG_API_KEY);
            res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=259200");
            return res.json(formatRawgGameResponse(game, rawId));
          }
        }
      } catch (e) {
        console.error("UPGRADE ERROR", e);
        // silently fallback to wikipedia
      }
    }

    // WIKIPEDIA FALLBACK
    let detail = null;
    let detailError = null;
    
    if (Number.isFinite(id) && id > 0 && !rawId.includes(":")) {
      try {
        detail = await fetchWikipediaGameDetailsById(id);
      } catch (e) {
        detailError = e;
      }
    }

    if (!detail) {
      try {
        const client = await getSupabaseAdminClient();
        if (client) {
          const { data } = await client.from('games').select('title').eq('id', rawId).single();
          if (data && data.title) {
            const list = await fetchWikipediaGamesList({ search: data.title, pageSize: 1, titleOnly: true });
            if (list && list.results && list.results.length > 0) {
              const wikiId = list.results[0].id;
              if (wikiId && wikiId !== id) {
                detail = await fetchWikipediaGameDetailsById(wikiId);
              }
            }
          }
        }
      } catch (e) { }
    }

    if (!detail) {
      if (detailError) {
         return res.status(502).json({ message: "Game detail request failed.", detail: String(detailError?.message || detailError || "") });
      }
      return res.status(404).json({ message: "Game not found." });
    }

    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=259200");
    return res.json(detail);
  }

  return res.status(404).json({ message: "Not found" });
}
