(function () {
  const API_BASE = "/api/lists";

  const CATEGORY_CONFIG = {
    movie: { icon: "fas fa-film", source: "tmdb" },
    tv: { icon: "fas fa-tv", source: "tmdb" },
    anime: { icon: "fas fa-dragon", source: "tmdb" },
    game: { icon: "fas fa-gamepad", source: "igdb" },
    book: { icon: "fas fa-book", source: "openlibrary" },
    music: { icon: "fas fa-music", source: "spotify" },
    travel: { icon: "fas fa-earth-americas", source: "local_db" },
    sport: { icon: "fas fa-futbol", source: "sportsdb" },
    fashion: { icon: "fas fa-shirt", source: "local_db" },
    food: { icon: "fas fa-burger", source: "local_db" },
    car: { icon: "fas fa-car", source: "local_db" }
  };

  const DEFAULT_LIST_NAMES = {
    movie: { completed: "Watched", watchlist: "Watchlist" },
    tv: { completed: "Watched", watchlist: "Watchlist" },
    anime: { completed: "Watched", watchlist: "Watchlist" },
    game: { completed: "Played", watchlist: "Backlog" },
    book: { completed: "Read", watchlist: "Reading List" },
    music: { completed: "Listened", watchlist: "Listen Later" },
    travel: { completed: "Visited", watchlist: "Bucket List" },
    sport: { completed: "Watched", watchlist: "Watchlist" },
    fashion: { completed: "Owned", watchlist: "Wishlist" },
    food: { completed: "Tried", watchlist: "Want to Try" },
    car: { completed: "Owned", watchlist: "Wishlist" }
  };

  const DEFAULT_LIST_ICONS = {
    completed: {
      movie: "fas fa-eye", tv: "fas fa-eye", anime: "fas fa-eye",
      game: "fas fa-check", book: "fas fa-check", music: "fas fa-headphones",
      travel: "fas fa-check", sport: "fas fa-eye",
      fashion: "fas fa-check", food: "fas fa-utensils", car: "fas fa-check"
    },
    watchlist: {
      movie: "fas fa-bookmark", tv: "fas fa-bookmark", anime: "fas fa-bookmark",
      game: "fas fa-clock", book: "fas fa-book-open", music: "fas fa-clock",
      travel: "fas fa-map-marker-alt", sport: "fas fa-bookmark",
      fashion: "fas fa-cart-plus", food: "fas fa-utensils", car: "fas fa-cart-plus"
    }
  };

  function normalizeCategory(c) {
    const n = String(c || "").toLowerCase().trim();
    return n === "sports" ? "sport" : n;
  }

  function getConfig(category) {
    return CATEGORY_CONFIG[normalizeCategory(category)] || null;
  }

  function getExternalSource(category) {
    const cfg = getConfig(category);
    return cfg ? cfg.source : "local_db";
  }

  function getDefaultListName(category, listType) {
    if (listType === "favorites") return "Favorites";
    const names = DEFAULT_LIST_NAMES[normalizeCategory(category)];
    return names ? names[listType] || "Watchlist" : "Watchlist";
  }

  function getDefaultListIcon(category, listType) {
    if (listType === "favorites") return "fas fa-heart";
    const icons = DEFAULT_LIST_ICONS[listType];
    if (icons) return icons[normalizeCategory(category)] || "fas fa-bookmark";
    return "fas fa-list";
  }

  function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    try {
      let token = null;
      if (typeof window.__ZO2Y_GET_TOKEN === "function") {
        token = window.__ZO2Y_GET_TOKEN();
      }
      if (!token && typeof window.supabaseAuthGetSession === "function") {
        token = window.supabaseAuthGetSession();
      }
      if (!token && typeof localStorage !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key));
              if (parsed?.access_token) { token = parsed.access_token; break; }
            } catch (e) {}
          }
        }
      }
      if (token) headers["Authorization"] = "Bearer " + token;
    } catch (e) {}
    return headers;
  }

  async function authFetch(url, options = {}) {
    const headers = { ...getAuthHeaders(), ...options.headers };
    return fetch(url, { ...options, headers });
  }

  // Normalize item IDs for different media types
  function normalizeItemId(category, itemId) {
    const key = normalizeCategory(category);
    if (key === "movie" || key === "tv" || key === "anime" || key === "game") {
      const num = Number(itemId);
      return Number.isFinite(num) ? String(num) : String(itemId || "");
    }
    return String(itemId || "");
  }

  // ====================================================================
  // GET /api/lists?category=X
  // Returns all lists (default + custom) for user in a category
  // ====================================================================

  async function getLists(category) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      if (data.success) return data.lists || [];
      return [];
    } catch (e) {
      console.error("getLists error:", e);
      return [];
    }
  }

  // ====================================================================
  // GET /api/lists?category=X&type=favorites (or completed, watchlist)
  // Returns specific default list
  // ====================================================================

  async function getDefaultList(category, listType) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      if (!data.success) return null;
      const lists = data.lists || [];
      return lists.find(l => l.type === listType) || null;
    } catch (e) {
      return null;
    }
  }

  // ====================================================================
  // POST /api/lists/toggle
  // Toggle item in default list
  // ====================================================================

  async function toggleDefaultItem(category, listType, externalId, metadata) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}/toggle`, {
        method: "POST",
        body: JSON.stringify({
          category: cat,
          type: listType,
          external_id: normalizeItemId(cat, externalId),
          external_source: getExternalSource(cat),
          metadata: metadata || {}
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // GET /api/lists/status?category=X&external_id=Y
  // Get item's list membership status
  // ====================================================================

  async function getItemStatus(category, externalId) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(
        `${API_BASE}/status?category=${encodeURIComponent(cat)}&external_id=${encodeURIComponent(normalizeItemId(cat, externalId))}`
      );
      const data = await res.json();
      if (data.success) return data;
      return { success: false, status: {}, custom_lists: [] };
    } catch (e) {
      return { success: false, status: {}, custom_lists: [] };
    }
  }

  // ====================================================================
  // POST /api/lists
  // Create a custom list
  // ====================================================================

  async function createCustomList(category, name, icon) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}`, {
        method: "POST",
        body: JSON.stringify({
          category: cat,
          name: name.trim(),
          icon: icon || "fas fa-list",
          description: ""
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // PUT /api/lists/:id
  // Update a custom list
  // ====================================================================

  async function updateCustomList(listId, updates) {
    try {
      const res = await authFetch(`${API_BASE}/${listId}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // DELETE /api/lists/:id
  // Delete a custom list
  // ====================================================================

  async function deleteCustomList(listId) {
    try {
      const res = await authFetch(`${API_BASE}/${listId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // POST /api/lists/:id/items
  // Add item to a custom list
  // ====================================================================

  async function addItemToCustomList(listId, category, externalId, metadata) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}/${listId}/items`, {
        method: "POST",
        body: JSON.stringify({
          external_id: normalizeItemId(cat, externalId),
          external_source: getExternalSource(cat),
          metadata: metadata || {}
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // DELETE /api/lists/:id/items/:externalId
  // Remove item from a custom list
  // ====================================================================

  async function removeItemFromCustomList(listId, category, externalId) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(
        `${API_BASE}/${listId}/items/${encodeURIComponent(normalizeItemId(cat, externalId))}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // POST /api/lists/defaults
  // Ensure default lists exist for a category
  // ====================================================================

  async function ensureDefaults(category) {
    const cat = normalizeCategory(category);
    try {
      const res = await authFetch(`${API_BASE}/defaults`, {
        method: "POST",
        body: JSON.stringify({ category: cat })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ====================================================================
  // Ensure a single default list exists
  // ====================================================================

  async function ensureDefaultList(category, listType) {
    const cat = normalizeCategory(category);
    const lists = await getLists(cat);
    const existing = lists.find(l => l.type === listType);
    if (existing) return existing;

    // Create defaults for this category first
    await ensureDefaults(cat);
    const lists2 = await getLists(cat);
    return lists2.find(l => l.type === listType) || null;
  }

  // ====================================================================
  // Sync an item to multiple custom lists (toggle-style)
  // ====================================================================

  async function syncCustomLists(category, externalId, selectedListIds, metadata) {
    const cat = normalizeCategory(category);
    const allLists = await getLists(cat);
    const customLists = allLists.filter(l => l.type === "custom");
    const normalizedId = normalizeItemId(cat, externalId);
    const selected = new Set(selectedListIds || []);

    for (const list of customLists) {
      const isSelected = selected.has(list.id);
      if (isSelected) {
        await addItemToCustomList(list.id, cat, normalizedId, metadata);
      } else {
        await removeItemFromCustomList(list.id, cat, normalizedId);
      }
    }
  }

  // ====================================================================
  // Get items in a list
  // ====================================================================

  async function getListItems(listId) {
    try {
      const res = await authFetch(`${API_BASE}/${listId}/items`);
      const data = await res.json();
      if (data.success) return data.items || [];
      return [];
    } catch (e) {
      return [];
    }
  }

  // ====================================================================
  // PUBLIC API
  // ====================================================================

  window.ListUtils = {
    getConfig,
    getExternalSource,
    getDefaultListName,
    getDefaultListIcon,
    normalizeItemId,
    getAuthHeaders,

    getLists,
    getDefaultList,
    toggleDefaultItem,
    getItemStatus,
    createCustomList,
    updateCustomList,
    deleteCustomList,
    addItemToCustomList,
    removeItemFromCustomList,
    ensureDefaults,
    ensureDefaultList,
    syncCustomLists,
    getListItems
  };
})();
