const fs = require('fs');
const path = require('path');

const profileHtmlPath = path.join(__dirname, '../profile.html');
const profileJsPath = path.join(__dirname, '../js/pages/profile.js');
const profileCssPath = path.join(__dirname, '../css/pages/profile.css');

// 1. Fix profile.html
let html = fs.readFileSync(profileHtmlPath, 'utf8');

const categoryViewRegex = /<!-- Category View \(Collections\) - Dynamically Replaces Profile Overview -->\s*<div id="pv2CategoryView".*?<!-- Rails rendered here -->\s*<\/div>\s*<\/div>\s*<\/div>/s;

const match = html.match(categoryViewRegex);
if (match) {
    const categoryViewHtml = match[0];
    html = html.replace(categoryViewRegex, '');
    html = html.replace('<!-- ===== MODALS (Shared by both Desktop and Mobile) ===== -->', categoryViewHtml + '\n\n    <!-- ===== MODALS (Shared by both Desktop and Mobile) ===== -->');
    fs.writeFileSync(profileHtmlPath, html, 'utf8');
    console.log('Fixed profile.html');
} else {
    console.log('Failed to match categoryView in profile.html');
}

// 2. Fix profile.js
let js = fs.readFileSync(profileJsPath, 'utf8');

const oldJsPattern1 = `                    const desktopView = document.querySelector('.desktop-only');
                    const mobileView = document.querySelector('.mobile-only');
                    const profileContainer = document.getElementById('pv2Overview')?.closest('.container');
                    
                    if (desktopView) desktopView.style.display = 'none';
                    if (mobileView) mobileView.style.display = 'none';
                    if (profileContainer) profileContainer.style.display = 'none';`;

const newJsPattern1 = `                    const desktopView = document.querySelector('.desktop-only');
                    const mobileView = document.querySelector('.mobile-only');
                    const pv2Overview = document.getElementById('pv2Overview');
                    const mobileOverviewPanel = document.getElementById('mobileOverviewPanel');
                    
                    if (pv2Overview) pv2Overview.style.display = 'none';
                    if (mobileOverviewPanel) mobileOverviewPanel.style.display = 'none';`;

js = js.replace(oldJsPattern1, newJsPattern1);

const oldJsPattern2 = `                if (categoryView) categoryView.style.display = 'none';
                const desktopView = document.querySelector('.desktop-only');
                const mobileView = document.querySelector('.mobile-only');
                const profileContainer = document.getElementById('pv2Overview')?.closest('.container');
                if (desktopView) desktopView.style.display = '';
                if (mobileView) mobileView.style.display = '';
                if (profileContainer) profileContainer.style.display = '';`;

const newJsPattern2 = `                if (categoryView) categoryView.style.display = 'none';
                const desktopView = document.querySelector('.desktop-only');
                const mobileView = document.querySelector('.mobile-only');
                const pv2Overview = document.getElementById('pv2Overview');
                const mobileOverviewPanel = document.getElementById('mobileOverviewPanel');
                if (desktopView) desktopView.style.display = '';
                if (mobileView) mobileView.style.display = '';
                if (pv2Overview) pv2Overview.style.display = '';
                if (mobileOverviewPanel) mobileOverviewPanel.style.display = '';`;

js = js.replace(oldJsPattern2, newJsPattern2);
fs.writeFileSync(profileJsPath, js, 'utf8');
console.log('Fixed profile.js');

// 3. Fix profile.css
let css = fs.readFileSync(profileCssPath, 'utf8');

const pv2RailRegex = /(\.pv2-rail\s*\{\s*display:\s*grid;\s*gap:\s*14px;)(\s*\})/;
css = css.replace(pv2RailRegex, '$1\n  max-width: fit-content;\n  margin: 0 auto;$2');

const mph2RowRegex = /(\.mph2-row\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*12px;)(\s*\})/;
css = css.replace(mph2RowRegex, '$1\n  max-width: fit-content;\n  margin: 0 auto;$2');

fs.writeFileSync(profileCssPath, css, 'utf8');
console.log('Fixed profile.css');
