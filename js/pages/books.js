
let supabaseClient = null;
let currentUser = null;

async function ensureSupabase() {
  if (supabaseClient) return supabaseClient;
  const authRuntime = window.ZO2Y_AUTH || null;
  if (authRuntime && typeof authRuntime.waitForSupabase === 'function') {
    await authRuntime.waitForSupabase(8000);
  } else {
    const startedAt = Date.now();
    while (!(window.supabase && typeof window.supabase.createClient === 'function') && (Date.now() - startedAt) < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === 'function') {
    supabaseClient = await window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
    if (supabaseClient) return supabaseClient;
  }
  return window.__ZO2Y_SUPABASE_CLIENT || null;
}

async function initAuthUi() {
  try {
    const client = await ensureSupabase();
    if (client) {
      const { data } = await client.auth.getUser();
      if (data?.user) currentUser = data.user;
    }
    if (typeof window.syncAuthToHeader === 'function') {
      window.syncAuthToHeader(currentUser);
    }
  } catch (_err) {}
}
const BOOKS_API_BASE = '/api/books';
const BOOKS_PAGE_SIZE = 20;

let supabaseClient = null;
let currentUser = null;

const state = {
  books: [],
  search: '',
  genre: 'fiction', // default trending genre
  sort: 'relevance', // for search
  page: 1,
  totalPages: 1,
  totalResults: 0,
  listStatusMap: new Map()
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, isError = false) {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.top = '16px';
  el.style.right = '16px';
  el.style.zIndex = '9999';
  el.style.background = isError ? '#dc2626' : '#f59e0b';
  el.style.color = '#fff';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '10px';
  el.style.fontSize = '13px';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

let searchDebounceTimer = null;

function computeGridPageSize() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return 18;
  try {
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    const rows = 3;
    let sz = cols * rows;
    if (sz < 6) sz = 6;
    if (sz > 40) sz = 40;
    return sz;
  } catch(e) {
    return 18;
  }
}

async function loadBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;
  
  const limit = computeGridPageSize();
  const offset = (state.page - 1) * limit;

  // Render skeleton
  grid.innerHTML = Array(limit).fill(`
    <article class="card book-skeleton-card">
      <div class="card-media skeleton-shimmer" style="padding-bottom: 140%;"></div>
      <div class="card-meta">
        <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
        <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
        <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
      </div>
    </article>
  `).join('');

  const query = state.search.trim();
  let url = '';

  if (query) {
    url = `${BOOKS_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort=${state.sort}`;
    document.getElementById('gridTitle').textContent = `Search results for "${query}"`;
    document.getElementById('gridDesc').textContent = '';
  } else {
    url = `${BOOKS_API_BASE}/trending?genre=${encodeURIComponent(state.genre)}&limit=${limit}&offset=${offset}`;
    document.getElementById('gridTitle').textContent = `${state.genre.charAt(0).toUpperCase() + state.genre.slice(1)} Bestsellers`;
    document.getElementById('gridDesc').textContent = 'Trending books everyone is reading right now.';
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    state.books = data.books || [];
    state.totalResults = data.total || state.books.length;
    state.totalPages = Math.max(1, Math.ceil(state.totalResults / limit));

    renderGrid();
    updatePagination();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="empty">Failed to load books. Please try again.</div>';
  }
}

function renderGrid() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  if (!state.books.length) {
    grid.innerHTML = '<div class="empty">No books found.</div>';
    return;
  }

  const html = state.books.map(book => {
    const coverUrl = book.cover || '/images/fallback/book.svg';
    const author = book.author || 'Unknown Author';
    const year = book.year ? String(book.year) : '';

    return `
      <article class="card" data-id="${escapeHtml(book.id)}" data-title="${escapeHtml(book.title)}" data-author="${escapeHtml(author)}">
        <div class="card-media cover">
          <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.src='/images/fallback/book.svg'">
        </div>
        <div class="card-meta">
          <span class="card-type"><i class="fa-solid fa-book"></i> Book</span>
          <div class="card-meta-top"><p class="card-title">${escapeHtml(book.title)}</p></div>
          <p class="card-sub">${escapeHtml(author)}</p>
          <p class="card-extra">${escapeHtml(year)}</p>
          <div class="card-actions">
            <button class="icon-btn menu-btn" type="button" aria-label="Open list menu"><i class="fas fa-ellipsis-v"></i></button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.innerHTML = html;
  updateSpotlight(state.books[0]);
}

function updateSpotlight(book) {
  const spotlightSec = document.getElementById('booksSpotlight');
  if (!spotlightSec) return;
  
  if (!book) {
    spotlightSec.hidden = true;
    return;
  }
  
  spotlightSec.hidden = false;
  document.getElementById('booksSpotlightTitle').textContent = book.title || 'Unknown Title';
  const year = book.year || '';
  const author = book.author || 'Unknown Author';
  document.getElementById('booksSpotlightMeta').textContent = year ? `${author} | ${year}` : author;
  document.getElementById('booksSpotlightSummary').textContent = book.description || 'No description available.';
  
  const spotlightImg = document.getElementById('booksSpotlightImage');
  const spotlightBg = document.getElementById('booksSpotlightBg');
  const coverUrl = book.cover || '/images/fallback/book.svg';
  
  if (spotlightImg) {
    spotlightImg.src = coverUrl;
    spotlightImg.onerror = function() { this.src = '/images/fallback/book.svg'; };
  }
  if (spotlightBg) {
    spotlightBg.style.backgroundImage = `url("${coverUrl}")`;
  }
}

function updatePagination() {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const info = document.getElementById('pageInfo');
  
  if (prevBtn) prevBtn.disabled = state.page <= 1;
  if (nextBtn) nextBtn.disabled = state.page >= state.totalPages;
  if (info) info.textContent = `Page ${state.page} of ${state.totalPages}`;
}

function wireEvents() {
  const searchInput = document.getElementById('q');
  const searchBtn = document.getElementById('booksSearchBtn');
  const filterBtn = document.getElementById('booksFilterBtn');
  const filterModal = document.getElementById('booksFilterModal');
  const filterClose = document.getElementById('booksFilterCloseBtn');
  const refreshBtn = document.getElementById('refresh');
  
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.search = e.target.value.trim();
        state.page = 1;
        loadBooks();
      }, 400);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (searchInput) {
        state.search = searchInput.value.trim();
        state.page = 1;
        loadBooks();
      }
    });
  }

  if (filterBtn && filterModal) {
    filterBtn.addEventListener('click', () => filterModal.setAttribute('aria-hidden', 'false'));
  }
  if (filterClose && filterModal) {
    filterClose.addEventListener('click', () => filterModal.setAttribute('aria-hidden', 'true'));
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const genreSelect = document.getElementById('genre');
      const sortSelect = document.getElementById('sort');
      if (genreSelect) state.genre = genreSelect.value || 'fiction';
      if (sortSelect) state.sort = sortSelect.value || 'relevance';
      
      const searchInput = document.getElementById('q');
      if (searchInput) {
        searchInput.value = '';
        state.search = '';
      }
      
      state.page = 1;
      if (filterModal) filterModal.setAttribute('aria-hidden', 'true');
      loadBooks();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        loadBooks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.page < state.totalPages) {
        state.page++;
        loadBooks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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
      ensureClient: async function () { return await ensureSupabase(); },
      getCurrentUser: function () { return currentUser || null; },
      notify: function (message, isError) { 
        showToast(message, !!isError);
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

document.addEventListener('DOMContentLoaded', () => {
  // Populate genres if select exists
  const genreSelect = document.getElementById('genre');
  if (genreSelect) {
    const genres = ['fiction', 'fantasy', 'romance', 'thriller', 'mystery', 'science fiction', 'history', 'biography', 'poetry'];
    genreSelect.innerHTML = genres.map(g => `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1)}</option>`).join('');
  }

  wireEvents();
  initMenuBridge();
  initAuthUi().then(() => loadBooks());
});
