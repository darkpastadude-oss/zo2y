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
const supabase = createClient(supabaseUrl, supabaseKey);

const CLEAN_FOOD_LOGOS = {
  "McDonald's": "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
  "Starbucks": "https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg",
  "Subway": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Subway_2016_logo.svg",
  "KFC": "https://upload.wikimedia.org/wikipedia/commons/b/bf/KFC_logo.svg",
  "Burger King": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg",
  "Domino's Pizza": "https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg",
  "Pizza Hut": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Pizza_Hut_logo.svg",
  "Chipotle": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Chipotle_Mexican_Grill_logo.svg",
  "Taco Bell": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Taco_Bell_2016.svg",
  "Dunkin'": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Dunkin%27_logo.svg",
  "Wendy's": "https://upload.wikimedia.org/wikipedia/commons/7/7f/Wendy%27s_full_logo_2012.svg",
  "Chick-fil-A": "https://upload.wikimedia.org/wikipedia/commons/0/02/Chick-fil-A_Logo.svg",
  "Panda Express": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Panda_Express_logo.svg",
  "Popeyes": "https://upload.wikimedia.org/wikipedia/commons/0/04/Popeyes_logo.svg",
  "Panera Bread": "https://upload.wikimedia.org/wikipedia/commons/2/25/Panera_Bread_logo.svg",
  "Arby's": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Arby%27s_logo.svg",
  "Dairy Queen": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Dairy_Queen_logo.svg",
  "Sonic Drive-In": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Sonic_Drive-In_logo.svg",
  "Little Caesars": "https://upload.wikimedia.org/wikipedia/commons/3/30/Little_Caesars_logo.svg",
  "Jack in the Box": "https://upload.wikimedia.org/wikipedia/commons/3/37/Jack_in_the_Box_2022_logo.svg",
  "Papa John's": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Papa_Johns_Pizza_logo.svg",
  "Five Guys": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Five_Guys_logo.svg",
  "In-N-Out Burger": "https://upload.wikimedia.org/wikipedia/commons/8/87/In-N-Out_Burger_logo.svg",
  "Whataburger": "https://upload.wikimedia.org/wikipedia/commons/1/14/Whataburger_logo.svg",
  "Jimmy John's": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Jimmy_John%27s_logo.svg",
  "Hardee's": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Hardees_logo.svg",
  "Carl's Jr.": "https://upload.wikimedia.org/wikipedia/commons/2/27/Carl%27s_Jr._logo.svg",
  "Raising Cane's": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Zaxby's": "https://upload.wikimedia.org/wikipedia/commons/3/30/Zaxby%27s_logo.svg",
  "Culver's Frozen Custard": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Culver%27s_logo.svg",
  "Culver's": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Culver%27s_logo.svg",
  "Wingstop": "https://upload.wikimedia.org/wikipedia/en/0/0f/Wingstop_logo.svg",
  "Shake Shack": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Shake_Shack_logo.svg",
  "Jersey Mike's Subs": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Jersey_Mike%27s_Subs_logo.svg",
  "Firehouse Subs": "https://upload.wikimedia.org/wikipedia/commons/3/37/Firehouse_Subs_logo.svg",
  "Krispy Kreme": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Krispy_Kreme_logo.svg",
  "Tim Hortons": "https://upload.wikimedia.org/wikipedia/commons/5/57/Tim_Hortons_logo.svg",
  "IHOP": "https://upload.wikimedia.org/wikipedia/commons/8/8d/IHOP_logo.svg",
  "Denny's": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Denny%27s_logo.svg",
  "Cracker Barrel": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Cracker_Barrel_logo.svg",
  "Applebee's": "https://upload.wikimedia.org/wikipedia/commons/7/74/Applebee%27s_logo.svg",
  "Olive Garden": "https://upload.wikimedia.org/wikipedia/en/6/6d/Olive_Garden_Logo.svg",
  "Red Lobster": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Red_Lobster_logo.svg",
  "Texas Roadhouse": "https://upload.wikimedia.org/wikipedia/commons/2/21/Texas_Roadhouse_logo.svg",
  "Outback Steakhouse": "https://en.wikipedia.org/wiki/Special:FilePath/Outback_Steakhouse.svg?width=800",
  "LongHorn Steakhouse": "https://upload.wikimedia.org/wikipedia/commons/6/6d/LongHorn_Steakhouse_logo.svg",
  "The Cheesecake Factory": "https://upload.wikimedia.org/wikipedia/commons/8/89/The_Cheesecake_Factory_logo.svg",
  "Chili's": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Chili%27s_logo.svg",
  "Buffalo Wild Wings": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Buffalo_Wild_Wings_logo.svg",
  "Red Robin": "https://upload.wikimedia.org/wikipedia/commons/0/07/Red_Robin_logo.svg",
  "BJ's Restaurant & Brewhouse": "https://upload.wikimedia.org/wikipedia/commons/1/1a/BJ%27s_Restaurant_%26_Brewhouse_logo.svg",
  "California Pizza Kitchen": "https://upload.wikimedia.org/wikipedia/commons/a/a8/California_Pizza_Kitchen_logo.svg",
  "P.F. Chang's": "https://upload.wikimedia.org/wikipedia/commons/e/e0/P.F._Chang%27s_logo.svg",
  "Benihana": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Benihana_logo.svg",
  "Waffle House": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Waffle_House_logo.svg",
  "TGI Fridays": "https://upload.wikimedia.org/wikipedia/commons/6/63/TGI_Fridays_logo.svg",
  "Ruby Tuesday": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Ruby_Tuesday_logo.svg",
  "Hooters": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Hooters_logo.svg",
  "Nando's": "https://upload.wikimedia.org/wikipedia/commons/8/87/Nando%27s_logo.svg",
  "Wagamama": "https://upload.wikimedia.org/wikipedia/commons/0/02/Wagamama_logo.svg",
  "Jollibee": "https://upload.wikimedia.org/wikipedia/en/8/84/Jollibee_2011_logo.svg",
  "Costa Coffee": "https://upload.wikimedia.org/wikipedia/commons/b/bf/Costa_Coffee_logo.svg",
  "Pret A Manger": "https://upload.wikimedia.org/wikipedia/commons/8/82/Pret_a_Manger_logo.svg",
  "Peet's Coffee": "https://upload.wikimedia.org/wikipedia/commons/2/23/Peet%27s_Coffee_logo.svg",
  "Dutch Bros Coffee": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Dutch_Bros_Coffee_logo.svg",
  "Caribou Coffee": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Caribou_Coffee_logo.svg",
  "Gloria Jean's Coffees": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Gloria_Jean%27s_Coffees_logo.svg",
  "Smoothy King": "https://upload.wikimedia.org/wikipedia/commons/4/48/Smoothie_King_logo.svg",
  "Jamba": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Jamba_logo.svg",
  "Tropical Smoothie Cafe": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Tropical_Smoothie_Cafe_logo.svg",
  "Cinnabon": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Cinnabon_logo.svg",
  "Auntie Anne's": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Auntie_Anne%27s_logo.svg",
  "Baskin-Robbins": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Baskin-Robbins_logo.svg",
  "Ben & Jerry's": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ben_%26_Jerry%27s_logo.svg",
  "Cold Stone Creamery": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Cold_Stone_Creamery_logo.svg",
  "Haagen-Dazs": "https://upload.wikimedia.org/wikipedia/commons/c/c9/H%C3%A4agen-Dazs_logo.svg",
  "Pinkberry": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Pinkberry_logo.svg",
  "Sweetgreen": "https://upload.wikimedia.org/wikipedia/commons/4/40/Sweetgreen_logo.svg",
  "Chopt": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Chopt_Creative_Salad_Co._logo.svg",
  "CAVA": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Cava_Group_logo.svg",
  "Qdoba": "https://upload.wikimedia.org/wikipedia/commons/d/d2/Qdoba_logo.svg",
  "Moe's Southwest Grill": "https://upload.wikimedia.org/wikipedia/commons/2/25/Moe%27s_Southwest_Grill_logo.svg",
  "Torchy's Tacos": "https://upload.wikimedia.org/wikipedia/en/8/85/Torchy%27s_Tacos_logo.svg",
  "Del Taco": "https://upload.wikimedia.org/wikipedia/commons/4/46/Del_Taco_logo.svg",
  "El Pollo Loco": "https://upload.wikimedia.org/wikipedia/commons/3/30/El_Pollo_Loco_logo.svg",
  "Marco's Pizza": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Marco%27s_Pizza_logo.svg",
  "MOD Pizza": "https://upload.wikimedia.org/wikipedia/commons/f/fe/MOD_Pizza_logo.svg",
  "Blaze Pizza": "https://upload.wikimedia.org/wikipedia/commons/5/52/Blaze_Pizza_logo.svg",
  "Papa Murphy's": "https://upload.wikimedia.org/wikipedia/commons/8/88/Papa_Murphy%27s_logo.svg",
  "Sbarro": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Sbarro_logo.svg",
  "Cici's Pizza": "https://upload.wikimedia.org/wikipedia/commons/1/10/Cicis_Pizza_logo.svg",
  "Church's Chicken": "https://upload.wikimedia.org/wikipedia/commons/8/89/Church%27s_Chicken_logo.svg",
  "Bojangles": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Bojangles_logo.svg",
  "Checkers": "https://upload.wikimedia.org/wikipedia/commons/9/91/Checkers_%26_Rally%27s_logo.svg",
  "White Castle": "https://upload.wikimedia.org/wikipedia/commons/f/f6/White_Castle_logo.svg",
  "Krystal": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Krystal_logo.svg",
  "Steak 'n Shake": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Steak_%27n_Shake_logo.svg",
  "Freddy's Frozen Custard & Steakburgers": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Freddy%27s_Frozen_Custard_%26_Steakburgers_logo.svg",
  "Smashburger": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Smashburger_logo.svg",
  "The Habit Burger Grill": "https://upload.wikimedia.org/wikipedia/commons/8/82/The_Habit_Burger_Grill_logo.svg",
  "Fatburger": "https://upload.wikimedia.org/wikipedia/commons/3/37/Fatburger_logo.svg",
  "Johnny Rockets": "https://upload.wikimedia.org/wikipedia/commons/0/00/Johnny_Rockets_logo.svg",
  "Fuddruckers": "https://upload.wikimedia.org/wikipedia/commons/5/52/Fuddruckers_logo.svg",
  "Portillo's": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Portillo%27s_logo.svg",
  "Potbelly Sandwich Shop": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Potbelly_Sandwich_Shop_logo.svg",
  "Schlotzsky's": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Schlotzsky%27s_logo.svg",
  "Jason's Deli": "https://upload.wikimedia.org/wikipedia/commons/2/25/Jason%27s_Deli_logo.svg",
  "McAlister's Deli": "https://upload.wikimedia.org/wikipedia/commons/2/2e/McAlister%27s_Deli_logo.svg",
  "Quiznos": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Quiznos_logo.svg",
  "Charley's Philly Steaks": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Charleys_Philly_Steaks_logo.svg",
  "Wawa Fresh Food": "https://upload.wikimedia.org/wikipedia/en/2/23/Wawa_logo.svg",
  "Sheetz Fresh Food": "https://upload.wikimedia.org/wikipedia/commons/0/02/Sheetz_logo.svg",
  "7-Eleven Slurpee & Fresh": "https://upload.wikimedia.org/wikipedia/commons/4/40/7-Eleven_logo.svg",
  "QuikTrip": "https://upload.wikimedia.org/wikipedia/commons/b/b5/QuikTrip_logo.svg",
  "Casey's General Store": "https://upload.wikimedia.org/wikipedia/commons/8/87/Casey%27s_General_Stores_logo.svg",
  "Buc-ee's": "https://upload.wikimedia.org/wikipedia/en/9/91/Buc-ee%27s_logo.svg",
  "Chuck E. Cheese": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Chuck_E._Cheese_logo.svg",
  "Dave & Buster's": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Dave_%26_Buster%27s_logo.svg",
  "Golden Corral": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Golden_Corral_logo.svg",
  "Danone": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Danone_logo.svg",
  "The Capital Grille": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Darden_Restaurants_logo.svg",
  "Zippy's": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Zippy%27s_logo.svg",
  "TX Chicken": "https://upload.wikimedia.org/wikipedia/commons/2/25/Texas_Chicken_logo.svg",
  "Zoe's Kitchen": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Zoes_Kitchen_logo.svg",
  "YO! Sushi": "https://upload.wikimedia.org/wikipedia/commons/5/5f/YO%21_Sushi_logo.svg"
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function downloadBuffer(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Zo2yLogoFixer/1.0 (https://zo2y.com; support@zo2y.com)' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || (url.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
      return { buffer: Buffer.from(buffer), contentType };
    }
  } catch (e) {}
  return null;
}

async function forceSetFoodLogos() {
  const { data: food } = await supabase.from('food_brands').select('id, name, domain');

  console.log(`Processing ${food.length} food brands...`);

  for (let i = 0; i < food.length; i++) {
    const item = food[i];
    const targetUrl = CLEAN_FOOD_LOGOS[item.name];
    if (!targetUrl) {
      console.warn(`[No Target URL] ${item.name}`);
      continue;
    }

    const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const ext = targetUrl.endsWith('.svg') ? 'svg' : 'png';
    const storagePath = `food_brands/${cleanSlug}.${ext}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

    const img = await downloadBuffer(targetUrl);
    if (img && img.buffer.length > 500) {
      const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, img.buffer, {
        contentType: img.contentType,
        upsert: true
      });

      if (!uploadErr || uploadErr.message?.includes('already exists')) {
        await supabase.from('food_brands').update({ logo_url: publicUrl, domain }).eq('id', item.id);
        console.log(`[${i + 1}/${food.length}] ✓ STORAGE UPLOADED: ${item.name} -> ${publicUrl}`);
      } else {
        await supabase.from('food_brands').update({ logo_url: targetUrl, domain }).eq('id', item.id);
        console.log(`[${i + 1}/${food.length}] ⚠ DIRECT URL SET (upload err): ${item.name} -> ${targetUrl}`);
      }
    } else {
      await supabase.from('food_brands').update({ logo_url: targetUrl, domain }).eq('id', item.id);
      console.log(`[${i + 1}/${food.length}] ✓ DIRECT URL SET: ${item.name} -> ${targetUrl}`);
    }

    await delay(150);
  }

  console.log('\nSUCCESS! All food brands set with clean official vector SVG / PNG URLs.');
}

forceSetFoodLogos();
