/**
 * fix-logos-v2.cjs
 *
 * Strategy:
 *  1. For each bad logo, look up the Wikimedia file name from a curated map.
 *  2. Resolve the actual CDN URL via commons.wikimedia.org/w/api.php imageinfo.
 *  3. Download from upload.wikimedia.org (CDN, no rate limit).
 *  4. Upload to Supabase storage + update DB.
 *  5. For sports teams with missing logos: use TheSportsDB.
 *
 * Run: node fix-logos-v2.cjs
 */

'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SPORTSDB_KEY = '3';

// ── Curated map: brand name (lowercase) → Wikimedia Commons filename ──────────
// These are exact filenames from commons.wikimedia.org
const WIKI_FILES = {
  // ── FASHION ──
  'abercrombie & fitch':   'Abercrombie_&_Fitch_brandmark.png',
  'allbirds':              'Allbirds_logo.png',
  'american eagle':        'American_Eagle_Outfitters_logo.svg',
  'arc\'teryx':            'Arc\'teryx_logo.svg',
  'asics':                 'ASICS_logo.svg',
  'balenciaga':            'Balenciaga_logo.svg',
  'birkenstock':           'Birkenstock-Logo.svg',
  'boohoo':                'Boohoo_logo.svg',
  'bottega veneta':        'Bottega_Veneta_logo.svg',
  'burberry':              'Burberry_logo.svg',
  'calvin klein':          'Calvin_Klein_Logo.svg',
  'canada goose':          'Canada_Goose_Holdings_logo.svg',
  'carhartt':              'Carhartt_logo.svg',
  'champion':              'Champion_wordmark.svg',
  'chanel':                'Chanel_logo_interlocking_cs.svg',
  'clarks':                'Clarks_logo.svg',
  'coach':                 'Coach_New_York_logo.svg',
  'cole haan':             'Cole_Haan_logo.svg',
  'converse':              'Converse_logo.svg',
  'cos':                   'COS_logo.svg',
  'dior':                  'Christian_Dior_SE_(logo).svg',
  'dkny':                  'DKNY_logo.svg',
  'dr. martens':           'Dr._Martens_logo.svg',
  'fendi':                 'Fendi_logo.svg',
  'fila':                  'Fila_logo.svg',
  'forever 21':            'Forever_21_logo.svg',
  'gap':                   'Gap_logo.svg',
  'givenchy':              'Givenchy_(logo).svg',
  'gucci':                 'Gucci_Logo.svg',
  'guess':                 'Guess_(brand)_logo.svg',
  'h&m':                   'H&M-Logo.svg',
  'hermes':                'Hermes_logo.svg',
  'hugo boss':             'Hugo_Boss_logo.svg',
  'hugo':                  'Hugo_Boss_logo.svg',
  'j. crew':               'J.Crew_logo.png',
  'kith':                  'Kith_logo.svg',
  'lacoste':               'Lacoste_logo.svg',
  'levi\'s':               'Levi_Strauss_logo.svg',
  'levis':                 'Levi_Strauss_logo.svg',
  'longchamp':             'Longchamp_logo.svg',
  'louis vuitton':         'Louis_Vuitton_logo_and_wordmark.svg',
  'lululemon':             'Lululemon_Athletica_logo.svg',
  'mango':                 'Mango_logo_2018.svg',
  'merrell':               'Merrell_logo.svg',
  'michael kors':          'Michael_Kors_logo.svg',
  'moncler':               'Moncler_logo.svg',
  'new balance':           'New_Balance_logo.svg',
  'nike':                  'Nike_Logo.svg',
  'north face':            'The_North_Face_logo.svg',
  'the north face':        'The_North_Face_logo.svg',
  'off-white':             'Off-White_Logo.svg',
  'old navy':              'Old_Navy_logo.svg',
  'patagonia':             'Patagonia_logo.svg',
  'polo ralph lauren':     'Ralph_Lauren_Corporation_logo.svg',
  'prada':                 'Prada-Logo.svg',
  'puma':                  'PUMA_Logo.svg',
  'ralph lauren':          'Ralph_Lauren_Corporation_logo.svg',
  'reebok':                'Reebok_logo.svg',
  'reiss':                 'Reiss_(retailer)_logo.png',
  'saint laurent':         'Saint_Laurent_(brand)_logo.svg',
  'saucony':               'Saucony_logo.svg',
  'shein':                 'Shein_logo.svg',
  'stone island':          'Stone_Island_logo.svg',
  'stussy':                'Stüssy_logo.svg',
  'supreme':               'Supreme_box_logo.svg',
  'the row':               'The_Row_(brand)_logo.png',
  'timberland':            'Timberland_logo.svg',
  'tommy hilfiger':        'Tommy_Hilfiger_logo.svg',
  'tory burch':            'Tory_Burch_logo.svg',
  'ugg':                   'UGG_Australia_Logo.svg',
  'under armour':          'Under_Armour_logo.svg',
  'uniqlo':                'Uniqlo_logo.svg',
  'urban outfitters':      'Urban_Outfitters_logo.svg',
  'vacheron constantin':   'Vacheron_Constantin_Logo.svg',
  'valentino':             'Valentino_logo.svg',
  'vans':                  'Vans-logo.svg',
  'versace':               'Versace_logo.svg',
  'victoria\'s secret':    'Victoria\'s_Secret_Logo.svg',
  'vuori':                 'Vuori_logo.png',
  'weekday':               'Weekday_(brand)_logo.svg',
  'zara':                  'Zara_Logo.svg',
  'zegna':                 'Ermenegildo_Zegna_logo.svg',
  'zenith':                'Zenith_watches_logo.svg',
  // ── FOOD ──
  'arby\'s':               'Arby\'s_logo.svg',
  'auntie anne\'s':        'Auntie_Anne\'s_logo.svg',
  'baskin-robbins':        'Baskin-Robbins_logo.svg',
  'bojangles':             'Bojangles\'_logo.svg',
  'buffalo wild wings':    'Buffalo_Wild_Wings_logo.svg',
  'burger king':           'Burger_King_logo_(2020).svg',
  'carl\'s jr.':           'Carl\'s_Jr._logo.svg',
  'chick-fil-a':           'Chick-fil-A_Logo.svg',
  'chipotle':              'Chipotle_Mexican_Grill_logo.svg',
  'church\'s chicken':     'Church\'s_Chicken_logo.svg',
  'cracker barrel':        'Cracker_Barrel_logo.svg',
  'culver\'s':             'Culver\'s_logo.svg',
  'dairy queen':           'Dairy_Queen_logo.svg',
  'del taco':              'Del_Taco_logo.svg',
  'denny\'s':              'Denny\'s_logo.svg',
  'domino\'s':             'Dominos_logo_(2012-present).svg',
  'dunkin\'':              'Dunkin\'_logo.svg',
  'five guys':             'Five_Guys_logo.svg',
  'hardee\'s':             'Hardee\'s_logo.svg',
  'ihop':                  'IHOP_logo.svg',
  'in-n-out':              'In-N-Out_Burger_logo.svg',
  'jack in the box':       'Jack_in_the_Box_logo.svg',
  'jersey mike\'s':        'Jersey_Mike\'s_Subs_logo.svg',
  'kfc':                   'KFC_logo.svg',
  'little caesars':        'Little_Caesars_Pizza_logo.svg',
  'long john silver\'s':   'Long_John_Silver\'s_logo.svg',
  'mcdonald\'s':           'Golden_Arches_Logo.svg',
  'nando\'s':              'Nando\'s_logo.svg',
  'olive garden':          'Olive_Garden_Logo.svg',
  'panda express':         'Panda_Express_logo.svg',
  'panera bread':          'Panera_Bread_wordmark.svg',
  'papa john\'s':          'Papa_John\'s_logo.svg',
  'peet\'s coffee':        'Peet\'s_Coffee_logo.svg',
  'pizza hut':             'Pizza_Hut_logo_(1999).svg',
  'popeyes':               'Popeyes_logo.svg',
  'raising cane\'s':       'Raising_Cane\'s_Chicken_Fingers_logo.svg',
  'red lobster':           'Red_Lobster_logo.svg',
  'red robin':             'Red_Robin_logo.svg',
  'shake shack':           'Shake_Shack_logo.png',
  'smoothie king':         'Smoothie_King_logo.svg',
  'sonic drive-in':        'Sonic_Drive-In_logo.svg',
  'starbucks':             'Starbucks_Coffee_Logo.svg',
  'subway':                'Subway_Logo_2021.svg',
  'sweetgreen':            'Sweetgreen_logo.svg',
  'taco bell':             'Taco_Bell_2016.svg',
  'the capital grille':    'The_Capital_Grille_logo.png',
  'the cheesecake factory':'The_Cheesecake_Factory_logo.png',
  'tim hortons':           'Tim_Hortons_logo.svg',
  'torchy\'s tacos':       'Torchy\'s_Tacos_logo.png',
  'wendy\'s':              'Wendy\'s_logo_(2012).svg',
  'white castle':          'White_Castle_logo.svg',
  'wingstop':              'Wingstop_logo.svg',
  'zippy\'s':              'Zippy\'s_logo.png',
  // ── CARS ──
  'abarth':                'Abarth_logo.svg',
  'acura':                 'Acura-Logo.svg',
  'alfa romeo':            'Logo_Alfa_Romeo_(2015).svg',
  'aston martin':          'Aston_Martin_logo.svg',
  'audi':                  'Audi_2016.svg',
  'bentley':               'Bentley_logo.svg',
  'bmw':                   'BMW_logo_(white).svg',
  'bugatti':               'Bugatti_logo.svg',
  'buick':                 'Buick_logo.svg',
  'cadillac':              'Cadillac_logo.svg',
  'changan':               'Changan_icon.svg',
  'chevrolet':             'Chevrolet_Script_logo_(cravat).svg',
  'chrysler':              'Chrysler_logo.svg',
  'citroen':               'Citroën_2016_logo.svg',
  'dodge':                 'Dodge_logo.svg',
  'ferrari':               'Ferrari-Logo.svg',
  'fiat':                  'Fiat_logo_(2020).svg',
  'ford':                  'Ford_Motor_Company_Logo.svg',
  'genesis':               'Genesis_Motor_logo.svg',
  'gmc':                   'GMC_logo.svg',
  'honda':                 'Honda_logo.svg',
  'hyundai':               'Hyundai_Motor_Company_logo.svg',
  'infiniti':              'Infiniti_logo.svg',
  'jaguar':                'Jaguar_Cars_logo.svg',
  'jeep':                  'Jeep_wordmark.svg',
  'kia':                   'Kia-logo2.svg',
  'lamborghini':           'Lamborghini_logo.svg',
  'land rover':            'Land_Rover_logo.svg',
  'lexus':                 'Lexus_division_emblem.svg',
  'lincoln':               'Lincoln_Motor_Company_logo.svg',
  'lucid motors':          'Lucid_Motors_logo.svg',
  'maserati':              'Maserati_logo.svg',
  'mazda':                 'Mazda_logo.svg',
  'mclaren':               'McLaren_Automotive_logo.svg',
  'mercedes-benz':         'Mercedes-Benz_logo.svg',
  'mini':                  'Mini_logo.svg',
  'mitsubishi':            'Mitsubishi_logo.svg',
  'nissan':                'Nissan_logo.svg',
  'opel':                  'Opel_logo_2021.svg',
  'peugeot':               'Peugeot_2021_Logo.svg',
  'polestar':              'Polestar_symbol_Black.svg',
  'porsche':               'Porsche_logo.svg',
  'ram trucks':            'Ram-logo.svg',
  'renault':               'Renault_2021_logo.svg',
  'rimac automobili':      'Rimac_automobili_logo.svg',
  'rivian':                'Rivian_logo.svg',
  'rolls-royce motor cars':'Rolls-Royce_Motor_Cars_logo.svg',
  'saab':                  'Saab_Automobile_logo.svg',
  'scania':                'Scania_logo.svg',
  'seat':                  'SEAT_logo_(2012).svg',
  'skoda':                 'Skoda-Auto-Logo-2011-present.svg',
  'subaru':                'Subaru_logo_2019.svg',
  'suzuki':                'Suzuki_logo_2.svg',
  'tata motors':           'Tata_Motors_Logo.svg',
  'tesla':                 'Tesla_Motors.svg',
  'toyota':                'Toyota_logo_(Red).svg',
  'vauxhall':              'Vauxhall_motors_logo.svg',
  'volkswagen':            'Volkswagen_logo_2019.svg',
  'volvo':                 'Volvo_Cars_logo.svg',
  'xpeng':                 'Xpeng_logo.svg',
  'zeekr':                 'Zeekr_logo.svg',
};

// ── Utility ───────────────────────────────────────────────────────────────────
function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = {
      timeout: 25000,
      headers: {
        'User-Agent': 'Zo2yLogoFixer/2.0 (https://zo2y.com; contact@zo2y.com)',
        ...extraHeaders,
      },
    };
    const req = mod.get(url, options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return fetchUrl(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'] || '',
        buffer: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function guessExt(contentType, url = '') {
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('webp')) return '.webp';
  const m = (url || '').match(/\.(svg|png|jpe?g|webp)(\?|$)/i);
  if (m) return '.' + m[1].toLowerCase().replace('jpeg','jpg');
  return '.png';
}

// ── Get real CDN URL for a Commons filename via imageinfo API ─────────────────
async function resolveCommonsUrl(filename) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const r = await fetchUrl(apiUrl, { 'Accept': 'application/json' });
    if (r.status !== 200) return '';
    const json = JSON.parse(r.buffer.toString());
    const pages = json?.query?.pages || {};
    const page = Object.values(pages)[0];
    return page?.imageinfo?.[0]?.url || '';
  } catch { return ''; }
}

// ── Upload to Supabase ────────────────────────────────────────────────────────
async function uploadLogo(buffer, storagePath, contentType) {
  const mime = contentType.includes('svg') ? 'image/svg+xml'
    : contentType.includes('png') ? 'image/png'
    : contentType.includes('jpeg') ? 'image/jpeg'
    : contentType.includes('webp') ? 'image/webp'
    : 'image/png';
  const { error } = await supabase.storage.from('brand-logos').upload(storagePath, buffer, {
    contentType: mime, upsert: true,
  });
  if (error) throw new Error(error.message);
}

async function updateDb(table, id, logoPath) {
  const { error } = await supabase.from(table).update({ logo_url: logoPath }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Fix one brand entry ───────────────────────────────────────────────────────
async function fixBrand(entry) {
  const key = entry.name.toLowerCase().trim();
  const filename = WIKI_FILES[key];

  if (!filename) {
    console.log(`  ? [${entry.name}] — no curated file, skipping`);
    return 'skip';
  }

  // Resolve real CDN URL
  await sleep(200);
  const cdnUrl = await resolveCommonsUrl(filename);
  if (!cdnUrl) {
    console.log(`  ✗ [${entry.name}] — could not resolve CDN URL for ${filename}`);
    return 'fail';
  }

  // Download from CDN (no rate limit)
  let resp;
  try {
    resp = await fetchUrl(cdnUrl);
    if (resp.status !== 200 || resp.buffer.length < 200) {
      console.log(`  ✗ [${entry.name}] — bad download ${resp.status} ${resp.buffer.length}B`);
      return 'fail';
    }
  } catch (e) {
    console.log(`  ✗ [${entry.name}] — download error: ${e.message}`);
    return 'fail';
  }

  const ext = guessExt(resp.contentType, cdnUrl);
  const safeName = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const storagePath = `${entry.table}/${safeName}${ext}`;

  try {
    await uploadLogo(resp.buffer, storagePath, resp.contentType);
    await updateDb(entry.table, entry.id, storagePath);
    console.log(`  ✓ [${entry.name}] ${resp.buffer.length}B → ${storagePath}`);
    return 'ok';
  } catch (e) {
    console.log(`  ✗ [${entry.name}] — storage/db error: ${e.message}`);
    return 'fail';
  }
}

// ── Fix sports teams ──────────────────────────────────────────────────────────
async function fixSportsTeams() {
  console.log('\n── SPORTS TEAMS (missing logos) ──');
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, sport, league, logo_url')
    .order('name');
  if (error) { console.error('Cannot fetch teams:', error.message); return; }

  const missing = teams.filter(t => !t.logo_url || t.logo_url.trim() === '');
  console.log(`  ${teams.length} total, ${missing.length} missing logos\n`);

  let fixed = 0, failed = 0, skipped = 0;
  for (const team of missing) {
    await sleep(500);
    try {
      const searchName = encodeURIComponent(team.name);
      const apiUrl = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${searchName}`;
      const r = await fetchUrl(apiUrl);
      if (r.status !== 200) { failed++; console.log(`  ✗ [${team.name}] HTTP ${r.status}`); continue; }

      const json = JSON.parse(r.buffer.toString());
      const results = json?.teams;
      if (!results?.length) {
        // Try search by first word
        const word = team.name.split(' ')[0];
        if (word.length < 3) { skipped++; console.log(`  ? [${team.name}] — no results`); continue; }
        const r2 = await fetchUrl(`https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(word)}`);
        await sleep(300);
        const json2 = JSON.parse(r2.buffer.toString());
        const results2 = json2?.teams;
        if (!results2?.length) { skipped++; console.log(`  ? [${team.name}] — not in TheSportsDB`); continue; }
        // pick closest
        const best2 = results2.find(t2 => t2.strTeam?.toLowerCase() === team.name.toLowerCase()) || results2[0];
        if (!best2?.strTeamBadge) { skipped++; continue; }
        await downloadAndStoreBadge(team, best2.strTeamBadge) ? fixed++ : failed++;
        continue;
      }

      const best = results.find(t2 => t2.strTeam?.toLowerCase() === team.name.toLowerCase())
        || results.find(t2 => t2.strTeam?.toLowerCase().includes(team.name.toLowerCase().split(' ')[0].toLowerCase()))
        || results[0];

      if (!best?.strTeamBadge) { skipped++; console.log(`  ? [${team.name}] — no badge in API`); continue; }
      await downloadAndStoreBadge(team, best.strTeamBadge) ? fixed++ : failed++;
    } catch (e) {
      failed++;
      console.log(`  ✗ [${team.name}] — ${e.message}`);
    }
  }
  console.log(`\n  Sports: ${fixed} fixed, ${failed} failed, ${skipped} skipped`);
}

async function downloadAndStoreBadge(team, badgeUrl) {
  // TheSportsDB badge URLs — try /preview for a smaller version first
  const urls = [`${badgeUrl}/preview`, badgeUrl];
  for (const u of urls) {
    try {
      const r = await fetchUrl(u);
      if (r.status === 200 && r.buffer.length > 500) {
        const ext = guessExt(r.contentType, u);
        const safeName = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const storagePath = `sports_teams/${safeName}${ext}`;
        await uploadLogo(r.buffer, storagePath, r.contentType);
        await updateDb('teams', team.id, storagePath);
        console.log(`  ✓ [${team.name}] ${r.buffer.length}B → ${storagePath}`);
        return true;
      }
    } catch {}
  }
  console.log(`  ✗ [${team.name}] — badge download failed`);
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const report = JSON.parse(fs.readFileSync('logo-audit-report.json', 'utf8'));
  const bad = report.entries.filter(e => e.issues.length > 0);

  console.log('===========================================');
  console.log('  LOGO FIX v2 — Wikimedia CDN + TheSportsDB');
  console.log(`  ${bad.length} bad brand logos + sports teams`);
  console.log('===========================================\n');

  const stats = { ok: 0, fail: 0, skip: 0 };

  // Group by table
  const byTable = {};
  for (const e of bad) {
    if (!byTable[e.table]) byTable[e.table] = [];
    byTable[e.table].push(e);
  }

  for (const [table, entries] of Object.entries(byTable)) {
    console.log(`\n── ${table.toUpperCase()} (${entries.length} entries) ──`);
    for (const entry of entries) {
      await sleep(300);
      const result = await fixBrand(entry);
      stats[result === 'ok' ? 'ok' : result === 'skip' ? 'skip' : 'fail']++;
    }
  }

  // Sports teams with missing logos
  await fixSportsTeams();

  console.log('\n===========================================');
  console.log('  DONE');
  console.log(`  Brands: ${stats.ok} fixed, ${stats.fail} failed, ${stats.skip} skipped`);
  console.log('===========================================');
}

main().catch(console.error);
