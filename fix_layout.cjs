const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, 'profile.html');
let html = fs.readFileSync(profilePath, 'utf8');

// Replace "view list" with "collections"
html = html.replace(/view list <i class="fas fa-chevron-right"><\/i><\/a>/g, 'collections <i class="fas fa-chevron-right"></i></a>');

// Remove legacy lists panel mobile tabs and back bar
const backBarStart = html.indexOf('                <!-- Back to overview -->');
const endIndex = html.indexOf('            <!-- Movies Section -->');
if (backBarStart !== -1 && endIndex !== -1) {
    html = html.substring(0, backBarStart) + html.substring(endIndex);
}

fs.writeFileSync(profilePath, html, 'utf8');
console.log('Done profile.html');

const jsPath = path.join(__dirname, 'js/pages/profile.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(
    "const desktopView = document.querySelector('.desktop-only');\n                    if (desktopView) desktopView.style.display = '';\n                    const overview = document.getElementById('pv2Overview');",
    "const desktopView = document.querySelector('.desktop-only');\n                    if (desktopView) desktopView.style.display = '';\n                    const profileContainer = document.getElementById('pv2Overview')?.closest('.container');\n                    if (profileContainer) profileContainer.style.display = '';\n                    const overview = document.getElementById('pv2Overview');"
);
fs.writeFileSync(jsPath, js, 'utf8');
console.log('Done profile.js');
