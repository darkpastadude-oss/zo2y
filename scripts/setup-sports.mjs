import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));

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

function hydrateEnv() {
  const merged = {};
  ENV_FILES.forEach((filePath) => {
    Object.assign(merged, loadEnvFile(filePath));
  });
  Object.entries(merged).forEach(([key, value]) => {
    if (!(key in process.env)) process.env[key] = value;
  });
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadBadges() {
  console.log('Fetching manifest...');
  const manifestUrl = `${SUPABASE_URL}/storage/v1/object/public/sports-assets/manifest/sports-assets.json`;
  const res = await fetch(manifestUrl);
  if (!res.ok) {
    console.error('Failed to fetch manifest:', res.status);
    return;
  }
  const manifest = await res.json();
  const teams = Array.isArray(manifest?.teams) ? manifest.teams : [];
  console.log(`Found ${teams.length} teams in manifest`);

  const badgesDir = path.join(ROOT, 'public', 'assets', 'sports-badges');
  if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir, { recursive: true });
  }

  let success = 0;
  let failed = 0;
  const localMap = {};

  for (const team of teams) {
    if (!team.badge || !team.name) continue;
    const slug = slugify(team.name);
    const ext = path.extname(new URL(team.badge).pathname) || '.png';
    const filename = `${slug}${ext}`;
    const dest = path.join(badgesDir, filename);

    if (fs.existsSync(dest)) {
      localMap[team.name] = `/assets/sports-badges/${filename}`;
      success++;
      continue;
    }

    try {
      await downloadFile(team.badge, dest);
      localMap[team.name] = `/assets/sports-badges/${filename}`;
      success++;
      if (success % 50 === 0) console.log(`Downloaded ${success}/${teams.length}...`);
    } catch (err) {
      console.error(`Failed to download ${team.name}:`, err.message);
      failed++;
    }
  }

  fs.writeFileSync(
    path.join(badgesDir, 'local-manifest.json'),
    JSON.stringify(localMap, null, 2)
  );

  console.log(`\nDone! ${success} badges downloaded, ${failed} failed`);
  console.log(`Local manifest saved to public/assets/sports-badges/local-manifest.json`);
}

async function dedupeTeams() {
  console.log('\n=== DEDUPLICATING TEAMS ===\n');

  const { data: allTeams, error } = await supabase
    .from('teams')
    .select('id,name,sport,league,stadium,logo_url')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch teams:', error);
    return;
  }

  console.log(`Total teams: ${allTeams.length}`);

  const seen = new Map();
  const toDelete = [];
  const toUpdate = [];

  for (const team of allTeams) {
    const key = `${team.name.toLowerCase().trim()}|${team.league.toLowerCase().trim()}`;
    if (seen.has(key)) {
      const existing = seen.get(key);
      const existingHasLogo = existing.logo_url && existing.logo_url.length > 0;
      const currentHasLogo = team.logo_url && team.logo_url.length > 0;
      if (currentHasLogo && !existingHasLogo) {
        toUpdate.push({ id: existing.id, logo_url: team.logo_url });
      }
      toDelete.push(team.id);
    } else {
      seen.set(key, team);
    }
  }

  console.log(`Duplicates to delete: ${toDelete.length}`);
  console.log(`Logos to migrate: ${toUpdate.length}`);

  if (toUpdate.length > 0) {
    console.log('\nMigrating logos...');
    for (const update of toUpdate) {
      const { error } = await supabase
        .from('teams')
        .update({ logo_url: update.logo_url })
        .eq('id', update.id);
      if (error) console.error(`Failed to update ${update.id}:`, error);
    }
  }

  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error } = await supabase.from('teams').delete().in('id', batch);
      if (error) console.error(`Failed to delete batch:`, error);
    }
  }

  const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  console.log(`\nFinal count: ${count} teams`);
}

async function main() {
  await dedupeTeams();
  await downloadBadges();
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
