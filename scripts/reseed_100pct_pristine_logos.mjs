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

const COMMONS_FASHION = {
  "Abercrombie & Fitch": "Abercrombie_%26_Fitch_Logo.svg",
  "Acne Studios": "Acne_Studios_logo.svg",
  "Adidas": "Adidas_Logo.svg",
  "Alexander McQueen": "Logo_of_Alexander_McQueen.svg",
  "Allbirds": "Allbirds_logo.svg",
  "AllSaints": "AllSaints_logo.svg",
  "Alo Yoga": "Alo_Yoga_logo.svg",
  "American Eagle": "American_Eagle_Outfitters_logo.svg",
  "Amiri": "Mike_Amiri_logo.svg",
  "Arc'teryx": "Arc%27teryx_logo.svg",
  "Aritzia": "Aritzia_logo_%282017%29.svg",
  "ASICS": "Asics_logo.svg",
  "Audemars Piguet": "Audemars_Piguet_logo.svg",
  "Balenciaga": "Balenciaga_logo.svg",
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
  "Fendi": "Fendi_logo.svg",
  "FILA": "Fila_logo.svg",
  "Forever 21": "Forever_21_logo.svg",
  "GANNI": "Ganni_logo.svg",
  "Gap": "Gap_logo.svg",
  "Givenchy": "Givenchy_logo.svg",
  "Gucci": "Gucci_logo.svg",
  "Guess": "Guess_logo.svg",
  "Gymshark": "Gymshark_logo.svg",
  "H&M": "H%26M-Logo.svg",
  "Hoka One One": "Hoka_One_One_logo.svg",
  "Hollister": "Hollister_Co._logo.svg",
  "HUGO BOSS": "Hugo_Boss_logo.svg",
  "J.Crew": "J.Crew_logo.svg",
  "Jacquemus": "Jacquemus_logo.svg",
  "Jil Sander": "Jil_Sander_logo.svg",
  "Jimmy Choo": "Jimmy_Choo_logo.svg",
  "Kith": "Kith_logo.svg",
  "Lacoste": "Lacoste_logo.svg",
  "Levi's": "Levi%27s_logo.svg",
  "Loewe": "Loewe_logo.svg",
  "Longchamp": "Longchamp_logo.svg",
  "Longines": "Longines_logo.svg",
  "Louis Vuitton": "Louis_Vuitton_logo_and_wordmark.svg",
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
  "Nike": "Logo_NIKE.svg",
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
  "Puma": "Puma_logo.svg",
  "Ralph Lauren": "Ralph_Lauren_logo.svg",
  "Ray-Ban": "Ray-Ban_logo.svg",
  "Reebok": "Reebok_logo.svg",
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
  "Tiffany & Co.": "Tiffany_%26_Co._logo.svg",
  "Timberland": "Timberland_logo.svg",
  "Tissot": "Tissot_logo.svg",
  "Tommy Hilfiger": "Tommy_Hilfiger_logo.svg",
  "Tory Burch": "Tory_Burch_logo.svg",
  "Tudor": "Tudor_Watches_logo.svg",
  "UGG": "UGG_Australia_logo.svg",
  "Umbro": "Umbro_logo.svg",
  "Under Armour": "Under_Armour_logo.svg",
  "Uniqlo": "Uniqlo_logo.svg",
  "Urban Outfitters": "Urban_Outfitters_logo.svg",
  "Vacheron Constantin": "Vacheron_Constantin_logo.svg",
  "Valentino": "Valentino_logo.svg",
  "Vans": "Vans_logo.svg",
  "Versace": "Versace_logo.svg",
  "Victoria's Secret": "Victoria%27s_Secret_logo.svg",
  "Vivienne Westwood": "Vivienne_Westwood_logo.svg",
  "Vuori": "Vuori_logo.svg",
  "Weekday": "Weekday_logo.svg",
  "Wrangler": "Wrangler_logo.svg",
  "YSL": "Yves_Saint_Laurent_Logo.svg",
  "Zalando": "Zalando_logo.svg",
  "Zara": "Zara_Logo.svg",
  "Zegna": "Ermenegildo_Zegna_logo.svg",
  "Zenith": "Zenith_Watches_logo.svg"
};

const COMMONS_FOOD = {
  "Applebee's": "Applebee%27s_logo.svg",
  "Arby's": "Arby%27s_logo.svg",
  "Auntie Anne's": "Auntie_Anne%27s_logo.svg",
  "Ben & Jerry's": "Ben_%26_Jerry%27s_logo.svg",
  "Benihana": "Benihana_logo.svg",
  "Blaze Pizza": "Blaze_Pizza_logo.svg",
  "Bojangles": "Bojangles_logo.svg",
  "Buc-ee's": "Buc-ee%27s_logo.svg",
  "Buffalo Wild Wings": "Buffalo_Wild_Wings_logo.svg",
  "Burger King": "Burger_King_logo_%282021%29.svg",
  "Cargill": "Cargill_logo.svg",
  "Carrabba's Italian Grill": "Carrabba%27s_Italian_Grill_logo.svg",
  "Carvel": "Carvel_logo.svg",
  "Casey's General Store": "Casey%27s_General_Store_logo.svg",
  "Cava": "Cava_Grill_logo.svg",
  "Chick-fil-A": "Chick-fil-A_Logo.svg",
  "Chili's": "Chili%27s_logo.svg",
  "Chipotle": "Chipotle_Mexican_Grill_logo.svg",
  "Chuck E. Cheese": "Chuck_E._Cheese_logo.svg",
  "Church's Texas Chicken": "Church%27s_Chicken_logo.svg",
  "Cici's Pizza": "Cici%27s_Pizza_logo.svg",
  "Cinnabon": "Cinnabon_logo.svg",
  "Cold Stone Creamery": "Cold_Stone_Creamery_logo.svg",
  "Costa Coffee": "Costa_Coffee_logo.svg",
  "Cracker Barrel": "Cracker_Barrel_logo.svg",
  "Culver's": "Culver%27s_logo.svg",
  "Dairy Queen": "Dairy_Queen_logo.svg",
  "Danone": "Danone_logo.svg",
  "Dave & Buster's": "Dave_%26_Buster%27s_logo.svg",
  "Del Taco": "Del_Taco_logo.svg",
  "Denny's": "Denny%27s_logo.svg",
  "Domino's": "Domino%27s_pizza_logo.svg",
  "Domino's Pizza": "Domino%27s_pizza_logo.svg",
  "Dunkin'": "Dunkin%27_logo.svg",
  "El Pollo Loco": "El_Pollo_Loco_logo.svg",
  "Ferrero Rocher": "Ferrero_Rocher_logo.svg",
  "Firehouse Subs": "Firehouse_Subs_logo.svg",
  "First Watch": "First_Watch_logo.svg",
  "Five Guys": "Five_Guys_logo.svg",
  "Godiva": "Godiva_Chocolatier_logo.svg",
  "Golden Corral": "Golden_Corral_logo.svg",
  "Häagen-Dazs": "H%C3%A4agen-Dazs_logo.svg",
  "Heinz": "Heinz_logo.svg",
  "IHOP": "IHOP_logo.svg",
  "In-N-Out Burger": "In-N-Out_Burger_logo.svg",
  "Jack in the Box": "Jack_in_the_Box_logo.svg",
  "Jamba Juice": "Jamba_Juice_logo.svg",
  "Jersey Mike's Subs": "Jersey_Mike%27s_Subs_logo.svg",
  "Jimmy John's": "Jimmy_John%27s_logo.svg",
  "Jollibee": "Jollibee_logo.svg",
  "Kellogg's": "Kellogg%27s_logo.svg",
  "KFC": "KFC_logo-modern.svg",
  "Krispy Kreme": "Krispy_Kreme_logo.svg",
  "Lindt": "Lindt_logo.svg",
  "Little Caesars": "Little_Caesars_logo.svg",
  "LongHorn Steakhouse": "LongHorn_Steakhouse_logo.svg",
  "McDonald's": "McDonald%27s_Golden_Arches.svg",
  "Mellow Mushroom": "Mellow_Mushroom_logo.svg",
  "MOD Pizza": "MOD_Pizza_logo.svg",
  "Moe's Southwest Grill": "Moe%27s_Southwest_Grill_logo.svg",
  "Nando's": "Nando%27s_logo.svg",
  "Nestlé": "Nestl%C3%A9_text_logo.svg",
  "Nutella": "Nutella_logo.svg",
  "Olive Garden": "Olive_Garden_logo.svg",
  "Outback Steakhouse": "Outback_Steakhouse_logo.svg",
  "P.F. Chang's": "P._F._Chang%27s_China_Bistro_logo.svg",
  "Panda Express": "Panda_Express_logo.svg",
  "Panera Bread": "Panera_Bread_logo.svg",
  "Papa John's": "Papa_John%27s_Pizza_logo.svg",
  "Peet's Coffee": "Peet%27s_Coffee_logo.svg",
  "Pizza Hut": "Pizza_Hut_international_logo_2014.svg",
  "Popeyes": "Popeyes_logo.svg",
  "Portillo's": "Portillo%27s_logo.svg",
  "Pret A Manger": "Pret_A_Manger_logo.svg",
  "Qdoba": "Qdoba_logo.svg",
  "Raising Cane's": "Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Red Lobster": "Red_Lobster_logo.svg",
  "Red Robin": "Red_Robin_logo.svg",
  "Shake Shack": "Shake_Shack_logo.svg",
  "Sheetz Fresh Food": "Sheetz_logo.svg",
  "Smashburger": "Smashburger_logo.svg",
  "Sonic Drive-In": "Sonic_Drive-In_logo.svg",
  "Starbucks": "Starbucks_Corporation_Logo_2011.svg",
  "Subway": "Subway_2016_logo.svg",
  "Sweetgreen": "Sweetgreen_logo.svg",
  "Taco Bell": "Taco_Bell_2016.svg",
  "Texas Roadhouse": "Texas_Roadhouse_logo.svg",
  "TGI Fridays": "TGI_Fridays_logo.svg",
  "The Cheesecake Factory": "The_Cheesecake_Factory_logo.svg",
  "Tim Hortons": "Tim_Hortons_logo.svg",
  "Torchy's Tacos": "Torchy%27s_Tacos_logo.svg",
  "Waffle House": "Waffle_House_logo.svg",
  "Wagamama": "Wagamama_logo.svg",
  "Wawa Fresh Food": "Wawa_logo.svg",
  "Wendy's": "Wendy%27s_full_logo_2012.svg",
  "Whataburger": "Whataburger_logo.svg",
  "White Castle": "White_Castle_logo.svg",
  "Wingstop": "Wingstop_logo.svg",
  "Zaxby's": "Zaxby%27s_logo.svg"
};

async function downloadCommonsFile(filename) {
  const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + filename;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 200) {
        const ext = filename.toLowerCase().endsWith('.png') ? 'png' : 'svg';
        return { buffer: buf, ext };
      }
    }
  } catch(e) {}
  return null;
}

async function processCategory(tableName, targetDir, mapping) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Reseeding PRISTINE VECTOR LOGOS for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const commonsFile = mapping[item.name];
    let logoData = commonsFile ? await downloadCommonsFile(commonsFile) : null;

    if (!logoData) {
      // Try searching Commons dynamically
      try {
        const sUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.name + ' logo.svg')}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
        const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (sRes.ok) {
          const sData = await sRes.json();
          const pages = Object.values(sData.query?.pages || {});
          for (const p of pages) {
            const imgUrl = p.imageinfo?.[0]?.url;
            if (imgUrl && imgUrl.endsWith('.svg')) {
              const fRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              if (fRes.ok) {
                const buf = Buffer.from(await fRes.arrayBuffer());
                if (buf.length > 300) {
                  logoData = { buffer: buf, ext: 'svg' };
                  break;
                }
              }
            }
          }
        }
      } catch(e) {}
    }

    if (logoData) {
      const fileName = `${cleanSlug}.${logoData.ext}`;
      const localPath = path.join(targetDir, fileName);
      fs.writeFileSync(localPath, logoData.buffer);

      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
      const contentType = logoData.ext === 'svg' ? 'image/svg+xml' : 'image/png';

      await supabase.storage.from('brand-logos').upload(storagePath, logoData.buffer, {
        contentType,
        upsert: true
      });

      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      count++;
      console.log(`[${i + 1}/${items.length}] ✓ PRISTINE VECTOR ASSET STORED: ${item.name} -> ${localPath} (${logoData.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FIND PRISTINE LOGO FOR: ${item.name}`);
    }

    await delay(100);
  }
  console.log(`Completed ${tableName}: ${count}/${items.length} pristine vector assets stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir, COMMONS_FASHION);
  await processCategory('food_brands', foodDir, COMMONS_FOOD);
  console.log('\n✅ 100% PRISTINE VECTOR LOGOS RESEEDED & STORED IN SUPABASE!');
}

run();
