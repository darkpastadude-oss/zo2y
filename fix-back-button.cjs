const fs = require("fs");
const path = require("path");

const folderPath = "./cards";

console.log('🚀 Fixing back buttons from restaurant.html to restraunts.html...');

fs.readdirSync(folderPath).forEach((file) => {
    if (file.endsWith(".html")) {
        const filePath = path.join(folderPath, file);
        let content = fs.readFileSync(filePath, "utf8");

        // Create backup first
        const backupPath = filePath + '.backup';
        if (!fs.existsSync(backupPath)) {
            fs.writeFileSync(backupPath, content);
            console.log(`   💾 Backup created: ${file}.backup`);
        }

        let changesMade = false;

        // Fix restaurant.html (no u) to restraunts.html (with u)
        const replacements = [
            // Fix the main issue - restaurant.html to restraunts.html
            { from: /window\.location\.href=['"]\.\.\/restaurant\.html['"]/g, to: `window.location.href='../restraunts.html'` },
            { from: /window\.location\.href=["']\.\.\/restaurant\.html["']/g, to: `window.location.href="../restraunts.html"` },
            
            // onclick variations
            { from: /onclick=["']window\.location\.href=['"]\.\.\/restaurant\.html['"]["']/g, to: `onclick="window.location.href='../restraunts.html'"` },
            { from: /onclick=["']location\.href=['"]\.\.\/restaurant\.html['"]["']/g, to: `onclick="location.href='../restraunts.html'"` },
            
            // href variations
            { from: /href=["']\.\.\/restaurant\.html["']/g, to: `href="../restraunts.html"` },
            { from: /href=['"]\.\.\/restaurant\.html['"]/g, to: `href='../restraunts.html'` },
        ];

        replacements.forEach(({ from, to }) => {
            const matches = content.match(from);
            if (matches) {
                console.log(`   🔧 Fixing in ${file}: ${matches[0]} → ${to}`);
                content = content.replace(from, to);
                changesMade = true;
            }
        });

        if (changesMade) {
            fs.writeFileSync(filePath, content, "utf8");
            console.log(`   ✅ Successfully fixed: ${file}`);
        } else {
            console.log(`   ⏭️  No changes needed: ${file}`);
        }
    }
});

console.log('\n🎉 BACK BUTTON FIX COMPLETE!');
console.log('✅ All back buttons now point to restraunts.html (with "u")');
console.log('💾 Original files backed up as .backup files');