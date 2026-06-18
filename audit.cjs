const fs = require('fs');
const path = require('path');

const terms = [
    'external_type',
    'anime_list_items',
    'game_list_items',
    'movie_list_items',
    'tv_list_items',
    'book_list_items',
    'music_list_items',
    'food_list_items',
    'travel_list_items',
    'fashion_list_items',
    'car_list_items',
    'sports',
    'list.title'
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const results = {};
terms.forEach(t => results[t] = []);

walkDir('c:/Users/sigma/OneDrive/Desktop/zo2ys', function(filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('.vercel') || filePath.includes('.wrangler') || filePath.includes('\\dist\\') || filePath.includes('/dist/') || filePath.includes('audit.cjs') || filePath.includes('scratch_')) return;
    if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return; // EXCLUDE SQL

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        terms.forEach(term => {
            if (line.includes(term)) {
                results[term].push({
                    file: filePath.replace('c:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys\\', ''),
                    line: i + 1,
                    snippet: line.trim()
                });
            }
        });
    }
});

let md = '# Audit Results (HTML/JS Only)\n\n';
terms.forEach(term => {
    md += `## ${term} (${results[term].length} matches)\n`;
    results[term].forEach(r => {
        md += `- **${r.file}:${r.line}**: \`${r.snippet}\`\n`;
    });
    md += '\n';
});

fs.writeFileSync('c:/Users/sigma/OneDrive/Desktop/zo2ys/audit_report_clean.md', md);
console.log('Done');
