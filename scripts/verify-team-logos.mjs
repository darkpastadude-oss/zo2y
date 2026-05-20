import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'),
  path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env.vercel'),
  path.join(ROOT, '.env.vercel.prod')
];

function loadEnvFile(filePath) {
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

function hydrateEnv() { ENV_FILES.forEach(loadEnvFile); }
hydrateEnv();

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function fetchAllTeams() {
  const pageSize = 1000;
  let offset = 0;
  const out = [];
  while (true) {
    const { data, error } = await supabase
      .from('teams')
      .select('id,name,sport,league,logo_url')
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: true });
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
    if (offset > 20000) break;
  }
  return out;
}

async function checkUrl(url) {
  if (!url) return 'EMPTY';
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (res.ok) return 'OK';
    return `HTTP ${res.status}`;
  } catch (e) {
    if (e.name === 'TimeoutError') return 'TIMEOUT';
    return e?.cause?.code || e?.message || 'FETCH_ERR';
  }
}

function categorize(url) {
  if (!url) return 'empty';
  if (url.startsWith('/assets/')) return 'local';
  if (url.includes('supabase.co/storage')) return 'supabase-storage';
  if (url.includes('thesportsdb.com') || url.includes('sportsdb')) return 'sportsdb';
  return 'other';
}

async function main() {
  const rows = await fetchAllTeams();
  console.log(`Total teams: ${rows.length}\n`);

  const missing = rows.filter(r => !r.logo_url);
  const emptyStr = rows.filter(r => r.logo_url === '');
  const fileSvg = rows.filter(r => r.logo_url === '/file.svg');

  const categorized = {};
  rows.forEach(r => {
    const cat = categorize(r.logo_url);
    if (!categorized[cat]) categorized[cat] = 0;
    categorized[cat]++;
  });

  console.log('=== Logo status summary ===');
  console.log(`Missing (null/undefined): ${missing.length}`);
  console.log(`Empty string: ${emptyStr.length}`);
  console.log(`file.svg fallback: ${fileSvg.length}`);

  if (missing.length || emptyStr.length || fileSvg.length) {
    console.log('\nTeams without proper logos:');
    (missing.concat(emptyStr, fileSvg)).forEach(r => {
      console.log(`  [${r.sport}] ${r.name} (${r.league}) logo_url=${JSON.stringify(r.logo_url)}`);
    });
  }

  console.log('\n=== Logo URL sources ===');
  Object.entries(categorized).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  console.log('\n=== Checking URL accessibility (sample) ===');
  const toCheck = rows.filter(r => r.logo_url && r.logo_url !== '/file.svg');
  const results = { ok: 0, fail: 0, timeout: 0 };
  const failures = [];

  for (const row of toCheck) {
    const status = await checkUrl(row.logo_url);
    if (status === 'OK') {
      results.ok++;
    } else if (status === 'TIMEOUT') {
      results.timeout++;
      failures.push({ name: row.name, url: row.logo_url, status });
    } else {
      results.fail++;
      failures.push({ name: row.name, url: row.logo_url, status });
    }
    if ((results.ok + results.fail + results.timeout) % 50 === 0) {
      process.stdout.write('.');
    }
  }

  console.log(`\n\n=== URL check results ===`);
  console.log(`OK: ${results.ok}, Fail: ${results.fail}, Timeout: ${results.timeout}`);

  if (failures.length) {
    console.log(`\nFailed URLs (${failures.length}):`);
    failures.slice(0, 30).forEach(f => {
      console.log(`  ${f.name}: ${f.status} — ${f.url}`);
    });
    if (failures.length > 30) {
      console.log(`  ... and ${failures.length - 30} more`);
    }
  }

  console.log('\n=== Teams needing SportsDB badges (not local) ===');
  const sportsDbTeams = rows.filter(r => categorize(r.logo_url) === 'sportsdb');
  console.log(`Total SportsDB-reliant: ${sportsDbTeams.length}`);
  sportsDbTeams.forEach(r => console.log(`  ${r.name} (${r.league})`));
}

main().catch(err => { console.error(err); process.exit(1); });
