// replace-favicon.cjs
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const faviconHref = 'images/logo.png';
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

  // add new favicon before </head>
  if (headCloseRe.test(html)) {
    html = html.replace(headCloseRe, `  ${faviconTag}\n</head>`);
  } else {
    html = `${faviconTag}\n${html}`;
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`✅ replaced favicon in ${path.relative(ROOT, file)}`);
}

console.log('\n🔥 all favicons replaced with "images/logo.png"');
