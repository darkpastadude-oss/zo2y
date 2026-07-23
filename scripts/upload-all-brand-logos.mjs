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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .dev.vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'image/png';
      return { buffer: Buffer.from(buffer), contentType };
    }
  } catch (e) {}
  return null;
}

async function fixAndUploadLogos() {
  const tables = ['fashion_brands', 'food_brands', 'car_brands'];

  for (const table of tables) {
    console.log(`Processing logos for ${table}...`);
    const { data: storageFiles } = await supabase.storage.from('brand-logos').list(table);
    const existingFileNames = new Set((storageFiles || []).map(f => f.name.toLowerCase()));

    const { data: brands } = await supabase.from(table).select('*');
    for (const b of (brands || [])) {
      const domain = String(b.domain || '').trim() || (b.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
      const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const targetFileName = `${cleanSlug}.png`;
      const storagePath = `${table}/${targetFileName}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

      // Check if already stored in Supabase bucket
      if (existingFileNames.has(targetFileName)) {
        await supabase.from(table).update({ logo_url: publicUrl, domain }).eq('id', b.id);
        console.log(`[Storage Exists] Updated ${b.name} -> ${publicUrl}`);
        continue;
      }

      // Try downloading high quality logo from Wikipedia/Wikimedia
      let imgData = null;

      // Try Wikipedia REST API for logo
      try {
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(b.name)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const thumbUrl = wikiData?.thumbnail?.source || wikiData?.originalimage?.source || '';
          if (thumbUrl && !thumbUrl.includes('svg.png') && thumbUrl.includes('upload.wikimedia.org')) {
            imgData = await downloadImage(thumbUrl);
          }
        }
      } catch (e) {}

      // Try Wikimedia Commons directly
      if (!imgData) {
        try {
          const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(b.name + ' logo.svg')}&prop=imageinfo&iiprop=url&iiurlwidth=512&format=json`;
          const commonRes = await fetch(searchUrl);
          if (commonRes.ok) {
            const commonData = await commonRes.json();
            const pages = commonData?.query?.pages || {};
            const page = Object.values(pages)[0];
            const thumb = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || '';
            if (thumb) imgData = await downloadImage(thumb);
          }
        } catch (e) {}
      }

      // No favicon fallback - skip if no high-quality source found
      if (!imgData) {
        console.log(`[No High-Quality Logo] ${b.name} (${domain}) - skipping upload, will use /api/logo at runtime`);
        continue;
      }

      if (imgData) {
        const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(storagePath, imgData.buffer, {
          contentType: imgData.contentType,
          upsert: true
        });

        if (!uploadErr) {
          existingFileNames.add(targetFileName);
          await supabase.from(table).update({ logo_url: publicUrl, domain }).eq('id', b.id);
          console.log(`[Uploaded & Saved] ${b.name} (${domain}) -> ${publicUrl}`);
        } else {
          console.log(`[Upload Failed] ${b.name} (${domain}) - will use /api/logo at runtime`);
        }
      } else {
        console.log(`[No Image Found] ${b.name} (${domain}) - will use /api/logo at runtime`);
      }
    }
  }

  console.log('All brand logos uploaded and verified successfully!');
}

fixAndUploadLogos();
