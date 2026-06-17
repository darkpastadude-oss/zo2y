const fs = require('fs');
const path = require('path');

const dir = "c:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys";

function updateCacheBuster(directory) {
    const files = fs.readdirSync(directory);
    let updated = 0;
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // Don't recurse into node_modules, .git, etc
            if (!file.startsWith('.') && file !== 'node_modules') {
                updateCacheBuster(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/v=20260617b/g, 'v=20260617c');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                updated++;
                console.log(`Updated cache buster in ${file}`);
            }
        }
    }
    return updated;
}

const count = updateCacheBuster(dir);
console.log(`Updated cache buster in ${count} files.`);
