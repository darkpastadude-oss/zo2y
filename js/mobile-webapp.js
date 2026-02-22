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
  const INSTALL_DISMISS_KEY = 'zo2y_mobile_install_dismissed_at_v1';
  const INSTALL_DONE_KEY = 'zo2y_mobile_install_done_v1';
  const INSTALL_REPROMPT_MS = 1000 * 60 * 60 * 24 * 3;
  let popupObserver = null;
  let pendingMutationRefreshMenus = false;
  let pendingMutationRefreshModals = false;
  let pendingMutationSync = false;
  let mutationFlushScheduled = false;
  let deferredInstallPrompt = null;
  let installCardVisible = false;

  const isStandaloneMode = () => {
    try {
      const displayStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = !!window.navigator.standalone;
      return !!(displayStandalone || iosStandalone);
    } catch (_err) {
      return false;
    }
  };

  const isIosDevice = () => /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const isSafariLike = () => {
    const ua = String(navigator.userAgent || '');
    return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
  };

  const shouldShowInstallPrompt = () => {
    if (!isMobileLike) return false;
    if (isStandaloneMode()) return false;
    if (localStorage.getItem(INSTALL_DONE_KEY) === '1') return false;
    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    if (dismissedAt && (Date.now() - dismissedAt) < INSTALL_REPROMPT_MS) return false;
    return true;
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    const card = document.getElementById('zo2yInstallPrompt');
    if (card) {
      card.classList.remove('show');
      window.setTimeout(() => card.remove(), 240);
    }
    installCardVisible = false;
  };

  const markInstallComplete = () => {
    localStorage.setItem(INSTALL_DONE_KEY, '1');
    localStorage.removeItem(INSTALL_DISMISS_KEY);
    dismissInstallPrompt();
  };

  const ensureInstallPromptStyle = () => {
    if (document.getElementById('zo2yInstallPromptStyle')) return;
    const style = document.createElement('style');
    style.id = 'zo2yInstallPromptStyle';
    style.textContent = `
      .zo2y-install-prompt {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 18px;
        z-index: 12000;
        background: linear-gradient(160deg, rgba(14, 27, 61, 0.98), rgba(9, 19, 44, 0.98));
        color: #fff;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        padding: 14px 14px 12px;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      .zo2y-install-prompt.show {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      .zo2y-install-title {
        font-weight: 700;
        font-size: 15px;
        margin: 0 0 6px;
      }
      .zo2y-install-copy {
        margin: 0;
        font-size: 13px;
        line-height: 1.4;
        color: rgba(236, 244, 255, 0.9);
      }
      .zo2y-install-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .zo2y-install-btn {
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: #fff;
        border-radius: 10px;
        height: 38px;
        padding: 0 12px;
        font-weight: 600;
        font-size: 13px;
      }
      .zo2y-install-btn.primary {
        background: #f59e0b;
        border-color: #f59e0b;
        color: #0b1633;
      }
      .zo2y-install-help {
        margin-top: 10px;
        font-size: 12px;
        color: rgba(236, 244, 255, 0.78);
      }
    `;
    document.head.appendChild(style);
  };

  const showInstallPromptCard = () => {
    if (!shouldShowInstallPrompt()) return;
    if (installCardVisible) return;
    const canPromptInstall = !!deferredInstallPrompt;
    const useIosHint = isIosDevice() && isSafariLike() && !canPromptInstall;
    if (!canPromptInstall && !useIosHint) return;

    ensureInstallPromptStyle();
    let card = document.getElementById('zo2yInstallPrompt');
    if (!card) {
      card = document.createElement('div');
      card.id = 'zo2yInstallPrompt';
      card.className = 'zo2y-install-prompt';
      document.body.appendChild(card);
    }

    if (canPromptInstall) {
      card.innerHTML = `
        <p class="zo2y-install-title">Install Zo2y App</p>
        <p class="zo2y-install-copy">Get the full-screen web app on your phone with faster launch and app-style navigation.</p>
        <div class="zo2y-install-actions">
          <button type="button" class="zo2y-install-btn primary" id="zo2yInstallNowBtn">Install</button>
          <button type="button" class="zo2y-install-btn" id="zo2yInstallLaterBtn">Not now</button>
        </div>
      `;
      card.querySelector('#zo2yInstallNowBtn')?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        try {
          const promptEvent = deferredInstallPrompt;
          deferredInstallPrompt = null;
          await promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice?.outcome === 'accepted') {
            markInstallComplete();
          } else {
            dismissInstallPrompt();
          }
        } catch (_err) {
          dismissInstallPrompt();
        }
      });
      card.querySelector('#zo2yInstallLaterBtn')?.addEventListener('click', dismissInstallPrompt);
    } else if (useIosHint) {
      card.innerHTML = `
        <p class="zo2y-install-title">Install Zo2y App</p>
        <p class="zo2y-install-copy">On iPhone: tap <strong>Share</strong> in Safari, then choose <strong>Add to Home Screen</strong>.</p>
        <div class="zo2y-install-actions">
          <button type="button" class="zo2y-install-btn primary" id="zo2yInstallGotItBtn">Got it</button>
          <button type="button" class="zo2y-install-btn" id="zo2yInstallLaterBtn">Later</button>
        </div>
      `;
      card.querySelector('#zo2yInstallGotItBtn')?.addEventListener('click', () => {
        localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + (1000 * 60 * 60 * 4)));
        dismissInstallPrompt();
      });
      card.querySelector('#zo2yInstallLaterBtn')?.addEventListener('click', dismissInstallPrompt);
    }

    installCardVisible = true;
    window.setTimeout(() => card.classList.add('show'), 60);
  };

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
    window.setTimeout(() => showInstallPromptCard(), 1200);
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallPromptCard();
  });

  window.addEventListener('appinstalled', () => {
    markInstallComplete();
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
