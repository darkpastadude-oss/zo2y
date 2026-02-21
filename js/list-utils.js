(function () {
  const LIST_CONFIG = {
    movie: {
      listTable: 'movie_lists',
      itemsTable: 'movie_list_items',
      itemIdField: 'movie_id',
      usesUserId: true,
      defaultIcon: 'fas fa-film'
    },
    tv: {
      listTable: 'tv_lists',
      itemsTable: 'tv_list_items',
      itemIdField: 'tv_id',
      usesUserId: true,
      defaultIcon: 'fas fa-tv'
    },
    game: {
      listTable: 'game_lists',
      itemsTable: 'game_list_items',
      itemIdField: 'game_id',
      usesUserId: true,
      defaultIcon: 'fas fa-gamepad'
    },
    book: {
      listTable: 'book_lists',
      itemsTable: 'book_list_items',
      itemIdField: 'book_id',
      usesUserId: true,
      defaultIcon: 'fas fa-book'
    },
    music: {
      listTable: 'music_lists',
      itemsTable: 'music_list_items',
      itemIdField: 'track_id',
      usesUserId: true,
      defaultIcon: 'fas fa-music'
    },
    restaurant: {
      listTable: 'lists',
      itemsTable: 'lists_restraunts',
      itemIdField: 'restraunt_id',
      usesUserId: false,
      defaultIcon: 'fas fa-utensils',
      filterTitles: ['Favorites', 'Visited', 'Want to Go']
    }
  };

  const LIST_META_STORAGE_KEY = 'zo2y_list_meta_v1';
  const TIER_RANK_STORAGE_KEY = 'zo2y_tier_ranks_v1';
  const TIER_META_TABLE = 'list_tier_meta';
  const TIER_RANK_TABLE = 'list_tier_ranks';
  const LIST_COLLAB_TABLE = 'list_collaborators';
  const KNOWN_TIER_CREATE_MODAL_SELECTORS = [
    '#movieListsModal',
    '#tvListsModal',
    '#gameListsModal',
    '#bookListsModal',
    '#musicListsModal',
    '#createListModal',
    '#homeListsModal',
    '#editMediaListModal'
  ];
  const tierSyncContext = {
    client: null,
    userId: null
  };
  let tierMetaServerSupported = null;
  let tierRankServerSupported = null;
  let collaboratorTableSupported = null;

  function getListConfig(type) {
    return LIST_CONFIG[String(type || '').toLowerCase()] || null;
  }

  function coerceItemId(type, itemId) {
    const key = String(type || '').toLowerCase();
    if (key === 'movie' || key === 'tv' || key === 'game') {
      const num = Number(itemId);
      return Number.isFinite(num) ? num : itemId;
    }
    return String(itemId || '');
  }

  function normalizeIconKey(icon, fallback = 'list') {
    const raw = String(icon || '').trim().toLowerCase();
    if (!raw) return fallback;
    if (raw.includes('fa-heart')) return 'heart';
    if (raw.includes('fa-check') || raw.includes('fa-eye')) return 'check';
    if (raw.includes('fa-bookmark')) return 'bookmark';
    if (raw.includes('fa-utensils')) return 'restaurant';
    if (raw.includes('fa-film')) return 'movie';
    if (raw.includes('fa-book')) return 'book';
    if (raw.includes('fa-music')) return 'music';
    if (raw.includes('fa-user')) return 'user';
    if (raw.includes('fa-tv')) return 'tv';
    if (raw.includes('fa-gamepad')) return 'game';
    if (raw === '?' || raw === '??' || raw === '???') return fallback;
    return raw;
  }

  function renderListIcon(icon, fallbackIcon) {
    const raw = String(icon || '').trim();
    const fallback = fallbackIcon || 'fas fa-list';
    if (!raw) return `<i class="${fallback}"></i>`;
    if (raw.includes('fa-')) return `<i class="${raw}"></i>`;
    return raw;
  }

  function safeJsonParse(raw, fallbackValue) {
    try {
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  function readStorageObject(key) {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const parsed = safeJsonParse(window.localStorage.getItem(key), {});
    return parsed && typeof parsed === 'object' ? parsed : {};
  }

  function writeStorageObject(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value || {}));
    } catch (_error) {}
  }

  function setTierSyncContext(client, userId) {
    if (client) tierSyncContext.client = client;
    const safeUserId = String(userId || '').trim();
    if (safeUserId) tierSyncContext.userId = safeUserId;
  }

  function getTierSyncContext(options = {}) {
    const safeUserId = String(options.userId || tierSyncContext.userId || '').trim();
    const safeOwnerUserId = String(options.ownerUserId || '').trim();
    return {
      client: options.client || tierSyncContext.client || null,
      userId: safeUserId || null,
      ownerUserId: safeOwnerUserId || null
    };
  }

  function isTierServerMissingError(error) {
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    if (code === '42P01') return true;
    if (message.includes('does not exist') && (message.includes(TIER_META_TABLE) || message.includes(TIER_RANK_TABLE))) return true;
    if (details.includes('does not exist') && (details.includes(TIER_META_TABLE) || details.includes(TIER_RANK_TABLE))) return true;
    return false;
  }

  function isTierServerPermissionError(error) {
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    if (code === '42501') return true;
    if (message.includes('permission denied') || message.includes('row-level security')) return true;
    return false;
  }

  function isCollaboratorTableMissingError(error) {
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    if (code === '42P01') return true;
    if (message.includes('does not exist') && message.includes(LIST_COLLAB_TABLE)) return true;
    if (details.includes('does not exist') && details.includes(LIST_COLLAB_TABLE)) return true;
    return false;
  }

  async function loadCollaboratorRows(client, userId, type) {
    const safeUserId = String(userId || '').trim();
    const safeType = String(type || '').trim().toLowerCase();
    if (!client || !safeUserId || !safeType) return [];
    if (collaboratorTableSupported === false) return [];
    const { data, error } = await client
      .from(LIST_COLLAB_TABLE)
      .select('media_type,list_id,list_owner_id,can_edit')
      .eq('media_type', safeType)
      .eq('collaborator_id', safeUserId);
    if (error) {
      if (isCollaboratorTableMissingError(error)) {
        collaboratorTableSupported = false;
      }
      return [];
    }
    collaboratorTableSupported = true;
    return data || [];
  }

  function toListMetaKey(type, listId) {
    const safeType = String(type || '').trim().toLowerCase();
    const safeListId = String(listId || '').trim();
    if (!safeType || !safeListId) return '';
    return `${safeType}:${safeListId}`;
  }

  function normalizeListKindValue(value, fallback = 'standard') {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return fallback;
    if (raw === 'tier' || raw === 'tierlist' || raw === 'tier_list') return 'tier';
    if (raw === 'standard' || raw === 'list' || raw === 'custom' || raw === 'default') return 'standard';
    if (
      raw === 'movie' ||
      raw === 'tv' ||
      raw === 'game' ||
      raw === 'book' ||
      raw === 'music' ||
      raw === 'restaurant'
    ) {
      return 'standard';
    }
    return fallback;
  }

  function normalizeTierMaxRank(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.max(1, Math.floor(parsed));
  }

  function setListMeta(type, listId, payload = {}, options = {}) {
    const key = toListMetaKey(type, listId);
    if (!key) return;
    const store = readStorageObject(LIST_META_STORAGE_KEY);
    const listKind = normalizeListKindValue(payload.listKind, 'standard');
    const maxRank = normalizeTierMaxRank(payload.maxRank);
    store[key] = {
      listKind,
      maxRank
    };
    writeStorageObject(LIST_META_STORAGE_KEY, store);

    if (options?.skipRemote) return;
    const { client, userId } = getTierSyncContext(options);
    if (!client || !userId || tierMetaServerSupported === false) return;
    void upsertListMetaRemote(type, listId, { listKind, maxRank }, { client, userId });
  }

  function getListMeta(type, listId) {
    const key = toListMetaKey(type, listId);
    if (!key) return { listKind: 'standard', maxRank: null };
    const store = readStorageObject(LIST_META_STORAGE_KEY);
    const row = store[key] || {};
    return {
      listKind: normalizeListKindValue(row.listKind, 'standard'),
      maxRank: normalizeTierMaxRank(row.maxRank)
    };
  }

  function resolveListMeta(type, list = null, itemsCount = 0) {
    const row = list && typeof list === 'object' ? list : {};
    const listId = row.id || row.list_id || null;
    const meta = listId ? getListMeta(type, listId) : { listKind: 'standard', maxRank: null };
    const rowKind = normalizeListKindValue(
      row.__listKind || row.__zo2yListKind || row.list_kind,
      meta.listKind
    );
    const listKind = rowKind === 'tier' || meta.listKind === 'tier' ? 'tier' : 'standard';
    const maxRank = normalizeTierMaxRank(
      row.__tierMaxRank || row.__zo2yTierMaxRank || row.tier_max_rank || row.max_rank || meta.maxRank
    );
    return {
      listKind,
      isTier: listKind === 'tier',
      maxRank: maxRank || (listKind === 'tier' ? Math.max(1, Number(itemsCount) || 1) : null)
    };
  }

  function applyListMeta(type, list = null) {
    if (!list || typeof list !== 'object') return list;
    const resolved = resolveListMeta(type, list, 0);
    return {
      ...list,
      __listKind: resolved.listKind,
      __tierMaxRank: resolved.maxRank
    };
  }

  async function upsertListMetaRemote(type, listId, payload = {}, options = {}) {
    const safeType = String(type || '').trim().toLowerCase();
    const safeListId = String(listId || '').trim();
    if (!safeType || !safeListId) return false;
    if (tierMetaServerSupported === false) return false;
    const { client, userId } = getTierSyncContext(options);
    if (!client || !userId) return false;

    const listKind = normalizeListKindValue(payload.listKind, 'standard');
    const maxRank = normalizeTierMaxRank(payload.maxRank);
    const { error } = await client
      .from(TIER_META_TABLE)
      .upsert({
        user_id: userId,
        media_type: safeType,
        list_id: safeListId,
        list_kind: listKind,
        max_rank: maxRank,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,media_type,list_id'
      });
    if (error) {
      if (isTierServerMissingError(error) || isTierServerPermissionError(error)) {
        tierMetaServerSupported = false;
      }
      return false;
    }
    tierMetaServerSupported = true;
    return true;
  }

  async function hydrateListMetaForLists(type, lists = [], options = {}) {
    const listRows = Array.isArray(lists) ? lists : [];
    if (!listRows.length) return listRows.map((row) => applyListMeta(type, row));
    if (tierMetaServerSupported === false) return listRows.map((row) => applyListMeta(type, row));

    const safeType = String(type || '').trim().toLowerCase();
    const safeListIds = [...new Set(listRows
      .map((row) => String(row?.id || row?.list_id || '').trim())
      .filter(Boolean))];
    if (!safeType || !safeListIds.length) return listRows.map((row) => applyListMeta(type, row));

    const { client, userId, ownerUserId } = getTierSyncContext(options);
    if (!client) return listRows.map((row) => applyListMeta(type, row));

    let query = client
      .from(TIER_META_TABLE)
      .select('user_id,list_id,list_kind,max_rank')
      .eq('media_type', safeType)
      .in('list_id', safeListIds);
    const ownerId = String(ownerUserId || userId || '').trim();
    if (ownerId) {
      query = query.eq('user_id', ownerId);
    }

    const { data, error } = await query;
    if (error) {
      if (isTierServerMissingError(error) || isTierServerPermissionError(error)) {
        tierMetaServerSupported = false;
      }
      return listRows.map((row) => applyListMeta(type, row));
    }

    tierMetaServerSupported = true;
    const byListId = new Map();
    (data || []).forEach((row) => {
      const key = String(row?.list_id || '').trim();
      if (!key) return;
      byListId.set(key, {
        listKind: normalizeListKindValue(row?.list_kind, 'standard'),
        maxRank: normalizeTierMaxRank(row?.max_rank)
      });
    });

    listRows.forEach((row) => {
      const key = String(row?.id || row?.list_id || '').trim();
      if (!key) return;
      const meta = byListId.get(key);
      if (!meta) return;
      setListMeta(safeType, key, meta, { skipRemote: true });
    });
    return listRows.map((row) => applyListMeta(type, row));
  }

  function isTierList(type, list = null) {
    return !!resolveListMeta(type, list, 0).isTier;
  }

  function toTierRankKey(type, listId) {
    return toListMetaKey(type, listId);
  }

  function getTierRankMap(type, listId) {
    const key = toTierRankKey(type, listId);
    if (!key) return {};
    const store = readStorageObject(TIER_RANK_STORAGE_KEY);
    const row = store[key];
    if (!row || typeof row !== 'object') return {};
    return row;
  }

  function writeTierRankMap(type, listId, rankMap = {}) {
    const key = toTierRankKey(type, listId);
    if (!key) return;
    const store = readStorageObject(TIER_RANK_STORAGE_KEY);
    store[key] = rankMap;
    writeStorageObject(TIER_RANK_STORAGE_KEY, store);
  }

  function getTierRank(type, listId, itemId) {
    const map = getTierRankMap(type, listId);
    const key = String(itemId || '').trim();
    if (!key) return null;
    return normalizeTierMaxRank(map[key]);
  }

  async function persistTierRankRemote(type, listId, itemId, rankValue, options = {}) {
    const safeType = String(type || '').trim().toLowerCase();
    const safeListId = String(listId || '').trim();
    const safeItemId = String(itemId || '').trim();
    if (!safeType || !safeListId || !safeItemId) return false;
    if (tierRankServerSupported === false) return false;

    const { client, userId } = getTierSyncContext(options);
    if (!client || !userId) return false;
    const nextRank = normalizeTierMaxRank(rankValue);

    if (!nextRank) {
      const { error } = await client
        .from(TIER_RANK_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('media_type', safeType)
        .eq('list_id', safeListId)
        .eq('item_id', safeItemId);
      if (error) {
        if (isTierServerMissingError(error) || isTierServerPermissionError(error)) {
          tierRankServerSupported = false;
        }
        return false;
      }
      tierRankServerSupported = true;
      return true;
    }

    const { error } = await client
      .from(TIER_RANK_TABLE)
      .upsert({
        user_id: userId,
        media_type: safeType,
        list_id: safeListId,
        item_id: safeItemId,
        rank: nextRank,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,media_type,list_id,item_id'
      });
    if (error) {
      if (isTierServerMissingError(error) || isTierServerPermissionError(error)) {
        tierRankServerSupported = false;
      }
      return false;
    }
    tierRankServerSupported = true;
    return true;
  }

  async function hydrateTierRanksForList(type, listId, options = {}) {
    const safeType = String(type || '').trim().toLowerCase();
    const safeListId = String(listId || '').trim();
    if (!safeType || !safeListId) return getTierRankMap(type, listId);
    if (tierRankServerSupported === false) return getTierRankMap(type, listId);

    const { client, userId, ownerUserId } = getTierSyncContext(options);
    if (!client) return getTierRankMap(type, listId);

    let query = client
      .from(TIER_RANK_TABLE)
      .select('user_id,item_id,rank')
      .eq('media_type', safeType)
      .eq('list_id', safeListId);
    const ownerId = String(ownerUserId || userId || '').trim();
    if (ownerId) {
      query = query.eq('user_id', ownerId);
    }

    const { data, error } = await query;
    if (error) {
      if (isTierServerMissingError(error) || isTierServerPermissionError(error)) {
        tierRankServerSupported = false;
      }
      return getTierRankMap(type, listId);
    }

    tierRankServerSupported = true;
    const map = {};
    (data || []).forEach((row) => {
      const itemKey = String(row?.item_id || '').trim();
      const rank = normalizeTierMaxRank(row?.rank);
      if (!itemKey || !rank) return;
      map[itemKey] = rank;
    });
    writeTierRankMap(safeType, safeListId, map);
    return map;
  }

  function setTierRank(type, listId, itemId, rankValue, options = {}) {
    const key = String(itemId || '').trim();
    if (!key) return Promise.resolve(false);
    const map = { ...getTierRankMap(type, listId) };
    const nextRank = normalizeTierMaxRank(rankValue);
    if (!nextRank) {
      delete map[key];
    } else {
      map[key] = nextRank;
    }
    writeTierRankMap(type, listId, map);

    if (options?.skipRemote) return Promise.resolve(true);
    const { client, userId } = getTierSyncContext(options);
    if (!client || !userId || tierRankServerSupported === false) return Promise.resolve(true);
    return persistTierRankRemote(type, listId, itemId, nextRank, { client, userId });
  }

  function sortIdsByTierRank(type, listId, itemIds = []) {
    const ids = Array.isArray(itemIds) ? [...itemIds] : [];
    if (!ids.length) return ids;
    const indexed = ids.map((itemId, index) => ({ itemId, index }));
    indexed.sort((a, b) => {
      const aRank = getTierRank(type, listId, a.itemId);
      const bRank = getTierRank(type, listId, b.itemId);
      const safeARank = Number.isFinite(aRank) ? aRank : Number.POSITIVE_INFINITY;
      const safeBRank = Number.isFinite(bRank) ? bRank : Number.POSITIVE_INFINITY;
      if (safeARank !== safeBRank) return safeARank - safeBRank;
      return a.index - b.index;
    });
    return indexed.map((entry) => entry.itemId);
  }

  const LIST_UX_STYLE_ID = 'zo2yListUxStyle';
  let listUxBound = false;

  function ensureListUxStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(LIST_UX_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = LIST_UX_STYLE_ID;
    style.textContent = `
      @keyframes zo2yListSlideUpClick {
        0% { transform: translateY(0) scale(1); }
        55% { transform: translateY(-8px) scale(1.03); }
        100% { transform: translateY(0) scale(1); }
      }
      .zo2y-list-click-lift {
        animation: zo2yListSlideUpClick 280ms cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
      }
      .zo2y-tier-create {
        margin-top: 10px;
        margin-bottom: 12px;
        display: grid;
        gap: 8px;
      }
      .zo2y-tier-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.75);
      }
      .zo2y-tier-kind-row {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .zo2y-tier-kind-btn {
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.04);
        color: #ffffff;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 12px;
        cursor: pointer;
        transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
      }
      .zo2y-tier-kind-btn.active {
        border-color: rgba(245, 158, 11, 0.82);
        background: rgba(245, 158, 11, 0.16);
        color: #f59e0b;
      }
    `;
    document.head.appendChild(style);
  }

  function playListClickLift(node) {
    if (!node || typeof node.closest !== 'function') return;
    const target = node.closest(
      '.list-action, .menu-quick-item, .menu-custom-item, .rail-menu-item, .card-menu-btn, .menu-btn, .menu-create-list-btn, .menu-btn-primary, .menu-btn-secondary, button[data-list], button[data-action=\"custom\"], .action-btn-modal, .list-item'
    );
    if (!target) return;
    target.classList.remove('zo2y-list-click-lift');
    // Restart the animation when users click repeatedly.
    // eslint-disable-next-line no-unused-expressions
    target.offsetWidth;
    target.classList.add('zo2y-list-click-lift');
  }

  function syncAbsoluteMenuModalViewport(modal) {
    if (!modal || !modal.classList.contains('active')) return;
    if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return;
    const position = getComputedStyle(modal).position;
    if (position !== 'absolute') return;
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

  function syncActiveMenuModals() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.menu-modal.active').forEach((modal) => {
      syncAbsoluteMenuModalViewport(modal);
    });
  }

  function setTierCreateKind(block, nextKind) {
    if (!block) return;
    const normalizedKind = normalizeListKindValue(nextKind, 'standard');
    const hiddenInput = block.querySelector('.zo2y-tier-kind-value');
    if (hiddenInput) hiddenInput.value = normalizedKind;
    block.querySelectorAll('.zo2y-tier-kind-btn').forEach((button) => {
      const buttonKind = normalizeListKindValue(button.getAttribute('data-list-kind'), 'standard');
      button.classList.toggle('active', buttonKind === normalizedKind);
    });
  }

  function ensureTierCreateControl(modal) {
    if (!modal || typeof modal.querySelector !== 'function') return null;
    let block = modal.querySelector('.zo2y-tier-create');
    if (block) return block;
    const firstInput = modal.querySelector('input[id^="new"][id$="ListName"], #newListNameInput, #editMediaListName, #listName');
    if (!firstInput) return null;

    const anchor = modal.querySelector('.icon-options, .menu-icon-grid, .menu-modal-actions, .modal-actions, .form-actions');
    block = document.createElement('div');
    block.className = 'zo2y-tier-create';
    block.innerHTML = `
      <div class="zo2y-tier-label">List Type</div>
      <input type="hidden" class="zo2y-tier-kind-value" value="standard">
      <div class="zo2y-tier-kind-row">
        <button type="button" class="zo2y-tier-kind-btn active" data-list-kind="standard">Standard</button>
        <button type="button" class="zo2y-tier-kind-btn" data-list-kind="tier">Tier List</button>
      </div>
    `;

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(block, anchor);
    } else {
      const host = firstInput.closest('.modal-content, .menu-modal-body, .modal-body') || modal;
      host.appendChild(block);
    }

    block.querySelectorAll('.zo2y-tier-kind-btn').forEach((button) => {
      button.addEventListener('click', () => {
        setTierCreateKind(block, button.getAttribute('data-list-kind'));
      });
    });

    setTierCreateKind(block, 'standard');
    return block;
  }

  function readTierCreateState(modal) {
    const block = ensureTierCreateControl(modal);
    if (!block) return { listKind: 'standard', maxRank: null };
    const kindValue = block.querySelector('.zo2y-tier-kind-value')?.value;
    const listKind = normalizeListKindValue(kindValue, 'standard');
    return { listKind, maxRank: null };
  }

  function setTierCreateState(modal, state = {}) {
    const block = ensureTierCreateControl(modal);
    if (!block) return;
    const listKind = normalizeListKindValue(state.listKind, 'standard');
    setTierCreateKind(block, listKind);
  }

  function resetTierCreateState(modal) {
    setTierCreateState(modal, { listKind: 'standard', maxRank: null });
  }

  function ensureKnownTierCreateControls(scope = document) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    KNOWN_TIER_CREATE_MODAL_SELECTORS.forEach((selector) => {
      scope.querySelectorAll(selector).forEach((modal) => {
        ensureTierCreateControl(modal);
      });
    });
  }

  function bindGlobalListUx() {
    if (listUxBound || typeof document === 'undefined' || typeof window === 'undefined') return;
    listUxBound = true;
    ensureListUxStyles();
    ensureKnownTierCreateControls(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (KNOWN_TIER_CREATE_MODAL_SELECTORS.some((selector) => node.matches?.(selector))) {
            ensureTierCreateControl(node);
          }
          ensureKnownTierCreateControls(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', (event) => {
      playListClickLift(event.target);
      window.requestAnimationFrame(syncActiveMenuModals);
    }, true);

    const sync = () => syncActiveMenuModals();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', sync);
      window.visualViewport.addEventListener('resize', sync);
    }
    sync();
  }

  async function ensureBookRecord(client, payload) {
    if (!client || !payload || !payload.id) return;
    await client.from('books').upsert({
      id: String(payload.id),
      title: payload.title || '',
      authors: payload.authors || '',
      thumbnail: payload.thumbnail || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }

  async function ensureTrackRecord(client, payload) {
    if (!client || !payload || !payload.id) return;
    await client.from('tracks').upsert({
      id: String(payload.id),
      name: payload.name || payload.title || '',
      artists: payload.artists || payload.subtitle || '',
      image_url: payload.image_url || payload.image || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }

  async function loadCustomLists(client, userId, type) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return [];
    setTierSyncContext(client, userId);
    const { data, error } = await client
      .from(cfg.listTable)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    const ownLists = data || [];
    const ownById = new Set(ownLists.map((row) => String(row?.id || '').trim()).filter(Boolean));

    let sharedLists = [];
    const collaboratorRows = await loadCollaboratorRows(client, userId, type);
    const sharedIds = [...new Set((collaboratorRows || [])
      .map((row) => String(row?.list_id || '').trim())
      .filter((id) => id && !ownById.has(id)))];

    if (sharedIds.length) {
      const { data: rows, error: sharedError } = await client
        .from(cfg.listTable)
        .select('*')
        .in('id', sharedIds);
      if (!sharedError && Array.isArray(rows)) {
        const collabById = new Map();
        collaboratorRows.forEach((row) => {
          const key = String(row?.list_id || '').trim();
          if (!key) return;
          collabById.set(key, row);
        });
        sharedLists = rows.map((row) => {
          const key = String(row?.id || '').trim();
          const collab = collabById.get(key);
          return {
            ...row,
            __isCollaborative: true,
            __canEdit: !!collab?.can_edit,
            __listOwnerId: String(collab?.list_owner_id || row?.user_id || '').trim()
          };
        });
      }
    }

    const lists = [...ownLists, ...sharedLists];
    const groups = new Map();
    lists.forEach((row) => {
      const ownerId = String(row?.user_id || userId || '').trim() || userId;
      if (!groups.has(ownerId)) groups.set(ownerId, []);
      groups.get(ownerId).push(row);
    });
    const hydratedById = new Map();
    for (const [ownerId, rows] of groups.entries()) {
      const hydrated = await hydrateListMetaForLists(type, rows, { client, userId, ownerUserId: ownerId });
      (hydrated || []).forEach((row) => {
        const key = String(row?.id || '').trim();
        if (!key) return;
        hydratedById.set(key, row);
      });
    }
    const enhanced = lists.map((row) => {
      const key = String(row?.id || '').trim();
      return hydratedById.get(key) || row;
    });
    if (cfg.filterTitles && cfg.filterTitles.length) {
      return enhanced.filter(list => !cfg.filterTitles.includes(list.title));
    }
    return enhanced;
  }

  async function loadCustomListMembership(client, userId, type, itemId, listIds) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !listIds || !listIds.length) return new Set();
    let query = client
      .from(cfg.itemsTable)
      .select('list_id')
      .eq(cfg.itemIdField, itemId)
      .in('list_id', listIds);
    const { data } = await query;
    const set = new Set();
    (data || []).forEach(row => set.add(row.list_id));
    return set;
  }

  async function saveCustomListChanges(client, userId, type, itemId, selectedListIds, itemPayload) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !itemId) return;
    if (userId) setTierSyncContext(client, userId);
    if (type === 'book' && itemPayload) {
      await ensureBookRecord(client, itemPayload);
    }
    if (type === 'music' && itemPayload) {
      await ensureTrackRecord(client, itemPayload);
    }
    const listIds = Array.isArray(selectedListIds) ? selectedListIds : [...(selectedListIds || [])];
    const ownerMap = new Map();
    if (listIds.length) {
      const { data: ownerRows } = await client
        .from(cfg.listTable)
        .select('id,user_id')
        .in('id', listIds);
      (ownerRows || []).forEach((row) => {
        const key = String(row?.id || '').trim();
        if (!key) return;
        ownerMap.set(key, String(row?.user_id || '').trim());
      });
    }
    if (listIds.length) {
      let del = client
        .from(cfg.itemsTable)
        .delete()
        .eq(cfg.itemIdField, itemId)
        .in('list_id', listIds);
      await del;
    }
    const inserts = listIds.map(listId => {
      const row = { list_id: listId };
      row[cfg.itemIdField] = itemId;
      if (cfg.usesUserId) {
        const ownerId = String(ownerMap.get(String(listId || '').trim()) || '').trim();
        row.user_id = ownerId || userId;
      }
      return row;
    });
    if (inserts.length) await client.from(cfg.itemsTable).insert(inserts);
  }

  async function createCustomList(client, userId, type, payload) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return null;
    setTierSyncContext(client, userId);
    const normalizedType = String(type || '').toLowerCase();
    const listKind = normalizeListKindValue(payload?.listKind, 'standard');
    const maxRank = normalizeTierMaxRank(payload?.maxRank);
    const dbListKind = listKind === 'tier' ? 'tier' : normalizedType;
    let insertPayload = {
      user_id: userId,
      title: payload.title,
      icon: payload.icon || cfg.defaultIcon || 'fas fa-list',
      list_kind: dbListKind,
      created_at: new Date().toISOString()
    };
    if (cfg.listTable === 'lists') {
      insertPayload = {
        ...insertPayload,
        description: payload.description || `My ${payload.title} list`,
        is_default: false
      };
    }
    let data = null;
    let error = null;

    const insertOnce = async (nextPayload) => client
      .from(cfg.listTable)
      .insert(nextPayload)
      .select('*')
      .single();

    ({ data, error } = await insertOnce(insertPayload));
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    const missingListKindColumn = !!error && (
      message.includes('list_kind') ||
      details.includes('list_kind') ||
      error.code === '42703'
    );
    if (missingListKindColumn) {
      const retryPayload = { ...insertPayload };
      delete retryPayload.list_kind;
      ({ data, error } = await insertOnce(retryPayload));
    }
    if (error || !data) return null;

    setListMeta(normalizedType, data.id, { listKind, maxRank }, { client, userId });
    return applyListMeta(normalizedType, data);
  }

  async function renameCustomList(client, userId, type, listId, title) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId || !listId) return false;
    setTierSyncContext(client, userId);
    const payload = { title };
    if (cfg.listTable === 'lists') payload.updated_at = new Date().toISOString();
    const { error } = await client
      .from(cfg.listTable)
      .update(payload)
      .eq('id', listId)
      .eq('user_id', userId);
    return !error;
  }

  window.ListUtils = {
    getListConfig,
    coerceItemId,
    normalizeIconKey,
    renderListIcon,
    setTierSyncContext,
    normalizeListKindValue,
    normalizeTierMaxRank,
    setListMeta,
    getListMeta,
    resolveListMeta,
    applyListMeta,
    hydrateListMetaForLists,
    isTierList,
    getTierRank,
    setTierRank,
    sortIdsByTierRank,
    hydrateTierRanksForList,
    ensureTierCreateControl,
    readTierCreateState,
    setTierCreateState,
    resetTierCreateState,
    ensureKnownTierCreateControls,
    ensureListUxStyles,
    playListClickLift,
    syncActiveMenuModals,
    bindGlobalListUx,
    ensureBookRecord,
    ensureTrackRecord,
    loadCustomLists,
    loadCustomListMembership,
    saveCustomListChanges,
    createCustomList,
    renameCustomList
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindGlobalListUx, { once: true });
    } else {
      bindGlobalListUx();
    }
  }
})();
