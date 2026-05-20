import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load env
for (const f of [join(ROOT, 'backend', '.env'), join(ROOT, '.env.vercel.prod')]) {
  if (!existsSync(f)) continue;
  const raw = readFileSync(f, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  });
}

const supabase = createClient(
  'https://gfkhjbztayjyojsgdpgk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const FOOTBALL_LOGOS = 'C:\\Users\\sigma\\AppData\\Local\\Temp\\opencode\\football-logos\\logos';
const OLD_BADGES = join(ROOT, 'assets', 'sports-badges');
const NEW_LOGOS = join(ROOT, 'assets', 'logos');

// League name mapping: DB league slug → folder name in football-logos repo
const LEAGUE_FOLDER_MAP = {
  'english-premier-league': 'England - Premier League',
  'french-ligue-1': 'France - Ligue 1',
  'german-bundesliga': 'Germany - Bundesliga',
  'italian-serie-a': 'Italy - Serie A',
  'spanish-la-liga': 'Spain - LaLiga',
};

// DB league → subdirectory under /assets/logos/
const LEAGUE_DIR_MAP = {
  'English Premier League': 'football/english-premier-league',
  'French Ligue 1': 'football/french-ligue-1',
  'German Bundesliga': 'football/german-bundesliga',
  'Italian Serie A': 'football/italian-serie-a',
  'Spanish La Liga': 'football/spanish-la-liga',
  'Brazilian Serie A': 'football/brazilian-serie-a',
  'Argentina Primera Division': 'football/argentina-primera-division',
  'Egyptian Premier League': 'football/egyptian-premier-league',
  'Saudi Pro League': 'football/saudi-pro-league',
  'UEFA Champions League': 'football/uefa-champions-league',
  'Formula 1': 'f1',
  'NBA': 'nba',
  'NFL': 'nfl',
  'MLB': 'mlb',
  'NHL': 'nhl',
  'Ultimate Fighting Championship': 'mma/ufc',
  'ONE Championship': 'mma/one',
  'Matchroom Boxing': 'boxing/matchroom',
  'Boxxer Promotions': 'boxing/boxxer',
  'MGB Promotions': 'boxing/mgb',
  'Premier Boxing Champions': 'boxing/pbc',
  'Queensberry Promotions': 'boxing/queensberry',
  'Wasserman Boxing': 'boxing/wasserman',
  'Top Rank Boxing': 'boxing/top-rank',
  'Golden Boy Promotions': 'boxing/golden-boy',
  'Enfusion': 'kickboxing/enfusion',
  'Glory': 'kickboxing/glory',
  'K-1': 'kickboxing/k1',
  'Krush': 'kickboxing/krush',
  'World Boxing Association': 'associations/wba',
  'World Boxing Council': 'associations/wbc',
  'World Boxing Organization': 'associations/wbo',
  'International Boxing Federation': 'associations/ibf',
  'International Sport Karate Association': 'associations/iska',
  'World Association of Kickboxing Organizations': 'associations/wako',
  'World Kickboxing Network': 'associations/wkn',
  'World Muaythai Council': 'associations/wmc',
  'International Federation of Muaythai Associations': 'associations/ifma',
};

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const { data: teams } = await supabase.from('teams').select('id,name,league,logo_url').limit(5000);
  console.log(`Total teams: ${teams?.length}`);

  // Load old manifest as fallback
  const oldManifestPath = join(OLD_BADGES, 'local-manifest.json');
  const oldManifest = existsSync(oldManifestPath) ? JSON.parse(readFileSync(oldManifestPath, 'utf8')) : {};

  const mapping = {};
  const dbUpdates = [];

  for (const team of teams || []) {
    const leagueDir = LEAGUE_DIR_MAP[team.league];
    if (!leagueDir) {
      console.log(`SKIP no mapping for league: ${team.league}`);
      continue;
    }

    const targetDir = join(NEW_LOGOS, leagueDir);
    mkdirSync(targetDir, { recursive: true });

    const teamSlug = slug(team.name);

    // Priority 1: Check football-logos repo
    const folderMatch = LEAGUE_FOLDER_MAP[slug(team.league)];
    let copied = false;
    let ext = null;

    if (folderMatch && existsSync(join(FOOTBALL_LOGOS, folderMatch))) {
      const repoDir = join(FOOTBALL_LOGOS, folderMatch);
      const files = readdirSync(repoDir);
      for (const file of files) {
        const nameWithoutExt = file.replace(/\.\w+$/, '').toLowerCase();
        const teamNameWithoutExt = slug(team.name);
        if (nameWithoutExt === teamNameWithoutExt || nameWithoutExt.includes(teamNameWithoutExt) || teamNameWithoutExt.includes(nameWithoutExt)) {
          const extMatch = file.match(/\.(\w+)$/);
          ext = extMatch ? extMatch[1] : 'png';
          copyFileSync(join(repoDir, file), join(targetDir, `${teamSlug}.${ext}`));
          copied = true;
          break;
        }
      }
    }

    // Priority 2: Check old manifest/badges dir
    if (!copied && oldManifest[team.name]) {
      const oldUrl = oldManifest[team.name];
      const oldFile = join(ROOT, oldUrl.replace(/^\//, ''));
      const extMatch = oldUrl.match(/\.(\w+)$/);
      ext = extMatch ? extMatch[1] : 'png';
      if (existsSync(oldFile)) {
        copyFileSync(oldFile, join(targetDir, `${teamSlug}.${ext}`));
        copied = true;
      }
    }

    // Priority 3: Check old badges dir by slug
    if (!copied) {
      const oldFiles = existsSync(OLD_BADGES) ? readdirSync(OLD_BADGES) : [];
      for (const file of oldFiles) {
        const fileSlug = file.replace(/\.\w+$/, '');
        if (fileSlug === teamSlug) {
          const extMatch = file.match(/\.(\w+)$/);
          ext = extMatch ? extMatch[1] : 'png';
          copyFileSync(join(OLD_BADGES, file), join(targetDir, `${teamSlug}.${ext}`));
          copied = true;
          break;
        }
      }
    }

    if (!copied) {
      // Generate SVG placeholder
      ext = 'svg';
      const colors = ['#1a1a2e','#16213e','#0f3460','#533483','#2d4059','#222831','#30475e','#3b185f'];
      const colorIdx = team.name.length % colors.length;
      const words = team.name.split(/\s+/);
      let lines = [];
      if (team.name.length <= 6) {
        lines = [team.name];
      } else if (words.length >= 3) {
        lines = [words.slice(0, 2).join(' '), words.slice(2).join(' ')];
      } else {
        lines = [team.name];
      }
      const fs2 = lines.length > 1 ? '12' : '16';
      const textEls = lines.map((l, i) =>
        `  <text x="50" y="${48 + i * 18}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs2}" font-weight="bold" fill="#fff">${l.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>`
      ).join('\n');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="${colors[colorIdx]}"/>
  <rect x="4" y="4" width="92" height="92" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
${textEls}
</svg>`;
      writeFileSync(join(targetDir, `${teamSlug}.svg`), svg);
    }

    // Build mapping
    const logoPath = `/assets/logos/${leagueDir}/${teamSlug}.${ext}`;
    mapping[team.name] = logoPath;
    dbUpdates.push({ id: team.id, logo_url: logoPath });
  }

  // Write mapping JSON
  const mappingPath = join(NEW_LOGOS, 'logo-mapping.json');
  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`Mapping written: ${Object.keys(mapping).length} entries`);

  // Write a compact version for frontend
  const compactMapping = {};
  for (const [name, url] of Object.entries(mapping)) {
    compactMapping[slug(name)] = url;
  }
  writeFileSync(join(NEW_LOGOS, 'logo-mapping.min.json'), JSON.stringify(compactMapping));

  // Update DB
  if (process.argv.includes('--apply')) {
    let ok = 0;
    for (const u of dbUpdates) {
      const { error } = await supabase.from('teams').update({ logo_url: u.logo_url }).eq('id', u.id);
      if (error) console.error(`DB ERR ${u.name || u.id}: ${error.message}`);
      else ok++;
    }
    console.log(`DB updated: ${ok}/${dbUpdates.length}`);
  } else {
    console.log(`Would update ${dbUpdates.length} teams (pass --apply)`);
  }
}

main().catch(e => console.error(e));
