/* === SPA-LIKE TAB ROUTER === */
/* Intercepts nav clicks, fetches new page, swaps content with crossfade. */
/* Header/sidebar never re-render. */

(function () {
  'use strict';

  const TRANSITION_MS = 220;
  const LOAD_BAR_DELAY = 180;
  const SPA_ROUTES = new Set([
    'index', 'movies', 'tvshows', 'animes', 'games', 'books', 'music',
    'travel', 'sports', 'fashion', 'food', 'cars', 'reviews', 'profile'
  ]);

  let isTransitioning = false;
  let loadBarTimeout = null;

  function normalizePageName(pathname) {
    const bodyNav = document.body && document.body.dataset && document.body.dataset.navPage;
    if (bodyNav) return String(bodyNav).toLowerCase();
    const file = String(pathname || '').split('/').pop().toLowerCase() || 'index.html';
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

  function showLoadBar() {
    document.body.classList.remove('app-ready');
    document.body.classList.add('app-loading');
  }

  function hideLoadBar() {
    document.body.classList.remove('app-loading');
    document.body.classList.add('app-ready');
    setTimeout(function () {
      document.body.classList.remove('app-ready');
    }, 350);
  }

  function extractContent(doc) {
    var shell = doc.querySelector('.desktop-app-shell');
    if (shell) {
      var panel = shell.querySelector('.desktop-main-panel');
      if (panel) return panel.innerHTML;
    }
    var main = doc.querySelector('main.container.page-shell');
    if (main) return main.innerHTML;
    main = doc.querySelector('main.page-shell');
    if (main) return main.innerHTML;
    main = doc.querySelector('.container.page-shell');
    if (main) return main.innerHTML;
    return null;
  }

  function extractScripts(doc) {
    var scripts = [];
    doc.querySelectorAll('script[src]').forEach(function (s) {
      var src = s.getAttribute('src') || '';
      if (src && !src.includes('shared-header.js') && !src.includes('supabase') &&
          !src.includes('spa-router.js') && !src.includes('skeleton.js') &&
          !src.includes('list-utils.js') && !src.includes('cover-cache.js') &&
          !src.includes('img-fallback.js') && !src.includes('mobile-webapp.js') &&
          !src.includes('mobile-app.css') && !src.includes('curated-media.js')) {
        scripts.push(src);
      }
    });
    return scripts;
  }

  function extractInlineScripts(doc) {
    var scripts = [];
    doc.querySelectorAll('script:not([src])').forEach(function (s) {
      var text = s.textContent || '';
      if (text.includes('DOMContentLoaded') || text.includes('loadBooks') ||
          text.includes('loadMusic') || text.includes('loadGames') ||
          text.includes('loadSports') || text.includes('loadReviews') ||
          text.includes('initCategoryPage') || text.includes('initBrands') ||
          text.includes('loadPage') || text.includes('initPage')) {
        scripts.push(text);
      }
    });
    return scripts;
  }

  function findMainContainer() {
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

  function swapContent(newHTML, targetPage) {
    var container = findMainContainer();
    if (!container) return;

    container.classList.add('is-transitioning-out');

    setTimeout(function () {
      container.innerHTML = newHTML;
      container.classList.remove('is-transitioning-out');
      container.classList.add('is-transitioning-in');

      setTimeout(function () {
        container.classList.remove('is-transitioning-in');
      }, TRANSITION_MS + 50);

      document.body.setAttribute('data-nav-page', targetPage);
      setActiveNav(targetPage);

      window.scrollTo({ top: 0, behavior: 'instant' });

      window.dispatchEvent(new CustomEvent('spa:content-swapped', {
        detail: { page: targetPage }
      }));
    }, TRANSITION_MS);
  }

  async function navigateTo(url, pushState) {
    if (isTransitioning) return;
    var targetURL = new URL(url, window.location.origin);
    var targetPage = normalizePageName(targetURL.pathname);
    var currentPage = normalizePageName(window.location.pathname);

    if (targetPage === currentPage && !targetURL.search) return;
    if (!SPA_ROUTES.has(targetPage)) {
      window.location.href = url;
      return;
    }

    isTransitioning = true;
    showLoadBar();

    try {
      var resp = await fetch(url, { credentials: 'same-origin' });
      if (!resp.ok) throw new Error('Fetch failed');
      var html = await resp.text();

      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var content = extractContent(doc);

      if (!content) {
        window.location.href = url;
        return;
      }

      swapContent(content, targetPage);

      if (pushState !== false) {
        history.pushState({ spa: true, page: targetPage }, '', url);
      }

      setTimeout(function () {
        hideLoadBar();
        isTransitioning = false;
      }, TRANSITION_MS + 100);

    } catch (e) {
      hideLoadBar();
      isTransitioning = false;
      window.location.href = url;
    }
  }

  document.addEventListener('click', function (e) {
    if (isTransitioning) return;
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

    navigateTo(href, true);
  }, { capture: true });

  window.addEventListener('popstate', function (e) {
    if (isTransitioning) return;
    if (e.state && e.state.spa) {
      navigateTo(window.location.href, false);
    } else {
      window.location.reload();
    }
  });

  window.addEventListener('spa:content-swapped', function (e) {
    var page = e.detail && e.detail.page;
    if (page) {
      setActiveNav(page);
    }
  });

  document.body.classList.add('spa-ready');

})();
