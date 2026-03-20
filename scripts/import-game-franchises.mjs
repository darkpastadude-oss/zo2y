import { spawn } from 'child_process';

const DEFAULT_LIMIT = 180;
const DEFAULT_RAWG_MAX_PAGES = 14;
const DEFAULT_MAX_PAGES = 10;

const FRANCHISE_QUERIES = [
  { term: 'Super Mario', limit: 260 },
  { term: 'Mario Kart', limit: 120 },
  { term: 'Mario Party', limit: 100 },
  { term: 'Paper Mario', limit: 80 },
  { term: 'Mario & Luigi', limit: 80 },
  { term: 'Pokemon', limit: 260 },
  { term: 'Pokemon Mystery Dungeon', limit: 80 },
  { term: 'Pokemon Ranger', limit: 50 },
  { term: 'Pokemon Stadium', limit: 50 },
  { term: 'Pokemon Snap', limit: 50 },
  { term: 'Call of Duty', limit: 260 },
  { term: 'FIFA', limit: 200 },
  { term: 'EA Sports FC', limit: 120 },
  { term: 'UFC', limit: 120 },
  { term: 'Street Fighter', limit: 140 },
  { term: 'Tekken', limit: 120 },
  { term: 'NBA 2K', limit: 160 },
  { term: 'Madden NFL', limit: 180 },
  { term: 'NBA Live', limit: 80 },
  { term: 'NHL', limit: 160 },
  { term: 'MLB The Show', limit: 100 },
  { term: 'Pro Evolution Soccer', limit: 110 },
  { term: 'eFootball', limit: 110 },
  { term: 'WWE 2K', limit: 120 },
  { term: 'Gran Turismo', limit: 120 },
  { term: 'Forza', limit: 160 },
  { term: 'Need for Speed', limit: 150 },
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
  { term: 'Mario Golf', limit: 60 }
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
