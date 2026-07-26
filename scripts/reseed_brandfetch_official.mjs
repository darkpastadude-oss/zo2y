import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const API_KEY = '_gpMOwS8UBDJYRIZ0x2fj06aoHILRbvNJY2akm42QK-6cJjKtt7mqQRMZ50FfzOIGRnzeUvkmX0bRolPQ5ts4g';

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

const DOMAIN_MAP = {
  // Fashion Brands
  "Off-White": "offwhite.com",
  "Prada": "prada.com",
  "Acne Studios": "acnestudios.com",
  "Alexander McQueen": "alexandermcqueen.com",
  "Allbirds": "allbirds.com",
  "AllSaints": "allsaints.com",
  "Alo Yoga": "aloyoga.com",
  "American Eagle": "ae.com",
  "Amiri": "amiri.com",
  "Arc'teryx": "arcteryx.com",
  "Aritzia": "aritzia.com",
  "ASICS": "asics.com",
  "Audemars Piguet": "audemarspiguet.com",
  "Balenciaga": "balenciaga.com",
  "BAPE": "bape.com",
  "Birkenstock": "birkenstock.com",
  "Boohoo": "boohoo.com",
  "Bottega Veneta": "bottegaveneta.com",
  "Breitling": "breitling.com",
  "Canada Goose": "canadagoose.com",
  "Carhartt WIP": "carhartt-wip.com",
  "Cartier": "cartier.com",
  "Casio": "casio.com",
  "Celine": "celine.com",
  "Champion": "champion.com",
  "Christian Louboutin": "christianlouboutin.com",
  "Chrome Hearts": "chromehearts.com",
  "Clarks": "clarks.com",
  "Cole Haan": "colehaan.com",
  "Comme des Garçons": "comme-des-garcons.com",
  "Converse": "converse.com",
  "COS": "cos.com",
  "Crocs": "crocs.com",
  "Dr. Martens": "drmartens.com",
  "Essentials": "fearofgod.com",
  "Everlane": "everlane.com",
  "Express": "express.com",
  "Fear of God": "fearofgod.com",
  "Fendi": "fendi.com",
  "FILA": "fila.com",
  "Forever 21": "forever21.com",
  "GANNI": "ganni.com",
  "Gap": "gap.com",
  "Givenchy": "givenchy.com",
  "Gucci": "gucci.com",
  "Guess": "guess.com",
  "Gymshark": "gymshark.com",
  "H&M": "hm.com",
  "Hoka One One": "hoka.com",
  "Hollister": "hollisterco.com",
  "HUGO BOSS": "hugoboss.com",
  "Hugo Boss": "hugoboss.com",
  "J.Crew": "jcrew.com",
  "Jacquemus": "jacquemus.com",
  "Jil Sander": "jilsander.com",
  "Jimmy Choo": "jimmychoo.com",
  "Kith": "kith.com",
  "Lacoste": "lacoste.com",
  "Levi's": "levis.com",
  "Loewe": "loewe.com",
  "Longchamp": "longchamp.com",
  "Longines": "longines.com",
  "Louis Vuitton": "louisvuitton.com",
  "Lululemon": "lululemon.com",
  "Maison Margiela": "maisonmargiela.com",
  "Mango": "mango.com",
  "Manolo Blahnik": "manoloblahnik.com",
  "Marni": "marni.com",
  "Merrell": "merrell.com",
  "Michael Kors": "michaelkors.com",
  "Moncler": "moncler.com",
  "Montblanc": "montblanc.com",
  "New Balance": "newbalance.com",
  "Nike": "nike.com",
  "Oakley": "oakley.com",
  "Omega": "omegawatches.com",
  "On Running": "on.com",
  "Palace": "palaceskateboards.com",
  "Palm Angels": "palmangels.com",
  "Pandora": "pandora.net",
  "Patagonia": "patagonia.com",
  "Patek Philippe": "patek.com",
  "Puma": "puma.com",
  "Ralph Lauren": "ralphlauren.com",
  "Ray-Ban": "ray-ban.com",
  "Reebok": "reebok.com",
  "Reformation": "thereformation.com",
  "Reiss": "reiss.com",
  "Rick Owens": "rickowens.eu",
  "Rolex": "rolex.com",
  "Saint Laurent": "ysl.com",
  "Salomon": "salomon.com",
  "Saucony": "saucony.com",
  "Seiko": "seikowatches.com",
  "Sephora": "sephora.com",
  "Stella McCartney": "stellamccartney.com",
  "Stone Island": "stoneisland.com",
  "Stüssy": "stussy.com",
  "Supreme": "supreme.com",
  "Swarovski": "swarovski.com",
  "Swatch": "swatch.com",
  "TAG Heuer": "tagheuer.com",
  "The North Face": "thenorthface.com",
  "Tiffany & Co.": "tiffany.com",
  "Timberland": "timberland.com",
  "Tissot": "tissotwatches.com",
  "Tommy Hilfiger": "tommy.com",
  "Tory Burch": "toryburch.com",
  "Tudor": "tudorwatch.com",
  "UGG": "ugg.com",
  "Umbro": "umbro.com",
  "Under Armour": "underarmour.com",
  "Uniqlo": "uniqlo.com",
  "Urban Outfitters": "urbanoutfitters.com",
  "Vacheron Constantin": "vacheron-constantin.com",
  "Valentino": "valentino.com",
  "Vans": "vans.com",
  "Versace": "versace.com",
  "Victoria's Secret": "victoriassecret.com",
  "Vivienne Westwood": "viviennewestwood.com",
  "Vuori": "vuoriclothing.com",
  "Weekday": "weekday.com",
  "Wrangler": "wrangler.com",
  "YSL": "ysl.com",
  "Zalando": "zalando.com",
  "Zara": "zara.com",
  "Zegna": "zegna.com",
  "Zenith": "zenith-watches.com",

  // Food Brands
  "7-Eleven": "7-eleven.com",
  "Applebee's": "applebees.com",
  "Arby's": "arbys.com",
  "Auntie Anne's": "auntieannes.com",
  "Ben & Jerry's": "benjerry.com",
  "Buffalo Wild Wings": "buffalowildwings.com",
  "Burger King": "bk.com",
  "Cargill": "cargill.com",
  "Chick-fil-A": "chick-fil-a.com",
  "Chili's": "chilis.com",
  "Chipotle": "chipotle.com",
  "Chuck E. Cheese": "chuckecheese.com",
  "Cinnabon": "cinnabon.com",
  "Costa Coffee": "costa.co.uk",
  "Cracker Barrel": "crackerbarrel.com",
  "Dairy Queen": "dairyqueen.com",
  "Danone": "danone.com",
  "Del Taco": "deltaco.com",
  "Denny's": "dennys.com",
  "Domino's": "dominos.com",
  "Domino's Pizza": "dominos.com",
  "Dunkin'": "dunkindonuts.com",
  "El Pollo Loco": "elpolloloco.com",
  "Five Guys": "fiveguys.com",
  "Godiva": "godiva.com",
  "Häagen-Dazs": "haagendazs.us",
  "Heinz": "heinz.com",
  "IHOP": "ihop.com",
  "In-N-Out Burger": "in-n-out.com",
  "Jack in the Box": "jackinthebox.com",
  "Jamba Juice": "jamba.com",
  "Jimmy John's": "jimmyjohns.com",
  "Jollibee": "jollibee.com.ph",
  "Kellogg's": "kelloggs.com",
  "KFC": "kfc.com",
  "Krispy Kreme": "krispykreme.com",
  "Lindt": "lindt.com",
  "Little Caesars": "littlecaesars.com",
  "McDonald's": "mcdonalds.com",
  "Nando's": "nandos.com",
  "Nestlé": "nestle.com",
  "Nutella": "nutella.com",
  "Olive Garden": "olivegarden.com",
  "Outback Steakhouse": "outback.com",
  "Panda Express": "pandaexpress.com",
  "Panera Bread": "panerabread.com",
  "Papa John's": "papajohns.com",
  "Pizza Hut": "pizzahut.com",
  "Popeyes": "popeyes.com",
  "Pret A Manger": "pret.com",
  "Qdoba": "qdoba.com",
  "Red Lobster": "redlobster.com",
  "Red Robin": "redrobin.com",
  "Shake Shack": "shakeshack.com",
  "Sonic Drive-In": "sonicdrivein.com",
  "Starbucks": "starbucks.com",
  "Subway": "subway.com",
  "Taco Bell": "tacobell.com",
  "TGI Fridays": "tgifridays.com",
  "The Cheesecake Factory": "thecheesecakefactory.com",
  "Tim Hortons": "timhortons.com",
  "Wendy's": "wendys.com",
  "Whataburger": "whataburger.com",
  "White Castle": "whitecastle.com",
  "Wingstop": "wingstop.com",
  "Zaxby's": "zaxbys.com",
  "Bojangles": "bojangles.com",
  "Buc-ee's": "buc-ees.com",
  "Cold Stone Creamery": "coldstonecreamery.com",
  "Culver's": "culvers.com",
  "Firehouse Subs": "firehousesubs.com",
  "First Watch": "firstwatch.com",
  "Jersey Mike's Subs": "jerseymikes.com",
  "MOD Pizza": "modpizza.com",
  "Moe's Southwest Grill": "moes.com",
  "Raising Cane's": "raisingcanes.com",
  "Sweetgreen": "sweetgreen.com",
  "Texas Roadhouse": "texasroadhouse.com",
  "Waffle House": "wafflehouse.com",
  "Wagamama": "wagamama.com",
  "Wawa Fresh Food": "wawa.com",
  "Sheetz Fresh Food": "sheetz.com"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchFromBrandfetch(brandName, itemDomain) {
  const domain = DOMAIN_MAP[brandName] || itemDomain || (brandName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
  
  let brandData = null;
  let attempts = 0;

  while (attempts < 3) {
    try {
      const res = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (res.status === 429) {
        // Rate limited - wait 2 seconds and retry
        await delay(2000);
        attempts++;
        continue;
      }
      if (res.ok) {
        brandData = await res.json();
        break;
      } else {
        break;
      }
    } catch(e) {
      break;
    }
  }

  // Fallback to Search API if direct domain lookup missed
  if (!brandData) {
    try {
      const sRes = await fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(brandName)}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (sRes.ok) {
        const searchResults = await sRes.json();
        if (searchResults && searchResults.length > 0) {
          const matchedDomain = searchResults[0].domain;
          await delay(1200);
          const bRes = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(matchedDomain)}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
          });
          if (bRes.ok) brandData = await bRes.json();
        }
      }
    } catch(e) {}
  }

  if (!brandData || !brandData.logos || !brandData.logos.length) return null;

  // Extract best logo format: SVG logo > PNG logo > SVG symbol/icon > PNG symbol/icon
  const logos = brandData.logos;
  let chosenSrc = null;
  let chosenFormat = 'png';

  // 1. SVG logo/symbol
  for (const l of logos) {
    if (l.type === 'logo' || l.type === 'symbol') {
      const svgFmt = l.formats?.find(f => f.format === 'svg');
      if (svgFmt && svgFmt.src) {
        chosenSrc = svgFmt.src;
        chosenFormat = 'svg';
        break;
      }
    }
  }

  // 2. PNG logo/symbol
  if (!chosenSrc) {
    for (const l of logos) {
      if (l.type === 'logo' || l.type === 'symbol') {
        const pngFmt = l.formats?.find(f => f.format === 'png');
        if (pngFmt && pngFmt.src) {
          chosenSrc = pngFmt.src;
          chosenFormat = 'png';
          break;
        }
      }
    }
  }

  // 3. Any SVG format
  if (!chosenSrc) {
    for (const l of logos) {
      const svgFmt = l.formats?.find(f => f.format === 'svg');
      if (svgFmt && svgFmt.src) {
        chosenSrc = svgFmt.src;
        chosenFormat = 'svg';
        break;
      }
    }
  }

  // 4. Any PNG format
  if (!chosenSrc) {
    for (const l of logos) {
      const pngFmt = l.formats?.find(f => f.format === 'png');
      if (pngFmt && pngFmt.src) {
        chosenSrc = pngFmt.src;
        chosenFormat = 'png';
        break;
      }
    }
  }

  if (!chosenSrc) return null;

  try {
    const imgRes = await fetch(chosenSrc);
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length > 200) {
        return { domain, buffer: buf, format: chosenFormat, src: chosenSrc, name: brandData.name };
      }
    }
  } catch(e) {}

  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Processing ${tableName} (${items.length} items) via Brandfetch API...`);
  console.log(`========================================`);

  let successCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = DOMAIN_MAP[item.name] || (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Check if we already have a valid local Brandfetch file for this brand
    const existingSvg = path.join(targetDir, `${cleanSlug}.svg`);
    const existingPng = path.join(targetDir, `${cleanSlug}.png`);

    if (fs.existsSync(existingSvg) && fs.statSync(existingSvg).size > 500) {
      console.log(`[${i + 1}/${items.length}] ⏭ ALREADY STORED (SVG): ${item.name} (${domain})`);
      successCount++;
      continue;
    }

    if (fs.existsSync(existingPng) && fs.statSync(existingPng).size > 500) {
      console.log(`[${i + 1}/${items.length}] ⏭ ALREADY STORED (PNG): ${item.name} (${domain})`);
      successCount++;
      continue;
    }

    const asset = await fetchFromBrandfetch(item.name, domain);

    if (asset) {
      const fileName = `${cleanSlug}.${asset.format}`;
      const localPath = path.join(targetDir, fileName);
      fs.writeFileSync(localPath, asset.buffer);

      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
      const contentType = asset.format === 'svg' ? 'image/svg+xml' : 'image/png';

      await supabase.storage.from('brand-logos').upload(storagePath, asset.buffer, {
        contentType,
        upsert: true
      });

      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      successCount++;
      console.log(`[${i + 1}/${items.length}] ✓ BRANDFETCH STORED (${asset.format.toUpperCase()}): ${item.name} (${domain}) -> ${localPath} (${asset.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ BRANDFETCH NOT FOUND FOR: ${item.name} (${domain})`);
    }

    await delay(1400); // 1.4 second delay to avoid Brandfetch API 429 rate limiting
  }

  console.log(`Completed ${tableName}: ${successCount}/${items.length} pristine Brandfetch logos stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ ALL BRANDFETCH OFFICIAL LOGOS RESEEDED LOCALLY & IN DATABASE!');
}

run();
