const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://gfkhjbztayjyojsgdpgk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU'
);

function get(url) {
  return new Promise((res, rej) => {
    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Zo2y/3.0' } }, r => {
      if ([301,302,303].includes(r.statusCode) && r.headers.location) return get(r.headers.location).then(res).catch(rej);
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, ct: r.headers['content-type'] || '', buf: Buffer.concat(c) }));
    }).on('error', rej).on('timeout', () => rej(new Error('timeout')));
  });
}

async function main() {
  // Directly try known good upload.wikimedia.org paths for Vauxhall
  const candidates = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Vauxhall_logo.svg/512px-Vauxhall_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Vauxhall_Motors_logo.svg/512px-Vauxhall_Motors_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/Vauxhall_Motors_Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Vauxhall_logo.svg/1200px-Vauxhall_logo.svg.png',
  ];

  for (const url of candidates) {
    console.log('Trying:', url);
    try {
      const r = await get(url);
      console.log('  Status:', r.status, 'Size:', r.buf.length, 'CT:', r.ct);
      if (r.status === 200 && r.buf.length > 500) {
        const { error } = await s.storage.from('brand-logos').upload('car_brands/vauxhall.png', r.buf, { contentType: 'image/png', upsert: true });
        if (error) { console.log('Upload err:', error.message); continue; }
        await s.from('car_brands').update({ logo_url: 'car_brands/vauxhall.png' }).eq('name', 'Vauxhall');
        console.log('Vauxhall DONE', r.buf.length, 'B');
        return;
      }
    } catch (e) { console.log('  Error:', e.message); }
  }
  console.log('Vauxhall: no source found, leaving as-is');
}
main().catch(console.error);
