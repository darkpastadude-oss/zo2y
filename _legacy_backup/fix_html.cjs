const fs = require('fs');
const file = 'profile.html';
let content = fs.readFileSync(file, 'utf8');

// Replace showShowcaseDetail with ProfileManager.showShowcaseDetail
content = content.replace(/onclick="showShowcaseDetail\(/g, 'onclick="ProfileManager.showShowcaseDetail(');

// Bump cache buster version
content = content.replace(/profile\.js\?v=([a-zA-Z0-9]+)/g, 'profile.js?v=20260627a');

fs.writeFileSync(file, content);
console.log('Successfully updated profile.html');
