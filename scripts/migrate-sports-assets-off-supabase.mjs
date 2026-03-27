import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'sports-assets';
const MANIFEST_PATH = 'manifest/sports-assets.json';
const TABLE_NAME = 'teams';
const USER_AGENT = 'Zo2ySportsMigration/1.0 (+https://zo2y.com)';
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.vercel',
  '.env.vercel.prod',
  '.vercel/.env.production.local'
].map((file) => path.join(ROOT, file));
const SPORTSDB_KEY = String(process.env.SPORTSDB_API_KEY || process.env.SPORTSDB_KEY || process.env.THESPORTSDB_KEY || '3').trim() || '3';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
const CONCURRENCY = Math.max(1, Number.parseInt((process.argv.find((arg) => arg.startsWith('--concurrency=')) || '').split('=')[1] || '', 10) || 4);
const DELETE_BATCH_SIZE = Math.max(20, Number.parseInt((process.argv.find((arg) => arg.startsWith('--delete-batch=')) || '').split('=')[1] || '', 10) || 100);
const DRY_RUN = process.argv.includes('--dry-run');
const KEEP_BADGES_ONLY = process.argv.includes('--keep-badges-only');

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
  if (String(value).startsWith('http')) return String(value).trim();
  return `https://${String(value).trim()}.supabase.co`;
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

function toHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('http://')) return raw.replace(/^http:\/\//i, 'https://');
  return raw;
}

function pickPrimaryImage(row) {
  if (!row || typeof row !== 'object') return '';
  return toHttpsUrl(
    row.badge ||
    row.logo_url ||
    row.banner ||
    row.banner_url ||
    row.fanart ||
    row.fanart_url ||
    row.stadiumImage ||
    row.stadium_url ||
    row.jersey ||
    row.jersey_url ||
    ''
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes) || 0;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000 + attempt * 1500);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          Accept: 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        await sleep(1200 + attempt * 1400);
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      await sleep(900 + attempt * 1100);
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
  const response = await fetchWithRetry(url.toString());
  if (!response.ok) return null;
  return response.json();
}

function mapTeam(raw, fallback = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const sportsDbId = String(raw.idTeam || fallback.sportsDbId || fallback.id || '').trim();
  const name = String(raw.strTeam || fallback.name || '').trim();
  if (!sportsDbId && !name) return null;
  return {
    id: sportsDbId || name,
    sportsDbId,
    name,
    sport: String(raw.strSport || fallback.sport || '').trim(),
    league: String(raw.strLeague || fallback.league || '').trim(),
    country: String(raw.strCountry || fallback.country || '').trim(),
    stadium: String(raw.strStadium || fallback.stadium || '').trim(),
    badge: toHttpsUrl(raw.strBadge || raw.strTeamBadge || raw.strLogo || raw.strTeamLogo || fallback.badge || fallback.logo_url || ''),
    banner: toHttpsUrl(raw.strBanner || raw.strTeamBanner || fallback.banner || fallback.banner_url || ''),
    fanart: toHttpsUrl(
      raw.strFanart1 || raw.strFanart2 || raw.strFanart3 || raw.strFanart4 ||
      raw.strTeamFanart1 || raw.strTeamFanart2 || raw.strTeamFanart3 ||
      fallback.fanart || fallback.fanart_url || ''
    ),
    stadiumImage: toHttpsUrl(raw.strStadiumThumb || fallback.stadiumImage || fallback.stadiumThumb || fallback.stadium_url || ''),
    jersey: toHttpsUrl(raw.strEquipment || raw.strTeamJersey || fallback.jersey || fallback.jersey_url || '')
  };
}

function scoreTeamMatch(raw, criteria = {}) {
  if (!raw || typeof raw !== 'object') return -1;
  let score = 0;
  const nameNeedle = normalizeNameKey(criteria.name || '');
  const teamName = normalizeNameKey(raw.strTeam || raw.name || '');
  if (nameNeedle) {
    if (teamName === nameNeedle) score += 6;
    else if (teamName.includes(nameNeedle) || nameNeedle.includes(teamName)) score += 3;
  }
  const leagueNeedle = normalizeNameKey(criteria.league || '');
  const teamLeague = normalizeNameKey(raw.strLeague || raw.league || '');
  if (leagueNeedle) {
    if (teamLeague === leagueNeedle) score += 3;
    else if (teamLeague.includes(leagueNeedle) || leagueNeedle.includes(teamLeague)) score += 1;
  }
  const sportNeedle = normalizeNameKey(criteria.sport || '');
  const teamSport = normalizeNameKey(raw.strSport || raw.sport || '');
  if (sportNeedle) {
    if (teamSport === sportNeedle) score += 2;
    else if (teamSport.includes(sportNeedle) || sportNeedle.includes(teamSport)) score += 1;
  }
  const countryNeedle = normalizeNameKey(criteria.country || '');
  const teamCountry = normalizeNameKey(raw.strCountry || raw.country || '');
  if (countryNeedle) {
    if (teamCountry === countryNeedle) score += 2;
    else if (teamCountry.includes(countryNeedle) || countryNeedle.includes(teamCountry)) score += 1;
  }
  return score;
}

function pickBestTeamMatch(teams, criteria) {
  const list = Array.isArray(teams) ? teams : [];
  if (!list.length) return null;
  let best = list[0];
  let bestScore = scoreTeamMatch(best, criteria);
  list.slice(1).forEach((team) => {
    const score = scoreTeamMatch(team, criteria);
    if (score > bestScore) {
      best = team;
      bestScore = score;
    }
  });
  return best;
}

function publicUrlToBucketPath(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const publicMarker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const renderMarker = `/storage/v1/render/image/public/${BUCKET_NAME}/`;
  const marker = raw.includes(publicMarker) ? publicMarker : (raw.includes(renderMarker) ? renderMarker : '');
  if (!marker) return '';
  return raw.slice(raw.indexOf(marker) + marker.length).split('?')[0].trim();
}

async function storageApi(pathName, options = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}${pathName}`, {
        ...options,
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${response.status} ${response.statusText} ${pathName}\n${text}`);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error;
      if (attempt >= 3) break;
      await sleep(700 + attempt * 1200);
    }
  }
  throw lastError || new Error(`Storage API request failed: ${pathName}`);
}

async function listBucketRecursive(bucketName) {
  const queue = [''];
  const files = [];
  const seen = new Set(['']);
  while (queue.length) {
    const prefix = queue.shift();
    let offset = 0;
    while (true) {
      const rows = await storageApi(`/storage/v1/object/list/${bucketName}`, {
        method: 'POST',
        body: JSON.stringify({
          prefix,
          limit: 1000,
          offset,
          sortBy: { column: 'name', order: 'asc' }
        })
      });
      (Array.isArray(rows) ? rows : []).forEach((entry) => {
        if (entry?.id === null) {
          const childPrefix = prefix ? `${prefix}/${entry.name}` : String(entry.name || '').trim();
          if (childPrefix && !seen.has(childPrefix)) {
            seen.add(childPrefix);
            queue.push(childPrefix);
          }
          return;
        }
        files.push({
          path: prefix ? `${prefix}/${entry.name}` : String(entry.name || '').trim(),
          size: Number(entry?.metadata?.size || 0)
        });
      });
      if (!Array.isArray(rows) || rows.length < 1000) break;
      offset += rows.length;
    }
  }
  return files.filter((file) => file.path);
}

async function fetchExistingManifestRows() {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${MANIFEST_PATH}`, {
      headers: { 'user-agent': USER_AGENT, Accept: 'application/json' }
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.teams) ? payload.teams : [];
  } catch {
    return [];
  }
}

function mergeRows(manifestRows, teamRows) {
  const byKey = new Map();
  const addRow = (row) => {
    if (!row || typeof row !== 'object') return;
    const id = String(row.sportsDbId || row.id || '').trim();
    const name = String(row.name || '').trim();
    const key = id || normalizeNameKey(name);
    if (!key) return;
    const existing = byKey.get(key) || {};
    byKey.set(key, {
      ...existing,
      ...row,
      id: id || existing.id || name,
      sportsDbId: id || existing.sportsDbId || '',
      name: name || existing.name || '',
      sport: String(row.sport || existing.sport || '').trim(),
      league: String(row.league || existing.league || '').trim(),
      country: String(row.country || existing.country || '').trim(),
      stadium: String(row.stadium || existing.stadium || '').trim(),
      badge: toHttpsUrl(row.badge || row.logo_url || existing.badge || existing.logo_url || ''),
      banner: toHttpsUrl(row.banner || row.banner_url || existing.banner || existing.banner_url || ''),
      fanart: toHttpsUrl(row.fanart || row.fanart_url || existing.fanart || existing.fanart_url || ''),
      stadiumImage: toHttpsUrl(row.stadiumImage || row.stadium_url || existing.stadiumImage || existing.stadium_url || ''),
      jersey: toHttpsUrl(row.jersey || row.jersey_url || existing.jersey || existing.jersey_url || '')
    });
  };
  (Array.isArray(manifestRows) ? manifestRows : []).forEach(addRow);
  (Array.isArray(teamRows) ? teamRows : []).forEach(addRow);
  return [...byKey.values()];
}

async function refreshTeamAssets(row) {
  const criteria = {
    name: row.name,
    league: row.league,
    sport: row.sport,
    country: row.country
  };
  let mapped = null;
  const sportsDbId = String(row.sportsDbId || row.id || '').trim();
  if (sportsDbId) {
    const payload = await fetchSportsDb('lookupteam.php', { id: sportsDbId }).catch(() => null);
    const teamRaw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
    mapped = mapTeam(teamRaw, row);
  }
  if (!mapped && row.name) {
    const payload = await fetchSportsDb('searchteams.php', { t: row.name }).catch(() => null);
    const teams = Array.isArray(payload?.teams) ? payload.teams : [];
    const best = pickBestTeamMatch(teams, criteria);
    mapped = mapTeam(best, row);
  }
  return mapped || {
    ...row,
    id: String(row.id || row.sportsDbId || row.name).trim(),
    sportsDbId: String(row.sportsDbId || row.id || '').trim(),
    name: String(row.name || '').trim(),
    sport: String(row.sport || '').trim(),
    league: String(row.league || '').trim(),
    country: String(row.country || '').trim(),
    stadium: String(row.stadium || '').trim(),
    badge: toHttpsUrl(row.badge || row.logo_url || ''),
    banner: toHttpsUrl(row.banner || row.banner_url || ''),
    fanart: toHttpsUrl(row.fanart || row.fanart_url || ''),
    stadiumImage: toHttpsUrl(row.stadiumImage || row.stadium_url || ''),
    jersey: toHttpsUrl(row.jersey || row.jersey_url || '')
  };
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
      await sleep(160);
    }
  });
  await Promise.all(runners);
  return results;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const beforeFiles = await listBucketRecursive(BUCKET_NAME);
  const beforeBytes = beforeFiles.reduce((sum, file) => sum + file.size, 0);
  console.log(`[sports-migrate] bucket before: ${beforeFiles.length} files, ${formatBytes(beforeBytes)}`);

  const [manifestRows, teamTableRows] = await Promise.all([
    fetchExistingManifestRows(),
    supabase
      .from(TABLE_NAME)
      .select('id,name,sport,league,stadium,logo_url,banner_url,fanart_url,stadium_url,jersey_url')
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
  ]);

  const mergedRows = mergeRows(manifestRows, teamTableRows);
  console.log(`[sports-migrate] processing ${mergedRows.length} team records`);

  const refreshedRows = KEEP_BADGES_ONLY
    ? mergedRows.map((row) => ({
        ...row,
        badge: pickPrimaryImage(row),
        banner: '',
        fanart: '',
        stadiumImage: '',
        jersey: ''
      })).sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
    : (await mapWithConcurrency(mergedRows, async (row) => refreshTeamAssets(row), CONCURRENCY))
        .filter(Boolean)
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));

  const upsertPayload = refreshedRows.map((row) => ({
    id: String(row.sportsDbId || row.id || row.name).trim(),
    name: String(row.name || '').trim() || null,
    sport: String(row.sport || '').trim() || null,
    league: String(row.league || '').trim() || null,
    logo_url: row.badge || null,
    banner_url: row.banner || null,
    stadium: String(row.stadium || '').trim() || null,
    stadium_url: row.stadiumImage || null,
    jersey_url: row.jersey || null,
    fanart_url: row.fanart || null
  })).filter((row) => row.id);

  if (!DRY_RUN && upsertPayload.length) {
    const chunkSize = 200;
    for (let index = 0; index < upsertPayload.length; index += chunkSize) {
      const chunk = upsertPayload.slice(index, index + chunkSize);
      const { error } = await supabase.from(TABLE_NAME).upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  const manifestPayload = {
    savedAt: new Date().toISOString(),
    teams: refreshedRows.map((row) => ({
      id: String(row.id || row.sportsDbId || row.name).trim(),
      sportsDbId: String(row.sportsDbId || row.id || '').trim(),
      name: String(row.name || '').trim(),
      sport: String(row.sport || '').trim(),
      league: String(row.league || '').trim(),
      country: String(row.country || '').trim(),
      stadium: String(row.stadium || '').trim(),
      badge: row.badge || '',
      banner: row.banner || '',
      fanart: row.fanart || '',
      stadiumImage: row.stadiumImage || '',
      jersey: row.jersey || ''
    }))
  };

  if (!DRY_RUN) {
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(
      MANIFEST_PATH,
      Buffer.from(JSON.stringify(manifestPayload, null, 2), 'utf8'),
      { contentType: 'application/json', cacheControl: '300', upsert: true }
    );
    if (error) throw error;
  }

  const protectedPaths = new Set([MANIFEST_PATH]);
  refreshedRows.forEach((row) => {
    [row.badge, row.banner, row.fanart, row.stadiumImage, row.jersey].forEach((url) => {
      const bucketPath = publicUrlToBucketPath(url);
      if (bucketPath) protectedPaths.add(bucketPath);
    });
  });

  const deleteCandidates = beforeFiles.filter((file) => !protectedPaths.has(file.path));
  const deleteBytes = deleteCandidates.reduce((sum, file) => sum + file.size, 0);
  console.log(`[sports-migrate] delete candidates: ${deleteCandidates.length} files, ${formatBytes(deleteBytes)}`);

  if (!DRY_RUN && deleteCandidates.length) {
    for (let index = 0; index < deleteCandidates.length; index += DELETE_BATCH_SIZE) {
      const chunk = deleteCandidates.slice(index, index + DELETE_BATCH_SIZE).map((file) => file.path);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(chunk);
      if (error) throw error;
    }
  }

  const afterFiles = DRY_RUN ? beforeFiles : await listBucketRecursive(BUCKET_NAME);
  const afterBytes = DRY_RUN
    ? beforeBytes - deleteBytes
    : afterFiles.reduce((sum, file) => sum + file.size, 0);
  console.log(`[sports-migrate] bucket after: ${afterFiles.length} files, ${formatBytes(afterBytes)}`);
  console.log(`[sports-migrate] estimated freed: ${formatBytes(Math.max(0, beforeBytes - afterBytes))}`);
  console.log(`[sports-migrate] mode: ${DRY_RUN ? 'dry-run' : 'live'}${KEEP_BADGES_ONLY ? ' keep-badges-only' : ''}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
