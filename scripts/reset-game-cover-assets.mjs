import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'game-assets';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const COVER_PREFIXES = ['covers', 'covers-official'];

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

async function listAllObjects(storage, prefix) {
  const files = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await storage.list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    for (const entry of batch) {
      if (!entry?.name) continue;
      files.push(`${prefix}/${entry.name}`);
    }
    if (batch.length < limit) break;
    offset += limit;
  }
  return files;
}

async function removeInChunks(storage, paths, chunkSize = 100) {
  let removed = 0;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    const { error } = await storage.remove(chunk);
    if (error) throw error;
    removed += chunk.length;
  }
  return removed;
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

async function main() {
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--dry-run', '')).trim().toLowerCase());
  const storage = supabase.storage.from(BUCKET_NAME);
  const deleted = {};

  for (const prefix of COVER_PREFIXES) {
    const files = await listAllObjects(storage, prefix);
    deleted[prefix] = files.length;
    if (!dryRun && files.length) {
      await removeInChunks(storage, files);
    }
  }

  const filter = ['cover_url.like.%/game-assets/covers/%', 'cover_url.like.%/game-assets/covers-official/%'].join(',');
  const { count: beforeCount, error: countError } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .or(filter);
  if (countError) throw countError;
  if (!dryRun) {
    const { error: updateError } = await supabase
      .from('games')
      .update({ cover_url: null })
      .or(filter);
    if (updateError) throw updateError;
  }
  const clearedRows = Number(beforeCount || 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    games: {}
  };
  if (!dryRun) {
    const { error: uploadError } = await storage.upload('manifest/game-assets.json', Buffer.from(JSON.stringify(manifest, null, 2)), {
      contentType: 'application/json',
      cacheControl: '60',
      upsert: true
    });
    if (uploadError) throw uploadError;
  }

  console.log(JSON.stringify({
    dryRun,
    deleted,
    clearedRows,
    manifestReset: true
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
