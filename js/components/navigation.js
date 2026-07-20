(function () {
  'use strict';

  var FADE_OUT_MS = 180;
  var SAFETY_TIMEOUT_MS = 3000;
  var SPA_ROUTES = new Set([
    'index', 'movies', 'tvshows', 'animes', 'games', 'books', 'music',
    'travel', 'sports', 'fashion', 'food', 'cars', 'community', 'profile'
  ]);

  var isNavigating = false;

  function spNormalizePageName(pathname) {
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
    file = file.split('?')[0].split('#')[0];
    if (file === '' || file === 'index.html') return 'index';
    if (file === 'movies.html') return 'movies';
    if (file === 'tvshows.html') return 'tvshows';
    if (file === 'animes.html') return 'animes';
    if (file === 'games.html') return 'games';
    if (file === 'books.html') return 'books';
    if (file === 'music.html') return 'music';
    if (file === 'travel.html') return 'travel';
    if (file === 'sports.html') return 'sports';
    if (file === 'fashion.html') return 'fashion';
    if (file === 'food.html') return 'food';
    if (file === 'cars.html') return 'cars';
    if (file === 'community.html') return 'community';
    if (file === 'profile.html') return 'profile';
    if (file.startsWith('movie')) return 'movie-detail';
    if (file.startsWith('tvshow')) return 'tvshow-detail';
    if (file.startsWith('anime')) return 'anime-detail';
    if (file.startsWith('game')) return 'game-detail';
    if (file.startsWith('book')) return 'book-detail';
    if (file.startsWith('song')) return 'song-detail';
    if (file.startsWith('country')) return 'country-detail';
    if (file.startsWith('brand')) return 'brand-detail';
    return 'index';
  }

  function activePageName() {
    var override = document?.body?.dataset?.navPage;
    if (override) return String(override).toLowerCase();
    var file = String(window.location.pathname || '').split('/').pop().toLowerCase() || 'index.html';
    if (file === '' || file === 'index.html') return 'index';
    if (file.startsWith('movie')) return 'movies';
    if (file.startsWith('tvshow')) return 'tvshows';
    if (file.startsWith('anime')) return 'animes';
    if (file.startsWith('game')) return 'games';
    if (file.startsWith('book')) return 'books';
    if (file.startsWith('song') || file.startsWith('music')) return 'music';
    if (file.startsWith('travel') || file.startsWith('country')) return 'travel';
    if (file.startsWith('sport')) return 'sports';
    if (file.startsWith('fashion')) return 'fashion';
    if (file.startsWith('food')) return 'food';
    if (file.startsWith('cars') || file.startsWith('car')) return 'cars';
    if (file.startsWith('community')) return 'community';
    if (file.startsWith('profile')) return 'profile';
    return 'index';
  }

  function getCurrentPageName() {
    var override = document?.body?.dataset?.navPage;
    if (override) return String(override).toLowerCase();
    return spNormalizePageName(window.location.pathname);
  }

  function setActiveNav() {
    var pageName = activePageName();
    document.querySelectorAll('[data-nav-page]').forEach(function (link) {
      var page = String(link.getAttribute('data-nav-page') || '');
      if (!page) return;
      var active = page === pageName;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-nav-group]').forEach(function (group) {
      var hasActive = !!group.querySelector('[data-nav-page].active');
      group.classList.toggle('active', hasActive);
      var toggle = group.querySelector('.zo2y-nav-toggle');
      if (toggle) toggle.classList.toggle('active', hasActive);
    });
  }

  function findMainPanel() {
    var selectors = [
      '.desktop-app-shell .desktop-main-panel',
      'main.container.page-shell',
      'main.container.page',
      'main.container',
      'main.page-shell',
      'main.page',
      'main'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function fadeOutAndNavigate(url) {
    if (isNavigating) return;
    isNavigating = true;

    setTimeout(function () { isNavigating = false; }, SAFETY_TIMEOUT_MS);

    try { sessionStorage.setItem('spa_navigating', '1'); } catch (_) {}

    var panel = findMainPanel();
    if (!panel) {
      window.location.href = url;
      return;
    }

    panel.classList.add('is-transitioning-out');

    setTimeout(function () {
      window.location.href = url;
    }, FADE_OUT_MS);
  }

  function fadeInOnLoad() {
    var fromSPA = false;
    try { fromSPA = sessionStorage.getItem('spa_navigating') === '1'; } catch (_) {}
    if (!fromSPA) return;
    try { sessionStorage.removeItem('spa_navigating'); } catch (_) {}

    var panel = findMainPanel();
    if (!panel) return;

    panel.style.opacity = '0';
    panel.style.transform = 'translateY(4px)';
    void panel.offsetHeight;
    panel.classList.add('is-transitioning-in');

    setTimeout(function () {
      panel.style.opacity = '';
      panel.style.transform = '';
    }, 100);

    setTimeout(function () {
      panel.classList.remove('is-transitioning-in');
    }, 350);
  }

  function closeMobileDrawer() {
    var drawer = document.querySelector('.zo2y-mobile-drawer.open');
    if (drawer) {
      drawer.classList.remove('open');
      document.body.classList.remove('zo2y-mobile-menu-open');
    }
    var backdrop = document.querySelector('.zo2y-drawer-backdrop.active');
    if (backdrop) backdrop.classList.remove('active');
  }

  function wireLogoLinks() {
    var logoLinks = document.querySelectorAll('.zo2y-shared-brand, .zo2y-mobile-wordmark, .zo2y-mobile-drawer-brand, .zo2y-desktop-rail-brand');
    logoLinks.forEach(function (link) {
      if (link.dataset.zo2yLogoClickWired === '1') return;
      link.dataset.zo2yLogoClickWired = '1';

      var forceHome = function (e) {
        var href = link.getAttribute('href');
        if (!href || !(href === 'index.html' || href === '/index.html' || href === '/')) return;
        if (e) {
          try { e.preventDefault(); } catch (_) {}
          try { e.stopPropagation(); } catch (_) {}
          try { e.stopImmediatePropagation(); } catch (_) {}
        }
        closeMobileDrawer();
        window.location.assign('index.html');
      };

      link.addEventListener('pointerdown', forceHome, { capture: true });
      link.addEventListener('touchstart', forceHome, { capture: true, passive: false });
      link.addEventListener('click', forceHome, { capture: true });
    });
  }

  function init() {
    wireLogoLinks();
    restoreAccordionStates();
    setActiveNav();
    fadeInOnLoad();
  }

  function restoreAccordionStates() {
    var states;
    try { states = JSON.parse(sessionStorage.getItem('zo2y-mobile-accordion-open')); } catch (_e) {}
    var hasPersisted = states && typeof states === 'object';
    document.querySelectorAll('.zo2y-mobile-accordion').forEach(function (accordion) {
      var panel = accordion.querySelector('.zo2y-mobile-accordion-panel');
      var toggle = accordion.querySelector('.zo2y-mobile-accordion-toggle');
      var label = toggle && toggle.textContent ? toggle.textContent.trim() : '';
      var shouldOpen;
      if (hasPersisted && label && label in states) {
        shouldOpen = !!states[label];
      } else {
        shouldOpen = !!accordion.querySelector('[data-nav-page].active');
      }
      accordion.classList.toggle('open', shouldOpen);
      if (toggle) toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      if (panel) panel.style.maxHeight = '';
    });
  }

  document.addEventListener('click', function (e) {
    if (isNavigating) return;
    var link = e.target.closest('a[href]');
    if (!link) return;

    var navPage = link.getAttribute('data-nav-page');
    if (!navPage) {
      var railLink = link.closest('.zo2y-desktop-rail-link');
      if (railLink) navPage = railLink.getAttribute('data-nav-page');
    }
    if (!navPage) {
      var drawerLink = link.closest('.zo2y-mobile-drawer-link');
      if (drawerLink) navPage = drawerLink.getAttribute('data-nav-page');
    }
    if (!navPage && !link.closest('[data-nav-page]')) return;

    var href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (link.target === '_blank') return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    try {
      var target = new URL(href, window.location.origin);
      if (target.origin !== window.location.origin) return;
      if (!/\.html?$/.test(target.pathname) && target.pathname !== '/') return;
    } catch (_) { return; }

    e.preventDefault();
    var navPageName = navPage || spNormalizePageName(new URL(href, window.location.origin).pathname);
    if (!SPA_ROUTES.has(navPageName)) {
      window.location.href = href;
      return;
    }

    var currentPage = getCurrentPageName();
    if (navPageName === currentPage) return;

    closeMobileDrawer();
    fadeOutAndNavigate(href);
  }, { capture: true });

  window.addEventListener('popstate', function () {
    setActiveNav();
  });

  document.body.classList.add('spa-ready');

  window.Navigation = { init: init };
})();
