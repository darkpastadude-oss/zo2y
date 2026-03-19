import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'brand-backgrounds';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));
const DEFAULT_TABLES = ['fashion_brands', 'food_brands', 'car_brands'];
const TABLE_LIMIT = 5000;
const argvTables = process.argv
  .filter((arg) => arg.startsWith('--table='))
  .flatMap((arg) => arg.split('=')[1].split(','))
  .map((value) => value.trim())
  .filter(Boolean);
const TABLES = argvTables.length ? argvTables : DEFAULT_TABLES;
const concurrencyArg = Number.parseInt((process.argv.find((arg) => arg.startsWith('--concurrency=')) || '').split('=')[1] || '', 10);
const CONCURRENCY = Number.isFinite(concurrencyArg) && concurrencyArg > 0 ? concurrencyArg : 6;
const FETCH_TIMEOUT_MS = 7000;
const FORCE_REFRESH = process.argv.includes('--refresh');
const TITLE_OVERRIDES = new Map([
  ['mcdonalds', "McDonald's"], ['mcdonald\'s', "McDonald's"], ['burger king', 'Burger King'], ['kfc', 'KFC'],
  ['chipotle', 'Chipotle Mexican Grill'], ['subway', 'Subway (restaurant)'], ['taco bell', 'Taco Bell'], ['domino\'s', "Domino's"],
  ['dominos', "Domino's"], ['pizza hut', 'Pizza Hut'], ['starbucks', 'Starbucks'], ['nike', 'Nike, Inc.'], ['adidas', 'Adidas'],
  ['h&m', 'H&M'], ['hm', 'H&M'], ['off-white', 'Off-White (brand)'], ['off white', 'Off-White (brand)'],
  ['supreme', 'Supreme (skateboard shop)'], ['zara', 'Zara (retailer)'], ['uniqlo', 'Uniqlo'], ['a.p.c.', 'A.P.C.'],
  ['aerie', 'Aerie (brand)'], ['& other stories', '& Other Stories'], ['alfa romeo', 'Alfa Romeo'], ['aston martin', 'Aston Martin'],
  ['bentley', 'Bentley'], ['mercedes-benz', 'Mercedes-Benz'], ['bmw', 'BMW'], ['audi', 'Audi'], ['ford', 'Ford Motor Company'],
  ['chevrolet', 'Chevrolet'], ['toyota', 'Toyota'], ['honda', 'Honda']
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
function normalizeDomain(value) {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
}
function sanitizeFileBase(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'background';
}
function getWikiTitle(name) {
  const key = String(name || '').trim().toLowerCase();
  return TITLE_OVERRIDES.get(key) || name;
}
function absolutizeUrl(value, base) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try { return new URL(raw, base).toString(); } catch { return ''; }
}
function getExtFromContentType(contentType = '', url = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  if (type.includes('gif')) return 'gif';
  const pathname = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ''; } })();
  const extMatch = pathname.match(/\.([a-z0-9]{2,5})$/i);
  return extMatch?.[1] || 'jpg';
}
function isLikelyUsefulImage(url) {
  const raw = String(url || '').toLowerCase();
  if (!raw) return false;
  return !raw.includes('logo') && !raw.includes('icon');
}
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
async function fetchHtml(url) {
  const res = await fetchWithTimeout(url, { redirect: 'follow', headers: { 'user-agent': 'Zo2yBrandBackgroundSeeder/1.0' } });
  if (!res.ok) throw new Error(`html ${res.status}`);
  return { html: await res.text(), finalUrl: res.url };
}
function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const absolute = absolutizeUrl(match[1], baseUrl);
      if (absolute) return absolute;
    }
  }
  return '';
}
async function resolveDomainImage(domain) {
  const candidates = [`https://${domain}`, `https://www.${domain}`];
  for (const candidate of candidates) {
    try {
      const { html, finalUrl } = await fetchHtml(candidate);
      const ogImage = extractOgImage(html, finalUrl || candidate);
      if (ogImage && isLikelyUsefulImage(ogImage)) return ogImage;
    } catch {}
  }
  return '';
}
async function resolveWikipediaThumbnail(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const res = await fetchWithTimeout(summaryUrl, { headers: { 'user-agent': 'Zo2yBrandBackgroundSeeder/1.0' } });
  if (!res.ok) return '';
  const payload = await res.json();
  return absolutizeUrl(payload?.originalimage?.source || payload?.thumbnail?.source || '', 'https://en.wikipedia.org/');
}
async function downloadImageBuffer(url) {
  const res = await fetchWithTimeout(url, { redirect: 'follow', headers: { 'user-agent': 'Zo2yBrandBackgroundSeeder/1.0' } }, 10000);
  if (!res.ok) throw new Error(`image ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType, finalUrl: res.url || url };
}
async function mapWithConcurrency(items, worker, concurrency = CONCURRENCY) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

hydrateEnv();
const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME);
  if (data) return;
  await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: '8MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  });
}
async function uploadBackground(table, row, imageUrl) {
  const { buffer, contentType, finalUrl } = await downloadImageBuffer(imageUrl);
  const ext = getExtFromContentType(contentType, finalUrl || imageUrl);
  const slug = sanitizeFileBase(row.slug || row.name || row.id);
  const remotePath = `${table}/${slug}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(remotePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '31536000'
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(remotePath).data.publicUrl;
}

async function main() {
  await ensureBucket();
  const manifestUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/manifest/brand-backgrounds.json`;
  const existingManifest = await fetch(manifestUrl)
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
  const manifest = { ...existingManifest };
  for (const table of TABLES) {
    manifest[table] = { ...(existingManifest?.[table] || {}) };
    const { data, error } = await supabase.from(table).select('id,name,slug,domain').limit(TABLE_LIMIT);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    await mapWithConcurrency(rows, async (row) => {
      const slug = sanitizeFileBase(row.slug || row.name || row.id);
      if (!FORCE_REFRESH && manifest[table]?.[slug]) return manifest[table][slug];
      try {
        const domain = normalizeDomain(row.domain);
        const title = getWikiTitle(row.name);
        const imageUrl = (domain ? await resolveDomainImage(domain) : '') || await resolveWikipediaThumbnail(title);
        if (!imageUrl) return null;
        const publicUrl = await uploadBackground(table, row, imageUrl);
        manifest[table][slug] = publicUrl;
        console.log(`[brand-bg] ${table}/${slug} -> ${publicUrl}`);
        return publicUrl;
      } catch (error) {
        console.warn(`[brand-bg] skip ${table}/${slug}: ${error.message}`);
        return null;
      }
    });
  }
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const { error: manifestError } = await supabase.storage.from(BUCKET_NAME).upload('manifest/brand-backgrounds.json', manifestBuffer, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '300'
  });
  if (manifestError) throw manifestError;
  console.log('manifest uploaded');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
