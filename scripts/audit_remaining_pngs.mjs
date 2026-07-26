import fs from 'fs';
import path from 'path';

const fashionDir = 'public/brand-assets/fashion';
const foodDir = 'public/brand-assets/food';

const fashionFiles = fs.readdirSync(fashionDir);
const foodFiles = fs.readdirSync(foodDir);

console.log('AUDITING ALL LOCAL BRAND ASSETS:');

fashionFiles.forEach(f => {
  const stat = fs.statSync(path.join(fashionDir, f));
  if (stat.size < 500) {
    console.warn(`⚠ SMALL / SUSPECT FASHION ASSET: ${f} (${stat.size} bytes)`);
  }
});

foodFiles.forEach(f => {
  const stat = fs.statSync(path.join(foodDir, f));
  if (stat.size < 500) {
    console.warn(`⚠ SMALL / SUSPECT FOOD ASSET: ${f} (${stat.size} bytes)`);
  }
});

console.log('Audit completed!');
