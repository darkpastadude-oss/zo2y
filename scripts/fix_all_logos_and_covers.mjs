/**
 * fix_all_logos_and_covers.mjs
 *
 * 1. Replaces ALL PNG brand logos (food + fashion) with real SVGs from Wikimedia Commons
 * 2. Adds missing background cover images to brand_covers.json (Unsplash)
 */
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

const foodDir = path.join(process.cwd(), 'public', 'brand-assets', 'food');
const fashionDir = path.join(process.cwd(), 'public', 'brand-assets', 'fashion');
const coversPath = path.join(process.cwd(), 'assets', 'data', 'brand_covers.json');

fs.mkdirSync(foodDir, { recursive: true });
fs.mkdirSync(fashionDir, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

const WIKI_UA = 'zo2y-brand-fetcher/1.0 (contact@zo2y.com)';

// ===================================================
// SimpleIcons (guaranteed correct black SVGs)
// ===================================================
const SI_SLUGS = {
  "Burger King": "burgerking",
  "KFC": "kfc",
  "McDonald's": "mcdonalds",
  "Starbucks": "starbucks",
  "Taco Bell": "tacobell",
};

// ===================================================
// Pre-verified Wikimedia file titles (search already confirmed these exist)
// ===================================================
const WIKI_FILE_TITLES = {
  // Food brands verified via Wikimedia Commons search
  "Blaze Pizza": "File:Blaze Pizza logo.svg",
  "Bob Evans": "File:Bob Evans Restaurants logo.svg",
  "Bojangles": "File:Bojangles' logo.svg",
  "Buffalo Wild Wings": "File:Buffalo Wild Wings logo.svg",
  "Carrabba's Italian Grill": "File:Carrabbas Italian Grill logo.svg",
  "Carvel": "File:Carvel logo.svg",
  "Casey's General Store": "File:Casey's General Stores logo.svg",
  "Cava": "File:Cava (restaurant) logo.svg",
  "Church's Texas Chicken": "File:Church's Chicken logo.svg",
  "Cici's Pizza": "File:Cicis Pizza logo.svg",
  "Culver's": "File:Culvers logo.svg",
  "Danone": "File:Danone.svg",
  "Dave & Buster's": "File:Dave and Busters logo.svg",
  "El Pollo Loco": "File:El Pollo Loco logo.svg",
  "Ferrero Rocher": "File:Ferrero logo.svg",
  "First Watch": "File:First Watch restaurant group logo.svg",
  "Five Guys": "File:Five Guys logo.svg",
  "Giordano's": "File:Giordano's logo.svg",
  "Godiva": "File:Godiva Chocolatier logo.svg",
  "Golden Corral": "File:Golden Corral logo.svg",
  "Häagen-Dazs": "File:Haagen-Dazs logo.svg",
  "In-N-Out Burger": "File:In-N-Out Burger logo.svg",
  "Jersey Mike's Subs": "File:Jersey Mike's logo.svg",
  "Jet's Pizza": "File:Jet's Pizza logo.svg",
  "Jimmy John's": "File:Jimmy John's logo.svg",
  "Lindt": "File:Lindt & Sprüngli Logo.svg",
  "Little Caesars": "File:Little Caesars logo.svg",
  "LongHorn Steakhouse": "File:LongHorn Steakhouse logo.svg",
  "Lou Malnati's": "File:Lou Malnati's logo.svg",
  "Mellow Mushroom": "File:Mellow Mushroom logo.svg",
  "MOD Pizza": "File:MOD Pizza logo.svg",
  "Nando's": "File:Nando's logo.svg",
  "P.F. Chang's": "File:PF Chang's logo.svg",
  "Panda Express": "File:Panda Express logo.svg",
  "Peet's Coffee": "File:Peet's Coffee logo.svg",
  "Perkins Restaurant & Bakery": "File:Perkins Restaurant logo.svg",
  "Portillo's": "File:Portillo's logo.svg",
  "Red Lobster": "File:Red Lobster logo.svg",
  "Round Table Pizza": "File:Round Table Pizza logo.svg",
  "Shake Shack": "File:Shake Shack logo.svg",
  "Smashburger": "File:Smashburger logo.svg",
  "Snooze A.M. Eatery": "File:Snooze AM Eatery logo.svg",
  "Sweetgreen": "File:Sweetgreen logo.svg",
  "Torchy's Tacos": "File:Torchy's Tacos logo.svg",
  "Wawa Fresh Food": "File:Wawa logo.svg",
  "White Castle": "File:White Castle logo.svg",
  "White Castle Slider": "File:White Castle logo.svg",
  "Wingstop": "File:Wingstop logo.svg",
  "Zaxby's": "File:Zaxby's logo.svg",
  "Zippy's": "File:Zippy's Restaurant logo.svg",
  "Zoe's Kitchen": "File:Zoe's Kitchen logo.svg",
};

// ===================================================
// Curated Unsplash cover images per brand
// ===================================================
const BRAND_COVERS = {
  // Fashion
  "Adidas": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Nike": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Gucci": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format&q=80",
  "Louis Vuitton": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Prada": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&h=627&fit=crop&auto=format&q=80",
  "Chanel": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format&q=80",
  "Balenciaga": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Supreme": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Off-White": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Zara": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format&q=80",
  "H&M": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Levi's": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Ralph Lauren": "https://images.unsplash.com/photo-1594938298603-c8148c4b8451?w=1200&h=627&fit=crop&auto=format&q=80",
  "Tommy Hilfiger": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Calvin Klein": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&h=627&fit=crop&auto=format&q=80",
  "Versace": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Dior": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format&q=80",
  "Fendi": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Valentino": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Burberry": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format&q=80",
  "Hermès": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Hermes": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Givenchy": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Alexander McQueen": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Bottega Veneta": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format&q=80",
  "Celine": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format&q=80",
  "Loewe": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jacquemus": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Maison Margiela": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Fear of God": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Kith": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Palace": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "BAPE": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Stüssy": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Carhartt WIP": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Carhartt": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Chrome Hearts": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Rick Owens": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Amiri": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Palm Angels": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  "Moncler": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Canada Goose": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Arc'teryx": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "Patagonia": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "The North Face": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "Gymshark": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=627&fit=crop&auto=format&q=80",
  "Lululemon": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=627&fit=crop&auto=format&q=80",
  "Alo Yoga": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=627&fit=crop&auto=format&q=80",
  "Under Armour": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=627&fit=crop&auto=format&q=80",
  "Puma": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Reebok": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "New Balance": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "ASICS": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Asics": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Salomon": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "On Running": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Vans": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Converse": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Birkenstock": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Crocs": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Dr. Martens": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Timberland": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "UGG": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jimmy Choo": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Christian Louboutin": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Rolex": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Audemars Piguet": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Patek Philippe": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cartier": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Omega": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "TAG Heuer": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format&q=80",
  "Tiffany & Co.": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Pandora": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Swarovski": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Oakley": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format&q=80",
  "Ray-Ban": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format&q=80",
  "Stella McCartney": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format&q=80",
  "Acne Studios": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "MM6 Maison Margiela": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format&q=80",
  "Stone Island": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "CP Company": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format&q=80",
  "Essentials Fear of God": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format&q=80",
  // Food
  "McDonald's": "https://images.unsplash.com/photo-1586816001966-79b736744398?w=1200&h=627&fit=crop&auto=format&q=80",
  "Starbucks": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Burger King": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "KFC": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Taco Bell": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Subway": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Domino's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Domino's Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Pizza Hut": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Chipotle": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Panera Bread": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Chick-fil-A": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Wendy's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Dunkin'": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Popeyes": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jack in the Box": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Five Guys": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Shake Shack": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "In-N-Out Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Whataburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Smashburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Blaze Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "MOD Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Little Caesars": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Papa John's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Round Table Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Panda Express": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Olive Garden": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "The Cheesecake Factory": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Outback Steakhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Applebee's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Denny's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "IHOP": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cracker Barrel": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "TGI Fridays": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Texas Roadhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Red Lobster": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "LongHorn Steakhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Buffalo Wild Wings": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jollibee": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Tim Hortons": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Krispy Kreme": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cinnabon": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Auntie Anne's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jamba Juice": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Dairy Queen": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cold Stone Creamery": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Nestlé": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Kellogg's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Ben & Jerry's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Häagen-Dazs": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Lindt": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Godiva": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Ferrero Rocher": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Nutella": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Heinz": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Sweetgreen": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cava": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Qdoba": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Costa Coffee": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Peet's Coffee": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Raising Cane's": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Wingstop": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Church's Texas Chicken": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "El Pollo Loco": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jersey Mike's Subs": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jimmy John's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Arby's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Sonic Drive-In": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "White Castle": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "White Castle Slider": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Bob Evans": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Waffle House": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Golden Corral": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Dave & Buster's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "P.F. Chang's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Nando's": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Wagamama": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "YO! Sushi": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Moe's Southwest Grill": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Del Taco": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "Torchy's Tacos": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format&q=80",
  "The Habit Burger Grill": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Portillo's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Red Robin": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Chuck E. Cheese": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Giordano's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Bojangles": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Mellow Mushroom": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Snooze A.M. Eatery": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "First Watch": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Perkins Restaurant & Bakery": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Zaxby's": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Buc-ee's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Casey's General Store": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "QuikTrip": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Sheetz Fresh Food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Wawa Fresh Food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Danone": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Cici's Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Culver's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format&q=80",
  "Jet's Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Lou Malnati's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format&q=80",
  "Carrabba's Italian Grill": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Carvel": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format&q=80",
  "Pret A Manger": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Smokey Bones": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Zippy's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format&q=80",
  "Zoe's Kitchen": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format&q=80",
  "TX Chicken": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format&q=80",
};

// ===================================================
// Helpers
// ===================================================
function ensureBlackSvg(content) {
  let s = content;
  // Replace white fills with near-black
  s = s.replace(/fill=["']#fff(?:fff)?["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');
  s = s.replace(/stroke=["']#fff(?:fff)?["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  return s;
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': WIKI_UA,
          'Accept': 'image/svg+xml,image/*,text/*,*/*',
        },
        redirect: 'follow',
      });
      if (res.status === 429) {
        console.log(`  Rate limited on ${url.slice(0,50)}, waiting 2s...`);
        await delay(2000);
        continue;
      }
      return res;
    } catch (e) {
      await delay(500);
    }
  }
  return null;
}

async function searchWikimediaForLogo(name) {
  await delay(300);
  const q = `${name} logo`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=10&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': WIKI_UA }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const results = (data?.query?.search || []).filter(r => r.title?.toLowerCase().endsWith('.svg'));
  if (!results.length) return null;

  // Prefer results that include the brand name in the title
  const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const best = results.find(r => nameWords.every(w => r.title.toLowerCase().includes(w))) || results[0];
  return best?.title;
}

async function downloadWikimediaSvg(fileTitle) {
  const encoded = encodeURIComponent(fileTitle.replace(/^File:/i, ''));
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
  const res = await fetchWithRetry(url);
  if (!res?.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('svg') || res.url.includes('.svg')) {
    const text = await res.text();
    if (text.includes('<svg') && text.length > 100) {
      return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg' };
    }
  }
  return null;
}

async function getBrandSvg(name) {
  // 1. SimpleIcons (highest quality, guaranteed black, vector)
  const siSlug = SI_SLUGS[name];
  if (siSlug) {
    const res = await fetchWithRetry(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${siSlug}.svg`);
    if (res?.ok) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 100) {
        return { buf: Buffer.from(text.replace('<svg ', '<svg fill="#0f0f0f" ')), ext: 'svg', source: 'SimpleIcons' };
      }
    }
  }

  // 2. Pre-verified Wikimedia file title
  const wikiTitle = WIKI_FILE_TITLES[name];
  if (wikiTitle) {
    const result = await downloadWikimediaSvg(wikiTitle);
    if (result) return { ...result, source: `Wikimedia (${wikiTitle})` };
  }

  // 3. Search Wikimedia Commons
  const foundTitle = await searchWikimediaForLogo(name);
  if (foundTitle) {
    const result = await downloadWikimediaSvg(foundTitle);
    if (result) return { ...result, source: `Wikimedia Search (${foundTitle})` };
  }

  return null;
}

// ===================================================
// Main tasks
// ===================================================
async function fixLogos(table, dir) {
  const { data: brands } = await supabase.from(table).select('id, name, domain, logo_url').order('name');
  const pngBrands = brands.filter(b => b.logo_url?.endsWith('.png'));
  if (!pngBrands.length) { console.log(`  No PNG ${table} logos to fix.`); return; }

  console.log(`\n==== Fix ${pngBrands.length} ${table} PNG logos ====\n`);
  let fixed = 0;

  for (let i = 0; i < pngBrands.length; i++) {
    const brand = pngBrands[i];
    const slug = (brand.domain || brand.name)
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();

    const result = await getBrandSvg(brand.name);

    if (result?.ext === 'svg') {
      const fileName = `${slug}.svg`;
      const localPath = path.join(dir, fileName);
      fs.writeFileSync(localPath, result.buf);

      const storagePath = `${table}/${fileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      const { error } = await supabase.storage.from('brand-logos').upload(storagePath, result.buf, {
        contentType: 'image/svg+xml',
        upsert: true,
      });
      if (!error) {
        await supabase.from(table).update({ logo_url: publicUrl }).eq('id', brand.id);
        fixed++;
        console.log(`[${i + 1}/${pngBrands.length}] ✓ ${brand.name} -> ${fileName} (${result.source})`);
      } else {
        console.log(`[${i + 1}/${pngBrands.length}] ✗ Upload error: ${brand.name}: ${error.message}`);
      }
    } else {
      console.log(`[${i + 1}/${pngBrands.length}] ⚠ No SVG found: ${brand.name}`);
    }

    await delay(300); // Be nice to Wikimedia
  }

  console.log(`\n  Fixed ${fixed}/${pngBrands.length} ${table} logos to SVG.`);
}

async function addCovers() {
  console.log('\n==== Adding missing background cover images ====\n');

  const { data: fashion } = await supabase.from('fashion_brands').select('id, name');
  const { data: food } = await supabase.from('food_brands').select('id, name');
  const allBrands = [...(fashion || []), ...(food || [])];

  const existing = fs.existsSync(coversPath)
    ? JSON.parse(fs.readFileSync(coversPath, 'utf8'))
    : {};

  let added = 0;
  for (const brand of allBrands) {
    if (existing[brand.id]) continue;
    const cover = BRAND_COVERS[brand.name];
    if (cover) {
      existing[brand.id] = cover;
      added++;
      console.log(`  + Cover: ${brand.name}`);
    }
  }

  fs.writeFileSync(coversPath, JSON.stringify(existing, null, 2));
  const noCovers = allBrands.filter(b => !existing[b.id]);
  console.log(`\nAdded ${added} covers. Total: ${Object.keys(existing).length}. Still missing: ${noCovers.length}`);
  if (noCovers.length > 0) {
    console.log('  Brands still without covers:', noCovers.map(b => b.name).join(', '));
  }
}

async function run() {
  await fixLogos('food_brands', foodDir);
  await fixLogos('fashion_brands', fashionDir);
  await addCovers();
  console.log('\n✅ ALL DONE!');
}

run().catch(console.error);
