const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const RESTAURANTS_DIR = './cards'; // Directory containing your HTML files
const OUTPUT_DIR = './csv_output'; // Output directory for CSV files

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to extract restaurant data from HTML
function extractRestaurantData(htmlContent, fileName) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // Extract restaurant name from title
  const titleElement = document.querySelector('title');
  let restaurantName = '';
  
  if (titleElement) {
    const titleText = titleElement.textContent;
    // Try to extract name from title format "Restaurant Name - Description"
    if (titleText.includes(' - ')) {
      restaurantName = titleText.split(' - ')[0].trim();
    } else {
      restaurantName = titleText.trim();
    }
  }
  
  // If no title found, use filename
  if (!restaurantName) {
    restaurantName = fileName.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Extract description
  const descriptionElement = document.querySelector('.hero p');
  const description = descriptionElement ? descriptionElement.textContent.trim() : '';

  // Extract rating
  const ratingElement = document.querySelector('.rating');
  let rating = '';
  if (ratingElement) {
    const ratingText = ratingElement.textContent;
    const match = ratingText.match(/(\d+\.?\d*)\/5/);
    rating = match ? match[1] : '';
  }

  // Extract hotline
  const hotlines = new Set();
  
  // Check hero section for hotline
  const heroHotlines = document.querySelectorAll('.hero a[href^="tel:"]');
  heroHotlines.forEach(a => {
    const text = a.textContent.replace('Call Hotline:', '').trim();
    if (text) hotlines.add(text);
  });
  
  // Check hotline section
  const hotlineLinks = document.querySelectorAll('.hotline a[href^="tel:"]');
  hotlineLinks.forEach(a => {
    const text = a.textContent.trim();
    if (text && !text.includes('Get Directions') && !text.includes('📍')) {
      hotlines.add(text);
    }
  });

  // Extract branches
  const branches = [];
  const branchCards = document.querySelectorAll('.branch-card');
  branchCards.forEach(card => {
    const nameElement = card.querySelector('h3');
    const detailsElement = card.querySelector('p');
    const directionsElement = card.querySelector('a[href*="maps.google.com"]');
    
    if (nameElement && detailsElement) {
      const name = nameElement.textContent.trim();
      const details = detailsElement.innerHTML
        .split('<br>')
        .map(part => part.replace(/<[^>]*>/g, '').trim())
        .filter(part => part)
        .join(', ');
      
      const directions = directionsElement ? directionsElement.getAttribute('href') : '';
      
      branches.push({
        name,
        details,
        directions
      });
    }
  });

  // Extract menu items
  const menuItems = [];
  
  // Get all menu sections
  const sections = document.querySelectorAll('.section.menu h2');
  
  if (sections.length > 0) {
    sections.forEach(section => {
      const category = section.textContent.trim();
      let currentElement = section.nextElementSibling;
      
      while (currentElement && 
             !currentElement.tagName.startsWith('H') && 
             !currentElement.classList?.contains('btn')) {
        
        if (currentElement.classList?.contains('menu-item')) {
          const spans = currentElement.querySelectorAll('span');
          if (spans.length >= 2) {
            menuItems.push({
              category,
              name: spans[0].textContent.trim(),
              price: spans[1].textContent.trim()
            });
          }
        }
        currentElement = currentElement.nextElementSibling;
      }
    });
  } else {
    // Fallback: get all menu items
    const allMenuItems = document.querySelectorAll('.menu-item');
    allMenuItems.forEach(item => {
      const spans = item.querySelectorAll('span');
      if (spans.length >= 2) {
        menuItems.push({
          category: 'Main Menu',
          name: spans[0].textContent.trim(),
          price: spans[1].textContent.trim()
        });
      }
    });
  }

  // Extract slug from filename
  const slug = fileName.replace('.html', '');

  return {
    restaurant: {
      name: restaurantName,
      slug: slug,
      description: description,
      rating: parseFloat(rating) || 0,
      hotline: Array.from(hotlines).join('; ')
    },
    branches: branches,
    menu: menuItems
  };
}

// Function to write CSV files
function writeCSV(data) {
  const safeName = data.restaurant.name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
  
  // 1. Write restaurants.csv
  const restaurantsCSV = `"${data.restaurant.name}","${data.restaurant.slug}","${data.restaurant.description}",${data.restaurant.rating},"${data.restaurant.hotline}"\n`;
  
  fs.appendFileSync(path.join(OUTPUT_DIR, 'restaurants.csv'), restaurantsCSV);
  
  // 2. Write branches.csv
  data.branches.forEach(branch => {
    const branchCSV = `"${data.restaurant.slug}","${branch.name}","${branch.details}","${branch.directions}"\n`;
    fs.appendFileSync(path.join(OUTPUT_DIR, 'branches.csv'), branchCSV);
  });
  
  // 3. Write menu_items.csv
  data.menu.forEach(item => {
    const menuCSV = `"${data.restaurant.slug}","${item.category}","${item.name}","${item.price}"\n`;
    fs.appendFileSync(path.join(OUTPUT_DIR, 'menu_items.csv'), menuCSV);
  });
  
  console.log(`✓ Extracted: ${data.restaurant.name}`);
}

// Main function to process all HTML files
function processRestaurantFiles() {
  try {
    // Clear existing CSV files by writing headers
    fs.writeFileSync(path.join(OUTPUT_DIR, 'restaurants.csv'), 'name,slug,description,rating,hotline\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'branches.csv'), 'restaurant_slug,branch_name,details,directions_link\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'menu_items.csv'), 'restaurant_slug,category,item_name,price\n');
    
    // Read all HTML files in cards directory
    const files = fs.readdirSync(RESTAURANTS_DIR).filter(file => file.endsWith('.html'));
    
    if (files.length === 0) {
      console.log(`❌ No HTML files found in ${RESTAURANTS_DIR}/`);
      console.log(`Please place your restaurant HTML files in the 'cards' folder.`);
      return;
    }
    
    console.log(`Found ${files.length} restaurant files to process...\n`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    files.forEach((file, index) => {
      try {
        const filePath = path.join(RESTAURANTS_DIR, file);
        console.log(`Processing ${index + 1}/${files.length}: ${file}`);
        
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract data
        const data = extractRestaurantData(htmlContent, file);
        
        // Write to CSV files
        writeCSV(data);
        processedCount++;
        
      } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
        errorCount++;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Extraction complete!');
    console.log(`📊 Processed: ${processedCount} files`);
    console.log(`⚠️  Errors: ${errorCount} files`);
    console.log(`📁 CSV files saved in: ${path.resolve(OUTPUT_DIR)}/`);
    console.log('\nGenerated CSV files:');
    console.log('  - restaurants.csv    (Main restaurant info)');
    console.log('  - branches.csv       (Branch locations)');
    console.log('  - menu_items.csv     (Menu items by category)');
    console.log('\nNext step: Import these CSV files into Supabase!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if JSDOM is installed
try {
  require('jsdom');
} catch (err) {
  console.log('❌ JSDOM is not installed. Installing...');
  console.log('Please run: npm install jsdom');
  process.exit(1);
}

// Run the extraction
processRestaurantFiles();