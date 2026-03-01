(() => {
  const DESKTOP_BREAKPOINT = 1025;
  const SIDEBAR_STORAGE_KEY = 'zo2y_home_sidebar_collapsed_v1';
  const REVIEW_ROTATE_MS = 6200;
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
  const REVIEW_LIMIT = 22;

  const REVIEW_SOURCES = [
    { mediaType: 'movie', table: 'movie_reviews', idField: 'movie_id', label: 'Movie' },
    { mediaType: 'tv', table: 'tv_reviews', idField: 'tv_id', label: 'TV' },
    { mediaType: 'anime', table: 'anime_reviews', idField: 'anime_id', label: 'Anime' },
    { mediaType: 'game', table: 'game_reviews', idField: 'game_id', label: 'Game' },
    { mediaType: 'book', table: 'book_reviews', idField: 'book_id', label: 'Book' },
    { mediaType: 'music', table: 'music_reviews', idField: 'track_id', label: 'Music' },
    { mediaType: 'travel', table: 'travel_reviews', idField: 'country_code', label: 'Travel' }
  ];

  const SIDEBAR_MEDIA_TYPES = ['movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'restaurant'];
  const SIDEBAR_MEDIA_LABEL = {
    movie: 'Movies',
    tv: 'TV',
    anime: 'Anime',
    game: 'Games',
    book: 'Books',
    music: 'Music',
    travel: 'Travel',
    restaurant: 'Places'
  };
  const SIDEBAR_MEDIA_ROUTE = {
    movie: 'movies.html',
    tv: 'tvshows.html',
    anime: 'animes.html',
    game: 'games.html',
    book: 'books.html',
    music: 'music.html',
    travel: 'travel.html',
    restaurant: 'restraunts.html'
  };
  const SIDEBAR_MEDIA_PROFILE_ROUTE = {
    movie: { tab: 'movies', collection: 'movie' },
    tv: { tab: 'tv', collection: 'tv' },
    anime: { tab: 'anime', collection: 'anime' },
    game: { tab: 'games', collection: 'game' },
    book: { tab: 'books', collection: 'book' },
    music: { tab: 'music', collection: 'music' },
    travel: { tab: 'travel', collection: 'travel' },
    restaurant: { tab: 'restaurants', collection: 'restaurant' }
  };

  const SOURCE_BY_MEDIA = Object.fromEntries(REVIEW_SOURCES.map((source) => [source.mediaType, source]));
  let lastLiveReviewSlides = [];

  const imdbTopMovies = [
    {
      mediaType: 'movie',
      itemId: '278',
      title: 'The Shawshank Redemption',
      subtitle: 'IMDb 9.3',
      extra: '#1 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
      href: 'movie.html?id=278'
    },
    {
      mediaType: 'movie',
      itemId: '238',
      title: 'The Godfather',
      subtitle: 'IMDb 9.2',
      extra: '#2 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      href: 'movie.html?id=238'
    },
    {
      mediaType: 'movie',
      itemId: '155',
      title: 'The Dark Knight',
      subtitle: 'IMDb 9.0',
      extra: '#3 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      href: 'movie.html?id=155'
    },
    {
      mediaType: 'movie',
      itemId: '240',
      title: 'The Godfather Part II',
      subtitle: 'IMDb 9.0',
      extra: '#4 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
      href: 'movie.html?id=240'
    },
    {
      mediaType: 'movie',
      itemId: '389',
      title: '12 Angry Men',
      subtitle: 'IMDb 9.0',
      extra: '#5 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg',
      href: 'movie.html?id=389'
    },
    {
      mediaType: 'movie',
      itemId: '424',
      title: 'Schindler\'s List',
      subtitle: 'IMDb 9.0',
      extra: '#6 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
      href: 'movie.html?id=424'
    },
    {
      mediaType: 'movie',
      itemId: '122',
      title: 'The Return of the King',
      subtitle: 'IMDb 9.0',
      extra: '#7 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
      href: 'movie.html?id=122'
    },
    {
      mediaType: 'movie',
      itemId: '680',
      title: 'Pulp Fiction',
      subtitle: 'IMDb 8.9',
      extra: '#8 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      href: 'movie.html?id=680'
    },
    {
      mediaType: 'movie',
      itemId: '429',
      title: 'The Good, the Bad and the Ugly',
      subtitle: 'IMDb 8.8',
      extra: '#9 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg',
      href: 'movie.html?id=429'
    },
    {
      mediaType: 'movie',
      itemId: '550',
      title: 'Fight Club',
      subtitle: 'IMDb 8.8',
      extra: '#10 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      href: 'movie.html?id=550'
    }
  ];

  const awardWinningGameSeeds = [
    {
      title: 'Baldur\'s Gate 3',
      subtitle: 'Game of the Year 2023',
      extra: 'The Game Awards'
    },
    {
      title: 'Elden Ring',
      subtitle: 'Game of the Year 2022',
      extra: 'The Game Awards'
    },
    {
      title: 'It Takes Two',
      subtitle: 'Game of the Year 2021',
      extra: 'The Game Awards'
    },
    {
      title: 'The Last of Us Part II',
      subtitle: 'Game of the Year 2020',
      extra: 'The Game Awards'
    },
    {
      title: 'Sekiro: Shadows Die Twice',
      subtitle: 'Game of the Year 2019',
      extra: 'The Game Awards'
    },
    {
      title: 'Hades',
      subtitle: 'Best Indie 2020',
      extra: 'Golden Joystick Awards'
    },
    {
      title: 'Disco Elysium',
      subtitle: 'Best Narrative 2019',
      extra: 'The Game Awards'
    },
    {
      title: 'Portal 2',
      subtitle: 'BAFTA Best Game',
      extra: 'Classic Winner'
    },
    {
      title: 'The Legend of Zelda: TOTK',
      subtitle: 'Best Action/Adventure',
      extra: 'The Game Awards 2023'
    },
    {
      title: 'Red Dead Redemption 2',
      subtitle: 'Best Narrative 2018',
      extra: 'The Game Awards'
    }
  ];
  const awardWinningGamesFallback = awardWinningGameSeeds.map((seed, index) => ({
    mediaType: 'game',
    itemId: `award-fallback-${index + 1}`,
    title: seed.title,
    subtitle: seed.subtitle,
    extra: seed.extra,
    image: 'images/logo.png',
    href: 'games.html',
    disableLists: true
  }));

  function normalizeGameName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreGameNameMatch(candidate, target) {
    const left = normalizeGameName(candidate);
    const right = normalizeGameName(target);
    if (!left || !right) return 0;
    if (left === right) return 100;
    if (left.includes(right) || right.includes(left)) return 75;
    const leftWords = new Set(left.split(' ').filter(Boolean));
    const rightWords = new Set(right.split(' ').filter(Boolean));
    let overlap = 0;
    rightWords.forEach((word) => {
      if (leftWords.has(word)) overlap += 1;
    });
    return overlap;
  }

  async function buildAwardWinningGamesRail() {
    const tasks = awardWinningGameSeeds.map(async (seed) => {
      const searchUrl = `/api/igdb/games?search=${encodeURIComponent(seed.title)}&ordering=-rating&page_size=8&page=1`;
      const json = await fetchJson(searchUrl, 9000);
      const rows = Array.isArray(json?.results) ? json.results : [];
      const ranked = rows
        .map((row) => ({
          row,
          score: scoreGameNameMatch(row?.name, seed.title)
        }))
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

      const best = ranked[0]?.row || null;
      const bestId = String(best?.id || '').trim();
      if (!best || !bestId) {
        return {
          mediaType: 'game',
          itemId: '',
          title: seed.title,
          subtitle: seed.subtitle,
          extra: seed.extra,
          image: 'images/logo.png',
          href: 'games.html',
          disableLists: true
        };
      }

      const cover = safeHttps(best?.cover || '');
      const hero = safeHttps(best?.hero || best?.background_image || '');
      return {
        mediaType: 'game',
        itemId: bestId,
        title: String(best?.name || seed.title).trim() || seed.title,
        subtitle: seed.subtitle,
        extra: seed.extra,
        image: cover || hero || 'images/logo.png',
        href: `game.html?id=${encodeURIComponent(bestId)}`
      };
    });

    const settled = await Promise.allSettled(tasks);
    const items = settled
      .map((entry) => (entry.status === 'fulfilled' ? entry.value : null))
      .filter(Boolean);
    return items.length ? items : awardWinningGamesFallback;
  }

  function isDesktopViewport() {
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeHttps(url) {
    const text = String(url || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    if (text.startsWith('http://')) return text.replace(/^http:\/\//i, 'https://');
    return text;
  }

  function buildSidebarCustomListHref(mediaType, listId) {
    const safeType = String(mediaType || '').trim().toLowerCase();
    const route = SIDEBAR_MEDIA_PROFILE_ROUTE[safeType];
    const safeListId = String(listId || '').trim();
    if (!safeListId) {
      return 'profile.html';
    }
    if (!route) {
      const params = new URLSearchParams({
        listId: safeListId,
        listType: 'custom'
      });
      return `profile.html?${params.toString()}`;
    }
    const params = new URLSearchParams({
      tab: route.tab,
      collection: route.collection,
      listId: safeListId,
      listType: 'custom'
    });
    return `profile.html?${params.toString()}`;
  }

  function makeReviewKey(mediaType, itemId) {
    const type = String(mediaType || '').trim().toLowerCase();
    const id = String(itemId || '').trim();
    if (!type || !id) return '';
    return `${type}:${id}`;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function readSidebarWidthPx(collapsed) {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const expandedRaw = String(rootStyle.getPropertyValue('--desktop-sidebar-expanded') || '').trim();
    const collapsedRaw = String(rootStyle.getPropertyValue('--desktop-sidebar-collapsed') || '').trim();
    const expanded = Number.parseFloat(expandedRaw) || 292;
    const compact = Number.parseFloat(collapsedRaw) || 96;
    return collapsed ? compact : expanded;
  }

  function syncDesktopSidebarDocking() {
    const shell = document.querySelector('.desktop-app-shell');
    const sidebar = document.querySelector('.desktop-sidebar');
    const mainPanel = document.querySelector('.desktop-main-panel');
    if (!shell || !sidebar || !mainPanel) return;

    const isDesktop = window.matchMedia('(min-width: 940px)').matches;
    if (!isDesktop) {
      sidebar.style.removeProperty('display');
      sidebar.style.removeProperty('position');
      sidebar.style.removeProperty('top');
      sidebar.style.removeProperty('left');
      sidebar.style.removeProperty('bottom');
      sidebar.style.removeProperty('width');
      sidebar.style.removeProperty('height');
      sidebar.style.removeProperty('min-height');
      sidebar.style.removeProperty('max-height');
      sidebar.style.removeProperty('z-index');
      mainPanel.style.removeProperty('margin-left');
      mainPanel.style.removeProperty('width');
      document.body.style.removeProperty('transform');
      document.body.style.removeProperty('opacity');
      return;
    }

    // Keep fixed desktop sidebar behavior stable even if app shell classes inject transforms.
    document.body.style.transform = 'none';
    document.body.style.opacity = '1';

    const collapsed = document.body.classList.contains('sidebar-collapsed');
    const sidebarWidth = readSidebarWidthPx(collapsed);

    sidebar.style.display = 'flex';
    sidebar.style.position = 'fixed';
    sidebar.style.top = '0';
    sidebar.style.left = '0';
    sidebar.style.bottom = '0';
    sidebar.style.width = `${sidebarWidth}px`;
    sidebar.style.height = '100vh';
    sidebar.style.minHeight = '100vh';
    sidebar.style.maxHeight = '100vh';
    sidebar.style.zIndex = '210';

    mainPanel.style.marginLeft = `${sidebarWidth}px`;
    mainPanel.style.width = `calc(100% - ${sidebarWidth}px)`;
  }

  let supabaseClient = null;
  async function ensureSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    if (typeof window.ensureHomeSupabase === 'function') {
      try {
        const client = await window.ensureHomeSupabase();
        if (client) {
          supabaseClient = client;
          return supabaseClient;
        }
      } catch (_err) {}
    }

    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        return supabaseClient;
      }
      await wait(120);
    }
    return null;
  }

  async function getAuthedUser(client) {
    if (!client) return null;

    if (typeof window.getVerifiedHomeUser === 'function') {
      try {
        const verified = await window.getVerifiedHomeUser(client);
        if (verified?.id) return verified;
      } catch (_err) {}
    }

    try {
      const { data: sessionData } = await client.auth.getSession();
      const sessionUser = sessionData?.session?.user || null;
      if (!sessionUser) return null;

      const { data: userData, error: userError } = await client.auth.getUser();
      if (!userError && userData?.user) return userData.user;
      return sessionUser;
    } catch (_err) {
      return null;
    }
  }

  async function fetchJson(url, timeoutMs = 8000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function fallbackReviewMeta(mediaType, itemId) {
    const type = String(mediaType || '').trim().toLowerCase();
    const id = String(itemId || '').trim();
    const href = type === 'movie'
      ? `movie.html?id=${encodeURIComponent(id)}`
      : type === 'tv'
        ? `tvshow.html?id=${encodeURIComponent(id)}`
        : type === 'anime'
          ? `anime.html?id=${encodeURIComponent(id)}`
          : type === 'game'
            ? `game.html?id=${encodeURIComponent(id)}`
          : type === 'book'
            ? `book.html?id=${encodeURIComponent(id)}`
            : type === 'music'
              ? `song.html?id=${encodeURIComponent(id)}`
              : type === 'travel'
                ? `country.html?code=${encodeURIComponent(String(id || '').toUpperCase())}`
                : '#';

    return {
      title: `${(SOURCE_BY_MEDIA[type]?.label || 'Item')} ${id}`.trim(),
      subtitle: SOURCE_BY_MEDIA[type]?.label || 'Item',
      image: 'images/logo.png',
      background: '',
      href
    };
  }

  async function fetchReviewRows(client, source) {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from(source.table)
        .select(`id, user_id, rating, comment, created_at, ${source.idField}`)
        .order('created_at', { ascending: false })
        .limit(REVIEW_LIMIT);
      if (error || !Array.isArray(data)) return [];

      return data.map((row) => {
        const itemId = String(row?.[source.idField] || '').trim();
        if (!itemId) return null;
        return {
          id: `${source.mediaType}:${String(row?.id || itemId)}`,
          mediaType: source.mediaType,
          itemId,
          userId: String(row?.user_id || '').trim(),
          rating: Math.max(0, Math.min(5, Number(row?.rating || 0))),
          comment: String(row?.comment || '').trim(),
          createdAt: row?.created_at || null
        };
      }).filter(Boolean);
    } catch (_err) {
      return [];
    }
  }

  async function loadReviewUsers(client, rows) {
    const out = new Map();
    if (!client) return out;

    const ids = [...new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.userId || '').trim()).filter(Boolean))];
    if (!ids.length) return out;

    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', ids);
      if (error || !Array.isArray(data)) return out;

      data.forEach((row) => {
        const id = String(row?.id || '').trim();
        if (!id) return;
        out.set(id, {
          username: String(row?.username || '').trim(),
          fullName: String(row?.full_name || '').trim()
        });
      });
      return out;
    } catch (_err) {
      return out;
    }
  }

  function reviewerLabel(usersById, userId) {
    const profile = usersById.get(String(userId || '').trim());
    const username = String(profile?.username || '').trim();
    if (username) return `@${username}`;
    const fullName = String(profile?.fullName || '').trim();
    if (fullName) return fullName;
    return '@zo2y';
  }

  async function hydrateReviewMeta(client, rows) {
    const metaByKey = new Map();
    const groupedIds = {
      movie: new Set(),
      tv: new Set(),
      anime: new Set(),
      game: new Set(),
      book: new Set(),
      music: new Set(),
      travel: new Set()
    };

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const type = String(row?.mediaType || '').trim().toLowerCase();
      const itemId = String(row?.itemId || '').trim();
      if (!groupedIds[type] || !itemId) return;
      groupedIds[type].add(itemId);
    });

    if (client && groupedIds.book.size) {
      try {
        const ids = [...groupedIds.book].slice(0, 100);
        const { data } = await client
          .from('books')
          .select('id, title, authors, thumbnail')
          .in('id', ids);

        (Array.isArray(data) ? data : []).forEach((row) => {
          const id = String(row?.id || '').trim();
          if (!id) return;
          metaByKey.set(makeReviewKey('book', id), {
            title: String(row?.title || `Book ${id}`).trim(),
            subtitle: String(row?.authors || 'Book').trim(),
            image: safeHttps(row?.thumbnail || '') || 'images/logo.png',
            background: '',
            href: `book.html?id=${encodeURIComponent(id)}`
          });
        });
      } catch (_err) {}
    }

    if (client && groupedIds.music.size) {
      try {
        const ids = [...groupedIds.music].slice(0, 100);
        const { data } = await client
          .from('tracks')
          .select('id, name, artists, image_url, album_name')
          .in('id', ids);

        (Array.isArray(data) ? data : []).forEach((row) => {
          const id = String(row?.id || '').trim();
          if (!id) return;
          const image = safeHttps(row?.image_url || '') || 'images/logo.png';
          metaByKey.set(makeReviewKey('music', id), {
            title: String(row?.name || `Track ${id}`).trim(),
            subtitle: String(row?.artists || row?.album_name || 'Music').trim(),
            image,
            background: image,
            href: `song.html?id=${encodeURIComponent(id)}`
          });
        });
      } catch (_err) {}
    }

    if (groupedIds.travel.size) {
      try {
        const codes = [...groupedIds.travel]
          .map((value) => String(value || '').trim().toUpperCase())
          .filter((value) => value.length >= 2 && value.length <= 3)
          .slice(0, 90);
        if (codes.length) {
          const json = await fetchJson(
            `https://restcountries.com/v3.1/alpha?codes=${encodeURIComponent(codes.join(','))}&fields=name,cca2,cca3,capital,region,flags`,
            9000
          );
          (Array.isArray(json) ? json : []).forEach((row) => {
            const cca2 = String(row?.cca2 || '').trim().toUpperCase();
            const cca3 = String(row?.cca3 || '').trim().toUpperCase();
            const title = String(row?.name?.common || row?.name?.official || cca2 || cca3 || 'Country').trim();
            const capital = Array.isArray(row?.capital)
              ? String(row.capital[0] || '').trim()
              : String(row?.capital || '').trim();
            const region = String(row?.region || '').trim();
            const subtitle = [capital ? `Capital: ${capital}` : '', region].filter(Boolean).join(' | ') || 'Country';
            const image = safeHttps(row?.flags?.png || row?.flags?.svg || '');
            [cca2, cca3].forEach((code) => {
              if (!code) return;
              metaByKey.set(makeReviewKey('travel', code), {
                title,
                subtitle,
                image: image || 'images/logo.png',
                background: '',
                href: `country.html?code=${encodeURIComponent(code)}`
              });
            });
          });
        }
      } catch (_err) {}
    }

    const movieTasks = [...groupedIds.movie].slice(0, 20).map(async (id) => {
      const json = await fetchJson(`/api/tmdb/movie/${encodeURIComponent(id)}?language=en-US`, 7000);
      const title = String(json?.title || '').trim();
      if (!title) return;
      metaByKey.set(makeReviewKey('movie', id), {
        title,
        subtitle: String(json?.release_date || '').slice(0, 4) || 'Movie',
        image: json?.poster_path ? `${TMDB_POSTER}${json.poster_path}` : 'images/logo.png',
        background: json?.backdrop_path ? `${TMDB_BACKDROP}${json.backdrop_path}` : '',
        href: `movie.html?id=${encodeURIComponent(id)}`
      });
    });

    const tvAndAnimeIds = [...new Set([...groupedIds.tv, ...groupedIds.anime])].slice(0, 20);
    const tvTasks = tvAndAnimeIds.map(async (id) => {
      const json = await fetchJson(`/api/tmdb/tv/${encodeURIComponent(id)}?language=en-US`, 7000);
      const title = String(json?.name || '').trim();
      if (!title) return;
      const baseMeta = {
        title,
        subtitle: String(json?.first_air_date || '').slice(0, 4) || 'TV',
        image: json?.poster_path ? `${TMDB_POSTER}${json.poster_path}` : 'images/logo.png',
        background: json?.backdrop_path ? `${TMDB_BACKDROP}${json.backdrop_path}` : ''
      };
      if (groupedIds.tv.has(id)) {
        metaByKey.set(makeReviewKey('tv', id), {
          ...baseMeta,
          href: `tvshow.html?id=${encodeURIComponent(id)}`
        });
      }
      if (groupedIds.anime.has(id)) {
        metaByKey.set(makeReviewKey('anime', id), {
          ...baseMeta,
          subtitle: baseMeta.subtitle || 'Anime',
          href: `anime.html?id=${encodeURIComponent(id)}`
        });
      }
    });

    const gameTasks = [...groupedIds.game].slice(0, 20).map(async (id) => {
      const json = await fetchJson(`/api/igdb/games?id=${encodeURIComponent(id)}&page_size=1`, 8500);
      const row = Array.isArray(json?.results) ? (json.results[0] || null) : null;
      const title = String(row?.name || '').trim();
      if (!title) return;
      const cover = safeHttps(row?.cover || '');
      const hero = safeHttps(row?.hero || row?.background_image || '');
      metaByKey.set(makeReviewKey('game', id), {
        title,
        subtitle: String(row?.released || '').slice(0, 4) || 'Game',
        image: cover || hero || 'images/logo.png',
        background: hero || cover || '',
        href: `game.html?id=${encodeURIComponent(id)}`
      });
    });

    await Promise.allSettled([...movieTasks, ...tvTasks, ...gameTasks]);

    return metaByKey;
  }

  async function buildReviewSlidesFromLiveData() {
    const client = await ensureSupabaseClient();
    if (!client) return [];

    const grouped = await Promise.all(REVIEW_SOURCES.map((source) => fetchReviewRows(client, source)));
    const allRows = grouped
      .flat()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const rows = allRows
      .filter((row) => String(row.comment || '').trim() || Number(row.rating || 0) > 0)
      .slice(0, 40);

    if (!rows.length) return [];

    const [usersById, metaByKey] = await Promise.all([
      loadReviewUsers(client, rows),
      hydrateReviewMeta(client, rows.slice(0, 24))
    ]);

    const slides = [];
    for (const row of rows) {
      const type = String(row.mediaType || '').toLowerCase();
      const source = SOURCE_BY_MEDIA[type] || { label: 'Media' };
      const key = makeReviewKey(type, row.itemId);
      const meta = metaByKey.get(key) || fallbackReviewMeta(type, row.itemId);
      const reviewer = reviewerLabel(usersById, row.userId);
      const score = Math.max(0, Math.min(5, Number(row.rating || 0)));
      const scoreLabel = Number.isFinite(score) ? `${score.toFixed(1)}/5` : '-';
      const comment = String(row.comment || '').trim();
      const quote = comment || `Rated ${scoreLabel}`;

      slides.push({
        kicker: `${source.label} Review`,
        title: meta.title || `${source.label} Review`,
        quote,
        author: reviewer,
        score: scoreLabel,
        image: safeHttps(meta.background || meta.image || ''),
        href: meta.href || 'reviews.html'
      });

      if (slides.length >= 10) break;
    }

    lastLiveReviewSlides = slides.slice();
    return slides;
  }

  function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!toggleBtn) return;

    const label = toggleBtn.querySelector('span');

    const applyState = (collapsed) => {
      document.body.classList.toggle('sidebar-collapsed', !!collapsed);
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      if (label) {
        label.textContent = collapsed ? 'Expand Menu' : 'Collapse Menu';
      }
      syncDesktopSidebarDocking();
    };

    let savedCollapsed = false;
    try {
      savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch (_err) {}
    applyState(savedCollapsed);

    toggleBtn.addEventListener('click', () => {
      const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
      applyState(nextCollapsed);
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, nextCollapsed ? '1' : '0');
      } catch (_err) {}
    });
  }

  async function initReviewSlideshow() {
    const backdropEl = document.getElementById('reviewStageBackdrop');
    const kickerEl = document.getElementById('reviewStageKicker');
    const titleEl = document.getElementById('reviewStageTitle');
    const quoteEl = document.getElementById('reviewStageQuote');
    const authorEl = document.getElementById('reviewStageAuthor');
    const scoreEl = document.getElementById('reviewStageScore');
    const dotsEl = document.getElementById('reviewSlideDots');
    const prevBtn = document.getElementById('reviewSlidePrev');
    const nextBtn = document.getElementById('reviewSlideNext');
    const stageCard = document.querySelector('.review-stage-card');

    if (!backdropEl || !kickerEl || !titleEl || !quoteEl || !authorEl || !scoreEl || !dotsEl || !prevBtn || !nextBtn || !stageCard) {
      return;
    }

    let slides = [];
    let activeIndex = 0;
    let timerId = null;

    const stopAutoRotate = () => {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    };

    const restartAutoRotate = () => {
      stopAutoRotate();
      if (!isDesktopViewport() || slides.length < 2) return;
      timerId = window.setInterval(() => {
        showSlide(activeIndex + 1, false);
      }, REVIEW_ROTATE_MS);
    };

    const renderDots = () => {
      dotsEl.innerHTML = slides
        .map((_, idx) => `
          <button
            class="review-dot${idx === activeIndex ? ' active' : ''}"
            type="button"
            data-review-dot="${idx}"
            aria-label="Go to review slide ${idx + 1}"></button>
        `)
        .join('');

      dotsEl.querySelectorAll('[data-review-dot]').forEach((dot) => {
        dot.addEventListener('click', () => {
          const targetIndex = Number(dot.getAttribute('data-review-dot'));
          if (!Number.isInteger(targetIndex)) return;
          showSlide(targetIndex, true);
        });
      });
    };

    const showSlide = (index, fromUser = false) => {
      if (!slides.length) return;
      activeIndex = (index + slides.length) % slides.length;
      const slide = slides[activeIndex];

      kickerEl.textContent = slide.kicker;
      titleEl.textContent = slide.title;
      quoteEl.textContent = `"${slide.quote}"`;
      authorEl.textContent = slide.author;
      scoreEl.textContent = slide.score;

      if (slide.image) {
        backdropEl.style.backgroundImage = `url("${slide.image}")`;
      } else {
        backdropEl.style.backgroundImage = 'linear-gradient(140deg, #0f203f, #132347)';
      }

      stageCard.style.cursor = slide.href ? 'pointer' : 'default';
      stageCard.dataset.reviewHref = String(slide.href || '').trim();

      renderDots();

      if (fromUser) {
        restartAutoRotate();
      }
    };

    prevBtn.addEventListener('click', () => showSlide(activeIndex - 1, true));
    nextBtn.addEventListener('click', () => showSlide(activeIndex + 1, true));

    stageCard.addEventListener('mouseenter', stopAutoRotate);
    stageCard.addEventListener('mouseleave', restartAutoRotate);
    stageCard.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      const href = String(stageCard.dataset.reviewHref || '').trim();
      if (href) window.location.href = href;
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoRotate();
      } else {
        restartAutoRotate();
      }
    });

    window.addEventListener('resize', restartAutoRotate);

    slides = await buildReviewSlidesFromLiveData();
    if (!slides.length) {
      await wait(800);
      slides = await buildReviewSlidesFromLiveData();
    }
    if (!slides.length && lastLiveReviewSlides.length) {
      slides = lastLiveReviewSlides.slice();
    }
    if (!slides.length) {
      slides = [{
        kicker: 'Reviews Spotlight',
        title: 'No community reviews yet',
        quote: 'As soon as someone posts a review, this section updates from live data.',
        author: 'zo2y.com/reviews',
        score: '-',
        image: '',
        href: 'reviews.html'
      }];
    }

    showSlide(0, false);
    restartAutoRotate();
  }

  async function loadSidebarCustomListPreview() {
    const listContainer = document.getElementById('sidebarCustomListItems');
    if (!listContainer) return;

    if (!window.ListUtils || typeof window.ListUtils.loadCustomLists !== 'function') {
      listContainer.innerHTML = '<div class="sidebar-list-empty">List preview unavailable right now.</div>';
      return;
    }

    const client = await ensureSupabaseClient();
    if (!client) {
      listContainer.innerHTML = '<div class="sidebar-list-empty">Could not load your lists right now.</div>';
      return;
    }

    let user = await getAuthedUser(client);
    if (!user?.id) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await wait(350);
        user = await getAuthedUser(client);
        if (user?.id) break;
      }
    }
    if (!user?.id) {
      listContainer.innerHTML = '<div class="sidebar-list-empty">Sign in to preview your custom lists.</div>';
      return;
    }

    const perType = await Promise.all(SIDEBAR_MEDIA_TYPES.map(async (mediaType) => {
      try {
        const rows = await window.ListUtils.loadCustomLists(client, user.id, mediaType);
        return {
          mediaType,
          lists: Array.isArray(rows) ? rows : []
        };
      } catch (_err) {
        return {
          mediaType,
          lists: []
        };
      }
    }));

    const merged = perType
      .flatMap((bucket) => bucket.lists.map((list) => ({ ...list, mediaType: bucket.mediaType })))
      .filter((list) => String(list?.id || '').trim())
      .sort((a, b) => {
        const aTime = Date.parse(String(a?.updated_at || a?.created_at || '')) || 0;
        const bTime = Date.parse(String(b?.updated_at || b?.created_at || '')) || 0;
        return bTime - aTime;
      })
      .slice(0, 4);

    if (!merged.length) {
      listContainer.innerHTML = '<div class="sidebar-list-empty">No custom lists yet. Create one from any media page.</div>';
      return;
    }

    listContainer.innerHTML = merged.map((list) => {
      const mediaType = String(list.mediaType || '').toLowerCase();
      const title = escapeHtml(String(list.title || 'Custom List').trim() || 'Custom List');
      const mediaLabel = escapeHtml(SIDEBAR_MEDIA_LABEL[mediaType] || 'Media');
      const href = escapeHtml(buildSidebarCustomListHref(mediaType, list.id));
      const icon = typeof window.ListUtils.renderListIcon === 'function'
        ? window.ListUtils.renderListIcon(list.icon, 'fas fa-list')
        : '<i class="fas fa-list"></i>';

      return `
        <a class="sidebar-list-row" href="${href}" title="${title}">
          ${icon}
          <span class="sidebar-list-row-text">
            <span class="sidebar-list-row-title">${title}</span>
            <span class="sidebar-list-row-meta">${mediaLabel}</span>
          </span>
        </a>
      `;
    }).join('');
  }

  async function bindSidebarListAuthRefresh() {
    const client = await ensureSupabaseClient();
    if (!client) return;
    if (bindSidebarListAuthRefresh.bound) return;

    bindSidebarListAuthRefresh.bound = true;
    client.auth.onAuthStateChange(() => {
      void loadSidebarCustomListPreview();
    });
  }

  function renderCuratedRails(retriesLeft = 10) {
    if (typeof window.renderRail !== 'function') {
      if (retriesLeft <= 0) return;
      window.setTimeout(() => renderCuratedRails(retriesLeft - 1), 180);
      return;
    }

    window.renderRail('imdbTop10Rail', imdbTopMovies, { mediaType: 'movie' });
    window.renderRail('awardGamesRail', awardWinningGamesFallback, { mediaType: 'game' });
    void buildAwardWinningGamesRail().then((items) => {
      if (typeof window.renderRail !== 'function') return;
      window.renderRail('awardGamesRail', Array.isArray(items) ? items : awardWinningGamesFallback, { mediaType: 'game' });
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    syncDesktopSidebarDocking();
    void initReviewSlideshow();
    renderCuratedRails();
    void loadSidebarCustomListPreview();
    void bindSidebarListAuthRefresh();
    window.setTimeout(() => { void loadSidebarCustomListPreview(); }, 1200);
    window.setTimeout(() => { void loadSidebarCustomListPreview(); }, 3600);
    window.addEventListener('resize', syncDesktopSidebarDocking, { passive: true });
    window.addEventListener('orientationchange', syncDesktopSidebarDocking, { passive: true });
    window.addEventListener('pageshow', syncDesktopSidebarDocking);
  });
})();

