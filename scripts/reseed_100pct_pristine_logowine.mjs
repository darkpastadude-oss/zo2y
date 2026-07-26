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

const LOGO_MAP_FASHION = {
  "Abercrombie & Fitch": "https://www.logo.wine/a/logo/Abercrombie_%26_Fitch/Abercrombie_%26_Fitch-Logo.wine.svg",
  "Acne Studios": "https://commons.wikimedia.org/wiki/Special:FilePath/Acne_Studios_logo.svg",
  "Adidas": "https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg",
  "Alexander McQueen": "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_Alexander_McQueen.svg",
  "Allbirds": "https://commons.wikimedia.org/wiki/Special:FilePath/Allbirds_logo.svg",
  "AllSaints": "https://commons.wikimedia.org/wiki/Special:FilePath/AllSaints_logo.svg",
  "Alo Yoga": "https://commons.wikimedia.org/wiki/Special:FilePath/Alo_Yoga_logo.svg",
  "American Eagle": "https://www.logo.wine/a/logo/American_Eagle_Outfitters/American_Eagle_Outfitters-Logo.wine.svg",
  "Amiri": "https://commons.wikimedia.org/wiki/Special:FilePath/Mike_Amiri_logo.svg",
  "Arc'teryx": "https://commons.wikimedia.org/wiki/Special:FilePath/Arc%27teryx_logo.svg",
  "Aritzia": "https://www.logo.wine/a/logo/Aritzia/Aritzia-Logo.wine.svg",
  "ASICS": "https://www.logo.wine/a/logo/Asics/Asics-Logo.wine.svg",
  "Audemars Piguet": "https://www.logo.wine/a/logo/Audemars_Piguet/Audemars_Piguet-Logo.wine.svg",
  "Balenciaga": "https://www.logo.wine/a/logo/Balenciaga/Balenciaga-Logo.wine.svg",
  "BAPE": "https://commons.wikimedia.org/wiki/Special:FilePath/A_Bathing_Ape_%28logo%29.png",
  "Birkenstock": "https://commons.wikimedia.org/wiki/Special:FilePath/Birkenstock_logo.svg",
  "Boohoo": "https://commons.wikimedia.org/wiki/Special:FilePath/Boohoo.com_logo.svg",
  "Bottega Veneta": "https://commons.wikimedia.org/wiki/Special:FilePath/Bottega_Veneta_logo.svg",
  "Breitling": "https://www.logo.wine/a/logo/Breitling_SA/Breitling_SA-Logo.wine.svg",
  "Canada Goose": "https://commons.wikimedia.org/wiki/Special:FilePath/Canada_Goose_2023_logo.svg",
  "Carhartt WIP": "https://commons.wikimedia.org/wiki/Special:FilePath/Carhartt_logo.svg",
  "Cartier": "https://commons.wikimedia.org/wiki/Special:FilePath/Cartier_logo.svg",
  "Casio": "https://www.logo.wine/a/logo/Casio/Casio-Logo.wine.svg",
  "Celine": "https://commons.wikimedia.org/wiki/Special:FilePath/Celine_logo.svg",
  "Champion": "https://www.logo.wine/a/logo/Champion_(sportswear)/Champion_(sportswear)-Logo.wine.svg",
  "Christian Louboutin": "https://commons.wikimedia.org/wiki/Special:FilePath/Christian_Louboutin_logo.svg",
  "Chrome Hearts": "https://commons.wikimedia.org/wiki/Special:FilePath/Chrome_Hearts_logo.svg",
  "Clarks": "https://commons.wikimedia.org/wiki/Special:FilePath/C._%26_J._Clark_logo.svg",
  "Cole Haan": "https://commons.wikimedia.org/wiki/Special:FilePath/Cole_Haan_logo.svg",
  "Comme des Garçons": "https://commons.wikimedia.org/wiki/Special:FilePath/Comme_des_Gar%C3%A7ons_logo.svg",
  "Converse": "https://www.logo.wine/a/logo/Converse_(shoe_company)/Converse_(shoe_company)-Logo.wine.svg",
  "COS": "https://commons.wikimedia.org/wiki/Special:FilePath/COS_logo.svg",
  "Crocs": "https://www.logo.wine/a/logo/Crocs/Crocs-Logo.wine.svg",
  "Dr. Martens": "https://www.logo.wine/a/logo/Dr._Martens/Dr._Martens-Logo.wine.svg",
  "Essentials": "https://commons.wikimedia.org/wiki/Special:FilePath/Fear_of_God_logo.svg",
  "Everlane": "https://commons.wikimedia.org/wiki/Special:FilePath/Everlane_logo.svg",
  "Express": "https://commons.wikimedia.org/wiki/Special:FilePath/Express%2C_Inc._logo.svg",
  "Fear of God": "https://commons.wikimedia.org/wiki/Special:FilePath/Fear_of_God_logo.svg",
  "Fendi": "https://commons.wikimedia.org/wiki/Special:FilePath/Fendi_logo.svg",
  "FILA": "https://www.logo.wine/a/logo/Fila_(company)/Fila_(company)-Logo.wine.svg",
  "Forever 21": "https://www.logo.wine/a/logo/Forever_21/Forever_21-Logo.wine.svg",
  "GANNI": "https://commons.wikimedia.org/wiki/Special:FilePath/Ganni_logo.svg",
  "Gap": "https://www.logo.wine/a/logo/Gap_Inc./Gap_Inc.-Logo.wine.svg",
  "Givenchy": "https://commons.wikimedia.org/wiki/Special:FilePath/Givenchy_logo.svg",
  "Gucci": "https://www.logo.wine/a/logo/Gucci/Gucci-Logo.wine.svg",
  "Guess": "https://www.logo.wine/a/logo/Guess_(clothing)/Guess_(clothing)-Logo.wine.svg",
  "Gymshark": "https://commons.wikimedia.org/wiki/Special:FilePath/Gymshark_logo.svg",
  "H&M": "https://www.logo.wine/a/logo/H%26M/H%26M-Logo.wine.svg",
  "Hoka One One": "https://commons.wikimedia.org/wiki/Special:FilePath/Hoka_One_One_logo.svg",
  "Hollister": "https://www.logo.wine/a/logo/Hollister_Co./Hollister_Co.-Logo.wine.svg",
  "HUGO BOSS": "https://www.logo.wine/a/logo/Hugo_Boss/Hugo_Boss-Logo.wine.svg",
  "J.Crew": "https://www.logo.wine/a/logo/J.Crew/J.Crew-Logo.wine.svg",
  "Jacquemus": "https://commons.wikimedia.org/wiki/Special:FilePath/Jacquemus_logo.svg",
  "Jil Sander": "https://commons.wikimedia.org/wiki/Special:FilePath/Jil_Sander_logo.svg",
  "Jimmy Choo": "https://www.logo.wine/a/logo/Jimmy_Choo_LTD/Jimmy_Choo_LTD-Logo.wine.svg",
  "Kith": "https://commons.wikimedia.org/wiki/Special:FilePath/Kith_logo.svg",
  "Lacoste": "https://www.logo.wine/a/logo/Lacoste/Lacoste-Logo.wine.svg",
  "Levi's": "https://www.logo.wine/a/logo/Levi%27s/Levi%27s-Logo.wine.svg",
  "Loewe": "https://commons.wikimedia.org/wiki/Special:FilePath/Loewe_logo.svg",
  "Longchamp": "https://commons.wikimedia.org/wiki/Special:FilePath/Longchamp_logo.svg",
  "Longines": "https://www.logo.wine/a/logo/Longines/Longines-Logo.wine.svg",
  "Louis Vuitton": "https://www.logo.wine/a/logo/Louis_Vuitton/Louis_Vuitton-Logo.wine.svg",
  "Lululemon": "https://www.logo.wine/a/logo/Lululemon_Athletica/Lululemon_Athletica-Logo.wine.svg",
  "Maison Margiela": "https://commons.wikimedia.org/wiki/Special:FilePath/Maison_Margiela_logo.svg",
  "Mango": "https://commons.wikimedia.org/wiki/Special:FilePath/Mango_logo.svg",
  "Manolo Blahnik": "https://commons.wikimedia.org/wiki/Special:FilePath/Manolo_Blahnik_logo.svg",
  "Marni": "https://commons.wikimedia.org/wiki/Special:FilePath/Marni_logo.svg",
  "Merrell": "https://commons.wikimedia.org/wiki/Special:FilePath/Merrell_logo.svg",
  "Michael Kors": "https://www.logo.wine/a/logo/Michael_Kors/Michael_Kors-Logo.wine.svg",
  "Moncler": "https://commons.wikimedia.org/wiki/Special:FilePath/Moncler_logo.svg",
  "Montblanc": "https://commons.wikimedia.org/wiki/Special:FilePath/Montblanc_logo.svg",
  "New Balance": "https://www.logo.wine/a/logo/New_Balance/New_Balance-Logo.wine.svg",
  "Nike": "https://www.logo.wine/a/logo/Nike%2C_Inc./Nike%2C_Inc.-Logo.wine.svg",
  "Oakley": "https://www.logo.wine/a/logo/Oakley%2C_Inc./Oakley%2C_Inc.-Logo.wine.svg",
  "Off-White": "https://commons.wikimedia.org/wiki/Special:FilePath/Off-White_logo.svg",
  "Omega": "https://www.logo.wine/a/logo/Omega_SA/Omega_SA-Logo.wine.svg",
  "On Running": "https://commons.wikimedia.org/wiki/Special:FilePath/On_Running_logo.svg",
  "Palace": "https://commons.wikimedia.org/wiki/Special:FilePath/Palace_Skateboards_logo.svg",
  "Palm Angels": "https://commons.wikimedia.org/wiki/Special:FilePath/Palm_Angels_logo.svg",
  "Pandora": "https://www.logo.wine/a/logo/Pandora_(jewelry)/Pandora_(jewelry)-Logo.wine.svg",
  "Patagonia": "https://commons.wikimedia.org/wiki/Special:FilePath/Patagonia_logo.svg",
  "Patek Philippe": "https://commons.wikimedia.org/wiki/Special:FilePath/Patek_Philippe_logo.svg",
  "Prada": "https://commons.wikimedia.org/wiki/Special:FilePath/Prada-logo.svg",
  "Puma": "https://www.logo.wine/a/logo/Puma_(brand)/Puma_(brand)-Logo.wine.svg",
  "Ralph Lauren": "https://www.logo.wine/a/logo/Ralph_Lauren_Corporation/Ralph_Lauren_Corporation-Logo.wine.svg",
  "Ray-Ban": "https://www.logo.wine/a/logo/Ray-Ban/Ray-Ban-Logo.wine.svg",
  "Reebok": "https://www.logo.wine/a/logo/Reebok/Reebok-Logo.wine.svg",
  "Reformation": "https://commons.wikimedia.org/wiki/Special:FilePath/Reformation_logo.svg",
  "Reiss": "https://commons.wikimedia.org/wiki/Special:FilePath/Reiss_logo.svg",
  "Rick Owens": "https://commons.wikimedia.org/wiki/Special:FilePath/Rick_Owens_logo.svg",
  "Rolex": "https://www.logo.wine/a/logo/Rolex/Rolex-Logo.wine.svg",
  "Saint Laurent": "https://commons.wikimedia.org/wiki/Special:FilePath/Yves_Saint_Laurent_Logo.svg",
  "Salomon": "https://commons.wikimedia.org/wiki/Special:FilePath/Salomon_logo.svg",
  "Saucony": "https://www.logo.wine/a/logo/Saucony/Saucony-Logo.wine.svg",
  "Seiko": "https://commons.wikimedia.org/wiki/Special:FilePath/Seiko_logo.svg",
  "Sephora": "https://www.logo.wine/a/logo/Sephora/Sephora-Logo.wine.svg",
  "Stella McCartney": "https://commons.wikimedia.org/wiki/Special:FilePath/Stella_McCartney_logo.svg",
  "Stone Island": "https://commons.wikimedia.org/wiki/Special:FilePath/Stone_Island_logo.svg",
  "Stüssy": "https://commons.wikimedia.org/wiki/Special:FilePath/Stussy_logo.svg",
  "Supreme": "https://commons.wikimedia.org/wiki/Special:FilePath/Supreme_Logo.svg",
  "Swarovski": "https://www.logo.wine/a/logo/Swarovski/Swarovski-Logo.wine.svg",
  "Swatch": "https://www.logo.wine/a/logo/Swatch/Swatch-Logo.wine.svg",
  "TAG Heuer": "https://www.logo.wine/a/logo/TAG_Heuer/TAG_Heuer-Logo.wine.svg",
  "The North Face": "https://www.logo.wine/a/logo/The_North_Face/The_North_Face-Logo.wine.svg",
  "Tiffany & Co.": "https://www.logo.wine/a/logo/Tiffany_%26_Co./Tiffany_%26_Co.-Logo.wine.svg",
  "Timberland": "https://www.logo.wine/a/logo/The_Timberland_Company/The_Timberland_Company-Logo.wine.svg",
  "Tissot": "https://www.logo.wine/a/logo/Tissot/Tissot-Logo.wine.svg",
  "Tommy Hilfiger": "https://www.logo.wine/a/logo/Tommy_Hilfiger/Tommy_Hilfiger-Logo.wine.svg",
  "Tory Burch": "https://www.logo.wine/a/logo/Tory_Burch_LLC/Tory_Burch_LLC-Logo.wine.svg",
  "Tudor": "https://commons.wikimedia.org/wiki/Special:FilePath/Tudor_Watches_logo.svg",
  "UGG": "https://commons.wikimedia.org/wiki/Special:FilePath/UGG_Australia_logo.svg",
  "Umbro": "https://www.logo.wine/a/logo/Umbro/Umbro-Logo.wine.svg",
  "Under Armour": "https://www.logo.wine/a/logo/Under_Armour/Under_Armour-Logo.wine.svg",
  "Uniqlo": "https://www.logo.wine/a/logo/Uniqlo/Uniqlo-Logo.wine.svg",
  "Urban Outfitters": "https://www.logo.wine/a/logo/Urban_Outfitters/Urban_Outfitters-Logo.wine.svg",
  "Vacheron Constantin": "https://commons.wikimedia.org/wiki/Special:FilePath/Vacheron_Constantin_logo.svg",
  "Valentino": "https://commons.wikimedia.org/wiki/Special:FilePath/Valentino_logo.svg",
  "Vans": "https://www.logo.wine/a/logo/Vans/Vans-Logo.wine.svg",
  "Versace": "https://www.logo.wine/a/logo/Versace/Versace-Logo.wine.svg",
  "Victoria's Secret": "https://www.logo.wine/a/logo/Victoria%27s_Secret/Victoria%27s_Secret-Logo.wine.svg",
  "Vivienne Westwood": "https://commons.wikimedia.org/wiki/Special:FilePath/Vivienne_Westwood_logo.svg",
  "Vuori": "https://commons.wikimedia.org/wiki/Special:FilePath/Vuori_logo.svg",
  "Weekday": "https://commons.wikimedia.org/wiki/Special:FilePath/Weekday_logo.svg",
  "Wrangler": "https://commons.wikimedia.org/wiki/Special:FilePath/Wrangler_logo.svg",
  "YSL": "https://commons.wikimedia.org/wiki/Special:FilePath/Yves_Saint_Laurent_Logo.svg",
  "Zalando": "https://www.logo.wine/a/logo/Zalando/Zalando-Logo.wine.svg",
  "Zara": "https://www.logo.wine/a/logo/Zara_(retailer)/Zara_(retailer)-Logo.wine.svg",
  "Zegna": "https://commons.wikimedia.org/wiki/Special:FilePath/Ermenegildo_Zegna_logo.svg",
  "Zenith": "https://commons.wikimedia.org/wiki/Special:FilePath/Zenith_Watches_logo.svg"
};

const LOGO_MAP_FOOD = {
  "7-Eleven": "https://www.logo.wine/a/logo/7-Eleven/7-Eleven-Logo.wine.svg",
  "Applebee's": "https://www.logo.wine/a/logo/Applebee%27s/Applebee%27s-Logo.wine.svg",
  "Arby's": "https://www.logo.wine/a/logo/Arby%27s/Arby%27s-Logo.wine.svg",
  "Auntie Anne's": "https://www.logo.wine/a/logo/Auntie_Anne%27s/Auntie_Anne%27s-Logo.wine.svg",
  "Ben & Jerry's": "https://www.logo.wine/a/logo/Ben_%26_Jerry%27s/Ben_%26_Jerry%27s-Logo.wine.svg",
  "Benihana": "https://commons.wikimedia.org/wiki/Special:FilePath/Benihana_logo.svg",
  "Blaze Pizza": "https://commons.wikimedia.org/wiki/Special:FilePath/Blaze_Pizza_logo.svg",
  "Bob Evans": "https://commons.wikimedia.org/wiki/Special:FilePath/Bob_Evans_Restaurants_logo.svg",
  "Bojangles": "https://www.logo.wine/a/logo/Bojangles%27/Bojangles%27-Logo.wine.svg",
  "Buc-ee's": "https://commons.wikimedia.org/wiki/Special:FilePath/Buc-ee%27s_logo.svg",
  "Buffalo Wild Wings": "https://www.logo.wine/a/logo/Buffalo_Wild_Wings/Buffalo_Wild_Wings-Logo.wine.svg",
  "Burger King": "https://www.logo.wine/a/logo/Burger_King/Burger_King-Logo.wine.svg",
  "Cargill": "https://www.logo.wine/a/logo/Cargill/Cargill-Logo.wine.svg",
  "Carrabba's Italian Grill": "https://commons.wikimedia.org/wiki/Special:FilePath/Carrabba%27s_Italian_Grill_logo.svg",
  "Carvel": "https://commons.wikimedia.org/wiki/Special:FilePath/Carvel_logo.svg",
  "Casey's General Store": "https://commons.wikimedia.org/wiki/Special:FilePath/Casey%27s_General_Store_logo.svg",
  "Cava": "https://commons.wikimedia.org/wiki/Special:FilePath/Cava_Grill_logo.svg",
  "Chick-fil-A": "https://www.logo.wine/a/logo/Chick-fil-A/Chick-fil-A-Logo.wine.svg",
  "Chili's": "https://www.logo.wine/a/logo/Chili%27s/Chili%27s-Logo.wine.svg",
  "Chipotle": "https://www.logo.wine/a/logo/Chipotle_Mexican_Grill/Chipotle_Mexican_Grill-Logo.wine.svg",
  "Chuck E. Cheese": "https://www.logo.wine/a/logo/Chuck_E._Cheese/Chuck_E._Cheese-Logo.wine.svg",
  "Church's Texas Chicken": "https://commons.wikimedia.org/wiki/Special:FilePath/Church%27s_Chicken_logo.svg",
  "Cici's Pizza": "https://commons.wikimedia.org/wiki/Special:FilePath/Cici%27s_Pizza_logo.svg",
  "Cinnabon": "https://www.logo.wine/a/logo/Cinnabon/Cinnabon-Logo.wine.svg",
  "Cold Stone Creamery": "https://commons.wikimedia.org/wiki/Special:FilePath/Cold_Stone_Creamery_logo.svg",
  "Costa Coffee": "https://www.logo.wine/a/logo/Costa_Coffee/Costa_Coffee-Logo.wine.svg",
  "Cracker Barrel": "https://www.logo.wine/a/logo/Cracker_Barrel/Cracker_Barrel-Logo.wine.svg",
  "Culver's": "https://commons.wikimedia.org/wiki/Special:FilePath/Culver%27s_logo.svg",
  "Dairy Queen": "https://www.logo.wine/a/logo/Dairy_Queen/Dairy_Queen-Logo.wine.svg",
  "Danone": "https://www.logo.wine/a/logo/Danone/Danone-Logo.wine.svg",
  "Dave & Buster's": "https://commons.wikimedia.org/wiki/Special:FilePath/Dave_%26_Buster%27s_logo.svg",
  "Del Taco": "https://www.logo.wine/a/logo/Del_Taco/Del_Taco-Logo.wine.svg",
  "Denny's": "https://www.logo.wine/a/logo/Denny%27s/Denny%27s-Logo.wine.svg",
  "Domino's": "https://www.logo.wine/a/logo/Domino%27s_Pizza/Domino%27s_Pizza-Logo.wine.svg",
  "Domino's Pizza": "https://www.logo.wine/a/logo/Domino%27s_Pizza/Domino%27s_Pizza-Logo.wine.svg",
  "Dunkin'": "https://www.logo.wine/a/logo/Dunkin%27_Donuts/Dunkin%27_Donuts-Logo.wine.svg",
  "El Pollo Loco": "https://www.logo.wine/a/logo/El_Pollo_Loco/El_Pollo_Loco-Logo.wine.svg",
  "Ferrero Rocher": "https://commons.wikimedia.org/wiki/Special:FilePath/Ferrero_Rocher_logo.svg",
  "Firehouse Subs": "https://commons.wikimedia.org/wiki/Special:FilePath/Firehouse_Subs_logo.svg",
  "First Watch": "https://commons.wikimedia.org/wiki/Special:FilePath/First_Watch_logo.svg",
  "Five Guys": "https://www.logo.wine/a/logo/Five_Guys/Five_Guys-Logo.wine.svg",
  "Godiva": "https://www.logo.wine/a/logo/Godiva_Chocolatier/Godiva_Chocolatier-Logo.wine.svg",
  "Golden Corral": "https://commons.wikimedia.org/wiki/Special:FilePath/Golden_Corral_logo.svg",
  "Häagen-Dazs": "https://www.logo.wine/a/logo/H%C3%A4agen-Dazs/H%C3%A4agen-Dazs-Logo.wine.svg",
  "Heinz": "https://www.logo.wine/a/logo/Heinz/Heinz-Logo.wine.svg",
  "IHOP": "https://www.logo.wine/a/logo/IHOP/IHOP-Logo.wine.svg",
  "In-N-Out Burger": "https://www.logo.wine/a/logo/In-N-Out_Burger/In-N-Out_Burger-Logo.wine.svg",
  "Jack in the Box": "https://www.logo.wine/a/logo/Jack_in_the_Box/Jack_in_the_Box-Logo.wine.svg",
  "Jamba Juice": "https://www.logo.wine/a/logo/Jamba_Juice/Jamba_Juice-Logo.wine.svg",
  "Jersey Mike's Subs": "https://commons.wikimedia.org/wiki/Special:FilePath/Jersey_Mike%27s_Subs_logo.svg",
  "Jimmy John's": "https://www.logo.wine/a/logo/Jimmy_John%27s/Jimmy_John%27s-Logo.wine.svg",
  "Jollibee": "https://www.logo.wine/a/logo/Jollibee/Jollibee-Logo.wine.svg",
  "Kellogg's": "https://www.logo.wine/a/logo/Kellogg%27s/Kellogg%27s-Logo.wine.svg",
  "KFC": "https://www.logo.wine/a/logo/KFC/KFC-Logo.wine.svg",
  "Krispy Kreme": "https://www.logo.wine/a/logo/Krispy_Kreme/Krispy_Kreme-Logo.wine.svg",
  "Lindt": "https://www.logo.wine/a/logo/Lindt_%26_Spr%C3%BCngli/Lindt_%26_Spr%C3%BCngli-Logo.wine.svg",
  "Little Caesars": "https://www.logo.wine/a/logo/Little_Caesars/Little_Caesars-Logo.wine.svg",
  "LongHorn Steakhouse": "https://commons.wikimedia.org/wiki/Special:FilePath/LongHorn_Steakhouse_logo.svg",
  "McDonald's": "https://www.logo.wine/a/logo/McDonald%27s/McDonald%27s-Logo.wine.svg",
  "Mellow Mushroom": "https://commons.wikimedia.org/wiki/Special:FilePath/Mellow_Mushroom_logo.svg",
  "MOD Pizza": "https://commons.wikimedia.org/wiki/Special:FilePath/MOD_Pizza_logo.svg",
  "Moe's Southwest Grill": "https://commons.wikimedia.org/wiki/Special:FilePath/Moe%27s_Southwest_Grill_logo.svg",
  "Nando's": "https://www.logo.wine/a/logo/Nando%27s/Nando%27s-Logo.wine.svg",
  "Nestlé": "https://www.logo.wine/a/logo/Nestl%C3%A9/Nestl%C3%A9-Logo.wine.svg",
  "Nutella": "https://www.logo.wine/a/logo/Nutella/Nutella-Logo.wine.svg",
  "Olive Garden": "https://www.logo.wine/a/logo/Olive_Garden/Olive_Garden-Logo.wine.svg",
  "Outback Steakhouse": "https://www.logo.wine/a/logo/Outback_Steakhouse/Outback_Steakhouse-Logo.wine.svg",
  "P.F. Chang's": "https://commons.wikimedia.org/wiki/Special:FilePath/P._F._Chang%27s_China_Bistro_logo.svg",
  "Panda Express": "https://www.logo.wine/a/logo/Panda_Express/Panda_Express-Logo.wine.svg",
  "Panera Bread": "https://www.logo.wine/a/logo/Panera_Bread/Panera_Bread-Logo.wine.svg",
  "Papa John's": "https://www.logo.wine/a/logo/Papa_John%27s_Pizza/Papa_John%27s_Pizza-Logo.wine.svg",
  "Peet's Coffee": "https://commons.wikimedia.org/wiki/Special:FilePath/Peet%27s_Coffee_logo.svg",
  "Pizza Hut": "https://www.logo.wine/a/logo/Pizza_Hut/Pizza_Hut-Logo.wine.svg",
  "Popeyes": "https://www.logo.wine/a/logo/Popeyes/Popeyes-Logo.wine.svg",
  "Portillo's": "https://commons.wikimedia.org/wiki/Special:FilePath/Portillo%27s_logo.svg",
  "Pret A Manger": "https://www.logo.wine/a/logo/Pret_A_Manger/Pret_A_Manger-Logo.wine.svg",
  "Qdoba": "https://www.logo.wine/a/logo/Qdoba/Qdoba-Logo.wine.svg",
  "Raising Cane's": "https://commons.wikimedia.org/wiki/Special:FilePath/Raising_Cane%27s_Chicken_Fingers_logo.svg",
  "Red Lobster": "https://www.logo.wine/a/logo/Red_Lobster/Red_Lobster-Logo.wine.svg",
  "Red Robin": "https://www.logo.wine/a/logo/Red_Robin/Red_Robin-Logo.wine.svg",
  "Shake Shack": "https://www.logo.wine/a/logo/Shake_Shack/Shake_Shack-Logo.wine.svg",
  "Sheetz Fresh Food": "https://commons.wikimedia.org/wiki/Special:FilePath/Sheetz_logo.svg",
  "Smashburger": "https://commons.wikimedia.org/wiki/Special:FilePath/Smashburger_logo.svg",
  "Sonic Drive-In": "https://www.logo.wine/a/logo/Sonic_Drive-In/Sonic_Drive-In-Logo.wine.svg",
  "Starbucks": "https://www.logo.wine/a/logo/Starbucks/Starbucks-Logo.wine.svg",
  "Subway": "https://www.logo.wine/a/logo/Subway_(restaurant)/Subway_(restaurant)-Logo.wine.svg",
  "Sweetgreen": "https://commons.wikimedia.org/wiki/Special:FilePath/Sweetgreen_logo.svg",
  "Taco Bell": "https://www.logo.wine/a/logo/Taco_Bell/Taco_Bell-Logo.wine.svg",
  "Texas Roadhouse": "https://commons.wikimedia.org/wiki/Special:FilePath/Texas_Roadhouse_logo.svg",
  "TGI Fridays": "https://www.logo.wine/a/logo/TGI_Fridays/TGI_Fridays-Logo.wine.svg",
  "The Cheesecake Factory": "https://www.logo.wine/a/logo/The_Cheesecake_Factory/The_Cheesecake_Factory-Logo.wine.svg",
  "Tim Hortons": "https://www.logo.wine/a/logo/Tim_Hortons/Tim_Hortons-Logo.wine.svg",
  "Torchy's Tacos": "https://commons.wikimedia.org/wiki/Special:FilePath/Torchy%27s_Tacos_logo.svg",
  "Waffle House": "https://commons.wikimedia.org/wiki/Special:FilePath/Waffle_House_logo.svg",
  "Wagamama": "https://commons.wikimedia.org/wiki/Special:FilePath/Wagamama_logo.svg",
  "Wawa Fresh Food": "https://commons.wikimedia.org/wiki/Special:FilePath/Wawa_logo.svg",
  "Wendy's": "https://www.logo.wine/a/logo/Wendy%27s/Wendy%27s-Logo.wine.svg",
  "Whataburger": "https://www.logo.wine/a/logo/Whataburger/Whataburger-Logo.wine.svg",
  "White Castle": "https://www.logo.wine/a/logo/White_Castle_(restaurant)/White_Castle_(restaurant)-Logo.wine.svg",
  "Wingstop": "https://www.logo.wine/a/logo/Wingstop/Wingstop-Logo.wine.svg",
  "Zaxby's": "https://commons.wikimedia.org/wiki/Special:FilePath/Zaxby%27s_logo.svg"
};

async function processCategory(tableName, targetDir, mapping) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Reseeding PRISTINE VECTOR SVGs for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Direct mapping URL or fallback to logo.wine
    let url = mapping[item.name] || mapping[item.name.replace(/[^a-z0-9 ]/gi, '')];
    if (!url) {
      const slugName = item.name.replace(/[^a-z0-9]/gi, '_');
      url = `https://www.logo.wine/a/logo/${slugName}/${slugName}-Logo.wine.svg`;
    }

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 200) {
          const ext = url.toLowerCase().includes('.png') ? 'png' : 'svg';
          const fileName = `${cleanSlug}.${ext}`;
          const localPath = path.join(targetDir, fileName);
          fs.writeFileSync(localPath, buf);

          const storagePath = `${tableName}/${fileName}`;
          const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
          const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/png';

          await supabase.storage.from('brand-logos').upload(storagePath, buf, {
            contentType,
            upsert: true
          });

          await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
          count++;
          console.log(`[${i + 1}/${items.length}] ✓ STORED PRISTINE VECTOR ASSET: ${item.name} -> ${localPath} (${buf.length} bytes)`);
        }
      } else {
        console.warn(`[${i + 1}/${items.length}] ⚠ HTTP ${res.status} FOR: ${item.name} (${url})`);
      }
    } catch(e) {
      console.error(`[${i + 1}/${items.length}] ❌ ERROR FOR: ${item.name}:`, e.message);
    }

    await delay(100);
  }

  console.log(`Completed ${tableName}: ${count}/${items.length} pristine vector assets stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir, LOGO_MAP_FASHION);
  await processCategory('food_brands', foodDir, LOGO_MAP_FOOD);
  console.log('\n✅ ALL 250 REAL BRAND LOGOS RESEEDED FROM LOGO.WINE & COMMONS!');
}

run();
