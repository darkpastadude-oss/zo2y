# BOOKS SYSTEM REBUILD REPORT

## EXECUTIVE SUMMARY

The current Books experience is considered failed due to multiple critical issues:
- Search returns foreign-language editions before English
- Search returns academic books, reports, and unrelated content
- Search returns low-quality editions instead of canonical editions
- Search results contain duplicate editions
- Discovery pages surface random books instead of recognizable popular books
- Search input state is not reset properly after navigation
- Search feels slow
- Covers are inconsistent quality
- Homepage books appear significantly higher quality than Books page books

This report documents the complete architecture trace, root causes, and proposed rebuild plan.

---

## PHASE 1: ARCHITECTURE TRACE

### FILES IDENTIFIED

**Homepage Implementation (Working):**
- `index.html` - Main landing page
- `js/pages/index.js` - Homepage logic (12,027 lines)
- `js/pages/index-home-heavy-loaders.js` - Heavy loaders including books (2,290 lines)

**Books Page Implementation (Failed):**
- `books.html` - Dedicated books page (1,715 lines)
- No separate `books-app.js` or `books-ranking.js` found - logic is embedded in `books.html` inline script

**Backend APIs:**
- `api/books-handler.js` - Books API handler (1,048 lines)
- `api/openlibrary-handler.js` - Open Library proxy (89 lines)

---

### API ARCHITECTURE

#### Primary Data Sources

**Google Books API** (via proxy at `/api/books`)
- Base: `https://www.googleapis.com/books/v1`
- Used for: Search, popular books, trending books
- Provides: High-quality covers, metadata, English-language results
- Proxy endpoint: `/api/books/search`, `/api/books/popular`, `/api/books/trending`

**Open Library API** (via proxy at `/api/openlibrary`)
- Base: `https://openlibrary.org`
- Used for: Fallback data, historical books
- Provides: Large catalog but lower quality data
- Issues: Many scanned documents, newspapers, reports, academic works

---

### RANKING PIPELINE COMPARISON

#### Homepage Books Ranking (`index-home-heavy-loaders.js`)

**Function: `scoreSeededBookMatch()`** (Lines 40-58)
```javascript
function scoreSeededBookMatch(row, seed) {
  const normalizedTitle = normalizeBookSeedText(row?.title || '');
  const normalizedAuthor = normalizeBookSeedText(Array.isArray(row?.author_name) ? row.author_name[0] : '');
  const seedTitle = normalizeBookSeedText(seed?.title || '');
  const seedAuthor = normalizeBookSeedText(seed?.author || '');
  let score = 0;
  if (normalizedTitle && seedTitle) {
    if (normalizedTitle === seedTitle) score += 120;
    else if (normalizedTitle.startsWith(seedTitle) || seedTitle.startsWith(normalizedTitle)) score += 80;
    else if (normalizedTitle.includes(seedTitle) || seedTitle.includes(normalizedTitle)) score += 48;
  }
  if (normalizedAuthor && seedAuthor) {
    if (normalizedAuthor === seedAuthor) score += 70;
    else if (normalizedAuthor.includes(seedAuthor) || seedAuthor.includes(normalizedAuthor)) score += 42;
  }
  if (row?._googleThumbnail || row?.coverImage || row?.cover_i) score += 16;
  if (row?.first_publish_year) score += 8;
  return score;
}
```

**Strengths:**
- High exact title match bonus (+120)
- High exact author match bonus (+70)
- Cover quality weighting (+16)
- Publication year weighting (+8)

**Function: `scoreCuratedTopBookDoc()`** (Lines 2103-2124)
Similar to above but with additional year-based bonuses:
- Cover presence: +24
- Recent books (2020+): +16
- Year match with seed: +24

---

#### Books Page Ranking (`books.html` inline)

**Function: `scoreBookQuality()`** (Lines 1181-1199)
```javascript
function scoreBookQuality(book) {
  let score = 0;
  const cover = String(book.coverUrl || '');
  const hasCover = cover && !cover.includes('fallback') && cover !== FALLBACK_BOOK_IMAGE;
  if (hasCover && cover.startsWith('http')) score += 40;
  if (book.publishedDate) {
    const year = new Date(book.publishedDate).getFullYear();
    if (!isNaN(year)) {
      const age = new Date().getFullYear() - year;
      if (age <= 2) score += 30;
      else if (age <= 5) score += 25;
      else if (age <= 10) score += 15;
      else if (age <= 20) score += 5;
    }
  }
  const author = String(book.authors || '');
  if (author && author !== 'Unknown Author') score += 15;
  if (book.description && book.description.length > 50) score += 10;
  return score;
}
```

**Weaknesses:**
- No title match scoring
- No author match scoring
- No seed-based ranking
- Only basic quality metrics
- Much lower scoring values (max ~100 vs homepage ~200+)

---

### FILTERING PIPELINE COMPARISON

#### Homepage Filtering (`index.js`)

**Function: `filterHomeSafeItems()`** (Lines 2099-2101)
```javascript
function filterHomeSafeItems(items = []) {
  return (Array.isArray(items) ? items : []).filter((item) => isHomeSafeContentItem(item));
}
```

**Function: `isHomeSafeContentItem()`** (Lines 2070-2097)
Checks for:
- Mature/explicit content
- Suggestive text patterns
- Adult content indicators

**Function: `isHomeSuggestiveText()`** (Lines 2040-2065)
Patterns blocked:
- erotica, explicit, adult, pornographic
- mature audience, sexual content
- suggestive terms

---

#### Books Page Filtering (`books.html` inline)

**Filtering in `loadBooksWithFallback()`** (Lines 1325-1336)
```javascript
if (query) {
  state.books = state.books
    .filter(b => {
      const cover = String(b.coverUrl || '');
      const hasCover = cover && !cover.includes('fallback') && cover !== FALLBACK_BOOK_IMAGE;
      const authorOk = String(b.authors || '') !== '' && String(b.authors || '') !== 'Unknown Author';
      const titleOk = String(b.title || '').length >= 2;
      const yearOk = b.publishedDate ? new Date(b.publishedDate).getFullYear() >= 1990 : true;
      return (hasCover || authorOk) && titleOk && yearOk;
    })
    .sort((a, b) => scoreBookQuality(b) - scoreBookQuality(a));
}
```

**Weaknesses:**
- No explicit content filtering
- No junk content filtering (newspapers, reports, etc.)
- No maturity rating checks
- Only basic quality filters

---

### CACHING PIPELINE COMPARISON

#### Homepage Caching (`index-home-heavy-loaders.js`)

**Cache Key:** `HOME_BOOKS_ITEMS_CACHE_KEY`
**Cache TTL:** `HOME_BOOKS_ITEMS_CACHE_MAX_AGE_MS`
**Storage:** LocalStorage
**Cache Buster:** `BOOKS_CACHE_BUSTER = '20260325a'`

**Function:** `readHomeItemsCache()` (Lines 2225-2233)
- Validates cache age
- Sanitizes items
- Returns empty array if expired

**Function:** `writeHomeItemsCache()` (not shown in excerpt but referenced)
- Writes to localStorage
- Includes timestamp

---

#### Books Page Caching (`books.html` inline)

**Cache Key:** `BOOKS_CACHE_PREFIX + query + page + orderBy`
**Cache TTL:** `BOOKS_CACHE_TTL_MS = 1000 * 60 * 30` (30 minutes)
**Storage:** LocalStorage + in-memory Map

**Function:** `readBooksRequestCache()` (Lines 1135-1156)
- Checks in-memory Map first
- Falls back to localStorage
- Validates TTL
- Removes expired entries

**Function:** `writeBooksRequestCache()` (Lines 1158-1169)
- Writes to both Map and localStorage
- Includes timestamp

**Issues:**
- No cache buster versioning
- Cache key includes query which can cause cache bloat
- No cache invalidation strategy

---

### DISCOVERY PIPELINE COMPARISON

#### Homepage Discovery (`index-home-heavy-loaders.js`)

**Function:** `loadCuratedPopularBooks()` (Lines 2152-2202)
```javascript
async function loadCuratedPopularBooks() {
  const [seededResult, popularResult, trendingResult] = await Promise.allSettled([
    fetchSeededTopBooks(BOOKS_PER_PAGE),
    fetchPopularBooks(1, BOOKS_PER_PAGE),
    fetchTrendingBooks(BOOKS_PER_PAGE)
  ]);
  // ... merge and dedupe
}
```

**Strategy:**
1. **Seeded books** - Uses `CURRENT_TOP_BOOK_SEEDS` (curated list of popular modern books)
2. **Popular books** - `/api/books/popular?subject=fiction&language=en&orderBy=relevance`
3. **Trending books** - `/api/books/trending?period=weekly`
4. **Fallback** - Fetches additional pages if needed
5. **Deduplication** - Uses title::author key

**Seeds:** Modern, recognizable bestsellers (Onyx Storm, Fourth Wing, The Housemaid, etc.)

---

#### Books Page Discovery (`books.html` inline)

**Function:** `loadBooksWithFallback()` (Lines 1215-1282)
```javascript
if (!query) {
  const BOOKS_PER_PAGE = Math.max(40, BOOKS_PAGE_SIZE * 2);
  
  // Fetch trending
  await Promise.all(
    ['weekly', 'monthly', 'daily'].map((period) =>
      fetchAndParse(`${GOOGLE_BOOKS_PROXY_BASE}/trending?period=${period}&limit=${BOOKS_PER_PAGE}`)
    )
  );
  
  // Fallback to subjects
  if (books.length < 15) {
    const subjects = ['fiction', 'fantasy', 'romance', 'mystery', 'science fiction'];
    await Promise.all(
      subjects.map((subject) =>
        fetchAndParse(`${GOOGLE_BOOKS_PROXY_BASE}/popular?subject=${encodeURIComponent(subject)}&limit=${Math.ceil(BOOKS_PER_PAGE / 2)}&page=1&language=en`)
      )
    );
  }
  
  // Fallback to search queries
  if (books.length < 15) {
    const fallbackQueries = [
      'bestseller fiction',
      'new release fiction',
      'award winning fiction',
      'popular fantasy',
      'popular thriller',
      'popular sci fi'
    ];
    await Promise.all(
      fallbackQueries.map((q) =>
        fetchAndParse(`${GOOGLE_BOOKS_PROXY_BASE}/search?q=${encodeURIComponent(q)}&limit=${Math.ceil(BOOKS_PER_PAGE / 3)}&page=1&language=en&orderBy=relevance`)
      )
    );
  }
}
```

**Issues:**
- No seeded books (no curation)
- Relies entirely on API responses
- Multiple fallback layers but no quality control
- No deduplication between sources
- No canonical edition selection

---

### SEARCH PIPELINE COMPARISON

#### Homepage Search (via `universal-search.js`)

**Function:** `searchBooks()` (Lines 178-198)
```javascript
async function searchBooks(query, signal) {
  const url = new URL(`${BOOKS_PROXY_BASE}/search`, window.location.origin);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('page', '1');
  const json = await fetchJson(url.toString(), signal);
  const books = Array.isArray(json?.books) ? json.books : [];
  return books.map((b) => {
    const id = String(b?.id || b?.book_id || '').trim();
    const title = String(b?.title || b?.name || '').trim();
    if (!title) return null;
    const author = Array.isArray(b?.authors) ? String(b.authors[0] || '').trim() : String(b?.author || '').trim();
    return {
      type: 'Books',
      title,
      sub: author ? `Book • ${author}` : 'Book',
      image: toHttpsUrl(b?.image || b?.cover || b?.thumbnail || ''),
      href: id ? `book.html?id=${encodeURIComponent(id)}` : 'books.html'
    };
  }).filter(Boolean);
}
```

**Limit:** 8 results
**No custom ranking** - relies on API ranking

---

#### Books Page Search (`books.html` inline)

**Function:** `loadBooksWithFallback()` with query (Lines 1283-1305)
```javascript
else {
  const orderBy = query.match(/\b(202[4-9]|2030)\b/) ? 'newest' : 'relevance';
  const searchQuery = query + (state.genre ? `+subject:${state.genre}` : '');
  const cachedSearch = readBooksRequestCache(searchQuery, apiPageStart, orderBy);
  if (cachedSearch?.books?.length) {
    books = cachedSearch.books.slice();
    apiTotalResults = cachedSearch.total || cachedSearch.books.length;
  } else {
    const url = `${GOOGLE_BOOKS_PROXY_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=${API_PAGE_SIZE}&page=${apiPageStart}&language=en&orderBy=${orderBy}`;
    try {
      const res = await fetch(url, { signal });
      if (res.ok) {
        const json = await res.json();
        books = Array.isArray(json?.books) ? json.books : (Array.isArray(json?.docs) ? json.docs : []);
        apiTotalResults = Number(json?.meta?.numFound || json?.numFound || json?.total || 0);
        writeBooksRequestCache(searchQuery, apiPageStart, orderBy, books, apiTotalResults);
      }
    } catch (_err) {
      if (_err?.name === 'AbortError') return;
      console.error('Failed to search books', _err);
    }
  }
}
```

**Post-processing:** (Lines 1325-1336)
- Filters by cover quality, author presence, title length, year
- Sorts by `scoreBookQuality()`

**Issues:**
- No title match boosting
- No author match boosting
- No franchise detection
- No English priority
- Relies entirely on API ranking

---

### BACKEND API RANKING (`api/books-handler.js`)

**Function:** `scoreBookSearchResult()` (Lines 191-219)
```javascript
function scoreBookSearchResult(doc = {}, query = "") {
  const q = normalizeRankText(query);
  const title = normalizeRankText(doc?.title || "");
  const authors = normalizeRankText(getDocAuthors(doc).join(" "));
  const haystack = normalizeRankText(getDocText(doc));
  const year = Number(doc?.first_publish_year || doc?.year || 0) || 0;
  let score = 0;

  if (q && title) {
    if (title === q) score += 500;
    else if (title.startsWith(q)) score += 360;
    else if (title.includes(q)) score += 260;
    const queryTokens = q.split(" ").filter(Boolean);
    const titleTokenHits = queryTokens.filter((token) => title.includes(token)).length;
    if (queryTokens.length && titleTokenHits === queryTokens.length) score += 180;
  }

  if (q && POPULAR_SERIES.some((series) => q.includes(series) || title.includes(series))) score += 300;
  if (POPULAR_SERIES.some((series) => title.includes(series))) score += 200;
  if (authors && KNOWN_AUTHORS.some((author) => authors.includes(author))) score += 100;
  if (haystack.includes("english") || doc?._source === "google-books") score += 150;
  score += scoreCoverQuality(doc);
  if (year >= 1990 && year <= CURRENT_YEAR + 1) score += 50;
  if (year && year < 1950) score -= 180;
  if (doc?._source === "openlibrary" && !doc?._googleThumbnail) score -= 40;
  if (isJunkBookDoc(doc)) score -= 700;

  return score;
}
```

**Strengths:**
- High exact title match (+500)
- Franchise detection (+300)
- Known author detection (+100)
- English priority (+150)
- Junk content penalty (-700)
- Old book penalty (-180)

**Function:** `filterSafeBookDocs()` (Lines 146-148)
```javascript
function filterSafeBookDocs(docs = []) {
  return (Array.isArray(docs) ? docs : []).filter((doc) => !isJunkBookDoc(doc));
}
```

**Function:** `isJunkBookDoc()` (Lines 136-144)
```javascript
function isJunkBookDoc(doc = {}) {
  const text = getDocText(doc);
  if (!String(doc?.title || "").trim()) return true;
  if (EXPLICIT_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (JUNK_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  const maturity = String(doc?.maturityRating || "").toLowerCase();
  if (maturity && maturity !== "not_mature" && maturity.includes("mature")) return true;
  return false;
}
```

**Junk Patterns:** (Lines 53-58)
```javascript
const JUNK_TEXT_PATTERNS = [
  /\b(newspaper|magazine|periodical|journal|proceedings|conference|symposium|report|annual report)\b/i,
  /\b(government|bureau|department|committee|commission|census|gazette|archive|archives)\b/i,
  /\b(manual|catalogue|catalog|directory|bulletin|pamphlet|microform|thesis|dissertation)\b/i,
  /\b(scanned|scan|public domain|historical document|academic pdf|working paper)\b/i
];
```

**Explicit Patterns:** (Lines 59-61)
```javascript
const EXPLICIT_TEXT_PATTERNS = [
  /\b(erotica|explicit|adult|pornographic|mature audience|sexual content)\b/i
];
```

---

## KEY DIFFERENCES SUMMARY

| Aspect | Homepage (Working) | Books Page (Failed) |
|--------|-------------------|---------------------|
| **Seed Scoring** | `scoreSeededBookMatch()` - High precision (+120 title, +70 author) | No seed scoring |
| **Candidate Pool** | limit=5 per seed | No seed-based fetching |
| **Content Safety** | `filterHomeSafeItems()` - Explicit content filtering | No explicit content filtering |
| **Junk Filtering** | Backend `isJunkBookDoc()` - Newspapers, reports, etc. | No junk filtering |
| **English Priority** | Backend +150 for English/Google Books | No English priority |
| **Franchise Detection** | Backend +300 for popular series | No franchise detection |
| **Cover Quality** | Backend `scoreCoverQuality()` - Detailed scoring | Basic cover check |
| **Canonical Editions** | No deduplication by edition | No edition grouping |
| **Discovery Strategy** | Seeded + Popular + Trending | Trending + Subject + Search fallback |
| **Search Ranking** | Backend `scoreBookSearchResult()` | Basic quality sort only |

---

## ROOT CAUSES

### 1. Missing Seed-Based Curation
**Problem:** Books page has no curation, relies entirely on API responses
**Impact:** Random, unrecognizable books instead of popular bestsellers
**Evidence:** Homepage uses `CURRENT_TOP_BOOK_SEEDS` with curated modern bestsellers

### 2. Weak Client-Side Ranking
**Problem:** `scoreBookQuality()` only checks basic quality metrics
**Impact:** Poor search relevance, foreign editions outrank English
**Evidence:** Homepage uses backend `scoreBookSearchResult()` with +500 exact title match

### 3. No Content Safety Filtering
**Problem:** Books page lacks `filterHomeSafeItems()` equivalent
**Impact:** Mature content, junk documents appear in results
**Evidence:** Backend has `isJunkBookDoc()` but books page doesn't use it

### 4. No English Priority
**Problem:** No language-based ranking boost
**Impact:** Foreign editions appear before English editions
**Evidence:** Backend adds +150 for English/Google Books source

### 5. No Canonical Edition System
**Problem:** Multiple editions of same book appear as duplicates
**Impact:** Search results cluttered with 50 Harry Potter editions
**Evidence:** No edition grouping logic anywhere

### 6. Inconsistent Discovery Strategy
**Problem:** Books page uses fallback queries without quality control
**Impact:** Random books from generic queries
**Evidence:** Homepage uses seeded books + API results with deduplication

### 7. Search State Management Issues
**Problem:** Search input not properly cleared/reset
**Impact:** Stale queries persist, confusing UX
**Evidence:** User complaint in requirements

---

## PROPOSED REPLACEMENT ARCHITECTURE

### Principle: Use Homepage as Source of Truth

**DO NOT create new systems. Reuse homepage logic.**

---

### P1 - CRITICAL FIXES

#### 1. Replace Books Page Seed Scoring with Homepage Seed Scoring

**Current:** `books.html` has no seed scoring
**Target:** Port `scoreSeededBookMatch()` from `index-home-heavy-loaders.js`

**Implementation:**
- Copy `scoreSeededBookMatch()` function to `books.html`
- Copy `normalizeBookSeedText()` function to `books.html`
- Replace any weak scoring with this function

**Expected Result:** Only highly accurate seed matches survive

---

#### 2. Increase Candidate Pool per Seed

**Current:** No seed-based fetching
**Target:** limit=5 per seed (matching homepage)

**Implementation:**
- Add `fetchSeededTopBooks()` function from homepage
- Use `CURRENT_TOP_BOOK_SEEDS` from homepage
- Fetch 5 candidates per seed, score, pick best

**Expected Result:** More candidates before scoring, better quality

---

#### 3. Add Homepage Content Safety Filtering

**Current:** No explicit content filtering
**Target:** Port `filterHomeSafeItems()` from `index.js`

**Implementation:**
- Copy `filterHomeSafeItems()` function to `books.html`
- Copy `isHomeSafeContentItem()` function to `books.html`
- Copy `isHomeSuggestiveText()` function to `books.html`
- Apply to: Popular Books, Trending Books, New Releases, Search Results

**Expected Result:** No mature/explicit/junk content

---

### P2 - DISCOVERY QUALITY

#### 4. Replace "2025" Query

**Current:** Uses hardcoded year queries
**Target:** Use dynamic year-aware queries

**Implementation:**
- Remove any hardcoded "2025" queries
- Use current year dynamically: `new Date().getUTCFullYear()`
- Use homepage discovery queries: "bestseller fiction", "new release fiction", etc.

**Expected Result:** No hardcoded years, always current

---

#### 5. Add Google Books Enrichment

**Current:** Relies on Open Library for trending
**Target:** Prefer Google Books enriched results

**Implementation:**
- Backend already has Google Books integration
- Ensure frontend prefers `_googleThumbnail` results
- Priority: Google Books enriched > Google Books native > Open Library only

**Expected Result:** Higher quality covers and metadata

---

#### 6. Prioritize Cover Quality

**Current:** Basic cover check
**Target:** Use backend `scoreCoverQuality()` logic

**Implementation:**
- Port `scoreCoverQuality()` from backend to frontend
- Boost: high resolution, color, modern, non-placeholder
- Penalize: blank, scanned, newspaper, academic PDF, government reports

**Expected Result:** Better cover quality in results

---

### P3 - SEARCH RELEVANCE REBUILD

#### Netflix/TMDB-Style Search Ranking

**Boosts:**
- +500 exact title match
- +300 franchise match
- +200 popular series
- +150 English language
- +100 known author
- +50 high quality cover

**Penalties:**
- -500 newspaper
- -500 magazine
- -500 proceedings
- -500 report
- -500 archive document
- -300 scanned historical document
- -300 public domain scan
- -200 non-English when English exists

**Implementation:**
- Port `scoreBookSearchResult()` from backend to frontend
- Port `POPULAR_SERIES` and `KNOWN_AUTHORS` arrays
- Port `JUNK_TEXT_PATTERNS` and `EXPLICIT_TEXT_PATTERNS`
- Apply to all search results

**Expected Result:** Harry Potter search returns Harry Potter books first

---

### P4 - ENGLISH PRIORITY

**Current:** No language-based ranking
**Target:** English editions always rank first

**Implementation:**
- Add +150 boost for English language (already in backend)
- Add +150 boost for Google Books source (proxy for English)
- When English editions exist, sort them before foreign editions
- Never allow Italian/German/Spanish/French to occupy top rows if English exists

**Expected Result:** English editions always first

---

### P5 - FRONT PAGE IMPROVEMENTS

**Current:** Random books from API
**Target:** Modern, recognizable bestsellers

**Implementation:**
- Use `CURRENT_TOP_BOOK_SEEDS` from homepage
- Ensure seeded books appear first on page 1
- Avoid: 1800s scans, public domain, government reports, newspapers

**Expected Result:** Books like Fourth Wing, The Housemaid, Atomic Habits appear

---

### P6 - PERFORMANCE

**Targets:**
- Initial load < 2 seconds
- Cached searches < 300ms
- No duplicate requests
- No unnecessary refetches

**Implementation:**
- Use homepage caching strategy
- Add cache buster versioning
- Implement request deduplication
- Use image lazy loading
- Consider virtualized rendering for large grids

**Expected Result:** Faster load times, fewer network requests

---

### P7 - UX

**Search State Management:**
- Clear button should appear after search
- New searches should not require manual deletion
- Search state should remain consistent on desktop and mobile
- Search results should instantly replace discovery content

**Implementation:**
- Add clear button to search input
- Auto-clear on new search
- Sync search state across desktop/mobile
- Immediate content replacement

**Expected Result:** Better search UX

---

## EXACT IMPLEMENTATION PLAN

### Step 1: Port Homepage Seed Scoring to Books Page
- Copy `scoreSeededBookMatch()` from `index-home-heavy-loaders.js` to `books.html`
- Copy `normalizeBookSeedText()` from `index-home-heavy-loaders.js` to `books.html`
- Copy `CURRENT_TOP_BOOK_SEEDS` from `index-home-heavy-loaders.js` to `books.html`
- Add `fetchSeededTopBooks()` function to `books.html`
- Update `loadBooksWithFallback()` to use seeded books first

### Step 2: Port Content Safety Filtering
- Copy `filterHomeSafeItems()` from `index.js` to `books.html`
- Copy `isHomeSafeContentItem()` from `index.js` to `books.html`
- Copy `isHomeSuggestiveText()` from `index.js` to `books.html`
- Apply filtering to all book results

### Step 3: Port Search Ranking
- Copy `scoreBookSearchResult()` from `api/books-handler.js` to `books.html`
- Copy `POPULAR_SERIES` from `api/books-handler.js` to `books.html`
- Copy `KNOWN_AUTHORS` from `api/books-handler.js` to `books.html`
- Copy `JUNK_TEXT_PATTERNS` from `api/books-handler.js` to `books.html`
- Copy `EXPLICIT_TEXT_PATTERNS` from `api/books-handler.js` to `books.html`
- Apply ranking to all search results

### Step 4: Add English Priority
- Add language detection to frontend
- Add +150 boost for English language
- Add +150 boost for Google Books source
- Sort English editions before foreign editions

### Step 5: Improve Discovery
- Replace hardcoded year queries with dynamic year
- Use homepage discovery queries
- Ensure seeded books appear first
- Add deduplication by title::author

### Step 6: Fix Search State
- Add clear button to search input
- Auto-clear on new search
- Sync search state across desktop/mobile
- Immediate content replacement

### Step 7: Performance Optimization
- Add cache buster versioning
- Implement request deduplication
- Use image lazy loading
- Consider virtualized rendering

### Step 8: Testing
- Test "harry potter" search
- Test "the boys" search
- Test "atomic habits" search
- Test "housemaid" search
- Test "project hail mary" search
- Verify no newspapers, reports, proceedings

---

## FILES TO MODIFY

1. **books.html** - Main books page
   - Add seed scoring functions
   - Add content safety filtering
   - Add search ranking
   - Add English priority
   - Improve discovery
   - Fix search state
   - Optimize performance

2. **api/books-handler.js** - Backend API
   - Ensure English priority is enforced
   - Ensure junk filtering is working
   - Add canonical edition grouping (if not present)

---

## VALIDATION CRITERIA

### Search Tests
- "harry potter" → English Harry Potter books first
- "the boys" → The Boys graphic novels/comics first
- "atomic habits" → Atomic Habits first
- "housemaid" → The Housemaid first
- "project hail mary" → Project Hail Mary first

### Content Tests
- No newspapers
- No archive scans
- No government reports
- No conference proceedings
- No mature/explicit content

### Quality Tests
- High quality covers
- Modern, recognizable books
- English editions first
- No duplicate editions

---

## CONCLUSION

The books page rebuild requires porting the homepage's proven ranking, filtering, and discovery logic to the dedicated books page. The homepage implementation is significantly better because it uses:

1. **Seed-based curation** - Curated list of popular modern books
2. **High-precision scoring** - +120 exact title match, +70 exact author match
3. **Content safety filtering** - Explicit content and junk content filtering
4. **English priority** - +150 boost for English/Google Books
5. **Franchise detection** - +300 boost for popular series
6. **Cover quality scoring** - Detailed cover quality assessment

By reusing the homepage logic, the books page can achieve the same quality results without creating new systems.
