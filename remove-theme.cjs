// remove-theme-toggle.cjs
const fs = require('fs');
const path = require('path');

// Function to remove theme toggle from a file
function removeThemeToggleFromFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Remove the theme toggle button from top-stripe
        const buttonPattern = /<button class="theme-toggle"[^>]*>🌙 Dark Mode<\/button>/;
        if (buttonPattern.test(content)) {
            content = content.replace(buttonPattern, '');
            modified = true;
            console.log(`✅ Removed theme toggle button from: ${path.basename(filePath)}`);
        }

        // Remove the entire theme toggle script block
        const themeScriptPatterns = [
            /<script>\s*\/\/ Theme Toggle[\s\S]*?initializeTheme\(\);\s*<\/script>/,
            /<script>[\s\S]*?themeToggle[\s\S]*?applyTheme[\s\S]*?toggleTheme[\s\S]*?initializeTheme[\s\S]*?<\/script>/,
            /<script>[\s\S]*?data-theme[\s\S]*?localStorage\.setItem\('restaurant-theme'[\s\S]*?<\/script>/
        ];

        themeScriptPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
                modified = true;
                console.log(`✅ Removed theme script from: ${path.basename(filePath)}`);
            }
        });

        // Remove CSS variables for themes
        const cssPattern = /:root\s*{[\s\S]*?}\s*\[\s*data-theme\s*=\s*"dark"\s*\][\s\S]*?}/;
        if (cssPattern.test(content)) {
            content = content.replace(cssPattern, '');
            modified = true;
            console.log(`✅ Removed theme CSS from: ${path.basename(filePath)}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } else {
            console.log(`⏩ No theme toggle found in: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function processAllRestaurantFiles() {
    const cardsDir = path.join(__dirname, 'cards');
    
    if (!fs.existsSync(cardsDir)) {
        console.log('❌ cards directory not found!');
        return;
    }
    
    console.log('🔍 Scanning cards directory for theme toggle...');
    
    const files = fs.readdirSync(cardsDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to process\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(cardsDir, file);
        if (removeThemeToggleFromFile(filePath)) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Done! Removed theme toggle from ${processedCount} files out of ${htmlFiles.length}`);
}

// Run the script
processAllRestaurantFiles();