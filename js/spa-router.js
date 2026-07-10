/* spa-router.js — consolidated into js/components/navigation.js */
/* This file kept as a shim for pages that still reference it. */
(function () {
  'use strict';
  if (window.Navigation && typeof window.Navigation.init === 'function') {
    window.Navigation.init();
  }
})();
