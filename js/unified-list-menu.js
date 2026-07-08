// js/unified-list-menu.js
// Lightweight adapter that bridges legacy calls to the new UnifiedListMenu.
(function () {
  let _bridge = null;

  window.initIndexStyleListMenu = function (bridge) {
    _bridge = bridge;
  };

  window.openIndexStyleListMenu = function (triggerEl) {
    if (!window.UnifiedListMenu) {
      console.warn('UnifiedListMenu is not loaded.');
      return;
    }
    
    const card = triggerEl.closest('.card, .media-card, .list-item') || triggerEl;
    
    let itemId = card.getAttribute('data-item-id') || card.getAttribute('data-id');
    let mediaType = card.getAttribute('data-media-type');

    if (!itemId && _bridge && typeof _bridge.getVisibleItemIds === 'function') {
      const ids = _bridge.getVisibleItemIds();
      if (ids && ids.length > 0) itemId = ids[0];
    }
    if (!mediaType && _bridge && _bridge.mediaType) {
      mediaType = _bridge.mediaType;
    }
    
    if (!mediaType) mediaType = 'movie';

    if (!itemId) {
      console.warn('Cannot open list menu: itemId not found on element or via bridge.');
      return;
    }

    window.UnifiedListMenu.openMenu(triggerEl, itemId, mediaType);
  };
})();
// js/components/unified-list-menu.js
(function () {
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
      { key: 'read', label: 'Read', icon: 'fas fa-check' },
      { key: 'readlist', label: 'To Read', icon: 'fas fa-bookmark' }
    ],
    music: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'listened', label: 'Listened', icon: 'fas fa-headphones' },
      { key: 'listenlist', label: 'Listenlist', icon: 'fas fa-bookmark' }
    ],
    song: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'listened', label: 'Listened', icon: 'fas fa-headphones' },
      { key: 'listenlist', label: 'Listenlist', icon: 'fas fa-bookmark' }
    ],
    artist: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'listened', label: 'Listened', icon: 'fas fa-headphones' },
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
    ],
    team: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' }
    ]
  };

  const MEDIA_LIST_ICONS = {
    movie: 'fas fa-film', tv: 'fas fa-tv', anime: 'fas fa-dragon',
    game: 'fas fa-gamepad', book: 'fas fa-book', music: 'fas fa-music',
    song: 'fas fa-music', artist: 'fas fa-microphone', travel: 'fas fa-earth-americas',
    fashion: 'fas fa-shirt', food: 'fas fa-burger', car: 'fas fa-car',
    sports: 'fas fa-futbol', team: 'fas fa-users'
  };

  let modalSelectedLists = new Set();
  let customLists = [];
  let selectedIcon = '';
  let activeItem = null; // { itemId, mediaType }
  
  let _supabaseClient = null;
  let _currentUser = null;

  async function ensureClient() {
    if (_supabaseClient) return _supabaseClient;
    if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.ensureClient === 'function') {
      _supabaseClient = await window.ZO2Y_AUTH.ensureClient();
    } else if (window.__ZO2Y_ENSURE_SUPABASE_CLIENT) {
      _supabaseClient = window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
    } else if (window.supabase) {
      _supabaseClient = window.supabase;
    }
    return _supabaseClient;
  }

  async function ensureUser() {
    if (_currentUser?.id) return _currentUser;
    if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getUser === 'function') {
      _currentUser = window.ZO2Y_AUTH.getUser();
    }
    if (!_currentUser?.id) {
      const client = await ensureClient();
      if (client && client.auth) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) _currentUser = session.user;
      }
    }
    return _currentUser;
  }

  function showToast(msg, type = 'success') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type);
    } else {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.top = '16px';
      el.style.right = '16px';
      el.style.zIndex = '999999';
      el.style.padding = '12px 24px';
      el.style.borderRadius = '8px';
      el.style.background = type === 'error' ? 'var(--error-bg, #ef4444)' : 'var(--success-bg, #10b981)';
      el.style.color = '#fff';
      el.style.fontSize = '14px';
      el.style.fontWeight = '500';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  }

  function injectModalHTML() {
    if (document.getElementById('unifiedListsModal')) return;
    const html = `
      <div class="modal" id="unifiedListsModal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">Custom Lists</div>
            <button class="modal-close" id="unifiedListsCloseBtn">&times;</button>
          </div>
          <div class="modal-list" id="unifiedListsContainer"></div>
          <div class="modal-input">
            <input type="text" id="unifiedListsName" placeholder="New list name..." maxlength="50">
            <button class="btn" id="unifiedListsCreateBtn">Create</button>
          </div>
          <div class="icon-options" id="unifiedListsIconOptions">
            <button class="icon-option selected" data-icon="fas fa-list"><i class="fas fa-list"></i></button>
            <button class="icon-option" data-icon="fas fa-heart"><i class="fas fa-heart"></i></button>
            <button class="icon-option" data-icon="fas fa-star"><i class="fas fa-star"></i></button>
            <button class="icon-option" data-icon="fas fa-bookmark"><i class="fas fa-bookmark"></i></button>
            <button class="icon-option" data-icon="fas fa-eye"><i class="fas fa-eye"></i></button>
          </div>
          <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:8px;">
            <button class="btn" id="unifiedListsSaveBtn">Save Changes</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('unifiedListsCloseBtn').addEventListener('click', closeListsModal);
    document.getElementById('unifiedListsSaveBtn').addEventListener('click', saveListChanges);
    document.getElementById('unifiedListsCreateBtn').addEventListener('click', createList);
    
    const icons = document.querySelectorAll('#unifiedListsIconOptions .icon-option');
    icons.forEach(btn => {
      btn.addEventListener('click', () => {
        icons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.getAttribute('data-icon') || 'fas fa-list';
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderListIcon(icon) {
    if (!icon) return '<i class="fas fa-list"></i>';
    if (icon.startsWith('http') || icon.startsWith('data:')) {
      return \`<img src="\${escapeHtml(icon)}" class="tier-icon-img" alt="icon" style="width:20px;height:20px;object-fit:cover;border-radius:4px;">\`;
    }
    return \`<i class="\${escapeHtml(icon)}"></i>\`;
  }

  async function loadCustomLists(mediaType) {
    const client = await ensureClient();
    const user = await ensureUser();
    if (!client || !user || !window.ListUtils) return [];
    return await window.ListUtils.loadCustomLists(client, user.id, mediaType);
  }

  async function openListsModal(itemId, mediaType) {
    const user = await ensureUser();
    if (!user) {
      showToast('Please sign in to manage lists', 'info');
      window.location.href = 'login.html';
      return;
    }
    activeItem = { itemId, mediaType };
    
    injectModalHTML();
    const modal = document.getElementById('unifiedListsModal');
    const container = document.getElementById('unifiedListsContainer');
    if (!modal || !container) return;
    
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modal.classList.add('active');
    
    customLists = await loadCustomLists(mediaType);
    const listIds = customLists.map(l => l.id);
    
    const client = await ensureClient();
    modalSelectedLists = window.ListUtils && client
      ? await window.ListUtils.loadCustomListMembership(client, user.id, mediaType, itemId, listIds)
      : new Set();
      
    container.innerHTML = '';
    if (!customLists.length) {
      container.innerHTML = '<div class="chip" style="margin:20px;">No custom lists yet.</div>';
    } else {
      customLists.forEach(list => {
        const item = document.createElement('div');
        item.className = 'modal-list-item' + (modalSelectedLists.has(list.id) ? ' active' : '');
        item.innerHTML = \`
          <span>\${renderListIcon(list.icon)} \${escapeHtml(list.name || list.title)}</span>
          <span class="modal-list-actions" style="display:inline-flex; align-items:center; gap:6px;">
            <span>\${modalSelectedLists.has(list.id) ? 'Saved' : 'Add'}</span>
            <button class="list-edit-btn" aria-label="Rename list" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:4px 8px; cursor:pointer;"><i class="fas fa-pen"></i></button>
          </span>
        \`;
        item.onclick = () => {
          if (modalSelectedLists.has(list.id)) {
            modalSelectedLists.delete(list.id);
          } else {
            modalSelectedLists.add(list.id);
          }
          item.classList.toggle('active');
          item.querySelector('.modal-list-actions span').textContent = modalSelectedLists.has(list.id) ? 'Saved' : 'Add';
        };
        const editBtn = item.querySelector('.list-edit-btn');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            renameList(list.id, list.name || list.title);
          };
        }
        container.appendChild(item);
      });
    }
  }

  function closeListsModal() {
    const modal = document.getElementById('unifiedListsModal');
    if (modal) modal.classList.remove('active');
  }

  async function saveListChanges() {
    if (!activeItem) return;
    const client = await ensureClient();
    const user = await ensureUser();
    if (!client || !user) return;
    
    if (window.ListUtils) {
      const saveBtn = document.getElementById('unifiedListsSaveBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }
      
      await window.ListUtils.saveCustomListChanges(
        client,
        user.id,
        activeItem.mediaType,
        activeItem.itemId,
        [...modalSelectedLists]
      );
      
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }
    
    showToast('Lists updated', 'success');
    closeListsModal();
  }

  async function createList() {
    if (!activeItem) return;
    const client = await ensureClient();
    const user = await ensureUser();
    if (!client || !user) return;
    
    const input = document.getElementById('unifiedListsName');
    if (!input || !input.value.trim()) return;
    const title = input.value.trim();
    
    const data = window.ListUtils
      ? await window.ListUtils.createCustomList(client, user.id, activeItem.mediaType, {
          title,
          icon: selectedIcon || MEDIA_LIST_ICONS[activeItem.mediaType] || 'fas fa-list',
        })
      : null;
      
    if (!data) {
      showToast('Could not create list', 'error');
      return;
    }
    
    input.value = '';
    
    // Automatically select the newly created list
    if (data.id) {
      modalSelectedLists.add(data.id);
    }
    
    // Re-render modal list
    openListsModal(activeItem.itemId, activeItem.mediaType);
  }

  async function renameList(listId, currentTitle) {
    if (!activeItem) return;
    const nextTitle = prompt('Rename list', currentTitle || '');
    if (!nextTitle || !nextTitle.trim()) return;
    const client = await ensureClient();
    const user = await ensureUser();
    if (!client || !user) return;
    
    const ok = window.ListUtils
      ? await window.ListUtils.renameCustomList(client, user.id, activeItem.mediaType, listId, nextTitle.trim())
      : false;
      
    if (!ok) {
      showToast('Could not rename list', 'error');
      return;
    }
    
    openListsModal(activeItem.itemId, activeItem.mediaType);
  }
  
  /* QUICK LISTS MENU (Popup) */
  let activeMenuEl = null;
  
  function injectMenuStyles() {
    if (document.getElementById('unifiedListMenuStyles')) return;
    const style = document.createElement('style');
    style.id = 'unifiedListMenuStyles';
    style.textContent = \`
      .unified-list-menu {
        position: absolute;
        z-index: 1000;
        background: var(--card, #0a1122);
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        min-width: 220px;
        overflow: hidden;
        animation: fadeIn 0.15s ease-out;
      }
      .unified-list-menu .list-action {
        width: 100%;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: transparent;
        border: none;
        color: var(--white, #fff);
        font-size: 14px;
        cursor: pointer;
        text-align: left;
        transition: background 0.2s, color 0.2s;
      }
      .unified-list-menu .list-action:hover {
        background: rgba(255,255,255,0.1);
      }
      .unified-list-menu .list-action.active {
        color: var(--accent, #f59e0b);
        font-weight: 600;
      }
      .unified-list-menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999;
      }
    \`;
    document.head.appendChild(style);
  }

  async function openQuickListMenu(cardEl, itemId, mediaType) {
    if (activeMenuEl) {
      activeMenuEl.remove();
      const b = document.getElementById('unifiedListMenuBackdrop');
      if (b) b.remove();
    }
    
    const user = await ensureUser();
    if (!user) {
      showToast('Please sign in to manage lists', 'info');
      window.location.href = 'login.html';
      return;
    }
    
    injectMenuStyles();
    
    const backdrop = document.createElement('div');
    backdrop.id = 'unifiedListMenuBackdrop';
    backdrop.className = 'unified-list-menu-backdrop';
    document.body.appendChild(backdrop);
    
    const menu = document.createElement('div');
    menu.className = 'unified-list-menu';
    
    // Position menu near the button/card
    const rect = cardEl.getBoundingClientRect();
    let top = rect.top + window.scrollY + 40;
    let left = rect.right - 180;
    if (left < 10) left = 10;
    if (top + 200 > window.innerHeight + window.scrollY) top = rect.top + window.scrollY - 200;
    
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    
    const rows = QUICK_ROWS_BY_TYPE[mediaType] || [];
    
    // Load current status using ONLY list_items
    let statusMap = {};
    const client = await ensureClient();
    if (client) {
      const { data } = await client.from('list_items')
        .select('list_type')
        .eq('user_id', user.id)
        .eq('media_type', mediaType)
        .eq('item_id', String(itemId));
      if (data) {
        data.forEach(row => { statusMap[row.list_type] = true; });
      }
    }
    
    let html = '';
    rows.forEach(r => {
      const isActive = !!statusMap[r.key];
      html += \`
        <button class="list-action \${isActive ? 'active' : ''}" data-list="\${escapeHtml(r.key)}">
          <i class="\${escapeHtml(r.icon)}"></i> 
          <span>\${escapeHtml(r.label)}</span>
        </button>
      \`;
    });
    
    html += \`
      <div style="height:1px; background:rgba(255,255,255,0.1); margin: 4px 0;"></div>
      <button class="list-action" data-list="custom">
        <i class="fas fa-list"></i> <span>Custom Lists...</span>
      </button>
    \`;
    
    menu.innerHTML = html;
    document.body.appendChild(menu);
    activeMenuEl = menu;
    
    const closeMenu = () => {
      menu.remove();
      backdrop.remove();
      activeMenuEl = null;
    };
    
    backdrop.addEventListener('click', closeMenu);
    
    menu.querySelectorAll('.list-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const listType = btn.getAttribute('data-list');
        closeMenu();
        if (listType === 'custom') {
          openListsModal(itemId, mediaType);
        } else {
          // Toggle Quick List
          const isAdding = !statusMap[listType];
          await toggleQuickList(itemId, mediaType, listType, isAdding);
        }
      });
    });
  }
  
  async function toggleQuickList(itemId, mediaType, listType, isAdding) {
    const client = await ensureClient();
    const user = await ensureUser();
    if (!client || !user) return;
    
    const payload = {
      user_id: user.id,
      media_type: mediaType,
      item_id: String(itemId),
      list_type: listType
    };
    
    try {
      if (isAdding) {
        // ALWAYS use delete-then-insert to avoid 400 Bad Request / 23505 constraints natively
        await client.from('list_items').delete()
          .eq('user_id', user.id)
          .eq('media_type', mediaType)
          .eq('item_id', String(itemId))
          .eq('list_type', listType)
          .is('list_id', null);
          
        const { error } = await client.from('list_items').insert(payload);
        if (error) throw error;
        showToast('Added to list');
      } else {
        const { error } = await client.from('list_items').delete()
          .eq('user_id', user.id)
          .eq('media_type', mediaType)
          .eq('item_id', String(itemId))
          .eq('list_type', listType)
          .is('list_id', null);
        if (error) throw error;
        showToast('Removed from list', 'info');
      }
    } catch (err) {
      console.error('List toggle error:', err);
      showToast('Could not update list', 'error');
    }
  }

  // Export globally
  window.UnifiedListMenu = {
    openMenu: openQuickListMenu,
    openModal: openListsModal,
    toggleQuickList: toggleQuickList
  };
})();
