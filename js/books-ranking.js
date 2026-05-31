(function() {
  'use strict';
  if (window.BooksRanking) return;
  const FALLBACK = '/images/fallback/book.svg';

  const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'in', 'to', 'and', 'for', 'is', 'it', 'on', 'at', 'by', 'with', 'or', 'as', 'be', 'but', 'not', 'so']);

  function normalize(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokenize(s) {
    return normalize(s).split(/\s+/).filter(Boolean);
  }

  function contentSignificantWords(s) {
    return tokenize(s).filter(w => !STOP_WORDS.has(w) && w.length > 1);
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

  function isEnglish(book) {
    const lang = String(book.language || '').trim().toLowerCase();
    if (lang === 'en' || lang === 'eng' || lang === 'english') return true;
    if (!lang || lang === 'unknown') {
      if (/^[a-zA-Z0-9\s\-'.,!?":;()]+$/.test(String(book.title || ''))) return true;
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

  /* ---------------------------------------------------------------
   * INTENT-AWARE TITLE MATCHING
   *
   * Scoring hierarchy (massive gap between levels to ensure
   * intent-correct results outrank keyword-spam results):
   *
   *  1000 - Exact normalized title match
   *   800 - Title starts with query (phrase prefix: "the boys" → "the boys omnibus")
   *   600 - Query appears as exact phrase within title ("the boys" inside "something: the boys")
   *   400 - All significant query words present in same order in title
   *   200 - All significant query words present (any order)
   *   100 - Some significant query words match (≥50%)
   *    40 - Author match (all query words match author name)
   *    30 - Single word token matches
   * --------------------------------------------------------------- */
  function scoreTitleIntent(book, query) {
    if (!query) return 0;
    const q = normalize(query);
    const title = normalize(book.title || '');
    const authors = normalize(book.authors || '');
    const subtitle = normalize(book.subtitle || '');
    const fullText = [title, subtitle].filter(Boolean).join(' ');
    if (!q || !title) return 0;

    const qTokens = tokenize(q);
    const tTokens = tokenize(title);
    const sigQTokens = contentSignificantWords(q);
    const sigTTokens = contentSignificantWords(title);

    // Level 1: Exact normalized match
    if (title === q) return 1000;

    // Level 2: Title starts with query phrase (after removing stop words from start)
    if (title.startsWith(q)) return 800;

    // Level 3: Full phrase appears as contiguous substring in title
    if (title.includes(q)) return 600;

    // Level 4: Full phrase appears in subtitle or full text
    if (fullText.includes(q)) return 550;

    // Level 5: All significant query words appear in same order in title
    if (sigQTokens.length >= 2) {
      let ti = 0;
      let orderMatchCount = 0;
      for (const qw of sigQTokens) {
        while (ti < sigTTokens.length) {
          if (sigTTokens[ti] === qw || sigTTokens[ti].startsWith(qw) || qw.startsWith(sigTTokens[ti])) {
            orderMatchCount++;
            ti++;
            break;
          }
          ti++;
        }
      }
      if (orderMatchCount === sigQTokens.length) return 400;
      if (orderMatchCount >= Math.ceil(sigQTokens.length * 0.7)) return 300;
    }

    // Level 6: All significant query words present (any order) in title
    if (sigQTokens.length >= 2) {
      const allPresent = sigQTokens.every(qw =>
        sigTTokens.some(tw => tw === qw || tw.startsWith(qw) || qw.startsWith(tw))
      );
      if (allPresent) return 200;
    }

    // Level 7: Some significant query words match
    if (sigQTokens.length >= 2 && sigTTokens.length >= 1) {
      const matchCount = sigQTokens.filter(qw =>
        sigTTokens.some(tw => tw === qw || tw.startsWith(qw) || qw.startsWith(tw) || tw.includes(qw) || qw.includes(tw))
      ).length;
      if (matchCount >= Math.ceil(sigQTokens.length * 0.5)) return 100;
    }

    // Level 8: Single word match in title
    if (sigTTokens.length >= 1 && sigQTokens.length >= 1) {
      const anyMatch = sigQTokens.some(qw =>
        sigTTokens.some(tw => tw === qw || tw.startsWith(qw) || qw.startsWith(tw))
      );
      if (anyMatch) return 60;
    }

    // Level 9: Author match
    if (authors) {
      const aTokens = contentSignificantWords(authors);
      if (aTokens.length) {
        if (sigQTokens.length <= aTokens.length && sigQTokens.every(qw =>
          aTokens.some(aw => aw === qw || aw.startsWith(qw))
        )) return 40;
        const aMatch = sigQTokens.filter(qw =>
          aTokens.some(aw => aw === qw || aw.startsWith(qw))
        ).length;
        if (aMatch >= 1) return 30;
      }
    }

    // Level 10: Partial match via regular tokens
    const mCount = qTokens.filter(qw =>
      tTokens.some(tw => tw === qw || tw.startsWith(qw) || qw.startsWith(tw))
    ).length;
    if (mCount > 0) return 10 + mCount * 5;

    return 0;
  }

  /* ---------------------------------------------------------------
   * KNOWN FRANCHISE / POPULAR BOOK DATABASE
   * Each entry includes the canonical title and alternative names
   * so intent-aware matching can find the right books.
   *
   * The `franchise` field groups series together — when a query
   * matches a franchise key, ALL books in that franchise get a
   * massive popularity boost.
   * --------------------------------------------------------------- */
  const KNOWN_POPULAR_BOOKS = {
    'harry potter': { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', franchise: 'harry potter', year: 1997 },
    'mistborn': { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', franchise: 'mistborn', year: 2006 },
    'fourth wing': { title: 'Fourth Wing', author: 'Rebecca Yarros', franchise: 'empyrean', year: 2023 },
    'atomic habits': { title: 'Atomic Habits', author: 'James Clear', franchise: null, year: 2018 },
    'the hobbit': { title: 'The Hobbit', author: 'J.R.R. Tolkien', franchise: 'middle earth', year: 1937 },
    'project hail mary': { title: 'Project Hail Mary', author: 'Andy Weir', franchise: null, year: 2021 },
    'dune': { title: 'Dune', author: 'Frank Herbert', franchise: 'dune', year: 1965 },
    'the hunger games': { title: 'The Hunger Games', author: 'Suzanne Collins', franchise: 'hunger games', year: 2008 },
    '1984': { title: '1984', author: 'George Orwell', franchise: null, year: 1949 },
    'pride and prejudice': { title: 'Pride and Prejudice', author: 'Jane Austen', franchise: null, year: 1813 },
    'the great gatsby': { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', franchise: null, year: 1925 },
    'to kill a mockingbird': { title: 'To Kill a Mockingbird', author: 'Harper Lee', franchise: null, year: 1960 },
    'the catcher in the rye': { title: 'The Catcher in the Rye', author: 'J.D. Salinger', franchise: null, year: 1951 },
    'the lord of the rings': { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', franchise: 'middle earth', year: 1954 },
    'a game of thrones': { title: 'A Game of Thrones', author: 'George R.R. Martin', franchise: 'asoiaf', year: 1996 },
    'the martian': { title: 'The Martian', author: 'Andy Weir', franchise: null, year: 2011 },
    'ready player one': { title: 'Ready Player One', author: 'Ernest Cline', franchise: 'ready player', year: 2011 },
    'the alchemist': { title: 'The Alchemist', author: 'Paulo Coelho', franchise: null, year: 1988 },
    'gone girl': { title: 'Gone Girl', author: 'Gillian Flynn', franchise: null, year: 2012 },
    'the girl on the train': { title: 'The Girl on the Train', author: 'Paula Hawkins', franchise: null, year: 2015 },
    'the da vinci code': { title: 'The Da Vinci Code', author: 'Dan Brown', franchise: null, year: 2003 },
    'the notebook': { title: 'The Notebook', author: 'Nicholas Sparks', franchise: null, year: 1996 },
    'twilight': { title: 'Twilight', author: 'Stephenie Meyer', franchise: 'twilight', year: 2005 },
    'the fault in our stars': { title: 'The Fault in Our Stars', author: 'John Green', franchise: null, year: 2012 },
    'the help': { title: 'The Help', author: 'Kathryn Stockett', franchise: null, year: 2009 },
    'the shining': { title: 'The Shining', author: 'Stephen King', franchise: 'stephen king', year: 1977 },
    'it': { title: 'It', author: 'Stephen King', franchise: 'stephen king', year: 1986 },
    'carrie': { title: 'Carrie', author: 'Stephen King', franchise: 'stephen king', year: 1974 },
    'the stand': { title: 'The Stand', author: 'Stephen King', franchise: 'stephen king', year: 1978 },
    'pet sematary': { title: 'Pet Sematary', author: 'Stephen King', franchise: 'stephen king', year: 1983 },
    'sapiens': { title: 'Sapiens', author: 'Yuval Noah Harari', franchise: null, year: 2011 },
    'educated': { title: 'Educated', author: 'Tara Westover', franchise: null, year: 2018 },
    'becoming': { title: 'Becoming', author: 'Michelle Obama', franchise: null, year: 2018 },
    'where the crawdads sing': { title: 'Where the Crawdads Sing', author: 'Delia Owens', franchise: null, year: 2018 },
    'circe': { title: 'Circe', author: 'Madeline Miller', franchise: null, year: 2018 },
    'the song of achilles': { title: 'The Song of Achilles', author: 'Madeline Miller', franchise: null, year: 2011 },
    'normal people': { title: 'Normal People', author: 'Sally Rooney', franchise: null, year: 2018 },
    'the midnight library': { title: 'The Midnight Library', author: 'Matt Haig', franchise: null, year: 2020 },
    'klara and the sun': { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', franchise: null, year: 2021 },
    'onyx storm': { title: 'Onyx Storm', author: 'Rebecca Yarros', franchise: 'empyrean', year: 2025 },
    'iron flame': { title: 'Iron Flame', author: 'Rebecca Yarros', franchise: 'empyrean', year: 2023 },
    'the housemaid': { title: 'The Housemaid', author: 'Freida McFadden', franchise: null, year: 2022 },
    'the boys': { title: 'The Boys', author: 'Garth Ennis', franchise: 'the boys', year: 2006 },
    'the witcher': { title: 'The Last Wish', author: 'Andrzej Sapkowski', franchise: 'the witcher', year: 1993 },
    'dark souls': { title: 'Dark Souls: Design Works', author: 'FromSoftware', franchise: null, year: 2014 },
    'game of thrones': { title: 'A Game of Thrones', author: 'George R.R. Martin', franchise: 'asoiaf', year: 1996 },
    'murder bot': { title: 'All Systems Red', author: 'Martha Wells', franchise: 'murderbot', year: 2017 },
    'red rising': { title: 'Red Rising', author: 'Pierce Brown', franchise: 'red rising', year: 2014 },
    'the stormlight archive': { title: 'The Way of Kings', author: 'Brandon Sanderson', franchise: 'stormlight', year: 2010 },
    'the wheel of time': { title: 'The Eye of the World', author: 'Robert Jordan', franchise: 'wheel of time', year: 1990 },
    'ninth house': { title: 'Ninth House', author: 'Leigh Bardugo', franchise: null, year: 2019 },
    'the institute': { title: 'The Institute', author: 'Stephen King', franchise: 'stephen king', year: 2019 },
    'fairy tale': { title: 'Fairy Tale', author: 'Stephen King', franchise: 'stephen king', year: 2022 },
    'the bridgerton collection': { title: 'The Duke and I', author: 'Julia Quinn', franchise: 'bridgerton', year: 2000 },
    'verity': { title: 'Verity', author: 'Colleen Hoover', franchise: null, year: 2018 },
    'it ends with us': { title: 'It Ends with Us', author: 'Colleen Hoover', franchise: null, year: 2016 },
    'ugly love': { title: 'Ugly Love', author: 'Colleen Hoover', franchise: null, year: 2014 },
    'the seven husbands of evelyn hugo': { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', franchise: null, year: 2017 },
    'daisy jones and the six': { title: 'Daisy Jones and the Six', author: 'Taylor Jenkins Reid', franchise: null, year: 2019 },
    'malibu rising': { title: 'Malibu Rising', author: 'Taylor Jenkins Reid', franchise: null, year: 2021 },
    'the silent patient': { title: 'The Silent Patient', author: 'Alex Michaelides', franchise: null, year: 2019 },
    'the maidens': { title: 'The Maidens', author: 'Alex Michaelides', franchise: null, year: 2021 },
    'the vanishing half': { title: 'The Vanishing Half', author: 'Brit Bennett', franchise: null, year: 2020 },
    'the goldfinch': { title: 'The Goldfinch', author: 'Donna Tartt', franchise: null, year: 2013 },
    'a little life': { title: 'A Little Life', author: 'Hanya Yanagihara', franchise: null, year: 2015 },
    'the book thief': { title: 'The Book Thief', author: 'Markus Zusak', franchise: null, year: 2005 },
    'all the light we cannot see': { title: 'All the Light We Cannot See', author: 'Anthony Doerr', franchise: null, year: 2014 },
    'the nightingale': { title: 'The Nightingale', author: 'Kristin Hannah', franchise: null, year: 2015 },
    'the great alone': { title: 'The Great Alone', author: 'Kristin Hannah', franchise: null, year: 2018 },
    'the four winds': { title: 'The Four Winds', author: 'Kristin Hannah', franchise: null, year: 2021 },
    'the woman in the window': { title: 'The Woman in the Window', author: 'A.J. Finn', franchise: null, year: 2018 },
    'the wives': { title: 'The Wives', author: 'Tarryn Fisher', franchise: null, year: 2019 },
    'the wives of the dead': { title: 'The Wives of the Dead', author: 'Nathaniel Hawthorne', franchise: null, year: 1832 },
    'the last thing he told me': { title: 'The Last Thing He Told Me', author: 'Laura Dave', franchise: null, year: 2021 },
    'the last house on needless street': { title: 'The Last House on Needless Street', author: 'Catriona Ward', franchise: null, year: 2021 },
    'the push': { title: 'The Push', author: 'Ashley Audrain', franchise: null, year: 2021 },
    'the sanatorium': { title: 'The Sanatorium', author: 'Sarah Pearse', franchise: null, year: 2021 },
    'the retreat': { title: 'The Retreat', author: 'Sarah Pearse', franchise: null, year: 2022 },
    'the island': { title: 'The Island', author: 'Adrian McKinty', franchise: null, year: 2022 },
    'the chain': { title: 'The Chain', author: 'Adrian McKinty', franchise: null, year: 2019 },
    'the bounty': { title: 'The Bounty', author: 'Janet Evanovich', franchise: null, year: 2021 },
    'the recovery agent': { title: 'The Recovery Agent', author: 'Janet Evanovich', franchise: null, year: 2022 },
    'the summer house': { title: 'The Summer House', author: 'James Patterson', franchise: null, year: 2020 },
    'the twenty-fifth': { title: '25 Alive', author: 'James Patterson', franchise: null, year: 2025 },
    'never flinch': { title: 'Never Flinch', author: 'Stephen King', franchise: 'stephen king', year: 2025 },
    'atmosphere': { title: 'Atmosphere', author: 'Taylor Jenkins Reid', franchise: null, year: 2025 },
    'battle mountain': { title: 'Battle Mountain', author: 'C.J. Box', franchise: null, year: 2025 },
    'lethal prey': { title: 'Lethal Prey', author: 'John Sandford', franchise: 'prey', year: 2025 },
    'nightshade': { title: 'Nightshade', author: 'Michael Connelly', franchise: null, year: 2025 },
    'a curse carved in bone': { title: 'A Curse Carved in Bone', author: 'Danielle L. Jensen', franchise: null, year: 2025 },
    'the wild dark shore': { title: 'Wild Dark Shore', author: 'Charlotte McConaghy', franchise: null, year: 2025 },
    'james': { title: 'James', author: 'Percival Everett', franchise: null, year: 2024 },
    'the wedding people': { title: 'The Wedding People', author: 'Kirsten Chen', franchise: null, year: 2025 },
    'yesteryear': { title: 'Yesteryear', author: 'Caro Claire Burke', franchise: null, year: 2026 },
    'the tenant': { title: 'The Tenant', author: 'Freida McFadden', franchise: null, year: 2025 },
    'dear debbie': { title: 'Dear Debbie', author: 'Freida McFadden', franchise: null, year: 2026 },
    'say you will remember me': { title: 'Say You Will Remember Me', author: 'Abby Jimenez', franchise: null, year: 2025 },
    'great big beautiful life': { title: 'Great Big Beautiful Life', author: 'Emily Henry', franchise: null, year: 2025 },
    'the perfect divorce': { title: 'The Perfect Divorce', author: 'Jeneva Rose', franchise: null, year: 2025 },
    'enchantra': { title: 'Enchantra', author: 'Kaylie Smith', franchise: null, year: 2025 },
    'buckeye': { title: 'Buckeye', author: 'Patrick Ryan', franchise: null, year: 2025 },
    'theo of golden': { title: 'Theo of Golden', author: 'Allen Levi', franchise: null, year: 2025 },
    'the correspondent': { title: 'The Correspondent', author: 'Virginia Evans', franchise: null, year: 2025 }
  };

  /* Build franchise group index */
  const FRANCHISE_GROUPS = {};
  for (const [key, info] of Object.entries(KNOWN_POPULAR_BOOKS)) {
    if (info.franchise) {
      if (!FRANCHISE_GROUPS[info.franchise]) FRANCHISE_GROUPS[info.franchise] = [];
      FRANCHISE_GROUPS[info.franchise].push(key);
    }
  }

  function detectIntentQuery(query) {
    const q = normalize(query);
    if (!q) return null;

    // Check: does this query match a known franchise or book?
    // We look for the longest matching key to avoid "the" matching everything
    let bestMatch = null;
    let bestKeyLength = 0;

    for (const [key, info] of Object.entries(KNOWN_POPULAR_BOOKS)) {
      const nk = normalize(key);
      const nTitle = normalize(info.title);
      // Exact match on key
      if (nk === q) { bestMatch = { key, info, type: 'exact-key' }; bestKeyLength = q.length; break; }
      // Key contained in query
      if (q.includes(nk) && nk.length > bestKeyLength && nk.length >= 3) {
        bestMatch = { key, info, type: 'key-in-query' };
        bestKeyLength = nk.length;
      }
      // Query contained in key
      if (nk.includes(q) && q.length >= 3 && nk.length > bestKeyLength) {
        bestMatch = { key, info, type: 'query-in-key' };
        bestKeyLength = nk.length;
      }
    }

    return bestMatch;
  }

  /* ---------------------------------------------------------------
   * COMPUTE BOOK SCORE (intent-aware)
   *
   * Priority pyramid:
   *  1. Title intent match (massive weight)
   *  2. Known franchise boost (if query matches a known franchise)
   *  3. English language
   *  4. Cover quality
   *  5. Metadata completeness + recency
   *  6. Junk penalty
   * --------------------------------------------------------------- */
  function computeBookScore(book, query) {
    let score = 0;

    // --- PHASE 1: Title intent matching (0–1000) ---
    const titleIntent = scoreTitleIntent(book, query);
    score += titleIntent;

    // --- PHASE 2: Known franchise / popularity boost ---
    const intent = detectIntentQuery(query);
    if (intent) {
      const nTitle = normalize(book.title || '');
      const nAuthors = normalize(book.authors || '');
      const nInfoTitle = normalize(intent.info.title);
      const nInfoAuthor = normalize(intent.info.author);

      // Franchise book: if the title contains the franchise key OR the author matches
      const nKey = normalize(intent.key);
      const franchiseKeys = intent.info.franchise
        ? FRANCHISE_GROUPS[intent.info.franchise] || [intent.key]
        : [intent.key];

      const isFranchiseBook = franchiseKeys.some(fk => {
        const nfk = normalize(fk);
        return nTitle.includes(nfk) || nfk.includes(nTitle);
      }) || (nInfoAuthor && nAuthors.includes(nInfoAuthor));

      const isExactTitleMatch = nTitle === nInfoTitle;
      const isCloseTitle = nTitle.startsWith(nInfoTitle) || nInfoTitle.startsWith(nTitle)
                        || nTitle.includes(nInfoTitle) || nInfoTitle.includes(nTitle);
      const isAuthorMatch = nInfoAuthor && nAuthors.includes(nInfoAuthor);

      if (isExactTitleMatch) score += 500;
      else if (isCloseTitle && isAuthorMatch) score += 400;
      else if (isCloseTitle) score += 300;
      else if (isFranchiseBook) score += 200;
      else if (isAuthorMatch) score += 150;
    }

    // --- PHASE 3: Secondary signals ---
    if (isEnglish(book)) score += 15;
    score += assessCoverQuality(book.coverUrl) * 10;
    score += scoreRecency(book) * 5;
    score += scoreMetadataCompleteness(book) * 5;

    // --- PHASE 4: Penalties ---
    if (assessJunk(book)) score -= 100;

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

  function findExactPopularMatch(query) {
    const intent = detectIntentQuery(query);
    return intent ? intent.info : null;
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
    scoreTitleIntent,
    findExactPopularMatch,
    detectIntentQuery,
    KNOWN_POPULAR_BOOKS,
    FALLBACK_BOOK_IMAGE: FALLBACK
  };
})();
