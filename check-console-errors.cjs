const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

// Simple static server with MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';
  if (filePath === './favicon.ico') { res.writeHead(404); return res.end(); }
  
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(JSON.stringify(err)); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

(async () => {
  server.listen(8080);
  console.log('Server running on http://localhost:8080');
  
  const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html') && !f.includes('blank'));
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = {};
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const p = page.url().split('/').pop().split('?')[0];
      if (!errors[p]) errors[p] = [];
      errors[p].push('[' + msg.type() + '] ' + msg.text() + ' (URL: ' + (msg.location().url || '') + ')');
    }
  });
  
  page.on('pageerror', err => {
    const p = page.url().split('/').pop().split('?')[0];
    if (!errors[p]) errors[p] = [];
    errors[p].push('[pageerror] ' + err.message);
  });

  for (const p of htmlFiles) {
    try {
      console.log('Visiting: ' + p);
      await page.goto('http://localhost:8080/' + p, { waitUntil: 'networkidle', timeout: 6000 });
      await page.waitForTimeout(500); // Wait for async operations
    } catch(e) {
      console.log('Timeout on: ' + p);
    }
  }
  
  await browser.close();
  server.close();
  
  console.log('\n--- ERRORS FOUND ---');
  console.log(JSON.stringify(errors, null, 2));
  console.log('--- END ERRORS ---');
})();
