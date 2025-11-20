// apply-maine-theme.cjs
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CARDS_DIR = path.join(ROOT, 'cards'); // adjust if needed

// Maine theme CSS
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
}
body{background-color:var(--bg);color:var(--text);transition:background-color 0.3s ease,color 0.3s ease;line-height:1.6}
.btn{padding:12px 24px;border-radius:8px;background:var(--btn-bg);color:var(--btn-text);border:none;cursor:pointer;transition:all 0.2s ease;font-weight:600}
.btn:hover{transform:scale(1.03)}
.section{max-width:900px;margin:0 auto;padding:40px 20px}
`;

// Maine JS (theme toggle, menu & branch filters only)
const MAINE_JS = `
// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  if(themeToggle) themeToggle.textContent = theme==='dark'?'☀️ Light Mode':'🌙 Dark Mode';
  localStorage.setItem('restaurant-theme',theme);
}
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme')||'light';
  applyTheme(current==='light'?'dark':'light');
}
function initializeTheme(){
  const saved=localStorage.getItem('restaurant-theme');
  if(saved) applyTheme(saved);
  else applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
}
if(themeToggle) themeToggle.addEventListener('click',toggleTheme);
initializeTheme();

// Menu Category Filter
const menuBtns=document.querySelectorAll('.menu-category-btn');
const menuSections=document.querySelectorAll('.menu-category-section');
if(menuBtns.length>0){
  menuBtns.forEach(btn=>{
    btn.addEventListener('click',function(){
      const category=this.getAttribute('data-category');
      menuBtns.forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      menuSections.forEach(section=>{
        section.style.display=(category==='all'||section.getAttribute('data-category')===category)?'block':'none';
      });
    });
  });
}

// Branch Filter
const branchBtns=document.querySelectorAll('.branch-filter-btn');
const branchCards=document.querySelectorAll('.branch-card');
if(branchBtns.length>0){
  branchBtns.forEach(btn=>{
    btn.addEventListener('click',function(){
      const loc=this.getAttribute('data-location');
      branchBtns.forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      branchCards.forEach(card=>{
        card.style.display=(loc==='all'||card.getAttribute('data-location')===loc)?'block':'none';
      });
    });
  });
}
`;

// find all restaurant HTML files
function findRestaurantFiles(dir){
  const result=[];
  if(!fs.existsSync(dir)) return result;
  const entries=fs.readdirSync(dir,{withFileTypes:true});
  for(const entry of entries){
    const fullPath=path.join(dir,entry.name);
    if(entry.isDirectory()) result.push(...findRestaurantFiles(fullPath));
    else if(entry.isFile()&&entry.name.endsWith('.html')&&entry.name!=='index.html') result.push(fullPath);
  }
  return result;
}

// apply theme to one file
function applyThemeToFile(filePath){
  try{
    let html=fs.readFileSync(filePath,'utf8');

    // inject CSS inside <head>
    const styleTag=`<style>${MAINE_THEME_CSS}</style>`;
    if(html.includes('</head>')) html=html.replace('</head>',styleTag+'\n</head>');
    else html=styleTag+'\n'+html;

    // inject JS before </body>
    const scriptTag=`<script>${MAINE_JS}</script>`;
    if(html.includes('</body')) html=html.replace('</body>',scriptTag+'\n</body>');
    else html+=scriptTag;

    fs.writeFileSync(filePath,html,'utf8');
    console.log('✅ Applied Maine theme to:',filePath);
  }catch(err){
    console.log('❌ Error processing',filePath,':',err.message);
  }
}

// main
console.log('🎨 Applying Maine theme to all restaurant pages...\n');
const files=findRestaurantFiles(CARDS_DIR);
if(files.length===0){
  console.log('❌ No restaurant HTML files found in',CARDS_DIR);
  process.exit(1);
}
files.forEach(applyThemeToFile);
console.log('\n🎉 Maine theme applied! Reviews script is untouched.');
