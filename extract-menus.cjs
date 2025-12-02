// extract-menus.js
const fs = require('fs');
const path = require('path');

// Configuration
const CARDS_DIR = './cards'; // Your folder with restaurant HTML files
const OUTPUT_DIR = './extracted_menus'; // Output directory
const MAIN_CSV = './all_menus.csv'; // Combined CSV file

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to parse HTML and extract menu items
function extractMenuFromHTML(htmlContent, fileName) {
    const menuItems = [];
    let currentCategory = '';
    
    // Extract restaurant name from title or filename
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    let restaurantName = fileName.replace('.html', '').replace(/_/g, ' ');
    
    if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1];
        // Try to extract restaurant name from title
        restaurantName = title.split(' - ')[0] || 
                         title.split(' | ')[0] || 
                         title.split(' – ')[0] || 
                         restaurantName;
    }
    
    console.log(`🔍 Processing: ${restaurantName}`);
    
    // METHOD 1: Look for menu sections with h2 headers and menu items
    const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let sectionMatch;
    
    while ((sectionMatch = sectionRegex.exec(htmlContent)) !== null) {
        const category = cleanText(sectionMatch[1]);
        const sectionContent = sectionMatch[2];
        
        // Only process sections that look like menu categories
        if (isMenuCategory(category)) {
            currentCategory = category;
            
            // Look for menu items in this section
            // Pattern 1: Barbar style - <div class="menu-item">
            const menuItemRegex1 = /<div[^>]*class="[^"]*menu-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
            let itemMatch1;
            
            while ((itemMatch1 = menuItemRegex1.exec(sectionContent)) !== null) {
                const itemHtml = itemMatch1[1];
                const item = parseMenuItem(itemHtml, currentCategory);
                if (item) {
                    menuItems.push({ ...item, restaurant: restaurantName });
                }
            }
            
            // Pattern 2: Direct text with prices
            const lines = sectionContent.split('</div>').join('\n').split('</p>').join('\n').split('\n');
            let currentItem = null;
            
            for (const line of lines) {
                const cleanLine = cleanHtml(line);
                if (!cleanLine.trim()) continue;
                
                // Check if line contains a price
                const priceMatch = cleanLine.match(/EGP\s*([\d,]+(?:\.\d{2})?)/i) || 
                                  cleanLine.match(/(\d+)(?:\s*EGP)/i);
                
                if (priceMatch) {
                    const price = priceMatch[1].replace(/,/g, '');
                    
                    if (currentItem) {
                        // Complete the current item
                        menuItems.push({
                            restaurant: restaurantName,
                            category: currentCategory,
                            item: currentItem.name,
                            description: currentItem.description || '',
                            price: price,
                            currency: 'EGP'
                        });
                        currentItem = null;
                    }
                } else if (cleanLine.length > 3 && cleanLine.length < 100) {
                    // Could be an item name
                    if (!currentItem) {
                        currentItem = { name: cleanLine };
                    } else {
                        // Might be description
                        currentItem.description = (currentItem.description || '') + ' ' + cleanLine;
                    }
                }
            }
        }
    }
    
    // METHOD 2: Look for all menu items directly
    if (menuItems.length === 0) {
        console.log(`   Trying alternative extraction for ${restaurantName}...`);
        
        // Find all divs that might contain menu items
        const divRegex = /<div[^>]*>([\s\S]*?)<\/div>/gi;
        let divMatch;
        let lastCategory = '';
        
        while ((divMatch = divRegex.exec(htmlContent)) !== null) {
            const divContent = divMatch[0];
            const textContent = cleanHtml(divContent);
            
            // Check if this div is a category header
            if (divContent.includes('<h2') || divContent.includes('<h3')) {
                const catMatch = textContent.match(/^(.*?)$/m);
                if (catMatch && isMenuCategory(catMatch[1])) {
                    lastCategory = catMatch[1];
                }
            }
            
            // Check if this div contains a price
            const priceMatch = textContent.match(/EGP\s*([\d,]+(?:\.\d{2})?)/i);
            if (priceMatch && textContent.length < 500) {
                const price = priceMatch[1].replace(/,/g, '');
                
                // Extract item name (text before price)
                const beforePrice = textContent.split(/EGP/i)[0].trim();
                if (beforePrice) {
                    // Split into name and description
                    const lines = beforePrice.split(/[\.\n]/).map(l => l.trim()).filter(l => l);
                    const itemName = lines[0] || beforePrice;
                    const description = lines.slice(1).join('. ').trim();
                    
                    menuItems.push({
                        restaurant: restaurantName,
                        category: lastCategory || 'Menu',
                        item: itemName,
                        description: description,
                        price: price,
                        currency: 'EGP'
                    });
                }
            }
        }
    }
    
    console.log(`   Found ${menuItems.length} menu items`);
    return { restaurant: restaurantName, items: menuItems };
}

// Helper function to parse a menu item HTML
function parseMenuItem(html, category) {
    const cleanHtmlText = cleanHtml(html);
    
    // Remove any HTML tags
    const textOnly = cleanHtmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Look for price
    const priceMatch = textOnly.match(/EGP\s*([\d,]+(?:\.\d{2})?)/i) || 
                      textOnly.match(/(\d+)(?:\s*EGP)/i);
    
    if (!priceMatch) return null;
    
    const price = priceMatch[1].replace(/,/g, '');
    
    // Get text before price
    const beforePrice = textOnly.split(/EGP/i)[0].trim();
    
    if (!beforePrice) return null;
    
    // Try to split into name and description
    const lines = beforePrice.split(/[\.\n]/).map(l => l.trim()).filter(l => l);
    const itemName = lines[0] || beforePrice;
    const description = lines.slice(1).join('. ').trim();
    
    return {
        category: category,
        item: itemName,
        description: description,
        price: price,
        currency: 'EGP'
    };
}

// Clean HTML tags and normalize text
function cleanHtml(html) {
    return html
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

// Clean text
function cleanText(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}

// Check if a string looks like a menu category
function isMenuCategory(text) {
    const lowerText = text.toLowerCase();
    
    // Common menu categories
    const menuKeywords = [
        'menu', 'appetizer', 'starter', 'main', 'entree', 'dessert',
        'burger', 'pizza', 'pasta', 'salad', 'soup', 'sandwich',
        'shawarma', 'drink', 'beverage', 'coffee', 'tea', 'juice',
        'breakfast', 'lunch', 'dinner', 'special', 'combo', 'meal',
        'chicken', 'beef', 'fish', 'seafood', 'vegetarian', 'vegan',
        'sides', 'add', 'extra', 'sauce', 'dip', 'topping'
    ];
    
    // Exclude non-menu categories
    const excludeKeywords = [
        'contact', 'branch', 'location', 'address', 'phone',
        'review', 'rating', 'hour', 'open', 'close',
        'delivery', 'takeout', 'reservation', 'about', 'home'
    ];
    
    // Check for menu keywords
    const hasMenuKeyword = menuKeywords.some(keyword => 
        lowerText.includes(keyword)
    );
    
    // Check for exclude keywords
    const hasExcludeKeyword = excludeKeywords.some(keyword => 
        lowerText.includes(keyword)
    );
    
    // Also check for common patterns
    const isAllCaps = text === text.toUpperCase() && text.length < 20;
    const hasPriceSymbol = text.includes('$') || text.includes('EGP');
    
    return (hasMenuKeyword || isAllCaps) && !hasExcludeKeyword && !hasPriceSymbol && text.length < 50;
}

// Convert items to CSV
function itemsToCSV(items) {
    const headers = ['Restaurant', 'Category', 'Item Name', 'Description', 'Price', 'Currency'];
    
    const rows = items.map(item => [
        escapeCSV(item.restaurant),
        escapeCSV(item.category),
        escapeCSV(item.item),
        escapeCSV(item.description),
        item.price,
        escapeCSV(item.currency)
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// Escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined || value === '') {
        return '""';
    }
    
    const stringValue = String(value);
    const escapedValue = stringValue.replace(/"/g, '""');
    
    // Wrap in quotes if contains commas, quotes, or newlines
    if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
        return `"${escapedValue}"`;
    }
    
    return escapedValue;
}

// Main function to process all files
async function processAllRestaurants() {
    console.log('🚀 Starting menu extraction from cards/ folder...');
    console.log(`📁 Scanning directory: ${CARDS_DIR}`);
    
    // Check if directory exists
    if (!fs.existsSync(CARDS_DIR)) {
        console.error(`❌ Directory not found: ${CARDS_DIR}`);
        console.log('Please make sure you have a "cards/" folder with HTML files.');
        return;
    }
    
    // Get all HTML files
    const files = fs.readdirSync(CARDS_DIR)
        .filter(file => file.toLowerCase().endsWith('.html'))
        .sort();
    
    console.log(`📊 Found ${files.length} HTML files`);
    
    if (files.length === 0) {
        console.error('❌ No HTML files found in cards/ folder');
        return;
    }
    
    // Process each file
    const allMenuItems = [];
    const restaurantStats = [];
    let successCount = 0;
    
    for (const file of files) {
        try {
            console.log(`\n--- Processing: ${file} ---`);
            
            const filePath = path.join(CARDS_DIR, file);
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            const result = extractMenuFromHTML(htmlContent, file);
            
            if (result.items.length > 0) {
                // Save individual restaurant CSV
                const restaurantCSV = itemsToCSV(
                    result.items.map(item => ({ ...item, restaurant: result.restaurant }))
                );
                
                const outputFile = path.join(
                    OUTPUT_DIR, 
                    `${result.restaurant.replace(/[^a-z0-9]/gi, '_')}_menu.csv`
                );
                
                fs.writeFileSync(outputFile, restaurantCSV, 'utf8');
                
                // Add to combined list
                allMenuItems.push(...result.items);
                
                restaurantStats.push({
                    file: file,
                    restaurant: result.restaurant,
                    itemCount: result.items.length,
                    outputFile: path.basename(outputFile)
                });
                
                successCount++;
                console.log(`✅ Saved: ${result.items.length} items`);
            } else {
                console.log(`⚠️  No menu items found`);
                restaurantStats.push({
                    file: file,
                    restaurant: result.restaurant,
                    itemCount: 0,
                    outputFile: 'N/A'
                });
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            restaurantStats.push({
                file: file,
                restaurant: 'ERROR',
                itemCount: 0,
                outputFile: 'ERROR',
                error: error.message
            });
        }
    }
    
    // Save combined CSV
    if (allMenuItems.length > 0) {
        const combinedCSV = itemsToCSV(allMenuItems);
        fs.writeFileSync(MAIN_CSV, combinedCSV, 'utf8');
        
        console.log('\n🎉 EXTRACTION COMPLETE!');
        console.log('='.repeat(50));
        console.log(`📊 Total restaurants processed: ${successCount}/${files.length}`);
        console.log(`📊 Total menu items extracted: ${allMenuItems.length}`);
        console.log(`📁 Individual files saved to: ${OUTPUT_DIR}/`);
        console.log(`📁 Combined CSV saved to: ${MAIN_CSV}`);
        
        // Generate summary report
        const summaryReport = generateSummaryReport(restaurantStats, allMenuItems.length);
        fs.writeFileSync('./extraction_summary.txt', summaryReport, 'utf8');
        console.log(`📋 Summary report: ./extraction_summary.txt`);
        
        // Show top restaurants
        console.log('\n🏆 Top 5 Restaurants by Menu Item Count:');
        const topRestaurants = [...restaurantStats]
            .filter(r => r.itemCount > 0)
            .sort((a, b) => b.itemCount - a.itemCount)
            .slice(0, 5);
        
        topRestaurants.forEach((rest, i) => {
            console.log(`${i + 1}. ${rest.restaurant}: ${rest.itemCount} items`);
        });
        
        // Show sample of extracted data
        console.log('\n📋 Sample of extracted menu items:');
        const sampleItems = allMenuItems.slice(0, 5);
        sampleItems.forEach((item, i) => {
            console.log(`${i + 1}. [${item.restaurant}] ${item.category}: ${item.item} - ${item.price} ${item.currency}`);
        });
        
    } else {
        console.error('\n❌ No menu items were extracted from any file.');
    }
}

// Generate summary report
function generateSummaryReport(stats, totalItems) {
    const successful = stats.filter(s => s.itemCount > 0);
    const failed = stats.filter(s => s.itemCount === 0);
    
    return `Menu Extraction Summary Report
Generated: ${new Date().toLocaleString()}
========================================

📊 STATISTICS:
- Total files processed: ${stats.length}
- Successful extractions: ${successful.length}
- Failed extractions: ${failed.length}
- Total menu items extracted: ${totalItems}

🏆 TOP RESTAURANTS BY ITEM COUNT:
${successful
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 10)
    .map((r, i) => `${i + 1}. ${r.restaurant}: ${r.itemCount} items (${r.file})`)
    .join('\n')}

📁 DETAILED RESULTS:
${stats.map(s => 
    `${s.restaurant.padEnd(30)} | ${s.itemCount.toString().padStart(3)} items | ${s.file}`
).join('\n')}

${failed.length > 0 ? `
⚠️  FAILED EXTRACTIONS:
${failed.map(f => `- ${f.file}: ${f.error || 'No menu items found'}`).join('\n')}
` : ''}

📍 OUTPUT FILES:
- Combined CSV: ${MAIN_CSV}
- Individual CSVs: ${OUTPUT_DIR}/
- This report: extraction_summary.txt
`;
}

// Command line interface
function run() {
    console.log(`
    ╔══════════════════════════════════════╗
    ║      RESTAURANT MENU EXTRACTOR       ║
    ║      For 50+ HTML files in cards/    ║
    ╚══════════════════════════════════════╝
    `);
    
    processAllRestaurants().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Run the script
run();