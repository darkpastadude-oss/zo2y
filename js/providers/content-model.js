(function () {
  'use strict';

  var CONTENT_TYPES = {
    BOOK: 'book',
    MOVIE: 'movie',
    TV: 'tv',
    ANIME: 'anime',
    GAME: 'game',
    MUSIC: 'music',
    ARTIST: 'artist',
    SPORTS: 'sports',
    TRAVEL: 'travel',
    FASHION: 'fashion',
    FOOD: 'food',
    CAR: 'car',
    RESTAURANT: 'restaurant',
    PODCAST: 'podcast',
    PERSON: 'person'
  };

  var FALLBACK_IMAGES = {
    book: '/images/fallback/book.svg',
    movie: '/images/fallback/movie.svg',
    tv: '/images/fallback/tv.svg',
    anime: '/images/fallback/anime.svg',
    game: '/images/fallback/game.svg',
    music: '/images/fallback/music.svg',
    artist: '/images/fallback/music.svg',
    sports: '/images/fallback/sports.svg',
    travel: '/images/fallback/travel.svg',
    fashion: '/images/fallback/fashion.svg',
    food: '/images/fallback/food.svg',
    car: '/images/fallback/car.svg',
    restaurant: '/images/fallback/restaurant.svg',
    podcast: '/images/fallback/podcast.svg',
    person: '/images/fallback/person.svg'
  };

  function toHttps(url) {
    if (!url) return '';
    return String(url).replace(/^http:/i, 'https:');
  }

  function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]+>/g, '').trim();
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
  }

  function toString(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  function toNumber(value, fallback) {
    if (fallback === undefined) fallback = 0;
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function pickImage(raw, type) {
    var image = raw.image || raw.cover || raw.poster || raw.thumbnail || raw.posterUrl || raw.poster_path || '';
    if (!image && raw.images && raw.images.length > 0) {
      var first = raw.images[0];
      image = (typeof first === 'string') ? first : (first.url || first.file_path || '');
    }
    if (!image && raw.imageLinks) {
      image = raw.imageLinks.thumbnail || raw.imageLinks.smallThumbnail || '';
    }
    if (!image) return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.book;
    return toHttps(image);
  }

  function pickBackdrop(raw, type) {
    var backdrop = raw.backdrop || raw.backdropUrl || raw.backdrop_path || '';
    if (!backdrop && raw.backdrops && raw.backdrops.length > 0) {
      var first = raw.backdrops[0];
      backdrop = (typeof first === 'string') ? first : (first.file_path || first.url || '');
    }
    return toHttps(backdrop) || pickImage(raw, type);
  }

  function normalizeContent(raw, type) {
    if (!raw) return null;

    var title = toString(raw.title || raw.name || raw.strTeam || raw.common || '');
    if (!title) return null;

    var id = toString(raw.id || raw.slug || raw.cca2 || raw.cca3 || raw.teamId || '');
    var image = pickImage(raw, type);
    var backdrop = pickBackdrop(raw, type);

    var creators = raw.creators || raw.authors || raw.director || raw.developer || '';
    if (Array.isArray(creators)) {
      creators = creators
        .map(function (c) { return (c && typeof c === 'object') ? toString(c.name || c.title) : toString(c); })
        .filter(Boolean)
        .join(', ');
    }
    creators = toString(creators);

    var genres = raw.genres || raw.categories || raw.subject || raw.keywords || [];
    if (typeof genres === 'string') genres = genres ? [genres] : [];
    if (!Array.isArray(genres)) genres = [];

    var externalIds = raw.externalIds || raw.external_ids || {};
    if (raw.imdb_id) externalIds.imdb_id = raw.imdb_id;
    if (raw.isbn) externalIds.isbn = raw.isbn;

    return {
      id: id,
      type: type,
      title: title,
      subtitle: toString(raw.subtitle || raw.tagline || ''),
      description: stripHtml(raw.description || raw.overview || ''),
      image: image,
      backdrop: backdrop,
      creators: creators,
      releaseDate: toString(raw.releaseDate || raw.release_date || raw.first_air_date || raw.year || ''),
      genres: genres,
      language: toString(raw.language || raw.original_language || ''),
      rating: toNumber(raw.rating || raw.vote_average || raw.ratings_average || 0),
      ratingsCount: toNumber(raw.ratingsCount || raw.vote_count || raw.ratingsCount || 0),
      popularity: toNumber(raw.popularity || 0),
      externalIds: externalIds,
      externalUrl: toString(raw.externalUrl || raw.homepage || ''),
      previewUrl: toString(raw.previewUrl || ''),
      provider: toString(raw.provider || raw._source || ''),
      providerId: toString(raw.providerId || raw.id || ''),
      metadata: raw.metadata || {},
      createdAt: raw.createdAt || null,
      updatedAt: raw.updatedAt || null
    };
  }

  function createSearchResult(content, type) {
    return {
      type: type,
      title: content.title,
      sub: buildSubtitle(content, type),
      image: content.image,
      href: buildHref(content, type)
    };
  }

  function buildSubtitle(content, type) {
    var typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    var parts = [typeLabel];
    if (content.creators) parts.push(content.creators);
    else if (content.releaseDate) parts.push(content.releaseDate.substring(0, 4));
    return parts.join(' \u00B7 ');
  }

  function buildHref(content, type) {
    var routeMap = {
      book: 'book',
      movie: 'movie',
      tv: 'tvshow',
      anime: 'anime',
      game: 'game',
      music: 'song',
      artist: 'music',
      sports: 'team',
      travel: 'country',
      fashion: 'brand',
      food: 'brand',
      car: 'brand'
    };
    var route = routeMap[type] || type;
    return '/' + route + '.html?id=' + encodeURIComponent(content.id);
  }

  window.Zo2yContent = {
    CONTENT_TYPES: CONTENT_TYPES,
    FALLBACK_IMAGES: FALLBACK_IMAGES,
    normalizeContent: normalizeContent,
    createSearchResult: createSearchResult,
    toHttps: toHttps,
    stripHtml: stripHtml,
    toArray: toArray,
    toString: toString,
    toNumber: toNumber,
    pickImage: pickImage,
    pickBackdrop: pickBackdrop,
    buildSubtitle: buildSubtitle,
    buildHref: buildHref
  };
})();
