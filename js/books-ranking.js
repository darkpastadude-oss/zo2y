(function() {
  'use strict';
  if (window.BooksRanking) return;
  const FALLBACK = '/images/fallback/book.svg';

  function normalize(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function hasUsableCover(coverUrl) {
    const c = String(coverUrl || '');
    if (!c || c === FALLBACK || c.includes('fallback') || c.includes('nocover')) return false;
    return c.startsWith('http');
  }

  function isHighResCover(coverUrl) {
    const c = String(coverUrl || '');
    if (!c) return false;
    if (c.includes('zoom=1') || c.includes('&edge') || c.includes('?fife=')) return true;
    if (c.match(/[&?]sz=\d{3,}/)) return true;
    if (c.includes('books.google.com') && c.includes('pg=')) return true;
    if (c.includes('openlibrary.org') && c.match(/-\w\.jpg$/)) return true;
    return false;
  }

  function assessCoverQuality(coverUrl) {
    const c = String(coverUrl || '');
    if (!hasUsableCover(c)) return 0;
    let quality = 1;
    if (isHighResCover(c)) quality = 3;
    else if (c.includes('books.google.com') || c.includes('openlibrary.org')) quality = 2;
    const smallIndicators = ['&edge=curl', 'zoom=0', '&w=', 'small', '&ez=', 'sz=50'];
    for (const si of smallIndicators) {
      if (c.includes(si)) { quality = Math.min(quality, 1); break; }
    }
    return quality;
  }

  function getLanguage(book) {
    const lang = String(book.language || '').trim().toLowerCase();
    if (lang === 'en' || lang === 'eng' || lang === 'english') return 'en';
    return lang || 'unknown';
  }

  function isEnglish(book) {
    const lang = getLanguage(book);
    if (lang === 'en') return true;
    const title = String(book.title || '');
    const author = String(book.authors || '');
    if (!lang || lang === 'unknown') {
      if (/^[a-zA-Z0-9\s\-'.,!?":;()]+$/.test(title)) return true;
    }
    return false;
  }

  function getYear(book) {
    const pd = book.publishedDate || book.published_date || '';
    if (!pd) return 0;
    const m = String(pd).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : 0;
  }

  function scoreMetadataCompleteness(book) {
    let score = 0;
    if (hasUsableCover(book.coverUrl)) score += 2;
    if (book.description && String(book.description).length > 50) score += 1;
    if (book.authors && String(book.authors) !== 'Unknown Author' && String(book.authors).length > 0) score += 1;
    if (book.pageCount && Number(book.pageCount) > 0) score += 1;
    const year = getYear(book);
    if (year >= 1900) score += 1;
    return score;
  }

  function scoreRecency(book) {
    const year = getYear(book);
    if (!year) return 0;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age <= 1) return 5;
    if (age <= 3) return 4;
    if (age <= 5) return 3;
    if (age <= 10) return 2;
    if (age <= 20) return 1;
    return 0;
  }

  function scoreTitleMatch(book, query) {
    if (!query) return 0;
    const q = normalize(query);
    const title = normalize(book.title || '');
    const authors = normalize(book.authors || '');
    if (!q || !title) return 0;
    if (title === q) return 10;
    if (title.startsWith(q)) return 8;
    if (title.includes(q)) return 5;
    const qWords = q.split(/\s+/).filter(Boolean);
    const tWords = title.split(/\s+/).filter(Boolean);
    const matchCount = qWords.filter(w => tWords.some(tw => tw === w || tw.startsWith(w) || w.startsWith(tw))).length;
    if (qWords.length >= 2) return Math.floor((matchCount / qWords.length) * 6);
    if (matchCount > 0) return 3;
    if (authors.includes(q)) return 4;
    const aWords = authors.split(/\s+/).filter(Boolean);
    const authorMatch = qWords.filter(w => aWords.some(aw => aw === w || aw.startsWith(w))).length;
    if (authorMatch > 0) return 3;
    return 0;
  }

  function assessJunk(book) {
    const title = String(book.title || '').toLowerCase();
    const desc = String(book.description || '').toLowerCase();
    const junkPatterns = [
      'report', 'manual', 'document', 'catalog', 'catalogue', 'bulletin', 'proceedings',
      'conference', 'symposium', 'workshop', 'thesis', 'dissertation', 'treatise',
      'technical report', 'white paper', 'specification', 'standard',
      'government publication', 'public domain', 'metadata',
      'bibliographic record', 'marc record', 'library catalog',
      'volume ', 'vol. ', 'index to', 'abstract'
    ];
    for (const jp of junkPatterns) {
      if (title.includes(jp) || desc.includes(jp)) return true;
    }
    return false;
  }

  function computeBookScore(book, query) {
    let score = 0;
    const titleMatch = scoreTitleMatch(book, query);
    score += titleMatch * 25;
    if (isEnglish(book)) score += 20;
    const coverQ = assessCoverQuality(book.coverUrl);
    score += coverQ * 8;
    score += scoreRecency(book) * 4;
    score += scoreMetadataCompleteness(book) * 3;
    if (assessJunk(book)) score -= 30;
    return score;
  }

  function rankBooks(books, query) {
    return books
      .filter(b => b && b.id && String(b.title || '').length >= 1)
      .map(book => ({ book, score: computeBookScore(book, query) }))
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.book);
  }

  function dedupeBooks(books) {
    const seen = new Set();
    return books.filter(b => {
      if (!b || !b.id) return false;
      const key = String(b.id).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function filterJunkBooks(books) {
    return books.filter(b => !assessJunk(b));
  }

  const KNOWN_POPULAR_BOOKS = {
    'harry potter': { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling' },
    'mistborn': { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson' },
    'fourth wing': { title: 'Fourth Wing', author: 'Rebecca Yarros' },
    'atomic habits': { title: 'Atomic Habits', author: 'James Clear' },
    'the hobbit': { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
    'project hail mary': { title: 'Project Hail Mary', author: 'Andy Weir' },
    'dune': { title: 'Dune', author: 'Frank Herbert' },
    'the hunger games': { title: 'The Hunger Games', author: 'Suzanne Collins' },
    '1984': { title: '1984', author: 'George Orwell' },
    'pride and prejudice': { title: 'Pride and Prejudice', author: 'Jane Austen' },
    'the great gatsby': { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    'to kill a mockingbird': { title: 'To Kill a Mockingbird', author: 'Harper Lee' },
    'the catcher in the rye': { title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
    'the lord of the rings': { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien' },
    'a game of thrones': { title: 'A Game of Thrones', author: 'George R.R. Martin' },
    'the martian': { title: 'The Martian', author: 'Andy Weir' },
    'ready player one': { title: 'Ready Player One', author: 'Ernest Cline' },
    'the alchemist': { title: 'The Alchemist', author: 'Paulo Coelho' },
    'gone girl': { title: 'Gone Girl', author: 'Gillian Flynn' },
    'the girl on the train': { title: 'The Girl on the Train', author: 'Paula Hawkins' },
    'the da vinci code': { title: 'The Da Vinci Code', author: 'Dan Brown' },
    'the notebook': { title: 'The Notebook', author: 'Nicholas Sparks' },
    'the twilight saga': { title: 'Twilight', author: 'Stephenie Meyer' },
    'the fault in our stars': { title: 'The Fault in Our Stars', author: 'John Green' },
    'the help': { title: 'The Help', author: 'Kathryn Stockett' },
    'the shining': { title: 'The Shining', author: 'Stephen King' },
    'it': { title: 'It', author: 'Stephen King' },
    'carrie': { title: 'Carrie', author: 'Stephen King' },
    'the stand': { title: 'The Stand', author: 'Stephen King' },
    'pet sematary': { title: 'Pet Sematary', author: 'Stephen King' },
    'sapiens': { title: 'Sapiens', author: 'Yuval Noah Harari' },
    'educated': { title: 'Educated', author: 'Tara Westover' },
    'becoming': { title: 'Becoming', author: 'Michelle Obama' },
    'where the crawdads sing': { title: 'Where the Crawdads Sing', author: 'Delia Owens' },
    'circe': { title: 'Circe', author: 'Madeline Miller' },
    'the song of achilles': { title: 'The Song of Achilles', author: 'Madeline Miller' },
    'normal people': { title: 'Normal People', title2: 'Normal People', author: 'Sally Rooney' },
    'the midnight library': { title: 'The Midnight Library', author: 'Matt Haig' },
    'klara and the sun': { title: 'Klara and the Sun', author: 'Kazuo Ishiguro' },
    'onyx storm': { title: 'Onyx Storm', author: 'Rebecca Yarros' },
    'iron flame': { title: 'Iron Flame', author: 'Rebecca Yarros' },
    'the housemaid': { title: 'The Housemaid', author: 'Freida McFadden' }
  };

  function findExactPopularMatch(query) {
    const q = normalize(query);
    if (!q) return null;
    for (const [key, info] of Object.entries(KNOWN_POPULAR_BOOKS)) {
      if (normalize(key) === q || normalize(info.title).includes(q) || q.includes(normalize(key))) {
        return info;
      }
    }
    return null;
  }

  window.BooksRanking = {
    computeBookScore,
    rankBooks,
    dedupeBooks,
    filterJunkBooks,
    assessCoverQuality,
    hasUsableCover,
    isEnglish,
    getYear,
    scoreTitleMatch,
    findExactPopularMatch,
    KNOWN_POPULAR_BOOKS,
    FALLBACK_BOOK_IMAGE: FALLBACK
  };
})();
