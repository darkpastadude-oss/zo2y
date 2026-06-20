const fs = require('fs');

const m = fs.readFileSync('movies.html', 'utf8');
const head = m.substring(0, m.indexOf('</head>'));
const bodyTop = m.substring(m.indexOf('<body>'), m.indexOf('<main'));

const mainFile = fs.readFileSync('books.html', 'utf8');
const mainContent = mainFile.substring(mainFile.indexOf('<main'), mainFile.indexOf('</main>') + 7);

const end = `
  <script src="js/pages/books.js?v=20260620b" defer></script>
  <link rel="stylesheet" href="css/pages/legal.css?v=20260614a">
  <script src="js/legal-consent.js?v=20260614a" defer></script>
</body>
</html>
`;

let combined = head + '</head>\n' + bodyTop + mainContent + end;

// Make sure title says Books instead of Movies (since we copied movies <head>)
combined = combined.replace(/<title>Zo2y - Movies<\/title>/g, '<title>Zo2y - Books</title>');
combined = combined.replace(/<meta name="description" content="Discover trending movies and save them to your movie lists." \/>/g, '<meta name="description" content="Discover trending books and save them to your reading lists." />');

fs.writeFileSync('books.html', combined);
console.log("Rebuilt books.html with movies.html head successfully.");
