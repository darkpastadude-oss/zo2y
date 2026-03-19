import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));
const TABLE_CONFIG = [
  { table: 'fashion_brands', listTable: 'fashion_list_items' },
  { table: 'food_brands', listTable: 'food_list_items' },
  { table: 'car_brands', listTable: 'car_list_items' }
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

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '');
}

function scoreRow(row) {
  const logo = String(row.logo_url || '').trim();
  const localLogo = logo.includes('/storage/v1/object/public/brand-logos/');
  const slug = String(row.slug || '').trim();
  let score = 0;
  if (localLogo) score += 8;
  else if (logo) score += 4;
  if (String(row.description || '').trim()) score += 2;
  if (String(row.country || '').trim()) score += 1;
  if (String(row.founded || '').trim()) score += 1;
  if (slug && !slug.includes('-com') && !slug.includes('-co-uk') && !slug.includes('-com-cn')) score += 2;
  score -= Math.min(slug.length / 20, 1);
  return score;
}

function mergeRows(primary, duplicates) {
  const merged = { ...primary };
  duplicates.forEach((row) => {
    if (!merged.logo_url && row.logo_url) merged.logo_url = row.logo_url;
    if (!merged.description && row.description) merged.description = row.description;
    if (!merged.category && row.category) merged.category = row.category;
    if (!merged.country && row.country) merged.country = row.country;
    if (!merged.founded && row.founded) merged.founded = row.founded;
    if ((!merged.tags || !merged.tags.length) && Array.isArray(row.tags) && row.tags.length) merged.tags = row.tags;
    if (!merged.domain && row.domain) merged.domain = row.domain;
  });
  return merged;
}

async function migrateListItems(supabase, listTable, duplicateId, keepId) {
  const { data, error } = await supabase
    .from(listTable)
    .select('id,user_id,list_type,brand_id')
    .eq('brand_id', duplicateId);
  if (error || !Array.isArray(data) || !data.length) return;

  for (const item of data) {
    const { data: existing } = await supabase
      .from(listTable)
      .select('id')
      .eq('user_id', item.user_id)
      .eq('list_type', item.list_type)
      .eq('brand_id', keepId)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from(listTable).delete().eq('id', item.id);
      continue;
    }
    await supabase.from(listTable).update({ brand_id: keepId }).eq('id', item.id);
  }
}

async function cleanupTable(supabase, { table, listTable }) {
  const { data, error } = await supabase
    .from(table)
    .select('id,slug,name,domain,logo_url,description,category,country,founded,tags,created_at')
    .limit(5000);
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  const groups = new Map();
  rows.forEach((row) => {
    const key = normalizeDomain(row.domain) || normalizeName(row.name);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  let removed = 0;
  let updated = 0;

  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const ranked = [...group].sort((a, b) => scoreRow(b) - scoreRow(a));
    const keep = ranked[0];
    const dupes = ranked.slice(1);
    const merged = mergeRows(keep, dupes);
    const { error: updateError } = await supabase
      .from(table)
      .update({
        name: merged.name,
        slug: merged.slug,
        domain: merged.domain,
        logo_url: merged.logo_url,
        description: merged.description,
        category: merged.category,
        country: merged.country,
        founded: merged.founded,
        tags: merged.tags
      })
      .eq('id', keep.id);
    if (updateError) throw updateError;
    updated += 1;

    for (const dupe of dupes) {
      await migrateListItems(supabase, listTable, dupe.id, keep.id);
      const { error: deleteError } = await supabase.from(table).delete().eq('id', dupe.id);
      if (deleteError) throw deleteError;
      removed += 1;
    }
  }

  return { table, updated, removed };
}

async function main() {
  hydrateEnv();
  const supabase = createClient(
    normalizeSupabaseUrl(process.env.SUPABASE_URL),
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  for (const config of TABLE_CONFIG) {
    const result = await cleanupTable(supabase, config);
    console.log(JSON.stringify(result));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
