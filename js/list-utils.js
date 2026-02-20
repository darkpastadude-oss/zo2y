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

  function bindGlobalListUx() {
    if (listUxBound || typeof document === 'undefined' || typeof window === 'undefined') return;
    listUxBound = true;
    ensureListUxStyles();

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
    const { data, error } = await client
      .from(cfg.listTable)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    const lists = data || [];
    if (cfg.filterTitles && cfg.filterTitles.length) {
      return lists.filter(list => !cfg.filterTitles.includes(list.title));
    }
    return lists;
  }

  async function loadCustomListMembership(client, userId, type, itemId, listIds) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !listIds || !listIds.length) return new Set();
    let query = client
      .from(cfg.itemsTable)
      .select('list_id')
      .eq(cfg.itemIdField, itemId)
      .in('list_id', listIds);
    if (cfg.usesUserId && userId) query = query.eq('user_id', userId);
    const { data } = await query;
    const set = new Set();
    (data || []).forEach(row => set.add(row.list_id));
    return set;
  }

  async function saveCustomListChanges(client, userId, type, itemId, selectedListIds, itemPayload) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !itemId) return;
    if (type === 'book' && itemPayload) {
      await ensureBookRecord(client, itemPayload);
    }
    if (type === 'music' && itemPayload) {
      await ensureTrackRecord(client, itemPayload);
    }
    const listIds = Array.isArray(selectedListIds) ? selectedListIds : [...(selectedListIds || [])];
    if (listIds.length) {
      let del = client
        .from(cfg.itemsTable)
        .delete()
        .eq(cfg.itemIdField, itemId)
        .in('list_id', listIds);
      if (cfg.usesUserId && userId) del = del.eq('user_id', userId);
      await del;
    }
    const inserts = listIds.map(listId => {
      const row = { list_id: listId };
      row[cfg.itemIdField] = itemId;
      if (cfg.usesUserId && userId) row.user_id = userId;
      return row;
    });
    if (inserts.length) await client.from(cfg.itemsTable).insert(inserts);
  }

  async function createCustomList(client, userId, type, payload) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId) return null;
    let insertPayload = {
      user_id: userId,
      title: payload.title,
      icon: payload.icon || cfg.defaultIcon || 'fas fa-list',
      created_at: new Date().toISOString()
    };
    if (cfg.listTable === 'lists') {
      insertPayload = {
        ...insertPayload,
        description: payload.description || `My ${payload.title} list`,
        is_default: false
      };
    }
    const { data, error } = await client
      .from(cfg.listTable)
      .insert(insertPayload)
      .select('*')
      .single();
    if (error) return null;
    return data || null;
  }

  async function renameCustomList(client, userId, type, listId, title) {
    const cfg = getListConfig(type);
    if (!cfg || !client || !userId || !listId) return false;
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
