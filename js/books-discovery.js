/*
 * Zo2y Books Discovery - Goodreads-style discovery
 * Sections: Popular, Trending, New Releases, Genres, Awards, BookTok, Editor's Picks
 */
(function () {
  'use strict';

  const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
  const FALLBACK_COVER = '/images/fallback/book.svg';
  const DISCOVERY_SECTIONS = [
    { id: 'popular', label: 'popular right now', desc: 'The most-read books across Zo2y this week.', query: 'bestseller fiction novel', limit: 20 },
    { id: 'trending', label: 'trending this week', desc: 'What everyone is talking about.', query: 'trending fiction novel 2026', limit: 20 },
    { id: 'new', label: 'new releases', desc: 'The latest English-language fiction.', query: 'new release fiction novel 2026', orderBy: 'newest', limit: 20 },
    { id: 'fantasy', label: 'fantasy essentials', desc: 'From Tolkien to Sanderson and beyond.', subject: 'fantasy', limit: 16 },
    { id: 'scifi', label: 'sci-fi essentials', desc: 'The science fiction every reader should know.', subject: 'science fiction', limit: 16 },
    { id: 'mystery', label: 'mystery essentials', desc: 'Compelling mysteries and detective stories.', subject: 'mystery', limit: 16 },
    { id: 'thriller', label: 'thriller favorites', desc: 'Gripping thrillers that will keep you up all night.', subject: 'thriller', limit: 16 },
    { id: 'romance', label: 'romance favorites', desc: 'Beloved romance from contemporary to classic.', subject: 'romance', limit: 16 },
    { id: 'booktok', label: 'booktok trending', desc: 'The titles everyone is reading right now.', query: 'booktok viral romantasy contemporary', limit: 16 },
    { id: 'awards', label: 'award winners', desc: 'Pulitzer, Booker, Hugo, Nebula, and more.', query: 'pulitzer booker winner novel', limit: 16 },
    { id: 'classics', label: 'modern classics', desc: 'The titles that defined a generation.', query: 'modern classic novel 20th century', limit: 16 },
    { id: 'editors', label: "editor's picks", desc: 'Hand-picked favorites from our editorial team.', query: 'acclaimed literary fiction contemporary', limit: 16 }
  ];

  const GENRE_CHIPS = [
    { id: '', value: '', label: 'All' },
    { id: 'fiction', value: 'fiction', label: 'Fiction' },
    { id: 'fantasy', value: 'fantasy', label: 'Fantasy' },
    { id: 'science-fiction', value: 'science fiction', label: 'Sci-Fi' },
    { id: 'mystery', value: 'mystery', label: 'Mystery' },
    { id: 'thriller', value: 'thriller', label: 'Thriller' },
    { id: 'romance', value: 'romance', label: 'Romance' },
    { id: 'horror', value: 'horror', label: 'Horror' },
    { id: 'young-adult', value: 'young adult', label: 'YA' },
    { id: 'biography', value: 'biography', label: 'Biography' },
    { id: 'history', value: 'history', label: 'History' },
    { id: 'self-help', value: 'self-help', label: 'Self-Help' },
    { id: 'business', value: 'business', label: 'Business' }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    if (!url) return '';
    return String(url).replace(/^http:/i, 'https:');
  }

  function getCover(book) {
    const imageLinks = book.volumeInfo?.imageLinks;
    if (imageLinks?.thumbnail) return toHttps(imageLinks.thumbnail);
    if (imageLinks?.smallThumbnail) return toHttps(imageLinks.smallThumbnail);
    return FALLBACK_COVER;
  }

  function normalizeBook(book) {
    const info = book.volumeInfo || {};
    const title = String(info.title || 'Untitled').trim();
    const authors = Array.isArray(info.authors) ? info.authors.join(', ') : 'Unknown Author';
    const publisher = String(info.publisher || '').trim();
    const publishedDate = String(info.publishedDate || '').trim();
    const description = String(info.description || '').trim();
    const pageCount = Number(info.pageCount || 0);
    const categories = Array.isArray(info.categories) ? info.categories : [];
    const language = String(info.language || 'en').toLowerCase();
    const averageRating = Number(info.averageRating || 0);
    const ratingsCount = Number(info.ratingsCount || 0);
    const cover = getCover(book);
    const id = String(book.id || '').trim();

    if (language !== 'en' && language !== 'en-us' && language !== 'en-gb') return null;
    if (!title) return null;

    return {
      id,
      title,
      authors,
      publisher,
      publishedDate,
      description: description.substring(0, 500),
      pageCount,
      categories,
      language,
      averageRating,
      ratingsCount,
      cover
    };
  }

  function fetchGoogleBooks(params, timeout = 8000) {
    const url = new URL(GOOGLE_BOOKS_API);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url.toString(), { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Google Books API ${res.status}`);
        return res.json();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('Google Books API error:', err);
        return { items: [] };
      });
  }

  async function fetchDiscoverySection(section) {
    const params = {
      q: section.query || `subject:${section.subject || 'fiction'}`,
      maxResults: section.limit || 16,
      langRestrict: 'en',
      printType: 'books'
    };
    if (section.orderBy === 'newest') {
      params.orderBy = 'newest';
    }

    const data = await fetchGoogleBooks(params);
    const books = (data.items || [])
      .map(normalizeBook)
      .filter(Boolean);

    return {
      id: section.id,
      label: section.label,
      desc: section.desc,
      books
    };
  }

  async function searchBooks(query, opts = {}) {
    const params = {
      q: query,
      maxResults: opts.limit || 20,
      langRestrict: 'en',
      printType: 'books',
      startIndex: ((opts.page || 1) - 1) * (opts.limit || 20)
    };
    if (opts.subject) params.q += `+subject:${opts.subject}`;
    if (opts.orderBy === 'newest') params.orderBy = 'newest';

    const data = await fetchGoogleBooks(params);
    const books = (data.items || [])
      .map(normalizeBook)
      .filter(Boolean);

    return {
      books,
      totalItems: data.totalItems || books.length
    };
  }

  function renderBookCard(book) {
    if (!book) return '';
    const rating = book.averageRating > 0 ? 
      `<div class="card-rating"><i class="fas fa-star"></i> ${book.averageRating.toFixed(1)}</div>` : '';
    
    return `
      <article class="card" data-id="${escapeHtml(book.id)}">
        <a href="book.html?id=${encodeURIComponent(book.id)}" class="card-media">
          <img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.src='${FALLBACK_COVER}'">
        </a>
        <div class="card-meta">
          <h3 class="card-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <div class="card-sub">${escapeHtml(book.authors)}</div>
          ${rating}
          <div class="card-extra">${escapeHtml(book.publishedDate || '')}</div>
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    if (!section || !section.books || !section.books.length) return '';
    const cards = section.books.map(renderBookCard).join('');
    return `
      <section class="section book-section" data-section="${escapeHtml(section.id)}">
        <div class="section-head">
          <div class="section-head-text">
            <h2>${escapeHtml(section.label)}</h2>
            <p>${escapeHtml(section.desc)}</p>
          </div>
        </div>
        <div class="grid book-grid">${cards}</div>
      </section>
    `;
  }

  function renderSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <section class="section book-section">
          <div class="section-head">
            <div class="section-head-text">
              <div class="skeleton-line skeleton-line-lg skeleton-shimmer"></div>
              <div class="skeleton-line skeleton-line-md skeleton-shimmer"></div>
            </div>
          </div>
          <div class="grid book-grid">
            ${Array(6).fill(0).map(() => `
              <article class="card book-skeleton-card">
                <div class="card-media skeleton-shimmer"></div>
                <div class="card-meta">
                  <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
                  <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
                  <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }
    return html;
  }

  async function initBooksPage() {
    const discoverContainer = document.getElementById('booksDiscover');
    const flatSection = document.getElementById('booksFlatSection');
    const grid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('q');
    const searchBtn = document.getElementById('booksSearchBtn');
    const genreChips = document.getElementById('booksGenreChips');

    if (!discoverContainer) return;

    // Show skeleton
    discoverContainer.innerHTML = renderSkeleton(DISCOVERY_SECTIONS.length);

    // Build genre chips
    if (genreChips) {
      genreChips.innerHTML = GENRE_CHIPS.map((chip, idx) => 
        `<button type="button" class="books-genre-chip${idx === 0 ? ' active' : ''}" data-genre="${escapeHtml(chip.value)}">${escapeHtml(chip.label)}</button>`
      ).join('');
      genreChips.hidden = false;

      genreChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.books-genre-chip');
        if (!chip) return;
        genreChips.querySelectorAll('.books-genre-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const genre = chip.dataset.genre;
        if (genre) {
          loadGenreSection(genre);
        } else {
          loadDiscovery();
        }
      });
    }

    // Load discovery sections
    async function loadDiscovery() {
      if (!discoverContainer) return;
      discoverContainer.innerHTML = renderSkeleton(DISCOVERY_SECTIONS.length);
      discoverContainer.hidden = false;
      if (flatSection) flatSection.hidden = true;

      try {
        const sections = await Promise.all(
          DISCOVERY_SECTIONS.map(section => fetchDiscoverySection(section))
        );
        discoverContainer.innerHTML = sections.map(renderSection).join('');
      } catch (err) {
        console.error('Failed to load discovery:', err);
        discoverContainer.innerHTML = '<div class="book-empty-state"><i class="fas fa-triangle-exclamation"></i><h3>Books feed unavailable</h3><p>Please retry shortly.</p></div>';
      }
    }

    // Load genre section
    async function loadGenreSection(genre) {
      if (!discoverContainer || !flatSection || !grid) return;
      discoverContainer.hidden = true;
      flatSection.hidden = false;
      grid.innerHTML = Array(18).fill(0).map(() => `
        <article class="card book-skeleton-card">
          <div class="card-media skeleton-shimmer"></div>
          <div class="card-meta">
            <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
            <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
            <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
          </div>
        </article>
      `).join('');

      const title = document.getElementById('flatSectionTitle');
      const desc = document.getElementById('flatSectionDesc');
      if (title) title.textContent = genre ? `${genre.charAt(0).toUpperCase() + genre.slice(1)} Books` : 'All Books';
      if (desc) desc.textContent = genre ? `Browse ${genre} titles.` : 'Browse all books.';

      try {
        const result = await searchBooks(genre || 'fiction', { limit: 36 });
        grid.innerHTML = result.books.map(renderBookCard).join('');
      } catch (err) {
        console.error('Failed to load genre section:', err);
        grid.innerHTML = '<div class="book-empty-state"><i class="fas fa-book-open"></i><h3>No books found</h3><p>Please try again.</p></div>';
      }
    }

    // Search
    async function performSearch() {
      const query = searchInput?.value?.trim();
      if (!query) return;

      if (!discoverContainer || !flatSection || !grid) return;
      discoverContainer.hidden = true;
      flatSection.hidden = false;
      grid.innerHTML = Array(18).fill(0).map(() => `
        <article class="card book-skeleton-card">
          <div class="card-media skeleton-shimmer"></div>
          <div class="card-meta">
            <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
            <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
            <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
          </div>
        </article>
      `).join('');

      const title = document.getElementById('flatSectionTitle');
      const desc = document.getElementById('flatSectionDesc');
      if (title) title.textContent = `Search: ${escapeHtml(query)}`;
      if (desc) desc.textContent = 'Search results';

      try {
        const result = await searchBooks(query, { limit: 36 });
        grid.innerHTML = result.books.map(renderBookCard).join('');
      } catch (err) {
        console.error('Failed to search:', err);
        grid.innerHTML = '<div class="book-empty-state"><i class="fas fa-book-open"></i><h3>No books found</h3><p>Please try a different search.</p></div>';
      }
    }

    // Event listeners
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
      });
    }

    // Initial load
    loadDiscovery();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBooksPage);
  } else {
    initBooksPage();
  }

  // Expose for testing
  window.Zo2ySimpleBooks = {
    init: initBooksPage,
    search: searchBooks,
    fetchDiscovery: () => Promise.all(DISCOVERY_SECTIONS.map(fetchDiscoverySection))
  };
})();