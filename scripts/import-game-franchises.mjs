import { spawn } from 'child_process';

const DEFAULT_LIMIT = 220;
const DEFAULT_RAWG_MAX_PAGES = 18;
const DEFAULT_MAX_PAGES = 12;

const FRANCHISE_QUERIES = [
  { term: 'Super Mario', limit: 260 },
  { term: 'The Legend of Zelda', limit: 220 },
  { term: 'Mario Kart', limit: 120 },
  { term: 'Mario Party', limit: 100 },
  { term: 'Paper Mario', limit: 80 },
  { term: 'Mario & Luigi', limit: 80 },
  { term: 'Luigi', limit: 80 },
  { term: 'Donkey Kong', limit: 120 },
  { term: 'Kirby', limit: 120 },
  { term: 'Metroid', limit: 120 },
  { term: 'Fire Emblem', limit: 100 },
  { term: 'Animal Crossing', limit: 80 },
  { term: 'Splatoon', limit: 80 },
  { term: 'Super Smash Bros', limit: 80 },
  { term: 'Pokemon', limit: 260 },
  { term: 'Pokemon Mystery Dungeon', limit: 80 },
  { term: 'Pokemon Ranger', limit: 50 },
  { term: 'Pokemon Stadium', limit: 50 },
  { term: 'Pokemon Snap', limit: 50 },
  { term: 'Pokemon Pinball', limit: 40 },
  { term: 'Pokemon Colosseum', limit: 50 },
  { term: 'Pokemon XD', limit: 40 },
  { term: 'Sonic', limit: 180 },
  { term: 'Crash Bandicoot', limit: 100 },
  { term: 'Spyro', limit: 90 },
  { term: 'Rayman', limit: 90 },
  { term: 'Mega Man', limit: 120 },
  { term: 'Castlevania', limit: 120 },
  { term: 'Contra', limit: 80 },
  { term: 'Metal Gear', limit: 140 },
  { term: 'Final Fantasy', limit: 260 },
  { term: 'Dragon Quest', limit: 160 },
  { term: 'Kingdom Hearts', limit: 120 },
  { term: 'Persona', limit: 120 },
  { term: 'Shin Megami Tensei', limit: 120 },
  { term: 'Tales of', limit: 140 },
  { term: 'Yakuza', limit: 120 },
  { term: 'Like a Dragon', limit: 120 },
  { term: 'Monster Hunter', limit: 140 },
  { term: 'Dark Souls', limit: 100 },
  { term: 'Demon Souls', limit: 60 },
  { term: 'Bloodborne', limit: 50 },
  { term: 'Elden Ring', limit: 60 },
  { term: 'The Witcher', limit: 120 },
  { term: 'The Elder Scrolls', limit: 120 },
  { term: 'Fallout', limit: 140 },
  { term: 'Diablo', limit: 120 },
  { term: 'Path of Exile', limit: 60 },
  { term: 'Mass Effect', limit: 100 },
  { term: 'Dragon Age', limit: 90 },
  { term: 'Baldurs Gate', limit: 90 },
  { term: 'Civilization', limit: 90 },
  { term: 'Age of Empires', limit: 100 },
  { term: 'Age of Mythology', limit: 60 },
  { term: 'StarCraft', limit: 70 },
  { term: 'Warcraft', limit: 90 },
  { term: 'Command & Conquer', limit: 90 },
  { term: 'The Sims', limit: 120 },
  { term: 'SimCity', limit: 80 },
  { term: 'Cities Skylines', limit: 60 },
  { term: 'RollerCoaster Tycoon', limit: 80 },
  { term: 'Planet Coaster', limit: 60 },
  { term: 'Planet Zoo', limit: 50 },
  { term: 'Euro Truck Simulator', limit: 60 },
  { term: 'American Truck Simulator', limit: 60 },
  { term: 'Farming Simulator', limit: 100 },
  { term: 'Train Sim', limit: 80 },
  { term: 'Call of Duty', limit: 260 },
  { term: 'Battlefield', limit: 180 },
  { term: 'Halo', limit: 180 },
  { term: 'Gears of War', limit: 120 },
  { term: 'Far Cry', limit: 140 },
  { term: 'Tom Clancy', limit: 220 },
  { term: 'Rainbow Six', limit: 100 },
  { term: 'Ghost Recon', limit: 100 },
  { term: 'Splinter Cell', limit: 90 },
  { term: 'Hitman', limit: 100 },
  { term: 'Sniper Elite', limit: 80 },
  { term: 'DOOM', limit: 100 },
  { term: 'Wolfenstein', limit: 90 },
  { term: 'Quake', limit: 80 },
  { term: 'Borderlands', limit: 120 },
  { term: 'BioShock', limit: 80 },
  { term: 'Crysis', limit: 70 },
  { term: 'Destiny', limit: 100 },
  { term: 'Warframe', limit: 60 },
  { term: 'Apex Legends', limit: 40 },
  { term: 'Counter-Strike', limit: 80 },
  { term: 'Valorant', limit: 40 },
  { term: 'Overwatch', limit: 60 },
  { term: 'PUBG', limit: 50 },
  { term: 'Fortnite', limit: 50 },
  { term: 'Grand Theft Auto', limit: 180 },
  { term: 'Red Dead Redemption', limit: 90 },
  { term: 'Max Payne', limit: 60 },
  { term: 'Mafia', limit: 90 },
  { term: 'Saints Row', limit: 90 },
  { term: 'Watch Dogs', limit: 90 },
  { term: 'Assassins Creed', limit: 220 },
  { term: 'Tomb Raider', limit: 120 },
  { term: 'Prince of Persia', limit: 100 },
  { term: 'Uncharted', limit: 80 },
  { term: 'God of War', limit: 100 },
  { term: 'Ratchet & Clank', limit: 90 },
  { term: 'Jak and Daxter', limit: 70 },
  { term: 'Sly Cooper', limit: 60 },
  { term: 'LittleBigPlanet', limit: 70 },
  { term: 'Resident Evil', limit: 180 },
  { term: 'Silent Hill', limit: 100 },
  { term: 'Dead Space', limit: 80 },
  { term: 'Outlast', limit: 60 },
  { term: 'Five Nights at Freddys', limit: 80 },
  { term: 'FIFA', limit: 200 },
  { term: 'EA Sports FC', limit: 120 },
  { term: 'UFC', limit: 120 },
  { term: 'Street Fighter', limit: 140 },
  { term: 'Tekken', limit: 120 },
  { term: 'Mortal Kombat', limit: 140 },
  { term: 'Fatal Fury', limit: 60 },
  { term: 'King of Fighters', limit: 120 },
  { term: 'Virtua Fighter', limit: 80 },
  { term: 'Soulcalibur', limit: 80 },
  { term: 'Dragon Ball Z', limit: 160 },
  { term: 'Naruto', limit: 120 },
  { term: 'One Piece', limit: 120 },
  { term: 'NBA 2K', limit: 160 },
  { term: 'Madden NFL', limit: 180 },
  { term: 'NBA Live', limit: 80 },
  { term: 'NHL', limit: 160 },
  { term: 'NCAA Football', limit: 80 },
  { term: 'College Football', limit: 80 },
  { term: 'NCAA Basketball', limit: 60 },
  { term: 'MLB The Show', limit: 100 },
  { term: 'Pro Evolution Soccer', limit: 110 },
  { term: 'eFootball', limit: 110 },
  { term: 'WWE 2K', limit: 120 },
  { term: 'WWE SmackDown', limit: 120 },
  { term: 'WWF SmackDown', limit: 100 },
  { term: 'Fight Night', limit: 70 },
  { term: 'Skate', limit: 80 },
  { term: 'Riders Republic', limit: 40 },
  { term: 'Steep', limit: 40 },
  { term: 'Gran Turismo', limit: 120 },
  { term: 'Forza Horizon', limit: 120 },
  { term: 'Forza Motorsport', limit: 120 },
  { term: 'Forza', limit: 160 },
  { term: 'Need for Speed', limit: 150 },
  { term: 'Burnout', limit: 80 },
  { term: 'Project CARS', limit: 80 },
  { term: 'Assetto Corsa', limit: 80 },
  { term: 'WRC', limit: 120 },
  { term: 'DiRT', limit: 120 },
  { term: 'Trackmania', limit: 80 },
  { term: 'F1', limit: 120 },
  { term: 'Formula 1', limit: 120 },
  { term: 'MotoGP', limit: 90 },
  { term: 'Football Manager', limit: 90 },
  { term: 'Top Spin', limit: 60 },
  { term: 'Tiger Woods PGA Tour', limit: 60 },
  { term: 'PGA Tour', limit: 80 },
  { term: 'SSX', limit: 60 },
  { term: 'Tony Hawk', limit: 80 },
  { term: 'Rocket League', limit: 40 },
  { term: 'Mario Tennis', limit: 60 },
  { term: 'Mario Golf', limit: 60 },
  { term: 'Cricket', limit: 120 },
  { term: 'Rugby', limit: 120 },
  { term: 'Olympics', limit: 80 },
  { term: 'Winter Sports', limit: 80 },
  { term: 'Baseball', limit: 120 },
  { term: 'Basketball', limit: 120 },
  { term: 'Soccer', limit: 140 }
];

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function parseIntSafe(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runImport(query, options) {
  return new Promise((resolve, reject) => {
    const args = [
      'scripts/import-popular-games.mjs',
      `--limit=${query.limit || options.limit}`,
      `--search=${query.term}`,
      '--with-details=false',
      '--min-rating-count=0',
      '--ordering=-rating',
      `--rawg-max-pages=${options.rawgMaxPages}`,
      `--max-pages=${options.maxPages}`,
      '--rawg-page-size=40',
      '--page-size=50',
      '--batch-size=200'
    ];
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Import exited with code ${code} for "${query.term}"`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const only = String(parseArg('--only', '')).trim().toLowerCase();
  const delayMs = parseIntSafe(parseArg('--delay', ''), 900);
  const limit = parseIntSafe(parseArg('--limit', ''), DEFAULT_LIMIT);
  const rawgMaxPages = parseIntSafe(parseArg('--rawg-max-pages', ''), DEFAULT_RAWG_MAX_PAGES);
  const maxPages = parseIntSafe(parseArg('--max-pages', ''), DEFAULT_MAX_PAGES);

  const queries = FRANCHISE_QUERIES.filter((query) => {
    if (!only) return true;
    return query.term.toLowerCase().includes(only);
  });

  if (!queries.length) {
    console.log('No franchise queries matched.');
    return;
  }

  console.log(`Running ${queries.length} franchise imports...`);
  for (let index = 0; index < queries.length; index += 1) {
    const query = queries[index];
    console.log(`\n[${index + 1}/${queries.length}] ${query.term}`);
    await runImport(query, { delayMs, limit, rawgMaxPages, maxPages });
    if (index < queries.length - 1) await sleep(delayMs);
  }
  console.log('\nFranchise import pass complete.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
