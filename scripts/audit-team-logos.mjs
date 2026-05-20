import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'),
  path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env.vercel'),
  path.join(ROOT, '.env.vercel.prod')
];

function loadEnvFile(filePath) {
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
    process.env[key] = value;
  });
}

function hydrateEnv() {
  ENV_FILES.forEach(loadEnvFile);
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

function isMissingLogo(url) {
  const v = String(url || '').trim();
  if (!v) return true;
  if (v === '/file.svg') return true;
  return false;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const LIMIT = Number.parseInt((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '', 10) || 25;

async function main() {
  const { data, error } = await supabase
    .from('teams')
    .select('id,name,sport,league,logo_url')
    .limit(10000);
  if (error) throw error;

  const rows = data || [];
  const missing = rows.filter((r) => isMissingLogo(r.logo_url));
  const f1 = rows.filter((r) => norm(r.league) === 'formula 1' || norm(r.sport) === 'motorsport');
  const f1Missing = f1.filter((r) => isMissingLogo(r.logo_url));

  console.log(`[audit] total=${rows.length} missingLogo=${missing.length}`);
  console.log(`[audit] f1_or_motorsport=${f1.length} missingLogo=${f1Missing.length}`);
  console.log('\nMissing logo samples:');
  console.log(missing.slice(0, LIMIT));
  console.log('\nF1/motorsport missing logo samples:');
  console.log(f1Missing.slice(0, LIMIT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

