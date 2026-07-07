(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const FALLBACK_BADGE = '/file.svg';
  const LOCAL_MANIFEST_URL = '/assets/sports-badges/local-manifest.json';
  const LOGO_MAPPING_URL = '/assets/logos/logo-mapping.json';
  const LOGO_CACHE_BUST = '20260626a';

  const BADGE_OVERRIDES = {
    'atletico madrid': '/assets/logos/football/spanish-la-liga/atleticomadrid.png',
    'psg': '/assets/logos/football/french-ligue-1/psg.png',
    'paris saint germain': '/assets/logos/football/french-ligue-1/psg.png',
    'sao paulo': '/assets/logos/football/brazilian-serie-a/saopaulo.png',
    'al hilal': '/assets/logos/football/saudi-pro-league/alhilal.png',
    'al-hilal': '/assets/logos/football/saudi-pro-league/alhilal.png',
    'al nassr': '/assets/logos/football/saudi-pro-league/alnassr.png',
    'al ahly': '/assets/logos/football/egyptian-premier-league/alahly.png',

    'ferrari': '/assets/logos/f1/ferrari.png',
    'scuderia ferrari hp': '/assets/logos/f1/ferrari.png',
    'red bull racing': '/assets/logos/f1/redbullracing.png',
    'oracle red bull racing': '/assets/logos/f1/redbullracing.png',
    'mercedes': '/assets/logos/f1/mercedes.png',
    'mercedes-amg petronas formula one team': '/assets/logos/f1/mercedes.png',
    'mclaren': '/assets/logos/f1/mclaren.png',
    'mclaren formula 1 team': '/assets/logos/f1/mclaren.png',
    'aston martin': '/assets/logos/f1/astonmartin.png',
    'aston martin aramco formula one team': '/assets/logos/f1/astonmartin.png',
    'alpine': '/assets/logos/f1/alpine.png',
    'bwt alpine formula one team': '/assets/logos/f1/alpine.png',
    'williams': '/assets/logos/f1/williams.png',
    'williams racing': '/assets/logos/f1/williams.png',
    'rb': '/assets/logos/f1/rb.png',
    'racing bulls': '/assets/logos/f1/rb.png',
    'visa cash app rb': '/assets/logos/f1/rb.png',
    'visa cash app racing bulls': '/assets/logos/f1/rb.png',
    'kick sauber': '/assets/logos/f1/kicksauber.png',
    'stake f1 team kick sauber': '/assets/logos/f1/kicksauber.png',
    'haas': '/assets/logos/f1/haas.png',
    'moneygram haas f1 team': '/assets/logos/f1/haas.png',
    'audi': '/assets/logos/f1/audirevolutf1team.png',
    'audi revolut f1 team': '/assets/logos/f1/audirevolutf1team.png',
    'cadillac': '/assets/logos/f1/cadillacformula1team.png',
    'cadillac formula 1 team': '/assets/logos/f1/cadillacformula1team.png',

    'argentina': '/assets/logos/football/national-teams/ar.png',
    'brazil': '/assets/logos/football/national-teams/br.png',
    'france': '/assets/logos/football/national-teams/fr.png',
    'germany': '/assets/logos/football/national-teams/de.svg',
    'spain': '/assets/logos/football/national-teams/es.png',
    'england': '/assets/logos/football/national-teams/gb-eng.png',
    'portugal': '/assets/logos/football/national-teams/pt.png',
    'netherlands': '/assets/logos/football/national-teams/nl.png',
    'italy': '/assets/logos/football/national-teams/it.png',
    'belgium': '/assets/logos/football/national-teams/be.png',
    'croatia': '/assets/logos/football/national-teams/hr.png',
    'morocco': '/assets/logos/football/national-teams/ma.png',
    'japan': '/assets/logos/football/national-teams/jp.png',
    'south korea': '/assets/logos/football/national-teams/kr.png',
    'australia': '/assets/logos/football/national-teams/au.svg',
    'usa': '/assets/logos/football/national-teams/us.png',
    'united states': '/assets/logos/football/national-teams/us.png',
    'mexico': '/assets/logos/football/national-teams/mx.png',
    'canada': '/assets/logos/football/national-teams/ca.png',
    'colombia': '/assets/logos/football/national-teams/co.png',
    'uruguay': '/assets/logos/football/national-teams/uy.png',
    'ecuador': '/assets/logos/football/national-teams/ec.png',
    'senegal': '/assets/logos/football/national-teams/sn.png',
    'ghana': '/assets/logos/football/national-teams/gh.png',
    'cameroon': '/assets/logos/football/national-teams/cm.png',
    'nigeria': '/assets/logos/football/national-teams/ng.svg',
    'tunisia': '/assets/logos/football/national-teams/tn.png',
    'egypt': '/assets/logos/football/national-teams/eg.png',
    'algeria': '/assets/logos/football/national-teams/dz.png',
    'iran': '/assets/logos/football/national-teams/ir.png',
    'saudi arabia': '/assets/logos/football/national-teams/sa.svg',
    'qatar': '/assets/logos/football/national-teams/qa.png',
    'uae': '/assets/logos/football/national-teams/ae.png',
    'jamaica': '/assets/logos/football/national-teams/jm.png',
    'costa rica': '/assets/logos/football/national-teams/cr.png',
    'panama': '/assets/logos/football/national-teams/pa.png',
    'honduras': '/assets/logos/football/national-teams/hn.png',
    'paraguay': '/assets/logos/football/national-teams/py.png',
    'peru': '/assets/logos/football/national-teams/pe.png',
    'bolivia': '/assets/logos/football/national-teams/bo.png',
    'venezuela': '/assets/logos/football/national-teams/ve.png',
    'serbia': '/assets/logos/football/national-teams/rs.png',
    'poland': '/assets/logos/football/national-teams/pl.png',
    'switzerland': '/assets/logos/football/national-teams/ch.png',
    'austria': '/assets/logos/football/national-teams/at.png',
    'czech republic': '/assets/logos/football/national-teams/cz.png',
    'scotland': '/assets/logos/football/national-teams/gb-sct.png',
    'wales': '/assets/logos/football/national-teams/gb-wls.png',
    'ireland': '/assets/logos/football/national-teams/ie.png',
    'ukraine': '/assets/logos/football/national-teams/ua.png',
    'denmark': '/assets/logos/football/national-teams/dk.png',
    'sweden': '/assets/logos/football/national-teams/se.svg',
    'norway': '/assets/logos/football/national-teams/no.png',
    'finland': '/assets/logos/football/national-teams/fi.png',
    'iceland': '/assets/logos/football/national-teams/is.svg',
    'turkey': '/assets/logos/football/national-teams/tr.png',
    'greece': '/assets/logos/football/national-teams/gr.png',
    'romania': '/assets/logos/football/national-teams/ro.png',
    'hungary': '/assets/logos/football/national-teams/hu.png',
    'china': '/assets/logos/football/national-teams/cn.png',
    'india': '/assets/logos/football/national-teams/in.png',
    'indonesia': '/assets/logos/football/national-teams/id.png',
    'thailand': '/assets/logos/football/national-teams/th.png',
    'vietnam': '/assets/logos/football/national-teams/vn.png',
    'new zealand': '/assets/logos/football/national-teams/nz.svg',
    'south africa': '/assets/logos/football/national-teams/za.png',
    'ivory coast': '/assets/logos/football/national-teams/ci.png',
    'cote d\'ivoire': '/assets/logos/football/national-teams/ci.png',
    'mali': '/assets/logos/football/national-teams/ml.png',
    'burkina faso': '/assets/logos/football/national-teams/bf.png',
    'dr congo': '/assets/logos/football/national-teams/cd.png',
    'congo dr': '/assets/logos/football/national-teams/cd.png',
    'uzbekistan': '/assets/logos/football/national-teams/uz.png',
    'north korea': '/assets/logos/football/national-teams/kp.png',
    'georgia': '/assets/logos/football/national-teams/ge.png',
    'albania': '/assets/logos/football/national-teams/al.png',
    'tanzania': '/assets/logos/football/national-teams/tz.png',
    'jordan': '/assets/logos/football/national-teams/jo.png',
    'iraq': '/assets/logos/football/national-teams/iq.svg'
  };

  const POPULAR_TEAMS = new Set([
    'real madrid', 'barcelona', 'liverpool', 'manchester city', 'manchester united',
    'arsenal', 'chelsea', 'bayern munich', 'borussia dortmund', 'paris saint germain',
    'inter milan', 'ac milan', 'juventus', 'napoli', 'atletico madrid',
    'tottenham hotspur', 'newcastle united', 'aston villa', 'west ham united',
    'ajax', 'psv eindhoven', 'feyenoord', 'benfica', 'fc porto', 'sporting cp',
    'celtic', 'galatasaray', 'club brugge', 'shakhtar donetsk', 'red bull salzburg',
    'los angeles lakers', 'boston celtics', 'golden state warriors', 'chicago bulls',
    'miami heat', 'milwaukee bucks', 'new york knicks', 'phoenix suns',
    'oklahoma city thunder', 'san antonio spurs', 'denver nuggets', 'dallas mavericks',
    'philadelphia 76ers', 'cleveland cavaliers', 'brooklyn nets', 'atlanta hawks',
    'toronto raptors', 'indiana pacers', 'memphis grizzlies', 'new orleans pelicans',
    'sacramento kings', 'orlando magic', 'detroit pistons', 'houston rockets',
    'charlotte hornets', 'washington wizards', 'utah jazz', 'minnesota timberwolves',
    'portland trail blazers', 'la clippers', 'kansas city chiefs', 'dallas cowboys',
    'san francisco 49ers', 'philadelphia eagles', 'buffalo bills', 'green bay packers',
    'baltimore ravens', 'detroit lions', 'los angeles rams', 'cincinnati bengals',
    'miami dolphins', 'new york jets', 'new york giants', 'las vegas raiders',
    'seattle seahawks', 'pittsburgh steelers', 'new england patriots', 'denver broncos',
    'minnesota vikings', 'chicago bears', 'cleveland browns', 'indianapolis colts',
    'arizona cardinals', 'atlanta falcons', 'carolina panthers', 'houston texans',
    'jacksonville jaguars', 'los angeles chargers', 'new orleans saints',
    'tampa bay buccaneers', 'tennessee titans', 'washington commanders',
    'ferrari', 'mercedes', 'red bull racing', 'mclaren', 'aston martin',
    'alpine', 'williams', 'haas', 'rb', 'kick sauber', 'audi',
    'cadillac formula 1 team', 'new york yankees', 'los angeles dodgers',
    'boston red sox', 'chicago cubs', 'houston astros', 'atlanta braves',
    'new york mets', 'san francisco giants', 'st louis cardinals',
    'philadelphia phillies', 'toronto blue jays', 'seattle mariners',
    'milwaukee brewers', 'san diego padres', 'arizona diamondbacks',
    'baltimore orioles', 'tampa bay rays', 'texas rangers', 'cleveland guardians',
    'minnesota twins', 'cincinnati reds', 'kansas city royals', 'detroit tigers',
    'chicago white sox', 'colorado rockies', 'los angeles angels', 'miami marlins',
    'pittsburgh pirates', 'oakland athletics', 'washington nationals',
    'toronto maple leafs', 'montreal canadiens', 'boston bruins', 'edmonton oilers',
    'vegas golden knights', 'colorado avalanche', 'new york rangers',
    'pittsburgh penguins', 'tampa bay lightning', 'carolina hurricanes',
    'florida panthers', 'dallas stars', 'winnipeg jets', 'vancouver canucks',
    'calgary flames', 'los angeles kings', 'anaheim ducks', 'san jose sharks',
    'seattle kraken', 'detroit red wings', 'new jersey devils', 'new york islanders',
    'ottawa senators', 'philadelphia flyers', 'columbus blue jackets',
    'nashville predators', 'minnesota wild', 'st louis blues', 'buffalo sabres',
    'washington capitals', 'chicago blackhawks', 'utah hockey club',
    'ufc', 'flamengo', 'boca juniors', 'river plate', 'al ahly', 'al hilal', 'al nassr',
    'argentina', 'brazil', 'france', 'germany', 'spain', 'england', 'portugal',
    'netherlands', 'italy', 'belgium', 'croatia', 'morocco', 'japan', 'south korea',
    'usa', 'mexico', 'canada', 'colombia', 'uruguay', 'ecuador', 'senegal', 'ghana',
    'cameroon', 'nigeria', 'tunisia', 'egypt', 'algeria', 'iran', 'saudi arabia',
    'qatar', 'jamaica', 'costa rica', 'panama', 'serbia', 'poland', 'switzerland',
    'austria', 'denmark', 'sweden', 'norway', 'turkey', 'greece', 'romania', 'hungary',
    'australia', 'new zealand', 'south africa', 'scotland', 'wales', 'ukraine',
    'paraguay', 'peru', 'bolivia', 'venezuela', 'honduras', 'iceland', 'finland'
  ]);

  const SPORT_PRIORITY = {
    'football': 1, 'soccer': 1, 'motorsport': 2, 'mma': 3, 'basketball': 4,
    'american football': 5, 'baseball': 6, 'ice hockey': 7, 'hockey': 7,
    'rugby': 8, 'cricket': 9, 'boxing': 10, 'kickboxing': 11, 'other': 12
  };

  const LEAGUE_ALIASES = {
    'premier league': 'english premier league',
    'epl': 'english premier league',
    'la liga': 'spanish la liga',
    'bundesliga': 'german bundesliga',
    'serie a': 'italian serie a',
    'ligue 1': 'french ligue 1',
    'brasileirao': 'brazilian serie a',
    'brazilian serie a': 'brazilian serie a',
    'argentina primera division': 'argentina primera division',
    'argentinian primera': 'argentina primera division',
    'egyptian premier league': 'egyptian premier league',
    'saudi pro league': 'saudi pro league',
    'saudi league': 'saudi pro league',
    'champions league': 'uefa champions league',
    'ucl': 'uefa champions league',
    'nba': 'nba',
    'nfl': 'nfl',
    'mlb': 'mlb',
    'nhl': 'nhl',
    'formula 1': 'formula 1',
    'f1': 'formula 1',
    'world cup': 'fifa world cup',
    'fifa world cup': 'fifa world cup',
    'fifa': 'fifa world cup',
    'world cup 2026': 'fifa world cup',
    'wc': 'fifa world cup',
    'national team': 'national team',
    'national football team': 'national team',
    'international': 'national team'
  };

  const COUNTRY_ALIASES = {
    'england': 'england', 'uk': 'england', 'britain': 'england',
    'spain': 'spain',
    'germany': 'germany',
    'italy': 'italy',
    'france': 'france',
    'brazil': 'brazil',
    'argentina': 'argentina',
    'egypt': 'egypt',
    'saudi arabia': 'saudi arabia', 'saudi': 'saudi arabia',
    'usa': 'usa', 'united states': 'usa', 'america': 'usa',
    'canada': 'canada',
    'austria': 'austria',
    'mexico': 'mexico',
    'panama': 'panama',
    'puerto rico': 'puerto rico',
    'netherlands': 'netherlands', 'holland': 'netherlands',
    'portugal': 'portugal',
    'japan': 'japan',
    'singapore': 'singapore',
    'belgium': 'belgium',
    'croatia': 'croatia',
    'morocco': 'morocco',
    'south korea': 'south korea', 'korea': 'south korea',
    'colombia': 'colombia',
    'uruguay': 'uruguay',
    'ecuador': 'ecuador',
    'senegal': 'senegal',
    'ghana': 'ghana',
    'cameroon': 'cameroon',
    'nigeria': 'nigeria',
    'tunisia': 'tunisia',
    'algeria': 'algeria',
    'iran': 'iran',
    'qatar': 'qatar',
    'uae': 'uae', 'united arab emirates': 'uae',
    'jamaica': 'jamaica',
    'costa rica': 'costa rica',
    'honduras': 'honduras',
    'paraguay': 'paraguay',
    'peru': 'peru',
    'bolivia': 'bolivia',
    'venezuela': 'venezuela',
    'serbia': 'serbia',
    'poland': 'poland',
    'switzerland': 'switzerland',
    'denmark': 'denmark',
    'sweden': 'sweden',
    'norway': 'norway',
    'finland': 'finland',
    'iceland': 'iceland',
    'turkey': 'turkey', 'türkiye': 'turkey',
    'greece': 'greece',
    'romania': 'romania',
    'hungary': 'hungary',
    'china': 'china',
    'india': 'india',
    'indonesia': 'indonesia',
    'thailand': 'thailand',
    'vietnam': 'vietnam',
    'new zealand': 'new zealand',
    'south africa': 'south africa',
    'scotland': 'scotland',
    'wales': 'wales',
    'ukraine': 'ukraine'
  };

  const grid = document.getElementById('sportsGrid');
  const searchInput = document.getElementById('sportsSearch');
  const searchBtn = document.getElementById('sportsSearchBtn');
  const filterBtn = document.getElementById('sportsFilterBtn');
  const filterModal = document.getElementById('sportsFilterModal');
  const filterClose = document.getElementById('sportsFilterClose');
  const filterSport = document.getElementById('filterSport');
  const filterLeague = document.getElementById('filterLeague');
  const countText = document.getElementById('sportsCount');
  const titleEl = document.getElementById('sportsTitle');
  const subEl = document.getElementById('sportsSubtitle');
  const loadingEl = document.getElementById('sportsLoading');
  const emptyEl = document.getElementById('sportsEmpty');

  let supabaseClient = null;
  let currentUser = null;
  let allTeams = [];
  let localBadgeMap = {};
  let localBadgeMapLower = {};
  let logoMapping = {};
  let logoMappingLower = {};
  let favorites = new Set();

  function normalize(v) {
    return String(v || '').toLowerCase().trim();
  }

  function escapeHtml(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function resolveLeague(value) {
    const n = normalize(value);
    return LEAGUE_ALIASES[n] || n;
  }

  function resolveCountry(value) {
    const n = normalize(value);
    if (COUNTRY_ALIASES[n]) return COUNTRY_ALIASES[n];
    return n;
  }

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  async function loadSession() {
    const client = ensureSupabase();
    if (!client?.auth?.getSession) return null;
    try {
      const { data } = await client.auth.getSession();
      currentUser = data?.session?.user || null;
      return currentUser;
    } catch (_) { return null; }
  }

  async function loadLocalManifest() {
    try {
      const [manifestRes, mappingRes] = await Promise.all([
        fetch(LOCAL_MANIFEST_URL, { cache: 'force-cache' }),
        fetch(LOGO_MAPPING_URL, { cache: 'force-cache' })
      ]);
      if (manifestRes.ok) {
        localBadgeMap = await manifestRes.json();
        Object.entries(localBadgeMap).forEach(([name, path]) => {
          localBadgeMapLower[name.toLowerCase()] = path;
        });
      }
      if (mappingRes.ok) {
        logoMapping = await mappingRes.json();
        Object.entries(logoMapping).forEach(([name, path]) => {
          logoMappingLower[name.toLowerCase()] = path;
        });
      }
    } catch (_) {}
  }

  function stripDiacritics(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function slugMatch(s) {
    return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function getBadge(team) {
    const nameKey = normalize(team.name);
    if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
    if (logoMapping[team.name]) return logoMapping[team.name];
    if (logoMappingLower[nameKey]) return logoMappingLower[nameKey];
    if (localBadgeMap[team.name]) return localBadgeMap[team.name];
    if (localBadgeMapLower[nameKey]) return localBadgeMapLower[nameKey];
    const slugged = slugMatch(team.name);
    const exact = Object.keys(logoMappingLower).find(k => slugMatch(k) === slugged);
    if (exact) return logoMappingLower[exact];
    const sorted = Object.keys(localBadgeMapLower).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
      const keySlug = slugMatch(key);
      if (keySlug.length >= 4 && (slugged.includes(keySlug) || keySlug.includes(slugged))) {
        return localBadgeMapLower[key];
      }
    }
    if (team.logo_url && team.logo_url !== '/file.svg') return team.logo_url;
    return FALLBACK_BADGE;
  }

  async function loadFavorites() {
    const client = ensureSupabase();
    if (!client || !currentUser) return;
    try {
      const { data: rows } = await client
        .from('list_items')
        .select('item_id')
        .eq('user_id', currentUser.id)
        .eq('media_type', 'sports')
        .eq('list_type', 'favorites');
      favorites = new Set((rows || []).map(r => String(r.item_id)));
    } catch (_) {}
  }

   async function loadTeams() {
     console.log('[Sports Page] Starting to load teams...');
     const client = ensureSupabase();
     if (!client) {
       console.log('[Sports Page] No Supabase client available');
       return [];
     }
     try {
       console.log('[Sports Page] Querying teams from Supabase...');
       const { data, error, count } = await client
         .from('teams')
         .select('id,name,sport,league,stadium,logo_url', { count: 'exact' })
         .order('name')
         .limit(5000);
       if (error) {
         console.error('[Sports Page] Supabase error:', error);
         return [];
       }
       console.log(`[Sports Page] Received ${data?.length || 0} teams from Supabase`);
       const teams = (data || []).map(row => ({
         id: String(row.id || '').trim(),
         name: String(row.name || '').trim(),
         sport: String(row.sport || '').trim(),
         league: String(row.league || '').trim(),
         stadium: String(row.stadium || '').trim(),
         logo_url: String(row.logo_url || '').trim()
        })).filter(t => t.name);
        const nameMap = new Map();
        teams.forEach(t => {
          const key = normalize(t.name) + '|' + normalize(t.league);
          const existing = nameMap.get(key);
          if (!existing || t.id.length > existing.id.length || (t.logo_url && !existing.logo_url)) {
            nameMap.set(key, t);
          }
        });
        const deduped = [...nameMap.values()];
        console.log(`[Sports Page] Loaded ${deduped.length} teams after filtering and dedup`);
        return deduped;
     } catch (err) {
       console.error('[Sports Page] Load error:', err);
       return [];
     }
   }


  function scoreTeam(team) {
    const nameNorm = normalize(team.name);
    const sportNorm = normalize(team.sport);
    let score = 0;
    if (POPULAR_TEAMS.has(nameNorm)) score += 2000;
    const sportPrio = SPORT_PRIORITY[sportNorm] || 12;
    score += (13 - sportPrio) * 100;
    return score;
  }

  function sortTeams(teams) {
    return [...teams].sort((a, b) => {
      const scoreA = scoreTeam(a);
      const scoreB = scoreTeam(b);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  }

  async function toggleFavorite(team) {
    const client = ensureSupabase();
    if (!client || !currentUser) {
      showToast('Sign in to save teams.', true);
      return;
    }
    try {
      if (favorites.has(team.id)) {
        await client.from('list_items').delete()
          .eq('user_id', currentUser.id).eq('item_id', team.id)
          .eq('media_type', 'sports').eq('list_type', 'favorites');
        favorites.delete(team.id);
        showToast('Removed from favorites.');
      } else {
        await client.from('teams').upsert({
          id: team.id, name: team.name, sport: team.sport || null,
          league: team.league || null, logo_url: getBadge(team),
          stadium: team.stadium || null
        }, { onConflict: 'id' });
        await client.from('list_items').upsert(
          { user_id: currentUser.id, media_type: 'sports', item_id: team.id, list_type: 'favorites' },
          { onConflict: 'user_id,media_type,item_id,list_type,list_id' }
        );
        favorites.add(team.id);
        showToast('Team saved to your profile.');
      }
      syncSaveButtons();
    } catch (_) {
      showToast('Unable to save team.', true);
    }
  }

  function syncSaveButtons() {
    document.querySelectorAll('.card[data-team-id]').forEach(card => {
      const id = card.dataset.teamId;
      const btn = card.querySelector('.card-save-btn');
      if (btn) {
        const saved = favorites.has(id);
        btn.classList.toggle('saved', saved);
        btn.innerHTML = saved ? '<i class="fas fa-check"></i>' : '<i class="fas fa-heart"></i>';
      }
    });
  }

  function showToast(msg, isError) {
    const el = document.getElementById('sportsToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function createCard(team) {
    const badge = getBadge(team);
    const badgeUrl = badge.includes('?') ? badge : `${badge}?v=${LOGO_CACHE_BUST}`;
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.teamId = team.id;
    card.dataset.itemId = team.id;
    card.dataset.href = `team.html?id=${encodeURIComponent(team.id)}&team=${encodeURIComponent(team.name)}`;
    card.dataset.mediaType = 'sports';
    card.dataset.title = team.name;
    card.dataset.subtitle = team.league || 'Sports';
    card.dataset.image = badge;
    card.dataset.listImage = badge;

    const href = card.dataset.href;
    const title = team.name;
    const subtitle = team.league || 'Sports';
    const extra = team.sport ? team.sport.toLowerCase() : ' ';

    card.innerHTML = `
      <div class="card-media card-media--light">
        <img
          src="${escapeHtml(badgeUrl)}"
          data-fallback-image="${FALLBACK_BADGE}"
          alt="${escapeHtml(title)} badge"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null;this.src='${FALLBACK_BADGE}';"
        />
      </div>
      <div class="card-meta">
        <div class="card-meta-header">
          <span class="card-type"><i class="fa-solid fa-futbol"></i> Sports</span>
          <div class="card-menu-wrap">
            <button class="card-menu-btn" type="button" aria-label="Add to lists"><i class="fas fa-ellipsis-v"></i></button>
          </div>
        </div>
        <div class="card-meta-top">
          <p class="card-name">${escapeHtml(title)}</p>
        </div>
        <p class="card-sub">${escapeHtml(subtitle)}</p>
        <p class="card-extra">${escapeHtml(extra)}</p>
      </div>
    `;

    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn && typeof window.openIndexStyleListMenu === 'function') {
      menuBtn.addEventListener('click', e => {
        e.stopPropagation();
        window.openIndexStyleListMenu(card);
      });
    }

    card.addEventListener('click', e => {
      if (e.target.closest('.card-menu-btn')) return;
      window.location.href = href;
    });

    return card;
  }

  function getFilteredTeams() {
    const search = String(searchInput?.value || '').trim();
    const sportFilter = String(filterSport?.value || 'all').trim();
    const leagueFilter = String(filterLeague?.value || 'all').trim();

    return allTeams.filter(t => {
      if (sportFilter !== 'all' && normalize(t.sport) !== normalize(sportFilter)) return false;
      if (leagueFilter !== 'all') {
        if (normalize(t.league) !== normalize(leagueFilter)) return false;
      }
      if (search) {
        const q = normalize(search);
        const name = normalize(t.name);
        const league = normalize(t.league);
        const sport = normalize(t.sport);
        const tokens = q.split(/\s+/).filter(Boolean);

        if (tokens.length === 0) return true;

        if (tokens.length === 1) {
          const tok = tokens[0];
          const resolvedLeague = resolveLeague(tok);
          const resolvedCountry = resolveCountry(tok);
          if (name.includes(tok)) return true;
          if (league === resolvedLeague) return true;
          if (sport.includes(tok)) return true;
          if (resolvedCountry && league.includes(resolvedCountry)) return true;
          return false;
        }

        const allInName = tokens.every(tok => name.includes(tok));
        if (allInName) return true;

        const allInLeague = tokens.every(tok => league.includes(tok));
        if (allInLeague) return true;

        const allInSport = tokens.every(tok => sport.includes(tok));
        if (allInSport) return true;

        const resolvedCountry = resolveCountry(q);
        if (resolvedCountry && tokens.every(tok => league.includes(resolvedCountry) || name.includes(tok) || sport.includes(tok))) {
          return true;
        }

        return false;
      }
      return true;
    });
  }

  function renderGrid() {
    if (!grid) return;
    const filtered = getFilteredTeams();
    const sorted = sortTeams(filtered);

    if (loadingEl) loadingEl.classList.remove('visible');
    if (emptyEl) emptyEl.classList.remove('visible');

    grid.innerHTML = '';

    if (countText) countText.textContent = `${sorted.length} teams shown`;
    if (titleEl) titleEl.textContent = 'All teams';
    if (subEl) subEl.textContent = `${sorted.length} teams loaded`;

    if (!sorted.length) {
      if (emptyEl) emptyEl.classList.add('visible');
      return;
    }

    const fragment = document.createDocumentFragment();
    sorted.forEach(t => fragment.appendChild(createCard(t)));
    grid.appendChild(fragment);
  }

  function populateFilters() {
    const sports = new Set();
    const leagues = new Map();
    allTeams.forEach(t => {
      if (t.sport) sports.add(t.sport);
      if (t.league) {
        const norm = normalize(t.league);
        if (!leagues.has(norm)) leagues.set(norm, t.league);
      }
    });
    if (filterSport) {
      filterSport.innerHTML = '<option value="all">All sports</option>' +
        [...sports].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
    if (filterLeague) {
      const leagueOptions = [...leagues.values()].sort();
      filterLeague.innerHTML = '<option value="all">All leagues</option>' +
        leagueOptions.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
  }

  function wireEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchInput._t);
        searchInput._t = setTimeout(renderGrid, 150);
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); renderGrid(); }
      });
    }
    if (searchBtn) searchBtn.addEventListener('click', renderGrid);
    if (filterSport) filterSport.addEventListener('change', renderGrid);
    if (filterLeague) filterLeague.addEventListener('change', renderGrid);

    document.querySelectorAll('#sportsTags .sports-search-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = btn.dataset.q;
        renderGrid();
      });
    });

    if (filterBtn && filterModal) {
      filterBtn.addEventListener('click', () => {
        filterModal.classList.add('show');
        filterModal.setAttribute('aria-hidden', 'false');
      });
    }
    if (filterClose && filterModal) {
      filterClose.addEventListener('click', () => {
        filterModal.classList.remove('show');
        filterModal.setAttribute('aria-hidden', 'true');
      });
    }
    if (filterModal) {
      filterModal.addEventListener('click', e => {
        if (e.target === filterModal) {
          filterModal.classList.remove('show');
          filterModal.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: 'sports',
      getCurrentUser: () => currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList: async ({ itemId, listType, nextSaved }) => {
        const client = ensureSupabase();
        if (!client || !currentUser) return { ok: false };
        try {
          if (nextSaved === false) {
            await client.from('list_items').delete()
              .eq('user_id', currentUser.id).eq('item_id', itemId)
              .eq('media_type', 'sports').eq('list_type', 'favorites');
            favorites.delete(itemId);
            return { ok: true, saved: false };
          }
          const team = allTeams.find(t => t.id === itemId) || {};
          await client.from('teams').upsert({
            id: itemId, name: team.name || '',
            sport: team.sport || null, league: team.league || null,
            logo_url: getBadge(team)
          }, { onConflict: 'id' });
          await client.from('list_items').upsert(
            { user_id: currentUser.id, media_type: 'sports', item_id: itemId, list_type: 'favorites' },
            { onConflict: 'user_id,media_type,item_id,list_type,list_id' }
          );
          favorites.add(itemId);
          syncSaveButtons();
          return { ok: true, saved: true };
        } catch (_) {
          return { ok: false };
        }
      },
      notify: (msg, isError) => showToast(msg, isError)
    });
  }

  const NATIONAL_TEAMS = [
    { id: 'nat-ar', name: 'Argentina', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Monumental', logo_url: '/assets/logos/football/national-teams/ar.png' },
    { id: 'nat-br', name: 'Brazil', sport: 'Football', league: 'FIFA World Cup', stadium: 'Maracanã', logo_url: '/assets/logos/football/national-teams/br.png' },
    { id: 'nat-fr', name: 'France', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade de France', logo_url: '/assets/logos/football/national-teams/fr.png' },
    { id: 'nat-de', name: 'Germany', sport: 'Football', league: 'FIFA World Cup', stadium: 'Signal Iduna Park', logo_url: '/assets/logos/football/national-teams/de.svg' },
    { id: 'nat-es', name: 'Spain', sport: 'Football', league: 'FIFA World Cup', stadium: 'Santiago Bernabéu', logo_url: '/assets/logos/football/national-teams/es.png' },
    { id: 'nat-gb-eng', name: 'England', sport: 'Football', league: 'FIFA World Cup', stadium: 'Wembley Stadium', logo_url: '/assets/logos/football/national-teams/gb-eng.png' },
    { id: 'nat-pt', name: 'Portugal', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estádio da Luz', logo_url: '/assets/logos/football/national-teams/pt.png' },
    { id: 'nat-nl', name: 'Netherlands', sport: 'Football', league: 'FIFA World Cup', stadium: 'Johan Cruyff Arena', logo_url: '/assets/logos/football/national-teams/nl.png' },
    { id: 'nat-it', name: 'Italy', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadio Olimpico', logo_url: '/assets/logos/football/national-teams/it.png' },
    { id: 'nat-be', name: 'Belgium', sport: 'Football', league: 'FIFA World Cup', stadium: 'King Baudouin Stadium', logo_url: '/assets/logos/football/national-teams/be.png' },
    { id: 'nat-hr', name: 'Croatia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadion Maksimir', logo_url: '/assets/logos/football/national-teams/hr.png' },
    { id: 'nat-ma', name: 'Morocco', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade Mohammed V', logo_url: '/assets/logos/football/national-teams/ma.png' },
    { id: 'nat-jp', name: 'Japan', sport: 'Football', league: 'FIFA World Cup', stadium: 'Japan National Stadium', logo_url: '/assets/logos/football/national-teams/jp.png' },
    { id: 'nat-kr', name: 'South Korea', sport: 'Football', league: 'FIFA World Cup', stadium: 'Seoul World Cup Stadium', logo_url: '/assets/logos/football/national-teams/kr.png' },
    { id: 'nat-au', name: 'Australia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadium Australia', logo_url: '/assets/logos/football/national-teams/au.svg' },
    { id: 'nat-us', name: 'USA', sport: 'Football', league: 'FIFA World Cup', stadium: 'MetLife Stadium', logo_url: '/assets/logos/football/national-teams/us.png' },
    { id: 'nat-mx', name: 'Mexico', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Azteca', logo_url: '/assets/logos/football/national-teams/mx.png' },
    { id: 'nat-ca', name: 'Canada', sport: 'Football', league: 'FIFA World Cup', stadium: 'BMO Field', logo_url: '/assets/logos/football/national-teams/ca.png' },
    { id: 'nat-co', name: 'Colombia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Metropolitano', logo_url: '/assets/logos/football/national-teams/co.png' },
    { id: 'nat-uy', name: 'Uruguay', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Centenario', logo_url: '/assets/logos/football/national-teams/uy.png' },
    { id: 'nat-ec', name: 'Ecuador', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Rodrigo Paz Delgado', logo_url: '/assets/logos/football/national-teams/ec.png' },
    { id: 'nat-sn', name: 'Senegal', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade Léopold Sédar Senghor', logo_url: '/assets/logos/football/national-teams/sn.png' },
    { id: 'nat-gh', name: 'Ghana', sport: 'Football', league: 'FIFA World Cup', stadium: 'Accra Sports Stadium', logo_url: '/assets/logos/football/national-teams/gh.png' },
    { id: 'nat-cm', name: 'Cameroon', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade Olembe', logo_url: '/assets/logos/football/national-teams/cm.png' },
    { id: 'nat-ng', name: 'Nigeria', sport: 'Football', league: 'FIFA World Cup', stadium: 'Moshood Abiola National Stadium', logo_url: '/assets/logos/football/national-teams/ng.svg' },
    { id: 'nat-tn', name: 'Tunisia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade Olympique de Radès', logo_url: '/assets/logos/football/national-teams/tn.png' },
    { id: 'nat-eg', name: 'Egypt', sport: 'Football', league: 'FIFA World Cup', stadium: 'Cairo International Stadium', logo_url: '/assets/logos/football/national-teams/eg.png' },
    { id: 'nat-dz', name: 'Algeria', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade 5 Juillet 1962', logo_url: '/assets/logos/football/national-teams/dz.png' },
    { id: 'nat-ir', name: 'Iran', sport: 'Football', league: 'FIFA World Cup', stadium: 'Azadi Stadium', logo_url: '/assets/logos/football/national-teams/ir.png' },
    { id: 'nat-sa', name: 'Saudi Arabia', sport: 'Football', league: 'FIFA World Cup', stadium: 'King Fahd International Stadium', logo_url: '/assets/logos/football/national-teams/sa.svg' },
    { id: 'nat-qa', name: 'Qatar', sport: 'Football', league: 'FIFA World Cup', stadium: 'Lusail Stadium', logo_url: '/assets/logos/football/national-teams/qa.png' },
    { id: 'nat-ae', name: 'UAE', sport: 'Football', league: 'FIFA World Cup', stadium: 'Zayed Sports City', logo_url: '/assets/logos/football/national-teams/ae.png' },
    { id: 'nat-jm', name: 'Jamaica', sport: 'Football', league: 'FIFA World Cup', stadium: 'Independence Park', logo_url: '/assets/logos/football/national-teams/jm.png' },
    { id: 'nat-cr', name: 'Costa Rica', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Nacional', logo_url: '/assets/logos/football/national-teams/cr.png' },
    { id: 'nat-pa', name: 'Panama', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Rommel Fernández', logo_url: '/assets/logos/football/national-teams/pa.png' },
    { id: 'nat-hn', name: 'Honduras', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Nacional Chelato Uclés', logo_url: '/assets/logos/football/national-teams/hn.png' },
    { id: 'nat-py', name: 'Paraguay', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Defensores del Chaco', logo_url: '/assets/logos/football/national-teams/py.png' },
    { id: 'nat-pe', name: 'Peru', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Nacional', logo_url: '/assets/logos/football/national-teams/pe.png' },
    { id: 'nat-bo', name: 'Bolivia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Hernando Siles', logo_url: '/assets/logos/football/national-teams/bo.png' },
    { id: 'nat-ve', name: 'Venezuela', sport: 'Football', league: 'FIFA World Cup', stadium: 'Estadio Monumental', logo_url: '/assets/logos/football/national-teams/ve.png' },
    { id: 'nat-rs', name: 'Serbia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadion Rajko Mitić', logo_url: '/assets/logos/football/national-teams/rs.png' },
    { id: 'nat-pl', name: 'Poland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadion Narodowy', logo_url: '/assets/logos/football/national-teams/pl.png' },
    { id: 'nat-ch', name: 'Switzerland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade de Suisse', logo_url: '/assets/logos/football/national-teams/ch.png' },
    { id: 'nat-at', name: 'Austria', sport: 'Football', league: 'FIFA World Cup', stadium: 'Ernst-Happel-Stadion', logo_url: '/assets/logos/football/national-teams/at.png' },
    { id: 'nat-cz', name: 'Czech Republic', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stadion Letná', logo_url: '/assets/logos/football/national-teams/cz.png' },
    { id: 'nat-dk', name: 'Denmark', sport: 'Football', league: 'FIFA World Cup', stadium: 'Parken Stadium', logo_url: '/assets/logos/football/national-teams/dk.png' },
    { id: 'nat-se', name: 'Sweden', sport: 'Football', league: 'FIFA World Cup', stadium: 'Friends Arena', logo_url: '/assets/logos/football/national-teams/se.svg' },
    { id: 'nat-no', name: 'Norway', sport: 'Football', league: 'FIFA World Cup', stadium: 'Ullevaal Stadion', logo_url: '/assets/logos/football/national-teams/no.png' },
    { id: 'nat-tr', name: 'Turkey', sport: 'Football', league: 'FIFA World Cup', stadium: 'Atatürk Olympic Stadium', logo_url: '/assets/logos/football/national-teams/tr.png' },
    { id: 'nat-gr', name: 'Greece', sport: 'Football', league: 'FIFA World Cup', stadium: 'Olympic Stadium', logo_url: '/assets/logos/football/national-teams/gr.png' },
    { id: 'nat-ro', name: 'Romania', sport: 'Football', league: 'FIFA World Cup', stadium: 'Arena Națională', logo_url: '/assets/logos/football/national-teams/ro.png' },
    { id: 'nat-hu', name: 'Hungary', sport: 'Football', league: 'FIFA World Cup', stadium: 'Puskás Aréna', logo_url: '/assets/logos/football/national-teams/hu.png' },
    { id: 'nat-fi', name: 'Finland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Olympiastadion', logo_url: '/assets/logos/football/national-teams/fi.png' },
    { id: 'nat-is', name: 'Iceland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Laugardalsvöllur', logo_url: '/assets/logos/football/national-teams/is.svg' },
    { id: 'nat-gb-sct', name: 'Scotland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Hampden Park', logo_url: '/assets/logos/football/national-teams/gb-sct.png' },
    { id: 'nat-gb-wls', name: 'Wales', sport: 'Football', league: 'FIFA World Cup', stadium: 'Cardiff City Stadium', logo_url: '/assets/logos/football/national-teams/gb-wls.png' },
    { id: 'nat-ua', name: 'Ukraine', sport: 'Football', league: 'FIFA World Cup', stadium: 'NSK Olimpiyskiy', logo_url: '/assets/logos/football/national-teams/ua.png' },
    { id: 'nat-ie', name: 'Ireland', sport: 'Football', league: 'FIFA World Cup', stadium: 'Aviva Stadium', logo_url: '/assets/logos/football/national-teams/ie.png' },
    { id: 'nat-cn', name: 'China', sport: 'Football', league: 'FIFA World Cup', stadium: 'Beijing National Stadium', logo_url: '/assets/logos/football/national-teams/cn.png' },
    { id: 'nat-in', name: 'India', sport: 'Football', league: 'FIFA World Cup', stadium: 'Salt Lake Stadium', logo_url: '/assets/logos/football/national-teams/in.png' },
    { id: 'nat-id', name: 'Indonesia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Gelora Bung Karno Stadium', logo_url: '/assets/logos/football/national-teams/id.png' },
    { id: 'nat-th', name: 'Thailand', sport: 'Football', league: 'FIFA World Cup', stadium: 'Rajamangala Stadium', logo_url: '/assets/logos/football/national-teams/th.png' },
    { id: 'nat-vn', name: 'Vietnam', sport: 'Football', league: 'FIFA World Cup', stadium: 'Hàng Đẫy Stadium', logo_url: '/assets/logos/football/national-teams/vn.png' },
    { id: 'nat-nz', name: 'New Zealand', sport: 'Football', league: 'FIFA World Cup', stadium: 'Sky Stadium', logo_url: '/assets/logos/football/national-teams/nz.svg' },
    { id: 'nat-za', name: 'South Africa', sport: 'Football', league: 'FIFA World Cup', stadium: 'FNB Stadium', logo_url: '/assets/logos/football/national-teams/za.png' },
    { id: 'nat-ci', name: 'Ivory Coast', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade Félix Houphouët-Boigny', logo_url: '/assets/logos/football/national-teams/ci.png' },
    { id: 'nat-ml', name: 'Mali', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade du 26 Mars', logo_url: '/assets/logos/football/national-teams/ml.png' },
    { id: 'nat-bf', name: 'Burkina Faso', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade du 4 Août', logo_url: '/assets/logos/football/national-teams/bf.png' },
    { id: 'nat-cd', name: 'DR Congo', sport: 'Football', league: 'FIFA World Cup', stadium: 'Stade des Martyrs', logo_url: '/assets/logos/football/national-teams/cd.png' },
    { id: 'nat-uz', name: 'Uzbekistan', sport: 'Football', league: 'FIFA World Cup', stadium: 'Bunyodkor Stadium', logo_url: '/assets/logos/football/national-teams/uz.png' },
    { id: 'nat-kp', name: 'North Korea', sport: 'Football', league: 'FIFA World Cup', stadium: 'Rungrado 1st of May Stadium', logo_url: '/assets/logos/football/national-teams/kp.png' },
    { id: 'nat-ge', name: 'Georgia', sport: 'Football', league: 'FIFA World Cup', stadium: 'Boris Paichadze Dinamo Arena', logo_url: '/assets/logos/football/national-teams/ge.png' },
    { id: 'nat-al', name: 'Albania', sport: 'Football', league: 'FIFA World Cup', stadium: 'Air Albania Stadium', logo_url: '/assets/logos/football/national-teams/al.png' },
    { id: 'nat-tz', name: 'Tanzania', sport: 'Football', league: 'FIFA World Cup', stadium: 'Benjamin Mkapa Stadium', logo_url: '/assets/logos/football/national-teams/tz.png' },
    { id: 'nat-jo', name: 'Jordan', sport: 'Football', league: 'FIFA World Cup', stadium: 'Amman International Stadium', logo_url: '/assets/logos/football/national-teams/jo.png' },
    { id: 'nat-iq', name: 'Iraq', sport: 'Football', league: 'FIFA World Cup', stadium: 'Basra International Stadium', logo_url: '/assets/logos/football/national-teams/iq.svg' }
  ];

  async function seedNationalTeams(client) {
    if (!client) return;
    try {
      const existing = await client.from('teams').select('id').eq('league', 'FIFA World Cup').limit(1);
      if (existing.data && existing.data.length > 0) return;
      const rows = NATIONAL_TEAMS.map(t => ({
        id: t.id, name: t.name, sport: t.sport, league: t.league,
        stadium: t.stadium, logo_url: t.logo_url
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        await client.from('teams').upsert(chunk, { onConflict: 'id' });
      }
      console.log(`[Sports Page] Seeded ${rows.length} national teams`);
    } catch (err) {
      console.warn('[Sports Page] Could not seed national teams:', err.message);
    }
  }

  async function boot() {
    wireEvents();
    await loadLocalManifest();
    const client = await ensureSupabase();
    await seedNationalTeams(client);
    await loadSession();
    initMenuBridge();
    await loadFavorites();
    allTeams = await loadTeams();
    populateFilters();
    renderGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
