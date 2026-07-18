import fs from 'fs';
import { getSupabaseAdminClient } from './backend/lib/supabase-admin.js';

const env = fs.readFileSync('.dev.vars', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if(k && v) process.env[k.trim()] = v.join('=').trim();
});

async function checkLogos() {
  const supabase = getSupabaseAdminClient();
  const tables = ['food_brands', 'car_brands', 'fashion_brands'];
  const broken = [];
  
  for (const table of tables) {
    const { data } = await supabase.from(table).select('id, name, logo_url');
    for (const brand of data) {
      if (!brand.logo_url) {
        broken.push({ table, name: brand.name, issue: 'missing' });
        continue;
      }
      try {
        const res = await fetch(brand.logo_url, { method: 'HEAD', redirect: 'follow', timeout: 5000 });
        if (!res.ok) {
          broken.push({ table, name: brand.name, issue: `HTTP ${res.status}`, url: brand.logo_url });
        }
      } catch (e) {
        broken.push({ table, name: brand.name, issue: e.message, url: brand.logo_url });
      }
    }
  }
  fs.writeFileSync('broken_logos.json', JSON.stringify(broken, null, 2));
  console.log(`Found ${broken.length} broken logos. Check broken_logos.json`);
}

checkLogos();
