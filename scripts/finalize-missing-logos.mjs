import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load env (priority: .env.vercel.prod > backend/.env)
function loadEnv() {
  const files = [
    join(ROOT, 'backend', '.env'),
    join(ROOT, '.env.vercel.prod'),
  ];
  for (const f of files) {
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
}
loadEnv();

const supabase = createClient(
  'https://gfkhjbztayjyojsgdpgk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BADGES_DIR = join(ROOT, 'assets', 'sports-badges');
const MANIFEST_PATH = join(BADGES_DIR, 'local-manifest.json');

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function escapeXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function generateSvg(name) {
  // Generate a simple but decent looking badge
  const lines = [];
  const words = name.split(/\s+/);
  // Use initials or abbreviated name
  if (name.length <= 5) {
    lines.push(name);
  } else if (words.length >= 3) {
    // Show short name on first line, rest on second
    lines.push(words.slice(0, 2).join(' '));
    lines.push(words.slice(2).join(' '));
  } else {
    // Split long words
    const first = words[0];
    if (first && first.length > 8) {
      const mid = Math.ceil(first.length / 2);
      lines.push(first.substring(0, mid));
      lines.push(first.substring(mid));
    } else {
      lines.push(words.join(' '));
    }
  }
  const fontSize = lines.length > 1 ? '12' : '16';
  const textY = lines.length > 1 ? 48 : 56;
  const lineHeight = 18;

  let textElements = lines.map((line, i) =>
    `  <text x="50" y="${textY + i * lineHeight}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="#fff">${escapeXml(line)}</text>`
  ).join('\n');

  // Color based on league
  const colors = [
    '#1a1a2e', '#16213e', '#0f3460', '#533483',
    '#2d4059', '#222831', '#30475e', '#3b185f',
    '#201547', '#1b1b2f', '#2b1d3f', '#1a1c29',
  ];
  const colorIdx = name.length % colors.length;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="${colors[colorIdx]}"/>
  <rect x="4" y="4" width="92" height="92" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
${textElements}
</svg>`;
}

async function main() {
  // Get all teams with missing logos
  const { data: teams } = await supabase.from('teams').select('id, name, league, logo_url').limit(5000);
  const missing = teams?.filter(t => !t.logo_url || t.logo_url === '' || t.logo_url === '/file.svg') || [];
  console.log(`Missing logos: ${missing.length}`);

  // Load manifest
  const manifest = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
    : {};

  const updates = [];

  for (const team of missing) {
    const s = slug(team.name);

    // Check if SVG already exists for this team
    const svgFile = s + '.svg';
    const svgPath = join(BADGES_DIR, svgFile);

    if (existsSync(svgPath)) {
      console.log(`EXISTS ${team.name} → ${svgFile}`);
      manifest[team.name] = '/assets/sports-badges/' + svgFile;
      updates.push({ id: team.id, name: team.name, logo_url: '/assets/sports-badges/' + svgFile });
      continue;
    }

    // Generate SVG
    const svg = generateSvg(team.name);
    writeFileSync(svgPath, svg);
    const url = '/assets/sports-badges/' + svgFile;
    manifest[team.name] = url;
    updates.push({ id: team.id, name: team.name, logo_url: url });
    console.log(`GEN   ${team.name} → ${svgFile}`);
  }

  // Save manifest
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nManifest updated with ${Object.keys(manifest).length} entries`);

  // Update DB
  if (process.argv.includes('--apply') && updates.length) {
    let ok = 0;
    for (const u of updates) {
      const { error } = await supabase.from('teams').update({ logo_url: u.logo_url }).eq('id', u.id);
      if (error) console.error(`DB ERR ${u.name}: ${error.message}`);
      else ok++;
    }
    console.log(`\nDB updated: ${ok}/${updates.length}`);
  } else {
    console.log(`\nWould update ${updates.length} teams in DB (pass --apply)`);
  }
}

main().catch(e => console.error(e));
