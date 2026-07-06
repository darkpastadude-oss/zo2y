(function () {
  'use strict';

  var providerScripts = [
    'js/providers/content-model.js',
    'js/providers/content-provider.js',
    'js/providers/book-provider.js',
    'js/providers/music-provider.js',
    'js/providers/tmdb-provider.js',
    'js/providers/game-provider.js',
    'js/providers/sports-provider.js',
    'js/providers/travel-provider.js',
    'js/providers/brand-provider.js',
    'js/providers/content-cache.js',
    'js/providers/provider-registry.js'
  ];

  var loaded = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src + '?v=' + Date.now();
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(script);
    });
  }

  function loadAll() {
    if (loaded) return Promise.resolve();
    if (window.Zo2yProviderRegistry) {
      loaded = true;
      return Promise.resolve();
    }

    var chain = Promise.resolve();
    providerScripts.forEach(function (src) {
      chain = chain.then(function () { return loadScript(src); });
    });

    return chain
      .then(function () {
        if (window.Zo2yProviderRegistry && window.Zo2yProviderRegistry.init) {
          window.Zo2yProviderRegistry.init();
        }
        loaded = true;
      })
      .catch(function (err) {
        console.warn('Provider system failed to load:', err);
      });
  }

  function whenReady(callback) {
    if (window.Zo2yProviderRegistry && loaded) {
      callback();
      return;
    }
    loadAll().then(callback);
  }

  window.Zo2yProviders = {
    load: loadAll,
    whenReady: whenReady,
    isLoaded: function () { return loaded; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { loadAll(); }, { once: true });
  } else {
    loadAll();
  }
})();
