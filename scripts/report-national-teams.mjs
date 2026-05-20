import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
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
}

loadEnvFromFile(path.join(process.cwd(), 'backend', '.env'));

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const LIMIT = Number.parseInt((process.argv.find((arg) => arg.startsWith('--limit=')) || '').split('=')[1] || '', 10) || 20;

async function main() {
  const { data, error } = await supabase
    .from('teams')
    .select('id,name,league,logo_url')
    .ilike('league', '%National Team%')
    .order('name');
  if (error) throw error;

  const rows = data || [];
  const missingLogo = rows.filter((r) => !String(r.logo_url || '').trim());
  const dupesByName = new Map();
  for (const r of rows) {
    const key = String(r.name || '').trim().toLowerCase();
    if (!key) continue;
    dupesByName.set(key, (dupesByName.get(key) || 0) + 1);
  }
  const dupes = [...dupesByName.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);

  console.log(`[national] rows=${rows.length} missingLogo=${missingLogo.length} dupes=${dupes.length}`);
  console.log('\nMissing logo_url (sample):');
  console.log(missingLogo.slice(0, LIMIT));
  console.log('\nDuplicate names (sample):');
  console.log(dupes.slice(0, LIMIT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

