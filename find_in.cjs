const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('_legacy_backup') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.html')) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('.in(')) {
            const m = line.match(/\.in\(\s*([^'"][^,)]+)/);
            if (m) console.log(file + ':' + (i+1) + ': ' + line.trim());
          }
        });
      }
    }
  });
  return results;
}
walk('.');
