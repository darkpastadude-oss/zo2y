import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'),
  path.join(ROOT, '.env.vercel.prod'),
  path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env.vercel')
];

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
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
    process.env[key] = value;
  });
}

ENV_FILES.forEach(loadEnv);

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

const APPLY = process.argv.includes('--apply');
const SINCE = (process.argv.find((a) => a.startsWith('--since=')) || '').split('=')[1] || '';

if (!SINCE) {
  console.error('Missing --since=ISO_TIMESTAMP (example: 2026-05-20T14:20:00Z)');
  process.exit(1);
}

async function fetchAllTeams() {
  const pageSize = 1000;
  let offset = 0;
  const out = [];
  while (true) {
    const { data, error } = await supabase
      .from('teams')
      .select('id,logo_url,created_at,updated_at', { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: true });
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
    if (offset > 50000) break;
  }
  return out;
}

async function main() {
  const since = new Date(SINCE);
  if (Number.isNaN(since.getTime())) {
    console.error('Invalid --since timestamp:', SINCE);
    process.exit(1);
  }

  const rows = await fetchAllTeams();
  const createdAfter = rows.filter((r) => new Date(r.created_at) >= since);
  const updatedAfter = rows.filter((r) => new Date(r.updated_at) >= since && new Date(r.created_at) < since);

  console.log(`[rollback] total=${rows.length} createdAfter=${createdAfter.length} updatedAfter=${updatedAfter.length} apply=${APPLY}`);
  if (!APPLY) {
    console.log('Dry run only. Re-run with `--apply` to execute rollback.');
    return;
  }

  if (createdAfter.length) {
    let deleted = 0;
    for (const batch of chunk(createdAfter.map((r) => r.id), 200)) {
      const { error } = await supabase.from('teams').delete().in('id', batch);
      if (error) throw error;
      deleted += batch.length;
      console.log(`[rollback] deleted ${deleted}/${createdAfter.length}`);
    }
  }

  // Best-effort restore for updated rows (we don’t have old values, so revert logo_url to empty).
  if (updatedAfter.length) {
    let restored = 0;
    for (const batch of chunk(updatedAfter.map((r) => r.id), 100)) {
      for (const id of batch) {
        const { error } = await supabase.from('teams').update({ logo_url: '' }).eq('id', id);
        if (error) throw error;
        restored++;
      }
      console.log(`[rollback] restored logo_url ${restored}/${updatedAfter.length}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

