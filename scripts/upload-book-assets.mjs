import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'book-assets';
const MANIFEST_PATH = 'manifest/book-assets.json';
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
    env[key] = value;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, 'https://');
  if (raw.startsWith('//')) return `https:${raw}`;
  return '';
}

function sanitizeFileBase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'book';
}

function getExt(contentType = '', url = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  const match = String(url || '').split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || 'jpg';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function download(url) {
  const response = await fetchWithTimeout(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Zo2yBookAssetSeeder/1.0' }
  }, 12000);
  if (!response.ok) throw new Error(`fetch ${response.status}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('not-image');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer || buffer.length < 512) throw new Error('tiny-image');
  return { buffer, contentType, finalUrl: response.url || url };
}

async function main() {
  hydrateEnv();
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const limit = Math.max(1, Number(parseArg('--limit', 1500)));
  const offset = Math.max(0, Number(parseArg('--offset', 0)));
  const concurrency = Math.max(1, Number(parseArg('--concurrency', 5)));
  const missingOnly = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--missing-only', '')).trim().toLowerCase());

  try {
    await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: '10MB' });
  } catch (_error) {}

  let query = supabase
    .from('books')
    .select('id,title,thumbnail')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (missingOnly) query = query.not('thumbnail', 'like', `%/${BUCKET_NAME}/%`);
  const { data, error } = await query;
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];

  const manifest = {};
  const queue = rows.slice();

  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      if (!row) continue;
      const sourceUrl = toHttpsUrl(row.thumbnail);
      if (!sourceUrl) continue;
      const fileBase = sanitizeFileBase(`${row.id}-${row.title}`);
      try {
        const { buffer, contentType, finalUrl } = await download(sourceUrl);
        const ext = getExt(contentType, finalUrl || sourceUrl);
        const remoteBase = `covers/${fileBase}.${ext}`;
        await supabase.storage.from(BUCKET_NAME).upload(remoteBase, buffer, {
          upsert: true,
          contentType,
          cacheControl: '31536000'
        });
        const localUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${remoteBase}`;
        const { error: patchError } = await supabase.from('books').update({
          thumbnail: localUrl,
          updated_at: new Date().toISOString()
        }).eq('id', row.id);
        if (patchError) throw patchError;
        manifest[row.id] = { cover: localUrl, title: row.title };
        console.log(`[book-assets] ${fileBase}`);
        await sleep(40);
      } catch (err) {
        console.warn(`[book-assets] skip ${fileBase}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const { data: allRows, error: allError } = await supabase
    .from('books')
    .select('id,title,thumbnail')
    .like('thumbnail', `%/${BUCKET_NAME}/%`);
  if (allError) throw allError;
  const allManifest = {};
  (allRows || []).forEach((row) => {
    const cover = toHttpsUrl(row.thumbnail);
    if (!cover) return;
    allManifest[row.id] = { cover, title: row.title };
  });

  await supabase.storage.from(BUCKET_NAME).upload(MANIFEST_PATH, Buffer.from(JSON.stringify(allManifest, null, 2), 'utf8'), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '300'
  });

  console.log(`manifest uploaded (${Object.keys(allManifest).length} books)`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
