(() => {
  const isMobileLike = window.matchMedia('(max-width: 900px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const path = window.location.pathname || '/';
  const base = path === '/' ? 'index.html' : path.split('/').pop();
  const pageKey = String(base || 'index.html').replace(/\.html?$/i, '').toLowerCase();

  document.body?.classList.add('app-booting');
  if (document.body) {
    document.body.dataset.zo2yPage = pageKey;
  }
  if (isMobileLike) {
    document.documentElement.classList.add('mobile-webapp');
    document.body?.classList.add('mobile-webapp');
  }

  const loadLine = document.createElement('div');
  loadLine.id = 'appLoadLine';
  document.documentElement.appendChild(loadLine);
  document.body?.classList.add('app-loading');

  const LIST_MENU_SELECTOR = '.list-menu, .rail-menu, .menu';
  const LIST_MODAL_SELECTOR = '.modal[id*="ListsModal"], #customListsModal, #actionsModal';
  const NATIVE_MENU_BACKDROP_SELECTOR = '.list-menu-backdrop.active, .rail-menu-backdrop.active';
  let popupObserver = null;
  let pendingMutationRefreshMenus = false;
  let pendingMutationRefreshModals = false;
  let pendingMutationSync = false;
  let mutationFlushScheduled = false;

  const ensurePopupBackdrop = () => {
    if (!document.body) return null;
    let backdrop = document.getElementById('zo2yPopupBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'zo2yPopupBackdrop';
      backdrop.className = 'zo2y-popup-backdrop';
      document.body.appendChild(backdrop);
    }
    return backdrop;
  };

  const closeModalNode = (modalNode) => {
    if (!modalNode) return;
    modalNode.classList.remove('active');
    modalNode.classList.remove('open');
    if (modalNode.hasAttribute('aria-hidden')) {
      modalNode.setAttribute('aria-hidden', 'true');
    }
  };

  const closeAllPopupMenus = () => {
    document.querySelectorAll('.list-menu.open, .rail-menu.open, .menu.open').forEach((menu) => {
      menu.classList.remove('open');
    });
    document.querySelectorAll('.card.menu-open').forEach((card) => {
      card.classList.remove('menu-open');
    });
    document.querySelectorAll('.list-menu-backdrop.active, .rail-menu-backdrop.active').forEach((backdrop) => {
      backdrop.classList.remove('active');
    });
    const popupBackdrop = document.getElementById('zo2yPopupBackdrop');
    if (popupBackdrop) popupBackdrop.classList.remove('active');
  };

  const closeAllListModals = () => {
    document.querySelectorAll('.modal[id*="ListsModal"].active, #customListsModal.active, #actionsModal.active')
      .forEach((modal) => closeModalNode(modal));
  };

  const syncPopupState = () => {
    const hasOpenMenu = !!document.querySelector('.list-menu.open, .rail-menu.open, .menu.open');
    const hasOpenModal = !!document.querySelector('.modal[id*="ListsModal"].active, #customListsModal.active, #actionsModal.active');
    const hasNativeBackdrop = !!document.querySelector(NATIVE_MENU_BACKDROP_SELECTOR);
    const popupBackdrop = ensurePopupBackdrop();

    if (popupBackdrop) {
      if (hasOpenMenu && !hasNativeBackdrop) {
        popupBackdrop.classList.add('active');
      } else {
        popupBackdrop.classList.remove('active');
      }
    }
    if (document.body) {
      document.body.classList.toggle('zo2y-popup-open', hasOpenMenu || hasOpenModal);
    }
  };

  const ensureMenuCloseButtons = (scope = document) => {
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll(LIST_MENU_SELECTOR).forEach((menu) => {
      if (menu.querySelector('.zo2y-popup-close')) return;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'zo2y-popup-close';
      closeBtn.setAttribute('aria-label', 'Close popup');
      closeBtn.innerHTML = '&times;';
      menu.prepend(closeBtn);
    });
  };

  const ensureModalCloseButtons = (scope = document) => {
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll(LIST_MODAL_SELECTOR).forEach((modal) => {
      const content = modal.querySelector('.modal-content, .custom-lists-content, .actions-content');
      if (!content) return;
      if (content.querySelector('.zo2y-overlay-close')) return;
      if (content.querySelector('.modal-close, .close-lists-btn')) return;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'zo2y-overlay-close';
      closeBtn.setAttribute('aria-label', 'Close popup');
      closeBtn.innerHTML = '&times;';
      content.prepend(closeBtn);
    });
  };

  const initListPopupShell = () => {
    if (!document.body || document.body.dataset.zo2yPopupShellReady === '1') return;
    document.body.dataset.zo2yPopupShellReady = '1';

    ensureMenuCloseButtons();
    ensureModalCloseButtons();
    syncPopupState();

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !target.closest) return;

      const menuCloseBtn = target.closest('.zo2y-popup-close');
      if (menuCloseBtn) {
        event.preventDefault();
        event.stopPropagation();
        closeAllPopupMenus();
        syncPopupState();
        return;
      }

      const modalCloseBtn = target.closest('.zo2y-overlay-close');
      if (modalCloseBtn) {
        event.preventDefault();
        event.stopPropagation();
        const modal = modalCloseBtn.closest(LIST_MODAL_SELECTOR);
        if (modal) closeModalNode(modal);
        syncPopupState();
        return;
      }

      if (target.id === 'zo2yPopupBackdrop') {
        event.preventDefault();
        closeAllPopupMenus();
        syncPopupState();
      }
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeAllPopupMenus();
      closeAllListModals();
      syncPopupState();
    }, true);

    const flushMutationState = () => {
      mutationFlushScheduled = false;
      const refreshMenus = pendingMutationRefreshMenus;
      const refreshModals = pendingMutationRefreshModals;
      const shouldSync = pendingMutationSync;
      pendingMutationRefreshMenus = false;
      pendingMutationRefreshModals = false;
      pendingMutationSync = false;

      if (refreshMenus) ensureMenuCloseButtons();
      if (refreshModals) ensureModalCloseButtons();
      if (shouldSync || refreshMenus || refreshModals) syncPopupState();
    };

    const scheduleMutationFlush = () => {
      if (mutationFlushScheduled) return;
      mutationFlushScheduled = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flushMutationState);
      } else {
        setTimeout(flushMutationState, 16);
      }
    };

    popupObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (!(target instanceof HTMLElement)) return;
          if (target.matches(LIST_MENU_SELECTOR)) {
            pendingMutationRefreshMenus = true;
            pendingMutationSync = true;
            return;
          }
          if (target.matches(LIST_MODAL_SELECTOR) || target.matches('.list-menu-backdrop, .rail-menu-backdrop')) {
            pendingMutationSync = true;
          }
          return;
        }

        if (mutation.type !== 'childList') return;
        if (mutation.removedNodes.length) pendingMutationSync = true;
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(LIST_MENU_SELECTOR) || node.querySelector(LIST_MENU_SELECTOR)) pendingMutationRefreshMenus = true;
          if (node.matches(LIST_MODAL_SELECTOR) || node.querySelector(LIST_MODAL_SELECTOR)) pendingMutationRefreshModals = true;
          if (node.matches('.list-menu-backdrop, .rail-menu-backdrop') || node.querySelector('.list-menu-backdrop, .rail-menu-backdrop')) {
            pendingMutationSync = true;
          }
        });
      });

      if (pendingMutationSync || pendingMutationRefreshMenus || pendingMutationRefreshModals) {
        scheduleMutationFlush();
      }
    });

    popupObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('app-booting');
    document.body.classList.add('app-ready');
    initListPopupShell();
    window.setTimeout(() => document.body.classList.remove('app-loading'), 180);
  });

  // Prefetch same-origin page links on hover/touch for snappier transitions.
  const prefetched = new Set();
  const queuePrefetch = (href) => {
    try {
      const target = new URL(href, window.location.origin);
      if (target.origin !== window.location.origin) return;
      if (!/\.html?$/.test(target.pathname) && target.pathname !== '/') return;
      const key = target.pathname + target.search;
      if (prefetched.has(key)) return;
      prefetched.add(key);
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = target.href;
      document.head.appendChild(l);
    } catch (_) {
      // ignore malformed links
    }
  };

  document.addEventListener('mouseover', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    queuePrefetch(anchor.href);
  }, { passive: true });

  document.addEventListener('touchstart', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    queuePrefetch(anchor.href);
  }, { passive: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silent fail to avoid runtime noise
      });
    });
  }
})();
