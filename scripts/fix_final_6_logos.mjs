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

const REPLACEMENTS = [
  {
    table: 'fashion_brands',
    name: 'Alexander McQueen',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20of%20Alexander%20McQueen.svg?width=800'
  },
  {
    table: 'fashion_brands',
    name: 'Amiri',
    sourceUrl: 'https://img.logo.dev/amiri.com?token=sk_ahTFhlNISR-yico04eA-Qg'
  },
  {
    table: 'food_brands',
    name: "Torchy's Tacos",
    sourceUrl: 'https://d2gqo3h0psesgi.cloudfront.net/auto/torchys-tacos-restaurant-logo.png'
  },
  {
    table: 'food_brands',
    name: 'Wingstop',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Wingstop%20Logo.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Outback Steakhouse',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Outback%20Steakhouse%20logo.png?width=800'
  },
  {
    table: 'food_brands',
    name: 'Smashburger',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Smashburgerlogo.jpg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Olive Garden',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Olive%20Garden%20logo%202014.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Sheetz Fresh Food',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sheetz_logo.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Wawa Fresh Food',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Wawa%20inc%20logo.svg?width=800'
  }
];

async function downloadBuffer(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Zo2yLogoFixer/1.0 (https://zo2y.com; support@zo2y.com)' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return Buffer.from(buffer);
    }
  } catch (e) {}
  return null;
}

async function fixFinalLogos() {
  for (const item of REPLACEMENTS) {
    const { data: rows } = await supabase.from(item.table).select('id, name, domain').eq('name', item.name);
    if (rows && rows.length > 0) {
      const row = rows[0];
      const domain = String(row.domain || '').trim() || (row.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const storagePath = `${item.table}/${cleanSlug}.png`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      const buf = await downloadBuffer(item.sourceUrl);
      if (buf && buf.length > 500) {
        await supabase.storage.from('brand-logos').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
        await supabase.from(item.table).update({ logo_url: publicUrl, domain }).eq('id', row.id);
        console.log(`[FIXED & UPLOADED TO SUPABASE] ${item.name} -> ${publicUrl}`);
      } else {
        // Fallback set direct URL
        await supabase.from(item.table).update({ logo_url: item.sourceUrl, domain }).eq('id', row.id);
        console.log(`[DIRECT URL SET] ${item.name} -> ${item.sourceUrl}`);
      }
    }
  }

  console.log('\nFinished updating final replacement logos!');
}

fixFinalLogos();
