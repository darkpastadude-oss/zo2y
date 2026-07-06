(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  function BookProvider() {
    ContentProvider.call(this, {
      name: 'books',
      mediaType: Content.CONTENT_TYPES.BOOK,
      apiBase: '/api/books',
      cacheTTL: 5 * 60 * 1000
    });
  }

  BookProvider.prototype = Object.create(ContentProvider.prototype);
  BookProvider.prototype.constructor = BookProvider;

  BookProvider.prototype.search = function (query, options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var startIndex = opts.startIndex || 0;
    var url = this.apiBase + '/search?q=' + encodeURIComponent(query) + '&limit=' + limit + '&startIndex=' + startIndex;

    return this._fetchJson(url, { cacheKey: 'book:search:' + query + ':' + startIndex })
      .then(function (data) {
        var items = data.books || data.items || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total || items.length
        };
      });
  };

  BookProvider.prototype.getById = function (id, options) {
    var self = this;
    var url = this.apiBase + '/volumes/' + encodeURIComponent(id);

    return this._fetchJson(url, { cacheKey: 'book:detail:' + id, ttlMs: 30 * 60 * 1000 })
      .then(function (data) { return self.mapToContent(data); });
  };

  BookProvider.prototype.getTrending = function (options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var genre = opts.genre || 'fiction';
    var url = this.apiBase + '/trending?limit=' + limit + '&genre=' + encodeURIComponent(genre);

    return this._fetchJson(url, { cacheKey: 'book:trending:' + genre, ttlMs: 30 * 60 * 1000 })
      .then(function (data) {
        var items = data.books || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total || items.length
        };
      });
  };

  BookProvider.prototype.getPopular = function (options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 20;
    var startIndex = opts.startIndex || 0;
    var genre = opts.genre || '';
    var sort = opts.sort || '';
    var url = this.apiBase + '/popular?limit=' + limit + '&startIndex=' + startIndex;
    if (genre) url += '&genre=' + encodeURIComponent(genre);
    if (sort) url += '&sort=' + encodeURIComponent(sort);

    return this._fetchJson(url, { cacheKey: 'book:popular:' + genre + ':' + sort + ':' + startIndex })
      .then(function (data) {
        var items = data.books || data.items || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: data.total || items.length
        };
      });
  };

  BookProvider.prototype.getRecommendations = function (bookId, options) {
    var self = this;
    var opts = options || {};
    var limit = opts.limit || 12;
    var url = this.apiBase + '/recommendations?id=' + encodeURIComponent(bookId) + '&limit=' + limit;

    return this._fetchJson(url, { cacheKey: 'book:recs:' + bookId })
      .then(function (data) {
        var items = data.books || [];
        return items.map(function (item) { return self.mapToContent(item); }).filter(Boolean);
      });
  };

  BookProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;
    var vi = raw.volumeInfo || raw;
    var imageLinks = vi.imageLinks || {};
    var rawCover = imageLinks.thumbnail || imageLinks.smallThumbnail || raw.image || raw.cover || '';
    var image = rawCover ? Content.toHttps(rawCover) : '';

    var authors = vi.authors || (vi.author ? [vi.author] : []);
    var authorStr = Array.isArray(authors) ? authors.filter(Boolean).join(', ') : String(authors || '');
    var publishedDate = vi.publishedDate || raw.year || '';
    var year = publishedDate ? parseInt(String(publishedDate).substring(0, 4)) : null;
    var categories = vi.categories || vi.genres || vi.subject || [];
    var catArr = Content.toArray(categories);

    var genres = catArr.map(function (g) {
      return typeof g === 'string' ? g : (g.name || String(g));
    }).filter(Boolean);

    var isbn = vi.isbn || (raw.volumeInfo && raw.volumeInfo.industryIdentifiers
      ? (raw.volumeInfo.industryIdentifiers.find(function (i) { return i.type === 'ISBN_13'; }) || {}).identifier
      : '') || '';

    return Content.normalizeContent({
      id: raw.id || '',
      title: String(vi.title || '').trim(),
      subtitle: String(vi.subtitle || '').trim(),
      creators: authorStr,
      authors: authorStr,
      description: vi.description || '',
      image: image,
      genres: genres,
      releaseDate: publishedDate,
      language: String(vi.language || '').trim(),
      rating: Number(vi.averageRating || 0),
      ratingsCount: Number(vi.ratingsCount || 0),
      pageCount: Number(vi.pageCount || 0),
      publisher: String(vi.publisher || '').trim(),
      externalUrl: String(vi.infoLink || '').trim(),
      previewUrl: String(vi.previewLink || '').trim(),
      provider: 'google-books',
      providerId: raw.id || '',
      externalIds: { isbn: isbn },
      metadata: {
        pageCount: Number(vi.pageCount || 0),
        publisher: String(vi.publisher || '').trim(),
        categories: genres
      }
    }, Content.CONTENT_TYPES.BOOK);
  };

  BookProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.BOOK);
  };

  window.Zo2yBookProvider = new BookProvider();
})();
