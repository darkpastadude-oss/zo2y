// replace-favicon.cjs
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const faviconHref = '../images/logo.png'; // Updated path for restaurant pages
const faviconTag = `<link rel="icon" type="image/png" href="${faviconHref}">`;

const headCloseRe = /<\/head\s*>/i;
const hasFaviconRe = /<link[^>]+rel=(?:'|")icon(?:'|")[^>]*>/gi;

// recursively find .html files
function walkDir(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walkDir(full));
    else if (entry.isFile() && full.endsWith('.html')) result.push(full);
  }
  return result;
}

const files = walkDir(ROOT);
if (!files.length) {
  console.log('❌ no .html files found.');
  process.exit(0);
}

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // remove old favicon lines if any
  html = html.replace(hasFaviconRe, '');

  // Determine correct favicon path based on file location
  let finalFaviconTag;
  if (file.includes('cards/') || file.includes('restaurants/')) {
    // Restaurant pages in subfolders need to go up one level
    finalFaviconTag = `<link rel="icon" type="image/png" href="../images/logo.png">`;
  } else {
    // Root level pages (index.html, restaurants.html, etc.)
    finalFaviconTag = `<link rel="icon" type="image/png" href="images/logo.png">`;
  }

  // add new favicon before </head>
  if (headCloseRe.test(html)) {
    html = html.replace(headCloseRe, `  ${finalFaviconTag}\n</head>`);
  } else {
    html = `${finalFaviconTag}\n${html}`;
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`✅ replaced favicon in ${path.relative(ROOT, file)}`);
}

console.log('\n🔥 all favicons replaced with correct paths for "images/logo.png"');