const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const mapping = {
  'watched': 'completed',
  'read': 'completed',
  'played': 'completed',
  'listened': 'completed',
  'owned': 'completed',
  'tried': 'completed',
  'visited': 'completed',
  
  'readlist': 'watchlist',
  'listenlist': 'watchlist',
  'listen_later': 'watchlist',
  'bucketlist': 'watchlist',
  'wishlist': 'watchlist',
  'go_list': 'watchlist',
  'want_to_try': 'watchlist'
};

const vMatch = /\?v=202606[0-9a-z]+/g;
const newV = '?v=20260619z';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Bump all script version tags
  if (vMatch.test(content)) {
    content = content.replace(vMatch, newV);
    changed = true;
  }

  // Fix state.listStatusMap keys
  // Example: { favorites: false, watched: false, watchlist: false }
  // Look for any of the old keys in object literals and replace them
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    // replace `oldKey:` with `newKey:`
    const regex = new RegExp(`\\b${oldKey}:`, 'g');
    if (regex.test(content)) {
       content = content.replace(regex, `${newKey}:`);
       changed = true;
    }
    // replace `{ oldKey: ` with `{ newKey: `
    const regex2 = new RegExp(`\\{ ${oldKey}:`, 'g');
    if (regex2.test(content)) {
       content = content.replace(regex2, `{ ${newKey}:`);
       changed = true;
    }
  }

  // Also fix QUICK_ROWS_BY_TYPE inside individual html files
  // e.g. { key: 'watched', label: 'Watched', icon: 'fas fa-eye' }
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    const keyRegex1 = new RegExp(`key:\\s*'${oldKey}'`, 'g');
    const keyRegex2 = new RegExp(`key:\\s*"${oldKey}"`, 'g');
    
    if (keyRegex1.test(content)) {
      content = content.replace(keyRegex1, `key: '${newKey}'`);
      changed = true;
    }
    if (keyRegex2.test(content)) {
      content = content.replace(keyRegex2, `key: "${newKey}"`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
