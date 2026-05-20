import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, 'backend', '.env'), path.join(ROOT, '.env'),
  path.join(ROOT, '.env.local'), path.join(ROOT, '.env.vercel'), path.join(ROOT, '.env.vercel.prod')
];
function loadEnvFile(p) { if (!fs.existsSync(p)) return; const raw = fs.readFileSync(p, 'utf8'); raw.split(/\r?\n/).forEach(line => { const t = line.trim(); if (!t || t.startsWith('#')) return; const i = t.indexOf('='); if (i === -1) return; const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v; }); }
ENV_FILES.forEach(loadEnvFile);
const SUPABASE_URL = (process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : `https://${process.env.SUPABASE_URL}.supabase.co`) || '';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Load manifest
const MANIFEST_PATH = path.join(ROOT, 'assets/sports-badges/local-manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

function stripDiacritics(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slug(s) {
  return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build normalized lookup: slug → {name, url}
const manifestSlugs = [];
Object.entries(manifest).forEach(([name, url]) => {
  manifestSlugs.push({ name, url, slug: slug(name), raw: name.toLowerCase() });
});

  // BADGE_OVERRIDES for known mismatches
  const BADGE_OVERRIDES = {
    'alaves': '/assets/sports-badges/deportivo-alav-s.png',
    'deportivo alaves': '/assets/sports-badges/deportivo-alav-s.png',
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
  'cadillac': '/assets/sports-badges/cadillac-formula-1-team.png',
};

const BADGE_OVERRIDES_LOWER = {};
Object.entries(BADGE_OVERRIDES).forEach(([k, v]) => { BADGE_OVERRIDES_LOWER[k.toLowerCase()] = v; });

function findBestBadge(teamName) {
  const key = teamName.toLowerCase().trim();
  const slugged = slug(teamName);

  // 1. Check overrides
  if (BADGE_OVERRIDES_LOWER[key]) return BADGE_OVERRIDES_LOWER[key];

  // 2. Check exact match in manifest
  if (manifest[teamName]) return manifest[teamName];

  // 3. Check lowercase exact
  const lc = teamName.toLowerCase();
  if (manifest[lc]) return manifest[lc];

  // 4. Check exact slug match (diacritics removed, non-alpha stripped)
  const exactSlug = manifestSlugs.find(e => e.slug === slugged);
  if (exactSlug) return exactSlug.url;

  // 5. Check substring slug match (prefer longer matches)
  const candidates = manifestSlugs.map(e => {
    if (slugged === e.slug) return { ...e, score: 1000 };
    if (slugged.includes(e.slug) && e.slug.length >= 4) return { ...e, score: e.slug.length };
    if (e.slug.includes(slugged) && slugged.length >= 4) return { ...e, score: slugged.length };
    return null;
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  if (candidates.length) return candidates[0].url;

  // 6. Last resort: token intersection
  const tokens = key.split(/\s+/);
  for (const token of tokens) {
    if (token.length < 3) continue;
    const tSlug = slug(token);
    const found = manifestSlugs.find(e => {
      if (e.slug.includes(tSlug) && e.slug.length >= 4) return true;
      if (tSlug.includes(e.slug) && e.slug.length >= 4) return true;
      return false;
    });
    if (found) return found.url;
  }

  return null;
}

async function main() {
  const { data: rows } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name').limit(5000);
  const teams = rows || [];

  console.log(`Total teams: ${teams.length}\n`);

  // Find duplicates by name+league
  const seen = {};
  const duplicates = [];
  for (const t of teams) {
    const key = `${t.name.toLowerCase()}|${(t.league || '').toLowerCase()}`;
    if (seen[key]) {
      duplicates.push({ keep: seen[key], remove: t });
    } else {
      seen[key] = t;
    }
  }

  if (duplicates.length) {
    console.log(`=== Duplicate teams (${duplicates.length}) ===`);
    for (const d of duplicates) {
      console.log(`  Keeping: ${d.keep.name} (${d.keep.id}), Removing: ${d.remove.name} (${d.remove.id})`);
    }
  }

  // Find teams with broken SportsDB URL (all the same default image)
  const BROKEN_URL = 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png';
  const broken = teams.filter(t => t.logo_url === BROKEN_URL);
  console.log(`\n=== Teams with broken SportsDB default image: ${broken.length} ===`);

  // Find teams where local badge can be resolved
  let resolved = 0;
  let stillMissing = 0;
  const updates = [];

  for (const t of teams) {
    const shouldFix = t.logo_url === BROKEN_URL || !t.logo_url || t.logo_url === '' || t.logo_url === '/file.svg';
    if (!shouldFix) continue;

    const badge = findBestBadge(t.name);
    if (badge) {
      updates.push({ id: t.id, logo_url: badge });
      resolved++;
    } else {
      // Clear the broken URL so front-end falls through to its own resolution
      updates.push({ id: t.id, logo_url: '' });
      stillMissing++;
      console.log(`  [NO LOCAL] ${t.name} (${t.league})`);
    }
  }

  console.log(`Local badge resolved: ${resolved}`);
  console.log(`Still missing (set to empty for fallback): ${stillMissing}`);
  console.log(`Total updates: ${updates.length}\n`);

  // Apply updates in batches
  if (updates.length && process.argv.includes('--apply')) {
    let done = 0;
    for (const batch of chunk(updates, 50)) {
      for (const item of batch) {
        const { error } = await supabase.from('teams').update({ logo_url: item.logo_url }).eq('id', item.id);
        if (error) console.error(`Update failed for ${item.id}:`, error.message);
        else done++;
      }
    }
    console.log(`Applied ${done} updates`);
  } else {
    console.log('Dry run — pass --apply to write changes');
  }

  // Delete duplicates
  if (duplicates.length && process.argv.includes('--apply')) {
    let delCount = 0;
    for (const d of duplicates) {
      const { error } = await supabase.from('teams').delete().eq('id', d.remove.id);
      if (!error) { delCount++; }
    }
    console.log(`Deleted ${delCount} duplicates`);
  } else if (duplicates.length) {
    console.log(`Would delete ${duplicates.length} duplicates (pass --apply)`);
  }

  // Show final mapping for all teams
  if (process.argv.includes('--verbose')) {
    console.log('\n=== Full team badge mapping ===');
    const { data: final } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name').limit(5000);
    for (const t of (final || [])) {
      console.log(`${t.name} (${t.league}): ${t.logo_url || '(empty)'}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Broken URLs fixed: ${updates.length}`);
  console.log(`Duplicates found: ${duplicates.length}`);
}

function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

main().catch(err => { console.error(err); process.exit(1); });
