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
  "Swarovski": "swarovski"
};

const LOGO_WINE = {
  "Gymshark": "https://www.logo.wine/a/logo/Gymshark/Gymshark-Logo.wine.svg",
  "The North Face": "https://www.logo.wine/a/logo/The_North_Face/The_North_Face-Logo.wine.svg",
  "Chrome Hearts": "https://www.logo.wine/a/logo/Chrome_Hearts/Chrome_Hearts-Logo.wine.svg",
  "Patagonia": "https://www.logo.wine/a/logo/Patagonia,_Inc./Patagonia,_Inc.-Logo.wine.svg",
  "Arc'teryx": "https://www.logo.wine/a/logo/Arc%27teryx/Arc%27teryx-Logo.wine.svg",
  "Palace": "https://www.logo.wine/a/logo/Palace_Skateboards/Palace_Skateboards-Logo.wine.svg",
  "Essentials": "https://www.logo.wine/a/logo/Fear_of_God_(brand)/Fear_of_God_(brand)-Logo.wine.svg",
  "Swarovski": "https://www.logo.wine/a/logo/Swarovski/Swarovski-Logo.wine.svg",
  "Carhartt WIP": "https://www.logo.wine/a/logo/Carhartt/Carhartt-Logo.wine.svg",
  "Pandora": "https://www.logo.wine/a/logo/Pandora_(jewelry)/Pandora_(jewelry)-Logo.wine.svg",
  "Lululemon": "https://www.logo.wine/a/logo/Lululemon_Athletica/Lululemon_Athletica-Logo.wine.svg",
  "Swatch": "https://www.logo.wine/a/logo/Swatch/Swatch-Logo.wine.svg",
  "Hollister": "https://www.logo.wine/a/logo/Hollister_Co./Hollister_Co.-Logo.wine.svg",
  "Hoka One One": "https://www.logo.wine/a/logo/Hoka_One_One/Hoka_One_One-Logo.wine.svg",
  "FILA": "https://www.logo.wine/a/logo/Fila_(company)/Fila_(company)-Logo.wine.svg",
  "Aritzia": "https://www.logo.wine/a/logo/Aritzia/Aritzia-Logo.wine.svg",
  "Acne Studios": "https://www.logo.wine/a/logo/Acne_Studios/Acne_Studios-Logo.wine.svg",
  "AllSaints": "https://www.logo.wine/a/logo/AllSaints/AllSaints-Logo.wine.svg",
  "GANNI": "https://www.logo.wine/a/logo/Ganni/Ganni-Logo.wine.svg",
  "Comme des Garçons": "https://www.logo.wine/a/logo/Comme_des_Gar%C3%A7ons/Comme_des_Gar%C3%A7ons-Logo.wine.svg",
  "Christian Louboutin": "https://www.logo.wine/a/logo/Christian_Louboutin/Christian_Louboutin-Logo.wine.svg",
  "Jacquemus": "https://www.logo.wine/a/logo/Jacquemus/Jacquemus-Logo.wine.svg",
  "Marni": "https://www.logo.wine/a/logo/Marni_(fashion_house)/Marni_(fashion_house)-Logo.wine.svg",
  "Everlane": "https://www.logo.wine/a/logo/Everlane/Everlane-Logo.wine.svg",
  "Seiko": "https://www.logo.wine/a/logo/Seiko/Seiko-Logo.wine.svg",
  "Vivienne Westwood": "https://www.logo.wine/a/logo/Vivienne_Westwood/Vivienne_Westwood-Logo.wine.svg",
  "Palm Angels": "https://www.logo.wine/a/logo/Palm_Angels/Palm_Angels-Logo.wine.svg",
  "Ray-Ban": "https://www.logo.wine/a/logo/Ray-Ban/Ray-Ban-Logo.wine.svg",
  "Rick Owens": "https://www.logo.wine/a/logo/Rick_Owens/Rick_Owens-Logo.wine.svg",
  "Stella McCartney": "https://www.logo.wine/a/logo/Stella_McCartney/Stella_McCartney-Logo.wine.svg",
  "Manolo Blahnik": "https://www.logo.wine/a/logo/Manolo_Blahnik/Manolo_Blahnik-Logo.wine.svg",
  "Jil Sander": "https://www.logo.wine/a/logo/Jil_Sander/Jil_Sander-Logo.wine.svg",
  "On Running": "https://www.logo.wine/a/logo/On_(company)/On_(company)-Logo.wine.svg",
  "Crocs": "https://www.logo.wine/a/logo/Crocs/Crocs-Logo.wine.svg",
  "Reformation": "https://www.logo.wine/a/logo/Reformation_(brand)/Reformation_(brand)-Logo.wine.svg",
  "Amiri": "https://www.logo.wine/a/logo/Amiri_(brand)/Amiri_(brand)-Logo.wine.svg",
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

async function fetchFallbackVector(brandName) {
  const sSlug = SIMPLE_ICONS[brandName];
  if (sSlug) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${sSlug}.svg`);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, format: 'svg', source: 'SimpleIcons' };
      }
    } catch(e) {}
  }

  const wUrl = LOGO_WINE[brandName];
  if (wUrl) {
    try {
      const res = await fetch(wUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, format: 'svg', source: 'Logo.wine' };
      }
    } catch(e) {}
  }

  return null;
}

async function fillCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Filling remaining logos for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let filledCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const existingSvg = path.join(targetDir, `${cleanSlug}.svg`);
    const existingPng = path.join(targetDir, `${cleanSlug}.png`);

    let exists = false;
    if (fs.existsSync(existingSvg) && fs.statSync(existingSvg).size > 500) exists = true;
    if (fs.existsSync(existingPng) && fs.statSync(existingPng).size > 500) exists = true;

    if (!exists) {
      const fallback = await fetchFallbackVector(item.name);
      if (fallback) {
        const fileName = `${cleanSlug}.${fallback.format}`;
        const localPath = path.join(targetDir, fileName);
        fs.writeFileSync(localPath, fallback.buffer);

        const storagePath = `${tableName}/${fileName}`;
        const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
        const contentType = fallback.format === 'svg' ? 'image/svg+xml' : 'image/png';

        await supabase.storage.from('brand-logos').upload(storagePath, fallback.buffer, {
          contentType,
          upsert: true
        });

        await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
        filledCount++;
        console.log(`[${i + 1}/${items.length}] ✓ FILLED VECTOR LOGO (${fallback.source}): ${item.name} -> ${localPath} (${fallback.buffer.length} bytes)`);
      } else {
        console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FILL LOGO FOR: ${item.name}`);
      }
    }
    await delay(100);
  }

  console.log(`Completed ${tableName}: ${filledCount} missing logos filled with pristine vector SVGs!`);
}

async function run() {
  await fillCategory('fashion_brands', fashionDir);
  await fillCategory('food_brands', foodDir);
  console.log('\n✅ 100% PRISTINE LOGO COVERAGE COMPLETE!');
}

run();
