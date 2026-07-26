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
fs.mkdirSync(fashionDir, { recursive: true });
fs.mkdirSync(foodDir, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getWikidataLogo(brandName) {
  try {
    const searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(brandName) + '&format=json';
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const sData = await sRes.json();
    const pageTitle = sData?.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    const propUrl = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(pageTitle) + '&prop=pageprops&format=json';
    const pRes = await fetch(propUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const pData = await pRes.json();
    const page = Object.values(pData?.query?.pages || {})[0];
    const qid = page?.pageprops?.wikibase_item;

    if (qid) {
      const entityUrl = 'https://www.wikidata.org/wiki/Special:EntityData/' + qid + '.json';
      const eRes = await fetch(entityUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const eData = await eRes.json();
      const claims = eData?.entities?.[qid]?.claims;
      const logoFile = claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (logoFile) {
        const fileUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(logoFile);
        const fRes = await fetch(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (fRes.ok) {
          const buf = Buffer.from(await fRes.arrayBuffer());
          if (buf.length > 500) {
            const ext = logoFile.toLowerCase().endsWith('.svg') ? 'svg' : 'png';
            return { buffer: buf, ext, source: 'Wikidata P154' };
          }
        }
      }
    }
  } catch(e) {}
  return null;
}

async function getFallbackLogo(domain) {
  const sources = [
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://unavatar.io/${domain}?fallback=false`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
  ];
  for (const src of sources) {
    try {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 1000) {
          return { buffer: buf, ext: 'png', source: 'Domain API' };
        }
      }
    } catch(e) {}
  }
  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Processing ${items.length} brands in ${tableName}...`);
  console.log(`========================================`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // 1. Try Wikidata P154 official vector logo
    let logo = await getWikidataLogo(item.name);
    await delay(100);

    // 2. If Wikidata failed, try domain high-res API
    if (!logo) {
      logo = await getFallbackLogo(domain);
      await delay(100);
    }

    if (logo) {
      const fileName = `${cleanSlug}.${logo.ext}`;
      const localFilePath = path.join(targetDir, fileName);
      fs.writeFileSync(localFilePath, logo.buffer);

      // Upload to Supabase Storage
      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;
      const contentType = logo.ext === 'svg' ? 'image/svg+xml' : 'image/png';

      const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, logo.buffer, {
        contentType,
        upsert: true
      });

      if (!uploadErr || uploadErr.message?.includes('already exists')) {
        await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
        console.log(`[${i + 1}/${items.length}] ✓ LOCAL FILE SAVED & UPLOADED (${logo.source}): ${item.name} -> ${localFilePath}`);
      } else {
        console.error(`[${i + 1}/${items.length}] ❌ Storage Upload Failed for ${item.name}:`, uploadErr.message);
      }
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FETCH LOGO: ${item.name}`);
    }
  }
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ FINISHED SAVING ALL REAL LOCAL LOGOS AND UPLOADING TO SUPABASE!');
}

run();
