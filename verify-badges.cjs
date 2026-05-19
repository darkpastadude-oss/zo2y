const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
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
    if (!(key in process.env)) process.env[key] = value;
  });
  return env;
}

['.env.vercel','.env.vercel.prod'].forEach(f => loadEnvFile(path.join(process.cwd(), f)));

const url = process.env.SUPABASE_URL.startsWith('http') ? process.env.SUPABASE_URL : 'https://' + process.env.SUPABASE_URL + '.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const manifestPath = path.join(process.cwd(), 'assets', 'sports-badges', 'local-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const { data: teams } = await supabase.from('teams').select('id,name,sport,league').order('sport').order('name');

  const missing = [];
  const issues = [];

  for (const team of teams) {
    const badgePath = manifest[team.name];
    if (!badgePath) {
      missing.push(team.name);
      continue;
    }
    const fullPath = path.join(process.cwd(), badgePath.replace('/assets/', 'assets/'));
    if (!fs.existsSync(fullPath)) {
      issues.push({ team: team.name, sport: team.sport, league: team.league, badge: badgePath, issue: 'FILE MISSING' });
    }
  }

  console.log(`Total teams: ${teams.length}`);
  console.log(`Missing badges: ${missing.length}`);
  console.log(`Issues: ${issues.length}`);

  if (missing.length > 0) {
    console.log('\n=== MISSING BADGES ===');
    missing.forEach(m => console.log(`  ${m}`));
  }

  if (issues.length > 0) {
    console.log('\n=== ISSUES ===');
    issues.forEach(i => console.log(`  [${i.sport}] ${i.team} (${i.league}): ${i.issue}`));
  }

  if (missing.length === 0 && issues.length === 0) {
    console.log('\nALL BADGES VERIFIED SUCCESSFULLY!');
  }
})();
