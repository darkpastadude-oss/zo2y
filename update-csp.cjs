const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('connect-src \'self\'') && !content.includes('https://api.rawg.io')) {
    content = content.replace(/connect-src 'self'/, "connect-src 'self' https://api.rawg.io");
    fs.writeFileSync(f, content);
  }
});

let guardrails = fs.readFileSync('backend/lib/guardrails.js', 'utf8');
if (!guardrails.includes('https://api.rawg.io')) {
  guardrails = guardrails.replace(/connect-src 'self'/, "connect-src 'self' https://api.rawg.io");
  fs.writeFileSync('backend/lib/guardrails.js', guardrails);
}
console.log("CSP updated.");
