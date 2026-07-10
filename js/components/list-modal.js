// js/components/list-modal.js
// Shared "Add to List" modal component for all pages.
(function () {
  'use strict';

  /* ── CSS Injection ────────────────────────────────── */
  function injectModalStyles() {
    if (document.getElementById('listModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'listModalStyles';
    style.textContent = [
      '.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: none; align-items: center; justify-content: center; z-index: 3000; padding: 20px; }',
      '.modal.active { display: flex; }',
      '.modal-content { width: 100%; max-width: 520px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: var(--shadow); }',
      '.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }',
      '.modal-title { font-size: 18px; font-weight: 700; }',
      '.modal-close { background: none; border: none; color: var(--white); font-size: 22px; cursor: pointer; }',
      '.modal-list { display: grid; gap: 8px; max-height: 240px; overflow: auto; margin-bottom: 12px; }',
      '.modal-list-item { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }',
      '.modal-list-actions { display: inline-flex; gap: 6px; align-items: center; }',
      '.list-edit-btn { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--white); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }',
      '.list-edit-btn:hover { border-color: var(--accent); color: var(--accent); }',
      '.modal-list-item.active { border-color: var(--accent); color: var(--accent); background: rgba(245, 158, 11, 0.12); }',
      '.modal-input { display: flex; gap: 8px; margin-top: 8px; }',
      '.modal-input input { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: #0f1f40; color: var(--white); outline: none; }',
      '.icon-options { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }',
      '.icon-option { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--white); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }',
      '.icon-option.selected { border-color: var(--accent); color: var(--accent); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Escape key handler ───────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    var unifiedModal = document.getElementById('unifiedListsModal');
    if (unifiedModal && unifiedModal.classList.contains('active')) {
      unifiedModal.classList.remove('active');
      return;
    }

    var menuModal = document.getElementById('unifiedListMenuModal');
    if (menuModal && menuModal.parentNode) {
      menuModal.remove();
      return;
    }

    var itemMenu = document.getElementById('itemMenuModal');
    if (itemMenu && itemMenu.classList.contains('active')) {
      itemMenu.classList.remove('active');
      itemMenu.setAttribute('aria-hidden', 'true');
    }
  });

  /* ── Backdrop click to close modals ───────────────── */
  document.addEventListener('click', function (e) {
    var unifiedModal = document.getElementById('unifiedListsModal');
    if (unifiedModal && e.target === unifiedModal) {
      unifiedModal.classList.remove('active');
    }
    var menuModal = document.getElementById('unifiedListMenuModal');
    if (menuModal && e.target === menuModal) {
      menuModal.remove();
    }
  });

  /* ── Global toggle stubs ──────────────────────────── */
  window.toggleList = function (_listType, _nextSaved) {
    if (typeof window.openIndexStyleListMenu === 'function') {
      window.openIndexStyleListMenu(document.activeElement || document.body);
    }
  };

  window.toggleDefaultList = function (_arg) {
    if (typeof window.openIndexStyleListMenu === 'function') {
      window.openIndexStyleListMenu(document.activeElement || document.body);
    }
  };

  /* ── ListModal public API ─────────────────────────── */
  window.ListModal = {

    init: function (mediaType, options) {
      options = options || {};
      injectModalStyles();

      var bridgeCfg = {
        mediaType: mediaType,
        itemIdAttr: options.itemIdAttr || 'data-item-id',
        getVisibleItemIds: options.getVisibleItemIds || (function () {
          var id = options.itemId;
          return id ? [id] : [];
        }),
        getQuickStatusForItem: options.getQuickStatusForItem || null,
        getItemFromCard: options.getItemFromCard || (function () {
          return {
            mediaType: mediaType,
            itemId: options.itemId || null,
            title: options.title || '',
            subtitle: options.subtitle || '',
            image: options.image || ''
          };
        }),
        ensureClient: options.ensureClient || (function () {
          if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.ensureClient === 'function') {
            return window.ZO2Y_AUTH.ensureClient();
          }
          return null;
        }),
        getCurrentUser: options.getCurrentUser || (function () {
          if (window.ZO2Y_AUTH && typeof window.ZO2Y_AUTH.getUser === 'function') {
            return window.ZO2Y_AUTH.getUser();
          }
          return null;
        }),
        notify: options.notify || (function (msg, isErr) {
          if (typeof window.showNotification === 'function') {
            window.showNotification(msg, isErr ? 'error' : 'success');
          }
        })
      };

      if (typeof window.initIndexStyleListMenu === 'function') {
        window.initIndexStyleListMenu(bridgeCfg);
      }

      if (options.buttonSelector) {
        var btn = document.querySelector(options.buttonSelector);
        if (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openIndexStyleListMenu === 'function') {
              var target = document.querySelector('[data-item-id="' + (options.itemId || '') + '"]') || document.body;
              window.openIndexStyleListMenu(target);
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
            var fakeCard = document.createElement('div');
            fakeCard.setAttribute('data-item-id', options.itemId || '');
            fakeCard.style.position = 'absolute';
            var rect = menuBtn.getBoundingClientRect();
            fakeCard.style.top = (rect.top + window.scrollY) + 'px';
            fakeCard.style.left = (rect.left + window.scrollX) + 'px';
            document.body.appendChild(fakeCard);
            if (typeof window.openIndexStyleListMenu === 'function') {
              window.openIndexStyleListMenu(fakeCard, function () {
                fakeCard.remove();
              });
            }
          });
        }
      }

      return bridgeCfg;
    },

    initBridge: function (config) {
      injectModalStyles();
      if (typeof window.initIndexStyleListMenu === 'function') {
        window.initIndexStyleListMenu(config);
      }
    },

    open: function (itemId, mediaType) {
      if (typeof window.openIndexStyleListMenu === 'function') {
        var el = document.querySelector('[data-item-id="' + itemId + '"]') || document.body;
        window.openIndexStyleListMenu(el);
      }
    }
  };
})();
