(function () {
  'use strict';

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim() || '__SUPABASE_ANON_KEY__';
  const USE_MOCK_DATA = window.ZO2Y_USE_MOCK_DATA === true || String(window.ZO2Y_USE_MOCK_DATA) === 'true';
  const FALLBACK_COVER = '/images/fallback/book.svg';

  const BOOKS_MOCK_DATA = [
    {
      id: 'gb_atomic_habits',
      title: 'Atomic Habits',
      authors: 'James Clear',
      publishedDate: '2018',
      description: 'Tiny changes, remarkable results. The definitive guide to building good habits.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/XfFvDwAAQBAJ?fife=w400-h600',
      publisher: 'Avery'
    },
    {
      id: 'gb_fourth_wing',
      title: 'Fourth Wing',
      authors: 'Rebecca Yarros',
      publishedDate: '2023',
      description: 'A dragon rider fantasy epic set in a war college.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/PN2OEAAAQBAJ?fife=w400-h600',
      publisher: 'Red Tower Books'
    },
    {
      id: 'gb_seven_husbands',
      title: 'The Seven Husbands of Evelyn Hugo',
      authors: 'Taylor Jenkins Reid',
      publishedDate: '2017',
      description: 'A reclusive Hollywood icon finally tells her scandalous story.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/VqFrDwAAQBAJ?fife=w400-h600',
      publisher: 'Atria Books'
    },
    {
      id: 'gb_silent_patient',
      title: 'The Silent Patient',
      authors: 'Alex Michaelides',
      publishedDate: '2019',
      description: 'A famous painter shoots her husband and then never speaks another word.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/S5F3DwAAQBAJ?fife=w400-h600',
      publisher: 'Celadon Books'
    },
    {
      id: 'gb_ittw',
      title: 'It Ends with Us',
      authors: 'Colleen Hoover',
      publishedDate: '2016',
      description: 'A brave and heartbreaking story of love, loss, and strength.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/Ry4BBAAAQBAJ?fife=w400-h600',
      publisher: 'Atria Books'
    },
    {
      id: 'gb_cant_hurt_me',
      title: "Can't Hurt Me",
      authors: 'David Goggins',
      publishedDate: '2018',
      description: 'Master your mind and defy the odds.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/VZl3DwAAQBAJ?fife=w400-h600',
      publisher: 'Lioncrest Publishing'
    },
    {
      id: 'gb_psychology_money',
      title: 'The Psychology of Money',
      authors: 'Morgan Housel',
      publishedDate: '2020',
      description: 'Timeless lessons on wealth, greed, and happiness.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/TnrrDwAAQBAJ?fife=w400-h600',
      publisher: 'Harriman House'
    },
    {
      id: 'gb_surrounded_idiots',
      title: 'Surrounded by Idiots',
      authors: 'Thomas Erikson',
      publishedDate: '2019',
      description: 'The four types of human behaviour and how to effectively communicate with each.',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/aJGSDwAAQBAJ?fife=w400-h600',
      publisher: 'St. Martin\'s Essentials'
    }
  ];

  async function fetchBookDetails(bookId, signal) {
    if (USE_MOCK_DATA) {
      return BOOKS_MOCK_DATA.find(b => b.id === bookId) || null;
    }

    try {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase
        .from('books')
        .select('id, title, authors, published_date, thumbnail, publisher')
        .eq('id', bookId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching book details:', error);
      return null;
    }
  }

  async function loadBooks(signal) {
    if (USE_MOCK_DATA) {
      return BOOKS_MOCK_DATA;
    }

    try {
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      const userId = window.ZO2Y_USER_ID || window.currentUser?.id;
      if (!userId) {
        console.log('No user ID found, skipping book loading');
        return [];
      }

      const { data, error } = await supabase
        .from('book_list_items')
        .select('*, books(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading books:', error);
        return [];
      }

      const bookMap = new Map();
      data.forEach(item => {
        if (item.books) {
          const book = item.books;
          const bookId = book.id || `book-${Math.random().toString(36).substr(2, 9)}`;

          const existing = bookMap.get(bookId);
          if (!existing) {
            bookMap.set(bookId, {
              id: bookId,
              title: String(book.title || '').trim() || 'Untitled',
              authors: String(book.authors || '').trim() || 'Unknown Author',
              publishedDate: String(book.published_date || '').trim() || '',
              description: '',
              thumbnail: book.thumbnail || '',
              publisher: String(book.publisher || '').trim() || ''
            });
          }
        }
      });

      const items = Array.from(bookMap.values());
      return items.slice(0, 8);
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  function renderBookCard(book) {
    if (!book) return '';

    const title = String(book.title || '').trim();
    const authors = String(book.authors || '').trim();
    const date = String(book.publishedDate || book.published_date || '').trim();
    const thumb = String(book.thumbnail || book.cover || '').trim();
    const fallback = FALLBACK_COVER;

    const cover = thumb && !thumb.includes('/images/fallback/') ? thumb : fallback;

    return `
      <article class="card book-card" data-id="${escapeHtml(book.id || '')}">
        <a href="book.html?id=${encodeURIComponent(book.id || '')}" class="card-media">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.src='${escapeHtml(fallback)}'" fetchpriority="high">
        </a>
        <div class="card-meta">
          <h3 class="card-name" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
          <div class="card-sub">${escapeHtml(authors)}</div>
          <div class="card-extra">${date ? `${new Date(date).getFullYear()}` : ''}</div>
        </div>
      </article>
    `;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return map[char] || char;
    });
  }

  function createSkeletonCard() {
    return `
      <article class="card book-skeleton-card">
        <div class="card-media skeleton-shimmer"></div>
        <div class="card-meta">
          <span class="skeleton-line skeleton-line-sm skeleton-shimmer"></span>
          <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
          <span class="skeleton-line skeleton-line-xs skeleton-shimmer"></span>
        </div>
      </article>
    `;
  }

  async function initBooksRail() {
    const rail = document.getElementById('booksRail');
    if (!rail) return;

    const grid = rail.querySelector('.grid') || document.createElement('div');
    grid.className = 'grid';

    if (!rail.querySelector('.grid')) {
      rail.innerHTML = '<div class="rail-title"><span><i class="fa-solid fa-book"></i> Books</span><a href="books.html">View all</a></div>';
      rail.appendChild(grid);
    }

    rail.innerHTML = '<div class="rail-title"><span><i class="fa-solid fa-book"></i> Books</span><a href="books.html">View all</a></div>';
    grid.innerHTML = Array(8).fill(0).map(createSkeletonCard).join('');

    try {
      const books = await loadBooks();

      if (!books || !books.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>No books yet</h3>
            <p>Save books to see them here</p>
          </div>
        `;
        return;
      }

      const cards = books.map(renderBookCard).join('');
      grid.innerHTML = cards;
    } catch (error) {
      console.error('Error loading books rail:', error);
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Error loading books</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBooksRail);
    } else {
      initBooksRail();
    }
  }

  init();
})();