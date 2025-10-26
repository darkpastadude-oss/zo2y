// apply-maine-theme.cjs
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CARDS_DIR = path.join(ROOT, 'cards'); // Adjust path if needed

// Maine theme CSS (extracted from your code)
const MAINE_THEME_CSS = `
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
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
body{background-color:var(--bg);color:var(--text);transition:background-color 0.3s ease,color 0.3s ease;line-height:1.6}
.top-stripe{background:#FF9800;height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:sticky;top:0;z-index:100}
.back-btn,.theme-toggle{background:rgba(255,255,255,0.2);color:white;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:14px;transition:all 0.3s ease}
.back-btn:hover,.theme-toggle:hover{background:rgba(255,255,255,0.3)}
.back-btn{display:flex;align-items:center;gap:6px}
.back-btn:hover{transform:translateX(-3px)}
.hero{text-align:center;padding:60px 20px 40px;background:linear-gradient(135deg,var(--card) 0%,var(--bg) 100%);position:relative}
.hero::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(45deg, rgba(255,152,0,0.05) 0%, transparent 50%);pointer-events:none}
.logo{width:150px;height:150px;border-radius:50%;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;margin-bottom:30px;border:4px solid white;position:relative;z-index:1}
.hero h1{font-size:2.5rem;margin-bottom:10px;font-weight:700;position:relative;z-index:1}
.hero p{font-size:1rem;color:var(--text2);margin-bottom:10px;max-width:600px;margin:0 auto;position:relative;z-index:1}
.rating{color:#FF9800;font-size:1.2rem;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:8px;position:relative;z-index:1}
.btn{display:inline-block;padding:12px 24px;border-radius:8px;background:var(--btn-bg);color:var(--btn-text);text-decoration:none;font-weight:600;margin:6px 4px;transition:transform 0.2s ease,box-shadow 0.2s ease;border:none;cursor:pointer;font-size:1rem;position:relative;z-index:1}
.btn.secondary{background:var(--nav-bg);color:var(--text);border:1px solid var(--text)}
.btn:hover{transform:scale(1.03);box-shadow:0 6px 18px rgba(255,152,0,0.2)}
.section{max-width:900px;margin:0 auto;padding:40px 20px}
h2{margin-bottom:20px;font-size:1.6rem;position:relative;padding-bottom:10px}
h2::after{content:'';position:absolute;bottom:0;left:0;width:60px;height:3px;background:#FF9800;border-radius:2px}
.hotline{font-size:1.2rem;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hotline a{color:var(--text);text-decoration:none;font-weight:700;background:var(--card);padding:8px 16px;border-radius:20px;transition:all 0.3s ease}
.hotline a:hover{text-decoration:none;background:var(--btn-bg);color:var(--btn-text)}
.branches{display:flex;flex-wrap:wrap;gap:20px;margin-top:20px}
.branch-card{flex:1 1 45%;border:1px solid var(--nav-shadow);border-radius:12px;padding:20px;background:var(--card);transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.05)}
.branch-card:hover{transform:translateY(-5px);box-shadow:0 8px 15px rgba(0,0,0,0.1)}
.branch-card h3{margin-bottom:10px;font-size:1.2rem}
.branch-card p{font-size:0.95rem;color:var(--text2);margin-bottom:15px}
.branch-card a{font-size:0.9rem;color:var(--text);text-decoration:none;display:flex;align-items:center;gap:5px}
.branch-card a:hover{text-decoration:underline}
.menu-categories{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}
.menu-category-btn{background:var(--card);border:1px solid var(--nav-shadow);padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.3s ease;font-size:0.9rem}
.menu-category-btn.active,.menu-category-btn:hover{background:var(--btn-bg);color:var(--btn-text)}
.menu-item{display:flex;justify-content:space-between;padding:15px 10px;border-bottom:1px solid var(--nav-shadow);margin-bottom:8px;transition:all 0.3s ease}
.menu-item:hover{background:var(--card);border-radius:8px;padding-left:15px}
.menu-item span{color:var(--text2)}
.menu-item span:last-child{font-weight:600;color:var(--text)}
.menu-item-description{font-size:0.85rem;color:var(--text2);margin-top:5px;width:100%;flex-basis:100%}
.review{border-bottom:1px solid var(--nav-shadow);padding:15px 0}
.review p{margin-bottom:5px;color:var(--text2)}
.review p:first-child{font-weight:600;color:var(--text)}
.review-form{margin-top:30px;display:flex;flex-direction:column;gap:15px}
.review-form input,.review-form textarea{padding:12px;font-size:1rem;width:100%;border:1px solid var(--nav-shadow);border-radius:8px;background-color:var(--input-bg);color:var(--input-text);transition:all 0.3s ease}
.review-form input:focus,.review-form textarea:focus{outline:none;border-color:#FF9800;box-shadow:0 0 0 2px rgba(255,152,0,0.2)}
.review-form button{background:var(--btn-bg);color:var(--btn-text);padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:transform 0.2s ease;align-self:flex-start}
.review-form button:hover{transform:scale(1.05)}
footer{text-align:center;padding:40px 20px;border-top:1px solid var(--nav-shadow);font-size:0.9rem;color:var(--text2);margin-top:20px}
.branch-filter{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.branch-filter-btn{background:var(--card);border:1px solid var(--nav-shadow);padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.3s ease}
.branch-filter-btn.active,.branch-filter-btn:hover{background:var(--btn-bg);color:var(--btn-text)}
.hidden{display:none}
.popular-badge{background:#FF9800;color:white;font-size:0.7rem;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:600}
@media (max-width:768px){.logo{width:120px;height:120px;margin-bottom:24px}.hero{padding:50px 16px 30px}.hero h1{font-size:2rem}.btn{padding:10px 18px;font-size:0.95rem;margin:4px 2px}.branch-card{flex:1 1 100%}.section{padding:30px 16px}h2{font-size:1.4rem}}@media (max-width:480px){.top-stripe{padding:0 10px}.back-btn,.theme-toggle{padding:6px 12px;font-size:12px}.hero h1{font-size:1.8rem}.hero p{font-size:0.9rem}.hotline{font-size:1rem}}
`;

// JavaScript functionality (theme toggle, menu filtering, reviews)
const MAINE_JS_FUNCTIONALITY = `
// Theme Toggle Functionality
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

// Review Form Functionality
const reviewForm = document.getElementById('review-form');
const reviewsList = document.getElementById('reviews-list');

if (reviewForm && reviewsList) {
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const reviewer = document.getElementById('reviewer').value.trim();
        const reviewText = document.getElementById('review-text').value.trim();
        
        if (reviewer && reviewText) {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            reviewElement.innerHTML = \`<p><strong>\${reviewer}</strong></p><p>\${reviewText}</p>\`;
            reviewsList.appendChild(reviewElement);
            reviewForm.reset();
            
            const thankYouMessage = document.createElement('p');
            thankYouMessage.textContent = 'Thank you for your review!';
            thankYouMessage.style.color = '#FF9800';
            thankYouMessage.style.fontWeight = '600';
            thankYouMessage.style.marginTop = '10px';
            reviewForm.appendChild(thankYouMessage);
            
            setTimeout(() => {
                thankYouMessage.remove();
            }, 3000);
        }
    });
}

// Menu Category Filter Functionality
const menuCategoryBtns = document.querySelectorAll('.menu-category-btn');
const menuCategorySections = document.querySelectorAll('.menu-category-section');

if (menuCategoryBtns.length > 0) {
    menuCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            menuCategoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter menu items
            menuCategorySections.forEach(section => {
                if (category === 'all' || section.getAttribute('data-category') === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

// Branch Filter Functionality
const branchFilterBtns = document.querySelectorAll('.branch-filter-btn');
const branchCards = document.querySelectorAll('.branch-card');

if (branchFilterBtns.length > 0) {
    branchFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            
            // Update active button
            branchFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter branches
            branchCards.forEach(card => {
                if (location === 'all' || card.getAttribute('data-location') === location) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Initialize the page
initializeTheme();
`;

// Find all restaurant HTML files
function findRestaurantFiles(dir) {
  const result = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`❌ Directory not found: ${dir}`);
    return result;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      result.push(...findRestaurantFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
      result.push(fullPath);
    }
  }
  
  return result;
}

// Apply Maine theme to a restaurant file
function applyMaineTheme(filePath) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Remove existing style and script tags (keep list manager)
    html = html.replace(/<style>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<script>[\s\S]*?<\/script>(?!\s*<\/body>)/gi, '');
    
    // Add Maine theme CSS
    const styleTag = `<style>${MAINE_THEME_CSS}</style>`;
    html = html.replace(/<head>[\s\S]*?(?=<\/head>)/, (match) => {
      return match + styleTag;
    });
    
    // Add Maine JavaScript functionality (before list manager)
    const scriptTag = `<script>${MAINE_JS_FUNCTIONALITY}</script>`;
    const bodyCloseIndex = html.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
      html = html.slice(0, bodyCloseIndex) + scriptTag + html.slice(bodyCloseIndex);
    }
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Applied Maine theme to: ${path.relative(ROOT, filePath)}`);
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🎨 Applying Maine theme to all restaurant pages...\n');

const restaurantFiles = findRestaurantFiles(CARDS_DIR);

if (restaurantFiles.length === 0) {
  console.log('❌ No restaurant HTML files found in:', CARDS_DIR);
  console.log('💡 Make sure the path to your cards folder is correct.');
  process.exit(1);
}

console.log(`📁 Found ${restaurantFiles.length} restaurant files\n`);

// Apply theme to each file
restaurantFiles.forEach(applyMaineTheme);

console.log('\n🎉 Successfully applied Maine theme to all restaurant pages!');
console.log('✨ All restaurants now have:');
console.log('   • Consistent styling and colors');
console.log('   • Dark/Light theme toggle');
console.log('   • Menu category filtering');
console.log('   • Branch location filtering');
console.log('   • Review system functionality');