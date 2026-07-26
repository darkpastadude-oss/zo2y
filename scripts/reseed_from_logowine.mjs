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

async function loadLogoWineMap() {
  console.log('Fetching logo.wine sitemap...');
  const res = await fetch('https://www.logo.wine/sitemap.xml');
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>https:\/\/www\.logo\.wine\/logo\/([^<]+)<\/loc>/g)].map(m => m[1]);
  
  const map = new Map();
  for (const slug of urls) {
    const norm = decodeURIComponent(slug).toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(norm, slug);
  }
  console.log(`Loaded ${map.size} normalized logo.wine brand mappings.`);
  return { map, rawSlugs: urls };
}

async function fetchLogoWineSvg(slug) {
  const url = `https://www.logo.wine/a/logo/${slug}/${slug}-Logo.wine.svg`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 200) return buf;
    }
  } catch(e) {}
  return null;
}

async function processTable(tableName, targetDir, { map, rawSlugs }) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Processing ${tableName} (${items.length} items) using Logo.wine...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Try matching brand name to logo.wine slug
    const nameNorm = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let wineSlug = map.get(nameNorm);

    if (!wineSlug) {
      // Try domain match
      const domNorm = domain.replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]/g, '');
      wineSlug = map.get(domNorm);
    }

    if (!wineSlug) {
      // Try partial match
      wineSlug = rawSlugs.find(s => {
        const sn = s.toLowerCase().replace(/[^a-z0-9]/g, '');
        return sn.includes(nameNorm) || nameNorm.includes(sn);
      });
    }

    let svgBuf = wineSlug ? await fetchLogoWineSvg(wineSlug) : null;

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
      console.log(`[${i + 1}/${items.length}] ✓ LOGO.WINE PRISTINE SVG STORED: ${item.name} (${wineSlug}) -> ${localPath} (${svgBuf.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ LOGO.WINE NOT FOUND FOR: ${item.name}`);
    }

    await delay(50);
  }

  console.log(`Completed ${tableName}: ${count}/${items.length} logo.wine pristine SVGs stored!`);
}

async function run() {
  const wineData = await loadLogoWineMap();
  await processTable('fashion_brands', fashionDir, wineData);
  await processTable('food_brands', foodDir, wineData);
  console.log('\n✅ FINISHED RESEEDING FROM LOGO.WINE!');
}

run();
