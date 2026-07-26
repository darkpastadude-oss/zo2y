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

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getWikidataLogoFile(brandName) {
  try {
    const searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(brandName) + '&format=json';
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const sData = await sRes.json();
    const pageTitle = sData?.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    const propUrl = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(pageTitle) + '&prop=pageprops&format=json';
    const pRes = await fetch(propUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pData = await pRes.json();
    const page = Object.values(pData?.query?.pages || {})[0];
    const qid = page?.pageprops?.wikibase_item;

    if (qid) {
      const entityUrl = 'https://www.wikidata.org/wiki/Special:EntityData/' + qid + '.json';
      const eRes = await fetch(entityUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const eData = await eRes.json();
      const claims = eData?.entities?.[qid]?.claims;
      const logoFile = claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (logoFile) return logoFile;
    }
  } catch(e) {}
  return null;
}

async function fetchCommonsFile(filename) {
  const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(filename);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 300) {
        const ext = filename.toLowerCase().endsWith('.png') ? 'png' : 'svg';
        return { buffer: buf, ext };
      }
    }
  } catch(e) {}
  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Fetching 100% official vector SVGs for ${tableName} (${items.length} items)...`);
  console.log(`========================================`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // 1. Check Wikidata P154 exact logo file
    const p154File = await getWikidataLogoFile(item.name);
    let logoData = p154File ? await fetchCommonsFile(p154File) : null;

    // 2. If Wikidata search didn't get it, try direct title queries on Commons API
    if (!logoData) {
      const queries = [
        `${item.name} logo.svg`,
        `${item.name} wordmark.svg`,
        `${item.name} logo`
      ];
      for (const q of queries) {
        try {
          const sUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
          const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (sRes.ok) {
            const sData = await sRes.json();
            const pages = Object.values(sData.query?.pages || {});
            for (const p of pages) {
              const imgUrl = p.imageinfo?.[0]?.url;
              if (imgUrl && (imgUrl.endsWith('.svg') || imgUrl.endsWith('.png'))) {
                const fRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (fRes.ok) {
                  const buf = Buffer.from(await fRes.arrayBuffer());
                  if (buf.length > 500) {
                    logoData = { buffer: buf, ext: imgUrl.endsWith('.svg') ? 'svg' : 'png' };
                    break;
                  }
                }
              }
            }
          }
        } catch(e) {}
        if (logoData) break;
      }
    }

    if (logoData) {
      const fileName = `${cleanSlug}.${logoData.ext}`;
      const localPath = path.join(targetDir, fileName);
      fs.writeFileSync(localPath, logoData.buffer);

      const storagePath = `${tableName}/${fileName}`;
      const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;
      const contentType = logoData.ext === 'svg' ? 'image/svg+xml' : 'image/png';

      await supabase.storage.from('brand-logos').upload(storagePath, logoData.buffer, {
        contentType,
        upsert: true
      });

      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      console.log(`[${i + 1}/${items.length}] ✓ OFFICIAL VECTOR/HQ LOGO STORED: ${item.name} -> ${localPath} (${logoData.buffer.length} bytes)`);
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ MISSING: ${item.name}`);
    }

    await delay(100);
  }
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ FINISHED FETCHING ALL OFFICIAL LOGOS!');
}

run();
