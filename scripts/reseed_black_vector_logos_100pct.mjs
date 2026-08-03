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
  "Prada": "https://www.logo.wine/a/logo/Prada/Prada-Logo.wine.svg",
  "Off-White": "https://www.logo.wine/a/logo/Off-White_(company)/Off-White_(company)-Logo.wine.svg",
  "Oakley": "https://www.logo.wine/a/logo/Oakley_Inc./Oakley_Inc.-Logo.wine.svg",
  "COS": "https://www.logo.wine/a/logo/COS_(retailer)/COS_(retailer)-Logo.wine.svg",
  "Givenchy": "https://www.logo.wine/a/logo/Givenchy/Givenchy-Logo.wine.svg",
  "Cole Haan": "https://www.logo.wine/a/logo/Cole_Haan/Cole_Haan-Logo.wine.svg",
  "Converse": "https://www.logo.wine/a/logo/Converse_(shoe_company)/Converse_(shoe_company)-Logo.wine.svg",
  "Allbirds": "https://www.logo.wine/a/logo/Allbirds/Allbirds-Logo.wine.svg",
  "Moncler": "https://www.logo.wine/a/logo/Moncler/Moncler-Logo.wine.svg",
  "Guess": "https://www.logo.wine/a/logo/Guess_(clothing)/Guess_(clothing)-Logo.wine.svg",
  "Express": "https://www.logo.wine/a/logo/Express,_Inc./Express,_Inc.-Logo.wine.svg",
  "Dr. Martens": "https://www.logo.wine/a/logo/Dr._Martens/Dr._Martens-Logo.wine.svg",
  "Forever 21": "https://www.logo.wine/a/logo/Forever_21/Forever_21-Logo.wine.svg",
  "Merrell": "https://www.logo.wine/a/logo/Merrell_(company)/Merrell_(company)-Logo.wine.svg",
  "Tommy Hilfiger": "https://www.logo.wine/a/logo/Tommy_Hilfiger/Tommy_Hilfiger-Logo.wine.svg",
  "Timberland": "https://www.logo.wine/a/logo/The_Timberland_Company/The_Timberland_Company-Logo.wine.svg",
  "Rolex": "https://www.logo.wine/a/logo/Rolex/Rolex-Logo.wine.svg",
  "Michael Kors": "https://www.logo.wine/a/logo/Michael_Kors/Michael_Kors-Logo.wine.svg",
  "Wrangler": "https://www.logo.wine/a/logo/Wrangler_(jeans)/Wrangler_(jeans)-Logo.wine.svg",
  "Supreme": "https://www.logo.wine/a/logo/Supreme_(brand)/Supreme_(brand)-Logo.wine.svg",
  "Longchamp": "https://www.logo.wine/a/logo/Longchamp_(company)/Longchamp_(company)-Logo.wine.svg",
  "J.Crew": "https://www.logo.wine/a/logo/J.Crew/J.Crew-Logo.wine.svg",
  "Reiss": "https://www.logo.wine/a/logo/Reiss_(retailer)/Reiss_(retailer)-Logo.wine.svg",
  "Stone Island": "https://www.logo.wine/a/logo/Stone_Island/Stone_Island-Logo.wine.svg",
  "Levi's": "https://www.logo.wine/a/logo/Levi%27s/Levi%27s-Logo.wine.svg",
  "Tory Burch": "https://www.logo.wine/a/logo/Tory_Burch_LLC/Tory_Burch_LLC-Logo.wine.svg",
  "Kith": "https://www.logo.wine/a/logo/Kith_(brand)/Kith_(brand)-Logo.wine.svg",
  "Weekday": "https://www.logo.wine/a/logo/Weekday_(retailer)/Weekday_(retailer)-Logo.wine.svg",
  "Birkenstock": "https://www.logo.wine/a/logo/Birkenstock/Birkenstock-Logo.wine.svg",
  "Canada Goose": "https://www.logo.wine/a/logo/Canada_Goose/Canada_Goose-Logo.wine.svg",
  "Boohoo": "https://www.logo.wine/a/logo/Boohoo.com/Boohoo.com-Logo.wine.svg",
  "Abercrombie & Fitch": "https://www.logo.wine/a/logo/Abercrombie_%26_Fitch/Abercrombie_%26_Fitch-Logo.wine.svg",
  "Champion": "https://www.logo.wine/a/logo/Champion_(sportswear)/Champion_(sportswear)-Logo.wine.svg",
  "Victoria's Secret": "https://www.logo.wine/a/logo/Victoria%27s_Secret/Victoria%27s_Secret-Logo.wine.svg",
  "Clarks": "https://www.logo.wine/a/logo/C._%26_J._Clark/C._%26_J._Clark-Logo.wine.svg",
  "Versace": "https://www.logo.wine/a/logo/Versace/Versace-Logo.wine.svg",
  "Vans": "https://www.logo.wine/a/logo/Vans/Vans-Logo.wine.svg",
  "Patek Philippe": "https://www.logo.wine/a/logo/Patek_Philippe/Patek_Philippe-Logo.wine.svg",
  "UGG": "https://www.logo.wine/a/logo/UGG_(brand)/UGG_(brand)-Logo.wine.svg",
  "Vacheron Constantin": "https://www.logo.wine/a/logo/Vacheron_Constantin/Vacheron_Constantin-Logo.wine.svg",
  "Zegna": "https://www.logo.wine/a/logo/Ermenegildo_Zegna/Ermenegildo_Zegna-Logo.wine.svg",
  "Umbro": "https://www.logo.wine/a/logo/Umbro/Umbro-Logo.wine.svg",
  "Tissot": "https://www.logo.wine/a/logo/Tissot/Tissot-Logo.wine.svg",
  "Cartier": "https://www.logo.wine/a/logo/Cartier_(jeweler)/Cartier_(jeweler)-Logo.wine.svg",
  "TAG Heuer": "https://www.logo.wine/a/logo/TAG_Heuer/TAG_Heuer-Logo.wine.svg",
  "Vuori": "https://www.logo.wine/a/logo/Vuori/Vuori-Logo.wine.svg",
  "Breitling": "https://www.logo.wine/a/logo/Breitling_SA/Breitling_SA-Logo.wine.svg",
  "Omega": "https://www.logo.wine/a/logo/Omega_SA/Omega_SA-Logo.wine.svg",
  "BAPE": "https://www.logo.wine/a/logo/A_Bathing_Ape/A_Bathing_Ape-Logo.wine.svg",
  "YSL": "https://www.logo.wine/a/logo/Yves_Saint_Laurent_(brand)/Yves_Saint_Laurent_(brand)-Logo.wine.svg",
  "Tudor": "https://www.logo.wine/a/logo/Tudor_Watches/Tudor_Watches-Logo.wine.svg",
  "Audemars Piguet": "https://www.logo.wine/a/logo/Audemars_Piguet/Audemars_Piguet-Logo.wine.svg",
  "Zenith": "https://www.logo.wine/a/logo/Zenith_(watchmaker)/Zenith_(watchmaker)-Logo.wine.svg",
  "Longines": "https://www.logo.wine/a/logo/Longines/Longines-Logo.wine.svg",
  "Stüssy": "https://www.logo.wine/a/logo/St%C3%BCssy/St%C3%BCssy-Logo.wine.svg",
  "Salomon": "https://www.logo.wine/a/logo/Salomon_Group/Salomon_Group-Logo.wine.svg",
  "Sephora": "https://www.logo.wine/a/logo/Sephora/Sephora-Logo.wine.svg",
  "Celine": "https://www.logo.wine/a/logo/Celine_(brand)/Celine_(brand)-Logo.wine.svg",
  "Bottega Veneta": "https://www.logo.wine/a/logo/Bottega_Veneta/Bottega_Veneta-Logo.wine.svg",
  "Loewe": "https://www.logo.wine/a/logo/Loewe_(fashion_brand)/Loewe_(fashion_brand)-Logo.wine.svg",
  "Alexander McQueen": "https://www.logo.wine/a/logo/Alexander_McQueen_(brand)/Alexander_McQueen_(brand)-Logo.wine.svg",
  "Montblanc": "https://www.logo.wine/a/logo/Montblanc_(company)/Montblanc_(company)-Logo.wine.svg",
  "Fear of God": "https://www.logo.wine/a/logo/Fear_of_God_(brand)/Fear_of_God_(brand)-Logo.wine.svg",
  "Maison Margiela": "https://www.logo.wine/a/logo/Maison_Margiela/Maison_Margiela-Logo.wine.svg",
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

function ensureBlackSvg(content) {
  let s = content;
  s = s.replace(/fill=["']#fff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']#ffffff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']rgb\(255,\s*255,\s*255\)["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');

  s = s.replace(/stroke=["']#fff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']#ffffff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke:\s*#fff(?:fff)?/gi, 'stroke: #0f0f0f');

  if (!s.includes('fill=') && !s.includes('fill:')) {
    s = s.replace(/<svg([^>]*)>/i, '<svg$1 fill="#0f0f0f">');
  }
  return s;
}

async function fetchVector(brandName) {
  // Strategy 1: SimpleIcons (Pure black vector SVGs!)
  const sSlug = SIMPLE_ICONS[brandName];
  if (sSlug) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${sSlug}.svg`);
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: 'SimpleIcons (Black Vector)' };
        }
      }
    } catch(e) {}
  }

  // Strategy 2: Logo.wine
  const wUrl = LOGO_WINE[brandName];
  if (wUrl) {
    try {
      const res = await fetch(wUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: 'Logo.wine (Black Vector)' };
        }
      }
    } catch(e) {}
  }

  // Strategy 3: Dynamic candidate search
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
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        let text = await res.text();
        if (text.length > 200) {
          text = ensureBlackSvg(text);
          return { buffer: Buffer.from(text), format: 'svg', source: 'Logo.wine Candidate (Black Vector)' };
        }
      }
    } catch(e) {}
  }

  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Reseeding 100% Black Vector Logos for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const asset = await fetchVector(item.name);
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
      console.log(`[${i + 1}/${items.length}] ✓ BLACK VECTOR STORED (${asset.source}): ${item.name} -> ${localPath} (${asset.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FETCH VECTOR FOR: ${item.name}`);
    }

    await delay(80);
  }

  console.log(`Completed ${tableName}: ${count}/${items.length} 100% black vector SVGs reseeded!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ 100% BLACK VECTOR LOGOS RESEEDED FOR FASHION & FOOD!');
}

run();
