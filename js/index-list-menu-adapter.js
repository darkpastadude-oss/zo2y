(function () {
  const STYLE_ID = 'zo2yIndexListMenuStyle';
  const STATE = {
    currentCard: null,
    currentItem: null,
    quickRows: [],
    quickStatus: {},
    pendingQuickKeys: new Set(),
    quickMutationVersions: {},
    customLists: [],
    selectedCustomLists: new Set(),
    pendingCustomListIds: new Set(),
    customMutationVersion: 0
  };
  const CACHE = {
    quickStatusByItem: new Map(),
    customListsByScope: new Map(),
    customMembershipByItem: new Map(),
    primingScopes: new Set()
  };
  const DOM = {
    quickContainer: null,
    quickNodesByKey: new Map()
  };

  let bridge = null;
  let listenersBound = false;
  let authClient = null;
  let authClientPromise = null;
  let cachedUser = null;
  let lastFocusedTrigger = null;

  const QUICK_ROWS_BY_TYPE = {
    movie: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    tv: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    anime: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    game: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Played', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Backlog', icon: 'fas fa-bookmark' }
    ],
    book: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'read', label: 'Read', icon: 'fas fa-eye' },
      { key: 'readlist', label: 'Readlist', icon: 'fas fa-bookmark' }
    ],
    music: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'listened', label: 'Listened', icon: 'fas fa-eye' },
      { key: 'listenlist', label: 'Listenlist', icon: 'fas fa-bookmark' }
    ],
    travel: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'visited', label: 'Visited', icon: 'fas fa-check' },
      { key: 'bucketlist', label: 'Bucket List', icon: 'fas fa-bookmark' }
    ],
    fashion: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
      { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
    ],
    food: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'tried', label: 'Tried', icon: 'fas fa-check' },
      { key: 'want_to_try', label: 'Want to Try', icon: 'fas fa-bookmark' }
    ],
    car: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
      { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
    ],
    sports: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' }
    ]
  };

  const DEFAULT_TABLE_BY_MEDIA = {
    movie: { table: 'movie_list_items', itemField: 'movie_id' },
    tv: { table: 'tv_list_items', itemField: 'tv_id' },
    anime: { table: 'anime_list_items', itemField: 'anime_id' },
    game: { table: 'game_list_items', itemField: 'game_id' },
    book: { table: 'book_list_items', itemField: 'book_id' },
    music: { table: 'music_list_items', itemField: 'track_id' },
    travel: { table: 'travel_list_items', itemField: 'country_code' },
    fashion: { table: 'fashion_list_items', itemField: 'brand_id' },
    food: { table: 'food_list_items', itemField: 'brand_id' },
    car: { table: 'car_list_items', itemField: 'brand_id' }
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .menu-modal {
        display: none;
        position: absolute;
        z-index: 10000;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(5px);
        padding: 0;
        align-items: center;
        justify-content: center;
      }
      .menu-modal.active { display: flex; }
      .menu-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card, #132347);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 20px;
        width: 100%;
        max-width: 380px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 12px 34px rgba(0,0,0,0.28);
      }
      @keyframes menuModalFlyUp {
        from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) scale(0.98); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      .menu-modal-content.menu-modal-fly-up {
        animation: menuModalFlyUp 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .menu-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.12));
      }
      .menu-modal-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--white, #fff);
        margin: 0;
      }
      .menu-modal-close {
        background: transparent;
        border: none;
        color: var(--muted, #8ca3c7);
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      .menu-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--white, #fff);
      }
      .menu-modal-body { padding: 16px 20px; }
      .menu-quick-lists {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
      }
      .menu-quick-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 16px;
        background: var(--card-2, #172b58);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 12px;
        color: var(--text, #fff);
        cursor: pointer;
        font: inherit;
        text-align: left;
        appearance: none;
        -webkit-appearance: none;
        min-height: 48px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        position: relative;
        overflow: hidden;
        transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        will-change: transform;
      }
      .menu-quick-item::after {
        content: "";
        position: absolute;
        inset: -35%;
        pointer-events: none;
        opacity: 0;
        transform: scale(0.4);
        background:
          radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.35), rgba(245, 158, 11, 0) 55%),
          radial-gradient(circle at 70% 40%, rgba(255, 184, 77, 0.28), rgba(255, 184, 77, 0) 60%),
          radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 55%);
        filter: blur(0px);
      }
      .menu-quick-item:hover {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.1);
      }
      .menu-quick-item:active {
        transform: scale(0.985);
      }
      .menu-quick-item:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.22);
      }
      @keyframes zo2yQuickSaved {
        0% { transform: scale(0.985); box-shadow: 0 0 0 rgba(245,158,11,0); }
        45% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(245,158,11,0.18); }
        100% { transform: scale(1); box-shadow: 0 0 0 rgba(245,158,11,0); }
      }
      @keyframes zo2yQuickSparkle {
        0% { opacity: 0; transform: scale(0.35); }
        30% { opacity: 1; transform: scale(1.02); }
        100% { opacity: 0; transform: scale(1.25); }
      }
      @keyframes zo2yQuickRemoved {
        0% { transform: scale(0.99); box-shadow: 0 0 0 rgba(140,163,199,0); }
        55% { transform: scale(1.012); box-shadow: 0 0 0 6px rgba(140,163,199,0.12); }
        100% { transform: scale(1); box-shadow: 0 0 0 rgba(140,163,199,0); }
      }
      @keyframes zo2yQuickError {
        0% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
        100% { transform: translateX(0); }
      }
      @keyframes zo2yStatePop {
        0% { transform: scale(0.92); opacity: 0.75; }
        60% { transform: scale(1.06); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .menu-quick-item.zo2y-anim-saved {
        animation: zo2yQuickSaved 420ms cubic-bezier(.2,.9,.2,1);
      }
      .menu-quick-item.zo2y-anim-saved::after {
        animation: zo2yQuickSparkle 520ms cubic-bezier(.2,.9,.2,1);
      }
      .menu-quick-item.zo2y-anim-removed {
        animation: zo2yQuickRemoved 360ms cubic-bezier(.2,.9,.2,1);
      }
      .menu-quick-item.zo2y-anim-error {
        animation: zo2yQuickError 360ms ease-in-out;
      }
      .menu-quick-state.zo2y-anim-state {
        animation: zo2yStatePop 280ms cubic-bezier(.2,.9,.2,1);
      }
      .menu-quick-item.active {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.15);
      }
      .menu-quick-item[aria-busy="true"] {
        opacity: 0.72;
        pointer-events: none;
      }
      .menu-quick-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .menu-quick-left i {
        width: 20px;
        color: var(--accent, #f59e0b);
      }
      .menu-quick-left span { font-weight: 500; color: var(--white, #fff); }
      .menu-quick-state {
        color: var(--accent, #f59e0b);
        font-size: 13px;
        font-weight: 600;
        transition: transform 0.18s ease, opacity 0.18s ease;
      }
      .menu-quick-item.active .menu-quick-state {
        transform: translateY(-0.5px);
      }
      .menu-custom-section {
        border-top: 1px solid var(--border, rgba(255,255,255,0.12));
        padding-top: 16px;
      }
      .menu-custom-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        color: var(--muted, #8ca3c7);
        font-size: 14px;
      }
      .menu-create-list-btn {
        background: transparent;
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        color: var(--white, #fff);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .menu-create-list-btn:hover {
        border-color: var(--accent, #f59e0b);
        color: var(--accent, #f59e0b);
      }
      .menu-custom-lists {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;
      }
      .menu-custom-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--card-2, #172b58);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .menu-custom-item:hover { border-color: var(--accent, #f59e0b); }
      .menu-custom-item.active {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.1);
      }
      .menu-custom-item[aria-busy="true"] {
        opacity: 0.82;
      }
      .menu-custom-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .menu-custom-left i {
        width: 18px;
        color: var(--accent, #f59e0b);
        font-size: 14px;
      }
      .menu-custom-left span { font-size: 14px; color: var(--white, #fff); }
      .menu-custom-state {
        color: var(--accent, #f59e0b);
        font-size: 12px;
        font-weight: 600;
      }
      .menu-input {
        width: 100%;
        padding: 12px 16px;
        background: var(--card-2, #172b58);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 12px;
        color: var(--white, #fff);
        font-size: 14px;
        margin-bottom: 16px;
      }
      .menu-input:focus {
        outline: none;
        border-color: var(--accent, #f59e0b);
      }
      .menu-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .menu-modal-actions .menu-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        transition: all 0.2s ease;
      }
      .menu-modal-actions .menu-btn-primary {
        background: var(--gradient, linear-gradient(135deg, #f59e0b, #ffb84d));
        color: #0b1633;
        border: none;
      }
      .menu-modal-actions .menu-btn-primary:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
      .menu-modal-actions .menu-btn-secondary {
        background: transparent;
        color: var(--white, #fff);
      }
      .menu-modal-actions .menu-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .menu-empty {
        text-align: center;
        padding: 20px;
        color: var(--muted, #8ca3c7);
        font-size: 14px;
        background: var(--card-2, #172b58);
        border-radius: 12px;
        border: 1px dashed var(--border, rgba(255,255,255,0.12));
      }
      @media (max-width: 768px) {
        .menu-modal {
          align-items: center;
          justify-content: center;
          background: rgba(3, 10, 28, 0.8);
          backdrop-filter: blur(8px);
        }
        .menu-modal-content {
          position: absolute;
          top: 50%;
          left: 50%;
          width: calc(100vw - 14px);
          max-width: 100vw;
          max-height: min(80dvh, 740px);
          border-radius: 18px;
          transform: translate(-50%, -50%);
        }
        .menu-modal-header {
          padding: 14px 16px;
        }
        .menu-modal-header h3 {
          font-size: 17px;
        }
        .menu-modal-close {
          width: 40px;
          height: 40px;
          font-size: 26px;
        }
        .menu-modal-body {
          padding: 12px 14px 16px;
        }
        .menu-quick-lists,
        .menu-custom-lists {
          gap: 10px;
        }
        .menu-custom-lists {
          max-height: min(38dvh, 340px);
        }
        .menu-quick-item,
        .menu-custom-item {
          min-height: 48px;
          padding: 12px 14px;
          border-radius: 13px;
        }
        .menu-quick-left span,
        .menu-custom-left span {
          font-size: 15px;
        }
        .menu-create-list-btn {
          min-height: 40px;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 999px;
        }
        .menu-input {
          min-height: 46px;
          font-size: 15px;
          padding: 12px 14px;
        }
        .menu-modal-actions {
          position: sticky;
          bottom: 0;
          background: linear-gradient(180deg, rgba(19,35,71,0.92), rgba(19,35,71,1));
          margin: 12px -14px -16px;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--border, rgba(255,255,255,0.12));
          flex-direction: column-reverse;
          gap: 8px;
        }
        .menu-modal-actions .menu-btn {
          width: 100%;
          min-height: 44px;
          font-size: 15px;
          border-radius: 12px;
        }
      }
      @media (pointer: coarse) {
        .menu-quick-item,
        .menu-custom-item {
          min-height: 56px;
        }
        .menu-modal-close {
          width: 44px;
          height: 44px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .menu-quick-item,
        .menu-custom-item {
          transition: none !important;
          animation: none !important;
        }
        .menu-quick-state,
        .menu-custom-state {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMarkup() {
    let itemModal = document.getElementById('itemMenuModal');
    if (!itemModal) {
      itemModal = document.createElement('div');
      itemModal.id = 'itemMenuModal';
      itemModal.className = 'menu-modal';
      itemModal.setAttribute('aria-hidden', 'true');
      itemModal.innerHTML = `
        <div class="menu-modal-content">
          <div class="menu-modal-header">
            <h3 id="menuModalTitle">Add to List</h3>
            <button class="menu-modal-close" id="closeMenuModalBtn" aria-label="Close">&times;</button>
          </div>
          <div class="menu-modal-body" id="menuModalBody">
            <div class="menu-quick-lists" id="menuQuickLists"></div>
            <div class="menu-custom-section">
              <div class="menu-custom-header">
                <span>Your Custom Lists</span>
                <button class="menu-create-list-btn" id="menuCreateListBtn">
                  <i class="fas fa-plus"></i> New
                </button>
              </div>
              <div class="menu-custom-lists" id="menuCustomLists"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(itemModal);
    }

    let createModal = document.getElementById('createListModal');
    if (!createModal) {
      createModal = document.createElement('div');
      createModal.id = 'createListModal';
      createModal.className = 'menu-modal';
      createModal.setAttribute('aria-hidden', 'true');
      createModal.innerHTML = `
        <div class="menu-modal-content">
          <div class="menu-modal-header">
            <h3>Create New List</h3>
            <button class="menu-modal-close" id="closeCreateModalBtn" aria-label="Close">&times;</button>
          </div>
          <div class="menu-modal-body">
            <input type="text" id="newListNameInput" class="menu-input" placeholder="List name..." maxlength="50">
            <div class="menu-modal-actions">
              <button class="menu-btn menu-btn-secondary" id="cancelCreateBtn">Cancel</button>
              <button class="menu-btn menu-btn-primary" id="saveNewListBtn">Create List</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(createModal);
    }
  }

  function getMediaType() {
    return String(bridge?.mediaType || '').toLowerCase();
  }

  function customListsEnabled() {
    const mediaType = getMediaType();
    if (!mediaType) return false;
    if (!window.ListUtils || typeof ListUtils.getListConfig !== 'function') return true;
    const cfg = ListUtils.getListConfig(mediaType);
    if (!cfg) return false;
    if (cfg.disableCustomLists) return false;
    if (!cfg.listTable || !cfg.itemsTable) return false;
    return true;
  }

  function getQuickRowsForMenu() {
    return QUICK_ROWS_BY_TYPE[getMediaType()] || [];
  }

  function normalizeItemIdValue(itemId) {
    const mediaType = getMediaType();
    if (window.ListUtils) return ListUtils.coerceItemId(mediaType, itemId);
    return itemId;
  }

  function normalizeQueryableItemIdValue(itemId) {
    const mediaType = getMediaType();
    if (window.ListUtils && typeof ListUtils.normalizeQueryableItemId === 'function') {
      return ListUtils.normalizeQueryableItemId(mediaType, itemId);
    }
    if (mediaType === 'movie' || mediaType === 'tv' || mediaType === 'game') {
      const numericId = Number(itemId);
      return Number.isFinite(numericId) ? numericId : null;
    }
    const text = String(itemId || '').trim();
    return text || null;
  }

  function normalizeItemIdKey(itemId) {
    return String(normalizeItemIdValue(itemId));
  }

  function getScopeKey() {
    const userId = String(getCurrentUser()?.id || '').trim();
    const mediaType = getMediaType();
    if (!userId || !mediaType) return '';
    return `${userId}:${mediaType}`;
  }

  function getScopeItemKey(itemId) {
    const scopeKey = getScopeKey();
    if (!scopeKey) return '';
    return `${scopeKey}:${normalizeItemIdKey(itemId)}`;
  }

  function buildBlankQuickStatus(listKeys) {
    const status = {};
    (listKeys || []).forEach((key) => {
      status[key] = false;
    });
    return status;
  }

  function cloneQuickStatus(status, listKeys) {
    const cloned = buildBlankQuickStatus(listKeys);
    if (!status || typeof status !== 'object') return cloned;
    Object.keys(cloned).forEach((key) => {
      cloned[key] = !!status[key];
    });
    return cloned;
  }

  function readBridgeQuickStatus(itemId, listKeys) {
    if (!bridge || typeof bridge.getQuickStatusForItem !== 'function') return null;
    try {
      const raw = bridge.getQuickStatusForItem(normalizeItemIdValue(itemId), listKeys);
      if (!raw || typeof raw !== 'object') return null;
      return cloneQuickStatus(raw, listKeys);
    } catch (_err) {
      return null;
    }
  }

  function readCachedQuickStatus(itemId, listKeys) {
    const fromBridge = readBridgeQuickStatus(itemId, listKeys);
    if (fromBridge) return fromBridge;
    const cacheKey = getScopeItemKey(itemId);
    if (!cacheKey || !CACHE.quickStatusByItem.has(cacheKey)) {
      return buildBlankQuickStatus(listKeys);
    }
    return cloneQuickStatus(CACHE.quickStatusByItem.get(cacheKey), listKeys);
  }

  function writeCachedQuickStatus(itemId, status, listKeys) {
    const cacheKey = getScopeItemKey(itemId);
    if (!cacheKey) return;
    CACHE.quickStatusByItem.set(cacheKey, cloneQuickStatus(status, listKeys));
  }

  function readCachedCustomLists() {
    const scopeKey = getScopeKey();
    if (!scopeKey || !CACHE.customListsByScope.has(scopeKey)) return [];
    const rows = CACHE.customListsByScope.get(scopeKey);
    return Array.isArray(rows) ? [...rows] : [];
  }

  function writeCachedCustomLists(lists) {
    const scopeKey = getScopeKey();
    if (!scopeKey) return;
    CACHE.customListsByScope.set(scopeKey, Array.isArray(lists) ? [...lists] : []);
  }

  function readCachedMembership(itemId) {
    const cacheKey = getScopeItemKey(itemId);
    if (!cacheKey || !CACHE.customMembershipByItem.has(cacheKey)) return new Set();
    const rows = CACHE.customMembershipByItem.get(cacheKey);
    return new Set(Array.isArray(rows) ? rows : []);
  }

  function writeCachedMembership(itemId, membership) {
    const cacheKey = getScopeItemKey(itemId);
    if (!cacheKey) return;
    const listIds = Array.from(membership || []).filter(Boolean);
    CACHE.customMembershipByItem.set(cacheKey, listIds);
  }

  function notify(message, isError) {
    if (bridge && typeof bridge.notify === 'function') {
      bridge.notify(message, !!isError);
      return;
    }
    if (typeof console !== 'undefined') {
      if (isError) console.error(message);
      else console.log(message);
    }
  }

  function getBridgeDeclaredCurrentUser() {
    if (!bridge || typeof bridge.getCurrentUser !== 'function') return null;
    try {
      const user = bridge.getCurrentUser();
      if (user?.id) return user;
    } catch (_error) {}
    return null;
  }

  function syncBridgeCurrentUser(user) {
    const nextUser = user?.id ? user : null;
    cachedUser = nextUser;
    if (!bridge) return nextUser;
    try {
      bridge.__zo2yResolvedUser = nextUser;
    } catch (_error) {}
    if (typeof bridge.setCurrentUser === 'function') {
      try {
        bridge.setCurrentUser(nextUser);
      } catch (_error) {}
    }
    return nextUser;
  }

  function bridgeCanUseResolvedUser() {
    return !!(getBridgeDeclaredCurrentUser()?.id || typeof bridge?.setCurrentUser === 'function');
  }

  function getCurrentUser() {
    const bridgeUser = getBridgeDeclaredCurrentUser();
    if (bridgeUser?.id) return bridgeUser;
    const syncedUser = bridge?.__zo2yResolvedUser;
    if (syncedUser?.id) return syncedUser;
    return cachedUser;
  }

  async function ensureClient() {
    try {
      if (bridge && typeof bridge.ensureClient === 'function') {
        const client = await bridge.ensureClient();
        if (client?.auth) {
          if (client.__zo2yAuthListenersBound) return client;
          if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT !== 'function' && !(window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.ensureClient === 'function')) {
            return client;
          }
        }
      }
    } catch (_error) {}

    if (authClient?.auth) return authClient;
    if (authClientPromise) return authClientPromise;

    authClientPromise = (async () => {
      try {
        const runtime = window.ZO2Y_AUTH || null;
        if (runtime && typeof runtime.waitForSupabase === 'function') {
          await runtime.waitForSupabase(8000);
        } else {
          const startedAt = Date.now();
          while (!window.supabase && (Date.now() - startedAt) < 8000) {
            await new Promise((resolve) => window.setTimeout(resolve, 40));
          }
        }
      } catch (_error) {}

      try {
        if (typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT === 'function') {
          const client = window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
          if (client?.auth) return client;
        }
      } catch (_error) {}

      try {
        const runtime = window.ZO2Y_AUTH || null;
        if (runtime && typeof runtime.ensureClient === 'function') {
          const client = runtime.ensureClient();
          if (client?.auth) return client;
        }
      } catch (_error) {}

      return null;
    })();

    authClient = await authClientPromise;
    authClientPromise = null;
    
    // On mobile, ensure the client has time to restore session before returning
    if (authClient?.auth) {
      try {
        // Trigger session restoration if available
        if (typeof window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE === 'function') {
          window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE();
        }
        if (typeof window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT === 'function') {
          await window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT(authClient);
          // Give token refresh time to complete
          await new Promise((resolve) => window.setTimeout(resolve, 80));
        }
      } catch (_error) {}
    }
    
    return authClient;
  }

  function redirectToLogin() {
    try {
      const next = `${window.location.pathname || ''}${window.location.search || ''}${window.location.hash || ''}` || 'index.html';
      localStorage.setItem('postAuthRedirect', next);
    } catch (_error) {}
    window.location.href = 'login.html';
  }

  function isConflictLikeError(error) {
    const status = Number(error?.status || error?.statusCode || error?.code || 0);
    const message = String(error?.message || error?.details || '').toLowerCase();
    return status === 409
      || message.includes('duplicate')
      || message.includes('already exists')
      || message.includes('unique')
      || message.includes('conflict');
  }

  function authBootstrapReady() {
    try {
      if (window.__AUTH_READY === true) return true;
      if (window.__ZO2Y_AUTH_STATE === true || window.__ZO2Y_AUTH_STATE === false) return true;
    } catch (_error) {}
    return false;
  }

  async function waitForAuthBootstrap(timeoutMs = 1200) {
    if (authBootstrapReady()) return true;
    const waitMs = Math.max(50, Number(timeoutMs) || 1200);
    return await new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        try {
          window.removeEventListener('zo2y-auth-ready', onReady);
        } catch (_error) {}
        resolve(!!value);
      };
      const onReady = () => done(true);
      try {
        window.addEventListener('zo2y-auth-ready', onReady, { once: true });
      } catch (_error) {}
      window.setTimeout(() => done(false), waitMs);
    });
  }

  async function attemptSessionRecovery(client) {
    if (!client?.auth) return;
    try {
      if (typeof window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE === 'function') {
        window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE();
      }
    } catch (_error) {}
    try {
      if (typeof window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT === 'function') {
        await window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT(client);
      }
    } catch (_error) {}
    
    // Give Supabase time to restore the session from storage and refresh token
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  async function resolveAuthenticatedUser() {
    const existingUser = getCurrentUser();
    if (existingUser?.id) {
      syncBridgeCurrentUser(existingUser);
      return existingUser;
    }
    const client = await ensureClient();
    if (!client?.auth) return null;

    const authRuntime = window.ZO2Y_AUTH || null;

    const tryResolve = async () => {
      if (authRuntime && typeof authRuntime.getVerifiedUser === 'function') {
        try {
          const verifiedUser = await authRuntime.getVerifiedUser(client);
          if (verifiedUser?.id) return verifiedUser;
        } catch (_error) {}
      }
      try {
        const sessionResult = await client.auth.getSession();
        const sessionUser = sessionResult?.data?.session?.user || null;
        if (sessionUser?.id) return sessionUser;
      } catch (_error) {}
      try {
        const userResult = typeof client.auth.getUser === 'function'
          ? await client.auth.getUser()
          : null;
        const user = userResult?.data?.user || null;
        if (user?.id) return user;
      } catch (_error) {}
      return null;
    };

    let resolved = await tryResolve();
    if (resolved?.id) {
      syncBridgeCurrentUser(resolved);
      return resolved;
    }

    // Mobile users can open the menu before bootstrap-auth finishes; try a light recovery before redirecting.
    if (!authBootstrapReady()) {
      await waitForAuthBootstrap(1200);
    }
    await attemptSessionRecovery(client);
    resolved = await tryResolve();
    if (resolved?.id) {
      syncBridgeCurrentUser(resolved);
      return resolved;
    }
    return null;
  }

  async function toggleDefaultListWithFallback(user, item, listType, nextSaved) {
    if (!user?.id || !item?.itemId) return { ok: false, saved: false };
    const mediaType = getMediaType();
    const table = DEFAULT_TABLE_BY_MEDIA[mediaType];
    syncBridgeCurrentUser(user);

    try {
      if (
        bridge &&
        typeof bridge.toggleDefaultList === 'function' &&
        (!table?.table || !table?.itemField || bridgeCanUseResolvedUser())
      ) {
        const result = await bridge.toggleDefaultList({
          itemId: item.itemId,
          listType,
          card: STATE.currentCard,
          nextSaved,
          user
        });
        if (result && typeof result.ok === 'boolean') {
          if (result.ok) return result;
          if (isConflictLikeError(result?.error)) {
            return { ok: true, saved: !!nextSaved };
          }
          return result;
        }
      }
    } catch (_error) {}

    if (!table?.table || !table?.itemField) return { ok: false, saved: false };

    const client = await ensureClient();
    if (!client) return { ok: false, saved: false };

    const payload = { user_id: user.id, list_type: listType };
    payload[table.itemField] = item.itemId;

    if (nextSaved) {
      const { error } = await client.from(table.table).insert(payload);
      if (error) {
        const message = String(error.message || '').toLowerCase();
        if (
          message.includes('duplicate') ||
          message.includes('already exists') ||
          message.includes('unique')
        ) {
          return { ok: true, saved: true };
        }
        return { ok: false, saved: false, error };
      }
      return { ok: true, saved: true };
    }

    const { error } = await client
      .from(table.table)
      .delete()
      .eq('user_id', user.id)
      .eq(table.itemField, item.itemId)
      .eq('list_type', listType);

    if (error) return { ok: false, saved: true, error };
    return { ok: true, saved: false };
  }

  function maybeVibrate(durationMs) {
    try {
      if (!durationMs) return;
      if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) return;
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(Math.max(1, Number(durationMs) || 0));
      }
    } catch (_error) {}
  }

  function animateQuickNode(key, kind) {
    const node = DOM.quickNodesByKey.get(String(key || '').trim());
    if (!node) return;
    const stateNode = node.querySelector('.menu-quick-state');
    node.classList.remove('zo2y-anim-saved', 'zo2y-anim-removed', 'zo2y-anim-error');
    if (stateNode) stateNode.classList.remove('zo2y-anim-state');
    void node.offsetWidth;
    const className = kind === 'saved'
      ? 'zo2y-anim-saved'
      : (kind === 'removed' ? 'zo2y-anim-removed' : 'zo2y-anim-error');
    node.classList.add(className);
    if (stateNode) {
      void stateNode.offsetWidth;
      stateNode.classList.add('zo2y-anim-state');
    }
    if (kind === 'saved') maybeVibrate(12);
    else if (kind === 'removed') maybeVibrate(8);
    else maybeVibrate(18);
  }

  function getCardItem(card) {
    if (!card) return null;
    if (bridge && typeof bridge.getItemFromCard === 'function') {
      return bridge.getItemFromCard(card);
    }
    const mediaType = getMediaType();
    const idAttr = bridge?.itemIdAttr || 'data-item-id';
    const rawId = card.getAttribute(idAttr);
    if (!rawId) return null;
    const coercedId = normalizeQueryableItemIdValue(rawId);
    if (coercedId === null || coercedId === undefined || String(coercedId).trim() === '') return null;
    const title = card.querySelector('.card-title, .card-name')?.textContent || '';
    const subtitle = card.querySelector('.card-meta, .card-sub')?.textContent || '';
    const listImage = card.getAttribute('data-list-image') || '';
    const image = listImage || card.querySelector('img')?.getAttribute('src') || '';
    return {
      mediaType,
      itemId: coercedId,
      title: String(title).trim(),
      subtitle: String(subtitle).trim(),
      image: String(image).trim()
    };
  }

  function buildCustomListPayload() {
    const item = STATE.currentItem;
    if (!item) return null;
    const mediaType = getMediaType();
    if (mediaType === 'book') {
      return {
        id: item.itemId,
        title: item.title || '',
        authors: item.subtitle || '',
        thumbnail: item.image || ''
      };
    }
    if (mediaType === 'music') {
      return {
        id: item.itemId,
        name: item.title || '',
        artists: item.subtitle || '',
        image: item.image || ''
      };
    }
    return null;
  }

  async function getDefaultListStatusMap(itemId, listKeys) {
    const status = {};
    (listKeys || []).forEach((key) => {
      status[key] = false;
    });
    const user = await resolveAuthenticatedUser();
    if (!user?.id || !listKeys?.length) return status;
    const client = await ensureClient();
    if (!client) return status;

    const mediaType = getMediaType();
    const tableCfg = DEFAULT_TABLE_BY_MEDIA[mediaType];
    const bridgeStatus = readBridgeQuickStatus(itemId, listKeys);
    if (bridgeStatus) return bridgeStatus;
    if (bridge && typeof bridge.getDefaultListStatusMap === 'function') {
      try {
        const customStatus = await bridge.getDefaultListStatusMap(normalizeItemIdValue(itemId), listKeys);
        if (customStatus && typeof customStatus === 'object') {
          return cloneQuickStatus(customStatus, listKeys);
        }
      } catch (_err) {}
    }
    if (!tableCfg) return status;

    try {
      const normalizedItemId = normalizeQueryableItemIdValue(itemId);
      if (normalizedItemId === null || normalizedItemId === undefined) return status;
      const { data } = await client
        .from(tableCfg.table)
        .select('list_type')
        .eq('user_id', user.id)
        .eq(tableCfg.itemField, normalizedItemId)
        .in('list_type', listKeys);
      (data || []).forEach((row) => {
        const key = String(row.list_type || '');
        if (key in status) status[key] = true;
      });
    } catch (_err) {}

    return status;
  }

  async function primeScopeCaches() {
    const scopeKey = getScopeKey();
    const mediaType = getMediaType();
    const user = await resolveAuthenticatedUser();
    if (!scopeKey || !mediaType || !user?.id) return;
    if (CACHE.primingScopes.has(scopeKey)) return;
    CACHE.primingScopes.add(scopeKey);

    try {
      const client = await ensureClient();
      if (!client) return;

      const quickRows = getQuickRowsForMenu();
      const listKeys = quickRows.map((row) => row.key).filter(Boolean);

      const rawVisibleIds = bridge && typeof bridge.getVisibleItemIds === 'function'
        ? bridge.getVisibleItemIds()
        : [];
      const visibleIds = [...new Set((Array.isArray(rawVisibleIds) ? rawVisibleIds : [])
        .map((id) => normalizeQueryableItemIdValue(id))
        .filter((id) => id !== null && id !== undefined && String(id ?? '').trim()))];
      const visibleItemKeySet = new Set(visibleIds.map((id) => String(id)));

      const defaultTable = DEFAULT_TABLE_BY_MEDIA[mediaType];
      if (defaultTable && listKeys.length && visibleIds.length) {
        const { data } = await client
          .from(defaultTable.table)
          .select(`${defaultTable.itemField},list_type`)
          .eq('user_id', user.id)
          .in(defaultTable.itemField, visibleIds)
          .in('list_type', listKeys);

        const statusByItem = new Map();
        visibleIds.forEach((id) => {
          statusByItem.set(String(id), buildBlankQuickStatus(listKeys));
        });
        (data || []).forEach((row) => {
          const itemKey = String(row?.[defaultTable.itemField] ?? '');
          const listType = String(row?.list_type || '');
          const current = statusByItem.get(itemKey);
          if (!current || !(listType in current)) return;
          current[listType] = true;
        });
        statusByItem.forEach((statusRow, itemKey) => {
          writeCachedQuickStatus(itemKey, statusRow, listKeys);
        });
      }

        if (!window.ListUtils || !customListsEnabled()) return;
        let customLists = readCachedCustomLists();
      if (!customLists.length) {
        customLists = await ListUtils.loadCustomLists(client, user.id, mediaType);
        writeCachedCustomLists(customLists);
      }

      const cfg = ListUtils.getListConfig(mediaType);
      const listIds = customLists.map((list) => list.id).filter(Boolean);
      if (!cfg || !listIds.length || !visibleIds.length) return;

      let query = client
        .from(cfg.itemsTable)
        .select(`list_id,${cfg.itemIdField}`)
        .in('list_id', listIds)
        .in(cfg.itemIdField, visibleIds);
      const { data } = await query;

      const membershipByItem = new Map();
      visibleIds.forEach((id) => {
        membershipByItem.set(String(id), new Set());
      });

      (data || []).forEach((row) => {
        const itemKey = String(row?.[cfg.itemIdField] ?? '');
        if (!visibleItemKeySet.has(itemKey)) return;
        if (!membershipByItem.has(itemKey)) membershipByItem.set(itemKey, new Set());
        membershipByItem.get(itemKey).add(row.list_id);
      });

      membershipByItem.forEach((membership, itemKey) => {
        writeCachedMembership(itemKey, membership);
      });
    } catch (_err) {
      // keep UI responsive even if warm-up fails
    } finally {
      CACHE.primingScopes.delete(scopeKey);
    }
  }

  function syncMenuModalViewport(modal) {
    if (!modal || !modal.classList.contains('active')) return;
    const visual = window.visualViewport;
    const top = (visual?.offsetTop || 0) + window.scrollY;
    const left = (visual?.offsetLeft || 0) + window.scrollX;
    const width = Math.max(0, Math.ceil(visual?.width || window.innerWidth || document.documentElement.clientWidth || 0));
    const height = Math.max(0, Math.ceil(visual?.height || window.innerHeight || document.documentElement.clientHeight || 0));
    modal.style.top = `${top}px`;
    modal.style.left = `${left}px`;
    modal.style.width = `${width}px`;
    modal.style.height = `${height}px`;
  }

  function syncActiveMenuModalViewports() {
    syncMenuModalViewport(document.getElementById('itemMenuModal'));
    syncMenuModalViewport(document.getElementById('createListModal'));
  }

  function syncMenuModalBodyLock() {
    const itemModal = document.getElementById('itemMenuModal');
    const createModal = document.getElementById('createListModal');
    const anyActive = !!(itemModal?.classList.contains('active') || createModal?.classList.contains('active'));
    if (anyActive) {
      syncActiveMenuModalViewports();
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  function closeItemMenuModal() {
    const itemModal = document.getElementById('itemMenuModal');
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (itemModal && activeElement && itemModal.contains(activeElement)) {
      try {
        activeElement.blur();
      } catch (_error) {}
    }
    if (itemModal) {
      itemModal.classList.remove('active');
      itemModal.setAttribute('aria-hidden', 'true');
    }
    STATE.pendingQuickKeys = new Set();
    STATE.quickMutationVersions = {};
    STATE.pendingCustomListIds = new Set();
    STATE.customMutationVersion = 0;
    syncMenuModalBodyLock();
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function' && document.contains(lastFocusedTrigger)) {
      window.setTimeout(() => {
        try {
          lastFocusedTrigger.focus({ preventScroll: true });
        } catch (_error) {
          try {
            lastFocusedTrigger.focus();
          } catch (_error2) {}
        }
      }, 0);
    }
  }

  function closeCreateListModal() {
    const createModal = document.getElementById('createListModal');
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (createModal && activeElement && createModal.contains(activeElement)) {
      try {
        activeElement.blur();
      } catch (_error) {}
    }
    if (createModal) {
      createModal.classList.remove('active');
      createModal.setAttribute('aria-hidden', 'true');
    }
    syncMenuModalBodyLock();
  }

  function closeAllItemMenuModals() {
    closeItemMenuModal();
    closeCreateListModal();
  }

  function renderItemMenuQuickLists() {
    const quickContainer = document.getElementById('menuQuickLists');
    if (!quickContainer) return;
    if (!STATE.quickRows.length) {
      quickContainer.innerHTML = '<div class="menu-empty">Lists are not available for this item.</div>';
      DOM.quickContainer = quickContainer;
      DOM.quickNodesByKey.clear();
      return;
    }

    const nextKeys = STATE.quickRows.map((row) => String(row?.key || '')).filter(Boolean);
    const hasSameKeys = DOM.quickContainer === quickContainer
      && DOM.quickNodesByKey.size === nextKeys.length
      && nextKeys.every((key) => DOM.quickNodesByKey.has(key));

    if (!hasSameKeys) {
      DOM.quickContainer = quickContainer;
      DOM.quickNodesByKey.clear();

      quickContainer.innerHTML = STATE.quickRows.map((row) => `
        <button type="button" class="menu-quick-item" data-quick-key="${row.key}" aria-busy="false">
          <div class="menu-quick-left">
            <i class="${row.icon}"></i>
            <span>${escapeHtml(row.label)}</span>
          </div>
          <span class="menu-quick-state"></span>
        </button>
      `).join('');

      quickContainer.querySelectorAll('.menu-quick-item').forEach((node) => {
        const key = String(node.getAttribute('data-quick-key') || '').trim();
        if (!key) return;
        DOM.quickNodesByKey.set(key, node);

        const runToggle = async () => {
          if (STATE.pendingQuickKeys.has(key)) return;
          STATE.pendingQuickKeys.add(key);
          renderItemMenuQuickLists();
          const user = await resolveAuthenticatedUser();
          if (!user?.id) {
            STATE.pendingQuickKeys.delete(key);
            renderItemMenuQuickLists();
            redirectToLogin();
            return;
          }
          const item = STATE.currentItem;
          if (!item) {
            STATE.pendingQuickKeys.delete(key);
            renderItemMenuQuickLists();
            return;
          }
          const previousSaved = !!STATE.quickStatus[key];
          const nextSaved = !previousSaved;
          animateQuickNode(key, nextSaved ? 'saved' : 'removed');
          const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
          const nextVersion = Number(STATE.quickMutationVersions[key] || 0) + 1;
          STATE.quickMutationVersions[key] = nextVersion;
          STATE.quickStatus[key] = nextSaved;
          writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
          renderItemMenuQuickLists();

          void (async () => {
            let saveResult = null;
            try {
              saveResult = await toggleDefaultListWithFallback(user, item, key, nextSaved);
            } catch (_err) {}

            const isLatest = Number(STATE.quickMutationVersions[key] || 0) === nextVersion;
            if (!isLatest) return;

            if (!saveResult?.ok) {
              STATE.quickStatus[key] = previousSaved;
              animateQuickNode(key, 'error');
            } else if (typeof saveResult.saved === 'boolean') {
              STATE.quickStatus[key] = saveResult.saved;
            }
            writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
            STATE.pendingQuickKeys.delete(key);
            renderItemMenuQuickLists();
          })();
        };

        node.addEventListener('click', () => void runToggle());
        node.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void runToggle();
          }
        });
      });
    }

    STATE.quickRows.forEach((row) => {
      const key = String(row?.key || '').trim();
      const node = DOM.quickNodesByKey.get(key);
      if (!node) return;
      const isActive = !!STATE.quickStatus[key];
      const isBusy = STATE.pendingQuickKeys.has(key);
      node.classList.toggle('active', isActive);
      node.setAttribute('aria-busy', isBusy ? 'true' : 'false');
      if ('disabled' in node) node.disabled = isBusy;
      const stateNode = node.querySelector('.menu-quick-state');
      if (stateNode) stateNode.textContent = isActive ? 'Saved' : 'Add';
    });
  }

  function renderItemMenuCustomLists() {
    const customContainer = document.getElementById('menuCustomLists');
    const customSection = customContainer?.closest('.menu-custom-section');
    if (!customContainer) return;
    if (!customListsEnabled()) {
      if (customSection) customSection.style.display = 'none';
      customContainer.innerHTML = '';
      return;
    }
    if (customSection) customSection.style.display = '';
    if (!getCurrentUser()?.id) {
      customContainer.innerHTML = '<div class="menu-empty">Sign in to use custom lists.</div>';
      return;
    }
    if (!STATE.customLists.length) {
      customContainer.innerHTML = '<div class="menu-empty">No custom lists yet. Create one.</div>';
      return;
    }

    customContainer.innerHTML = STATE.customLists.map((list) => {
      const isActive = STATE.selectedCustomLists.has(list.id);
      const isBusy = STATE.pendingCustomListIds.has(String(list.id || '').trim());
      return `
        <div class="menu-custom-item ${isActive ? 'active' : ''}" data-list-id="${list.id}" aria-busy="${isBusy ? 'true' : 'false'}">
          <div class="menu-custom-left">
            ${window.ListUtils ? ListUtils.renderListIcon(list.icon, 'fas fa-list') : '<i class="fas fa-list"></i>'}
            <span>${escapeHtml(list.title || 'Custom List')}</span>
          </div>
          <span class="menu-custom-state">${isBusy ? 'Syncing' : (isActive ? 'Saved' : 'Add')}</span>
        </div>
      `;
    }).join('');

    customContainer.querySelectorAll('.menu-custom-item').forEach((node) => {
      node.addEventListener('click', async () => {
        const listId = node.getAttribute('data-list-id');
        if (!listId) return;
        await toggleMenuCustomList(listId);
      });
    });
  }

  async function refreshItemMenuQuickStatus() {
    const item = STATE.currentItem;
    if (!item) return;
    const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
    STATE.quickStatus = await getDefaultListStatusMap(item.itemId, listKeys);
    writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
  }

  async function loadItemMenuData() {
    const item = STATE.currentItem;
    if (!item) return;
    STATE.quickRows = getQuickRowsForMenu();
    STATE.pendingQuickKeys = new Set();
    STATE.quickMutationVersions = {};
    STATE.pendingCustomListIds = new Set();
    STATE.customMutationVersion = 0;
    const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
    STATE.quickStatus = readCachedQuickStatus(item.itemId, listKeys);
    if (!STATE.customLists.length) {
      STATE.customLists = readCachedCustomLists();
      STATE.selectedCustomLists = readCachedMembership(item.itemId);
    }
    renderItemMenuQuickLists();
    renderItemMenuCustomLists();

    const user = await resolveAuthenticatedUser();
    const mediaType = getMediaType();
    if (!customListsEnabled()) {
      STATE.customLists = [];
      STATE.selectedCustomLists = new Set();
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();
      return;
    }
    if (!user?.id || !window.ListUtils) {
      STATE.customLists = [];
      STATE.selectedCustomLists = new Set();
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();
      return;
    }

    const client = await ensureClient();
    if (!client) {
      STATE.customLists = [];
      STATE.selectedCustomLists = new Set();
      renderItemMenuQuickLists();
      renderItemMenuCustomLists();
      return;
    }

    const [quickStatus, loadedLists] = await Promise.all([
      getDefaultListStatusMap(item.itemId, listKeys),
      customListsEnabled() ? ListUtils.loadCustomLists(client, user.id, mediaType) : []
    ]);

    STATE.quickStatus = quickStatus;
    writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
    STATE.customLists = Array.isArray(loadedLists) ? loadedLists : [];
    writeCachedCustomLists(STATE.customLists);
    const listIds = STATE.customLists.map((l) => l.id).filter(Boolean);
    if (customListsEnabled()) {
      STATE.selectedCustomLists = await ListUtils.loadCustomListMembership(
        client,
        user.id,
        mediaType,
        item.itemId,
        listIds
      );
    } else {
      STATE.selectedCustomLists = new Set();
    }
    writeCachedMembership(item.itemId, STATE.selectedCustomLists);
    renderItemMenuQuickLists();
    renderItemMenuCustomLists();
  }

  async function openItemMenuFromCard(card) {
    if (!bridge || !card) return;
    lastFocusedTrigger = card.querySelector('.menu-btn') || card;
    const mediaType = getMediaType();
    if (!mediaType) return;
    const item = getCardItem(card);
    if (!item || item.itemId === undefined || item.itemId === null || item.itemId === '') return;

    STATE.currentCard = card;
    STATE.currentItem = item;
    STATE.quickRows = getQuickRowsForMenu();
    const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
    STATE.quickStatus = readCachedQuickStatus(item.itemId, listKeys);
    STATE.pendingQuickKeys = new Set();
    STATE.quickMutationVersions = {};
    STATE.customLists = readCachedCustomLists();
    STATE.selectedCustomLists = readCachedMembership(item.itemId);
    STATE.pendingCustomListIds = new Set();
    STATE.customMutationVersion = 0;

    const titleEl = document.getElementById('menuModalTitle');
    if (titleEl) titleEl.textContent = item.title || 'Add to List';
    renderItemMenuQuickLists();
    renderItemMenuCustomLists();

    const itemModal = document.getElementById('itemMenuModal');
    if (itemModal) {
      itemModal.classList.add('active');
      itemModal.setAttribute('aria-hidden', 'false');
      syncMenuModalViewport(itemModal);
      const content = itemModal.querySelector('.menu-modal-content');
      if (content) {
        content.classList.remove('menu-modal-fly-up');
        void content.offsetWidth;
        content.classList.add('menu-modal-fly-up');
      }
    }
    syncMenuModalBodyLock();
    void primeScopeCaches();
    void loadItemMenuData();
  }

  async function toggleMenuCustomList(listId) {
    const item = STATE.currentItem;
    const user = await resolveAuthenticatedUser();
    if (!item || !user?.id || !window.ListUtils) {
      redirectToLogin();
      return;
    }
    const client = await ensureClient();
    if (!client) return;
    const next = new Set(STATE.selectedCustomLists);
    if (next.has(listId)) next.delete(listId);
    else next.add(listId);
    const previous = new Set(STATE.selectedCustomLists);
    const saveVersion = Number(STATE.customMutationVersion || 0) + 1;
    STATE.customMutationVersion = saveVersion;
    STATE.pendingCustomListIds.add(String(listId || '').trim());
    STATE.selectedCustomLists = next;
    writeCachedMembership(item.itemId, STATE.selectedCustomLists);
    renderItemMenuCustomLists();

    void (async () => {
      try {
        await ListUtils.saveCustomListChanges(
          client,
          user.id,
          getMediaType(),
          item.itemId,
          [...next],
          buildCustomListPayload()
        );
      } catch (_err) {
        if (Number(STATE.customMutationVersion || 0) !== saveVersion) return;
        STATE.selectedCustomLists = previous;
        writeCachedMembership(item.itemId, STATE.selectedCustomLists);
        renderItemMenuCustomLists();
        notify('Could not update custom list', true);
      } finally {
        if (Number(STATE.customMutationVersion || 0) !== saveVersion) return;
        STATE.pendingCustomListIds.delete(String(listId || '').trim());
        renderItemMenuCustomLists();
      }
    })();
  }

  async function openCreateListModalFromMenu() {
    const user = await resolveAuthenticatedUser();
    if (!STATE.currentItem || !user?.id) {
      redirectToLogin();
      return;
    }
    const createModal = document.getElementById('createListModal');
    const itemModal = document.getElementById('itemMenuModal');
    const nameInput = document.getElementById('newListNameInput');
    if (nameInput) nameInput.value = '';
    if (itemModal) itemModal.classList.remove('active');
    if (createModal) {
      createModal.classList.add('active');
      createModal.setAttribute('aria-hidden', 'false');
      if (window.ListUtils) ListUtils.resetTierCreateState(createModal);
      syncMenuModalViewport(createModal);
      const content = createModal.querySelector('.menu-modal-content');
      if (content) {
        content.classList.remove('menu-modal-fly-up');
        void content.offsetWidth;
        content.classList.add('menu-modal-fly-up');
      }
    }
    syncMenuModalBodyLock();
  }

  async function saveNewCustomListFromMenu() {
    const item = STATE.currentItem;
    const user = await resolveAuthenticatedUser();
    if (!item || !window.ListUtils || !user?.id) {
      redirectToLogin();
      return;
    }
    const nameInput = document.getElementById('newListNameInput');
    const title = String(nameInput?.value || '').trim();
    if (!title) {
      notify('Please enter a list name', true);
      return;
    }
    const createModal = document.getElementById('createListModal');
    const tierState = window.ListUtils && createModal
      ? ListUtils.readTierCreateState(createModal)
      : { listKind: 'standard', maxRank: null };
    const client = await ensureClient();
    if (!client) return;
    const created = await ListUtils.createCustomList(client, user.id, getMediaType(), {
      title,
      listKind: tierState.listKind,
      maxRank: tierState.maxRank
    });
    if (!created?.id) {
      notify('Could not create list', true);
      return;
    }
    if (window.ListUtils && createModal) ListUtils.resetTierCreateState(createModal);
    STATE.customLists = [created, ...STATE.customLists.filter((list) => String(list.id) !== String(created.id))];
    STATE.selectedCustomLists.add(created.id);
    writeCachedCustomLists(STATE.customLists);
    writeCachedMembership(item.itemId, STATE.selectedCustomLists);
    closeCreateListModal();
    const itemModal = document.getElementById('itemMenuModal');
    if (itemModal) {
      itemModal.classList.add('active');
      itemModal.setAttribute('aria-hidden', 'false');
      syncMenuModalViewport(itemModal);
      const content = itemModal.querySelector('.menu-modal-content');
      if (content) {
        content.classList.remove('menu-modal-fly-up');
        void content.offsetWidth;
        content.classList.add('menu-modal-fly-up');
      }
    }
    syncMenuModalBodyLock();
    await loadItemMenuData();
    notify('List created');
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.getElementById('closeMenuModalBtn')?.addEventListener('click', closeItemMenuModal);
    document.getElementById('closeCreateModalBtn')?.addEventListener('click', closeAllItemMenuModals);
    document.getElementById('cancelCreateBtn')?.addEventListener('click', closeAllItemMenuModals);
    document.getElementById('menuCreateListBtn')?.addEventListener('click', openCreateListModalFromMenu);
    document.getElementById('saveNewListBtn')?.addEventListener('click', () => {
      void saveNewCustomListFromMenu();
    });

    [document.getElementById('itemMenuModal'), document.getElementById('createListModal')].forEach((modal) => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllItemMenuModals();
      });
    });

    const itemMenuModal = document.getElementById('itemMenuModal');
    if (itemMenuModal) {
      itemMenuModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeItemMenuModal();
      });
    }

    const newListNameInput = document.getElementById('newListNameInput');
    if (newListNameInput) {
      const keepCreateModalInputVisible = () => {
        const createModal = document.getElementById('createListModal');
        const content = createModal?.querySelector('.menu-modal-content');
        window.setTimeout(() => {
          syncMenuModalViewport(createModal);
          if (content && typeof content.scrollTo === 'function') {
            content.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 40);
      };
      newListNameInput.addEventListener('focus', keepCreateModalInputVisible);
      newListNameInput.addEventListener('input', keepCreateModalInputVisible);
      newListNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void saveNewCustomListFromMenu();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllItemMenuModals();
    });

    const syncModalViewportOnViewportChange = () => {
      syncActiveMenuModalViewports();
    };
    window.addEventListener('scroll', syncModalViewportOnViewportChange, { passive: true });
    window.addEventListener('resize', syncModalViewportOnViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', syncModalViewportOnViewportChange);
      window.visualViewport.addEventListener('resize', syncModalViewportOnViewportChange);
    }
  }

  function init(config) {
    bridge = config || null;
    ensureStyles();
    ensureMarkup();
    bindListeners();
    void primeScopeCaches();
  }

  window.initIndexStyleListMenu = init;
  window.openIndexStyleListMenu = openItemMenuFromCard;
  window.openItemMenuFromCard = openItemMenuFromCard;
})();
