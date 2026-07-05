const fs = require('fs');
let css = fs.readFileSync('css/pages/profile.css', 'utf8');

const regex = /\.mph2-row-label \{[\s\S]*?\.mph2-row-label i \{[\s\S]*?\}/;

const newStyles = `.mph2-row-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: lowercase;
  color: var(--white);
}

.mph2-row-label i {
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

if (regex.test(css)) {
    css = css.replace(regex, newStyles);
    fs.writeFileSync('css/pages/profile.css', css);
    console.log('Updated mph2-row-label');
} else {
    console.log('Regex did not match mph2-row-label');
}
