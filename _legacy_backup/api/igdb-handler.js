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

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();

  if (!section) {
    return res.json({
      ok: true,
      service: "igdb-lite",
      configured: false,
      source: "wikipedia"
    });
  }

  if (section === "genres") {
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
    const dates = String(query.dates || "").trim();
    const genres = String(query.genres || "").trim();
    const titleOnly = isTruthyFlag(query.title_only || query.search_title_only || query.titleOnly);
    const spotlight = isTruthyFlag(query.spotlight || query.include_spotlight || query.includeSpotlight);

    try {
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

      const results = Array.isArray(payload?.results) ? payload.results : [];
      return res.json({
        count: Number(payload?.count || results.length),
        page,
        page_size: pageSize,
        results,
        sources: {
          wikipedia: true,
          igdb: false,
          rawg: false,
          gamebrain: false
        }
      });
    } catch (error) {
      return res.status(502).json({
        count: 0,
        page,
        page_size: pageSize,
        results: [],
        message: "Wikipedia games request failed.",
        detail: String(error?.message || error || "")
      });
    }
  }

  if (section === "games" && pathParts.length >= 2) {
    const rawId = String(pathParts[1]).trim();
    let id = parseInt(rawId, 10);
    
    // First try the ID directly if it looks like a number.
    let detail = null;
    let detailError = null;
    
    if (Number.isFinite(id) && id > 0 && !rawId.includes(":")) {
      try {
        detail = await fetchWikipediaGameDetailsById(id);
      } catch (e) {
        detailError = e;
      }
    }

    // If direct fetch failed or it's a composite ID, try resolving the ID via Supabase title
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
      } catch (e) {
        // Ignore fallback failure
      }
    }

    if (!detail) {
      if (detailError) {
         return res.status(502).json({ message: "Game detail request failed.", detail: String(detailError?.message || detailError || "") });
      }
      return res.status(404).json({ message: "Game not found." });
    }

    return res.json(detail);
  }

  return res.status(404).json({ message: "Not found" });
}

