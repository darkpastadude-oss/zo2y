const fs = require("fs");
const path = require("path");

const folderPath = "./cards";

console.log('🚀 Fixing "Back to Restaurants" button on all pages...');

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

        // Fix all variations of the back button URL
        let changesMade = false;

        // Fix window.location.href
        if (content.includes("window.location.href='../index.html'")) {
            content = content.replace(
                /window\.location\.href='\.\.\/index\.html'/g,
                "window.location.href='../restraunts.html'"
            );
            changesMade = true;
            console.log(`   ✅ Fixed window.location in ${file}`);
        }

        // Fix onclick with window.location
        if (content.includes("onclick=\"window.location.href='../index.html'\"")) {
            content = content.replace(
                /onclick="window\.location\.href='\.\.\/index\.html'"/g,
                'onclick="window.location.href=\'../restraunts.html\'"'
            );
            changesMade = true;
            console.log(`   ✅ Fixed onclick window.location in ${file}`);
        }

        // Fix onclick with location.href
        if (content.includes("onclick=\"location.href='../index.html'\"")) {
            content = content.replace(
                /onclick="location\.href='\.\.\/index\.html'"/g,
                'onclick="location.href=\'../restraunts.html\'"'
            );
            changesMade = true;
            console.log(`   ✅ Fixed onclick location.href in ${file}`);
        }

        // Fix simple onclick
        if (content.includes("onclick='../index.html'")) {
            content = content.replace(
                /onclick='\.\.\/index\.html'/g,
                "onclick='../restraunts.html'"
            );
            changesMade = true;
            console.log(`   ✅ Fixed simple onclick in ${file}`);
        }

        // Fix any href attributes in back buttons
        if (content.includes('href="../index.html"')) {
            content = content.replace(
                /href="\.\.\/index\.html"/g,
                'href="../restraunts.html"'
            );
            changesMade = true;
            console.log(`   ✅ Fixed href attribute in ${file}`);
        }

        if (changesMade) {
            fs.writeFileSync(filePath, content, "utf8");
            console.log(`   🔧 Successfully fixed: ${file}`);
        } else {
            console.log(`   ⏭️  No changes needed: ${file}`);
        }
    }
});

console.log('\n🎉 BACK BUTTON FIX COMPLETE!');
console.log('✅ All "Back to Restaurants" buttons now point to restraunts.html');
console.log('💾 Original files backed up as .backup files');
console.log('\n📝 Summary of fixes:');
console.log('   • window.location.href="../index.html" → window.location.href="../restraunts.html"');
console.log('   • onclick="window.location.href=\'../index.html\'" → onclick="window.location.href=\'../restraunts.html\'"');
console.log('   • onclick="location.href=\'../index.html\'" → onclick="location.href=\'../restraunts.html\'"');
console.log('   • onclick=\'../index.html\' → onclick=\'../restraunts.html\'');
console.log('   • href="../index.html" → href="../restraunts.html"');