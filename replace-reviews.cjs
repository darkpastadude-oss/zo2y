// remove-reviews-with-backup.js
const fs = require('fs');
const path = require('path');

function safeRemoveReviewsFromFile(filePath) {
    try {
        // Create backup first
        const backupPath = filePath + '.backup';
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(filePath, backupPath);
            console.log(`📦 Created backup: ${backupPath}`);
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalLength = content.length;
        
        // Remove reviews section
        content = content.replace(/<!-- DYNAMIC REVIEWS SYSTEM -->[\s\S]*?<\/section>/g, '');
        
        // Remove reviews script
        content = content.replace(/<!-- REVIEWS SYSTEM SCRIPT -->[\s\S]*?<\/script>/g, '');
        
        if (content.length < originalLength) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Cleaned: ${filePath} (removed ${originalLength - content.length} chars)`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
        return false;
    }
}

// Use the same processing function as above
function removeFromAllFiles() {
    const cardsFolder = './cards';
    if (!fs.existsSync(cardsFolder)) {
        console.log(`❌ Cards folder not found: ${cardsFolder}`);
        return;
    }
    
    const files = fs.readdirSync(cardsFolder);
    let processedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(cardsFolder, file);
            if (safeRemoveReviewsFromFile(filePath)) {
                processedCount++;
            }
        }
    });

    console.log(`\n🎉 Cleanup complete! Processed ${processedCount} files`);
}

removeFromAllFiles();