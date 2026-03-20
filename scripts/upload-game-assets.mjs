import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const BUCKET_NAME = 'game-assets';
const MANIFEST_PATH = 'manifest/game-assets.json';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const FETCH_TIMEOUT_MS = 10000;
const MAX_SCREENSHOTS = 2;
const RAWG_API_BASE = 'https://api.rawg.io/api';
const RAWG_BACKUP_KEY = '83b2a55ac54c4c1db7099212e740f680';

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

function resolveRawgApiKey() {
  return String(
    process.env.RAWG_API_KEY ||
    process.env.RAWG_KEY ||
    RAWG_BACKUP_KEY ||
    ''
  ).trim();
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
    .replace(/^-+|-+$/g, '') || 'game';
}

function getExt(contentType = '', url = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('svg')) return 'svg';
  const match = String(url || '').split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || 'jpg';
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

async function download(url) {
  const response = await fetchWithTimeout(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Zo2yGameAssetSeeder/1.0' }
  }, 12000);
  if (!response.ok) throw new Error(`fetch ${response.status}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('not-image');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer || buffer.length < 512) throw new Error('tiny-image');
  return { buffer, contentType, finalUrl: response.url || url };
}

function extractScreenshotCandidates(row) {
  const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
  const candidates = [
    ...(Array.isArray(row?.screenshots) ? row.screenshots : []),
    ...(Array.isArray(extra?.screenshots) ? extra.screenshots : []),
    ...(Array.isArray(row?.short_screenshots) ? row.short_screenshots.map((entry) => entry?.image) : []),
    ...(Array.isArray(extra?.short_screenshots) ? extra.short_screenshots.map((entry) => entry?.image) : [])
  ];
  const seen = new Set();
  const output = [];
  candidates.forEach((value) => {
    const url = toHttpsUrl(value);
    if (!url || seen.has(url)) return;
    seen.add(url);
    output.push(url);
  });
  return output.slice(0, MAX_SCREENSHOTS);
}

async function fetchRawgMedia(row) {
  const rawgKey = resolveRawgApiKey();
  const rawgId = Number(row?.rawg_id || row?.extra?.source_item_id || 0);
  if (!rawgKey || !Number.isFinite(rawgId) || rawgId <= 0) return null;
  const url = new URL(`${RAWG_API_BASE}/games/${rawgId}`);
  url.searchParams.set('key', rawgKey);
  const response = await fetchWithTimeout(url.toString(), {
    headers: { 'user-agent': 'Zo2yGameAssetSeeder/1.0' }
  }, 12000);
  if (!response.ok) throw new Error(`rawg ${response.status}`);
  const payload = await response.json();
  const screenshots = Array.isArray(payload?.short_screenshots)
    ? payload.short_screenshots.map((entry) => entry?.image).filter(Boolean)
    : [];
  return {
    cover: toHttpsUrl(payload?.background_image || ''),
    hero: toHttpsUrl(payload?.background_image_additional || payload?.background_image || ''),
    screenshots: screenshots.map((value) => toHttpsUrl(value)).filter(Boolean).slice(0, MAX_SCREENSHOTS)
  };
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

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET_NAME);
  const config = {
    public: true,
    fileSizeLimit: '15MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/json']
  };
  if (data) {
    await supabase.storage.updateBucket(BUCKET_NAME, config);
    return;
  }
  await supabase.storage.createBucket(BUCKET_NAME, config);
}

async function uploadAsset(remotePath, sourceUrl) {
  const { buffer, contentType, finalUrl } = await download(sourceUrl);
  const ext = getExt(contentType, finalUrl || sourceUrl);
  const storagePath = `${remotePath}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '31536000'
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath).data.publicUrl;
}

async function main() {
  await ensureBucket();
  const limit = Math.max(1, Number(parseArg('--limit', 1000)));
  const concurrency = Math.max(1, Number(parseArg('--concurrency', 4)));
  const offset = Math.max(0, Number(parseArg('--offset', 0)));
  const missingOnly = ['1', 'true', 'yes', 'on'].includes(String(parseArg('--missing-only', '')).trim().toLowerCase());
  const manifest = { generatedAt: new Date().toISOString(), games: {} };
  let query = supabase
    .from('games')
    .select('id,title,slug,cover_url,hero_url,extra,rawg_id,source,rating_count,rating')
    .order('rating_count', { ascending: false, nullsFirst: false })
    .order('rating', { ascending: false, nullsFirst: false });
  if (missingOnly) query = query.or('cover_url.is.null,hero_url.is.null,cover_url.eq.,hero_url.eq.');
  query = query.range(offset, offset + limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  let cursor = 0;

  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      if (!row) continue;
      const slug = sanitizeFileBase(row.slug || row.title || row.id);
      let coverSrc = toHttpsUrl(row.cover_url);
      let heroSrc = toHttpsUrl(row.hero_url) || coverSrc;
      let screenshotSrcs = extractScreenshotCandidates(row);
      const entry = { id: row.id, slug, cover: '', hero: '', screenshots: [] };
      const patch = {};
      try {
        if ((!coverSrc || !heroSrc || !screenshotSrcs.length) && (Number(row.rawg_id) > 0 || Number(row?.extra?.source_item_id) > 0)) {
          try {
            const rawgMedia = await fetchRawgMedia(row);
            if (rawgMedia) {
              coverSrc = coverSrc || rawgMedia.cover;
              heroSrc = heroSrc || rawgMedia.hero || rawgMedia.cover;
              if (!screenshotSrcs.length) screenshotSrcs = rawgMedia.screenshots;
            }
          } catch {
            // Keep going with whatever media the row already has.
          }
        }
        if (coverSrc) {
          const localCover = await uploadAsset(`covers/${slug}`, coverSrc);
          patch.cover_url = localCover;
          entry.cover = localCover;
        }
        if (heroSrc) {
          const localHero = await uploadAsset(`heroes/${slug}`, heroSrc);
          patch.hero_url = localHero;
          entry.hero = localHero;
        } else if (patch.cover_url) {
          patch.hero_url = patch.cover_url;
          entry.hero = patch.cover_url;
        }
        for (let index = 0; index < screenshotSrcs.length; index += 1) {
          try {
            const localShot = await uploadAsset(`screens/${slug}-${index + 1}`, screenshotSrcs[index]);
            entry.screenshots.push(localShot);
          } catch {
            // Ignore one-off screenshot failures while keeping the cover/hero.
          }
        }
        const extra = row.extra && typeof row.extra === 'object' ? { ...row.extra } : {};
        if (entry.screenshots.length) extra.local_screenshots = entry.screenshots;
        if (Object.keys(patch).length || entry.screenshots.length) {
          patch.extra = extra;
          const { error: updateError } = await supabase.from('games').update(patch).eq('id', row.id);
          if (updateError) throw updateError;
        }
        manifest.games[String(row.id)] = entry;
        console.log(`[game-assets] ${slug}`);
      } catch (error) {
        console.warn(`[game-assets] skip ${slug}: ${error.message}`);
      }
      await sleep(120);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const fullRows = [];
  let fullOffset = 0;
  const pageSize = 1000;
  while (true) {
    const { data: pageRows, error: fullRowsError } = await supabase
      .from('games')
      .select('id,slug,cover_url,hero_url,extra')
      .or('cover_url.not.is.null,hero_url.not.is.null')
      .range(fullOffset, fullOffset + pageSize - 1);
    if (fullRowsError) throw fullRowsError;
    if (!Array.isArray(pageRows) || !pageRows.length) break;
    fullRows.push(...pageRows);
    if (pageRows.length < pageSize) break;
    fullOffset += pageRows.length;
  }
  manifest.generatedAt = new Date().toISOString();
  manifest.games = {};
  (Array.isArray(fullRows) ? fullRows : []).forEach((row) => {
    const cover = toHttpsUrl(row?.cover_url);
    const hero = toHttpsUrl(row?.hero_url);
    const extra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
    const screenshots = Array.isArray(extra.local_screenshots)
      ? extra.local_screenshots.map((value) => toHttpsUrl(value)).filter(Boolean)
      : [];
    if (!cover && !hero && !screenshots.length) return;
    manifest.games[String(row.id)] = {
      id: row.id,
      slug: sanitizeFileBase(row.slug || row.id),
      cover,
      hero: hero || cover,
      screenshots
    };
  });

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const { error: manifestError } = await supabase.storage.from(BUCKET_NAME).upload(MANIFEST_PATH, manifestBuffer, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '300'
  });
  if (manifestError) throw manifestError;
  console.log(`manifest uploaded (${Object.keys(manifest.games).length} games)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
