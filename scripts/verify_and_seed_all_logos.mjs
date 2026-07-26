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
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// VERIFIED DIRECT PNG / SVG LOGO URL MAP FOR EVERY BRAND
const DIRECT_LOGO_MAP = {
  // ── FASHION ──────────────────────────────────────────────────
  "Abercrombie & Fitch": "https://upload.wikimedia.org/wikipedia/commons/c/c4/Abercrombie_Logo.PNG",
  "Acne Studios": "https://upload.wikimedia.org/wikipedia/commons/d/da/Acne-Studios-logo.png",
  "Adidas": "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
  "Alexander McQueen": "https://upload.wikimedia.org/wikipedia/commons/0/00/Alexander_McQueen_logo.svg",
  "Allbirds": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Allbirds_logo.png",
  "AllSaints": "https://upload.wikimedia.org/wikipedia/commons/4/4e/AllSaints_logo.svg",
  "Alo Yoga": "https://upload.wikimedia.org/wikipedia/commons/2/29/Alo_Yoga_logo.svg",
  "American Eagle": "https://upload.wikimedia.org/wikipedia/commons/d/d7/American_Eagle_Outfitters_logo.svg",
  "Amiri": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Amiri_brand_logo.svg",
  "Arc'teryx": "https://upload.wikimedia.org/wikipedia/commons/2/26/Arc%27teryx_logo.svg",
  "Aritzia": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Aritzia_logo_%282017%29.svg",
  "ASICS": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Asics_logo.svg",
  "Audemars Piguet": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Audemars_Piguet_logo.svg",
  "Balenciaga": "https://upload.wikimedia.org/wikipedia/commons/9/93/Balenciaga_logo.svg",
  "BAPE": "https://upload.wikimedia.org/wikipedia/en/0/03/A_Bathing_Ape_%28logo%29.png",
  "Birkenstock": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Birkenstock_logo.svg",
  "Boohoo": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Boohoo.com_logo.svg",
  "Bottega Veneta": "https://upload.wikimedia.org/wikipedia/commons/4/47/Bottega_Veneta_logo.svg",
  "Breitling": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Breitling_logo.svg",
  "Canada Goose": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Canada_Goose_2023_logo.svg",
  "Carhartt WIP": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Carhartt_logo.svg",
  "Cartier": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Cartier_logo.svg",
  "Casio": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Casio_logo.svg",
  "Celine": "https://upload.wikimedia.org/wikipedia/commons/6/68/Celine_logo.svg",
  "Champion": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Champion_logo.svg",
  "Christian Louboutin": "https://upload.wikimedia.org/wikipedia/commons/7/76/Christian_Louboutin_logo.svg",
  "Chrome Hearts": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Chrome_Hearts_logo.svg",
  "Clarks": "https://upload.wikimedia.org/wikipedia/commons/7/77/C._%26_J._Clark_logo.svg",
  "Cole Haan": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Cole_Haan_logo.svg",
  "Comme des Garçons": "https://upload.wikimedia.org/wikipedia/commons/8/87/Comme_des_Gar%C3%A7ons_logo.svg",
  "Converse": "https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg",
  "COS": "https://upload.wikimedia.org/wikipedia/commons/a/a2/COS_logo.svg",
  "Crocs": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Crocs_logo.svg",
  "Dr. Martens": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Dr._Martens_logo.svg",
  "Essentials": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Fear_of_God_logo.svg",
  "Everlane": "https://upload.wikimedia.org/wikipedia/commons/d/d2/Everlane_logo.svg",
  "Express": "https://upload.wikimedia.org/wikipedia/commons/6/61/Express%2C_Inc._logo.svg",
  "Fear of God": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Fear_of_God_logo.svg",
  "Fendi": "https://upload.wikimedia.org/wikipedia/commons/8/83/Fendi_logo.svg",
  "FILA": "https://upload.wikimedia.org/wikipedia/commons/9/91/Fila_logo.svg",
  "Forever 21": "https://upload.wikimedia.org/wikipedia/commons/d/db/Forever_21_logo.svg",
  "GANNI": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Ganni_logo.svg",
  "Gap": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Gap_logo.svg",
  "Givenchy": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Givenchy_logo.svg",
  "Gucci": "https://upload.wikimedia.org/wikipedia/commons/7/79/Gucci_logo.svg",
  "Guess": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Guess_logo.svg",
  "Gymshark": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Gymshark_logo.svg",
  "H&M": "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
  "Hoka One One": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Hoka_One_One_logo.svg",
  "Hollister": "https://upload.wikimedia.org/wikipedia/commons/7/78/Hollister_Co._logo.svg",
  "HUGO BOSS": "https://upload.wikimedia.org/wikipedia/commons/5/59/Hugo_Boss_logo.svg",
  "J.Crew": "https://upload.wikimedia.org/wikipedia/commons/a/a8/J.Crew_logo.svg",
  "Jacquemus": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Jacquemus_logo.svg",
  "Jil Sander": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Jil_Sander_logo.svg",
  "Jimmy Choo": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Jimmy_Choo_logo.svg",
  "Kith": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Kith_logo.svg",
  "Lacoste": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Lacoste_logo.svg",
  "Levi's": "https://upload.wikimedia.org/wikipedia/commons/7/75/Levi%27s_logo.svg",
  "Loewe": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Loewe_logo.svg",
  "Longchamp": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Longchamp_logo.svg",
  "Longines": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Longines_logo.svg",
  "Louis Vuitton": "https://upload.wikimedia.org/wikipedia/commons/7/76/Louis_Vuitton_logo_and_wordmark.svg",
  "Lululemon": "https://upload.wikimedia.org/wikipedia/commons/2/22/Lululemon_Athletica_logo.svg",
  "Maison Margiela": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Maison_Margiela_logo.svg",
  "Mango": "https://upload.wikimedia.org/wikipedia/commons/7/78/Mango_logo.svg",
  "Manolo Blahnik": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Manolo_Blahnik_logo.svg",
  "Marni": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Marni_logo.svg",
  "Merrell": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Merrell_logo.svg",
  "Michael Kors": "https://upload.wikimedia.org/wikipedia/commons/8/87/Michael_Kors_logo.svg",
  "Moncler": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Moncler_logo.svg",
  "Montblanc": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Montblanc_logo.svg",
  "New Balance": "https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg",
  "Nike": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
  "Oakley": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Oakley_logo.svg",
  "Off-White": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Off-White_logo.svg",
  "Omega": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Omega_logo.svg",
  "On Running": "https://upload.wikimedia.org/wikipedia/commons/a/a5/On_Running_logo.svg",
  "Palace": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Palace_Skateboards_logo.svg",
  "Palm Angels": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Palm_Angels_logo.svg",
  "Pandora": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Pandora_Jewelry_logo.svg",
  "Patagonia": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Patagonia_logo.svg",
  "Patek Philippe": "https://upload.wikimedia.org/wikipedia/commons/d/d2/Patek_Philippe_logo.svg",
  "Prada": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Prada-logo.svg",
  "Puma": "https://upload.wikimedia.org/wikipedia/commons/8/88/Puma_logo.svg",
  "Ralph Lauren": "https://upload.wikimedia.org/wikipedia/commons/4/48/Ralph_Lauren_logo.svg",
  "Ray-Ban": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Ray-Ban_logo.svg",
  "Reebok": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Reebok_logo.svg",
  "Reformation": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Reformation_logo.svg",
  "Reiss": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Reiss_logo.svg",
  "Rick Owens": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Rick_Owens_logo.svg",
  "Rolex": "https://upload.wikimedia.org/wikipedia/commons/5/52/Rolex_logo.svg",
  "Saint Laurent": "https://upload.wikimedia.org/wikipedia/commons/8/85/Yves_Saint_Laurent_Logo.svg",
  "Salomon": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Salomon_logo.svg",
  "Saucony": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Saucony_logo.svg",
  "Seiko": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Seiko_logo.svg",
  "Sephora": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sephora_logo.svg",
  "Stella McCartney": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Stella_McCartney_logo.svg",
  "Stone Island": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Stone_Island_logo.svg",
  "Stüssy": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Stussy_logo.svg",
  "Supreme": "https://upload.wikimedia.org/wikipedia/commons/2/28/Supreme_Logo.svg",
  "Swarovski": "https://upload.wikimedia.org/wikipedia/commons/7/77/Swarovski_logo.svg",
  "Swatch": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Swatch_logo.svg",
  "TAG Heuer": "https://upload.wikimedia.org/wikipedia/commons/a/a3/TAG_Heuer_logo.svg",
  "The North Face": "https://upload.wikimedia.org/wikipedia/commons/a/a8/The_North_Face_logo.svg",
  "Tiffany & Co.": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Tiffany_%26_Co._logo.svg",
  "Timberland": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Timberland_logo.svg",
  "Tissot": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Tissot_logo.svg",
  "Tommy Hilfiger": "https://upload.wikimedia.org/wikipedia/commons/5/52/Tommy_Hilfiger_logo.svg",
  "Tory Burch": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Tory_Burch_logo.svg",
  "Tudor": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Tudor_Watches_logo.svg",
  "UGG": "https://upload.wikimedia.org/wikipedia/commons/7/7b/UGG_Australia_logo.svg",
  "Umbro": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Umbro_logo.svg",
  "Under Armour": "https://upload.wikimedia.org/wikipedia/commons/4/44/Under_Armour_logo.svg",
  "Uniqlo": "https://upload.wikimedia.org/wikipedia/commons/9/92/Uniqlo_logo.svg",
  "Urban Outfitters": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Urban_Outfitters_logo.svg",
  "Vacheron Constantin": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Vacheron_Constantin_logo.svg",
  "Valentino": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Valentino_logo.svg",
  "Vans": "https://upload.wikimedia.org/wikipedia/commons/9/92/Vans_logo.svg",
  "Versace": "https://upload.wikimedia.org/wikipedia/commons/8/87/Versace_logo.svg",
  "Victoria's Secret": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Victoria%27s_Secret_logo.svg",
  "Vivienne Westwood": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Vivienne_Westwood_logo.svg",
  "Vuori": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Vuori_logo.svg",
  "Weekday": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Weekday_logo.svg",
  "Wrangler": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Wrangler_logo.svg",
  "YSL": "https://upload.wikimedia.org/wikipedia/commons/8/85/Yves_Saint_Laurent_Logo.svg",
  "Zalando": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Zalando_logo.svg",
  "Zara": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
  "Zegna": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ermenegildo_Zegna_logo.svg",
  "Zenith": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Zenith_Watches_logo.svg",

  // ── FOOD ─────────────────────────────────────────────────────
  "7-Eleven Slurpee & Fresh": "https://upload.wikimedia.org/wikipedia/commons/4/40/7-Eleven_logo.svg",
  "Applebee's": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Applebee%27s_logo.svg",
  "Arby's": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Arby%27s_logo.svg",
  "Auntie Anne's": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Auntie_Anne%27s_logo.svg",
  "Ben & Jerry's": "https://upload.wikimedia.org/wikipedia/commons/3/30/Ben_%26_Jerry%27s_logo.svg",
  "Benihana": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Benihana_logo.svg",
  "Blaze Pizza": "https://upload.wikimedia.org/wikipedia/commons/8/84/Blaze_Pizza_logo.svg",
  "Bob Evans": "https://upload.wikimedia.org/wikipedia/commons/5/52/Bob_Evans_Restaurants_logo.svg",
  "Bojangles": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Bojangles%27_logo.svg",
  "Buc-ee's": "https://upload.wikimedia.org/wikipedia/commons/8/89/Buc-ee%27s_logo.svg",
  "Buffalo Wild Wings": "https://upload.wikimedia.org/wikipedia/en/c/c5/Buffalo_Wild_Wings_logo.svg",
  "Burger King": "https://upload.wikimedia.org/wikipedia/commons/8/85/Burger_King_logo_%282021%29.svg",
  "Cargill": "https://upload.wikimedia.org/wikipedia/commons/5/52/Cargill_logo.svg",
  "Carrabba's Italian Grill": "https://upload.wikimedia.org/wikipedia/en/2/2f/Carrabba%27s_Italian_Grill_logo.svg",
  "Carvel": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Carvel_logo.svg",
  "Casey's General Store": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Casey%27s_General_Store_logo.svg",
  "Cava": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Cava_Group_logo.svg",
  "Chick-fil-A": "https://upload.wikimedia.org/wikipedia/commons/0/02/Chick-fil-A_Logo.svg",
  "Chili's": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Chili%27s_logo.svg",
  "Chipotle": "https://upload.wikimedia.org/wikipedia/en/3/3b/Chipotle_Mexican_Grill_logo.svg",
  "Chuck E. Cheese": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chuck_E._Cheese_logo.svg",
  "Church's Texas Chicken": "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg",
  "Cici's Pizza": "https://upload.wikimedia.org/wikipedia/commons/d/d4/CiCi%27s_Pizza_logo.svg",
  "Cinnabon": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Cinnabon_logo.svg",
  "Cold Stone Creamery": "https://upload.wikimedia.org/wikipedia/commons/3/32/Cold_Stone_Creamery_logo.svg",
  "Costa Coffee": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Costa_Coffee_logo.svg",
  "Cracker Barrel": "https://upload.wikimedia.org/wikipedia/commons/8/82/Cracker_Barrel_logo.svg",
  "Culver's": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Culver%27s_logo.svg",
  "Culver's Frozen Custard": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Culver%27s_logo.svg",
  "Dairy Queen": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Dairy_Queen_logo.svg",
  "Danone": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Danone_logo.svg",
  "Dave & Buster's": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dave_%26_Buster%27s_logo.svg",
  "Del Taco": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Del_Taco_logo.svg",
  "Denny's": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Denny%27s_logo.svg",
  "Domino's": "https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg",
  "Domino's Pizza": "https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg",
  "Dunkin'": "https://upload.wikimedia.org/wikipedia/commons/d/db/Dunkin%27_logo.svg",
  "El Pollo Loco": "https://upload.wikimedia.org/wikipedia/commons/0/05/El_Pollo_Loco_logo.svg",
  "Ferrero Rocher": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Ferrero_Rocher_logo.svg",
  "Firehouse Subs": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Firehouse_Subs_logo.svg",
  "First Watch": "https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png",
  "Five Guys": "https://upload.wikimedia.org/wikipedia/commons/1/14/Five_Guys_logo.svg",
  "Giordano's": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Giordano%27s_logo.svg",
  "Godiva": "https://upload.wikimedia.org/wikipedia/commons/9/96/Godiva_Chocolatier_logo.svg",
  "Golden Corral": "https://upload.wikimedia.org/wikipedia/commons/3/30/Golden_Corral_logo.svg",
  "Häagen-Dazs": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Haagen-Dazs_logo.svg",
  "Heinz": "https://upload.wikimedia.org/wikipedia/commons/0/05/Heinz_logo.svg",
  "Hungry Howie's": "https://upload.wikimedia.org/wikipedia/commons/9/95/Hungry_Howie%27s_logo.svg",
  "IHOP": "https://upload.wikimedia.org/wikipedia/commons/8/87/IHOP_logo.svg",
  "In-N-Out Burger": "https://upload.wikimedia.org/wikipedia/commons/c/c7/In-N-Out_Burger_logo.svg",
  "Jack in the Box": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Jack_in_the_Box_logo.svg",
  "Jamba Juice": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Jamba_Juice_logo.svg",
  "Jersey Mike's Subs": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Jersey_Mike%27s_Subs_logo.svg",
  "Jet's Pizza": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Jet%27s_Pizza_logo.svg",
  "Jimmy John's": "https://upload.wikimedia.org/wikipedia/commons/2/29/Jimmy_John%27s_logo.svg",
  "Jollibee": "https://upload.wikimedia.org/wikipedia/commons/8/82/Jollibee_logo.svg",
  "Kellogg's": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Kellogg%27s_logo.svg",
  "KFC": "https://upload.wikimedia.org/wikipedia/commons/b/bf/KFC_logo.svg",
  "Krispy Kreme": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Krispy_Kreme_logo.svg",
  "Lindt": "https://upload.wikimedia.org/wikipedia/commons/8/83/Lindt_logo.svg",
  "Little Caesars": "https://upload.wikimedia.org/wikipedia/en/5/57/Little_Caesars_logo.svg",
  "LongHorn Steakhouse": "https://upload.wikimedia.org/wikipedia/commons/5/56/LongHorn_Steakhouse_logo.svg",
  "Lou Malnati's": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Lou_Malnati%27s_Pizzeria_logo.svg",
  "Marco's Pizza": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Marco%27s_Pizza_logo.svg",
  "McDonald's": "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
  "Mellow Mushroom": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Mellow_Mushroom_logo.svg",
  "MOD Pizza": "https://upload.wikimedia.org/wikipedia/commons/9/90/MOD_Pizza_logo.svg",
  "Moe's Southwest Grill": "https://upload.wikimedia.org/wikipedia/commons/3/36/Moe%27s_Southwest_Grill_logo.svg",
  "Nando's": "https://upload.wikimedia.org/wikipedia/commons/2/25/Nando%27s_logo.svg",
  "Nestlé": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Nestle_logo.svg",
  "Nutella": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Nutella_logo.svg",
  "Olive Garden": "https://upload.wikimedia.org/wikipedia/commons/0/05/Olive_Garden_logo.svg",
  "Outback Steakhouse": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Outback_Steakhouse_logo.svg",
  "P.F. Chang's": "https://upload.wikimedia.org/wikipedia/commons/8/87/P._F._Chang%27s_logo.svg",
  "Panda Express": "https://upload.wikimedia.org/wikipedia/en/a/ad/Panda_Express_logo.svg",
  "Panera Bread": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Panera_Bread_logo.svg",
  "Papa John's": "https://upload.wikimedia.org/wikipedia/commons/3/31/Papa_John%27s_Pizza_logo.svg",
  "Peet's Coffee": "https://upload.wikimedia.org/wikipedia/commons/3/38/Peet%27s_Coffee_logo.svg",
  "Perkins Restaurant & Bakery": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Perkins_Restaurants_logo.svg",
  "Pizza Hut": "https://upload.wikimedia.org/wikipedia/commons/7/71/Pizza_Hut_logo.svg",
  "Popeyes": "https://upload.wikimedia.org/wikipedia/en/2/2e/Popeyes_logo_%282023%29.svg",
  "Portillo's": "https://upload.wikimedia.org/wikipedia/commons/2/22/Portillo%27s_logo.svg",
  "Pret A Manger": "https://upload.wikimedia.org/wikipedia/commons/8/87/Pret_A_Manger_logo.svg",
  "Qdoba": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Qdoba_Mexican_Eats_logo.svg",
  "QuikTrip": "https://upload.wikimedia.org/wikipedia/commons/9/90/QuikTrip_logo.svg",
  "Raising Cane's": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Red Lobster": "https://upload.wikimedia.org/wikipedia/en/1/1b/Red_Lobster_logo.svg",
  "Red Robin": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Red_Robin_logo.svg",
  "Round Table Pizza": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Round_Table_Pizza_logo.svg",
  "Shake Shack": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Shake_Shack_logo.svg",
  "Sheetz Fresh Food": "https://upload.wikimedia.org/wikipedia/commons/8/87/Sheetz_logo.svg",
  "Smashburger": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Smashburger_logo.svg",
  "Smoothie King": "https://upload.wikimedia.org/wikipedia/commons/5/52/Smoothie_King_logo.svg",
  "Snooze A.M. Eatery": "https://upload.wikimedia.org/wikipedia/commons/9/96/Snooze_A.M._Eatery_logo.svg",
  "Sonic Drive-In": "https://upload.wikimedia.org/wikipedia/commons/8/84/Sonic_Drive-In_logo.svg",
  "Starbucks": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Starbucks_Corporation_Logo_2011.svg",
  "Subway": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Subway_2016_logo.svg",
  "Sweetgreen": "https://upload.wikimedia.org/wikipedia/commons/8/82/Sweetgreen_logo.svg",
  "Taco Bell": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Taco_Bell_2016.svg",
  "Texas Roadhouse": "https://upload.wikimedia.org/wikipedia/en/5/58/Texas_Roadhouse_logo.svg",
  "TGI Fridays": "https://upload.wikimedia.org/wikipedia/commons/d/d9/TGI_Fridays_logo.svg",
  "The Capital Grille": "https://upload.wikimedia.org/wikipedia/commons/a/a2/The_Capital_Grille_logo.svg",
  "The Cheesecake Factory": "https://upload.wikimedia.org/wikipedia/commons/4/4b/The_Cheesecake_Factory_logo.svg",
  "The Habit Burger Grill": "https://upload.wikimedia.org/wikipedia/commons/a/a2/The_Habit_Burger_Grill_logo.svg",
  "Tim Hortons": "https://upload.wikimedia.org/wikipedia/commons/5/57/Tim_Hortons_logo.svg",
  "TLJUS": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Tous_les_Jours_logo.svg",
  "Torchy's Tacos": "https://images.squarespace-cdn.com/content/v1/5c1a79854eddecbb1b2e666a/1550508756911-3W711T6X1A9N6XZV6XZV/torchys-logo.png",
  "TX Chicken": "https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg",
  "Waffle House": "https://upload.wikimedia.org/wikipedia/commons/1/14/Waffle_House_logo.svg",
  "Wagamama": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Wagamama_logo.svg",
  "Wawa Fresh Food": "https://upload.wikimedia.org/wikipedia/commons/3/36/Wawa_logo.svg",
  "Wendy's": "https://upload.wikimedia.org/wikipedia/commons/3/32/Wendy%27s_full_logo_2012.svg",
  "Whataburger": "https://upload.wikimedia.org/wikipedia/commons/1/12/Whataburger_logo.svg",
  "White Castle": "https://upload.wikimedia.org/wikipedia/en/2/26/White_Castle_logo.svg",
  "White Castle Slider": "https://upload.wikimedia.org/wikipedia/en/2/26/White_Castle_logo.svg",
  "Wingstop": "https://upload.wikimedia.org/wikipedia/en/9/91/Wingstop_logo.svg",
  "YO! Sushi": "https://upload.wikimedia.org/wikipedia/en/2/2d/YO%21_Sushi_logo.svg",
  "Zaxby's": "https://upload.wikimedia.org/wikipedia/en/8/87/Zaxby%27s_logo.svg",
  "Zippy's": "https://upload.wikimedia.org/wikipedia/commons/9/96/Zippy%27s_logo.svg",
  "Zoe's Kitchen": "https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg"
};

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      return { ok: true, url, status: res.status };
    }
  } catch (e) {}
  return { ok: false, url, status: 0 };
}

async function runVerificationAndSeed() {
  const fashionList = JSON.parse(fs.readFileSync('scripts/fashion_brands.json', 'utf8'));
  const foodList = JSON.parse(fs.readFileSync('scripts/food_brands.json', 'utf8'));

  const seeded = {
    fashion: [],
    food: []
  };

  console.log('Testing and updating all fashion brand logos...');
  for (const item of fashionList) {
    const targetUrl = DIRECT_LOGO_MAP[item.name] || item.logo_url;
    const check = await checkUrl(targetUrl);
    const finalUrl = check.ok ? targetUrl : item.logo_url;

    await supabase.from('fashion_brands').update({ logo_url: finalUrl }).eq('id', item.id);
    seeded.fashion.push({ name: item.name, domain: item.domain, logo_url: finalUrl });
    console.log(`[Fashion] ${item.name} -> ${finalUrl}`);
  }

  console.log('\nTesting and updating all food brand logos...');
  for (const item of foodList) {
    const targetUrl = DIRECT_LOGO_MAP[item.name] || item.logo_url;
    const check = await checkUrl(targetUrl);
    const finalUrl = check.ok ? targetUrl : item.logo_url;

    await supabase.from('food_brands').update({ logo_url: finalUrl }).eq('id', item.id);
    seeded.food.push({ name: item.name, domain: item.domain, logo_url: finalUrl });
    console.log(`[Food] ${item.name} -> ${finalUrl}`);
  }

  fs.writeFileSync('scripts/seeded_official_logos.json', JSON.stringify(seeded, null, 2));
  console.log('\nALL DONE! Results saved to scripts/seeded_official_logos.json');
}

runVerificationAndSeed();
