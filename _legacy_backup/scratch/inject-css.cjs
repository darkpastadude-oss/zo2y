const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const linksToInject = `
    <link rel="stylesheet" href="css/components.css?v=20260622">
    <link rel="stylesheet" href="css/global-lowercase.css?v=20260622">
`;

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already injected
  if (content.includes('href="css/components.css') && content.includes('href="css/global-lowercase.css')) {
    return;
  }

  // Remove existing partial injections if they exist to avoid duplicates
  content = content.replace(/<link rel="stylesheet" href="css\/components\.css[^>]*>\s*/g, '');
  content = content.replace(/<link rel="stylesheet" href="css\/global-lowercase\.css[^>]*>\s*/g, '');

  const headEnd = content.indexOf('</head>');
  if (headEnd !== -1) {
    content = content.substring(0, headEnd) + linksToInject + content.substring(headEnd);
    fs.writeFileSync(filePath, content);
    console.log(`Injected into ${file}`);
  }
});
