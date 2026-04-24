(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';
  const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  const FALLBACK_IMAGE = '/newlogo.webp';
  const REVIEW_LIMIT = 70;
  const GAMES_DISABLED = window.ZO2Y_DISABLE_GAMES !== false;

  const SOURCES = [
    { mediaType: 'movie', table: 'movie_reviews', idField: 'movie_id', label: 'Movie', icon: 'fa-film' },
    { mediaType: 'tv', table: 'tv_reviews', idField: 'tv_id', label: 'TV', icon: 'fa-tv' },
    { mediaType: 'anime', table: 'anime_reviews', idField: 'anime_id', label: 'Anime', icon: 'fa-dragon' },
    { mediaType: 'game', table: 'game_reviews', idField: 'game_id', label: 'Game', icon: 'fa-gamepad' },
    { mediaType: 'book', table: 'book_reviews', idField: 'book_id', label: 'Book', icon: 'fa-book' },
    { mediaType: 'music', table: 'music_reviews', idField: 'track_id', label: 'Music', icon: 'fa-music' },
    { mediaType: 'travel', table: 'travel_reviews', idField: 'country_code', label: 'Travel', icon: 'fa-earth-americas' }
  ].filter((source) => !GAMES_DISABLED || source.mediaType !== 'game');

  const LABEL_BY_MEDIA = Object.fromEntries(SOURCES.map((r) => [r.mediaType, r.label]));
  const ICON_BY_MEDIA = Object.fromEntries(SOURCES.map((r) => [r.mediaType, r.icon]));

  let client = null;
  let currentUser = null;
  let mediaFilter = 'all';
  let sortMode = 'newest';
  let reviews = [];
  let reviewSpotlightItems = [];
  let reviewSpotlightIndex = 0;
  let reviewSpotlightTimer = null;
  let reviewSpotlightTransitioning = false;
  let reviewSpotlightPendingIndex = null;
  let reviewSpotlightHoverIndex = null;
  const users = new Map();
  const itemMeta = new Map();
  const REVIEW_SPOTLIGHT_ROTATE_MS = 7000;
  const REVIEW_SPOTLIGHT_MOBILE_QUERY = '(max-width: 760px)';

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

  async function fetchIgdbGameMeta(id) {
    const gameId = String(id || '').trim();
    if (!gameId) return null;
    try {
      if (window.ZO2Y_IGDB && typeof window.ZO2Y_IGDB.request === 'function') {
        return await window.ZO2Y_IGDB.request(`/games/${encodeURIComponent(gameId)}`);
      }
      return await fetchJson(`/api/igdb/games/${encodeURIComponent(gameId)}`, 8500);
    } catch (_err) {
      return null;
    }
  }

  function makeKey(mediaType, itemId) {
    const type = String(mediaType || '').toLowerCase().trim();
    const id = String(itemId || '').trim();
    return type && id ? `${type}:${id}` : '';
  }

  function formatDate(raw) {
    const date = new Date(raw || '');
    if (!Number.isFinite(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function stars(rating) {
    const raw = Number(rating || 0);
    const safe = Number.isFinite(raw) ? raw : 0;
    const score = Math.max(0, Math.min(5, safe));
    const filled = Math.round(score);
    const label = `${score.toFixed(1)}/5`;
    let html = `<span class="rating-stars" aria-label="${label}">`;
    for (let i = 0; i < 5; i += 1) {
      html += `<span class="rating-star${i < filled ? ' is-filled' : ''}" aria-hidden="true"></span>`;
    }
    html += '</span>';
    return html;
  }

  function fallbackMeta(mediaType, itemId) {
    const type = String(mediaType || '').toLowerCase().trim();
    const id = String(itemId || '').trim();
    const label = LABEL_BY_MEDIA[type] || 'Item';
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
      title: `${label} ${id}`.trim(),
      subtitle: label,
      image: FALLBACK_IMAGE,
      href
    };
  }

  function getMeta(mediaType, itemId) {
    const key = makeKey(mediaType, itemId);
    return (key && itemMeta.get(key)) || fallbackMeta(mediaType, itemId);
  }

  async function fetchJson(url, timeoutMs = 8000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (_err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function ensureSupabase() {
    if (client) return client;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      client = window.__ZO2Y_SUPABASE_CLIENT;
      return client;
    }
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        window.__ZO2Y_SUPABASE_CLIENT = client;
        return client;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }

  async function loadAuthState() {
    const supabase = await ensureSupabase();
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const syncAuthButtons = () => {
      const loggedIn = !!currentUser;
      if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : 'inline-flex';
      if (signupBtn) signupBtn.style.display = loggedIn ? 'none' : 'inline-flex';
      if (profileBtn) {
        profileBtn.style.display = loggedIn ? 'inline-flex' : 'none';
        if (loggedIn) profileBtn.innerHTML = '<i class="fas fa-user"></i><span>Profile</span>';
      }
    };
    if (!supabase) {
      syncAuthButtons();
      return;
    }
    try {
      // Prefer local session first to avoid unnecessary network noise.
      const { data: sessionData } = await supabase.auth.getSession();
      currentUser = sessionData?.session?.user || null;

      // Best-effort verification when online; keep local user if it fails.
      if (currentUser && navigator.onLine !== false) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          currentUser = data.user;
        }
      }
    } catch (_err) {
      currentUser = null;
    }
    syncAuthButtons();
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      syncAuthButtons();
    });
  }

  async function fetchSourceReviews(source) {
    if (!client) return [];
    try {
      const { data, error } = await client
        .from(source.table)
        .select(`id, user_id, rating, comment, created_at, ${source.idField}`)
        .order('created_at', { ascending: false })
        .limit(REVIEW_LIMIT);
      if (error || !Array.isArray(data)) return [];
      return data
        .map((row) => {
          const itemId = String(row?.[source.idField] ?? '').trim();
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
        })
        .filter(Boolean);
    } catch (_err) {
      return [];
    }
  }

  async function loadUsers(rows) {
    if (!client) return;
    const ids = Array.from(new Set((rows || []).map((row) => String(row?.userId || '').trim()).filter(Boolean)));
    if (!ids.length) return;

    // Keep this aligned with index.html, where user_profiles is keyed by id.
    const { data, error } = await client
      .from('user_profiles')
      .select('id, username, full_name')
      .in('id', ids);
    if (error || !Array.isArray(data)) return;

    data.forEach((row) => {
      const id = String(row?.id || '').trim();
      if (!id) return;
      users.set(id, {
        username: String(row?.username || '').trim(),
        fullName: String(row?.full_name || '').trim()
      });
    });
  }
  function getReviewer(userId) {
    const profile = users.get(String(userId || '').trim());
    const username = String(profile?.username || '').trim();
    if (username) return `@${username}`;
    const fullName = String(profile?.fullName || '').trim();
    return fullName || 'User';
  }

  async function hydrateLocalMeta(rows) {
    if (!client) return;
    const bookIds = Array.from(new Set(rows.filter((r) => r.mediaType === 'book').map((r) => r.itemId))).filter(Boolean);
    const trackIds = Array.from(new Set(rows.filter((r) => r.mediaType === 'music').map((r) => r.itemId))).filter(Boolean);

    if (bookIds.length) {
      const { data } = await client.from('books').select('id, title, authors, thumbnail').in('id', bookIds.slice(0, 200));
      (Array.isArray(data) ? data : []).forEach((row) => {
        const id = String(row?.id || '').trim();
        if (!id) return;
        itemMeta.set(makeKey('book', id), {
          title: String(row?.title || `Book ${id}`).trim(),
          subtitle: String(row?.authors || 'Book').trim(),
          image: safeHttps(row?.thumbnail || '') || FALLBACK_IMAGE,
          href: `book.html?id=${encodeURIComponent(id)}`
        });
      });
    }

    if (trackIds.length) {
      const { data } = await client.from('tracks').select('id, name, artists, image_url, album_name').in('id', trackIds.slice(0, 200));
      (Array.isArray(data) ? data : []).forEach((row) => {
        const id = String(row?.id || '').trim();
        if (!id) return;
        itemMeta.set(makeKey('music', id), {
          title: String(row?.name || `Track ${id}`).trim(),
          subtitle: String(row?.artists || row?.album_name || 'Music').trim(),
          image: safeHttps(row?.image_url || '') || FALLBACK_IMAGE,
          href: `song.html?id=${encodeURIComponent(id)}`
        });
      });
    }
  }

  async function hydrateRemoteMeta(rows) {
    const grouped = {
      movie: [],
      tv: [],
      anime: [],
      game: [],
      book: [],
      music: [],
      travel: []
    };

    rows.forEach((row) => {
      const type = String(row?.mediaType || '').toLowerCase().trim();
      const id = String(row?.itemId || '').trim();
      if (!grouped[type] || !id) return;
      if (itemMeta.has(makeKey(type, id))) return;
      grouped[type].push(id);
    });

    const movieTasks = Array.from(new Set(grouped.movie)).map(async (id) => {
      const json = await fetchJson(`/api/tmdb/movie/${encodeURIComponent(id)}?language=en-US`, 7000);
      const title = String(json?.title || '').trim();
      if (!title) return;
      itemMeta.set(makeKey('movie', id), {
        title,
        subtitle: String(json?.release_date || '').slice(0, 4) || 'Movie',
        image: json?.poster_path ? `${TMDB_POSTER}${json.poster_path}` : FALLBACK_IMAGE,
        href: `movie.html?id=${encodeURIComponent(id)}`
      });
    });

    const tvTasks = Array.from(new Set([...grouped.tv, ...grouped.anime])).map(async (id) => {
      const json = await fetchJson(`/api/tmdb/tv/${encodeURIComponent(id)}?language=en-US`, 7000);
      const title = String(json?.name || '').trim();
      if (!title) return;
      const base = {
        title,
        subtitle: String(json?.first_air_date || '').slice(0, 4) || 'TV',
        image: json?.poster_path ? `${TMDB_POSTER}${json.poster_path}` : FALLBACK_IMAGE
      };
      if (grouped.tv.includes(id)) itemMeta.set(makeKey('tv', id), { ...base, href: `tvshow.html?id=${encodeURIComponent(id)}` });
      if (grouped.anime.includes(id)) itemMeta.set(makeKey('anime', id), { ...base, subtitle: base.subtitle || 'Anime', href: `anime.html?id=${encodeURIComponent(id)}` });
    });

    const gameTasks = Array.from(new Set(grouped.game)).map(async (id) => {
      const json = await fetchIgdbGameMeta(id);
      const title = String(json?.name || '').trim();
      if (!title) return;
      itemMeta.set(makeKey('game', id), {
        title,
        subtitle: String(json?.released || '').slice(0, 4) || 'Game',
        image: safeHttps(json?.cover || json?.hero || json?.background_image || '') || FALLBACK_IMAGE,
        href: `game.html?id=${encodeURIComponent(id)}`
      });
    });

    const musicTasks = Array.from(new Set(grouped.music)).map(async (id) => {
      if (itemMeta.has(makeKey('music', id))) return;
      const json = await fetchJson(`/api/music/tracks/${encodeURIComponent(id)}?market=US`, 7000);
      const title = String(json?.name || '').trim();
      if (!title) return;
      const artists = Array.isArray(json?.artists) ? json.artists.filter(Boolean).join(', ') : '';
      itemMeta.set(makeKey('music', id), {
        title,
        subtitle: artists || 'Music',
        image: safeHttps(json?.image || '') || FALLBACK_IMAGE,
        href: `song.html?id=${encodeURIComponent(id)}`
      });
    });

    const bookTasks = Array.from(new Set(grouped.book)).map(async (id) => {
      if (itemMeta.has(makeKey('book', id))) return;
      const isWork = /^OL\d+W$/i.test(id);
      const cover = isWork ? `https://covers.openlibrary.org/b/olid/${encodeURIComponent(id)}-L.jpg` : '';
      itemMeta.set(makeKey('book', id), {
        title: `Book ${id}`,
        subtitle: 'Book',
        image: cover || FALLBACK_IMAGE,
        href: `book.html?id=${encodeURIComponent(id)}`
      });
    });

    const travelTasks = (async () => {
      const codes = Array.from(new Set(grouped.travel
        .map((id) => String(id || '').trim().toUpperCase())
        .filter((code) => code.length >= 2 && code.length <= 3)));
      if (!codes.length) return;
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
        const image = safeHttps(row?.flags?.png || row?.flags?.svg || '') || FALLBACK_IMAGE;
        [cca2, cca3].forEach((code) => {
          if (!code) return;
          itemMeta.set(makeKey('travel', code), {
            title,
            subtitle,
            image,
            href: `country.html?code=${encodeURIComponent(code)}`
          });
        });
      });
    })();

    await Promise.allSettled([...movieTasks, ...tvTasks, ...gameTasks, ...musicTasks, ...bookTasks, travelTasks]);
  }

  function filteredRows() {
    let out = reviews.slice();
    if (mediaFilter !== 'all') out = out.filter((r) => r.mediaType === mediaFilter);

    if (sortMode === 'highest') {
      out.sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } else if (sortMode === 'lowest') {
      out.sort((a, b) => (a.rating - b.rating) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } else {
      out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return out;
  }

  function stopReviewSpotlightTimer() {
    if (!reviewSpotlightTimer) return;
    window.clearInterval(reviewSpotlightTimer);
    reviewSpotlightTimer = null;
  }

  function prefersReducedMotion() {
    try {
      return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    } catch (_err) {
      return false;
    }
  }

  function isMobileReviewSpotlight() {
    try {
      return !!window.matchMedia?.(REVIEW_SPOTLIGHT_MOBILE_QUERY)?.matches;
    } catch (_err) {
      return false;
    }
  }

  function normalizeReviewSpotlightIndex(index) {
    if (!reviewSpotlightItems.length) return 0;
    return ((Number(index) || 0) % reviewSpotlightItems.length + reviewSpotlightItems.length) % reviewSpotlightItems.length;
  }

  function resetReviewSpotlightTimer() {
    stopReviewSpotlightTimer();
    if (reviewSpotlightItems.length < 2) return;
    reviewSpotlightTimer = window.setInterval(() => {
      showReviewSpotlight(reviewSpotlightIndex + 1, false);
    }, REVIEW_SPOTLIGHT_ROTATE_MS);
  }

  function buildReviewSpotlightStats(rows) {
    const safeRows = Array.isArray(rows) ? rows : [];
    if (!safeRows.length) {
      return [
        { icon: 'fa-wave-square', label: '0 live reviews' },
        { icon: 'fa-star-half-stroke', label: 'No rating signal yet' }
      ];
    }
    const avg = safeRows.reduce((sum, row) => sum + Math.max(0, Math.min(5, Number(row?.rating || 0))), 0) / safeRows.length;
    const commented = safeRows.filter((row) => String(row?.comment || '').trim()).length;
    const mediaCount = new Set(safeRows.map((row) => String(row?.mediaType || '').trim()).filter(Boolean)).size;
    return [
      { icon: 'fa-wave-square', label: `${safeRows.length} live review${safeRows.length === 1 ? '' : 's'}` },
      { icon: 'fa-star-half-stroke', label: `${avg.toFixed(1)}/5 average` },
      { icon: 'fa-pen-line', label: `${commented} with written takes` },
      { icon: 'fa-layer-group', label: `${mediaCount} active lanes` }
    ];
  }

  function reviewSpotlightRank(row) {
    const rating = Math.max(0, Math.min(5, Number(row?.rating || 0)));
    const commentLen = Math.min(String(row?.comment || '').trim().length, 240);
    const createdAt = new Date(row?.createdAt || 0).getTime();
    const recencyScore = Number.isFinite(createdAt) ? (createdAt / 1e11) : 0;
    return (rating * 100) + (commentLen / 18) + recencyScore;
  }

  function buildReviewSpotlightItems(rows) {
    const ranked = (Array.isArray(rows) ? rows : [])
      .filter((row) => row && (String(row.comment || '').trim() || Number(row.rating || 0) > 0))
      .slice()
      .sort((a, b) => reviewSpotlightRank(b) - reviewSpotlightRank(a));

    const out = [];
    const used = new Set();
    ranked.forEach((row) => {
      if (out.length >= 10) return;
      const media = String(row?.mediaType || '').toLowerCase();
      const key = makeKey(media, row?.itemId);
      if (!key || used.has(key)) return;
      used.add(key);
      const meta = getMeta(media, row?.itemId);
      out.push({
        key,
        media,
        mediaLabel: LABEL_BY_MEDIA[media] || 'Media',
        mediaIcon: ICON_BY_MEDIA[media] || 'fa-star',
        title: String(meta.title || 'Untitled').trim() || 'Untitled',
        subtitle: String(meta.subtitle || '').trim(),
        quote: String(row?.comment || '').trim() || `Rated ${Math.max(0, Math.min(5, Number(row?.rating || 0)))}/5`,
        reviewer: getReviewer(row?.userId),
        rating: Math.max(0, Math.min(5, Number(row?.rating || 0))),
        dateLabel: formatDate(row?.createdAt),
        href: String(meta.href || 'reviews.html').trim() || 'reviews.html',
        image: safeHttps(meta.image || '') || FALLBACK_IMAGE
      });
    });
    return out;
  }

  function renderReviewSpotlightStats(rows) {
    const statsEl = document.getElementById('reviewsSpotlightStats');
    if (!statsEl) return;
    const stats = buildReviewSpotlightStats(rows);
    statsEl.innerHTML = stats.map((entry) => `
      <span class="reviews-spotlight-stat"><i class="fa-solid ${escapeHtml(entry.icon)}"></i> ${escapeHtml(entry.label)}</span>
    `).join('');
  }

  function getReviewSpotlightVisibleCards() {
    const total = reviewSpotlightItems.length;
    if (!total) return [];
    const visible = [];
    const visibleCount = Math.min(total, 4);
    for (let offset = 0; offset < visibleCount; offset += 1) {
      const index = (reviewSpotlightIndex + offset) % total;
      visible.push({ item: reviewSpotlightItems[index], index, offset });
    }
    return visible;
  }

  function renderReviewSpotlightCards(incomingClass = '') {
    const stageEl = document.getElementById('reviewsSpotlightStage');
    const layerEl = document.getElementById('reviewsSpotlightCardLayer');
    if (!stageEl || !layerEl) return;
    const positions = ['is-front', 'is-right', 'is-lower', 'is-left'];
    const tones = ['tone-sun', 'tone-sky', 'tone-rose', 'tone-mint', 'tone-cream'];
    const visible = getReviewSpotlightVisibleCards();
    if (!visible.length) {
      layerEl.innerHTML = '';
      return;
    }

    layerEl.innerHTML = visible.map(({ item, index, offset }) => {
      const cardClasses = [
        'reviews-spotlight-card',
        positions[offset] || 'is-left',
        tones[(reviewSpotlightIndex + offset) % tones.length],
        offset === 0 ? 'is-active' : '',
        offset === 0 && incomingClass ? incomingClass : '',
        offset >= 3 ? 'is-back' : ''
      ].filter(Boolean).join(' ');
      const quote = String(item.quote || '').trim();
      const safeQuote = quote || `Rated ${Number(item.rating || 0).toFixed(1)}/5`;
      const starCount = Math.max(0, Math.min(5, Math.round(Number(item.rating || 0))));
      const drawnStars = `${'?'.repeat(starCount)}${'?'.repeat(Math.max(0, 5 - starCount))}`;
      const noteReviewer = String(item.reviewer || '').trim().replace(/^@/, '');
      return `
        <a class="${cardClasses}" href="${escapeHtml(item.href)}" data-review-spotlight-index="${index}" aria-label="Open ${escapeHtml(item.title)}">
          <div class="reviews-spotlight-card-body">
            <div class="reviews-spotlight-card-rating">${escapeHtml(drawnStars)}</div>
            <div class="reviews-spotlight-card-media">${escapeHtml(item.mediaLabel)}</div>
            <h3 class="reviews-spotlight-card-title">${escapeHtml(item.title)}</h3>
            <p class="reviews-spotlight-card-quote">${escapeHtml(safeQuote)}</p>
            <div class="reviews-spotlight-card-signoff">-(${escapeHtml(noteReviewer || 'zo2y')})</div>
          </div>
          <div class="reviews-spotlight-card-thumb-wrap">
            <img class="reviews-spotlight-card-thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)} artwork" loading="lazy" decoding="async" />
          </div>
        </a>
      `;
    }).join('');

    layerEl.querySelectorAll('[data-review-spotlight-index]').forEach((btn) => {
      const nextIndex = Number(btn.getAttribute('data-review-spotlight-index'));
      btn.addEventListener('mouseenter', () => {
        if (isMobileReviewSpotlight() || !Number.isInteger(nextIndex)) return;
        reviewSpotlightHoverIndex = nextIndex;
        renderReviewSpotlightHover(reviewSpotlightItems[nextIndex] || null, btn);
      });
      btn.addEventListener('mouseleave', () => {
        if (isMobileReviewSpotlight()) return;
        reviewSpotlightHoverIndex = null;
        hideReviewSpotlightPopover();
      });
      btn.addEventListener('focus', () => {
        if (!Number.isInteger(nextIndex)) return;
        reviewSpotlightHoverIndex = nextIndex;
        renderReviewSpotlightHover(reviewSpotlightItems[nextIndex] || null, btn);
      });
      btn.addEventListener('blur', () => {
        reviewSpotlightHoverIndex = null;
        hideReviewSpotlightPopover();
      });
      const image = btn.querySelector('.reviews-spotlight-card-thumb');
      if (image) {
        image.onerror = () => {
          image.onerror = null;
          image.src = FALLBACK_IMAGE;
        };
      }
    });
  }

  function hideReviewSpotlightPopover() {
    const shell = document.getElementById('reviewsSpotlightPopover');
    if (!shell) return;
    shell.classList.remove('is-visible');
    shell.style.left = '';
    shell.style.top = '';
    shell.style.right = '';
    shell.style.bottom = '';
  }

  function positionReviewSpotlightPopover(sourceEl) {
    const shell = document.getElementById('reviewsSpotlightPopover');
    const stage = document.getElementById('reviewsSpotlightStage');
    if (!shell || !stage || !sourceEl || isMobileReviewSpotlight()) return;
    const stageRect = stage.getBoundingClientRect();
    const sourceRect = sourceEl.getBoundingClientRect();
    const gap = 14;
    const maxLeft = Math.max(12, stageRect.width - shell.offsetWidth - 12);
    const maxTop = Math.max(12, stageRect.height - shell.offsetHeight - 12);
    let left;
    if ((sourceRect.left - stageRect.left) < (stageRect.width * 0.52)) {
      left = (sourceRect.right - stageRect.left) + gap;
    } else {
      left = (sourceRect.left - stageRect.left) - shell.offsetWidth - gap;
    }
    let top = (sourceRect.top - stageRect.top) + ((sourceRect.height - shell.offsetHeight) / 2);
    left = Math.min(Math.max(12, left), maxLeft);
    top = Math.min(Math.max(12, top), maxTop);
    shell.style.left = `${Math.round(left)}px`;
    shell.style.top = `${Math.round(top)}px`;
    shell.style.right = 'auto';
    shell.style.bottom = 'auto';
  }

  function renderReviewSpotlightHover(item, sourceEl = null) {
    const shell = document.getElementById('reviewsSpotlightPopover');
    if (!shell) return;
    const target = item || null;
    const thumb = document.getElementById('reviewsSpotlightPopoverThumb');
    const meta = document.getElementById('reviewsSpotlightPopoverMeta');
    const title = document.getElementById('reviewsSpotlightPopoverTitle');
    const starsEl = document.getElementById('reviewsSpotlightPopoverStars');
    const byline = document.getElementById('reviewsSpotlightPopoverByline');
    const quote = document.getElementById('reviewsSpotlightPopoverQuote');
    const link = document.getElementById('reviewsSpotlightPopoverLink');
    if (!thumb || !meta || !title || !starsEl || !byline || !quote || !link) return;

    if (!target) {
      meta.textContent = 'Review card';
      title.textContent = 'Hover a note to inspect the review.';
      starsEl.innerHTML = stars(5);
      byline.textContent = 'Reviewer, date, and media data appear here.';
      quote.textContent = '';
      thumb.src = FALLBACK_IMAGE;
      thumb.alt = '';
      link.href = 'reviews.html';
      hideReviewSpotlightPopover();
      return;
    }

    thumb.src = target.image || FALLBACK_IMAGE;
    thumb.alt = `${target.title} artwork`;
    thumb.onerror = () => {
      thumb.onerror = null;
      thumb.src = FALLBACK_IMAGE;
    };
    meta.textContent = `${target.mediaLabel} review`;
    title.textContent = target.title;
    starsEl.innerHTML = stars(Number(target.rating || 0));
    byline.textContent = `${target.reviewer} • ${target.rating.toFixed(1)}/5 • ${target.dateLabel}`;
    quote.textContent = String(target.quote || '').trim();
    link.href = target.href || 'reviews.html';
    positionReviewSpotlightPopover(sourceEl);
    shell.classList.add('is-visible');
  }

  function applyReviewSpotlight(index, fromUser = false, incomingClass = '') {
    if (!reviewSpotlightItems.length) return;
    reviewSpotlightIndex = normalizeReviewSpotlightIndex(index);
    renderReviewSpotlightCards(incomingClass);
    reviewSpotlightHoverIndex = null;
    hideReviewSpotlightPopover();
    if (fromUser) resetReviewSpotlightTimer();
  }

  function finishMobileReviewSpotlightTransition(stageEl) {
    reviewSpotlightTransitioning = false;
    if (stageEl) stageEl.classList.remove('is-mobile-shuffling');
  }

  function showReviewSpotlight(index, fromUser = false) {
    if (!reviewSpotlightItems.length) return;
    const nextIndex = normalizeReviewSpotlightIndex(index);
    if (
      !isMobileReviewSpotlight()
      || prefersReducedMotion()
      || reviewSpotlightItems.length < 2
      || nextIndex === reviewSpotlightIndex
    ) {
      applyReviewSpotlight(nextIndex, fromUser);
      return;
    }

    const stageEl = document.getElementById('reviewsSpotlightStage');
    const activeCard = stageEl?.querySelector('.reviews-spotlight-card.is-active') || null;
    if (!stageEl || !activeCard) {
      applyReviewSpotlight(nextIndex, fromUser, 'is-tearing-in');
      return;
    }

    if (reviewSpotlightTransitioning) {
      reviewSpotlightPendingIndex = nextIndex;
      return;
    }

    reviewSpotlightTransitioning = true;
    stageEl.classList.add('is-mobile-shuffling');
    activeCard.classList.add('is-tearing-out');

    window.setTimeout(() => {
      applyReviewSpotlight(nextIndex, fromUser, 'is-tearing-in');
      const incomingCard = stageEl.querySelector('.reviews-spotlight-card.is-active');
      if (!incomingCard) {
        finishMobileReviewSpotlightTransition(stageEl);
        reviewSpotlightPendingIndex = null;
        return;
      }
      incomingCard.addEventListener('animationend', () => {
        incomingCard.classList.remove('is-tearing-in');
        const pendingIndex = reviewSpotlightPendingIndex;
        finishMobileReviewSpotlightTransition(stageEl);
        if (pendingIndex != null && pendingIndex !== reviewSpotlightIndex) {
          reviewSpotlightPendingIndex = null;
          showReviewSpotlight(pendingIndex, false);
          return;
        }
        reviewSpotlightPendingIndex = null;
      }, { once: true });
    }, 170);
  }

  function renderReviewSpotlight(rows) {
    renderReviewSpotlightStats(rows);
    const nextItems = buildReviewSpotlightItems(rows);
    const currentKey = reviewSpotlightItems[reviewSpotlightIndex]?.key || '';
    reviewSpotlightItems = nextItems;

    if (!reviewSpotlightItems.length) {
      reviewSpotlightItems = [{
        key: 'empty',
        media: 'all',
        mediaLabel: 'Reviews',
        mediaIcon: 'fa-star',
        title: 'No reviews yet',
        subtitle: '',
        quote: 'As soon as people start posting ratings and writeups, this spotlight will fill in automatically.',
        reviewer: '@zo2y',
        rating: 0,
        dateLabel: 'Waiting',
        href: 'reviews.html',
        image: FALLBACK_IMAGE
      }];
    }

    const preservedIndex = currentKey
      ? reviewSpotlightItems.findIndex((item) => item.key === currentKey)
      : -1;
    reviewSpotlightIndex = preservedIndex >= 0 ? preservedIndex : 0;
    showReviewSpotlight(reviewSpotlightIndex, false);
    resetReviewSpotlightTimer();
  }

  function wireReviewSpotlight() {
    const stage = document.getElementById('reviewsSpotlightStage');
    const nextBtn = document.getElementById('reviewsSpotlightMobileNext');
    if (!stage) return;
    if (stage.dataset.wired === '1') return;
    stage.dataset.wired = '1';

    stage.addEventListener('mouseenter', stopReviewSpotlightTimer);
    stage.addEventListener('mouseleave', () => {
      reviewSpotlightHoverIndex = null;
      hideReviewSpotlightPopover();
      resetReviewSpotlightTimer();
    });

    nextBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showReviewSpotlight(reviewSpotlightIndex + 1, true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopReviewSpotlightTimer();
      else resetReviewSpotlightTimer();
    });
  }

  function render() {
    const listEl = document.getElementById('reviewsList');
    const summaryEl = document.getElementById('summaryText');
    if (!listEl) return;

    const rows = filteredRows();
    renderReviewSpotlight(rows);
    if (summaryEl) {
      const label = mediaFilter === 'all' ? 'all media' : (LABEL_BY_MEDIA[mediaFilter] || mediaFilter);
      summaryEl.textContent = `${rows.length} review${rows.length === 1 ? '' : 's'} shown for ${label}.`;
    }

    if (!rows.length) {
      listEl.innerHTML = '<div class="empty">No reviews found for this filter.</div>';
      return;
    }

    listEl.innerHTML = rows.map((row) => {
      const media = String(row.mediaType || '').toLowerCase();
      const meta = getMeta(media, row.itemId);
      const title = escapeHtml(meta.title || 'Untitled');
      const subtitle = escapeHtml(meta.subtitle || (LABEL_BY_MEDIA[media] || ''));
      const reviewer = escapeHtml(getReviewer(row.userId));
      const rating = Math.max(0, Math.min(5, Number(row.rating || 0)));
      const mediaLabel = escapeHtml(LABEL_BY_MEDIA[media] || 'Media');
      const mediaIcon = escapeHtml(ICON_BY_MEDIA[media] || 'fa-shapes');
      const href = escapeHtml(meta.href || '#');
      const image = escapeHtml(safeHttps(meta.image || '') || FALLBACK_IMAGE);
      const comment = escapeHtml(String(row.comment || '').trim()) || 'No written comment provided.';
      const dateText = escapeHtml(formatDate(row.createdAt));
      return `
        <a class="card" href="${href}" data-media="${escapeHtml(media)}" data-item-id="${escapeHtml(row.itemId)}">
          <div>
            <div class="top">
              <span class="badge"><i class="fa-solid ${mediaIcon}"></i> ${mediaLabel}</span>
              <span class="date">${dateText}</span>
            </div>
            <h3 class="title" title="${title}">${title}</h3>
            <div class="meta">Reviewed by ${reviewer} • ${subtitle}</div>
        <div class="stars">${stars(rating)}<span>${rating}/5</span></div>
            <p class="comment">${comment}</p>
          </div>
          <div class="art"><img src="${image}" alt="${title}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" /></div>
        </a>
      `;
    }).join('');
  }

  function wireFilters() {
    const wrap = document.getElementById('mediaFilters');
    wrap?.querySelectorAll('.chip[data-media]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mediaFilter = String(btn.getAttribute('data-media') || 'all').toLowerCase();
        wrap.querySelectorAll('.chip[data-media]').forEach((node) => node.classList.toggle('active', node === btn));
        render();
      });
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      sortMode = String(e.target.value || 'newest');
      render();
    });
  }

  async function loadPage() {
    const listEl = document.getElementById('reviewsList');
    if (listEl) listEl.innerHTML = '<div class="empty">Loading reviews...</div>';

    await ensureSupabase();
    if (!client) {
      if (listEl) listEl.innerHTML = '<div class="empty">Could not connect to reviews right now.</div>';
      return;
    }

    const grouped = await Promise.all(SOURCES.map((source) => fetchSourceReviews(source)));
    reviews = grouped.flat().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!reviews.length) {
      if (listEl) listEl.innerHTML = '<div class="empty">No reviews have been posted yet.</div>';
      const summary = document.getElementById('summaryText');
      if (summary) summary.textContent = '0 reviews found.';
      return;
    }

    await Promise.allSettled([
      loadUsers(reviews),
      hydrateLocalMeta(reviews),
      hydrateRemoteMeta(reviews.slice(0, 180))
    ]);

    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireFilters();
    wireReviewSpotlight();
    void loadAuthState();
    void loadPage();
    if (window.initUniversalSearch) {
      const initSearch = () => window.initUniversalSearch({ input: '#globalSearch', fallbackRoute: 'movies.html' });
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(initSearch, { timeout: 1200 });
      } else {
        window.setTimeout(initSearch, 0);
      }
    }
  });
})();





