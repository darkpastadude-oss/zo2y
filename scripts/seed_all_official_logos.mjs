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

const TITLE_ALIASED_NAME = {
  "Abercrombie & Fitch": "Abercrombie & Fitch",
  "Acne Studios": "Acne Studios",
  "Adidas": "Adidas",
  "Alexander McQueen": "Alexander McQueen",
  "Allbirds": "Allbirds",
  "AllSaints": "AllSaints",
  "Alo Yoga": "Alo Yoga",
  "American Eagle": "American Eagle Outfitters",
  "Amiri": "Amiri (brand)",
  "Arc'teryx": "Arc'teryx",
  "Aritzia": "Aritzia",
  "ASICS": "ASICS",
  "BAPE": "A Bathing Ape",
  "Canada Goose": "Canada Goose (clothing)",
  "COS": "COS (fashion brand)",
  "Essentials": "Fear of God (brand)",
  "Fear of God": "Fear of God (brand)",
  "H&M": "H&M",
  "Hoka One One": "Hoka One One",
  "Lululemon": "Lululemon Athletica",
  "Nike": "Nike, Inc.",
  "Off-White": "Off-White (brand)",
  "Omega": "Omega SA",
  "Patagonia": "Patagonia (clothing)",
  "Reformation": "Reformation (clothing)",
  "Saint Laurent": "Yves Saint Laurent (brand)",
  "YSL": "Yves Saint Laurent (brand)",
  "The North Face": "The North Face",
  "Tiffany & Co.": "Tiffany & Co.",

  "7-Eleven Slurpee & Fresh": "7-Eleven",
  "Applebee's": "Applebee's",
  "Arby's": "Arby's",
  "Auntie Anne's": "Auntie Anne's",
  "Ben & Jerry's": "Ben & Jerry's",
  "Buffalo Wild Wings": "Buffalo Wild Wings",
  "Burger King": "Burger King",
  "Chick-fil-A": "Chick-fil-A",
  "Chipotle": "Chipotle Mexican Grill",
  "Church's Texas Chicken": "Church's Texas Chicken",
  "Cici's Pizza": "CiCi's Pizza",
  "Culver's": "Culver's",
  "Culver's Frozen Custard": "Culver's",
  "Domino's": "Domino's",
  "Domino's Pizza": "Domino's",
  "Dunkin'": "Dunkin'",
  "Five Guys": "Five Guys",
  "In-N-Out Burger": "In-N-Out Burger",
  "Jersey Mike's Subs": "Jersey Mike's",
  "Jimmy John's": "Jimmy John's",
  "KFC": "KFC",
  "Little Caesars": "Little Caesars",
  "Lou Malnati's": "Lou Malnati's Pizzeria",
  "McDonald's": "McDonald's",
  "Panda Express": "Panda Express",
  "Panera Bread": "Panera Bread",
  "Papa John's": "Papa John's",
  "Pizza Hut": "Pizza Hut",
  "Popeyes": "Popeyes",
  "Raising Cane's": "Raising Cane's Chicken Fingers",
  "Red Lobster": "Red Lobster",
  "Shake Shack": "Shake Shack",
  "Starbucks": "Starbucks",
  "Subway": "Subway (restaurant)",
  "Taco Bell": "Taco Bell",
  "Texas Roadhouse": "Texas Roadhouse",
  "Tim Hortons": "Tim Hortons",
  "Wendy's": "Wendy's",
  "White Castle": "White Castle (restaurant)",
  "White Castle Slider": "White Castle (restaurant)",
  "Wingstop": "Wingstop",
  "Zaxby's": "Zaxby's"
};

const DIRECT_URL_OVERRIDES = {
  "Alexander McQueen": "https://upload.wikimedia.org/wikipedia/commons/0/00/Alexander_McQueen_logo.svg",
  "Amiri": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Amiri_brand_logo.svg",
  "BAPE": "https://upload.wikimedia.org/wikipedia/en/0/03/A_Bathing_Ape_%28logo%29.png",
  "First Watch": "https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png",
  "Torchy's Tacos": "https://images.squarespace-cdn.com/content/v1/5c1a79854eddecbb1b2e666a/1550508756911-3W711T6X1A9N6XZV6XZV/torchys-logo.png"
};

async function fetchWikidataP154LogoFile(title) {
  try {
    const summaryUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title) + '?redirect=true';
    const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0 (support@zo2y.com)' } });
    if (!summaryRes.ok) return null;
    const payload = await summaryRes.json();
    const wikibaseId = payload?.wikibase_item;
    if (!wikibaseId) return null;

    const entityUrl = 'https://www.wikidata.org/wiki/Special:EntityData/' + encodeURIComponent(wikibaseId) + '.json';
    const entityRes = await fetch(entityUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0 (support@zo2y.com)' } });
    if (!entityRes.ok) return null;
    const entityPayload = await entityRes.json();
    const entity = entityPayload?.entities?.[wikibaseId];
    const logoClaim = entity?.claims?.P154?.[0];
    const logoFile = logoClaim?.mainsnak?.datavalue?.value;
    return logoFile || null;
  } catch (e) {
    return null;
  }
}

async function downloadLogoBuffer(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0 (support@zo2y.com)' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'image/png';
      return { buffer: Buffer.from(buffer), contentType };
    }
  } catch (e) {}
  return null;
}

async function processBrandItem(item, tableName, type) {
  const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
  const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const targetFileName = `${cleanSlug}.png`;
  const storagePath = `${tableName}/${targetFileName}`;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

  let imgData = null;
  let finalSourceUrl = '';

  // 1. Direct verified URL override
  if (DIRECT_URL_OVERRIDES[item.name]) {
    finalSourceUrl = DIRECT_URL_OVERRIDES[item.name];
    imgData = await downloadLogoBuffer(finalSourceUrl);
  }

  // 2. Wikidata P154 Logo File
  if (!imgData) {
    const wikiTitle = TITLE_ALIASED_NAME[item.name] || item.name;
    const logoFile = await fetchWikidataP154LogoFile(wikiTitle);
    if (logoFile) {
      finalSourceUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(logoFile) + '?width=800';
      imgData = await downloadLogoBuffer(finalSourceUrl);
    }
  }

  // 3. Fallback try search by item name + logo
  if (!imgData) {
    const searchWikiTitle = item.name + ' logo';
    const logoFile = await fetchWikidataP154LogoFile(item.name);
    if (logoFile) {
      finalSourceUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(logoFile) + '?width=800';
      imgData = await downloadLogoBuffer(finalSourceUrl);
    }
  }

  if (imgData && imgData.buffer.length > 1000) {
    const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, imgData.buffer, {
      contentType: 'image/png',
      upsert: true
    });

    if (!uploadErr || uploadErr.message?.includes('already exists')) {
      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      console.log(`[SAVED TO STORAGE] ${item.name} (${type}) -> ${publicUrl}`);
      return { name: item.name, domain, logo_url: publicUrl, source: finalSourceUrl, type };
    }
  }

  // If storage upload wasn't used, update with direct SVG/PNG URL if available
  if (finalSourceUrl) {
    await supabase.from(tableName).update({ logo_url: finalSourceUrl, domain }).eq('id', item.id);
    console.log(`[DIRECT URL SAVED] ${item.name} (${type}) -> ${finalSourceUrl}`);
    return { name: item.name, domain, logo_url: finalSourceUrl, source: finalSourceUrl, type };
  } else {
    await supabase.from(tableName).update({ logo_url: item.logo_url, domain }).eq('id', item.id);
    console.log(`[EXISTING KEPT] ${item.name} (${type}) -> ${item.logo_url}`);
    return { name: item.name, domain, logo_url: item.logo_url, source: item.logo_url, type };
  }
}

async function runSeeding() {
  const fashionList = JSON.parse(fs.readFileSync('scripts/fashion_brands.json', 'utf8'));
  const foodList = JSON.parse(fs.readFileSync('scripts/food_brands.json', 'utf8'));

  const seeded = {
    fashion: [],
    food: []
  };

  const CONCURRENCY = 5;

  console.log(`Starting seeding for ${fashionList.length} fashion brands and ${foodList.length} food brands...`);

  for (let i = 0; i < fashionList.length; i += CONCURRENCY) {
    const chunk = fashionList.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(item => processBrandItem(item, 'fashion_brands', 'fashion')));
    results.forEach(r => seeded.fashion.push(r));
  }

  for (let i = 0; i < foodList.length; i += CONCURRENCY) {
    const chunk = foodList.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(item => processBrandItem(item, 'food_brands', 'food')));
    results.forEach(r => seeded.food.push(r));
  }

  fs.writeFileSync('scripts/seeded_official_logos.json', JSON.stringify(seeded, null, 2));
  console.log('\nSUCCESSFULLY SEEDED ALL FASHION & FOOD BRAND LOGOS!');
}

runSeeding();
