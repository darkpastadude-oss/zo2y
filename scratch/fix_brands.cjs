const fs = require('fs');
const path = require('path');

const brandsJsPath = path.join(__dirname, '../js/pages/brands.js');
let js = fs.readFileSync(brandsJsPath, 'utf8');

js = js.replace(/card\.className = 'card brand-card';/, "card.className = 'brand-card';");
js = js.replace(/const wrap = img\.closest\('\.card-media'\);/, "const wrap = img.closest('.card-media, .brand-card-logo');");

const oldHtml = `      <div class="brand-card-logo card-media brand-cover is-loading-media">
        <img
          src="\${BRAND_IMAGE_PLACEHOLDER}"
          data-defer-src="\${escapeHtml(image)}"
          data-fallback-image="/newlogo.webp"
          data-home-image="1"
          data-image-ready="0"
          alt="\${escapeHtml(title)} logo"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="card-meta">
        <div class="card-meta-header">
          <span class="card-type"><i class="fa-solid \${escapeHtml(iconClass)}"></i> \${escapeHtml(label)}</span>
          \${trailingControl}
        </div>
        <div class="card-meta-top">
          <p class="card-name">\${escapeHtml(title)}</p>
        </div>
        <p class="card-sub">\${escapeHtml(subtitle)}</p>
        <p class="card-extra">\${escapeHtml(extra)}</p>
      </div>`;

const newHtml = `      <div class="brand-card-logo is-loading-media">
        <img
          src="\${BRAND_IMAGE_PLACEHOLDER}"
          data-defer-src="\${escapeHtml(image)}"
          data-fallback-image="/newlogo.webp"
          data-home-image="1"
          data-image-ready="0"
          alt="\${escapeHtml(title)} logo"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="card-meta-header">
        <span class="brand-chip"><i class="fa-solid \${escapeHtml(iconClass)}"></i> \${escapeHtml(label)}</span>
        \${trailingControl}
      </div>
      <div class="brand-card-name">\${escapeHtml(title)}</div>
      <div class="brand-card-meta">\${escapeHtml(subtitle)}</div>
      <div class="brand-card-desc">\${escapeHtml(extra)}</div>`;

js = js.replace(oldHtml, newHtml);
fs.writeFileSync(brandsJsPath, js, 'utf8');
console.log('Fixed brands.js');


const brandsCssPath = path.join(__dirname, '../css/pages/brands.css');
let css = fs.readFileSync(brandsCssPath, 'utf8');

css = css.replace(/padding:\s*14px\s*14px\s*56px;/, "padding: 14px;");
css = css.replace(/\.brand-grid \.card \{/g, ".brand-grid .brand-card {");

// Clean up the terrible overrides on mobile for .card-meta that we don't need anymore
css = css.replace(/\.brand-grid \.card-meta \{[\s\S]*?min-height: auto !important;\s*\}/, "");
css = css.replace(/\.brand-grid \.card-meta-top \{[\s\S]*?align-items: center !important;\s*\}/, "");

fs.writeFileSync(brandsCssPath, css, 'utf8');
console.log('Fixed brands.css');
