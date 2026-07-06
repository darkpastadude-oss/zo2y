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
    var title = String(vi.title || raw.title || '').trim();
    if (!title) return null;

    var imageLinks = vi.imageLinks || {};
    var rawCover = imageLinks.thumbnail || imageLinks.smallThumbnail || raw.image || raw.cover || raw.rawCover || '';
    if (!rawCover && raw.cover_id) {
      rawCover = 'https://covers.openlibrary.org/b/id/' + raw.cover_id + '-L.jpg';
    }
    var image = rawCover ? Content.toHttps(rawCover) : '';

    var rawAuthors = vi.authors || raw.authors || raw.author_name || (vi.author ? [vi.author] : []) || (raw.author ? [raw.author] : []);
    var authorStr;
    if (Array.isArray(rawAuthors)) {
      authorStr = rawAuthors.map(function (a) {
        if (a && typeof a === 'object') return String(a.name || a.title || '').trim();
        return String(a || '').trim();
      }).filter(Boolean).join(', ');
    } else {
      authorStr = String(rawAuthors || '').trim();
    }

    var publishedDate = vi.publishedDate || raw.releaseDate || raw.year || '';
    if (!publishedDate && raw.first_publish_year) {
      publishedDate = String(raw.first_publish_year);
    }
    var year = publishedDate ? parseInt(String(publishedDate).substring(0, 4)) : null;

    var categories = vi.categories || vi.genres || vi.subject || [];
    var catArr = Content.toArray(categories);

    var genres = catArr.map(function (g) {
      if (typeof g === 'string') return g;
      if (typeof g === 'object' && g !== null) return g.name || String(g.name || '');
      return '';
    }).filter(Boolean);

    var isbn = vi.isbn || (raw.volumeInfo && raw.volumeInfo.industryIdentifiers
      ? (raw.volumeInfo.industryIdentifiers.find(function (i) { return i.type === 'ISBN_13'; }) || {}).identifier
      : '') || '';

    var id = raw.id || '';
    if (!id && raw.key) {
      id = String(raw.key).replace('/works/', '').replace('/books/', '');
    }

    var extUrl = vi.infoLink || raw.externalUrl || raw.previewUrl || '';
    if (!extUrl && raw.key) {
      extUrl = 'https://openlibrary.org' + raw.key;
    }

    var pageCount = vi.pageCount || raw.pageCount || raw.number_of_pages_median || 0;
    var rating = vi.averageRating || raw.rating || raw.ratings_average || 0;
    var ratingsCount = vi.ratingsCount || raw.ratingsCount || raw.readinglog_count || raw.already_read_count || 0;

    return {
      id: id,
      mediaType: 'book',
      title: title,
      subtitle: String(vi.subtitle || raw.subtitle || '').trim(),
      authors: authorStr,
      author: authorStr,
      artist: authorStr,
      year: year ? String(year) : '',
      description: String(vi.description || raw.description || '').trim().replace(/<[^>]+>/g, ''),
      genres: genres,
      categories: genres,
      image: image || '/images/fallback/book.svg',
      backdrop: image || '',
      rating: Number(rating),
      ratingsCount: Number(ratingsCount),
      popularity: Number(vi.popularity || raw.popularity || 0),
      language: String(vi.language || raw.language || '').trim(),
      pageCount: Number(pageCount),
      publisher: String(vi.publisher || raw.publisher || '').trim(),
      albumType: '',
      trackCount: 0,
      previewUrl: String(vi.previewLink || raw.previewUrl || '').trim(),
      externalUrl: String(extUrl).trim(),
      releaseDate: publishedDate,
      coverColor: '',
      provider: raw._source || raw.provider || 'google-books',
      providerId: id,
      isbn: isbn ? [isbn] : (Array.isArray(vi.isbn) ? vi.isbn : [])
    };
  };

  BookProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.BOOK);
  };

  window.Zo2yBookProvider = new BookProvider();
})();
