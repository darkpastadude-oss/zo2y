const fs = require('fs');

let html = fs.readFileSync('profile.html', 'utf8');

// 1. Update pv2CategoryView header
const oldHeaderRegex = /<div class="pv2-category-header">[\s\S]*?<div class="pv2-category-content" id="pv2CategoryContent">/;

const newHeader = `<div class="pv2-category-header">
                <div class="pv2-category-header-top">
                    <button class="btn pv2-category-back" onclick="ProfileManager.backToProfile()">
                        <i class="fas fa-arrow-left"></i> <span id="pv2CategoryBackText">Overview</span>
                    </button>
                </div>
                <div class="pv2-category-header-main">
                    <div class="pv2-category-title-group">
                        <h1 class="category-title" id="pv2CategoryTitle">Category</h1>
                        <p class="category-subtitle" id="pv2CategorySubtitle">Organize your favorites</p>
                    </div>
                    <div class="pv2-category-actions">
                        <button class="btn btn-primary pv2-category-create" id="pv2CategoryCreateBtn">
                            <i class="fas fa-plus"></i> <span class="pv2-category-create-text">create list</span>
                        </button>
                        <button class="btn btn-outline pv2-category-browse" id="pv2CategoryBrowseBtn" onclick="ProfileManager.browseCategory()">
                            <i id="pv2CategoryBrowseIcon" class="fas fa-search"></i> <span id="pv2CategoryBrowseText">browse</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="pv2-category-content" id="pv2CategoryContent">`;

html = html.replace(oldHeaderRegex, newHeader);

// 2. Update all pv2-rail-title to include showcase suffix
const railRegex = /<div class="pv2-rail-title"><i class="(fas fa-[a-z-]+)"><\/i>\s*([^<]+)<\/div>/g;
html = html.replace(railRegex, (match, iconClass, text) => {
    return `<div class="pv2-rail-title">
                                <i class="${iconClass}"></i>
                                <span class="pv2-rail-title-base">${text.trim()}</span>
                                <span class="pv2-rail-title-showcase hidden"></span>
                            </div>`;
});

fs.writeFileSync('profile.html', html);
console.log('Updated profile.html layout successfully.');
