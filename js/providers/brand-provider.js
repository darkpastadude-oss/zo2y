(function () {
  'use strict';

  var Content = window.Zo2yContent;

  function BrandProvider(config) {
    this.name = config.name;
    this.mediaType = config.mediaType;
    this.tableName = config.tableName;
    this.searchFields = config.searchFields || ['name'];
    this._cache = new Map();
    this._cacheTTL = 30 * 60 * 1000;
  }

  BrandProvider.prototype.search = function (query, options) {
    var self = this;
    var client = this._getClient();
    if (!client) return Promise.resolve({ items: [], total: 0 });

    var filter = this.searchFields.map(function (field) {
      return field + ' ilike.' + '%' + query + '%';
    }).join(',');

    return client.from(this.tableName)
      .select('*')
      .or(filter)
      .limit((options && options.limit) || 20)
      .then(function (result) {
        var items = (result.data || []).map(function (item) { return self.mapToContent(item); }).filter(Boolean);
        return { items: items, total: items.length };
      })
      .catch(function () { return { items: [], total: 0 }; });
  };

  BrandProvider.prototype.getById = function (id, options) {
    var self = this;
    var client = this._getClient();
    if (!client) return Promise.resolve(null);

    return client.from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()
      .then(function (result) { return result.data ? self.mapToContent(result.data) : null; })
      .catch(function () { return null; });
  };

  BrandProvider.prototype.getTrending = function (options) { return this.getPopular(options); };

  BrandProvider.prototype.getPopular = function (options) {
    var self = this;
    var client = this._getClient();
    if (!client) return Promise.resolve({ items: [], total: 0 });

    return client.from(this.tableName)
      .select('*')
      .limit((options && options.limit) || 30)
      .then(function (result) {
        var items = (result.data || []).map(function (item) { return self.mapToContent(item); }).filter(Boolean);
        return { items: items, total: items.length };
      })
      .catch(function () { return { items: [], total: 0 }; });
  };

  BrandProvider.prototype._getClient = function () {
    return window.__ZO2Y_SUPABASE_CLIENT || null;
  };

  BrandProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;
    var title = raw.name || '';
    if (!title) return null;

    var rawLogo = raw.logo_url || raw.logo || '';
    var domain = raw.domain || (title ? title.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : '');
    var logoUrl = rawLogo;
    if (!logoUrl || logoUrl.includes('placeholder') || logoUrl.includes('unavatar.io') || logoUrl.includes('google.com/s2/favicons') || logoUrl.includes('icon.horse')) {
      if (title) {
        var params = new URLSearchParams();
        params.set('title', title);
        if (domain) params.set('domain', domain);
        params.set('mode', 'logo');
        logoUrl = '/api/logo?' + params.toString();
      } else if (domain) {
        logoUrl = '/api/logo?domain=' + encodeURIComponent(domain) + '&mode=logo';
      }
    }

    return Content.normalizeContent({
      id: String(raw.id || ''),
      title: title,
      subtitle: raw.category || raw.industry || '',
      creators: raw.founder || raw.founders || '',
      description: raw.description || raw.bio || '',
      image: logoUrl,
      genres: [raw.category || raw.industry || ''].filter(Boolean),
      externalUrl: raw.website || raw.url || '',
      provider: this.name,
      providerId: String(raw.id || ''),
      metadata: {
        country: raw.country || raw.origin || '',
        yearFounded: raw.year_founded || raw.founded || '',
        headquarters: raw.headquarters || ''
      }
    }, this.mediaType);
  };

  BrandProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, this.mediaType);
  };

  function FashionProvider() {
    BrandProvider.call(this, {
      name: 'fashion',
      mediaType: Content.CONTENT_TYPES.FASHION,
      tableName: 'fashion_brands',
      searchFields: ['name', 'category']
    });
  }
  FashionProvider.prototype = Object.create(BrandProvider.prototype);
  FashionProvider.prototype.constructor = FashionProvider;

  function FoodProvider() {
    BrandProvider.call(this, {
      name: 'food',
      mediaType: Content.CONTENT_TYPES.FOOD,
      tableName: 'food_brands',
      searchFields: ['name', 'category']
    });
  }
  FoodProvider.prototype = Object.create(BrandProvider.prototype);
  FoodProvider.prototype.constructor = FoodProvider;

  function CarProvider() {
    BrandProvider.call(this, {
      name: 'car',
      mediaType: Content.CONTENT_TYPES.CAR,
      tableName: 'car_brands',
      searchFields: ['name', 'category']
    });
  }
  CarProvider.prototype = Object.create(BrandProvider.prototype);
  CarProvider.prototype.constructor = CarProvider;

  window.Zo2yBrandProvider = {
    BrandProvider: BrandProvider,
    FashionProvider: FashionProvider,
    FoodProvider: FoodProvider,
    CarProvider: CarProvider,
    fashion: new FashionProvider(),
    food: new FoodProvider(),
    car: new CarProvider()
  };
})();
