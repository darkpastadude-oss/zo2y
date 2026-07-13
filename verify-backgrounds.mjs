import { readFileSync, writeFileSync } from 'fs';
import https from 'https';

const PEXELS_KEY = 'ZVcFKF6TlUxhNWB5TjQgjTIDbesiS8eqDf7oyK4YH3gfT2Ey1GaoCvC5';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const SUPABASE = 'https://gfkhjbztayjyojsgdpgk.supabase.co';

function pexelsGet(photoId) {
  return new Promise((resolve) => {
    const url = `https://api.pexels.com/v1/photos/${photoId}`;
    https.get(url, { headers: { Authorization: PEXELS_KEY } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve({ error: `HTTP ${res.statusCode}` }); }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

function pexelsSearch(query, perPage = 5) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${q}&per_page=${perPage}&orientation=landscape`;
    https.get(url, { headers: { Authorization: PEXELS_KEY } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve({ error: `HTTP ${res.statusCode}` }); }
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

function supabaseFetch(table) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE}/rest/v1/${table}?select=id,name,domain&order=name&limit=500`);
    https.get(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const covers = JSON.parse(readFileSync('assets/data/brand_covers.json', 'utf8'));

(async () => {
  const fashion = await supabaseFetch('fashion_brands');
  const food = await supabaseFetch('food_brands');
  const cars = await supabaseFetch('car_brands');

  const byId = {};
  for (const b of fashion) byId[b.id] = { name: b.name, type: 'fashion', domain: b.domain };
  for (const b of food) byId[b.id] = { name: b.name, type: 'food', domain: b.domain };
  for (const b of cars) byId[b.id] = { name: b.name, type: 'car', domain: b.domain };

  const results = [];
  let checked = 0;

  for (const [id, url] of Object.entries(covers)) {
    const info = byId[id];
    if (!info) continue;

    const match = url.match(/pexels-photo-(\d+)/);
    if (!match) continue;

    const photoId = match[1];
    checked++;

    const photo = await pexelsGet(photoId);
    if (photo.error) {
      results.push({ id, name: info.name, type: info.type, photoId, status: 'API_ERROR', alt: '', desc: '' });
      console.log(`${checked} ERROR ${info.name}: ${photo.error}`);
      await sleep(200);
      continue;
    }

    const alt = photo.alt || '';
    const desc = photo.description || '';
    const photographer = photo.photographer || '';
    const url2 = photo.url || '';

    results.push({ id, name: info.name, type: info.type, photoId, alt, desc, photographer, pexelsUrl: url2 });
    console.log(`${checked} ${info.name.padEnd(30)} | alt: ${alt.slice(0, 80)}`);

    await sleep(200);
  }

  writeFileSync('background-audit.json', JSON.stringify(results, null, 2));
  console.log(`\nDone. Checked ${checked} photos. Results saved to background-audit.json`);
})();
