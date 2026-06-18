const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const queries = [];

walkDir('c:/Users/sigma/OneDrive/Desktop/zo2ys', function(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return;
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('.vercel') || filePath.includes('.wrangler') || filePath.includes('\\dist\\') || filePath.includes('/dist/')) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        const fromMatch = line.match(/\.from\(['"`](.+?)['"`]\)/);
        if (fromMatch) {
            let table = fromMatch[1];
            let context = lines.slice(Math.max(0, i-2), Math.min(lines.length, i+10)).join('\n');
            
            let action = 'unknown';
            let cols = '';
            
            if (context.includes('.select(')) action = 'select';
            else if (context.includes('.insert(')) action = 'insert';
            else if (context.includes('.update(')) action = 'update';
            else if (context.includes('.upsert(')) action = 'upsert';
            else if (context.includes('.delete(')) action = 'delete';
            
            let selectMatch = context.match(/\.select\(['"`](.+?)['"`]\)/);
            if (selectMatch) cols = selectMatch[1];

            queries.push({
                file: filePath,
                line: i + 1,
                type: 'from',
                target: table,
                action: action,
                cols: cols
            });
        }
        
        const rpcMatch = line.match(/\.rpc\(['"`](.+?)['"`]/);
        if (rpcMatch) {
            queries.push({
                file: filePath,
                line: i + 1,
                type: 'rpc',
                target: rpcMatch[1],
                action: 'rpc',
                cols: ''
            });
        }
    }
});

fs.writeFileSync('c:/Users/sigma/OneDrive/Desktop/zo2ys/scratch_query_audit.json', JSON.stringify(queries, null, 2));
console.log(`Found ${queries.length} queries.`);
