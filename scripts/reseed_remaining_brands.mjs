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

const EXACT_URLS = {
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
  "Pandora": "https://www.logo.wine/a/logo/Pandora_(jewelry)/Pandora_(jewelry)-Logo.wine.svg",
  "Lululemon": "https://www.logo.wine/a/logo/Lululemon_Athletica/Lululemon_Athletica-Logo.wine.svg",
  "Gymshark": "https://www.logo.wine/a/logo/Gymshark/Gymshark-Logo.wine.svg",
  "The North Face": "https://www.logo.wine/a/logo/The_North_Face/The_North_Face-Logo.wine.svg",
  "Chrome Hearts": "https://www.logo.wine/a/logo/Chrome_Hearts/Chrome_Hearts-Logo.wine.svg",
  "Patagonia": "https://www.logo.wine/a/logo/Patagonia,_Inc./Patagonia,_Inc.-Logo.wine.svg",
  "Arc'teryx": "https://www.logo.wine/a/logo/Arc%27teryx/Arc%27teryx-Logo.wine.svg",
  "Palace": "https://www.logo.wine/a/logo/Palace_Skateboards/Palace_Skateboards-Logo.wine.svg",
  "Swarovski": "https://www.logo.wine/a/logo/Swarovski/Swarovski-Logo.wine.svg",
  "Carhartt WIP": "https://www.logo.wine/a/logo/Carhartt/Carhartt-Logo.wine.svg",
  "Alo Yoga": "https://www.logo.wine/a/logo/Alo_Yoga/Alo_Yoga-Logo.wine.svg",
  "Essentials": "https://www.logo.wine/a/logo/Fear_of_God_(brand)/Fear_of_God_(brand)-Logo.wine.svg",
  "Hollister": "https://www.logo.wine/a/logo/Hollister_Co./Hollister_Co.-Logo.wine.svg",
  "Hoka One One": "https://www.logo.wine/a/logo/Hoka_One_One/Hoka_One_One-Logo.wine.svg",
  "Swatch": "https://www.logo.wine/a/logo/Swatch/Swatch-Logo.wine.svg",
  "FILA": "https://www.logo.wine/a/logo/Fila_(company)/Fila_(company)-Logo.wine.svg",
  "AllSaints": "https://www.logo.wine/a/logo/AllSaints/AllSaints-Logo.wine.svg",
  "GANNI": "https://www.logo.wine/a/logo/Ganni/Ganni-Logo.wine.svg",
  "Comme des Garçons": "https://www.logo.wine/a/logo/Comme_des_Gar%C3%A7ons/Comme_des_Gar%C3%A7ons-Logo.wine.svg",
  "Christian Louboutin": "https://www.logo.wine/a/logo/Christian_Louboutin/Christian_Louboutin-Logo.wine.svg",
  "Jacquemus": "https://www.logo.wine/a/logo/Jacquemus/Jacquemus-Logo.wine.svg",
  "Marni": "https://www.logo.wine/a/logo/Marni_(fashion_house)/Marni_(fashion_house)-Logo.wine.svg",
  "Everlane": "https://www.logo.wine/a/logo/Everlane/Everlane-Logo.wine.svg",
  "Acne Studios": "https://www.logo.wine/a/logo/Acne_Studios/Acne_Studios-Logo.wine.svg",
  "Seiko": "https://www.logo.wine/a/logo/Seiko/Seiko-Logo.wine.svg",
  "Palm Angels": "https://www.logo.wine/a/logo/Palm_Angels/Palm_Angels-Logo.wine.svg",
  "Ray-Ban": "https://www.logo.wine/a/logo/Ray-Ban/Ray-Ban-Logo.wine.svg",
  "Rick Owens": "https://www.logo.wine/a/logo/Rick_Owens/Rick_Owens-Logo.wine.svg",
  "Stella McCartney": "https://www.logo.wine/a/logo/Stella_McCartney/Stella_McCartney-Logo.wine.svg",
  "Manolo Blahnik": "https://www.logo.wine/a/logo/Manolo_Blahnik/Manolo_Blahnik-Logo.wine.svg",
  "Saint Laurent": "https://www.logo.wine/a/logo/Yves_Saint_Laurent_(brand)/Yves_Saint_Laurent_(brand)-Logo.wine.svg",
  "Vivienne Westwood": "https://www.logo.wine/a/logo/Vivienne_Westwood/Vivienne_Westwood-Logo.wine.svg",
  "Jil Sander": "https://www.logo.wine/a/logo/Jil_Sander/Jil_Sander-Logo.wine.svg",
  "On Running": "https://www.logo.wine/a/logo/On_(company)/On_(company)-Logo.wine.svg",
  "Crocs": "https://www.logo.wine/a/logo/Crocs/Crocs-Logo.wine.svg",
  "Reformation": "https://www.logo.wine/a/logo/Reformation_(brand)/Reformation_(brand)-Logo.wine.svg",
  "Amiri": "https://www.logo.wine/a/logo/Amiri_(brand)/Amiri_(brand)-Logo.wine.svg"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\nProcessing ${tableName} (${items.length} items)...`);

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const logoUrl = EXACT_URLS[item.name] || EXACT_URLS[item.name.replace(/[^a-zA-Z0-9 ]/g, '')];

    if (logoUrl) {
      try {
        const res = await fetch(logoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 200) {
            const fileName = `${cleanSlug}.svg`;
            const localPath = path.join(targetDir, fileName);
            fs.writeFileSync(localPath, buf);

            const storagePath = `${tableName}/${fileName}`;
            const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;

            await supabase.storage.from('brand-logos').upload(storagePath, buf, {
              contentType: 'image/svg+xml',
              upsert: true
            });

            await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
            count++;
            console.log(`[${i + 1}/${items.length}] ✓ STORED LOGO.WINE SVG: ${item.name} -> ${localPath} (${buf.length} bytes)`);
          }
        }
      } catch(e) {}
    }
    await delay(100);
  }
  console.log(`Completed ${tableName}: ${count}/${items.length} logo.wine SVGs stored!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ FINISHED!');
}

run();
