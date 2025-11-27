// remove-theme-script.cjs
const fs = require('fs');
const path = require('path');

// Function to remove the theme script from a file
function removeThemeScriptFromFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Pattern to match the theme toggle script block
        const themeScriptPattern = /<script>\s*\/\/ Theme Toggle[^]*?initializeTheme\(\);\s*<\/script>/;
        
        // Check if the theme script exists in this file
        if (themeScriptPattern.test(content)) {
            // Remove the theme script block
            const newContent = content.replace(themeScriptPattern, '');
            
            // Write the modified content back
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Removed theme script from: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⏩ No theme script found in: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function to process all HTML files in the cards directory
function processAllRestaurantFiles() {
    const cardsDir = path.join(__dirname, 'cards');
    
    if (!fs.existsSync(cardsDir)) {
        console.log('❌ cards directory not found!');
        return;
    }
    
    console.log('🔍 Scanning cards directory for HTML files...');
    
    const files = fs.readdirSync(cardsDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to process\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(cardsDir, file);
        if (removeThemeScriptFromFile(filePath)) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Done! Processed ${processedCount} files out of ${htmlFiles.length}`);
}

// Run the script
processAllRestaurantFiles();