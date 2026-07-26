import fs from 'fs';

const WIKI_UA = 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)';

// Test Wikimedia Commons search API
async function searchWikimediaForLogo(name) {
  const q = `${name} logo`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=10&format=json`;
  console.log('Searching:', url.slice(0,120));
  const res = await fetch(url, { headers: { 'User-Agent': WIKI_UA } });
  console.log('Response status:', res.status);
  const data = await res.json();
  const results = data?.query?.search || [];
  console.log('Total results:', data?.query?.searchinfo?.totalhits, 'Returned:', results.length);
  const svgs = results.filter(r => r.title?.toLowerCase().endsWith('.svg'));
  console.log('SVG results:', svgs.map(r => r.title));
  return svgs[0]?.title;
}

// Test download
async function testDownload(fileTitle) {
  const encoded = encodeURIComponent(fileTitle.replace(/^File:/i, ''));
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
  console.log('Downloading:', url);
  const res = await fetch(url, { headers: { 'User-Agent': WIKI_UA }, redirect: 'follow' });
  console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
  console.log('Final URL:', res.url.slice(0,80));
  if (res.ok) {
    const text = await res.text();
    console.log('Length:', text.length, 'Has <svg:', text.includes('<svg'));
  }
}

// First search
const title = await searchWikimediaForLogo("Shake Shack");
console.log('Found:', title);
if (title) await testDownload(title);
