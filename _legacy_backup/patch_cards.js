const fs = require('fs');

const indexCss = fs.readFileSync('css/pages/index.css', 'utf8');
const cardCssMatch = indexCss.match(/(\.card \{[\s\S]*?)(?=\n\s*\.card-extra\.placeholder \{)/);
let newCardCss = '';
if (cardCssMatch) {
  newCardCss = cardCssMatch[1];
} else {
  console.log('Could not find card CSS in index.css');
  process.exit(1);
}

// Ensure the menu styles are appended (as they are in category-shared.css but maybe not in index.css)
const menuStyles = `
.menu { position: absolute; right: 10px; bottom: 44px; width: 190px; background: #0e284b; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 14px 30px rgba(0,0,0,0.35); padding: 8px; display: none; z-index: 12; }
.menu.open { display: block; }
.menu button { width: 100%; border: 1px solid var(--border); background: transparent; color: #eef4ff; border-radius: 8px; padding: 8px; font-size: 12px; margin-bottom: 6px; text-align: left; cursor: pointer; }
.menu button:last-child { margin-bottom: 0; }
.menu button:hover { border-color: var(--accent); color: var(--accent); }
.menu button[data-saved="1"] { border-color: rgba(248,113,113,0.85); background: rgba(239,68,68,0.12); color: #fecaca; }
`;

let sharedCss = fs.readFileSync('css/pages/category-shared.css', 'utf8');
sharedCss = sharedCss.replace(/\.card \{[\s\S]*?(?=\n\.category-loader \{)/, newCardCss + menuStyles + '\n');
fs.writeFileSync('css/pages/category-shared.css', sharedCss);
console.log('Updated category-shared.css');

function processHtmlFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remove inline .card CSS block if it exists
  content = content.replace(/\s*\.card\s*\{[\s\S]*?\.menu\s*button\[data-saved="1"\]\s*\{[\s\S]*?\}/g, '');

  // Link category-shared.css if missing
  if (!content.includes('category-shared.css')) {
    content = content.replace('<link rel="stylesheet" href="css/animations.css?v=20260623z">', '<link rel="stylesheet" href="css/animations.css?v=20260623z">\n  <link rel="stylesheet" href="/css/pages/category-shared.css?v=20260623z">');
  }

  // Use a more relaxed regex to catch variations in whitespace
  const regex = /<div class="card-meta">\s*<span class="card-type">([\s\S]*?)<\/span>\s*<div class="card-meta-top">\s*<p class="card-title">([\s\S]*?)<\/p>\s*<\/div>\s*<p class="card-sub">([\s\S]*?)<\/p>(?:\s*<p class="card-extra">([\s\S]*?)<\/p>)?\s*<div class="card-actions">\s*<button class="icon-btn menu-btn"([\s\S]*?)<\/button>\s*<\/div>\s*<\/div>/g;

  content = content.replace(regex, (match, typeContent, titleContent, subContent, extraContent, btnContent) => {
    let extra = extraContent ? `\n            <p class="card-extra">${extraContent}</p>` : '';
    return `<div class="card-meta">
            <div class="card-meta-header">
              <span class="card-type">${typeContent}</span>
              <div class="card-menu-wrap">
                <button class="icon-btn menu-btn"${btnContent}</button>
              </div>
            </div>
            <div class="card-meta-top">
              <p class="card-name">${titleContent}</p>
            </div>
            <p class="card-sub">${subContent}</p>${extra}
          </div>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated HTML in', filePath);
  }
}

['movies.html', 'tvshows.html', 'animes.html', 'music.html', 'games.html'].forEach(processHtmlFile);
