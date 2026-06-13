/*
 * Zo2y Books Home Directory - Professional directory style loading
 * Fetches books from Google Books API and displays them in a professional directory format
 * Similar to Goodreads with multiple sections and detailed book information
 */
(function () {
  'use strict';

  const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
  const FALLBACK_COVER = '/images/fallback/book.svg';
  const HOME_BOOKS_LIMIT = 24;
  const HOME_SECTIONS = [
    {
      id: 'bestsellers',
      label: 'Bestsellers',
      desc: 'Current top-selling titles across all genres.',
      query: 'bestseller fiction novel',
      limit: 12
    },
    {
      id: 'new-releases',
      label: 'New Releases',
      desc: 'The latest English-language fiction and non-fiction.',
      query: 'new release fiction novel 2026',
      orderBy: 'newest',
      limit: 12
    },
    {
      id: 'editor-picks',
      label: "Editor's Picks",
      desc: 'Hand-selected favorites from our editorial team.',
      query: 'acclaimed literary fiction contemporary',
      limit: 12
    },
    {
      id: 'booktok-trending',
      label: 'BookTok Trending',
      desc: 'The titles everyone is reading on BookTok.',
      query: 'booktok viral romanticasy contemporary',
      limit: 12
    }
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
      description: description.substring(0, 300),
      pageCount,
      categories,
      language,
      averageRating,
      ratingsCount,
      cover
    };
  }

  async function fetchGoogleBooks(params, timeout = 8000) {
    const url = new URL(GOOGLE_BOOKS_API);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Google Books API ${res.status}`);
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Google Books API error:', err);
      return { items: [] };
    }
  }

  async function fetchHomeBooksSection(section) {
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

  function renderBookCard(book) {
    if (!book) return '';
    const rating = book.averageRating > 0 ? 
      `<div class="directory-book-rating"><i class="fa-solid fa-star"></i> ${book.averageRating.toFixed(1)}</div>` : '';
    
    return `
      <article class="directory-book-card" data-id="${escapeHtml(book.id)}">
        <a href="book.html?id=${encodeURIComponent(book.id)}" class="directory-book-media">
          <img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.src='${FALLBACK_COVER}'">
        </a>
        <div class="directory-book-meta">
          <h3 class="directory-book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <div class="directory-book-authors">${escapeHtml(book.authors)}</div>
          <div class="directory-book-details">
            <span class="directory-book-publisher">${escapeHtml(book.publisher || 'Publisher unknown')}</span>
            <span class="directory-book-date">${escapeHtml(book.publishedDate || 'N/A')}</span>
            <span class="directory-book-pages">${book.pageCount ? `${book.pageCount} pages` : ''}</span>
          </div>
          ${rating}
          <div class="directory-book-categories">
            ${book.categories && book.categories.slice(0, 3).map(cat => `<span class="directory-book-category">${escapeHtml(cat)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    if (!section || !section.books || !section.books.length) return '';
    const cards = section.books.map(renderBookCard).join('');
    return `
      <section class="directory-section" data-section="${escapeHtml(section.id)}">
        <div class="directory-section-header">
          <div class="directory-section-title">
            <h2>${escapeHtml(section.label)}</h2>
            <p>${escapeHtml(section.desc)}</p>
          </div>
          <a href="books.html" class="directory-section-link">View all</a>
        </div>
        <div class="directory-book-grid">
          ${cards}
        </div>
      </section>
    `;
  }

  function renderSkeleton(count = 2) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <section class="directory-section">
          <div class="directory-section-header">
            <div class="directory-section-title">
              <div class="skeleton-line skeleton-line-lg skeleton-shimmer"></div>
              <div class="skeleton-line skeleton-line-md skeleton-shimmer"></div>
            </div>
          </div>
          <div class="directory-book-grid">
            ${Array(8).fill(0).map(() => `
              <article class="directory-book-card skeleton-card">
                <div class="directory-book-media skeleton-shimmer"></div>
                <div class="directory-book-meta">
                  <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
                  <span class="skeleton-line skeleton-line-md skeleton-shimmer"></span>
                  <div class="skeleton-line-group">
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                    <span class="skeleton-line-xs skeleton-shimmer"></span>
                  </div>
                  <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }
    return html;
  }

  async function initBooksDirectory() {
    const container = document.getElementById('booksRail');
    if (!container) return;

    // Show skeleton
    container.innerHTML = renderSkeleton(HOME_SECTIONS.length);

    try {
      const sections = await Promise.all(
        HOME_SECTIONS.map(section => fetchHomeBooksSection(section))
      );
      
      // Render sections
      const sectionsHtml = sections.map(renderSection).join('');
      container.innerHTML = sectionsHtml;
      
      // Prime images
      setTimeout(() => {
        if (window.IntersectionObserver) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-book-src');
                if (src) {
                  img.src = src;
                  observer.unobserve(img);
                }
              }
            });
          }, { rootMargin: '100px 0px' });

          document.querySelectorAll('.directory-book-media img').forEach(img => {
            const src = img.getAttribute('src');
            if (src.includes('/images/fallback/book.svg')) {
              const dataSrc = img.getAttribute('data-book-src') || src;
              img.setAttribute('data-book-src', dataSrc);
              img.src = '/images/placeholder-book.svg';
              observer.observe(img);
            }
          });
        }
      }, 100);

    } catch (err) {
      console.error('Failed to load books directory:', err);
      container.innerHTML = `
        <div class="directory-empty-state">
          <div class="directory-empty-icon">📚</div>
          <h3>Books feed unavailable</h3>
          <p>Please try again shortly.</p>
        </div>
      `;
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBooksDirectory);
    } else {
      initBooksDirectory();
    }
  }

  init();

  window.Zo2yBooksDirectory = {
    init: initBooksDirectory,
    fetchSections: () => Promise.all(HOME_SECTIONS.map(fetchHomeBooksSection))
  };
})();