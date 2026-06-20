const fs = require('fs');

const moviesHtml = fs.readFileSync('movies.html', 'utf8');

// The goal is to replace "movies" -> "books", "TMDB" -> "Books API", etc.
// But we need to be careful not to break the global navigation links!
let booksHtml = moviesHtml;

// First, fix the head title and description
booksHtml = booksHtml.replace('<title>Zo2y - Movies</title>', '<title>Zo2y - Books</title>');
booksHtml = booksHtml.replace('Discover trending movies and save them to your movie lists.', 'Discover trending books across every genre and save them to your lists.');

// Fix the hero section
booksHtml = booksHtml.replace('<h1>movies</h1>', '<h1>books</h1>');
booksHtml = booksHtml.replace('Discover trending movies from around the world and save them to your movie lists.', 'Bestsellers, new releases, fantasy, sci-fi, romance, mystery, BookTok favorites. Save anything to your reading lists.');
booksHtml = booksHtml.replace('source: TMDB.', 'source: Google Books & OpenLibrary.');

// Fix the IDs and text inside controls
booksHtml = booksHtml.replace('id="moviesSearchBtn"', 'id="booksSearchBtn"');
booksHtml = booksHtml.replace('aria-label="Search movies"', 'aria-label="Search books"');
booksHtml = booksHtml.replace('id="moviesFilterBtn"', 'id="booksFilterBtn"');
booksHtml = booksHtml.replace('aria-label="Open movie filters"', 'aria-label="Open book filters"');
booksHtml = booksHtml.replace('id="moviesFilterModal"', 'id="booksFilterModal"');
booksHtml = booksHtml.replace('Filter movies', 'Filter books');
booksHtml = booksHtml.replace('id="moviesFilterCloseBtn"', 'id="booksFilterCloseBtn"');
booksHtml = booksHtml.replace('aria-label="Close movie filters"', 'aria-label="Close book filters"');
booksHtml = booksHtml.replace('Search movies, genres, years...', 'Search books, authors, series...');

// Fix spotlight section
booksHtml = booksHtml.replace(/moviesSpotlight/g, 'booksSpotlight');
booksHtml = booksHtml.replace('Featured Movie', 'Featured Book');
booksHtml = booksHtml.replace('Movie Title', 'Book Title');
booksHtml = booksHtml.replace('Year | Rating', 'Author | Year');
booksHtml = booksHtml.replace('Movie description goes here.', 'Book description goes here.');
booksHtml = booksHtml.replace('Movie poster', 'Book cover');
booksHtml = booksHtml.replace('fallback/movie.svg', 'fallback/book.svg');

// Fix grid section
booksHtml = booksHtml.replace('popular movies right now', 'popular books right now');
booksHtml = booksHtml.replace('Trending movies across all genres.', 'Trending fiction and non-fiction across Zo2y.');
booksHtml = booksHtml.replace(/moviesGrid/g, 'booksGrid');

// Now, the tricky part is the huge inline script!
// I am going to completely replace the inline script block from movies.html with the one from js/pages/books.js
// but I need to include the Supabase init and auth logic from movies.html.

const booksJs = fs.readFileSync('js/pages/books.js', 'utf8');

// In movies.html, the auth logic is scattered. Let's just use the JSDOM or regex to replace the <script> body.
// Wait, actually, the user wants the Auth logic of movies.html. 
// Movies auth logic uses `user_movie_lists` and `ensureMoviesSupabase()`. Books would use `user_book_lists`.

fs.writeFileSync('books-generator.js', '// placeholder');
