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

async function findWikimediaSvgUrl(brandName) {
  const queries = [
    `${brandName} logo.svg`,
    `${brandName} brand logo`,
    `${brandName} logo`,
    `${brandName}`
  ];

  for (const q of queries) {
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {});
        for (const p of pages) {
          const imgInfo = p.imageinfo?.[0];
          const imgUrl = imgInfo?.url;
          const title = (p.title || '').toLowerCase();
          if (imgUrl && (title.includes('logo') || title.includes('symbol') || title.includes('wordmark') || title.includes('emblem'))) {
            // Download test
            const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.length > 500) {
                const ext = (imgInfo.mime || '').includes('svg') || imgUrl.endsWith('.svg') ? 'svg' : 'png';
                return { buffer: buf, ext, url: imgUrl };
              }
            }
          }
        }
      }
    } catch(e) {}
  }
  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Processing ${items.length} items from ${tableName}...`);
  console.log(`========================================`);

  let successCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Check if local file already exists and is non-empty
    let ext = 'svg';
    let localPath = path.join(targetDir, `${cleanSlug}.svg`);
    if (!fs.existsSync(localPath) || fs.statSync(localPath).size < 500) {
      localPath = path.join(targetDir, `${cleanSlug}.png`);
      ext = 'png';
    }

    let logoBuffer = null;
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 500) {
      logoBuffer = fs.readFileSync(localPath);
    } else {
      // Search Wikimedia Commons for real logo SVG/PNG
      const result = await findWikimediaSvgUrl(item.name);
      if (result) {
        logoBuffer = result.buffer;
        ext = result.ext;
        localPath = path.join(targetDir, `${cleanSlug}.${ext}`);
        fs.writeFileSync(localPath, logoBuffer);
      }
      await delay(200);
    }

    if (logoBuffer && logoBuffer.length > 500) {
      // Upload to Supabase Storage
      const storagePath = `${tableName}/${cleanSlug}.${ext}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;
      const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/png';

      const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, logoBuffer, {
        contentType,
        upsert: true
      });

      if (!uploadErr || uploadErr.message?.includes('already exists')) {
        await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
        successCount++;
        console.log(`[${i + 1}/${items.length}] ✓ REAL ASSET STORED & UPLOADED: ${item.name} -> ${publicUrl}`);
      } else {
        console.error(`[${i + 1}/${items.length}] ❌ Storage upload failed for ${item.name}:`, uploadErr.message);
      }
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FIND LOGO: ${item.name}`);
    }
  }

  console.log(`Completed ${tableName}: ${successCount}/${items.length} real assets uploaded!`);
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ ALL REAL BRAND LOGOS PROCESSED & UPLOADED TO SUPABASE STORAGE!');
}

run();
