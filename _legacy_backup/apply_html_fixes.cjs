const fs = require('fs');
const file = 'profile.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix ListService Cache Bug
content = content.replace(/js\/list-utils\.js\?v=[a-zA-Z0-9]+/g, 'js/list-utils.js?v=20260627b');

// 2. Fix View All Routing (Bug 1 & 2)
// Replace showShowcaseDetail with showTab for all categories, handling pluralization for tabs
const tabMap = {
    'movie': 'movies',
    'tv': 'tv',
    'anime': 'anime',
    'game': 'games',
    'book': 'books',
    'music': 'music',
    'sports': 'sports',
    'car': 'cars',
    'travel': 'travel',
    'food': 'food',
    'fashion': 'fashion'
};

for (const [type, tab] of Object.entries(tabMap)) {
    const regex = new RegExp(`onclick="ProfileManager\\.showShowcaseDetail\\('${type}'\\); return false;"`, 'g');
    content = content.replace(regex, `onclick="ProfileManager.showTab('${tab}'); return false;"`);
}

fs.writeFileSync(file, content);
console.log('Successfully applied HTML fixes.');
