(function () {
  'use strict';

  var Content = window.Zo2yContent;

  function ContentCache(options) {
    this._dbCache = new Map();
    this._memoryCache = new Map();
    this._dbCacheMaxSize = (options && options.dbCacheMaxSize) || 500;
    this._memoryCacheMaxSize = (options && options.memoryCacheMaxSize) || 100;
    this._memoryTTL = (options && options.memoryTTL) || 5 * 60 * 1000;
  }

  ContentCache.prototype.get = function (key) {
    var memHit = this._memoryGet(key);
    if (memHit) return Promise.resolve(memHit);
    var dbHit = this._dbGet(key);
    if (dbHit) {
      this._memorySet(key, dbHit);
      return Promise.resolve(dbHit);
    }
    return Promise.resolve(null);
  };

  ContentCache.prototype.set = function (key, value, options) {
    this._memorySet(key, value);
    this._dbSet(key, value, options);
    return Promise.resolve();
  };

  ContentCache.prototype.getByType = function (type, options) {
    var self = this;
    var client = this._getClient();
    if (!client) return Promise.resolve([]);

    var opts = options || {};
    var limit = opts.limit || 50;
    var offset = opts.offset || 0;

    return client.from('content_cache')
      .select('*')
      .eq('type', type)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .then(function (result) {
        return (result.data || []).map(function (row) {
          try { return JSON.parse(row.content); } catch (e) { return null; }
        }).filter(Boolean);
      })
      .catch(function () { return []; });
  };

  ContentCache.prototype.has = function (key) {
    return this._memoryHas(key) || this._dbHas(key);
  };

  ContentCache.prototype.invalidate = function (key) {
    this._memoryCache.delete(key);
    return this._dbDelete(key);
  };

  ContentCache.prototype.clear = function () {
    this._memoryCache.clear();
  };

  ContentCache.prototype._memoryGet = function (key) {
    var hit = this._memoryCache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this._memoryCache.delete(key);
      return null;
    }
    return hit.value;
  };

  ContentCache.prototype._memorySet = function (key, value) {
    if (this._memoryCache.size >= this._memoryCacheMaxSize) {
      var firstKey = this._memoryCache.keys().next().value;
      if (firstKey) this._memoryCache.delete(firstKey);
    }
    this._memoryCache.set(key, {
      value: value,
      expiresAt: Date.now() + this._memoryTTL
    });
  };

  ContentCache.prototype._memoryHas = function (key) {
    var hit = this._memoryCache.get(key);
    if (!hit) return false;
    if (Date.now() > hit.expiresAt) {
      this._memoryCache.delete(key);
      return false;
    }
    return true;
  };

  ContentCache.prototype._dbGet = function (key) {
    return this._dbCache.get(key) || null;
  };

  ContentCache.prototype._dbSet = function (key, value, options) {
    if (this._dbCache.size >= this._dbCacheMaxSize) {
      var firstKey = this._dbCache.keys().next().value;
      if (firstKey) this._dbCache.delete(firstKey);
    }
    this._dbCache.set(key, value);
  };

  ContentCache.prototype._dbHas = function (key) {
    return this._dbCache.has(key);
  };

  ContentCache.prototype._dbDelete = function (key) {
    this._dbCache.delete(key);
    return Promise.resolve();
  };

  ContentCache.prototype._getClient = function () {
    return window.__ZO2Y_SUPABASE_CLIENT || null;
  };

  window.Zo2yContentCache = new ContentCache();
})();
