import fs from 'fs';

// Test Wikimedia Commons search for logos via a proper search query
// Also test SVG downloads with proper delay/headers
const delay = ms => new Promise(res => setTimeout(res, ms));

async function searchWikimediaLogo(name) {
  // Search Wikimedia Commons for SVG logos of the brand
  const q = `${name} logo`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=5&format=json`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)',
      'Accept': 'application/json',
    }
  });
  const data = await res.json();
  const results = data?.query?.search || [];
  
  // Filter for SVG results
  const svgResults = results.filter(r => r.title?.endsWith('.svg'));
  if (!svgResults.length) return null;
  
  // Get the file URL from the first SVG result
  const fileTitle = svgResults[0].title;
  const fileUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle.replace('File:', ''))}`;
  
  return { fileTitle, fileUrl };
}

const testBrands = ['Shake Shack', 'Five Guys', 'Blaze Pizza', 'Buffalo Wild Wings', 'Panda Express'];

for (const name of testBrands) {
  await delay(500);
  const result = await searchWikimediaLogo(name);
  console.log(`${name}:`, result?.fileTitle, '->', result?.fileUrl?.slice(0,80));
}
