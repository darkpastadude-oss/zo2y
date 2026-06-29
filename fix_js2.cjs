const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'js/pages/profile.js');
let js = fs.readFileSync(jsPath, 'utf8');

// Fix 1: Add window.scrollTo(0, 0) inside showCollectionDetail
const showCollectionDetailRegex = /(async function showCollectionDetail\(listId, contentType, listType\) \{[\s\S]*?const categoryView = document\.getElementById\('pv2CategoryView'\);\s*if \(categoryView\) categoryView\.style\.display = 'none';)/;
js = js.replace(showCollectionDetailRegex, `$1\n                window.scrollTo({ top: 0, behavior: 'smooth' });`);

// Fix 2: Skip showTab in openCollectionPage
const openCollectionPageRegex = /(if \(currentTab !== tabName\) \{\s*showTab\(tabName, \{ skipUrlSync: true, skipRender: true \}\);\s*\})/;
js = js.replace(openCollectionPageRegex, `// Update tab state without triggering full render/layout toggle
                if (currentTab !== tabName) {
                    currentTab = tabName;
                    document.querySelectorAll('.profile-primary-tab').forEach(t => t.classList.remove('active'));
                    const activeTabBtn = document.querySelector(\`.profile-primary-tab[data-tab="\${tabName}"]\`);
                    if (activeTabBtn) activeTabBtn.classList.add('active');
                }`);

// Fix 3: Add loading states to showMovieDetail and others
const showMovieDetailRegex = /(if \(detailView\) \{\s*detailView\.style\.display = 'block';\s*detailView\.classList\.add\('active', 'rendered'\);)/;
js = js.replace(showMovieDetailRegex, `$1\n                        const titleEl = document.getElementById('movieDetailName'); if (titleEl) titleEl.innerText = 'Loading...';\n                        const descEl = document.getElementById('movieDetailDescription'); if (descEl) descEl.innerText = '';\n                        const itemsContainer = document.getElementById('movieDetailItems'); if (itemsContainer) itemsContainer.innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';`);

fs.writeFileSync(jsPath, js, 'utf8');
console.log('Fixed profile.js bugs');
