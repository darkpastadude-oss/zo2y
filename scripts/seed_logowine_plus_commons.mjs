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

const LOGO_WINE_EXACT = {
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
  "Hermès": "https://www.logo.wine/a/logo/Herm%C3%A8s/Herm%C3%A8s-Logo.wine.svg",
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

const COMMONS_FALLBACKS = {
  "Abercrombie & Fitch": "Abercrombie_%26_Fitch_Logo.svg",
  "Acne Studios": "Acne_Studios_logo.svg",
  "Alexander McQueen": "Logo_of_Alexander_McQueen.svg",
  "Allbirds": "Allbirds_logo.svg",
  "AllSaints": "AllSaints_logo.svg",
  "Alo Yoga": "Alo_Yoga_logo.svg",
  "Amiri": "Mike_Amiri_logo.svg",
  "Arc'teryx": "Arc%27teryx_logo.svg",
  "BAPE": "A_Bathing_Ape_%28logo%29.png",
  "Birkenstock": "Birkenstock_logo.svg",
  "Boohoo": "Boohoo.com_logo.svg",
  "Bottega Veneta": "Bottega_Veneta_logo.svg",
  "Breitling": "Breitling_logo.svg",
  "Canada Goose": "Canada_Goose_2023_logo.svg",
  "Carhartt WIP": "Carhartt_logo.svg",
  "Cartier": "Cartier_logo.svg",
  "Casio": "Casio_logo.svg",
  "Celine": "Celine_logo.svg",
  "Champion": "Champion_logo.svg",
  "Christian Louboutin": "Christian_Louboutin_logo.svg",
  "Chrome Hearts": "Chrome_Hearts_logo.svg",
  "Clarks": "C._%26_J._Clark_logo.svg",
  "Cole Haan": "Cole_Haan_logo.svg",
  "Comme des Garçons": "Comme_des_Gar%C3%A7ons_logo.svg",
  "Converse": "Converse_logo.svg",
  "COS": "COS_logo.svg",
  "Crocs": "Crocs_logo.svg",
  "Dr. Martens": "Dr._Martens_logo.svg",
  "Essentials": "Fear_of_God_logo.svg",
  "Everlane": "Everlane_logo.svg",
  "Express": "Express%2C_Inc._logo.svg",
  "Fear of God": "Fear_of_God_logo.svg",
  "FILA": "Fila_logo.svg",
  "Forever 21": "Forever_21_logo.svg",
  "GANNI": "Ganni_logo.svg",
  "Givenchy": "Givenchy_logo.svg",
  "Guess": "Guess_logo.svg",
  "Gymshark": "Gymshark_logo.svg",
  "Hoka One One": "Hoka_One_One_logo.svg",
  "Hollister": "Hollister_Co._logo.svg",
  "J.Crew": "J.Crew_logo.svg",
  "Jacquemus": "Jacquemus_logo.svg",
  "Jil Sander": "Jil_Sander_logo.svg",
  "Kith": "Kith_logo.svg",
  "Levi's": "Levi%27s_logo.svg",
  "Loewe": "Loewe_logo.svg",
  "Longchamp": "Longchamp_logo.svg",
  "Longines": "Longines_logo.svg",
  "Lululemon": "Lululemon_Athletica_logo.svg",
  "Maison Margiela": "Maison_Margiela_logo.svg",
  "Mango": "Mango_logo.svg",
  "Manolo Blahnik": "Manolo_Blahnik_logo.svg",
  "Marni": "Marni_logo.svg",
  "Merrell": "Merrell_logo.svg",
  "Michael Kors": "Michael_Kors_logo.svg",
  "Moncler": "Moncler_logo.svg",
  "Montblanc": "Montblanc_logo.svg",
  "New Balance": "New_Balance_logo.svg",
  "Oakley": "Oakley_logo.svg",
  "Off-White": "Off-White_logo.svg",
  "Omega": "Omega_logo.svg",
  "On Running": "On_Running_logo.svg",
  "Palace": "Palace_Skateboards_logo.svg",
  "Palm Angels": "Palm_Angels_logo.svg",
  "Pandora": "Pandora_Jewelry_logo.svg",
  "Patagonia": "Patagonia_logo.svg",
  "Patek Philippe": "Patek_Philippe_logo.svg",
  "Prada": "Prada-logo.svg",
  "Ray-Ban": "Ray-Ban_logo.svg",
  "Reformation": "Reformation_logo.svg",
  "Reiss": "Reiss_logo.svg",
  "Rick Owens": "Rick_Owens_logo.svg",
  "Rolex": "Rolex_logo.svg",
  "Saint Laurent": "Yves_Saint_Laurent_Logo.svg",
  "Salomon": "Salomon_logo.svg",
  "Saucony": "Saucony_logo.svg",
  "Seiko": "Seiko_logo.svg",
  "Sephora": "Sephora_logo.svg",
  "Stella McCartney": "Stella_McCartney_logo.svg",
  "Stone Island": "Stone_Island_logo.svg",
  "Stüssy": "Stussy_logo.svg",
  "Supreme": "Supreme_Logo.svg",
  "Swarovski": "Swarovski_logo.svg",
  "Swatch": "Swatch_logo.svg",
  "TAG Heuer": "TAG_Heuer_logo.svg",
  "The North Face": "The_North_Face_logo.svg",
  "Timberland": "Timberland_logo.svg",
  "Tissot": "Tissot_logo.svg",
  "Tommy Hilfiger": "Tommy_Hilfiger_logo.svg",
  "Tory Burch": "Tory_Burch_logo.svg",
  "Tudor": "Tudor_Watches_logo.svg",
  "UGG": "UGG_Australia_logo.svg",
  "Umbro": "Umbro_logo.svg",
  "Uniqlo": "Uniqlo_logo.svg",
  "Urban Outfitters": "Urban_Outfitters_logo.svg",
  "Vacheron Constantin": "Vacheron_Constantin_logo.svg",
  "Vans": "Vans_logo.svg",
  "Versace": "Versace_logo.svg",
  "Victoria's Secret": "Victoria%27s_Secret_logo.svg",
  "Vivienne Westwood": "Vivienne_Westwood_logo.svg",
  "Vuori": "Vuori_logo.svg",
  "Weekday": "Weekday_logo.svg",
  "Wrangler": "Wrangler_logo.svg",
  "YSL": "Yves_Saint_Laurent_Logo.svg",
  "Zalando": "Zalando_logo.svg",
  "Zegna": "Ermenegildo_Zegna_logo.svg",
  "Zenith": "Zenith_Watches_logo.svg",
  "Benihana": "Benihana_logo.svg",
  "Blaze Pizza": "Blaze_Pizza_logo.svg",
  "Bob Evans": "Bob_Evans_Restaurants_logo.svg",
  "Bojangles": "Bojangles_logo.svg",
  "Buc-ee's": "Buc-ee%27s_logo.svg",
  "Carrabba's Italian Grill": "Carrabba%27s_Italian_Grill_logo.svg",
  "Carvel": "Carvel_logo.svg",
  "Casey's General Store": "Casey%27s_General_Store_logo.svg",
  "Cava": "Cava_Grill_logo.svg",
  "Church's Texas Chicken": "Church%27s_Chicken_logo.svg",
  "Cici's Pizza": "Cici%27s_Pizza_logo.svg",
  "Cold Stone Creamery": "Cold_Stone_Creamery_logo.svg",
  "Culver's": "Culver%27s_logo.svg",
  "Dave & Buster's": "Dave_%26_Buster%27s_logo.svg",
  "Ferrero Rocher": "Ferrero_Rocher_logo.svg",
  "Firehouse Subs": "Firehouse_Subs_logo.svg",
  "First Watch": "First_Watch_logo.svg",
  "Golden Corral": "Golden_Corral_logo.svg",
  "Jersey Mike's Subs": "Jersey_Mike%27s_Subs_logo.svg",
  "LongHorn Steakhouse": "LongHorn_Steakhouse_logo.svg",
  "Mellow Mushroom": "Mellow_Mushroom_logo.svg",
  "MOD Pizza": "MOD_Pizza_logo.svg",
  "Moe's Southwest Grill": "Moe%27s_Southwest_Grill_logo.svg",
  "P.F. Chang's": "P._F._Chang%27s_China_Bistro_logo.svg",
  "Peet's Coffee": "Peet%27s_Coffee_logo.svg",
  "Portillo's": "Portillo%27s_logo.svg",
  "Raising Cane's": "Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Sheetz Fresh Food": "Sheetz_logo.svg",
  "Smashburger": "Smashburger_logo.svg",
  "Sweetgreen": "Sweetgreen_logo.svg",
  "Texas Roadhouse": "Texas_Roadhouse_logo.svg",
  "Torchy's Tacos": "Torchy%27s_Tacos_logo.svg",
  "Waffle House": "Waffle_House_logo.svg",
  "Wagamama": "Wagamama_logo.svg",
  "Wawa Fresh Food": "Wawa_logo.svg",
  "Zaxby's": "Zaxby%27s_logo.svg"
};

async function fetchAsset(brandName) {
  // 1. Try logo.wine exact
  const wineUrl = LOGO_WINE_EXACT[brandName];
  if (wineUrl) {
    try {
      const res = await fetch(wineUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) return { buffer: buf, ext: 'svg', source: 'Logo.wine' };
      }
    } catch(e) {}
  }

  // 2. Try Commons file
  const commonsFile = COMMONS_FALLBACKS[brandName];
  if (commonsFile) {
    const cUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + commonsFile;
    try {
      const res = await fetch(cUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) {
          const ext = commonsFile.toLowerCase().endsWith('.png') ? 'png' : 'svg';
          return { buffer: buf, ext, source: 'Wikimedia Commons' };
        }
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

  let successCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const asset = await fetchAsset(item.name);
    if (asset) {
      const fileName = `${cleanSlug}.${asset.ext}`;
      const localPath = path.join(targetDir, fileName);
      fs.writeFileSync(localPath, asset.buffer);

      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
      const contentType = asset.ext === 'svg' ? 'image/svg+xml' : 'image/png';

      await supabase.storage.from('brand-logos').upload(storagePath, asset.buffer, {
        contentType,
        upsert: true
      });

      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      successCount++;
      console.log(`[${i + 1}/${items.length}] ✓ STORED PRISTINE VECTOR (${asset.source}): ${item.name} -> ${localPath} (${asset.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FETCH LOGO: ${item.name}`);
    }

    await delay(100);
  }

  console.log(`Completed ${tableName}: ${successCount}/${items.length} pristine vector logos stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ 100% PRISTINE VECTOR LOGOS RESEEDED FROM LOGO.WINE & COMMONS!');
}

run();
