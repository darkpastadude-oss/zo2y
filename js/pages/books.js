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
  query: "",
  genre: "",
  sort: "relevance",
  orderBy: "relevance",
  page: 1,
  totalItems: 0,
  totalPages: 1,
  loading: false
};

const PAGE_SIZE = 24;

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

async function loadBooks() {
  if (state.loading) return;
  if (currentAbort) { currentAbort.abort(); }
  const abort = new AbortController();
  currentAbort = abort;

  state.loading = true;
  const grid = document.getElementById("booksGrid");
  if (!grid) return;

  grid.innerHTML = Skel.grid(PAGE_SIZE, 4);

  const q = state.query.trim();
  const startIndex = (state.page - 1) * PAGE_SIZE;
  let url;

  if (q) {
    const params = new URLSearchParams({ q, limit: String(PAGE_SIZE), startIndex: String(startIndex) });
    if (state.orderBy) params.set("orderBy", state.orderBy);
    if (state.genre) params.set("q", `${q}+subject:${state.genre}`);
    url = `/api/books/search?${params}`;
    document.getElementById("gridTitle").textContent = `Search: "${q}"`;
    document.getElementById("gridDesc").textContent = "";
  } else {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), startIndex: String(startIndex) });
    if (state.genre) params.set("genre", state.genre);
    if (state.orderBy === "newest") { params.set("orderBy", "newest"); }
    url = `/api/books/trending?${params}`;
    document.getElementById("gridTitle").textContent = state.genre ? `${state.genre.charAt(0).toUpperCase() + state.genre.slice(1)} Books` : "Popular Books";
    document.getElementById("gridDesc").textContent = state.genre ? `Top ${state.genre} books` : "Trending books from Google Books";
  }

  try {
    const res = await fetch(url, { signal: abort.signal });
    if (abort.signal.aborted) return;
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    if (abort.signal.aborted) return;

    const raw = data.items || data.books || [];
    state.books = raw.map(b => window.normalizeBook ? window.normalizeBook(b) : b).filter(Boolean);
    state.totalItems = data.total || state.books.length;
    state.totalPages = Math.max(1, Math.ceil(state.totalItems / PAGE_SIZE));
    renderGrid();
    updatePagination();
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error(err);
    grid.innerHTML = '<div class="empty">Failed to load books. Please try again.</div>';
  } finally {
    state.loading = false;
    if (currentAbort === abort) currentAbort = null;
  }
}

function renderGrid() {
  const grid = document.getElementById("booksGrid");
  if (!grid) return;
  if (!state.books.length) {
    grid.innerHTML = '<div class="empty">No books found.</div>';
    return;
  }
  grid.innerHTML = state.books.map(b => {
    const coverUrl = b.image || b.cover || "/images/fallback/book.svg";
    return `
      <article class="card" data-id="${escapeHtml(b.id || b.providerId || "")}" data-title="${escapeHtml(b.title)}" data-author="${escapeHtml(b.author || b.authors || "")}">
        <div class="card-media cover">
          <a href="book.html?id=${encodeURIComponent(b.id || b.providerId || "")}">
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
  updateSpotlight(state.books[0]);
}

function updateSpotlight(book) {
  const sec = document.getElementById("booksSpotlight");
  if (!sec) return;
  if (!book) { sec.hidden = true; return; }
  sec.hidden = false;
  document.getElementById("booksSpotlightTitle").textContent = book.title || "Unknown";
  const year = book.year || "";
  const author = book.author || book.authors || "Unknown Author";
  document.getElementById("booksSpotlightMeta").textContent = year ? `${author} | ${year}` : author;
  document.getElementById("booksSpotlightSummary").textContent = book.description || "No description available.";
  const img = document.getElementById("booksSpotlightImage");
  const bg = document.getElementById("booksSpotlightBg");
  const coverUrl = book.image || book.cover || "/images/fallback/book.svg";
  if (img) { img.src = coverUrl; img.onerror = function () { this.src = "/images/fallback/book.svg"; }; }
  if (bg) bg.style.backgroundImage = `url("${coverUrl}")`;
}

function updatePagination() {
  const prev = document.getElementById("prevPageBtn");
  const next = document.getElementById("nextPageBtn");
  const info = document.getElementById("pageInfo");
  if (prev) prev.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= state.totalPages;
  if (info) info.textContent = `Page ${state.page} of ${state.totalPages}`;
}

let searchTimer = null;
let lastQuery = "";

function wireEvents() {
  const searchInput = document.getElementById("q");
  const filterModal = document.getElementById("booksFilterModal");
  const filterClose = document.getElementById("booksFilterCloseBtn");
  const refreshBtn = document.getElementById("refresh");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => {
        if (val === lastQuery) return;
        lastQuery = val;
        state.query = val.trim();
        state.page = 1;
        loadBooks();
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
      state.page = 1;
      filterModal.setAttribute("aria-hidden", "true");
      loadBooks();
    });
  }

  if (filterModal && filterClose) {
    filterClose.addEventListener("click", () => filterModal.setAttribute("aria-hidden", "true"));
  }

  if (filterModal) {
    document.getElementById("booksFilterBtn")?.addEventListener("click", () => filterModal.setAttribute("aria-hidden", "false"));
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.page > 1) { state.page--; loadBooks(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (state.page < state.totalPages) { state.page++; loadBooks(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
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
    const genres = ["", "fiction", "fantasy", "romance", "thriller", "mystery", "science fiction", "history", "biography", "poetry", "self-help", "young adult", "horror", "comics", "cooking"];
    genreSelect.innerHTML = genres.map(g => `<option value="${g}">${g ? g.charAt(0).toUpperCase() + g.slice(1) : "All Genres"}</option>`).join("");
  }
  wireEvents();
  initMenuBridge();
  initAuthUi().then(async () => { await loadBooks(); await loadBookListStatus(); });
});
