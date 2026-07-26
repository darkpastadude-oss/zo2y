import fs from 'fs';

const testUrls = {
  "Blaze Pizza": "https://upload.wikimedia.org/wikipedia/commons/2/20/Blaze-Pizza-Logo.svg",
  "Five Guys": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Five-guys-logo.svg",
  "Shake Shack": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Shake_Shack_logo.svg",
  "Buffalo Wild Wings": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Buffalo_Wild_Wings_logo.svg",
  "Panda Express": "https://upload.wikimedia.org/wikipedia/commons/c/c0/Panda_Express_logo.svg",
  "In-N-Out Burger": "https://upload.wikimedia.org/wikipedia/commons/b/b6/In-N-Out_Burger_logo.svg",
  "White Castle": "https://upload.wikimedia.org/wikipedia/commons/7/7f/White_Castle_logo.svg",
  "Sweetgreen": "https://upload.wikimedia.org/wikipedia/commons/0/09/Sweetgreen_logo.svg",
};

for (const [name, url] of Object.entries(testUrls)) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; zo2y-brand-bot/1.0)' }, redirect: 'follow' });
  const contentType = res.headers.get('content-type') || '';
  if (res.ok) {
    if (contentType.includes('svg')) {
      const text = await res.text();
      const hasSvg = text.includes('<svg');
      console.log(`✓ ${name}: SVG (${text.length} bytes) hasTag=${hasSvg}`);
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`~ ${name}: ${contentType} (${buf.length} bytes)`);
    }
  } else {
    console.log(`✗ ${name}: HTTP ${res.status} - ${url}`);
  }
}
