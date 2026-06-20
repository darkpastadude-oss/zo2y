const fs = require('fs');
let htmlContent = fs.readFileSync('index.html', 'utf8');
htmlContent = htmlContent.replace(/ onerror="this\.onerror=null;this\.src='\/images\/fallback\/game\.svg'"/g, '');
fs.writeFileSync('index.html', htmlContent);

let jsContent = fs.readFileSync('js/pages/index.js', 'utf8');
jsContent = jsContent.replace(/, onerror: "[^"]+"/g, '');
fs.writeFileSync('js/pages/index.js', jsContent);
console.log('Removed onerror from index.html and index.js');
