import fs from 'fs';
const delay = ms => new Promise(res => setTimeout(res, ms));

async function testDownload(name, fileTitle) {
  await delay(300);
  const fileUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle.replace('File:', ''))}`;
  
  const res = await fetch(fileUrl, {
    headers: {
      'User-Agent': 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)',
    },
    redirect: 'follow',
  });
  
  const finalUrl = res.url;
  const ct = res.headers.get('content-type') || '';
  
  if (res.ok && ct.includes('svg')) {
    const text = await res.text();
    console.log(`✓ ${name}: SVG (${text.length} bytes), final URL: ${finalUrl.slice(0,80)}`);
    console.log(`  Has <svg: ${text.includes('<svg')}`);
    return text;
  } else if (res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`~ ${name}: ${ct} (${buf.length} bytes)`);
  } else {
    console.log(`✗ ${name}: HTTP ${res.status} from ${fileUrl.slice(0,80)}`);
  }
  return null;
}

// Test the ones that worked
await testDownload("Shake Shack", "File:Shake Shack logo.svg");
await testDownload("Five Guys", "File:Five Guys logo.svg");
