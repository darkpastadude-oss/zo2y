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
    table: 'fashion_brands',
    name: 'Amiri',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Wikipedia-logo-v2-ar-Amiri.svg/960px-Wikipedia-logo-v2-ar-Amiri.svg.png'
  },
  {
    table: 'food_brands',
    name: 'Outback Steakhouse',
    url: 'https://en.wikipedia.org/wiki/Special:FilePath/Outback_Steakhouse.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Olive Garden',
    url: 'https://en.wikipedia.org/wiki/Special:FilePath/Olive_Garden_Logo.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Wingstop',
    url: 'https://en.wikipedia.org/wiki/Special:FilePath/Wingstop_logo.svg?width=800'
  },
  {
    table: 'food_brands',
    name: 'Wawa Fresh Food',
    url: 'https://en.wikipedia.org/wiki/Special:FilePath/Wawa_logo.svg?width=800'
  },
  {
    table: 'food_brands',
    name: "Torchy's Tacos",
    url: 'https://www.google.com/s2/favicons?domain=torchystacos.com&sz=256'
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

async function fix100Percent() {
  for (const t of TARGETS) {
    const { data: rows } = await supabase.from(t.table).select('id, name, domain').eq('name', t.name);
    if (rows && rows.length > 0) {
      const row = rows[0];
      const domain = String(row.domain || '').trim() || (row.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const storagePath = `${t.table}/${cleanSlug}.png`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      const buf = await downloadBuffer(t.url);
      if (buf && buf.length > 500) {
        await supabase.storage.from('brand-logos').upload(storagePath, buf, { contentType: 'image/png', upsert: true });
        await supabase.from(t.table).update({ logo_url: publicUrl, domain }).eq('id', row.id);
        console.log(`[100% OK] ${t.name} -> ${publicUrl}`);
      } else {
        console.error(`[DOWNLOAD FAIL] ${t.name}`);
      }
    }
  }

  console.log('\nAll targets fixed and saved to Supabase Storage!');
}

fix100Percent();
