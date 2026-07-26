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

const TARGETS = [
  {
    table: 'food_brands',
    name: "Torchy's Tacos",
    commonsFile: "Torchy's_Tacos_logo.svg"
  },
  {
    table: 'food_brands',
    name: 'Wingstop',
    commonsFile: 'Wingstop_logo.svg'
  },
  {
    table: 'food_brands',
    name: 'Outback Steakhouse',
    commonsFile: 'Outback_Steakhouse_logo.svg'
  },
  {
    table: 'food_brands',
    name: 'Olive Garden',
    commonsFile: 'Olive_Garden_logo.svg'
  },
  {
    table: 'food_brands',
    name: 'Wawa Fresh Food',
    commonsFile: 'Wawa_logo.svg'
  }
];

async function downloadWikiFile(fileName) {
  const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(fileName) + '?width=800';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Zo2yLogoFixer/1.0 (https://zo2y.com; support@zo2y.com)' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return { buffer: Buffer.from(buffer), contentType: res.headers.get('content-type') || 'image/png' };
    }
  } catch (e) {}
  return null;
}

async function fixAll5() {
  for (const t of TARGETS) {
    const { data: rows } = await supabase.from(t.table).select('id, name, domain').eq('name', t.name);
    if (rows && rows.length > 0) {
      const row = rows[0];
      const domain = String(row.domain || '').trim() || (row.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const storagePath = `${t.table}/${cleanSlug}.png`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      const img = await downloadWikiFile(t.commonsFile);
      if (img && img.buffer.length > 1000) {
        await supabase.storage.from('brand-logos').upload(storagePath, img.buffer, { contentType: 'image/png', upsert: true });
        await supabase.from(t.table).update({ logo_url: publicUrl, domain }).eq('id', row.id);
        console.log(`✓ FIXED & SEEDED IN SUPABASE STORAGE: ${t.name} -> ${publicUrl}`);
      } else {
        console.warn(`⚠ Could not download ${t.commonsFile} for ${t.name}`);
      }
    }
  }
  console.log('Done fixing final targets!');
}

fixAll5();
