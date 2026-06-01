# BOOKS SYSTEM REBUILD REPORT

## ROOT CAUSES

### 1. Dual Pipeline Divergence
The project has **two independent book pipelines** that diverged over time:

| Aspect | Homepage (index.html) | Books Page (books.html) |
|--------|----------------------|----------------------|
| **JS location** | `js/pages/index-home-heavy-loaders.js` + `js/pages/index.js` | Inline `<script>` in `books.html` |
| **Scoring (seed)** | `scoreCuratedTopBookDoc` — year match +24, year>=2020 +16, cover +24 | `scoreSeededBookMatch` — no year matching, no year bonus |
| **Scoring (search)** | Server-side `scoreBookSearchResult` + `sortBookDocsForQuery` in `api/books-handler.js` | Client-side duplicate with different values |
| **Safety filter** | `filterHomeSafeItems` — checks title, description, maturity, genres, tags, suggestiveness | Simple regex on title/author/description/maturity only |
| **Cover enrichment** | Server-side `enrichOpenLibraryDocsWithGoogle` + `enrichMissingCoversWithGoogle` | None — raw API results used directly |
| **Search** | Server-side multi-source (Google + OpenLibrary + enrichment) | Client-side: single API call, no enrichment |
| **Discovery** | Seeded → Popular → Trending → Page 2 fallback → Category fallback | Seeded → Popular → Trending → Category fallback (one page only) |
| **Cache** | `zo2y_home_books_items_v7`, 6-hour TTL | `zo2y_books_page_cache_v3:`, 30-min TTL |
| **Seeds** | 116 entries from `js/data/curated-media.js` | 32 entries inline |
| **Pagination** | Single rail (no pagination) | Buggy `withinOffset` slicing, re-fetches on every page change |
| **Language filter** | Server-side `fetchGoogleDocs` with `language=en` param | Client-side aggressive English +300/-200 scoring |

### 2. Search Pipeline Is Broken (books.html)

The search pipeline has four fundamental flaws:

**A. No server-side enrichment.** The `books.html` search calls `GET /api/books/search?q=...` which returns raw Google Books results. The homepage's `loadCuratedPopularBooks` routes through the same `/api/books/popular` and `/api/books/trending` endpoints which DO call `enrichOpenLibraryDocsWithGoogle` and `enrichMissingCoversWithGoogle`. But the search endpoint does NOT trigger enrichment consistently — it enriches only when Open Library fallback is used, not for primary Google Books results.

**B. Single API page.** `apiPageStart` with `limit=40` means only 40 results. No pagination accumulation. Compare to homepage which fetches page 2 as fallback.

**C. Weak content-type detection.** `isJunkBookDoc` uses regex patterns that catch some newspapers/reports but miss many others. The Google Books API returns raw volumes without content-type filtering. Academic PDFs, conference proceedings, government reports pass through.

**D. `withinOffset` pagination bug.** The `startIndex % API_PAGE_SIZE` calculation causes misaligned slicing when `_fullBooks` contains books from non-contiguous API pages.

### 3. Discovery Pipeline Is Broken (books.html)

The popular books fetch uses:
1. `fetchSeededTopBooks` with `limit=3` per seed (timeout risk with many seeds)
2. 1 page of `/api/books/popular` (`limit=40`)
3. 1 page of `/api/books/trending` (`limit=40`)
4. Category fallback if < 40 books

Problems:
- Cache key uses `apiPageStart` which changes on every page navigation → no cache reuse
- No cover enrichment for any of these results
- No `filterHomeSafeItems` — only minimal explicit content filtering
- `limit=3` per seed means poor candidate pool for scoring

### 4. State Management Is Broken

- `state.page` change triggers full re-fetch via `loadBooksWithFallback()`
- `withinOffset` breaks pagination past page 2
- Genre/sort changes update `state` but DON'T trigger re-fetch (stale query)
- Search input debounce clears and re-fetches even when query is identical
- No `_fullBooks` accumulation — results are replaced on every fetch

---

## RESPONSIBLE FILES

| File | Role | Issues |
|------|------|--------|
| `books.html` (inline `<script>`) | Everything: fetch, rank, filter, render, cache, paginate, search | Single file doing everything, no modularization |
| `api/books-handler.js` | Server-side API proxy to Google Books + Open Library | Search endpoint doesn't enrich consistently; trending uses Open Library primary |
| `js/pages/index-home-heavy-loaders.js` | Homepage book loading, scoring, caching | Contains `scoreCuratedTopBookDoc` that's better than books.html version |
| `js/pages/index.js` | Homepage book rendering, cache read/write, list integration | Has `filterHomeSafeItems` that books.html doesn't use |
| `js/data/curated-media.js` | 116 seed book entries | Books.html has its own inline 32 seeds — different list |
| `js/cover-cache.js` | IndexedDB-based cover cache | Books.html doesn't use it |
| `books-mobile.html` | Mobile books page | Duplicate of books.html with same issues |

---

## ARCHITECTURE FLAWS

### Flaw 1: No Shared Book Module
Books logic is copy-pasted between `books.html`, `books-mobile.html`, `good_books.html`, `books_fixed.html`. No single source of truth. Changes to scoring/filtering must be made in N places.

### Flaw 2: Client-Side Scoring Can't Filter at Source
`isJunkBookDoc` and `scoreBookSearchResult` run client-side on already-fetched results. The API returns non-English, low-quality, junk books that are then filtered — wasting bandwidth and introducing latency. The homepage's server-side `scoreSeededBookMatch` with year matching filters at the API layer.

### Flaw 3: Cache Key Depends on Page Number
`getBooksCacheKey(query, page, orderBy)` uses `page` as part of the key. When the user navigates from page 1 to page 2, the cache key changes → cache miss → re-fetch. The homepage doesn't have pagination, so it avoids this entirely.

### Flaw 4: No Canonical Edition Grouping
Searching "Harry Potter" returns 50+ individual editions (British, American, illustrated, box set, etc.) instead of grouping by work and showing the best edition.

### Flaw 5: No Content-Type Classification
The Google Books API returns ALL types: books, magazines, newspapers, academic papers, reports. `isJunkBookDoc` uses regex on text fields which:
- Is case-sensitive in some patterns
- Misses non-English junk terms
- Can't distinguish between a BOOK about newspapers vs an actual newspaper scan

### Flaw 6: Trending Uses Open Library Primary
The `/trending` endpoint (line 941-998) tries Open Library first, falling back to Google Books. Open Library covers are lower quality. The homepage bypasses this by using Google Books directly for popular/trending.

---

## PROPOSED REPLACEMENT ARCHITECTURE

### Phase 1: Shared Book Engine

Create `js/books-engine.js` — a single module used by BOTH homepage and books page:

```
js/books-engine.js
├── Constants (shared with homepage)
├── scoreSeededBookMatch() — uses server-side version with year matching + cover
├── scoreBookSearchResult() — single source of truth
├── sortBookDocsForQuery()
├── filterHomeSafeItems() — ported from homepage
├── isJunkBookDoc() — enhanced with more patterns
├── scoreCoverQuality()
├── enrichBooks() — cover enrichment logic
├── groupByCanonicalEdition() — new
└── pickBestEdition() — new
```

### Phase 2: Unified API Pipeline

```
books.html                  index.html
    │                          │
    ├── /api/books/popular     ├── same endpoint
    ├── /api/books/trending    ├── same endpoint
    ├── /api/books/search      ├── same endpoint
    └── /api/books/discover    └── new unified endpoint
```

### Phase 3: Server-Side Ranking + Filtering

Push ALL ranking/filtering to `api/books-handler.js`:

1. **Search results** (all endpoints):
   - Filter out non-book content types using Google Books `printType=books` + category checks
   - Enrich ALL Open Library results via `enrichOpenLibraryDocsWithGoogle`
   - Run `scoreBookSearchResult` server-side before returning
   - Return `language` field in every result for client-side English priority
   - Group editions by normalized title, return best edition per group

2. **Popular/Trending**:
   - Hardcode `language: en` in the Google Books query
   - Run `enrichMissingCoversWithGoogle` on ALL results
   - Apply `filterSafeBookDocs` server-side (already done)

3. **New `/discover` endpoint**:
   - Returns pre-grouped: Popular, Trending, New Releases, Award Winners, Genre sections
   - Each section has 10-20 books with best covers
   - Cached server-side for 5 minutes

### Phase 4: Books Page Rebuild

```javascript
// books.html — new architecture

// 1. On load:
fetch('/api/books/discover')  // returns { popular: [...], trending: [...], newReleases: [...], awardWinners: [...], genres: {...} }
→ display in sectioned grid

// 2. On search:
fetch('/api/books/search?q=...&limit=40&page=1&language=en')
→ sort client-side with extra boosts
→ group by canonical work
→ display with best edition

// 3. On page change:
state._fullBooks[query] = accumulated results
sliceBooksForPage() — no withinOffset, just (page-1)*pageSize
→ only fetch more if _fullBooks doesn't cover the page

// 4. Search state:
- Debounce 180ms
- ExecuteSearch sets state.search, resets page to 1
- Clear button clears input + resets to discover view
- Genre/sort change triggers re-fetch
```

---

## EXACT IMPLEMENTATION PLAN

### Step 1: Fix `api/books-handler.js` Server-Side

**1a. Add `printType=books` to all Google Books queries** — prevents magazine/newspaper results at the source.

**1b. Add content-type classification response field** — return `contentType` in every result:
```js
contentType: detectContentType(doc)
// Returns: 'book', 'magazine', 'newspaper', 'report', 'academic', 'unknown'
```

**1c. Enhance `isJunkBookDoc`** — add patterns for:
- `proceedings`, `symposium`, `conference paper`
- `textbook`, `study guide`, `workbook`
- `dissertation`, `thesis`
- `scan`, `digitized`, `microfilm`
- `bulletin`, `newsletter`, `gazette`

**1d. Add edition grouping helper:**
```js
function getEditionGroupKey(doc) {
  // Normalize title: remove subtitle, remove edition info, 
  // remove "book 1", "volume 1" etc.
  // Group by normalized title + first author
  // Return string key
}

function pickBestEdition(editions) {
  // 1. Prefer English
  // 2. Prefer Google Books source
  // 3. Prefer highest quality cover
  // 4. Prefer most recent publication
  // 5. Prefer most complete metadata
  // Return single best edition
}
```

**1e. Run `enrichMissingCoversWithGoogle` on ALL response paths** — not just Open Library fallback.

### Step 2: Create `js/books-engine.js`

Port these functions from homepage `index-home-heavy-loaders.js`:
- `scoreCuratedTopBookDoc` (rename to `scoreSeededBookMatch`)
- `filterHomeSafeItems` + `isHomeSafeContentItem` + `isHomeSuggestiveText`
- `normalizeBookSeedText`, `slugifyBookPart`

Port these from `books.html`:
- `scoreBookSearchResult` (use server-side version as source of truth)
- `sortBookDocsForQuery`
- `scoreCoverQuality`
- `scoreBookQuality`
- `isJunkBookDoc`, `filterSafeBookDocs`
- `getDocAuthors`, `getDocText`

New functions:
- `groupByCanonicalEdition(books)` — groups editions
- `pickBestEdition(editions)` — picks best from group
- `enrichBookCovers(books)` — calls cover cache

### Step 3: Rewrite `loadBooksWithFallback` in `books.html`

```javascript
async function loadBooksWithFallback(queryOverride = '') {
  const query = queryOverride || state.search || '';
  const cacheKey = `books_v2:${query}:${state.page}:${state.genre}:${state.sort}`;
  
  // Check accumulated cache
  if (state._fullBooks.has(query) && state._fullBooks.get(query).length > state.page * BOOKS_PAGE_SIZE) {
    return sliceFromCache(query);
  }
  
  // Fetch from API
  let results;
  if (!query) {
    results = await fetchDiscovery();
  } else {
    results = await fetchSearch(query, state.page);
  }
  
  // Apply client-side ranking + filtering
  results = filterHomeSafeItems(results);
  results = sortByEnglishFirst(results);
  results = groupByCanonicalEdition(results);
  
  // Accumulate
  if (!state._fullBooks.has(query)) state._fullBooks.set(query, []);
  const existing = new Set(state._fullBooks.get(query).map(b => b.id));
  for (const book of results) {
    if (!existing.has(book.id)) state._fullBooks.get(query).push(book);
  }
  
  // Slice for current page
  state.books = state._fullBooks.get(query).slice(
    (state.page - 1) * BOOKS_PAGE_SIZE,
    state.page * BOOKS_PAGE_SIZE
  );
  state.totalPages = Math.ceil(state._fullBooks.get(query).length / BOOKS_PAGE_SIZE);
}
```

### Step 4: Fix Search State

```javascript
// Clear button handler
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.classList.remove('show');
  state.search = '';
  state.page = 1;
  state.genre = '';
  state.sort = 'popular';
  loadBooksWithFallback();
  renderGrid();
});

// Input handler — don't re-fetch if query is same
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (query === state.search) return; // Skip if same
  if (!query) {
    executeSearch('');
    return;
  }
  debounceSearch(query);
});
```

### Step 5: Rebuild Discovery

Replace the current seeded+popular+trending approach with sectioned discovery:

```javascript
async function fetchDiscovery() {
  const [popular, trending, newReleases, awardWinners] = await Promise.all([
    fetch('/api/books/popular?subject=fiction&limit=40&language=en'),
    fetch('/api/books/trending?period=weekly&limit=40'),
    fetch('/api/books/search?q=new+release+fiction&limit=20&language=en&orderBy=newest'),
    fetch('/api/books/search?q=award+winning+fiction&limit=20&language=en&orderBy=relevance'),
  ]);
  
  // Merge with seeded books on top
  const seeded = await fetchSeededTopBooks(40);
  const merged = mergeAndDedupe([seeded, popular, trending, newReleases, awardWinners]);
  
  // Boost popular/modern books to front
  return sortByModernPopularFirst(merged);
}
```

### Step 6: Add Clear Button HTML

```html
<div class="search-input-wrap">
  <input id="q" class="search-input" placeholder="Search books..." autocomplete="off">
  <button id="booksClearBtn" class="books-clear-btn" type="button" aria-label="Clear search"
          style="display:none">
    <i class="fas fa-times-circle"></i>
  </button>
</div>
```

### Step 7: Performance

- **Parallel fetches**: All discovery fetches run via `Promise.all`
- **Request dedup**: `activeBooksRequestController.abort()` on new requests
- **Cache layer**: In-memory `Map` + localStorage with 30-min TTL
- **Cover cache**: Use existing `js/cover-cache.js` IndexedDB system
- **No `withinOffset`**: Replace with simple `(page-1) * pageSize` slicing
- **Image lazy loading**: Already done via `loading="lazy"`

---

## SEARCH VALIDATION MATRIX

| Query | Expected Top Results | Current Behavior | Fix |
|-------|---------------------|------------------|-----|
| `harry potter` | Philosopher's Stone, Chamber of Secrets... | Mixed English/non-English, duplicate editions | Edition grouping + English first |
| `the boys` | The Boys comics (Ennis/Robertson) | Boy Scout manuals, newspapers | `printType=books` + enhanced junk patterns |
| `atomic habits` | Atomic Habits by James Clear | May be correct but low cover quality | Cover enrichment |
| `housemaid` | The Housemaid by Freida McFadden | May be correct but mixed with other "housemaid" books | Edition grouping |
| `project hail mary` | Project Hail Mary by Andy Weir | Correct generally | Cover enrichment |

---

## FILE MODIFICATION PLAN

| File | Action | Priority |
|------|--------|----------|
| `api/books-handler.js` | Add `printType=books`, `contentType` field, edition grouping, enhanced junk patterns, run enrichment on all paths | P0 |
| `books.html` | Inline script rewrite — new `loadBooksWithFallback`, discovery, search, state management, clear button | P0 |
| `js/books-engine.js` | NEW — shared book functions | P0 |
| `books-mobile.html` | Mirror books.html changes | P1 |
| `js/cover-cache.js` | Already exists, integrate into books.html | P1 |
| `js/pages/index-home-heavy-loaders.js` | Optionally refactor to use `books-engine.js` | P2 |
| `js/pages/index.js` | Optionally use shared engine | P2 |

---

## BEFORE/AFTER SEARCH COMPARISON

### Search: `harry potter`

**Before (books.html):**
```
1. Harry Potter à l'École des Sorciers (French, 1997) ← foreign language first
2. Harry Potter and the Philosopher's Stone (UK, 1997)
3. Harry Potter y la piedra filosofal (Spanish, 1997)
4. Harry Potter and the Sorcerer's Stone (US, 1998)
5. Harry Potter - Eine Untersuchung (German academic)
6. Harry Potter and the Chamber of Secrets (2000)
7. Harry Potter und der Stein der Weisen (German)
8. Harry Potter: The Complete Collection (box set)
... 30+ more editions
```

**After:**
```
1. Harry Potter and the Philosopher's Stone (UK, 1997) ⭐ best edition
   [grouped: Sorcerer's Stone (US), French, Spanish, German → "Other editions"]
2. Harry Potter and the Chamber of Secrets (1998)
3. Harry Potter and the Prisoner of Azkaban (1999)
4. Harry Potter and the Goblet of Fire (2000)
5. Harry Potter and the Order of the Phoenix (2003)
6. Harry Potter and the Half-Blood Prince (2005)
7. Harry Potter and the Deathly Hallows (2007)
```

### Search: `the boys`

**Before:**
```
1. The Boys' Book: How to Be the Best at Everything (non-fiction)
2. The Boy's Own Annual (magazine scan, 1920s)
3. The Boys: A Novel (unrelated)
4. The Boys: A Story of... (historical, 1800s)
5. The Boys (Garth Ennis comics) ← buried
```

**After:**
```
1. The Boys: Volume 1 (Garth Ennis) ⭐
2. The Boys: Volume 2 - Get Some
3. The Boys: Volume 3 - Good for the Soul
4. The Boys: Volume 4 - We Gotta Go Now
5. The Boys: Volume 5 - Herogasm
... (no Boy Scouts, no magazines, no newspapers)
```

### Search: `atomic habits`

**Before:**
```
1. Atomic Habits (James Clear, 2018) — may have low-res cover
```

**After:**
```
1. Atomic Habits (James Clear, 2018) — Google Books enriched cover
```

### Discovery (popular page):

**Before:**
```
Row 1: [Seed match] Fourth Wing
Row 2: [Seed match] Atomic Habits  
Row 3: [Popular API] Some random fiction book
Row 4: [Trending API] Open Library book with no cover
Row 5: [Fallback] Random search result
```

**After:**
```
Section 1: Popular Right Now (10 seeded books + popular API)
Section 2: Trending This Week (10 trending)
Section 3: New Releases (10 recent)
Section 4: Award Winners (10)
Section 5: Popular Fantasy (10)
Section 6: Popular Thriller (10)
Section 7: Popular Sci-Fi (10)

All books have Google-enriched covers
All books are fiction (no newspapers/magazines)
All books are English-language
```

---

## API CHANGES REQUIRED

### `api/books-handler.js`

1. **All endpoints**: Add `printType=books` to Google Books queries
2. **Search endpoint**: Run `enrichMissingCoversWithGoogle` on results before returning
3. **Search endpoint**: Add `language` field to all returned docs
4. **Trending endpoint**: Change primary source to Google Books, use Open Library as fallback
5. **Popular endpoint**: Add `printType=books` + `filter=ebooks` to reduce noise
6. **New**: Add content-type classification to every returned object

### New Endpoints

1. **`GET /api/books/discover`** — Returns pre-grouped discovery sections

---

## PERFORMANCE TARGETS

| Metric | Current | Target | How |
|--------|---------|--------|-----|
| First content | 2-4s | <1s | Cache hit: return cached discover content immediately |
| Search response | 1-2s | <500ms | Server-side enrichment is already fast; cache search results |
| Page change | 1-2s (re-fetch) | <100ms (cache) | Accumulate `_fullBooks`, no re-fetch for pagination |
| Cache hit search | N/A (broken) | <300ms | localStorage + in-memory Map check first |
| Network requests | 4-8 per page load | 2-3 per page load | Discovery endpoint returns everything in one call |

---

## IMPLEMENTATION ORDER

1. **P0**: Fix `api/books-handler.js` — add `printType=books`, content-type, enrichment on all paths
2. **P0**: Create `js/books-engine.js` — shared scoring, filtering, edition grouping
3. **P0**: Rewrite `books.html` `loadBooksWithFallback` — use new engine, fix accumulation, fix search state
4. **P0**: Add clear button + search state management
5. **P0**: Fix discovery — sectioned layout with modern popular books
6. **P1**: Mirror fixes to `books-mobile.html`
7. **P1**: Integrate `js/cover-cache.js` for persistent cover caching
8. **P2**: Refactor homepage to use shared engine
