(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  function MusicProvider() {
    ContentProvider.call(this, {
      name: 'music',
      mediaType: Content.CONTENT_TYPES.ARTIST,
      apiBase: '/api/music',
      cacheTTL: 10 * 60 * 1000
    });
  }

  MusicProvider.prototype = Object.create(ContentProvider.prototype);
  MusicProvider.prototype.constructor = MusicProvider;

  MusicProvider.prototype.search = function (query, options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var url = this.apiBase + '/search?q=' + encodeURIComponent(query) + '&limit=' + limit;

    return this._fetchJson(url, { cacheKey: 'music:search:' + query })
      .then(function (data) {
        var items = data.results || data.artists || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total || items.length
        };
      });
  };

  MusicProvider.prototype.getById = function (id, options) {
    var self = this;
    var url = this.apiBase + '/artist/' + encodeURIComponent(id);

    return this._fetchJson(url, { cacheKey: 'music:artist:' + id })
      .then(function (data) { return self.mapToContent(data); });
  };

  MusicProvider.prototype.getTrending = function (options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 30;
    var url = this.apiBase + '/trending?limit=' + limit;

    return this._fetchJson(url, { cacheKey: 'music:trending' })
      .then(function (data) {
        var items = data.results || data.artists || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: items.length
        };
      });
  };

  MusicProvider.prototype.getPopular = function (options) {
    return this.getTrending(options);
  };

  MusicProvider.prototype.getArtistTopTracks = function (artistId, options) {
    var url = this.apiBase + '/artist/' + encodeURIComponent(artistId) + '/top-tracks';
    return this._fetchJson(url, { cacheKey: 'music:top:' + artistId })
      .then(function (data) { return data.tracks || []; });
  };

  MusicProvider.prototype.getArtistAlbums = function (artistId, options) {
    var url = this.apiBase + '/artist/' + encodeURIComponent(artistId) + '/albums';
    return this._fetchJson(url, { cacheKey: 'music:albums:' + artistId })
      .then(function (data) { return data.albums || []; });
  };

  MusicProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;
    var images = raw.images || [];
    var image = images.length > 0 ? images[0].url : (raw.image || '');
    var genres = raw.genres || [];
    var genreArr = Content.toArray(genres).map(function (g) {
      return typeof g === 'string' ? g : (g.name || String(g));
    }).filter(Boolean);

    var externalUrl = '';
    if (raw.external_urls && raw.external_urls.spotify) {
      externalUrl = raw.external_urls.spotify;
    } else if (raw.externalUrl) {
      externalUrl = raw.externalUrl;
    }

    return Content.normalizeContent({
      id: String(raw.id || ''),
      title: String(raw.name || raw.title || '').trim(),
      subtitle: genreArr.slice(0, 2).join(', ') || 'Music',
      creators: String(raw.name || '').trim(),
      description: raw.description || '',
      image: image,
      genres: genreArr,
      rating: Number(raw.popularity || 0),
      popularity: Number(raw.popularity || 0),
      externalUrl: externalUrl,
      provider: 'spotify',
      providerId: String(raw.id || ''),
      metadata: {
        followers: Number(raw.followers && raw.followers.total ? raw.followers.total : 0),
        explicit: !!raw.explicit
      }
    }, Content.CONTENT_TYPES.ARTIST);
  };

  MusicProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.MUSIC);
  };

  window.Zo2yMusicProvider = new MusicProvider();
})();
