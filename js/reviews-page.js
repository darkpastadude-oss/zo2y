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
    { mediaType: 'music', table: 'music_reviews', idField: 'track_id', label: 'Music', icon: 'fa-music' }
  ];

  const LABEL_BY_MEDIA = Object.fromEntries(SOURCES.map((r) => [r.mediaType, r.label]));
  const ICON_BY_MEDIA = Object.fromEntries(SOURCES.map((r) => [r.mediaType, r.icon]));

  let client = null;
  let currentUser = null;
  let mediaFilter = 'all';
  let sortMode = 'newest';
  let reviews = [];
  const users = new Map();
  const itemMeta = new Map();

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
      music: []
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

    await Promise.allSettled([...movieTasks, ...tvTasks, ...gameTasks, ...musicTasks, ...bookTasks]);
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

  function render() {
    const listEl = document.getElementById('reviewsList');
    const summaryEl = document.getElementById('summaryText');
    if (!listEl) return;

    const rows = filteredRows();
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
    void loadAuthState();
    void loadPage();
    if (window.initUniversalSearch) {
      window.initUniversalSearch({ input: '#globalSearch', fallbackRoute: 'movies.html' });
    }
  });
})();

