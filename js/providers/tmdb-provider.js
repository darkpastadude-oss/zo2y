(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  var POSTER_BASE = 'https://image.tmdb.org/t/p/';
  var POSTER_SIZES = { w92: 'w92', w154: 'w154', w185: 'w185', w342: 'w342', w500: 'w500', original: 'original' };

  function TmdbProvider(config) {
    ContentProvider.call(this, {
      name: config.name || 'tmdb',
      mediaType: config.mediaType || Content.CONTENT_TYPES.MOVIE,
      apiBase: config.apiBase || '/api/tmdb',
      cacheTTL: config.cacheTTL || 5 * 60 * 1000
    });
    this.tmdbMediaType = config.tmdbMediaType || 'movie';
  }

  TmdbProvider.prototype = Object.create(ContentProvider.prototype);
  TmdbProvider.prototype.constructor = TmdbProvider;

  TmdbProvider.prototype.search = function (query, options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var page = opts.page || 1;
    var url = this.apiBase + '/search/' + this.tmdbMediaType + '?query=' + encodeURIComponent(query) + '&page=' + page + '&language=en';

    return this._fetchJson(url, { cacheKey: this.name + ':search:' + query + ':' + page })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total_results || items.length
        };
      });
  };

  TmdbProvider.prototype.getById = function (id, options) {
    var self = this;
    var opts = options || {};
    var append = opts.appendToResponse || 'credits,videos,keywords,external_ids,images';
    var url = this.apiBase + '/' + this.tmdbMediaType + '/' + encodeURIComponent(id) +
      '?language=en&append_to_response=' + append + '&include_image_language=en,null';

    return this._fetchJson(url, { cacheKey: this.name + ':detail:' + id, ttlMs: 30 * 60 * 1000 })
      .then(function (data) { return self.mapToContent(data); });
  };

  TmdbProvider.prototype.getTrending = function (options) {
    var self = this;
    var opts = options || {};
    var timeWindow = opts.timeWindow || 'week';
    var url = this.apiBase + '/trending/' + this.tmdbMediaType + '/' + timeWindow + '?language=en';

    return this._fetchJson(url, { cacheKey: this.name + ':trending:' + timeWindow })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total_results || items.length
        };
      });
  };

  TmdbProvider.prototype.getPopular = function (options) {
    var self = this;
    var opts = options || {};
    var page = opts.page || 1;
    var url = this.apiBase + '/' + this.tmdbMediaType + '/popular?page=' + page + '&language=en';

    return this._fetchJson(url, { cacheKey: this.name + ':popular:' + page })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total_results || items.length
        };
      });
  };

  TmdbProvider.prototype.getDiscover = function (options) {
    var self = this;
    var opts = options || {};
    var params = [];
    if (opts.genre) params.push('with_genres=' + opts.genre);
    if (opts.sortBy) params.push('sort_by=' + opts.sortBy);
    params.push('page=' + (opts.page || 1));
    params.push('language=en');
    var url = this.apiBase + '/discover/' + this.tmdbMediaType + '?' + params.join('&');

    return this._fetchJson(url, { cacheKey: this.name + ':discover:' + JSON.stringify(opts) })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total_results || items.length
        };
      });
  };

  TmdbProvider.prototype.getGenres = function () {
    var url = this.apiBase + '/genre/' + this.tmdbMediaType + '/list?language=en';
    return this._fetchJson(url, { cacheKey: this.name + ':genres', ttlMs: 60 * 60 * 1000 })
      .then(function (data) { return data.genres || []; });
  };

  TmdbProvider.prototype.getCredits = function (id) {
    var url = this.apiBase + '/' + this.tmdbMediaType + '/' + id + '/credits?language=en';
    return this._fetchJson(url, { cacheKey: this.name + ':credits:' + id })
      .then(function (data) { return { cast: data.cast || [], crew: data.crew || [] }; });
  };

  TmdbProvider.prototype.getVideos = function (id) {
    var url = this.apiBase + '/' + this.tmdbMediaType + '/' + id + '/videos?language=en';
    return this._fetchJson(url, { cacheKey: this.name + ':videos:' + id })
      .then(function (data) { return data.results || []; });
  };

  TmdbProvider.prototype.getWatchProviders = function (id) {
    var url = this.apiBase + '/' + this.tmdbMediaType + '/' + id + '/watch/providers';
    return this._fetchJson(url, { cacheKey: this.name + ':providers:' + id })
      .then(function (data) { return data.results || {}; });
  };

  TmdbProvider.prototype.getRawById = function (id, options) {
    var self = this;
    var opts = options || {};
    var append = opts.appendToResponse || 'credits,videos,keywords,external_ids,images';
    var url = this.apiBase + '/' + this.tmdbMediaType + '/' + encodeURIComponent(id) +
      '?language=en&append_to_response=' + append + '&include_image_language=en,null';

    return this._fetchJson(url, { cacheKey: this.name + ':detail:' + id, ttlMs: 30 * 60 * 1000 })
      .then(function (raw) {
        return {
          raw: raw,
          content: self.mapToContent(raw)
        };
      });
  };

  TmdbProvider.prototype.posterUrl = function (path, size) {
    if (!path) return '';
    return POSTER_BASE + (size || 'w500') + path;
  };

  TmdbProvider.prototype.backdropUrl = function (path, size) {
    if (!path) return '';
    return POSTER_BASE + (size || 'original') + path;
  };

  TmdbProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;

    var title = raw.title || raw.name || '';
    if (!title) return null;

    var posterPath = raw.poster_path || '';
    var backdropPath = raw.backdrop_path || '';
    var genres = raw.genres || [];
    if (Array.isArray(raw.genre_ids) && raw.genre_ids.length > 0 && genres.length === 0) {
      genres = raw.genre_ids.map(function (id) { return { id: id, name: '' }; });
    }
    var genreNames = genres.map(function (g) {
      return (typeof g === 'object' && g !== null) ? (g.name || '') : String(g);
    }).filter(Boolean);

    var credits = raw.credits || {};
    var cast = credits.cast || [];
    var crew = credits.crew || [];
    var directors = crew.filter(function (c) { return c.job === 'Director'; });
    var creators = raw.created_by || [];
    var creatorsList = creators.map(function (c) { return c.name || ''; }).filter(Boolean);
    if (directors.length > 0) {
      directors.forEach(function (d) { creatorsList.push(d.name || ''); });
    }
    var creatorsStr = creatorsList.filter(Boolean).join(', ');

    var releaseDate = raw.release_date || raw.first_air_date || '';
    var year = releaseDate ? parseInt(String(releaseDate).substring(0, 4)) : null;

    var externalIds = raw.external_ids || {};
    if (raw.imdb_id) externalIds.imdb_id = raw.imdb_id;

    return Content.normalizeContent({
      id: String(raw.id || ''),
      title: title,
      subtitle: raw.tagline || '',
      creators: creatorsStr,
      description: raw.overview || '',
      image: posterPath ? this.posterUrl(posterPath, 'w500') : '',
      backdrop: backdropPath ? this.backdropUrl(backdropPath) : '',
      genres: genreNames,
      releaseDate: releaseDate,
      language: raw.original_language || '',
      rating: Number(raw.vote_average || 0),
      ratingsCount: Number(raw.vote_count || 0),
      popularity: Number(raw.popularity || 0),
      externalIds: externalIds,
      externalUrl: raw.homepage || '',
      provider: 'tmdb',
      providerId: String(raw.id || ''),
      metadata: {
        status: raw.status || '',
        runtime: raw.runtime || 0,
        budget: raw.budget || 0,
        revenue: raw.revenue || 0,
        originalTitle: raw.original_title || raw.original_name || '',
        originCountry: raw.origin_country || [],
        productionCompanies: (raw.production_companies || []).map(function (c) { return c.name || ''; }).filter(Boolean),
        seasons: raw.number_of_seasons || 0,
        episodes: raw.number_of_episodes || 0,
        lastAirDate: raw.last_air_date || ''
      }
    }, this.mediaType);
  };

  TmdbProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, this.mediaType);
  };

  function MovieProvider() {
    TmdbProvider.call(this, {
      name: 'tmdb-movie',
      mediaType: Content.CONTENT_TYPES.MOVIE,
      tmdbMediaType: 'movie'
    });
  }
  MovieProvider.prototype = Object.create(TmdbProvider.prototype);
  MovieProvider.prototype.constructor = MovieProvider;

  window.Zo2yMovieProvider = new MovieProvider();

  function TvProvider() {
    TmdbProvider.call(this, {
      name: 'tmdb-tv',
      mediaType: Content.CONTENT_TYPES.TV,
      tmdbMediaType: 'tv'
    });
  }
  TvProvider.prototype = Object.create(TmdbProvider.prototype);
  TvProvider.prototype.constructor = TvProvider;

  window.Zo2yTvProvider = new TvProvider();

  function AnimeProvider() {
    TmdbProvider.call(this, {
      name: 'tmdb-anime',
      mediaType: Content.CONTENT_TYPES.ANIME,
      tmdbMediaType: 'tv'
    });
  }
  AnimeProvider.prototype = Object.create(TmdbProvider.prototype);
  AnimeProvider.prototype.constructor = AnimeProvider;

  AnimeProvider.prototype.search = function (query, options) {
    var self = this;
    var opts = options || {};
    var animeQuery = query + ' anime';
    var url = this.apiBase + '/search/tv?query=' + encodeURIComponent(animeQuery) + '&page=' + (opts.page || 1) + '&language=en';

    return this._fetchJson(url, { cacheKey: 'anime:search:' + query + ':' + (opts.page || 1) })
      .then(function (data) {
        var items = data.results || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total_results || items.length
        };
      });
  };

  window.Zo2yAnimeProvider = new AnimeProvider();

  window.Zo2yTmdbProvider = {
    MovieProvider: MovieProvider,
    TvProvider: TvProvider,
    AnimeProvider: AnimeProvider,
    TmdbProvider: TmdbProvider,
    POSTER_BASE: POSTER_BASE,
    POSTER_SIZES: POSTER_SIZES
  };
})();
