/**
 * fix-sports-final.cjs
 *
 * Uses ESPN's public CDN for US sports (reliable, no API key, no rate limits)
 * Uses Wikipedia page summary thumbnail for soccer teams (actual crest image)
 * No guessing filenames, no TheSportsDB
 */
'use strict';

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ESPN team abbreviations — generates: https://a.espncdn.com/combiner/i?img=/i/teamlogos/{sport}/500/{abbr}.png
const ESPN = {
  nfl: {
    'arizona cardinals': 'ari', 'atlanta falcons': 'atl', 'baltimore ravens': 'bal',
    'buffalo bills': 'buf', 'carolina panthers': 'car', 'chicago bears': 'chi',
    'cincinnati bengals': 'cin', 'cleveland browns': 'cle', 'dallas cowboys': 'dal',
    'denver broncos': 'den', 'detroit lions': 'det', 'green bay packers': 'gb',
    'houston texans': 'hou', 'indianapolis colts': 'ind', 'jacksonville jaguars': 'jax',
    'kansas city chiefs': 'kc', 'las vegas raiders': 'lv', 'los angeles chargers': 'lac',
    'los angeles rams': 'lar', 'miami dolphins': 'mia', 'minnesota vikings': 'min',
    'new england patriots': 'ne', 'new orleans saints': 'no', 'new york giants': 'nyg',
    'new york jets': 'nyj', 'philadelphia eagles': 'phi', 'pittsburgh steelers': 'pit',
    'san francisco 49ers': 'sf', 'seattle seahawks': 'sea', 'tampa bay buccaneers': 'tb',
    'tennessee titans': 'ten', 'washington commanders': 'wsh',
  },
  nba: {
    'atlanta hawks': 'atl', 'boston celtics': 'bos', 'brooklyn nets': 'bkn',
    'charlotte hornets': 'cha', 'chicago bulls': 'chi', 'cleveland cavaliers': 'cle',
    'dallas mavericks': 'dal', 'denver nuggets': 'den', 'detroit pistons': 'det',
    'golden state warriors': 'gs', 'houston rockets': 'hou', 'indiana pacers': 'ind',
    'los angeles clippers': 'lac', 'los angeles lakers': 'lal', 'memphis grizzlies': 'mem',
    'miami heat': 'mia', 'milwaukee bucks': 'mil', 'minnesota timberwolves': 'min',
    'new orleans pelicans': 'no', 'new york knicks': 'ny', 'oklahoma city thunder': 'okc',
    'orlando magic': 'orl', 'philadelphia 76ers': 'phi', 'phoenix suns': 'phx',
    'portland trail blazers': 'por', 'sacramento kings': 'sac', 'san antonio spurs': 'sa',
    'toronto raptors': 'tor', 'utah jazz': 'utah', 'washington wizards': 'wsh',
  },
  nhl: {
    'anaheim ducks': 'ana', 'boston bruins': 'bos', 'buffalo sabres': 'buf',
    'calgary flames': 'cgy', 'carolina hurricanes': 'car', 'chicago blackhawks': 'chi',
    'colorado avalanche': 'col', 'columbus blue jackets': 'cbj', 'dallas stars': 'dal',
    'detroit red wings': 'det', 'edmonton oilers': 'edm', 'florida panthers': 'fla',
    'los angeles kings': 'la', 'minnesota wild': 'min', 'montreal canadiens': 'mtl',
    'nashville predators': 'nsh', 'new jersey devils': 'nj', 'new york islanders': 'nyi',
    'new york rangers': 'nyr', 'ottawa senators': 'ott', 'philadelphia flyers': 'phi',
    'pittsburgh penguins': 'pit', 'san jose sharks': 'sj', 'seattle kraken': 'sea',
    'st louis blues': 'stl', 'tampa bay lightning': 'tb', 'toronto maple leafs': 'tor',
    'utah hockey club': 'uta', 'vancouver canucks': 'van', 'vegas golden knights': 'vgk',
    'washington capitals': 'wsh', 'winnipeg jets': 'wpg',
  },
  mlb: {
    'arizona diamondbacks': 'ari', 'atlanta braves': 'atl', 'baltimore orioles': 'bal',
    'boston red sox': 'bos', 'chicago cubs': 'chc', 'chicago white sox': 'chw',
    'cincinnati reds': 'cin', 'cleveland guardians': 'cle', 'colorado rockies': 'col',
    'detroit tigers': 'det', 'houston astros': 'hou', 'kansas city royals': 'kc',
    'los angeles angels': 'laa', 'los angeles dodgers': 'lad', 'miami marlins': 'mia',
    'milwaukee brewers': 'mil', 'minnesota twins': 'min', 'new york mets': 'nym',
    'new york yankees': 'nyy', 'oakland athletics': 'oak', 'philadelphia phillies': 'phi',
    'pittsburgh pirates': 'pit', 'san diego padres': 'sd', 'san francisco giants': 'sf',
    'seattle mariners': 'sea', 'st louis cardinals': 'stl', 'tampa bay rays': 'tb',
    'texas rangers': 'tex', 'toronto blue jays': 'tor', 'washington nationals': 'wsh',
  },
};

// Soccer teams: Wikipedia page title → fetch thumbnail from summary API
// The summary thumbnail for a club page is always the crest
const WIKI_PAGES = {
  // Premier League
  'arsenal':                  'Arsenal_F.C.',
  'aston villa':              'Aston_Villa_F.C.',
  'bournemouth':              'AFC_Bournemouth',
  'brentford':                'Brentford_F.C.',
  'brighton and hove albion': 'Brighton_&_Hove_Albion_F.C.',
  'chelsea':                  'Chelsea_F.C.',
  'crystal palace':           'Crystal_Palace_F.C.',
  'everton':                  'Everton_F.C.',
  'fulham':                   'Fulham_F.C.',
  'ipswich town':             'Ipswich_Town_F.C.',
  'leicester city':           'Leicester_City_F.C.',
  'liverpool':                'Liverpool_F.C.',
  'manchester city':          'Manchester_City_F.C.',
  'manchester united':        'Manchester_United_F.C.',
  'newcastle united':         'Newcastle_United_F.C.',
  'nottingham forest':        'Nottingham_Forest_F.C.',
  'southampton':              'Southampton_F.C.',
  'tottenham hotspur':        'Tottenham_Hotspur_F.C.',
  'wolverhampton wanderers':  'Wolverhampton_Wanderers_F.C.',
  'west ham united':          'West_Ham_United_F.C.',
  // La Liga
  'alaves':                   'Deportivo_Alavés',
  'barcelona':                'FC_Barcelona',
  'real madrid':              'Real_Madrid_CF',
  'atletico madrid':          'Atlético_Madrid',
  'sevilla':                  'Sevilla_FC',
  'real sociedad':            'Real_Sociedad',
  'real betis':               'Real_Betis',
  'villarreal':               'Villarreal_CF',
  'athletic bilbao':          'Athletic_Club',
  'valencia':                 'Valencia_CF',
  'osasuna':                  'CA_Osasuna',
  'celta vigo':               'Celta_Vigo',
  'getafe':                   'Getafe_CF',
  'rayo vallecano':           'Rayo_Vallecano',
  'girona':                   'Girona_FC',
  'mallorca':                 'RCD_Mallorca',
  'leganes':                  'CD_Leganés',
  'las palmas':               'UD_Las_Palmas',
  'real valladolid':          'Real_Valladolid',
  'espanyol':                 'RCD_Espanyol',
  // Bundesliga
  'bayer leverkusen':         'Bayer_04_Leverkusen',
  'borussia dortmund':        'Borussia_Dortmund',
  'rb leipzig':               'RB_Leipzig',
  'borussia monchengladbach': 'Borussia_Mönchengladbach',
  'eintracht frankfurt':      'Eintracht_Frankfurt',
  'wolfsburg':                'VfL_Wolfsburg',
  'vfb stuttgart':            'VfB_Stuttgart',
  'union berlin':             '1._FC_Union_Berlin',
  'werder bremen':            'Werder_Bremen',
  'hoffenheim':               'TSG_1899_Hoffenheim',
  'fc augsburg':              'FC_Augsburg',
  'freiburg':                 'SC_Freiburg',
  'mainz 05':                 '1._FSV_Mainz_05',
  'heidenheim':               'FC_Heidenheim_1846',
  'st pauli':                 'FC_St._Pauli',
  'vfl bochum':               'VfL_Bochum',
  'holstein kiel':            'Holstein_Kiel',
  // Serie A
  'inter milan':              'Inter_Milan',
  'ac milan':                 'A.C._Milan',
  'juventus':                 'Juventus_F.C.',
  'napoli':                   'S.S.C._Napoli',
  'roma':                     'A.S._Roma',
  'lazio':                    'S.S._Lazio',
  'atalanta':                 'Atalanta_B.C.',
  'fiorentina':               'ACF_Fiorentina',
  'bologna':                  'Bologna_F.C._1909',
  'torino':                   'Torino_F.C.',
  'udinese':                  'Udinese_Calcio',
  'genoa':                    'Genoa_C.F.C.',
  'cagliari':                 'Cagliari_Calcio',
  'lecce':                    'U.S._Lecce',
  'hellas verona':            'Hellas_Verona_F.C.',
  'empoli':                   'Empoli_F.C.',
  'monza':                    'A.C._Monza',
  'parma':                    'Parma_Calcio_1913',
  'sampdoria':                'U.C._Sampdoria',
  'venezia':                  'Venezia_F.C.',
  'como':                     'Como_1907',
  // Ligue 1
  'psg':                      'Paris_Saint-Germain_F.C.',
  'paris saint-germain':      'Paris_Saint-Germain_F.C.',
  'marseille':                'Olympique_de_Marseille',
  'lyon':                     'Olympique_Lyonnais',
  'monaco':                   'AS_Monaco_FC',
  'lille':                    'Lille_OSC',
  'nice':                     'OGC_Nice',
  'lens':                     'RC_Lens',
  'rennes':                   'Stade_Rennais_F.C.',
  'strasbourg':               'RC_Strasbourg_Alsace',
  'toulouse':                 'Toulouse_FC',
  'montpellier':              'Montpellier_HSC',
  'brest':                    'Stade_Brestois_29',
  'nantes':                   'FC_Nantes',
  'reims':                    'Stade_de_Reims',
  'le havre':                 'Le_Havre_AC',
  'saint-etienne':            'AS_Saint-Étienne',
  'angers':                   'Angers_SCO',
  'auxerre':                  'AJ_Auxerre',
  // Champions League / Europe
  'ajax':                     'AFC_Ajax',
  'celtic':                   'Celtic_F.C.',
  'club brugge':              'Club_Brugge_KV',
  'fenerbahçe':               'Fenerbahçe_S.K.',
  'galatasaray':              'Galatasaray_S.K.',
  'psv eindhoven':            'PSV_Eindhoven',
  'red bull salzburg':        'FC_Red_Bull_Salzburg',
  'shakhtar donetsk':         'FC_Shakhtar_Donetsk',
  'sporting cp':              'Sporting_CP',
  'young boys':               'BSC_Young_Boys',
  // Brazil
  'palmeiras':                'Sociedade_Esportiva_Palmeiras',
  'fluminense':               'Fluminense_FC',
  'corinthians':              'Sport_Club_Corinthians_Paulista',
  'atletico mineiro':         'Clube_Atlético_Mineiro',
  'athletico paranaense':     'Club_Athletico_Paranaense',
  'botafogo':                 'Botafogo_de_Futebol_e_Regatas',
  'internacional':            'Sport_Club_Internacional',
  'gremio':                   'Grêmio_Foot-Ball_Porto_Alegrense',
  'cruzeiro':                 'Cruzeiro_Esporte_Clube',
  'sao paulo':                'São_Paulo_FC',
  'vasco da gama':            'Club_de_Regatas_Vasco_da_Gama',
  'santos':                   'Santos_FC',
  'bragantino':               'Red_Bull_Bragantino',
  'bahia':                    'Esporte_Clube_Bahia',
  'fortaleza':                'Fortaleza_Esporte_Clube',
  'atlético goianiense':      'Atlético_Goianiense',
  'atletico goianiense':      'Atlético_Goianiense',
  // Argentina
  'boca juniors':             'Club_Atlético_Boca_Juniors',
  'river plate':              'Club_Atlético_River_Plate',
  'racing club':              'Racing_Club_de_Avellaneda',
  'independiente':            'Club_Atlético_Independiente',
  'san lorenzo':              'San_Lorenzo_de_Almagro',
  'estudiantes':              'Estudiantes_de_La_Plata',
  'belgrano':                 'Club_Atlético_Belgrano',
  'newells old boys':         "Newell's_Old_Boys",
  'rosario central':          'Rosario_Central',
  'huracan':                  'Club_Atlético_Huracán',
  'banfield':                 'Club_Atlético_Banfield',
  'talleres':                 'Club_Atlético_Talleres_(Córdoba)',
  'velez sarsfield':          'Vélez_Sársfield',
  'lanus':                    'Club_Atlético_Lanús',
  'godoy cruz':               'Godoy_Cruz_Antonio_Tomba',
  'gimnasia la plata':        'Club_de_Gimnasia_y_Esgrima_La_Plata',
  'argentinos juniors':       'Argentinos_Juniors',
  'defensa y justicia':       'Club_Defensa_y_Justicia',
  'platense':                 'Club_Atlético_Platense',
  // F1
  'ferrari':                  'Scuderia_Ferrari',
  'red bull racing':          'Red_Bull_Racing',
  'mercedes':                 'Mercedes-AMG_Petronas_Formula_One_Team',
  'mclaren':                  'McLaren_Racing',
  'alpine':                   'Alpine_F1_Team',
  'aston martin':             'Aston_Martin_in_Formula_One',
  'williams':                 'Williams_Racing',
  'haas':                     'Haas_F1_Team',
  // Combat
  'ufc':                      'Ultimate_Fighting_Championship',
  'wba':                      'World_Boxing_Association',
  'wbc':                      'World_Boxing_Council',
  'wbo':                      'World_Boxing_Organization',
  'ibf':                      'International_Boxing_Federation',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      timeout: 20000,
      headers: { 'User-Agent': 'Zo2yApp/1.0 (zo2y.com)' }
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location)
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type']||'', buf: Buffer.concat(chunks) }));
    }).on('error', reject).on('timeout', function(){ this.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function safeName(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
function guessExt(ct, url='') {
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg')||ct.includes('jpg')) return '.jpg';
  const m = (url||'').match(/\.(svg|png|jpe?g)(\?|$)/i);
  return m ? '.'+m[1].replace('jpeg','jpg') : '.png';
}

async function uploadAndUpdate(teamId, teamName, buffer, storagePath, ct) {
  const mime = ct.includes('svg') ? 'image/svg+xml' : ct.includes('png') ? 'image/png' : ct.includes('jpeg') ? 'image/jpeg' : 'image/png';
  const { error: upErr } = await supabase.storage.from('brand-logos').upload(storagePath, buffer, { contentType: mime, upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { error: dbErr } = await supabase.from('teams').update({ logo_url: storagePath }).eq('id', teamId);
  if (dbErr) throw new Error(dbErr.message);
}

// ─── ESPN CDN (no auth, no rate limit) ───────────────────────────────────────
function espnUrl(sport, abbr) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/${sport}/500/${abbr}.png&w=300&h=300&transparent=true`;
}

// ─── Wikipedia summary thumbnail ─────────────────────────────────────────────
async function getWikiThumbnail(pageTitle) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}?redirect=true`;
    const r = await fetchUrl(url);
    if (r.status !== 200) return '';
    const json = JSON.parse(r.buf.toString());
    // Prefer originalimage (higher res), fallback to thumbnail
    return json?.originalimage?.source || json?.thumbnail?.source || '';
  } catch { return ''; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('==============================================');
  console.log('  SPORTS LOGOS — ESPN CDN + Wikipedia');
  console.log('==============================================\n');

  const { data: teams, error } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name');
  if (error) { console.error(error.message); return; }

  const missing = teams.filter(t => !t.logo_url || t.logo_url.trim() === '');
  console.log(`${missing.length} teams missing logos\n`);

  let fixed = 0, failed = 0, skipped = 0;

  for (const team of missing) {
    const key = team.name.toLowerCase().trim();

    // 1. Try ESPN CDN first (US sports — instant, reliable)
    let tried = false;
    for (const [sport, map] of Object.entries(ESPN)) {
      if (map[key]) {
        tried = true;
        try {
          const url = espnUrl(sport, map[key]);
          const r = await fetchUrl(url);
          if (r.status === 200 && r.buf.length > 500) {
            const sp = `sports_teams/${safeName(team.name)}.png`;
            await uploadAndUpdate(team.id, team.name, r.buf, sp, 'image/png');
            console.log(`  ✓ ESPN  [${team.name}] ${r.buf.length}B`);
            fixed++;
          } else {
            throw new Error(`ESPN ${r.status} ${r.buf.length}B`);
          }
        } catch(e) {
          // fall through to Wikipedia
          tried = false;
        }
        break;
      }
    }
    if (tried) continue;

    // 2. Try Wikipedia thumbnail (soccer / F1 / combat sports)
    const wikiPage = WIKI_PAGES[key];
    if (wikiPage) {
      await sleep(300);
      try {
        const imgUrl = await getWikiThumbnail(wikiPage);
        if (!imgUrl) { console.log(`  ✗ Wiki  [${team.name}] no thumbnail`); failed++; continue; }
        const r = await fetchUrl(imgUrl);
        if (r.status !== 200 || r.buf.length < 500) { console.log(`  ✗ Wiki  [${team.name}] bad image ${r.status}`); failed++; continue; }
        const ext = guessExt(r.ct, imgUrl);
        const sp = `sports_teams/${safeName(team.name)}${ext}`;
        await uploadAndUpdate(team.id, team.name, r.buf, sp, r.ct);
        console.log(`  ✓ Wiki  [${team.name}] ${r.buf.length}B → ${sp}`);
        fixed++;
      } catch(e) {
        console.log(`  ✗ Wiki  [${team.name}] ${e.message}`);
        failed++;
      }
      continue;
    }

    // 3. Not mapped
    skipped++;
  }

  console.log('\n==============================================');
  console.log('  ✅ ALL DONE');
  console.log('==============================================');
  console.log(`  ✓ Fixed:   ${fixed}`);
  console.log(`  ✗ Failed:  ${failed}`);
  console.log(`  - Skipped: ${skipped} (obscure teams with no public logo source)`);
  console.log('==============================================');
}

main().catch(console.error);
