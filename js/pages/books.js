(() => {
  'use strict';

  const Engine = window.Zo2yBooks;
  if (!Engine) {
    console.error('Zo2yBooks engine not loaded.');
    return;
  }

  // DOM Elements
  const discoverContainer = document.getElementById('booksDiscover');
  const flatSection = document.getElementById('booksFlatSection');
  const grid = document.getElementById('booksGrid');
  const searchInput = document.getElementById('q');
  const searchBtn = document.getElementById('booksSearchBtn');
  const filterBtn = document.getElementById('booksFilterBtn');
  const filterModal = document.getElementById('booksFilterModal');
  const filterCloseBtn = document.getElementById('booksFilterCloseBtn');
  const paginationContainer = document.getElementById('booksPagination');

  // Filter DOM
  const filterGenre = document.getElementById('genre');
  const filterYearFrom = document.getElementById('year_from');
  const filterYearTo = document.getElementById('year_to');
  const filterSort = document.getElementById('sort');
  const applyFiltersBtn = document.getElementById('refresh');

  let currentPage = 1;
  let currentSearchQuery = '';
  let currentSection = '';
  let currentFilters = {};
  let currentMode = 'discover'; // 'discover', 'flat', 'search'

  const GENRE_OPTIONS = [
    { value: '', label: 'All Genres' },
    { value: 'fiction', label: 'Fiction' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science fiction', label: 'Sci-Fi' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'romance', label: 'Romance' },
    { value: 'horror', label: 'Horror' },
    { value: 'young adult', label: 'Young Adult' },
    { value: 'biography', label: 'Biography' },
    { value: 'history', label: 'History' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' }
  ];

  function populateFilters() {
    if (filterGenre) {
      filterGenre.innerHTML = GENRE_OPTIONS.map(g => `<option value="${g.value}">${g.label}</option>`).join('');
    }
  }

  function wireEvents() {
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
      searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
      });
      // Handle when the user manually clears the input (or clears via native button)
      searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '' && currentMode === 'search') {
          handleSearch();
        }
      });
    }

    if (filterBtn && filterModal) {
      filterBtn.addEventListener('click', () => filterModal.setAttribute('aria-hidden', 'false'));
    }
    if (filterCloseBtn && filterModal) {
      filterCloseBtn.addEventListener('click', () => filterModal.setAttribute('aria-hidden', 'true'));
    }
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        if (filterModal) filterModal.setAttribute('aria-hidden', 'true');
        applyFilters();
      });
    }

    // Delegation for "See all" buttons on discover sections
    if (discoverContainer) {
      discoverContainer.addEventListener('click', e => {
        const moreBtn = e.target.closest('.section-more-btn');
        if (moreBtn) {
          const sectionId = moreBtn.dataset.moreSection;
          if (sectionId) loadFlatSection(sectionId);
        }
      });
    }
  }

  async function loadDiscovery() {
    currentMode = 'discover';
    currentSection = '';
    currentSearchQuery = '';

    if (discoverContainer) {
      discoverContainer.hidden = false;
      discoverContainer.innerHTML = Engine.skeletonSectionsHtml(4);
    }
    if (flatSection) flatSection.hidden = true;

    try {
      const data = await Engine.fetchDiscovery();
      if (!data || !data.sections || !data.sections.length) {
        if (discoverContainer) discoverContainer.innerHTML = '<div class="empty">No books available.</div>';
        return;
      }
      if (discoverContainer) {
        discoverContainer.innerHTML = data.sections.map(s => Engine.renderSection(s)).join('');
      }
    } catch (err) {
      console.error(err);
      if (discoverContainer) discoverContainer.innerHTML = '<div class="empty">Failed to load books.</div>';
    }
  }

  async function loadFlatSection(sectionId, page = 1) {
    currentMode = 'flat';
    currentSection = sectionId;
    currentSearchQuery = '';
    currentPage = page;
    
    if (discoverContainer) discoverContainer.hidden = true;
    if (flatSection) flatSection.hidden = false;
    if (grid) grid.innerHTML = Engine.skeletonSectionsHtml(1);
    
    const titleEl = document.getElementById('flatSectionTitle');
    const descEl = document.getElementById('flatSectionDesc');
    
    const allSections = (window.Zo2yBooksDataLayer && window.Zo2yBooksDataLayer.DISCOVERY_SECTIONS) || [];
    const secInfo = allSections.find(s => s.id === sectionId);
    if (titleEl) titleEl.textContent = secInfo ? secInfo.label : 'Popular Books';
    if (descEl) descEl.textContent = secInfo ? secInfo.desc : 'Browsing section.';

    const opts = { section: sectionId, page: currentPage, limit: 24, ...currentFilters };
    try {
      const data = await Engine.fetchFlat(opts);
      if (grid) Engine.renderGrid(grid, data.books);
      renderPagination(data.page, data.books && data.books.length >= 24);
    } catch (err) {
      console.error(err);
      if (grid) grid.innerHTML = '<div class="empty">Failed to load books.</div>';
    }
  }

  async function handleSearch() {
    const q = searchInput ? searchInput.value.trim() : '';
    currentPage = 1;
    currentFilters = {};
    
    if (!q) {
      loadDiscovery();
      return;
    }
    
    currentMode = 'search';
    currentSearchQuery = q;
    currentSection = '';
    
    if (discoverContainer) discoverContainer.hidden = true;
    if (flatSection) flatSection.hidden = false;
    if (grid) grid.innerHTML = Engine.skeletonSectionsHtml(1);
    
    const titleEl = document.getElementById('flatSectionTitle');
    const descEl = document.getElementById('flatSectionDesc');
    if (titleEl) titleEl.textContent = `Search results for "${q}"`;
    if (descEl) descEl.textContent = '';

    try {
      const data = await Engine.search(q, { page: 1, limit: 24 });
      if (grid) Engine.renderGrid(grid, data.books);
      renderPagination(data.page || 1, data.books && data.books.length >= 24);
    } catch (err) {
      console.error(err);
      if (grid) grid.innerHTML = '<div class="empty">Search failed.</div>';
    }
  }

  async function applyFilters() {
    const genre = filterGenre ? filterGenre.value : '';
    const yFrom = filterYearFrom ? filterYearFrom.value : '';
    const yTo = filterYearTo ? filterYearTo.value : '';
    const sort = filterSort ? filterSort.value : '';

    currentFilters = {};
    if (genre) currentFilters.subject = genre;
    if (yFrom) currentFilters.year_from = yFrom;
    if (yTo) currentFilters.year_to = yTo;
    if (sort) currentFilters.orderBy = sort;

    currentPage = 1;
    currentSection = genre ? '' : 'popular'; 
    currentSearchQuery = searchInput ? searchInput.value.trim() : '';
    
    if (discoverContainer) discoverContainer.hidden = true;
    if (flatSection) flatSection.hidden = false;
    if (grid) grid.innerHTML = Engine.skeletonSectionsHtml(1);

    const titleEl = document.getElementById('flatSectionTitle');
    const descEl = document.getElementById('flatSectionDesc');
    if (titleEl) titleEl.textContent = currentSearchQuery ? `Filtered search for "${currentSearchQuery}"` : (genre ? `${genre} Books` : 'Filtered Books');
    if (descEl) descEl.textContent = '';

    try {
      let data;
      if (currentSearchQuery) {
        currentMode = 'search';
        data = await Engine.search(currentSearchQuery, { ...currentFilters, page: 1, limit: 24 });
      } else {
        currentMode = 'flat';
        data = await Engine.fetchFlat({ q: genre || 'books', ...currentFilters, page: 1, limit: 24 });
      }
      if (grid) Engine.renderGrid(grid, data.books);
      renderPagination(data.page || 1, data.books && data.books.length >= 24);
    } catch (err) {
      console.error(err);
      if (grid) grid.innerHTML = '<div class="empty">Failed to load filtered books.</div>';
    }
  }

  function renderPagination(page, hasMore) {
    if (!paginationContainer) return;
    if (page <= 1 && !hasMore) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let html = '<div class="pagination">';
    html += `<button class="page-btn" id="prevPageBtn" type="button" ${page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    html += `<div class="page-info" id="pageInfo">Page ${page}</div>`;
    html += `<button class="page-btn" id="nextPageBtn" type="button" ${!hasMore ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    html += '</div>';
    
    paginationContainer.innerHTML = html;
    
    const prev = document.getElementById('prevPageBtn');
    const next = document.getElementById('nextPageBtn');
    
    if (prev) {
      prev.addEventListener('click', () => {
        if (page > 1) {
          if (currentMode === 'search') performPaginatedSearch(page - 1);
          else loadFlatSection(currentSection, page - 1);
        }
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        if (hasMore) {
          if (currentMode === 'search') performPaginatedSearch(page + 1);
          else loadFlatSection(currentSection, page + 1);
        }
      });
    }
  }

  async function performPaginatedSearch(page) {
    currentPage = page;
    if (grid) grid.innerHTML = Engine.skeletonSectionsHtml(1);
    try {
      const data = await Engine.search(currentSearchQuery, { ...currentFilters, page: page, limit: 24 });
      if (grid) Engine.renderGrid(grid, data.books);
      renderPagination(data.page || page, data.books && data.books.length >= 24);
    } catch (err) {
      console.error(err);
    }
  }

  function initMenuBridge() {
    if (window.initIndexStyleListMenu && !window.__ZO2Y_BOOKS_LIST_BRIDGE) {
      window.__ZO2Y_BOOKS_LIST_BRIDGE = true;
      window.initIndexStyleListMenu({
        mediaType: 'book',
        itemIdAttr: 'data-id',
        getItemFromCard: function (card) {
          if (!card) return null;
          return {
            mediaType: 'book',
            itemId: card.getAttribute('data-id') || '',
            title: card.getAttribute('data-title') || '',
            subtitle: card.getAttribute('data-author') || '',
            image: card.querySelector('img')?.getAttribute('src') || ''
          };
        },
        getVisibleItemIds: function () {
          return Array.from(document.querySelectorAll('.card[data-id]'))
            .map(c => c.getAttribute('data-id')).filter(Boolean);
        },
        ensureClient: async function () {
          if (typeof window.ensureHomeSupabase === 'function') {
            return await window.ensureHomeSupabase();
          }
          return window.__ZO2Y_SUPABASE_CLIENT || null;
        },
        getCurrentUser: function () { return window.homeCurrentUser || null; },
        notify: function (message, isError) { 
          if (typeof window.showHomeToast === 'function') {
            window.showHomeToast(message, !!isError);
          } else {
            console.log(message);
          }
        }
      });
      
      document.body.addEventListener('click', e => {
        const btn = e.target.closest('.menu-btn');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          const card = btn.closest('.card');
          if (card && window.openIndexStyleListMenu) {
            window.openIndexStyleListMenu(card);
          }
        }
      });
    }
  }

  function boot() {
    populateFilters();
    wireEvents();
    initMenuBridge();
    loadDiscovery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
