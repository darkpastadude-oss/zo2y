import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'sports-assets';
const TABLE_NAME = 'teams';
const USER_AGENT = 'Zo2ySportsSeeder/1.0 (+https://zo2y.com; support@zo2y.com)';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));
const FEATURED_LEAGUES = [
  'English Premier League',
  'English Championship',
  'English League One',
  'English League Two',
  'FA Cup',
  'EFL Cup',
  'Spanish La Liga',
  'Copa del Rey',
  'Italian Serie A',
  'Coppa Italia',
  'German Bundesliga',
  'DFB Pokal',
  'French Ligue 1',
  'Coupe de France',
  'UEFA Europa League',
  'UEFA Europa Conference League',
  'UEFA Nations League',
  'UEFA Super Cup',
  'CAF Champions League',
  'CAF Confederation Cup',
  'AFC Champions League',
  'AFC Asian Cup',
  'CONCACAF Champions Cup',
  'Copa Libertadores',
  'Copa Sudamericana',
  'Saudi Pro League',
  'Saudi Professional League',
  'Roshn Saudi League',
  'Saudi First Division League',
  'Saudi Women\'s Premier League',
  'Egyptian Premier League',
  'UAE Pro League',
  'Qatar Stars League',
  'Major League Soccer',
  'USL Championship',
  'NWSL',
  'MLS Cup',
  'Portuguese Primeira Liga',
  'Dutch Eredivisie',
  'Scottish Premiership',
  'Scottish Championship',
  'Turkish Super Lig',
  'Belgian Pro League',
  'Greek Super League',
  'Brazilian Serie A',
  'Argentine Primera Division',
  'Liga MX',
  'Indian Super League',
  'J1 League',
  'K League 1',
  'NBA',
  'NFL',
  'MLB',
  'Indian Premier League',
  'NHL',
  'WNBA',
  'NCAA Basketball',
  'NCAA Football',
  'Big Bash League',
  'Pakistan Super League',
  'AFL',
  'National Rugby League',
  'Super Rugby',
  'Formula 1',
  'MotoGP',
  'UEFA Champions League'
];
const FEATURED_COUNTRY_SWEEPS = [
  { sport: 'Soccer', country: 'Saudi Arabia' },
  { sport: 'Soccer', country: 'Spain' },
  { sport: 'Soccer', country: 'England' },
  { sport: 'Soccer', country: 'Germany' },
  { sport: 'Soccer', country: 'Italy' },
  { sport: 'Soccer', country: 'France' },
  { sport: 'Soccer', country: 'Portugal' },
  { sport: 'Soccer', country: 'Netherlands' },
  { sport: 'Soccer', country: 'Egypt' },
  { sport: 'Soccer', country: 'Brazil' },
  { sport: 'Soccer', country: 'Argentina' },
  { sport: 'Basketball', country: 'United States' },
  { sport: 'American Football', country: 'United States' },
  { sport: 'Baseball', country: 'United States' },
  { sport: 'Ice Hockey', country: 'Canada' },
  { sport: 'Cricket', country: 'India' },
  { sport: 'Cricket', country: 'Australia' },
  { sport: 'Rugby', country: 'New Zealand' }
];
const SEED_TEAMS = [
  'Liverpool',
  'Real Madrid',
  'FC Barcelona',
  'Manchester City',
  'Arsenal',
  'Manchester United',
  'Chelsea',
  'Bayern Munich',
  'Juventus',
  'Inter Milan',
  'AC Milan',
  'Paris Saint-Germain',
  'Al Ahly',
  'Al Hilal',
  'Raja Casablanca',
  'Kaizer Chiefs',
  'Al-Hilal',
  'Al-Nassr',
  'Al-Ahli',
  'Al-Ittihad',
  'Al-Ettifaq',
  'Al-Shabab',
  'Al-Taawoun',
  'Al-Fateh',
  'Boca Juniors',
  'Flamengo',
  'LA Galaxy',
  'Inter Miami',
  'Seattle Sounders',
  'Mumbai Indians',
  'Chennai Super Kings',
  'Kolkata Knight Riders',
  'Royal Challengers Bengaluru',
  'Los Angeles Lakers',
  'Golden State Warriors',
  'Boston Celtics',
  'Chicago Bulls',
  'New York Yankees',
  'Dallas Cowboys',
  'Toronto Maple Leafs',
  'Kansas City Chiefs'
];
const MAX_TEAMS = Number.parseInt((process.argv.find((arg) => arg.startsWith('--max=')) || '').split('=')[1] || '', 10) || 1000;
const CONCURRENCY = Number.parseInt((process.argv.find((arg) => arg.startsWith('--concurrency=')) || '').split('=')[1] || '', 10) || 4;
const LEAGUE_DELAY_MS = Number.parseInt((process.argv.find((arg) => arg.startsWith('--league-delay=')) || '').split('=')[1] || '', 10) || 600;
const FORCE_REFRESH = process.argv.includes('--refresh');
const SPORTSDB_KEY = String(process.env.SPORTSDB_API_KEY || process.env.SPORTSDB_KEY || process.env.THESPORTSDB_KEY || '3').trim() || '3';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
const TARGET_SPORTS = new Set([
  'Soccer',
  'Basketball',
  'American Football',
  'Baseball',
  'Ice Hockey',
  'Cricket',
  'Rugby',
  'Motorsport',
  'Motorcycling',
  'Volleyball',
  'Handball',
  'Field Hockey',
  'Lacrosse',
  'Aussie Rules',
  'Table Tennis',
  'Fighting'
]);

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
    if (!(key in process.env)) env[key] = value;
  });
  return env;
}

function hydrateEnv() {
  const merged = {};
  ENV_FILES.forEach((filePath) => Object.assign(merged, loadEnvFile(filePath)));
  Object.entries(merged).forEach(([key, value]) => {
    if (!(key in process.env)) process.env[key] = value;
  });
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function toHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('http://')) return raw.replace(/^http:\/\//i, 'https://');
  return raw;
}

function normalizeNameKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]+/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]+/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'team';
}

function getExtFromContentType(contentType = '', url = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  if (type.includes('gif')) return 'gif';
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1] || 'jpg';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000 + attempt * 1000);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        const retryDelay = response.status === 429
          ? (2500 + attempt * 2500)
          : (1000 + attempt * 1000);
        await sleep(retryDelay);
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      await sleep(1000 + attempt * 1200);
    }
  }
  throw lastError || new Error('Request failed');
}

async function fetchSportsDb(endpoint, params = {}) {
  const url = new URL(`${SPORTSDB_BASE}/${String(endpoint || '').replace(/^\/+/, '')}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  const response = await fetchWithRetry(url.toString(), {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) return null;
  return response.json();
}

async function downloadImage(sourceUrl) {
  const url = toHttpsUrl(sourceUrl);
  if (!url) return null;
  const response = await fetchWithRetry(url, {
    headers: { Accept: 'image/*,*/*' }
  }, 5);
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) return null;
  return {
    buffer,
    contentType,
    finalUrl: response.url || url
  };
}

function mapTeam(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const rawId = String(raw.idTeam || '').trim();
  const name = String(raw.strTeam || '').trim();
  if (!rawId && !name) return null;
  return {
    id: rawId || name,
    sportsDbId: rawId,
    name,
    sport: String(raw.strSport || '').trim(),
    league: String(raw.strLeague || '').trim(),
    country: String(raw.strCountry || '').trim(),
    stadium: String(raw.strStadium || '').trim(),
    badge: toHttpsUrl(raw.strBadge || raw.strTeamBadge || raw.strLogo || raw.strTeamLogo || ''),
    banner: toHttpsUrl(raw.strBanner || raw.strTeamBanner || ''),
    fanart: toHttpsUrl(
      raw.strFanart1 || raw.strFanart2 || raw.strFanart3 || raw.strFanart4 ||
      raw.strTeamFanart1 || raw.strTeamFanart2 || raw.strTeamFanart3 || ''
    ),
    stadiumImage: toHttpsUrl(raw.strStadiumThumb || ''),
    jersey: toHttpsUrl(raw.strEquipment || raw.strTeamJersey || '')
  };
}

function dedupeTeams(teams) {
  const byKey = new Map();
  (Array.isArray(teams) ? teams : []).forEach((team) => {
    const id = String(team?.sportsDbId || team?.id || '').trim();
    const nameKey = normalizeNameKey(team?.name || '');
    const key = id || nameKey;
    if (!key) return;
    const existing = byKey.get(key);
    const merged = existing ? {
      ...existing,
      ...team,
      badge: existing.badge || team.badge || '',
      banner: existing.banner || team.banner || '',
      fanart: existing.fanart || team.fanart || '',
      stadiumImage: existing.stadiumImage || team.stadiumImage || '',
      jersey: existing.jersey || team.jersey || ''
    } : team;
    byKey.set(key, merged);
  });
  return [...byKey.values()];
}

async function mapWithConcurrency(items, worker, concurrency = CONCURRENCY) {
  const values = Array.isArray(items) ? items : [];
  if (!values.length) return [];
  const results = new Array(values.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await worker(values[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: '12MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/json']
  });
  if (error) throw error;
}

async function uploadAsset(team, kind, sourceUrl) {
  const asset = await downloadImage(sourceUrl);
  if (!asset) return '';
  const ext = getExtFromContentType(asset.contentType, asset.finalUrl);
  const teamSlug = slugify(team.name || team.sportsDbId || team.id);
  const teamId = String(team.sportsDbId || team.id || teamSlug).trim();
  const remotePath = `${teamId}/${teamSlug}-${kind}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(remotePath, asset.buffer, {
    contentType: asset.contentType,
    upsert: true,
    cacheControl: '31536000'
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(remotePath).data.publicUrl;
}

async function fetchExistingManifest() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/manifest/sports-assets.json`)
    .catch(() => null);
  if (!response || !response.ok) return { teams: [] };
  return response.json().catch(() => ({ teams: [] }));
}

async function fetchLeagueCatalog() {
  try {
    const payload = await fetchSportsDb('all_leagues.php');
    const leagues = Array.isArray(payload?.leagues) ? payload.leagues : [];
    return leagues
      .filter((league) => TARGET_SPORTS.has(String(league?.strSport || '').trim()))
      .map((league) => ({
        name: String(league?.strLeague || '').trim(),
        alt: String(league?.strLeagueAlternate || '').trim(),
        sport: String(league?.strSport || '').trim()
      }))
      .filter((league) => league.name);
  } catch (error) {
    console.warn(`[sports-seed] league catalog skipped: ${error.message}`);
    return [];
  }
}

function getExistingManifestMap(payload) {
  const map = new Map();
  const rows = Array.isArray(payload?.teams) ? payload.teams : [];
  rows.forEach((row) => {
    const key = String(row?.sportsDbId || row?.id || '').trim() || normalizeNameKey(row?.name || '');
    if (key) map.set(key, row);
  });
  return map;
}

function buildLeaguePool(catalog = []) {
  const seen = new Set();
  const queue = [];
  const push = (leagueName) => {
    const normalized = normalizeNameKey(leagueName);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    queue.push(leagueName);
  };
  FEATURED_LEAGUES.forEach(push);
  catalog.forEach((league) => {
    push(league.name);
    push(league.alt);
  });
  return queue;
}

function buildCountrySweepPool() {
  const seen = new Set();
  const queue = [];
  FEATURED_COUNTRY_SWEEPS.forEach((entry) => {
    const sport = String(entry?.sport || '').trim();
    const country = String(entry?.country || '').trim();
    const key = `${normalizeNameKey(sport)}::${normalizeNameKey(country)}`;
    if (!sport || !country || seen.has(key)) return;
    seen.add(key);
    queue.push({ sport, country });
  });
  return queue;
}

async function collectTeams(existingRows = []) {
  const collected = Array.isArray(existingRows) ? existingRows.map((row) => ({
    id: row.id || row.sportsDbId || row.name,
    sportsDbId: row.sportsDbId || row.id || '',
    name: row.name,
    sport: row.sport || '',
    league: row.league || '',
    country: row.country || '',
    stadium: row.stadium || '',
    badge: row.badge || '',
    banner: row.banner || '',
    fanart: row.fanart || '',
    stadiumImage: row.stadiumImage || row.stadium_url || '',
    jersey: row.jersey || ''
  })) : [];
  let uniqueCount = dedupeTeams(collected).length;
  const leaguePool = buildLeaguePool(await fetchLeagueCatalog());
  for (const league of leaguePool) {
    try {
      const payload = await fetchSportsDb('search_all_teams.php', { l: league });
      const teams = Array.isArray(payload?.teams) ? payload.teams.map(mapTeam).filter(Boolean) : [];
      collected.push(...teams);
      console.log(`[sports-seed] league ${league}: ${teams.length}`);
      uniqueCount = dedupeTeams(collected).length;
    } catch (error) {
      console.warn(`[sports-seed] league ${league} skipped: ${error.message}`);
    }
    if (uniqueCount >= MAX_TEAMS) break;
    await sleep(LEAGUE_DELAY_MS);
  }
  if (uniqueCount < MAX_TEAMS) {
    const countrySweeps = buildCountrySweepPool();
    for (const sweep of countrySweeps) {
      try {
        const payload = await fetchSportsDb('search_all_teams.php', {
          s: sweep.sport,
          c: sweep.country
        });
        const teams = Array.isArray(payload?.teams) ? payload.teams.map(mapTeam).filter(Boolean) : [];
        collected.push(...teams);
        console.log(`[sports-seed] country ${sweep.country} / ${sweep.sport}: ${teams.length}`);
        uniqueCount = dedupeTeams(collected).length;
      } catch (error) {
        console.warn(`[sports-seed] country ${sweep.country} / ${sweep.sport} skipped: ${error.message}`);
      }
      if (uniqueCount >= MAX_TEAMS) break;
      await sleep(LEAGUE_DELAY_MS);
    }
  }
  if (uniqueCount < MAX_TEAMS) {
    const seedResults = await mapWithConcurrency(SEED_TEAMS, async (teamName) => {
      try {
        const payload = await fetchSportsDb('searchteams.php', { t: teamName });
        const raw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
        return mapTeam(raw);
      } catch (error) {
        console.warn(`[sports-seed] seed ${teamName} skipped: ${error.message}`);
        return null;
      }
    }, 3);
    collected.push(...seedResults.filter(Boolean));
    uniqueCount = dedupeTeams(collected).length;
  }
  return dedupeTeams(collected).slice(0, MAX_TEAMS);
}

async function upsertTeamRow(team) {
  const payload = {
    id: team.sportsDbId || team.id,
    name: team.name,
    sport: team.sport || null,
    league: team.league || null,
    logo_url: team.badge || null,
    banner_url: team.banner || null,
    stadium: team.stadium || null,
    stadium_url: team.stadiumImage || null,
    jersey_url: team.jersey || null,
    fanart_url: team.fanart || null
  };
  const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn(`[sports-seed] team upsert failed for ${team.name}: ${error.message}`);
  }
}

async function seedTeamAssets(team, existingRow) {
  const seeded = {
    id: team.sportsDbId || team.id || team.name,
    sportsDbId: team.sportsDbId || team.id || '',
    name: team.name,
    sport: team.sport || '',
    league: team.league || '',
    country: team.country || '',
    stadium: team.stadium || '',
    badge: existingRow?.badge || '',
    banner: existingRow?.banner || '',
    fanart: existingRow?.fanart || '',
    stadiumImage: existingRow?.stadiumImage || existingRow?.stadium_url || '',
    jersey: existingRow?.jersey || ''
  };
  const assets = [
    ['badge', team.badge],
    ['banner', team.banner],
    ['fanart', team.fanart],
    ['stadiumImage', team.stadiumImage],
    ['jersey', team.jersey]
  ];
  for (const [kind, url] of assets) {
    if (!FORCE_REFRESH && seeded[kind]) continue;
    if (!url) continue;
    try {
      seeded[kind] = await uploadAsset(team, kind, url);
    } catch (error) {
      console.warn(`[sports-seed] ${team.name} ${kind} skipped: ${error.message}`);
    }
  }
  await upsertTeamRow(seeded);
  console.log(`[sports-seed] seeded ${seeded.name}`);
  return seeded;
}

async function main() {
  await ensureBucket();
  const existingManifest = await fetchExistingManifest();
  const existingMap = getExistingManifestMap(existingManifest);
  const existingRows = Array.isArray(existingManifest?.teams) ? existingManifest.teams : [];
  const teams = await collectTeams(existingRows);
  console.log(`[sports-seed] collected ${teams.length} unique teams`);
  const seededTeams = await mapWithConcurrency(teams, async (team) => {
    const key = String(team.sportsDbId || team.id || '').trim() || normalizeNameKey(team.name || '');
    return seedTeamAssets(team, existingMap.get(key));
  }, CONCURRENCY);
  const manifest = {
    savedAt: new Date().toISOString(),
    teams: seededTeams.filter(Boolean)
  };
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const { error } = await supabase.storage.from(BUCKET_NAME).upload('manifest/sports-assets.json', buffer, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '300'
  });
  if (error) throw error;
  console.log(`[sports-seed] manifest uploaded with ${manifest.teams.length} teams`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
