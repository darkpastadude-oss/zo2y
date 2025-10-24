// add-favicon.js
import fs from 'fs';
import path from 'path';

const folder = './'; // or wherever ur html files are
const faviconTag = '<link rel="icon" type="image/png" href="/logo.png">';

fs.readdirSync(folder).forEach(file => {
  if (file.endsWith('.html')) {
    const filePath = path.join(folder, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // check if already added
    if (!content.includes(faviconTag)) {
      // add before closing </head> tag
      content = content.replace('</head>', `  ${faviconTag}\n</head>`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Added favicon to: ${file}`);
    } else {
      console.log(`⚠️ Already has favicon: ${file}`);
    }
  }
});
