import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const USER_AGENT = 'Zo2yTravelSeeder/1.0 (+https://zo2y.com; support@zo2y.com)';
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));
const BUCKET_NAME = 'travel-photos';
const MANIFEST_PATH = 'manifest/travel-photo-manifest.json';
const COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion';

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

function parseArg(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function safeHttps(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('https://')) return raw;
  if (raw.startsWith('http://')) return `https://${raw.slice(7)}`;
  return '';
}

function canonicalCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(code) || code === 'IL') return '';
  return code;
}

function normalizeCountryName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+\(country\)\s*$/i, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countryDisplayName(row) {
  const code = canonicalCountryCode(row?.cca2 || row?.cca3);
  if (code === 'PS') return 'Palestine';
  return String(row?.name?.common || row?.name?.official || '').trim();
}

function getCommonsCategoryText(page) {
  const categories = Array.isArray(page?.categories) ? page.categories : [];
  return categories
    .map((entry) => String(entry?.title || '').replace(/^Category:/i, '').trim().toLowerCase())
    .filter(Boolean)
    .join(' | ');
}

function isPhotoMime(mime) {
  const value = String(mime || '').toLowerCase().trim();
  return value === 'image/jpeg' || value === 'image/jpg' || value === 'image/webp';
}

function isBadScenicTitle(title, countryName, capital, cityHints = [], categoryText = '') {
  const raw = `${String(title || '')} ${String(categoryText || '')}`.toLowerCase();
  if (!raw) return true;
  const blocked = [
    'flag',
    'coat of arms',
    'emblem',
    'seal',
    'map of',
    'locator map',
    'location map',
    'orthographic',
    'equirectangular',
    'blank map',
    'administrative map',
    'province map',
    'political map',
    'banner',
    'painting',
    'artwork',
    'illustration',
    'drawing',
    'poster',
    'cartoon',
    'sketch',
    'render',
    'vector',
    'banknote',
    'stamp',
    'mural',
    'logo',
    'watercolor',
    'etching',
    'engraving',
    'lithograph',
    'oil on canvas'
  ];
  if (blocked.some((token) => raw.includes(token))) return true;
  const countryNeedle = normalizeCountryName(countryName);
  const capitalNeedle = normalizeCountryName(capital);
  const cityNeedles = (Array.isArray(cityHints) ? cityHints : [])
    .map((value) => normalizeCountryName(value))
    .filter(Boolean);
  if (!countryNeedle && !capitalNeedle && !cityNeedles.length) return false;
  const normalizedTitle = normalizeCountryName(title);
  const hasCountry = countryNeedle && normalizedTitle.includes(countryNeedle);
  const hasCapital = capitalNeedle && normalizedTitle.includes(capitalNeedle);
  const hasCity = cityNeedles.some((needle) => normalizedTitle.includes(needle));
  return !(hasCountry || hasCapital || hasCity);
}

function scoreTravelPhotoCandidate(page, kind, countryName, capital, cityHints = []) {
  const title = String(page?.title || '');
  const mime = String(page?.imageinfo?.[0]?.mime || '').toLowerCase();
  if (!isPhotoMime(mime)) return -1;
  const categoryText = getCommonsCategoryText(page);
  if (isBadScenicTitle(title, countryName, capital, cityHints, categoryText)) return -1;
  const raw = `${title} ${categoryText}`.toLowerCase();
  let score = 0;
  if (raw.includes('photographs')) score += 5;
  if (kind === 'city') {
    if (raw.includes('skyline') || raw.includes('cityscape')) score += 6;
    if (raw.includes('downtown') || raw.includes('street') || raw.includes('urban') || raw.includes('capital')) score += 4;
  } else if (kind === 'nature') {
    if (raw.includes('landscape') || raw.includes('mountain') || raw.includes('coast') || raw.includes('beach') || raw.includes('forest') || raw.includes('lake') || raw.includes('national park')) score += 6;
  } else {
    if (raw.includes('landscape') || raw.includes('panorama') || raw.includes('view') || raw.includes('scenery')) score += 5;
    if (raw.includes('skyline') || raw.includes('cityscape')) score += 2;
  }
  if (raw.includes('night')) score += kind === 'city' ? 2 : 1;
  return score;
}

function buildTravelPhotoQueries(kind, name, capital, cities = []) {
  const primaryCity = String(capital || cities[0] || '').trim();
  if (kind === 'city') {
    return [
      primaryCity ? `${primaryCity} skyline` : '',
      primaryCity ? `${primaryCity} downtown` : '',
      primaryCity ? `${primaryCity} cityscape` : '',
      primaryCity ? `${primaryCity} urban photography` : '',
      `${name} city skyline`,
      `${name} city center`,
      `${name} street scene`
    ].map((value) => String(value || '').trim()).filter(Boolean);
  }
  if (kind === 'nature') {
    return [
      `${name} landscape`,
      `${name} nature`,
      `${name} national park`,
      `${name} mountains`,
      `${name} coast`,
      `${name} beach`,
      `${name} forest`,
      `${name} lake`
    ].map((value) => String(value || '').trim()).filter(Boolean);
  }
  return [
    `${name} landscape`,
    `${name} travel photography`,
    `${name} scenic`,
    `${name} panorama`,
    `${name} scenery`,
    `${name} view`,
    `${primaryCity ? `${primaryCity} skyline` : ''}`
  ].map((value) => String(value || '').trim()).filter(Boolean);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function fetchCommonsPhotoByKind(kind, name, code, capital, cities) {
  const safeCode = canonicalCountryCode(code);
  if (!safeCode) return '';
  const queries = buildTravelPhotoQueries(kind, name, capital, cities);
  for (const query of queries) {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo|categories&iiprop=url|mime&iiurlwidth=1600&cllimit=max`;
    try {
      const payload = await fetchJson(endpoint);
      const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
      const ranked = pages
        .map((page) => ({ page, score: scoreTravelPhotoCandidate(page, kind, name, capital, cities) }))
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => right.score - left.score);
      const preferred = ranked[0]?.page || null;
      const image = safeHttps(preferred?.imageinfo?.[0]?.thumburl || preferred?.imageinfo?.[0]?.url || '');
      if (image) return image;
    } catch {
      // keep trying
    }
    await sleep(120);
  }
  return '';
}

async function downloadImage(sourceUrl, attempts = 5) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'image/*,*/*'
        }
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1200 + index * 1200);
        continue;
      }
      if (!response.ok) return null;
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.startsWith('image/')) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer || buffer.length < 1024) return null;
      return { buffer, contentType };
    } catch {
      await sleep(800 + index * 1000);
    }
  }
  return null;
}

function extensionFromContentType(contentType, sourceUrl) {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  const pathname = String(sourceUrl || '').split('?')[0];
  const ext = pathname.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return ext === 'jpeg' ? 'jpg' : ext;
  return 'jpg';
}

function normalizeManifestEntry(entry) {
  if (!entry || typeof entry !== 'object') return { scenic: '', city: '', nature: '' };
  return {
    scenic: safeHttps(entry.scenic || ''),
    city: safeHttps(entry.city || ''),
    nature: safeHttps(entry.nature || '')
  };
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

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (data && !error) return;
  await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024
  });
}

async function fetchCountries() {
  const payload = await fetchJson(COUNTRIES_URL);
  return (Array.isArray(payload) ? payload : [])
    .map((row) => {
      const code = canonicalCountryCode(row?.cca2 || row?.cca3);
      const name = countryDisplayName(row);
      if (!code || !name || /\bisrael\b/i.test(name)) return null;
      const capital = Array.isArray(row?.capital)
        ? String(row.capital[0] || '').trim()
        : String(row?.capital || '').trim();
      return {
        code,
        name,
        capital,
        region: String(row?.region || '').trim(),
        subregion: String(row?.subregion || '').trim()
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function readExistingManifest() {
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${MANIFEST_PATH}`;
  try {
    const res = await fetch(publicUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
    });
    if (!res.ok) return {};
    const payload = await res.json();
    return payload?.countries && typeof payload.countries === 'object' ? payload.countries : {};
  } catch {
    return {};
  }
}

async function listBucket(pathPrefix = '') {
  const output = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(pathPrefix, {
        limit: 100,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });
    if (error) throw error;
    const page = Array.isArray(data) ? data : [];
    output.push(...page);
    if (page.length < 100) break;
    offset += page.length;
  }
  return output;
}

async function hydrateManifestFromBucket(countries, manifestCountries) {
  const countryMap = new Map((Array.isArray(countries) ? countries : []).map((country) => [country.code, country]));
  const rootItems = await listBucket('');
  const countryCodes = rootItems
    .map((entry) => canonicalCountryCode(entry?.name))
    .filter((code) => code && countryMap.has(code));
  for (const code of countryCodes) {
    const files = await listBucket(code);
    const currentCountry = countryMap.get(code) || {
      code,
      name: code,
      capital: '',
      region: '',
      subregion: ''
    };
    const current = normalizeManifestEntry(manifestCountries[code]);
    files.forEach((file) => {
      const fileName = String(file?.name || '').toLowerCase();
      if (fileName.startsWith('scenic.')) {
        current.scenic = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${code}/${file.name}`).data.publicUrl;
      } else if (fileName.startsWith('city.')) {
        current.city = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${code}/${file.name}`).data.publicUrl;
      } else if (fileName.startsWith('nature.')) {
        current.nature = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${code}/${file.name}`).data.publicUrl;
      }
    });
    manifestCountries[code] = {
      code,
      name: currentCountry.name,
      capital: currentCountry.capital,
      region: currentCountry.region,
      subregion: currentCountry.subregion,
      scenic: current.scenic || '',
      city: current.city || '',
      nature: current.nature || ''
    };
  }
  return manifestCountries;
}

async function uploadTravelPhoto(code, kind, sourceUrl) {
  const downloaded = await downloadImage(sourceUrl);
  if (!downloaded) throw new Error(`Download failed: ${sourceUrl}`);
  const ext = extensionFromContentType(downloaded.contentType, sourceUrl);
  const filePath = `${String(code).toUpperCase()}/${kind}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, downloaded.buffer, {
      contentType: downloaded.contentType || 'image/jpeg',
      upsert: true,
      cacheControl: '604800'
    });
  if (error) throw error;
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;
}

async function uploadManifest(countries) {
  const payload = {
    generatedAt: new Date().toISOString(),
    countries
  };
  const buffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf8');
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(MANIFEST_PATH, buffer, {
      contentType: 'application/json; charset=utf-8',
      upsert: true,
      cacheControl: '900'
    });
  if (error) throw error;
}

async function processCountry(country, manifestCountries, options) {
  const current = normalizeManifestEntry(manifestCountries[country.code]);
  const kinds = options.kind === 'all' ? ['scenic', 'city', 'nature'] : [options.kind];
  const out = { ...current };
  const cities = country.capital ? [country.capital] : [];
  let changed = false;

  for (const kind of kinds) {
    if (out[kind] && !options.force) continue;
    const source = await fetchCommonsPhotoByKind(kind, country.name, country.code, country.capital, cities);
    if (!source) continue;
    try {
      const publicUrl = await uploadTravelPhoto(country.code, kind, source);
      out[kind] = publicUrl;
      changed = true;
      console.log(`[travel] ${country.code} ${kind} uploaded`);
    } catch (error) {
      console.warn(`[travel] ${country.code} ${kind} failed: ${error?.message || error}`);
    }
    await sleep(options.delayMs);
  }

  manifestCountries[country.code] = {
    code: country.code,
    name: country.name,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    scenic: out.scenic || '',
    city: out.city || '',
    nature: out.nature || ''
  };
  return changed;
}

async function runQueue(items, workerCount, iteratee) {
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, workerCount) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (!item) continue;
      await iteratee(item, index);
    }
  });
  await Promise.all(workers);
}

async function run() {
  const delayMs = Number(parseArg('--delay', 220));
  const concurrency = Math.max(1, Number(parseArg('--concurrency', 4)));
  const limit = Math.max(0, Number(parseArg('--limit', 0)));
  const start = Math.max(0, Number(parseArg('--start', 0)));
  const requestedKind = String(parseArg('--kind', 'all') || 'all').toLowerCase();
  const kind = ['all', 'scenic', 'city', 'nature'].includes(requestedKind) ? requestedKind : 'all';
  const requestedCodes = String(parseArg('--countries', '') || '')
    .split(',')
    .map((value) => canonicalCountryCode(value))
    .filter(Boolean);
  const force = hasFlag('--force');

  await ensureBucket();
  const countries = await fetchCountries();
  const validCountryCodes = new Set(countries.map((country) => country.code));
  const manifestCountries = await readExistingManifest();
  await hydrateManifestFromBucket(countries, manifestCountries);
  Object.keys(manifestCountries).forEach((code) => {
    if (!validCountryCodes.has(code)) delete manifestCountries[code];
  });

  let targets = countries;
  if (requestedCodes.length) {
    const wanted = new Set(requestedCodes);
    targets = targets.filter((country) => wanted.has(country.code));
  }
  if (start > 0) targets = targets.slice(start);
  if (limit > 0) targets = targets.slice(0, limit);

  console.log(`[travel] seeding ${targets.length} countries with kind=${kind} force=${force ? 'true' : 'false'} concurrency=${concurrency}`);
  let processed = 0;
  const failedCountries = [];
  let manifestSaveChain = Promise.resolve();
  const scheduleManifestSave = () => {
    manifestSaveChain = manifestSaveChain
      .then(() => uploadManifest(manifestCountries))
      .catch((error) => {
        console.warn(`[travel] manifest save failed: ${error?.message || error}`);
      });
    return manifestSaveChain;
  };
  await runQueue(targets, concurrency, async (country, index) => {
    console.log(`[travel] ${index + 1}/${targets.length} ${country.code} ${country.name}`);
    try {
      const changed = await processCountry(country, manifestCountries, { delayMs, kind, force });
      processed += 1;
      if (changed || processed % 12 === 0) {
        await scheduleManifestSave();
      }
    } catch (error) {
      failedCountries.push(country.code);
      console.warn(`[travel] ${country.code} fatal country error: ${error?.message || error}`);
    }
  });

  await scheduleManifestSave();
  console.log(`[travel] manifest uploaded: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${MANIFEST_PATH}`);
  if (failedCountries.length) {
    console.log(`[travel] failed countries: ${failedCountries.join(', ')}`);
  }
}

run().catch((error) => {
  console.error('Travel upload error:', error?.message || error);
  process.exit(1);
});
