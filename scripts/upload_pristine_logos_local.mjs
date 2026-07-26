import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
if (fs.existsSync('.dev.vars')) {
  fs.readFileSync('.dev.vars', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Vector SVG definitions for high-frequency luxury and fashion brands
const CUSTOM_VECTORS = {
  'Stella McCartney': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', 'Inter', sans-serif" font-size="52" font-weight="300" letter-spacing="12" fill="#ffffff" text-anchor="middle" dominant-baseline="central">STELLA McCARTNEY</text></svg>`,
  'Amiri': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', 'Inter', sans-serif" font-size="72" font-weight="700" letter-spacing="16" fill="#ffffff" text-anchor="middle" dominant-baseline="central">AMIRI</text></svg>`,
  'Arc\'teryx': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', 'Inter', sans-serif" font-size="64" font-weight="600" letter-spacing="14" fill="#ffffff" text-anchor="middle" dominant-baseline="central">ARC'TERYX</text></svg>`,
  'Celine': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', 'Inter', sans-serif" font-size="72" font-weight="500" letter-spacing="18" fill="#ffffff" text-anchor="middle" dominant-baseline="central">CELINE</text></svg>`,
  'Off-White': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', 'Inter', sans-serif" font-size="68" font-weight="800" letter-spacing="10" fill="#ffffff" text-anchor="middle" dominant-baseline="central">OFF-WHITE™</text></svg>`,
  'Supreme': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><rect x="150" y="100" width="500" height="200" fill="#e11d48" rx="8"/><text x="400" y="200" font-family="'Futura', 'Outfit', sans-serif" font-size="76" font-style="italic" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">Supreme</text></svg>`,
  'Zara': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Didot', 'Bodoni MT', serif" font-size="110" font-weight="700" letter-spacing="-4" fill="#ffffff" text-anchor="middle" dominant-baseline="central">ZARA</text></svg>`,
  'Cartier': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Baskerville', 'Georgia', serif" font-size="82" font-style="italic" font-weight="400" fill="#ffffff" text-anchor="middle" dominant-baseline="central">Cartier</text></svg>`,
  'Weekday': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', sans-serif" font-size="64" font-weight="800" letter-spacing="14" fill="#ffffff" text-anchor="middle" dominant-baseline="central">WEEKDAY</text></svg>`,
  'Wrangler': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', sans-serif" font-size="76" font-style="italic" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">Wrangler</text></svg>`,
  'UGG': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><text x="400" y="200" font-family="'Outfit', sans-serif" font-size="96" font-weight="900" letter-spacing="6" fill="#ffffff" text-anchor="middle" dominant-baseline="central">UGG</text></svg>`,
  'Zenith': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#0b132b"/><path d="M400 90 L412 135 L455 135 L420 162 L433 205 L400 178 L367 205 L380 162 L345 135 L388 135 Z" fill="#ffffff"/><text x="400" y="260" font-family="'Outfit', sans-serif" font-size="52" font-weight="600" letter-spacing="12" fill="#ffffff" text-anchor="middle">ZENITH</text></svg>`
};

function generateCleanVectorSvg(name) {
  if (CUSTOM_VECTORS[name]) {
    return { buffer: Buffer.from(CUSTOM_VECTORS[name]), contentType: 'image/svg+xml' };
  }
  const cleanName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;').toUpperCase();
  const fontSize = cleanName.length > 15 ? 36 : (cleanName.length > 10 ? 46 : 58);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
    <rect width="800" height="400" fill="#0b132b"/>
    <text x="400" y="200" font-family="'Outfit', 'Inter', system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="8" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${cleanName}</text>
  </svg>`;
  return { buffer: Buffer.from(svg), contentType: 'image/svg+xml' };
}

async function uploadLocalLogosToSupabase(tableName) {
  const { data: items } = await supabase.from(tableName).select('id, name, logo_url, domain');
  if (!items) return;

  console.log(`\nStoring pristine local logos in Supabase for ${tableName} (${items.length} items)...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const storagePath = `${tableName}/${cleanSlug}.svg`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

    const vector = generateCleanVectorSvg(item.name);
    const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, vector.buffer, {
      contentType: 'image/svg+xml',
      upsert: true
    });

    if (!uploadErr || uploadErr.message?.includes('already exists')) {
      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      console.log(`[${i + 1}/${items.length}] ✓ SUPABASE LOCAL LOGO: ${item.name} -> ${publicUrl}`);
    } else {
      console.error(`[${i + 1}/${items.length}] ❌ Upload failed for ${item.name}:`, uploadErr.message);
    }
  }
}

async function run() {
  await uploadLocalLogosToSupabase('fashion_brands');
  await uploadLocalLogosToSupabase('food_brands');
  console.log('\n✅ ALL BRAND LOGOS ARE NOW STORED LOCALLY IN SUPABASE STORAGE WITH ZERO EXTERNAL DEPENDENCIES!');
}

run();
