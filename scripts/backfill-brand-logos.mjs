import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));

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
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCommonsFilePath(filename, size) {
  const safeName = String(filename || '').replace(/\s+/g, '_');
  const width = Number.isFinite(size) ? size : 256;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safeName)}?width=${width}`;
}

function normalizeCommonsLogo(value, size) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('Special:FilePath/')) {
    const url = raw.split('?')[0];
    return `${url}?width=${Number.isFinite(size) ? size : 256}`;
  }
  if (raw.startsWith('http')) {
    const parts = raw.split('/');
    const filename = parts[parts.length - 1];
    return toCommonsFilePath(filename, size);
  }
  return toCommonsFilePath(raw, size);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchWikiLogo(title, size) {
  if (!title) return '';
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' } });
  if (!summaryRes.ok) return '';
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return '';

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' } });
  if (!entityRes.ok) return '';
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const logoClaim = entity?.claims?.P154?.[0];
  const logoFile = logoClaim?.mainsnak?.datavalue?.value;
  if (!logoFile) return '';
  return normalizeCommonsLogo(logoFile, size);
}

function extractLogoFromSummary(payload, size) {
  if (!payload) return '';
  const candidate = payload.originalimage?.source || payload.thumbnail?.source || '';
  if (!candidate) return '';
  const filename = candidate.split('/').pop() || '';
  const lowered = filename.toLowerCase();
  if (lowered.includes('logo') || lowered.includes('wordmark') || lowered.includes('logotype')) {
    return normalizeCommonsLogo(candidate, size);
  }
  return '';
}

async function fetchWikiSite(title) {
  if (!title) return '';
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' } });
  if (!summaryRes.ok) return '';
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return '';

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' } });
  if (!entityRes.ok) return '';
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const siteClaim = entity?.claims?.P856?.[0];
  const siteUrl = siteClaim?.mainsnak?.datavalue?.value;
  return siteUrl || '';
}

function sanitizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

function extractEntityWebsite(entity) {
  const siteClaim = entity?.claims?.P856?.[0];
  const siteUrl = siteClaim?.mainsnak?.datavalue?.value;
  return siteUrl || '';
}

function extractEntityLogo(entity, size) {
  const logoClaim = entity?.claims?.P154?.[0];
  const logoFile = logoClaim?.mainsnak?.datavalue?.value;
  if (!logoFile) return '';
  return normalizeCommonsLogo(logoFile, size);
}

async function fetchLogoByDomain(domain, size) {
  const cleanDomain = sanitizeDomain(domain);
  if (!cleanDomain) return '';
  const domainPattern = escapeRegex(cleanDomain).replace(/"/g, '');
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(CONTAINS(LCASE(STR(?site)), "${domainPattern}"))
      ?item wdt:P154 ?logo .
    } LIMIT 1
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Zo2yWikiLogo/1.0',
      'Accept': 'application/sparql-results+json'
    }
  });
  if (!response.ok) return '';
  const json = await response.json();
  const value = json?.results?.bindings?.[0]?.logo?.value;
  if (!value) return '';
  return normalizeCommonsLogo(value, size);
}

async function fetchLogoByLabel(title, size, domain = '') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return '';
  const searchUrl = new URL('https://www.wikidata.org/w/api.php');
  searchUrl.searchParams.set('action', 'wbsearchentities');
  searchUrl.searchParams.set('search', cleanTitle);
  searchUrl.searchParams.set('language', 'en');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('limit', '5');
  const searchRes = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!searchRes.ok) return '';
  const searchPayload = await searchRes.json();
  const results = Array.isArray(searchPayload?.search) ? searchPayload.search : [];
  if (!results.length) return '';

  const domainNeedle = sanitizeDomain(domain);
  for (const result of results) {
    const qid = result?.id;
    if (!qid) continue;
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`;
    const entityRes = await fetch(entityUrl, {
      headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
    });
    if (!entityRes.ok) continue;
    const entityPayload = await entityRes.json();
    const entity = entityPayload?.entities?.[qid];
    if (!entity) continue;
    if (domainNeedle) {
      const siteUrl = extractEntityWebsite(entity);
      const siteDomain = sanitizeDomain(siteUrl);
      if (!siteDomain || siteDomain !== domainNeedle) {
        continue;
      }
    }
    const logoUrl = extractEntityLogo(entity, size);
    if (logoUrl) return logoUrl;
  }
  return '';
}

const MANUAL_LOGO_OVERRIDES = {
  'supreme': 'https://commons.wikimedia.org/wiki/Special:FilePath/Supreme_Logo.svg?width=512'
};

function parseArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  return value ?? fallback;
}

function normalizeKind(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'all') return 'all';
  return raw;
}

function hasLogo(value, options = {}) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return false;
  if (raw.includes('logo-placeholder.svg')) return false;
  if (raw.includes('newlogo.webp')) return false;
  if (options.force) return false;
  if (raw.includes('logo.clearbit.com')) return false;
  if (raw.includes('img.logo.dev')) return false;
  if (raw.includes('google.com/s2/favicons')) return false;
  if (raw.includes('icons.duckduckgo.com')) return false;
  return true;
}

function isLowQualityLogo(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return false;
  return (
    raw.includes('logo.clearbit.com') ||
    raw.includes('img.logo.dev') ||
    raw.includes('google.com/s2/favicons') ||
    raw.includes('icons.duckduckgo.com')
  );
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TABLES = [
  { kind: 'fashion', table: 'fashion_brands' },
  { kind: 'food', table: 'food_brands' },
  { kind: 'car', table: 'car_brands' }
];

const STATE_PATH = path.join(ROOT, 'scripts', '.brand-logo-state.json');

function loadState() {
  try {
    if (!fs.existsSync(STATE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function backfillTable(table, options = {}, state = {}) {
  const size = Number(options.size || 256);
  const delayMs = Number(options.delayMs || 350);
  const pageSize = Number(options.pageSize || 500);
  const limit = Number(options.limit || 0);
  const force = !!options.force;
  const onlyMissing = !!options.onlyMissing;

  let offset = Number(state?.offset || 0);
  let updated = 0;
  let checked = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select('id, name, domain, logo_url')
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (onlyMissing) {
      query = query.is('logo_url', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (limit && checked >= limit) break;
      checked += 1;
      if (hasLogo(row.logo_url, { force })) continue;

      const title = String(row?.name || '').trim();
      const domain = String(row?.domain || '').trim();
      let logoUrl = '';

      const overrideKey = title.toLowerCase();
      if (MANUAL_LOGO_OVERRIDES[overrideKey]) {
        logoUrl = MANUAL_LOGO_OVERRIDES[overrideKey];
      }

      if (!logoUrl && domain) {
        logoUrl = await fetchLogoByDomain(domain, size);
      }

      if (!logoUrl && title) {
        logoUrl = await fetchWikiLogo(title, size);
      }

      if (!logoUrl && title) {
        logoUrl = await fetchLogoByLabel(title, size, domain);
      }

      if (!logoUrl && title) {
        try {
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
          const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' } });
          if (summaryRes.ok) {
            const payload = await summaryRes.json();
            logoUrl = extractLogoFromSummary(payload, size);
          }
        } catch {
          // ignore
        }
      }

      if (logoUrl) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ logo_url: logoUrl })
          .eq('id', row.id);
        if (updateError) throw updateError;
        updated += 1;
      } else if (force && isLowQualityLogo(row.logo_url)) {
        const { error: clearError } = await supabase
          .from(table)
          .update({ logo_url: null })
          .eq('id', row.id);
        if (clearError) throw clearError;
      }

      await sleep(delayMs);
    }

    offset += pageSize;
    state.offset = offset;
    state.updated_at = new Date().toISOString();
    saveState(state);

    if (limit && checked >= limit) break;
  }

  return { updated, checked };
}

async function writeMissingReport(table, targetPath) {
  const { data, error } = await supabase
    .from(table)
    .select('name, domain')
    .is('logo_url', null)
    .order('name', { ascending: true });
  if (error) throw error;
  const payload = data || [];
  const existing = fs.existsSync(targetPath)
    ? JSON.parse(fs.readFileSync(targetPath, 'utf8'))
    : {};
  existing[table] = payload;
  fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2));
}

async function run() {
  const kind = normalizeKind(parseArg('--kind', 'all'));
  const limit = Number(parseArg('--limit', 0));
  const delayMs = Number(parseArg('--delay', 350));
  const size = Number(parseArg('--size', 256));
  const pageSize = Number(parseArg('--page', 500));
  const force = String(parseArg('--force', '') || '').toLowerCase() === 'true';
  const onlyMissing = String(parseArg('--only-missing', '') || '').toLowerCase() === 'true';
  const report = String(parseArg('--report', '') || '').toLowerCase() === 'true';
  const state = loadState();
  const reportPath = path.join(ROOT, 'scripts', 'missing-logos.json');

  const targets = kind === 'all'
    ? TABLES
    : TABLES.filter((entry) => entry.kind === kind);

  if (!targets.length) {
    console.error('No valid table target. Use --kind fashion|food|car|all');
    process.exit(1);
  }

  for (const target of targets) {
    console.log(`Backfilling ${target.table}...`);
    const tableState = state[target.table] || { offset: 0 };
    const result = await backfillTable(target.table, { limit, delayMs, size, pageSize, force, onlyMissing }, tableState);
    state[target.table] = tableState;
    saveState(state);
    console.log(`${target.table}: scanned ${result.checked}, updated ${result.updated}`);
    if (report) {
      await writeMissingReport(target.table, reportPath);
    }
    await sleep(800);
  }
  console.log('Backfill complete.');
}

run().catch((err) => {
  console.error('Backfill error:', err?.message || err);
  process.exit(1);
});
