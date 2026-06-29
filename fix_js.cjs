const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'js/pages/profile.js');
let js = fs.readFileSync(jsPath, 'utf8');

const targetRegex = /const desktopView = document\.querySelector\('\.desktop-only'\);\s*if \(desktopView\) desktopView\.style\.display = '';\s*const overview = document\.getElementById\('pv2Overview'\);/;
const replacement = `const desktopView = document.querySelector('.desktop-only');
                    if (desktopView) desktopView.style.display = '';
                    const profileContainer = document.getElementById('pv2Overview')?.closest('.container');
                    if (profileContainer) profileContainer.style.display = '';
                    const overview = document.getElementById('pv2Overview');`;

js = js.replace(targetRegex, replacement);

fs.writeFileSync(jsPath, js, 'utf8');
console.log('Done profile.js');
