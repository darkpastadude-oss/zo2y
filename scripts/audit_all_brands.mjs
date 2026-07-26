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

async function run() {
  const { data: fashion } = await supabase.from('fashion_brands').select('id, name, domain, logo_url').order('name');
  const { data: food } = await supabase.from('food_brands').select('id, name, domain, logo_url').order('name');

  console.log(`FASHION BRANDS (${fashion.length}):`);
  fashion.forEach(b => console.log(`- "${b.name}" (${b.domain}) -> ${b.logo_url}`));

  console.log(`\nFOOD BRANDS (${food.length}):`);
  food.forEach(b => console.log(`- "${b.name}" (${b.domain}) -> ${b.logo_url}`));
}

run();
