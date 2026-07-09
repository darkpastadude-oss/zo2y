(() => {
const APP_RUNTIME_VERSION = '20260612c';
  const isLocalhostRuntime = (() => {
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  })();

  const isMobileLike = window.matchMedia('(max-width: 900px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const path = window.location.pathname || '/';
  const base = path === '/' ? 'index.html' : path.split('/').pop();
  const pageKey = String(base || 'index.html').replace(/\.html?$/i, '').toLowerCase();
  const AUTH_PAGE_KEYS = new Set(['login', 'sign-up', 'signup', 'auth-callback', 'update-password']);


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

  const LIST_MENU_SELECTOR = '.list-menu, .rail-menu';
  const OPEN_LIST_MENU_SELECTOR = '.list-menu.open, .rail-menu.open';
  const LIST_MODAL_SELECTOR = '.modal[id*="ListsModal"], #customListsModal, #actionsModal';
  const OPEN_LIST_MODAL_SELECTOR = '.modal[id*="ListsModal"].active, #customListsModal.active, #actionsModal.active, #editMediaListModal.active';
  const NATIVE_MENU_BACKDROP_SELECTOR = '.list-menu-backdrop.active, .rail-menu-backdrop.active';
  const GENERIC_SCROLL_LOCK_OVERLAY_SELECTOR = [
    '.menu-modal.active',
    '.actions-modal.active',
    '.custom-lists-modal.active',
    '.auth-prompt-modal.active',
    '.login-modal.active',
    '#mobileMenuModal.active',
    '#confirmModal.active',
    '.modal.active',
    '.modal.show',
    '.lightbox.active',
    '#homeOnboardingOverlay.active',
    '#authPromptModal.active'
  ].join(', ');
  const IMAGE_RESOURCE_HINT_ORIGINS = [
    'https://image.tmdb.org',
    'https://covers.openlibrary.org',
    'https://books.googleusercontent.com',
    'https://i.scdn.co',
    'https://images.igdb.com',
    'https://www.thesportsdb.com'
  ];
  const INSTALL_DISMISS_KEY = 'zo2y_install_dismissed_v3';
  const INSTALL_DONE_KEY = 'zo2y_install_done_v3';
  let popupObserver = null;
  let pendingMutationRefreshMenus = false;
  let pendingMutationRefreshModals = false;
  let pendingMutationSync = false;
  let mutationFlushScheduled = false;
  let deferredInstallPrompt = null;

  const isStandaloneMode = () => {
    try {
      const displayStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = !!window.navigator.standalone;
      return !!(displayStandalone || iosStandalone);
    } catch (_err) {
      return false;
    }
  };
  const shouldUsePopupScrollLock = !isMobileLike || isStandaloneMode();

  const isIosDevice = () => {
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return true;
    // iPadOS 13+ reports as Mac with touch capability
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    return false;
  };
  const isSafariLike = () => {
    const ua = String(navigator.userAgent || '');
    if (/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua)) return false;
    if (/Safari/i.test(ua)) return true;
    // iPadOS Safari also reports as Mac Safari
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
    return false;
  };
  const hasOAuthParams = () => {
    const search = new URLSearchParams(window.location.search || '');
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    return !!(
      search.get('code') ||
      search.get('state') ||
      search.get('error') ||
      search.get('error_description') ||
      hash.get('access_token') ||
      hash.get('refresh_token')
    );
  };

  const isHeaderInstallEligible = () => {
    if (isStandaloneMode()) return false;
    if (AUTH_PAGE_KEYS.has(pageKey)) return false;
    if (hasOAuthParams()) return false;
    return true;
  };

  const isHeaderInstallAvailable = () => {
    if (!isHeaderInstallEligible()) return false;
    if (localStorage.getItem(INSTALL_DONE_KEY) === '1') return false;
    if (localStorage.getItem(INSTALL_DISMISS_KEY) === '1') return false;
    return !!deferredInstallPrompt || isIosDevice();
  };

  const triggerHeaderInstall = async () => {
    if (isIosDevice()) {
      const btn = document.getElementById('zo2yHeaderInstallBtn');
      let tip = document.getElementById('zo2yHeaderInstallTip');
      if (tip) {
        tip.remove();
        return;
      }
      if (!btn) return;
      tip = document.createElement('div');
      tip.id = 'zo2yHeaderInstallTip';
      tip.className = 'zo2y-header-install-tip';
      tip.innerHTML = `
        <p class="zo2y-header-install-tip-title">Install Zo2y</p>
        <p class="zo2y-header-install-tip-body">Tap the <strong>Share</strong> button in your browser, then choose <strong>Add to Home Screen</strong>.</p>
        <button type="button" class="zo2y-header-install-tip-close" id="zo2yHeaderInstallTipClose">Got it</button>
      `;
      btn.insertAdjacentElement('afterend', tip);
      tip.querySelector('#zo2yHeaderInstallTipClose')?.addEventListener('click', () => {
        localStorage.setItem(INSTALL_DISMISS_KEY, '1');
        tip.remove();
        document.getElementById('zo2yHeaderInstallBtn')?.remove();
      });
      const onDocClick = (e) => {
        if (!tip.contains(e.target) && e.target !== btn) {
          tip.remove();
          document.removeEventListener('click', onDocClick);
        }
      };
      window.setTimeout(() => document.addEventListener('click', onDocClick), 0);
      return;
    }
    const promptEvent = deferredInstallPrompt;
    if (!promptEvent) return;
    deferredInstallPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        localStorage.setItem(INSTALL_DONE_KEY, '1');
      } else {
        localStorage.setItem(INSTALL_DISMISS_KEY, '1');
      }
    } catch (_err) {
      localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    }
    document.getElementById('zo2yHeaderInstallBtn')?.remove();
    document.getElementById('zo2yHeaderInstallTip')?.remove();
  };

  const ensureHeaderInstallButton = () => {
    if (!isHeaderInstallAvailable()) return;
    if (document.getElementById('zo2yHeaderInstallBtn')) return;
    const auth = document.querySelector('.zo2y-shared-auth');
    if (!auth) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'zo2yHeaderInstallBtn';
    btn.className = 'zo2y-shared-btn zo2y-header-install-btn';
    btn.setAttribute('aria-label', 'Install Zo2y app');
    btn.title = 'Install app';
    btn.innerHTML = '<i class="fa-solid fa-arrow-down-to-bracket"></i><span>install</span>';
    btn.addEventListener('click', triggerHeaderInstall);
    auth.insertBefore(btn, auth.firstChild);
  };

  window.__zo2yInstall = {
    isAvailable: isHeaderInstallAvailable,
    trigger: triggerHeaderInstall,
    ensureButton: ensureHeaderInstallButton
  };

  const ensureResourceHints = () => {
    if (!document.head) return;
    IMAGE_RESOURCE_HINT_ORIGINS.forEach((origin) => {
      const key = origin.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const dnsId = `zo2y-dns-${key}`;
      const preconnectId = `zo2y-preconnect-${key}`;

      if (!document.getElementById(dnsId)) {
        const dns = document.createElement('link');
        dns.id = dnsId;
        dns.rel = 'dns-prefetch';
        dns.href = origin;
        document.head.appendChild(dns);
      }

      if (!document.getElementById(preconnectId)) {
        const preconnect = document.createElement('link');
        preconnect.id = preconnectId;
        preconnect.rel = 'preconnect';
        preconnect.href = origin;
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
      }
    });
  };

  const ensureMobileUiPolishStyle = () => {
    if (!isMobileLike || !document.head || document.getElementById('zo2yMobileUiPolish')) return;
    const style = document.createElement('style');
    style.id = 'zo2yMobileUiPolish';
    style.textContent = `
      body.mobile-webapp {
        --zo2y-mobile-control-radius: 14px;
      }
      body.mobile-webapp .hero,
      body.mobile-webapp .controls,
      body.mobile-webapp .chip-row,
      body.mobile-webapp .grid,
      body.mobile-webapp .section,
      body.mobile-webapp .section-head,
      body.mobile-webapp .rail-wrap,
      body.mobile-webapp .container,
      body.mobile-webapp .page-shell {
        max-width: 100%;
      }
      body.mobile-webapp input[type="search"],
      body.mobile-webapp input[type="text"],
      body.mobile-webapp input[type="number"],
      body.mobile-webapp input[type="email"],
      body.mobile-webapp input[type="password"],
      body.mobile-webapp input[type="date"],
      body.mobile-webapp select,
      body.mobile-webapp textarea,
      body.mobile-webapp .search-input,
      body.mobile-webapp .filter-select,
      body.mobile-webapp .form-input,
      body.mobile-webapp .menu-input,
      body.mobile-webapp .form-textarea,
      body.mobile-webapp #globalSearch {
        font-size: 16px !important;
        line-height: 1.35;
        border-radius: var(--zo2y-mobile-control-radius) !important;
        min-height: 46px;
      }
      body.mobile-webapp textarea,
      body.mobile-webapp .form-textarea {
        min-height: 120px;
      }
      body.mobile-webapp .search-input,
      body.mobile-webapp .filter-select,
      body.mobile-webapp .form-input,
      body.mobile-webapp .menu-input,
      body.mobile-webapp #globalSearch {
        padding-top: 12px !important;
        padding-bottom: 12px !important;
      }
      body.mobile-webapp .btn,
      body.mobile-webapp button,
      body.mobile-webapp .chip,
      body.mobile-webapp .zo2y-shared-btn,
      body.mobile-webapp .zo2y-mobile-auth-btn,
      body.mobile-webapp .zo2y-mobile-drawer-link {
        border-radius: 14px !important;
      }
      body.mobile-webapp .btn,
      body.mobile-webapp .zo2y-shared-btn,
      body.mobile-webapp .zo2y-mobile-auth-btn {
        min-height: 44px;
        font-size: 14px;
      }
      body.mobile-webapp .chip {
        padding: 8px 10px;
        font-size: 12px;
      }
      body.mobile-webapp .hero,
      body.mobile-webapp .controls,
      body.mobile-webapp .chip-row,
      body.mobile-webapp .grid {
        padding-left: 14px !important;
        padding-right: 14px !important;
      }
      body.mobile-webapp .hero {
        margin-top: 14px;
      }
      body.mobile-webapp .hero h1,
      body.mobile-webapp .section-head h2 {
        letter-spacing: -0.02em;
      }
      body.mobile-webapp .hero p,
      body.mobile-webapp .section-head p,
      body.mobile-webapp .status,
      body.mobile-webapp .card-extra {
        font-size: 13px !important;
        line-height: 1.5;
      }
      body.mobile-webapp .controls {
        gap: 10px !important;
      }
      body.mobile-webapp .chip-row {
        gap: 8px !important;
      }
      body.mobile-webapp .rail-wrap,
      body.mobile-webapp .section {
        margin-top: 14px;
      }
      body.mobile-webapp .zo2y-mobile-topbar {
        width: calc(100% - 16px) !important;
      }
    `;
    document.head.appendChild(style);
  };



  ensureResourceHints();
  ensureMobileUiPolishStyle();

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
    document.querySelectorAll(OPEN_LIST_MENU_SELECTOR).forEach((menu) => {
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
    document.querySelectorAll(OPEN_LIST_MODAL_SELECTOR)
      .forEach((modal) => closeModalNode(modal));
  };

  const hasExternalScrollLockOverlay = () => {
    const overlays = document.querySelectorAll(GENERIC_SCROLL_LOCK_OVERLAY_SELECTOR);
    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 0);
    for (const overlay of overlays) {
      if (!(overlay instanceof HTMLElement)) continue;
      const styles = window.getComputedStyle(overlay);
      if (styles.display === 'none' || styles.visibility === 'hidden') continue;
      if (styles.pointerEvents === 'none' && Number(styles.opacity || '1') === 0) continue;
      if (styles.position !== 'fixed' && styles.position !== 'absolute') continue;
      const rect = overlay.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const coversViewportEnough = rect.width >= viewportWidth * 0.45 && rect.height >= viewportHeight * 0.35;
      const isHighLayer = Number.isFinite(Number(styles.zIndex)) ? Number(styles.zIndex) >= 100 : false;
      if (coversViewportEnough || isHighLayer) return true;
    }
    return false;
  };

  const clearInlineScrollLocks = () => {
    if (!document.body || !document.documentElement) return;
    if (document.querySelector('.modal.active, .confirm-modal.active, .menu-modal.active')) return;
    const bodyOverflow = String(document.body.style.overflow || '').trim().toLowerCase();
    const bodyOverflowY = String(document.body.style.overflowY || '').trim().toLowerCase();
    const docOverflow = String(document.documentElement.style.overflow || '').trim().toLowerCase();
    const docOverflowY = String(document.documentElement.style.overflowY || '').trim().toLowerCase();
    if (bodyOverflow === 'hidden' || bodyOverflow === 'clip' || bodyOverflow === 'auto') {
      document.body.style.overflow = '';
    }
    if (bodyOverflowY === 'hidden' || bodyOverflowY === 'clip' || bodyOverflowY === 'auto') {
      document.body.style.overflowY = '';
    }
    if (docOverflow === 'hidden' || docOverflow === 'clip' || docOverflow === 'auto') {
      document.documentElement.style.overflow = '';
    }
    if (docOverflowY === 'hidden' || docOverflowY === 'clip' || docOverflowY === 'auto') {
      document.documentElement.style.overflowY = '';
    }
  };

  const releaseStalePopupLock = () => {
    if (!document.body) return;
    if (!shouldUsePopupScrollLock) {
      document.body.classList.remove('zo2y-popup-open');
      clearInlineScrollLocks();
      const popupBackdrop = document.getElementById('zo2yPopupBackdrop');
      if (popupBackdrop) popupBackdrop.classList.remove('active');
      return;
    }
    const hasOpenMenu = !!document.querySelector(OPEN_LIST_MENU_SELECTOR);
    const hasOpenModal = !!document.querySelector(OPEN_LIST_MODAL_SELECTOR);
    const hasNativeBackdrop = !!document.querySelector(NATIVE_MENU_BACKDROP_SELECTOR);
    if (hasOpenMenu || hasOpenModal || hasNativeBackdrop || hasExternalScrollLockOverlay()) return;
    document.body.classList.remove('zo2y-popup-open');
    clearInlineScrollLocks();
    const popupBackdrop = document.getElementById('zo2yPopupBackdrop');
    if (popupBackdrop) popupBackdrop.classList.remove('active');
  };

  const syncPopupState = () => {
    const hasOpenMenu = !!document.querySelector(OPEN_LIST_MENU_SELECTOR);
    const hasOpenModal = !!document.querySelector(OPEN_LIST_MODAL_SELECTOR);
    const hasNativeBackdrop = !!document.querySelector(NATIVE_MENU_BACKDROP_SELECTOR);
    const popupBackdrop = ensurePopupBackdrop();

    if (popupBackdrop) {
      if (shouldUsePopupScrollLock && hasOpenMenu && !hasNativeBackdrop) {
        popupBackdrop.classList.add('active');
      } else {
        popupBackdrop.classList.remove('active');
      }
    }
    if (document.body) {
      if (shouldUsePopupScrollLock) {
        document.body.classList.toggle('zo2y-popup-open', hasOpenMenu || hasOpenModal);
      } else {
        document.body.classList.remove('zo2y-popup-open');
        clearInlineScrollLocks();
      }
    }
    if (!shouldUsePopupScrollLock || (!hasOpenMenu && !hasOpenModal)) {
      releaseStalePopupLock();
    }
  };

  const schedulePopupStateSync = (() => {
    let timerId = 0;
    return () => {
      if (timerId) return;
      timerId = window.setTimeout(() => {
        timerId = 0;
        syncPopupState();
        releaseStalePopupLock();
      }, 48);
    };
  })();

  const ensureMenuCloseButtons = (scope = document) => {
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll(LIST_MENU_SELECTOR).forEach((menu) => {
      if (menu.querySelector('.zo2y-popup-close') || menu.querySelector('.list-menu-close')) return;
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
    releaseStalePopupLock();

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !target.closest) return;

      const menuCloseBtn = target.closest('.zo2y-popup-close') || target.closest('.list-menu-close');
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
    releaseStalePopupLock();
    window.setTimeout(() => document.body.classList.remove('app-loading'), 180);
    ensureHeaderInstallButton();
  });

  window.setTimeout(() => {
    document.body?.classList.remove('app-booting');
    document.body?.classList.add('app-ready');
  }, 5000);

  window.addEventListener('beforeinstallprompt', (event) => {
    deferredInstallPrompt = event;
    // try { event.preventDefault(); } catch (_) {}
    ensureHeaderInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALL_DONE_KEY, '1');
    document.getElementById('zo2yHeaderInstallBtn')?.remove();
    document.getElementById('zo2yHeaderInstallTip')?.remove();
  });

  window.addEventListener('pageshow', () => {
    syncPopupState();
    releaseStalePopupLock();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    syncPopupState();
    releaseStalePopupLock();
  }, { passive: true });

  window.addEventListener('focus', schedulePopupStateSync, { passive: true });
  window.addEventListener('resize', schedulePopupStateSync, { passive: true });
  window.addEventListener('orientationchange', schedulePopupStateSync, { passive: true });
  window.addEventListener('popstate', schedulePopupStateSync);
  window.addEventListener('scroll', schedulePopupStateSync, { passive: true });
  document.addEventListener('click', schedulePopupStateSync, true);
  document.addEventListener('touchstart', schedulePopupStateSync, { passive: true, capture: true });
  document.addEventListener('touchend', schedulePopupStateSync, { passive: true, capture: true });
  document.addEventListener('pointerup', schedulePopupStateSync, { passive: true, capture: true });
  window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    releaseStalePopupLock();
  }, shouldUsePopupScrollLock ? 1200 : 260);

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

  async function resetZo2yCachesIfNeeded() {
    try {
      const lastVersion = localStorage.getItem('zo2y_runtime_version');
      if (lastVersion === APP_RUNTIME_VERSION) return;
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => /^zo2y-/i.test(String(key || '')))
            .map((key) => caches.delete(key))
        );
      }
      localStorage.setItem('zo2y_runtime_version', APP_RUNTIME_VERSION);
    } catch (_error) {
      try {
        localStorage.setItem('zo2y_runtime_version', APP_RUNTIME_VERSION);
      } catch (__error) {}
    }
  }

  async function unregisterZo2yServiceWorkers() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister().catch(() => false))
      );
    } catch (_error) {
      // Ignore unregister failures so the page can continue booting.
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      if (isLocalhostRuntime) {
        void unregisterZo2yServiceWorkers();
        return;
      }
      void resetZo2yCachesIfNeeded().finally(() => {
    navigator.serviceWorker.register('/sw.js?v=20260614b').catch(() => {
        // silent fail to avoid runtime noise
        });
      });
    });
  }
})();

