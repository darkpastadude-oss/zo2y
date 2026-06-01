(function () {
  if (window.__zo2yBooksEngine) return;
  window.__zo2yBooksEngine = true;

  const FALLBACK_BOOK_IMAGE = '/images/fallback/book.svg';

  function normalizeRankText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toHttpsUrl(value) {
    return String(value || '').replace(/^http:\/\//i, 'https://').trim();
  }

  function getDocAuthors(doc) {
    if (Array.isArray(doc?.author_name)) {
      return doc.author_name.map(function (e) { return String(e || '').trim(); }).filter(Boolean);
    }
    return String(doc?.author || doc?.authors || '')
      .split(',')
      .map(function (e) { return e.trim(); })
      .filter(Boolean);
  }

  function getDocText(doc) {
    var parts = [
      doc?.title,
      getDocAuthors(doc).join(' '),
      Array.isArray(doc?.subject) ? doc.subject.join(' ') : doc?.subject,
      Array.isArray(doc?.publisher) ? doc.publisher.join(' ') : doc?.publisher,
      doc?.description,
      doc?.maturityRating,
      doc?._source
    ];
    return parts.map(function (e) { return String(e || '').trim(); }).filter(Boolean).join(' ');
  }

  var JUNK_TEXT_PATTERNS = [
    /\b(newspaper|magazine|periodical|journal|proceedings|conference|symposium|report|annual report)\b/i,
    /\b(government|bureau|department|committee|commission|census|gazette|archive|archives)\b/i,
    /\b(manual|catalogue|catalog|directory|bulletin|pamphlet|microform|thesis|dissertation)\b/i,
    /\b(scanned|scan|public domain|historical document|academic pdf|working paper)\b/i,
    /\b(textbook|study guide|workbook|coursebook|student guide|teacher guide)\b/i,
    /\b(newsletter|bulletin|gazette|chronicle)\b/i,
    /\b(proceedings|transactions|lecture notes|seminar|workshop|colloquium)\b/i,
    /\b(dissertation|thesis|monograph|treatise|compilation|anthology)\b/i,
    /\b(digitized|microfilm|microfiche|reprint|facsimile|transcription)\b/i
  ];

  var EXPLICIT_TEXT_PATTERNS = [
    /\b(erotica|explicit|adult|pornographic|mature audience|sexual content)\b/i
  ];

  var HOME_SUGGESTIVE_TEXT_PATTERNS = [
    /\b(erotica|explicit|adult|pornographic|mature audience|sexual content)\b/i
  ];

  var HOME_SUGGESTIVE_TITLE_PATTERNS = [
    /\b(sex|nude|naked|adult|xxx|porn|erotic)\b/i
  ];

  var POPULAR_SERIES = [
    'harry potter', 'the boys', 'a court of thorns and roses', 'the hunger games',
    'percy jackson', 'lord of the rings', 'dune', 'wings of fire', 'diary of a wimpy kid'
  ];

  var KNOWN_AUTHORS = [
    'j k rowling', 'jk rowling', 'g t karber', 'gillian flynn', 'freida mcfadden',
    'rebecca yarros', 'andy weir', 'james clear', 'matt haig', 'alex michaelides',
    'r f kuang', 'gabrielle zevin', 'kristin hannah', 'stephen king', 'suzanne collins',
    'rick riordan', 'garth ennis', 'darick robertson'
  ];

  var CURRENT_YEAR = new Date().getUTCFullYear();

  function isJunkBookDoc(doc) {
    var text = getDocText(doc);
    if (!String(doc?.title || '').trim()) return true;
    if (EXPLICIT_TEXT_PATTERNS.some(function (p) { return p.test(text); })) return true;
    if (JUNK_TEXT_PATTERNS.some(function (p) { return p.test(text); })) return true;
    var maturity = String(doc?.maturityRating || '').toLowerCase();
    if (maturity && maturity !== 'not_mature' && maturity.includes('mature')) return true;
    return false;
  }

  function filterSafeBookDocs(docs) {
    return (Array.isArray(docs) ? docs : []).filter(function (doc) { return !isJunkBookDoc(doc); });
  }

  function isHomeSuggestiveText(text) {
    var value = String(text || '').trim();
    if (!value) return false;
    return HOME_SUGGESTIVE_TEXT_PATTERNS.some(function (p) { return p.test(value); });
  }

  function isHomeSafeContentItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (item.isPlaceholder) return true;
    var isAdult = item.isAdult === true || String(item.isAdult || '').trim().toLowerCase() === 'true';
    var isExplicit = item.explicit === true || String(item.explicit || '').trim().toLowerCase() === 'true';
    if (isAdult || isExplicit) return false;
    var maturityRating = String(item?.maturityRating || '').trim().toLowerCase();
    if (maturityRating.includes('mature') && !maturityRating.includes('not_mature')) return false;
    var title = String(item?.title || '');
    if (HOME_SUGGESTIVE_TITLE_PATTERNS.some(function (p) { return p.test(title); })) return false;
    var textFields = [
      item?.title, item?.subtitle, item?.extra, item?.overview,
      item?.description, item?.genreText, item?.tags, item?.maturityRating
    ];
    if (Array.isArray(item?.genres)) textFields.push(item.genres.join(' '));
    return !textFields.some(function (v) { return isHomeSuggestiveText(v); });
  }

  function filterHomeSafeItems(items) {
    return (Array.isArray(items) ? items : []).filter(function (item) { return isHomeSafeContentItem(item); });
  }

  function hasQualityCover(doc) {
    var cover = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || doc?.cover || doc?.thumbnail || '');
    if (!cover || cover === FALLBACK_BOOK_IMAGE) return false;
    if (/placeholder|nocover|no-cover|default|blank/i.test(cover)) return false;
    return /^https:\/\//i.test(cover);
  }

  function scoreCoverQuality(doc) {
    if (!hasQualityCover(doc)) return -120;
    var cover = toHttpsUrl(doc?._googleThumbnail || doc?.coverImage || '');
    var score = 50;
    if (/zoom=|edge=curl|books\.google/i.test(cover)) score += 30;
    if (/covers\.openlibrary\.org\/b\/id\/.+-L\.jpg/i.test(cover)) score += 18;
    if (doc?._googleThumbnail || doc?._googleVolumeId) score += 24;
    return score;
  }

  function normalizeBookSeedText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreSeededBookMatch(row, seed) {
    var normalizedTitle = normalizeBookSeedText(row?.title || '');
    var normalizedAuthor = normalizeBookSeedText(Array.isArray(row?.author_name) ? row.author_name[0] : row?.author || '');
    var seedTitle = normalizeBookSeedText(seed?.title || '');
    var seedAuthor = normalizeBookSeedText(seed?.author || '');
    var rowYear = Number(row?.first_publish_year || row?.year || 0) || 0;
    var seedYear = Number(seed?.year || 0) || 0;
    var score = 0;
    if (normalizedTitle && seedTitle) {
      if (normalizedTitle === seedTitle) score += 120;
      else if (normalizedTitle.startsWith(seedTitle) || seedTitle.startsWith(normalizedTitle)) score += 80;
      else if (normalizedTitle.includes(seedTitle) || seedTitle.includes(normalizedTitle)) score += 48;
    }
    if (normalizedAuthor && seedAuthor) {
      if (normalizedAuthor === seedAuthor) score += 70;
      else if (normalizedAuthor.includes(seedAuthor) || seedAuthor.includes(normalizedAuthor)) score += 42;
    }
    score += scoreCoverQuality(row);
    if (rowYear) score += 8;
    if (seedYear && rowYear === seedYear) score += 24;
    if (rowYear >= 2020 && rowYear <= CURRENT_YEAR + 1) score += 16;
    return score;
  }

  function scoreBookSearchResult(doc, query) {
    var q = normalizeRankText(query);
    var title = normalizeRankText(doc?.title || '');
    var authors = normalizeRankText(getDocAuthors(doc).join(' '));
    var haystack = normalizeRankText(getDocText(doc));
    var year = Number(doc?.first_publish_year || doc?.year || 0) || 0;
    var language = String(doc?.language || '').toLowerCase();
    var score = 0;

    if (q && title) {
      if (title === q) score += 500;
      else if (title.startsWith(q)) score += 360;
      else if (title.includes(q)) score += 260;
      var queryTokens = q.split(' ').filter(Boolean);
      var titleTokenHits = queryTokens.filter(function (token) { return title.includes(token); }).length;
      if (queryTokens.length) {
        if (titleTokenHits === queryTokens.length) score += 180;
        else if (titleTokenHits >= Math.ceil(queryTokens.length / 2)) score += 120;
        else if (titleTokenHits > 0) score += 60;
        if (queryTokens.length >= 2 && titleTokenHits >= 2) score += 40;
      }
      if (q.length >= 3) {
        var titleWords = title.split(' ');
        for (var wi = 0; wi < titleWords.length; wi++) {
          var word = titleWords[wi];
          if (word.includes(q) || q.includes(word)) { score += 30; break; }
        }
      }
    }

    if (q && POPULAR_SERIES.some(function (s) { return q.includes(s) || title.includes(s); })) score += 300;
    if (POPULAR_SERIES.some(function (s) { return title.includes(s); })) score += 200;
    if (authors && KNOWN_AUTHORS.some(function (a) { return authors.includes(a); })) score += 100;

    if (language === 'en' || language === 'eng' || language === 'english') score += 300;
    else if (haystack.includes('english') || doc?._source === 'google-books') score += 150;
    else if (language && language !== 'en' && language !== 'eng' && language !== 'english') score -= 200;

    score += scoreCoverQuality(doc);
    if (year >= 1990 && year <= CURRENT_YEAR + 1) score += 50;
    if (year && year < 1950) score -= 180;
    if (doc?._source === 'openlibrary' && !doc?._googleThumbnail) score -= 40;
    if (isJunkBookDoc(doc)) score -= 700;

    return score;
  }

  function sortBookDocsForQuery(docs, query) {
    return filterSafeBookDocs(docs).slice().sort(function (a, b) {
      var diff = scoreBookSearchResult(b, query) - scoreBookSearchResult(a, query);
      if (diff) return diff;
      return scoreCoverQuality(b) - scoreCoverQuality(a);
    });
  }

  function getEditionGroupKey(doc) {
    var title = normalizeRankText(doc?.title || '');
    var author = normalizeRankText(getDocAuthors(doc)[0] || '');
    title = title.replace(/\b(the|a|an)\s+/g, '').trim();
    title = title.replace(/[\(\[].*?[\)\]]/g, '').trim();
    title = title.replace(/\b(book|volume|vol|part|pt|edition|ed)\s*\d+/gi, '').trim();
    title = title.replace(/[^a-z0-9\s]/g, '').trim();
    title = title.replace(/\s+/g, ' ').trim();
    if (!title || !author) return '';
    return title + '::' + author;
  }

  function pickBestEdition(editions) {
    var best = editions[0];
    for (var i = 1; i < editions.length; i++) {
      var doc = editions[i];
      var current = scoreCoverQuality(doc) + scoreBookSearchResult(doc, '');
      var bestScore = scoreCoverQuality(best) + scoreBookSearchResult(best, '');
      var docEnglish = String(doc?.language || '').toLowerCase();
      var bestEnglish = String(best?.language || '').toLowerCase();
      if ((docEnglish === 'en' || docEnglish === 'eng') && (bestEnglish !== 'en' && bestEnglish !== 'eng')) {
        best = doc;
        bestScore = current;
        continue;
      }
      if (current > bestScore + 20) {
        best = doc;
        bestScore = current;
      }
    }
    return best;
  }

  function groupByCanonicalEdition(books) {
    var groups = {};
    for (var i = 0; i < books.length; i++) {
      var doc = books[i];
      var key = getEditionGroupKey(doc);
      if (!key) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    var out = [];
    var seen = {};
    var keys = Object.keys(groups);
    for (var ki = 0; ki < keys.length; ki++) {
      var groupKey = keys[ki];
      var best = pickBestEdition(groups[groupKey]);
      var dedupeKey = normalizeRankText(best?.title || '') + '::' + normalizeRankText(getDocAuthors(best)[0] || '');
      if (!best || seen[dedupeKey]) continue;
      seen[dedupeKey] = true;
      out.push(best);
    }
    return out;
  }

  function shuffleArray(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function dedupeBooks(rows, limit) {
    var seen = {};
    var out = [];
    var max = Number.isFinite(limit) ? limit : rows.length;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row) continue;
      var title = String(row?.title || '').trim().toLowerCase();
      var author = String(row?.author || '').trim().toLowerCase();
      var id = String(row?.id || '').trim().toLowerCase();
      var key = id || (title + '::' + author);
      if (!key || seen[key]) continue;
      seen[key] = true;
      out.push(row);
      if (out.length >= max) break;
    }
    return out;
  }

  function computeGridPageSize() {
    var grid = document.getElementById('booksGrid');
    if (!grid) return 18;
    try {
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      return cols * 3;
    } catch (_) { return 18; }
  }

  window.__zo2yBooksEngine = {
    normalizeRankText: normalizeRankText,
    toHttpsUrl: toHttpsUrl,
    getDocAuthors: getDocAuthors,
    getDocText: getDocText,
    isJunkBookDoc: isJunkBookDoc,
    filterSafeBookDocs: filterSafeBookDocs,
    isHomeSafeContentItem: isHomeSafeContentItem,
    filterHomeSafeItems: filterHomeSafeItems,
    hasQualityCover: hasQualityCover,
    scoreCoverQuality: scoreCoverQuality,
    normalizeBookSeedText: normalizeBookSeedText,
    scoreSeededBookMatch: scoreSeededBookMatch,
    scoreBookSearchResult: scoreBookSearchResult,
    sortBookDocsForQuery: sortBookDocsForQuery,
    getEditionGroupKey: getEditionGroupKey,
    pickBestEdition: pickBestEdition,
    groupByCanonicalEdition: groupByCanonicalEdition,
    shuffleArray: shuffleArray,
    dedupeBooks: dedupeBooks,
    computeGridPageSize: computeGridPageSize,
    POPULAR_SERIES: POPULAR_SERIES,
    KNOWN_AUTHORS: KNOWN_AUTHORS,
    FALLBACK_BOOK_IMAGE: FALLBACK_BOOK_IMAGE,
    CURRENT_YEAR: CURRENT_YEAR
  };
})();
