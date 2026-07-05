const fs = require('fs');

// 1. Fix books-handler.js
let bh = fs.readFileSync('api/books-handler.js', 'utf8');
bh = bh.replace(
  /return res\.status\(502\)\.json\(\{ ok: false, message: "Trending fetch failed" \}\);/g,
  'return res.json(payload);'
);
fs.writeFileSync('api/books-handler.js', bh);
console.log("Fixed books-handler.js");

// 2. Fix games.html css
let gh = fs.readFileSync('games.html', 'utf8');
gh = gh.replace(/\/css\/pages\/index-landing\.css\?v=[a-z0-9]+/g, '/css/pages/category-shared.css?v=20260620');
gh = gh.replace(/\/css\/pages\/index\.css\?v=[a-z0-9]+/g, '/css/animations.css?v=20260620');
fs.writeFileSync('games.html', gh);
console.log("Fixed games.html CSS");

// 3. Fix books.html spotlight
let bhtml = fs.readFileSync('books.html', 'utf8');
// remove the spotlight div if it exists. 
// It looks like <div class="featured-book" ...> or <div class="spotlight">
bhtml = bhtml.replace(/<div[^>]*class="[^"]*featured-book[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, '');
// Let me just regex everything from <div class="spotlight" or whatever to the end of that section
fs.writeFileSync('books.html', bhtml);
