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

const MANIFEST_PATH = path.join(ROOT, 'assets/sports-badges/local-manifest.json');
let LOCAL_MANIFEST = {};
try { LOCAL_MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch (_) {}
const LOCAL_MANIFEST_LOWER = {};
Object.entries(LOCAL_MANIFEST).forEach(([n, p]) => { LOCAL_MANIFEST_LOWER[n.toLowerCase()] = p; });

const BADGE_OVERRIDES = {
  'atletico madrid': '/assets/sports-badges/atletico-madrid.png',
  'psg': '/assets/sports-badges/psg.png',
  'paris saint germain': '/assets/sports-badges/psg.png',
  'sao paulo': '/assets/sports-badges/s-o-paulo.png',
  'al hilal': '/assets/sports-badges/al-hilal.png',
  'al nassr': '/assets/sports-badges/al-nassr.png',
  'al ahly': '/assets/sports-badges/al-ahly.png',
  'ferrari': '/assets/sports-badges/scuderia-ferrari-hp.png',
  'scuderia ferrari hp': '/assets/sports-badges/scuderia-ferrari-hp.png',
  'red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
  'oracle red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
  'mercedes': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
  'mercedes-amg petronas formula one team': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
  'mclaren': '/assets/sports-badges/mclaren-formula-1-team.png',
  'mclaren formula 1 team': '/assets/sports-badges/mclaren-formula-1-team.png',
  'aston martin': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
  'aston martin aramco formula one team': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
  'alpine': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
  'bwt alpine formula one team': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
  'williams': '/assets/sports-badges/williams-racing.png',
  'williams racing': '/assets/sports-badges/williams-racing.png',
  'rb': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
  'racing bulls': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
  'visa cash app rb': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
  'visa cash app racing bulls': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
  'kick sauber': '/assets/sports-badges/kick-sauber.png',
  'stake f1 team kick sauber': '/assets/sports-badges/kick-sauber.png',
  'haas': '/assets/sports-badges/moneygram-haas-f1-team.png',
  'moneygram haas f1 team': '/assets/sports-badges/moneygram-haas-f1-team.png',
  'audi': '/assets/sports-badges/audi-revolut-f1-team.png',
  'audi revolut f1 team': '/assets/sports-badges/audi-revolut-f1-team.png',
  'cadillac': '/assets/sports-badges/cadillac-formula-1-team.png',
  'cadillac formula 1 team': '/assets/sports-badges/cadillac-formula-1-team.png'
};

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

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isMissingLogo(url) {
  const v = String(url || '').trim();
  return !v || v === '/file.svg';
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let index = 0;
  const runners = new Array(concurrency).fill(0).map(async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPORTSDB_KEY = String(process.env.SPORTSDB_API_KEY || process.env.SPORTSDB_KEY || process.env.THESPORTSDB_KEY || '3').trim() || '3';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;

const APPLY = process.argv.includes('--apply');
const LIMIT = Number.parseInt((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '', 10) || 0;
const START = Number.parseInt((process.argv.find((a) => a.startsWith('--start=')) || '').split('=')[1] || '', 10) || 0;
const CONCURRENCY = Number.parseInt((process.argv.find((a) => a.startsWith('--concurrency=')) || '').split('=')[1] || '', 10) || 6;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
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
      .select('id,name,sport,league,logo_url', { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: true });
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
    if (offset > 20000) break;
  }
  return out;
}

const searchCache = new Map();
async function searchTeamByName(name) {
  const key = normalize(name);
  if (searchCache.has(key)) return searchCache.get(key);
  const url = `${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(name)}`;
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(url);
    if (res.status === 429 && attempt <= 6) {
      const delayMs = Math.min(15000, 500 * Math.pow(2, attempt - 1));
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }
    if (!res.ok) throw new Error(`SportsDB HTTP ${res.status}`);
    const payload = await res.json();
    const teams = Array.isArray(payload?.teams) ? payload.teams : [];
    searchCache.set(key, teams);
    return teams;
  }
}

function pickBestMatch(row, candidates) {
  const leagueNorm = normalize(row.league);
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  const exactLeague = candidates.find((t) => normalize(t.strLeague) === leagueNorm);
  if (exactLeague) return exactLeague;
  const containsLeague = candidates.find((t) => normalize(t.strLeague).includes(leagueNorm) || leagueNorm.includes(normalize(t.strLeague)));
  if (containsLeague) return containsLeague;
  return candidates[0];
}

function stripDiacritics(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function slugMatch(s) { return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

function resolveLocalBadge(team) {
  const key = normalize(team.name);
  if (BADGE_OVERRIDES[key]) return BADGE_OVERRIDES[key];
  if (LOCAL_MANIFEST[team.name]) return LOCAL_MANIFEST[team.name];
  if (LOCAL_MANIFEST_LOWER[key]) return LOCAL_MANIFEST_LOWER[key];
  const slugged = slugMatch(team.name);
  const exact = Object.keys(LOCAL_MANIFEST_LOWER).find(k => slugMatch(k) === slugged);
  if (exact) return LOCAL_MANIFEST_LOWER[exact];
  const sorted = Object.keys(LOCAL_MANIFEST_LOWER).sort((a, b) => b.length - a.length);
  for (const mk of sorted) {
    const mkSlug = slugMatch(mk);
    if (mkSlug.length >= 4 && (slugged.includes(mkSlug) || mkSlug.includes(slugged))) {
      return LOCAL_MANIFEST_LOWER[mk];
    }
  }
  return '';
}

async function main() {
  const rows = await fetchAllTeams();
  const missing = rows.filter((r) => r?.name && isMissingLogo(r.logo_url));
  const sliced = missing.slice(Math.max(0, START));
  const targets = LIMIT > 0 ? sliced.slice(0, LIMIT) : sliced;

  console.log(`[sportsdb-backfill] total=${rows.length} missing=${missing.length} targets=${targets.length} apply=${APPLY}`);
  if (!targets.length) return;

  const updates = [];
  let errors = 0;

  const localResolved = targets.filter(r => {
    const badge = resolveLocalBadge(r);
    if (badge) { updates.push({ id: r.id, logo_url: badge }); }
    return !!badge;
  });

  const sportsdbTargets = targets.filter(r => !localResolved.find(u => u.id === r.id));
  console.log(`[sportsdb-backfill] local=${localResolved.length} sportsdb=${sportsdbTargets.length}`);

  await mapWithConcurrency(sportsdbTargets, async (row) => {
    try {
      const candidates = await searchTeamByName(row.name);
      const match = pickBestMatch(row, candidates);
      const badge = String(match?.strBadge || match?.strTeamBadge || '').trim();
      if (!badge) return;
      updates.push({ id: row.id, logo_url: badge });
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.warn('[sportsdb-backfill] error sample:', row?.name, err?.message || err);
      }
    }
  }, CONCURRENCY);

  console.log(`[sportsdb-backfill] resolved=${updates.length}/${targets.length} errors=${errors}`);
  if (!APPLY || !updates.length) return;

  let done = 0;
  for (const batch of chunk(updates, 50)) {
    for (const item of batch) {
      const { error } = await supabase.from('teams').update({ logo_url: item.logo_url }).eq('id', item.id);
      if (error) throw error;
      done++;
      if (done % 25 === 0) console.log(`[sportsdb-backfill] updated ${done}/${updates.length}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
