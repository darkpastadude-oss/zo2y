const fs = require('fs');

const addDomains = (content) => {
  if (content.includes("connect-src 'self'")) {
    let replaced = content;
    if (!replaced.includes('https://cdn-images.dzcdn.net')) {
      replaced = replaced.replace(/connect-src 'self'/, "connect-src 'self' https://cdn-images.dzcdn.net");
    }
    if (!replaced.includes('https://i.scdn.co')) {
      replaced = replaced.replace(/connect-src 'self'/, "connect-src 'self' https://i.scdn.co");
    }
    return replaced;
  }
  return content;
};

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = addDomains(content);
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
  }
});

let guardrails = fs.readFileSync('backend/lib/guardrails.js', 'utf8');
let newGuardrails = addDomains(guardrails);
if (guardrails !== newGuardrails) {
  fs.writeFileSync('backend/lib/guardrails.js', newGuardrails);
}

let headers = fs.readFileSync('_headers', 'utf8');
let newHeaders = addDomains(headers);
if (headers !== newHeaders) {
  fs.writeFileSync('_headers', newHeaders);
}

console.log("CSP updated in all files.");
