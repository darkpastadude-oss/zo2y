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

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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

async function dedupeTable(config) {
  const { brandTable, listItemsTable, reviewsTable, label } = config;
  const { data, error } = await supabase
    .from(brandTable)
    .select('id, name, slug, domain, created_at');
  if (error) throw error;
  const rows = data || [];
  const groups = new Map();
  rows.forEach((row) => {
    const domainKey = normalizeDomain(row.domain);
    const nameKey = normalizeName(row.name);
    const key = domainKey ? `domain:${domainKey}` : `name:${nameKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  let updated = 0;
  let removed = 0;

  for (const [key, items] of groups.entries()) {
    if (items.length < 2) continue;
    const sorted = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const keep = sorted[0];
    const duplicates = sorted.slice(1);
    for (const dup of duplicates) {
      if (listItemsTable) {
        const { error: listError } = await supabase
          .from(listItemsTable)
          .update({ brand_id: keep.id })
          .eq('brand_id', dup.id);
        if (listError) throw listError;
      }
      if (reviewsTable) {
        const { error: reviewError } = await supabase
          .from(reviewsTable)
          .update({ brand_id: keep.id })
          .eq('brand_id', dup.id);
        if (reviewError) throw reviewError;
      }
      const { error: delError } = await supabase
        .from(brandTable)
        .delete()
        .eq('id', dup.id);
      if (delError) throw delError;
      updated += 1;
      removed += 1;
    }
  }

  console.log(`${label}: merged ${updated} duplicates, removed ${removed} rows.`);
}

async function run() {
  await dedupeTable({
    label: 'Fashion',
    brandTable: 'fashion_brands',
    listItemsTable: 'fashion_list_items',
    reviewsTable: 'fashion_reviews'
  });
  await dedupeTable({
    label: 'Food',
    brandTable: 'food_brands',
    listItemsTable: 'food_list_items',
    reviewsTable: 'food_reviews'
  });
}

run().catch((err) => {
  console.error('Dedupe error:', err?.message || err);
  process.exit(1);
});
