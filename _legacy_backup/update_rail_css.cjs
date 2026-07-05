const fs = require('fs');
let css = fs.readFileSync('css/pages/profile.css', 'utf8');

// Replace .pv2-rail-title styles
const oldTitleRegex = /\.pv2-rail-title \{[\s\S]*?\.pv2-rail-title i \{[\s\S]*?\}/;

const newTitleStyles = `.pv2-rail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: lowercase;
  color: var(--white);
}

.pv2-rail-title i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: 6px;
}`;

css = css.replace(oldTitleRegex, newTitleStyles);

fs.writeFileSync('css/pages/profile.css', css);
console.log('Updated pv2-rail-title in profile.css.');
