const fs = require('fs');
let html = fs.readFileSync('profile.html', 'utf8');

const regex = /<div class="pv2-rail-title"><i class="(fas fa-[a-z-]+)"><\/i>\s*([^<]+)<\/div>/g;
html = html.replace(regex, (match, iconClass, text) => {
    return `<div class="pv2-rail-title">\n                            <i class="${iconClass}"></i> \n                            <span class="pv2-rail-title-base">${text.trim()}</span>\n                            <span class="pv2-rail-title-showcase hidden"></span>\n                        </div>`;
});

fs.writeFileSync('profile.html', html);
console.log('Updated rail titles.');
