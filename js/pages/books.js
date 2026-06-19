(() => {
  'use strict';

  const Engine = window.Zo2yBooks;
  if (!Engine) {
    console.error('Zo2yBooks engine not loaded.');
    return;
  }

  // DOM Elements
  const grid = document.getElementById('booksGrid');
  const searchInput = document.getElementById('q');
  const searchBtn = document.getElementById('booksSearchBtn');
  const filterBtn = document.getElementById('booksFilterBtn');
  const filterModal = document.getElementById('booksFilterModal');
  const filterCloseBtn = document.getElementById('booksFilterCloseBtn');
  const paginationContainer = document.querySelector('.pagination');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const pageInfo = document.getElementById('pageInfo');
  
  // Spotlight
  const spotlightSec = document.getElementById('booksSpotlight');
  const spotlightBg = document.getElementById('booksSpotlightBg');
  const spotlightTitle = document.getElementById('booksSpotlightTitle');
  const spotlightMeta = document.getElementById('booksSpotlightMeta');
  const spotlightSummary = document.getElementById('booksSpotlightSummary');
  const spotlightImg = document.getElementById('booksSpotlightImage');
  const spotlightCta = document.getElementById('booksSpotlightOpen');

  // Filter DOM
  const filterGenre = document.getElementById('genre');
  const filterYearFrom = document.getElementById('year_from');
  const filterYearTo = document.getElementById('year_to');
  const filterSort = document.getElementById('sort');
  const applyFiltersBtn = document.getElementById('refresh');

  let currentPage = 1;
  let currentSearchQuery = '';
  let currentSection = 'popular';
  let currentFilters = {};
  let currentMode = 'flat'; // 'flat' or 'search'
  
  function getGridPageSize() {
    if (!grid) return 24;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    const rows = 3;
    return Math.max(18, cols * rows);
  }

  function renderGridSkeleton() {
    if (!grid) return;
    const count = getGridPageSize();
    let cards = '';
    for (let i = 0; i < count; i++) {
      cards += '<article class="card book-skeleton-card"><div class="card-media skeleton-shimmer"></div>'
            + '<div class="card-meta">'
            + '<span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>'
            + '<span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>'
            + '<span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>'
            + '</div></article>';
    }
    grid.innerHTML = cards;
  }

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

  function updatePaginationUI(hasMore) {
    if (pageInfo) pageInfo.textContent = `Page ${currentPage}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = !hasMore;
    if (paginationContainer) {
      paginationContainer.style.display = (currentPage <= 1 && !hasMore) ? 'none' : 'flex';
    }
  }

  function wireEvents() {
    if (searchBtn) searchBtn.addEventListener('click', () => { currentPage = 1; executeSearch(); });
    if (searchInput) {
      searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') { currentPage = 1; executeSearch(); }
      });
      searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '' && currentMode === 'search') {
          currentPage = 1;
          executeSearch();
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
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          executeCurrentMode();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentPage++;
        executeCurrentMode();
      });
    }
  }

  function updateSpotlight(book) {
    if (!spotlightSec) return;
    if (!book) {
      spotlightSec.hidden = true;
      return;
    }
    spotlightSec.hidden = false;
    if (spotlightTitle) spotlightTitle.textContent = book.title || 'Unknown Title';
    if (spotlightMeta) {
      const year = book.first_publish_year || book.year || '';
      const author = book.author || 'Unknown Author';
      spotlightMeta.textContent = year ? `${author} | ${year}` : author;
    }
    if (spotlightSummary) spotlightSummary.textContent = book.description || 'No description available for this title.';
    
    let cover = book.cover || '/images/fallback/book.svg';
    if (cover.startsWith('http:') || cover.startsWith('https:')) {
       // Convert small covers to large for spotlight
       cover = cover.replace('-M.jpg', '-L.jpg').replace('zoom=1', 'zoom=0');
    }
    
    if (spotlightImg) {
      spotlightImg.src = cover;
      spotlightImg.onerror = function() { this.src = '/images/fallback/book.svg'; };
    }
    if (spotlightBg) {
      spotlightBg.style.backgroundImage = `url("${cover}")`;
    }
    if (spotlightCta) {
      spotlightCta.href = `javascript:window.openIndexStyleListMenu(document.querySelector('.card[data-id="${book.id}"]'))`;
    }
  }

  async function executeCurrentMode() {
    renderGridSkeleton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (currentMode === 'search') {
      await loadSearchData();
    } else {
      await loadFlatData();
    }
  }

  async function loadFlatData() {
    const limit = getGridPageSize();
    const opts = { section: currentSection, page: currentPage, limit: limit, ...currentFilters };
    try {
      const data = await Engine.fetchFlat(opts);
      if (grid) Engine.renderGrid(grid, data.books);
      updatePaginationUI(data.books && data.books.length >= limit);
      
      if (currentPage === 1 && data.books && data.books.length > 0) {
        updateSpotlight(data.books[0]);
      } else if (currentPage > 1) {
        updateSpotlight(null);
      }
    } catch (err) {
      console.error(err);
      if (grid) grid.innerHTML = '<div class="empty">Failed to load books.</div>';
    }
  }

  async function executeSearch() {
    const q = searchInput ? searchInput.value.trim() : '';
    currentFilters = {};
    if (!q) {
      currentMode = 'flat';
      currentSection = 'popular';
      document.getElementById('gridTitle').textContent = 'popular books right now';
      document.getElementById('gridDesc').textContent = 'Trending fiction and non-fiction across Zo2y.';
      await executeCurrentMode();
      return;
    }
    
    currentMode = 'search';
    currentSearchQuery = q;
    document.getElementById('gridTitle').textContent = `Search results for "${q}"`;
    document.getElementById('gridDesc').textContent = '';
    await executeCurrentMode();
  }

  async function loadSearchData() {
    const limit = getGridPageSize();
    try {
      const data = await Engine.search(currentSearchQuery, { ...currentFilters, page: currentPage, limit: limit });
      if (grid) Engine.renderGrid(grid, data.books);
      updatePaginationUI(data.books && data.books.length >= limit);
      updateSpotlight(null); // No spotlight for searches
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
    
    const titleEl = document.getElementById('gridTitle');
    const descEl = document.getElementById('gridDesc');
    if (titleEl) titleEl.textContent = currentSearchQuery ? `Filtered search for "${currentSearchQuery}"` : (genre ? `${genre} Books` : 'Filtered Books');
    if (descEl) descEl.textContent = '';

    if (currentSearchQuery) {
      currentMode = 'search';
    } else {
      currentMode = 'flat';
    }
    
    await executeCurrentMode();
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
    executeCurrentMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
