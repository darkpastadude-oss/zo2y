(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  function GameProvider() {
    ContentProvider.call(this, {
      name: 'igdb',
      mediaType: Content.CONTENT_TYPES.GAME,
      apiBase: '/api/igdb',
      cacheTTL: 30 * 60 * 1000
    });
  }

  GameProvider.prototype = Object.create(ContentProvider.prototype);
  GameProvider.prototype.constructor = GameProvider;

  GameProvider.prototype.search = function (query, options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var url = this.apiBase + '/games?search=' + encodeURIComponent(query) + '&page_size=' + limit;

    return this._fetchJson(url, { cacheKey: 'game:search:' + query })
      .then(function (data) {
        var items = data.results || data.data || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.count || items.length
        };
      });
  };

  GameProvider.prototype.getById = function (id, options) {
    var self = this;
    var url = this.apiBase + '/games/' + encodeURIComponent(id);

    return this._fetchJson(url, { cacheKey: 'game:detail:' + id, ttlMs: 60 * 60 * 1000 })
      .then(function (data) { return self.mapToContent(data); });
  };

  GameProvider.prototype.getTrending = function (options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var url = this.apiBase + '/games?page_size=' + limit + '&ordering=-added';

    return this._fetchJson(url, { cacheKey: 'game:trending' })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.count || items.length
        };
      });
  };

  GameProvider.prototype.getPopular = function (options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var page = opts.page || 1;
    var genre = opts.genre || '';
    var url = this.apiBase + '/games?page=' + page + '&page_size=' + limit + '&ordering=-rating';
    if (genre) url += '&genres=' + encodeURIComponent(genre);

    return this._fetchJson(url, { cacheKey: 'game:popular:' + genre + ':' + page })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.count || items.length
        };
      });
  };

  GameProvider.prototype.getGenres = function () {
    return this._fetchJson(this.apiBase + '/genres', { cacheKey: 'game:genres', ttlMs: 60 * 60 * 1000 })
      .then(function (data) { return data.results || []; });
  };

  GameProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;

    var title = raw.name || raw.title || '';
    if (!title) return null;

    var image = '';
    if (raw.cover) {
      if (typeof raw.cover === 'object') {
        image = raw.cover.url || raw.cover.image || '';
      } else {
        image = String(raw.cover);
      }
    }
    if (!image) image = raw.image || raw.background_image || '';

    var heroBackground = raw.hero_background || raw.background_image || raw.hero_url || raw.background_image_additional || '';
    var heroBackgroundSecondary = raw.hero_background_secondary || raw.background_image_additional || '';

    var screenshots = [];
    if (Array.isArray(raw.screenshots)) {
      screenshots = raw.screenshots.map(function(s) {
        if (typeof s === 'string') return s;
        return s?.image || s?.url || '';
      }).filter(Boolean);
    }

    var genres = raw.genres || [];
    var genreNames = genres.map(function (g) {
      if (typeof g === 'string') return g;
      if (typeof g === 'object' && g !== null) return g.name || String(g.name || '');
      return '';
    }).filter(Boolean);

    var developers = raw.developers || raw.involved_companies || [];
    var devNames = developers.map(function (d) {
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d !== null) return d.name || '';
      return '';
    }).filter(Boolean);

    var releaseDate = raw.released || raw.release_date || '';

    return Content.normalizeContent({
      id: String(raw.id || raw.slug || ''),
      title: title,
      subtitle: devNames.join(', '),
      creators: devNames.join(', '),
      description: raw.description || raw.storyline || '',
      image: image,
      heroBackground: heroBackground,
      heroBackgroundSecondary: heroBackgroundSecondary,
      screenshots: screenshots,
      genres: genreNames,
      releaseDate: releaseDate,
      language: raw.language || '',
      rating: Number(raw.rating || raw.metacritic || 0),
      ratingsCount: Number(raw.ratings_count || 0),
      popularity: Number(raw.added || 0),
      externalUrl: raw.url || '',
      provider: 'wikipedia',
      providerId: String(raw.id || ''),
      metadata: {
        platforms: (raw.platforms || []).map(function (p) {
          return (typeof p === 'object' && p !== null) ? (p.platform && p.platform.name ? p.platform.name : '') : String(p);
        }).filter(Boolean),
        metacritic: raw.metacritic || 0,
        esrbRating: raw.esrb_rating || '',
        website: raw.website || '',
        redditUrl: raw.reddit_url || '',
        stores: (raw.stores || []).length
      }
    }, Content.CONTENT_TYPES.GAME);
  };

  GameProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.GAME);
  };

  window.Zo2yGameProvider = new GameProvider();
})();
