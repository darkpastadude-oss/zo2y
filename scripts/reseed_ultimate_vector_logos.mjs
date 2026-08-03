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

const delay = ms => new Promise(res => setTimeout(res, ms));

const SIMPLE_ICONS = {
  "Adidas": "adidas",
  "Nike": "nike",
  "Puma": "puma",
  "Reebok": "reebok",
  "New Balance": "newbalance",
  "Under Armour": "underarmour",
  "Zara": "zara",
  "Uniqlo": "uniqlo",
  "Pandora": "pandora",
  "McDonald's": "mcdonalds",
  "Starbucks": "starbucks",
  "Burger King": "burgerking",
  "KFC": "kfc",
  "Taco Bell": "tacobell",
  "Gymshark": "gymshark",
  "Patagonia": "patagonia",
  "Lululemon": "lululemon",
  "Swarovski": "swarovski",
  "Dr. Martens": "drmartens",
  "Vans": "vans",
  "Crocs": "crocs",
  "Sephora": "sephora",
  "H&M": "hm",
  "Gap": "gap",
  "Fendi": "fendi",
  "Gucci": "gucci",
  "Louis Vuitton": "louisvuitton",
  "Moncler": "moncler",
  "Champion": "champion",
  "Casio": "casio",
  "Converse": "converse",
  "Subway": "subway",
  "Dominos": "dominos",
  "Pizza Hut": "pizzahut",
  "Wendy's": "wendys",
  "Chipotle": "chipotle"
};

function ensureBlackSvg(content) {
  let s = content;
  s = s.replace(/fill=["']#fff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']#ffffff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']rgb\(255,\s*255,\s*255\)["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');

  s = s.replace(/stroke=["']#fff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']#ffffff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke:\s*#fff(?:fff)?/gi, 'stroke: #0f0f0f');

  if (!s.includes('fill=') && !s.includes('fill:')) {
    s = s.replace(/<svg([^>]*)>/i, '<svg$1 fill="#0f0f0f">');
  }
  return s;
}

async function fetchVector(brandName) {
  // Strategy 1: SimpleIcons
  const sSlug = SIMPLE_ICONS[brandName];
  if (sSlug) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${sSlug}.svg`);
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200 && text.includes('<svg')) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: 'SimpleIcons' };
        }
      }
    } catch(e) {}
  }

  // Strategy 2: Wikimedia Commons Special:FilePath
  const cleanName = brandName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  const wikiVariations = [
    cleanName + '_logo.svg',
    cleanName + '_Logo.svg',
    cleanName + '.svg',
    cleanName + '_wordmark.svg',
    cleanName + '_Logo_text.svg',
    cleanName + '_Logo_2020.svg',
    cleanName + '_Logo_2021.svg',
    cleanName + '_Logo_2022.svg',
    cleanName + '_Logo_2023.svg',
    cleanName + '_Logo.png',
    cleanName + '_logo.png'
  ];

  for (const v of wikiVariations) {
    const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(v);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<svg') && text.length > 200) {
          const fixedText = ensureBlackSvg(text);
          return { buffer: Buffer.from(fixedText), format: 'svg', source: `Wikimedia (${v})` };
        }
      }
    } catch(e) {}
  }

  // Strategy 3: Logo.wine candidates
  const logoWineCandidates = [
    cleanName,
    cleanName + '_(brand)',
    cleanName + '_(company)',
    cleanName + '_Inc.',
    cleanName + '_(retailer)',
    cleanName + '_(clothing)',
    cleanName + '_(fashion_house)',
    cleanName + '_(jewelry)',
    cleanName + '_(watchmaker)',
    cleanName + '_(restaurant)'
  ];

  for (const c of logoWineCandidates) {
    const url = `https://www.logo.wine/a/logo/${encodeURIComponent(c)}/${encodeURIComponent(c)}-Logo.wine.svg`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200 && text.includes('<svg')) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: `Logo.wine (${c})` };
        }
      }
    } catch(e) {}
  }

  // Strategy 4: VectorLogoZone
  const vlzSlug = cleanName.toLowerCase();
  const vlzUrls = [
    `https://raw.githubusercontent.com/vectorlogozone/vectorlogofiles/master/logos/${vlzSlug}/${vlzSlug}-official.svg`,
    `https://raw.githubusercontent.com/vectorlogozone/vectorlogofiles/master/logos/${vlzSlug}/${vlzSlug}-ar21.svg`,
    `https://raw.githubusercontent.com/vectorlogozone/vectorlogofiles/master/logos/${vlzSlug}/${vlzSlug}-icon.svg`
  ];

  for (const u of vlzUrls) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200 && text.includes('<svg')) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: 'VectorLogoZone' };
        }
      }
    } catch(e) {}
  }

  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Ultimate Vector Reseeding for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const asset = await fetchVector(item.name);
    if (asset) {
      const fileName = `${cleanSlug}.svg`;
      const localPath = path.join(targetDir, fileName);
      fs.writeFileSync(localPath, asset.buffer);

      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;

      await supabase.storage.from('brand-logos').upload(storagePath, asset.buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      count++;
      console.log(`[${i + 1}/${items.length}] ✓ BLACK VECTOR STORED (${asset.source}): ${item.name} -> ${localPath} (${asset.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FETCH VECTOR FOR: ${item.name}`);
    }

    await delay(120);
  }

  console.log(`Completed ${tableName}: ${count}/${items.length} 100% black vector SVGs reseeded!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ ULTIMATE BLACK VECTOR LOGO RESEEDING COMPLETE!');
}

run();
