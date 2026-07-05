const fs = require('fs');

// 1. Update HTML
let html = fs.readFileSync('profile.html', 'utf8');

const oldHeaderRegex = /<div class="pv2-category-header">[\s\S]*?<div class="pv2-category-content" id="pv2CategoryContent">/;

const newHeader = `<div class="pv2-category-header">
                <div class="pv2-category-header-top">
                    <button class="btn pv2-category-back" onclick="ProfileManager.backToProfile()">
                        <i class="fas fa-arrow-left"></i> <span id="pv2CategoryBackText">Overview</span>
                    </button>
                </div>
                
                <h1 class="category-title" id="pv2CategoryTitle">Category</h1>
                <p class="category-subtitle" id="pv2CategorySubtitle">Organize your favorites</p>
                
                <div class="pv2-category-actions">
                    <button class="btn pv2-category-create" id="pv2CategoryCreateBtn">
                        <i class="fas fa-plus"></i> <span class="pv2-category-create-text">Create List</span>
                    </button>
                    <button class="btn pv2-category-browse" id="pv2CategoryBrowseBtn" onclick="ProfileManager.browseCategory()">
                        <i id="pv2CategoryBrowseIcon" class="fas fa-search"></i> <span id="pv2CategoryBrowseText">Browse</span>
                    </button>
                </div>
            </div>
            
            <div class="pv2-category-content" id="pv2CategoryContent">`;

html = html.replace(oldHeaderRegex, newHeader);
fs.writeFileSync('profile.html', html);
console.log('Updated profile.html');

// 2. Update CSS
let css = fs.readFileSync('css/pages/profile.css', 'utf8');

const oldCssRegex = /\.pv2-category-header \{[\s\S]*?\/\* === Empty State override for Rail in Category View === \*\//;

const newCss = `.pv2-category-header {
    display: flex;
    flex-direction: column;
    padding-top: 24px;
    margin-bottom: 32px;
}

.pv2-category-header-top {
    display: flex;
    margin-bottom: 32px;
}

.btn.pv2-category-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    background: transparent;
    border: none;
    padding: 4px 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-transform: capitalize;
    transition: color 0.2s ease;
}
.btn.pv2-category-back:hover {
    color: var(--white);
}

.category-title {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 8px 0;
    text-transform: capitalize;
    color: var(--white);
}

.category-subtitle {
    font-size: 15px;
    color: var(--muted);
    margin: 0 0 32px 0;
    font-weight: 400;
}

.pv2-category-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.pv2-category-actions .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 8px;
    text-transform: capitalize;
    transition: all 0.2s ease;
    width: 100%;
}

.pv2-category-create {
    color: var(--color-accent);
    background: transparent;
    border: 1px solid var(--color-accent);
}
.pv2-category-create:hover {
    background: rgba(245, 158, 11, 0.1);
}

.pv2-category-browse {
    color: var(--white);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.pv2-category-browse:hover {
    background: rgba(255, 255, 255, 0.1);
}

@media (min-width: 769px) {
    .pv2-category-header {
        padding-top: 48px;
        margin-bottom: 48px;
    }
    
    .pv2-category-header-top {
        margin-bottom: 40px;
    }

    .category-title {
        font-size: 40px;
        margin-bottom: 12px;
    }
    
    .category-subtitle {
        font-size: 16px;
        margin-bottom: 40px;
    }

    .pv2-category-actions {
        flex-direction: row;
        width: auto;
        gap: 16px;
    }

    .pv2-category-actions .btn {
        width: auto;
    }
}

.pv2-category-content {
    display: flex;
    flex-direction: column;
    gap: 40px;
}

/* === Empty State override for Rail in Category View === */`;

css = css.replace(oldCssRegex, newCss);
fs.writeFileSync('css/pages/profile.css', css);
console.log('Updated profile.css');
