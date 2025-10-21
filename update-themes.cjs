const fs = require('fs');
const path = require('path');

// Your theme CSS (exactly from Koshary Ward)
const themeCSS = `
:root {
  --bg: #fff;
  --text: #333;
  --text2: #666;
  --nav-bg: #f8f9fa;
  --nav-shadow: rgba(0,0,0,0.1);
  --btn-bg: #FF6F00;
  --btn-text: #fff;
  --card: #f8f9fa;
  --input-bg: #fff;
  --input-text: #333;
  --accent: #FF9800;
  --egyptian-blue: #0033A0;
  --egyptian-red: #CE1126;
}

[data-theme="dark"] {
  --bg: #1e2a4a;
  --text: #fff;
  --text2: #cbd5e1;
  --nav-bg: #2d3748;
  --nav-shadow: rgba(255,255,255,0.1);
  --btn-bg: #ff944d;
  --btn-text: #111;
  --card: #2d3748;
  --input-bg: #2d3748;
  --input-text: #fff;
  --accent: #ff944d;
  --egyptian-blue: #4a6bff;
  --egyptian-red: #ff6b6b;
}
`;

// Theme toggle JavaScript
const themeJS = `
// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('restaurant-theme', theme);
}
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}
function initializeTheme() {
  const savedTheme = localStorage.getItem('restaurant-theme');
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}
themeToggle.addEventListener('click', toggleTheme);
initializeTheme();
`;

function updateRestaurantFiles() {
  const cardsFolder = './cards';
  
  // Check if cards folder exists
  if (!fs.existsSync(cardsFolder)) {
    console.log('❌ Cards folder not found! Make sure this script is in your main project folder.');
    return;
  }
  
  // Get all HTML files in cards folder
  const files = fs.readdirSync(cardsFolder).filter(file => file.endsWith('.html'));
  
  if (files.length === 0) {
    console.log('❌ No HTML files found in cards folder!');
    return;
  }
  
  console.log(`📁 Found ${files.length} restaurant files to update...`);
  
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(cardsFolder, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n🔄 Processing: ${file}`);
    
    // Save original content for backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`   💾 Backup created: ${file}.backup`);
    
    // 1. Replace CSS variables in style tags
    const styleRegex = /:root\s*\{[^}]*\}/g;
    const darkModeRegex = /\[data-theme="dark"\]\s*\{[^}]*\}/g;
    
    if (content.match(styleRegex)) {
      content = content.replace(styleRegex, ':root {' + themeCSS.match(/:root\s*\{([^}]*)\}/s)[1] + '}');
      console.log('   ✅ Updated :root variables');
    }
    
    if (content.match(darkModeRegex)) {
      content = content.replace(darkModeRegex, '[data-theme="dark"] {' + themeCSS.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/s)[1] + '}');
      console.log('   ✅ Updated dark mode variables');
    }
    
    // 2. Add theme toggle button if not present
    const topStripeRegex = /<div class="top-stripe">([\s\S]*?)<\/div>/;
    const topStripeMatch = content.match(topStripeRegex);
    
    if (topStripeMatch && !topStripeMatch[1].includes('theme-toggle')) {
      const updatedTopStripe = topStripeMatch[0].replace('</div>', '  <button class="theme-toggle" id="themeToggle">🌙 Dark Mode</button>\n</div>');
      content = content.replace(topStripeRegex, updatedTopStripe);
      console.log('   ✅ Added theme toggle button');
    }
    
    // 3. Add theme toggle JavaScript if not present
    if (!content.includes('themeToggle.addEventListener')) {
      // Find the last script tag or create one before closing body tag
      if (content.includes('</body>')) {
        content = content.replace('</body>', `<script>${themeJS}</script>\n</body>`);
        console.log('   ✅ Added theme toggle JavaScript');
      }
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`   ✅ Successfully updated: ${file}`);
  });
  
  console.log(`\n🎉 Done! Updated ${updatedCount} out of ${files.length} files`);
  console.log('📝 Original files backed up as .backup files');
}

// Run the script
updateRestaurantFiles();