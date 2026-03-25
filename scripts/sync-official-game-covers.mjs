import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { fetchWikipediaGamesList } from '../backend/lib/wiki-games-provider.js';

const ROOT = process.cwd();
const BUCKET_NAME = 'game-assets';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const FETCH_TIMEOUT_MS = 15000;

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

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function sanitizeFileBase(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'game';
}

function normalizeTitleKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(value) {
  return normalizeTitleKey(value).split(/\s+/).filter(Boolean);
}

function scoreSearchMatch(group, candidate) {
  const candidateTitle = String(candidate?.title || candidate?.name || '').trim();
  const candidateKey = normalizeTitleKey(candidateTitle);
  if (!candidateKey) return Number.NEGATIVE_INFINITY;
  const coverUrl = normalizeCoverUrl(candidate?.cover_url || candidate?.cover || candidate?.image || '');
  if (!coverUrl || isLikelyBackdropUrl(coverUrl)) return Number.NEGATIVE_INFINITY;

  let best = Number.NEGATIVE_INFINITY;
  for (const row of group) {
    const rowTitle = String(row?.title || '').trim();
    const rowKey = normalizeTitleKey(rowTitle);
    if (!rowKey) continue;

    let score = 0;
    if (candidateKey === rowKey) score += 1000;
    if (candidateKey.startsWith(rowKey) || rowKey.startsWith(candidateKey)) score += 400;

    const rowTerms = titleTokens(rowTitle);
    const candidateTerms = titleTokens(candidateTitle);
    const overlap = rowTerms.filter((term) => candidateTerms.includes(term)).length;
    score += overlap * 30;

    const rowYear = String(row?.release_date || '').slice(0, 4);
    const candidateYear = String(candidate?.release_date || candidate?.released || '').slice(0, 4);
    if (rowYear && candidateYear && rowYear === candidateYear) score += 60;

    if (score > best) best = score;
  }

  return best;
}

async function resolveWikipediaCover(group) {
  const title = String(group?.[0]?.title || '').trim();
  if (!title) return '';
  try {
    const payload = await fetchWikipediaGamesList({
      page: 1,
      pageSize: 8,
      search: title,
      titleOnly: true,
      spotlight: false
    });
    const rows = Array.isArray(payload?.results) ? payload.results : [];
    const ranked = rows
      .map((row) => ({ row, score: scoreSearchMatch(group, row) }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score >= 120)
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]?.row;
    return normalizeCoverUrl(best?.cover_url || best?.cover || best?.image || '');
  } catch (_error) {
    return '';
  }
}

function toHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, 'https://');
  if (raw.startsWith('//')) return `https:${raw}`;
  return '';
}

function normalizeCoverUrl(value) {
  return toHttpsUrl(value).replace(/\s+/g, '');
}

function rowHasAnyCover(row) {
  const candidates = [
    row?.cover_url,
    row?.cover?.url,
    row?.cover,
    ...(Array.isArray(row?.extra?.local_covers) ? row.extra.local_covers : []),
    ...(Array.isArray(row?.extra?.covers) ? row.extra.covers : []),
    ...(Array.isArray(row?.extra?.official_covers) ? row.extra.official_covers : []),
    ...(Array.isArray(row?.extra?.cover_candidates) ? row.extra.cover_candidates : [])
  ].map((entry) => normalizeCoverUrl(entry)).filter(Boolean);
  return candidates.some((url) => !isLikelyBackdropUrl(url));
}

const UNOFFICIAL_GAME_PATTERNS = [
  /\bprototype\b/i,
  /\btech demo\b/i,
  /\bdemo\b/i,
  /\bfan\s?game\b/i,
  /\bfanmade\b/i,
  /\brom hack\b/i,
  /\bmod\b/i,
  /\bmodded\b/i,
  /\bpictures pack\b/i,
  /\bimages pack\b/i,
  /\bwallpaper pack\b/i,
  /\bsoundtrack\b/i,
  /\bost\b/i,
  /\bupdate\s*\d+\b/i,
  /\bfield trip\b/i,
  /\bcreepy red\b/i,
  /\bradical red\b/i,
  /\bmeta fire\s?red\b/i,
  /\bace ?dragon\b/i
];

function isLikelyRealGameRow(row) {
  const title = String(row?.title || row?.name || row?.slug || '').trim();
  if (!title) return false;
  if (UNOFFICIAL_GAME_PATTERNS.some((pattern) => pattern.test(title))) return false;
  const importedFrom = String(row?.extra?.imported_from || row?.source || '').trim().toLowerCase();
  if (/[[(][^)]+[)\]]/.test(title) && importedFrom.includes('rawg')) return false;
  return true;
}

function isLikelyBackdropUrl(value) {
  const url = normalizeCoverUrl(value).toLowerCase();
  if (!url) return false;
  return ['/heroes/', '/hero/', 'background', 'fanart', 'screenshot', 'screenshots', 'backdrop'].some((token) => url.includes(token));
}

function isOfficialSource(row) {
  const source = String(row?.source || '').trim().toLowerCase();
  const importedFrom = String(row?.extra?.imported_from || '').trim().toLowerCase();
  return source === 'wikipedia' || importedFrom.includes('wikipedia') || importedFrom.includes('igdb');
}

function pickRowOfficialPosterSource(row) {
  const candidates = [
    row?.cover_url,
    row?.cover?.url,
    row?.cover,
    row?.hero_url,
    row?.hero,
    ...(Array.isArray(row?.screenshots) ? row.screenshots : [])
  ].map((entry) => normalizeCoverUrl(entry)).filter(Boolean);
  if (!candidates.length) return '';

  const localOfficial = candidates.find((url) => /\/storage\/v1\/object\/public\/game-assets\/covers-official\//.test(url));
  if (localOfficial && Boolean(row?.extra?.official_cover_is_poster)) return localOfficial;

  if (isOfficialSource(row)) {
    const wikiDirect = candidates.find((url) => /wikimedia|wikipedia/.test(url) && !isLikelyBackdropUrl(url));
    if (wikiDirect) return wikiDirect;
  }

  return '';
}

function scoreOfficialCover(row) {
  const cover = pickRowOfficialPosterSource(row);
  if (!cover) return Number.NEGATIVE_INFINITY;
  let score = 0;
  if (/wikimedia|wikipedia/.test(cover)) score += 500;
  if (isOfficialSource(row)) score += 300;
  if (/game-assets\/covers-official\//.test(cover)) score += 200;
  if (cover.endsWith('.png') || cover.includes('.png?')) score += 40;
  return score;
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
    headers: { 'user-agent': 'Zo2yOfficialGameCoverSync/1.0' }
  });
  if (!response.ok) throw new Error(`fetch ${response.status}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('not-image');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer || buffer.length < 512) throw new Error('tiny-image');
  return { buffer, contentType, finalUrl: response.url || url };
}

async function optimizeOfficialCover(buffer, contentType = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('svg')) {
    return { buffer, contentType: 'image/svg+xml', ext: 'svg' };
  }
  const transformed = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: 1600,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: 82,
      effort: 4
    })
    .toBuffer();
  return { buffer: transformed, contentType: 'image/webp', ext: 'webp' };
}

function getImageDimensions(buffer, contentType = '') {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('png') && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }
  if ((type.includes('jpeg') || type.includes('jpg')) && buffer.length >= 4) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (!length) break;
      offset += 2 + length;
    }
  }
  if (type.includes('webp') && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }
  }
  return { width: 0, height: 0 };
}

function isPosterLikeDimensions(width = 0, height = 0) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return ratio > 0.45 && ratio < 0.9;
}

async function uploadAsset(supabase, remotePath, sourceUrl) {
  const { buffer, contentType, finalUrl } = await download(sourceUrl);
  const optimized = await optimizeOfficialCover(buffer, contentType);
  const ext = optimized.ext || getExt(contentType, finalUrl || sourceUrl);
  const storagePath = `${remotePath}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, optimized.buffer, {
    contentType: optimized.contentType,
    upsert: true,
    cacheControl: '31536000'
  });
  if (error) throw error;
  const dimensions = getImageDimensions(optimized.buffer, optimized.contentType);
  return {
    publicUrl: supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath).data.publicUrl,
    ...dimensions,
    isPoster: isPosterLikeDimensions(dimensions.width, dimensions.height)
  };
}

async function fetchAllGames(supabase) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,slug,source,cover_url,hero_url,extra')
      .order('rating_count', { ascending: false, nullsFirst: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function buildGroups(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const titleKey = normalizeTitleKey(row?.title || '');
    const slugKey = sanitizeFileBase(row?.slug || '');
    const key = titleKey || slugKey || String(row?.id || '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return groups;
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
  const limit = Math.max(1, Number(parseArg('--limit', 2500)));
  const offset = Math.max(0, Number(parseArg('--offset', 0)));
  const concurrency = Math.max(1, Number(parseArg('--concurrency', 4)));
  const missingOnly = hasFlag('--missing-only');
  const externalOnly = hasFlag('--external-only');

  const rows = await fetchAllGames(supabase);
  const groupedRows = Array.from(buildGroups(rows).values())
    .filter((group) => group.some((row) => isLikelyRealGameRow(row)))
    .filter((group) => !missingOnly || group.some((row) => !rowHasAnyCover(row)))
    .slice(offset, offset + limit);
  const groups = [];
  for (const group of groupedRows) {
    const officialRows = group
      .filter((row) => scoreOfficialCover(row) > Number.NEGATIVE_INFINITY)
      .sort((a, b) => scoreOfficialCover(b) - scoreOfficialCover(a));
    const official = officialRows[0] || group[0];
    let officialCoverSource = pickRowOfficialPosterSource(official);
    if (!officialCoverSource) {
      const existingOfficialRow = group.find((row) => pickRowOfficialPosterSource(row));
      officialCoverSource = existingOfficialRow ? pickRowOfficialPosterSource(existingOfficialRow) : '';
    }
    if (!officialCoverSource) {
      officialCoverSource = await resolveWikipediaCover(group);
    }
    if (!officialCoverSource) continue;
    groups.push({ group, official, officialCoverSource });
  }

  let cursor = 0;
  let processed = 0;
  let updatedRows = 0;
  let skipped = 0;

  async function worker() {
    while (cursor < groups.length) {
      const current = groups[cursor++];
      const group = current.group;
      const official = current.official;
      const title = String(official?.title || group[0]?.title || 'game').trim();
      const slug = sanitizeFileBase(official?.slug || group[0]?.slug || title);
      const existingPosterOfficial = externalOnly ? null : group.find((row) => {
        const url = normalizeCoverUrl(row?.cover_url);
        return /\/storage\/v1\/object\/public\/game-assets\/covers-official\//.test(url) && Boolean(row?.extra?.official_cover_is_poster);
      });
      const existingLocalOfficial = existingPosterOfficial ? normalizeCoverUrl(existingPosterOfficial?.cover_url) : '';

      try {
        const uploaded = externalOnly
          ? {
            publicUrl: normalizeCoverUrl(current.officialCoverSource),
            width: 0,
            height: 0,
            isPoster: !isLikelyBackdropUrl(current.officialCoverSource)
          }
          : existingLocalOfficial
            ? { publicUrl: existingLocalOfficial, width: Number(existingPosterOfficial?.extra?.official_cover_width || 0), height: Number(existingPosterOfficial?.extra?.official_cover_height || 0), isPoster: true }
            : await uploadAsset(supabase, `covers-official/${slug}`, current.officialCoverSource);
        if (!uploaded.publicUrl) {
          throw new Error('no-cover-url');
        }
        if (!uploaded.isPoster) {
          throw new Error('not-poster');
        }
        const selectedCover = uploaded.publicUrl;
        const patchPromises = group.map(async (row) => {
          const currentExtra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
          const nextExtra = {
            ...currentExtra,
            official_cover_source: current.officialCoverSource,
            official_cover_synced_at: new Date().toISOString(),
            official_cover_storage: externalOnly ? 'remote' : 'bucket',
            official_cover_width: Number(uploaded.width || currentExtra.official_cover_width || 0) || 0,
            official_cover_height: Number(uploaded.height || currentExtra.official_cover_height || 0) || 0,
            official_cover_is_poster: uploaded.isPoster || Boolean(currentExtra.official_cover_is_poster)
          };
          const { error } = await supabase
            .from('games')
            .update({
              cover_url: selectedCover,
              extra: nextExtra
            })
            .eq('id', row.id);
          if (error) throw error;
        });
        await Promise.all(patchPromises);
        updatedRows += group.length;
      } catch (error) {
        skipped += group.length;
        console.error(`[official-covers] ${title}: ${error.message || error}`);
      }
      processed += 1;
      if (processed % 25 === 0 || processed === groups.length) {
        console.log(`[official-covers] groups ${processed}/${groups.length} updatedRows=${updatedRows} skippedRows=${skipped}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(JSON.stringify({
    totalGroups: groups.length,
    missingOnly,
    externalOnly,
    updatedRows,
    skipped
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

