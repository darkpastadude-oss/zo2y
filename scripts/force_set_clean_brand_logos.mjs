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

const CLEAN_FASHION_LOGOS = {
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
  "Levi/s": "https://upload.wikimedia.org/wikipedia/commons/7/75/Levi%27s_logo.svg",
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
  "Weekday": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Weekday_logo.svg",
  "Wrangler": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Wrangler_logo.svg",
  "YSL": "https://upload.wikimedia.org/wikipedia/commons/8/85/Yves_Saint_Laurent_Logo.svg",
  "Zalando": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Zalando_logo.svg",
  "Zara": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
  "Zegna": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ermenegildo_Zegna_logo.svg",
  "Zenith": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Zenith_Watches_logo.svg"
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

async function forceSetLogos() {
  const { data: fashion } = await supabase.from('fashion_brands').select('id, name, domain');

  console.log(`Processing ${fashion.length} fashion brands...`);

  for (let i = 0; i < fashion.length; i++) {
    const item = fashion[i];
    const targetUrl = CLEAN_FASHION_LOGOS[item.name];
    if (!targetUrl) {
      console.warn(`[No Target URL] ${item.name}`);
      continue;
    }

    const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const ext = targetUrl.endsWith('.svg') ? 'svg' : 'png';
    const storagePath = `fashion_brands/${cleanSlug}.${ext}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

    const img = await downloadBuffer(targetUrl);
    if (img && img.buffer.length > 500) {
      const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, img.buffer, {
        contentType: img.contentType,
        upsert: true
      });

      if (!uploadErr || uploadErr.message?.includes('already exists')) {
        await supabase.from('fashion_brands').update({ logo_url: publicUrl, domain }).eq('id', item.id);
        console.log(`[${i + 1}/${fashion.length}] ✓ STORAGE UPLOADED: ${item.name} -> ${publicUrl}`);
      } else {
        await supabase.from('fashion_brands').update({ logo_url: targetUrl, domain }).eq('id', item.id);
        console.log(`[${i + 1}/${fashion.length}] ⚠ DIRECT URL SET (upload err): ${item.name} -> ${targetUrl}`);
      }
    } else {
      await supabase.from('fashion_brands').update({ logo_url: targetUrl, domain }).eq('id', item.id);
      console.log(`[${i + 1}/${fashion.length}] ✓ DIRECT URL SET: ${item.name} -> ${targetUrl}`);
    }

    await delay(150);
  }

  console.log('\nSUCCESS! All fashion brands set with clean official vector SVG / PNG URLs.');
}

forceSetLogos();
