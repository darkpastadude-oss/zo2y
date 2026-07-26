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

const FIXES = {
  "Montblanc": "https://www.logo.wine/a/logo/Montblanc_(company)/Montblanc_(company)-Logo.wine.svg",
  "Palm Angels": "https://www.logo.wine/a/logo/Palm_Angels/Palm_Angels-Logo.wine.svg",
  "Stüssy": "https://www.logo.wine/a/logo/St%C3%BCssy/St%C3%BCssy-Logo.wine.svg",
  "Rick Owens": "https://www.logo.wine/a/logo/Rick_Owens/Rick_Owens-Logo.wine.svg",
  "Auntie Anne's": "https://www.logo.wine/a/logo/Auntie_Anne%27s/Auntie_Anne%27s-Logo.wine.svg",
  "Olive Garden": "https://www.logo.wine/a/logo/Olive_Garden/Olive_Garden-Logo.wine.svg",
  "Popeyes": "https://www.logo.wine/a/logo/Popeyes/Popeyes-Logo.wine.svg"
};

async function run() {
  for (const [brand, url] of Object.entries(FIXES)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500) {
          const isFashion = ["Montblanc", "Palm Angels", "Stüssy", "Rick Owens"].includes(brand);
          const tableName = isFashion ? 'fashion_brands' : 'food_brands';
          const targetDir = isFashion ? fashionDir : foodDir;

          const { data: item } = await supabase.from(tableName).select('id, domain').eq('name', brand).single();
          if (item) {
            const rawDomain = (item.domain || '').trim() || (brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
            const cleanSlug = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();

            const fileName = `${cleanSlug}.svg`;
            const localPath = path.join(targetDir, fileName);
            fs.writeFileSync(localPath, buf);

            const storagePath = `${tableName}/${fileName}`;
            const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;

            await supabase.storage.from('brand-logos').upload(storagePath, buf, {
              contentType: 'image/svg+xml',
              upsert: true
            });

            await supabase.from(tableName).update({ logo_url: publicUrl }).eq('id', item.id);
            console.log(`✓ REPLACED SUSPECT LOGO: ${brand} -> ${localPath} (${buf.length} bytes)`);
          }
        }
      }
    } catch(e) {}
  }
  console.log('✅ Suspect logo replacements finished!');
}

run();
