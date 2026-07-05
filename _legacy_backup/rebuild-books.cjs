const fs = require('fs');

let html = fs.readFileSync('books.html', 'utf8');

// Replace titles and texts
html = html.replace(/<title>Zo2y - Movies<\/title>/g, '<title>Zo2y - Books</title>');
html = html.replace(/Discover trending movies and save them to your watchlists\./g, 'Discover trending books and save them to your reading lists.');
html = html.replace(/<h1>movies<\/h1>/g, '<h1>books</h1>');
html = html.replace(/<p>Blockbusters, indie hits, thrillers, comedies, dramas, sci-fi\. Save anything to your watchlists\.<\/p>/g, '<p>Bestsellers, new releases, fantasy, sci-fi, romance, mystery, BookTok favorites. Save anything to your reading lists.</p>');
html = html.replace(/source: TMDB\. <a href="credits\.html" class="text-accent">all credits<\/a>/g, 'source: OpenLibrary. <a href="credits.html" class="text-accent">all credits</a>');

// Replace IDs and generic names
html = html.replace(/moviesSearchBtn/g, 'booksSearchBtn');
html = html.replace(/moviesFilterBtn/g, 'booksFilterBtn');
html = html.replace(/moviesFilterModal/g, 'booksFilterModal');
html = html.replace(/moviesFilterCloseBtn/g, 'booksFilterCloseBtn');
html = html.replace(/moviesGrid/g, 'booksGrid');
html = html.replace(/Search movies, actors, directors\.\.\./g, 'Search books, authors, series...');
html = html.replace(/Filter movies/g, 'Filter books');

html = html.replace(/popular movies right now/g, 'popular books right now');
html = html.replace(/Trending across theaters and streaming\./g, 'Trending fiction and non-fiction across Zo2y.');

// Replace script variables and logic
html = html.replace(/state\.movies/g, 'state.books');
html = html.replace(/loadMovies/g, 'loadBooks');
html = html.replace(/movie_list_items/g, 'book_list_items');
html = html.replace(/movie_id/g, 'book_id');
html = html.replace(/movieId/g, 'bookId');
html = html.replace(/getMovieListStatus/g, 'getBookListStatus');
html = html.replace(/movie\.html\?id=/g, 'book.html?id=');
html = html.replace(/movie\.poster/g, 'book.cover');
html = html.replace(/movie\.title/g, 'book.title');
html = html.replace(/movie\.id/g, 'book.id');
html = html.replace(/movie\.release_date/g, 'book.year');
html = html.replace(/new Date\(movie\.release_date\)\.getFullYear\(\)/g, 'book.year');
html = html.replace(/const movie =/g, 'const book =');
html = html.replace(/const coverUrl = book\.cover/g, 'const coverUrl = book.cover || \'/images/fallback/book.svg\'');
html = html.replace(/const year = book\.year \? String\(book\.year\) : 'TBD';/g, 'const year = book.year ? String(book.year) : \'\';');
html = html.replace(/const rating =/g, 'const author = book.author || \'Unknown Author\'; const rating =');
html = html.replace(/<span class="card-type"><i class="fa-solid fa-film"><\/i> Movie<\/span>/g, '<span class="card-type"><i class="fa-solid fa-book"></i> Book</span>');
html = html.replace(/<p class="card-sub">\${escapeHtml\(year\)} \u2022 \${escapeHtml\(rating\)}<\/p>/g, '<p class="card-sub">${escapeHtml(author)}</p>');
html = html.replace(/<p class="card-extra">\${escapeHtml\(genres\)}<\/p>/g, '<p class="card-extra">${escapeHtml(year)}</p>');
html = html.replace(/FALLBACK_MOVIE_POSTER/g, "'/images/fallback/book.svg'");

html = html.replace(/mediaType: 'movie'/g, "mediaType: 'book'");
html = html.replace(/fallbackRoute: 'movies\.html'/g, "fallbackRoute: 'books.html'");

// Update API fetch URL
html = html.replace(/\/api\/tmdb\?endpoint=\/movie\/popular/g, '/api/books/trending');
html = html.replace(/\/api\/tmdb\?endpoint=\/search\/movie/g, '/api/books/trending'); // Search doesn't map perfectly 1:1 in this raw replace, we will fix logic manually
html = html.replace(/const url = state\.search/g, 'const url = state.search ? `/api/books/search?q=${encodeURIComponent(state.search)}&limit=${limit}&offset=${offset}` : `/api/books/trending?genre=${encodeURIComponent(state.genre)}&limit=${limit}&offset=${offset}`; //');

// Remove TMDB image base logic
html = html.replace(/const TMDB_IMAGE_BASE = 'https:\/\/image\.tmdb\.org\/t\/p\/w500';/g, '');
html = html.replace(/\${TMDB_IMAGE_BASE}/g, '');

// Save
fs.writeFileSync('books.html', html);
console.log('books.html rebuilt from movies.html skeleton');
