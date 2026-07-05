const fs = require('fs');
const path = require('path');

const brandsCssPath = path.join(__dirname, '../css/pages/brands.css');
let css = fs.readFileSync(brandsCssPath, 'utf8');

// The mobile media query starts around line 484. We want to replace the `.brand-grid .card-meta-header` and down to `.brand-grid .card-open-link` rules.
const regex = /\.brand-grid \.card-meta-header \{[\s\S]*?\.brand-grid \.card-open-link \{[\s\S]*?\}/;

const replacement = `.brand-grid .brand-card {
    padding: 8px !important;
    gap: 6px !important;
    border-radius: 12px !important;
    min-height: auto !important;
  }
  
  .brand-grid .brand-card-logo {
    padding: 8px !important;
    border-radius: 10px !important;
  }

  .brand-grid .card-meta-header {
    gap: 6px !important;
    margin-bottom: 2px !important;
  }

  .brand-grid .brand-chip {
    padding: 2px 4px !important;
    font-size: 10px !important;
  }
  
  .brand-grid .card-menu-btn {
    width: 24px !important;
    height: 24px !important;
    border-radius: 6px !important;
  }

  .brand-grid .brand-card-name {
    font-size: 13px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    width: 100%;
  }

  .brand-grid .brand-card-meta {
    font-size: 11px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    color: #9fb1d6 !important;
    width: 100%;
  }

  .brand-grid .brand-card-desc {
    display: none !important;
  }`;

if (css.match(regex)) {
  css = css.replace(regex, replacement);
  fs.writeFileSync(brandsCssPath, css, 'utf8');
  console.log('Fixed mobile rules in brands.css');
} else {
  console.log('Could not find the mobile rules block to replace!');
}
