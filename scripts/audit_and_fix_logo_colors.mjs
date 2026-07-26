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

function makeSvgBlack(svgContent) {
  let modified = svgContent;

  // Replace white fills with black/dark charcoal
  modified = modified.replace(/fill=["']#fff["']/gi, 'fill="#0f0f0f"');
  modified = modified.replace(/fill=["']#ffffff["']/gi, 'fill="#0f0f0f"');
  modified = modified.replace(/fill=["']white["']/gi, 'fill="#0f0f0f"');
  modified = modified.replace(/fill=["']rgb\(255,\s*255,\s*255\)["']/gi, 'fill="#0f0f0f"');
  modified = modified.replace(/fill:\s*#fff(?:fff)?/gi, 'fill: #0f0f0f');
  modified = modified.replace(/fill:\s*white/gi, 'fill: #0f0f0f');

  // Replace white strokes with black
  modified = modified.replace(/stroke=["']#fff["']/gi, 'stroke="#0f0f0f"');
  modified = modified.replace(/stroke=["']#ffffff["']/gi, 'stroke="#0f0f0f"');
  modified = modified.replace(/stroke=["']white["']/gi, 'stroke="#0f0f0f"');
  modified = modified.replace(/stroke:\s*#fff(?:fff)?/gi, 'stroke: #0f0f0f');

  // If SVG has style with color/fill currentColor or no fill specified on root
  if (!modified.includes('fill=') && !modified.includes('fill:')) {
    modified = modified.replace(/<svg([^>]*)>/i, '<svg$1 fill="#0f0f0f">');
  }

  return modified;
}

async function fixCategoryColor(tableName, targetDir) {
  const files = fs.readdirSync(targetDir);
  console.log(`\nInspecting and converting SVG colors for ${tableName} (${files.length} files)...`);

  let count = 0;
  for (const f of files) {
    if (f.endsWith('.svg')) {
      const filePath = path.join(targetDir, f);
      const original = fs.readFileSync(filePath, 'utf8');
      const fixed = makeSvgBlack(original);

      if (fixed !== original) {
        fs.writeFileSync(filePath, fixed);
        const storagePath = `${tableName}/${f}`;
        const publicUrl = supabaseUrl + '/storage/v1/object/public/brand-logos/' + storagePath;

        await supabase.storage.from('brand-logos').upload(storagePath, Buffer.from(fixed), {
          contentType: 'image/svg+xml',
          upsert: true
        });

        count++;
        console.log(`✓ CONVERTED WHITE LOGO TO BLACK SVG: ${f}`);
      }
    }
  }

  console.log(`Finished ${tableName}: ${count} SVGs converted to black for light background visibility!`);
}

async function run() {
  await fixCategoryColor('fashion_brands', fashionDir);
  await fixCategoryColor('food_brands', foodDir);
  console.log('\n✅ COLOR AUDIT COMPLETE! ALL WHITE SVGS ARE NOW BLACK LOGOS!');
}

run();
