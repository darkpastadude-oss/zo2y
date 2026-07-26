/**
 * fix_food_logos_and_backgrounds.mjs
 *
 * Two tasks:
 * 1. Replace all PNG food brand logos with proper SVG vector logos from Logo.wine / Wikimedia / SimpleIcons
 * 2. Add background cover images to brand_covers.json for all brands missing them (using Unsplash Source)
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

const delay = ms => new Promise(res => setTimeout(res, ms));

function ensureBlackSvg(content) {
  let s = content;
  s = s.replace(/fill=["']#fff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']#ffffff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');
  s = s.replace(/stroke=["']#fff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']#ffffff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  if (!s.includes('fill=') && !s.includes('fill:')) {
    s = s.replace(/<svg([^>]*)>/i, '<svg$1 fill="#0f0f0f">');
  }
  return s;
}

// ==================== PART 1: LOGO URLS ====================

// SimpleIcons slugs (always pure black SVGs, no white fill needed)
const SIMPLE_ICONS = {
  "Blaze Pizza": "blazepizza",
  "Buffalo Wild Wings": "buffalowildwings",
  "Five Guys": "fiveguys",
  "In-N-Out Burger": "innout",
  "Little Caesars": "littlecaesars",
  "Panda Express": "pandaexpress",
  "Shake Shack": "shakeshack",
  "Sweetgreen": "sweetgreen",
  "Wingstop": "wingstop",
};

// Logo.wine URLs (curated exact mappings)
const LOGO_WINE = {
  "Blaze Pizza": "https://www.logo.wine/a/logo/Blaze_Pizza/Blaze_Pizza-Logo.wine.svg",
  "Bob Evans": "https://www.logo.wine/a/logo/Bob_Evans_Restaurants/Bob_Evans_Restaurants-Logo.wine.svg",
  "Bojangles": "https://www.logo.wine/a/logo/Bojangles%27_Famous_Chicken_%27n_Biscuits/Bojangles%27_Famous_Chicken_%27n_Biscuits-Logo.wine.svg",
  "Buffalo Wild Wings": "https://www.logo.wine/a/logo/Buffalo_Wild_Wings/Buffalo_Wild_Wings-Logo.wine.svg",
  "Carrabba's Italian Grill": "https://www.logo.wine/a/logo/Carrabba%27s_Italian_Grill/Carrabba%27s_Italian_Grill-Logo.wine.svg",
  "Cava": "https://www.logo.wine/a/logo/Cava_(restaurant)/Cava_(restaurant)-Logo.wine.svg",
  "Church's Texas Chicken": "https://www.logo.wine/a/logo/Church%27s_Chicken/Church%27s_Chicken-Logo.wine.svg",
  "Dairy Queen": "https://www.logo.wine/a/logo/Dairy_Queen/Dairy_Queen-Logo.wine.svg",
  "Dave & Buster's": "https://www.logo.wine/a/logo/Dave_%26_Buster%27s/Dave_%26_Buster%27s-Logo.wine.svg",
  "Del Taco": "https://www.logo.wine/a/logo/Del_Taco/Del_Taco-Logo.wine.svg",
  "El Pollo Loco": "https://www.logo.wine/a/logo/El_Pollo_Loco/El_Pollo_Loco-Logo.wine.svg",
  "Ferrero Rocher": "https://www.logo.wine/a/logo/Ferrero_Rocher/Ferrero_Rocher-Logo.wine.svg",
  "First Watch": "https://www.logo.wine/a/logo/First_Watch/First_Watch-Logo.wine.svg",
  "Five Guys": "https://www.logo.wine/a/logo/Five_Guys/Five_Guys-Logo.wine.svg",
  "Giordano's": "https://www.logo.wine/a/logo/Giordano%27s/Giordano%27s-Logo.wine.svg",
  "Godiva": "https://www.logo.wine/a/logo/Godiva_Chocolatier/Godiva_Chocolatier-Logo.wine.svg",
  "Golden Corral": "https://www.logo.wine/a/logo/Golden_Corral/Golden_Corral-Logo.wine.svg",
  "Häagen-Dazs": "https://www.logo.wine/a/logo/H%C3%A4agen-Dazs/H%C3%A4agen-Dazs-Logo.wine.svg",
  "In-N-Out Burger": "https://www.logo.wine/a/logo/In-N-Out_Burger/In-N-Out_Burger-Logo.wine.svg",
  "Jersey Mike's Subs": "https://www.logo.wine/a/logo/Jersey_Mike%27s_Subs/Jersey_Mike%27s_Subs-Logo.wine.svg",
  "Jet's Pizza": "https://www.logo.wine/a/logo/Jet%27s_Pizza/Jet%27s_Pizza-Logo.wine.svg",
  "Jimmy John's": "https://www.logo.wine/a/logo/Jimmy_John%27s/Jimmy_John%27s-Logo.wine.svg",
  "Kellogg's": "https://www.logo.wine/a/logo/Kellogg%27s/Kellogg%27s-Logo.wine.svg",
  "Lindt": "https://www.logo.wine/a/logo/Lindt_%26_Spr%C3%BCngli/Lindt_%26_Spr%C3%BCngli-Logo.wine.svg",
  "Little Caesars": "https://www.logo.wine/a/logo/Little_Caesars/Little_Caesars-Logo.wine.svg",
  "LongHorn Steakhouse": "https://www.logo.wine/a/logo/LongHorn_Steakhouse/LongHorn_Steakhouse-Logo.wine.svg",
  "Lou Malnati's": "https://www.logo.wine/a/logo/Lou_Malnati%27s/Lou_Malnati%27s-Logo.wine.svg",
  "Mellow Mushroom": "https://www.logo.wine/a/logo/Mellow_Mushroom/Mellow_Mushroom-Logo.wine.svg",
  "MOD Pizza": "https://www.logo.wine/a/logo/MOD_Pizza/MOD_Pizza-Logo.wine.svg",
  "Nando's": "https://www.logo.wine/a/logo/Nando%27s/Nando%27s-Logo.wine.svg",
  "P.F. Chang's": "https://www.logo.wine/a/logo/P.F._Chang%27s/P.F._Chang%27s-Logo.wine.svg",
  "Panda Express": "https://www.logo.wine/a/logo/Panda_Express/Panda_Express-Logo.wine.svg",
  "Peet's Coffee": "https://www.logo.wine/a/logo/Peet%27s_Coffee_%26_Tea/Peet%27s_Coffee_%26_Tea-Logo.wine.svg",
  "Perkins Restaurant & Bakery": "https://www.logo.wine/a/logo/Perkins_Restaurant_%26_Bakery/Perkins_Restaurant_%26_Bakery-Logo.wine.svg",
  "Portillo's": "https://www.logo.wine/a/logo/Portillo%27s/Portillo%27s-Logo.wine.svg",
  "Raising Cane's": "https://www.logo.wine/a/logo/Raising_Cane%27s_Chicken_Fingers/Raising_Cane%27s_Chicken_Fingers-Logo.wine.svg",
  "Red Lobster": "https://www.logo.wine/a/logo/Red_Lobster/Red_Lobster-Logo.wine.svg",
  "Round Table Pizza": "https://www.logo.wine/a/logo/Round_Table_Pizza/Round_Table_Pizza-Logo.wine.svg",
  "Shake Shack": "https://www.logo.wine/a/logo/Shake_Shack/Shake_Shack-Logo.wine.svg",
  "Smashburger": "https://www.logo.wine/a/logo/Smashburger/Smashburger-Logo.wine.svg",
  "Sweetgreen": "https://www.logo.wine/a/logo/Sweetgreen/Sweetgreen-Logo.wine.svg",
  "Wingstop": "https://www.logo.wine/a/logo/Wingstop/Wingstop-Logo.wine.svg",
  "Zaxby's": "https://www.logo.wine/a/logo/Zaxby%27s/Zaxby%27s-Logo.wine.svg",
};

// Wikimedia Commons curated exact filenames
const WIKIMEDIA = {
  "Ben & Jerry's": "Ben_%26_Jerry%27s_logo.svg",
  "Blaze Pizza": "Blaze_Pizza_logo.svg",
  "Bob Evans": "Bob_Evans_logo.svg",
  "Buc-ee's": "Buc-ee%27s_logo.svg",
  "Carvel": "Carvel_logo.svg",
  "Casey's General Store": "Casey%27s_General_Store_logo.svg",
  "Church's Texas Chicken": "Church%27s_Chicken_logo.svg",
  "Cici's Pizza": "Cicis_Pizza_logo.svg",
  "Culver's": "Culver%27s_logo.svg",
  "Danone": "Danone_logo.svg",
  "Dave & Buster's": "Dave_%26_Buster%27s_logo.svg",
  "El Pollo Loco": "El_Pollo_Loco_logo.svg",
  "Ferrero Rocher": "Ferrero_Rocher_logo.svg",
  "First Watch": "First_Watch_logo.svg",
  "Five Guys": "Five_Guys_logo.svg",
  "Giordano's": "Giordano%27s_logo.svg",
  "Godiva": "Godiva_Chocolatier_logo.svg",
  "Golden Corral": "Golden_Corral_logo.svg",
  "Häagen-Dazs": "H%C3%A4agen-Dazs_logo.svg",
  "In-N-Out Burger": "In-N-Out_Burger_logo.svg",
  "Jersey Mike's Subs": "Jersey_Mike%27s_Subs_logo.svg",
  "Jet's Pizza": "Jet%27s_Pizza_logo.svg",
  "Little Caesars": "Little_Caesars_logo.svg",
  "LongHorn Steakhouse": "LongHorn_Steakhouse_logo.svg",
  "Lou Malnati's": "Lou_Malnati%27s_logo.svg",
  "Mellow Mushroom": "Mellow_Mushroom_logo.svg",
  "MOD Pizza": "MOD_Pizza_logo.svg",
  "Nando's": "Nando%27s_logo.svg",
  "P.F. Chang's": "P.F._Chang%27s_logo.svg",
  "Panda Express": "Panda_Express_logo.svg",
  "Peet's Coffee": "Peet%27s_Coffee_logo.svg",
  "Portillo's": "Portillo%27s_logo.svg",
  "Raising Cane's": "Raising_Cane%27s_logo.svg",
  "Red Lobster": "Red_Lobster_logo.svg",
  "Round Table Pizza": "Round_Table_Pizza_logo.svg",
  "Shake Shack": "Shake_Shack_logo.svg",
  "Smashburger": "Smashburger_logo.svg",
  "Snooze A.M. Eatery": "Snooze_AM_Eatery_logo.svg",
  "Sweetgreen": "Sweetgreen_logo.svg",
  "Torchy's Tacos": "Torchy%27s_Tacos_logo.svg",
  "Wawa Fresh Food": "Wawa_logo.svg",
  "White Castle": "White_Castle_logo.svg",
  "White Castle Slider": "White_Castle_logo.svg",
  "Wingstop": "Wingstop_logo.svg",
  "Zaxby's": "Zaxby%27s_logo.svg",
  "Zippy's": "Zippy%27s_logo.svg",
  "Zoe's Kitchen": "Zoe%27s_Kitchen_logo.svg",
};

async function fetchWithDelay(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      if (res.status === 429) { await delay(2000); continue; }
      if (res.ok) return res;
    } catch(e) {}
    await delay(500);
  }
  return null;
}

async function fetchSvg(name) {
  // Strategy 1: SimpleIcons
  const siSlug = SIMPLE_ICONS[name];
  if (siSlug) {
    const res = await fetchWithDelay(`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${siSlug}.svg`);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 100) {
        return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: 'SimpleIcons' };
      }
    }
  }

  // Strategy 2: Logo.wine direct URL
  const lwUrl = LOGO_WINE[name];
  if (lwUrl) {
    const res = await fetchWithDelay(lwUrl);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 200) {
        return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: 'Logo.wine' };
      }
    }
  }

  // Strategy 3: Wikimedia Commons
  const wikiFile = WIKIMEDIA[name];
  if (wikiFile) {
    const res = await fetchWithDelay(`https://commons.wikimedia.org/wiki/Special:FilePath/${wikiFile}`);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 200) {
        return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: 'Wikimedia' };
      }
      // Maybe it's a PNG
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 1000) {
        return { buf, ext: 'png', source: 'Wikimedia (PNG)' };
      }
    }
  }

  // Strategy 4: Dynamic Logo.wine candidates
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  const candidates = [
    cleanName,
    cleanName + '_(restaurant)',
    cleanName + '_(pizza)',
    cleanName + '_(food)',
    cleanName + '_(brand)',
    cleanName + '_(chain)',
    cleanName + '_Inc.',
  ];
  for (const c of candidates) {
    const url = `https://www.logo.wine/a/logo/${encodeURIComponent(c)}/${encodeURIComponent(c)}-Logo.wine.svg`;
    const res = await fetchWithDelay(url);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 200) {
        return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: `Logo.wine (${c})` };
      }
    }
    await delay(80);
  }

  return null;
}

// ==================== PART 2: BACKGROUND COVERS ====================

// Curated Unsplash/Pexels photo URLs for each brand (no auth needed for direct photo access)
const BRAND_COVERS = {
  // Fashion
  "Adidas": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Nike": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Gucci": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format",
  "Louis Vuitton": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format",
  "Prada": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&h=627&fit=crop&auto=format",
  "Chanel": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format",
  "Balenciaga": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format",
  "Supreme": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Off-White": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Zara": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=627&fit=crop&auto=format",
  "H&M": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&h=627&fit=crop&auto=format",
  "Levi's": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=627&fit=crop&auto=format",
  "Ralph Lauren": "https://images.unsplash.com/photo-1594938298603-c8148c4b8451?w=1200&h=627&fit=crop&auto=format",
  "Tommy Hilfiger": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1200&h=627&fit=crop&auto=format",
  "Calvin Klein": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&h=627&fit=crop&auto=format",
  "Versace": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format",
  "Dior": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format",
  "Fendi": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format",
  "Valentino": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format",
  "Burberry": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format",
  "Hermes": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format",
  "Hermès": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=627&fit=crop&auto=format",
  "Givenchy": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format",
  "Alexander McQueen": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format",
  "Bottega Veneta": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=627&fit=crop&auto=format",
  "Loewe": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&h=627&fit=crop&auto=format",
  "Celine": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=627&fit=crop&auto=format",
  "Jacquemus": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format",
  "Maison Margiela": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format",
  "Fear of God": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Essentials": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Kith": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Palace": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "BAPE": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Stüssy": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Carhartt WIP": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=627&fit=crop&auto=format",
  "Chrome Hearts": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Rick Owens": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=627&fit=crop&auto=format",
  "Amiri": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Palm Angels": "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=627&fit=crop&auto=format",
  "Moncler": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=627&fit=crop&auto=format",
  "Canada Goose": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=627&fit=crop&auto=format",
  "Arc'teryx": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format",
  "Patagonia": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format",
  "The North Face": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format",
  "Gymshark": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=627&fit=crop&auto=format",
  "Lululemon": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=627&fit=crop&auto=format",
  "Alo Yoga": "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&h=627&fit=crop&auto=format",
  "Vuori": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=627&fit=crop&auto=format",
  "Under Armour": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=627&fit=crop&auto=format",
  "Puma": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Reebok": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "New Balance": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Asics": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "ASICS": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Salomon": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=627&fit=crop&auto=format",
  "Hoka One One": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "On Running": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Vans": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Converse": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Birkenstock": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Crocs": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Dr. Martens": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Timberland": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "UGG": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Clarks": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Merrell": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Jimmy Choo": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Manolo Blahnik": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Christian Louboutin": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=627&fit=crop&auto=format",
  "Rolex": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Audemars Piguet": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Patek Philippe": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Cartier": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Omega": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "TAG Heuer": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Breitling": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Vacheron Constantin": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Zenith": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Tudor": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Longines": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Tissot": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Casio": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Seiko": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Swatch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Montblanc": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=627&fit=crop&auto=format",
  "Tiffany & Co.": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format",
  "Pandora": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format",
  "Swarovski": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=627&fit=crop&auto=format",
  // Food
  "McDonald's": "https://images.unsplash.com/photo-1586816001966-79b736744398?w=1200&h=627&fit=crop&auto=format",
  "Starbucks": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Burger King": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "KFC": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Taco Bell": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Subway": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Domino's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Domino's Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Pizza Hut": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Chipotle": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Panera Bread": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Chick-fil-A": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Wendy's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Dunkin'": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Popeyes": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Jack in the Box": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Five Guys": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Shake Shack": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "In-N-Out Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Whataburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Smashburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Blaze Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "MOD Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Little Caesars": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Papa John's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Round Table Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=627&fit=crop&auto=format",
  "Panda Express": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Olive Garden": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "The Cheesecake Factory": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Outback Steakhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Applebee's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Denny's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "IHOP": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Cracker Barrel": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "TGI Fridays": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Texas Roadhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Red Lobster": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "LongHorn Steakhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Buffalo Wild Wings": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Jollibee": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Tim Hortons": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Krispy Kreme": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Cinnabon": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Auntie Anne's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Jamba Juice": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Dairy Queen": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Cold Stone Creamery": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Starbucks": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Nestlé": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Kellogg's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Ben & Jerry's": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Häagen-Dazs": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Lindt": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Godiva": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Ferrero Rocher": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Nutella": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Heinz": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Sweetgreen": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format",
  "Cava": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=627&fit=crop&auto=format",
  "Qdoba": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Costa Coffee": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Peet's Coffee": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&h=627&fit=crop&auto=format",
  "Raising Cane's": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Wingstop": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Church's Texas Chicken": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "El Pollo Loco": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Jersey Mike's Subs": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Jimmy John's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Arby's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Sonic Drive-In": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "White Castle": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "White Castle Slider": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Bob Evans": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Waffle House": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Golden Corral": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Benihana": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Dave & Buster's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "P.F. Chang's": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Nando's": "https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=1200&h=627&fit=crop&auto=format",
  "Wagamama": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "YO! Sushi": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Moe's Southwest Grill": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Del Taco": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Torchy's Tacos": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&h=627&fit=crop&auto=format",
  "Habit Burger Grill": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "The Habit Burger Grill": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Portillo's": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Red Robin": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=627&fit=crop&auto=format",
  "Chuck E. Cheese": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
  "Outback Steakhouse": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&h=627&fit=crop&auto=format",
};

// ==================== MAIN ====================

async function fixFoodLogos() {
  const { data: foodBrands } = await supabase.from('food_brands').select('id, name, domain, logo_url').order('name');
  const pngBrands = foodBrands.filter(b => b.logo_url?.endsWith('.png'));

  console.log(`\n==== PART 1: Fix ${pngBrands.length} food brands still using PNG logos ====\n`);

  let fixed = 0;
  for (let i = 0; i < pngBrands.length; i++) {
    const brand = pngBrands[i];
    const rawDomain = (brand.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const slug = rawDomain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const result = await fetchSvg(brand.name);

    if (result && result.ext === 'svg') {
      const fileName = `${slug}.svg`;
      const localPath = path.join(foodDir, fileName);
      fs.writeFileSync(localPath, result.buf);

      const storagePath = `food_brands/${fileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      await supabase.storage.from('brand-logos').upload(storagePath, result.buf, {
        contentType: 'image/svg+xml',
        upsert: true
      });
      await supabase.from('food_brands').update({ logo_url: publicUrl }).eq('id', brand.id);
      fixed++;
      console.log(`[${i + 1}/${pngBrands.length}] ✓ FIXED (${result.source}): ${brand.name} -> ${fileName} (${result.buf.length} bytes)`);
    } else {
      console.log(`[${i + 1}/${pngBrands.length}] ⚠ STILL PNG: ${brand.name} (no SVG found)`);
    }

    await delay(150);
  }

  console.log(`\nFixed ${fixed}/${pngBrands.length} food brand logos from PNG to SVG!`);
}

async function fixFashionPngs() {
  const { data: fashionBrands } = await supabase.from('fashion_brands').select('id, name, domain, logo_url').order('name');
  const pngBrands = fashionBrands.filter(b => b.logo_url?.endsWith('.png'));
  if (!pngBrands.length) { console.log('\nNo PNG fashion brands to fix.'); return; }

  console.log(`\n==== Fixing ${pngBrands.length} fashion brands still using PNG logos ====\n`);
  let fixed = 0;

  for (let i = 0; i < pngBrands.length; i++) {
    const brand = pngBrands[i];
    const rawDomain = (brand.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const slug = rawDomain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const result = await fetchSvg(brand.name);

    if (result && result.ext === 'svg') {
      const fileName = `${slug}.svg`;
      const localPath = path.join(fashionDir, fileName);
      fs.writeFileSync(localPath, result.buf);
      const storagePath = `fashion_brands/${fileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;
      await supabase.storage.from('brand-logos').upload(storagePath, result.buf, { contentType: 'image/svg+xml', upsert: true });
      await supabase.from('fashion_brands').update({ logo_url: publicUrl }).eq('id', brand.id);
      fixed++;
      console.log(`[${i + 1}/${pngBrands.length}] ✓ FIXED (${result.source}): ${brand.name} -> ${fileName}`);
    } else {
      console.log(`[${i + 1}/${pngBrands.length}] ⚠ STILL PNG: ${brand.name}`);
    }
    await delay(150);
  }
  console.log(`Fixed ${fixed}/${pngBrands.length} fashion brand logos from PNG to SVG!`);
}

async function addMissingCovers() {
  console.log('\n==== PART 2: Add background cover images to brand_covers.json ====\n');

  const { data: fashionBrands } = await supabase.from('fashion_brands').select('id, name');
  const { data: foodBrands } = await supabase.from('food_brands').select('id, name');
  const allBrands = [...fashionBrands, ...foodBrands];

  const existing = fs.existsSync(coversPath)
    ? JSON.parse(fs.readFileSync(coversPath, 'utf8'))
    : {};

  let added = 0;
  for (const brand of allBrands) {
    if (existing[brand.id]) continue; // already has a cover

    const cover = BRAND_COVERS[brand.name];
    if (cover) {
      existing[brand.id] = cover;
      added++;
      console.log(`  + Added cover for ${brand.name}`);
    }
  }

  fs.writeFileSync(coversPath, JSON.stringify(existing, null, 2));
  console.log(`\nAdded ${added} new background covers! Total: ${Object.keys(existing).length} entries.`);
}

async function run() {
  await fixFoodLogos();
  await fixFashionPngs();
  await addMissingCovers();
  console.log('\n✅ ALL DONE! Logos fixed + background covers added!');
}

run();
