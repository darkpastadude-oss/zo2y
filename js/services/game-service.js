/**
 * GameService — Centralized Game Data Architecture
 * Handles fetching, searching, artwork resolution, normalization, and local caching.
 */
(() => {
  'use strict';

  const FALLBACK_IMAGE = '/newlogo.webp';

  const RAWGProvider = {
    async fetchTrending({ sort = 'popular', page = 1, pageSize = 40, signal }) {
      const currentYear = new Date().getFullYear();
      let ordering = sort === 'name' ? 'name' : '-released';
      let datesParam = '';
      if (sort === 'popular') {
        datesParam = `&dates=${currentYear - 1}-01-01,${currentYear + 1}-12-31`;
      } else if (sort === 'released') {
        datesParam = `&dates=${currentYear - 2}-01-01,${currentYear + 1}-12-31`;
      }

      const url = `/api/igdb/games?page=${page}&page_size=${pageSize}&ordering=${encodeURIComponent(ordering)}${datesParam}`;
      const res = await fetch(url, { headers: { accept: 'application/json' }, signal });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.results) ? data.results : [];
    },

    async search(query, signal) {
      if (!query || !query.trim()) return [];
      const searchUrl = new URL('/api/igdb/games', window.location.origin);
      searchUrl.searchParams.set('search', query.trim());
      searchUrl.searchParams.set('page', '1');
      searchUrl.searchParams.set('page_size', '40');
      const res = await fetch(searchUrl.toString(), { headers: { accept: 'application/json' }, signal });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.results) ? data.results : [];
    }
  };

  const SteamProvider = {
    getPortraitCover(steamAppId) {
      if (!steamAppId) return '';
      const num = String(steamAppId).replace(/\D/g, '');
      if (num.length >= 2) {
        return `https://steamcdn-a.akamaihd.net/steam/apps/${num}/library_600x900.jpg`;
      }
      return '';
    }
  };

  const SupabaseProvider = {
    async getClient() {
      if (window.ensureSharedSupabaseClient) {
        return await window.ensureSharedSupabaseClient();
      }
      return null;
    },

    async fetchLocalGames({ sort = 'popular', limit = 200 }) {
      const client = await this.getClient();
      if (!client) return [];
      try {
        let dbQuery = client.from('games').select('*');
        if (sort === 'released') {
          dbQuery = dbQuery.order('release_date', { ascending: false, nullsFirst: false }).limit(limit);
        } else if (sort === 'name') {
          dbQuery = dbQuery.order('title', { ascending: true, nullsFirst: false }).limit(limit);
        } else {
          dbQuery = dbQuery.order('rating_count', { ascending: false, nullsFirst: false }).order('rating', { ascending: false, nullsFirst: false }).limit(limit);
        }
        const { data, error } = await dbQuery;
        return (!error && Array.isArray(data)) ? data : [];
      } catch (_e) {
        return [];
      }
    }
  };

  const WikipediaProvider = {
    async search(query, signal) {
      if (window.__zo2yGamesShared?.searchGamesFromWikipedia) {
        try {
          const wikiGames = await window.__zo2yGamesShared.searchGamesFromWikipedia(query, signal);
          return Array.isArray(wikiGames) ? wikiGames : [];
        } catch (_e) {
          return [];
        }
      }
      return [];
    }
  };

  const GameService = {
    resolveCover(row) {
      const steamAppId = row?.extra?.steam_appid || row?.steam_appid || row?.steamId;
      const steamCover = SteamProvider.getPortraitCover(steamAppId);
      if (steamCover) return steamCover;

      const raw = String(row?.cover_url || row?.cover || row?.image || '').trim();
      if (raw && raw !== '[object Object]') {
        if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && !raw.startsWith('data:')) {
          const supabaseUrl = window.__ZO2Y_SUPABASE_CONFIG?.url || '';
          if (supabaseUrl) {
            return `${supabaseUrl}/storage/v1/object/public/game-assets/${raw}`;
          }
        }
        return raw.replace(/^http:\/\//i, 'https://');
      }

      const igdbCover = row?.extra?.cover?.url || row?.background_image;
      if (igdbCover && typeof igdbCover === 'string') {
        return igdbCover.startsWith('//') ? `https:${igdbCover}` : igdbCover.replace(/^http:\/\//i, 'https://');
      }

      return FALLBACK_IMAGE;
    },

    normalize(game) {
      const heroBg = game.hero_background || game.background_image || '';
      const heroSec = game.hero_background_secondary || game.background_image_additional || '';
      const name = game.title || game.name || 'Unknown Game';
      const firstReleaseDate = game.release_date || game.releaseDate || game.firstReleaseDate || '';

      return {
        id: String(game.id || ''),
        name: name,
        summary: game.description || game.summary || '',
        cover: this.resolveCover(game),
        hero_url: heroBg || heroSec || game.hero_url || '',
        hero_background: heroBg,
        hero_background_secondary: heroSec,
        firstReleaseDate: firstReleaseDate,
        rating: typeof game.rating === 'number' ? game.rating : 0,
        genres: Array.isArray(game.extra?.genres) ? game.extra.genres : (Array.isArray(game.genres) ? game.genres : []),
        source: game.source || 'api'
      };
    },

    async fetchTrending({ sort = 'popular', page = 1, pageSize = 40, signal }) {
      const rawgGames = await RAWGProvider.fetchTrending({ sort, page, pageSize, signal });
      const localGames = await SupabaseProvider.fetchLocalGames({ sort, limit: 100 });

      const merged = [];
      const seen = new Set();

      rawgGames.forEach((item) => {
        const normalized = this.normalize(item);
        if (normalized.id && !seen.has(normalized.id)) {
          seen.add(normalized.id);
          merged.push(normalized);
        }
      });

      localGames.forEach((item) => {
        const normalized = this.normalize(item);
        if (normalized.id && !seen.has(normalized.id)) {
          seen.add(normalized.id);
          merged.push(normalized);
        }
      });

      return merged;
    },

    async search(query, signal) {
      const trimmed = String(query || '').trim();
      if (!trimmed) return [];

      let rawgResults = await RAWGProvider.search(trimmed, signal);
      if (signal?.aborted) return [];

      if (!rawgResults.length) {
        rawgResults = await WikipediaProvider.search(trimmed, signal);
      }

      return rawgResults.map((item) => this.normalize(item));
    }
  };

  window.GameService = GameService;
})();
