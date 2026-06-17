(function () {
  const CATEGORY_MAP = {
    movie: 'movie',
    tv: 'tv',
    anime: 'anime',
    game: 'game',
    book: 'book',
    music: 'music',
    travel: 'travel',
    fashion: 'fashion',
    food: 'food',
    car: 'car',
    restaurant: 'restaurant',
    sports: 'sport'
  };

  const LIST_CONFIG = {
    movie: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-film',
      category: 'movie',
      mediaType: 'movie'
    },
    tv: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-tv',
      category: 'tv',
      mediaType: 'tv'
    },
    anime: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-dragon',
      category: 'anime',
      mediaType: 'anime'
    },
    game: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-gamepad',
      category: 'game',
      mediaType: 'game'
    },
    book: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-book',
      category: 'book',
      mediaType: 'book'
    },
    music: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-music',
      category: 'music',
      mediaType: 'music'
    },
    travel: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-earth-americas',
      category: 'travel',
      mediaType: 'travel'
    },
    fashion: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-shirt',
      category: 'fashion',
      mediaType: 'fashion'
    },
    food: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-burger',
      category: 'food',
      mediaType: 'food'
    },
    car: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-car',
      category: 'car',
      mediaType: 'car'
    },
    restaurant: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-utensils',
      category: 'restaurant',
      mediaType: 'restaurant'
    },
    sports: {
      listTable: 'user_lists',
      itemsTable: 'list_items',
      itemIdField: 'external_id',
      usesUserId: true,
      defaultIcon: 'fas fa-futbol',
      category: 'sport',
      mediaType: 'sports',
      disableCustomLists: false
    }
  };

  const BOOK_SYNC_ENDPOINT = '/api/books/sync';
  let bookSyncSupported = null;
  let bookDirectWriteSupported = null;

  const LIST_META_STORAGE_KEY = 'zo2y_list_meta_v1';
  const TIER_RANK_STORAGE_KEY = 'zo2y_tier_ranks_v1';
  const TIER_META_TABLE = 'list_tier_meta';
  const TIER_RANK_TABLE = 'list_tier_ranks';
  const LIST_COLLAB_TABLE = 'list_collaborators';
  const NUMERIC_MEDIA_TYPES = new Set(['movie', 'tv', 'anime', 'game']);
  const missingListTables = new Set();
  const missingItemTables = new Set();
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
  let accessibleCustomListsRpcSupported = null;
  const MEDIA_ICON_PICKER_SELECTOR = '.icon-options[id$="ListIconOptions"], .icon-options[id*="ListIconOptions"], .list-icon-options, .menu-icon-grid, .menu-icon-option';

  function getListConfig(type) {
    return LIST_CONFIG[String(type || '').toLowerCase()] || null;
  }

  function customListsDisabled(cfg) {
    return !cfg || cfg.disableCustomLists || !cfg.listTable || !cfg.itemsTable;
  }

  function coerceItemId(type, itemId) {
    const key = String(type || '').toLowerCase();
    if (key === 'movie' || key === 'tv' || key === 'anime' || key === 'game') {
      const num = Number(itemId);
      return Number.isFinite(num) ? num : itemId;
    }
    return String(itemId || '');
  }

  function normalizeQueryableItemId(type, itemId) {
    const key = String(type || '').toLowerCase();
    if (NUMERIC_MEDIA_TYPES.has(key)) {
      const num = Number(itemId);
      return Number.isFinite(num) ? num : null;
    }
    const text = String(itemId || '').trim();
    return text || null;
  }

  function sanitizeItemIdsForQuery(type, itemIds) {
    const values = Array.isArray(itemIds) ? itemIds : [];
    const seen = new Set();
    const normalized = [];
    values.forEach((value) => {
      const safeValue = normalizeQueryableItemId(type, value);
      if (safeValue === null || safeValue === undefined) return;
      const key = String(safeValue);
      if (!key || seen.has(key)) return;
      seen.add(key);
      normalized.push(safeValue);
    });
    return normalized;
  }

  function normalizeIconKey(icon, fallback = 'list') {
    const raw = String(icon || '').trim().toLowerCase();
    if (!raw) return fallback;
    if (raw.includes('fa-heart')) return 'heart';
    if (raw.includes('fa-check') || raw.includes('fa-eye')) return 'check';
    if (raw.includes('fa-bookmark')) return 'bookmark';
    if (raw.includes('fa-clapperboard')) return 'restaurant';
    if (raw.includes('fa-utensils')) return 'restaurant';
    if (raw.includes('fa-film')) return 'movie';
    if (raw.includes('fa-book')) return 'book';
    if (raw.includes('fa-music')) return 'music';
    if (raw.includes('fa-earth')) return 'travel';
    if (raw.includes('fa-shirt')) return 'fashion';
    if (raw.includes('fa-burger')) return 'food';
    if (raw.includes('fa-car')) return 'car';
    if (raw.includes('fa-futbol') || raw.includes('fa-football')) return 'sports';
    if (raw.includes('fa-user')) return 'user';
    if (raw.includes('fa-tv')) return 'tv';
    if (raw.includes('fa-dragon')) return 'anime';
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

  function hideMediaTypeIconPickers(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll(MEDIA_ICON_PICKER_SELECTOR).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.hidden = true;
      node.setAttribute('aria-hidden', 'true');
      node.style.display = 'none';
    });
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

  function withTimeout(promise, timeoutMs, fallbackValue) {
    const safeTimeoutMs = Number(timeoutMs);
    if (!promise || !Number.isFinite(safeTimeoutMs) || safeTimeoutMs <= 0) {
      return Promise.resolve(promise);
    }
    return new Promise((resolve) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(fallbackValue);
      }, safeTimeoutMs);
      Promise.resolve(promise)
        .then((value) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch(() => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          resolve(fallbackValue);
        });
    });
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

  function isFunctionMissingError(error) {
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    if (code === '42883' || code === 'PGRST202') return true;
    if (message.includes('function') && message.includes('does not exist')) return true;
    if (details.includes('function') && details.includes('does not exist')) return true;
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

  async function loadAccessibleCustomListsViaRpc(client, userId, type) {
    const safeUserId = String(userId || '').trim();
    const safeType = String(type || '').trim().toLowerCase();
    if (!client || !safeUserId || !safeType || typeof client.rpc !== 'function') return null;
    if (accessibleCustomListsRpcSupported === false) return null;

    const { data, error } = await client.rpc('zo2y_get_accessible_custom_lists', {
      p_media_type: safeType
    });
    if (error) {
      accessibleCustomListsRpcSupported = false;
      return null;
    }
    accessibleCustomListsRpcSupported = true;
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      ...row,
      id: String(row?.id || '').trim(),
      __isCollaborative: !!row?.is_collaborative,
      __canEdit: !!row?.can_edit,
      __listOwnerId: String(row?.list_owner_id || row?.user_id || '').trim()
    })).filter((row) => !!row.id);
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
      raw === 'anime' ||
      raw === 'game' ||
      raw === 'book' ||
      raw === 'music' ||
      raw === 'travel' ||
      raw === 'sports' ||
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
        .eq('external_id', safeItemId);
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
    hideMediaTypeIconPickers(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (KNOWN_TIER_CREATE_MODAL_SELECTORS.some((selector) => node.matches?.(selector))) {
            ensureTierCreateControl(node);
          }
          ensureKnownTierCreateControls(node);
          hideMediaTypeIconPickers(node);
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

  function isListTableMissingError(error, tableName) {
    const table = String(tableName || '').toLowerCase();
    if (!table) return false;
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    if (code === '42P01') return true;
    if (message.includes('does not exist') && message.includes(table)) return true;
    if (details.includes('does not exist') && details.includes(table)) return true;
    if (message.includes(`could not find the '${table}'`)) return true;
    if (message.includes('could not find the table') && message.includes(table)) return true;
    return false;
  }

  function isConflictError(error) {
    if (!error) return false;
    const status = Number(error?.status || error?.statusCode || 0);
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    // PostgREST typically surfaces unique violations as 409 / 23505.
    if (status === 409) return true;
    if (code === '23505') return true;
    if (message.includes('duplicate key')) return true;
    if (message.includes('unique constraint')) return true;
    return false;
  }

  function normalizeBookAuthors(value) {
    if (Array.isArray(value)) {
      const joined = value
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
        .join(', ');
      return joined || '';
    }
    return String(value || '').trim();
  }

  function normalizeBookCategories(value) {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }

  function normalizeBookPublishedDate(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      const year = Math.floor(value);
      if (year > 0) return `${year}-01-01`;
    }
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const yearMatch = raw.match(/\d{4}/);
    if (yearMatch) return `${yearMatch[0]}-01-01`;
    return null;
  }

  function normalizeBookPayload(payload = {}) {
    const id = String(payload.id || payload.book_id || payload.bookId || '').trim();
    if (!id) return null;
    const titleRaw = String(payload.title || payload.name || '').trim();
    const title = titleRaw || `Book ${id}`;
    const authors = normalizeBookAuthors(payload.authors || payload.author_name || payload.author || payload.subtitle);
    const thumbnail = String(payload.thumbnail || payload.image || payload.cover || '').trim();
    const publishedDate = normalizeBookPublishedDate(
      payload.published_date || payload.first_publish_date || payload.first_publish_year || payload.published || payload.year
    );
    const categories = normalizeBookCategories(payload.categories || payload.subject);
    const description = String(payload.description || '').trim();
    const pageCount = Number(payload.page_count || payload.pageCount || 0);
    const publisher = String(payload.publisher || '').trim();

    return {
      id,
      title,
      authors,
      thumbnail,
      published_date: publishedDate,
      categories: categories.length ? categories : null,
      description: description || null,
      page_count: Number.isFinite(pageCount) && pageCount > 0 ? Math.floor(pageCount) : null,
      publisher: publisher || null
    };
  }

  function isBookWritePermissionError(error) {
    const code = String(error?.code || '').trim();
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    if (code === '42501') return true;
    if (message.includes('permission') || message.includes('row-level security')) return true;
    if (details.includes('permission') || details.includes('row-level security')) return true;
    return false;
  }

  async function syncBookRecordViaApi(payload, client) {
    if (bookSyncSupported === false) return false;
    if (typeof fetch !== 'function') return false;
    try {
      let bearerToken = '';
      try {
        if (client?.auth && typeof client.auth.getSession === 'function') {
          const { data } = await client.auth.getSession();
          bearerToken = String(data?.session?.access_token || '').trim();
        }
      } catch (_tokenErr) {}
      const response = await fetch(BOOK_SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
          ...(String(window?.__ZO2Y_SUPABASE_CONFIG?.key || '').trim()
            ? { 'x-zo2y-supabase-key': String(window.__ZO2Y_SUPABASE_CONFIG.key).trim() }
            : {})
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        bookSyncSupported = true;
        return true;
      }
      try {
        const body = await response.json();
        console.warn('zo2y:books/sync failed', response.status, body && body.message ? body.message : body);
      } catch (_err) {
        console.warn('zo2y:books/sync failed', response.status);
      }
      if ([401, 403, 404, 405].includes(response.status)) {
        bookSyncSupported = false;
      }
      return false;
    } catch (_err) {
      return false;
    }
  }

  async function ensureBookRecord(client, payload) {
    const normalized = normalizeBookPayload(payload);
    if (!normalized) return false;

    // Prefer direct writes (same pattern as other media types) and fall back to API only
    // when RLS blocks direct upserts.
    if (client && bookDirectWriteSupported !== false) {
      try {
        const { error } = await client.from('books').upsert({
          id: normalized.id,
          title: normalized.title,
          authors: normalized.authors || '',
          thumbnail: normalized.thumbnail || '',
          published_date: normalized.published_date,
          categories: normalized.categories,
          description: normalized.description,
          page_count: normalized.page_count,
          publisher: normalized.publisher,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (!error) {
          bookDirectWriteSupported = true;
          return true;
        }
        if (isBookWritePermissionError(error)) {
          bookDirectWriteSupported = false;
          try {
            if (!window.__ZO2Y_BOOKS_RLS_WARNED) {
              window.__ZO2Y_BOOKS_RLS_WARNED = true;
              console.warn('zo2y: books RLS blocked writes. Apply sql/books_rls_write_policy.sql in Supabase to allow authenticated inserts/updates on public.books.');
            }
          } catch (_warnErr) {}
        } else {
          // Non-RLS error: do not assume API can fix it (but try once).
          bookDirectWriteSupported = true;
        }
      } catch (_err) {
        // Network/runtime errors: do not permanently disable direct writes.
      }
    }

    const synced = await syncBookRecordViaApi(normalized, client);
    if (synced) return true;

    // If the API is reachable but failing, don't spam repeated direct attempts in the same session.
    if (bookSyncSupported !== false) return false;

    if (!client || bookDirectWriteSupported === false) return false;
    try {
      const { error } = await client.from('books').upsert({
        id: normalized.id,
        title: normalized.title,
        authors: normalized.authors || '',
        thumbnail: normalized.thumbnail || '',
        published_date: normalized.published_date,
        categories: normalized.categories,
        description: normalized.description,
        page_count: normalized.page_count,
        publisher: normalized.publisher,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        if (isBookWritePermissionError(error)) {
          bookDirectWriteSupported = false;
        }
        return false;
      }

      bookDirectWriteSupported = true;
      return true;
    } catch (_err) {
      return false;
    }
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

  function mapListRow(row) {
    if (!row) return row;
    return {
      ...row,
      title: row.name || row.title || '',
      name: row.name || row.title || ''
    };
  }

  async function loadCustomLists(client, userId, type) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return [];
    if (customListsDisabled(cfg)) return [];
    setTierSyncContext(client, userId);
    const mediaType = cfg.mediaType || type;
    const rpcLists = await withTimeout(loadAccessibleCustomListsViaRpc(client, userId, type), 2200, null);
    let enhancedRpc = null;
    if (Array.isArray(rpcLists)) {
      const groups = new Map();
      rpcLists.forEach((row) => {
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
      enhancedRpc = rpcLists.map((row) => hydratedById.get(String(row.id || '').trim()) || row);
    }

    if (missingListTables.has(cfg.listTable)) {
      return Array.isArray(enhancedRpc) && enhancedRpc.length ? enhancedRpc : [];
    }

    let ownLists = [];
    let sharedLists = [];
    try {
      const { data, error } = await client
        .from('user_lists')
        .select('*')
        .eq('user_id', userId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });
      if (error && isListTableMissingError(error, 'user_lists')) {
        missingListTables.add('user_lists');
        return Array.isArray(enhancedRpc) && enhancedRpc.length ? enhancedRpc : [];
      }
      ownLists = error ? [] : (data || []).map(mapListRow);
      const ownById = new Set(ownLists.map((row) => String(row?.id || '').trim()).filter(Boolean));

      const collaboratorRows = await withTimeout(loadCollaboratorRows(client, userId, type), 2200, []);
      const sharedIds = [...new Set((collaboratorRows || [])
        .map((row) => String(row?.list_id || '').trim())
        .filter((id) => id && !ownById.has(id)))];

      if (sharedIds.length && !missingListTables.has('user_lists')) {
        const { data: rows, error: sharedError } = await client
          .from('user_lists')
          .select('*')
          .in('id', sharedIds);
        if (sharedError && isListTableMissingError(sharedError, 'user_lists')) {
          missingListTables.add('user_lists');
          return Array.isArray(enhancedRpc) && enhancedRpc.length ? enhancedRpc : [];
        }
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
              ...mapListRow(row),
              __isCollaborative: true,
              __canEdit: !!collab?.can_edit,
              __listOwnerId: String(collab?.list_owner_id || row?.user_id || '').trim()
            };
          });
        }
      }
    } catch (_error) {
      return Array.isArray(enhancedRpc) && enhancedRpc.length ? enhancedRpc : [];
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

    let combined = enhanced;
    if (Array.isArray(enhancedRpc) && enhancedRpc.length) {
      const seen = new Set(combined
        .map((row) => String(row?.id || row?.list_id || '').trim())
        .filter(Boolean));
      enhancedRpc.forEach((row) => {
        const key = String(row?.id || row?.list_id || '').trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        combined.push(row);
      });
    } else if (Array.isArray(enhancedRpc)) {
      combined = combined.length ? combined : enhancedRpc;
    }

    if (cfg.filterTitles && cfg.filterTitles.length) {
      return combined.filter(list => !cfg.filterTitles.includes(list.title));
    }
    return combined;
  }

  async function loadCustomListMembership(client, userId, type, itemId, listIds) {
    const normalizedItemId = normalizeQueryableItemId(type, itemId);
    if (!client || !listIds || !listIds.length || normalizedItemId === null) return new Set();
    if (customListsDisabled({})) return new Set();
    if (missingItemTables.has('list_items')) return new Set();
    try {
      let query = client
        .from('list_items')
        .select('list_id')
        .eq('external_id', String(normalizedItemId))
        .in('list_id', listIds);
      const { data, error } = await query;
      if (error && isListTableMissingError(error, 'list_items')) {
        missingItemTables.add('list_items');
        return new Set();
      }
      const set = new Set();
      (data || []).forEach(row => set.add(row.list_id));
      return set;
    } catch (_error) {
      return new Set();
    }
  }

  function getExternalSource(type) {
    const sources = {
      movie: 'tmdb', tv: 'tmdb', anime: 'tmdb', game: 'igdb',
      book: 'openlibrary', music: 'spotify', travel: 'local_db',
      fashion: 'local_db', food: 'local_db', car: 'local_db',
      sports: 'sportsdb', sport: 'sportsdb'
    };
    return sources[String(type || '').toLowerCase()] || 'local_db';
  }

  function getCategoryName(type) {
    const map = {
      movie: 'movie', tv: 'tv', anime: 'anime', game: 'game',
      book: 'book', music: 'music', travel: 'travel',
      fashion: 'fashion', food: 'food', car: 'car',
      restaurant: 'restaurant',
      sports: 'sport', sport: 'sport'
    };
    return map[String(type || '').toLowerCase()] || type;
  }

  function getMediaType(type) {
    const cfg = getListConfig(type);
    return cfg?.mediaType || getCategoryName(type);
  }

  async function saveCustomListChanges(client, userId, type, itemId, selectedListIds, itemPayload) {
    const normalizedItemId = String(normalizeQueryableItemId(type, itemId));
    if (!client || normalizedItemId === null) return;
    if (customListsDisabled({})) return;
    if (missingItemTables.has('list_items')) return;
    if (userId) setTierSyncContext(client, userId);
    if (type === 'book' && itemPayload) {
      await ensureBookRecord(client, itemPayload).catch(() => false);
    }
    if (type === 'music' && itemPayload) {
      await ensureTrackRecord(client, itemPayload);
    }

    // Clean up from all custom lists first to sync changes correctly
    const allLists = await loadCustomLists(client, userId, type);
    const allListIds = allLists.map(l => l.id).filter(Boolean);
    if (allListIds.length) {
      await client
        .from('list_items')
        .delete()
        .eq('external_id', normalizedItemId)
        .in('list_id', allListIds);
    }

    const listIds = Array.isArray(selectedListIds) ? selectedListIds : [...(selectedListIds || [])];
    if (!listIds.length) return;

    // Resolve title and poster URL
    let title = itemPayload?.title || itemPayload?.name;
    let posterUrl = itemPayload?.poster_url || itemPayload?.image || itemPayload?.thumbnail || itemPayload?.image_url;

    if (!title && typeof document !== 'undefined') {
      const titleEl = document.getElementById('title');
      if (titleEl) {
        title = titleEl.textContent.trim();
      }
    }
    if (!posterUrl && typeof document !== 'undefined') {
      const posterEl = document.getElementById('poster');
      if (posterEl) {
        posterUrl = posterEl.src;
      }
    }
    const finalTitle = title || 'Untitled';

    const inserts = listIds.map(listId => ({
      user_id: userId,
      list_id: listId,
      external_type: getCategoryName(type),
      external_id: normalizedItemId,
      title: finalTitle,
      poster_url: posterUrl || null,
      metadata: itemPayload?.metadata || (itemPayload ? { ...itemPayload } : {})
    }));

    if (inserts.length && !missingItemTables.has('list_items')) {
      const { error: insertError } = await client.from('list_items').insert(inserts);
      if (insertError && isListTableMissingError(insertError, 'list_items')) {
        missingItemTables.add('list_items');
      }
    }
  }

  async function addItemToList(client, userId, type, itemId, listId, itemPayload) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return false;
    if (customListsDisabled(cfg)) return false;

    // Load ALL custom lists for this user/media type to preserve other memberships
    const allLists = await loadCustomLists(client, userId, type);
    const allListIds = allLists.map(l => l.id).filter(Boolean);

    // Get current memberships for ALL lists
    const currentMemberships = await loadCustomListMembership(client, userId, type, itemId, allListIds);
    const currentIds = new Set(currentMemberships);
    currentIds.add(listId);

    await saveCustomListChanges(client, userId, type, itemId, Array.from(currentIds), itemPayload);
    return true;
  }

  async function removeItemFromList(client, userId, type, itemId, listId) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return false;
    if (customListsDisabled(cfg)) return false;

    // Load ALL custom lists for this user/media type to preserve other memberships
    const allLists = await loadCustomLists(client, userId, type);
    const allListIds = allLists.map(l => l.id).filter(Boolean);

    // Get current memberships for ALL lists
    const currentMemberships = await loadCustomListMembership(client, userId, type, itemId, allListIds);
    const currentIds = new Set(currentMemberships);
    currentIds.delete(listId);

    await saveCustomListChanges(client, userId, type, itemId, Array.from(currentIds), null);
    return true;
  }

  async function createCustomList(client, userId, type, payload) {
    if (!client || !userId) return null;
    setTierSyncContext(client, userId);
    const normalizedType = String(type || '').toLowerCase();
    const category = getCategoryName(type);
    const listKind = normalizeListKindValue(payload?.listKind, 'standard');
    const maxRank = normalizeTierMaxRank(payload?.maxRank);
    const insertPayload = {
      user_id: userId,
      name: payload.title,
      media_type: category,
      icon: payload.icon || 'fas fa-list',
      description: payload.description || `My ${payload.title} list`
    };
    let data = null;
    let error = null;

    const insertOnce = async (nextPayload) => client
      .from('user_lists')
      .insert(nextPayload)
      .select('*')
      .single();

    ({ data, error } = await insertOnce(insertPayload));
    if (error && isListTableMissingError(error, 'user_lists')) {
      missingListTables.add('user_lists');
      return null;
    }
    if (error || !data) return null;

    const mapped = mapListRow(data);
    setListMeta(normalizedType, mapped.id, { listKind, maxRank }, { client, userId });
    return applyListMeta(normalizedType, mapped);
  }

  async function renameCustomList(client, userId, type, listId, title) {
    if (!client || !userId || !listId) return false;
    if (missingListTables.has('user_lists')) return false;
    setTierSyncContext(client, userId);
    const { error } = await client
      .from('user_lists')
      .update({ name: title })
      .eq('id', listId)
      .eq('user_id', userId);
    if (error && isListTableMissingError(error, 'user_lists')) {
      missingListTables.add('user_lists');
      return false;
    }
    return !error;
  }

  function getListTypeTitle(listType, mediaType) {
    const listTypeLower = String(listType || '').toLowerCase();
    const mediaTypeLower = String(mediaType || '').toLowerCase();
    
    if (listTypeLower === 'favorites') return 'Favorites';
    
    if (listTypeLower === 'watchlist') {
      if (mediaTypeLower === 'book') return 'Reading List';
      if (mediaTypeLower === 'game') return 'Backlog';
      if (mediaTypeLower === 'music') return 'Listen Later';
      if (mediaTypeLower === 'travel') return 'Bucket List';
      if (mediaTypeLower === 'food') return 'Want to Try';
      if (mediaTypeLower === 'restaurant') return 'Want to Go';
      return 'Watchlist';
    }
    
    if (listTypeLower === 'watched') {
      if (mediaTypeLower === 'book') return 'Read';
      if (mediaTypeLower === 'game') return 'Played';
      if (mediaTypeLower === 'music') return 'Listened';
      if (mediaTypeLower === 'travel') return 'Visited';
      if (mediaTypeLower === 'food') return 'Tried';
      if (mediaTypeLower === 'restaurant') return 'Visited';
      return 'Watched';
    }
    
    return listType.charAt(0).toUpperCase() + listType.slice(1);
  }

  function getListTypeIcon(listType, mediaType) {
    const listTypeLower = String(listType || '').toLowerCase();
    const mediaTypeLower = String(mediaType || '').toLowerCase();
    
    if (listTypeLower === 'favorites') return 'fas fa-heart';
    
    if (listTypeLower === 'watchlist') {
      if (mediaTypeLower === 'book') return 'fas fa-book-open';
      if (mediaTypeLower === 'game') return 'fas fa-gamepad';
      if (mediaTypeLower === 'music') return 'fas fa-play';
      if (mediaTypeLower === 'travel') return 'fas fa-map-marker-alt';
      if (mediaTypeLower === 'food') return 'fas fa-utensils';
      return 'fas fa-bookmark';
    }
    
    if (listTypeLower === 'watched') {
      if (mediaTypeLower === 'book') return 'fas fa-check';
      if (mediaTypeLower === 'game') return 'fas fa-check';
      if (mediaTypeLower === 'music') return 'fas fa-headphones';
      if (mediaTypeLower === 'travel') return 'fas fa-check';
      if (mediaTypeLower === 'food') return 'fas fa-check';
      return 'fas fa-eye';
    }
    
    return 'fas fa-list';
  }

  async function ensureDefaultList(client, userId, mediaType, listType) {
    if (!client || !userId) return null;
    
    const normalizedType = String(mediaType || '').toLowerCase();
    const normalizedListType = String(listType || '').toLowerCase();

    const { data: existing } = await client
      .from('user_lists')
      .select('id')
      .eq('user_id', userId)
      .eq('category', normalizedType)
      .eq('type', normalizedListType)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    const title = getListTypeTitle(normalizedListType, normalizedType);
    const icon = getListTypeIcon(normalizedListType, normalizedType);

    const { data: newList, error: listError } = await client
      .from('user_lists')
      .insert({
        user_id: userId,
        name: title,
        category: normalizedType,
        icon: icon,
        is_public: false
      })
      .select('id')
      .single();

    if (listError || !newList?.id) {
      console.error('Failed to create default list in user_lists:', listError);
      return null;
    }

    const listId = newList.id;

    const { error: defaultListError } = await client
      .from('user_lists')
      .insert({
        
        user_id: userId,
        category: normalizedType,
        type: normalizedListType,
        name: title,
        icon: icon
      });

    if (defaultListError) {
      console.error('Failed to create default list in user_default_lists:', defaultListError);
      await client.from('user_lists').delete().eq('id', listId);
      return null;
    }

    return listId;
  }

  window.ListUtils = {
    getListConfig,
    coerceItemId,
    normalizeQueryableItemId,
    sanitizeItemIdsForQuery,
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
    addItemToList,
    removeItemFromList,
    createCustomList,
    renameCustomList,
    ensureDefaultList
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindGlobalListUx, { once: true });
    } else {
      bindGlobalListUx();
    }
  }
})();
