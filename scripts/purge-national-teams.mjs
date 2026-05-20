import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'sports-assets';
const MANIFEST_PATH = 'manifest/sports-assets.json';

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const ONLY_FOOTBALL = !process.argv.includes('--all-sports');

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
    // Allow later env files to override earlier ones (backend/.env may be stale).
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

function isNationalTeamLike(row) {
  const league = norm(row?.league);
  if (league === 'national team') return true;
  if (league.includes('national team')) return true;
  // common misc labels
  if (league === 'international' || league.includes('international team')) return true;
  return false;
}

function isFootballLike(row) {
  const sport = norm(row?.sport);
  return sport === 'football' || sport === 'soccer';
}

async function fetchPublicManifest(supabaseUrl) {
  const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${MANIFEST_PATH}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch manifest (${res.status})`);
  return res.json();
}

async function main() {
  hydrateEnv();

  const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    console.error('Missing SUPABASE_URL in env.');
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 1) Purge from `teams` table
  let query = supabase.from('teams').select('id,name,sport,league', { count: 'exact' });
  if (ONLY_FOOTBALL) query = query.in('sport', ['Football', 'football', 'Soccer', 'soccer']);
  // We can’t OR nicely without a view, so fetch football subset (or all) then filter client-side.
  const { data: rows, error } = await query.limit(10000);
  if (error) throw error;
  const candidates = (rows || []).filter((r) => isNationalTeamLike(r));
  console.log(`[purge] teams candidates=${candidates.length} (dryRun=${DRY_RUN} onlyFootball=${ONLY_FOOTBALL})`);

  if (!DRY_RUN && candidates.length) {
    const ids = candidates.map((r) => r.id);
    const { error: delErr } = await supabase.from('teams').delete().in('id', ids);
    if (delErr) throw delErr;
    console.log(`[purge] teams deleted=${ids.length}`);
  }

  // 2) Purge from remote manifest and upload back
  const manifest = await fetchPublicManifest(SUPABASE_URL);
  const teams = Array.isArray(manifest?.teams) ? manifest.teams : [];
  const manifestNationalCount = teams.filter((t) => isNationalTeamLike(t) && (!ONLY_FOOTBALL || isFootballLike(t))).length;
  const kept = teams.filter((t) => {
    if (!isNationalTeamLike(t)) return true;
    if (!ONLY_FOOTBALL) return false;
    return !isFootballLike(t);
  });
  const removed = teams.length - kept.length;
  console.log(`[purge] manifest teams total=${teams.length} nationalCandidates=${manifestNationalCount} removed=${removed}`);

  if (!DRY_RUN && removed > 0) {
    const next = { ...manifest, savedAt: new Date().toISOString(), teams: kept };
    const body = JSON.stringify(next, null, 2);
    const { error: upErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(MANIFEST_PATH, body, { contentType: 'application/json', upsert: true, cacheControl: '300' });
    if (upErr) throw upErr;
    console.log('[purge] manifest uploaded');
  }

  if (DRY_RUN) {
    console.log('Dry run only. Re-run with `--apply` to delete rows + upload manifest.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
