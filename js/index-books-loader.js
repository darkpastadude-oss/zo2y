(function () {
  'use strict';

  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim() || '__SUPABASE_ANON_KEY__';
  const USE_MOCK_DATA = window.ZO2Y_USE_MOCK_DATA === true || String(window.ZO2Y_USE_MOCK_DATA) === 'true';
  const FALLBACK_COVER = '/images/fallback/book.svg';

  const BOOKS_MOCK_DATA = [
    {
      id: 'book-1',
      title: 'The Great Gatsby',
      authors: 'F. Scott Fitzgerald',
      publishedDate: '1925',
      description: 'A mysterious, rich aristocrat",
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/bWYesAAQBAJ?v=3',
      publisher: 'Charles Scribner"
    },
    {
      id: 'book-2',
      title: 'To Kill a Mockingbird',
      authors: 'Harper Lee',
      publishedDate: '1960',
      description: 'The story of racial injustice and the destruction of innocence',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/j6M0DwAAQBAJ?v=3',
      publisher: 'J.B. Lippincott & Co"
    },
    {
      id: 'book-3',
      title: '1984',
      authors: 'George Orwell',
      publishedDate: '1949',
      description: 'A dystopian social science fiction novel',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/16m-DwAAQBAJ?v=5',
      publisher: 'Secker & Warburg"
    },
    {
      id: 'book-4',
      title: 'Pride and Prejudice',
      authors: 'Jane Austen',
      publishedDate: '1813',
      description: 'A classic romantic novel',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/QKCIAAAAQBAJ?v=5',
      publisher: 'T. Egerton, Whitehall"
    },
    {
      id: 'book-5',
      title: 'The Catcher in the Rye',
      authors: 'J.D. Salinger',
      publishedDate: '1951',
      description: 'The story of Holden Caulfield",
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/1bBxz37jfrIC?v=4',
      publisher: 'Little, Brown and Company"
    },
    {
      id: 'book-6',
      title: 'The Hobbit',
      authors: 'J.R.R. Tolkien',
      publishedDate: '1937',
      description: 'A fantasy novel',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/7lmkBgAAQBAJ?v=3',
      publisher: 'George Allen & Unwin"
    },
    {
      id: 'book-7',
      title: 'Don Quixote',
      authors: 'Miguel de Cervantes',
      publishedDate: '1605',
      description: 'The most famous novel in the Spanish language',
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/d2J3AwAAQBAJ?v=1',
      publisher: 'Francisco de Robles"
    },
    {
      id: 'book-8',
      title: 'Ulysses',
      authors: 'James Joyce',
      publishedDate: '1922',
      description: 'A modernist novel",
      thumbnail: 'https://books.google.com/books/publisher/content/images/frontcover/1l94AAAAQBAJ?v=5',
      publisher: 'Sylvia Beach"
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

      const { data: bookLists } = await supabase
        .from('user_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('category', 'book');

      if (!bookLists || !bookLists.length) return [];

      const listIds = bookLists.map(l => l.id);

      const { data: listItems, error } = await supabase
        .from('list_items')
        .select('external_id, added_at')
        .in('list_id', listIds)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error loading books:', error);
        return [];
      }

      if (!listItems || !listItems.length) return [];

      const externalIds = [...new Set(listItems.map(item => item.external_id))];

      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, title, authors, published_date, thumbnail, publisher')
        .in('id', externalIds);

      if (booksError) {
        console.error('Error fetching book details:', booksError);
        return [];
      }

      const bookMap = new Map();
      books?.forEach(book => {
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
          <h3 class="card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
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