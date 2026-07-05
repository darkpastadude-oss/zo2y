/**
 * fix-sports-retry.cjs — Retry failed teams using Wikipedia pageimages API
 * The summary API misses SVG logos; pageimages API finds them properly.
 */
'use strict';
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Teams that still failed — mapped to Wikipedia page titles
const RETRY = {
  'ac milan':                 'A.C._Milan',
  'ajax':                     'AFC_Ajax',
  'alaves':                   'Deportivo_Alavés',
  'alpine':                   'Alpine_F1_Team',
  'arsenal':                  'Arsenal_F.C.',
  'aston martin':             'Aston_Martin_in_Formula_One',
  'aston villa':              'Aston_Villa_F.C.',
  'atalanta':                 'Atalanta_B.C.',
  'atletico goianiense':      'Atlético_Goianiense',
  'atletico mineiro':         'Clube_Atlético_Mineiro',
  'atletico tucuman':         'Club_Atlético_Tucumán',
  'athletic bilbao':          'Athletic_Club',
  'atletico madrid':          'Atlético_Madrid',
  'athletico paranaense':     'Club_Athletico_Paranaense',
  'bahia':                    'Esporte_Clube_Bahia',
  'belgrano':                 'Club_Atlético_Belgrano',
  'boca juniors':             'Club_Atlético_Boca_Juniors',
  'bologna':                  'Bologna_F.C._1909',
  'botafogo':                 'Botafogo_de_Futebol_e_Regatas',
  'bragantino':               'Red_Bull_Bragantino',
  'brest':                    'Stade_Brestois_29',
  'brighton and hove albion': 'Brighton_&_Hove_Albion_F.C.',
  'cagliari':                 'Cagliari_Calcio',
  'celtic':                   'Celtic_F.C.',
  'celta vigo':               'Celta_Vigo',
  'chelsea':                  'Chelsea_F.C.',
  'club brugge':              'Club_Brugge_KV',
  'corinthians':              'Sport_Club_Corinthians_Paulista',
  'crystal palace':           'Crystal_Palace_F.C.',
  'defensa y justicia':       'Club_Defensa_y_Justicia',
  'empoli':                   'Empoli_F.C.',
  'estudiantes':              'Estudiantes_de_La_Plata',
  'everton':                  'Everton_F.C.',
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
  'juventus':                 'Juventus_F.C.',
  'lanus':                    'Club_Atlético_Lanús',
  'las palmas':               'UD_Las_Palmas',
  'lazio':                    'S.S._Lazio',
  'le havre':                 'Le_Havre_AC',
  'lecce':                    'U.S._Lecce',
  'leganes':                  'CD_Leganés',
  'leicester city':           'Leicester_City_F.C.',
  'lens':                     'RC_Lens',
  'lille':                    'Lille_OSC',
  'liverpool':                'Liverpool_F.C.',
  'mainz 05':                 '1._FSV_Mainz_05',
  'manchester united':        'Manchester_United_F.C.',
  'marseille':                'Olympique_de_Marseille',
  'mercedes':                 'Mercedes-AMG_Petronas_Formula_One_Team',
  'montpellier':              'Montpellier_HSC',
  'monza':                    'A.C._Monza',
  'napoli':                   'S.S.C._Napoli',
  'newcastle united':         'Newcastle_United_F.C.',
  'nice':                     'OGC_Nice',
  'nottingham forest':        'Nottingham_Forest_F.C.',
  'osasuna':                  'CA_Osasuna',
  'parma':                    'Parma_Calcio_1913',
  'platense':                 'Club_Atlético_Platense',
  'rayo vallecano':           'Rayo_Vallecano',
  'rb leipzig':               'RB_Leipzig',
  'real madrid':              'Real_Madrid_CF',
  'real sociedad':            'Real_Sociedad',
  'real valladolid':          'Real_Valladolid',
  'red bull racing':          'Red_Bull_Racing',
  'red bull salzburg':        'FC_Red_Bull_Salzburg',
  'reims':                    'Stade_de_Reims',
  'rennes':                   'Stade_Rennais_F.C.',
  'river plate':              'Club_Atlético_River_Plate',
  'roma':                     'A.S._Roma',
  'rosario central':          'Rosario_Central',
  'saint-etienne':            'AS_Saint-Étienne',
  'sampdoria':                'U.C._Sampdoria',
  'san lorenzo':              'San_Lorenzo_de_Almagro',
  'santos':                   'Santos_FC',
  'sao paulo':                'São_Paulo_FC',
  'sarmiento':                'Club_Atlético_Sarmiento_(Junín)',
  'sevilla':                  'Sevilla_FC',
  'shakhtar donetsk':         'FC_Shakhtar_Donetsk',
  'southampton':              'Southampton_F.C.',
  'sporting cp':              'Sporting_CP',
  'st pauli':                 'FC_St._Pauli',
  'strasbourg':               'RC_Strasbourg_Alsace',
  'talleres':                 'Club_Atlético_Talleres_(Córdoba)',
  'tigre':                    'Club_Atlético_Tigre',
  'torino':                   'Torino_F.C.',
  'tottenham hotspur':        'Tottenham_Hotspur_F.C.',
  'toulouse':                 'Toulouse_FC',
  'udinese':                  'Udinese_Calcio',
  'ufc':                      'Ultimate_Fighting_Championship',
  'union berlin':             '1._FC_Union_Berlin',
  'union santa fe':           'Unión_de_Santa_Fe',
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

function fetchUrl(url) {
  return new Promise((res, rej) => {
    https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Zo2yApp/1.0 (zo2y.com)' } }, r => {
      if ([301,302,303,307,308].includes(r.statusCode) && r.headers.location) return fetchUrl(r.headers.location).then(res).catch(rej);
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, ct: r.headers['content-type']||'', buf: Buffer.concat(c) }));
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

// Wikipedia pageimages API — works for SVG logos too
async function getPageImage(title) {
  const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=500&pilicense=any&format=json&redirects=1`;
  try {
    const r = await fetchUrl(api);
    if (r.status !== 200) return '';
    const j = JSON.parse(r.buf.toString());
    const page = Object.values(j?.query?.pages||{})[0];
    return page?.thumbnail?.source || '';
  } catch { return ''; }
}

async function main() {
  console.log('==============================================');
  console.log('  SPORTS RETRY — Wikipedia pageimages API');
  console.log('==============================================\n');

  // Only process teams that still have no logo
  const { data: teams } = await supabase.from('teams').select('id,name,logo_url');
  const stillMissing = teams.filter(t => !t.logo_url || t.logo_url.trim() === '');
  const toFix = stillMissing.filter(t => RETRY[t.name.toLowerCase().trim()]);
  console.log(`${toFix.length} teams to retry\n`);

  let fixed=0, failed=0;
  for (const team of toFix) {
    const key = team.name.toLowerCase().trim();
    const title = RETRY[key];
    await sleep(400);
    try {
      const imgUrl = await getPageImage(title);
      if (!imgUrl) { console.log(`  ✗ [${team.name}] no image`); failed++; continue; }
      const r = await fetchUrl(imgUrl);
      if (r.status !== 200 || r.buf.length < 500) { console.log(`  ✗ [${team.name}] bad download ${r.status}`); failed++; continue; }
      const ext = guessExt(r.ct, imgUrl);
      const sp = `sports_teams/${safeName(team.name)}${ext}`;
      const mime = r.ct.includes('svg')?'image/svg+xml':r.ct.includes('png')?'image/png':'image/jpeg';
      const { error: upErr } = await supabase.storage.from('brand-logos').upload(sp, r.buf, { contentType: mime, upsert: true });
      if (upErr) { console.log(`  ✗ [${team.name}] upload: ${upErr.message}`); failed++; continue; }
      await supabase.from('teams').update({ logo_url: sp }).eq('id', team.id);
      console.log(`  ✓ [${team.name}] ${r.buf.length}B → ${sp}`);
      fixed++;
    } catch(e) { console.log(`  ✗ [${team.name}] ${e.message}`); failed++; }
  }

  console.log('\n==============================================');
  console.log('  ✅ RETRY DONE');
  console.log(`  ✓ Fixed: ${fixed}  ✗ Failed: ${failed}`);
  console.log('==============================================');
}
main().catch(console.error);
