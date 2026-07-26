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
fs.mkdirSync(fashionDir, { recursive: true });

const COMMONS_FASHION_EXACT = {
  "Abercrombie & Fitch": "Abercrombie_%26_Fitch_Logo.svg",
  "Acne Studios": "Acne_Studios_logo.svg",
  "Adidas": "Adidas_Logo.svg",
  "Alexander McQueen": "Logo_of_Alexander_McQueen.svg",
  "Allbirds": "Allbirds_logo.png",
  "AllSaints": "AllSaints_logo.svg",
  "Alo Yoga": "Alo_Yoga_logo.svg",
  "American Eagle": "American_Eagle_Outfitters_logo.svg",
  "Amiri": "Mike_Amiri_logo.svg",
  "Arc'teryx": "Arc%27teryx_logo.svg",
  "Aritzia": "Aritzia_logo_%282017%29.svg",
  "ASICS": "Asics_logo.svg",
  "Audemars Piguet": "Audemars_Piguet_logo.svg",
  "Balenciaga": "Balenciaga_logo.svg",
  "BAPE": "A_Bathing_Ape_%28logo%29.png",
  "Birkenstock": "Birkenstock_logo.svg",
  "Boohoo": "Boohoo.com_logo.svg",
  "Bottega Veneta": "Bottega_Veneta_logo.svg",
  "Breitling": "Breitling_logo.svg",
  "Canada Goose": "Canada_Goose_2023_logo.svg",
  "Carhartt WIP": "Carhartt_logo.svg",
  "Cartier": "Cartier_logo.svg",
  "Casio": "Casio_logo.svg",
  "Celine": "Celine_logo.svg",
  "Champion": "Champion_logo.svg",
  "Christian Louboutin": "Christian_Louboutin_logo.svg",
  "Chrome Hearts": "Chrome_Hearts_logo.svg",
  "Clarks": "C._%26_J._Clark_logo.svg",
  "Cole Haan": "Cole_Haan_logo.svg",
  "Comme des Garçons": "Comme_des_Gar%C3%A7ons_logo.svg",
  "Converse": "Converse_logo.svg",
  "COS": "COS_logo.svg",
  "Crocs": "Crocs_logo.svg",
  "Dr. Martens": "Dr._Martens_logo.svg",
  "Essentials": "Fear_of_God_logo.svg",
  "Everlane": "Everlane_logo.svg",
  "Express": "Express%2C_Inc._logo.svg",
  "Fear of God": "Fear_of_God_logo.svg",
  "Fendi": "Fendi_logo.svg",
  "FILA": "Fila_logo.svg",
  "Forever 21": "Forever_21_logo.svg",
  "GANNI": "Ganni_logo.svg",
  "Gap": "Gap_logo.svg",
  "Givenchy": "Givenchy_logo.svg",
  "Gucci": "Gucci_logo.svg",
  "Guess": "Guess_logo.svg",
  "Gymshark": "Gymshark_logo.svg",
  "H&M": "H%26M-Logo.svg",
  "Hoka One One": "Hoka_One_One_logo.svg",
  "Hollister": "Hollister_Co._logo.svg",
  "HUGO BOSS": "Hugo_Boss_logo.svg",
  "J.Crew": "J.Crew_logo.svg",
  "Jacquemus": "Jacquemus_logo.svg",
  "Jil Sander": "Jil_Sander_logo.svg",
  "Jimmy Choo": "Jimmy_Choo_logo.svg",
  "Kith": "Kith_logo.svg",
  "Lacoste": "Lacoste_logo.svg",
  "Levi's": "Levi%27s_logo.svg",
  "Loewe": "Loewe_logo.svg",
  "Longchamp": "Longchamp_logo.svg",
  "Longines": "Longines_logo.svg",
  "Louis Vuitton": "Louis_Vuitton_logo_and_wordmark.svg",
  "Lululemon": "Lululemon_Athletica_logo.svg",
  "Maison Margiela": "Maison_Margiela_logo.svg",
  "Mango": "Mango_logo.svg",
  "Manolo Blahnik": "Manolo_Blahnik_logo.svg",
  "Marni": "Marni_logo.svg",
  "Merrell": "Merrell_logo.svg",
  "Michael Kors": "Michael_Kors_logo.svg",
  "Moncler": "Moncler_logo.svg",
  "Montblanc": "Montblanc_logo.svg",
  "New Balance": "New_Balance_logo.svg",
  "Nike": "Logo_NIKE.svg",
  "Oakley": "Oakley_logo.svg",
  "Off-White": "Off-White_logo.svg",
  "Omega": "Omega_logo.svg",
  "On Running": "On_Running_logo.svg",
  "Palace": "Palace_Skateboards_logo.svg",
  "Palm Angels": "Palm_Angels_logo.svg",
  "Pandora": "Pandora_Jewelry_logo.svg",
  "Patagonia": "Patagonia_logo.svg",
  "Patek Philippe": "Patek_Philippe_logo.svg",
  "Prada": "Prada-logo.svg",
  "Puma": "Puma_logo.svg",
  "Ralph Lauren": "Ralph_Lauren_logo.svg",
  "Ray-Ban": "Ray-Ban_logo.svg",
  "Reebok": "Reebok_logo.svg",
  "Reformation": "Reformation_logo.svg",
  "Reiss": "Reiss_logo.svg",
  "Rick Owens": "Rick_Owens_logo.svg",
  "Rolex": "Rolex_logo.svg",
  "Saint Laurent": "Yves_Saint_Laurent_Logo.svg",
  "Salomon": "Salomon_logo.svg",
  "Saucony": "Saucony_logo.svg",
  "Seiko": "Seiko_logo.svg",
  "Sephora": "Sephora_logo.svg",
  "Stella McCartney": "Stella_McCartney_logo.svg",
  "Stone Island": "Stone_Island_logo.svg",
  "Stüssy": "Stussy_logo.svg",
  "Supreme": "Supreme_Logo.svg",
  "Swarovski": "Swarovski_logo.svg",
  "Swatch": "Swatch_logo.svg",
  "TAG Heuer": "TAG_Heuer_logo.svg",
  "The North Face": "The_North_Face_logo.svg",
  "Tiffany & Co.": "Tiffany_%26_Co._logo.svg",
  "Timberland": "Timberland_logo.svg",
  "Tissot": "Tissot_logo.svg",
  "Tommy Hilfiger": "Tommy_Hilfiger_logo.svg",
  "Tory Burch": "Tory_Burch_logo.svg",
  "Tudor": "Tudor_Watches_logo.svg",
  "UGG": "UGG_Australia_logo.svg",
  "Umbro": "Umbro_logo.svg",
  "Under Armour": "Under_Armour_logo.svg",
  "Uniqlo": "Uniqlo_logo.svg",
  "Urban Outfitters": "Urban_Outfitters_logo.svg",
  "Vacheron Constantin": "Vacheron_Constantin_logo.svg",
  "Valentino": "Valentino_logo.svg",
  "Vans": "Vans_logo.svg",
  "Versace": "Versace_logo.svg",
  "Victoria's Secret": "Victoria%27s_Secret_logo.svg",
  "Vivienne Westwood": "Vivienne_Westwood_logo.svg",
  "Vuori": "Vuori_logo.svg",
  "Weekday": "Weekday_logo.svg",
  "Wrangler": "Wrangler_logo.svg",
  "YSL": "Yves_Saint_Laurent_Logo.svg",
  "Zalando": "Zalando_logo.svg",
  "Zara": "Zara_Logo.svg",
  "Zegna": "Ermenegildo_Zegna_logo.svg",
  "Zenith": "Zenith_Watches_logo.svg"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const { data: items } = await supabase.from('fashion_brands').select('id, name, domain');
  console.log(`Downloading exact Commons SVGs for ${items.length} fashion brands...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const commonsFile = COMMONS_FASHION_EXACT[item.name];
    if (commonsFile) {
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + commonsFile;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 200) {
            const ext = commonsFile.toLowerCase().endsWith('.png') ? 'png' : 'svg';
            const fileName = `${cleanSlug}.${ext}`;
            const localPath = path.join(fashionDir, fileName);
            fs.writeFileSync(localPath, buf);

            const storagePath = `fashion_brands/${fileName}`;
            const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
            const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/png';

            await supabase.storage.from('brand-logos').upload(storagePath, buf, {
              contentType,
              upsert: true
            });

            await supabase.from('fashion_brands').update({ logo_url: publicUrl, domain }).eq('id', item.id);
            console.log(`[${i + 1}/${items.length}] ✓ PRISTINE SVG/PNG STORED: ${item.name} -> ${localPath} (${buf.length} bytes)`);
          }
        }
      } catch(e) {}
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ MISSING IN MAP: ${item.name}`);
    }
    await delay(100);
  }
}

run();
