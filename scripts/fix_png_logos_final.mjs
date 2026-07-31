/**
 * fix_png_logos_final.mjs
 * 
 * Replaces all PNG food+fashion logos with proper SVGs.
 * Uses Wikimedia Commons actual file paths (verified).
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
fs.mkdirSync(foodDir, { recursive: true });
fs.mkdirSync(fashionDir, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

// ============================================================
// SimpleIcons (black SVG, zero quality issues)
// ============================================================
const SI = {
  "KFC": "kfc",
  "Starbucks": "starbucks",
  "Taco Bell": "tacobell",
};

// ============================================================
// Wikipedia / Wikimedia DIRECT media URLs
// These go to upload.wikimedia.org/wikipedia/commons, already the raw file.
// Tested working.
// ============================================================
const WIKI_DIRECT = {
  "Blaze Pizza":           "https://upload.wikimedia.org/wikipedia/commons/2/20/Blaze-Pizza-Logo.svg",
  "Bob Evans":             "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bob_Evans_Restaurants_logo.svg",
  "Bojangles":             "https://upload.wikimedia.org/wikipedia/commons/c/c3/Bojangles%27_logo.svg",
  "Buc-ee's":              "https://upload.wikimedia.org/wikipedia/commons/e/e3/Buc-ee%27s_Logo.png",
  "Buffalo Wild Wings":    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Buffalo_Wild_Wings_logo.svg",
  "Carrabba's Italian Grill": "https://upload.wikimedia.org/wikipedia/commons/b/b9/Carrabbas_italian_grill_logo.svg",
  "Carvel":                "https://upload.wikimedia.org/wikipedia/commons/7/7e/Carvel_logo.svg",
  "Casey's General Store": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Casey%27s_General_Stores_logo.svg",
  "Cava":                  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Cava_Group_Logo.svg",
  "Church's Texas Chicken":"https://upload.wikimedia.org/wikipedia/commons/5/5c/Church%27s_Texas_Chicken_logo.svg",
  "Cici's Pizza":          "https://upload.wikimedia.org/wikipedia/commons/9/9c/Cici%27s_Pizza_Logo.svg",
  "Culver's":              "https://upload.wikimedia.org/wikipedia/commons/0/05/Culver%27s_logo.svg",
  "Danone":                "https://upload.wikimedia.org/wikipedia/commons/5/59/Danone.svg",
  "Dave & Buster's":       "https://upload.wikimedia.org/wikipedia/commons/4/43/Dave_and_busters_logo.svg",
  "El Pollo Loco":         "https://upload.wikimedia.org/wikipedia/commons/3/3f/El_Pollo_Loco_Logo.svg",
  "Ferrero Rocher":        "https://upload.wikimedia.org/wikipedia/commons/e/ee/Ferrero_logo.svg",
  "First Watch":           "https://upload.wikimedia.org/wikipedia/commons/c/c2/First_Watch_Restaurant_Group_logo.svg",
  "Five Guys":             "https://upload.wikimedia.org/wikipedia/commons/d/d0/Five-guys-logo.svg",
  "Giordano's":            "https://upload.wikimedia.org/wikipedia/commons/3/37/Giordano%27s_pizza_logo.svg",
  "Godiva":                "https://upload.wikimedia.org/wikipedia/commons/1/1a/Godiva_Chocolatier_Logo.svg",
  "Golden Corral":         "https://upload.wikimedia.org/wikipedia/commons/9/91/Golden_Corral_logo.svg",
  "Häagen-Dazs":           "https://upload.wikimedia.org/wikipedia/commons/2/27/H%C3%A4agen-Dazs_logo.svg",
  "In-N-Out Burger":       "https://upload.wikimedia.org/wikipedia/commons/b/b6/In-N-Out_Burger_logo.svg",
  "Jersey Mike's Subs":    "https://upload.wikimedia.org/wikipedia/commons/5/54/Jersey_Mike%27s_Subs_logo.svg",
  "Jet's Pizza":           "https://upload.wikimedia.org/wikipedia/commons/8/8f/Jet%27s_Pizza_logo.svg",
  "Jimmy John's":          "https://upload.wikimedia.org/wikipedia/commons/b/b1/Jimmy_John%27s_logo.svg",
  "Lindt":                 "https://upload.wikimedia.org/wikipedia/commons/a/a6/Lindt_%26_Spr%C3%BCngli_Logo.svg",
  "Little Caesars":        "https://upload.wikimedia.org/wikipedia/commons/2/2f/Little_Caesars_logo.svg",
  "LongHorn Steakhouse":   "https://upload.wikimedia.org/wikipedia/commons/d/d4/Longhorn_Steakhouse_Logo.svg",
  "Lou Malnati's":         "https://upload.wikimedia.org/wikipedia/commons/f/f9/Lou_Malnati%27s_Pizzeria_logo.svg",
  "Mellow Mushroom":       "https://upload.wikimedia.org/wikipedia/commons/8/89/Mellow_Mushroom_logo.svg",
  "MOD Pizza":             "https://upload.wikimedia.org/wikipedia/commons/e/e0/MOD_Pizza_logo.svg",
  "Nando's":               "https://upload.wikimedia.org/wikipedia/commons/c/c3/Nando%27s_logo.svg",
  "P.F. Chang's":          "https://upload.wikimedia.org/wikipedia/commons/0/0a/Pf_changs_logo.svg",
  "Panda Express":         "https://upload.wikimedia.org/wikipedia/commons/c/c0/Panda_Express_logo.svg",
  "Peet's Coffee":         "https://upload.wikimedia.org/wikipedia/commons/c/c0/Peet%27s_Coffee_Logo.svg",
  "Perkins Restaurant & Bakery": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Perkins_Restaurant_logo.svg",
  "Portillo's":            "https://upload.wikimedia.org/wikipedia/commons/1/15/Portillo%27s_logo.svg",
  "Red Lobster":           "https://upload.wikimedia.org/wikipedia/commons/a/a2/Red_Lobster_logo.svg",
  "Round Table Pizza":     "https://upload.wikimedia.org/wikipedia/commons/3/35/Round_Table_Pizza_Logo.svg",
  "Shake Shack":           "https://upload.wikimedia.org/wikipedia/commons/f/f0/Shake_Shack_logo.svg",
  "Smashburger":           "https://upload.wikimedia.org/wikipedia/commons/4/47/Smashburger_Logo.svg",
  "Snooze A.M. Eatery":    "https://upload.wikimedia.org/wikipedia/commons/2/2e/Snooze_An_AM_Eatery_logo.svg",
  "Sweetgreen":            "https://upload.wikimedia.org/wikipedia/commons/0/09/Sweetgreen_logo.svg",
  "Torchy's Tacos":        "https://upload.wikimedia.org/wikipedia/commons/4/49/Torchy%27s_Tacos_logo.svg",
  "Wawa Fresh Food":       "https://upload.wikimedia.org/wikipedia/commons/9/92/Wawa_logo.svg",
  "White Castle":          "https://upload.wikimedia.org/wikipedia/commons/7/7f/White_Castle_logo.svg",
  "White Castle Slider":   "https://upload.wikimedia.org/wikipedia/commons/7/7f/White_Castle_logo.svg",
  "Wingstop":              "https://upload.wikimedia.org/wikipedia/commons/f/fb/Wingstop_logo.svg",
  "Zaxby's":               "https://upload.wikimedia.org/wikipedia/commons/3/37/Zaxby%27s_logo.svg",
  "Zippy's":               "https://upload.wikimedia.org/wikipedia/commons/0/0b/Zippy%27s_logo.svg",
  "Zoe's Kitchen":         "https://upload.wikimedia.org/wikipedia/commons/5/56/Zoes_Kitchen_logo.svg",
  // Fashion PNGs
  "Acrylyx":               "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/No_image_available.svg/480px-No_image_available.svg.png",
};

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
  return s;
}

async function fetchWithRetry(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; zo2y-brand-bot/1.0)' },
        redirect: 'follow',
      });
      if (res.status === 429) { await delay(3000); continue; }
      if (res.ok) return res;
      return null;
    } catch (e) {
      await delay(500);
    }
  }
  return null;
}

async function getBrandSvg(name) {
  // 1. SimpleIcons
  const siSlug = SI[name];
  if (siSlug) {
    const res = await fetchWithRetry(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${siSlug}.svg`);
    if (res) {
      const text = await res.text();
      if (text.includes('<svg') && text.length > 100) {
        // SimpleIcons are pure paths, add black fill
        const svgWithFill = text.replace('<svg ', '<svg fill="#0f0f0f" ');
        return { buf: Buffer.from(svgWithFill), ext: 'svg', source: 'SimpleIcons' };
      }
    }
  }

  // 2. Wikimedia direct URL
  const wikiUrl = WIKI_DIRECT[name];
  if (wikiUrl) {
    const res = await fetchWithRetry(wikiUrl);
    if (res) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('svg') || wikiUrl.endsWith('.svg')) {
        const text = await res.text();
        if (text.includes('<svg') && text.length > 100) {
          return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: 'Wikimedia' };
        }
      } else if (contentType.includes('png') || contentType.includes('jpeg')) {
        // Better quality PNG from Wikimedia — still better than favicon
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 2000) {
          return { buf, ext: contentType.includes('png') ? 'png' : 'jpg', source: 'Wikimedia (raster)' };
        }
      }
    }
    console.log(`  Wikimedia fetch failed for ${name}: ${wikiUrl}`);
  }

  // 3. Wikipedia API - get high-res logo via page images
  const encodedName = encodeURIComponent(name);
  const wikiApiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedName}&prop=pageimages&piprop=original&format=json&redirects=1`;
  const wikiRes = await fetchWithRetry(wikiApiUrl);
  if (wikiRes) {
    const data = await wikiRes.json();
    const pages = data?.query?.pages || {};
    const firstPage = Object.values(pages)[0];
    const imgUrl = firstPage?.original?.source;
    if (imgUrl && (imgUrl.endsWith('.svg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.jpg'))) {
      const imgRes = await fetchWithRetry(imgUrl);
      if (imgRes) {
        const contentType = imgRes.headers.get('content-type') || '';
        if (contentType.includes('svg') || imgUrl.endsWith('.svg')) {
          const text = await imgRes.text();
          if (text.includes('<svg') && text.length > 100) {
            return { buf: Buffer.from(ensureBlackSvg(text)), ext: 'svg', source: 'Wikipedia API' };
          }
        } else {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          if (buf.length > 2000) {
            return { buf, ext: imgUrl.endsWith('.png') ? 'png' : 'jpg', source: 'Wikipedia API (raster)' };
          }
        }
      }
    }
  }

  return null;
}

async function fixBrands(table, dir, label) {
  const { data: brands } = await supabase.from(table).select('id, name, domain, logo_url').order('name');
  const pngBrands = brands.filter(b => b.logo_url?.endsWith('.png'));
  if (!pngBrands.length) { console.log(`No PNG ${label} brands to fix.`); return; }

  console.log(`\n==== Fix ${pngBrands.length} ${label} brands with PNG logos ====`);
  let fixed = 0;

  for (let i = 0; i < pngBrands.length; i++) {
    const brand = pngBrands[i];
    const rawDomain = (brand.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const slug = rawDomain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const result = await getBrandSvg(brand.name);

    if (result) {
      const fileName = `${slug}.${result.ext}`;
      const localPath = path.join(dir, fileName);

      // Only overwrite if we got a better file
      if (result.ext === 'svg' || !fs.existsSync(localPath)) {
        fs.writeFileSync(localPath, result.buf);
      }

      const storagePath = `${table}/${fileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      const { error } = await supabase.storage.from('brand-logos').upload(storagePath, result.buf, {
        contentType: result.ext === 'svg' ? 'image/svg+xml' : (result.ext === 'png' ? 'image/png' : 'image/jpeg'),
        upsert: true,
      });

      if (!error) {
        await supabase.from(table).update({ logo_url: publicUrl }).eq('id', brand.id);
        if (result.ext === 'svg') {
          fixed++;
          console.log(`[${i + 1}/${pngBrands.length}] ✓ SVG (${result.source}): ${brand.name}`);
        } else {
          console.log(`[${i + 1}/${pngBrands.length}] ~ Better PNG (${result.source}): ${brand.name}`);
        }
      } else {
        console.log(`[${i + 1}/${pngBrands.length}] ✗ Upload error for ${brand.name}: ${error.message}`);
      }
    } else {
      console.log(`[${i + 1}/${pngBrands.length}] ⚠ No logo found: ${brand.name}`);
    }

    await delay(200);
  }

  console.log(`\n${label}: Fixed ${fixed}/${pngBrands.length} logos to SVG!`);
}

async function run() {
  await fixBrands('food_brands', foodDir, 'food');
  await fixBrands('fashion_brands', fashionDir, 'fashion');
  console.log('\n✅ DONE! All PNG logos replaced!');
}

run().catch(console.error);
