import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));

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

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(remastered|remaster|definitive edition|complete edition|ultimate edition|game of the year edition|goty|director'?s cut|bundle|collection)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalYear(row) {
  const releaseYear = String(row?.release_date || '').slice(0, 4);
  return /^\d{4}$/.test(releaseYear) ? releaseYear : '';
}

function hasUsefulCover(row) {
  const value = String(row?.cover_url || '').trim().toLowerCase();
  if (!value) return false;
  if (value.includes('/newlogo.webp')) return false;
  if (value.includes('placeholder')) return false;
  return true;
}

function scoreRow(row) {
  let score = 0;
  if (hasUsefulCover(row)) score += 1000;
  if (String(row?.cover_url || '').includes('/covers-official/') && row?.extra?.official_cover_is_poster) score += 500;
  if (String(row?.hero_url || '').trim()) score += 60;
  if (row?.rating_count) score += Math.min(200, Number(row.rating_count || 0) / 100);
  if (row?.rating) score += Math.min(50, Number(row.rating || 0) * 5);
  if (canonicalYear(row)) score += 20;
  return score;
}

async function updateRef(supabase, table, fromId, toId, dryRun) {
  if (dryRun) return;
  const { error } = await supabase.from(table).update({ game_id: toId }).eq('game_id', fromId);
  if (error) throw error;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function fetchAllGames() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,release_date,source,cover_url,hero_url,rating,rating_count,extra')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--dry-run', 'true')).trim().toLowerCase());
  const limit = Math.max(1, Number(parseArg('--limit', '10000')) || 10000);
  const rows = await fetchAllGames();
  const groups = new Map();

  rows.forEach((row) => {
    const titleKey = normalizeTitle(row?.title || row?.slug || '');
    const yearKey = canonicalYear(row);
    if (!titleKey || !yearKey) return;
    const key = `${titleKey}|${yearKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  const actionableGroups = [];
  groups.forEach((groupRows, key) => {
    if (!Array.isArray(groupRows) || groupRows.length < 2) return;
    const covered = groupRows.filter(hasUsefulCover).sort((a, b) => scoreRow(b) - scoreRow(a));
    if (!covered.length) return;
    const keep = covered[0];
    const remove = groupRows
      .filter((row) => row.id !== keep.id && !hasUsefulCover(row))
      .sort((a, b) => scoreRow(a) - scoreRow(b));
    if (!remove.length) return;
    actionableGroups.push({ key, keep, remove, rows: groupRows });
  });

  let processedGroups = 0;
  let deletedRows = 0;
  for (const group of actionableGroups.slice(0, limit)) {
    processedGroups += 1;
    for (const row of group.remove) {
      await updateRef(supabase, 'game_list_items', row.id, group.keep.id, dryRun);
      await updateRef(supabase, 'game_reviews', row.id, group.keep.id, dryRun);
    }
    const removeIds = group.remove.map((row) => row.id).filter(Boolean);
    if (!dryRun && removeIds.length) {
      const { error } = await supabase.from('games').delete().in('id', removeIds);
      if (error) throw error;
    }
    deletedRows += removeIds.length;
  }

  const sample = actionableGroups.slice(0, 20).map((group) => ({
    key: group.key,
    keepId: group.keep.id,
    keepTitle: group.keep.title,
    removeIds: group.remove.map((row) => row.id),
    removeTitles: group.remove.map((row) => row.title)
  }));

  const outputPath = path.join(ROOT, 'tmp', 'coverless-game-dupe-cleanup.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    dryRun,
    totalGames: rows.length,
    actionableGroups: actionableGroups.length,
    processedGroups,
    deletedRows,
    sample
  }, null, 2));

  console.log(JSON.stringify({
    dryRun,
    totalGames: rows.length,
    actionableGroups: actionableGroups.length,
    processedGroups,
    deletedRows,
    outputPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
