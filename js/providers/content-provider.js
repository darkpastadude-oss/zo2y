(function () {
  'use strict';

  var PROVIDER_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error'
  };

  function ContentProvider(config) {
    this.name = config.name || 'unknown';
    this.mediaType = config.mediaType || 'unknown';
    this.apiBase = config.apiBase || '/api/' + this.name;
    this.state = PROVIDER_STATES.IDLE;
    this._cache = new Map();
    this._cacheTTL = config.cacheTTL || 5 * 60 * 1000;
  }

  ContentProvider.prototype.search = function (query, options) {
    throw new Error('Provider ' + this.name + ' must implement search()');
  };

  ContentProvider.prototype.getById = function (id, options) {
    throw new Error('Provider ' + this.name + ' must implement getById()');
  };

  ContentProvider.prototype.getTrending = function (options) {
    throw new Error('Provider ' + this.name + ' must implement getTrending()');
  };

  ContentProvider.prototype.getPopular = function (options) {
    throw new Error('Provider ' + this.name + ' must implement getPopular()');
  };

  ContentProvider.prototype.mapToContent = function (raw) {
    throw new Error('Provider ' + this.name + ' must implement mapToContent()');
  };

  ContentProvider.prototype.mapSearchResult = function (raw) {
    throw new Error('Provider ' + this.name + ' must implement mapSearchResult()');
  };

  ContentProvider.prototype._fetchJson = function (url, options) {
    var self = this;
    var opts = options || {};
    var cacheKey = opts.cacheKey || url;
    var ttlMs = opts.ttlMs || this._cacheTTL;

    if (!opts.noCache) {
      var hit = this._cacheGet(cacheKey);
      if (hit) return Promise.resolve(hit);
    }

    var controller = new AbortController();
    var timeoutMs = opts.timeoutMs || 8000;
    var timeout = setTimeout(function () { controller.abort(); }, timeoutMs);

    return fetch(url, {
      signal: controller.signal,
      headers: opts.headers || {}
    })
      .then(function (res) {
        clearTimeout(timeout);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        self._cacheSet(cacheKey, data, ttlMs);
        return data;
      })
      .catch(function (err) {
        clearTimeout(timeout);
        throw err;
      });
  };

  ContentProvider.prototype._cacheGet = function (key) {
    var hit = this._cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return hit.value;
  };

  ContentProvider.prototype._cacheSet = function (key, value, ttl) {
    this._cache.set(key, {
      value: value,
      expiresAt: Date.now() + ttl
    });
  };

  ContentProvider.prototype._cacheClear = function () {
    this._cache.clear();
  };

  window.Zo2yContentProvider = {
    ContentProvider: ContentProvider,
    PROVIDER_STATES: PROVIDER_STATES
  };
})();
