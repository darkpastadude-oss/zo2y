// js/components/list-modal.js
// Single source of truth for ALL list modals across the entire site.
(function () {
  'use strict';

  var QUICK_ROWS_BY_TYPE = {
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

  var MEDIA_LIST_ICONS = {
    movie: 'fas fa-film', tv: 'fas fa-tv', anime: 'fas fa-dragon',
    game: 'fas fa-gamepad', book: 'fas fa-book', music: 'fas fa-music',
    song: 'fas fa-music', artist: 'fas fa-microphone', travel: 'fas fa-earth-americas',
    fashion: 'fas fa-shirt', food: 'fas fa-burger', car: 'fas fa-car',
    sports: 'fas fa-futbol', team: 'fas fa-users'
  };

  var _config = { mediaType: 'movie' };
  var _modalSelectedLists = new Set();
  var _customLists = [];
  var _selectedIcon = '';
  var _activeItem = null;
  var _activeMenuEl = null;
  var _supabaseClient = null;
  var _currentUser = null;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, type) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type || 'success');
    } else {
      var el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.top = '16px';
      el.style.right = '16px';
      el.style.zIndex = '999999';
      el.style.padding = '12px 24px';
      el.style.borderRadius = '8px';
      el.style.background = (type || '') === 'error' ? 'var(--error-bg, #ef4444)' : 'var(--success-bg, #10b981)';
      el.style.color = '#fff';
      el.style.fontSize = '14px';
      el.style.fontWeight = '500';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 3000);
    }
  }

  async function ensureClient() {
    if (_supabaseClient) return _supabaseClient;
    if (_config && typeof _config.ensureClient === 'function') {
      try { _supabaseClient = await _config.ensureClient(); } catch (_) {}
      if (_supabaseClient) return _supabaseClient;
    }
    try {
      if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.ensureClient === 'function') {
        _supabaseClient = await window.ZO2Y_AUTH.ensureClient();
      } else if (window.__ZO2Y_ENSURE_SUPABASE_CLIENT) {
        _supabaseClient = window.__ZO2Y_ENSURE_SUPABASE_CLIENT();
      } else if (window.supabase) {
        _supabaseClient = window.supabase;
      }
    } catch (_) {}
    return _supabaseClient;
  }

  async function ensureUser() {
    if (_currentUser && _currentUser.id) return _currentUser;
    if (_config && typeof _config.getCurrentUser === 'function') {
      try { _currentUser = _config.getCurrentUser(); } catch (_) {}
    }
    if (!_currentUser || !_currentUser.id) {
      if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getUser === 'function') {
        try { _currentUser = window.ZO2Y_AUTH.getUser(); } catch (_) {}
      }
    }
    if (!_currentUser || !_currentUser.id) {
      try {
        var client = await ensureClient();
        if (client && client.auth) {
          var sessionResult = await client.auth.getSession();
          if (sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.user) {
            _currentUser = sessionResult.data.session.user;
          }
        }
      } catch (_) {}
    }
    return _currentUser;
  }

  async function loadCustomLists(mediaType) {
    var client = await ensureClient();
    var user = await ensureUser();
    if (!client || !user || !window.ListUtils) return [];
    return await window.ListUtils.loadCustomLists(client, user.id, mediaType || _config.mediaType);
  }

  function ensureMenuModal() {
    if (document.getElementById('unifiedListMenuModal')) return false;
    if (document.getElementById('itemMenuModal')) return false;
    var html =
      '<div class="menu-modal" id="unifiedListMenuModal" aria-hidden="true">' +
        '<div class="menu-modal-content menu-modal-fly-up">' +
          '<div class="menu-modal-header">' +
            '<h3 id="menuModalTitle">Add to List</h3>' +
            '<button class="menu-modal-close" id="unifiedListMenuCloseBtn" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="menu-modal-body" id="menuModalBody">' +
            '<div class="menu-quick-lists" id="menuQuickLists"></div>' +
            '<div class="menu-custom-section">' +
              '<div class="menu-custom-header"><span>your custom lists</span></div>' +
              '<div class="menu-custom-lists" id="unifiedListMenuCustomLists"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstElementChild);
    return true;
  }

  function ensureListsModal() {
    if (document.getElementById('unifiedListsModal')) return;
    var html =
      '<div class="modal" id="unifiedListsModal">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<div class="modal-title">Custom Lists</div>' +
            '<button class="modal-close" id="unifiedListsCloseBtn">&times;</button>' +
          '</div>' +
          '<div class="modal-list" id="unifiedListsContainer"></div>' +
          '<div class="modal-input">' +
            '<input type="text" id="unifiedListsName" placeholder="New list name..." maxlength="50">' +
            '<button class="btn" id="unifiedListsCreateBtn">Create</button>' +
          '</div>' +
          '<div class="icon-options" id="unifiedListsIconOptions">' +
            '<button class="icon-option selected" data-icon="fas fa-list"><i class="fas fa-list"></i></button>' +
            '<button class="icon-option" data-icon="fas fa-heart"><i class="fas fa-heart"></i></button>' +
            '<button class="icon-option" data-icon="fas fa-star"><i class="fas fa-star"></i></button>' +
            '<button class="icon-option" data-icon="fas fa-bookmark"><i class="fas fa-bookmark"></i></button>' +
            '<button class="icon-option" data-icon="fas fa-eye"><i class="fas fa-eye"></i></button>' +
          '</div>' +
          '<div style="margin-top:20px; display:flex; justify-content:flex-end; gap:8px;">' +
            '<button class="btn" id="unifiedListsSaveBtn">Save Changes</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    var temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp.firstElementChild);

    document.getElementById('unifiedListsCloseBtn').addEventListener('click', closeListsModal);
    document.getElementById('unifiedListsSaveBtn').addEventListener('click', saveListChanges);
    document.getElementById('unifiedListsCreateBtn').addEventListener('click', createList);

    var icons = document.querySelectorAll('#unifiedListsIconOptions .icon-option');
    icons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        icons.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        _selectedIcon = btn.getAttribute('data-icon') || 'fas fa-list';
      });
    });
  }

  async function openQuickListMenu(cardEl, itemId, mediaType) {
    if (_activeMenuEl) {
      _activeMenuEl.remove();
      _activeMenuEl = null;
    }

    var user = await ensureUser();
    if (!user) {
      showToast('Please sign in to manage lists', 'info');
      window.location.href = 'login.html';
      return;
    }

    ensureMenuModal();
    var menu = document.getElementById('unifiedListMenuModal');
    var existingModal = document.getElementById('itemMenuModal');
    if (existingModal) existingModal.remove();
    if (!menu) {
      showToast('Could not create menu', 'error');
      return;
    }

    menu.classList.add('active');
    menu.setAttribute('aria-hidden', 'false');
    _activeMenuEl = menu;

    var statusMap = {};
    var client = await ensureClient();
    if (client) {
      var statusResult = await client.from('list_items')
        .select('list_type')
        .eq('user_id', user.id)
        .eq('media_type', mediaType)
        .eq('item_id', String(itemId));
      if (statusResult && statusResult.data) {
        statusResult.data.forEach(function (row) { statusMap[row.list_type] = true; });
      }
    }

    var titleStr = '';
    if (_config && _config.title) {
      titleStr = _config.title;
    } else if (cardEl) {
      var titleEl = cardEl.querySelector('.card-title, .title, .media-title, h2, h3');
      if (titleEl) titleStr = titleEl.textContent.trim();
      if (!titleStr) titleStr = cardEl.getAttribute('data-title') || cardEl.getAttribute('title') || '';
      if (!titleStr) {
        var innerImg = cardEl.querySelector('img');
        if (innerImg) titleStr = innerImg.getAttribute('alt') || '';
      }
    }
    if (!titleStr) {
      var h1 = document.querySelector('h1');
      if (h1) titleStr = h1.textContent.trim();
    }
    if (!titleStr) titleStr = mediaType || '';

    var rows = QUICK_ROWS_BY_TYPE[mediaType] || [];

    document.getElementById('menuModalTitle').textContent = titleStr;

    var quickListsEl = document.getElementById('menuQuickLists');
    quickListsEl.innerHTML = '';
    rows.forEach(function (r) {
      var isActive = !!statusMap[r.key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-quick-item' + (isActive ? ' active' : '');
      btn.setAttribute('data-list', r.key);
      btn.setAttribute('aria-busy', 'false');
      btn.innerHTML = '<div class="menu-quick-left"><i class="' + escapeHtml(r.icon) + '"></i><span>' + escapeHtml(r.label) + '</span></div><span class="menu-quick-state">' + (isActive ? 'saved' : 'add') + '</span>';
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        var listType = btn.getAttribute('data-list');
        var wasActive = btn.classList.contains('active');
        var nextActive = !wasActive;
        btn.classList.toggle('active', nextActive);
        btn.querySelector('.menu-quick-state').textContent = nextActive ? 'saved' : 'add';
        await toggleQuickList(itemId, mediaType, listType, nextActive, cardEl);
      });
      quickListsEl.appendChild(btn);
    });

    var customContainer = document.getElementById('unifiedListMenuCustomLists');
    customContainer.innerHTML = '<div style="color:var(--muted,#8ca3c7);font-size:13px;padding:4px 0;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    loadCustomListsForMenu(mediaType, itemId, customContainer, cardEl);

    var closeMenu = function () {
      if (_activeMenuEl) {
        _activeMenuEl.classList.remove('active');
        _activeMenuEl.setAttribute('aria-hidden', 'true');
        _activeMenuEl = null;
      }
    };

    menu.addEventListener('click', function (e) {
      if (e.target === menu) closeMenu();
    });

    var closeBtn = document.getElementById('unifiedListMenuCloseBtn');
    if (closeBtn) {
      var newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener('click', closeMenu);
    }
  }

  async function loadCustomListsForMenu(mediaType, itemId, container, cardEl) {
    try {
      var lists = await loadCustomLists(mediaType);
      var client = await ensureClient();
      var user = await ensureUser();
      if (!lists || !lists.length) {
        container.innerHTML = '<div style="color:var(--muted,#8ca3c7);font-size:13px;padding:4px 0;">No custom lists yet.</div>';
        return;
      }
      var listIds = lists.map(function (l) { return l.id; });
      var membership = new Set();
      if (client && window.ListUtils) {
        membership = await window.ListUtils.loadCustomListMembership(client, user.id, mediaType, itemId, listIds);
      }
      container.innerHTML = '';
      lists.forEach(function (list) {
        var isInList = membership.has(list.id);
        var btn = document.createElement('button');
        btn.className = 'menu-custom-item' + (isInList ? ' active' : '');
        var iconHtml = window.ListUtils ? window.ListUtils.renderListIcon(list.icon, 'fas fa-list') : '<i class="fas fa-list"></i>';
        btn.innerHTML = '<div class="menu-custom-left">' + iconHtml + '<span>' + escapeHtml(list.name || list.title) + '</span></div><span class="menu-custom-state">' + (isInList ? 'saved' : 'add') + '</span>';
        btn.addEventListener('click', async function () {
          btn.setAttribute('aria-busy', 'true');
          try {
            if (isInList) {
              await window.ListUtils.removeItemFromList(client, user.id, mediaType, itemId, list.id);
              btn.classList.remove('active');
              btn.querySelector('.menu-custom-state').textContent = 'add';
              membership.delete(list.id);
            } else {
              var itemPayload = null;
              if (cardEl) {
                var cardImage = cardEl.getAttribute('data-image') || cardEl.getAttribute('data-list-image') || '';
                var cardTitle = cardEl.getAttribute('data-title') || '';
                var cardHref = cardEl.getAttribute('data-href') || '';
                if (!cardTitle) {
                  var titleEl = cardEl.querySelector('.card-title, .title, .media-title, h2, h3');
                  if (titleEl) cardTitle = titleEl.textContent.trim();
                }
                if (!cardTitle) {
                  var innerImg = cardEl.querySelector('img');
                  if (innerImg) cardTitle = innerImg.getAttribute('alt') || '';
                }
                if (cardImage || cardTitle) {
                  itemPayload = { name: cardTitle, image: cardImage, url: cardHref };
                }
              }
              await window.ListUtils.addItemToList(client, user.id, mediaType, itemId, list.id, itemPayload);
              btn.classList.add('active');
              btn.querySelector('.menu-custom-state').textContent = 'saved';
              membership.add(list.id);
            }
          } catch (err) {
            console.error('Custom list toggle error:', err);
            showToast('Could not update list', 'error');
          }
          btn.setAttribute('aria-busy', 'false');
        });
        container.appendChild(btn);
      });
    } catch (err) {
      console.error('Failed to load custom lists:', err);
      container.innerHTML = '<div style="color:var(--muted,#8ca3c7);font-size:13px;padding:4px 0;">Error loading lists.</div>';
    }
  }

  async function toggleQuickList(itemId, mediaType, listType, isAdding, cardEl) {
    var client = await ensureClient();
    var user = await ensureUser();
    if (!client || !user) return;

    var cardImage = '';
    var cardTitle = '';
    var cardHref = '';
    if (cardEl) {
      cardImage = cardEl.getAttribute('data-image') || cardEl.getAttribute('data-list-image') || '';
      cardTitle = cardEl.getAttribute('data-title') || '';
      cardHref = cardEl.getAttribute('data-href') || '';
      if (!cardImage) {
        var imgEl = cardEl.querySelector('.card-media img, img');
        if (imgEl) cardImage = imgEl.getAttribute('src') || '';
      }
      if (!cardTitle) {
        var titleEl = cardEl.querySelector('.card-name, .card-title, .title, .media-title, h2, h3');
        if (titleEl) cardTitle = titleEl.textContent.trim();
      }
      if (!cardTitle) {
        var innerImg = cardEl.querySelector('img');
        if (innerImg) cardTitle = innerImg.getAttribute('alt') || '';
      }
    }

    var payload = {
      user_id: user.id,
      media_type: mediaType,
      item_id: String(itemId),
      list_type: String(listType).toLowerCase(),
      title: cardTitle || _config.title || 'Untitled',
      subtitle: _config.subtitle || '',
      image_url: cardImage || _config.image || '/images/fallback/book.svg'
    };

    try {
      if (isAdding) {
        var insertResult = await client.from('list_items').upsert(payload, { onConflict: 'ux_list_items_default', ignoreDuplicates: false });
        if (insertResult && insertResult.error) {
          if (String(insertResult.error.code || '') === '23505') {
            // Already in list — treat as success
          } else {
            throw insertResult.error;
          }
        }
        if (window.ListUtils && typeof window.ListUtils.ensureBookRecord === 'function' && mediaType === 'book') {
          await window.ListUtils.ensureBookRecord(client, { id: String(itemId), title: payload.title, image: payload.image_url, authors: payload.subtitle || _config.subtitle || '' });
        }
        if (cardEl && window.ListUtils) {
          window.ListUtils.cacheSavedItemMetadata(mediaType, itemId, { name: cardTitle || payload.title, image: cardImage || payload.image_url, url: cardHref });
        }
        if (mediaType === 'book' && typeof window.bustBookCache === 'function') {
          window.bustBookCache(String(itemId));
        }
        showToast('Added to list');
      } else {
        var deleteResult = await client.from('list_items').delete()
          .eq('user_id', user.id)
          .eq('media_type', mediaType)
          .eq('item_id', String(itemId))
          .eq('list_type', String(listType).toLowerCase())
          .is('list_id', null);
        if (deleteResult && deleteResult.error) throw deleteResult.error;
        if (mediaType === 'book' && typeof window.bustBookCache === 'function') {
          window.bustBookCache(String(itemId));
        }
        if (mediaType === 'book' && window.ListUtils) {
          window.ListUtils.removeCachedSavedItem && window.ListUtils.removeCachedSavedItem(mediaType, itemId);
        }
        showToast('Removed from list', 'info');
      }
    } catch (err) {
      console.error('List toggle error:', err);
      showToast('Could not update list', 'error');
    }
  }

  // Custom Lists Modal
  async function openListsModal(itemId, mediaType, itemPayload) {
    var user = await ensureUser();
    if (!user) {
      showToast('Please sign in to manage lists', 'info');
      window.location.href = 'login.html';
      return;
    }
    _activeItem = { itemId: itemId, mediaType: mediaType, itemPayload: itemPayload || null };

    ensureListsModal();
    var modal = document.getElementById('unifiedListsModal');
    var container = document.getElementById('unifiedListsContainer');
    if (!modal || !container) return;

    container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    modal.classList.add('active');

    _customLists = await loadCustomLists(mediaType);
    var listIds = _customLists.map(function (l) { return l.id; });

    var client = await ensureClient();
    _modalSelectedLists = window.ListUtils && client
      ? await window.ListUtils.loadCustomListMembership(client, user.id, mediaType, itemId, listIds)
      : new Set();

    container.innerHTML = '';
    if (!_customLists.length) {
      container.innerHTML = '<div class="chip" style="margin:20px;">No custom lists yet.</div>';
    } else {
      _customLists.forEach(function (list) {
        var item = document.createElement('div');
        item.className = 'modal-list-item' + (_modalSelectedLists.has(list.id) ? ' active' : '');
        var iconHtml = window.ListUtils ? window.ListUtils.renderListIcon(list.icon, 'fas fa-list') : '<i class="fas fa-list"></i>';
        item.innerHTML = '<span>' + iconHtml + ' ' + escapeHtml(list.name || list.title) + '</span>' +
          '<span class="modal-list-actions" style="display:inline-flex; align-items:center; gap:6px;">' +
            '<span>' + (_modalSelectedLists.has(list.id) ? 'Saved' : 'Add') + '</span>' +
            '<button class="list-edit-btn" aria-label="Rename list" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:6px; padding:4px 8px; cursor:pointer;"><i class="fas fa-pen"></i></button>' +
          '</span>';
        item.onclick = function () {
          if (_modalSelectedLists.has(list.id)) {
            _modalSelectedLists.delete(list.id);
          } else {
            _modalSelectedLists.add(list.id);
          }
          item.classList.toggle('active');
          item.querySelector('.modal-list-actions span').textContent = _modalSelectedLists.has(list.id) ? 'Saved' : 'Add';
        };
        var editBtn = item.querySelector('.list-edit-btn');
        if (editBtn) {
          editBtn.onclick = function (e) {
            e.stopPropagation();
            renameList(list.id, list.name || list.title);
          };
        }
        container.appendChild(item);
      });
    }
  }

  function closeListsModal() {
    var modal = document.getElementById('unifiedListsModal');
    if (modal) modal.classList.remove('active');
  }

  async function saveListChanges() {
    if (!_activeItem) return;
    var client = await ensureClient();
    var user = await ensureUser();
    if (!client || !user) return;

    if (window.ListUtils) {
      var saveBtn = document.getElementById('unifiedListsSaveBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }
      await window.ListUtils.saveCustomListChanges(
        client,
        user.id,
        _activeItem.mediaType,
        _activeItem.itemId,
        Array.from(_modalSelectedLists),
        _activeItem.itemPayload || null
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
    if (!_activeItem) return;
    var client = await ensureClient();
    var user = await ensureUser();
    if (!client || !user) return;

    var input = document.getElementById('unifiedListsName');
    if (!input || !input.value.trim()) return;
    var title = input.value.trim();

    var data = window.ListUtils
      ? await window.ListUtils.createCustomList(client, user.id, _activeItem.mediaType, {
          title: title,
          icon: _selectedIcon || MEDIA_LIST_ICONS[_activeItem.mediaType] || 'fas fa-list'
        })
      : null;

    if (!data) {
      showToast('Could not create list', 'error');
      return;
    }

    input.value = '';
    if (data.id) {
      _modalSelectedLists.add(data.id);
    }
    openListsModal(_activeItem.itemId, _activeItem.mediaType, _activeItem.itemPayload);
  }

  async function renameList(listId, currentTitle) {
    if (!_activeItem) return;
    var nextTitle = prompt('Rename list', currentTitle || '');
    if (!nextTitle || !nextTitle.trim()) return;
    var client = await ensureClient();
    var user = await ensureUser();
    if (!client || !user) return;

    var ok = window.ListUtils
      ? await window.ListUtils.renameCustomList(client, user.id, _activeItem.mediaType, listId, nextTitle.trim())
      : false;

    if (!ok) {
      showToast('Could not rename list', 'error');
      return;
    }
    openListsModal(_activeItem.itemId, _activeItem.mediaType, _activeItem.itemPayload);
  }

  // Global bridge API
  window.openIndexStyleListMenu = function (triggerEl) {
    var card = triggerEl.closest('.card, .media-card, .list-item, .rail-card, .poster-card, [data-item-id], [data-id]') || triggerEl;
    var itemId = card.getAttribute('data-item-id') || card.getAttribute('data-id') || card.getAttribute('data-list-id');
    var mediaType = card.getAttribute('data-media-type') || card.getAttribute('data-type') || card.getAttribute('data-kind');

    if (!itemId && _config && _config.itemId) itemId = _config.itemId;
    if (!mediaType && _config && _config.mediaType) mediaType = _config.mediaType;

    if (!itemId) {
      console.warn('Cannot open list menu: itemId not found.');
      return;
    }
    if (!mediaType) mediaType = 'movie';

    openQuickListMenu(card, itemId, mediaType);
  };

  window.initIndexStyleListMenu = function () {};

  window.toggleList = function () {
    if (typeof window.openIndexStyleListMenu === 'function') {
      window.openIndexStyleListMenu(document.activeElement || document.body);
    }
  };

  window.toggleDefaultList = function () {
    if (typeof window.openIndexStyleListMenu === 'function') {
      window.openIndexStyleListMenu(document.activeElement || document.body);
    }
  };

  // Keyboard escape
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var unifiedModal = document.getElementById('unifiedListsModal');
    if (unifiedModal && unifiedModal.classList.contains('active')) {
      unifiedModal.classList.remove('active');
      return;
    }
    var menuModal = document.getElementById('unifiedListMenuModal');
    if (menuModal && menuModal.classList.contains('active')) {
      menuModal.classList.remove('active');
      menuModal.setAttribute('aria-hidden', 'true');
      _activeMenuEl = null;
      return;
    }
    var itemMenu = document.getElementById('itemMenuModal');
    if (itemMenu && itemMenu.classList.contains('active')) {
      itemMenu.classList.remove('active');
      itemMenu.setAttribute('aria-hidden', 'true');
    }
  });

  // Backdrop clicks
  document.addEventListener('click', function (e) {
    var unifiedModal = document.getElementById('unifiedListsModal');
    if (unifiedModal && e.target === unifiedModal) {
      unifiedModal.classList.remove('active');
    }
    var menuModal = document.getElementById('unifiedListMenuModal');
    if (menuModal && e.target === menuModal) {
      menuModal.classList.remove('active');
      menuModal.setAttribute('aria-hidden', 'true');
      _activeMenuEl = null;
    }
  });

  // Public API
  window.ListModal = {
    init: function (mediaType, options) {
      options = options || {};
      _config = {
        mediaType: mediaType,
        itemId: options.itemId || null,
        title: options.title || '',
        subtitle: options.subtitle || '',
        image: options.image || '',
        itemIdAttr: options.itemIdAttr || 'data-item-id',
        getVisibleItemIds: options.getVisibleItemIds || null,
        getQuickStatusForItem: options.getQuickStatusForItem || null,
        getItemFromCard: options.getItemFromCard || null,
        ensureClient: options.ensureClient || null,
        getCurrentUser: options.getCurrentUser || null,
        notify: options.notify || null
      };

      if (options.buttonSelector) {
        var btn = document.querySelector(options.buttonSelector);
        if (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (_config.itemId) {
              openQuickListMenu(btn, _config.itemId, _config.mediaType);
            } else {
              window.openIndexStyleListMenu(btn);
            }
          });
        }
      }

      if (options.menuBtnSelector) {
        var menuBtn = document.querySelector(options.menuBtnSelector);
        if (menuBtn) {
          menuBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (_config.itemId) {
              openQuickListMenu(menuBtn, _config.itemId, _config.mediaType);
            } else {
              window.openIndexStyleListMenu(menuBtn);
            }
          });
        }
      }
    },

    initBridge: function (config) {
      config = config || {};
      _config = {
        mediaType: config.mediaType || 'movie',
        itemId: config.itemId || null,
        title: config.title || '',
        subtitle: config.subtitle || '',
        image: config.image || '',
        itemIdAttr: config.itemIdAttr || 'data-item-id',
        getVisibleItemIds: config.getVisibleItemIds || null,
        getQuickStatusForItem: config.getQuickStatusForItem || null,
        getItemFromCard: config.getItemFromCard || null,
        ensureClient: config.ensureClient || null,
        getCurrentUser: config.getCurrentUser || null,
        notify: config.notify || null
      };
    },

    open: function (itemId, mediaType) {
      var el = document.querySelector('[data-item-id="' + itemId + '"]') || document.body;
      openQuickListMenu(el, itemId, mediaType || _config.mediaType);
    }
  };
})();
