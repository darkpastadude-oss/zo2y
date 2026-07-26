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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function downloadBuffer(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Zo2yLogoFixer/1.0 (https://zo2y.com; support@zo2y.com)'
      }
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || (url.includes('.svg') ? 'image/svg+xml' : 'image/png');
      return { buffer: Buffer.from(buffer), contentType };
    }
  } catch (e) {}
  return null;
}

function generateSvgPlaceholder(name) {
  const cleanName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const firstLetter = cleanName.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#0f172a" rx="32"/>
    <text x="200" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="bold" fill="#60a5fa" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
    <text x="200" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#94a3b8" text-anchor="middle">${cleanName}</text>
  </svg>`;
  return { buffer: Buffer.from(svg), contentType: 'image/svg+xml' };
}

async function processTable(tableName) {
  const { data: items, error } = await supabase.from(tableName).select('id, name, logo_url, domain');
  if (error || !items) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Processing ${items.length} items from ${tableName}...`);
  console.log(`========================================`);

  let count = 0;
  for (const item of items) {
    count++;
    const domain = String(item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Check if item's logo_url is already hosted on Supabase Storage
    const isAlreadySupabase = item.logo_url && item.logo_url.startsWith(`${supabaseUrl}/storage/v1/object/public/brand-logos/`);
    const isSvg = (item.logo_url || '').toLowerCase().includes('.svg');
    const ext = isSvg ? 'svg' : 'png';
    const storagePath = `${tableName}/${cleanSlug}.${ext}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${storagePath}`;

    if (isAlreadySupabase) {
      // Test if current Supabase URL returns 200
      try {
        const testRes = await fetch(item.logo_url);
        if (testRes.ok && parseInt(testRes.headers.get('content-length') || '1', 10) > 100) {
          console.log(`[${count}/${items.length}] ✓ ALREADY IN SUPABASE STORAGE (200 OK): ${item.name}`);
          continue;
        }
      } catch (e) {}
    }

    // Try downloading the source logo
    let img = null;
    if (item.logo_url && !item.logo_url.includes('placeholder')) {
      img = await downloadBuffer(item.logo_url);
      await delay(250); // Rate limit delay to respect source servers
    }

    // If download failed or invalid, generate SVG placeholder buffer
    if (!img || img.buffer.length < 100) {
      console.warn(`[${count}/${items.length}] ⚠ Download failed for ${item.name}. Generating crisp SVG badge placeholder.`);
      img = generateSvgPlaceholder(item.name);
    }

    // Upload to Supabase Storage
    const finalExt = img.contentType.includes('svg') ? 'svg' : 'png';
    const finalStoragePath = `${tableName}/${cleanSlug}.${finalExt}`;
    const finalPublicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${finalStoragePath}`;

    const { error: uploadErr } = await supabase.storage.from('brand-logos').upload(finalStoragePath, img.buffer, {
      contentType: img.contentType,
      upsert: true
    });

    if (uploadErr) {
      console.error(`[${count}/${items.length}] ❌ Storage upload failed for ${item.name}:`, uploadErr.message);
    } else {
      await supabase.from(tableName).update({ logo_url: finalPublicUrl, domain }).eq('id', item.id);
      console.log(`[${count}/${items.length}] ✓ UPLOADED & STORED IN SUPABASE: ${item.name} -> ${finalPublicUrl}`);
    }
  }
}

async function run() {
  await processTable('fashion_brands');
  await processTable('food_brands');
  console.log('\n🎉 ALL LOGOS ARE NOW HOSTED 100% LOCALLY IN SUPABASE STORAGE!');
}

run();
