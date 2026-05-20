import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [path.join(ROOT, 'backend', '.env'), path.join(ROOT, '.env')];
function loadEnvFile(p) { if (!fs.existsSync(p)) return; const raw = fs.readFileSync(p, 'utf8'); raw.split(/\r?\n/).forEach(line => { const t = line.trim(); if (!t || t.startsWith('#')) return; const i = t.indexOf('='); if (i === -1) return; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v; }); }
ENV_FILES.forEach(loadEnvFile);

const supabase = createClient(
  (process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : `https://${process.env.SUPABASE_URL}.supabase.co`) || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Load manifest the same way as front-end
const MANIFEST_PATH = path.join(ROOT, 'assets/sports-badges/local-manifest.json');
const localBadgeMap = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const localBadgeMapLower = {};
Object.entries(localBadgeMap).forEach(([name, url]) => { localBadgeMapLower[name.toLowerCase()] = url; });

const FALLBACK_BADGE = '/file.svg';

const BADGE_OVERRIDES = {
  'atletico madrid': '/assets/sports-badges/atletico-madrid.png',
  'psg': '/assets/sports-badges/psg.png',
  'paris saint germain': '/assets/sports-badges/psg.png',
  'sao paulo': '/assets/sports-badges/s-o-paulo.png',
  'al hilal': '/assets/sports-badges/al-hilal.png',
  'al nassr': '/assets/sports-badges/al-nassr.png',
  'al ahly': '/assets/sports-badges/al-ahly.png',
  'ferrari': '/assets/sports-badges/scuderia-ferrari-hp.png',
  'red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
  'mercedes': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
  'mclaren': '/assets/sports-badges/mclaren-formula-1-team.png',
  'aston martin': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
  'alpine': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
  'williams': '/assets/sports-badges/williams-racing.png',
  'rb': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
  'kick sauber': '/assets/sports-badges/kick-sauber.png',
  'haas': '/assets/sports-badges/moneygram-haas-f1-team.png',
  'audi': '/assets/sports-badges/audi-revolut-f1-team.png',
  'cadillac': '/assets/sports-badges/cadillac-formula-1-team.png'
};

function stripDiacritics(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function slugMatch(s) { return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

function getBadge(team) {
  if (team.logo_url && team.logo_url !== '/file.svg') return team.logo_url;
  const nameKey = (team.name || '').toLowerCase().trim();
  if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
  if (localBadgeMap[team.name]) return localBadgeMap[team.name];
  if (localBadgeMapLower[nameKey]) return localBadgeMapLower[nameKey];
  const slugged = slugMatch(team.name);
  const exact = Object.keys(localBadgeMapLower).find(k => slugMatch(k) === slugged);
  if (exact) return localBadgeMapLower[exact];
  const sorted = Object.keys(localBadgeMapLower).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    const keySlug = slugMatch(key);
    if (keySlug.length >= 4 && (slugged.includes(keySlug) || keySlug.includes(slugged))) {
      return localBadgeMapLower[key];
    }
  }
  return FALLBACK_BADGE;
}

async function main() {
  const { data } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name').limit(5000);
  const teams = data || [];
  console.log(`Total teams: ${teams.length}\n`);

  let dbBadge = 0, override = 0, manifest = 0, manifestLower = 0, slugExact = 0, slugFuzzy = 0, fallback = 0;
  const fallbacks = [];

  for (const t of teams) {
    const badge = getBadge(t);
    if (t.logo_url && t.logo_url !== '/file.svg' && t.logo_url !== '') {
      dbBadge++; continue;
    }
    const n = (t.name || '').toLowerCase().trim();
    if (BADGE_OVERRIDES[n]) { override++; continue; }
    if (localBadgeMap[t.name]) { manifest++; continue; }
    if (localBadgeMapLower[n]) { manifestLower++; continue; }
    const s = slugMatch(t.name);
    if (Object.keys(localBadgeMapLower).find(k => slugMatch(k) === s)) { slugExact++; continue; }
    const sorted = Object.keys(localBadgeMapLower).sort((a, b) => b.length - a.length);
    let fuzzy = false;
    for (const key of sorted) {
      const ks = slugMatch(key);
      if (ks.length >= 4 && (s.includes(ks) || ks.includes(s))) { fuzzy = true; break; }
    }
    if (fuzzy) { slugFuzzy++; continue; }
    fallback++;
    fallbacks.push(t.name + ' (' + t.league + ')');
  }

  console.log('=== Badge resolution sources (front-end simulation) ===');
  console.log(`  DB logo_url:      ${dbBadge}`);
  console.log(`  BADGE_OVERRIDES:  ${override}`);
  console.log(`  manifest exact:   ${manifest}`);
  console.log(`  manifest lower:   ${manifestLower}`);
  console.log(`  slug exact:       ${slugExact}`);
  console.log(`  slug fuzzy:       ${slugFuzzy}`);
  console.log(`  FALLBACK /file.svg: ${fallback}`);
  console.log(`  Total:            ${dbBadge + override + manifest + manifestLower + slugExact + slugFuzzy + fallback}`);

  if (fallbacks.length) {
    console.log('\n=== Teams using fallback ===');
    fallbacks.forEach(f => console.log('  ' + f));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
