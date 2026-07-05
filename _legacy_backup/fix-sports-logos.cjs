/**
 * fix-sports-logos.cjs
 * Uses Wikimedia Commons imageinfo API (same proven approach as brands)
 * No TheSportsDB — no rate limit DNS failures.
 */
'use strict';

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUzNjMxOCwiZXhwIjoyMDkxODk2MzE4fQ.6vGwIkgDmsL5cTqKaLbnsbQ4_flcgZ7CqK_dESPgIUU';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team name (lowercase) → exact Wikimedia Commons filename
const TEAM_FILES = {
  // ── NFL ──
  'arizona cardinals':        'Arizona_Cardinals_logo.svg',
  'atlanta falcons':          'Atlanta_Falcons_logo.svg',
  'baltimore ravens':         'Baltimore_Ravens_logo.svg',
  'buffalo bills':            'Buffalo_Bills_logo.svg',
  'carolina panthers':        'Carolina_Panthers_logo.svg',
  'chicago bears':            'Chicago_Bears_logo.svg',
  'cincinnati bengals':       'Cincinnati_Bengals_logo.svg',
  'cleveland browns':         'Cleveland_Browns_logo.svg',
  'dallas cowboys':           'Dallas_Cowboys_logo.svg',
  'denver broncos':           'Denver_Broncos_logo.svg',
  'detroit lions':            'Detroit_Lions_logo.svg',
  'green bay packers':        'Green_Bay_Packers_logo.svg',
  'houston texans':           'Houston_Texans_logo.svg',
  'indianapolis colts':       'Indianapolis_Colts_logo.svg',
  'jacksonville jaguars':     'Jacksonville_Jaguars_logo.svg',
  'kansas city chiefs':       'Kansas_City_Chiefs_logo.svg',
  'las vegas raiders':        'Las_Vegas_Raiders_logo.svg',
  'los angeles chargers':     'Los_Angeles_Chargers_logo.svg',
  'los angeles rams':         'Los_Angeles_Rams_logo.svg',
  'miami dolphins':           'Miami_Dolphins_logo.svg',
  'minnesota vikings':        'Minnesota_Vikings_logo.svg',
  'new england patriots':     'New_England_Patriots_logo.svg',
  'new orleans saints':       'New_Orleans_Saints_logo.svg',
  'new york giants':          'New_York_Giants_logo.svg',
  'new york jets':            'New_York_Jets_logo.svg',
  'philadelphia eagles':      'Philadelphia_Eagles_logo.svg',
  'pittsburgh steelers':      'Pittsburgh_Steelers_logo.svg',
  'san francisco 49ers':      'San_Francisco_49ers_logo.svg',
  'seattle seahawks':         'Seattle_Seahawks_logo.svg',
  'tampa bay buccaneers':     'Tampa_Bay_Buccaneers_logo.svg',
  'tennessee titans':         'Tennessee_Titans_logo.svg',
  'washington commanders':    'Washington_Commanders_logo.svg',
  // ── NBA ──
  'atlanta hawks':            'Atlanta_Hawks_logo.svg',
  'boston celtics':           'Boston_Celtics_logo.svg',
  'brooklyn nets':            'Brooklyn_Nets_logo.svg',
  'charlotte hornets':        'Charlotte_Hornets_(2014)_logo.svg',
  'chicago bulls':            'Chicago_Bulls_logo.svg',
  'cleveland cavaliers':      'Cleveland_Cavaliers_logo.svg',
  'dallas mavericks':         'Dallas_Mavericks_logo.svg',
  'denver nuggets':           'Denver_Nuggets_logo.svg',
  'detroit pistons':          'Detroit_Pistons_logo.svg',
  'golden state warriors':    'Golden_State_Warriors_logo.svg',
  'houston rockets':          'Houston_Rockets_logo.svg',
  'indiana pacers':           'Indiana_Pacers_logo.svg',
  'los angeles clippers':     'Los_Angeles_Clippers_logo.svg',
  'los angeles lakers':       'Los_Angeles_Lakers_logo.svg',
  'memphis grizzlies':        'Memphis_Grizzlies_logo.svg',
  'miami heat':               'Miami_Heat_logo.svg',
  'milwaukee bucks':          'Milwaukee_Bucks_logo.svg',
  'minnesota timberwolves':   'Minnesota_Timberwolves_logo.svg',
  'new orleans pelicans':     'New_Orleans_Pelicans_logo.svg',
  'new york knicks':          'New_York_Knicks_logo.svg',
  'oklahoma city thunder':    'Oklahoma_City_Thunder_logo.svg',
  'orlando magic':            'Orlando_Magic_logo.svg',
  'philadelphia 76ers':       'Philadelphia_76ers_logo.svg',
  'phoenix suns':             'Phoenix_Suns_logo.svg',
  'portland trail blazers':   'Portland_Trail_Blazers_logo.svg',
  'sacramento kings':         'Sacramento_Kings_logo.svg',
  'san antonio spurs':        'San_Antonio_Spurs_logo.svg',
  'toronto raptors':          'Toronto_Raptors_logo.svg',
  'utah jazz':                'Utah_Jazz_logo.svg',
  'washington wizards':       'Washington_Wizards_logo.svg',
  // ── NHL ──
  'anaheim ducks':            'Anaheim_Ducks_logo.svg',
  'boston bruins':            'Boston_Bruins.svg',
  'buffalo sabres':           'Buffalo_Sabres_Logo.svg',
  'calgary flames':           'Calgary_Flames_logo.svg',
  'carolina hurricanes':      'Carolina_Hurricanes_logo.svg',
  'colorado avalanche':       'Colorado_Avalanche_Logo.svg',
  'columbus blue jackets':    'Columbus_Blue_Jackets_Logo.svg',
  'dallas stars':             'Dallas_Stars_logo.svg',
  'detroit red wings':        'Detroit_Red_Wings_logo.svg',
  'edmonton oilers':          'Edmonton_Oilers_(NHL)_logo.svg',
  'florida panthers':         'Florida_Panthers_logo.svg',
  'los angeles kings':        'Los_Angeles_Kings_logo.svg',
  'minnesota wild':           'Minnesota_Wild_logo.svg',
  'montreal canadiens':       'Montreal_Canadiens.svg',
  'nashville predators':      'Nashville_Predators_Logo.svg',
  'new jersey devils':        'New_Jersey_Devils_logo.svg',
  'new york islanders':       'New_York_Islanders_Logo.svg',
  'new york rangers':         'New_York_Rangers.svg',
  'ottawa senators':          'Ottawa_Senators_logo.svg',
  'philadelphia flyers':      'Philadelphia_Flyers_logo.svg',
  'pittsburgh penguins':      'Pittsburgh_Penguins_logo.svg',
  'san jose sharks':          'San_Jose_Sharks_logo.svg',
  'seattle kraken':           'Seattle_Kraken_official_logo.svg',
  'st louis blues':           'St._Louis_Blues_logo.svg',
  'tampa bay lightning':      'Tampa_Bay_Lightning_Logo.svg',
  'toronto maple leafs':      'Toronto_Maple_Leafs_logo.svg',
  'utah hockey club':         'Utah_Hockey_Club_logo.svg',
  'vancouver canucks':        'Vancouver_Canucks_logo.svg',
  'vegas golden knights':     'Vegas_Golden_Knights_logo.svg',
  'washington capitals':      'Washington_Capitals_logo.svg',
  'winnipeg jets':            'Winnipeg_Jets_Logo_2011.svg',
  // ── MLB ──
  'arizona diamondbacks':     'Arizona_Diamondbacks_logo.svg',
  'atlanta braves':           'Atlanta_Braves_logo.svg',
  'baltimore orioles':        'Baltimore_Orioles_logo.svg',
  'boston red sox':           'Boston_Red_Sox.svg',
  'chicago cubs':             'Chicago_Cubs_logo.svg',
  'chicago white sox':        'Chicago_White_Sox_logo.svg',
  'cincinnati reds':          'Cincinnati_Reds_logo.svg',
  'cleveland guardians':      'Cleveland_Guardians_logo.svg',
  'colorado rockies':         'Colorado_Rockies_logo.svg',
  'detroit tigers':           'Detroit_Tigers_logo.svg',
  'houston astros':           'Houston_Astros_logo.svg',
  'kansas city royals':       'Kansas_City_Royals_logo.svg',
  'los angeles angels':       'Los_Angeles_Angels_of_Anaheim_logo.svg',
  'los angeles dodgers':      'Los_Angeles_Dodgers_logo.svg',
  'miami marlins':            'Miami_Marlins_logo.svg',
  'milwaukee brewers':        'Milwaukee_Brewers_logo.svg',
  'minnesota twins':          'Minnesota_Twins_logo.svg',
  'new york mets':            'New_York_Mets_logo.svg',
  'new york yankees':         'New_York_Yankees_logo.svg',
  'oakland athletics':        'Oakland_Athletics_logo.svg',
  'philadelphia phillies':    'Philadelphia_Phillies_logo.svg',
  'pittsburgh pirates':       'Pittsburgh_Pirates_logo.svg',
  'san diego padres':         'San_Diego_Padres_logo.svg',
  'san francisco giants':     'San_Francisco_Giants_logo.svg',
  'seattle mariners':         'Seattle_Mariners_logo.svg',
  'st louis cardinals':       'St._Louis_Cardinals_logo.svg',
  'tampa bay rays':           'Tampa_Bay_Rays_logo.svg',
  'texas rangers':            'Texas_Rangers_logo.svg',
  'toronto blue jays':        'Toronto_Blue_Jays_logo.svg',
  'washington nationals':     'Washington_Nationals_logo.svg',
  // ── PREMIER LEAGUE ──
  'arsenal':                  'Arsenal_FC.svg',
  'aston villa':              'Aston_Villa_FC_crest_(2016).svg',
  'bournemouth':              'AFC_Bournemouth_(2013).svg',
  'brentford':                'Brentford_FC_crest.svg',
  'brighton and hove albion': 'Brighton_&_Hove_Albion_logo.svg',
  'chelsea':                  'Chelsea_FC.svg',
  'crystal palace':           'Crystal_Palace_FC_logo_(2022).svg',
  'everton':                  'Everton_FC_logo.svg',
  'fulham':                   'Fulham_FC_(shield).svg',
  'ipswich town':             'Ipswich_Town.svg',
  'leicester city':           'Leicester_City_crest.svg',
  'liverpool':                'Liverpool_FC.svg',
  'manchester city':          'Manchester_City_FC_badge.svg',
  'manchester united':        'Manchester_United_FC_crest.svg',
  'newcastle united':         'Newcastle_United_Logo.svg',
  'nottingham forest':        'Nottingham_Forest_logo.svg',
  'southampton':              'Southampton_FC.svg',
  'tottenham hotspur':        'Tottenham_Hotspur.svg',
  'west ham united':          'West_Ham_United_FC_logo.svg',
  'wolverhampton wanderers':  'Wolverhampton_Wanderers.svg',
  // ── LA LIGA ──
  'alaves':                   'Deportivo_Alavés_logo.svg',
  'athletic bilbao':          'Athletic_Club_logo.svg',
  'atletico madrid':          'Atlético_de_Madrid_Crest_2017.svg',
  'barcelona':                'FC_Barcelona_(crest).svg',
  'betis':                    'Real_Betis_logo.svg',
  'real betis':               'Real_Betis_logo.svg',
  'celta vigo':               'Celta_de_Vigo_logo.svg',
  'espanyol':                 'Espanyol_logo.svg',
  'getafe':                   'Getafe_CF_logo.svg',
  'girona':                   'Girona_FC_logo.svg',
  'las palmas':               'UD_Las_Palmas_logo.svg',
  'leganes':                  'CD_Leganés_logo.svg',
  'mallorca':                 'RCD_Mallorca_logo.svg',
  'osasuna':                  'CA_Osasuna_logo.svg',
  'rayo vallecano':           'Rayo_Vallecano_logo.svg',
  'real madrid':              'Real_Madrid_CF.svg',
  'real sociedad':            'Real_Sociedad_logo.svg',
  'real valladolid':          'Real_Valladolid_logo.svg',
  'sevilla':                  'Sevilla_FC_logo.svg',
  'valencia':                 'Valencia_CF.svg',
  'villarreal':               'Villarreal_CF_logo.svg',
  // ── BUNDESLIGA ──
  'bayer leverkusen':         'Bayer_04_Leverkusen_logo.svg',
  'borussia dortmund':        'Borussia_Dortmund_logo.svg',
  'borussia monchengladbach': 'Borussia_Mönchengladbach_logo.svg',
  'eintracht frankfurt':      'Eintracht_Frankfurt_Logo.svg',
  'fc augsburg':              'FC_Augsburg_logo.svg',
  'freiburg':                 'SC_Freiburg_logo.svg',
  'heidenheim':               'FC_Heidenheim_1846_logo.svg',
  'hoffenheim':               'TSG_1899_Hoffenheim_logo.svg',
  'holstein kiel':            'Holstein_Kiel_logo.svg',
  'mainz 05':                 '1._FSV_Mainz_05_logo.svg',
  'rb leipzig':               'RB_Leipzig_2014_logo.svg',
  'st pauli':                 'FC_St._Pauli_logo.svg',
  'union berlin':             '1._FC_Union_Berlin_logo.svg',
  'vfb stuttgart':            'VfB_Stuttgart_1893_logo.svg',
  'vfl bochum':               'VfL_Bochum_logo.svg',
  'wolfsburg':                'VfL_Wolfsburg_logo.svg',
  'werder bremen':            'Werder_Bremen_logo.svg',
  // ── SERIE A ──
  'ac milan':                 'AC_Milan.svg',
  'atalanta':                 'Atalanta_BC_logo.svg',
  'bologna':                  'Bologna_FC_1909_logo.svg',
  'cagliari':                 'Cagliari_Calcio_logo.svg',
  'como':                     'Como_Calcio_logo.svg',
  'empoli':                   'Empoli_FC_logo.svg',
  'fiorentina':               'ACF_Fiorentina.svg',
  'genoa':                    'Genoa_CFC.svg',
  'hellas verona':            'Hellas_Verona_FC.svg',
  'inter milan':              'FC_Internazionale_Milano_2021.svg',
  'juventus':                 'Juventus_FC_2017_icon_(black).svg',
  'lazio':                    'SS_Lazio_Badge_2013.svg',
  'lecce':                    'US_Lecce_logo.svg',
  'monza':                    'AC_Monza_logo.svg',
  'napoli':                   'SSC_Napoli_2007.svg',
  'parma':                    'Parma_Calcio_1913_logo.svg',
  'roma':                     'AS_Roma_logo_(2017).svg',
  'sampdoria':                'UC_Sampdoria_logo.svg',
  'torino':                   'Torino_FC_Logo.svg',
  'udinese':                  'Udinese_Calcio_logo.svg',
  'venezia':                  'Venezia_FC_logo.svg',
  // ── LIGUE 1 ──
  'angers':                   'Angers_SCO_logo.svg',
  'auxerre':                  'AJ_Auxerre_logo.svg',
  'brest':                    'Stade_Brestois_29_logo.svg',
  'le havre':                 'Le_Havre_AC_logo.svg',
  'lens':                     'RC_Lens_logo.svg',
  'lille':                    'LOSC_Lille_logo.svg',
  'lyon':                     'Olympique_Lyonnais.svg',
  'marseille':                'Olympique_de_Marseille.svg',
  'monaco':                   'AS_Monaco_FC.svg',
  'montpellier':              'Montpellier_HSC_logo.svg',
  'nantes':                   'FC_Nantes_(logo).svg',
  'nice':                     'OGC_Nice_logo.svg',
  'paris saint-germain':      'Paris_Saint-Germain_F.C..svg',
  'psg':                      'Paris_Saint-Germain_F.C..svg',
  'reims':                    'Stade_de_Reims_logo.svg',
  'rennes':                   'Stade_Rennais_FC.svg',
  'saint-etienne':            'AS_Saint-Étienne_logo.svg',
  'strasbourg':               'RC_Strasbourg_logo.svg',
  'toulouse':                 'Toulouse_FC_logo.svg',
  // ── UEFA CHAMPIONS LEAGUE / EUROPE ──
  'ajax':                     'Ajax_Amsterdam.svg',
  'celtic':                   'Celtic_FC.svg',
  'club brugge':              'Club_Brugge_logo.svg',
  'fenerbahçe':               'Fenerbahçe_S.K._logo.svg',
  'galatasaray':              'Galatasaray_Sports_Club_Logo.svg',
  'psg':                      'Paris_Saint-Germain_F.C..svg',
  'psv eindhoven':            'PSV_Eindhoven_logo.svg',
  'rangers':                  'Rangers_FC_logo.svg',
  'red bull salzburg':        'FC_Red_Bull_Salzburg_logo.svg',
  'shakhtar donetsk':         'Shakhtar_Donetsk_logo.svg',
  'sporting cp':              'Sporting_CP_logo.svg',
  'young boys':               'BSC_Young_Boys_logo.svg',
  // ── BRAZIL SERIE A ──
  'athletico paranaense':     'Athletico-PR_logo.svg',
  'atletico mineiro':         'Clube_Atletico_Mineiro_logo.svg',
  'atletico goianiense':      'Atlético_Goianiense_logo.svg',
  'bahia':                    'EC_Bahia_logo.svg',
  'botafogo':                 'Botafogo_de_Futebol_e_Regatas_logo.svg',
  'bragantino':               'Red_Bull_Bragantino_logo.svg',
  'corinthians':              'Sport_Club_Corinthians_Paulista_crest.svg',
  'coritiba':                 'Coritiba_Football_Club_crest.svg',
  'cruzeiro':                 'Cruzeiro_Esporte_Clube_logo.svg',
  'cuiaba':                   'Cuiabá_Esporte_Clube_logo.svg',
  'fluminense':               'Fluminense_FC_logo.svg',
  'fortaleza':                'Fortaleza_EC_logo.svg',
  'gremio':                   'Grêmio_Foot-Ball_Porto_Alegrense_logo.svg',
  'internacional':            'Internacional_logo.svg',
  'juventude':                'Esporte_Clube_Juventude_logo.svg',
  'palmeiras':                'Sociedade_Esportiva_Palmeiras_logo.svg',
  'santos':                   'Santos_FC_logo.svg',
  'sao paulo':                'São_Paulo_FC_logo.svg',
  'vasco da gama':            'Vasco_da_Gama_logo.svg',
  // ── ARGENTINA ──
  'argentinos juniors':       'Argentinos_Juniors_logo.svg',
  'atletico tucuman':         'Atletico_Tucuman.svg',
  'banfield':                 'Club_Atletico_Banfield_logo.svg',
  'barracas central':         'Barracas_Central_logo.svg',
  'belgrano':                 'Club_Atletico_Belgrano_logo.svg',
  'boca juniors':             'Boca_Juniors_logo.svg',
  'central cordoba':          'Club_Atletico_Central_Cordoba_logo.svg',
  'defensa y justicia':       'Club_Defensa_y_Justicia_logo.svg',
  'deportivo riestra':        'Club_Deportivo_Riestra_logo.svg',
  'estudiantes':              'Estudiantes_de_La_Plata_logo.svg',
  'gimnasia la plata':        'Club_de_Gimnasia_y_Esgrima_La_Plata_logo.svg',
  'godoy cruz':               'Godoy_Cruz_Antonio_Tomba_logo.svg',
  'huracan':                  'Club_Atletico_Huracan_logo.svg',
  'independiente':            'Club_Atletico_Independiente_logo.svg',
  'independiente rivadavia':  'Club_Independiente_Rivadavia_logo.svg',
  'instituto':                'Instituto_Atlético_Central_Córdoba_logo.svg',
  'lanus':                    'Club_Atletico_Lanus_logo.svg',
  'newells old boys':         'Newells_Old_Boys_logo.svg',
  'platense':                 'Club_Atlético_Platense_logo.svg',
  'racing club':              'Racing_Club_logo.svg',
  'river plate':              'River_Plate_logo.svg',
  'rosario central':          'Rosario_Central_logo.svg',
  'san lorenzo':              'Club_Atletico_San_Lorenzo_logo.svg',
  'sarmiento':                'Club_Atlético_Sarmiento_(Junín)_logo.svg',
  'talleres':                 'Club_Atletico_Talleres_logo.svg',
  'tigre':                    'Club_Atlético_Tigre_logo.svg',
  'union santa fe':           'Unión_de_Santa_Fe_logo.svg',
  'velez sarsfield':          'Club_Atletico_Velez_Sarsfield_logo.svg',
  // ── FORMULA 1 ──
  'alpine':                   'Alpine_F1_Team_logo.svg',
  'aston martin':             'Aston_Martin_Aramco_F1_Team_logo.svg',
  'ferrari':                  'Scuderia_Ferrari_Logo.svg',
  'haas':                     'Haas_F1_Team_logo.svg',
  'kick sauber':              'Kick_Sauber_logo.svg',
  'mclaren':                  'McLaren_Racing_logo.svg',
  'mercedes':                 'Mercedes_AMG_Petronas_F1_Team_logo.svg',
  'rb':                       'Visa_Cash_App_RB_Formula_One_Team_logo.svg',
  'red bull racing':          'Red_Bull_Racing_logo.svg',
  'williams':                 'Williams_Racing_logo.svg',
  // ── MMA / BOXING / COMBAT ──
  'ufc':                      'Ultimate_Fighting_Championship_logo.svg',
  'wba':                      'World_Boxing_Association_logo.svg',
  'wbc':                      'WBC_logo.svg',
  'wbo':                      'World_Boxing_Organization_logo.svg',
  'ibf':                      'International_Boxing_Federation_logo.svg',
  // ── OTHERS ──
  'celtic':                   'Celtic_FC.svg',
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      timeout: 20000,
      headers: { 'User-Agent': 'Zo2yLogoFixer/4.0 (zo2y.com)' }
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location)
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type']||'', buf: Buffer.concat(chunks) }));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeName(n) {
  return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

function guessExt(ct, url='') {
  if (ct.includes('svg')) return '.svg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg')||ct.includes('jpg')) return '.jpg';
  const m = (url||'').match(/\.(svg|png|jpe?g)(\?|$)/i);
  return m ? '.'+m[1].replace('jpeg','jpg') : '.png';
}

async function resolveCommonsUrl(filename) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const r = await fetchUrl(api);
    if (r.status !== 200) return '';
    const json = JSON.parse(r.buf.toString());
    const page = Object.values(json?.query?.pages||{})[0];
    return page?.imageinfo?.[0]?.url || '';
  } catch { return ''; }
}

async function uploadLogo(buffer, storagePath, ct) {
  const mime = ct.includes('svg') ? 'image/svg+xml'
    : ct.includes('png') ? 'image/png'
    : ct.includes('jpeg') ? 'image/jpeg'
    : 'image/png';
  const { error } = await supabase.storage.from('brand-logos').upload(storagePath, buffer, { contentType: mime, upsert: true });
  if (error) throw new Error(error.message);
}

async function main() {
  console.log('==============================================');
  console.log('  SPORTS LOGOS — Wikimedia Commons');
  console.log('==============================================\n');

  const { data: teams, error } = await supabase.from('teams').select('id,name,sport,league,logo_url').order('name');
  if (error) { console.error('Cannot fetch teams:', error.message); return; }

  const missing = teams.filter(t => !t.logo_url || t.logo_url.trim() === '');
  console.log(`${teams.length} total teams, ${missing.length} missing logos\n`);

  let fixed = 0, failed = 0, skipped = 0;

  for (const team of missing) {
    const key = team.name.toLowerCase().trim();
    const filename = TEAM_FILES[key];

    if (!filename) {
      skipped++;
      continue; // silently skip — not all teams are on Wikipedia
    }

    await sleep(200); // polite to Wikimedia API
    const cdnUrl = await resolveCommonsUrl(filename);
    if (!cdnUrl) {
      console.log(`  ✗ [${team.name}] cannot resolve: ${filename}`);
      failed++;
      continue;
    }

    try {
      const resp = await fetchUrl(cdnUrl);
      if (resp.status !== 200 || resp.buf.length < 200) {
        console.log(`  ✗ [${team.name}] bad download ${resp.status} ${resp.buf.length}B`);
        failed++;
        continue;
      }
      const ext = guessExt(resp.ct, cdnUrl);
      const sp = `sports_teams/${safeName(team.name)}${ext}`;
      await uploadLogo(resp.buf, sp, resp.ct);
      const { error: dbErr } = await supabase.from('teams').update({ logo_url: sp }).eq('id', team.id);
      if (dbErr) throw new Error(dbErr.message);
      console.log(`  ✓ [${team.name}] ${resp.buf.length}B → ${sp}`);
      fixed++;
    } catch (e) {
      console.log(`  ✗ [${team.name}] — ${e.message}`);
      failed++;
    }
  }

  console.log('\n==============================================');
  console.log('  ✅ SPORTS LOGOS DONE');
  console.log('==============================================');
  console.log(`  ✓ Fixed:   ${fixed}`);
  console.log(`  ✗ Failed:  ${failed}`);
  console.log(`  ? Skipped: ${skipped} (no Wikipedia file mapped)`);
  console.log('\n  Refresh your site to see the updated logos!');
  console.log('==============================================');
}

main().catch(console.error);
