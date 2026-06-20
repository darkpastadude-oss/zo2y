const fs = require('fs');
const https = require('https');

let html = fs.readFileSync('index.html', 'utf8');
let js = html.match(/'\/storage\/v1\/object\/public\/brand-logos\/[^\s\"']+'/g) || [];
let urls = js.map(s => 'https://gfkhjbztayjyojsgdpgk.supabase.co' + s.slice(1, -1));

urls = [...new Set(urls)];

if (urls.length === 0) {
  console.log('No URLs found.');
  process.exit(0);
}

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url.split('/').pop() + ': ' + res.statusCode);
  }).on('error', (e) => {
    console.log(url.split('/').pop() + ': ERROR ' + e.message);
  });
});
