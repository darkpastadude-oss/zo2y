// convert-simple.js - Fixed version
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting restaurant page generation...');

// Your restaurant data (shortened for testing)
const restaurants = [
  { slug: 'mori', name: 'Mori Sushi', desc: 'Modern sushi chain', rating: 4.7, image: 'mori.png', category: 'Japanese' },
  { slug: 'kilo', name: 'Kilo Kebab', desc: 'Charcoal-grilled kebabs', rating: 4.5, image: 'kilo.png', category: 'Middle Eastern' },
  { slug: '88', name: 'Pizza 88', desc: 'Wood-fired pizza', rating: 4.3, image: '88.jpg', category: 'Pizza' }
];

// Simple template
const template = `
<!DOCTYPE html>
<html>
<head>
<title>{{name}}</title>
<style>
body { font-family: Arial; margin: 0; padding: 20px; }
.hero { text-align: center; padding: 40px 0; }
.logo { width: 100px; height: 100px; border-radius: 50%; }
</style>
</head>
<body>
<div class="hero">
  <h1>{{name}}</h1>
  <p>{{desc}}</p>
  <div>⭐ {{rating}}/5</div>
  <a href="../index.html">← Back</a>
</div>
</body>
</html>
`;

// Create cards directory
const cardsDir = './cards';
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir);
  console.log('📁 Created cards directory');
}

// Generate files
restaurants.forEach(restaurant => {
  let html = template;
  html = html.replace(/{{name}}/g, restaurant.name);
  html = html.replace(/{{desc}}/g, restaurant.desc);
  html = html.replace(/{{rating}}/g, restaurant.rating);
  
  const filePath = path.join(cardsDir, `${restaurant.slug}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`✅ Created: ${restaurant.slug}.html`);
});

console.log('🎉 Success! Created ' + restaurants.length + ' restaurant pages');
console.log('📁 Check the /cards/ folder');