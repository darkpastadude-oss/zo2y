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
    .from('book_list_items')
    .select('book_id, list_type')
    .eq('user_id', currentUser.id)
    .in('book_id', ids);
  (data || []).forEach((row) => {
    const id = String(row.book_id || "");
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
    const newBooks = raw.map(b => window.normalizeBook ? window.normalizeBook(b) : b).filter(Boolean).filter(b => {
      const id = b.id || b.providerId || "";
      if (!id || state.seenIds.has(id)) return false;
      state.seenIds.add(id);
      return true;
    });

    if (append) {
      state.books = state.books.concat(newBooks);
    } else {
      state.books = newBooks;
    }

    const pageCount = Math.floor(state.offset / PAGE_SIZE) + 1;
    state.totalItems = data.total || state.books.length;
    state.offset = state.books.length;
    state.hasMore = newBooks.length >= PAGE_SIZE && pageCount < MAX_PAGES;

    renderGrid(append);
    if (!append) await loadBookListStatus();
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(err);
    if (!append) grid.innerHTML = '<div class="empty">Failed to load books. Please try again.</div>';
  } finally {
    state.loading = false;
    if (currentAbort === abort) currentAbort = null;
    if (sentinel) sentinel.innerHTML = '';
  }
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
    const href = (b.externalUrl || b.previewUrl || "") ? (b.externalUrl || b.previewUrl) : "book.html?id=" + encodeURIComponent(bookId);
    return `
      <article class="card" data-id="${escapeHtml(bookId)}" data-title="${escapeHtml(b.title)}" data-author="${escapeHtml(b.author || b.authors || "")}">
        <div class="card-media cover">
          <a href="${escapeHtml(href)}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(b.title)}" loading="lazy" onerror="this.src='/images/fallback/book.svg'">
          </a>
        </div>
        <div class="card-meta">
          <span class="card-type"><i class="fa-solid fa-book"></i> Book</span>
          <div class="card-meta-top"><p class="card-name">${escapeHtml(b.title)}</p></div>
          <p class="card-sub">${escapeHtml(b.author || b.authors || "Unknown Author")}</p>
          <p class="card-extra">${b.year ? escapeHtml(String(b.year)) : ""}${b.pageCount ? ` | ${b.pageCount} pages` : ""}</p>
          <div class="card-actions">
            <button class="icon-btn menu-btn" type="button" aria-label="Open list menu"><i class="fas fa-ellipsis-v"></i></button>
          </div>
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
  const filterModal = document.getElementById("booksFilterModal");
  const filterClose = document.getElementById("booksFilterCloseBtn");
  const refreshBtn = document.getElementById("refresh");

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

function initMenuBridge() {
  if (window.initIndexStyleListMenu && !window.__ZO2Y_BOOKS_LIST_BRIDGE) {
    window.__ZO2Y_BOOKS_LIST_BRIDGE = true;
    window.initIndexStyleListMenu({
      mediaType: "book",
      itemIdAttr: "data-id",
      getItemFromCard: function (card) {
        if (!card) return null;
        return {
          mediaType: "book",
          itemId: card.getAttribute("data-id") || "",
          title: card.getAttribute("data-title") || "",
          subtitle: card.getAttribute("data-author") || "",
          image: card.querySelector("img")?.getAttribute("src") || ""
        };
      },
      getVisibleItemIds: function () {
        return Array.from(document.querySelectorAll('.card[data-id]')).map(c => c.getAttribute("data-id")).filter(Boolean);
      },
      getQuickStatusForItem: function (itemId) {
        const key = String(itemId || "").trim();
        const status = bookListStatusMap.get(key);
        return status ? { ...status } : null;
      },
      ensureClient: async function () { return await ensureSupabase(); },
      getCurrentUser: function () { return currentUser || null; },
      notify: function (msg, isErr) { showToast(msg, !!isErr); }
    });
    document.body.addEventListener("click", e => {
      const btn = e.target.closest(".menu-btn");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".card");
        if (card && window.openIndexStyleListMenu) window.openIndexStyleListMenu(card);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const genreSelect = document.getElementById("genre");
  if (genreSelect) {
    const genres = ["", "fiction", "fantasy", "romance", "thriller", "mystery", "science fiction", "young adult", "horror", "contemporary", "memoir", "biography", "poetry", "adventure", "dystopia"];
    genreSelect.innerHTML = genres.map(g => `<option value="${g}">${g ? g.charAt(0).toUpperCase() + g.slice(1) : "All Genres"}</option>`).join("");
  }
  wireEvents();
  initMenuBridge();
  setupInfiniteScroll();
  initAuthUi().then(async () => { await loadBooks(false); });
});
