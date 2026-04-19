(() => {
  if (window.__zo2yGamesShared) return;

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const FALLBACK_IMAGE = '/newlogo.webp';

  let supabaseClient = null;

  function toHttpsUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  }

  function normalizeGameCoverUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '[object Object]') return '';
    if (raw.startsWith('//')) return `https:${raw}`;
    return toHttpsUrl(raw);
  }

  function resolveGameCover(row) {
    return normalizeGameCoverUrl(row?.cover_url || row?.cover || row?.image || '');
  }

  function resolveGameHero(row, fallbackCover = '') {
    const hero = normalizeGameCoverUrl(row?.hero_url || row?.hero || row?.background || '');
    return hero || fallbackCover;
  }

  function isLikelyLogoOnlyGameArt(url) {
    const src = String(url || '').toLowerCase();
    if (!src) return false;
    return src.includes('logo') && !src.includes('cover') && !src.includes('poster');
  }

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'zo2y-auth-v1'
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  async function loadFeaturedGames(signal, options = {}) {
    const limit = Math.max(1, Number(options.limit || 24));
    const client = ensureSupabase();
    if (!client) return [];

    try {
      const query = client
        .from('games')
        .select('id,title,release_date,description,cover_url,hero_url,rating,rating_count,extra,source,slug')
        .order('rating_count', { ascending: false, nullsFirst: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(Math.max(limit * 10, 120));

      const result = signal ? await query.abortSignal(signal) : await query;
      const data = Array.isArray(result?.data) ? result.data : [];
      if (!data.length) return [];

      const seen = new Set();
      const items = [];
      for (const row of data) {
        if (!row) continue;
        const id = String(row?.id || row?.slug || '').trim();
        const title = String(row?.title || 'Game').trim();
        if (!id || !title) continue;
        if (seen.has(id)) continue;
        seen.add(id);

        const cover = resolveGameCover(row);
        const hero = resolveGameHero(row, cover);
        const visual = cover || hero || FALLBACK_IMAGE;
        const plain = isLikelyLogoOnlyGameArt(cover) || !hero || hero === cover;
        const releaseDate = String(row?.release_date || '').trim();
        const ratingValue = Number(row?.rating || 0);
        const genres = Array.isArray(row?.extra?.genres) ? row.extra.genres : [];
        const genreText = genres.length
          ? genres.slice(0, 2).map((entry) => String(entry?.name || entry || '').trim()).filter(Boolean).join(' | ')
          : 'Video Game';
        const ratingText = Number.isFinite(ratingValue) && ratingValue > 0 ? `${ratingValue.toFixed(1)}/5` : '';

        items.push({
          mediaType: 'game',
          itemId: id,
          title,
          subtitle: releaseDate ? releaseDate.slice(0, 10) : '',
          extra: [genreText, ratingText].filter(Boolean).join(' | '),
          image: visual,
          backgroundImage: hero || visual,
          spotlightImage: hero || visual,
          spotlightMediaImage: visual,
          spotlightMediaFit: plain ? 'contain' : 'contain',
          spotlightMediaShape: plain ? 'landscape' : 'poster',
          gameCardMode: plain ? 'plain' : 'hero',
          fallbackImage: FALLBACK_IMAGE,
          href: `game.html?id=${encodeURIComponent(String(id))}`
        });

        if (items.length >= limit) break;
      }

      return items;
    } catch (_err) {
      return [];
    }
  }

  window.__zo2yGamesShared = {
    loadFeaturedGames
  };
})();

