/**
 * fix-logos.cjs
 * 
 * Replaces all bad/screenshotted logos with proper ones.
 * Strategy per category:
 *  - fashion_brands / food_brands / car_brands: 
 *      Fetch proper logo from Wikimedia Commons (P154) via Wikidata SPARQL,
 *      upload to Supabase storage, update DB.
 *  - teams (sports):
 *      Fetch badge from TheSportsDB API, upload to Supabase storage, update DB.
 *
 * Run: node fix-logos.cjs
 */

'use strict';

const https  = require('https');
const http   = require('http');
const path   = require('path');
const fs     = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/brand-logos`;
const SPORTSDB_KEY = '3';  // free tier key

// ── Utility: fetch URL with redirect following ────────────────────────────────
function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = { timeout: 20000, headers: { 'User-Agent': 'Zo2yLogoFixer/1.0' }, ...opts };
    const req = mod.get(url, options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) && res.headers.location) {
        return fetchUrl(res.headers.location, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'] || '',
        buffer: Buffer.concat(chunks),
        url,
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Wikimedia Commons logo via brand name ─────────────────────────────────────
const WIKI_TITLE_OVERRIDES = {
  // Fashion
  'abercrombie & fitch':   'Abercrombie & Fitch',
  'american eagle':        'American Eagle Outfitters',
  'aerie':                 'Aerie (brand)',
  'allbirds':              'Allbirds',
  'arc\'teryx':            'Arc\'teryx',
  'aritzia':               'Aritzia',
  'asos':                  'ASOS',
  'balenciaga':            'Balenciaga',
  'bottega veneta':        'Bottega Veneta',
  'burberry':              'Burberry',
  'calvin klein':          'Calvin Klein',
  'canada goose':          'Canada Goose (clothing)',
  'carhartt':              'Carhartt',
  'champion':              'Champion (sportswear)',
  'chanel':                'Chanel',
  'coach':                 'Coach (company)',
  'converse':              'Converse (shoe company)',
  'cos':                   'COS (fashion brand)',
  'dior':                  'Dior',
  'dkny':                  'DKNY',
  'dr. martens':           'Dr. Martens',
  'ermenegildo zegna':     'Ermenegildo Zegna',
  'fendi':                 'Fendi',
  'fila':                  'Fila (company)',
  'forever 21':            'Forever 21',
  'gap':                   'Gap Inc.',
  'givenchy':              'Givenchy',
  'gucci':                 'Gucci',
  'h&m':                   'H&M',
  'hermes':                'Hermès',
  'hugo boss':             'Hugo Boss',
  'j. crew':               'J.Crew',
  'kith':                  'Kith (brand)',
  'lacoste':               'Lacoste',
  'levi\'s':               'Levi Strauss & Co.',
  'levis':                 'Levi Strauss & Co.',
  'louis vuitton':         'Louis Vuitton',
  'lululemon':             'Lululemon Athletica',
  'mango':                 'Mango (retailer)',
  'michael kors':          'Michael Kors',
  'moncler':               'Moncler',
  'new balance':           'New Balance',
  'nike':                  'Nike, Inc.',
  'north face':            'The North Face',
  'the north face':        'The North Face',
  'off-white':             'Off-White (brand)',
  'old navy':              'Old Navy',
  'patagonia':             'Patagonia (clothing)',
  'polo ralph lauren':     'Ralph Lauren Corporation',
  'ralph lauren':          'Ralph Lauren Corporation',
  'prada':                 'Prada',
  'puma':                  'Puma (brand)',
  'reebok':                'Reebok',
  'saint laurent':         'Saint Laurent (brand)',
  'shein':                 'Shein',
  'stone island':          'Stone Island',
  'stussy':                'Stüssy',
  'supreme':               'Supreme (skateboard shop)',
  'the row':               'The Row (brand)',
  'tommy hilfiger':        'Tommy Hilfiger',
  'under armour':          'Under Armour',
  'uniqlo':                'Uniqlo',
  'valentino':             'Valentino (fashion house)',
  'vans':                  'Vans',
  'versace':               'Versace',
  'victoria\'s secret':    'Victoria\'s Secret',
  'zara':                  'Zara (retailer)',
  'zegna':                 'Ermenegildo Zegna',
  // Food
  'burger king':           'Burger King',
  'chick-fil-a':           'Chick-fil-A',
  'chipotle':              'Chipotle Mexican Grill',
  'cracker barrel':        'Cracker Barrel',
  'culver\'s':             'Culver\'s',
  'denny\'s':              'Denny\'s',
  'domino\'s':             'Domino\'s',
  'dunkin\'':              'Dunkin\'',
  'in-n-out':              'In-N-Out Burger',
  'jack in the box':       'Jack in the Box',
  'kfc':                   'KFC',
  'little caesars':        'Little Caesars',
  'mcdonald\'s':           'McDonald\'s',
  'nando\'s':              'Nando\'s',
  'panera bread':          'Panera Bread',
  'papa john\'s':          'Papa John\'s',
  'peet\'s coffee':        'Peet\'s Coffee',
  'pizza hut':             'Pizza Hut',
  'popeyes':               'Popeyes',
  'raising cane\'s':       'Raising Cane\'s Chicken Fingers',
  'red lobster':           'Red Lobster',
  'shake shack':           'Shake Shack',
  'sonic drive-in':        'Sonic Drive-In',
  'starbucks':             'Starbucks',
  'subway':                'Subway (restaurant)',
  'sweetgreen':            'Sweetgreen',
  'taco bell':             'Taco Bell',
  'the capital grille':    'The Capital Grille',
  'the cheesecake factory':'The Cheesecake Factory',
  'tim hortons':           'Tim Hortons',
  'torchy\'s tacos':       'Torchy\'s Tacos',
  'wendy\'s':              'Wendy\'s',
  'white castle':          'White Castle (restaurant)',
  'zippy\'s':              'Zippy\'s',
  // Cars
  'abarth':                'Abarth',
  'audi':                  'Audi',
  'bugatti':               'Bugatti',
  'cadillac':              'Cadillac',
  'chevrolet':             'Chevrolet',
  'chrysler':              'Chrysler',
  'dodge':                 'Dodge',
  'ferrari':               'Ferrari',
  'ford':                  'Ford Motor Company',
  'genesis':               'Genesis Motor',
  'hyundai':               'Hyundai Motor Company',
  'jaguar':                'Jaguar Cars',
  'jeep':                  'Jeep',
  'kia':                   'Kia',
  'lamborghini':           'Lamborghini',
  'lexus':                 'Lexus',
  'lucid motors':          'Lucid Motors',
  'maserati':              'Maserati',
  'mazda':                 'Mazda',
  'mclaren':               'McLaren',
  'mercedes-benz':         'Mercedes-Benz',
  'mini':                  'Mini (marque)',
  'peugeot':               'Peugeot',
  'porsche':               'Porsche',
  'ram trucks':            'Ram Trucks',
  'rimac automobili':      'Rimac Automobili',
  'rivian':                'Rivian',
  'rolls-royce motor cars':'Rolls-Royce Motor Cars',
  'saab':                  'Saab Automobile',
  'scania':                'Scania AB',
  'tata motors':           'Tata Motors',
  'vauxhall':              'Vauxhall Motors',
  'xpeng':                 'Xpeng',
  'zeekr':                 'Zeekr',
  'changan':               'Changan Automobile',
};

// Direct Wikimedia file overrides (known-good files)
const DIRECT_WIKI_FILES = {
  'nike':                   'Nike_logo.svg',
  'adidas':                 'Adidas_Logo.svg',
  'puma':                   'PUMA_Logo.svg',
  'reebok':                 'Reebok_logo.svg',
  'new balance':            'New_Balance_logo.svg',
  'under armour':           'Under_Armour_logo.svg',
  'lululemon':              'Lululemon_Athletica_logo.svg',
  'supreme':                'Supreme_box_logo.svg',
  'h&m':                    'H&M-Logo.svg',
  'zara':                   'Zara_Logo.svg',
  'gap':                    'Gap_logo.svg',
  'uniqlo':                 'Uniqlo_logo.svg',
  'shein':                  'Shein_logo.svg',
  'gucci':                  'Gucci_Logo.svg',
  'prada':                  'Prada-Logo.svg',
  'louis vuitton':          'Louis_Vuitton_logo_and_wordmark.svg',
  'burberry':               'Burberry_logo.svg',
  'balenciaga':             'Balenciaga_logo.svg',
  'moncler':                'Moncler_logo.svg',
  'hermes':                 'Hermes_logo.svg',
  'dior':                   'Christian_Dior_SE_(logo).svg',
  'versace':                'Versace_logo.svg',
  'ralph lauren':           'Ralph_Lauren_Corporation_logo.svg',
  'polo ralph lauren':      'Ralph_Lauren_Corporation_logo.svg',
  'calvin klein':           'Calvin_Klein_Logo.svg',
  'tommy hilfiger':         'Tommy_Hilfiger_logo.svg',
  'coach':                  'Coach_New_York_logo.svg',
  'converse':               'Converse_logo.svg',
  'vans':                   'Vans-logo.svg',
  'fila':                   'Fila_logo.svg',
  'champion':               'Champion_wordmark.svg',
  'lacoste':                'Lacoste_logo.svg',
  'hugo boss':              'Hugo_Boss_logo.svg',
  'fendi':                  'Fendi_logo.svg',
  'givenchy':               'Givenchy_(logo).svg',
  'saint laurent':          'Saint_Laurent_(brand)_logo.svg',
  'valentino':              'Valentino_logo.svg',
  'michael kors':           'Michael_Kors_logo.svg',
  'patagonia':              'Patagonia_logo.svg',
  'the north face':         'The_North_Face_logo.svg',
  'north face':             'The_North_Face_logo.svg',
  'carhartt':               'Carhartt_logo.svg',
  'stone island':           'Stone_Island_logo.svg',
  'canada goose':           'Canada_Goose_logo.svg',
  'levi\'s':                'Levi_Strauss_logo.svg',
  'levis':                  'Levi_Strauss_logo.svg',
  'forever 21':             'Forever_21_logo.svg',
  'mango':                  'Mango_(clothing)_logo.svg',
  'cos':                    'COS_logo.svg',
  'off-white':              'Off-White_Logo.svg',
  'dr. martens':            'Dr._Martens_logo.svg',
  'stussy':                 'Stüssy_logo.svg',
  'kith':                   'Kith_logo.svg',
  'bottega veneta':         'Bottega_Veneta_logo.svg',
  'chanel':                 'Chanel_logo.svg',
  'dkny':                   'DKNY_logo.svg',
  'asos':                   'ASOS_logo.svg',
  'arc\'teryx':             'Arc\'teryx_logo.svg',
  // Food
  'mcdonald\'s':            'McDonald\'s_logo_1968.svg',
  'burger king':            'Burger_King_logo_(2020).svg',
  'starbucks':              'Starbucks_Coffee_Logo.svg',
  'kfc':                    'KFC_logo.svg',
  'subway':                 'Subway_Logo_2021.svg',
  'taco bell':              'Taco_Bell_2016.svg',
  'pizza hut':              'Pizza_Hut_logo_(1999).svg',
  'domino\'s':              'Dominos_logo_(2012-present).svg',
  'chick-fil-a':            'Chick-fil-A_Logo.svg',
  'chipotle':               'Chipotle_Mexican_Grill_logo.svg',
  'wendy\'s':               'Wendy\'s_logo_(2012).svg',
  'dunkin\'':               'Dunkin\'_Donuts_logo.svg',
  'shake shack':            'Shake_Shack_logo.png',
  'five guys':              'Five_Guys_logo.svg',
  'tim hortons':            'Tim_Hortons_logo.svg',
  'popeyes':                'Popeyes_logo.svg',
  'raising cane\'s':        'Raising_Cane\'s_Chicken_Fingers_logo.svg',
  'panera bread':           'Panera_Bread_wordmark.svg',
  'peet\'s coffee':         'Peet\'s_Coffee_logo.svg',
  'nando\'s':               'Nando\'s_logo.svg',
  'papa john\'s':           'Papa_John\'s_logo.svg',
  'sonic drive-in':         'Sonic_Drive-In_logo.svg',
  'jack in the box':        'Jack_in_the_Box_logo.svg',
  'little caesars':         'Little_Caesars_Pizza_logo.svg',
  'cracker barrel':         'Cracker_Barrel_logo.svg',
  'culver\'s':              'Culver\'s_logo.svg',
  'in-n-out':               'In-N-Out_Burger_logo.svg',
  'sweetgreen':             'Sweetgreen_logo.svg',
  'the cheesecake factory': 'The_Cheesecake_Factory_logo.png',
  'the capital grille':     'The_Capital_Grille_logo.png',
  'torchy\'s tacos':        'Torchy\'s_Tacos_logo.png',
  'white castle':           'White_Castle_logo.svg',
  'red lobster':            'Red_Lobster_logo.svg',
  'denny\'s':               'Denny\'s_logo.svg',
  // Cars
  'audi':                   'Audi_2016.svg',
  'bmw':                    'BMW_logo_(white).svg',
  'mercedes-benz':          'Mercedes-Benz_logo.svg',
  'volkswagen':             'Volkswagen_logo_2019.svg',
  'toyota':                 'Toyota_logo_(Red).svg',
  'honda':                  'Honda_logo.svg',
  'ford':                   'Ford_Motor_Company_Logo.svg',
  'chevrolet':              'Chevrolet_Script_logo_(cravat).svg',
  'nissan':                 'Nissan_logo.svg',
  'hyundai':                'Hyundai_Motor_Company_logo.svg',
  'kia':                    'Kia-logo2.svg',
  'lexus':                  'Lexus_division_emblem.svg',
  'tesla':                  'Tesla_logo.svg',
  'porsche':                'Porsche_Logo_2024.png',
  'ferrari':                'Ferrari-Logo.svg',
  'lamborghini':            'Lamborghini_logo.svg',
  'land rover':             'Land_Rover_logo.svg',
  'jaguar':                 'Jaguar_Cars_logo.svg',
  'volvo':                  'Volvo_Cars_logo.svg',
  'subaru':                 'Subaru_logo_2019.svg',
  'mazda':                  'Mazda_logo.svg',
  'peugeot':                'Peugeot_2021_Logo.svg',
  'renault':                'Renault_2021_logo.svg',
  'fiat':                   'Fiat_logo_(2020).svg',
  'alfa romeo':             'Logo_Alfa_Romeo_(2015).svg',
  'mini':                   'Mini_logo.svg',
  'jeep':                   'Jeep_wordmark.svg',
  'cadillac':               'Cadillac_logo.svg',
  'dodge':                  'Dodge_logo.svg',
  'chrysler':               'Chrysler_logo.svg',
  'acura':                  'Acura-Logo.svg',
  'infiniti':               'Infiniti_logo.svg',
  'genesis':                'Genesis_Motor_logo.svg',
  'polestar':               'Polestar_symbol_Black.svg',
  'rivian':                 'Rivian_logo.svg',
  'lucid motors':           'Lucid_Motors_logo.svg',
  'maserati':               'Maserati_logo.svg',
  'bugatti':                'Bugatti_logo.svg',
  'mclaren':                'McLaren_Automotive_logo.svg',
  'aston martin':           'Aston_Martin_logo.svg',
  'bentley':                'Bentley_logo.svg',
  'rolls-royce motor cars': 'Rolls-Royce_Motor_Cars_logo.svg',
  'saab':                   'Saab_Automobile_logo.svg',
  'scania':                 'Scania_logo.svg',
  'ram trucks':             'Ram-logo.svg',
  'vauxhall':               'Vauxhall_motors_logo.svg',
  'tata motors':            'Tata_Motors_Logo.svg',
  'changan':                'Changan_icon.svg',
  'xpeng':                  'Xpeng_logo.svg',
  'zeekr':                  'Zeekr_logo.svg',
  'rimac automobili':       'Rimac_automobili_logo.svg',
  'abarth':                 'Abarth_logo.svg',
  'genesis':                'Genesis_Motor_logo.svg',
};

function commonsUrl(filename, size=512) {
  const safe = filename.replace(/\s+/g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safe)}?width=${size}`;
}

async function fetchWikidataLogo(wikiTitle, size=512) {
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}?redirect=true`;
    const sumRes = await fetchUrl(summaryUrl);
    if (sumRes.status !== 200) return '';
    const sum = JSON.parse(sumRes.buffer.toString());
    const qid = sum?.wikibase_item;
    if (!qid) return '';

    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const entRes = await fetchUrl(entityUrl);
    if (entRes.status !== 200) return '';
    const ent = JSON.parse(entRes.buffer.toString());
    const logoFile = ent?.entities?.[qid]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
    if (!logoFile) return '';
    return commonsUrl(logoFile, size);
  } catch { return ''; }
}

function guessExt(contentType, filename) {
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg')) return '.jpg';
  if (contentType.includes('webp')) return '.webp';
  const m = (filename || '').match(/\.(svg|png|jpe?g|webp)$/i);
  if (m) return m[0].toLowerCase().replace('jpeg','jpg');
  return '.png';
}

// ── Upload logo to Supabase storage ───────────────────────────────────────────
async function uploadLogo(buffer, storagePath, contentType) {
  const mimeType = contentType.includes('svg') ? 'image/svg+xml'
    : contentType.includes('png') ? 'image/png'
    : contentType.includes('jpeg') ? 'image/jpeg'
    : contentType.includes('webp') ? 'image/webp'
    : 'image/png';

  const { error } = await supabase.storage.from('brand-logos').upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(`Upload error: ${error.message}`);
}

// ── Update DB logo_url ─────────────────────────────────────────────────────────
async function updateDb(table, id, newLogoPath) {
  const { error } = await supabase.from(table).update({ logo_url: newLogoPath }).eq('id', id);
  if (error) throw new Error(`DB update error: ${error.message}`);
}

// ── Fix a single brand logo ───────────────────────────────────────────────────
async function fixBrandLogo(entry) {
  const nameKey = entry.name.toLowerCase().trim();
  let logoUrl = '';

  // 1. Try direct known-good Wikimedia file first
  const directFile = DIRECT_WIKI_FILES[nameKey];
  if (directFile) {
    const u = commonsUrl(directFile, 512);
    try {
      const r = await fetchUrl(u);
      if (r.status === 200 && r.buffer.length > 500) logoUrl = u;
    } catch {}
  }

  // 2. Fallback: fetch via Wikidata P154
  if (!logoUrl) {
    const wikiTitle = WIKI_TITLE_OVERRIDES[nameKey] || entry.name;
    logoUrl = await fetchWikidataLogo(wikiTitle, 512);
  }

  if (!logoUrl) {
    console.log(`  ✗ [${entry.name}] — could not find a replacement logo`);
    return false;
  }

  // 3. Download the logo
  let logoResp;
  try {
    logoResp = await fetchUrl(logoUrl);
    if (logoResp.status !== 200 || logoResp.buffer.length < 500) {
      console.log(`  ✗ [${entry.name}] — downloaded logo too small/bad: ${logoResp.status} ${logoResp.buffer.length}B`);
      return false;
    }
  } catch(e) {
    console.log(`  ✗ [${entry.name}] — download error: ${e.message}`);
    return false;
  }

  // 4. Determine storage path
  const ext = guessExt(logoResp.contentType, logoUrl);
  const folder = entry.table; // fashion_brands, food_brands, car_brands
  const safeName = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const storagePath = `${folder}/${safeName}${ext}`;

  // 5. Upload
  try {
    await uploadLogo(logoResp.buffer, storagePath, logoResp.contentType);
  } catch(e) {
    console.log(`  ✗ [${entry.name}] — upload failed: ${e.message}`);
    return false;
  }

  // 6. Update DB
  try {
    await updateDb(entry.table, entry.id, storagePath);
  } catch(e) {
    console.log(`  ✗ [${entry.name}] — DB update failed: ${e.message}`);
    return false;
  }

  console.log(`  ✓ [${entry.name}] → ${storagePath} (${logoResp.buffer.length}B)`);
  return true;
}

// ── Fix sports teams with missing logos via TheSportsDB ───────────────────────
async function fixSportsTeams() {
  console.log('\n── SPORTS TEAMS ──');
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, sport, league, logo_url')
    .order('name');
  if (error) { console.error('Cannot fetch teams:', error.message); return; }

  const missing = teams.filter(t => !t.logo_url || t.logo_url.trim() === '');
  console.log(`  ${teams.length} total teams, ${missing.length} missing logos`);

  let fixed = 0, failed = 0;
  for (const team of missing) {
    await sleep(300); // rate limit
    try {
      const searchName = encodeURIComponent(team.name);
      const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${searchName}`;
      const r = await fetchUrl(url);
      if (r.status !== 200) { failed++; console.log(`  ✗ [${team.name}] HTTP ${r.status}`); continue; }
      const json = JSON.parse(r.buffer.toString());
      const results = json?.teams;
      if (!results?.length) { failed++; console.log(`  ✗ [${team.name}] not found in TheSportsDB`); continue; }

      // Pick best match
      const best = results.find(t2 => t2.strTeam?.toLowerCase() === team.name.toLowerCase())
        || results.find(t2 => t2.strTeam?.toLowerCase().includes(team.name.toLowerCase().split(' ')[0]))
        || results[0];

      const badgeUrl = best?.strTeamBadge;
      if (!badgeUrl) { failed++; console.log(`  ✗ [${team.name}] no badge URL in API`); continue; }

      // Download
      const badgeResp = await fetchUrl(`${badgeUrl}/preview`);
      if (badgeResp.status !== 200 || badgeResp.buffer.length < 500) {
        // Try without /preview
        const badgeResp2 = await fetchUrl(badgeUrl);
        if (badgeResp2.status !== 200 || badgeResp2.buffer.length < 500) {
          failed++; console.log(`  ✗ [${team.name}] badge download failed`); continue;
        }
        const ext = guessExt(badgeResp2.contentType, badgeUrl);
        const safeName = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const storagePath = `sports_teams/${safeName}${ext}`;
        await uploadLogo(badgeResp2.buffer, storagePath, badgeResp2.contentType);
        await updateDb('teams', team.id, storagePath);
        console.log(`  ✓ [${team.name}] → ${storagePath}`);
        fixed++;
        continue;
      }

      const ext = guessExt(badgeResp.contentType, badgeUrl);
      const safeName = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const storagePath = `sports_teams/${safeName}${ext}`;
      await uploadLogo(badgeResp.buffer, storagePath, badgeResp.contentType);
      await updateDb('teams', team.id, storagePath);
      console.log(`  ✓ [${team.name}] → ${storagePath}`);
      fixed++;
    } catch(e) {
      failed++;
      console.log(`  ✗ [${team.name}] error: ${e.message}`);
    }
  }
  console.log(`  Sports teams: ${fixed} fixed, ${failed} failed`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Read audit report
  const report = JSON.parse(fs.readFileSync('logo-audit-report.json', 'utf8'));
  const problematic = report.entries.filter(e => e.issues.length > 0);

  console.log('========================================');
  console.log('  LOGO FIX - REPLACING BAD LOGOS');
  console.log(`  ${problematic.length} logos to replace`);
  console.log('========================================\n');

  const byTable = {};
  for (const e of problematic) {
    if (!byTable[e.table]) byTable[e.table] = [];
    byTable[e.table].push(e);
  }

  for (const [table, entries] of Object.entries(byTable)) {
    if (table === 'sports_teams') continue; // handled separately
    console.log(`\n── ${table.toUpperCase()} (${entries.length} to fix) ──`);
    let fixed = 0, failed = 0;
    for (const entry of entries) {
      await sleep(400); // polite rate limiting for Wikimedia
      const ok = await fixBrandLogo(entry);
      if (ok) fixed++; else failed++;
    }
    console.log(`  ${fixed} fixed, ${failed} failed`);
  }

  // Fix sports teams with missing logos
  await fixSportsTeams();

  console.log('\n========================================');
  console.log('  DONE');
  console.log('========================================');
}

main().catch(console.error);
