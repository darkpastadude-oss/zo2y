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

async function verifyCategory(tableName, dirName) {
  const { data: items } = await supabase.from(tableName).select('id, name, domain, logo_url');
  console.log(`\nVerifying database records for ${tableName} (${items.length} items)...`);

  let validCount = 0;
  let missingCount = 0;

  for (const item of items) {
    if (!item.logo_url) {
      console.warn(`⚠ MISSING LOGO URL IN DB: ${item.name}`);
      missingCount++;
    } else {
      validCount++;
    }
  }

  console.log(`Summary for ${tableName}: ${validCount} valid logo URLs, ${missingCount} missing.`);
}

async function run() {
  await verifyCategory('fashion_brands', 'fashion');
  await verifyCategory('food_brands', 'food');
}

run();
