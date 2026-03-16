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

function normalizeDomain(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STATE_PATH = path.join(ROOT, 'scripts', '.brand-import-state.json');

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

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

function buildSparqlQuery(kind, limit, offset = 0) {
  if (kind === 'fashion') {
    return `
      SELECT DISTINCT ?item ?itemLabel ?website ?countryLabel ?inception ?industryLabel WHERE {
        ?item wdt:P31 ?instance .
        OPTIONAL { ?item wdt:P452 ?industry. }
        OPTIONAL { ?item wdt:P856 ?website. }
        OPTIONAL { ?item wdt:P17 ?country. }
        OPTIONAL { ?item wdt:P571 ?inception. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        FILTER(
          ?instance = wd:Q1618899 || 
          CONTAINS(LCASE(STR(?itemLabel)), "fashion") ||
          CONTAINS(LCASE(STR(?itemLabel)), "apparel") ||
          CONTAINS(LCASE(STR(?itemLabel)), "clothing") ||
          (BOUND(?industryLabel) && (
            CONTAINS(LCASE(STR(?industryLabel)), "fashion") ||
            CONTAINS(LCASE(STR(?industryLabel)), "apparel") ||
            CONTAINS(LCASE(STR(?industryLabel)), "clothing")
          ))
        )
        FILTER(BOUND(?website))
      }
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }
  return `
    SELECT DISTINCT ?item ?itemLabel ?website ?countryLabel ?inception ?industryLabel WHERE {
      ?item wdt:P31 ?instance .
      OPTIONAL { ?item wdt:P452 ?industry. }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P17 ?country. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      FILTER(
        ?instance = wd:Q18509232 ||
        CONTAINS(LCASE(STR(?itemLabel)), "restaurant") ||
        CONTAINS(LCASE(STR(?itemLabel)), "fast food") ||
        (BOUND(?industryLabel) && (
          CONTAINS(LCASE(STR(?industryLabel)), "restaurant") ||
          CONTAINS(LCASE(STR(?industryLabel)), "fast food") ||
          CONTAINS(LCASE(STR(?industryLabel)), "foodservice") ||
          CONTAINS(LCASE(STR(?industryLabel)), "food service")
        ))
      )
      FILTER(BOUND(?website))
    }
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

async function queryWikidata(query, attempts = 3) {
  const url = new URL(WIKIDATA_ENDPOINT);
  url.searchParams.set('format', 'json');
  url.searchParams.set('query', query);
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Zo2yBrandSeeder/1.0 (contact: support@zo2y.com)'
      }
    });
    if (res.ok) return res.json();
    lastError = new Error(`Wikidata error ${res.status}`);
    if (res.status === 429 || res.status >= 500) {
      await sleep(800 + i * 1200);
      continue;
    }
    break;
  }
  throw lastError || new Error('Wikidata error');
}

function extractYear(value) {
  if (!value) return '';
  const match = String(value).match(/\d{4}/);
  return match ? match[0] : '';
}

function mapWikidataRow(row) {
  const name = row?.itemLabel?.value || '';
  const website = row?.website?.value || '';
  const domain = normalizeDomain(website);
  const industry = row?.industryLabel?.value || '';
  return {
    name,
    slug: slugify(domain || name),
    domain,
    description: '',
    category: industry,
    country: row?.countryLabel?.value || '',
    founded: extractYear(row?.inception?.value),
    tags: []
  };
}

async function importBrands(kind, table, limit, batchSize = 125, resumeState = {}) {
  console.log(`Fetching ${kind} brands from Wikidata...`);
  const batches = Math.ceil(limit / batchSize);
  let totalInserted = 0;
  const seen = new Map();

  const startBatch = Math.max(0, Number(resumeState?.[kind]?.batch || 0));
  for (let i = startBatch; i < batches; i += 1) {
    const offset = i * batchSize;
    const query = buildSparqlQuery(kind, batchSize, offset);
    const payload = await queryWikidata(query);
    const rows = payload?.results?.bindings || [];
    const mapped = rows.map(mapWikidataRow).filter((row) => row.name);
    mapped.forEach((row) => {
      const key = row.domain || row.slug;
      if (!key || seen.has(key)) return;
      seen.set(key, row);
    });
    resumeState[kind] = { batch: i + 1, updated_at: new Date().toISOString() };
    saveState(resumeState);
    await sleep(900);
  }

  const upserts = Array.from(seen.values()).slice(0, limit);
  if (!upserts.length) return 0;

  const { error } = await supabase.from(table).upsert(upserts, { onConflict: 'slug' });
  if (error) throw error;
  totalInserted += upserts.length;
  return totalInserted;
}

async function run() {
  const resumeState = loadState();
  const fashionCount = await importBrands('fashion', 'fashion_brands', 500, 125, resumeState);
  await sleep(1200);
  const foodCount = await importBrands('food', 'food_brands', 500, 125, resumeState);
  console.log(`Imported fashion: ${fashionCount}`);
  console.log(`Imported food: ${foodCount}`);
}

run().catch((err) => {
  console.error('Import error:', err?.message || err);
  process.exit(1);
});
