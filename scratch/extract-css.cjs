const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../css');
const profileCssPath = path.join(cssDir, 'pages/profile.css');
const indexCssPath = path.join(cssDir, 'pages/index.css');
const componentsCssPath = path.join(cssDir, 'components.css');

let profileCss = fs.readFileSync(profileCssPath, 'utf8');

const btnStart = profileCss.indexOf('/* === BUTTONS === */');
const formsStart = profileCss.indexOf('/* === FORMS === */');

if (btnStart === -1 || formsStart === -1) {
  console.error("Could not find boundaries in profile.css");
  process.exit(1);
}

const extractedCss = profileCss.substring(btnStart, formsStart);
profileCss = profileCss.substring(0, btnStart) + profileCss.substring(formsStart);

fs.writeFileSync(componentsCssPath, extractedCss);
console.log(`Wrote ${extractedCss.length} bytes to components.css`);
fs.writeFileSync(profileCssPath, profileCss);
console.log(`Updated profile.css`);

if (fs.existsSync(indexCssPath)) {
  let indexCss = fs.readFileSync(indexCssPath, 'utf8');
  const indexBtnStart = indexCss.indexOf('/* === BUTTONS === */');
  const indexFormsStart = indexCss.indexOf('/* === FORMS === */');
  if (indexBtnStart !== -1 && indexFormsStart !== -1) {
    indexCss = indexCss.substring(0, indexBtnStart) + indexCss.substring(indexFormsStart);
    fs.writeFileSync(indexCssPath, indexCss);
    console.log(`Updated index.css`);
  } else {
    console.log(`Could not find boundaries in index.css`);
  }
}
