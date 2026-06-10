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

const LOCAL_LOGOS = {
  'argentina': '/assets/logos/football/national-teams/ar.png',
  'australia': '/assets/logos/football/national-teams/au.svg',
  'belgium': '/assets/logos/football/national-teams/be.png',
  'bolivia': '/assets/logos/football/national-teams/bo.png',
  'brazil': '/assets/logos/football/national-teams/br.png',
  'cameroon': '/assets/logos/football/national-teams/cm.png',
  'canada': '/assets/logos/football/national-teams/ca.png',
  'china': '/assets/logos/football/national-teams/cn.png',
  'colombia': '/assets/logos/football/national-teams/co.png',
  'costa rica': '/assets/logos/football/national-teams/cr.png',
  'croatia': '/assets/logos/football/national-teams/hr.png',
  'czech republic': '/assets/logos/football/national-teams/cz.png',
  'denmark': '/assets/logos/football/national-teams/dk.png',
  'ecuador': '/assets/logos/football/national-teams/ec.png',
  'egypt': '/assets/logos/football/national-teams/eg.png',
  'england': '/assets/logos/football/national-teams/gb-eng.png',
  'finland': '/assets/logos/football/national-teams/fi.png',
  'france': '/assets/logos/football/national-teams/fr.png',
  'germany': '/assets/logos/football/national-teams/de.svg',
  'ghana': '/assets/logos/football/national-teams/gh.png',
  'greece': '/assets/logos/football/national-teams/gr.png',
  'honduras': '/assets/logos/football/national-teams/hn.png',
  'hungary': '/assets/logos/football/national-teams/hu.png',
  'iceland': '/assets/logos/football/national-teams/is.svg',
  'india': '/assets/logos/football/national-teams/in.png',
  'indonesia': '/assets/logos/football/national-teams/id.png',
  'iran': '/assets/logos/football/national-teams/ir.png',
  'ireland': '/assets/logos/football/national-teams/ie.png',
  'italy': '/assets/logos/football/national-teams/it.png',
  'jamaica': '/assets/logos/football/national-teams/jm.png',
  'japan': '/assets/logos/football/national-teams/jp.png',
  'mexico': '/assets/logos/football/national-teams/mx.png',
  'morocco': '/assets/logos/football/national-teams/ma.png',
  'netherlands': '/assets/logos/football/national-teams/nl.png',
  'new zealand': '/assets/logos/football/national-teams/nz.svg',
  'nigeria': '/assets/logos/football/national-teams/ng.svg',
  'norway': '/assets/logos/football/national-teams/no.png',
  'panama': '/assets/logos/football/national-teams/pa.png',
  'paraguay': '/assets/logos/football/national-teams/py.png',
  'peru': '/assets/logos/football/national-teams/pe.png',
  'poland': '/assets/logos/football/national-teams/pl.png',
  'portugal': '/assets/logos/football/national-teams/pt.png',
  'qatar': '/assets/logos/football/national-teams/qa.png',
  'romania': '/assets/logos/football/national-teams/ro.png',
  'saudi arabia': '/assets/logos/football/national-teams/sa.svg',
  'scotland': '/assets/logos/football/national-teams/gb-sct.png',
  'senegal': '/assets/logos/football/national-teams/sn.png',
  'serbia': '/assets/logos/football/national-teams/rs.png',
  'south africa': '/assets/logos/football/national-teams/za.png',
  'south korea': '/assets/logos/football/national-teams/kr.png',
  'spain': '/assets/logos/football/national-teams/es.png',
  'sweden': '/assets/logos/football/national-teams/se.svg',
  'switzerland': '/assets/logos/football/national-teams/ch.png',
  'thailand': '/assets/logos/football/national-teams/th.png',
  'tunisia': '/assets/logos/football/national-teams/tn.png',
  'turkey': '/assets/logos/football/national-teams/tr.png',
  'uae': '/assets/logos/football/national-teams/ae.png',
  'ukraine': '/assets/logos/football/national-teams/ua.png',
  'uruguay': '/assets/logos/football/national-teams/uy.png',
  'usa': '/assets/logos/football/national-teams/us.png',
  'venezuela': '/assets/logos/football/national-teams/ve.png',
  'vietnam': '/assets/logos/football/national-teams/vn.png',
  'wales': '/assets/logos/football/national-teams/gb-wls.png',
  'algeria': '/assets/logos/football/national-teams/dz.png',
  'austria': '/assets/logos/football/national-teams/at.png'
};

function toRow(team) {
  const name = String(team?.strTeam || '').trim();
  const sportsDbId = String(team?.idTeam || '').trim();
  if (!name || !sportsDbId) return null;
  const localLogo = LOCAL_LOGOS[name.toLowerCase()] || null;
  return {
    id: sportsDbId,
    name,
    sport: 'Football',
    league: 'National Team',
    stadium: '',
    logo_url: localLogo,
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
