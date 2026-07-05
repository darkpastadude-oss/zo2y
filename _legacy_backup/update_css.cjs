const fs = require('fs');
let css = fs.readFileSync('css/pages/profile.css', 'utf8');

// Replace old pv2-category-header CSS block
const oldCssRegex = /\.pv2-category-header \{[\s\S]*?\/\* === Empty State override for Rail in Category View === \*\//;

const newCss = `.pv2-category-header {
    display: flex;
    flex-direction: column;
    padding-top: 24px;
    margin-bottom: 24px;
}

.pv2-category-header-top {
    margin-bottom: 16px;
}

.btn.pv2-category-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-accent);
    background: transparent;
    border: none;
    padding: 0;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-transform: lowercase;
}
.btn.pv2-category-back:hover {
    color: rgba(245, 158, 11, 0.8);
}

.pv2-category-header-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.pv2-category-title-group {
    display: flex;
    flex-direction: column;
}

.category-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 4px 0;
    text-transform: lowercase;
}

.category-subtitle {
    font-size: 15px;
    color: var(--muted);
    margin: 0;
    text-transform: lowercase;
}

.pv2-category-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.pv2-category-actions .btn {
    width: 100%;
    justify-content: center;
    text-transform: lowercase;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 500;
}

.pv2-category-create {
    background: var(--color-accent);
    color: #0b1633;
    border: none;
}
.pv2-category-create:hover {
    background: rgba(245, 158, 11, 0.9);
}

.pv2-category-browse {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--white);
}
.pv2-category-browse:hover {
    background: var(--glass);
}

@media (min-width: 769px) {
    .pv2-category-header {
        padding-top: 32px;
        margin-bottom: 32px;
    }
    
    .btn.pv2-category-back {
        background: transparent;
        border: 1px solid var(--border);
        padding: 6px 12px;
        border-radius: 6px;
        color: var(--white);
        text-transform: capitalize;
    }
    .btn.pv2-category-back:hover {
        background: var(--glass);
        color: var(--white);
    }

    .pv2-category-header-main {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
    }

    .pv2-category-actions {
        flex-direction: row;
        width: auto;
        gap: 12px;
    }

    .pv2-category-actions .btn {
        width: auto;
    }
}

.pv2-category-content {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/* === Empty State override for Rail in Category View === */`;

css = css.replace(oldCssRegex, newCss);
fs.writeFileSync('css/pages/profile.css', css);
console.log('Updated profile.css layout.');
