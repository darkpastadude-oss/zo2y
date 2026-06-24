/*
 * Zo2y Books Home Directory - Professional directory style loading
 * Fetches books from Google Books API and displays them in a professional directory format
 * Similar to Goodreads with multiple sections and detailed book information
 */
(function () {
  'use strict';

  const FALLBACK_COVER = '/images/fallback/book.svg';

  function proxyCover(url) {
    var s = String(url || '').trim();
    if (!s || s === FALLBACK_COVER) return FALLBACK_COVER;
    if (/covers\.openlibrary\.org/i.test(s)) {
      return '/api/books/cover?url=' + encodeURIComponent(s);
    }
    if (/books\.google(?:usercontent)?\.com/i.test(s)) {
      return '/api/books/cover?url=' + encodeURIComponent(s);
    }
    if (/\/images\/fallback\//i.test(s)) return FALLBACK_COVER;
    return s;
  }
  const HOME_BOOKS_LIMIT = 24;
  const HOME_SECTIONS = [
    {
      id: 'trending-fiction',
      label: 'Trending Fiction',
      desc: 'The most-read novels right now across BookTok and mainstream readers.',
      query: 'inauthor:colleen hoover OR inauthor:emily henry OR inauthor:taylor jenkins reid fiction',
      limit: 12
    },
    {
      id: 'booktok-trending',
      label: 'BookTok Trending',
      desc: 'The titles everyone is reading and recommending on BookTok.',
      query: 'inauthor:rebecca yarros OR inauthor:freida mcfadden OR inauthor:ali hazelwood romantasy romance',
      limit: 12
    },
    {
      id: 'popular-nonfiction',
      label: 'Popular Non-Fiction',
      desc: 'Best-selling self-help, finance, and memoir titles.',
      query: 'inauthor:james clear OR inauthor:morgan housel OR inauthor:david goggins nonfiction',
      limit: 12
    },
    {
      id: 'new-releases',
      label: 'New Releases',
      desc: 'The latest English-language fiction and non-fiction.',
      query: 'new release popular contemporary fiction 2024 2025',
      orderBy: 'newest',
      limit: 12
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  async function fetchServerBooks(section, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const params = new URLSearchParams({
      q: section.query || `subject:${section.subject || 'fiction'}`,
      limit: section.limit || 16,
      language: 'en'
    });
    if (section.orderBy === 'newest') params.set('orderBy', 'newest');
    try {
      const res = await fetch('/api/books/search?' + params.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.books) ? json.books : [];
    } catch (err) {
      clearTimeout(timeoutId);
    }
    // Fallback to trending (OpenLibrary) when search fails
    try {
      const genre = (section.query || 'fiction').split(' ')[0].toLowerCase();
      const trendingParams = new URLSearchParams({ genre, limit: section.limit || 16 });
      const res2 = await fetch('/api/books/trending?' + trendingParams.toString());
      if (!res2.ok) return [];
      const json2 = await res2.json();
      const books = Array.isArray(json2.books) ? json2.books : [];
      return books.map(b => ({
        title: b.title,
        author_name: b.author ? [b.author] : [],
        coverImage: b.cover || '',
        id: b.id,
        description: b.description || '',
        rating: 0,
        ratingCount: 0,
        subject: [],
        pageCount: 0,
        publisher: '',
        publishedDate: b.year ? String(b.year) : ''
      }));
    } catch (_err2) {
      return [];
    }
  }

  function serverBookToHomeItem(book) {
    if (!book) return null;
    const title = String(book.title || '').trim();
    if (!title) return null;
    const authors = Array.isArray(book.author_name) ? book.author_name.join(', ') : 'Unknown Author';
    const cover = proxyCover(String(book.coverImage || book.cover || '').trim()) || FALLBACK_COVER;
    const id = String(book.id || '').trim();
    return {
      title, authors,
      cover,
      id: id || title.toLowerCase().replace(/\s+/g, '-'),
      description: String(book.description || '').trim(),
      pageCount: Number(book.pageCount || 0) || null,
      categories: Array.isArray(book.subject) ? book.subject.slice(0, 3) : [],
      averageRating: Number(book.rating || 0) || null,
      ratingsCount: Number(book.ratingCount || 0) || null
    };
  }

  const FALLBACK_BOOKS = [
    {
      id: "gb_atomic_habits", title: "Atomic Habits", authors: "James Clear",
      cover: "/images/fallback/book.svg", description: "Tiny changes, remarkable results. The definitive guide to building good habits.",
      averageRating: 4.8, categories: ["Self-Help", "Productivity", "Non-Fiction"]
    },
    {
      id: "gb_fourth_wing", title: "Fourth Wing", authors: "Rebecca Yarros",
      cover: "/images/fallback/book.svg", description: "A dragon rider fantasy epic set in a war college.",
      averageRating: 4.7, categories: ["Fantasy", "Romance", "BookTok"]
    },
    {
      id: "gb_seven_husbands", title: "The Seven Husbands of Evelyn Hugo", authors: "Taylor Jenkins Reid",
      cover: "/images/fallback/book.svg", description: "A reclusive Hollywood icon finally tells her scandalous story.",
      averageRating: 4.7, categories: ["Historical Fiction", "Romance", "BookTok"]
    },
    {
      id: "gb_silent_patient", title: "The Silent Patient", authors: "Alex Michaelides",
      cover: "/images/fallback/book.svg", description: "A famous painter shoots her husband and then never speaks another word.",
      averageRating: 4.5, categories: ["Thriller", "Mystery", "Fiction"]
    },
    {
      id: "gb_ittw", title: "It Ends with Us", authors: "Colleen Hoover",
      cover: "/images/fallback/book.svg", description: "A brave and heartbreaking story of love, loss, and strength.",
      averageRating: 4.5, categories: ["Romance", "Fiction", "BookTok"]
    },
    {
      id: "gb_cant_hurt_me", title: "Can't Hurt Me", authors: "David Goggins",
      cover: "/images/fallback/book.svg", description: "Master your mind and defy the odds.",
      averageRating: 4.8, categories: ["Self-Help", "Memoir", "Non-Fiction"]
    },
    {
      id: "gb_psychology_money", title: "The Psychology of Money", authors: "Morgan Housel",
      cover: "/images/fallback/book.svg", description: "Timeless lessons on wealth, greed, and happiness.",
      averageRating: 4.7, categories: ["Finance", "Non-Fiction", "Self-Help"]
    },
    {
      id: "gb_surrounded_idiots", title: "Surrounded by Idiots", authors: "Thomas Erikson",
      cover: "/images/fallback/book.svg", description: "The four types of human behaviour and how to effectively communicate with each in your daily life.",
      averageRating: 4.3, categories: ["Self-Help", "Psychology", "Non-Fiction"]
    },
    {
      id: "gb_iron_flame", title: "Iron Flame", authors: "Rebecca Yarros",
      cover: "/images/fallback/book.svg", description: "The sequel to Fourth Wing — the war is far from over.",
      averageRating: 4.6, categories: ["Fantasy", "Romance", "BookTok"]
    },
    {
      id: "gb_housemaid", title: "The Housemaid", authors: "Freida McFadden",
      cover: "/images/fallback/book.svg", description: "She's the perfect housemaid... until you make her angry.",
      averageRating: 4.4, categories: ["Thriller", "Mystery", "Fiction"]
    },
    {
      id: "gb_verity", title: "Verity", authors: "Colleen Hoover",
      cover: "/images/fallback/book.svg", description: "A darkly twisted psychological thriller from the queen of BookTok.",
      averageRating: 4.5, categories: ["Thriller", "Romance", "BookTok"]
    },
    {
      id: "gb_midnight_library", title: "The Midnight Library", authors: "Matt Haig",
      cover: "/images/fallback/book.svg", description: "Between life and death there is a library with infinite books of lives unlived.",
      averageRating: 4.4, categories: ["Fiction", "Fantasy", "Self-Help"]
    }
  ];

  async function fetchHomeBooksSection(section) {
    const books = await fetchServerBooks(section);
    if (books && books.length > 0) {
      return books.map(serverBookToHomeItem).filter(Boolean);
    }
    // Return fallback books if API fails
    return FALLBACK_BOOKS.map(b => ({ ...b })).sort(() => 0.5 - Math.random());
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