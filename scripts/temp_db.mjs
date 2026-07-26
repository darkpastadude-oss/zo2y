import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
if (fs.existsSync('.dev.vars')) {
  fs.readFileSync('.dev.vars', 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec', {
    sql_string: `
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_items JSONB;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_mode TEXT DEFAULT 'rotate';
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_position_x INTEGER DEFAULT 50;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banner_position_y INTEGER DEFAULT 15;
    `
  });
  if (error) console.error(error);
  else console.log('Schema updated:', data);
}
run();
