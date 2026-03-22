import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const REPORT_PATH = path.join(ROOT, 'tmp', 'game-duplicate-report.json');

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

async function fetchAllGameIds() {
  const ids = new Set();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('games').select('id').range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    batch.forEach((row) => ids.add(row.id));
    if (batch.length < pageSize) break;
  }
  return ids;
}

async function main() {
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--dry-run', 'true')).trim().toLowerCase());
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const keepMap = new Map();
  for (const group of Array.isArray(report?.groups) ? report.groups : []) {
    for (const row of Array.isArray(group?.rows) ? group.rows : []) {
      if (row?.id && row.id !== group.keepId) keepMap.set(String(row.id), group.keepId);
    }
  }

  const liveIds = await fetchAllGameIds();
  const { data, error } = await supabase.from('game_list_items').select('id,game_id');
  if (error) throw error;
  const items = Array.isArray(data) ? data : [];
  const orphanRows = items.filter((row) => !liveIds.has(row.game_id));

  let remapped = 0;
  let deleted = 0;
  for (const row of orphanRows) {
    const keepId = keepMap.get(String(row.game_id));
    if (keepId && liveIds.has(keepId)) {
      if (!dryRun) {
        const { error: updateError } = await supabase.from('game_list_items').update({ game_id: keepId }).eq('id', row.id);
        if (updateError) throw updateError;
      }
      remapped += 1;
    } else {
      if (!dryRun) {
        const { error: deleteError } = await supabase.from('game_list_items').delete().eq('id', row.id);
        if (deleteError) throw deleteError;
      }
      deleted += 1;
    }
  }

  console.log(JSON.stringify({
    dryRun,
    orphanRows: orphanRows.length,
    remapped,
    deleted
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
