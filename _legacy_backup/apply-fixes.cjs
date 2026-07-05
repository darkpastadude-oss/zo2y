const fs = require('fs');

// 1. Rewrite books-handler.js search to use OpenLibrary
let bh = fs.readFileSync('api/books-handler.js', 'utf8');
bh = bh.replace(/const gbUrl = new URL\(\`\$\{GOOGLE_BOOKS_BASE\}\/volumes\`\);[\s\S]*?const data = await response\.json\(\);[\s\S]*?\}\);/m, `const olUrl = new URL(\`https://openlibrary.org/search.json\`);
      olUrl.searchParams.set("q", q);
      olUrl.searchParams.set("limit", String(limit));
      olUrl.searchParams.set("offset", String(startIndex));

      const response = await fetch(olUrl.toString(), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(\`OpenLibrary HTTP \${response.status}\`);
      const data = await response.json();

      const books = (data.docs || []).map(work => {
        const coverId = Number(work.cover_i || 0);
        const authors = work.author_name || [];
        return {
          id: String(work.key || '').replace(/^\\/works\\//, ''),
          title: String(work.title || '').trim(),
          author: authors.length ? authors.join(", ") : "Unknown Author",
          year: Number(work.first_publish_year || 0) || null,
          cover: coverId > 0 ? \`https://covers.openlibrary.org/b/id/\${coverId}-L.jpg\` : "/images/fallback/book.svg",
          description: "",
          _source: "open-library"
        };
      });`);
fs.writeFileSync('api/books-handler.js', bh);
console.log("Updated books-handler.js search to use OpenLibrary");

// 2. Fix games.html CSS
let gh = fs.readFileSync('games.html', 'utf8');
gh = gh.replace(/<link rel="stylesheet" href="\/css\/pages\/index-landing\.css\?v=[^"]*" \/>/g, '');
if (!gh.includes('category-shared.css')) {
  gh = gh.replace(/<link rel="stylesheet" href="\/css\/pages\/index\.css\?v=[^"]*"[^>]*>/, `<link rel="stylesheet" href="/css/pages/category-shared.css?v=20260620" media="print" onload="this.media='all'">\n<noscript><link rel="stylesheet" href="/css/pages/category-shared.css?v=20260620"></noscript>`);
}
fs.writeFileSync('games.html', gh);
console.log("Fixed games.html CSS");

// 3. Remove books spotlight
let bhtml = fs.readFileSync('books.html', 'utf8');
const spotlightStart = bhtml.indexOf('<section class="media-spotlight" id="booksSpotlight" hidden>');
if (spotlightStart !== -1) {
  const nextSection = bhtml.indexOf('<section class="section">', spotlightStart);
  if (nextSection !== -1) {
    bhtml = bhtml.slice(0, spotlightStart) + bhtml.slice(nextSection);
    fs.writeFileSync('books.html', bhtml);
    console.log("Removed spotlight from books.html");
  }
}
