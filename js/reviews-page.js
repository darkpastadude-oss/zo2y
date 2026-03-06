(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  const FALLBACK_IMAGE = 'images/logo.png';
  const REVIEW_LIMIT = 70;

  const SOURCES = [
    { mediaType: 'movie', table: 'movie_reviews', idField: 'movie_id', label: 'Movie', icon: 'fa-film' },
    { mediaType: 'tv', table: 'tv_reviews', idField: 'tv_id', label: 'TV', icon: 'fa-tv' },
    { mediaType: 'anime', table: 'anime_reviews', idField: 'anime_id', label: 'Anime', icon: 'fa-dragon' },
    { mediaType: 'game', table: 'game_reviews', idField: 'game_id', label: 'Game', icon: 'fa-gamepad' },
    { mediaType: 'book', table: 'book_reviews', idField: 'book_id', label: 'Book', icon: 'fa-book' },
    { mediaType: 'music', table: 'music_reviews', idField: 'track_id', label: 'Music', icon: 'fa-music' },
    { mediaType: 'travel', table: 'travel_reviews', idField: 'country_code', label: 'Travel', icon: 'fa-earth-americas' }
  ];

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
  const users = new Map();
  const itemMeta = new Map();
  const REVIEW_SPOTLIGHT_ROTATE_MS = 7000;

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
    const n = Math.max(0, Math.min(5, Number(rating || 0)));
    return `${'\u2605'.repeat(n)}${'\u2606'.repeat(5 - n)}`;
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
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
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
      const json = await fetchJson(`/api/igdb/games/${encodeURIComponent(id)}`, 8500);
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

  function renderReviewSpotlightDots() {
    const dotsEl = document.getElementById('reviewsSpotlightDots');
    if (!dotsEl) return;
    dotsEl.innerHTML = reviewSpotlightItems.map((item, index) => `
      <button
        class="reviews-spotlight-dot${index === reviewSpotlightIndex ? ' active' : ''}"
        type="button"
        data-review-spotlight-index="${index}"
        aria-label="Show review spotlight ${index + 1}: ${escapeHtml(item.title)}"></button>
    `).join('');
    dotsEl.querySelectorAll('[data-review-spotlight-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextIndex = Number(btn.getAttribute('data-review-spotlight-index'));
        if (!Number.isInteger(nextIndex)) return;
        showReviewSpotlight(nextIndex, true);
      });
    });
  }

  function renderReviewSpotlightFloatingCards() {
    const stackEl = document.getElementById('reviewsSpotlightFloatingStack');
    if (!stackEl) return;
    const cards = reviewSpotlightItems
      .filter((_, index) => index !== reviewSpotlightIndex)
      .slice(0, 3);

    if (!cards.length) {
      stackEl.innerHTML = '';
      return;
    }

    stackEl.innerHTML = cards.map((item) => {
      const targetIndex = reviewSpotlightItems.findIndex((entry) => entry.key === item.key);
      const backgroundImage = String(item.image || '').trim();
      const safeBackground = backgroundImage
        ? ` style="background-image:url('${escapeHtml(backgroundImage)}')"`
        : '';
      return `
        <button class="reviews-floating-card${targetIndex === reviewSpotlightIndex ? ' is-active' : ''}" type="button" data-review-floating-index="${targetIndex}">
          <div class="reviews-floating-card-bg"${safeBackground}></div>
          <div class="reviews-floating-card-overlay"></div>
          <div class="reviews-floating-card-content">
            <p class="reviews-floating-card-kicker">${escapeHtml(item.mediaLabel)}</p>
            <h3 class="reviews-floating-card-title">${escapeHtml(item.title)}</h3>
            <div class="reviews-floating-card-meta">
              <span><i class="fa-solid fa-star-half-stroke"></i> ${escapeHtml(item.rating.toFixed(1))}/5</span>
              <span>${escapeHtml(item.reviewer)}</span>
            </div>
          </div>
        </button>
      `;
    }).join('');

    stackEl.querySelectorAll('[data-review-floating-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextIndex = Number(btn.getAttribute('data-review-floating-index'));
        if (!Number.isInteger(nextIndex)) return;
        showReviewSpotlight(nextIndex, true);
      });
    });
  }

  function showReviewSpotlight(index, fromUser = false) {
    if (!reviewSpotlightItems.length) return;
    reviewSpotlightIndex = ((Number(index) || 0) % reviewSpotlightItems.length + reviewSpotlightItems.length) % reviewSpotlightItems.length;
    const item = reviewSpotlightItems[reviewSpotlightIndex];
    const card = document.getElementById('reviewsSpotlightCard');
    const backdrop = document.getElementById('reviewsSpotlightBackdrop');
    const kicker = document.getElementById('reviewsSpotlightKicker');
    const title = document.getElementById('reviewsSpotlightTitle');
    const quote = document.getElementById('reviewsSpotlightQuote');
    const media = document.getElementById('reviewsSpotlightMedia');
    const score = document.getElementById('reviewsSpotlightScore');
    const author = document.getElementById('reviewsSpotlightAuthor');
    const date = document.getElementById('reviewsSpotlightDate');
    const open = document.getElementById('reviewsSpotlightOpen');
    const art = document.getElementById('reviewsSpotlightArt');
    if (!card || !backdrop || !kicker || !title || !quote || !media || !score || !author || !date || !open || !art) return;

    const backdropImage = String(item.image || '').trim();
    backdrop.style.backgroundImage = backdropImage
      ? `radial-gradient(circle at 82% 18%, rgba(245,158,11,.24), transparent 26%), linear-gradient(135deg, rgba(18,37,74,.96), rgba(10,19,40,.88)), url("${backdropImage}")`
      : 'radial-gradient(circle at 82% 18%, rgba(245,158,11,.24), transparent 26%), linear-gradient(135deg, rgba(18,37,74,.96), rgba(10,19,40,.88))';
    kicker.textContent = `${item.mediaLabel} spotlight`;
    title.textContent = item.title;
    quote.textContent = item.quote;
    media.innerHTML = `<i class="fa-solid ${escapeHtml(item.mediaIcon)}"></i> ${escapeHtml(item.mediaLabel)}`;
    score.innerHTML = `<i class="fa-solid fa-star-half-stroke"></i> ${escapeHtml(item.rating.toFixed(1))}/5`;
    author.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(item.reviewer)}`;
    date.innerHTML = `<i class="fa-regular fa-calendar"></i> ${escapeHtml(item.dateLabel)}`;
    open.href = item.href;
    card.dataset.href = item.href;
    art.src = item.image;
    art.alt = item.title;
    art.onerror = () => {
      art.onerror = null;
      art.src = FALLBACK_IMAGE;
    };
    renderReviewSpotlightDots();
    renderReviewSpotlightFloatingCards();
    if (fromUser) resetReviewSpotlightTimer();
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
    const card = document.getElementById('reviewsSpotlightCard');
    const prevBtn = document.getElementById('reviewsSpotlightPrev');
    const nextBtn = document.getElementById('reviewsSpotlightNext');
    if (!card || !prevBtn || !nextBtn) return;
    if (card.dataset.wired === '1') return;
    card.dataset.wired = '1';

    prevBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showReviewSpotlight(reviewSpotlightIndex - 1, true);
    });

    nextBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showReviewSpotlight(reviewSpotlightIndex + 1, true);
    });

    card.addEventListener('click', (event) => {
      if (event.target.closest('button, a')) return;
      const href = String(card.dataset.href || '').trim();
      if (href) window.location.href = href;
    });

    card.addEventListener('mouseenter', stopReviewSpotlightTimer);
    card.addEventListener('mouseleave', resetReviewSpotlightTimer);

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
      window.initUniversalSearch({ input: '#globalSearch', fallbackRoute: 'movies.html' });
    }
  });
})();

