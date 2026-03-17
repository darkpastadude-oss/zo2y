import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const USER_AGENT = 'Zo2yLogoFetcher/1.0 (+https://zo2y.com; support@zo2y.com)';

const MANUAL_LOGO_OVERRIDES = {
  'puma': 'https://commons.wikimedia.org/wiki/Special:FilePath/Puma-logo-(text).svg?width=512',
  'ugg': 'https://commons.wikimedia.org/wiki/Special:FilePath/UGG_logo.svg?width=512',
  'fear of god': 'https://images.seeklogo.com/logo-png/41/1/fear-of-god-logo-png_seeklogo-411342.png',
  'prettylittlething': 'https://images.seeklogo.com/logo-png/38/1/prettylittlething-logo-png_seeklogo-382486.png',
  'buffalo wild wings': 'https://upload.wikimedia.org/wikipedia/en/2/2c/Buffalo_Wild_Wings_%28logo%2C_vertical%29.svg',
  'greggs': 'https://upload.wikimedia.org/wikipedia/en/b/bc/Greggs2014.svg',
  'longhorn steakhouse': 'https://upload.wikimedia.org/wikipedia/en/7/7f/LongHornSteakhouseLogo.PNG',
  'noodles & company': 'https://upload.wikimedia.org/wikipedia/en/a/ae/Noodles_%26_Company_logo.png',
  'noodles and company': 'https://upload.wikimedia.org/wikipedia/en/a/ae/Noodles_%26_Company_logo.png',
  'outback steakhouse': 'https://commons.wikimedia.org/wiki/Special:FilePath/OutbackLogo.png?width=512',
  'texas roadhouse': 'https://upload.wikimedia.org/wikipedia/en/b/b0/Texas_Roadhouse.svg',
  'faw': 'https://upload.wikimedia.org/wikipedia/en/4/41/FAW_Group_logo_%282009%29.png',
  'man': 'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20MAN.png?width=512',
  'ram': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ram%20Trucks%202009%20wordmark.svg?width=512'
};
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

function sanitizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function downloadImage(sourceUrl, attempts = 5) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'image/*,*/*'
        }
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1500 + i * 1500);
        continue;
      }
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer || buffer.length < 1024) return null;
      return { buffer, contentType };
    } catch {
      await sleep(800 + i * 1200);
    }
  }
  return null;
}

function toCommonsFilePath(filename, size) {
  const safeName = String(filename || '').replace(/\s+/g, '_');
  const width = Number.isFinite(size) ? size : 512;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safeName)}?width=${width}`;
}

function normalizeCommonsLogo(value, size) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('Special:FilePath/')) {
    const url = raw.split('?')[0];
    return `${url}?width=${Number.isFinite(size) ? size : 512}`;
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

async function fetchLogoByDomain(domain, size) {
  const cleanDomain = sanitizeDomain(domain);
  if (!cleanDomain) return '';
  const domainPattern = escapeRegex(cleanDomain).replace(/\"/g, '');
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
      'User-Agent': USER_AGENT,
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
    headers: { 'User-Agent': USER_AGENT }
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
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!entityRes.ok) continue;
    const entityPayload = await entityRes.json();
    const entity = entityPayload?.entities?.[qid];
    if (!entity) continue;
    if (domainNeedle) {
      const siteClaim = entity?.claims?.P856?.[0];
      const siteUrl = siteClaim?.mainsnak?.datavalue?.value || '';
      const siteDomain = sanitizeDomain(siteUrl);
      if (!siteDomain || siteDomain !== domainNeedle) {
        continue;
      }
    }
    const logoClaim = entity?.claims?.P154?.[0];
    const logoFile = logoClaim?.mainsnak?.datavalue?.value;
    if (!logoFile) continue;
    return normalizeCommonsLogo(logoFile, size);
  }
  return '';
}

async function findWikipediaPageTitle(title) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return '';
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('srsearch', cleanTitle);
  searchUrl.searchParams.set('srlimit', '3');
  const searchRes = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!searchRes.ok) return '';
  const payload = await searchRes.json();
  const result = payload?.query?.search?.[0];
  return result?.title || '';
}

async function fetchCommonsLogoFromWikipediaPage(pageTitle, brandName = '') {
  const title = String(pageTitle || '').trim();
  if (!title) return '';
  const imagesUrl = new URL('https://en.wikipedia.org/w/api.php');
  imagesUrl.searchParams.set('action', 'query');
  imagesUrl.searchParams.set('format', 'json');
  imagesUrl.searchParams.set('prop', 'images');
  imagesUrl.searchParams.set('titles', title);
  const imagesRes = await fetch(imagesUrl.toString(), {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!imagesRes.ok) return '';
  const imagesPayload = await imagesRes.json();
  const pages = Object.values(imagesPayload?.query?.pages || {});
  const images = pages.flatMap((page) => page?.images || []);
  const candidates = images
    .map((img) => String(img?.title || ''))
    .filter((name) => {
      const lower = name.toLowerCase();
      if (!(lower.includes('logo') || lower.includes('wordmark'))) return false;
      if (isGenericCommonsLogo(lower)) return false;
      if (brandName && !matchesBrandTitle(brandName, name)) return false;
      return true;
    });

  for (const fileTitle of candidates) {
    const commonsUrl = await fetchImageInfoUrl(fileTitle, 'commons.wikimedia.org');
    if (commonsUrl) return commonsUrl;
    const enwikiUrl = await fetchImageInfoUrl(fileTitle, 'en.wikipedia.org');
    if (enwikiUrl) return enwikiUrl;
  }
  return '';
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

const MANUAL_LOGO_OVERRIDES_NORMALIZED = Object.fromEntries(
  Object.entries(MANUAL_LOGO_OVERRIDES).map(([key, value]) => [normalizeSearchText(key), value])
);

function resolveManualOverride(name, domain) {
  const nameKey = normalizeSearchText(name);
  if (nameKey && MANUAL_LOGO_OVERRIDES_NORMALIZED[nameKey]) {
    return MANUAL_LOGO_OVERRIDES_NORMALIZED[nameKey];
  }
  const domainKey = normalizeSearchText(sanitizeDomain(domain));
  if (domainKey && MANUAL_LOGO_OVERRIDES_NORMALIZED[domainKey]) {
    return MANUAL_LOGO_OVERRIDES_NORMALIZED[domainKey];
  }
  return '';
}

function matchesBrandTitle(brandName, title) {
  const brandKey = normalizeSearchText(brandName);
  if (!brandKey || brandKey.length < 4) return false;
  const titleKey = normalizeSearchText(title);
  if (!titleKey) return false;
  return titleKey.includes(brandKey);
}

function isGenericCommonsLogo(value) {
  const raw = String(value || '').toLowerCase();
  return raw.includes('commons-logo') || raw.includes('wikipedia-logo') || raw.includes('wikimedia-logo');
}

function isLikelyLogoUrl(url, brandName = '') {
  const raw = String(url || '').toLowerCase();
  if (!raw) return false;
  if (!(raw.includes('logo') || raw.includes('wordmark') || raw.includes('brand'))) return false;
  if (brandName) {
    const brandKey = normalizeSearchText(brandName);
    if (brandKey && !normalizeSearchText(raw).includes(brandKey)) {
      return false;
    }
  }
  return /\.(svg|png|jpe?g|webp)(\?|$)/i.test(raw);
}

function isImageUrl(url) {
  return /\.(svg|png|jpe?g|webp)(\?|$)/i.test(String(url || '').toLowerCase());
}

function parseJsonLd(html) {
  const scripts = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = regex.exec(html);
  while (match) {
    scripts.push(match[1]);
    match = regex.exec(html);
  }
  const parsed = [];
  scripts.forEach((block) => {
    try {
      const data = JSON.parse(block.trim());
      if (Array.isArray(data)) parsed.push(...data);
      else parsed.push(data);
    } catch {
      // ignore
    }
  });
  return parsed;
}

function resolveAbsoluteUrl(baseUrl, url) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return '';
  }
}

async function fetchImageInfoUrl(fileTitle, wikiHost) {
  const apiUrl = new URL(`https://${wikiHost}/w/api.php`);
  apiUrl.searchParams.set('action', 'query');
  apiUrl.searchParams.set('format', 'json');
  apiUrl.searchParams.set('prop', 'imageinfo');
  apiUrl.searchParams.set('iiprop', 'url');
  apiUrl.searchParams.set('titles', fileTitle);
  const res = await fetch(apiUrl.toString(), {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) return '';
  const payload = await res.json();
  const page = Object.values(payload?.query?.pages || {})?.[0];
  const url = page?.imageinfo?.[0]?.url || '';
  if (!url || isGenericCommonsLogo(url)) return '';
  return url;
}

function extractLogoImg(html, baseUrl) {
  const regex = /<img[^>]+>/gi;
  let match = regex.exec(html);
  while (match) {
    const tag = match[0];
    if (/logo/i.test(tag)) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i) || tag.match(/data-src=["']([^"']+)["']/i);
      if (srcMatch?.[1]) {
        const url = resolveAbsoluteUrl(baseUrl, srcMatch[1]);
        if (isImageUrl(url)) return url;
      }
    }
    match = regex.exec(html);
  }
  return '';
}

async function fetchSiteLogo(domain, brandName) {
  const cleanDomain = sanitizeDomain(domain);
  if (!cleanDomain) return '';
  const candidates = [`https://${cleanDomain}`, `http://${cleanDomain}`];
  let html = '';
  let baseUrl = '';
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      baseUrl = candidate;
      html = await res.text();
      break;
    } catch {
      // ignore
    }
  }
  if (!html) return '';

  const metaRegex = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const metaMatch = html.match(metaRegex);
  if (metaMatch?.[1]) {
    const ogUrl = resolveAbsoluteUrl(baseUrl, metaMatch[1]);
    if (isLikelyLogoUrl(ogUrl, brandName)) return ogUrl;
  }

  const jsonLd = parseJsonLd(html);
  for (const entry of jsonLd) {
    const logo = entry?.logo || entry?.publisher?.logo || entry?.organization?.logo;
    if (typeof logo === 'string') {
      const logoUrl = resolveAbsoluteUrl(baseUrl, logo);
      if (isImageUrl(logoUrl)) return logoUrl;
    } else if (logo?.url) {
      const logoUrl = resolveAbsoluteUrl(baseUrl, logo.url);
      if (isImageUrl(logoUrl)) return logoUrl;
    }
  }
  const logoImg = extractLogoImg(html, baseUrl);
  if (logoImg) return logoImg;
  return '';
}

async function searchCommonsLogo(title, size) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return '';
  const attempts = [
    `intitle:logo ${cleanTitle}`,
    `intitle:wordmark ${cleanTitle}`
  ];

  for (const query of attempts) {
    const searchUrl = new URL('https://commons.wikimedia.org/w/api.php');
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('generator', 'search');
    searchUrl.searchParams.set('gsrsearch', query);
    searchUrl.searchParams.set('gsrnamespace', '6');
    searchUrl.searchParams.set('gsrlimit', '5');
    searchUrl.searchParams.set('prop', 'imageinfo');
    searchUrl.searchParams.set('iiprop', 'url');
    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!searchRes.ok) continue;
    const payload = await searchRes.json();
    const pages = Object.values(payload?.query?.pages || {});
    const candidate = pages.find((page) => {
      const titleName = String(page?.title || '');
      if (!titleName) return false;
      if (!matchesBrandTitle(cleanTitle, titleName)) return false;
      const lowered = titleName.toLowerCase();
      return lowered.includes('logo') || lowered.includes('wordmark');
    }) || pages.find((page) => matchesBrandTitle(cleanTitle, page?.title || ''));
    const url = candidate?.imageinfo?.[0]?.url;
    if (url && !isGenericCommonsLogo(url)) return url;
  }
  return '';
}

function clearbitLogo(domain, size) {
  const cleanDomain = sanitizeDomain(domain);
  if (!cleanDomain) return '';
  const sz = Number.isFinite(size) ? size : 512;
  return `https://logo.clearbit.com/${cleanDomain}?size=${sz}`;
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

const BUCKET_NAME = 'brand-logos';
const TABLES = [
  { kind: 'fashion', table: 'fashion_brands' },
  { kind: 'food', table: 'food_brands' },
  { kind: 'car', table: 'car_brands' }
];

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (data && !error) return;
  await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024
  });
}

async function uploadLogoObject(table, row, sourceUrl) {
  const url = new URL(sourceUrl);
  const extMatch = url.pathname.split('.').pop() || 'svg';
  const ext = extMatch.split('?')[0].toLowerCase();
  const key = slugify(row.domain || row.name || row.id || 'brand');
  const filePath = `${table}/${key}.${ext}`;
  const downloaded = await downloadImage(sourceUrl);
  if (!downloaded) throw new Error(`Download failed: ${sourceUrl}`);
  const buffer = downloaded.buffer;
  const contentType = downloaded.contentType || (ext === 'svg' ? 'image/svg+xml' : 'image/png');
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, { contentType, upsert: true, cacheControl: '86400' });
  if (uploadError) throw uploadError;
  const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;
  return publicUrl;
}

async function processTable(table, options = {}) {
  const size = Number(options.size || 512);
  const delayMs = Number(options.delayMs || 350);
  const limit = Number(options.limit || 0);
  const allowClearbit = !!options.allowClearbit;

  const { data, error } = await supabase
    .from(table)
    .select('id, name, domain, logo_url')
    .is('logo_url', null)
    .order('name', { ascending: true });

  if (error) throw error;
  if (!data || !data.length) return { updated: 0 };

  let updated = 0;
  for (const row of data) {
    if (limit && updated >= limit) break;
    const title = String(row?.name || '').trim();
    const domain = String(row?.domain || '').trim();

    let logoSource = '';
    logoSource = resolveManualOverride(title, domain);
    if (!logoSource && domain) logoSource = await fetchLogoByDomain(domain, size);
    if (!logoSource && title) logoSource = await fetchLogoByLabel(title, size, domain);
    if (!logoSource && title) {
      const pageTitle = await findWikipediaPageTitle(title);
      if (pageTitle) logoSource = await fetchCommonsLogoFromWikipediaPage(pageTitle, title);
    }
    if (!logoSource && title) logoSource = await searchCommonsLogo(title, size);
    if (!logoSource && domain) logoSource = await fetchSiteLogo(domain, title);
    if (!logoSource && allowClearbit && domain) logoSource = clearbitLogo(domain, size);

    if (logoSource) {
      try {
        const publicUrl = await uploadLogoObject(table, row, logoSource);
        const { error: updateError } = await supabase
          .from(table)
          .update({ logo_url: publicUrl })
          .eq('id', row.id);
        if (updateError) throw updateError;
        updated += 1;
      } catch (err) {
        console.warn(`Skip ${row.name}: ${err?.message || err}`);
      }
    }
    await sleep(delayMs);
  }
  return { updated };
}

async function run() {
  const kind = normalizeKind(parseArg('--kind', 'all'));
  const delayMs = Number(parseArg('--delay', 350));
  const size = Number(parseArg('--size', 512));
  const limit = Number(parseArg('--limit', 0));
  const allowClearbit = String(parseArg('--allow-clearbit', '') || '').toLowerCase() === 'true';

  const targets = kind === 'all'
    ? TABLES
    : TABLES.filter((entry) => entry.kind === kind);

  if (!targets.length) {
    console.error('No valid table target. Use --kind fashion|food|car|all');
    process.exit(1);
  }

  await ensureBucket();
  for (const target of targets) {
    console.log(`Uploading logos for ${target.table}...`);
    const result = await processTable(target.table, { delayMs, size, limit, allowClearbit });
    console.log(`${target.table}: updated ${result.updated}`);
    await sleep(800);
  }
  console.log('Upload complete.');
}

run().catch((err) => {
  console.error('Upload error:', err?.message || err);
  process.exit(1);
});
