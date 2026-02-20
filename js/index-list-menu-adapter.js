(function () {
  const STYLE_ID = 'zo2yIndexListMenuStyle';
  const STATE = {
    currentCard: null,
    currentItem: null,
    quickRows: [],
    quickStatus: {},
    pendingQuickKeys: new Set(),
    customLists: [],
    selectedCustomLists: new Set(),
    selectedIcon: 'fas fa-list'
  };
  const CACHE = {
    quickStatusByItem: new Map(),
    customListsByScope: new Map(),
    customMembershipByItem: new Map(),
    primingScopes: new Set()
  };

  let bridge = null;
  let listenersBound = false;

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
    ]
  };

  const DEFAULT_TABLE_BY_MEDIA = {
    movie: { table: 'movie_list_items', itemField: 'movie_id' },
    tv: { table: 'tv_list_items', itemField: 'tv_id' },
    game: { table: 'game_list_items', itemField: 'game_id' },
    book: { table: 'book_list_items', itemField: 'book_id' },
    music: { table: 'music_list_items', itemField: 'track_id' }
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
        padding: 12px 16px;
        background: var(--card-2, #172b58);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .menu-quick-item:hover {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.1);
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
      .menu-icon-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        margin-bottom: 20px;
      }
      .menu-icon-option {
        aspect-ratio: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--card-2, #172b58);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        border-radius: 10px;
        color: var(--white, #fff);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 16px;
      }
      .menu-icon-option:hover {
        border-color: var(--accent, #f59e0b);
        transform: scale(1.05);
      }
      .menu-icon-option.selected {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.2);
        color: var(--accent, #f59e0b);
      }
      .menu-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .menu-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        transition: all 0.2s ease;
      }
      .menu-btn-primary {
        background: var(--gradient, linear-gradient(135deg, #f59e0b, #ffb84d));
        color: #0b1633;
        border: none;
      }
      .menu-btn-primary:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
      .menu-btn-secondary {
        background: transparent;
        color: var(--white, #fff);
      }
      .menu-btn-secondary:hover {
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
        <div class="menu-modal-content" style="max-width: 320px;">
          <div class="menu-modal-header">
            <h3>Create New List</h3>
            <button class="menu-modal-close" id="closeCreateModalBtn" aria-label="Close">&times;</button>
          </div>
          <div class="menu-modal-body">
            <input type="text" id="newListNameInput" class="menu-input" placeholder="List name..." maxlength="50">
            <div class="menu-icon-grid">
              <button class="menu-icon-option selected" data-icon="fas fa-list"><i class="fas fa-list"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-heart"><i class="fas fa-heart"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-star"><i class="fas fa-star"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-bookmark"><i class="fas fa-bookmark"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-film"><i class="fas fa-film"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-tv"><i class="fas fa-tv"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-gamepad"><i class="fas fa-gamepad"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-book"><i class="fas fa-book"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-music"><i class="fas fa-music"></i></button>
              <button class="menu-icon-option" data-icon="fas fa-utensils"><i class="fas fa-utensils"></i></button>
            </div>
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

  function getQuickRowsForMenu() {
    return QUICK_ROWS_BY_TYPE[getMediaType()] || [];
  }

  function normalizeItemIdValue(itemId) {
    const mediaType = getMediaType();
    if (window.ListUtils) return ListUtils.coerceItemId(mediaType, itemId);
    return itemId;
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

  function getCurrentUser() {
    if (!bridge || typeof bridge.getCurrentUser !== 'function') return null;
    return bridge.getCurrentUser();
  }

  async function ensureClient() {
    if (!bridge || typeof bridge.ensureClient !== 'function') return null;
    return bridge.ensureClient();
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
    const coercedId = window.ListUtils ? ListUtils.coerceItemId(mediaType, rawId) : rawId;
    const title = card.querySelector('.card-title, .card-name')?.textContent || '';
    const subtitle = card.querySelector('.card-meta, .card-sub')?.textContent || '';
    const image = card.querySelector('img')?.getAttribute('src') || '';
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
    const user = getCurrentUser();
    if (!user?.id || !listKeys?.length) return status;
    const client = await ensureClient();
    if (!client) return status;

    const mediaType = getMediaType();
    const tableCfg = DEFAULT_TABLE_BY_MEDIA[mediaType];
    if (!tableCfg) return status;

    try {
      const normalizedItemId = window.ListUtils
        ? ListUtils.coerceItemId(mediaType, itemId)
        : itemId;
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
    const user = getCurrentUser();
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
        .map((id) => normalizeItemIdValue(id))
        .filter((id) => String(id ?? '').trim()))];
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

      if (!window.ListUtils) return;
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
      if (cfg.usesUserId && user.id) query = query.eq('user_id', user.id);
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
    if (itemModal) {
      itemModal.classList.remove('active');
      itemModal.setAttribute('aria-hidden', 'true');
    }
    STATE.pendingQuickKeys = new Set();
    syncMenuModalBodyLock();
  }

  function closeCreateListModal() {
    const createModal = document.getElementById('createListModal');
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
      return;
    }

    quickContainer.innerHTML = STATE.quickRows.map((row) => {
      const isActive = !!STATE.quickStatus[row.key];
      const isBusy = STATE.pendingQuickKeys.has(row.key);
      return `
        <div class="menu-quick-item ${isActive ? 'active' : ''}" data-quick-key="${row.key}" aria-busy="${isBusy ? 'true' : 'false'}">
          <div class="menu-quick-left">
            <i class="${row.icon}"></i>
            <span>${row.label}</span>
          </div>
          <span class="menu-quick-state">${isActive ? 'Saved' : 'Add'}</span>
        </div>
      `;
    }).join('');

    quickContainer.querySelectorAll('.menu-quick-item').forEach((node) => {
      node.addEventListener('click', async () => {
        const key = node.getAttribute('data-quick-key');
        if (!key || STATE.pendingQuickKeys.has(key)) return;
        const user = getCurrentUser();
        if (!user?.id) {
          window.location.href = 'login.html';
          return;
        }
        const item = STATE.currentItem;
        if (!item) return;
        const previousSaved = !!STATE.quickStatus[key];
        const nextSaved = !previousSaved;
        const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
        STATE.pendingQuickKeys.add(key);
        STATE.quickStatus[key] = nextSaved;
        writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
        renderItemMenuQuickLists();

        let saveResult = null;
        try {
          if (bridge && typeof bridge.toggleDefaultList === 'function') {
            saveResult = await bridge.toggleDefaultList({
              itemId: item.itemId,
              listType: key,
              card: STATE.currentCard,
              nextSaved
            });
          }
        } catch (_err) {}

        if (!saveResult?.ok) {
          STATE.quickStatus[key] = previousSaved;
        } else if (typeof saveResult.saved === 'boolean') {
          STATE.quickStatus[key] = saveResult.saved;
        }
        writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
        STATE.pendingQuickKeys.delete(key);
        renderItemMenuQuickLists();
      });
    });
  }

  function renderItemMenuCustomLists() {
    const customContainer = document.getElementById('menuCustomLists');
    if (!customContainer) return;
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
      return `
        <div class="menu-custom-item ${isActive ? 'active' : ''}" data-list-id="${list.id}">
          <div class="menu-custom-left">
            ${window.ListUtils ? ListUtils.renderListIcon(list.icon, 'fas fa-list') : '<i class="fas fa-list"></i>'}
            <span>${escapeHtml(list.title || 'Custom List')}</span>
          </div>
          <span class="menu-custom-state">${isActive ? 'Saved' : 'Add'}</span>
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
    const listKeys = STATE.quickRows.map((row) => row.key).filter(Boolean);
    STATE.quickStatus = readCachedQuickStatus(item.itemId, listKeys);
    if (!STATE.customLists.length) {
      STATE.customLists = readCachedCustomLists();
      STATE.selectedCustomLists = readCachedMembership(item.itemId);
    }
    renderItemMenuQuickLists();
    renderItemMenuCustomLists();

    const user = getCurrentUser();
    const mediaType = getMediaType();
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
      ListUtils.loadCustomLists(client, user.id, mediaType)
    ]);

    STATE.quickStatus = quickStatus;
    writeCachedQuickStatus(item.itemId, STATE.quickStatus, listKeys);
    STATE.customLists = Array.isArray(loadedLists) ? loadedLists : [];
    writeCachedCustomLists(STATE.customLists);
    const listIds = STATE.customLists.map((l) => l.id).filter(Boolean);
    STATE.selectedCustomLists = await ListUtils.loadCustomListMembership(
      client,
      user.id,
      mediaType,
      item.itemId,
      listIds
    );
    writeCachedMembership(item.itemId, STATE.selectedCustomLists);
    renderItemMenuQuickLists();
    renderItemMenuCustomLists();
  }

  async function openItemMenuFromCard(card) {
    if (!bridge || !card) return;
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
    STATE.customLists = readCachedCustomLists();
    STATE.selectedCustomLists = readCachedMembership(item.itemId);

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
    const user = getCurrentUser();
    if (!item || !user?.id || !window.ListUtils) {
      window.location.href = 'login.html';
      return;
    }
    const client = await ensureClient();
    if (!client) return;
    const next = new Set(STATE.selectedCustomLists);
    if (next.has(listId)) next.delete(listId);
    else next.add(listId);
    const previous = STATE.selectedCustomLists;
    STATE.selectedCustomLists = next;
    writeCachedMembership(item.itemId, STATE.selectedCustomLists);
    renderItemMenuCustomLists();
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
      STATE.selectedCustomLists = previous;
      writeCachedMembership(item.itemId, STATE.selectedCustomLists);
      renderItemMenuCustomLists();
      notify('Could not update custom list', true);
    }
  }

  function openCreateListModalFromMenu() {
    const user = getCurrentUser();
    if (!STATE.currentItem || !user?.id) {
      window.location.href = 'login.html';
      return;
    }
    const createModal = document.getElementById('createListModal');
    const itemModal = document.getElementById('itemMenuModal');
    const nameInput = document.getElementById('newListNameInput');
    if (nameInput) nameInput.value = '';
    const options = document.querySelectorAll('.menu-icon-option');
    STATE.selectedIcon = 'fas fa-list';
    options.forEach((btn) => {
      const icon = btn.getAttribute('data-icon') || '';
      btn.classList.toggle('selected', icon === STATE.selectedIcon);
    });
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
    const user = getCurrentUser();
    if (!item || !window.ListUtils || !user?.id) {
      window.location.href = 'login.html';
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
      icon: STATE.selectedIcon || 'fas fa-list',
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

    document.querySelectorAll('.menu-icon-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-icon-option').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        STATE.selectedIcon = btn.getAttribute('data-icon') || 'fas fa-list';
      });
    });

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
