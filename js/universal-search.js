(function () {
  const TMDB_PROXY_BASE = '/api/tmdb';
  const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500';
  const BOOKS_PROXY_BASE = '/api/books';
  const MUSIC_PROXY_BASE = '/api/music';
  const TRAVEL_API_BASE = '/api/restcountries';
  const IGDB_PROXY_BASE = '/api/igdb';
  const SPORTSDB_PROXY_BASE = String(window.ZO2Y_SPORTSDB_PROXY || '/api/sportsdb').trim() || '/api/sportsdb';

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim();
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const MIN_QUERY_LEN = 2;
  const SEARCH_DEBOUNCE_MS = 60;
  const REQUEST_TIMEOUT_MS = 6000;
  const SEARCH_CACHE_MAX_ENTRIES = 60;

  const suggestionCache = new Map();

  function toHttpsUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/^http:\/\//i, 'https://');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function normalizeQuery(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
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
      .universal-search-group { border-bottom: 1px solid rgba(255,255,255,0.08); }
      .universal-search-group:last-child { border-bottom: 0; }
      .universal-search-empty { padding: 12px 12px 13px; color: #8ca3c7; font-size: 12px; line-height: 1.45; }
      .universal-search-group-title { padding: 8px 10px 4px; font-size: 11px; color: #8ca3c7; text-transform: uppercase; letter-spacing: 0.6px; }
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
      .universal-search-item.active { background: rgba(245, 158, 11, 0.14); }
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
      .universal-search-thumb.landscape { height: 26px; }
      .universal-search-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .universal-search-title { font-size: 13px; font-weight: 600; line-height: 1.3; }
      .universal-search-sub { margin-top: 2px; color: #8ca3c7; font-size: 11px; }
    `;
    document.head.appendChild(style);
  }

  function groupByType(items) {
    const buckets = new Map();
    (items || []).forEach((item) => {
      const key = String(item?.type || '').trim() || 'Other';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    });
    return buckets;
  }

  function withTimeout(promise, timeoutMs, signal) {
    let timer = null;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const localSignal = controller ? controller.signal : null;
    const chainedSignal = signal;
    const abort = () => {
      try { controller?.abort(); } catch (_err) {}
    };
    if (chainedSignal) {
      if (chainedSignal.aborted) abort();
      else chainedSignal.addEventListener('abort', abort, { once: true });
    }
    const raced = Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      })
    ]);
    return raced.finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  async function fetchJson(url, signal) {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: signal || undefined });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  }

  function buildSupabaseHeaders() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    return {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      accept: 'application/json'
    };
  }

  async function searchTmdb(query, signal) {
    const url = new URL(`${TMDB_PROXY_BASE}/search/multi`, window.location.origin);
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('page', '1');
    const json = await fetchJson(url.toString(), signal);
    const results = Array.isArray(json?.results) ? json.results : [];
    return results.map((row) => {
      const type = String(row?.media_type || '').trim();
      if (type !== 'movie' && type !== 'tv') return null;
      const id = String(row?.id || '').trim();
      const title = String(row?.title || row?.name || '').trim();
      if (!id || !title) return null;
      const poster = row?.poster_path ? `${TMDB_POSTER}${row.poster_path}` : '';
      const year = String((row?.release_date || row?.first_air_date || '')).slice(0, 4);
      return {
        type: type === 'tv' ? 'TV' : 'Movies',
        title,
        sub: year ? `${type === 'tv' ? 'TV' : 'Movie'} • ${year}` : (type === 'tv' ? 'TV' : 'Movie'),
        image: poster,
        href: type === 'tv' ? `tvshow.html?id=${encodeURIComponent(id)}` : `movie.html?id=${encodeURIComponent(id)}`
      };
    }).filter(Boolean);
  }

  async function searchBooks(query, signal) {
    const url = new URL(`${BOOKS_PROXY_BASE}/search`, window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '8');
    url.searchParams.set('page', '1');
    const json = await fetchJson(url.toString(), signal);
    const books = Array.isArray(json?.books) ? json.books : [];
    return books.map((b) => {
      const id = String(b?.id || b?.book_id || '').trim();
      const title = String(b?.title || b?.name || '').trim();
      if (!title) return null;
      const author = Array.isArray(b?.authors) ? String(b.authors[0] || '').trim() : String(b?.author || '').trim();
      return {
        type: 'Books',
        title,
        sub: author ? `Book • ${author}` : 'Book',
        image: toHttpsUrl(b?.image || b?.cover || b?.thumbnail || ''),
        href: id ? `book.html?id=${encodeURIComponent(id)}` : 'books.html'
      };
    }).filter(Boolean);
  }

  async function searchMusic(query, signal) {
    const url = new URL(`${MUSIC_PROXY_BASE}/search`, window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '10');
    const json = await fetchJson(url.toString(), signal);
    const results = Array.isArray(json?.results) ? json.results : [];
    return results.slice(0, 10).map((row) => {
      const title = String(row?.title || row?.name || '').trim();
      const id = String(row?.id || '').trim();
      if (!title) return null;
      const genre = String(row?.subtitle || row?.genre || '').trim();
      return {
        type: 'Music',
        title,
        sub: genre ? `Artist • ${genre}` : 'Artist',
        image: toHttpsUrl(row?.image || ''),
        href: row?.externalUrl ? row.externalUrl : (id ? `music.html` : 'music.html')
      };
    }).filter(Boolean);
  }

  async function searchTravel(query, signal) {
    const url = new URL(`${TRAVEL_API_BASE}/name/${encodeURIComponent(query)}`);
    url.searchParams.set('fields', 'name,cca2,cca3,flags,region,subregion,capital');
    const json = await fetchJson(url.toString(), signal);
    const rows = Array.isArray(json) ? json : [];
    return rows.slice(0, 8).map((row) => {
      const code = String(row?.cca2 || row?.cca3 || '').trim();
      const title = String(row?.name?.common || row?.name?.official || '').trim();
      if (!code || !title) return null;
      return {
        type: 'Travel',
        title: `🇺🇳 ${title}`,
        sub: String(row?.region || '').trim() || 'Country',
        image: toHttpsUrl(row?.flags?.png || row?.flags?.svg || ''),
        href: `country.html?country=${encodeURIComponent(code)}`
      };
    }).filter(Boolean);
  }

  async function searchSports(query, signal) {
    const base = /^https?:\/\//i.test(SPORTSDB_PROXY_BASE)
      ? SPORTSDB_PROXY_BASE.replace(/\/+$/, '')
      : `${window.location.origin}${SPORTSDB_PROXY_BASE.startsWith('/') ? '' : '/'}${SPORTSDB_PROXY_BASE}`.replace(/\/+$/, '');
    const url = new URL(`${base}/searchteams.php`);
    url.searchParams.set('t', query);
    const json = await fetchJson(url.toString(), signal);
    const teams = Array.isArray(json?.teams) ? json.teams : [];
    return teams.slice(0, 10).map((team) => {
      const id = String(team?.idTeam || '').trim();
      const title = String(team?.strTeam || '').trim();
      if (!title) return null;
      const league = String(team?.strLeague || '').trim();
      const sport = String(team?.strSport || '').trim();
      const badge = toHttpsUrl(team?.strBadge || team?.strTeamBadge || team?.strLogo || '');
      return {
        type: 'Sports',
        title,
        sub: [league, sport].filter(Boolean).join(' • ') || 'Team',
        image: badge,
        href: id ? `team.html?id=${encodeURIComponent(id)}` : 'sports.html'
      };
    }).filter(Boolean);
  }

  async function searchGames(query, signal) {
    const url = new URL(`${IGDB_PROXY_BASE}/games`, window.location.origin);
    url.searchParams.set('search', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', '8');
    const json = await fetchJson(url.toString(), signal);
    const results = Array.isArray(json?.results) ? json.results : [];
    return results.slice(0, 8).map((row) => {
      const id = String(row?.id || row?.slug || '').trim();
      const title = String(row?.name || row?.title || '').trim();
      if (!title) return null;
      const cover = toHttpsUrl(row?.cover || row?.image || '');
      return {
        type: 'Games',
        title,
        sub: 'Game',
        image: cover,
        href: id ? `game.html?id=${encodeURIComponent(id)}` : 'games.html'
      };
    }).filter(Boolean);
  }

  async function searchBrands(query, signal) {
    const headers = buildSupabaseHeaders();
    if (!headers) return [];
    const tables = [
      { type: 'Fashion', table: 'fashion_brands', title: 'Fashion', icon: 'Fashion' },
      { type: 'Food', table: 'food_brands', title: 'Food', icon: 'Food' },
      { type: 'Cars', table: 'car_brands', title: 'Cars', icon: 'Cars' }
    ];
    const q = String(query || '').trim();
    if (!q) return [];
    const ilike = `%${q.replace(/%/g, '').slice(0, 80)}%`;
    const requests = tables.map(async (entry) => {
      const url = new URL(`${SUPABASE_URL}/rest/v1/${entry.table}`);
      url.searchParams.set('select', 'id,name,category,domain,logo_url');
      url.searchParams.set('name', `ilike.${ilike}`);
      url.searchParams.set('limit', '6');
      try {
        const res = await fetch(url.toString(), { headers, signal: signal || undefined });
        if (!res.ok) return [];
        const json = await res.json().catch(() => []);
        const rows = Array.isArray(json) ? json : [];
        return rows.map((row) => {
          const id = String(row?.id || '').trim();
          const title = String(row?.name || '').trim();
          if (!id || !title) return null;
          const category = String(row?.category || '').trim();
          const image = toHttpsUrl(row?.logo_url || '');
          return {
            type: entry.type,
            title,
            sub: category || entry.title,
            image,
            href: entry.type === 'Fashion' ? `fashion.html?brand=${encodeURIComponent(title)}`
              : (entry.type === 'Food' ? `food.html?brand=${encodeURIComponent(title)}`
                : `cars.html?brand=${encodeURIComponent(title)}`)
          };
        }).filter(Boolean);
      } catch (_err) {
        return [];
      }
    });
    const out = await Promise.all(requests);
    return out.flat();
  }

  async function searchPeople(query, signal) {
    const headers = buildSupabaseHeaders();
    if (!headers) return [];
    const q = String(query || '').trim().replace(/^@+/, '').slice(0, 40);
    if (!q) return [];
    const ilike = `%${q.replace(/%/g, '')}%`;
    const url = new URL(`${SUPABASE_URL}/rest/v1/user_profiles`);
    url.searchParams.set('select', 'id,username,full_name,avatar_url');
    url.searchParams.set('or', `(username.ilike.${ilike},full_name.ilike.${ilike})`);
    url.searchParams.set('limit', '8');
    try {
      const res = await fetch(url.toString(), { headers, signal: signal || undefined });
      if (!res.ok) return [];
      const json = await res.json().catch(() => []);
      const rows = Array.isArray(json) ? json : [];
      return rows.map((row) => {
        const id = String(row?.id || '').trim();
        const username = String(row?.username || '').trim();
        const name = String(row?.full_name || '').trim();
        if (!id) return null;
        const title = username ? `@${username}` : (name || 'User');
        return {
          type: 'People',
          title,
          sub: name || 'Profile',
          image: toHttpsUrl(row?.avatar_url || ''),
          href: `profile.html?id=${encodeURIComponent(id)}`
        };
      }).filter(Boolean);
    } catch (_err) {
      return [];
    }
  }

  function readCachedSuggestions(query) {
    const key = normalizeQuery(query);
    if (!key) return null;
    return suggestionCache.get(key) || null;
  }

  function writeCachedSuggestions(query, items) {
    const key = normalizeQuery(query);
    if (!key) return;
    suggestionCache.set(key, items || []);
    if (suggestionCache.size > SEARCH_CACHE_MAX_ENTRIES) {
      const first = suggestionCache.keys().next().value;
      if (first) suggestionCache.delete(first);
    }
  }

  async function fetchAllSuggestions(query, signal) {
    const cached = readCachedSuggestions(query);
    if (cached) return cached;

    const registry = window.Zo2yProviderRegistry;
    let merged = [];

    if (registry && typeof registry.searchUniversal === 'function') {
      try {
        const providerResults = await withTimeout(
          registry.searchUniversal(query, { limit: 8 }),
          REQUEST_TIMEOUT_MS,
          signal
        );
        if (providerResults) {
          Object.keys(providerResults).forEach(function (type) {
            const items = providerResults[type] || [];
            items.forEach(function (item) {
              if (!item || !item.title || !item.href) return;
              merged.push(item);
            });
          });
        }
      } catch (_err) {
        merged = [];
      }
    }

    if (merged.length === 0) {
      const jobs = [
        searchTmdb(query, signal),
        searchGames(query, signal),
        searchBooks(query, signal),
        searchMusic(query, signal),
        searchTravel(query, signal),
        searchSports(query, signal),
        searchBrands(query, signal),
        searchPeople(query, signal)
      ];

      const settled = await Promise.allSettled(jobs.map((p) => withTimeout(p, REQUEST_TIMEOUT_MS, signal)));
      settled.forEach((result) => {
        if (!result || result.status !== 'fulfilled') return;
        const items = Array.isArray(result.value) ? result.value : [];
        items.forEach((item) => {
          if (!item || !item.title || !item.href) return;
          merged.push(item);
        });
      });
    }

    // Compact: cap per type to keep dropdown readable.
    const byType = groupByType(merged);
    const out = [];
    const order = ['Movies', 'TV', 'Anime', 'Games', 'Books', 'Music', 'Travel', 'Sports', 'Fashion', 'Food', 'Cars', 'People'];
    const keys = Array.from(byType.keys()).sort((a, b) => {
      const ai = order.includes(a) ? order.indexOf(a) : order.length;
      const bi = order.includes(b) ? order.indexOf(b) : order.length;
      if (ai !== bi) return ai - bi;
      return String(a).localeCompare(String(b));
    });
    keys.forEach((type) => {
      const list = byType.get(type) || [];
      list.slice(0, 6).forEach((item) => out.push(item));
    });

    writeCachedSuggestions(query, out);
    return out;
  }

  window.initUniversalSearch = function initUniversalSearch(options) {
    ensureStyles();
    const input = typeof options?.input === 'string' ? document.querySelector(options.input) : options?.input;
    if (!input) return;
    const fallbackRoute = String(options?.fallbackRoute || '').trim();

    const dropdownId = 'universalSearchDropdown';
    let dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = dropdownId;
      dropdown.className = 'universal-search-dropdown';
      document.body.appendChild(dropdown);
    }

    let suggestions = [];
    let activeIndex = -1;
    let lastQuery = '';
    let hasResolvedQuery = false;
    let activeAbortController = null;
    let activeRequestId = 0;

    function hide() {
      dropdown.style.display = 'none';
    }

    function position() {
      const rect = input.getBoundingClientRect();
      dropdown.style.left = `${Math.max(10, rect.left)}px`;
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.width = `${Math.min(420, Math.max(280, rect.width))}px`;
    }

    function render() {
      if (!suggestions.length) {
        dropdown.innerHTML = hasResolvedQuery && lastQuery.length >= MIN_QUERY_LEN
          ? `<div class="universal-search-empty">No results for "${escapeHtml(lastQuery)}".</div>`
          : '';
        position();
        dropdown.style.display = (hasResolvedQuery && lastQuery.length >= MIN_QUERY_LEN) ? 'block' : 'none';
        return;
      }

      const buckets = groupByType(suggestions);
      const sections = [];
      const order = ['Movies', 'TV', 'Games', 'Books', 'Music', 'Travel', 'Sports', 'Fashion', 'Food', 'Cars', 'People'];
      const types = Array.from(buckets.keys()).sort((a, b) => {
        const ai = order.includes(a) ? order.indexOf(a) : order.length;
        const bi = order.includes(b) ? order.indexOf(b) : order.length;
        if (ai !== bi) return ai - bi;
        return String(a).localeCompare(String(b));
      });

      let globalIndex = 0;
      types.forEach((type) => {
        const rows = (buckets.get(type) || []).map((item) => {
          const idx = globalIndex++;
          const active = idx === activeIndex ? ' active' : '';
          const thumb = item.image
            ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
            : `<span>${escapeHtml(String(type || '').slice(0, 1))}</span>`;
          return `
            <button class="universal-search-item${active}" data-index="${idx}" type="button">
              <span class="universal-search-thumb">${thumb}</span>
              <span>
                <div class="universal-search-title">${escapeHtml(item.title)}</div>
                <div class="universal-search-sub">${escapeHtml(item.sub || '')}</div>
              </span>
            </button>
          `;
        }).join('');
        sections.push(`<div class="universal-search-group"><div class="universal-search-group-title">${escapeHtml(type)}</div>${rows}</div>`);
      });

      dropdown.innerHTML = sections.join('');
      dropdown.querySelectorAll('.universal-search-item').forEach((btn) => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const idx = Number(btn.getAttribute('data-index'));
          const item = suggestions[idx];
          if (!item?.href) return;
          // Enforce book results always go to book.html, never to openlibrary.org
          if (item.type === 'Books' && /openlibrary\.org/i.test(item.href)) {
            const bookId = new URL(item.href, window.location.origin).searchParams.get('id');
            window.location.href = bookId ? 'book.html?id=' + encodeURIComponent(bookId) : 'books.html';
            return;
          }
          window.location.href = item.href;
        });
      });
      position();
      dropdown.style.display = 'block';
    }

    const loadSuggestions = debounce(async (query) => {
      const normalized = normalizeQuery(query);
      lastQuery = normalized;
      if (!normalized || normalized.length < MIN_QUERY_LEN) {
        if (activeAbortController) activeAbortController.abort();
        suggestions = [];
        hasResolvedQuery = false;
        render();
        return;
      }
      const cached = readCachedSuggestions(normalized);
      if (cached) {
        suggestions = cached;
        activeIndex = -1;
        hasResolvedQuery = true;
        render();
        return;
      }
      hasResolvedQuery = false;
      activeRequestId += 1;
      const requestId = activeRequestId;
      if (activeAbortController) activeAbortController.abort();
      activeAbortController = new AbortController();
      try {
        const next = await fetchAllSuggestions(normalized, activeAbortController.signal);
        if (requestId !== activeRequestId) return;
        suggestions = next;
        activeIndex = -1;
        hasResolvedQuery = true;
        render();
      } catch (err) {
        if (requestId !== activeRequestId) return;
        if (String(err?.name || '') === 'AbortError') return;
        suggestions = [];
        hasResolvedQuery = true;
        render();
      }
    }, SEARCH_DEBOUNCE_MS);

    input.addEventListener('input', () => loadSuggestions(input.value.trim()));

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
        if (!item?.href) return;
        // Enforce book results always go to book.html, never to openlibrary.org
        if (item.type === 'Books' && /openlibrary\.org/i.test(item.href)) {
          const bookId = new URL(item.href, window.location.origin).searchParams.get('id');
          window.location.href = bookId ? 'book.html?id=' + encodeURIComponent(bookId) : 'books.html';
          return;
        }
        window.location.href = item.href;
      }
    });

    input.addEventListener('focus', () => {
      if (suggestions.length || (hasResolvedQuery && lastQuery.length >= MIN_QUERY_LEN)) {
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
    window.addEventListener('scroll', position, { passive: true });
    document.addEventListener('click', (e) => {
      if (e.target === input || dropdown.contains(e.target)) return;
      hide();
    });
  };

  function initSharedHeaderSearch() {
    if (!document.body) return;
    if (!window.initUniversalSearch) return;
    ['#globalSearch', '#mobileGlobalSearch', '#mobileMenuSearch'].forEach((selector) => {
      window.initUniversalSearch({ input: selector, fallbackRoute: 'movies.html' });
    });
  }

  function observeSharedHeaderSearch() {
    if (typeof MutationObserver !== 'function') return;
    const start = () => {
      if (!document.body) return;
      const observer = new MutationObserver(() => {
        initSharedHeaderSearch();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
      return;
    }
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedHeaderSearch, { once: true });
  } else {
    initSharedHeaderSearch();
  }
  observeSharedHeaderSearch();

  window.__ZO2Y_UNIVERSAL_SEARCH_READY = true;
  if (Array.isArray(window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE) && window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE.length) {
    const queued = window.__ZO2Y_UNIVERSAL_SEARCH_QUEUE.splice(0);
    queued.forEach((options) => {
      try { window.initUniversalSearch(options || {}); } catch (_err) {}
    });
  }
})();

