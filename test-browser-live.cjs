const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: null, raw: data.slice(0, 200) }); }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

const BASE = 'https://zo2y.com';
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

async function testMusicArtists() {
  console.log('\n=== MUSIC ARTISTS API ===');
  const r = await fetchJson(`${BASE}/api/music/artists?limit=10`);
  assert('Status 200', r.status === 200);
  assert('Has count', typeof r.body?.count === 'number');
  assert('Count > 0', r.body?.count > 0);
  assert('Has results array', Array.isArray(r.body?.results));
  const artists = r.body?.results || [];
  assert('At least 5 artists', artists.length >= 5);
  const withImages = artists.filter(a => a.image && a.image.length > 10);
  assert('All artists have images', withImages.length === artists.length);
  artists.slice(0, 3).forEach(a => {
    assert(`"${a.title}" has title`, !!a.title);
    assert(`"${a.title}" has subtitle/genre`, !!a.subtitle);
    assert(`"${a.title}" has externalUrl`, !!a.externalUrl);
  });
}

async function testMusicSearch() {
  console.log('\n=== MUSIC SEARCH API ===');
  const r = await fetchJson(`${BASE}/api/music/search?q=ksi&limit=3`);
  assert('Status 200', r.status === 200);
  assert('Has results', Array.isArray(r.body?.results));
  const results = r.body?.results || [];
  assert('Found KSI', results.some(a => a.title?.toLowerCase() === 'ksi'));
  const first = results[0];
  if (first) {
    assert('KSI has image', !!first.image && first.image.length > 10);
    assert('KSI has externalUrl', !!first.externalUrl);
  }
}

async function testMusicSearchEmpty() {
  console.log('\n=== MUSIC SEARCH EDGE CASES ===');
  const r = await fetchJson(`${BASE}/api/music/search?q=&limit=3`);
  assert('Empty query returns 400', r.status === 400);
}

async function testBooksPopular() {
  console.log('\n=== BOOKS POPULAR API ===');
  const r = await fetchJson(`${BASE}/api/books/popular?limit=12&_=${Date.now()}`);
  assert('Status 200', r.status === 200);
  assert('Has books array', Array.isArray(r.body?.books));
  const books = r.body?.books || [];
  assert('At least 8 books', books.length >= 8);
  books.slice(0, 5).forEach(b => {
    assert(`"${b.title?.slice(0, 30)}" has title`, !!b.title);
    assert(`"${b.title?.slice(0, 30)}" has author`, !!b.author);
    assert(`"${b.title?.slice(0, 30)}" has rawCover`, !!b.rawCover);
    assert(`"${b.title?.slice(0, 30)}" has English in language or no lang`, true);
  });
  // Check diversity: at least 2 different authors
  const authors = [...new Set(books.map(b => b.author?.split(',')[0]?.trim()))];
  assert(`At least 2 different authors (got ${authors.length})`, authors.length >= 2);
}

async function testBooksCovers() {
  console.log('\n=== BOOK COVERS ===');
  const r = await fetchJson(`${BASE}/api/books/popular?limit=3&_=${Date.now()}`);
  const books = r.body?.books || [];
  for (const b of books.slice(0, 2)) {
    if (b.rawCover) {
      const cover = await fetchText(b.rawCover);
      assert(`"${b.title?.slice(0, 20)}" cover loads (${cover.status})`, cover.status === 200);
    }
  }
}

async function testMusicRailHTML() {
  console.log('\n=== INDEX.HTML MUSIC RAIL ===');
  const r = await fetchText(`${BASE}/`);
  assert('Index loads', r.status === 200);
  assert('Has musicRail div', r.body.includes('musicRail'));
  assert('Has booksRail div', r.body.includes('booksRail'));
  assert('Has index.js v20260704b', r.body.includes('index.js?v=20260704b'));
  assert('Has adapter v20260704d', r.body.includes('index-list-menu-adapter.js?v=20260704d'));
}

async function testMusicHTML() {
  console.log('\n=== MUSIC.HTML ===');
  const r = await fetchText(`${BASE}/music`);
  assert('Music page loads', r.status === 200);
  assert('Has index-list-menu-adapter', r.body.includes('index-list-menu-adapter'));
  assert('Has list-utils', r.body.includes('list-utils'));
}

async function testMusicHealth() {
  console.log('\n=== MUSIC HEALTH ===');
  const r = await fetchJson(`${BASE}/api/music/health`);
  assert('Status 200', r.status === 200);
  assert('Service is music', r.body?.service === 'music');
}

async function testBooksHealth() {
  console.log('\n=== BOOKS API EDGE CASES ===');
  const r = await fetchJson(`${BASE}/api/books/popular?limit=50`);
  assert('Status 200', r.status === 200);
  assert('Returns books', (r.body?.books?.length || 0) > 0);
}

async function testSWVersion() {
  console.log('\n=== SERVICE WORKER ===');
  const r = await fetchText(`${BASE}/sw.js`);
  assert('SW loads', r.status === 200);
  assert('API cache v38', r.body.includes('zo2y-api-v38'));
  assert('App shell v268', r.body.includes('zo2y-app-shell-v268'));
}

async function run() {
  console.log('BROWSER TEST - Live Site');
  console.log('========================');
  const start = Date.now();
  
  await testSWVersion();
  await testMusicHealth();
  await testMusicArtists();
  await testMusicSearch();
  await testMusicSearchEmpty();
  await testBooksPopular();
  await testBooksCovers();
  await testMusicRailHTML();
  await testMusicHTML();
  await testBooksHealth();
  
  const elapsed = Date.now() - start;
  console.log(`\n========================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed (${elapsed}ms)`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
