/*
 * Zo2y Travel Home Directory - Simplified professional directory style loading
 * Fetches travel data from countries.json and displays them in a professional directory format
 * Similar to a travel directory app with clean filtering and country information
 */
(function () {
  'use strict';

  const COUNTRIES_URL = '/data/countries-v3.json';
  const FALLBACK_FLAG = '/images/fallback/flag.svg';
  const FALLBACK_PHOTO = '/images/fallback/travel.svg';
  const TRAVEL_PAGE_SIZE = 12;

  let client = null;
  const state = {
    countries: [],
    filtered: [],
    search: '',
    region: '',
    sort: 'popular',
    page: 1,
    totalPages: 1,
    listStatus: new Map(),
    pending: new Set(),
    currentUser: null,
    isLoading: false
  };

  // API helper for auth
  async function ensureSupabase() {
    if (client) return client;
    const authRuntime = window.ZO2Y_AUTH || null;
    if (authRuntime && typeof authRuntime.waitForSupabase === 'function') {
      await authRuntime.waitForSupabase(5000);
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.__ZO2Y_SUPABASE_CONFIG) {
      client = window.supabase.createClient(
        window.__ZO2Y_SUPABASE_CONFIG.url,
        window.__ZO2Y_SUPABASE_CONFIG.key,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
      );
      window.__ZO2Y_SUPABASE_CLIENT = client;
    }
    return client;
  }

  async function initAuthUi() {
    const supabase = await ensureSupabase();
    if (!supabase) return;
    const profileBtn = document.getElementById('profileBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const { data } = await supabase.auth.getUser();
    state.currentUser = data?.user || null;

    if (state.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      if (profileBtn) {
        profileBtn.style.display = 'inline-flex';
        profileBtn.innerHTML = '<i class="fas fa-user"></i><span>Profile</span>';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (signupBtn) signupBtn.style.display = 'inline-flex';
      if (profileBtn) profileBtn.style.display = 'none';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (value.startsWith('//')) return `https:${value}`;
    if (value.startsWith('http://')) return value.replace(/^http:\/\//i, 'https://');
    return value;
  }

  function safeCode(value) {
    return String(value || '').trim().toUpperCase();
  }

  function canonicalCountryCode(value) {
    const raw = safeCode(value);
    if (raw === 'IL') return 'PS';
    return raw;
  }

  function normalizeCountry(item) {
    const rawCode = safeCode(item && (item.cca2 || item.cca3));
    if (!rawCode || rawCode === 'IL') return null;
    const code = canonicalCountryCode(rawCode);
    const name = String(item && item.name && (item.name.common || item.name.official) || '').trim();
    if (!code || !name || /\bisrael\b/i.test(name)) return null;

    return {
      code,
      name,
      capital: Array.isArray(item && item.capital) ? String(item.capital[0] || '').trim() : String(item && item.capital || '').trim(),
      region: String(item && item.region || '').trim(),
      subregion: String(item && item.subregion || '').trim(),
      flag: toHttps(item && item.flags && (item.flags.png || item.flags.svg)) || `https://flagcdn.com/w640/${code.toLowerCase()}.png`,
      photo: '',
      photoCity: '',
      photoNature: '',
      cities: Array.isArray(item && item.cities) ? item.cities.slice(0, 3) : []
    };
  }

  async function loadCountries() {
    try {
      const response = await fetch(COUNTRIES_URL);
      if (!response.ok) throw new Error('Failed to load countries data');
      const data = await response.json();
      const countries = (Array.isArray(data) ? data : [])
        .map(normalizeCountry)
        .filter(Boolean);
      state.countries = countries;
      return countries;
    } catch (error) {
      console.error('Error loading countries:', error);
      return [];
    }
  }

  function filterCountries(countries, search, region, sort) {
    let filtered = countries.filter(item => {
      const matchesSearch = search === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.capital.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());

      const matchesRegion = region === '' || item.region === region;

      return matchesSearch && matchesRegion;
    });

    filtered.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'region') {
        if (a.region === b.region) return a.name.localeCompare(b.name);
        return a.region.localeCompare(b.region);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    return filtered;
  }

  function applyFilters() {
    state.search = String(document.getElementById('q')?.value || '').trim();
    state.region = String(document.getElementById('region')?.value || '');
    state.sort = String(document.getElementById('travelSort')?.value || 'popular');
    state.filtered = filterCountries(state.countries, state.search, state.region, state.sort);
    state.totalPages = Math.max(1, Math.ceil(state.filtered.length / TRAVEL_PAGE_SIZE));
    if (state.page > state.totalPages) state.page = 1;
    renderGrid();
  }

  function renderCountryCard(item) {
    const flagUrl = item.flag && !item.flag.includes('flagcdn.com') ? toHttps(item.flag) : 
                   (item.flag || FALLBACK_FLAG);
    const photoUrl = item.photo || FALLBACK_PHOTO;

    return `
      <article class="travel-card" data-code="${escapeHtml(item.code)}" data-list-image="${escapeHtml(flagUrl)}" data-image="${escapeHtml(photoUrl)}">
        <div class="travel-card-media">
          <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(item.name)} card" loading="lazy" onerror="this.src='${FALLBACK_PHOTO}'">
        </div>
        <div class="travel-card-content">
          <div class="travel-card-header">
            <h3 class="travel-card-name">${escapeHtml(item.name)}</h3>
            <button class="travel-card-menu-btn" data-code="${escapeHtml(item.code)}" type="button" aria-label="Add to lists"><i class="fas fa-ellipsis-v"></i></button>
            <span class="travel-card-code">${escapeHtml(item.code)}</span>
          </div>
          <div class="travel-card-details">
            <div class="travel-card-detail">
              <i class="fas fa-building travel-card-icon"></i>
              <span>${escapeHtml(item.capital || 'N/A')}</span>
            </div>
            <div class="travel-card-detail">
              <i class="fas fa-globe travel-card-icon"></i>
              <span>${escapeHtml(item.region || 'N/A')}</span>
            </div>
            <div class="travel-card-detail">
              <i class="fas fa-map-marker-alt travel-card-icon"></i>
              <span>${escapeHtml(item.subregion || 'N/A')}</span>
            </div>
          </div>
          ${item.cities && item.cities.length ? `
            <div class="travel-card-cities">
              <div class="travel-card-cities-label">Popular cities:</div>
              <div class="travel-card-cities-list">
                ${item.cities.map(city => `<span class="travel-card-city">${escapeHtml(city)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="travel-card-footer">
          <button class="travel-card-save-btn" data-code="${escapeHtml(item.code)}" type="button">
            <i class="fas fa-bookmark"></i> Save to List
          </button>
          <a href="country.html?country=${encodeURIComponent(item.code)}" class="travel-card-view-btn">
            View Details <i class="fas fa-chevron-right"></i>
          </a>
        </div>
      </article>
    `;
  }

  function renderGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    const start = (state.page - 1) * TRAVEL_PAGE_SIZE;
    const visibleItems = state.filtered.slice(start, start + TRAVEL_PAGE_SIZE);
    
    if (!visibleItems.length) {
      grid.innerHTML = `
        <div class="travel-empty-state">
          <div class="travel-empty-icon">🌍</div>
          <h3>No countries found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      updatePagination();
      return;
    }

    grid.innerHTML = visibleItems.map(renderCountryCard).join('');
    updatePagination();

    // Prime images
    setTimeout(() => {
      visibleItems.forEach(item => {
        const img = document.querySelector(`.travel-card[data-code="${item.code}"] img`);
        if (img) {
          const src = img.getAttribute('src');
          if (src.includes('/images/fallback/travel.svg')) {
            img.src = '/images/placeholder-travel.svg';
          }
        }
      });
    }, 100);
  }

  function updatePagination() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const info = document.getElementById('pageInfo');

    if (state.page > state.totalPages) state.page = state.totalPages;
    if (state.page < 1) state.page = 1;

    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.totalPages;
    if (info) info.textContent = `Page ${state.page} of ${state.totalPages}`;
  }

  async function loadListStatus() {
    if (!state.currentUser?.id || !state.filtered.length) return;
    const supabase = await ensureSupabase();
    if (!supabase) return;

    const codes = state.filtered.map(item => item.code);
    if (!codes.length) return;

    const { data } = await supabase
      .from('travel_list_items')
      .select('country_code, list_type')
      .eq('user_id', state.currentUser.id)
      .in('country_code', codes);

    (data || []).forEach(row => {
      const code = String(row.country_code || '');
      if (!code) return;
      if (!state.listStatus.has(code)) {
        state.listStatus.set(code, { favorites: false, visited: false, bucketlist: false });
      }
      const status = state.listStatus.get(code);
      if (row.list_type in status) status[row.list_type] = true;
    });
  }

  async function toggleTravelItem(itemCode, listType, card) {
    const code = String(itemCode || '').trim();
    if (!code) return { ok: false, saved: false };

    const country = state.filtered.find(item => item.code === code);
    if (!country) return { ok: false, saved: false };

    const supabase = await ensureSupabase();
    if (!supabase || !state.currentUser?.id) {
      window.location.href = 'login.html';
      return { ok: false, saved: false };
    }

    const status = state.listStatus.get(code) || { favorites: false, visited: false, bucketlist: false };
    const previousSaved = !!status[listType];
    const nextSaved = !previousSaved;

    status[listType] = nextSaved;
    state.listStatus.set(code, status);

    try {
      if (nextSaved) {
        const { error } = await supabase
          .from('travel_list_items')
          .insert({
            user_id: state.currentUser.id,
            country_code: code,
            list_type: listType
          });
        if (error && String(error.code || '') !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('travel_list_items')
          .delete()
          .eq('user_id', state.currentUser.id)
          .eq('country_code', code)
          .eq('list_type', listType);
        if (error) throw error;
      }

      if (card) {
        if (listType === 'favorites') {
          card.classList.toggle('saved-favorite', nextSaved);
        } else if (listType === 'visited') {
          card.classList.toggle('saved-visited', nextSaved);
        } else if (listType === 'bucketlist') {
          card.classList.toggle('saved-bucketlist', nextSaved);
        }
      }

      return { ok: true, saved: nextSaved };
    } catch (error) {
      console.error('Failed to update travel list:', error);
      status[listType] = previousSaved;
      return { ok: false, saved: previousSaved };
    }
  }

  function wireTravelActions() {
    document.querySelectorAll('.travel-card-save-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        const listType = 'favorites';
        const card = btn.closest('.travel-card');
        const result = await toggleTravelItem(code, listType, card);
        if (result.ok) {
          showToast(result.saved ? 'Added to favorites' : 'Removed from favorites', false);
        }
      });
    });

    document.querySelectorAll('.travel-card-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.travel-card');
        if (card && window.openIndexStyleListMenu) {
          window.openIndexStyleListMenu(card);
        }
      });
    });

    document.querySelectorAll('.travel-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.travel-card-save-btn') || e.target.closest('.travel-card-view-btn') || e.target.closest('.travel-card-menu-btn')) return;
        const code = card.getAttribute('data-code');
        if (code) {
          window.location.href = `country.html?country=${encodeURIComponent(code)}`;
        }
      });
    });
  }

  function wireListMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: 'travel',
      itemIdAttr: 'data-code',
      getVisibleItemIds: () => Array.from(document.querySelectorAll('.travel-card[data-code]'))
        .map((node) => node.getAttribute('data-code'))
        .filter(Boolean),
      getQuickStatusForItem: (id) => {
        const status = state.listStatus.get(id);
        return status ? { ...status } : null;
      },
      ensureClient: async () => ensureSupabase(),
      getCurrentUser: () => state.currentUser,
      notify: (message, errorLike) => showToast(message, !!errorLike),
      toggleDefaultList: async ({ itemId, listType, card, nextSaved }) =>
        toggleTravelItem(itemId, listType, card)
    });
  }

  function showToast(message, isError = false) {
    const el = document.createElement('div');
    el.className = `travel-toast ${isError ? 'err' : 'ok'}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function renderHeroSpotlight(countries = []) {
    const section = document.getElementById('travelHeroSpotlight');
    if (!section) return;
    const randomCountries = countries.sort(() => 0.5 - Math.random()).slice(0, 3);
    if (!randomCountries.length) return;

    const html = randomCountries.map((item, index) => `
      <div class="hero-spotlight-card ${index === 0 ? 'active' : ''}" data-index="${index}">
        <div class="hero-spotlight-thumb">
          <img src="/images/placeholder-travel.svg" alt="${item.name}" loading="lazy">
        </div>
        <div class="hero-spotlight-info">
          <div class="hero-spotlight-kicker">Featured Destination</div>
          <div class="hero-spotlight-title">${item.name}</div>
          <div class="hero-spotlight-meta">${item.capital} • ${item.region}</div>
        </div>
      </div>
    `).join('');

    section.innerHTML = html;
    let currentIndex = 0;
    const spotlightCards = section.querySelectorAll('.hero-spotlight-card');

    if (spotlightCards.length > 1) {
      setInterval(() => {
        spotlightCards[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % spotlightCards.length;
        spotlightCards[currentIndex].classList.add('active');
      }, 4000);
    }
  }

  async function initTravelDirectory() {
    await initAuthUi();
    const countries = await loadCountries();
    state.countries = countries;
    applyFilters();
    renderHeroSpotlight(countries);
    await loadListStatus();

    // Event listeners
    const searchInput = document.getElementById('q');
    const searchBtn = document.getElementById('travelSearchBtn');
    const regionSelect = document.getElementById('region');
    const sortSelect = document.getElementById('travelSort');
    const refreshBtn = document.getElementById('travelRefresh');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(applyFilters, 300);
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', applyFilters);
    }

    if (regionSelect) {
      regionSelect.addEventListener('change', applyFilters);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilters);
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        state.page = 1;
        applyFilters();
        showToast('Refreshing destinations...', false);
      });
    }

    const filterModal = document.getElementById('travelFilterModal');
    const filterCloseBtn = document.getElementById('travelFilterCloseBtn');
    const filterBtn = document.getElementById('travelFilterBtn');

    if (filterBtn && filterModal && filterCloseBtn) {
      filterBtn.addEventListener('click', () => {
        filterModal.classList.add('show');
      });

      filterCloseBtn.addEventListener('click', () => {
        filterModal.classList.remove('show');
      });

      filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
          filterModal.classList.remove('show');
        }
      });
    }

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        renderGrid();
      }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
      if (state.page < state.totalPages) {
        state.page++;
        renderGrid();
      }
    });

    wireTravelActions();
    wireListMenuBridge();
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTravelDirectory);
    } else {
      initTravelDirectory();
    }
  }

  init();

  window.Zo2yTravelDirectory = {
    init: initTravelDirectory,
    applyFilters: applyFilters,
    loadCountries: loadCountries
  };
})();