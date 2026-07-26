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

function ensureBlackSvg(content) {
  let s = content;

  // Convert white/light fills to black/dark charcoal
  s = s.replace(/fill=["']#fff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']#ffffff["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill=["']rgb\(255,\s*255,\s*255\)["']/gi, 'fill="#0f0f0f"');
  s = s.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  s = s.replace(/fill:\s*white/gi, 'fill: #0f0f0f');

  // Convert white strokes to black
  s = s.replace(/stroke=["']#fff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']#ffffff["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  s = s.replace(/stroke:\s*#fff(?:fff)?/gi, 'stroke: #0f0f0f');

  // If SVG has no fill attribute specified on root or elements, set fill="#0f0f0f" on svg root
  if (!s.includes('fill=') && !s.includes('fill:')) {
    s = s.replace(/<svg([^>]*)>/i, '<svg$1 fill="#0f0f0f">');
  }

  return s;
}

async function fixCategory(tableName, dirPath) {
  const files = fs.readdirSync(dirPath);
  console.log(`\n========================================`);
  console.log(`Processing ${tableName} (${files.length} local files)...`);
  console.log(`========================================`);

  let svgCount = 0;
  let fixedCount = 0;

  for (const f of files) {
    if (f.endsWith('.svg')) {
      svgCount++;
      const filePath = path.join(dirPath, f);
      const original = fs.readFileSync(filePath, 'utf8');
      const fixed = ensureBlackSvg(original);

      fs.writeFileSync(filePath, fixed);
      fixedCount++;

      // Upload to Supabase storage bucket brand-logos
      const storagePath = `${tableName}/${f}`;
      await supabase.storage.from('brand-logos').upload(storagePath, Buffer.from(fixed), {
        contentType: 'image/svg+xml',
        upsert: true
      });
    }
  }

  // Update DB records to match storage URLs
  const { data: dbItems } = await supabase.from(tableName).select('id, name, domain, logo_url');
  let dbUpdateCount = 0;

  for (const item of dbItems) {
    const rawDomain = (item.domain || '').trim() || (item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSlug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const svgFileName = `${cleanSlug}.svg`;
    const localSvgPath = path.join(dirPath, svgFileName);

    if (fs.existsSync(localSvgPath)) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-logos/${tableName}/${svgFileName}`;
      await supabase.from(tableName).update({ logo_url: publicUrl, domain }).eq('id', item.id);
      dbUpdateCount++;
    }
  }

  console.log(`Summary for ${tableName}: ${svgCount} SVGs processed & converted to black, ${dbUpdateCount} DB records updated!`);
}

async function run() {
  await fixCategory('fashion_brands', fashionDir);
  await fixCategory('food_brands', foodDir);
  console.log('\n✅ ALL FASHION & FOOD SVGS AUDITED AND CONVERTED TO BLACK FOR LIGHT BACKGROUND CARDS!');
}

run();
