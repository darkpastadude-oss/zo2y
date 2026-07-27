/**
 * GameService — Centralized Game Data Architecture
 * Handles fetching, searching, artwork resolution, normalization, and local caching.
 */
(() => {
  'use strict';

  const FALLBACK_IMAGE = '/newlogo.webp';

  const SteamProvider = {
    getPortraitCover(steamAppId) {
      if (!steamAppId) return '';
      const num = String(steamAppId).replace(/\D/g, '');
      if (num.length >= 2) {
        return `https://steamcdn-a.akamaihd.net/steam/apps/${num}/library_600x900.jpg`;
      }
      return '';
    },
    getHeaderHero(steamAppId) {
      if (!steamAppId) return '';
      const num = String(steamAppId).replace(/\D/g, '');
      if (num.length >= 2) {
        return `https://steamcdn-a.akamaihd.net/steam/apps/${num}/header.jpg`;
      }
      return '';
    }
  };

  const RAWGProvider = {
    async fetchTrending({ sort = 'popular', page = 1, pageSize = 40, signal }) {
      const todayStr = new Date().toISOString().split('T')[0];
      let ordering = '-added';
      let datesParam = `&dates=2022-01-01,${todayStr}`;
      
      if (sort === 'released') {
        ordering = '-released';
        datesParam = `&dates=2023-01-01,${todayStr}`;
      } else if (sort === 'rating') {
        ordering = '-rating';
        datesParam = `&dates=2020-01-01,${todayStr}`;
      } else if (sort === 'name') {
        ordering = 'name';
        datesParam = '';
      }

      const url = `/api/igdb/games?page=${page}&page_size=${pageSize}&ordering=${encodeURIComponent(ordering)}${datesParam}`;
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' }, signal });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.results) ? data.results : [];
      } catch (_err) {
        return [];
      }
    },

    async search(query, signal) {
      if (!query || !query.trim()) return [];
      const searchUrl = new URL('/api/igdb/games', window.location.origin);
      searchUrl.searchParams.set('search', query.trim());
      searchUrl.searchParams.set('page', '1');
      searchUrl.searchParams.set('page_size', '40');
      try {
        const res = await fetch(searchUrl.toString(), { headers: { accept: 'application/json' }, signal });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.results) ? data.results : [];
      } catch (_err) {
        return [];
      }
    },

    async getById(id, signal) {
      if (!id) return null;
      const url = `/api/igdb/games/${encodeURIComponent(id)}`;
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' }, signal });
        if (!res.ok) return null;
        return await res.json();
      } catch (_err) {
        return null;
      }
    }
  };

  const ENABLE_SUPABASE_GAMES_TABLE = false;

  const SupabaseProvider = {
    async getClient() {
      if (window.__ZO2Y_SUPABASE_CLIENT) return window.__ZO2Y_SUPABASE_CLIENT;
      if (window.ensureSharedSupabaseClient) {
        try {
          const client = await window.ensureSharedSupabaseClient();
          if (client) return client;
        } catch (_e) {}
      }
      if (window.supabase && window.__ZO2Y_SUPABASE_CONFIG) {
        try {
          const client = window.supabase.createClient(
            window.__ZO2Y_SUPABASE_CONFIG.url,
            window.__ZO2Y_SUPABASE_CONFIG.key,
            { auth: { persistSession: true, autoRefreshToken: true } }
          );
          window.__ZO2Y_SUPABASE_CLIENT = client;
          return client;
        } catch (_e) {}
      }
      return null;
    },

    async fetchLocalGames({ sort = 'popular', limit = 200 }) {
      if (!ENABLE_SUPABASE_GAMES_TABLE) return [];
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
    },

    async searchLocalGames(query, limit = 40) {
      if (!ENABLE_SUPABASE_GAMES_TABLE) return [];
      const client = await this.getClient();
      if (!client || !query) return [];
      try {
        const { data, error } = await client
          .from('games')
          .select('*')
          .ilike('title', `%${query.trim()}%`)
          .limit(limit);
        return (!error && Array.isArray(data)) ? data : [];
      } catch (_e) {
        return [];
      }
    },

    async getById(id) {
      if (!ENABLE_SUPABASE_GAMES_TABLE) return null;
      const client = await this.getClient();
      if (!client || !id) return null;
      try {
        const { data } = await client.from('games').select('*').eq('id', id).maybeSingle();
        return data || null;
      } catch (_e) {
        return null;
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
    _initialized: false,
    _initPromise: null,

    async init() {
      if (this._initialized) return true;
      if (this._initPromise) return this._initPromise;

      this._initPromise = (async () => {
        try {
          await SupabaseProvider.getClient();
        } catch (_e) {}
        this._initialized = true;
        return true;
      })();

      return this._initPromise;
    },

    resolveCover(row) {
      if (!row) return FALLBACK_IMAGE;

      const steamAppId = row?.extra?.steam_appid || row?.steam_appid || row?.steamId;
      const steamCover = SteamProvider.getPortraitCover(steamAppId);
      if (steamCover) return steamCover;

      const raw = String(row?.cover_url || row?.cover || row?.image || row?.poster_image || '').trim();
      if (raw && raw !== '[object Object]') {
        if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && !raw.startsWith('data:')) {
          const supabaseUrl = window.__ZO2Y_SUPABASE_CONFIG?.url || '';
          if (supabaseUrl) {
            return `${supabaseUrl}/storage/v1/object/public/game-assets/${raw}`;
          }
        }
        return raw.startsWith('//') ? `https:${raw}` : raw.replace(/^http:\/\//i, 'https://');
      }

      const bg = row?.hero_url || row?.hero_background || row?.background_image || row?.extra?.background_image || row?.extra?.cover?.url;
      if (bg && typeof bg === 'string' && bg !== '[object Object]') {
        return bg.startsWith('//') ? `https:${bg}` : bg.replace(/^http:\/\//i, 'https://');
      }

      return FALLBACK_IMAGE;
    },

    normalize(game) {
      if (!game) return null;
      const steamAppId = game?.extra?.steam_appid || game?.steam_appid || game?.steamId || '';
      const heroBg = game.hero_background || game.background_image || game.hero_url || SteamProvider.getHeaderHero(steamAppId) || '';
      const heroSec = game.hero_background_secondary || game.background_image_additional || '';
      const title = game.title || game.name || 'Unknown Game';
      const firstReleaseDate = game.release_date || game.released || game.releaseDate || game.firstReleaseDate || '';
      const id = String(game.id || game.slug || '');

      let genres = [];
      if (Array.isArray(game.extra?.genres)) genres = game.extra.genres;
      else if (Array.isArray(game.genres)) genres = game.genres;

      let platforms = [];
      if (Array.isArray(game.extra?.platforms)) platforms = game.extra.platforms;
      else if (Array.isArray(game.platforms)) platforms = game.platforms;

      let screenshots = [];
      if (Array.isArray(game.screenshots)) {
        screenshots = game.screenshots.map(s => typeof s === 'string' ? s : (s?.image || s?.url || '')).filter(Boolean);
      } else if (Array.isArray(game.extra?.screenshots)) {
        screenshots = game.extra.screenshots.map(s => typeof s === 'string' ? s : (s?.image || s?.url || '')).filter(Boolean);
      }

      return {
        id,
        title,
        name: title,
        slug: game.slug || '',
        summary: game.description || game.summary || game.description_raw || '',
        description: game.description || game.summary || game.description_raw || '',
        cover: this.resolveCover(game),
        cover_url: this.resolveCover(game),
        hero_url: heroBg || heroSec || '',
        hero_background: heroBg,
        hero_background_secondary: heroSec,
        screenshots: screenshots.slice(0, 12),
        firstReleaseDate,
        release_date: firstReleaseDate,
        rating: typeof game.rating === 'number' ? game.rating : 0,
        rating_count: game.ratings_count || game.rating_count || 0,
        genres,
        platforms,
        developers: game.developers || game.extra?.developers || [],
        publishers: game.publishers || game.extra?.publishers || [],
        source: game.source || (id.startsWith('rawg_') ? 'rawg' : 'supabase'),
        steam_appid: steamAppId,
        extra: game.extra || {}
      };
    },

    async fetchTrending({ sort = 'popular', page = 1, pageSize = 40, signal } = {}) {
      await this.init();

      // Load local Supabase games first for fast render
      const localGames = await SupabaseProvider.fetchLocalGames({ sort, limit: pageSize * 2 });
      const localNormalized = localGames.map(g => this.normalize(g)).filter(Boolean);

      // Query external RAWG Provider
      const rawgGames = await RAWGProvider.fetchTrending({ sort, page, pageSize, signal });
      const rawgNormalized = rawgGames.map(g => this.normalize(g)).filter(Boolean);

      // Merge results avoiding duplicate IDs (local cached curated games first)
      const merged = [];
      const seen = new Set();

      localNormalized.forEach((item) => {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });

      rawgNormalized.forEach((item) => {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });

      // Background persist new RAWG games to Supabase
      if (rawgGames.length && window.__zo2yGamesShared?.ensureGameInSupabase) {
        SupabaseProvider.getClient().then(client => {
          if (client) {
            rawgGames.slice(0, 15).forEach(raw => {
              window.__zo2yGamesShared.ensureGameInSupabase(client, raw).catch(() => {});
            });
          }
        });
      }

      return merged;
    },

    async search(query, signal) {
      await this.init();
      const trimmed = String(query || '').trim();
      if (!trimmed) return [];

      // Query local DB and external providers in parallel
      const [localResults, rawgResults] = await Promise.all([
        SupabaseProvider.searchLocalGames(trimmed, 20),
        RAWGProvider.search(trimmed, signal)
      ]);

      if (signal?.aborted) return [];

      let mergedRaw = [...rawgResults];

      // If RAWG returned zero results, fall back to Wikipedia search
      if (!mergedRaw.length) {
        const wikiResults = await WikipediaProvider.search(trimmed, signal);
        mergedRaw = [...wikiResults];
      }

      const merged = [];
      const seen = new Set();

      mergedRaw.map(g => this.normalize(g)).filter(Boolean).forEach(item => {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });

      localResults.map(g => this.normalize(g)).filter(Boolean).forEach(item => {
        if (item.id && !seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });

      // Background persist search results
      if (mergedRaw.length && window.__zo2yGamesShared?.ensureGameInSupabase) {
        SupabaseProvider.getClient().then(client => {
          if (client) {
            mergedRaw.slice(0, 10).forEach(raw => {
              window.__zo2yGamesShared.ensureGameInSupabase(client, raw).catch(() => {});
            });
          }
        });
      }

      return merged;
    },

    async getById(id, signal) {
      await this.init();
      if (!id) return null;

      // 1. Try Supabase first
      const cached = await SupabaseProvider.getById(id);
      let localGame = cached ? this.normalize(cached) : null;

      // 2. Fetch fresh detail from API
      const remote = await RAWGProvider.getById(id, signal);
      if (remote) {
        const remoteGame = this.normalize(remote);

        // Background update Supabase
        SupabaseProvider.getClient().then(client => {
          if (client && window.__zo2yGamesShared?.ensureGameInSupabase) {
            window.__zo2yGamesShared.ensureGameInSupabase(client, remote).catch(() => {});
          }
        });

        return remoteGame;
      }

      return localGame;
    }
  };

  window.GameService = GameService;
})();
