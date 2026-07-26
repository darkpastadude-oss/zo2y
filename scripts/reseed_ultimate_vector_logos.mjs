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
  "Taco Bell": "tacobell"
};

const LOGO_WINE = {
  "Adidas": "https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg",
  "Nike": "https://www.logo.wine/a/logo/Nike,_Inc./Nike,_Inc.-Logo.wine.svg",
  "American Eagle": "https://www.logo.wine/a/logo/American_Eagle_Outfitters/American_Eagle_Outfitters-Logo.wine.svg",
  "Aritzia": "https://www.logo.wine/a/logo/Aritzia/Aritzia-Logo.wine.svg",
  "ASICS": "https://www.logo.wine/a/logo/Asics/Asics-Logo.wine.svg",
  "Balenciaga": "https://www.logo.wine/a/logo/Balenciaga/Balenciaga-Logo.wine.svg",
  "Chanel": "https://www.logo.wine/a/logo/Chanel/Chanel-Logo.wine.svg",
  "Fendi": "https://www.logo.wine/a/logo/Fendi/Fendi-Logo.wine.svg",
  "Gap": "https://www.logo.wine/a/logo/Gap_Inc./Gap_Inc.-Logo.wine.svg",
  "Gucci": "https://www.logo.wine/a/logo/Gucci/Gucci-Logo.wine.svg",
  "H&M": "https://www.logo.wine/a/logo/H%26M/H%26M-Logo.wine.svg",
  "Hugo Boss": "https://www.logo.wine/a/logo/Hugo_Boss/Hugo_Boss-Logo.wine.svg",
  "HUGO BOSS": "https://www.logo.wine/a/logo/Hugo_Boss/Hugo_Boss-Logo.wine.svg",
  "Jimmy Choo": "https://www.logo.wine/a/logo/Jimmy_Choo_Ltd/Jimmy_Choo_Ltd-Logo.wine.svg",
  "Lacoste": "https://www.logo.wine/a/logo/Lacoste/Lacoste-Logo.wine.svg",
  "Louis Vuitton": "https://www.logo.wine/a/logo/Louis_Vuitton/Louis_Vuitton-Logo.wine.svg",
  "Puma": "https://www.logo.wine/a/logo/Puma_(brand)/Puma_(brand)-Logo.wine.svg",
  "Ralph Lauren": "https://www.logo.wine/a/logo/Ralph_Lauren_Corporation/Ralph_Lauren_Corporation-Logo.wine.svg",
  "Reebok": "https://www.logo.wine/a/logo/Reebok/Reebok-Logo.wine.svg",
  "Tiffany & Co.": "https://www.logo.wine/a/logo/Tiffany_%26_Co./Tiffany_%26_Co.-Logo.wine.svg",
  "Under Armour": "https://www.logo.wine/a/logo/Under_Armour/Under_Armour-Logo.wine.svg",
  "Valentino": "https://www.logo.wine/a/logo/Valentino_(fashion_house)/Valentino_(fashion_house)-Logo.wine.svg",
  "Zara": "https://www.logo.wine/a/logo/Zara_(retailer)/Zara_(retailer)-Logo.wine.svg",
  "7-Eleven": "https://www.logo.wine/a/logo/7-Eleven/7-Eleven-Logo.wine.svg",
  "Applebee's": "https://www.logo.wine/a/logo/Applebee%27s/Applebee%27s-Logo.wine.svg",
  "Arby's": "https://www.logo.wine/a/logo/Arby%27s/Arby%27s-Logo.wine.svg",
  "Auntie Anne's": "https://www.logo.wine/a/logo/Auntie_Anne%27s/Auntie_Anne%27s-Logo.wine.svg",
  "Ben & Jerry's": "https://www.logo.wine/a/logo/Ben_%26_Jerry%27s/Ben_%26_Jerry%27s-Logo.wine.svg",
  "Buffalo Wild Wings": "https://www.logo.wine/a/logo/Buffalo_Wild_Wings/Buffalo_Wild_Wings-Logo.wine.svg",
  "Burger King": "https://www.logo.wine/a/logo/Burger_King/Burger_King-Logo.wine.svg",
  "Cargill": "https://www.logo.wine/a/logo/Cargill/Cargill-Logo.wine.svg",
  "Chick-fil-A": "https://www.logo.wine/a/logo/Chick-fil-A/Chick-fil-A-Logo.wine.svg",
  "Chili's": "https://www.logo.wine/a/logo/Chili%27s/Chili%27s-Logo.wine.svg",
  "Chipotle": "https://www.logo.wine/a/logo/Chipotle_Mexican_Grill/Chipotle_Mexican_Grill-Logo.wine.svg",
  "Chuck E. Cheese": "https://www.logo.wine/a/logo/Chuck_E._Cheese/Chuck_E._Cheese-Logo.wine.svg",
  "Cinnabon": "https://www.logo.wine/a/logo/Cinnabon/Cinnabon-Logo.wine.svg",
  "Costa Coffee": "https://www.logo.wine/a/logo/Costa_Coffee/Costa_Coffee-Logo.wine.svg",
  "Cracker Barrel": "https://www.logo.wine/a/logo/Cracker_Barrel/Cracker_Barrel-Logo.wine.svg",
  "Dairy Queen": "https://www.logo.wine/a/logo/Dairy_Queen/Dairy_Queen-Logo.wine.svg",
  "Danone": "https://www.logo.wine/a/logo/Danone/Danone-Logo.wine.svg",
  "Del Taco": "https://www.logo.wine/a/logo/Del_Taco/Del_Taco-Logo.wine.svg",
  "Denny's": "https://www.logo.wine/a/logo/Denny%27s/Denny%27s-Logo.wine.svg",
  "Domino's": "https://www.logo.wine/a/logo/Domino%27s_Pizza/Domino%27s_Pizza-Logo.wine.svg",
  "Domino's Pizza": "https://www.logo.wine/a/logo/Domino%27s_Pizza/Domino%27s_Pizza-Logo.wine.svg",
  "Dunkin'": "https://www.logo.wine/a/logo/Dunkin%27_Donuts/Dunkin%27_Donuts-Logo.wine.svg",
  "El Pollo Loco": "https://www.logo.wine/a/logo/El_Pollo_Loco/El_Pollo_Loco-Logo.wine.svg",
  "Five Guys": "https://www.logo.wine/a/logo/Five_Guys/Five_Guys-Logo.wine.svg",
  "Godiva": "https://www.logo.wine/a/logo/Godiva_Chocolatier/Godiva_Chocolatier-Logo.wine.svg",
  "Häagen-Dazs": "https://www.logo.wine/a/logo/H%C3%A4agen-Dazs/H%C3%A4agen-Dazs-Logo.wine.svg",
  "Heinz": "https://www.logo.wine/a/logo/Heinz/Heinz-Logo.wine.svg",
  "IHOP": "https://www.logo.wine/a/logo/IHOP/IHOP-Logo.wine.svg",
  "In-N-Out Burger": "https://www.logo.wine/a/logo/In-N-Out_Burger/In-N-Out_Burger-Logo.wine.svg",
  "Jack in the Box": "https://www.logo.wine/a/logo/Jack_in_the_Box/Jack_in_the_Box-Logo.wine.svg",
  "Jamba Juice": "https://www.logo.wine/a/logo/Jamba_Juice/Jamba_Juice-Logo.wine.svg",
  "Jimmy John's": "https://www.logo.wine/a/logo/Jimmy_John%27s/Jimmy_John%27s-Logo.wine.svg",
  "Jollibee": "https://www.logo.wine/a/logo/Jollibee/Jollibee-Logo.wine.svg",
  "Kellogg's": "https://www.logo.wine/a/logo/Kellogg%27s/Kellogg%27s-Logo.wine.svg",
  "KFC": "https://www.logo.wine/a/logo/KFC/KFC-Logo.wine.svg",
  "Krispy Kreme": "https://www.logo.wine/a/logo/Krispy_Kreme/Krispy_Kreme-Logo.wine.svg",
  "Lindt": "https://www.logo.wine/a/logo/Lindt_%26_Spr%C3%BCngli/Lindt_%26_Spr%C3%BCngli-Logo.wine.svg",
  "Little Caesars": "https://www.logo.wine/a/logo/Little_Caesars/Little_Caesars-Logo.wine.svg",
  "McDonald's": "https://www.logo.wine/a/logo/McDonald%27s/McDonald%27s-Logo.wine.svg",
  "Nando's": "https://www.logo.wine/a/logo/Nando%27s/Nando%27s-Logo.wine.svg",
  "Nestlé": "https://www.logo.wine/a/logo/Nestl%C3%A9/Nestl%C3%A9-Logo.wine.svg",
  "Nutella": "https://www.logo.wine/a/logo/Nutella/Nutella-Logo.wine.svg",
  "Olive Garden": "https://www.logo.wine/a/logo/Olive_Garden/Olive_Garden-Logo.wine.svg",
  "Outback Steakhouse": "https://www.logo.wine/a/logo/Outback_Steakhouse/Outback_Steakhouse-Logo.wine.svg",
  "Panda Express": "https://www.logo.wine/a/logo/Panda_Express/Panda_Express-Logo.wine.svg",
  "Panera Bread": "https://www.logo.wine/a/logo/Panera_Bread/Panera_Bread-Logo.wine.svg",
  "Papa John's": "https://www.logo.wine/a/logo/Papa_John%27s_Pizza/Papa_John%27s_Pizza-Logo.wine.svg",
  "Pizza Hut": "https://www.logo.wine/a/logo/Pizza_Hut/Pizza_Hut-Logo.wine.svg",
  "Popeyes": "https://www.logo.wine/a/logo/Popeyes/Popeyes-Logo.wine.svg",
  "Pret A Manger": "https://www.logo.wine/a/logo/Pret_A_Manger/Pret_A_Manger-Logo.wine.svg",
  "Qdoba": "https://www.logo.wine/a/logo/Qdoba/Qdoba-Logo.wine.svg",
  "Red Lobster": "https://www.logo.wine/a/logo/Red_Lobster/Red_Lobster-Logo.wine.svg",
  "Red Robin": "https://www.logo.wine/a/logo/Red_Robin/Red_Robin-Logo.wine.svg",
  "Shake Shack": "https://www.logo.wine/a/logo/Shake_Shack/Shake_Shack-Logo.wine.svg",
  "Sonic Drive-In": "https://www.logo.wine/a/logo/Sonic_Drive-In/Sonic_Drive-In-Logo.wine.svg",
  "Starbucks": "https://www.logo.wine/a/logo/Starbucks/Starbucks-Logo.wine.svg",
  "Subway": "https://www.logo.wine/a/logo/Subway_(restaurant)/Subway_(restaurant)-Logo.wine.svg",
  "Taco Bell": "https://www.logo.wine/a/logo/Taco_Bell/Taco_Bell-Logo.wine.svg",
  "TGI Fridays": "https://www.logo.wine/a/logo/TGI_Fridays/TGI_Fridays-Logo.wine.svg",
  "The Cheesecake Factory": "https://www.logo.wine/a/logo/The_Cheesecake_Factory/The_Cheesecake_Factory-Logo.wine.svg",
  "Tim Hortons": "https://www.logo.wine/a/logo/Tim_Hortons/Tim_Hortons-Logo.wine.svg",
  "Wendy's": "https://www.logo.wine/a/logo/Wendy%27s/Wendy%27s-Logo.wine.svg",
  "Whataburger": "https://www.logo.wine/a/logo/Whataburger/Whataburger-Logo.wine.svg",
  "White Castle": "https://www.logo.wine/a/logo/White_Castle_(restaurant)/White_Castle_(restaurant)-Logo.wine.svg",
  "Wingstop": "https://www.logo.wine/a/logo/Wingstop/Wingstop-Logo.wine.svg"
};

async function fetchVectorSvg(brandName) {
  // Strategy 1: SimpleIcons
  const sSlug = SIMPLE_ICONS[brandName];
  if (sSlug) {
    try {
      const url = `https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${sSlug}.svg`;
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, source: 'SimpleIcons' };
      }
    } catch(e) {}
  }

  // Strategy 2: Logo.wine
  const wUrl = LOGO_WINE[brandName];
  if (wUrl) {
    try {
      const res = await fetch(wUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, source: 'Logo.wine' };
      }
    } catch(e) {}
  }

  // Strategy 3: Dynamic Logo.wine candidate
  const cleanName = brandName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  const candidates = [
    cleanName,
    cleanName + '_(brand)',
    cleanName + '_(company)',
    cleanName + '_Inc.',
    cleanName + '_(retailer)',
    cleanName + '_(clothing)',
    cleanName + '_(fashion_house)'
  ];

  for (const c of candidates) {
    const url = `https://www.logo.wine/a/logo/${encodeURIComponent(c)}/${encodeURIComponent(c)}-Logo.wine.svg`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, source: 'Logo.wine Candidate' };
      }
    } catch(e) {}
  }

  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Processing ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const asset = await fetchVectorSvg(item.name);
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
      console.log(`[${i + 1}/${items.length}] ✓ PRISTINE VECTOR SVG STORED (${asset.source}): ${item.name} -> ${localPath} (${asset.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ MISSING VECTOR SVG FOR: ${item.name}`);
    }

    await delay(100);
  }

  console.log(`Completed ${tableName}: ${count}/${items.length} pristine vector SVGs stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ ALL AVAILABLE PRISTINE VECTOR SVGS STORED & UPDATED!');
}

run();
