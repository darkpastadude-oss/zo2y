(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  function TravelProvider() {
    ContentProvider.call(this, {
      name: 'restcountries',
      mediaType: Content.CONTENT_TYPES.TRAVEL,
      apiBase: '/api/restcountries',
      cacheTTL: 60 * 60 * 1000
    });
    this._allCountries = null;
  }

  TravelProvider.prototype = Object.create(ContentProvider.prototype);
  TravelProvider.prototype.constructor = TravelProvider;

  TravelProvider.prototype._loadAll = function () {
    var self = this;
    if (this._allCountries) return Promise.resolve(this._allCountries);
    return this._fetchJson(this.apiBase + '/all?fields=name,cca2,cca3,region,subregion,flags,population,capital,languages,currencies,flag', {
      cacheKey: 'travel:all',
      ttlMs: 60 * 60 * 1000
    }).then(function (data) {
      self._allCountries = data;
      return data;
    });
  };

  TravelProvider.prototype.search = function (query, options) {
    var self = this;
    return this._loadAll().then(function (countries) {
      var q = String(query || '').toLowerCase();
      var matches = countries.filter(function (c) {
        var name = (c.name && c.name.common) ? c.name.common.toLowerCase() : '';
        var official = (c.name && c.name.official) ? c.name.official.toLowerCase() : '';
        return name.includes(q) || official.includes(q);
      }).slice(0, (options && options.limit) || 20);

      return {
        items: matches.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
        total: matches.length
      };
    });
  };

  TravelProvider.prototype.getById = function (id, options) {
    var self = this;
    var code = String(id).toUpperCase();
    return this._fetchJson(this.apiBase + '/alpha/' + encodeURIComponent(code) + '?fields=name,cca2,cca3,region,subregion,flags,population,capital,languages,currencies,flag,maps,car,continents,timezones,coatOfArts', {
      cacheKey: 'travel:country:' + code
    }).then(function (data) {
      var items = Array.isArray(data) ? data : [data];
      return items.length > 0 ? self.mapToContent(items[0]) : null;
    });
  };

  TravelProvider.prototype.getTrending = function (options) {
    return this.getPopular(options);
  };

  TravelProvider.prototype.getPopular = function (options) {
    var self = this;
    var opts = options || {};
    var region = opts.region || '';
    return this._loadAll().then(function (countries) {
      var filtered = region
        ? countries.filter(function (c) {
            return String(c.region || '').toLowerCase() === region.toLowerCase();
          })
        : countries;
      var sorted = filtered.sort(function (a, b) {
        return (b.population || 0) - (a.population || 0);
      }).slice(0, (opts.limit || 50));

      return {
        items: sorted.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
        total: sorted.length
      };
    });
  };

  TravelProvider.prototype.getByRegion = function (region) {
    return this.getPopular({ region: region });
  };

  TravelProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;

    var name = (raw.name && raw.name.common) ? raw.name.common : '';
    if (!name) return null;

    var code = raw.cca2 || raw.cca3 || '';
    var flag = raw.flags && (raw.flags.png || raw.flags.svg) ? (raw.flags.png || raw.flags.svg) : (raw.flag || '');
    var languages = raw.languages ? Object.values(raw.languages).join(', ') : '';
    var currencies = raw.currencies ? Object.values(raw.currencies).map(function (c) { return c.name || ''; }).filter(Boolean).join(', ') : '';
    var capital = raw.capital ? (Array.isArray(raw.capital) ? raw.capital.join(', ') : raw.capital) : '';

    return Content.normalizeContent({
      id: code,
      title: name,
      subtitle: raw.subregion || raw.region || '',
      creators: capital,
      description: languages ? 'Languages: ' + languages : '',
      image: flag,
      genres: [raw.region, raw.subregion].filter(Boolean),
      language: languages,
      externalUrl: (raw.maps && raw.maps.googleMaps) || '',
      provider: 'restcountries',
      providerId: code,
      metadata: {
        cca2: raw.cca2 || '',
        cca3: raw.cca3 || '',
        region: raw.region || '',
        subregion: raw.subregion || '',
        population: raw.population || 0,
        capital: capital,
        languages: languages,
        currencies: currencies,
        continents: raw.continents || [],
        timezones: raw.timezones || [],
        carSide: raw.car && raw.car.side ? raw.car.side : '',
        coatOfArts: raw.coatOfArts ? (raw.coatOfArts.png || raw.coatOfArts.svg || '') : ''
      }
    }, Content.CONTENT_TYPES.TRAVEL);
  };

  TravelProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.TRAVEL);
  };

  window.Zo2yTravelProvider = new TravelProvider();
})();
