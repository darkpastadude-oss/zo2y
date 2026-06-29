const fs = require('fs');

let html = fs.readFileSync('profile.html', 'utf8');
html = html.replace(/view all <i class="fas fa-arrow-right"><\/i>/g, 'view list <i class="fas fa-chevron-right"></i>');
fs.writeFileSync('profile.html', html);

let js = fs.readFileSync('js/pages/profile.js', 'utf8');
js = js.replace(/view list <i class="fas fa-arrow-right"><\/i>/g, 'view list <i class="fas fa-chevron-right"></i>');
fs.writeFileSync('js/pages/profile.js', js);

console.log('Updated view list icons.');
