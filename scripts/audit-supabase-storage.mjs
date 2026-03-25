import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.vercel',
  '.env.vercel.prod',
  '.vercel/.env.production.local',
  'backend/.env'
].map((file) => path.join(ROOT, file));

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
  if (String(value).startsWith('http')) return String(value);
  return `https://${value}.supabase.co`;
}

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function summarizeByPrefix(fileRecords, depth = 1, limit = 20) {
  const map = new Map();
  for (const record of fileRecords) {
    const parts = String(record.path || '').split('/').filter(Boolean);
    const key = parts.slice(0, depth).join('/') || '(root)';
    const existing = map.get(key) || { prefix: key, bytes: 0, files: 0 };
    existing.bytes += Number(record.size || 0);
    existing.files += 1;
    map.set(key, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.bytes - a.bytes || b.files - a.files || a.prefix.localeCompare(b.prefix))
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      prettyBytes: formatBytes(entry.bytes)
    }));
}

async function listRecursive(storage, prefix = '') {
  const queue = [String(prefix || '').trim().replace(/^\/+|\/+$/g, '')];
  const files = [];
  const seenPrefixes = new Set(queue);

  while (queue.length) {
    const currentPrefix = queue.shift() || '';
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data, error } = await storage.list(currentPrefix, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });
      if (error) throw error;
      const batch = Array.isArray(data) ? data : [];
      for (const entry of batch) {
        if (!entry?.name) continue;
        const childPath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;
        const hasSize = Number.isFinite(Number(entry?.metadata?.size));
        const isFile = hasSize || Boolean(entry?.metadata?.mimetype || entry?.metadata?.contentType);
        if (isFile) {
          files.push({
            path: childPath,
            size: Number(entry?.metadata?.size || 0),
            mimetype: String(entry?.metadata?.mimetype || entry?.metadata?.contentType || '')
          });
          continue;
        }
        if (!seenPrefixes.has(childPath)) {
          seenPrefixes.add(childPath);
          queue.push(childPath);
        }
      }
      if (batch.length < limit) break;
      offset += limit;
    }
  }

  return files;
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
  const bucketFilter = String(parseArg('--bucket', '')).trim();
  const prefixFilter = String(parseArg('--prefix', '')).trim().replace(/^\/+|\/+$/g, '');
  const topLimit = Math.max(5, Number(parseArg('--top', '20')) || 20);

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) throw bucketError;

  const selectedBuckets = (Array.isArray(buckets) ? buckets : [])
    .filter((bucket) => !bucketFilter || String(bucket?.name || '').trim() === bucketFilter);

  const results = [];
  for (const bucket of selectedBuckets) {
    const bucketName = String(bucket?.name || '').trim();
    if (!bucketName) continue;
    const files = await listRecursive(supabase.storage.from(bucketName), prefixFilter);
    const totalBytes = files.reduce((sum, record) => sum + Number(record.size || 0), 0);
    results.push({
      bucket: bucketName,
      prefix: prefixFilter || '',
      totalFiles: files.length,
      totalBytes,
      prettyBytes: formatBytes(totalBytes),
      topLevel: summarizeByPrefix(files, 1, topLimit),
      topLevelDepth2: summarizeByPrefix(files, 2, topLimit)
    });
  }

  results.sort((a, b) => b.totalBytes - a.totalBytes || b.totalFiles - a.totalFiles || a.bucket.localeCompare(b.bucket));

  const payload = {
    generatedAt: new Date().toISOString(),
    bucketFilter,
    prefixFilter,
    grandTotalBytes: results.reduce((sum, item) => sum + Number(item.totalBytes || 0), 0),
    grandTotalPretty: formatBytes(results.reduce((sum, item) => sum + Number(item.totalBytes || 0), 0)),
    buckets: results
  };

  const outPath = path.join(ROOT, 'tmp', `supabase-storage-audit${bucketFilter ? `-${bucketFilter}` : ''}${prefixFilter ? `-${prefixFilter.replace(/[\\/]+/g, '-')}` : ''}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  console.log(JSON.stringify({
    outPath,
    grandTotalBytes: payload.grandTotalBytes,
    grandTotalPretty: payload.grandTotalPretty,
    buckets: results.map((item) => ({
      bucket: item.bucket,
      totalFiles: item.totalFiles,
      totalBytes: item.totalBytes,
      prettyBytes: item.prettyBytes
    }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
