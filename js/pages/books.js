let supabaseClient = null;
let currentUser = null;
let currentAbort = null;
let bookListStatusMap = new Map();

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
  seenIds: new Set(),
  query: "",
  genre: "",
  sort: "relevance",
  orderBy: "relevance",
  offset: 0,
  totalItems: 0,
  hasMore: true,
  loading: false
};

const PAGE_SIZE = 24;
const MAX_PAGES = 5;

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
    grid.innerHTML = Skel.grid(PAGE_SIZE, 4);
    state.books = [];
    state.seenIds = new Set();
    state.offset = 0;
    state.hasMore = true;
    _booksLastRendered = 0;
  } else if (sentinel) {
    sentinel.innerHTML = Skel.posterCard();
  }

  const q = state.query.trim();
  let newBooks = [];
  let total = 0;

  const provider = window.Zo2yBookProvider;
  if (provider) {
    try {
      let result;
      if (q) {
        document.getElementById("gridTitle").textContent = `Search: "${q}"`;
        document.getElementById("gridDesc").textContent = "";
        result = await provider.search(q, { limit: PAGE_SIZE, startIndex: state.offset });
      } else {
        document.getElementById("gridTitle").textContent = state.genre ? `${state.genre.charAt(0).toUpperCase() + state.genre.slice(1)} Books` : "popular books right now";
        document.getElementById("gridDesc").textContent = state.genre ? `Top ${state.genre} books trending on BookTok` : "Trending fiction and non-fiction across Zo2y.";
        result = await provider.getPopular({ limit: PAGE_SIZE, startIndex: state.offset, genre: state.genre, sort: state.sort });
      }
      if (result && abort.signal.aborted) return;
      if (result && result.items) {
        newBooks = result.items;
        total = result.total || newBooks.length;
      }
    } catch (_) {}
  }

  if (newBooks.length === 0) {
    let url;
    if (q) {
      const searchQ = state.genre ? `${q} AND subject:${state.genre}` : q;
      const params = new URLSearchParams({ q: searchQ, limit: String(PAGE_SIZE), startIndex: String(state.offset) });
      url = `/api/books/search?${params}`;
      document.getElementById("gridTitle").textContent = `Search: "${q}"`;
      document.getElementById("gridDesc").textContent = "";
    } else {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), startIndex: String(state.offset) });
      if (state.genre) params.set("genre", state.genre);
      if (state.sort === "newest") params.set("sort", "newest");
      url = `/api/books/popular?${params}`;
      document.getElementById("gridTitle").textContent = state.genre ? `${state.genre.charAt(0).toUpperCase() + state.genre.slice(1)} Books` : "popular books right now";
      document.getElementById("gridDesc").textContent = state.genre ? `Top ${state.genre} books trending on BookTok` : "Trending fiction and non-fiction across Zo2y.";
    }

    try {
      const res = await fetch(url, { signal: abort.signal });
      if (abort.signal.aborted) return;
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (abort.signal.aborted) return;

      const raw = data.items || data.books || [];
      newBooks = raw.map(b => window.normalizeBook ? window.normalizeBook(b) : b).filter(Boolean);
      total = data.total || newBooks.length;
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      if (!append) grid.innerHTML = '<div class="empty">Failed to load books. Please try again.</div>';
      state.loading = false;
      if (currentAbort === abort) currentAbort = null;
      if (sentinel) sentinel.innerHTML = '';
      return;
    }
  }

  const filteredBooks = newBooks.filter(b => {
    const id = b.id || b.providerId || "";
    if (!id || state.seenIds.has(id)) return false;
    state.seenIds.add(id);
    return true;
  });

  if (append) {
    state.books = state.books.concat(filteredBooks);
  } else {
    state.books = filteredBooks;
  }

  const pageCount = Math.floor(state.offset / PAGE_SIZE) + 1;
  state.totalItems = total || state.books.length;
  state.offset = state.books.length;
  state.hasMore = filteredBooks.length >= PAGE_SIZE && pageCount < MAX_PAGES;

  renderGrid(append);
  if (!append) await loadBookListStatus();

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
    return `
      <article class="card" data-id="${escapeHtml(bookId)}" data-title="${escapeHtml(b.title)}" data-author="${escapeHtml(b.author || b.authors || "")}">
        <div class="card-media cover">
          <a href="${escapeHtml(href)}">
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(b.title)}" loading="lazy" onerror="this.src='/images/fallback/book.svg'">
          </a>
        </div>
        <div class="card-meta">
          <span class="card-type"><i class="fa-solid fa-book"></i> Book</span>
          <div class="card-meta-top">
            <p class="card-name">${escapeHtml(b.title)}</p>
            <div class="card-menu-wrap">
              <button class="card-menu-btn" type="button" aria-label="Open list menu"><i class="fas fa-ellipsis-v"></i></button>
            </div>
          </div>
          <p class="card-sub">${escapeHtml(b.author || b.authors || "Unknown Author")}</p>
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
          href = 'books.html';
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
  setupInfiniteScroll();
  initAuthUi().then(async () => { await loadBooks(false); });
});
