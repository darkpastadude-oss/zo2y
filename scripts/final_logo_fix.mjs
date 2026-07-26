/**
 * final_logo_fix.mjs
 *
 * Uses only VERIFIED Wikimedia Commons file titles obtained from actual search results.
 * Also reverts any bad logos that were applied during the previous run.
 */
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

const foodDir = path.join(process.cwd(), 'public', 'brand-assets', 'food');
const fashionDir = path.join(process.cwd(), 'public', 'brand-assets', 'fashion');
const coversPath = path.join(process.cwd(), 'assets', 'data', 'brand_covers.json');

const delay = ms => new Promise(res => setTimeout(res, ms));
const WIKI_UA = 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)';

// ===================================================
// VERIFIED file titles from Wikimedia Commons search
// Only include ones that are definitely the right logo
// ===================================================
const VERIFIED_WIKI_TITLES = {
  // SimpleIcons (black, guaranteed correct)
  "Burger King": { type: "simpleicons", slug: "burgerking" },
  "KFC": { type: "simpleicons", slug: "kfc" },
  "McDonald's": { type: "simpleicons", slug: "mcdonalds" },
  "Starbucks": { type: "simpleicons", slug: "starbucks" },
  "Taco Bell": { type: "simpleicons", slug: "tacobell" },

  // Verified Wikimedia Commons
  "Church's Texas Chicken": { type: "wiki", title: "File:Churchs-logo.svg" }, // verified
  "Cici's Pizza":           { type: "wiki", title: "File:Cici's Logo 2015.svg" }, // verified
  "Dave & Buster's":        { type: "wiki", title: "File:Dave & Buster's 2020.svg" }, // verified
  "Five Guys":              { type: "wiki", title: "File:Five Guys logo.svg" }, // verified
  "Golden Corral":          { type: "wiki", title: "File:Golden Corral logo.svg" }, // verified
  "Häagen-Dazs":            { type: "wiki", title: "File:Häagen-Dazs Logo.svg" }, // verified
  "In-N-Out Burger":        { type: "wiki", title: "File:InNOut.svg" }, // verified
  "Jimmy John's":           { type: "wiki", title: "File:Jimmy John's (logo).svg" }, // verified
  "Jersey Mike's Subs":     { type: "wiki", title: "File:Jersey Mike's logo.svg" }, // verified
  "Culver's":               { type: "wiki", title: "File:Culver's logo.svg" }, // verified
  "Nando's":                { type: "wiki", title: "File:Nando's wordmark.svg" }, // verified
  "P.F. Chang's":           { type: "wiki", title: "File:P.F. Chang's logo.svg" }, // verified
  "Peet's Coffee":          { type: "wiki", title: "File:Peet's Coffee logo.svg" }, // verified
  "Shake Shack":            { type: "wiki", title: "File:Shake Shack logo.svg" }, // verified
  "Sweetgreen":             { type: "wiki", title: "File:Sweetgreen logo.svg" }, // verified
  "Zippy's":                { type: "wiki", title: "File:Zippy's logo.svg" }, // verified

  // SKIP these - Wikimedia found wrong logos (or no SVG at all):
  // Blaze Pizza, Bob Evans, Bojangles, Buc-ee's, Buffalo Wild Wings,
  // Carrabba's, Carvel, Casey's, Cava, Danone, First Watch, Godiva,
  // Jet's Pizza, LongHorn, Lou Malnati's, Mellow Mushroom, Little Caesars,
  // MOD Pizza (found "Mod Logo.svg" - wrong company),
  // Panda Express (found "Pandas logo with light text.svg" - wrong),
  // Perkins (found "Perkins logo.svg" - need to verify),
  // Portillo's, Red Lobster (found "Lobsters logo color.svg" - need to verify),
  // Round Table Pizza, Smashburger, Snooze, Torchy's, Wawa, White Castle (found "Castle app icon.svg" - wrong),
  // Wingstop, Zaxby's
};

// ===================================================
// BAD logos from previous run to revert to PNG
// ===================================================
const REVERT_TO_PNG = [
  "El Pollo Loco",    // Got wrong SVG (Xcel energy)
  "Giordano's",       // Got wrong SVG (Giordano fashion brand)
];

function ensureBlackSvg(content) {
  let s = content;
  s = s.replace(/fill=["']#fff(?:fff)?["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');
  s = s.replace(/stroke=["']#fff(?:fff)?["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  return s;
}

async function fetchFile(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': WIKI_UA, 'Accept': 'image/svg+xml,image/*,text/*,*/*' },
        redirect: 'follow',
      });
      if (res.status === 429) { await delay(2000); continue; }
      return res.ok ? res : null;
    } catch (e) {
      await delay(500);
    }
  }
  return null;
}

async function getSvgFromSource(cfg) {
  if (cfg.type === 'simpleicons') {
    const res = await fetchFile(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${cfg.slug}.svg`);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg')) {
        return Buffer.from(text.replace('<svg ', '<svg fill="#0f0f0f" '));
      }
    }
    return null;
  }

  if (cfg.type === 'wiki') {
    const encoded = encodeURIComponent(cfg.title.replace(/^File:/i, ''));
    const res = await fetchFile(`https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`);
    if (res) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('svg') || res.url.includes('.svg')) {
        const text = await res.text();
        if (text.includes('<svg') && text.length > 100) {
          return Buffer.from(ensureBlackSvg(text));
        }
      }
    }
    return null;
  }

  return null;
}

async function uploadSvg(table, brand, slug, svgBuf) {
  const fileName = `${slug}.svg`;
  const localPath = path.join(table === 'food_brands' ? foodDir : fashionDir, fileName);
  fs.writeFileSync(localPath, svgBuf);

  const storagePath = `${table}/${fileName}`;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

  const { error } = await supabase.storage.from('brand-logos').upload(storagePath, svgBuf, {
    contentType: 'image/svg+xml',
    upsert: true,
  });

  if (error) {
    console.log(`  Upload error for ${brand.name}: ${error.message}`);
    return false;
  }

  await supabase.from(table).update({ logo_url: publicUrl }).eq('id', brand.id);
  return true;
}

async function fixLogos() {
  const { data: food } = await supabase.from('food_brands').select('id, name, domain, logo_url');
  const { data: fashion } = await supabase.from('fashion_brands').select('id, name, domain, logo_url');
  const allBrands = [...food, ...fashion];

  let fixed = 0;
  let reverted = 0;

  // First: fix the bad logos from the previous run
  console.log('\n==== Reverting bad logos from previous run ====');
  for (const brandName of REVERT_TO_PNG) {
    const brand = allBrands.find(b => b.name === brandName);
    if (!brand) { console.log(`  ⚠ ${brandName}: not found in DB`); continue; }

    const table = food.find(b => b.id === brand.id) ? 'food_brands' : 'fashion_brands';
    const domain = (brand.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const slug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Delete the bad SVG from storage
    await supabase.storage.from('brand-logos').remove([`${table}/${slug}.svg`]);

    // Try to restore from existing PNG (it's still in the DB if we just update the URL)
    // The PNG was in supabase storage already
    const pngUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${table}/${slug}.png`;
    // Check if PNG exists in storage
    const { data: existing } = await supabase.storage.from('brand-logos').list(table, {
      search: `${slug}.png`
    });
    if (existing?.length > 0) {
      await supabase.from(table).update({ logo_url: pngUrl }).eq('id', brand.id);
      console.log(`  ↩ Reverted ${brandName} to PNG`);
      reverted++;
    } else {
      console.log(`  ⚠ ${brandName}: PNG not found in storage`);
    }
  }

  console.log(`\n==== Applying verified logo fixes ====`);
  for (const [brandName, cfg] of Object.entries(VERIFIED_WIKI_TITLES)) {
    const brand = allBrands.find(b => b.name === brandName);
    if (!brand) { console.log(`  ⚠ ${brandName}: not found in DB`); continue; }

    const table = food.find(b => b.id === brand.id) ? 'food_brands' : 'fashion_brands';
    const domain = (brand.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const slug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Skip if already SVG (was fixed correctly before)
    if (brand.logo_url?.endsWith('.svg') && !REVERT_TO_PNG.includes(brandName)) {
      console.log(`  ✓ ${brandName}: already SVG, skipping`);
      continue;
    }

    await delay(300);
    const svgBuf = await getSvgFromSource(cfg);

    if (svgBuf) {
      const ok = await uploadSvg(table, brand, slug, svgBuf);
      if (ok) {
        fixed++;
        const src = cfg.type === 'simpleicons' ? `SimpleIcons:${cfg.slug}` : `Wikimedia:${cfg.title}`;
        console.log(`  ✓ Fixed ${brandName} -> ${slug}.svg (${src})`);
      }
    } else {
      console.log(`  ⚠ No SVG for ${brandName}`);
    }
  }

  console.log(`\nFixed ${fixed} logos. Reverted ${reverted} bad logos.`);
}

async function addCovers() {
  console.log('\n==== Adding background cover images ====');
  const COVERS = JSON.parse(fs.readFileSync('scripts/brand_covers_data.json', 'utf8'));

  const { data: fashion } = await supabase.from('fashion_brands').select('id, name');
  const { data: food } = await supabase.from('food_brands').select('id, name');
  const allBrands = [...(fashion || []), ...(food || [])];

  const existing = fs.existsSync(coversPath)
    ? JSON.parse(fs.readFileSync(coversPath, 'utf8'))
    : {};

  let added = 0;
  for (const brand of allBrands) {
    if (existing[brand.id]) continue;
    const cover = COVERS[brand.name];
    if (cover) {
      existing[brand.id] = cover;
      added++;
      console.log(`  + ${brand.name}`);
    }
  }

  fs.writeFileSync(coversPath, JSON.stringify(existing, null, 2));
  const missing = allBrands.filter(b => !existing[b.id]);
  console.log(`\nAdded ${added} covers. Total: ${Object.keys(existing).length}. Still missing: ${missing.length}`);
  if (missing.length) console.log('  Missing:', missing.map(b => b.name).join(', '));
}

async function run() {
  await fixLogos();
  await addCovers();
  console.log('\n✅ DONE!');
}
run().catch(console.error);
