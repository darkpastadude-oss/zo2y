(function () {
  'use strict';

  const API_BASE = '/api/books';
  const FALLBACK_COVER = '/images/fallback/book.svg';
  const PER_PAGE = 24;

  const DISCOVERY_SECTIONS = [
    { id: 'popular', label: 'popular right now', desc: 'The most-read books across Zo2y this week.' },
    { id: 'trending', label: 'trending this week', desc: 'What everyone is talking about.' },
    { id: 'new', label: 'new releases', desc: 'The latest English-language fiction.' },
    { id: 'fantasy', label: 'fantasy essentials', desc: 'From Tolkien to Sanderson and beyond.' },
    { id: 'scifi', label: 'sci-fi essentials', desc: 'The science fiction every reader should know.' },
    { id: 'mystery', label: 'mystery essentials', desc: 'Compelling mysteries and detective stories.' },
    { id: 'thriller', label: 'thriller favorites', desc: 'Gripping thrillers that will keep you up all night.' },
    { id: 'romance', label: 'romance favorites', desc: 'Beloved romance from contemporary to classic.' },
    { id: 'booktok', label: 'booktok trending', desc: 'The titles everyone is reading right now.' },
    { id: 'awards', label: 'award winners', desc: 'Pulitzer, Booker, Hugo, Nebula, and more.' },
    { id: 'classics', label: 'modern classics', desc: 'The titles that defined a generation.' },
    { id: 'editors', label: "editor's picks", desc: 'Hand-picked favorites from our editorial team.' }
  ];

  const GENRE_CHIPS = [
    { value: '', label: 'All' },
    { value: 'fiction', label: 'Fiction' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science fiction', label: 'Sci-Fi' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'romance', label: 'Romance' },
    { value: 'horror', label: 'Horror' },
    { value: 'young adult', label: 'YA' },
    { value: 'biography', label: 'Biography' },
    { value: 'history', label: 'History' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' }
  ];

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getCover(book) {
    return String(book.coverImage || book.cover || '').trim() || FALLBACK_COVER;
  }

  function renderBookCard(book) {
    if (!book) return '';
    const title = book.title || 'Untitled';
    const authors = Array.isArray(book.author_name) ? book.author_name.join(', ') : 'Unknown Author';
    const year = book.first_publish_year || '';
    const cover = getCover(book);
    const id = String(book.id || '').trim();
    return '<article class="card" data-id="' + escapeHtml(id) + '">' +
      '<a href="book.html?id=' + encodeURIComponent(id) + '" class="card-media">' +
      '<img src="' + escapeHtml(cover) + '" alt="' + escapeHtml(title) + '" loading="lazy" onerror="this.src=\'' + FALLBACK_COVER + '\'">' +
      '</a>' +
      '<div class="card-meta">' +
      '<h3 class="card-title" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</h3>' +
      '<div class="card-sub">' + escapeHtml(authors) + '</div>' +
      (year ? '<div class="card-extra">' + escapeHtml(String(year)) + '</div>' : '') +
      '</div>' +
      '</article>';
  }

  function renderSection(section) {
    if (!section || !section.books || !section.books.length) return '';
    return '<section class="section book-section" data-section="' + escapeHtml(section.id) + '">' +
      '<div class="section-head"><div class="section-head-text">' +
      '<h2>' + escapeHtml(section.label) + '</h2>' +
      '<p>' + escapeHtml(section.desc) + '</p>' +
      '</div></div>' +
      '<div class="grid book-grid">' + section.books.map(renderBookCard).join('') + '</div>' +
      '</section>';
  }

  function renderSkeleton(count) {
    let html = '';
    for (let s = 0; s < count; s++) {
      html += '<section class="section book-section"><div class="section-head"><div class="section-head-text">' +
        '<div class="skeleton-line skeleton-line-lg skeleton-shimmer"></div>' +
        '<div class="skeleton-line skeleton-line-md skeleton-shimmer"></div>' +
        '</div></div><div class="grid book-grid">';
      for (let i = 0; i < 6; i++) {
        html += '<article class="card book-skeleton-card">' +
          '<div class="card-media skeleton-shimmer"></div>' +
          '<div class="card-meta">' +
          '<span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>' +
          '<span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>' +
          '<span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>' +
          '</div></article>';
      }
      html += '</div></section>';
    }
    return html;
  }

  function renderPagination(page, totalPages) {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    html += '<button class="pag-btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '><i class="fas fa-chevron-left"></i> Prev</button>';
    html += '<span class="pag-info">Page ' + page + ' of ' + totalPages + '</span>';
    html += '<button class="pag-btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>Next <i class="fas fa-chevron-right"></i></button>';
    html += '</div>';
    return html;
  }

  function buildOpenLibraryUrl(params) {
    const url = new URL('https://openlibrary.org/search.json');
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        url.searchParams.append(k, params[k]);
      }
    });
    return url.toString();
  }

  async function fetchOlPopular(limit) {
    try {
      const r = await fetch('/api/books/ol-popular?limit=' + limit);
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j.books) ? j.books : [];
    } catch (_e) { return []; }
  }

  async function fetchOlSearch(q, page, limit) {
    try {
      const url = buildOpenLibraryUrl({ q: q, limit: limit, page: page, language: 'eng' });
      const r = await fetch(url);
      if (!r.ok) return { books: [], numFound: 0 };
      const j = await r.json();
      const docs = Array.isArray(j.docs) ? j.docs : [];
      const books = docs.map(function (d) {
        const title = String(d.title || '').trim();
        if (!title) return null;
        return {
          id: String(d.key || '').replace('/works/', ''),
          title: title,
          author_name: Array.isArray(d.author_name) ? d.author_name : [],
          first_publish_year: Number(d.first_publish_year || 0) || null,
          coverImage: Number(d.cover_i || 0) > 0 ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : '',
          cover: Number(d.cover_i || 0) > 0 ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : '',
          _source: 'open-library'
        };
      }).filter(Boolean);
      return { books: books, numFound: Number(j.numFound || books.length) };
    } catch (_e) { return { books: [], numFound: 0 }; }
  }

  async function initBooksPage() {
    var discoverContainer = document.getElementById('booksDiscover');
    var flatSection = document.getElementById('booksFlatSection');
    var grid = document.getElementById('booksGrid');
    var searchInput = document.getElementById('q');
    var searchBtn = document.getElementById('booksSearchBtn');
    var genreChips = document.getElementById('booksGenreChips');
    var paginationContainer = document.getElementById('booksPagination');

    if (!discoverContainer) return;

    var currentSearchQuery = '';
    var currentPage = 1;
    var totalPages = 1;

    function showError(msg) {
      if (discoverContainer) {
        discoverContainer.innerHTML = '<div class="book-empty-state"><i class="fas fa-triangle-exclamation"></i><h3>Books feed unavailable</h3><p>' + escapeHtml(msg || 'Please retry shortly.') + '</p></div>';
      }
    }

    async function loadDiscovery() {
      if (!discoverContainer) return;
      discoverContainer.innerHTML = renderSkeleton(DISCOVERY_SECTIONS.length);
      discoverContainer.hidden = false;
      if (flatSection) flatSection.hidden = true;

      try {
        var sections = await Promise.all(
          DISCOVERY_SECTIONS.map(async function (sec) {
            var books = await fetchOlPopular(24);
            if (books.length) {
              return { id: sec.id, label: sec.label, desc: sec.desc, books: books };
            }
            return null;
          })
        );
        var rendered = sections.filter(Boolean).map(renderSection).join('');
        if (rendered) {
          discoverContainer.innerHTML = rendered;
        } else {
          showError('No books available right now.');
        }
      } catch (err) {
        showError('Failed to load books.');
      }
    }

    function renderGrid(books, page, total) {
      if (!grid) return;
      if (!books.length) {
        grid.innerHTML = '<div class="book-empty-state"><i class="fas fa-book-open"></i><h3>No books found</h3><p>Please try a different search.</p></div>';
        return;
      }
      grid.innerHTML = books.map(renderBookCard).join('');
      if (paginationContainer) {
        paginationContainer.innerHTML = renderPagination(page, total);
        paginationContainer.querySelectorAll('.pag-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var p = parseInt(btn.dataset.page, 10);
            if (p > 0 && p <= totalPages) {
              currentPage = p;
              if (currentSearchQuery) {
                performSearch(currentSearchQuery, currentPage);
              } else {
                loadGenrePage(currentGenreFilter, currentPage);
              }
            }
          });
        });
      }
    }

    var currentGenreFilter = '';

    async function loadGenrePage(genre, page) {
      if (!flatSection || !grid) return;
      discoverContainer.hidden = true;
      flatSection.hidden = false;
      grid.innerHTML = renderSkeleton(1);
      var title = document.getElementById('flatSectionTitle');
      var desc = document.getElementById('flatSectionDesc');
      if (title) title.textContent = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) + ' Books' : 'All Books';
      if (desc) desc.textContent = genre ? 'Browse ' + genre + ' titles.' : 'Browse all books.';
      var q = genre || 'fiction';
      var result = await fetchOlSearch(q, page, PER_PAGE);
      totalPages = Math.max(1, Math.ceil(result.numFound / PER_PAGE));
      renderGrid(result.books, page, totalPages);
    }

    async function performSearch(query, page) {
      if (!query) return;
      if (!flatSection || !grid) return;
      discoverContainer.hidden = true;
      flatSection.hidden = false;
      grid.innerHTML = renderSkeleton(1);
      var title = document.getElementById('flatSectionTitle');
      var desc = document.getElementById('flatSectionDesc');
      if (title) title.textContent = 'Search: ' + escapeHtml(query);
      if (desc) desc.textContent = 'Search results';
      var result = await fetchOlSearch(query, page, PER_PAGE);
      totalPages = Math.max(1, Math.ceil(result.numFound / PER_PAGE));
      renderGrid(result.books, page, totalPages);
    }

    // Genre chips
    if (genreChips) {
      genreChips.innerHTML = GENRE_CHIPS.map(function (chip, idx) {
        return '<button type="button" class="books-genre-chip' + (idx === 0 ? ' active' : '') + '" data-genre="' + escapeHtml(chip.value) + '">' + escapeHtml(chip.label) + '</button>';
      }).join('');
      genreChips.hidden = false;

      genreChips.addEventListener('click', function (e) {
        var chip = e.target.closest('.books-genre-chip');
        if (!chip) return;
        genreChips.querySelectorAll('.books-genre-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        currentGenreFilter = chip.dataset.genre;
        currentPage = 1;
        currentSearchQuery = '';
        if (currentGenreFilter) {
          loadGenrePage(currentGenreFilter, 1);
        } else {
          loadDiscovery();
        }
      });
    }

    // Search
    function doSearch() {
      var query = searchInput ? searchInput.value.trim() : '';
      if (!query) return;
      currentSearchQuery = query;
      currentPage = 1;
      currentGenreFilter = '';
      performSearch(query, 1);
      genreChips.querySelectorAll('.books-genre-chip').forEach(function (c) { c.classList.remove('active'); });
      var allChip = genreChips.querySelector('.books-genre-chip[data-genre=""]');
      if (allChip) allChip.classList.add('active');
    }

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (searchInput) {
      searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') doSearch();
      });
    }

    // Initial load
    loadDiscovery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBooksPage);
  } else {
    initBooksPage();
  }

  window.Zo2ySimpleBooks = {
    init: initBooksPage
  };
})();
