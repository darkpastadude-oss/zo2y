import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
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

async function listObjects(storage, prefix) {
  const items = [];
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
    batch.forEach((entry) => {
      if (!entry?.name || entry.name.endsWith('/')) return;
      items.push({
        path: `${prefix}/${entry.name}`,
        metadata: entry.metadata || {},
        name: entry.name
      });
    });
    if (batch.length < limit) break;
    offset += limit;
  }
  return items;
}

function resolveBounds(bucket, prefix) {
  const value = `${bucket}/${prefix}`.toLowerCase();
  if (value.includes('book-assets/covers')) return { width: 1400, height: 2100 };
  if (value.includes('covers-official') || value.includes('/covers')) return { width: 1600, height: 2400 };
  return { width: 1920, height: 1080 };
}

function isTransformableImage(pathname, contentType = '') {
  const pathValue = String(pathname || '').toLowerCase();
  const typeValue = String(contentType || '').toLowerCase();
  if (pathValue.endsWith('.svg') || typeValue.includes('svg')) return false;
  if (pathValue.endsWith('.gif') || typeValue.includes('gif')) return false;
  return /\.(png|jpg|jpeg|webp)$/i.test(pathValue) || typeValue.startsWith('image/');
}

async function optimizeBuffer(buffer, { width, height, quality }) {
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality,
      effort: 4
    })
    .toBuffer();
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
  const bucket = String(parseArg('--bucket', '')).trim();
  const prefixes = String(parseArg('--prefixes', '')).split(',').map((value) => value.trim()).filter(Boolean);
  const quality = Math.max(60, Math.min(90, Number(parseArg('--quality', '80')) || 80));
  const limit = Math.max(1, Number(parseArg('--limit', '1000')) || 1000);
  const minSavingsRatio = Math.max(0, Math.min(0.95, Number(parseArg('--min-savings-ratio', '0.92')) || 0.92));
  const dryRun = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--dry-run', 'true')).trim().toLowerCase());

  if (!bucket || !prefixes.length) {
    throw new Error('Usage: node scripts/recompress-storage-bucket.mjs --bucket=<bucket> --prefixes=<a,b,c> [--dry-run=true]');
  }

  const storage = supabase.storage.from(bucket);
  const allObjects = [];
  for (const prefix of prefixes) {
    const objects = await listObjects(storage, prefix);
    allObjects.push(...objects);
  }

  const targets = allObjects
    .filter((entry) => isTransformableImage(entry.path, entry.metadata?.mimetype || entry.metadata?.contentType || ''))
    .slice(0, limit);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  const failedPaths = [];

  for (const entry of targets) {
    processed += 1;
    try {
      const source = await storage.download(entry.path);
      if (source.error) {
        skipped += 1;
        continue;
      }
      const inputBuffer = Buffer.from(await source.data.arrayBuffer());
      if (!inputBuffer.length) {
        skipped += 1;
        continue;
      }
      const prefix = entry.path.split('/')[0] || '';
      const optimizedBuffer = await optimizeBuffer(inputBuffer, {
        ...resolveBounds(bucket, prefix),
        quality
      });
      bytesBefore += inputBuffer.length;
      bytesAfter += optimizedBuffer.length;

      if (optimizedBuffer.length >= Math.floor(inputBuffer.length * minSavingsRatio)) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        const { error } = await storage.update(entry.path, optimizedBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });
        if (error) throw error;
      }
      updated += 1;
    } catch (error) {
      failed += 1;
      failedPaths.push({
        path: entry.path,
        error: String(error?.message || error)
      });
    }
  }

  const outputPath = path.join(ROOT, 'tmp', `recompress-${bucket}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    bucket,
    prefixes,
    dryRun,
    processed,
    updated,
    skipped,
    failed,
    bytesBefore,
    bytesAfter,
    estimatedSavingsBytes: Math.max(0, bytesBefore - bytesAfter),
    failedPaths: failedPaths.slice(0, 50)
  }, null, 2));

  console.log(JSON.stringify({
    bucket,
    prefixes,
    dryRun,
    processed,
    updated,
    skipped,
    failed,
    bytesBefore,
    bytesAfter,
    estimatedSavingsBytes: Math.max(0, bytesBefore - bytesAfter),
    outputPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
