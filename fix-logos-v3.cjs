/**
 * fix-logos-v3.cjs  — Final pass
 * Only processes entries that still have issues + sports teams
 * Uses corrected Wikimedia filenames + slower rate limiting for TheSportsDB
 */
'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Corrected filenames for everything that failed in v2
const WIKI_FILES = {
  // FASHION (failed ones)
  'abercrombie & fitch':   'Abercrombie_fitch_logo.svg',
  'allbirds':              'Allbirds_logo.svg',
  'american eagle':        'AEO_new_logo.svg',
  'arc\'teryx':            'Arc\'teryx_Logo_2.svg',
  'asics':                 'ASICS_logo.svg',
  'balenciaga':            'Balenciaga_logo.svg',
  'birkenstock':           'Birkenstock-Logo.svg',
  'boohoo':                'Boohoo.com_logo.svg',
  'canada goose':          'Canada_Goose_Holdings_logo.svg',
  'champion':              'Champion_wordmark.svg',
  'clarks':                'Clarks_(retailer)_logo.svg',
  'cole haan':             'Cole_Haan_new_logo.png',
  'cos':                   'COS_logo.svg',
  'givenchy':              'Givenchy_logo.svg',
  'guess':                 'Guess_logo.svg',
  'hugo boss':             'HUGO_BOSS_logo.svg',
  'hugo':                  'HUGO_BOSS_logo.svg',
  'longchamp':             'Longchamp_logo.svg',
  'merrell':               'Merrell_Logo.png',
  'nike':                  'Nike_logo.svg',
  'prada':                 'Prada-Logo.svg',
  'puma':                  'PUMA_Logo.svg',
  'ralph lauren':          'Ralph_Lauren_Corporation_logo.svg',
  'polo ralph lauren':     'Ralph_Lauren_Corporation_logo.svg',
  'reebok':                'Reebok_logo.svg',
  'reiss':                 'Reiss_logo.svg',
  'saucony':               'Saucony_logo.svg',
  'stone island':          'Stone_Island_logo.svg',
  'timberland':            'The_Timberland_Company_logo.svg',
  'tory burch':            'Tory_Burch_logo.svg',
  'ugg':                   'UGG_(brand)_logo.svg',
  'under armour':          'Under_armour_logo.svg',
  'urban outfitters':      'Urban_Outfitters_logo.png',
  'vacheron constantin':   'Vacheron_Constantin_Logo.svg',
  'valentino':             'Valentino_Fashion_Group_logo.svg',
  'vans':                  'Vans_Logo.svg',
  'victoria\'s secret':    'Victoria\'s_Secret_Logo.svg',
  'vuori':                 'Vuori_(brand)_logo.png',
  'weekday':               'Weekday_brand_logo.svg',
  'zegna':                 'Zegna_logo.svg',
  'zenith':                'Zenith_watches_logo.svg',
  // FOOD (failed ones)
  'burger king':           'Burger_King_logo_(2020).svg',
  'chick-fil-a':           'Chick-fil-A_Logo.svg',
  'cracker barrel':        'Cracker_Barrel_logo.svg',
  'nando\'s':              'Nando\'s_logo.svg',
  'papa john\'s':          'Papa_John\'s_logo.svg',
  'shake shack':           'Shake_Shack_logo.png',
  'sonic drive-in':        'Sonic_Drive-In_logo.svg',
  'starbucks':             'Starbucks_Corporation_Logo_2011.svg',
  'subway':                'Subway_2016_logo.svg',
  'taco bell':             'Taco_Bell_Logo.svg',
  'the capital grille':    'Capital_Grille_logo.png',
  'the cheesecake factory':'Cheesecake_Factory_logo.png',
  'torchy\'s tacos':       'Torchy\'s_tacos_logo.png',
  'wendy\'s':              'Wendy\'s_logo.svg',
  'white castle':          'White_Castle_(restaurant)_logo.svg',
  'zippy\'s':              'Zippy\'s_logo.png',
  // CARS (failed ones)
  'abarth':                'Abarth_logo.svg',
  'audi':                  'Audi-Logo_2016.svg',
  'cadillac':              'Cadillac_logo.svg',
  'chevrolet':             'Chevrolet_logo.svg',
  'chrysler':              'Chrysler_logo.svg',
  'ferrari':               'Ferrari_wordmark.svg',
  'genesis':               'Genesis_(automobile)_logo.svg',
  'jaguar':                'Jaguar_Cars_logo.svg',
  'kia':                   'Kia_logo_(2021).svg',
  'lexus':                 'Lexus_division_emblem.svg',
  'mini':                  'MINI_Logo.svg',
  'peugeot':               'Peugeot_2021_Logo.svg',
  'porsche':               'Porsche_Logo_2024.png',
  'ram trucks':            'Ram_trucks_logo.svg',
  'rimac automobili':      'Rimac_Automobili_logo.svg',
  'saab':                  'Saab_logo.svg',
  'scania':                'Scania_wordmark.svg',
  'vauxhall':              'Vauxhall_Motors_logo.svg',
  'xpeng':                 'Xpeng_motors_logo.svg',
};

function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      timeout: 25000,
      headers: { 'User-Agent': 'Zo2yLogoFixer/3.0 (zo2y.com)', ...extraHeaders },
    }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return fetchUrl(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, contentType: res.headers['content-type'] || '', buffer: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function guessExt(ct, url='') {
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg')||ct.includes('jpg')) return '.jpg';
  if (ct.includes('webp')) return '.webp';
  const m = (url||'').match(/\.(svg|png|jpe?g|webp)(\?|$)/i);
  return m ? '.'+m[1].toLowerCase().replace('jpeg','jpg') : '.png';
}

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

async function resolveCommonsUrl(filename) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    await sleep(150);
    const r = await fetchUrl(apiUrl, { Accept: 'application/json' });
    if (r.status !== 200) return '';
    const json = JSON.parse(r.buffer.toString());
    const page = Object.values(json?.query?.pages||{})[0];
    return page?.imageinfo?.[0]?.url || '';
  } catch { return ''; }
}

async function uploadLogo(buffer, storagePath, contentType) {
  const mime = contentType.includes('svg') ? 'image/svg+xml'
    : contentType.includes('png') ? 'image/png'
    : contentType.includes('jpeg') ? 'image/jpeg'
    : 'image/png';
  const { error } = await supabase.storage.from('brand-logos').upload(storagePath, buffer, { contentType: mime, upsert: true });
  if (error) throw new Error(error.message);
}

async function updateDb(table, id, logoPath) {
  const { error } = await supabase.from(table).update({ logo_url: logoPath }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Re-run audit and fix only remaining bad entries ───────────────────────────
async function fixRemainingBrands() {
  // Re-audit to find what's still bad
  const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/brand-logos`;
  const tables = ['fashion_brands','food_brands','car_brands'];
  const stillBad = [];

  console.log('Re-checking current state of logos...');
  for (const table of tables) {
    const { data } = await supabase.from(table).select('id,name,logo_url').order('name');
    for (const row of data) {
      if (!row.logo_url) { stillBad.push({...row,table}); continue; }
      const url = row.logo_url.startsWith('http') ? row.logo_url : `${STORAGE_BASE}/${row.logo_url}`;
      try {
        const r = await fetchUrl(url);
        if (r.status !== 200 || r.buffer.length < 500) stillBad.push({...row,table});
      } catch { stillBad.push({...row,table}); }
      await sleep(50);
    }
  }
  console.log(`${stillBad.length} brands still need fixing\n`);

  let fixed=0, failed=0;
  for (const entry of stillBad) {
    const key = entry.name.toLowerCase().trim();
    const filename = WIKI_FILES[key];
    if (!filename) { console.log(`  ? [${entry.name}] — no filename in map`); continue; }

    const cdnUrl = await resolveCommonsUrl(filename);
    if (!cdnUrl) { console.log(`  ✗ [${entry.name}] — cannot resolve: ${filename}`); failed++; continue; }

    try {
      const resp = await fetchUrl(cdnUrl);
      if (resp.status!==200||resp.buffer.length<200) { console.log(`  ✗ [${entry.name}] bad download`); failed++; continue; }
      const ext = guessExt(resp.contentType, cdnUrl);
      const sp = `${entry.table}/${safeName(entry.name)}${ext}`;
      await uploadLogo(resp.buffer, sp, resp.contentType);
      await updateDb(entry.table, entry.id, sp);
      console.log(`  ✓ [${entry.name}] ${resp.buffer.length}B → ${sp}`);
      fixed++;
    } catch(e) { console.log(`  ✗ [${entry.name}] — ${e.message}`); failed++; }
    await sleep(300);
  }
  return { fixed, failed };
}

// ── Sports teams via TheSportsDB — slow/careful ───────────────────────────────
async function fixSportsTeams() {
  console.log('\n── SPORTS TEAMS ──');
  const { data: teams, error } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name');
  if (error) { console.error('Cannot fetch teams:', error.message); return; }

  const missing = teams.filter(t => !t.logo_url || t.logo_url.trim()==='');
  console.log(`${teams.length} total, ${missing.length} missing logos\n`);

  let fixed=0, failed=0, skipped=0;
  for (const team of missing) {
    await sleep(1200); // 1.2s between requests — well under TheSportsDB limits
    try {
      const r = await fetchUrl(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.name)}`);
      if (r.status===429) { await sleep(5000); failed++; console.log(`  ✗ [${team.name}] rate limited`); continue; }
      if (r.status!==200) { failed++; console.log(`  ✗ [${team.name}] HTTP ${r.status}`); continue; }

      const json = JSON.parse(r.buffer.toString());
      const results = json?.teams;
      if (!results?.length) { skipped++; continue; }

      const best = results.find(t2=>t2.strTeam?.toLowerCase()===team.name.toLowerCase())
        || results.find(t2=>t2.strTeam?.toLowerCase().includes(team.name.toLowerCase().split(' ')[0]))
        || results[0];

      if (!best?.strTeamBadge) { skipped++; continue; }

      // Download badge
      const badgeUrl = `${best.strTeamBadge}/preview`;
      const br = await fetchUrl(badgeUrl).catch(()=>null) || await fetchUrl(best.strTeamBadge).catch(()=>null);
      if (!br||br.status!==200||br.buffer.length<500) { failed++; console.log(`  ✗ [${team.name}] badge download failed`); continue; }

      const ext = guessExt(br.contentType, badgeUrl);
      const sp = `sports_teams/${safeName(team.name)}${ext}`;
      await uploadLogo(br.buffer, sp, br.contentType);
      await updateDb('teams', team.id, sp);
      console.log(`  ✓ [${team.name}] → ${sp}`);
      fixed++;
    } catch(e) { failed++; console.log(`  ✗ [${team.name}] ${e.message}`); }
  }
  return { fixed, failed, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('==============================================');
  console.log('  LOGO FIX v3 — Final Pass');
  console.log('==============================================\n');

  const brandStats = await fixRemainingBrands();
  const sportsStats = await fixSportsTeams();

  console.log('\n==============================================');
  console.log('  ✅ ALL DONE');
  console.log('==============================================');
  console.log(`  Brands:  ${brandStats.fixed} fixed, ${brandStats.failed} failed`);
  console.log(`  Sports:  ${sportsStats.fixed} fixed, ${sportsStats.failed} failed, ${sportsStats.skipped} not in DB`);
  console.log('\n  You can now refresh your site — logos are updated!');
  console.log('==============================================');
}

main().catch(console.error);
