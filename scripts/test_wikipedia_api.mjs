import fs from 'fs';

// Test Wikipedia API approach - use page image API
async function testWikiAPI(name) {
  const encoded = encodeURIComponent(name);
  
  // Method 1: Wikipedia API for page images (gets the main image of article)
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&piprop=original&format=json&redirects=1`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  
  console.log(`${name}:`);
  console.log(`  Page title: ${page?.title}`);
  console.log(`  Image URL: ${page?.original?.source}`);
  
  if (page?.original?.source) {
    // Fetch the actual image
    const imgUrl = page.original.source;
    // For Wikimedia-hosted images, get via the Wikimedia REST API (different from direct upload.wikimedia.org)
    const imgRes = await fetch(imgUrl);
    console.log(`  Image status: ${imgRes.status}, type: ${imgRes.headers.get('content-type')}`);
    if (imgRes.ok) {
      if (imgUrl.endsWith('.svg')) {
        const text = await imgRes.text();
        console.log(`  SVG length: ${text.length}, has <svg: ${text.includes('<svg')}`);
      } else {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        console.log(`  PNG size: ${buf.length} bytes`);
      }
    }
  }
}

// Test a few brands
await testWikiAPI("Shake Shack");
await testWikiAPI("Five Guys");
await testWikiAPI("Blaze Pizza");
await testWikiAPI("Buffalo Wild Wings");
