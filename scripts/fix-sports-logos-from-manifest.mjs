import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', path.join('backend', '.env')]
  .map((file) => path.join(ROOT, file));

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
    env[key] = value;
  });
  return env;
}

function hydrateEnv() {
  ENV_FILES.forEach((filePath) => loadEnvFile(filePath));
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'sports-assets';
const MANIFEST_PATH = 'manifest/sports-assets.json';
const ONLY_NATIONAL = process.argv.includes('--only-national');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isNationalTeamRow(row) {
  const league = normalize(row?.league);
  return league === 'national team' || league.includes('national team');
}

async function fetchManifest() {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${MANIFEST_PATH}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch manifest (${res.status})`);
  return res.json();
}

async function main() {
  const manifest = await fetchManifest();
  const teams = Array.isArray(manifest?.teams) ? manifest.teams : [];
  if (!teams.length) {
    console.log('Manifest contains 0 teams.');
    return;
  }

  const manifestById = new Map();
  const manifestByNameLeague = new Map();
  for (const t of teams) {
    const id = String(t?.id || '').trim();
    const name = String(t?.name || '').trim();
    const league = String(t?.league || '').trim();
    if (id) manifestById.set(id, t);
    const key = `${normalize(name)}|${normalize(league)}`;
    if (name && league && !manifestByNameLeague.has(key)) manifestByNameLeague.set(key, t);
  }

  const { data: dbTeams, error } = await supabase
    .from('teams')
    .select('id,name,league,logo_url')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const candidates = (dbTeams || []).filter((row) => !ONLY_NATIONAL || isNationalTeamRow(row));
  const updates = [];

  for (const row of candidates) {
    const id = String(row.id || '').trim();
    const manifestTeam =
      manifestById.get(id) ||
      manifestByNameLeague.get(`${normalize(row.name)}|${normalize(row.league)}`);
    const badge = String(manifestTeam?.badge || '').trim();
    if (!badge) continue;
    if (String(row.logo_url || '').trim() === badge) continue;
    updates.push({ id, logo_url: badge });
  }

  console.log(`[sports-fix] candidates=${candidates.length} updates=${updates.length} (onlyNational=${ONLY_NATIONAL})`);
  if (!updates.length) return;

  let updated = 0;
  for (const batch of chunk(updates, 200)) {
    const { error: upsertError } = await supabase.from('teams').upsert(batch, { onConflict: 'id' });
    if (upsertError) throw upsertError;
    updated += batch.length;
    console.log(`[sports-fix] updated ${updated}/${updates.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

