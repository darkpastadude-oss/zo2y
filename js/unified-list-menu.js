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
    
    const card = triggerEl.closest('.card, .media-card, .list-item, .rail-card, .poster-card, [data-item-id], [data-id]') || triggerEl;
    
    let itemId = card.getAttribute('data-item-id') || card.getAttribute('data-id') || card.getAttribute('data-list-id');
    let mediaType = card.getAttribute('data-media-type') || card.getAttribute('data-type') || card.getAttribute('data-kind');

    if (!itemId) {
      const btn = triggerEl.closest('[data-item-id], [data-id]');
      if (btn) itemId = btn.getAttribute('data-item-id') || btn.getAttribute('data-id');
    }

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
      return `<img src="${escapeHtml(icon)}" class="tier-icon-img" alt="icon" style="width:20px;height:20px;object-fit:cover;border-radius:4px;">`;
    }
    return `<i class="${escapeHtml(icon)}"></i>`;
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
        item.innerHTML = `
          <span>${renderListIcon(list.icon)} ${escapeHtml(list.name || list.title)}</span>
          <span class="modal-list-actions" style="display:inline-flex; align-items:center; gap:6px;">
            <span>${modalSelectedLists.has(list.id) ? 'Saved' : 'Add'}</span>
            <button class="list-edit-btn" aria-label="Rename list" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:4px 8px; cursor:pointer;"><i class="fas fa-pen"></i></button>
          </span>
        `;
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
    style.textContent = `
      .list-menu {
        position: fixed;
        z-index: 4500;
        background: var(--card, #132347);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
        border-radius: 16px;
        padding: 14px 14px 12px;
        width: min(92vw, 320px);
        max-height: 70vh;
        overflow-y: auto;
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.4);
        animation: menuModalFlyUp 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes menuModalFlyUp {
        from { opacity: 0; transform: translate(-50%, -50%) translateY(12px) scale(0.97); }
        to { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
      }
      .list-menu-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2px 10px;
      }
      .list-menu-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--white, #fff);
        margin: 0;
        line-height: 1.2;
      }
      .list-menu-close {
        background: transparent;
        border: none;
        color: var(--muted, #8ca3c7);
        font-size: 18px;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .list-menu-close:hover {
        color: var(--white, #fff);
      }
      .list-menu-body {
        padding: 0;
      }
      .list-menu-quick-lists {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .list-menu .list-action {
        width: 100%;
        border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
        background: transparent;
        color: var(--text, #fff);
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        transition: border-color 0.18s, background-color 0.18s;
        min-height: 42px;
        font: inherit;
        text-align: left;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .list-menu .list-action:last-child { margin-bottom: 0; }
      .list-menu .list-action:hover {
        border-color: var(--accent, #f59e0b);
      }
      .list-menu .list-action:active {
        transform: scale(0.985);
      }
      .list-menu .list-action.active {
        border-color: var(--accent, #f59e0b);
        background: rgba(245, 158, 11, 0.12);
      }
      .list-action-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .list-action-left i {
        width: 18px;
        color: var(--accent, #f59e0b);
        font-size: 14px;
        text-align: center;
      }
      .list-action-left span {
        font-weight: 500;
        color: var(--white, #fff);
        font-size: 14px;
      }
      .list-action-state {
        color: var(--accent, #f59e0b);
        font-size: 13px;
        font-weight: 600;
      }
      .list-menu-custom-section {
        border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        margin-top: 10px;
        padding-top: 10px;
      }
      .list-menu-custom-header {
        color: var(--muted, #8ca3c7);
        font-size: 13px;
        margin-bottom: 8px;
      }
      .list-menu-custom-lists {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .unified-list-menu-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(6, 12, 28, 0.55);
        z-index: 4499;
      }
    `;
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
    backdrop.className = 'unified-list-menu-backdrop list-menu-backdrop active';
    document.body.appendChild(backdrop);
    
    const menu = document.createElement('div');
    menu.className = 'list-menu';
    
    // Center menu in viewport
    menu.style.top = '50%';
    menu.style.left = '50%';
    menu.style.transform = 'translate(-50%, -50%)';
    
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
    
    let titleStr = '';
    if (cardEl) {
      const titleEl = cardEl.querySelector('.card-title, .title, .media-title, h2, h3');
      if (titleEl) titleStr = titleEl.textContent.trim();
      if (!titleStr) titleStr = cardEl.getAttribute('data-title') || cardEl.getAttribute('title') || '';
      if (!titleStr) {
        const inner = cardEl.querySelector('img');
        if (inner) titleStr = inner.getAttribute('alt') || '';
      }
    }
    if (!titleStr) {
      const h1 = document.querySelector('h1');
      if (h1) titleStr = h1.textContent.trim();
    }
    
    let html = '';
    html += `<div class="list-menu-header">`;
    html += `<div class="list-menu-title">${escapeHtml(titleStr || 'Add to List')}</div>`;
    html += `<button class="list-menu-close" id="unifiedListMenuCloseBtn" aria-label="Close">&times;</button>`;
    html += `</div>`;
    
    rows.forEach(r => {
      const isActive = !!statusMap[r.key];
      html += `
        <button class="list-action ${isActive ? 'active' : ''}" data-list="${escapeHtml(r.key)}" aria-busy="false">
          <div class="list-action-left"><i class="${escapeHtml(r.icon)}"></i><span>${escapeHtml(r.label)}</span></div>
          <span class="list-action-state">${isActive ? 'Saved' : 'Add'}</span>
        </button>
      `;
    });
    
    html += `<div class="list-menu-custom-section">`;
    html += `<div class="list-menu-custom-header">your custom lists</div>`;
    html += `<div class="list-menu-custom-lists" id="unifiedListMenuCustomLists"></div>`;
    html += `</div>`;
    
    menu.innerHTML = html;
    document.body.appendChild(menu);
    activeMenuEl = menu;
    
    // Load and render custom lists
    (async () => {
      const customContainer = menu.querySelector('#unifiedListMenuCustomLists');
      if (!customContainer) return;
      try {
        const lists = await loadCustomLists(mediaType);
        if (!lists.length) {
          customContainer.innerHTML = '<div style="color:var(--muted,#8ca3c7);font-size:13px;padding:4px 0;">No custom lists yet.</div>';
          return;
        }
        const listIds = lists.map(l => l.id);
        const membership = client
          ? await window.ListUtils.loadCustomListMembership(client, user.id, mediaType, itemId, listIds)
          : new Set();
        customContainer.innerHTML = '';
        lists.forEach(list => {
          const isInList = membership.has(list.id);
          const btn = document.createElement('button');
          btn.className = 'list-action' + (isInList ? ' active' : '');
          btn.innerHTML = `
            <div class="list-action-left">${renderListIcon(list.icon)}<span>${escapeHtml(list.name || list.title)}</span></div>
            <span class="list-action-state">${isInList ? 'Saved' : 'Add'}</span>
          `;
          btn.addEventListener('click', async () => {
            btn.setAttribute('aria-busy', 'true');
            try {
              if (isInList) {
                await window.ListUtils.removeItemFromList(client, user.id, mediaType, itemId, list.id);
                btn.classList.remove('active');
                btn.querySelector('.list-action-state').textContent = 'Add';
              } else {
                await window.ListUtils.addItemToList(client, user.id, mediaType, itemId, list.id);
                btn.classList.add('active');
                btn.querySelector('.list-action-state').textContent = 'Saved';
              }
            } catch (err) {
              console.error('Custom list toggle error:', err);
              showToast('Could not update list', 'error');
            }
            btn.setAttribute('aria-busy', 'false');
          });
          customContainer.appendChild(btn);
        });
      } catch (err) {
        console.error('Failed to load custom lists:', err);
      }
    })();
    
    const closeMenu = () => {
      menu.remove();
      backdrop.remove();
      activeMenuEl = null;
    };
    
    backdrop.addEventListener('click', closeMenu);
    
    const closeBtn = document.getElementById('unifiedListMenuCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    const headerEl = menu.querySelector('.list-menu-header');
    if (headerEl) headerEl.addEventListener('click', (e) => { if (e.target === headerEl) closeMenu(); });
    
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
