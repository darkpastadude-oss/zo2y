(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var CONTENT_TYPES = Content.CONTENT_TYPES;

  var _providers = {};
  var _mediaTypeMap = {};

  function register(provider, mediaTypes) {
    if (!provider || !provider.name) throw new Error('Provider must have a name');
    _providers[provider.name] = provider;
    var types = mediaTypes || [provider.mediaType];
    types.forEach(function (type) {
      if (!_mediaTypeMap[type]) _mediaTypeMap[type] = [];
      if (!_mediaTypeMap[type].includes(provider.name)) {
        _mediaTypeMap[type].push(provider.name);
      }
    });
  }

  function get(name) {
    return _providers[name] || null;
  }

  function getByMediaType(mediaType) {
    var names = _mediaTypeMap[mediaType] || [];
    return names.length > 0 ? _providers[names[0]] : null;
  }

  function getAllByMediaType(mediaType) {
    var names = _mediaTypeMap[mediaType] || [];
    return names.map(function (n) { return _providers[n]; }).filter(Boolean);
  }

  function getAll() {
    return Object.keys(_providers).map(function (k) { return _providers[k]; });
  }

  function getMediaTypeNames() {
    return Object.keys(_mediaTypeMap);
  }

  function search(query, options) {
    var opts = options || {};
    var mediaTypes = opts.mediaTypes || Object.keys(_mediaTypeMap);
    var limit = opts.limit || 10;
    var perType = Math.ceil(limit / mediaTypes.length);

    var promises = mediaTypes.map(function (type) {
      var provider = getByMediaType(type);
      if (!provider || typeof provider.search !== 'function') return Promise.resolve({ items: [], total: 0, type: type });
      return provider.search(query, { limit: perType })
        .then(function (result) {
          return { items: result.items || [], total: result.total || 0, type: type };
        })
        .catch(function () { return { items: [], total: 0, type: type }; });
    });

    return Promise.all(promises).then(function (results) {
      var allItems = [];
      var totalByType = {};
      results.forEach(function (r) {
        totalByType[r.type] = r.total;
        allItems = allItems.concat(r.items);
      });
      return { items: allItems, totalByType: totalByType };
    });
  }

  function searchUniversal(query, options) {
    var opts = options || {};
    var limit = opts.limit || 10;

    var searchConfigs = [
      { type: CONTENT_TYPES.MOVIE, provider: get('tmdb-movie') },
      { type: CONTENT_TYPES.TV, provider: get('tmdb-tv') },
      { type: CONTENT_TYPES.ANIME, provider: get('tmdb-anime') },
      { type: CONTENT_TYPES.GAME, provider: get('igdb') },
      { type: CONTENT_TYPES.BOOK, provider: get('books') },
      { type: CONTENT_TYPES.ARTIST, provider: get('music') },
      { type: CONTENT_TYPES.TRAVEL, provider: get('restcountries') },
      { type: CONTENT_TYPES.SPORTS, provider: get('sportsdb') },
      { type: CONTENT_TYPES.FASHION, provider: get('fashion') },
      { type: CONTENT_TYPES.FOOD, provider: get('food') },
      { type: CONTENT_TYPES.CAR, provider: get('car') }
    ];

    var promises = searchConfigs.map(function (cfg) {
      if (!cfg.provider || typeof cfg.provider.search !== 'function') {
        return Promise.resolve({ type: cfg.type, items: [], total: 0 });
      }
      return cfg.provider.search(query, { limit: limit })
        .then(function (result) {
          return { type: cfg.type, items: result.items || [], total: result.total || 0 };
        })
        .catch(function () { return { type: cfg.type, items: [], total: 0 }; });
    });

    return Promise.all(promises).then(function (results) {
      var merged = {};
      results.forEach(function (r) {
        var typeKey = r.type;
        if (!merged[typeKey]) merged[typeKey] = [];
        merged[typeKey] = merged[typeKey].concat(r.items.map(function (item) {
          return Content.createSearchResult(item, r.type);
        })).filter(Boolean);
      });
      return merged;
    });
  }

  function init() {
    if (window.Zo2yBookProvider) register(window.Zo2yBookProvider, [CONTENT_TYPES.BOOK]);
    if (window.Zo2yMusicProvider) register(window.Zo2yMusicProvider, [CONTENT_TYPES.MUSIC, CONTENT_TYPES.ARTIST]);
    if (window.Zo2yMovieProvider) register(window.Zo2yMovieProvider, [CONTENT_TYPES.MOVIE]);
    if (window.Zo2yTvProvider) register(window.Zo2yTvProvider, [CONTENT_TYPES.TV]);
    if (window.Zo2yAnimeProvider) register(window.Zo2yAnimeProvider, [CONTENT_TYPES.ANIME]);
    if (window.Zo2yGameProvider) register(window.Zo2yGameProvider, [CONTENT_TYPES.GAME]);
    if (window.Zo2ySportsProvider) register(window.Zo2ySportsProvider, [CONTENT_TYPES.SPORTS]);
    if (window.Zo2yTravelProvider) register(window.Zo2yTravelProvider, [CONTENT_TYPES.TRAVEL]);
    if (window.Zo2yBrandProvider && window.Zo2yBrandProvider.fashion) {
      register(window.Zo2yBrandProvider.fashion, [CONTENT_TYPES.FASHION]);
    }
    if (window.Zo2yBrandProvider && window.Zo2yBrandProvider.food) {
      register(window.Zo2yBrandProvider.food, [CONTENT_TYPES.FOOD]);
    }
    if (window.Zo2yBrandProvider && window.Zo2yBrandProvider.car) {
      register(window.Zo2yBrandProvider.car, [CONTENT_TYPES.CAR]);
    }
  }

  window.Zo2yProviderRegistry = {
    register: register,
    get: get,
    getByMediaType: getByMediaType,
    getAllByMediaType: getAllByMediaType,
    getAll: getAll,
    getMediaTypeNames: getMediaTypeNames,
    search: search,
    searchUniversal: searchUniversal,
    init: init
  };
})();
