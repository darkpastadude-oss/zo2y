import fs from 'fs';

// Test alternative SVG sources
const testSources = [
  // WorldVectorLogo
  "https://worldvectorlogo.com/logo/shake-shack",
  // LogoTyp.us
  "https://logotyp.us/logo/shake-shack.svg",
  // Clearbit (logo-only, no auth needed for SVG)
  "https://logo.clearbit.com/shakeshack.com?size=200&format=svg",
  // VectorWiki
  "https://vectorwiki.com/images/shake-shack.svg",
  // Official brand domains via direct SVG
  "https://corporate.shakeshack.com/assets/logo.svg",
  // seeklogo
  "https://seeklogo.com/images/S/shake-shack-logo-B9BF1B5A28-seeklogo.com.png",
];

for (const url of testSources) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/svg+xml,image/*,*/*',
      },
      redirect: 'follow',
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok) {
      const text = await res.text();
      console.log(`✓ ${url.slice(0,60)}: ${ct.slice(0,30)} len=${text.length} svg=${text.includes('<svg')}`);
    } else {
      console.log(`✗ ${url.slice(0,60)}: HTTP ${res.status}`);
    }
  } catch(e) {
    console.log(`ERROR ${url.slice(0,60)}: ${e.message}`);
  }
}
