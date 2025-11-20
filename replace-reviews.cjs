// restore-all.js
const fs = require('fs');
const path = require('path');

function restoreAllFiles() {
    console.log('🔍 Searching for backup files...');
    
    // Look for backups in current directory and subdirectories
    const backupFiles = [];
    
    function searchBackups(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                searchBackups(fullPath);
            } else if (item.endsWith('.backup')) {
                backupFiles.push(fullPath);
            }
        }
    }
    
    searchBackups('.');
    
    console.log(`📦 Found ${backupFiles.length} backup files`);
    
    let restoredCount = 0;
    
    backupFiles.forEach(backupPath => {
        try {
            // Remove .backup extension to get original filename
            const originalPath = backupPath.slice(0, -7); // remove '.backup'
            
            // Copy backup over original file
            fs.copyFileSync(backupPath, originalPath);
            console.log(`✅ Restored: ${path.basename(originalPath)}`);
            restoredCount++;
            
        } catch (error) {
            console.log(`❌ Failed to restore: ${backupPath}`);
        }
    });
    
    console.log(`\n🎉 SUCCESS! Restored ${restoredCount} files from backups`);
    console.log('✨ Your files are now back to their original state!');
}

restoreAllFiles();