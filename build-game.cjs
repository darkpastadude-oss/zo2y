const fs = require('fs');

let c = fs.readFileSync('brand.html', 'utf8');

c = c.replace(/brand/g, 'game');
c = c.replace(/Brand/g, 'Game');
c = c.replace(/data-elevated-category="food"/g, 'data-elevated-category="games"');
c = c.replace(/js\/pages\/game\.js\?v=20260605l/g, 'js/pages/game.js?v=20260620a');

fs.writeFileSync('game.html', c);
console.log("Created game.html");
