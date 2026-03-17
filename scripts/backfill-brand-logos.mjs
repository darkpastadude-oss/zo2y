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
  return true;
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

  let offset = Number(state?.offset || 0);
  let updated = 0;
  let checked = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('id, name, domain, logo_url')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (limit && checked >= limit) break;
      checked += 1;
      if (hasLogo(row.logo_url, { force })) continue;

      const title = String(row?.name || '').trim();
      const domain = String(row?.domain || '').trim();
      let logoUrl = '';

      if (domain) {
        logoUrl = await fetchLogoByDomain(domain, size);
      }

      if (!logoUrl && title) {
        logoUrl = await fetchWikiLogo(title, size);
      }

      if (!logoUrl && title) {
        const siteUrl = await fetchWikiSite(title);
        const siteDomain = sanitizeDomain(siteUrl);
        if (siteDomain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(siteDomain)}&sz=${size}`;
        }
      }

      if (!logoUrl && domain) {
        const cleanDomain = sanitizeDomain(domain);
        if (cleanDomain) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=${size}`;
        }
      }

      if (logoUrl) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ logo_url: logoUrl })
          .eq('id', row.id);
        if (updateError) throw updateError;
        updated += 1;
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

async function run() {
  const kind = normalizeKind(parseArg('--kind', 'all'));
  const limit = Number(parseArg('--limit', 0));
  const delayMs = Number(parseArg('--delay', 350));
  const size = Number(parseArg('--size', 256));
  const pageSize = Number(parseArg('--page', 500));
  const force = String(parseArg('--force', '') || '').toLowerCase() === 'true';
  const state = loadState();

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
    const result = await backfillTable(target.table, { limit, delayMs, size, pageSize, force }, tableState);
    state[target.table] = tableState;
    saveState(state);
    console.log(`${target.table}: scanned ${result.checked}, updated ${result.updated}`);
    await sleep(800);
  }
  console.log('Backfill complete.');
}

run().catch((err) => {
  console.error('Backfill error:', err?.message || err);
  process.exit(1);
});
