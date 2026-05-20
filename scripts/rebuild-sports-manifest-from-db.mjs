import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'sports-assets';
const MANIFEST_PATH = 'manifest/sports-assets.json';

const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'),
  path.join(ROOT, '.env.vercel.prod'),
  path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env.vercel')
];

function loadEnv(filePath) {
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

ENV_FILES.forEach(loadEnv);

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function fetchAllTeams() {
  const pageSize = 1000;
  let offset = 0;
  const out = [];
  while (true) {
    const { data, error } = await supabase
      .from('teams')
      .select('id,name,sport,league,stadium,logo_url,banner_url,fanart_url,stadium_url,jersey_url', { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('name', { ascending: true });
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
    if (offset > 50000) break;
  }
  return out;
}

async function main() {
  const rows = await fetchAllTeams();
  const teams = rows.map((r) => ({
    id: String(r.id || ''),
    sportsDbId: String(r.id || ''),
    name: r.name || '',
    sport: r.sport || '',
    league: r.league || '',
    stadium: r.stadium || '',
    badge: r.logo_url || '',
    banner: r.banner_url || '',
    fanart: r.fanart_url || '',
    stadiumImage: r.stadium_url || '',
    jersey: r.jersey_url || ''
  })).filter((t) => t.id && t.name);

  const manifest = { savedAt: new Date().toISOString(), teams };
  const body = JSON.stringify(manifest, null, 2);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(MANIFEST_PATH, body, { contentType: 'application/json', upsert: true, cacheControl: '300' });
  if (error) throw error;
  console.log(`[manifest] uploaded teams=${teams.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

