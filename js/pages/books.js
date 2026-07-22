let supabaseClient = null;
let currentUser = null;
let currentAbort = null;
let bookListStatusMap = new Map();

window.bustBookCache = window.bustBookCache || function(bookId) {
  if (!bookId) return;
  try { localStorage.removeItem("book_" + bookId); } catch(_) {}
};

async function ensureSupabase() {
  if (supabaseClient) return supabaseClient;
  const authRuntime = window.ZO2Y_AUTH || null;
  if (authRuntime && typeof authRuntime.waitForSupabase === "function") {
    await authRuntime.waitForSupabase(8000);
  } else {
    const startedAt = Date.now();
    while (!(window.supabase && typeof window.supabase.createClient === "function") && (Date.now() - startedAt) < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === "function") {
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
    if (typeof window.syncAuthToHeader === "function") {
      window.syncAuthToHeader(currentUser);
    }
  } catch (_) {}
}

const state = {
  books: [],
  allBooks: [],
  seenIds: new Set(),
  query: "",
  genre: "",
  sort: "relevance",
  orderBy: "relevance",
  offset: 0,
  totalItems: 0,
  hasMore: true,
  loading: false,
  _poolCache: null,
  _poolCacheKey: "",
  _poolCacheTotal: 0
};

const PAGE_SIZE = 24;

function invalidatePoolCache() {
  state._poolCache = null;
  state._poolCacheKey = "";
  state._poolCacheTotal = 0;
}

function escapeHtml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showToast(msg, isErr) {
  const el = document.createElement("div");
  Object.assign(el.style, { position: "fixed", top: "16px", right: "16px", zIndex: "9999", background: isErr ? "#dc2626" : "#f59e0b", color: "#fff", padding: "10px 14px", borderRadius: "10px", fontSize: "13px" });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

async function loadBookListStatus() {
  bookListStatusMap = new Map();
  if (!currentUser?.id || !state.books.length) return;
  const client = await ensureSupabase();
  if (!client) return;
  const ids = state.books.map((b) => b.id || b.providerId || "").filter(Boolean);
  if (!ids.length) return;
  const { data } = await client
    .from('list_items')
    .select('item_id, list_type')
    .eq('media_type', 'book')
    .eq('user_id', currentUser.id)
    .in('item_id', ids);
  (data || []).forEach((row) => {
    const id = String(row.item_id || "");
    if (!id) return;
    if (!bookListStatusMap.has(id)) bookListStatusMap.set(id, { favorites: false, read: false, readlist: false });
    const bucket = bookListStatusMap.get(id);
    if (row.list_type in bucket) bucket[row.list_type] = true;
  });
}

async function loadBookListStatusForNew(books) {
  if (!currentUser?.id || !books.length) return;
  const client = await ensureSupabase();
  if (!client) return;
  const ids = books.map((b) => b.id || b.providerId || "").filter(Boolean);
  if (!ids.length) return;
  const { data } = await client
    .from('list_items')
    .select('item_id, list_type')
    .eq('media_type', 'book')
    .eq('user_id', currentUser.id)
    .in('item_id', ids);
  (data || []).forEach((row) => {
    const id = String(row.item_id || "");
    if (!id) return;
    if (!bookListStatusMap.has(id)) bookListStatusMap.set(id, { favorites: false, read: false, readlist: false });
    const bucket = bookListStatusMap.get(id);
    if (row.list_type in bucket) bucket[row.list_type] = true;
  });
}

function applyBookListStatus() {
  const grid = document.getElementById("booksGrid");
  if (!grid) return;
  grid.querySelectorAll(".card[data-media-type='book']").forEach((card) => {
    const bookId = card.getAttribute("data-item-id") || card.getAttribute("data-id") || "";
    if (!bookId) return;
    const status = bookListStatusMap.get(bookId);
    if (!status) return;
    const hasSaved = status.favorites || status.read || status.readlist;
    card.classList.toggle("is-saved", hasSaved);
    let badge = card.querySelector(".card-saved-badge");
    if (hasSaved && !badge) {
      badge = document.createElement("span");
      badge.className = "card-saved-badge";
      badge.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
      const media = card.querySelector(".card-media");
      if (media) media.appendChild(badge);
    } else if (!hasSaved && badge) {
      badge.remove();
    }
  });
}

async function loadBooks(append) {
  if (state.loading) return;
  if (currentAbort) { currentAbort.abort(); }
  const abort = new AbortController();
  currentAbort = abort;

  state.loading = true;
  const grid = document.getElementById("booksGrid");
  const sentinel = document.getElementById("scrollSentinel");
  if (!grid) return;

  if (!append) {
    grid.innerHTML = Skel ? Skel.grid(PAGE_SIZE, 4) : '';
    state.books = [];
    state.allBooks = [];
    state.seenIds = new Set();
    state.offset = 0;
    state.hasMore = true;
    _booksLastRendered = 0;
    invalidatePoolCache();
  } else if (sentinel) {
    sentinel.innerHTML = Skel ? Skel.posterCard() : '';
  }

  const q = state.query.trim();
  const poolCacheKey = `${q}|${state.genre}|${state.sort}`;
  let poolBooks = [];
  let total = 0;

  const fetchPage = async (startIndex, limit) => {
    const provider = window.Zo2yBookProvider;
    if (provider) {
      try {
        let result;
        if (q) {
          result = await provider.search(q, { limit, startIndex });
        } else {
          result = await provider.getPopular({ limit, startIndex, genre: state.genre, sort: state.sort });
        }
        if (result && result.items && result.items.length) {
          return { items: result.items, total: result.total || result.items.length };
        }
      } catch (_) {}
    }

    let url;
    if (q) {
      const searchQ = state.genre ? `${q} AND subject:${state.genre}` : q;
      url = `/api/books/search?q=${encodeURIComponent(searchQ)}&limit=${limit}&startIndex=${startIndex}`;
    } else {
      const params = new URLSearchParams({ limit: String(limit), startIndex: String(startIndex) });
      if (state.genre) params.set("genre", state.genre);
      if (state.sort === "newest") params.set("sort", "newest");
      url = `/api/books/popular?${params}`;
    }

    const res = await fetch(url, { signal: abort.signal });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const raw = data.items || data.books || [];
    const items = raw.map(b => window.normalizeBook ? window.normalizeBook(b) : b).filter(Boolean);
    return { items, total: data.total || items.length };
  };

  try {
    if (append) {
      const r = await fetchPage(state.allBooks.length, 100);
      if (abort.signal.aborted) return;
      if (r.items && r.items.length) {
        poolBooks = r.items;
        total = r.total || state.totalItems;
      } else {
        state.hasMore = false;
        state.loading = false;
        if (currentAbort === abort) currentAbort = null;
        if (sentinel) sentinel.innerHTML = '';
        return;
      }
    } else {
      if (state._poolCacheKey === poolCacheKey && state._poolCache && state._poolCache.length >= PAGE_SIZE) {
        poolBooks = state._poolCache;
        total = state._poolCacheTotal || poolBooks.length;
      } else {
        if (q) {
          for (let p = 0; p < 5; p++) {
            const r = await fetchPage(p * PAGE_SIZE, PAGE_SIZE);
            if (abort.signal.aborted) return;
            if (r.items && r.items.length) {
              poolBooks = poolBooks.concat(r.items);
              if (total === 0 || r.total > total) total = r.total;
            }
          }
        } else {
          const r1 = await fetchPage(0, 100);
          if (abort.signal.aborted) return;
          if (r1.items && r1.items.length) {
            poolBooks = poolBooks.concat(r1.items);
            total = r1.total || poolBooks.length;
          }
          const r2 = await fetchPage(100, 100);
          if (abort.signal.aborted) return;
          if (r2.items && r2.items.length) {
            poolBooks = poolBooks.concat(r2.items);
            if (r2.total > total) total = r2.total;
          }
        }

        if (poolBooks.length === 0 && !q) {
          try {
            const fallbackRes = await fetch(`/api/books/trending?limit=${PAGE_SIZE * 3}`, { signal: abort.signal });
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const raw = fallbackData.books || fallbackData.items || [];
              poolBooks = raw.map(b => window.normalizeBook ? window.normalizeBook(b) : b).filter(Boolean);
              total = poolBooks.length;
            }
          } catch (_) {}
        }

        state._poolCache = poolBooks;
        state._poolCacheKey = poolCacheKey;
        state._poolCacheTotal = total;
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(err);
    if (!append) grid.innerHTML = '<div class="empty">Failed to load books. Please try again.</div>';
    state.loading = false;
    if (currentAbort === abort) currentAbort = null;
    if (sentinel) sentinel.innerHTML = '';
    return;
  }

  if (abort.signal.aborted) return;

  const newBooks = poolBooks.filter(b => {
    const id = b.id || b.providerId || "";
    if (!id || state.seenIds.has(id)) return false;
    state.seenIds.add(id);
    return true;
  });

  if (append) {
    state.allBooks = state.allBooks.concat(newBooks);
  } else {
    state.allBooks = newBooks;
  }

  state.totalItems = total || state.allBooks.length;

  if (append) {
    const newItems = state.allBooks.slice(state.offset, state.offset + PAGE_SIZE);
    state.books = state.books.concat(newItems);
  } else {
    state.books = state.allBooks.slice(0, PAGE_SIZE);
  }
  state.offset = state.books.length;
  state.hasMore = state.offset < state.totalItems && newBooks.length > 0;

  if (!q) {
    document.getElementById("gridTitle").textContent = state.genre ? `${state.genre.charAt(0).toUpperCase() + state.genre.slice(1)} Books` : "popular books right now";
    document.getElementById("gridDesc").textContent = state.genre ? `Top ${state.genre} books trending on BookTok` : "Trending fiction and non-fiction across Zo2y.";
  } else {
    document.getElementById("gridTitle").textContent = `Search: "${q}"`;
    document.getElementById("gridDesc").textContent = "";
  }

  renderGrid(append);
  if (!append) {
    await loadBookListStatus();
  } else {
    await loadBookListStatusForNew(state.books.slice(_booksLastRendered));
  }
  applyBookListStatus();

  state.loading = false;
  if (currentAbort === abort) currentAbort = null;
  if (sentinel) sentinel.innerHTML = '';
}

let _booksLastRendered = 0;

function renderGrid(append) {
  const grid = document.getElementById("booksGrid");
  if (!grid) return;
  if (!state.books.length && !append) {
    grid.innerHTML = '<div class="empty">No books found.</div>';
    _booksLastRendered = 0;
    return;
  }
  const renderItems = append ? state.books.slice(_booksLastRendered) : state.books;
  const html = renderItems.map(b => {
    const coverUrl = b.image || b.cover || "/images/fallback/book.svg";
    const bookId = b.id || b.providerId || "";
    const href = "book.html?id=" + encodeURIComponent(bookId);
    const safeTitle = b.title || 'Untitled';
    const safeAuthor = b.author || b.authors || "";
    return `
      <article class="card" data-id="${escapeHtml(bookId)}" data-item-id="${escapeHtml(bookId)}" data-media-type="book" data-title="${escapeHtml(safeTitle)}" data-image="${escapeHtml(coverUrl)}" data-href="${escapeHtml(href)}" data-author="${escapeHtml(safeAuthor)}">
        <div class="card-media cover">
          <a href="${escapeHtml(href)}">
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(safeTitle)}" loading="lazy" onerror="this.src='/images/fallback/book.svg'">
          </a>
        </div>
        <div class="card-meta">
          <span class="card-type"><i class="fa-solid fa-book"></i> Book</span>
          <div class="card-meta-top">
            <p class="card-name">${escapeHtml(safeTitle)}</p>
            <div class="card-menu-wrap">
              <button class="card-menu-btn" type="button" aria-label="Open list menu"><i class="fas fa-ellipsis-v"></i></button>
            </div>
          </div>
          <p class="card-sub">${safeAuthor ? escapeHtml(safeAuthor) : ''}</p>
          <p class="card-extra">${b.year ? escapeHtml(String(b.year)) : ""}${b.pageCount ? ` | ${b.pageCount} pages` : ""}</p>
        </div>
      </article>
    `;
  }).join("");
  if (append) {
    grid.insertAdjacentHTML("beforeend", html);
  } else {
    grid.innerHTML = html;
  }
  _booksLastRendered = state.books.length;
}

let searchTimer = null;
let lastQuery = "";

function setupInfiniteScroll() {
  const sentinel = document.getElementById("scrollSentinel");
  if (!sentinel) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !state.loading && state.hasMore) {
        loadBooks(true);
      }
    }
  }, { rootMargin: "400px" });
  observer.observe(sentinel);
}

function wireEvents() {
  const searchInput = document.getElementById("q");
  const searchBtn = document.getElementById("booksSearchBtn");
  const filterModal = document.getElementById("booksFilterModal");
  const filterClose = document.getElementById("booksFilterCloseBtn");
  const refreshBtn = document.getElementById("refresh");
  const grid = document.getElementById("booksGrid");

  if (grid) {
    grid.addEventListener("click", (e) => {
      const menuBtn = e.target.closest(".card-menu-btn");
      if (menuBtn) {
        e.stopPropagation();
        const card = menuBtn.closest(".card");
        if (card && window.openIndexStyleListMenu) {
          window.openIndexStyleListMenu(card);
        }
        return;
      }
      const card = e.target.closest(".card");
      if (card) {
        let href = card.querySelector("a")?.getAttribute("href");
        // Enforce book cards always go to book.html, never to openlibrary.org
        if (href && /openlibrary\.org/i.test(href)) {
          const match = href.match(/\/works\/([OL\dW]+)/i) || href.match(/[?&]id=([^&]+)/);
          const bookId = match ? match[1] : null;
          href = bookId ? 'book.html?id=' + encodeURIComponent(bookId) : 'books.html';
        }
        if (href) window.location.href = href;
      }
    });
  }

  function triggerSearch() {
    const val = searchInput ? searchInput.value : "";
    if (val === lastQuery) return;
    lastQuery = val;
    state.query = val.trim();
    state.seenIds = new Set();
    invalidatePoolCache();
    loadBooks(false);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => {
        if (val === lastQuery) return;
        lastQuery = val;
        state.query = val.trim();
        state.seenIds = new Set();
        invalidatePoolCache();
        loadBooks(false);
      }, 350);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(searchTimer);
        triggerSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      clearTimeout(searchTimer);
      triggerSearch();
    });
  }

  if (filterModal && refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      const genreEl = document.getElementById("genre");
      const sortEl = document.getElementById("sort");
      if (genreEl) state.genre = genreEl.value;
      if (sortEl) {
        state.sort = sortEl.value;
        state.orderBy = sortEl.value === "newest" ? "newest" : "relevance";
      }
      state.seenIds = new Set();
      invalidatePoolCache();
      filterModal.setAttribute("aria-hidden", "true");
      loadBooks(false);
    });
  }

  if (filterModal && filterClose) {
    filterClose.addEventListener("click", () => filterModal.setAttribute("aria-hidden", "true"));
  }

  if (filterModal) {
    document.getElementById("booksFilterBtn")?.addEventListener("click", () => filterModal.setAttribute("aria-hidden", "false"));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const genreSelect = document.getElementById("genre");
  if (genreSelect) {
    const genres = ["", "fiction", "fantasy", "romance", "thriller", "mystery", "science fiction", "young adult", "horror", "contemporary", "memoir", "biography", "poetry", "adventure", "dystopia"];
    genreSelect.innerHTML = genres.map(g => `<option value="${g}">${g ? g.charAt(0).toUpperCase() + g.slice(1) : "All Genres"}</option>`).join("");
  }
  wireEvents();
  initAuthUi().then(async () => {
    await loadBooks(false);
    setupInfiniteScroll();
  });
});
