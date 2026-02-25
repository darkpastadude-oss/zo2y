(() => {
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
  const OPEN_LIST_MODAL_SELECTOR = '.modal[id*="ListsModal"].active, #customListsModal.active, #actionsModal.active';
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
    '#authPromptModal.active',
    '.zo2y-install-overlay.show'
  ].join(', ');
  const IMAGE_RESOURCE_HINT_ORIGINS = [
    'https://image.tmdb.org',
    'https://covers.openlibrary.org',
    'https://books.googleusercontent.com',
    'https://i.scdn.co',
    'https://images.igdb.com'
  ];
  const INSTALL_DISMISS_KEY = 'zo2y_mobile_install_dismissed_at_v2';
  const INSTALL_DONE_KEY = 'zo2y_mobile_install_done_v2';
  const INSTALL_REPROMPT_MS = 1000 * 60 * 60 * 12;
  const ENABLE_MOBILE_INSTALL_PROMPT = false;
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
  const shouldUsePopupScrollLock = !isMobileLike || isStandaloneMode();

  const isIosDevice = () => /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const isSafariLike = () => {
    const ua = String(navigator.userAgent || '');
    return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
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

  const shouldShowInstallPrompt = () => {
    if (!ENABLE_MOBILE_INSTALL_PROMPT) return false;
    if (!isMobileLike) return false;
    if (AUTH_PAGE_KEYS.has(pageKey)) return false;
    if (hasOAuthParams()) return false;
    if (isStandaloneMode()) return false;
    if (localStorage.getItem(INSTALL_DONE_KEY) === '1') return false;
    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    if (dismissedAt && (Date.now() - dismissedAt) < INSTALL_REPROMPT_MS) return false;
    return true;
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

  ensureResourceHints();

  const dismissInstallPrompt = (options = {}) => {
    const persist = options.persist !== false;
    const delayMs = Number(options.delayMs || 0);
    if (persist) {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() + Math.max(0, delayMs)));
    }
    const overlay = document.getElementById('zo2yInstallPrompt');
    if (overlay) {
      overlay.classList.remove('show');
      window.setTimeout(() => overlay.remove(), 240);
    }
    installCardVisible = false;
  };

  const markInstallComplete = () => {
    localStorage.setItem(INSTALL_DONE_KEY, '1');
    localStorage.removeItem(INSTALL_DISMISS_KEY);
    dismissInstallPrompt({ persist: false });
  };

  const ensureInstallPromptStyle = () => {
    if (document.getElementById('zo2yInstallPromptStyle')) return;
    const style = document.createElement('style');
    style.id = 'zo2yInstallPromptStyle';
    style.textContent = `
      .zo2y-install-overlay {
        position: fixed;
        inset: 0;
        z-index: 12000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(3, 9, 24, 0.7);
        backdrop-filter: blur(6px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
      }
      .zo2y-install-overlay.show {
        opacity: 1;
        pointer-events: auto;
      }
      .zo2y-install-prompt {
        position: fixed;
        left: 50%;
        top: 50%;
        width: min(92vw, 420px);
        background: linear-gradient(160deg, rgba(14, 27, 61, 0.98), rgba(9, 19, 44, 0.98));
        color: #fff;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 18px;
        box-shadow: 0 24px 54px rgba(0,0,0,0.5);
        padding: 16px 15px 13px;
        transform: translate(-50%, calc(-50% + 18px)) scale(0.985);
        opacity: 0;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      .zo2y-install-overlay.show .zo2y-install-prompt {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      .zo2y-install-title {
        font-weight: 700;
        font-size: 16px;
        margin: 0 0 6px;
        padding-right: 36px;
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
      .zo2y-install-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 30px;
        height: 30px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 10px;
        background: rgba(255,255,255,0.06);
        color: #fff;
        font-size: 20px;
        line-height: 1;
      }
      .zo2y-install-close:active {
        transform: scale(0.97);
      }
    `;
    document.head.appendChild(style);
  };

  const showInstallPromptCard = (options = {}) => {
    if (!shouldShowInstallPrompt()) return;
    const force = options.force === true;
    if (installCardVisible && !force) return;
    const canPromptInstall = !!deferredInstallPrompt;
    const useIosHint = isIosDevice() && isSafariLike() && !canPromptInstall;
    const useGenericHint = !canPromptInstall && !useIosHint;

    ensureInstallPromptStyle();
    let overlay = document.getElementById('zo2yInstallPrompt');
    const isNewOverlay = !overlay;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'zo2yInstallPrompt';
      overlay.className = 'zo2y-install-overlay';
      document.body.appendChild(overlay);
    }
    overlay.onclick = (event) => {
      const target = event.target;
      if (!target || !(target instanceof HTMLElement)) return;
      if (target.id === 'zo2yInstallPrompt' || target.id === 'zo2yInstallCloseBtn') {
        dismissInstallPrompt();
      }
    };

    if (canPromptInstall) {
      overlay.innerHTML = `
        <div class="zo2y-install-prompt" role="dialog" aria-modal="true" aria-label="Install Zo2y App">
          <button type="button" class="zo2y-install-close" id="zo2yInstallCloseBtn" aria-label="Close">&times;</button>
          <p class="zo2y-install-title">Install Zo2y App</p>
          <p class="zo2y-install-copy">Install the mobile web app for faster launch, full-screen mode, and app-style navigation.</p>
          <div class="zo2y-install-actions">
            <button type="button" class="zo2y-install-btn primary" id="zo2yInstallNowBtn">Install now</button>
            <button type="button" class="zo2y-install-btn" id="zo2yInstallLaterBtn">Maybe later</button>
          </div>
          <p class="zo2y-install-help">This opens your browser's official install prompt.</p>
        </div>
      `;
      overlay.querySelector('#zo2yInstallNowBtn')?.addEventListener('click', async () => {
        const promptEvent = deferredInstallPrompt;
        if (!promptEvent) {
          dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 30 });
          return;
        }
        try {
          deferredInstallPrompt = null;
          await promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice?.outcome === 'accepted') {
            markInstallComplete();
          } else {
            dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 30 });
          }
        } catch (_err) {
          dismissInstallPrompt();
        }
      });
      overlay.querySelector('#zo2yInstallLaterBtn')?.addEventListener('click', () => {
        dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 60 * 4 });
      });
    } else if (useIosHint) {
      overlay.innerHTML = `
        <div class="zo2y-install-prompt" role="dialog" aria-modal="true" aria-label="Install Zo2y App">
          <button type="button" class="zo2y-install-close" id="zo2yInstallCloseBtn" aria-label="Close">&times;</button>
          <p class="zo2y-install-title">Install Zo2y App</p>
          <p class="zo2y-install-copy">On iPhone Safari: tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</p>
          <div class="zo2y-install-actions">
            <button type="button" class="zo2y-install-btn primary" id="zo2yInstallGotItBtn">Got it</button>
            <button type="button" class="zo2y-install-btn" id="zo2yInstallLaterBtn">Later</button>
          </div>
        </div>
      `;
      overlay.querySelector('#zo2yInstallGotItBtn')?.addEventListener('click', () => {
        dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 60 * 4 });
      });
      overlay.querySelector('#zo2yInstallLaterBtn')?.addEventListener('click', () => {
        dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 60 * 4 });
      });
    } else if (useGenericHint) {
      overlay.innerHTML = `
        <div class="zo2y-install-prompt" role="dialog" aria-modal="true" aria-label="Install Zo2y App">
          <button type="button" class="zo2y-install-close" id="zo2yInstallCloseBtn" aria-label="Close">&times;</button>
          <p class="zo2y-install-title">Install Zo2y App</p>
          <p class="zo2y-install-copy">Open your browser menu and tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          <div class="zo2y-install-actions">
            <button type="button" class="zo2y-install-btn primary" id="zo2yInstallGenericOkBtn">Got it</button>
            <button type="button" class="zo2y-install-btn" id="zo2yInstallLaterBtn">Later</button>
          </div>
        </div>
      `;
      overlay.querySelector('#zo2yInstallGenericOkBtn')?.addEventListener('click', () => {
        dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 60 * 4 });
      });
      overlay.querySelector('#zo2yInstallLaterBtn')?.addEventListener('click', () => {
        dismissInstallPrompt({ persist: true, delayMs: 1000 * 60 * 60 * 4 });
      });
    }

    installCardVisible = true;
    if (isNewOverlay) {
      window.setTimeout(() => overlay.classList.add('show'), 60);
    } else {
      overlay.classList.add('show');
    }
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
    releaseStalePopupLock();

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
    releaseStalePopupLock();
    window.setTimeout(() => document.body.classList.remove('app-loading'), 180);
    if (ENABLE_MOBILE_INSTALL_PROMPT) {
      window.setTimeout(() => showInstallPromptCard(), 1200);
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    deferredInstallPrompt = event;
    event.preventDefault();
    if (!ENABLE_MOBILE_INSTALL_PROMPT) return;
    showInstallPromptCard({ force: true });
  });

  window.addEventListener('appinstalled', () => {
    markInstallComplete();
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

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silent fail to avoid runtime noise
      });
    });
  }
})();
