import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod', 'backend/.env'].map((file) => path.join(ROOT, file));
const DEFAULT_BASE_URL = 'https://www.zo2y.com';
const DEFAULT_LIMIT_PER_QUERY = 40;
const DEFAULT_PAGE_COUNT = 3;
const DEFAULT_SEARCH_PAGE_COUNT = 2;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_DELAY_MS = 120;

const SUBJECTS = [
  'fiction',
  'fantasy',
  'mystery',
  'romance',
  'history',
  'biography',
  'science',
  'philosophy',
  'business',
  'self-help',
  'horror',
  'thriller',
  'young adult',
  'classics',
  'graphic novels',
  'manga',
  'poetry',
  'psychology',
  'technology',
  'politics'
];

const SEARCH_TERMS = [
  'bestseller',
  'award winning fiction',
  'best fantasy novels',
  'best mystery novels',
  'top biographies',
  'classic literature',
  'science books',
  'history books',
  'philosophy books',
  'business strategy',
  'self improvement',
  'psychology books',
  'manga',
  'graphic novels',
  'horror novels',
  'thriller books',
  'young adult fantasy',
  'romance novels',
  'technology books',
  'political books'
];

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
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}.supabase.co`;
}

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getBookId(doc, idx = 0) {
  const googleVolumeId = String(doc?._googleVolumeId || '').trim();
  if (googleVolumeId) return googleVolumeId;
  const workKey = String(doc?.key || '').trim();
  if (workKey.startsWith('/works/')) {
    const workId = workKey.replace('/works/', '').trim();
    if (workId) return workId;
  }
  const title = slugify(doc?.title || `book-${idx}`);
  const author = slugify(Array.isArray(doc?.author_name) ? doc.author_name[0] : 'unknown');
  const year = String(doc?.first_publish_year || 'na').trim();
  return `${title}-${author}-${year || 'na'}`.slice(0, 120);
}

function normalizeBookRecord(doc, idx = 0) {
  const title = String(doc?.title || '').trim();
  if (!title) return null;
  const id = getBookId(doc, idx);
  const authors = Array.isArray(doc?.author_name)
    ? doc.author_name.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const categories = Array.isArray(doc?.subject)
    ? doc.subject.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 12)
    : [];
  const publisher = Array.isArray(doc?.publisher) ? String(doc.publisher[0] || '').trim() : '';
  const description = String(doc?.description || '').trim();
  const publishedYear = Number(doc?.first_publish_year || 0);
  const publishedDate = Number.isFinite(publishedYear) && publishedYear > 0 ? `${String(publishedYear).slice(0, 4)}-01-01` : null;
  const thumbnail = String(doc?.coverImage || doc?._googleThumbnail || '').trim();
  return {
    id,
    title,
    authors: authors.join(', '),
    thumbnail,
    published_date: publishedDate,
    categories,
    description,
    page_count: Number(doc?.number_of_pages_median || doc?.pageCount || 0) || null,
    publisher: publisher || null,
    updated_at: new Date().toISOString()
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchPopular(baseUrl, subject, page, limit) {
  const url = new URL('/api/books/popular', `${baseUrl}/`);
  url.searchParams.set('subject', subject);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('language', 'en');
  return fetchJson(url.toString());
}

async function fetchSearch(baseUrl, query, page, limit) {
  const url = new URL('/api/books/search', `${baseUrl}/`);
  url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('language', 'en');
  return fetchJson(url.toString());
}

async function fetchTrending(baseUrl, limit) {
  const url = new URL('/api/books/trending', `${baseUrl}/`);
  url.searchParams.set('period', 'weekly');
  url.searchParams.set('limit', String(limit));
  return fetchJson(url.toString());
}

function dedupeRecords(records) {
  const map = new Map();
  for (const record of records) {
    if (!record?.id || !record?.title) continue;
    const existing = map.get(record.id);
    if (!existing) {
      map.set(record.id, record);
      continue;
    }
    map.set(record.id, {
      ...existing,
      ...record,
      categories: Array.from(new Set([...(existing.categories || []), ...(record.categories || [])])).slice(0, 16),
      authors: record.authors || existing.authors,
      thumbnail: record.thumbnail || existing.thumbnail,
      description: record.description || existing.description,
      page_count: record.page_count || existing.page_count,
      publisher: record.publisher || existing.publisher
    });
  }
  return Array.from(map.values());
}

async function runQueue(items, worker, concurrency) {
  const queue = items.slice();
  const output = [];
  async function runWorker() {
    while (queue.length) {
      const next = queue.shift();
      if (!next) continue;
      const result = await worker(next);
      if (Array.isArray(result)) output.push(...result);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));
  return output;
}

async function main() {
  hydrateEnv();
  const baseUrl = String(parseArg('--base-url', process.env.APP_BASE_URL || DEFAULT_BASE_URL)).trim() || DEFAULT_BASE_URL;
  const limit = clampInt(parseArg('--limit', ''), 1, 40, DEFAULT_LIMIT_PER_QUERY);
  const pageCount = clampInt(parseArg('--pages', ''), 1, 10, DEFAULT_PAGE_COUNT);
  const searchPages = clampInt(parseArg('--search-pages', ''), 1, 8, DEFAULT_SEARCH_PAGE_COUNT);
  const concurrency = clampInt(parseArg('--concurrency', ''), 1, 8, DEFAULT_CONCURRENCY);
  const delayMs = clampInt(parseArg('--delay', ''), 0, 2000, DEFAULT_DELAY_MS);
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const tasks = [];
  SUBJECTS.forEach((subject) => {
    for (let page = 1; page <= pageCount; page += 1) {
      tasks.push({ type: 'popular', subject, page });
    }
  });
  SEARCH_TERMS.forEach((query) => {
    for (let page = 1; page <= searchPages; page += 1) {
      tasks.push({ type: 'search', query, page });
    }
  });
  tasks.push({ type: 'trending' });

  console.log(`Fetching books from ${baseUrl} using ${tasks.length} tasks...`);
  const rawRecords = await runQueue(tasks, async (task) => {
    try {
      let json;
      if (task.type === 'popular') {
        json = await fetchPopular(baseUrl, task.subject, task.page, limit);
      } else if (task.type === 'search') {
        json = await fetchSearch(baseUrl, task.query, task.page, limit);
      } else {
        json = await fetchTrending(baseUrl, limit);
      }
      const docs = Array.isArray(json?.docs) ? json.docs : [];
      const rows = docs.map((doc, idx) => normalizeBookRecord(doc, idx)).filter(Boolean);
      if (delayMs > 0) await sleep(delayMs);
      console.log(`[books] ${task.type}${task.subject ? `:${task.subject}` : task.query ? `:${task.query}` : ''} page=${task.page || 1} -> ${rows.length}`);
      return rows;
    } catch (error) {
      console.warn(`[books] failed ${task.type} ${task.subject || task.query || ''} page=${task.page || 1}: ${error.message}`);
      return [];
    }
  }, concurrency);

  const records = dedupeRecords(rawRecords);
  console.log(`Unique books collected: ${records.length}`);

  const batchSize = 200;
  for (let index = 0; index < records.length; index += batchSize) {
    const chunk = records.slice(index, index + batchSize);
    const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });
    if (error) throw error;
    console.log(`Upserted books batch ${Math.floor(index / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${chunk.length})`);
  }

  console.log(`Book import complete. Upserted ${records.length} rows.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
