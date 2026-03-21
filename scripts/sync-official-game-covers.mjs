import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
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

function scoreOfficialCover(row) {
  const cover = normalizeCoverUrl(row?.cover_url || row?.cover?.url || row?.cover);
  if (!cover || isLikelyBackdropUrl(cover)) return Number.NEGATIVE_INFINITY;
  let score = 0;
  if (/wikimedia|wikipedia/.test(cover)) score += 500;
  if (isOfficialSource(row)) score += 300;
  if (/game-assets\/covers\//.test(cover)) score += 120;
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

async function uploadAsset(supabase, remotePath, sourceUrl) {
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

  const rows = await fetchAllGames(supabase);
  const groupedRows = Array.from(buildGroups(rows).values()).slice(offset, offset + limit);
  const groups = [];
  for (const group of groupedRows) {
    const officialRows = group
      .filter((row) => scoreOfficialCover(row) > Number.NEGATIVE_INFINITY)
      .sort((a, b) => scoreOfficialCover(b) - scoreOfficialCover(a));
    const official = officialRows[0] || group[0];
    let officialCoverSource = normalizeCoverUrl(official?.cover_url || official?.cover?.url || official?.cover);
    if (!officialCoverSource || isLikelyBackdropUrl(officialCoverSource)) {
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
      const existingLocalOfficial = group
        .map((row) => normalizeCoverUrl(row?.cover_url))
        .find((url) => /\/storage\/v1\/object\/public\/game-assets\/covers-official\//.test(url));

      try {
        const localCover = existingLocalOfficial || await uploadAsset(supabase, `covers-official/${slug}`, current.officialCoverSource);
        const patchPromises = group.map(async (row) => {
          const currentExtra = row?.extra && typeof row.extra === 'object' ? row.extra : {};
          const nextExtra = {
            ...currentExtra,
            official_cover_source: current.officialCoverSource,
            official_cover_synced_at: new Date().toISOString()
          };
          const { error } = await supabase
            .from('games')
            .update({
              cover_url: localCover,
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
    updatedRows,
    skipped
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
