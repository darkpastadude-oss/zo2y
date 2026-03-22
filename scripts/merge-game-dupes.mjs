import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const REPORT_PATH = fs.existsSync(path.join(ROOT, 'tmp', 'game-duplicate-report.json'))
  ? path.join(ROOT, 'tmp', 'game-duplicate-report.json')
  : path.join(path.resolve(SCRIPT_DIR, '..'), 'tmp', 'game-duplicate-report.json');

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

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const PLATFORM_VARIANT_TOKENS = [
  'nintendo ds',
  'game boy advance',
  'gamecube',
  'wii',
  'wii u',
  'nintendo switch',
  'playstation',
  'xbox',
  'psp',
  'ps vita',
  'dreamcast',
  'saturn',
  'mega drive',
  'sega cd',
  'mobile phone',
  'java',
  'arcade'
];

function normalizeMergeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(remastered|remaster|definitive edition|complete edition|ultimate edition|game of the year edition|goty|director'?s cut)\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlatformVariantTitle(value) {
  const normalized = String(value || '').toLowerCase();
  return PLATFORM_VARIANT_TOKENS.some((token) => normalized.includes(token));
}

function isSafeMergeGroup(group) {
  const rows = Array.isArray(group?.rows) ? group.rows : [];
  if (!rows.length) return false;
  if (rows.some((row) => isPlatformVariantTitle(row?.title))) return false;
  const canonicalTitles = Array.from(new Set(rows.map((row) => normalizeMergeTitle(row?.title)).filter(Boolean)));
  if (canonicalTitles.length > 1) return false;
  const years = Array.from(new Set(rows.map((row) => String(row?.release_date || '').slice(0, 4)).filter(Boolean)));
  if (years.length > 1) return false;
  return true;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env');
}

if (!fs.existsSync(REPORT_PATH)) {
  throw new Error(`Missing duplicate report: ${REPORT_PATH}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function updateRef(table, fromId, toId, dryRun) {
  if (dryRun) return;
  const { error } = await supabase.from(table).update({ game_id: toId }).eq('game_id', fromId);
  if (error) throw error;
}

async function main() {
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--dry-run', 'true')).trim().toLowerCase());
  const limit = Math.max(1, Number(parseArg('--limit', 100)));
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const safeGroups = Array.isArray(report?.groups) ? report.groups.filter((group) => isSafeMergeGroup(group)) : [];
  const groups = safeGroups.slice(0, limit);

  let mergedRows = 0;
  for (const group of groups) {
    const keepId = group?.keepId;
    const rows = Array.isArray(group?.rows) ? group.rows : [];
    const removeIds = rows.map((row) => row.id).filter((id) => id && id !== keepId);
    for (const fromId of removeIds) {
      await updateRef('game_list_items', fromId, keepId, dryRun);
      await updateRef('game_reviews', fromId, keepId, dryRun);
    }
    if (!dryRun && removeIds.length) {
      const { error } = await supabase.from('games').delete().in('id', removeIds);
      if (error) throw error;
    }
    mergedRows += removeIds.length;
  }

  console.log(JSON.stringify({
    dryRun,
    groupsProcessed: groups.length,
    mergedRows
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
