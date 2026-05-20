import fs from 'fs';
import path from 'path';

const BADGES_DIR = path.resolve('assets/sports-badges');
const MANIFEST_PATH = path.join(BADGES_DIR, 'local-manifest.json');
const ASSETS_MANIFEST_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co/storage/v1/object/public/sports-assets/manifest/sports-assets.json';

function normalizeName(v) {
  return String(v || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function titleCase(str) {
  return String(str || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log('=== Wire national team logos from sports-assets ===\n');

  // SVG names that were deleted
  const svgNames = [
    'albania', 'austria', 'bahrain', 'cyprus', 'el-salvador', 'finland',
    'georgia', 'iceland', 'kuwait', 'madagascar', 'mauritania', 'namibia',
    'palestine', 'paraguay', 'philippines', 'poland', 'scotland', 'slovakia',
    'sweden', 'switzerland', 'thailand', 'venezuela'
  ];

  // Fetch sports-assets manifest
  console.log('Fetching sports-assets manifest from Supabase...');
  const assetsManifest = await fetchJson(ASSETS_MANIFEST_URL);
  console.log(`  Fetched ${assetsManifest.teams.length} entries`);

  // Build normalized lookup
  const assetsLookup = new Map();
  for (const entry of assetsManifest.teams) {
    assetsLookup.set(normalizeName(entry.name), entry);
  }

  // Read existing local manifest
  let localManifest = {};
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    // Strip BOM, trailing commas before } or ], and invalid control chars
    const cleaned = raw
      .replace(/^\uFEFF/, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/,(\s*[}\]])/g, '$1');
    localManifest = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse local-manifest.json:', e.message);
    process.exit(1);
  }
  console.log(`  Current entries: ${Object.keys(localManifest).length}`);

  // Map SVG names to manifest entries
  const nameMap = {
    'albania': 'Albania',
    'austria': 'Austria',
    'bahrain': 'Bahrain',
    'cyprus': 'Cyprus',
    'el-salvador': 'El Salvador',
    'finland': 'Finland',
    'georgia': 'Georgia',
    'iceland': 'Iceland',
    'kuwait': 'Kuwait',
    'madagascar': 'Madagascar',
    'mauritania': 'Mauritania',
    'namibia': 'Namibia',
    'palestine': 'Palestine',
    'paraguay': 'Paraguay',
    'philippines': 'Philippines',
    'poland': 'Poland',
    'scotland': 'Scotland',
    'slovakia': 'Slovakia',
    'sweden': 'Sweden',
    'switzerland': 'Switzerland',
    'thailand': 'Thailand',
    'venezuela': 'Venezuela'
  };

  let added = 0;
  let notFound = [];

  for (const [svgBaseName, teamName] of Object.entries(nameMap)) {
    // Check if already in manifest
    if (localManifest[teamName]) {
      console.log(`  EXISTS: ${teamName} -> ${localManifest[teamName]}`);
      continue;
    }

    // Look up in sports-assets manifest
    const normalizedKey = normalizeName(teamName);
    const entry = assetsLookup.get(normalizedKey);

    if (entry && entry.badge) {
      localManifest[teamName] = entry.badge;
      console.log(`  ADDED:  ${teamName} -> ${entry.badge}`);
      added++;
    } else {
      // Try alternate names used in TheSportsDB
      const altNames = [
        `${teamName} National Team`,
        teamName === 'El Salvador' ? 'El Salvador National Team' : null
      ].filter(Boolean);

      let found = false;
      for (const alt of altNames) {
        const altEntry = assetsLookup.get(normalizeName(alt));
        if (altEntry && altEntry.badge) {
          localManifest[teamName] = altEntry.badge;
          console.log(`  ADDED:  ${teamName} (via "${alt}") -> ${altEntry.badge}`);
          added++;
          found = true;
          break;
        }
      }

      if (!found) {
        notFound.push(teamName);
      }
    }
  }

  // Now also add major national teams from seed data that don't have manifest entries yet
  const majorNationalTeams = [
    'Argentina', 'Brazil', 'Germany', 'France', 'Spain', 'Italy', 'England',
    'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Uruguay', 'Mexico',
    'USA', 'Japan', 'South Korea', 'Australia', 'Morocco', 'Senegal',
    'Switzerland', 'Poland', 'Denmark', 'Sweden', 'Colombia', 'Chile',
    'Ecuador', 'Peru', 'Paraguay', 'Bolivia', 'Venezuela', 'Egypt',
    'Nigeria', 'Ghana', 'Ivory Coast', 'Cameroon', 'Algeria', 'Tunisia'
  ];

  for (const teamName of majorNationalTeams) {
    if (localManifest[teamName]) continue;

    const normalizedKey = normalizeName(teamName);
    const entry = assetsLookup.get(normalizedKey);

    if (entry && entry.badge) {
      localManifest[teamName] = entry.badge;
      console.log(`  ADDED:  ${teamName} -> ${entry.badge}`);
      added++;
    }
  }

  // Sort and write
  const sortedKeys = Object.keys(localManifest).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const sortedManifest = {};
  for (const key of sortedKeys) {
    sortedManifest[key] = localManifest[key];
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(sortedManifest, null, 2) + '\n', 'utf8');
  console.log(`\n  Total entries: ${sortedKeys.length} (added ${added})`);

  if (notFound.length) {
    console.log(`\n  NOT FOUND in sports-assets manifest:`);
    notFound.forEach(n => console.log(`    - ${n}`));
  }

  console.log('\n=== Done ===');
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
