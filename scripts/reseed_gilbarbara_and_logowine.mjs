import fs from 'fs';
import path from 'path';
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

const fashionDir = path.join(process.cwd(), 'public', 'brand-assets', 'fashion');
const foodDir = path.join(process.cwd(), 'public', 'brand-assets', 'food');

fs.mkdirSync(fashionDir, { recursive: true });
fs.mkdirSync(foodDir, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchGilbarbaraIndex() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/gilbarbara/logos/main/logos.json');
    if (res.ok) return await res.json();
  } catch(e) {}
  return [];
}

async function run() {
  const gList = await fetchGilbarbaraIndex();
  console.log(`Loaded ${gList.length} SVGs from gilbarbara/logos.`);

  const { data: fashion } = await supabase.from('fashion_brands').select('id, name, domain');
  const { data: food } = await supabase.from('food_brands').select('id, name, domain');

  async function processBrands(items, tableName, targetDir) {
    console.log(`\nProcessing ${items.length} items for ${tableName}...`);
    let count = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Try Gilbarbara matches
      let gMatch = gList.find(g => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normName);
      let svgBuf = null;

      if (gMatch && gMatch.files?.[0]) {
        const file = gMatch.files.find(f => !f.includes('-icon')) || gMatch.files[0];
        const gUrl = `https://raw.githubusercontent.com/gilbarbara/logos/main/logos/${file}`;
        try {
          const res = await fetch(gUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length > 200) svgBuf = buf;
          }
        } catch(e) {}
      }

      // 2. Try Logo.wine search URL if Gilbarbara missed
      if (!svgBuf) {
        const wSlug = item.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        const wUrl = `https://www.logo.wine/a/logo/${encodeURIComponent(wSlug)}/${encodeURIComponent(wSlug)}-Logo.wine.svg`;
        try {
          const res = await fetch(wUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length > 200) svgBuf = buf;
          }
        } catch(e) {}
      }

      if (svgBuf) {
        const fileName = `${cleanSlug}.svg`;
        const localPath = path.join(targetDir, fileName);
        fs.writeFileSync(localPath, svgBuf);

        const storagePath = `${tableName}/${fileName}`;
        const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;

        await supabase.storage.from('brand-logos').upload(storagePath, svgBuf, {
          contentType: 'image/svg+xml',
          upsert: true
        });

        await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
        count++;
        console.log(`[${i + 1}/${items.length}] ✓ VECTOR SVG STORED: ${item.name} -> ${localPath} (${svgBuf.length} bytes)`);
      } else {
        console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT MATCH VECTOR SVG FOR: ${item.name}`);
      }

      await delay(50);
    }

    console.log(`Completed ${tableName}: ${count}/${items.length} vector SVGs stored!`);
  }

  await processBrands(fashion, 'fashion_brands', fashionDir);
  await processBrands(food, 'food_brands', foodDir);
  console.log('\n✅ ALL AVAILABLE VECTOR SVGS STORED & UPDATED!');
}

run();
