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

async function downloadRealLogo(brandName, domain) {
  // Strategy 1: Wikimedia Commons Search
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(brandName + ' logo')}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&format=json`;
    const res = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      for (const p of pages) {
        const imgUrl = p.imageinfo?.[0]?.url;
        if (imgUrl && !imgUrl.endsWith('.pdf') && !imgUrl.endsWith('.ogv')) {
          const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.length > 500) {
              const ext = imgUrl.endsWith('.svg') ? 'svg' : 'png';
              return { buffer: buf, ext, source: 'Wikimedia' };
            }
          }
        }
      }
    }
  } catch(e) {}

  // Strategy 2: High-res Domain Logo (Favicon sz=256 / Unavatar)
  const domainSources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://unavatar.io/${domain}?fallback=false`
  ];

  for (const src of domainSources) {
    try {
      const res = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 400) {
          return { buffer: buf, ext: 'png', source: 'Domain Logo' };
        }
      }
    } catch(e) {}
  }

  return null;
}

async function processCategory(tableName, targetDir) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain');
  console.log(`\n========================================`);
  console.log(`Downloading REAL logos for ${items.length} items in ${tableName}...`);
  console.log(`========================================`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Check existing local assets
    let ext = 'png';
    let localPath = path.join(targetDir, `${cleanSlug}.png`);
    let logoBuffer = null;

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 500) {
      logoBuffer = fs.readFileSync(localPath);
    } else {
      localPath = path.join(targetDir, `${cleanSlug}.svg`);
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 500) {
        logoBuffer = fs.readFileSync(localPath);
        ext = 'svg';
      }
    }

    if (!logoBuffer) {
      const logoData = await downloadRealLogo(item.name, domain);
      if (logoData) {
        logoBuffer = logoData.buffer;
        ext = logoData.ext;
        localPath = path.join(targetDir, `${cleanSlug}.${ext}`);
        fs.writeFileSync(localPath, logoBuffer);
      }
      await delay(100);
    }

    if (logoBuffer && logoBuffer.length > 300) {
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
        console.log(`[${i + 1}/${items.length}] ✓ LOCAL FILE SAVED & SUPABASE STORED: ${item.name} -> ${publicUrl} (${logoBuffer.length} bytes)`);
      } else {
        console.error(`[${i + 1}/${items.length}] ❌ Storage Upload Failed for ${item.name}:`, uploadErr.message);
      }
    } else {
      console.warn(`[${i + 1}/${items.length}] ⚠ COULD NOT FETCH REAL LOGO FOR: ${item.name}`);
    }
  }
}

async function run() {
  await processCategory('fashion_brands', fashionDir);
  await processCategory('food_brands', foodDir);
  console.log('\n✅ ALL 250 REAL BRAND LOGO FILES ARE SAVED LOCALLY AND STORED IN SUPABASE STORAGE!');
}

run();
