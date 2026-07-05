const fs = require('fs');
const file = 'c:/Users/sigma/OneDrive/Desktop/zo2ys/profile.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Desktop Legacy Navigation
// Find <div class="profile-section-shell profile-nav-shell"> ... </div>
// Note: It's around line 315-343. We'll use a regex to match it.
content = content.replace(/<div class="profile-section-shell profile-nav-shell">[\s\S]*?<\/div>\s*<\/div>\s*<div id="lists-tab">/, '<div id="lists-tab">');

// 2. Remove Mobile Legacy Navigation
// Find <div class="mobile-tabs"> ... </div> and <div class="profile-tab-group-row mobile" ... </div>
// It's around line 1330.
content = content.replace(/<div class="mobile-tabs">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Movies Section -->/, '<!-- Movies Section -->');

// 3. Inject Desktop Back Navigation
// Find <div class="section-header">\s*<div>\s*<h2 class="section-title" id="moviesTitle">
// and replace with the button above the title for ALL tabs.
const desktopTabs = ['movies', 'tv', 'anime', 'games', 'books', 'music', 'sports', 'travel', 'fashion', 'food', 'cars'];
for (const tab of desktopTabs) {
    const titleRegex = new RegExp(`(<h2 class="section-title" id="${tab}Title">)`, 'g');
    content = content.replace(titleRegex, `<button class="btn btn-secondary btn-sm mb-sm" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);" onclick="ProfileManager.backToProfile()"><i class="fas fa-arrow-left"></i> Back</button>\n                            $1`);
}

// 4. Inject Mobile Back Navigation
// Find <div class="mobile-section-title">\s*<span id="mobileMoviesTitle">
const mobileTabs = ['Movies', 'Tv', 'Anime', 'Games', 'Books', 'Music', 'Sports', 'Travel', 'Fashion', 'Food', 'Cars'];
for (const tab of mobileTabs) {
    const titleRegex = new RegExp(`(<span id="mobile${tab}Title">)`, 'g');
    content = content.replace(titleRegex, `<button class="mobile-action-btn secondary btn-base mb-0 mr-sm" onclick="ProfileManager.backToProfile()"><i class="fas fa-arrow-left"></i></button>\n                    $1`);
}

fs.writeFileSync(file, content);
console.log('Successfully updated profile.html navigation.');
