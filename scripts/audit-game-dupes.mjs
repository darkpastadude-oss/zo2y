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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
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

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*video game[^)]*\)/g, ' ')
    .replace(/\b(remastered|remaster|definitive edition|complete edition|ultimate edition|game of the year edition|goty|director'?s cut)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalYear(row) {
  const releaseYear = String(row?.release_date || '').slice(0, 4);
  return /^\d{4}$/.test(releaseYear) ? releaseYear : '';
}

function scoreRow(row) {
  let score = 0;
  const importedFrom = String(row?.extra?.imported_from || row?.source || '').toLowerCase();
  if (String(row?.cover_url || '').includes('/covers-official/') && row?.extra?.official_cover_is_poster) score += 500;
  if (importedFrom.includes('wikipedia') || importedFrom.includes('igdb')) score += 250;
  if (row?.rating_count) score += Math.min(200, Number(row.rating_count || 0) / 100);
  if (row?.rating) score += Math.min(50, Number(row.rating || 0) * 5);
  if (canonicalYear(row)) score += 15;
  return score;
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
      .select('id,title,slug,release_date,source,cover_url,rating,rating_count,extra')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const outputPath = path.join(ROOT, 'tmp', 'game-duplicate-report.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const rows = await fetchAllGames();
  const groups = new Map();
  for (const row of rows) {
    const key = `${normalizeTitle(row.title)}|${canonicalYear(row)}`;
    if (!key || key.startsWith('|')) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const report = Array.from(groups.entries())
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => {
      const sorted = list.slice().sort((a, b) => scoreRow(b) - scoreRow(a));
      return {
        key,
        count: list.length,
        keepId: sorted[0]?.id || null,
        rows: sorted.map((row) => ({
          id: row.id,
          title: row.title,
          release_date: row.release_date,
          source: row.source,
          score: scoreRow(row),
          cover_url: row.cover_url,
          official_cover_is_poster: Boolean(row?.extra?.official_cover_is_poster)
        }))
      };
    })
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));

  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalGames: rows.length,
    duplicateGroups: report.length,
    groups: report
  }, null, 2));

  console.log(JSON.stringify({
    totalGames: rows.length,
    duplicateGroups: report.length,
    outputPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
