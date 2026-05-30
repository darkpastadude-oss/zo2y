(function () {
  'use strict';

  var currentUrl = window.location.href;
  var navInProgress = false;
  var prefetched = {};
  var TRANSITION_MS = 200;
  var NAV_KEY = 'zt-nav';
  var html = document.documentElement;

  function isRoutable(link) {
    if (!link || !link.href) return false;
    if (link.hasAttribute('download')) return false;
    if (link.getAttribute('target') === '_blank') return false;
    if (link.hasAttribute('data-no-transition')) return false;
    if (link.closest('[data-no-transition]')) return false;
    var href = (link.getAttribute('href') || '').trim();
    if (href === '' || href.startsWith('#') || href.startsWith('javascript:')) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      var url = new URL(link.href);
      if (url.origin !== window.location.origin) return false;
      var currentNoHash = currentUrl.split('#')[0];
      var targetNoHash = url.href.split('#')[0];
      if (targetNoHash === currentNoHash) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function prefetchPage(href) {
    if (prefetched[href]) return;
    prefetched[href] = true;
    try {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    } catch (e) {}
  }

  function navigateTo(url) {
    if (navInProgress) return;
    navInProgress = true;
    var targetHref = url.href;
    var body = document.body;
    if (!body) { window.location.href = targetHref; return; }

    try { sessionStorage.setItem(NAV_KEY, '1'); } catch (e) {}
    body.classList.add('zt-page-exit-active');
    setTimeout(function () {
      window.location.href = targetHref;
    }, TRANSITION_MS);
  }

  /* ── Click interception (register unconditionally) ── */
  document.addEventListener('click', function (e) {
    if (e.button !== 0) return;
    var link = e.target.closest('a[href]');
    if (!isRoutable(link)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;
    var url = new URL(link.href);
    if (url.href === currentUrl) return;
    e.preventDefault();
    navigateTo(url);
  }, true);

  /* ── Prefetch on hover ── */
  document.addEventListener('mouseenter', function (e) {
    var link = e.target.closest('a[href]');
    if (!link || !isRoutable(link)) return;
    prefetchPage(link.href);
  }, true);

  /* ── Handle bfcache restore ── */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.body.classList.remove('zt-page-exit-active');
      html.classList.remove('zt-loading');
      html.classList.remove('zt-ready');
      requestAnimationFrame(function () {
        html.classList.add('zt-page-enter');
        setTimeout(function () {
          html.classList.remove('zt-page-enter');
          html.classList.add('zt-ready');
        }, TRANSITION_MS + 50);
      });
    }
  });

  /* ── Incoming transition (fade-in on page load) ── */
  var isTransitionNav = false;
  try { isTransitionNav = sessionStorage.getItem(NAV_KEY) === '1'; } catch (e) {}

  if (isTransitionNav) {
    try { sessionStorage.removeItem(NAV_KEY); } catch (e) {}
    if (html.classList.contains('zt-ready')) {
      html.classList.remove('zt-loading');
    } else {
      html.classList.remove('zt-loading');
      requestAnimationFrame(function () {
        html.classList.add('zt-page-enter');
        setTimeout(function () {
          html.classList.remove('zt-page-enter');
          html.classList.add('zt-ready');
        }, TRANSITION_MS + 50);
      });
    }
  } else if (html.classList.contains('zt-loading')) {
    // Bootstrap will handle the fade-in via zt-ready
  } else if (!html.classList.contains('zt-ready')) {
    html.classList.add('zt-ready');
  }

  /* ── Public API ── */
  window.ZO2Y_TRANSITIONS = {
    navigate: function (href) {
      try {
        var url = new URL(href, window.location.origin);
        navigateTo(url);
      } catch (e) {
        window.location.href = href;
      }
    },
    prefetch: prefetchPage,
    clearNavFlag: function () {
      try { sessionStorage.removeItem(NAV_KEY); } catch (e) {}
    }
  };
})();
