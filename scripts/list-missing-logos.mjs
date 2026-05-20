import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
const ROOT = process.cwd();
const ENV_FILES = [path.join(ROOT, 'backend', '.env'), path.join(ROOT, '.env')];
function loadEnvFile(p) { if (!fs.existsSync(p)) return; const raw = fs.readFileSync(p, 'utf8'); raw.split(/\r?\n/).forEach(line => { const t = line.trim(); if (!t || t.startsWith('#')) return; const i = t.indexOf('='); if (i === -1) return; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v; }); }
ENV_FILES.forEach(loadEnvFile);
const SUPABASE_URL = (process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : `https://${process.env.SUPABASE_URL}.supabase.co`) || '';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error('No key loaded'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name').limit(5000);
  const teams = data || [];
  const bad = teams.filter(t => !t.logo_url || t.logo_url === '' || t.logo_url === '/file.svg' || t.logo_url === 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png');

  console.log(`Total: ${teams.length}, Missing/broken: ${bad.length}\n`);
  if (!bad.length) return;

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/sports-badges/local-manifest.json'), 'utf8'));
  function stripDiacritics(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function slug(s) { return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  const manifestSlugs = Object.entries(manifest).map(([name, url]) => ({ name, url, slug: slug(name) }));

  for (const t of bad) {
    const s = slug(t.name);
    const exact = manifestSlugs.find(e => e.slug === s);
    if (exact) { console.log(`[LOCAL AVAILABLE] ${t.name} → ${exact.url}`); continue; }
    const sub = manifestSlugs.find(e => e.slug.length >= 4 && (s.includes(e.slug) || e.slug.includes(s)));
    if (sub) { console.log(`[FUZZY MATCH] ${t.name} → ${sub.url} (via "${sub.name}")`); continue; }
    console.log(`[NO MATCH] ${t.name} (${t.league})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
