// Simple travel page loader - direct API calls, no complex orchestrator
(function() {
  'use strict';

  const COUNTRIES_URL = '/data/countries-v3.json';
  const TRAVEL_PHOTO_CACHE_KEY = 'zo2y_travel_photo_cache_v7';
  const TRAVEL_PHOTO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
  const TRAVEL_COUNTRY_ROWS_CACHE_KEY = 'zo2y_travel_country_rows_v5';
  const TRAVEL_COUNTRY_ROWS_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
  const TRAVEL_BUCKET_NAME = 'travel-photos';
  const TRAVEL_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
      <rect width='24' height='24' fill='#10224a'/>
    </svg>
  `)}`;

  let state = {
    rows: [],
    filtered: [],
    search: '',
    region: '',
    sort: 'popular',
    page: 1,
    totalPages: 1,
    hasMore: false
  };

  // Simple cache helpers
  function readCache(key, ttlMs) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > ttlMs) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  // Load countries from JSON file
  async function loadCountries() {
    const cached = readCache(TRAVEL_COUNTRY_ROWS_CACHE_KEY, TRAVEL_COUNTRY_ROWS_CACHE_TTL_MS);
    if (cached && cached.length) {
      state.rows = cached;
      state.filtered = cached;
      return true;
    }

    try {
      const response = await fetch(COUNTRIES_URL);
      if (!response.ok) throw new Error(`Failed to load countries: ${response.status}`);
      const data = await response.json();
      
      if (!Array.isArray(data) || !data.length) {
        throw new Error('No countries data found');
      }

      state.rows = data;
      state.filtered = data;
      writeCache(TRAVEL_COUNTRY_ROWS_CACHE_KEY, data);
      return true;
    } catch (error) {
      console.error('Travel load error:', error);
      return false;
    }
  }

  // Filter and sort countries
  function applyFilters() {
    let filtered = [...state.rows];

    // Search filter
    if (state.search) {
      const searchLower = state.search.toLowerCase();
      filtered = filtered.filter(row => {
        const name = String(row.name || '').toLowerCase();
        const capital = String(row.capital || '').toLowerCase();
        const region = String(row.region || '').toLowerCase();
        return name.includes(searchLower) || 
               capital.includes(searchLower) || 
               region.includes(searchLower);
      });
    }

    // Region filter
    if (state.region) {
      filtered = filtered.filter(row => 
        String(row.region || '').toLowerCase() === state.region.toLowerCase()
      );
    }

    // Sort
    if (state.sort === 'name') {
      filtered.sort((a, b) => 
        String(a.name || '').localeCompare(String(b.name || ''))
      );
    } else {
      // Popular sort (default)
      filtered.sort((a, b) => {
        const aPop = Number(a.popularity || 0);
        const bPop = Number(b.popularity || 0);
        return bPop - aPop;
      });
    }

    state.filtered = filtered;
    state.totalPages = Math.ceil(filtered.length / 24) || 1;
    state.hasMore = state.page < state.totalPages;
  }

  // Render countries grid
  function render() {
    const grid = document.getElementById('countriesGrid');
    const empty = document.getElementById('empty');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (!grid) return;

    applyFilters();

    if (!state.filtered.length) {
      if (empty) {
        empty.style.display = 'block';
        empty.textContent = state.search 
          ? 'No countries match your search.' 
          : 'No countries available.';
      }
      grid.innerHTML = '';
      if (pageInfo) pageInfo.textContent = 'Page 1 of 1';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    if (empty) empty.style.display = 'none';

    const start = (state.page - 1) * 24;
    const end = start + 24;
    const pageItems = state.filtered.slice(start, end);

    grid.innerHTML = pageItems.map(row => {
      const code = String(row.code || '').toUpperCase();
      const name = String(row.name || '').trim();
      const capital = String(row.capital || '').trim();
      const region = String(row.region || '').trim();
      const flag = row.flags?.png || row.flags?.svg || '';
      const photo = getCountryPhoto(code);

      return `
        <a class="country-card" href="country.html?country=${encodeURIComponent(code)}" data-code="${code}">
          <div class="country-card-thumb">
            ${photo ? `<img src="${photo}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                      <div class="country-card-fallback"><i class="fas fa-globe-americas"></i></div>` 
                    : `<div class="country-card-fallback"><i class="fas fa-globe-americas"></i></div>`}
          </div>
          <div class="country-card-body">
            <div class="country-card-flag">${flag ? `<img src="${flag}" alt="${code}">` : code}</div>
            <strong class="country-card-name">${name}</strong>
            <span class="country-card-meta">${capital}${region ? ` · ${region}` : ''}</span>
          </div>
        </a>
      `;
    }).join('');

    if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = !state.hasMore;
  }

  // Get cached photo for country
  function getCountryPhoto(code) {
    const cache = readCache(TRAVEL_PHOTO_CACHE_KEY, TRAVEL_PHOTO_CACHE_TTL_MS);
    if (!cache) return '';
    const entry = cache[String(code).toUpperCase()];
    return entry?.photo || '';
  }

  // Wire up events
  function wireEvents() {
    const searchInput = document.getElementById('q');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const regionSelect = document.getElementById('regionSelect');
    const sortSelect = document.getElementById('sortSelect');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = String(e.target.value || '').trim();
        state.page = 1;
        render();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        if (searchInput) {
          state.search = String(searchInput.value || '').trim();
          state.page = 1;
          render();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.search = '';
        state.page = 1;
        if (searchInput) searchInput.value = '';
        render();
      });
    }

    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        state.region = String(e.target.value || '').trim();
        state.page = 1;
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = String(e.target.value || '').trim();
        state.page = 1;
        render();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.page > 1) {
          state.page--;
          render();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.hasMore) {
          state.page++;
          render();
        }
      });
    }
  }

  // Initialize
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = String(params.get('search') || '').trim();
    if (initialSearch) {
      state.search = initialSearch;
      const input = document.getElementById('q');
      if (input) input.value = initialSearch;
    }

    const ok = await loadCountries();
    if (!ok) {
      const empty = document.getElementById('empty');
      if (empty) {
        empty.style.display = 'block';
        empty.textContent = 'Could not load countries right now.';
      }
      return;
    }

    wireEvents();
    render();
  }

  // Expose init function
  window.Zo2ySimpleTravel = {
    init
  };
})();
