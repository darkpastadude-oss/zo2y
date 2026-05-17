const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
  return env;
}

['.env','.env.local','.env.vercel','.env.vercel.prod'].forEach(f => loadEnvFile(path.join(process.cwd(), f)));

const url = process.env.SUPABASE_URL.startsWith('http') ? process.env.SUPABASE_URL : 'https://' + process.env.SUPABASE_URL + '.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  // Check for our seeded teams (slug-based IDs)
  const { data: seeded, error } = await supabase
    .from('teams')
    .select('id,name,sport,league')
    .ilike('id', '%-%')
    .limit(10);

  console.log('Seeded teams (slug IDs):', seeded?.length || 0);
  if (seeded?.length) console.log('Sample:', JSON.stringify(seeded.slice(0, 3), null, 2));

  // Check for numeric IDs (TheSportsDB)
  const { data: numeric, error: err2 } = await supabase
    .from('teams')
    .select('id,name,sport,league')
    .not('id', 'like', '%-%')
    .limit(5);

  console.log('Numeric ID teams:', numeric?.length || 0);
  if (numeric?.length) console.log('Sample:', JSON.stringify(numeric, null, 2));

  // Count total
  const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  console.log('Total:', count);
})();
