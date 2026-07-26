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

const COMMONS_SPECIFIC_FIXES = {
  // Fashion brands with letter boxes or photo boxes to replace with pristine SVGs:
  "Cartier": "Cartier_logo.svg",
  "Celine": "Celine_logo.svg",
  "Weekday": "Weekday_logo.svg",
  "Wrangler": "Wrangler_logo.svg",
  "Zenith": "Zenith_Watches_logo.svg",
  "AllSaints": "AllSaints_logo.svg",
  "Alexander McQueen": "Logo_of_Alexander_McQueen.svg",
  "Amiri": "Mike_Amiri_logo.svg",
  "Canada Goose": "Canada_Goose_2023_logo.svg",
  "Supreme": "Supreme_Logo.svg",
  "UGG": "UGG_Australia_logo.svg",
  "Givenchy": "Givenchy_logo.svg",
  "Balenciaga": "Balenciaga_logo.svg",
  "Prada": "Prada-logo.svg",
  "Off-White": "Off-White_logo.svg",
  "Oakley": "Oakley_logo.svg",
  "Mango": "Mango_logo.svg",
  "Kith": "Kith_logo.svg",
  "Loewe": "Loewe_logo.svg",
  "Longchamp": "Longchamp_logo.svg",
  "Hollister": "Hollister_Co._logo.svg",
  "Jimmy Choo": "Jimmy_Choo_logo.svg",
  "Jacquemus": "Jacquemus_logo.svg",
  "Guess": "Guess_logo.svg",
  "GANNI": "Ganni_logo.svg",
  "Express": "Express%2C_Inc._logo.svg",
  "Essentials": "Fear_of_God_logo.svg",
  "Everlane": "Everlane_logo.svg",
  "Converse": "Converse_logo.svg",
  "Christian Louboutin": "Christian_Louboutin_logo.svg",
  "Clarks": "C._%26_J._Clark_logo.svg",
  "Patek Philippe": "Patek_Philippe_logo.svg",
  "Pandora": "Pandora_Jewelry_logo.svg",
  "Puma": "Puma_logo.svg",
  "Ralph Lauren": "Ralph_Lauren_logo.svg",
  // Food brands:
  "Burger King": "Burger_King_logo_%282021%29.svg",
  "McDonald's": "McDonald%27s_Golden_Arches.svg",
  "Starbucks": "Starbucks_Corporation_Logo_2011.svg",
  "Taco Bell": "Taco_Bell_2016.svg",
  "Subway": "Subway_2016_logo.svg",
  "KFC": "KFC_logo-modern.svg",
  "Chipotle": "Chipotle_Mexican_Grill_logo.svg",
  "Wendy's": "Wendy%27s_full_logo_2012.svg",
  "Panera Bread": "Panera_Bread_logo.svg",
  "Dunkin'": "Dunkin%27_logo.svg",
  "Dominos": "Domino%27s_pizza_logo.svg",
  "Papa John's": "Papa_John%27s_Pizza_logo.svg",
  "Pizza Hut": "Pizza_Hut_international_logo_2014.svg",
  "Sonic Drive-In": "Sonic_Drive-In_logo.svg",
  "Arby's": "Arby%27s_logo.svg",
  "Dairy Queen": "Dairy_Queen_logo.svg",
  "Chick-fil-A": "Chick-fil-A_Logo.svg",
  "Popeyes": "Popeyes_logo.svg",
  "Cinnabon": "Cinnabon_logo.svg",
  "Culver's": "Culver%27s_logo.svg",
  "Jimmy John's": "Jimmy_John%27s_logo.svg",
  "Little Caesars": "Little_Caesars_logo.svg"
};

async function fetchCommonsSvg(filename) {
  const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + filename;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 300) return buf;
    }
  } catch(e) {}
  return null;
}

async function fixBrandLogos(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`Fixing specific brand wordmarks/logos for ${tableName}...`);

  for (const item of items) {
    const commonsFile = COMMONS_SPECIFIC_FIXES[item.name];
    if (commonsFile) {
      const svgBuf = await fetchCommonsSvg(commonsFile);
      if (svgBuf) {
        const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
        const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

        const fileName = `${cleanSlug}.svg`;
        const localPath = path.join(targetDir, fileName);
        fs.writeFileSync(localPath, svgBuf);

        const storagePath = `${tableName}/${fileName}`;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

        await supabase.storage.from('brand-logos').upload(storagePath, svgBuf, {
          contentType: 'image/svg+xml',
          upsert: true
        });

        await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
        console.log(`✓ REPLACED WITH PRISTINE SVG: ${item.name} -> ${localPath} (${svgBuf.length} bytes)`);
      }
    }
  }
}

async function run() {
  await fixBrandLogos('fashion_brands', fashionDir);
  await fixBrandLogos('food_brands', foodDir);
  console.log('\n✅ SPECIFIC LOGO FIXES APPLIED!');
}

run();
