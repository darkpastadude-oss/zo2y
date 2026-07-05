/**
 * fix-sports-wiki-en.cjs
 *
 * For teams where Wikipedia pageimages API returns nothing:
 * 1. Use Wikipedia `prop=images` to get all filenames on the page
 * 2. Pick the one that looks like a badge/crest/logo
 * 3. Download via Special:Redirect/file (works for English-only fair-use files)
 * 4. Upload to Supabase + update DB
 */
'use strict';
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// All teams still missing logos → Wikipedia page title
const TEAMS = {
  // 429 retries (worked before, just rate limited)
  'atletico goianiense':      'Atlético_Goianiense',
  'bahia':                    'Esporte_Clube_Bahia',
  'belgrano':                 'Club_Atlético_Belgrano',
  'botafogo':                 'Botafogo_de_Futebol_e_Regatas',
  'bragantino':               'Red_Bull_Bragantino',
  'st pauli':                 'FC_St._Pauli',
  'tigre':                    'Club_Atlético_Tigre',
  'torino':                   'Torino_F.C.',
  'tottenham hotspur':        'Tottenham_Hotspur_F.C.',
  'toulouse':                 'Toulouse_FC',
  'manchester united':        'Manchester_United_F.C.',
  'mainz 05':                 '1._FSV_Mainz_05',
  'mercedes':                 'Mercedes-AMG_Petronas_Formula_One_Team',
  'montpellier':              'Montpellier_HSC',
  'monza':                    'A.C._Monza',
  'napoli':                   'S.S.C._Napoli',
  'nice':                     'OGC_Nice',
  'nottingham forest':        'Nottingham_Forest_F.C.',
  // "no image" — need to scrape page image list
  'brest':                    'Stade_Brestois_29',
  'brighton and hove albion': 'Brighton_&_Hove_Albion_F.C.',
  'cagliari':                 'Cagliari_Calcio',
  'corinthians':              'Sport_Club_Corinthians_Paulista',
  'crystal palace':           'Crystal_Palace_F.C.',
  'defensa y justicia':       'Club_Defensa_y_Justicia',
  'empoli':                   'Empoli_F.C.',
  'estudiantes':              'Estudiantes_de_La_Plata',
  'ferrari':                  'Scuderia_Ferrari',
  'fiorentina':               'ACF_Fiorentina',
  'fluminense':               'Fluminense_FC',
  'fortaleza':                'Fortaleza_Esporte_Clube',
  'freiburg':                 'SC_Freiburg',
  'genoa':                    'Genoa_C.F.C.',
  'getafe':                   'Getafe_CF',
  'gimnasia la plata':        'Club_de_Gimnasia_y_Esgrima_La_Plata',
  'girona':                   'Girona_FC',
  'godoy cruz':               'Godoy_Cruz_Antonio_Tomba',
  'gremio':                   'Grêmio_Foot-Ball_Porto_Alegrense',
  'haas':                     'Haas_F1_Team',
  'heidenheim':               'FC_Heidenheim_1846',
  'hellas verona':            'Hellas_Verona_F.C.',
  'hoffenheim':               'TSG_1899_Hoffenheim',
  'holstein kiel':            'Holstein_Kiel',
  'huracan':                  'Club_Atlético_Huracán',
  'ibf':                      'International_Boxing_Federation',
  'independiente':            'Club_Atlético_Independiente',
  'internacional':            'Sport_Club_Internacional',
  'ipswich town':             'Ipswich_Town_F.C.',
  'lanus':                    'Club_Atlético_Lanús',
  'las palmas':               'UD_Las_Palmas',
  'lazio':                    'S.S._Lazio',
  'le havre':                 'Le_Havre_AC',
  'lecce':                    'U.S._Lecce',
  'leganes':                  'CD_Leganés',
  'leicester city':           'Leicester_City_F.C.',
  'lens':                     'RC_Lens',
  'osasuna':                  'CA_Osasuna',
  'parma':                    'Parma_Calcio_1913',
  'platense':                 'Club_Atlético_Platense',
  'rayo vallecano':           'Rayo_Vallecano',
  'real valladolid':          'Real_Valladolid',
  'red bull racing':          'Red_Bull_Racing',
  'red bull salzburg':        'FC_Red_Bull_Salzburg',
  'reims':                    'Stade_de_Reims',
  'rennes':                   'Stade_Rennais_F.C.',
  'rosario central':          'Rosario_Central',
  'saint-etienne':            'AS_Saint-Étienne',
  'sampdoria':                'U.C._Sampdoria',
  'san lorenzo':              'San_Lorenzo_de_Almagro',
  'santos':                   'Santos_FC',
  'sarmiento':                'Club_Atlético_Sarmiento_(Junín)',
  'sevilla':                  'Sevilla_FC',
  'shakhtar donetsk':         'FC_Shakhtar_Donetsk',
  'union berlin':             '1._FC_Union_Berlin',
  'union santa fe':           'Unión_de_Santa_Fe',
  'ufc':                      'Ultimate_Fighting_Championship',
  'valencia':                 'Valencia_CF',
  'vasco da gama':            'Club_de_Regatas_Vasco_da_Gama',
  'velez sarsfield':          'Vélez_Sársfield',
  'venezia':                  'Venezia_F.C.',
  'vfb stuttgart':            'VfB_Stuttgart',
  'vfl bochum':               'VfL_Bochum',
  'villarreal':               'Villarreal_CF',
  'wba':                      'World_Boxing_Association',
  'wbc':                      'World_Boxing_Council',
  'wbo':                      'World_Boxing_Organization',
  'werder bremen':            'Werder_Bremen',
  'williams':                 'Williams_Racing',
  'wolfsburg':                'VfL_Wolfsburg',
  'wolverhampton wanderers':  'Wolverhampton_Wanderers_F.C.',
  'young boys':               'BSC_Young_Boys',
};

// Keywords that indicate a logo/crest/badge file
const LOGO_KEYWORDS = ['crest','badge','logo','emblem','escudo','wappen','shield','seal','icon','fc_','_fc','club','sport','calcio','racing','atletico','atleticó','united','city','real_'];

function fetchUrl(url) {
  return new Promise((res, rej) => {
    https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Zo2yApp/1.0' } }, r => {
      if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location)
        return fetchUrl(r.headers.location).then(res).catch(rej);
      const c = []; r.on('data', d => c.push(d));
      r.on('end', () => res({ status: r.statusCode, ct: r.headers['content-type']||'', buf: Buffer.concat(c) }));
    }).on('error', rej).on('timeout', function(){ this.destroy(); rej(new Error('Timeout')); });
  });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function safeName(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function guessExt(ct, url='') {
  if (ct.includes('svg')) return '.svg'; if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg')||ct.includes('jpg')) return '.jpg';
  const m=(url||'').match(/\.(svg|png|jpe?g)(\?|$)/i); return m?'.'+m[1].replace('jpeg','jpg'):'.jpg';
}

// Get all images on a Wikipedia page, pick the best logo candidate
async function getPageLogoFile(wikiTitle) {
  const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&format=json&redirects=1&imlimit=30`;
  try {
    const r = await fetchUrl(api);
    if (r.status !== 200) return '';
    const j = JSON.parse(r.buf.toString());
    const page = Object.values(j?.query?.pages||{})[0];
    const images = page?.images?.map(i => i.title.replace('File:','')) || [];

    // Filter for image files (not icons/flags/other)
    const candidates = images.filter(f => {
      const fl = f.toLowerCase();
      const isImage = /\.(svg|png|jpg|jpeg)$/i.test(f);
      const notFlag = !fl.includes('flag') && !fl.includes('arrow') && !fl.includes('icon_') && !fl.includes('star') && !fl.includes('question') && !fl.includes('map') && !fl.includes('kit_');
      const isLogo = LOGO_KEYWORDS.some(k => fl.includes(k));
      return isImage && notFlag && (isLogo || images.length <= 5);
    });

    if (!candidates.length && images.length) {
      // Fallback: first SVG or PNG that isn't an icon
      const fallback = images.find(f => /\.(svg|png)$/i.test(f) && !f.toLowerCase().includes('flag') && !f.toLowerCase().includes('kit_'));
      if (fallback) candidates.push(fallback);
    }

    return candidates[0] || '';
  } catch { return ''; }
}

async function downloadWikiFile(filename) {
  // Special:Redirect works for both Commons and en-wiki fair-use files
  const url = `https://en.wikipedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=400`;
  try {
    const r = await fetchUrl(url);
    if (r.status === 200 && r.buf.length > 500) return r;
    return null;
  } catch { return null; }
}

async function main() {
  console.log('==============================================');
  console.log('  SPORTS — Wikipedia page image scrape');
  console.log('==============================================\n');

  const { data: allTeams } = await supabase.from('teams').select('id,name,logo_url');
  const stillMissing = new Set(allTeams.filter(t => !t.logo_url || !t.logo_url.trim()).map(t => t.name.toLowerCase().trim()));
  const toFix = allTeams.filter(t => {
    const key = t.name.toLowerCase().trim();
    return stillMissing.has(key) && TEAMS[key];
  });

  console.log(`${toFix.length} teams to process\n`);
  let fixed=0, failed=0;

  for (const team of toFix) {
    await sleep(500);
    const key = team.name.toLowerCase().trim();
    const title = TEAMS[key];

    try {
      // Step 1: Get image list from page
      const filename = await getPageLogoFile(title);
      if (!filename) { console.log(`  ✗ [${team.name}] no logo file found on page`); failed++; continue; }

      await sleep(300);
      // Step 2: Download the file
      const r = await downloadWikiFile(filename);
      if (!r) { console.log(`  ✗ [${team.name}] download failed for: ${filename}`); failed++; continue; }

      // Step 3: Upload + update DB
      const ext = guessExt(r.ct, filename);
      const sp = `sports_teams/${safeName(team.name)}${ext}`;
      const mime = r.ct.includes('svg')?'image/svg+xml':r.ct.includes('png')?'image/png':'image/jpeg';
      const { error } = await supabase.storage.from('brand-logos').upload(sp, r.buf, { contentType: mime, upsert: true });
      if (error) { console.log(`  ✗ [${team.name}] upload: ${error.message}`); failed++; continue; }
      await supabase.from('teams').update({ logo_url: sp }).eq('id', team.id);
      console.log(`  ✓ [${team.name}] ${r.buf.length}B (${filename.substring(0,40)}) → ${sp}`);
      fixed++;
    } catch(e) {
      console.log(`  ✗ [${team.name}] ${e.message}`);
      failed++;
    }
  }

  console.log('\n==============================================');
  console.log('  ✅ DONE');
  console.log(`  ✓ Fixed: ${fixed}  ✗ Failed: ${failed}`);
  console.log('==============================================');
}
main().catch(console.error);
