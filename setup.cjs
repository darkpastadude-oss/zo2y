// setup.cjs - CommonJS setup script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Restaurant Data Extractor...\n');

// Create necessary directories
const dirs = ['cards', 'csv_output'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}/`);
  }
});

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version').toString().trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.log('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Check/install dependencies
console.log('\n📦 Checking/installing dependencies...');
try {
  require('jsdom');
  console.log('✅ JSDOM is already installed');
} catch (err) {
  console.log('Installing JSDOM...');
  try {
    execSync('npm install jsdom', { stdio: 'inherit' });
    console.log('✅ JSDOM installed successfully');
  } catch (installError) {
    console.log('❌ Failed to install JSDOM. Please run: npm install jsdom');
  }
}

// Check for package.json
if (!fs.existsSync('package.json')) {
  console.log('\n📄 Creating package.json...');
  fs.writeFileSync('package.json', JSON.stringify({
    name: "restaurant-data-extractor",
    version: "1.0.0",
    description: "Extract restaurant data from HTML files to CSV",
    main: "extract-restaurant-data.cjs",
    scripts: {
      "extract": "node extract-restaurant-data.cjs"
    },
    dependencies: {
      "jsdom": "^22.1.0"
    }
  }, null, 2));
  console.log('✅ Created package.json');
}

// Create README
console.log('\n📄 Creating README.md...');
fs.writeFileSync('README.md', `# Restaurant Data Extractor

## 🚀 Quick Start

1. **Place your restaurant HTML files** in the \`cards/\` folder
2. **Run the extractor:** \`node extract-restaurant-data.cjs\`
3. **Find CSV files** in \`csv_output/\` folder
4. **Import CSVs** into Supabase

## 📁 Folder Structure
\`\`\`
project/
├── cards/                    # Your HTML restaurant files go here
├── csv_output/              # Generated CSV files
├── extract-restaurant-data.cjs  # Main extraction script
├── package.json             # Node.js dependencies
└── README.md               # This file
\`\`\`

## 📊 What gets extracted?
- ✅ Restaurant name & description
- ✅ Rating (4.2/5 format)
- ✅ Hotline numbers
- ✅ Branch locations
- ✅ Menu items with prices
- ✅ Google Maps links

## 🛠️ Troubleshooting
If you get an error about missing JSDOM:
\`\`\`bash
npm install jsdom
\`\`\`

## 📋 Sample CSV Output
\`restaurants.csv\`:
\`\`\`csv
name,slug,description,rating,hotline
"Pizza Station","station","Better & Bigger Real Pizza! Fresh dough...",4.2,"17318"
\`\`\`

\`branches.csv\`:
\`\`\`csv
restaurant_slug,branch_name,details,directions_link
"station","New Cairo","Tagamoa 5, CFC Mall, Open: 10:00 AM - 2:00 AM","https://maps.google.com/search?q=Pizza+Station+CFC+Mall+New+Cairo"
\`\`\`

\`menu_items.csv\`:
\`\`\`csv
restaurant_slug,category,item_name,price
"station","Classic Pizzas","Margherita","EGP 120"
\`\`\`

## 🔗 Supabase Import
1. Create tables in Supabase SQL editor
2. Go to Table Editor → Click table → "Import data from CSV"
3. Upload your CSV files
\`\`\`sql
-- Restaurants table
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  rating DECIMAL(3,1),
  hotline VARCHAR(50)
);

-- Branches table  
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  restaurant_slug VARCHAR(100) REFERENCES restaurants(slug),
  branch_name VARCHAR(255),
  details TEXT,
  directions_link TEXT
);

-- Menu items table
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_slug VARCHAR(100) REFERENCES restaurants(slug),
  category VARCHAR(100),
  item_name VARCHAR(255),
  price VARCHAR(50)
);
\`\`\`
`);

console.log('\n' + '='.repeat(50));
console.log('✅ Setup complete!\n');
console.log('📋 Next steps:');
console.log('1. Copy your restaurant HTML files to the "cards/" folder');
console.log('2. Run: node extract-restaurant-data.cjs');
console.log('3. Check "csv_output/" folder for your CSV files');
console.log('4. Import to Supabase\n');
console.log('💡 Tip: You can run "npm run extract" after setup');