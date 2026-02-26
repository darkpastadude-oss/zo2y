(function () {
  const TMDB_PROXY_BASE = '/api/tmdb';
  const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  const IGDB_PROXY_BASE = '/api/igdb';
  const BOOKS_PROXY_BASE = '/api/books';
  const MUSIC_PROXY_BASE = '/api/music';
  const MIN_QUERY_LEN = 2;
  const SEARCH_DEBOUNCE_MS = 140;
  const REQUEST_TIMEOUT_MS = 3400;
  const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;
  const SEARCH_CACHE_MAX_ENTRIES = 60;

  const suggestionCache = new Map();

  function toHttpsUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  }

  function ensureStyles() {
    if (document.getElementById('universal-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'universal-search-styles';
    style.textContent = `
      .universal-search-dropdown {
        position: fixed;
        z-index: 9999;
        width: 360px;
        max-width: calc(100vw - 20px);
        max-height: min(70vh, 460px);
        overflow: auto;
        background: #132347;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 12px;
        box-shadow: 0 12px 36px rgba(0,0,0,0.35);
        display: none;
      }

      .universal-search-group {
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .universal-search-group:last-child {
        border-bottom: 0;
      }

      .universal-search-group-title {
        padding: 8px 10px 4px;
        font-size: 11px;
        color: #8ca3c7;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .universal-search-item {
        width: 100%;
        background: transparent;
        border: 0;
        color: #fff;
        text-align: left;
        padding: 9px 10px;
        cursor: pointer;
        display: grid;
        grid-template-columns: 34px 1fr;
        gap: 8px;
        align-items: center;
      }

      .universal-search-item:hover,
      .universal-search-item.active {
        background: rgba(245, 158, 11, 0.14);
      }

      .universal-search-thumb {
        width: 34px;
        height: 48px;
        border-radius: 6px;
        background: #0f1f40;
        overflow: hidden;
        display: grid;
        place-items: center;
        color: #8ca3c7;
        font-size: 12px;
      }

      .universal-search-thumb.landscape {
        height: 26px;
      }

      .universal-search-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .universal-search-title {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
      }

      .universal-search-sub {
        margin-top: 2px;
        color: #8ca3c7;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function groupByType(items) {
    const buckets = new Map();
    items.forEach((item) => {
      if (!buckets.has(item.type)) buckets.set(item.type, []);
      buckets.get(item.type).push(item);
    });
    return buckets;
  }

  function normalizeQuery(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function pruneSuggestionCache() {
    if (suggestionCache.size <= SEARCH_CACHE_MAX_ENTRIES) return;
    const entries = Array.from(suggestionCache.entries()).sort((a, b) => (a[1]?.ts || 0) - (b[1]?.ts || 0));
    while (entries.length > SEARCH_CACHE_MAX_ENTRIES) {
      const entry = entries.shift();
      if (!entry) break;
      suggestionCache.delete(entry[0]);
    }
  }

  function readCachedSuggestions(queryKey) {
    if (!queryKey) return null;
    const cached = suggestionCache.get(queryKey);
    if (!cached) return null;
    if ((Date.now() - Number(cached.ts || 0)) > SEARCH_CACHE_TTL_MS) {
      suggestionCache.delete(queryKey);
      return null;
    }
    return Array.isArray(cached.items) ? cached.items : null;
  }

  function writeCachedSuggestions(queryKey, items) {
    if (!queryKey || !Array.isArray(items)) return;
    suggestionCache.set(queryKey, { ts: Date.now(), items });
    pruneSuggestionCache();
  }

  async function fetchJsonWithTimeout(url, { signal = null, headers = null, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let abortListener = null;
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        throw new DOMException('Aborted', 'AbortError');
      }
      abortListener = () => controller.abort();
      signal.addEventListener('abort', abortListener, { once: true });
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: headers || undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } finally {
      clearTimeout(timer);
      if (signal && abortListener) {
        signal.removeEventListener('abort', abortListener);
      }
    }
  }

  async function fetchMoviesAndTv(query, signal) {
    const url = `${TMDB_PROXY_BASE}/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`;
    const json = await fetchJsonWithTimeout(url, { signal });
    if (!json) return [];

    const items = Array.isArray(json.results) ? json.results : [];
    const mapped = [];
    for (const item of items) {
      if (mapped.length >= 8) break;
      if (item.media_type === 'movie') {
        mapped.push({
          type: 'Movies',
          title: item.title || 'Movie',
          sub: item.release_date ? item.release_date.slice(0, 4) : 'Movie',
          href: item.id ? `movie.html?id=${encodeURIComponent(item.id)}` : 'movies.html',
          image: item.poster_path ? toHttpsUrl(`${TMDB_POSTER}${item.poster_path}`) : '',
          landscape: false
        });
        continue;
      }
      if (item.media_type === 'tv') {
        mapped.push({
          type: 'TV Shows',
          title: item.name || 'TV Show',
          sub: item.first_air_date ? item.first_air_date.slice(0, 4) : 'TV Show',
          href: item.id ? `tvshow.html?id=${encodeURIComponent(item.id)}` : 'tvshows.html',
          image: item.poster_path ? toHttpsUrl(`${TMDB_POSTER}${item.poster_path}`) : '',
          landscape: false
        });
      }
    }
    return mapped;
  }

  async function fetchGames(query, signal) {
    let json = null;
    if (window.ZO2Y_IGDB && typeof window.ZO2Y_IGDB.request === 'function') {
      try {
        json = await window.ZO2Y_IGDB.request('/games', { search: query, page_size: 4 });
      } catch (_err) {
        return [];
      }
    } else {
      json = await fetchJsonWithTimeout(`${IGDB_PROXY_BASE}/games?search=${encodeURIComponent(query)}&page_size=4`, { signal });
      if (!json) return [];
    }

    const items = Array.isArray(json.results) ? json.results : [];
    return items.map((g) => ({
      type: 'Games',
      title: g.name || 'Game',
      sub: g.released ? g.released.slice(0, 4) : 'Game',
      href: g.id ? `game.html?id=${encodeURIComponent(g.id)}` : 'games.html',
      image: toHttpsUrl(g.cover || ''),
      landscape: true
    }));
  }

  async function fetchBooks(query, signal) {
    const buildOpenLibraryCoverUrl = (doc, size = 'L') => {
      const safeSize = ['S', 'M', 'L'].includes(String(size || '').toUpperCase())
        ? String(size || 'L').toUpperCase()
        : 'L';
      const coverId = Number(doc?.cover_i || 0) || 0;
      if (coverId > 0) {
        return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${safeSize}.jpg`;
      }
      const isbnRaw = Array.isArray(doc?.isbn) ? String(doc.isbn[0] || '').trim() : '';
      const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
      if (isbn) {
        return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${safeSize}.jpg`;
      }
      return '';
    };

    const json = await fetchJsonWithTimeout(
      `${BOOKS_PROXY_BASE}/search?q=${encodeURIComponent(query)}&limit=4&language=eng&page=1`,
      { signal }
    );
    const docs = Array.isArray(json?.docs)
      ? json.docs
      : (Array.isArray(json?.items) ? json.items : []);

    return docs.slice(0, 4).map((doc, idx) => {
      const title = String(doc?.title || '').trim() || 'Book';
      const author = Array.isArray(doc?.author_name) && doc.author_name.length
        ? String(doc.author_name[0] || '').trim()
        : 'Book';
      const googleVolumeId = String(doc?._googleVolumeId || '').trim();
      const workKey = String(doc?.key || '').trim();
      let itemId = googleVolumeId;
      if (!itemId && workKey.startsWith('/works/')) itemId = workKey.replace('/works/', '').trim();
      if (!itemId) {
        itemId = `search-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `book-${idx}`}`;
      }
      const image = toHttpsUrl(
        doc?._googleThumbnail ||
        doc?.coverImage ||
        buildOpenLibraryCoverUrl(doc, 'L') ||
        buildOpenLibraryCoverUrl(doc, 'M') ||
        ''
      );
      return {
        type: 'Books',
        title,
        sub: author,
        href: `book.html?id=${encodeURIComponent(itemId)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`,
        image,
        landscape: false
      };
    });
  }

  async function fetchMusic(query, signal) {
    const proxy = await fetchJsonWithTimeout(
      `${MUSIC_PROXY_BASE}/search?q=${encodeURIComponent(query)}&limit=6&market=US&type=track,album`,
      { signal }
    );
    if (proxy) {
      const trackRows = Array.isArray(proxy?.tracks)
        ? proxy.tracks
        : (Array.isArray(proxy?.results) ? proxy.results : []);
      const albumRows = Array.isArray(proxy?.albums) ? proxy.albums : [];
      const tracks = trackRows.slice(0, 4).map((track) => ({
        type: 'Music',
        title: track.name || 'Track',
        sub: Array.isArray(track.artists) && track.artists.length ? track.artists.join(', ') : 'Artist',
        href: track.id ? `song.html?id=${encodeURIComponent(track.id)}` : 'music.html',
        image: toHttpsUrl(track.image || ''),
        landscape: false
      }));
      const albums = albumRows.slice(0, 3).map((album) => ({
        type: 'Music Album',
        title: album.name || 'Album',
        sub: Array.isArray(album.artists) && album.artists.length ? album.artists.join(', ') : 'Artist',
        href: album.external_url || 'music.html',
        image: toHttpsUrl(album.image || ''),
        landscape: false
      }));
      const merged = [];
      const trackQueue = [...tracks];
      const albumQueue = [...albums];
      while (merged.length < 6 && (trackQueue.length || albumQueue.length)) {
        if (trackQueue.length) merged.push(trackQueue.shift());
        if (albumQueue.length && merged.length < 6) merged.push(albumQueue.shift());
        if (trackQueue.length && merged.length < 6) merged.push(trackQueue.shift());
      }
      return merged.slice(0, 6);
    }

    const [itunesTracks, itunesAlbums] = await Promise.all([
      fetchJsonWithTimeout(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=4`,
        { signal }
      ).catch(() => null),
      fetchJsonWithTimeout(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=3`,
        { signal }
      ).catch(() => null)
    ]);
    const tracks = (Array.isArray(itunesTracks?.results) ? itunesTracks.results : []).map((track) => ({
      type: 'Music',
      title: track.trackName || 'Track',
      sub: track.artistName || 'Artist',
      href: track.trackId ? `song.html?id=${encodeURIComponent(track.trackId)}&source=itunes` : 'music.html',
      image: toHttpsUrl(track.artworkUrl100 || track.artworkUrl60 || ''),
      landscape: false
    }));
    const albums = (Array.isArray(itunesAlbums?.results) ? itunesAlbums.results : []).map((album) => ({
      type: 'Music Album',
      title: album.collectionName || 'Album',
      sub: album.artistName || 'Artist',
      href: album.collectionViewUrl || 'music.html',
      image: toHttpsUrl(album.artworkUrl100 || album.artworkUrl60 || ''),
      landscape: false
    }));
    const merged = [];
    const trackQueue = [...tracks];
    const albumQueue = [...albums];
    while (merged.length < 6 && (trackQueue.length || albumQueue.length)) {
      if (trackQueue.length) merged.push(trackQueue.shift());
      if (albumQueue.length && merged.length < 6) merged.push(albumQueue.shift());
      if (trackQueue.length && merged.length < 6) merged.push(trackQueue.shift());
    }
    return merged.slice(0, 6);
  }

  async function fetchAllSuggestions(query, signal) {
    const normalized = normalizeQuery(query);
    const cached = readCachedSuggestions(normalized);
    if (cached) return cached;

    const [moviesTv, games, books, music] = await Promise.all([
      fetchMoviesAndTv(normalized, signal).catch(() => []),
      fetchGames(normalized, signal).catch(() => []),
      fetchBooks(normalized, signal).catch(() => []),
      fetchMusic(normalized, signal).catch(() => [])
    ]);

    const merged = [...moviesTv, ...games, ...books, ...music].slice(0, 18);
    writeCachedSuggestions(normalized, merged);
    return merged;
  }

  window.initUniversalSearch = function initUniversalSearch(options) {
    ensureStyles();

    const input = typeof options?.input === 'string'
      ? document.querySelector(options.input)
      : options?.input;

    if (!input || input.dataset.universalSearchInit === '1') return;
    input.dataset.universalSearchInit = '1';

    const fallbackRoute = Object.prototype.hasOwnProperty.call(options || {}, 'fallbackRoute')
      ? options.fallbackRoute
      : 'movies.html';
    const dropdown = document.createElement('div');
    dropdown.className = 'universal-search-dropdown';
    document.body.appendChild(dropdown);

    let suggestions = [];
    let activeIndex = -1;
    let activeRequestId = 0;
    let activeAbortController = null;

    function hide() {
      dropdown.style.display = 'none';
      activeIndex = -1;
    }

    function position() {
      const rect = input.getBoundingClientRect();
      dropdown.style.left = `${Math.max(10, rect.left)}px`;
      dropdown.style.top = `${rect.bottom + 6}px`;
      dropdown.style.width = `${Math.min(rect.width, window.innerWidth - 20)}px`;
    }

    function render() {
      if (!suggestions.length) {
        dropdown.innerHTML = '';
        hide();
        return;
      }

      const grouped = groupByType(suggestions);
      let globalIndex = -1;
      const sections = [];
      for (const [type, items] of grouped.entries()) {
        const rows = items.map((item) => {
          globalIndex += 1;
          const thumbClass = `universal-search-thumb${item.landscape ? ' landscape' : ''}`;
          return `
            <button class="universal-search-item${globalIndex === activeIndex ? ' active' : ''}" data-index="${globalIndex}">
              <span class="${thumbClass}">${item.image ? `<img src="${item.image}" alt="">` : '<i class="fas fa-image"></i>'}</span>
              <span>
                <div class="universal-search-title">${escapeHtml(item.title)}</div>
                <div class="universal-search-sub">${escapeHtml(item.sub)}</div>
              </span>
            </button>
          `;
        }).join('');
        sections.push(`<div class="universal-search-group"><div class="universal-search-group-title">${escapeHtml(type)}</div>${rows}</div>`);
      }

      dropdown.innerHTML = sections.join('');
      dropdown.querySelectorAll('.universal-search-item').forEach((btn) => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const idx = Number(btn.getAttribute('data-index'));
          const item = suggestions[idx];
          if (item?.href) window.location.href = item.href;
        });
      });

      position();
      dropdown.style.display = 'block';
    }

    const loadSuggestions = debounce(async (query) => {
      const normalized = normalizeQuery(query);
      if (!normalized || normalized.length < MIN_QUERY_LEN) {
        if (activeAbortController) activeAbortController.abort();
        suggestions = [];
        render();
        return;
      }

      const cached = readCachedSuggestions(normalized);
      if (cached) {
        suggestions = cached;
        activeIndex = -1;
        render();
        return;
      }

      activeRequestId += 1;
      const requestId = activeRequestId;
      if (activeAbortController) activeAbortController.abort();
      activeAbortController = new AbortController();

      try {
        const next = await fetchAllSuggestions(normalized, activeAbortController.signal);
        if (requestId !== activeRequestId) return;
        suggestions = next;
        activeIndex = -1;
        render();
      } catch (err) {
        if (requestId !== activeRequestId) return;
        if (String(err?.name || '') === 'AbortError') return;
        suggestions = [];
        render();
      }
    }, SEARCH_DEBOUNCE_MS);

    input.addEventListener('input', () => {
      loadSuggestions(input.value.trim());
    });

    input.addEventListener('keydown', (e) => {
      if (!suggestions.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(suggestions.length - 1, activeIndex + 1);
        render();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(-1, activeIndex - 1);
        render();
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = suggestions[activeIndex];
        if (item?.href) window.location.href = item.href;
      }
    });

    input.addEventListener('focus', () => {
      if (suggestions.length) {
        position();
        dropdown.style.display = 'block';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && activeIndex < 0 && input.value.trim() && fallbackRoute) {
        const route = `${fallbackRoute}${fallbackRoute.includes('?') ? '&' : '?'}search=${encodeURIComponent(input.value.trim())}`;
        window.location.href = route;
      }
    });

    window.addEventListener('resize', position);
    document.addEventListener('click', (e) => {
      if (e.target === input || dropdown.contains(e.target)) return;
      hide();
    });
  };
})();
