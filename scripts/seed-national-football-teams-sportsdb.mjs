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

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPORTSDB_KEY = String(process.env.SPORTSDB_API_KEY || process.env.SPORTSDB_KEY || process.env.THESPORTSDB_KEY || '3').trim() || '3';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const APPLY = process.argv.includes('--apply');

async function fetchLeagueTeams(leagueName) {
  const url = `${SPORTSDB_BASE}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SportsDB HTTP ${res.status}`);
  const payload = await res.json();
  return Array.isArray(payload?.teams) ? payload.teams : [];
}

function toRow(team) {
  const name = String(team?.strTeam || '').trim();
  const badge = String(team?.strBadge || '').trim();
  const sportsDbId = String(team?.idTeam || '').trim();
  if (!name || !sportsDbId) return null;
  return {
    id: sportsDbId,
    name,
    sport: 'Football',
    league: 'National Team',
    stadium: '',
    logo_url: badge || null,
    banner_url: null,
    stadium_url: null,
    jersey_url: null,
    fanart_url: null
  };
}

async function main() {
  // Using FIFA World Cup list as a reliable national-team source on TheSportsDB.
  const teams = await fetchLeagueTeams('FIFA World Cup');
  const rows = teams.map(toRow).filter(Boolean);
  console.log(`[national-seed] fetched=${teams.length} rows=${rows.length} apply=${APPLY}`);
  if (!APPLY || !rows.length) return;

  // Upsert by id (SportsDB idTeam) to avoid duplicates.
  const { error } = await supabase.from('teams').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  // Cleanup: ensure no old local-id national teams remain
  const { error: delErr } = await supabase
    .from('teams')
    .delete()
    .ilike('league', '%National Team%')
    .not('id', 'in', `(${rows.map((r) => `"${r.id}"`).join(',')})`);
  if (delErr) {
    // not fatal; RLS/sql may block complex filter
    console.warn('[national-seed] cleanup skipped:', delErr.message);
  }

  const missingBadge = rows.filter((r) => !r.logo_url).length;
  console.log(`[national-seed] upserted=${rows.length} missingBadge=${missingBadge}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
