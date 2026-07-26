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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .dev.vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COMMONS_MAP = {
  // ── FASHION ──────────────────────────────────────────────────
  "Abercrombie & Fitch": "Abercrombie_%26_Fitch_Logo.svg",
  "Acne Studios": "Acne_Studios_logo.svg",
  "Adidas": "Adidas_Logo.svg",
  "Alexander McQueen": "Alexander_McQueen_logo.svg",
  "Allbirds": "Allbirds_logo.png",
  "AllSaints": "AllSaints_logo.svg",
  "Alo Yoga": "Alo_Yoga_logo.svg",
  "American Eagle": "American_Eagle_Outfitters_logo.svg",
  "Amiri": "Amiri_logo.svg",
  "Arc'teryx": "Arc%27teryx_logo.svg",
  "Aritzia": "Aritzia_logo.svg",
  "ASICS": "Asics_logo.svg",
  "Audemars Piguet": "Audemars_Piguet_logo.svg",
  "Balenciaga": "Balenciaga_logo.svg",
  "BAPE": "A_Bathing_Ape_logo.svg",
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
  "Express": "Express_Inc._logo.svg",
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
  "Zenith": "Zenith_Watches_logo.svg",

  // ── FOOD ─────────────────────────────────────────────────────
  "7-Eleven Slurpee & Fresh": "7-Eleven_logo.svg",
  "Applebee's": "Applebee%27s_logo.svg",
  "Arby's": "Arby%27s_logo.svg",
  "Auntie Anne's": "Auntie_Anne%27s_logo.svg",
  "Ben & Jerry's": "Ben_%26_Jerry%27s_logo.svg",
  "Benihana": "Benihana_logo.svg",
  "Blaze Pizza": "Blaze_Pizza_logo.svg",
  "Bob Evans": "Bob_Evans_Restaurants_logo.svg",
  "Bojangles": "Bojangles%27_logo.svg",
  "Buc-ee's": "Buc-ee%27s_logo.svg",
  "Buffalo Wild Wings": "Buffalo_Wild_Wings_logo.svg",
  "Burger King": "Burger_King_logo_%282021%29.svg",
  "Cargill": "Cargill_logo.svg",
  "Carrabba's Italian Grill": "Carrabba%27s_Italian_Grill_logo.svg",
  "Carvel": "Carvel_logo.svg",
  "Casey's General Store": "Casey%27s_General_Store_logo.svg",
  "Cava": "Cava_Group_logo.svg",
  "Chick-fil-A": "Chick-fil-A_Logo.svg",
  "Chili's": "Chili%27s_logo.svg",
  "Chipotle": "Chipotle_Mexican_Grill_logo.svg",
  "Chuck E. Cheese": "Chuck_E._Cheese_logo.svg",
  "Church's Texas Chicken": "Church%27s_Texas_Chicken_logo.svg",
  "Cici's Pizza": "CiCi%27s_Pizza_logo.svg",
  "Cinnabon": "Cinnabon_logo.svg",
  "Cold Stone Creamery": "Cold_Stone_Creamery_logo.svg",
  "Costa Coffee": "Costa_Coffee_logo.svg",
  "Cracker Barrel": "Cracker_Barrel_logo.svg",
  "Culver's": "Culver%27s_logo.svg",
  "Culver's Frozen Custard": "Culver%27s_logo.svg",
  "Dairy Queen": "Dairy_Queen_logo.svg",
  "Danone": "Danone_logo.svg",
  "Dave & Buster's": "Dave_%26_Buster%27s_logo.svg",
  "Del Taco": "Del_Taco_logo.svg",
  "Denny's": "Denny%27s_logo.svg",
  "Domino's": "Dominos_pizza_logo.svg",
  "Domino's Pizza": "Dominos_pizza_logo.svg",
  "Dunkin'": "Dunkin%27_logo.svg",
  "El Pollo Loco": "El_Pollo_Loco_logo.svg",
  "Ferrero Rocher": "Ferrero_Rocher_logo.svg",
  "Firehouse Subs": "Firehouse_Subs_logo.svg",
  "First Watch": "First-watch-logo.png",
  "Five Guys": "Five_Guys_logo.svg",
  "Giordano's": "Giordano%27s_logo.svg",
  "Godiva": "Godiva_Chocolatier_logo.svg",
  "Golden Corral": "Golden_Corral_logo.svg",
  "Häagen-Dazs": "Haagen-Dazs_logo.svg",
  "Heinz": "Heinz_logo.svg",
  "Hungry Howie's": "Hungry_Howie%27s_logo.svg",
  "IHOP": "IHOP_logo.svg",
  "In-N-Out Burger": "In-N-Out_Burger_logo.svg",
  "Jack in the Box": "Jack_in_the_Box_logo.svg",
  "Jamba Juice": "Jamba_Juice_logo.svg",
  "Jersey Mike's Subs": "Jersey_Mike%27s_Subs_logo.svg",
  "Jet's Pizza": "Jet%27s_Pizza_logo.svg",
  "Jimmy John's": "Jimmy_John%27s_logo.svg",
  "Jollibee": "Jollibee_logo.svg",
  "Kellogg's": "Kellogg%27s_logo.svg",
  "KFC": "KFC_logo.svg",
  "Krispy Kreme": "Krispy_Kreme_logo.svg",
  "Lindt": "Lindt_logo.svg",
  "Little Caesars": "Little_Caesars_logo.svg",
  "LongHorn Steakhouse": "LongHorn_Steakhouse_logo.svg",
  "Lou Malnati's": "Lou_Malnati%27s_Pizzeria_logo.svg",
  "Marco's Pizza": "Marco%27s_Pizza_logo.svg",
  "McDonald's": "McDonald%27s_Golden_Arches.svg",
  "Mellow Mushroom": "Mellow_Mushroom_logo.svg",
  "MOD Pizza": "MOD_Pizza_logo.svg",
  "Moe's Southwest Grill": "Moe%27s_Southwest_Grill_logo.svg",
  "Nando's": "Nando%27s_logo.svg",
  "Nestlé": "Nestle_logo.svg",
  "Nutella": "Nutella_logo.svg",
  "Olive Garden": "Olive_Garden_logo.svg",
  "Outback Steakhouse": "Outback_Steakhouse_logo.svg",
  "P.F. Chang's": "P._F._Chang%27s_logo.svg",
  "Panda Express": "Panda_Express_logo.svg",
  "Panera Bread": "Panera_Bread_logo.svg",
  "Papa John's": "Papa_John%27s_Pizza_logo.svg",
  "Peet's Coffee": "Peet%27s_Coffee_logo.svg",
  "Perkins Restaurant & Bakery": "Perkins_Restaurants_logo.svg",
  "Pizza Hut": "Pizza_Hut_logo.svg",
  "Popeyes": "Popeyes_logo.svg",
  "Portillo's": "Portillo%27s_logo.svg",
  "Pret A Manger": "Pret_A_Manger_logo.svg",
  "Qdoba": "Qdoba_Mexican_Eats_logo.svg",
  "QuikTrip": "QuikTrip_logo.svg",
  "Raising Cane's": "Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Red Lobster": "Red_Lobster_logo.svg",
  "Red Robin": "Red_Robin_logo.svg",
  "Round Table Pizza": "Round_Table_Pizza_logo.svg",
  "Shake Shack": "Shake_Shack_logo.svg",
  "Sheetz Fresh Food": "Sheetz_logo.svg",
  "Smashburger": "Smashburger_logo.svg",
  "Smoothie King": "Smoothie_King_logo.svg",
  "Snooze A.M. Eatery": "Snooze_A.M._Eatery_logo.svg",
  "Sonic Drive-In": "Sonic_Drive-In_logo.svg",
  "Starbucks": "Starbucks_Corporation_Logo_2011.svg",
  "Subway": "Subway_2016_logo.svg",
  "Sweetgreen": "Sweetgreen_logo.svg",
  "Taco Bell": "Taco_Bell_2016.svg",
  "Texas Roadhouse": "Texas_Roadhouse_logo.svg",
  "TGI Fridays": "TGI_Fridays_logo.svg",
  "The Capital Grille": "The_Capital_Grille_logo.svg",
  "The Cheesecake Factory": "The_Cheesecake_Factory_logo.svg",
  "The Habit Burger Grill": "The_Habit_Burger_Grill_logo.svg",
  "Tim Hortons": "Tim_Hortons_logo.svg",
  "TLJUS": "Tous_les_Jours_logo.svg",
  "Torchy's Tacos": "Torchy%27s_Tacos_logo.svg",
  "TX Chicken": "Church%27s_Chicken_logo.svg",
  "Waffle House": "Waffle_House_logo.svg",
  "Wagamama": "Wagamama_logo.svg",
  "Wawa Fresh Food": "Wawa_logo.svg",
  "Wendy's": "Wendy%27s_full_logo_2012.svg",
  "Whataburger": "Whataburger_logo.svg",
  "White Castle": "White_Castle_logo.svg",
  "White Castle Slider": "White_Castle_logo.svg",
  "Wingstop": "Wingstop_logo.svg",
  "YO! Sushi": "YO%21_Sushi_logo.svg",
  "Zaxby's": "Zaxby%27s_logo.svg",
  "Zippy's": "Zippy%27s_logo.svg",
  "Zoe's Kitchen": "Zoes_Kitchen_logo.svg"
};

async function downloadImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'image/png';
      return { buffer: Buffer.from(buffer), contentType };
    }
  } catch (e) {}
  return null;
}

async function searchWikimediaForBrand(brandName) {
  try {
    const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(brandName + ' logo') + '&gsrnamespace=6&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json';
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Zo2yBot/1.0 (contact@zo2y.com)' } });
    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});
      for (const p of pages) {
        const title = (p.title || '').toLowerCase();
        if (title.endsWith('.svg') || title.endsWith('.png')) {
          const info = p.imageinfo?.[0];
          if (info && info.thumburl) {
            return info.thumburl;
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

async function searchWikipediaSummary(brandName) {
  try {
    const wikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(brandName);
    const res = await fetch(wikiUrl);
    if (res.ok) {
      const data = await res.json();
      const thumb = data?.thumbnail?.source || data?.originalimage?.source;
      if (thumb && (thumb.endsWith('.svg') || thumb.endsWith('.png') || thumb.includes('upload.wikimedia.org'))) {
        return thumb;
      }
    }
  } catch (e) {}
  return null;
}

async function getOfficialLogo(brandName) {
  if (COMMONS_MAP[brandName]) {
    const filename = COMMONS_MAP[brandName];
    const filepathUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + filename + '?width=800';
    const imgData = await downloadImage(filepathUrl);
    if (imgData && imgData.buffer.length > 1500) {
      return imgData;
    }
  }

  const wikiThumb = await searchWikipediaSummary(brandName);
  if (wikiThumb) {
    const imgData = await downloadImage(wikiThumb);
    if (imgData && imgData.buffer.length > 1500) {
      return imgData;
    }
  }

  const commonsUrl = await searchWikimediaForBrand(brandName);
  if (commonsUrl) {
    const imgData = await downloadImage(commonsUrl);
    if (imgData && imgData.buffer.length > 1500) {
      return imgData;
    }
  }

  return null;
}

async function processItem(item, tableName, type) {
  const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
  const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const targetFileName = `${cleanSlug}.png`;
  const storagePath = `${tableName}/${targetFileName}`;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

  const imgData = await getOfficialLogo(item.name);

  if (imgData) {
    const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, imgData.buffer, {
      contentType: 'image/png',
      upsert: true
    });

    if (!uploadErr || uploadErr.message?.includes('already exists')) {
      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      console.log(`[OK] ${item.name} (${type}) -> ${publicUrl}`);
      return { name: item.name, domain, logo_url: publicUrl, type };
    } else {
      console.error(`[Upload Error] ${item.name}: ${uploadErr.message}`);
      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      return { name: item.name, domain, logo_url: publicUrl, type };
    }
  } else {
    console.warn(`[Fallback] ${item.name} -> keeping ${item.logo_url}`);
    return { name: item.name, domain, logo_url: item.logo_url, type };
  }
}

async function runFixes() {
  const fashionList = JSON.parse(fs.readFileSync('scripts/fashion_brands.json', 'utf8'));
  const foodList = JSON.parse(fs.readFileSync('scripts/food_brands.json', 'utf8'));

  const seededLogos = {
    fashion: [],
    food: []
  };

  const CONCURRENCY = 6;

  async function processBatch(list, tableName, type) {
    console.log(`\nProcessing ${list.length} items for ${tableName}...`);
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const chunk = list.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(item => processItem(item, tableName, type)));
      results.forEach(res => {
        if (type === 'fashion') seededLogos.fashion.push(res);
        else seededLogos.food.push(res);
      });
    }
  }

  await processBatch(fashionList, 'fashion_brands', 'fashion');
  await processBatch(foodList, 'food_brands', 'food');

  fs.writeFileSync('scripts/seeded_official_logos.json', JSON.stringify(seededLogos, null, 2));
  console.log('\nSUCCESS! All logos processed and saved to scripts/seeded_official_logos.json');
}

runFixes();
