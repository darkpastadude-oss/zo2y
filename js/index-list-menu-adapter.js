(function () {
  if (window.ListKit) return;

  const STYLE_ID = "zo2yListMenuStyle";
  const STATE = {
    currentCard: null,
    currentItem: null,
    quickRows: [],
    quickStatus: {},
    pendingQuickKeys: new Set(),
    quickVersions: {},
    customLists: [],
    selectedCustomLists: new Set(),
    pendingCustomListIds: new Set(),
    customVersion: 0
  };

  const QUICK_ROWS_BY_TYPE = {
    movie: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Watched", icon: "fas fa-eye" },
      { key: "watchlist", label: "Watchlist", icon: "fas fa-bookmark" }
    ],
    tv: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Watched", icon: "fas fa-eye" },
      { key: "watchlist", label: "Watchlist", icon: "fas fa-bookmark" }
    ],
    anime: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Watched", icon: "fas fa-eye" },
      { key: "watchlist", label: "Watchlist", icon: "fas fa-bookmark" }
    ],
    game: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Played", icon: "fas fa-check" },
      { key: "watchlist", label: "Backlog", icon: "fas fa-clock" }
    ],
    book: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Read", icon: "fas fa-check" },
      { key: "watchlist", label: "Reading List", icon: "fas fa-book-open" }
    ],
    music: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Listened", icon: "fas fa-headphones" },
      { key: "watchlist", label: "Listen Later", icon: "fas fa-clock" }
    ],
    travel: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Visited", icon: "fas fa-check" },
      { key: "watchlist", label: "Bucket List", icon: "fas fa-map-marker-alt" }
    ],
    fashion: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Owned", icon: "fas fa-check" },
      { key: "watchlist", label: "Wishlist", icon: "fas fa-cart-plus" }
    ],
    food: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Tried", icon: "fas fa-utensils" },
      { key: "watchlist", label: "Want to Try", icon: "fas fa-utensils" }
    ],
    car: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Owned", icon: "fas fa-check" },
      { key: "watchlist", label: "Wishlist", icon: "fas fa-cart-plus" }
    ],
    sport: [
      { key: "favorites", label: "Favorites", icon: "fas fa-heart" },
      { key: "completed", label: "Watched", icon: "fas fa-eye" },
      { key: "watchlist", label: "Watchlist", icon: "fas fa-bookmark" }
    ]
  };

  let _bridge = null;
  let _lastFocusedTrigger = null;
  let DOM = { quickContainer: null, quickNodesByKey: new Map(), customContainer: null };

  function getMediaType() {
    return String(_bridge?.mediaType || STATE.currentItem?.mediaType || "").toLowerCase();
  }

  function escapeHtml(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ====================================================================
  // API calls via ListUtils (or direct fetch fallback)
  // ====================================================================

  async function apiToggleDefault(category, listType, externalId, metadata) {
    if (window.ListUtils && typeof window.ListUtils.toggleDefaultItem === "function") {
      return window.ListUtils.toggleDefaultItem(category, listType, externalId, metadata);
    }
    try {
      const res = await fetch("/api/lists/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category, type: listType,
          external_id: String(externalId),
          external_source: "local_db",
          metadata: metadata || {}
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  async function apiGetStatus(category, externalId) {
    if (window.ListUtils && typeof window.ListUtils.getItemStatus === "function") {
      return window.ListUtils.getItemStatus(category, externalId);
    }
    try {
      const res = await fetch(`/api/lists/status?category=${encodeURIComponent(category)}&external_id=${encodeURIComponent(String(externalId))}`);
      return await res.json();
    } catch (e) {
      return { success: false, status: {}, custom_lists: [] };
    }
  }

  async function apiGetLists(category) {
    if (window.ListUtils && typeof window.ListUtils.getLists === "function") {
      return window.ListUtils.getLists(category);
    }
    try {
      const res = await fetch(`/api/lists?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      return data.lists || [];
    } catch (e) {
      return [];
    }
  }

  async function apiEnsureDefaults(category) {
    if (window.ListUtils && typeof window.ListUtils.ensureDefaults === "function") {
      return window.ListUtils.ensureDefaults(category);
    }
    try {
      const res = await fetch("/api/lists/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }

  async function apiCreateCustomList(category, name, icon) {
    if (window.ListUtils && typeof window.ListUtils.createCustomList === "function") {
      return window.ListUtils.createCustomList(category, name, icon);
    }
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name, icon: icon || "fas fa-list" })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  async function apiAddItemToCustomList(listId, category, externalId, metadata) {
    if (window.ListUtils && typeof window.ListUtils.addItemToCustomList === "function") {
      return window.ListUtils.addItemToCustomList(listId, category, externalId, metadata);
    }
    // fallback
    console.error("ListUtils not found. Cannot add item to custom list.");
    return { success: false, message: "List system not fully loaded." };
  }

  async function apiRemoveItemFromCustomList(listId, category, externalId) {
    if (window.ListUtils && typeof window.ListUtils.removeItemFromCustomList === "function") {
      return window.ListUtils.removeItemFromCustomList(listId, category, externalId);
    }
    console.error("ListUtils not found. Cannot remove item from custom list.");
    return { success: false, message: "List system not fully loaded." };
  }

  // ====================================================================
  // Menu UI
  // ====================================================================

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .menu-modal{display:none;position:absolute;z-index:10000;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.75);backdrop-filter:blur(5px);padding:0;align-items:center;justify-content:center}
      .menu-modal.active{display:flex}
      .menu-modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card,#132347);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:20px;width:100%;max-width:380px;max-height:80vh;overflow-y:auto;box-shadow:0 12px 34px rgba(0,0,0,.28)}
      .menu-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,rgba(255,255,255,.12))}
      .menu-modal-header h3{font-size:18px;font-weight:600;color:var(--white,#fff);margin:0}
      .menu-modal-close{background:transparent;border:none;color:var(--muted,#8ca3c7);font-size:24px;cursor:pointer;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}
      .menu-modal-close:hover{background:rgba(255,255,255,.1);color:var(--white,#fff)}
      .menu-modal-body{padding:16px 20px}
      .menu-quick-lists{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
      .menu-quick-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;color:var(--text,#fff);cursor:pointer;font:inherit;text-align:left;min-height:48px;transition:background-color .18s,border-color .18s}
      .menu-quick-item:hover{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-quick-item:active{transform:scale(.985)}
      .menu-quick-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.15)}
      .menu-quick-item[aria-busy=true]{opacity:.72;pointer-events:none}
      .menu-quick-left{display:flex;align-items:center;gap:12px}
      .menu-quick-left i{width:20px;color:var(--accent,#f59e0b)}
      .menu-quick-left span{font-weight:500;color:var(--white,#fff)}
      .menu-quick-state{color:var(--accent,#f59e0b);font-size:13px;font-weight:600}
      .menu-custom-section{border-top:1px solid var(--border,rgba(255,255,255,.12));padding-top:16px}
      .menu-custom-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;color:var(--muted,#8ca3c7);font-size:14px}
      .menu-custom-lists{display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto}
      .menu-custom-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;cursor:pointer;transition:all .2s}
      .menu-custom-item:hover{border-color:var(--accent,#f59e0b)}
      .menu-custom-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-custom-item[aria-busy=true]{opacity:.82}
      .menu-custom-left{display:flex;align-items:center;gap:10px}
      .menu-custom-left i{width:18px;color:var(--accent,#f59e0b);font-size:14px}
      .menu-custom-left span{font-size:14px;color:var(--white,#fff)}
      .menu-custom-state{color:var(--accent,#f59e0b);font-size:12px;font-weight:600}
      .menu-input{width:100%;padding:12px 16px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;color:var(--white,#fff);font-size:14px;margin-bottom:12px;box-sizing:border-box}
      .menu-input:focus{outline:none;border-color:var(--accent,#f59e0b)}
      .menu-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
      .menu-btn{padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid var(--border,rgba(255,255,255,.12));transition:all .2s}
      .menu-btn-primary{background:linear-gradient(135deg,#f59e0b,#ffb84d);color:#0b1633;border:none}
      .menu-btn-primary:hover{filter:brightness(1.1)}
      .menu-btn-secondary{background:transparent;color:var(--white,#fff)}
      .menu-btn-secondary:hover{background:rgba(255,255,255,.1)}
      .menu-empty{text-align:center;padding:20px;color:var(--muted,#8ca3c7);font-size:14px;background:var(--card-2,#172b58);border-radius:12px;border:1px dashed var(--border,rgba(255,255,255,.12))}
      .menu-create-list-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:12px;padding:10px 16px;background:transparent;border:1px dashed var(--border,rgba(255,255,255,.2));border-radius:12px;color:var(--muted,#8ca3c7);font-size:13px;cursor:pointer;transition:all .2s}
      .menu-create-list-btn:hover{border-color:var(--accent,#f59e0b);color:var(--accent,#f59e0b)}
      .menu-create-form{display:none;margin-top:12px}
      .menu-create-form.visible{display:block}
      @media(max-width:768px){.menu-modal-content{max-width:calc(100vw - 14px)}}
    `;
    document.head.appendChild(s);
  }

  function ensureMarkup() {
    if (document.getElementById("itemMenuModal")) return;
    const m = document.createElement("div");
    m.id = "itemMenuModal";
    m.className = "menu-modal";
    m.setAttribute("aria-hidden", "true");
    m.innerHTML = `
      <div class="menu-modal-content">
        <div class="menu-modal-header">
          <h3 id="menuModalTitle">Add to List</h3>
          <button class="menu-modal-close" id="closeMenuModalBtn" aria-label="Close">&times;</button>
        </div>
        <div class="menu-modal-body">
          <div class="menu-quick-lists" id="menuQuickLists"></div>
          <div class="menu-custom-section">
            <div class="menu-custom-header">
              <span>Custom Lists</span>
            </div>
            <div class="menu-custom-lists" id="menuCustomLists"></div>
            <button class="menu-create-list-btn" id="menuCreateListBtn"><i class="fas fa-plus"></i> New List</button>
            <div class="menu-create-form" id="menuCreateListForm">
              <input type="text" class="menu-input" id="menuNewListName" placeholder="List name..." maxlength="50">
              <div class="menu-modal-actions">
                <button class="menu-btn menu-btn-secondary" id="menuCancelCreateBtn">Cancel</button>
                <button class="menu-btn menu-btn-primary" id="menuConfirmCreateBtn">Create</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);

    // Event listeners
    document.getElementById("closeMenuModalBtn").addEventListener("click", closeMenu);
    m.addEventListener("click", (e) => { if (e.target === m) closeMenu(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    document.getElementById("menuCreateListBtn").addEventListener("click", () => {
      document.getElementById("menuCreateListForm").classList.toggle("visible");
    });
    document.getElementById("menuCancelCreateBtn").addEventListener("click", () => {
      document.getElementById("menuCreateListForm").classList.remove("visible");
      document.getElementById("menuNewListName").value = "";
    });
    document.getElementById("menuConfirmCreateBtn").addEventListener("click", handleCreateCustomList);
    document.getElementById("menuNewListName").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleCreateCustomList();
    });
  }

  async function handleCreateCustomList() {
    const input = document.getElementById("menuNewListName");
    const name = input.value.trim();
    if (!name) return;

    const mt = getMediaType();
    const result = await apiCreateCustomList(mt, name, "fas fa-list");
    if (result.success) {
      input.value = "";
      document.getElementById("menuCreateListForm").classList.remove("visible");
      await loadCustomListsData();
      renderCustomLists();
    } else {
      console.error("List creation failed:", result.message || "Unknown error");
      alert("Failed to create list: " + (result.message || "Unknown error"));
    }
  }

  function closeMenu() {
    const m = document.getElementById("itemMenuModal");
    if (m) {
      m.classList.remove("active");
      m.setAttribute("aria-hidden", "true");
    }
    STATE.pendingQuickKeys = new Set();
    STATE.pendingCustomListIds = new Set();
    if (_lastFocusedTrigger && document.contains(_lastFocusedTrigger)) {
      setTimeout(() => { try { _lastFocusedTrigger.focus({ preventScroll: true }); } catch (e) {} }, 0);
    }
    document.body.style.overflow = "";
  }

  // ====================================================================
  // Render Quick Lists
  // ====================================================================

  function renderQuickLists() {
    const container = document.getElementById("menuQuickLists");
    if (!container) return;
    const rows = STATE.quickRows;
    if (!rows.length) {
      container.innerHTML = '<div class="menu-empty">No lists available</div>';
      return;
    }

    container.innerHTML = rows.map(r =>
      `<button type="button" class="menu-quick-item ${STATE.quickStatus[r.key] ? "active" : ""}"
         data-quick-key="${r.key}" aria-busy="${STATE.pendingQuickKeys.has(r.key) ? "true" : "false"}">
        <div class="menu-quick-left"><i class="${r.icon}"></i><span>${escapeHtml(r.label)}</span></div>
        <span class="menu-quick-state">${STATE.quickStatus[r.key] ? "Saved" : "Add"}</span>
      </button>`
    ).join("");

    container.querySelectorAll(".menu-quick-item").forEach(btn => {
      const key = btn.getAttribute("data-quick-key");
      btn.addEventListener("click", () => handleQuickToggle(key));
    });
  }

  async function handleQuickToggle(key) {
    if (STATE.pendingQuickKeys.has(key)) return;
    STATE.pendingQuickKeys.add(key);
    renderQuickLists();

    const item = STATE.currentItem;
    if (!item) { STATE.pendingQuickKeys.delete(key); renderQuickLists(); return; }

    const mt = getMediaType();
    const externalId = String(item.itemId);
    const metadata = { title: item.title || "", poster_url: item.image || "" };

    const prev = STATE.quickStatus[key];
    const next = !prev;
    STATE.quickStatus[key] = next;
    STATE.quickVersions[key] = (STATE.quickVersions[key] || 0) + 1;
    const ver = STATE.quickVersions[key];
    renderQuickLists();

    const result = await apiToggleDefault(mt, key, externalId, metadata);
    if (STATE.quickVersions[key] !== ver) return;

    if (!result.success) {
      console.error("List toggle failed:", result.message || "Unknown error");
      alert("Failed to save: " + (result.message || "Unknown error"));
      STATE.quickStatus[key] = prev;
    } else {
      const action = result.result?.action;
      STATE.quickStatus[key] = action === "added";
    }
    STATE.pendingQuickKeys.delete(key);
    renderQuickLists();
  }

  // ====================================================================
  // Render Custom Lists
  // ====================================================================

  function renderCustomLists() {
    const container = document.getElementById("menuCustomLists");
    if (!container) return;

    if (!STATE.customLists.length) {
      container.innerHTML = '<div class="menu-empty">No custom lists yet</div>';
      return;
    }

    container.innerHTML = STATE.customLists.map(l => {
      const active = STATE.selectedCustomLists.has(l.id);
      const busy = STATE.pendingCustomListIds.has(l.id);
      const icon = l.icon || "fas fa-list";
      return `<div class="menu-custom-item ${active ? "active" : ""}" data-list-id="${l.id}" aria-busy="${busy ? "true" : "false"}">
        <div class="menu-custom-left"><i class="${icon}"></i><span>${escapeHtml(l.name)}</span></div>
        <span class="menu-custom-state">${busy ? "..." : (active ? "Saved" : "Add")}</span>
      </div>`;
    }).join("");

    container.querySelectorAll(".menu-custom-item").forEach(el => {
      el.addEventListener("click", () => handleCustomToggle(el.getAttribute("data-list-id")));
    });
  }

  async function handleCustomToggle(listId) {
    if (STATE.pendingCustomListIds.has(listId)) return;
    STATE.pendingCustomListIds.add(listId);
    renderCustomLists();

    const item = STATE.currentItem;
    if (!item) { STATE.pendingCustomListIds.delete(listId); renderCustomLists(); return; }

    const mt = getMediaType();
    const externalId = String(item.itemId);
    const metadata = { title: item.title || "", poster_url: item.image || "" };

    const wasSelected = STATE.selectedCustomLists.has(listId);
    const version = ++STATE.customVersion;
    STATE.selectedCustomLists = new Set(STATE.selectedCustomLists);

    let success = false;
    let result;
    if (wasSelected) {
      STATE.selectedCustomLists.delete(listId);
      renderCustomLists();
      result = await apiRemoveItemFromCustomList(listId, mt, externalId);
      success = result.success;
    } else {
      STATE.selectedCustomLists.add(listId);
      renderCustomLists();
      result = await apiAddItemToCustomList(listId, mt, externalId, metadata);
      success = result.success;
    }

    if (STATE.customVersion !== version) return;
    if (!success) {
      console.error("Custom list toggle failed:", result?.message || "Unknown error");
      alert("Failed to update custom list: " + (result?.message || "Unknown error"));
      if (wasSelected) STATE.selectedCustomLists.add(listId);
      else STATE.selectedCustomLists.delete(listId);
    }
    STATE.pendingCustomListIds.delete(listId);
    renderCustomLists();
  }

  // ====================================================================
  // Data Loading
  // ====================================================================

  async function loadQuickStatus(category, externalId) {
    const result = await apiGetStatus(category, externalId);
    if (result.success) {
      STATE.quickStatus = { ...result.status };
    } else {
      STATE.quickStatus = { favorites: false, completed: false, watchlist: false };
    }
    renderQuickLists();
  }

  async function loadCustomListsData() {
    const mt = getMediaType();
    const lists = await apiGetLists(mt);
    STATE.customLists = lists.filter(l => l.type === "custom");
    renderCustomLists();
  }

  async function loadMembership(category, externalId) {
    const result = await apiGetStatus(category, externalId);
    if (result.success) {
      STATE.selectedCustomLists = new Set((result.custom_lists || []).map(c => c.list_id));
    } else {
      STATE.selectedCustomLists = new Set();
    }
    renderCustomLists();
  }

  async function loadAllData() {
    const item = STATE.currentItem;
    if (!item) return;
    const mt = getMediaType();
    const externalId = String(item.itemId);

    await Promise.all([
      loadQuickStatus(mt, externalId),
      loadCustomListsData(),
      loadMembership(mt, externalId)
    ]);
  }

  // ====================================================================
  // Open Menu
  // ====================================================================

  function positionModal(trigger) {
    const m = document.getElementById("itemMenuModal");
    if (!m) return;
    const v = window.visualViewport;
    m.style.top = ((v?.offsetTop || 0) + window.scrollY) + "px";
    m.style.left = ((v?.offsetLeft || 0) + window.scrollX) + "px";
    m.style.width = Math.max(0, Math.ceil(v?.width || window.innerWidth || document.documentElement.clientWidth || 0)) + "px";
    m.style.height = Math.max(0, Math.ceil(v?.height || window.innerHeight || document.documentElement.clientHeight || 0)) + "px";
  }

  async function openMenu(card) {
    ensureStyles();
    ensureMarkup();

    _lastFocusedTrigger = card || null;

    const mt = getMediaType();
    STATE.quickRows = QUICK_ROWS_BY_TYPE[mt] || [];
    STATE.quickStatus = { favorites: false, completed: false, watchlist: false };
    STATE.pendingQuickKeys = new Set();
    STATE.pendingCustomListIds = new Set();
    STATE.customVersion = 0;

    if (_bridge && card) {
      if (typeof _bridge.getItemFromCard === "function") {
        STATE.currentItem = _bridge.getItemFromCard(card);
      } else {
        const attr = _bridge.itemIdAttr || "data-item-id";
        const raw = card.getAttribute(attr);
        if (raw) {
          STATE.currentItem = {
            mediaType: mt,
            itemId: raw,
            title: card.querySelector(".card-title, .card-name")?.textContent || "",
            subtitle: card.querySelector(".card-meta, .card-sub")?.textContent || "",
            image: card.getAttribute("data-list-image") || card.querySelector("img")?.getAttribute("src") || ""
          };
        }
      }
    }

    const item = STATE.currentItem;
    if (!item || !item.itemId) return;

    const titleEl = document.getElementById("menuModalTitle");
    if (titleEl) titleEl.textContent = item.title || "Add to List";

    renderQuickLists();
    renderCustomLists();

    const m = document.getElementById("itemMenuModal");
    if (m) {
      m.classList.add("active");
      m.setAttribute("aria-hidden", "false");
      positionModal(card);
    }
    document.body.style.overflow = "hidden";

    // Load data async
    await loadAllData();
  }

  // ====================================================================
  // Bridge / Init
  // ====================================================================

  window.ListKit = {
    STATE,
    QUICK_ROWS_BY_TYPE,
    setBridge: (b) => { _bridge = b; },
    getBridge: () => _bridge,
    getMediaType,
    openItemMenuFromCard: openMenu,
    closeItemMenuModal: closeMenu,
    closeAllItemMenuModals: closeMenu,
    ensureStyles,
    ensureMarkup,
    renderQuickLists,
    renderCustomLists
  };

  // ====================================================================
  // Adapter
  // ====================================================================

  function init(config) {
    if (window.ListKit) {
      window.ListKit.setBridge(config);
      window.ListKit.ensureStyles();
      window.ListKit.ensureMarkup();
    }
  }

  function bindListeners() {
    document.getElementById("closeMenuModalBtn")?.addEventListener("click", () => window.ListKit?.closeItemMenuModal());
    const modal = document.getElementById("itemMenuModal");
    if (modal) {
      modal.addEventListener("click", (e) => { if (e.target === modal) window.ListKit?.closeItemMenuModal(); });
    }
  }

  document.addEventListener("DOMContentLoaded", bindListeners);

  window.initIndexStyleListMenu = init;
  window.openIndexStyleListMenu = (card) => { if (window.ListKit) window.ListKit.openItemMenuFromCard(card); };
  window.openItemMenuFromCard = (card) => { if (window.ListKit) window.ListKit.openItemMenuFromCard(card); };
})();
