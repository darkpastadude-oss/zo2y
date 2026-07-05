/* === SPA-LIKE TAB ROUTER === */
/* Smooth crossfade between pages. Header/sidebar never flash. */
/* Content fades out → full navigation → new page fades in. */

(function () {
  'use strict';

  var FADE_OUT_MS = 180;
  var SPA_ROUTES = new Set([
    'index', 'movies', 'tvshows', 'animes', 'games', 'books', 'music',
    'travel', 'sports', 'fashion', 'food', 'cars', 'reviews', 'profile'
  ]);

  var isNavigating = false;

  function normalizePageName(pathname) {
    var bodyNav = document.body && document.body.dataset && document.body.dataset.navPage;
    if (bodyNav) return String(bodyNav).toLowerCase();
    var file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
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
    if (file.startsWith('review')) return 'reviews';
    if (file.startsWith('profile')) return 'profile';
    return 'index';
  }

  function setActiveNav(pageName) {
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
    var shell = document.querySelector('.desktop-app-shell');
    if (shell) {
      var panel = shell.querySelector('.desktop-main-panel');
      if (panel) return panel;
    }
    var main = document.querySelector('main.container.page-shell');
    if (main) return main;
    main = document.querySelector('main.page-shell');
    if (main) return main;
    main = document.querySelector('.container.page-shell');
    if (main) return main;
    return null;
  }

  function fadeOutAndNavigate(url) {
    if (isNavigating) return;
    isNavigating = true;

    var panel = findMainPanel();
    if (!panel) {
      window.location.href = url;
      return;
    }

    /* Mark session so new page knows to fade in */
    try { sessionStorage.setItem('spa_navigating', '1'); } catch (_) {}

    panel.classList.add('is-transitioning-out');

    setTimeout(function () {
      window.location.href = url;
    }, FADE_OUT_MS);
  }

  /* On new page load: if coming from SPA nav, fade in smoothly */
  function fadeInOnLoad() {
    var fromSPA = false;
    try { fromSPA = sessionStorage.getItem('spa_navigating') === '1'; } catch (_) {}
    if (fromSPA) {
      try { sessionStorage.removeItem('spa_navigating'); } catch (_) {}
      var panel = findMainPanel();
      if (panel) {
        panel.style.opacity = '0';
        panel.classList.add('is-transitioning-in');
        requestAnimationFrame(function () {
          panel.style.opacity = '';
        });
      }
    }
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
    } catch (_) {
      return;
    }

    e.preventDefault();
    var navPageName = navPage || normalizePageName(new URL(href, window.location.origin).pathname);
    if (!SPA_ROUTES.has(navPageName)) {
      window.location.href = href;
      return;
    }

    var currentPage = normalizePageName(window.location.pathname);
    if (navPageName === currentPage) return;

    fadeOutAndNavigate(href);
  }, { capture: true });

  window.addEventListener('popstate', function () {
    var targetPage = normalizePageName(window.location.pathname);
    if (SPA_ROUTES.has(targetPage)) {
      fadeOutAndNavigate(window.location.href);
    }
  });

  document.body.classList.add('spa-ready');
  fadeInOnLoad();

})();
