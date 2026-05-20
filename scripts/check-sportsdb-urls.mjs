import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'), path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'), path.join(ROOT, '.env.vercel'), path.join(ROOT, '.env.vercel.prod')
];
function loadEnvFile(p) { if (!fs.existsSync(p)) return; const raw = fs.readFileSync(p, 'utf8'); raw.split(/\r?\n/).forEach(line => { const t = line.trim(); if (!t || t.startsWith('#')) return; const i = t.indexOf('='); if (i === -1) return; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v; }); }
ENV_FILES.forEach(loadEnvFile);
const SUPABASE_URL = (process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : `https://${process.env.SUPABASE_URL}.supabase.co`) || '';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name').limit(5000);
  const rows = data || [];
  const sportsdbUrls = rows.filter(r => r.logo_url?.includes('thesportsdb.com') || r.logo_url?.includes('sportsdb'));

  console.log(`Teams with SportsDB URLs: ${sportsdbUrls.length}`);
  console.log(`\n=== Sample SportsDB URLs ===`);
  sportsdbUrls.slice(0, 20).forEach(r => console.log(`  ${r.name}: ${r.logo_url}`));
  if (sportsdbUrls.length > 20) console.log(`  ... and ${sportsdbUrls.length - 20} more`);

  console.log(`\n=== Checking for bad/truncated URLs ===`);
  let bad = 0;
  for (const r of sportsdbUrls) {
    if (!r.logo_url.startsWith('http')) { console.log(`  BAD (not http): ${r.name} — ${r.logo_url}`); bad++; }
    if (r.logo_url.includes(' ') || r.logo_url.includes('%')) { console.log(`  SUSPICIOUS: ${r.name} — ${r.logo_url}`); }
  }
  if (!bad) console.log('  All SportsDB URLs start with http — good');

  console.log(`\n=== Teams with supabase-storage URLs ===`);
  const storageUrls = rows.filter(r => r.logo_url?.includes('supabase.co/storage'));
  storageUrls.forEach(r => console.log(`  ${r.name}: ${r.logo_url}`));

  console.log(`\n=== All teams with their logo_url ===`);
  rows.forEach(r => console.log(`${r.name}: ${r.logo_url || '(empty)'}`));
}

main().catch(err => { console.error(err); process.exit(1); });
