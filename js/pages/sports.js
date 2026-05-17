(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();
  const SPORTSDB_PROXY_BASE = String(window.ZO2Y_SPORTSDB_PROXY || '/api/sportsdb').trim() || '/api/sportsdb';
  const SPORTSDB_DIRECT_KEY = String(window.ZO2Y_SPORTSDB_KEY || '3').trim() || '3';
  const SPORTSDB_DIRECT_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_DIRECT_KEY}`;
  const FALLBACK_IMAGE = '/newlogo.webp';
  const FALLBACK_BADGE = '/file.svg';
  const SPORTS_LISTS_ENABLED = window.ZO2Y_SPORTS_LISTS !== false;
  const SPORTS_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
      <rect width='24' height='24' fill='#10224a'/>
    </svg>
  `)}`;
  const SPORTS_FEATURED_CACHE_KEY = 'zo2y_sports_featured_cache_v6';
  const SPORTS_FEATURED_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
  const SPORTS_ASSET_BUCKET_NAME = 'sports-assets';
  const SPORTS_ASSET_MANIFEST_URL = `${SUPABASE_URL}/storage/v1/object/public/${SPORTS_ASSET_BUCKET_NAME}/manifest/sports-assets.json`;
  const SPORTS_ASSET_MANIFEST_CACHE_KEY = 'zo2y_sports_asset_manifest_v4';
  const SPORTS_ASSET_MANIFEST_TTL_MS = 1000 * 60 * 60 * 24 * 7;
  const FALLBACK_LEAGUES = Array.isArray(window.ZO2Y_SPORTS_FALLBACK_LEAGUES) && window.ZO2Y_SPORTS_FALLBACK_LEAGUES.length
    ? window.ZO2Y_SPORTS_FALLBACK_LEAGUES.slice()
    : [
      'English Premier League',
      'Spanish La Liga',
      'German Bundesliga',
      'Italian Serie A',
      'French Ligue 1',
      'UEFA Champions League',
      'CAF Champions League',
      'Copa Libertadores',
      'Saudi Pro League',
      'Major League Soccer',
      'Brazilian Serie A',
      'Argentine Primera Division',
      'NBA',
      'WNBA',
      'EuroLeague',
      'NFL',
      'MLB',
      'NHL',
      'Indian Premier League',
      'Big Bash League',
      'Super Rugby',
      'United Rugby Championship',
      'National Rugby League',
      'AFL',
      'Formula 1',
      'MotoGP'
    ];
  const SHORT_FALLBACK_LEAGUES = [
    'English Premier League',
    'English Championship',
    'Spanish La Liga',
    'Egyptian Premier League',
    'Saudi Pro League',
    'NBA',
    'NFL',
    'MLB',
    'Indian Premier League'
  ];
  const FEATURED_TEAMS_LIMIT = 100;
  const FEATURED_LEAGUES = Array.isArray(window.ZO2Y_SPORTS_FEATURED_LEAGUES) && window.ZO2Y_SPORTS_FEATURED_LEAGUES.length
    ? window.ZO2Y_SPORTS_FEATURED_LEAGUES.slice()
    : [
      'English Premier League',
      'Spanish La Liga',
      'German Bundesliga',
      'Italian Serie A',
      'French Ligue 1',
      'CAF Champions League',
      'Saudi Pro League',
      'Major League Soccer',
      'Brazilian Serie A',
      'Argentine Primera Division',
      'NBA',
      'WNBA',
      'EuroLeague',
      'NFL',
      'MLB',
      'NHL',
      'Indian Premier League',
      'Super Rugby',
      'United Rugby Championship',
      'National Rugby League',
      'AFL',
      'Formula 1',
      'Ultimate Fighting Championship'
    ];
  const CURRENT_RELEVANT_TEAMS = Array.isArray(window.ZO2Y_SPORTS_CURRENT_RELEVANT_TEAMS) && window.ZO2Y_SPORTS_CURRENT_RELEVANT_TEAMS.length
    ? window.ZO2Y_SPORTS_CURRENT_RELEVANT_TEAMS.slice()
    : [
      'Real Madrid',
      'Barcelona',
      'Atletico Madrid',
      'Girona',
      'Athletic Bilbao',
      'Real Sociedad',
      'Villarreal',
      'Real Betis',
      'Sevilla',
      'Valencia',
      'Liverpool',
      'Manchester City',
      'Arsenal',
      'Chelsea',
      'Manchester United',
      'Tottenham',
      'Newcastle United',
      'Aston Villa',
      'Brighton',
      'West Ham',
      'Inter Milan',
      'AC Milan',
      'Juventus',
      'Napoli',
      'Roma',
      'Lazio',
      'Atalanta',
      'Fiorentina',
      'Bayern Munich',
      'Borussia Dortmund',
      'RB Leipzig',
      'Bayer Leverkusen',
      'Eintracht Frankfurt',
      'VfB Stuttgart',
      'PSG',
      'Marseille',
      'Monaco',
      'Lyon',
      'Lille',
      'Al Ahly',
      'Zamalek',
      'UFC'
    ];
  const SEED_TEAMS = CURRENT_RELEVANT_TEAMS.slice();
  const DEMONYM_MAP = {
    egyptian: 'egypt',
    spanish: 'spain',
    french: 'france',
    german: 'germany',
    italian: 'italy',
    portuguese: 'portugal',
    dutch: 'netherlands',
    greek: 'greece',
    turkish: 'turkey',
    mexican: 'mexico',
    american: 'united states',
    argentine: 'argentina',
    brazilian: 'brazil',
    saudi: 'saudi arabia',
    qatari: 'qatar',
    emirate: 'united arab emirates',
    english: 'england',
    scottish: 'scotland',
    welsh: 'wales',
    irish: 'ireland'
  };
  const SPORT_SEARCH_MAP = {
    basketball: ['NBA', 'WNBA', 'EuroLeague', 'NCAA Basketball', 'Basketball Africa League', 'NBL'],
    hockey: ['NHL', 'AHL', 'KHL', 'SHL'],
    baseball: ['MLB', 'NPB', 'KBO League', 'Mexican League Baseball'],
    cricket: ['Indian Premier League', 'Big Bash League', 'Pakistan Super League', 'The Hundred'],
    rugby: ['Super Rugby', 'National Rugby League', 'NRL'],
    mma: ['UFC', 'Ultimate Fighting Championship'],
    combat: ['UFC', 'Ultimate Fighting Championship'],
    soccer: [
      'English Premier League',
      'English Championship',
      'English League One',
      'English League Two',
      'FA Cup',
      'EFL Cup',
      'Spanish La Liga',
      'Copa del Rey',
      'Italian Serie A',
      'Coppa Italia',
      'German Bundesliga',
      'DFB Pokal',
      'French Ligue 1',
      'Coupe de France',
      'UEFA Champions League',
      'UEFA Europa League',
      'UEFA Europa Conference League',
      'UEFA Nations League',
      'UEFA Super Cup',
      'CAF Champions League',
      'CAF Confederation Cup',
      'AFC Champions League',
      'AFC Asian Cup',
      'CONCACAF Champions Cup',
      'Copa Libertadores',
      'Copa Sudamericana',
      'Saudi Pro League',
      'Saudi First Division League',
      'Saudi Women\'s Premier League',
      'Egyptian Premier League',
      'Major League Soccer',
      'USL Championship',
      'Liga MX',
      'Brazilian Serie A',
      'Argentine Primera Division',
      'Portuguese Primeira Liga',
      'Dutch Eredivisie',
      'UAE Pro League',
      'Qatar Stars League'
    ],
    football: [
      'English Premier League',
      'English Championship',
      'Spanish La Liga',
      'Italian Serie A',
      'German Bundesliga',
      'French Ligue 1',
      'Saudi Pro League',
      'Major League Soccer',
      'NFL',
      'NCAA Football',
      'CFL'
    ],
    'american football': ['NFL', 'NCAA Football', 'CFL', 'XFL', 'USFL'],
    motorsport: ['Formula 1', 'Formula One', 'Formula E', 'MotoGP', 'IndyCar']
  };
  const LEAGUE_ALIAS_MAP = {
    'saudi league': ['Saudi Pro League', 'Saudi Professional League', 'Roshn Saudi League'],
    'saudi pro league': ['Saudi Pro League', 'Saudi Professional League', 'Roshn Saudi League'],
    'saudi professional league': ['Saudi Pro League', 'Saudi Professional League', 'Roshn Saudi League'],
    'saudi premier league': ['Saudi Pro League', 'Saudi Professional League', 'Roshn Saudi League', 'Saudi-Arabian Pro League'],
    'saudi arabian pro league': ['Saudi-Arabian Pro League', 'Saudi Pro League', 'Roshn Saudi League'],
    'roshn league': ['Roshn Saudi League', 'Saudi Pro League'],
    'spanish league': ['Spanish La Liga', 'Spanish La Liga 2', 'Copa del Rey'],
    'premier league': ['English Premier League'],
    'epl': ['English Premier League'],
    'fpl': ['English Premier League'],
    'fantasy premier league': ['English Premier League'],
    'english championship': ['English Championship'],
    'efl championship': ['English Championship'],
    'efl cup': ['EFL Cup'],
    'carabao cup': ['EFL Cup'],
    'fa cup': ['FA Cup'],
    'la liga': ['Spanish La Liga'],
    'lal iga': ['Spanish La Liga'],
    'laliga': ['Spanish La Liga'],
    'copa del rey': ['Copa del Rey'],
    'serie a': ['Italian Serie A'],
    'coppa italia': ['Coppa Italia'],
    'bundesliga': ['German Bundesliga'],
    'dfb pokal': ['DFB Pokal'],
    'ligue 1': ['French Ligue 1'],
    'coupe de france': ['Coupe de France'],
    'mls': ['Major League Soccer'],
    'usl': ['USL Championship'],
    'liga mx': ['Liga MX'],
    'ipl': ['Indian Premier League'],
    'nba': ['NBA'],
    'wnba': ['WNBA'],
    'nfl': ['NFL'],
    'mlb': ['MLB'],
    'nhl': ['NHL'],
    'ufc': ['UFC', 'Ultimate Fighting Championship'],
    'ultimate fighting championship': ['UFC', 'Ultimate Fighting Championship'],
    'f1': ['Formula 1'],
    'formula 1': ['Formula 1'],
    'formula one': ['Formula 1'],
    'motogp': ['MotoGP'],
    'indycar': ['IndyCar'],
    'champions league': ['UEFA Champions League'],
    'europa league': ['UEFA Europa League'],
    'conference league': ['UEFA Europa Conference League'],
    'copa libertadores': ['Copa Libertadores'],
    'copa sudamericana': ['Copa Sudamericana'],
    'concacaf champions cup': ['CONCACAF Champions Cup'],
    'afc champions league': ['AFC Champions League'],
    'caf champions league': ['CAF Champions League']
  };
  const SEARCH_STOPWORDS = new Set([
    'fc',
    'cf',
    'sc',
    'afc',
    'club',
    'team',
    'the'
  ]);
  const TEAM_TOKEN_ALIASES = {
    utd: ['united'],
    manc: ['manchester'],
    man: ['manchester'],
    spurs: ['tottenham'],
    f1: ['formula', 'formula 1', 'formula one', 'motorsport'],
    motogp: ['motorcycling', 'motorsport'],
    nba: ['basketball'],
    nfl: ['football', 'american football'],
    mlb: ['baseball'],
    nhl: ['hockey', 'ice hockey'],
    ipl: ['cricket'],
    psg: ['paris', 'saint', 'germain'],
    juve: ['juventus'],
    inter: ['internazionale'],
    ath: ['athletic'],
    st: ['saint'],
    bk: ['basketball'],
    fk: ['football']
  };

  const state = {
    supabase: null,
    currentUser: null,
    favorites: new Set(),
    heroTeam: null,
    leagueIndex: [],
    leagueIndexLoaded: false,
    teamMap: new Map(),
    searchTimer: null,
    searchSeq: 0,
    searchCache: new Map(),
    leagueTeamsCache: new Map(),
    leagueTeamsPending: new Map(),
    lastResults: [],
    lastQuery: ''
  };
  let sportsAssetManifestPromise = null;
  const sportsAssetManifestRows = [];
  const sportsAssetManifestById = new Map();
  const sportsAssetManifestByName = new Map();
  let sportsImageObserver = null;

  // Built-in overrides for teams/leagues we want to guarantee have a logo even without Supabase storage.
  // Uses Wikimedia-hosted images only (no local seeding).
  const BUILTIN_SPORTS_ASSET_OVERRIDES = [
    {
      id: 'ufc',
      sportsDbId: '',
      name: 'UFC',
      sport: 'MMA',
      league: 'Ultimate Fighting Championship',
      country: 'United States',
      stadium: '',
      badge: '/assets/sports/ufc-logo.svg'
    }
  ];

  const ui = {
    hero: document.getElementById('sportsHero'),
    heroMedia: document.getElementById('sportsHeroMedia'),
    heroTitle: document.getElementById('sportsHeroTitle'),
    heroSubtitle: document.getElementById('sportsHeroSubtitle'),
    heroMeta: document.getElementById('sportsHeroMeta'),
    heroCard: document.getElementById('sportsHeroCard'),
    heroBadge: document.getElementById('sportsHeroBadge'),
    heroLogo: document.getElementById('sportsHeroLogo'),
    heroTeam: document.getElementById('sportsHeroTeam'),
    heroLeague: document.getElementById('sportsHeroLeague'),
    heroStadium: document.getElementById('sportsHeroStadium'),
    heroSave: document.getElementById('sportsHeroSaveBtn'),
    searchInput: document.getElementById('sportsSearchInput'),
    searchBtn: document.getElementById('sportsSearchBtn'),
    filterToggleBtn: document.getElementById('sportsFilterToggleBtn'),
    filterModal: document.getElementById('sportsFilterModal'),
    filterCloseBtn: document.getElementById('sportsFilterCloseBtn'),
    searchTags: document.getElementById('sportsSearchTags'),
    searchSuggest: document.getElementById('sportsSearchSuggest'),
    filterSport: document.getElementById('sportsFilterSport'),
    filterCountry: document.getElementById('sportsFilterCountry'),
    filterLeague: document.getElementById('sportsFilterLeague'),
    filterSportModal: document.getElementById('sportsFilterSportModal'),
    filterCountryModal: document.getElementById('sportsFilterCountryModal'),
    filterLeagueModal: document.getElementById('sportsFilterLeagueModal'),
    resultsTitle: document.getElementById('sportsResultsTitle'),
    resultsSubtitle: document.getElementById('sportsResultsSubtitle'),
    grid: document.getElementById('sportsGrid'),
    empty: document.getElementById('sportsEmpty'),
    loading: document.getElementById('sportsLoading'),
    toast: document.getElementById('sportsToast'),
    count: document.getElementById('sportsCount'),
    didYouMean: document.getElementById('sportsDidYouMean'),
    popularRail: document.getElementById('sportsPopularRail')
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toHttps(url) {
    const text = String(url || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    if (text.startsWith('http://')) return text.replace(/^http:\/\//i, 'https://');
    return text;
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]+/g, '')
      .replace(/['├óΓé¼Γäó]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizePriorityName(value) {
    return normalizeSearchText(value).replace(/\b(fc|cf|sc|afc|club|the)\b/g, '').replace(/\s+/g, ' ').trim();
  }

  function isPriorityLeagueName(value) {
    const league = normalizePriorityName(value);
    if (!league) return false;
    return [
      'premier league',
      'la liga',
      'serie a',
      'bundesliga',
      'ligue 1',
      'champions league',
      'major league soccer',
      'saudi pro league',
      'egyptian premier league',
      'nba',
      'nfl',
      'mlb',
      'nhl',
      'formula 1',
      'indian premier league'
    ].some((token) => league.includes(token));
  }

  function scoreFeaturedPriority(team) {
    const name = normalizePriorityName(team?.name || team?.strTeam || '');
    const league = normalizePriorityName(team?.league || team?.strLeague || '');
    const sport = normalizePriorityName(team?.sport || team?.strSport || '');
    let score = 0;
    const relevantIndex = CURRENT_RELEVANT_TEAMS.findIndex((seed) => normalizePriorityName(seed) === name);
    if (relevantIndex >= 0) score += Math.max(900 - (relevantIndex * 6), 240);
    else if (SEED_TEAMS.some((seed) => normalizePriorityName(seed) === name)) score += 500;
    if (isPriorityLeagueName(league)) score += 220;
    if (sport.includes('soccer') || sport === 'football') score += 180;
    if (league.includes('premier league') || league.includes('la liga') || league.includes('serie a') || league.includes('bundesliga') || league.includes('champions league')) score += 140;
    if (league.includes('nba') || league.includes('nfl')) score += 80;
    if (team?.badge) score += 24;
    return score;
  }

  function rankFeaturedTeams(teams, limit = FEATURED_TEAMS_LIMIT) {
    const ranked = dedupeTeams(Array.isArray(teams) ? teams : [])
      .filter((team) => team && team.name && team.badge)
      .sort((a, b) => {
        const diff = scoreFeaturedPriority(b) - scoreFeaturedPriority(a);
        if (diff) return diff;
        return String(a?.name || '').localeCompare(String(b?.name || ''));
      })
      .slice(0, limit * 2);
    const buckets = new Map();
    ranked.forEach((team) => {
      const sportKey = normalizeSearchText(team?.sport || 'other') || 'other';
      if (!buckets.has(sportKey)) buckets.set(sportKey, []);
      buckets.get(sportKey).push(team);
    });
    const sportOrder = shuffleArray(Array.from(buckets.keys()));
    const balanced = [];
    while (balanced.length < limit && sportOrder.length) {
      let addedInPass = false;
      sportOrder.forEach((sportKey) => {
        const bucket = buckets.get(sportKey);
        if (!bucket || !bucket.length || balanced.length >= limit) return;
        balanced.push(bucket.shift());
        addedInPass = true;
      });
      if (!addedInPass) break;
    }
    return balanced.length ? balanced.slice(0, limit) : ranked.slice(0, limit);
  }

  function stripSearchStopwords(tokens) {
    const list = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    if (!list.length) return [];
    const cleaned = list.filter((token) => !SEARCH_STOPWORDS.has(token));
    return cleaned.length ? cleaned : list;
  }

  function readSportsFeaturedCache() {
    try {
      const raw = localStorage.getItem(SPORTS_FEATURED_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.savedAt || 0);
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      if (!savedAt || !items.length) return [];
      if ((Date.now() - savedAt) > SPORTS_FEATURED_CACHE_TTL_MS) return [];
      return items;
    } catch (_err) {
      return [];
    }
  }

  function writeSportsFeaturedCache(items) {
    try {
      const list = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!list.length) return;
      localStorage.setItem(SPORTS_FEATURED_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        items: list
      }));
    } catch (_err) {}
  }

  function normalizeSportsAssetManifestRows(payload) {
    const rows = Array.isArray(payload?.teams) ? payload.teams : (Array.isArray(payload) ? payload : []);
    return rows.map((row) => {
      if (!row || typeof row !== 'object') return null;
      const sportsDbId = String(row.sportsDbId || row.id || '').trim();
      const name = String(row.name || row.title || '').trim();
      if (!sportsDbId && !name) return null;
      const team = {
        id: sportsDbId || name,
        sportsDbId,
        name,
        sport: String(row.sport || '').trim(),
        league: String(row.league || '').trim(),
        country: String(row.country || '').trim(),
        stadium: String(row.stadium || '').trim(),
        badge: toHttps(row.badge || row.logo_url || ''),
        banner: '',
        fanart: '',
        stadiumThumb: '',
        jersey: ''
      };
      team.searchText = buildTeamSearchText(team);
      return team;
    }).filter(Boolean);
  }

  function mergeSportsAssetManifestRows(rows = []) {
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const id = String(row?.sportsDbId || row?.id || '').trim();
      const nameKey = normalizeSearchText(row?.name || '');
      const existing = (id && sportsAssetManifestById.get(id)) || (nameKey && sportsAssetManifestByName.get(nameKey)) || null;
      const merged = existing ? {
        ...existing,
        ...row,
        badge: row.badge || existing.badge || '',
        banner: '',
        fanart: '',
        stadiumThumb: '',
        jersey: ''
      } : row;
      if (!existing) {
        sportsAssetManifestRows.push(merged);
      } else {
        const index = sportsAssetManifestRows.indexOf(existing);
        if (index >= 0) sportsAssetManifestRows[index] = merged;
      }
      if (id) sportsAssetManifestById.set(id, merged);
      if (nameKey) sportsAssetManifestByName.set(nameKey, merged);
    });
  }

  function readSportsAssetManifestCache() {
    try {
      const raw = localStorage.getItem(SPORTS_ASSET_MANIFEST_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.savedAt || 0);
      if (!savedAt || (Date.now() - savedAt) > SPORTS_ASSET_MANIFEST_TTL_MS) return [];
      return normalizeSportsAssetManifestRows(parsed);
    } catch (_err) {
      return [];
    }
  }

  function writeSportsAssetManifestCache(rows) {
    try {
      const teams = Array.isArray(rows) ? rows.filter(Boolean) : [];
      if (!teams.length) return;
      localStorage.setItem(SPORTS_ASSET_MANIFEST_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        teams
      }));
    } catch (_err) {}
  }

  function loadSportsAssetManifestFromStorage() {
    const rows = readSportsAssetManifestCache();
    if (!rows.length) return [];
    mergeSportsAssetManifestRows(rows);
    return sportsAssetManifestRows.slice();
  }

  async function ensureSportsAssetManifest() {
    if (sportsAssetManifestRows.length) return sportsAssetManifestRows.slice();
    loadSportsAssetManifestFromStorage();
    if (sportsAssetManifestRows.length) return sportsAssetManifestRows.slice();
    if (sportsAssetManifestPromise) return sportsAssetManifestPromise;
    sportsAssetManifestPromise = (async () => {
      try {
        const response = await fetch(SPORTS_ASSET_MANIFEST_URL, {
          cache: 'force-cache',
          credentials: 'omit'
        });
        if (!response.ok) throw new Error(`Manifest fetch failed (${response.status})`);
        const payload = await response.json();
        const rows = normalizeSportsAssetManifestRows(payload);
        if (rows.length) {
          mergeSportsAssetManifestRows(rows);
          writeSportsAssetManifestCache(rows);
        }
        return sportsAssetManifestRows.slice();
      } catch (_err) {
        return sportsAssetManifestRows.slice();
      } finally {
        sportsAssetManifestPromise = null;
      }
    })();
    return sportsAssetManifestPromise;
  }

  function getSportsAssetOverride(teamLike) {
    const id = String(teamLike?.sportsDbId || teamLike?.idTeam || teamLike?.id || '').trim();
    const nameKey = normalizeSearchText(teamLike?.name || teamLike?.strTeam || '');
    return (id && sportsAssetManifestById.get(id)) || (nameKey && sportsAssetManifestByName.get(nameKey)) || null;
  }

  function applySportsAssetOverride(team) {
    if (!team || typeof team !== 'object') return null;
    const override = getSportsAssetOverride(team);
    if (!override) return team;
    const merged = {
      ...team,
      id: team.id || override.id || override.sportsDbId || override.name,
      sportsDbId: team.sportsDbId || override.sportsDbId || override.id || '',
      name: override.name || team.name,
      sport: override.sport || team.sport || '',
      league: override.league || team.league || '',
      country: override.country || team.country || '',
      stadium: override.stadium || team.stadium || '',
      badge: override.badge || team.badge || '',
      banner: '',
      fanart: '',
      stadiumThumb: '',
      jersey: ''
    };
    merged.searchText = buildTeamSearchText(merged);
    return merged;
  }

  function expandQueryTokens(query) {
    const normalized = normalizeSearchText(query);
    if (!normalized) return [];
    const rawTokens = normalized.split(' ').filter(Boolean);
    const tokens = stripSearchStopwords(rawTokens);
    const expanded = new Set();
    tokens.forEach((token) => {
      expanded.add(token);
      const mapped = DEMONYM_MAP[token];
      if (mapped) {
        normalizeSearchText(mapped).split(' ').filter(Boolean).forEach((entry) => expanded.add(entry));
      }
      const aliasList = TEAM_TOKEN_ALIASES[token] || [];
      aliasList.forEach((alias) => {
        normalizeSearchText(alias).split(' ').filter(Boolean).forEach((entry) => expanded.add(entry));
      });
      if (token === 'f1') {
        expanded.add('formula');
        expanded.add('1');
        expanded.add('formula 1');
      }
      if (token === 'nba') expanded.add('basketball');
      if (token === 'wnba') expanded.add('basketball');
      if (token === 'mlb') expanded.add('baseball');
      if (token === 'nfl') expanded.add('football');
    });
    Object.entries(LEAGUE_ALIAS_MAP).forEach(([alias, leagues]) => {
      const aliasKey = normalizeSearchText(alias);
      if (!aliasKey) return;
      if (!normalized.includes(aliasKey)) return;
      (leagues || []).forEach((league) => {
        normalizeSearchText(league).split(' ').filter(Boolean).forEach((entry) => expanded.add(entry));
      });
    });
    return Array.from(expanded);
  }

  function buildSearchQueries(query) {
    const trimmed = String(query || '').trim();
    const normalized = normalizeSearchText(trimmed);
    if (!normalized) return [];
    const rawTokens = normalized.split(' ').filter(Boolean);
    const tokens = stripSearchStopwords(rawTokens);
    const aliasTokens = [];
    tokens.forEach((token) => {
      const aliasList = TEAM_TOKEN_ALIASES[token] || [];
      aliasList.forEach((alias) => {
        normalizeSearchText(alias).split(' ').filter(Boolean).forEach((entry) => aliasTokens.push(entry));
      });
    });
    const cleanedTokens = Array.from(new Set([...tokens, ...aliasTokens])).filter(Boolean);
    const cleanedQuery = cleanedTokens.join(' ');
    const variants = new Set();
    if (trimmed) variants.add(trimmed);
    if (cleanedQuery && cleanedQuery !== normalized) variants.add(cleanedQuery);
    if (tokens.length >= 2) variants.add(tokens.slice(0, 2).join(' '));
    return Array.from(variants).filter(Boolean).slice(0, 3);
  }

  function getQueryFacetContext(query, teams = []) {
    const normalized = normalizeSearchText(query);
    if (!normalized) {
      return {
        normalized,
        sportConfig: null,
        matchedCountries: new Set(),
        matchedLeagues: new Set(),
        isFacetQuery: false
      };
    }
    const sportConfig = getSportSearchConfig(query);
    const matchedCountries = new Set();
    const matchedLeagues = new Set();
    const tokens = normalized.split(' ').filter(Boolean);
    tokens.forEach((token) => {
      const mappedCountry = DEMONYM_MAP[token];
      if (mappedCountry) matchedCountries.add(normalizeSearchText(mappedCountry));
    });
    (Array.isArray(teams) ? teams : []).forEach((team) => {
      const country = normalizeSearchText(team?.country || '');
      const league = normalizeSearchText(team?.league || '');
      if (country && (normalized.includes(country) || tokens.includes(country))) {
        matchedCountries.add(country);
      }
      if (league && (normalized.includes(league) || league.includes(normalized))) {
        matchedLeagues.add(league);
      }
    });
    Object.entries(LEAGUE_ALIAS_MAP).forEach(([alias, leagues]) => {
      const aliasKey = normalizeSearchText(alias);
      if (!aliasKey || !normalized.includes(aliasKey)) return;
      (Array.isArray(leagues) ? leagues : []).forEach((league) => {
        const normalizedLeague = normalizeSearchText(league);
        if (normalizedLeague) matchedLeagues.add(normalizedLeague);
      });
    });
    const hasFacetTerms = /\b(league|cup|conference|division|serie|liga|premier|teams|team|clubs|club|country|sport|basketball|football|soccer|baseball|hockey|cricket|rugby|motogp|f1|formula|motorsport|nba|nfl|mlb|nhl)\b/.test(normalized);
    return {
      normalized,
      sportConfig,
      matchedCountries,
      matchedLeagues,
      isFacetQuery: hasFacetTerms || !!sportConfig || matchedCountries.size > 0 || matchedLeagues.size > 0
    };
  }

  function getSemanticMatches(teams, query) {
    const list = Array.isArray(teams) ? teams : [];
    const context = getQueryFacetContext(query, list);
    if (!context.isFacetQuery) return { teams: [], context };
    const matches = list.filter((team) => {
      const sportText = normalizeSearchText(team?.sport || '');
      const countryText = normalizeSearchText(team?.country || '');
      const leagueText = normalizeSearchText(team?.league || '');
      if (context.sportConfig?.sportTokens?.length && context.sportConfig.sportTokens.some((token) => sportText.includes(token) || leagueText.includes(token))) {
        return true;
      }
      if (context.matchedCountries.size && countryText && context.matchedCountries.has(countryText)) {
        return true;
      }
      if (context.matchedLeagues.size && leagueText && context.matchedLeagues.has(leagueText)) {
        return true;
      }
      return false;
    });
    return { teams: dedupeTeams(matches), context };
  }

  function getSportSearchConfig(query) {
    const normalized = normalizeSearchText(query);
    if (!normalized) return null;
    const tokens = normalized.split(' ').filter(Boolean);
    const tokenSet = new Set(tokens);

    const has = (value) => tokenSet.has(value);
    if (has('basketball') || has('nba') || has('wnba')) {
      return { key: 'basketball', leagues: SPORT_SEARCH_MAP.basketball, sportTokens: ['basketball'] };
    }
    if (has('hockey') || has('nhl')) {
      return { key: 'hockey', leagues: SPORT_SEARCH_MAP.hockey, sportTokens: ['hockey'] };
    }
    if (has('baseball') || has('mlb')) {
      return { key: 'baseball', leagues: SPORT_SEARCH_MAP.baseball, sportTokens: ['baseball'] };
    }
    if (has('cricket') || has('ipl')) {
      return { key: 'cricket', leagues: SPORT_SEARCH_MAP.cricket, sportTokens: ['cricket'] };
    }
    if (has('rugby') || has('nrl')) {
      return { key: 'rugby', leagues: SPORT_SEARCH_MAP.rugby, sportTokens: ['rugby'] };
    }
    if (has('soccer') || has('futbol')) {
      return { key: 'soccer', leagues: SPORT_SEARCH_MAP.soccer, sportTokens: ['soccer'] };
    }
    if (has('football') && !has('american') && !has('nfl')) {
      return { key: 'football', leagues: SPORT_SEARCH_MAP.soccer, sportTokens: ['soccer', 'football'] };
    }
    if (has('football') || has('nfl') || has('american')) {
      return { key: 'american football', leagues: SPORT_SEARCH_MAP['american football'], sportTokens: ['football'] };
    }
    if (has('f1') || (has('formula') && has('1')) || normalized.includes('formula 1') || normalized.includes('formula one') || normalized.includes('motorsport')) {
      return { key: 'motorsport', leagues: SPORT_SEARCH_MAP.motorsport, sportTokens: ['motorsport', 'formula'] };
    }
    return null;
  }

  function filterTeamsBySportTokens(teams, tokens) {
    if (!tokens || !tokens.length) return Array.isArray(teams) ? teams : [];
    return (Array.isArray(teams) ? teams : []).filter((team) => {
      const sportText = normalizeSearchText([team?.sport, team?.league].filter(Boolean).join(' '));
      if (!sportText) return false;
      return tokens.some((token) => sportText.includes(token));
    });
  }

  function normalizeFilterValue(value) {
    const raw = String(value || '').trim();
    if (!raw || raw.toLowerCase() === 'all') return '';
    return normalizeSearchText(raw);
  }

  function getActiveFilters() {
    const sport = normalizeFilterValue(ui.filterSport?.value || ui.filterSportModal?.value || '');
    const country = normalizeFilterValue(ui.filterCountry?.value || ui.filterCountryModal?.value || '');
    const league = normalizeFilterValue(ui.filterLeague?.value || ui.filterLeagueModal?.value || '');
    return { sport, country, league };
  }

  function applyTeamFilters(teams) {
    const { sport, country, league } = getActiveFilters();
    if (!sport && !country && !league) return Array.isArray(teams) ? teams : [];
    return (Array.isArray(teams) ? teams : []).filter((team) => {
      const teamSport = normalizeSearchText(team?.sport || '');
      const teamCountry = normalizeSearchText(team?.country || '');
      const teamLeague = normalizeSearchText(team?.league || '');
      if (sport && !teamSport.includes(sport) && sport !== teamSport) return false;
      if (country && !teamCountry.includes(country) && country !== teamCountry) return false;
      if (league && !teamLeague.includes(league) && league !== teamLeague) return false;
      return true;
    });
  }

  function setSelectOptions(selectEl, values, labelAll, currentValue) {
    if (!selectEl) return;
    const current = String(currentValue || selectEl.value || 'all');
    const options = [`<option value="all">${escapeHtml(labelAll)}</option>`];
    values.forEach((value) => {
      options.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
    });
    selectEl.innerHTML = options.join('');
    const candidate = values.includes(current) ? current : 'all';
    selectEl.value = candidate;
  }

  function syncFilterSelectMirrors() {
    const pairs = [
      [ui.filterSport, ui.filterSportModal],
      [ui.filterCountry, ui.filterCountryModal],
      [ui.filterLeague, ui.filterLeagueModal]
    ];
    pairs.forEach(([primary, mirror]) => {
      if (!primary || !mirror) return;
      const value = String(primary.value || 'all');
      if (mirror.value !== value) mirror.value = value;
    });
  }

  // Make sure built-in overrides are always present (even if the manifest fetch fails).
  mergeSportsAssetManifestRows(BUILTIN_SPORTS_ASSET_OVERRIDES);

  function updateFilterOptions(teams) {
    const sports = new Set();
    const countries = new Set();
    const leagues = new Set();
    (Array.isArray(teams) ? teams : []).forEach((team) => {
      const sport = String(team?.sport || '').trim();
      const country = String(team?.country || '').trim();
      const league = String(team?.league || '').trim();
      if (sport) sports.add(sport);
      if (country) countries.add(country);
      if (league) leagues.add(league);
    });

    if (Array.isArray(state.leagueIndex) && state.leagueIndex.length) {
      state.leagueIndex.forEach((row) => {
        if (!row) return;
        if (row.sport) sports.add(row.sport);
        if (row.country) countries.add(row.country);
        if (row.league) leagues.add(row.league);
      });
    }

    const sportList = Array.from(sports).sort((a, b) => a.localeCompare(b));
    const countryList = Array.from(countries).sort((a, b) => a.localeCompare(b));
    const leagueList = Array.from(leagues).sort((a, b) => a.localeCompare(b));
    setSelectOptions(ui.filterSport, sportList, 'All sports', ui.filterSport?.value);
    setSelectOptions(ui.filterCountry, countryList, 'All countries', ui.filterCountry?.value);
    setSelectOptions(ui.filterLeague, leagueList, 'All leagues', ui.filterLeague?.value);
    setSelectOptions(ui.filterSportModal, sportList, 'All sports', ui.filterSport?.value || ui.filterSportModal?.value);
    setSelectOptions(ui.filterCountryModal, countryList, 'All countries', ui.filterCountry?.value || ui.filterCountryModal?.value);
    setSelectOptions(ui.filterLeagueModal, leagueList, 'All leagues', ui.filterLeague?.value || ui.filterLeagueModal?.value);
    syncFilterSelectMirrors();
  }

  function openFilterModal() {
    if (!ui.filterModal) return;
    ui.filterModal.classList.add('show');
    ui.filterModal.setAttribute('aria-hidden', 'false');
  }

  function closeFilterModal() {
    if (!ui.filterModal) return;
    ui.filterModal.classList.remove('show');
    ui.filterModal.setAttribute('aria-hidden', 'true');
  }

  function bindMirroredFilterSelect(primary, mirror) {
    if (!primary || !mirror) return;
    mirror.addEventListener('change', () => {
      primary.value = mirror.value;
      handleFilterChange();
    });
    primary.addEventListener('change', () => {
      if (mirror.value !== primary.value) mirror.value = primary.value;
    });
  }

  function buildTeamSearchText(team) {
    if (!team) return '';
    const parts = [
      team.name || team.strTeam,
      team.league || team.strLeague,
      team.sport || team.strSport,
      team.country || team.strCountry,
      team.stadium || team.strStadium
    ].filter(Boolean).join(' ');
    return normalizeSearchText(parts);
  }

  function getTeamSearchText(team) {
    return team?.searchText || buildTeamSearchText(team);
  }

  function teamMatchesQuery(team, query) {
    const q = normalizeSearchText(query);
    if (!q) return false;
    const tokens = expandQueryTokens(query).filter((token) => token.length > 1 || /^\d+$/.test(token));
    if (!tokens.length) return false;
    const haystack = getTeamSearchText(team);
    if (!haystack) return false;
    const name = normalizeSearchText(team?.name || team?.strTeam || '');
    const league = normalizeSearchText(team?.league || team?.strLeague || '');
    const country = normalizeSearchText(team?.country || team?.strCountry || '');
    const sport = normalizeSearchText(team?.sport || team?.strSport || '');
    const words = haystack.split(' ').filter(Boolean);
    
    // Exact name match is highest priority
    if (name === q) return true;
    if (name.startsWith(q)) return true;
    
    // Check if query is a known league alias - if so, require league match
    const normalizedQuery = normalizeSearchText(query);
    let isLeagueQuery = false;
    let targetLeagues = [];
    Object.entries(LEAGUE_ALIAS_MAP).forEach(([alias, leagues]) => {
      if (normalizedQuery === normalizeSearchText(alias) || normalizedQuery.includes(normalizeSearchText(alias))) {
        isLeagueQuery = true;
        leagues.forEach((l) => targetLeagues.push(normalizeSearchText(l)));
      }
    });
    
    // For league queries, require the team's league to match one of the target leagues
    if (isLeagueQuery && league) {
      const leagueMatches = targetLeagues.some((tl) => league === tl || league.includes(tl) || tl.includes(league));
      if (!leagueMatches) return false;
    }
    
    // Check if all tokens match somewhere
    let matches = 0;
    tokens.forEach((token) => {
      if (!token) return;
      // Check name first (highest priority)
      if (name.includes(token)) {
        matches += 1;
        return;
      }
      // Check league with word-boundary awareness for short tokens
      if (league) {
        const leagueWordMatch = league.split(' ').some((word) => word === token || word.startsWith(token));
        if (leagueWordMatch) {
          matches += 1;
          return;
        }
      }
      // Check country
      if (country.includes(token)) {
        matches += 1;
        return;
      }
      // Check sport
      if (sport.includes(token)) {
        matches += 1;
        return;
      }
      // Check full haystack
      if (haystack.includes(token)) {
        matches += 1;
        return;
      }
      // Prefix match on words
      if (words.some((word) => word.startsWith(token))) {
        matches += 1;
      }
    });
    
    // Require at least 1 token match for short queries, half for longer
    const minMatch = tokens.length <= 1 ? 1 : Math.max(1, Math.ceil(tokens.length * 0.5));
    return matches >= minMatch;
  }

  function getCachedTeams() {
    const bucket = sportsAssetManifestRows.slice();
    state.leagueTeamsCache.forEach((teams) => {
      if (Array.isArray(teams)) bucket.push(...teams);
    });
    return dedupeTeams(bucket);
  }

  function pickFallbackLeagues(query) {
    const q = normalizeSearchText(query);
    if (!q) return [];
    const tokens = stripSearchStopwords(q.split(' ').filter(Boolean));
    const aliasMatches = [];
    Object.entries(LEAGUE_ALIAS_MAP).forEach(([key, leagues]) => {
      if (!key || !q.includes(key)) return;
      (Array.isArray(leagues) ? leagues : []).forEach((league) => aliasMatches.push(league));
    });
    const matches = FALLBACK_LEAGUES.filter((league) => {
      const leagueText = normalizeSearchText(league);
      return tokens.some((token) => leagueText.includes(token));
    });
    const sportConfig = getSportSearchConfig(query);
    const sportLeagues = Array.isArray(sportConfig?.leagues) ? sportConfig.leagues : [];
    const combined = [...aliasMatches, ...matches, ...sportLeagues].filter(Boolean);
    if (combined.length) {
      const seen = new Set();
      return combined.filter((league) => {
        const key = normalizeSearchText(league);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    if (q.length <= 3) return SHORT_FALLBACK_LEAGUES;
    return FALLBACK_LEAGUES;
  }

  function clearSearchSuggestions() {
    if (!ui.searchSuggest) return;
    ui.searchSuggest.classList.remove('show');
    ui.searchSuggest.innerHTML = '';
  }

  function renderSearchSuggestions(query, items = null) {
    if (!ui.searchSuggest) return;
    const q = String(query || '').trim();
    if (!q) {
      clearSearchSuggestions();
      return;
    }
    const list = Array.isArray(items) && items.length
      ? items
      : (() => {
        const cachedTeams = getCachedTeams();
        const semanticMatches = getSemanticMatches(cachedTeams, q).teams;
        const fuzzyMatches = cachedTeams.filter((team) => teamMatchesQuery(team, q));
        const candidatePool = semanticMatches.length
          ? dedupeTeams([...semanticMatches, ...fuzzyMatches])
          : fuzzyMatches;
        return rankTeamsByQuery(candidatePool, q);
      })();
    const suggestions = applyTeamFilters(list).slice(0, 6);
    if (!suggestions.length) {
      clearSearchSuggestions();
      return;
    }
    ui.searchSuggest.innerHTML = suggestions.map((team) => {
      const meta = [team.league, team.country, team.sport].filter(Boolean).join(' | ');
      return `
        <button type="button" class="sports-suggest-item" data-team="${escapeHtml(team.name)}">
          <span class="suggest-name">${escapeHtml(team.name)}</span>
          <span class="suggest-meta">${escapeHtml(meta || 'Team')}</span>
        </button>
      `;
    }).join('');
    ui.searchSuggest.classList.add('show');
    ui.searchSuggest.querySelectorAll('.sports-suggest-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const teamName = btn.getAttribute('data-team') || '';
        if (ui.searchInput) ui.searchInput.value = teamName;
        clearSearchSuggestions();
        searchTeams(teamName).catch(() => {});
      });
    });
  }

  function dedupeTeams(teams) {
    const map = new Map();
    (Array.isArray(teams) ? teams : []).forEach((team) => {
      if (!team || !team.id) return;
      const key = String(team.id);
      if (map.has(key)) return;
      map.set(key, team);
    });
    return [...map.values()];
  }

  function rankTeamsByQuery(teams, query) {
    const q = normalizeSearchText(query);
    if (!q) return Array.isArray(teams) ? teams : [];
    const tokens = expandQueryTokens(query).filter((token) => token.length > 1 || /^\d+$/.test(token));
    const scored = (Array.isArray(teams) ? teams : []).map((team) => {
      const name = normalizeSearchText(team?.name || '');
      const searchText = getTeamSearchText(team) || name;
      const words = name.split(' ').filter(Boolean);
      const matchCount = tokens.reduce((count, token) => {
        if (!token) return count;
        if (searchText.includes(token)) return count + 1;
        if (words.some((word) => word.startsWith(token))) return count + 1;
        return count;
      }, 0);
      let score = 50;
      if (name) {
        if (name === q) score = 0;
        else if (name.startsWith(q)) score = 1;
        else if (name.includes(q)) score = 2;
        else if (tokens.length && tokens.every((token) => words.some((word) => word.startsWith(token)))) score = 3;
        else if (matchCount) score = 6;
        else score = 10;
      } else if (matchCount) {
        score = 8;
      }
      score += Math.max(0, tokens.length - matchCount) * 2;
      score -= Math.min(matchCount, 4);
      const league = normalizeSearchText(team?.league || '');
      const country = normalizeSearchText(team?.country || '');
      if (league && tokens.some((token) => league.includes(token))) score -= 1;
      if (country && tokens.some((token) => country.includes(token))) score -= 0.5;
      return {
        team,
        score,
        length: name.length || 999,
        name
      };
    });

    const matching = scored.filter((row) => row.score < 50);
    const list = matching.length ? matching : scored;
    return list
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.length !== b.length) return a.length - b.length;
        return a.name.localeCompare(b.name);
      })
      .map((row) => row.team);
  }

  function shuffleArray(list) {
    const arr = Array.isArray(list) ? [...list] : [];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function loadLeagueTeams(league) {
    const key = normalizeSearchText(league);
    if (!key) return [];
    if (state.leagueTeamsCache.has(key)) return state.leagueTeamsCache.get(key);
    if (state.leagueTeamsPending.has(key)) return state.leagueTeamsPending.get(key);

    const pending = (async () => {
      const payload = await fetchSportsDb('search_all_teams.php', { l: league }, 9000);
      const teams = Array.isArray(payload?.teams) ? payload.teams.map(mapTeam).filter(Boolean).map(applySportsAssetOverride) : [];
      state.leagueTeamsCache.set(key, teams);
      state.leagueTeamsPending.delete(key);
      return teams;
    })();

    state.leagueTeamsPending.set(key, pending);
    return pending;
  }

  async function getFallbackTeams(query) {
    const q = normalizeSearchText(query);
    if (!q) return [];
    const semanticLocal = getSemanticMatches(sportsAssetManifestRows, query).teams;
    const fuzzyLocal = sportsAssetManifestRows.filter((team) => teamMatchesQuery(team, query));
    const localMatches = dedupeTeams([...semanticLocal, ...fuzzyLocal]);
    if (localMatches.length >= 12) return rankTeamsByQuery(localMatches, query);
    const leagues = pickFallbackLeagues(query).slice(0, 12);
    const responses = await Promise.all(leagues.map((league) => loadLeagueTeams(league)));
    const matches = [...localMatches];
    responses.forEach((teams) => {
      const semanticLeagueMatches = getSemanticMatches(teams || [], query).teams;
      matches.push(...semanticLeagueMatches);
      (teams || []).forEach((team) => {
        if (teamMatchesQuery(team, query)) matches.push(team);
      });
    });
    return dedupeTeams(matches);
  }

  function buildTeamDetailUrl(team) {
    const params = new URLSearchParams();
    const numericId = /^\d+$/.test(String(team?.sportsDbId || team?.id || '').trim())
      ? String(team?.sportsDbId || team?.id || '').trim()
      : '';
    if (numericId) params.set('id', numericId);
    if (team?.name) params.set('team', team.name);
    if (team?.league) params.set('league', team.league);
    if (team?.sport) params.set('sport', team.sport);
    if (team?.country) params.set('country', team.country);
    const query = params.toString();
    return query ? `team.html?${query}` : 'team.html';
  }

  function clearTeamUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    url.searchParams.delete('team');
    window.history.replaceState({}, '', url.toString());
  }

  function setActiveCard(teamId) {
    if (!ui.grid) return;
    ui.grid.querySelectorAll('.card').forEach((card) => {
      const cardId = card.getAttribute('data-team-id');
      card.classList.toggle('is-active', !!teamId && cardId === String(teamId));
    });
  }

  function showToast(message, type = 'info') {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.toggle('error', type === 'error');
    ui.toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      ui.toast.classList.remove('show');
    }, 2800);
  }

  function resolveSportsDbBase() {
    const prefersDirect = window.ZO2Y_SPORTSDB_DIRECT === true || window.ZO2Y_SPORTSDB_DIRECT === '1';
    const base = prefersDirect ? SPORTSDB_DIRECT_BASE : SPORTSDB_PROXY_BASE;
    if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '');
    const prefix = base.startsWith('/') ? '' : '/';
    return `${window.location.origin}${prefix}${base}`.replace(/\/+$/, '');
  }

  async function fetchSportsDb(endpoint, params = {}, timeoutMs = 8000) {
    const path = String(endpoint || '').trim().replace(/^\/+/, '');
    if (!path) return null;
    const url = new URL(`${resolveSportsDbBase()}/${path}`);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, value);
    });
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer = null;
    try {
      if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function ensureLeagueIndex() {
    if (state.leagueIndexLoaded) return state.leagueIndex.slice();
    state.leagueIndexLoaded = true;
    try {
      const payload = await fetchSportsDb('all_leagues.php', {}, 9000);
      const rows = Array.isArray(payload?.leagues) ? payload.leagues : [];
      state.leagueIndex = rows.map((row) => {
        if (!row) return null;
        const league = String(row?.strLeague || row?.league || '').trim();
        if (!league) return null;
        return {
          league,
          sport: String(row?.strSport || row?.sport || '').trim(),
          country: String(row?.strCountry || row?.country || '').trim()
        };
      }).filter(Boolean);
    } catch (_err) {
      state.leagueIndex = [];
    }
    return state.leagueIndex.slice();
  }

  function mapTeam(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const override = getSportsAssetOverride(raw);
    const name = String(raw.strTeam || '').trim();
    const rawId = String(raw.idTeam || '').trim();
    const sportsDbId = /^\d+$/.test(rawId) ? rawId : String(override?.sportsDbId || override?.id || '').trim();
    const resolvedName = String(override?.name || name).trim();
    if (!resolvedName) return null;
    const team = {
      id: sportsDbId || resolvedName,
      sportsDbId,
      name: resolvedName,
      sport: String(override?.sport || raw.strSport || '').trim(),
      league: String(override?.league || raw.strLeague || '').trim(),
      country: String(override?.country || raw.strCountry || '').trim(),
      stadium: String(override?.stadium || raw.strStadium || '').trim(),
      badge: toHttps(override?.badge || raw.strBadge || raw.strTeamBadge || raw.strLogo || raw.strTeamLogo || ''),
      banner: '',
      fanart: '',
      stadiumThumb: '',
      jersey: ''
    };
    team.searchText = buildTeamSearchText(team);
    return team;
  }

  function setLoading(isLoading, message) {
    if (!ui.loading) return;
    if (isLoading) {
      ui.loading.textContent = message || 'Loading teams...';
      ui.loading.classList.add('visible');
      if (ui.empty) ui.empty.classList.remove('visible');
    } else {
      ui.loading.classList.remove('visible');
    }
  }

  function updateSaveButton(button, isSaved, labels) {
    if (!button) return;
    const label = labels?.label || 'Save';
    const savedLabel = labels?.savedLabel || 'Saved';
    button.classList.toggle('saved', !!isSaved);
    const icon = isSaved ? 'fa-check' : 'fa-heart';
    const text = isSaved ? savedLabel : label;
    button.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
    button.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
  }

  function setHeroTeam(team) {
    state.heroTeam = team || null;
    const hasTeam = !!team;

    if (ui.heroCard) {
      ui.heroCard.classList.toggle('is-empty', !hasTeam);
    }

    if (!hasTeam) {
      setActiveCard(null);
      if (ui.heroTitle) ui.heroTitle.textContent = 'Find your team';
      if (ui.heroSubtitle) ui.heroSubtitle.textContent = 'Search teams, save favorites to your profile, and build a sports corner that matches your taste.';
      if (ui.heroTeam) ui.heroTeam.textContent = 'Team spotlight';
      if (ui.heroLeague) ui.heroLeague.textContent = 'Search for a team to see details.';
      if (ui.heroStadium) ui.heroStadium.textContent = '';
      if (ui.heroBadge) ui.heroBadge.src = FALLBACK_BADGE;
      if (ui.heroLogo) {
        ui.heroLogo.src = FALLBACK_BADGE;
        ui.heroLogo.alt = '';
        ui.heroLogo.style.opacity = '0.25';
      }
      if (ui.heroMeta) {
        ui.heroMeta.innerHTML = '<span class="sports-hero-pill">Powered by TheSportsDB</span><span class="sports-hero-pill">Save teams to your profile</span>';
      }
      if (ui.heroMedia) {
        ui.heroMedia.style.removeProperty('--hero-bg');
        ui.heroMedia.style.removeProperty('--hero-bg-size');
        ui.heroMedia.style.removeProperty('--hero-bg-position');
      }
      if (ui.heroSave) ui.heroSave.disabled = true;
      return;
    }

    const metaPieces = [team.league, team.sport, team.stadium].filter(Boolean);
    const metaHtml = metaPieces.length
      ? metaPieces.map((item) => `<span class="sports-hero-pill">${escapeHtml(item)}</span>`).join('')
      : '<span class="sports-hero-pill">Powered by TheSportsDB</span>';

    if (ui.heroTitle) ui.heroTitle.textContent = team.name;
    if (ui.heroSubtitle) {
      const subtitle = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team details';
      ui.heroSubtitle.textContent = subtitle;
    }
    if (ui.heroTeam) ui.heroTeam.textContent = team.name;
    if (ui.heroLeague) {
      const leagueLine = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team details';
      ui.heroLeague.textContent = leagueLine;
    }
    if (ui.heroStadium) {
      ui.heroStadium.textContent = team.stadium ? `Stadium: ${team.stadium}` : '';
    }
    if (ui.heroBadge) {
      ui.heroBadge.src = team.badge || FALLBACK_BADGE;
      ui.heroBadge.alt = `${team.name} logo`;
      ui.heroBadge.referrerPolicy = 'no-referrer';
    }
    if (ui.heroLogo) {
      const heroLogo = team.badge || FALLBACK_BADGE;
      ui.heroLogo.src = heroLogo;
      ui.heroLogo.alt = `${team.name} logo`;
      ui.heroLogo.referrerPolicy = 'no-referrer';
      ui.heroLogo.style.opacity = heroLogo ? '0.6' : '0.25';
    }
    if (ui.heroMeta) ui.heroMeta.innerHTML = metaHtml;

    const heroImage = team.badge || FALLBACK_IMAGE;
    if (ui.heroMedia) {
      if (heroImage) {
        ui.heroMedia.style.setProperty('--hero-bg', `url("${heroImage}")`);
        ui.heroMedia.style.setProperty('--hero-bg-size', 'cover');
        ui.heroMedia.style.setProperty('--hero-bg-position', 'center');
      } else {
        ui.heroMedia.style.removeProperty('--hero-bg');
        ui.heroMedia.style.removeProperty('--hero-bg-size');
        ui.heroMedia.style.removeProperty('--hero-bg-position');
      }
    }

    if (ui.heroSave) {
      ui.heroSave.disabled = false;
      updateSaveButton(ui.heroSave, state.favorites.has(team.id), { label: 'Save team', savedLabel: 'Saved' });
    }
  }

  function navigateToTeam(team) {
    if (!team) return;
    window.location.href = buildTeamDetailUrl(team);
  }

  function getSportIconClass(sportRaw = '') {
    const sport = String(sportRaw || '').trim().toLowerCase();
    if (!sport) return '';
    if (sport.includes('soccer')) return 'fa-futbol';
    if (sport.includes('american football')) return 'fa-football';
    if (sport.includes('football')) return 'fa-futbol';
    if (sport.includes('basketball')) return 'fa-basketball';
    if (sport.includes('baseball')) return 'fa-baseball';
    if (sport.includes('ice hockey') || sport.includes('hockey')) return 'fa-hockey-puck';
    if (sport.includes('cricket')) return 'fa-baseball-bat-ball';
    if (sport.includes('rugby')) return 'fa-football';
    if (sport.includes('golf')) return 'fa-golf-ball-tee';
    if (sport.includes('tennis') || sport.includes('table tennis') || sport.includes('ping pong')) return 'fa-table-tennis-paddle-ball';
    if (sport.includes('volleyball')) return 'fa-volleyball';
    if (sport.includes('handball')) return 'fa-futbol';
    if (sport.includes('boxing')) return 'fa-hand-fist';
    if (sport.includes('mma') || sport.includes('mixed martial')) return 'fa-hand-fist';
    if (sport.includes('motorsport') || sport.includes('racing') || sport.includes('formula')) return 'fa-flag-checkered';
    if (sport.includes('cycling')) return 'fa-person-biking';
    if (sport.includes('snooker') || sport.includes('billiard')) return 'fa-bowling-ball';
    if (sport.includes('darts')) return 'fa-bullseye';
    return 'fa-trophy';
  }

  function getSportsImageObserver() {
    if (sportsImageObserver || typeof window.IntersectionObserver !== 'function') return sportsImageObserver;
    sportsImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        observer.unobserve(img);
        const nextSrc = String(img.getAttribute('data-defer-src') || '').trim();
        if (!nextSrc) return;
        img.removeAttribute('data-defer-src');
        img.src = nextSrc;
      });
    }, {
      rootMargin: '120px 0px',
      threshold: 0.01
    });
    return sportsImageObserver;
  }

  function primeSportsImages(scope) {
    const root = scope || document;
    const images = Array.from(root.querySelectorAll('img[data-defer-src]'));
    if (!images.length) return;
    const observer = getSportsImageObserver();
    if (!observer) {
      images.forEach((img) => {
        const nextSrc = String(img.getAttribute('data-defer-src') || '').trim();
        if (!nextSrc) return;
        img.removeAttribute('data-defer-src');
        img.src = nextSrc;
      });
      return;
    }
    images.forEach((img) => observer.observe(img));
  }

  function buildTeamCard(team) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;

    const id = String(team?.id || '').trim();
    const titleRaw = String(team?.name || '').trim() || 'Team';
    const league = String(team?.league || '').trim();
    const sport = String(team?.sport || '').trim();
    const country = String(team?.country || '').trim();
    const badge = String(team?.badge || '').trim() || FALLBACK_BADGE;
    const subtitle = league || 'Sports';
    const extra = [sport, country].filter(Boolean).join(' | ').toLowerCase();
    const href = id ? `team.html?id=${encodeURIComponent(id)}` : 'sports.html';
    const showMenu = SPORTS_LISTS_ENABLED && typeof window.openIndexStyleListMenu === 'function';

    card.dataset.teamId = id;
    card.dataset.itemId = id;
    card.dataset.href = href;
    card.dataset.mediaType = 'sports';
    card.dataset.title = titleRaw;
    card.dataset.subtitle = subtitle;
    card.dataset.image = badge;
    card.dataset.listImage = badge;

    card.innerHTML = `
      <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
      <div class="card-media brand-cover">
        <img src="${escapeHtml(badge)}" alt="${escapeHtml(titleRaw)} logo" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${escapeHtml(FALLBACK_BADGE)}';">
      </div>
      <div class="card-meta">
        <div class="card-meta-header">
          <span class="card-type"><i class="fa-solid fa-futbol"></i> Sports</span>
          <div class="card-menu-wrap">
            ${showMenu ? `<button class="card-menu-btn" type="button" aria-label="Add to lists"><i class="fas fa-ellipsis-v"></i></button>` : `<a class="card-open-link" href="${escapeHtml(href)}" aria-label="Open team"><i class="fas fa-arrow-up-right-from-square"></i></a>`}
          </div>
        </div>
        <div class="card-meta-top">
          <p class="card-name">${escapeHtml(titleRaw)}</p>
        </div>
        <p class="card-sub">${escapeHtml(subtitle)}</p>
        ${extra ? `<p class="card-extra">${escapeHtml(extra)}</p>` : '<p class="card-extra placeholder">&nbsp;</p>'}
      </div>
    `;

    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn && showMenu) {
      menuBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.openIndexStyleListMenu(card);
      });
    }

    const open = () => navigateToTeam(team);
    card.addEventListener('click', (event) => {
      if (event.target.closest('.card-menu-btn')) return;
      open();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('.card-menu-btn')) return;
      event.preventDefault();
      open();
    });

    return card;
  }

  function renderPopularTeams(teams) {
    if (!ui.popularRail) return;
    const list = Array.isArray(teams) ? teams : [];
    const normalized = (value) => normalizeSearchText(String(value || '').trim());
    const seeds = CURRENT_RELEVANT_TEAMS.slice();
    const seedSet = new Set(seeds.map((name) => normalized(name)).filter(Boolean));
    const picks = list
      .filter((team) => seedSet.has(normalized(team?.name || team?.strTeam)))
      .sort((a, b) => seedIndex(seeds, a?.name || a?.strTeam) - seedIndex(seeds, b?.name || b?.strTeam))
      .slice(0, 18);

    ui.popularRail.innerHTML = '';
    if (!picks.length) return;
    const fragment = document.createDocumentFragment();
    picks.forEach((team) => fragment.appendChild(buildTeamCard(team)));
    ui.popularRail.appendChild(fragment);
  }

  function seedIndex(seeds, value) {
    const target = normalizeSearchText(value);
    const idx = (Array.isArray(seeds) ? seeds : []).findIndex((seed) => normalizeSearchText(seed) === target);
    return idx >= 0 ? idx : 9999;
  }

  function renderTeams(teams, options = {}) {
    if (!ui.grid) return;
    const list = Array.isArray(teams) ? teams : [];
    ui.grid.innerHTML = '';
    state.teamMap.clear();
    clearSportsDidYouMean();

    if (ui.resultsTitle && options.title) ui.resultsTitle.textContent = options.title;
    if (ui.resultsSubtitle && options.subtitle) ui.resultsSubtitle.textContent = options.subtitle;

    if (!list.length) {
      if (ui.empty) {
        ui.empty.textContent = options.emptyMessage || 'No teams found. Try another search.';
        ui.empty.classList.add('visible');
      }
      if (ui.count) ui.count.textContent = '0 teams shown';
      setLoading(false);
      return;
    }

    if (ui.empty) ui.empty.classList.remove('visible');
    setLoading(false);

    const fragment = document.createDocumentFragment();
    list.forEach((team) => {
      state.teamMap.set(team.id, team);
      fragment.appendChild(buildTeamCard(team));
    });
    ui.grid.appendChild(fragment);

    if (ui.count) ui.count.textContent = `${list.length} teams shown`;
    syncSavedButtons();
  }

  function clearSportsDidYouMean() {
    if (ui.didYouMean) ui.didYouMean.textContent = '';
  }

  function showSportsDidYouMean(query, suggestion) {
    if (!ui.didYouMean) return;
    if (!suggestion) { ui.didYouMean.textContent = ''; return; }
    ui.didYouMean.textContent = `Showing "${suggestion}" instead of "${query}"`;
  }

  function renderDidYouMean(query, pool = []) {
    const q = String(query || '').trim();
    if (!q) return '';
    const helper = window.ZO2Y_DID_YOU_MEAN;
    if (!helper?.suggest) return '';
    const names = (Array.isArray(pool) ? pool : [])
      .map((team) => String(team?.name || '').trim())
      .filter(Boolean);
    const suggestion = helper.suggest(q, names, { maxDistance: 4 });
    if (!suggestion) return '';
    if (normalizeSearchText(suggestion) === normalizeSearchText(q)) return '';
    showSportsDidYouMean(q, suggestion);
    return suggestion;
  }

  async function ensureSupabase() {
    if (state.supabase) return state.supabase;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      state.supabase = window.__ZO2Y_SUPABASE_CLIENT;
      return state.supabase;
    }
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
        window.__ZO2Y_SUPABASE_CLIENT = state.supabase;
        return state.supabase;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }

  async function loadSavedTeamsFromSupabase(limit = 5000) {
    const client = await ensureSupabase();
    if (!client) return [];
    try {
      const query = client
        .from('teams')
        .select('id,name,sport,league,logo_url,banner_url,stadium,stadium_url,jersey_url,fanart_url,updated_at')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(Math.max(1, Math.min(10000, Number(limit) || 5000)));

      const result = await query;
      const rows = Array.isArray(result?.data) ? result.data : [];
      return rows.map((row) => {
        if (!row) return null;
        const id = String(row.id || '').trim();
        const name = String(row.name || '').trim();
        if (!id && !name) return null;
        const team = {
          id: id || name,
          sportsDbId: id,
          name: name || id,
          sport: String(row.sport || '').trim(),
          league: String(row.league || '').trim(),
          country: '',
          stadium: String(row.stadium || '').trim(),
          badge: toHttps(row.logo_url || ''),
          banner: toHttps(row.banner_url || ''),
          fanart: toHttps(row.fanart_url || ''),
          stadiumThumb: toHttps(row.stadium_url || ''),
          jersey: toHttps(row.jersey_url || '')
        };
        team.searchText = buildTeamSearchText(team);
        return team;
      }).filter(Boolean);
    } catch (_err) {
      return [];
    }
  }

  async function initAuth() {
    if (!state.supabase) return;
    try {
      const { data } = await state.supabase.auth.getUser();
      state.currentUser = data?.user || null;
      if (state.currentUser) await loadFavorites();
      state.supabase.auth.onAuthStateChange((_event, session) => {
        state.currentUser = session?.user || null;
        if (state.currentUser) {
          loadFavorites().catch(() => {});
        } else {
          state.favorites = new Set();
          syncSavedButtons();
        }
      });
    } catch (_err) {
      state.currentUser = null;
    }
  }

  async function loadFavorites() {
    if (!state.supabase || !state.currentUser) return;
    const { data, error } = await state.supabase
      .from('user_favorite_teams')
      .select('team_id')
      .eq('user_id', state.currentUser.id);

    if (error) return;

    state.favorites = new Set((data || []).map((row) => String(row.team_id)));
    syncSavedButtons();
  }

  function syncSavedButtons() {
    if (ui.heroSave && state.heroTeam) {
      updateSaveButton(ui.heroSave, state.favorites.has(state.heroTeam.id), { label: 'Save team', savedLabel: 'Saved' });
    }
  }

  function buildTeamFromCard(card, fallbackId) {
    if (!card) return null;
    const id = String(fallbackId || card.getAttribute('data-team-id') || card.dataset.itemId || '').trim();
    if (!id) return null;
    const title = String(card.dataset.title || card.querySelector('.card-name')?.textContent || id).trim();
    const subtitle = String(card.dataset.subtitle || card.querySelector('.card-sub')?.textContent || '').trim();
    const league = subtitle;
    const logo = String(card.dataset.listImage || card.querySelector('.card-media img')?.getAttribute('src') || '').trim();
    return {
      id,
      name: title || id,
      league: league || '',
      sport: '',
      badge: logo,
      banner: '',
      fanart: ''
    };
  }

  function initListMenu() {
    if (!SPORTS_LISTS_ENABLED) return;
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: 'sports',
      getCurrentUser: () => state.currentUser,
      setCurrentUser: (user) => {
        state.currentUser = user || null;
        if (state.currentUser) {
          loadFavorites().catch(() => {});
        }
      },
      ensureClient: ensureSupabase,
      notify: (message, isError) => showToast(message, isError ? 'error' : 'info'),
      getItemFromCard: (card) => {
        const team = buildTeamFromCard(card);
        if (!team) return null;
        return {
          mediaType: 'sports',
          itemId: team.id,
          title: team.name,
          subtitle: team.league || 'Sports',
          image: team.badge || team.banner || ''
        };
      },
      getVisibleItemIds: () => {
        if (!ui.grid) return [];
        return Array.from(ui.grid.querySelectorAll('.card'))
          .map((card) => String(card.getAttribute('data-team-id') || card.dataset.itemId || '').trim())
          .filter(Boolean);
      },
      getQuickStatusForItem: (itemId, listKeys) => {
        const status = {};
        (listKeys || []).forEach((key) => {
          status[key] = key === 'favorites' && state.favorites.has(String(itemId));
        });
        return status;
      },
      getDefaultListStatusMap: async (itemId, listKeys) => {
        const status = {};
        (listKeys || []).forEach((key) => {
          status[key] = key === 'favorites' && state.favorites.has(String(itemId));
        });
        return status;
      },
      toggleDefaultList: async ({ itemId, listType, nextSaved, card }) => {
        if (listType !== 'favorites') return { ok: false, saved: null };
        const team = state.teamMap.get(String(itemId)) || buildTeamFromCard(card, itemId);
        if (!team) return { ok: false, saved: null };
        return await toggleFavorite(team, nextSaved);
      }
    });
  }

  async function saveTeam(team) {
    if (!state.supabase || !state.currentUser) return false;
    const payload = {
      id: team.id,
      name: team.name,
      sport: team.sport || null,
      league: team.league || null,
      logo_url: team.badge || null,
      banner_url: null,
      stadium: team.stadium || null,
      stadium_url: null,
      jersey_url: null,
      fanart_url: null
    };

    const { error: teamError } = await state.supabase
      .from('teams')
      .upsert(payload, { onConflict: 'id' });

    if (teamError) {
      console.error('Team upsert error', teamError);
      return false;
    }

    const { error: favoriteError } = await state.supabase
      .from('user_favorite_teams')
      .upsert({ user_id: state.currentUser.id, team_id: team.id }, { onConflict: 'user_id,team_id' });

    if (favoriteError) {
      console.error('Favorite upsert error', favoriteError);
      return false;
    }

    return true;
  }

  async function removeTeam(teamId) {
    if (!state.supabase || !state.currentUser) return false;
    const { error } = await state.supabase
      .from('user_favorite_teams')
      .delete()
      .eq('user_id', state.currentUser.id)
      .eq('team_id', teamId);
    if (error) {
      console.error('Favorite delete error', error);
      return false;
    }
    return true;
  }

  async function toggleFavorite(team, nextSaved = null) {
    const result = { ok: false, saved: null };
    if (!team || !team.id) return result;
    if (!state.currentUser) {
      showToast('Sign in to save teams.', 'error');
      return result;
    }

    const isSaved = state.favorites.has(team.id);
    const shouldSave = typeof nextSaved === 'boolean' ? nextSaved : !isSaved;
    if (!shouldSave) {
      const ok = await removeTeam(team.id);
      if (ok) {
        state.favorites.delete(team.id);
        showToast('Removed from favorites.');
        result.ok = true;
        result.saved = false;
      } else {
        showToast('Unable to remove team.', 'error');
      }
    } else {
      const ok = await saveTeam(team);
      if (ok) {
        state.favorites.add(team.id);
        showToast('Team saved to your profile.');
        result.ok = true;
        result.saved = true;
      } else {
        showToast('Unable to save team.', 'error');
      }
    }
    syncSavedButtons();
    return result;
  }

  async function loadFeaturedTeams() {
    clearTeamUrl();
    setLoading(true, 'Loading teams...');
    loadSportsAssetManifestFromStorage();

    const [manifestTeams, savedTeams] = await Promise.all([
      ensureSportsAssetManifest().catch(() => []),
      loadSavedTeamsFromSupabase().catch(() => [])
    ]);

    await ensureLeagueIndex().catch(() => []);

    const apiTeams = [];
    const shouldHydrateApi = (manifestTeams.length + savedTeams.length) < 1200;
    if (shouldHydrateApi) {
      const leagues = FEATURED_LEAGUES.slice();
      const responses = await Promise.allSettled(leagues.map((league) => loadLeagueTeams(league)));
      responses.forEach((result) => {
        if (!result || result.status !== 'fulfilled') return;
        const teams = Array.isArray(result.value) ? result.value : [];
        teams.forEach((team) => {
          if (!team || !team.name) return;
          apiTeams.push(team);
        });
      });
    }

    const merged = dedupeTeams([
      ...(Array.isArray(manifestTeams) ? manifestTeams : []),
      ...(Array.isArray(savedTeams) ? savedTeams : []),
      ...(Array.isArray(apiTeams) ? apiTeams : [])
    ].map(applySportsAssetOverride).filter(Boolean));

    state.lastResults = merged;
    state.lastQuery = '';
    updateFilterOptions(merged);
    const filtered = applyTeamFilters(merged);
    renderPopularTeams(merged);

    renderTeams(filtered, {
      title: 'All teams',
      subtitle: `${filtered.length} teams shown`,
      emptyMessage: 'No teams match your filters yet.'
    });
  }

  async function searchTeams(query, options = {}) {
    const trimmed = String(query || '').trim();
    const seq = ++state.searchSeq;
    if (!trimmed) {
      clearSearchSuggestions();
      await loadFeaturedTeams();
      return;
    }

    if (!options.preserveUrl) clearTeamUrl();
    setLoading(true, `Searching "${trimmed}"...`);
    const cacheKey = normalizeSearchText(trimmed);
    const cached = state.searchCache.get(cacheKey);
    if (cached && cached.length && !options.forceNetwork) {
      state.lastResults = cached;
      state.lastQuery = trimmed;
      updateFilterOptions(cached);
      const filteredCached = applyTeamFilters(cached);
      renderTeams(filteredCached, {
        title: `Results for "${trimmed}"`,
        subtitle: `${filteredCached.length} teams found`,
        emptyMessage: 'No teams found. Try another search.'
      });
    }

    const cachedTeams = getCachedTeams();
    const semanticCached = getSemanticMatches(cachedTeams, trimmed);
    if (semanticCached.teams.length && !options.forceNetwork) {
      const rankedSemanticCached = rankTeamsByQuery(semanticCached.teams, trimmed);
      state.searchCache.set(cacheKey, rankedSemanticCached);
      state.lastResults = rankedSemanticCached;
      state.lastQuery = trimmed;
      updateFilterOptions(rankedSemanticCached);
      const filteredSemanticCached = applyTeamFilters(rankedSemanticCached);
      renderTeams(filteredSemanticCached, {
        title: `Results for "${trimmed}"`,
        subtitle: filteredSemanticCached.length ? `${filteredSemanticCached.length} teams found` : 'No matching teams yet',
        emptyMessage: 'No teams found. Try another search or adjust filters.'
      });
      renderSearchSuggestions(trimmed, filteredSemanticCached);
      if (semanticCached.context.isFacetQuery && rankedSemanticCached.length >= 24) {
        return;
      }
    }

    const searchQueries = buildSearchQueries(trimmed);
    const searchRequests = searchQueries.length
      ? searchQueries.map((query) => fetchSportsDb('searchteams.php', { t: query }))
      : [fetchSportsDb('searchteams.php', { t: trimmed })];
    const [searchResponses, fallbackTeams] = await Promise.all([
      Promise.allSettled(searchRequests),
      getFallbackTeams(trimmed)
    ]);

    if (seq !== state.searchSeq) return;

    const mapped = [];
    searchResponses.forEach((result) => {
      if (!result || result.status !== 'fulfilled') return;
      const payload = result.value;
      const teams = Array.isArray(payload?.teams) ? payload.teams : [];
      teams.map(mapTeam).filter(Boolean).forEach((team) => mapped.push(team));
    });
    let combined = dedupeTeams([...mapped, ...fallbackTeams]);
    combined = dedupeTeams([...combined, ...cachedTeams]);
    const sportConfig = getSportSearchConfig(trimmed);
    if (Array.isArray(sportConfig?.sportTokens) && sportConfig.sportTokens.length) {
      combined = filterTeamsBySportTokens(combined, sportConfig.sportTokens);
    }
    const semanticCombined = getSemanticMatches(combined, trimmed);
    const fuzzyMatches = combined.filter((team) => teamMatchesQuery(team, trimmed));
    const candidatePool = semanticCombined.teams.length
      ? dedupeTeams([...semanticCombined.teams, ...fuzzyMatches])
      : (fuzzyMatches.length ? fuzzyMatches : combined);
    const ranked = rankTeamsByQuery(candidatePool, trimmed);
    const teams = semanticCombined.teams.length
      ? ranked
      : ranked.filter((team) => teamMatchesQuery(team, trimmed));
    state.searchCache.set(cacheKey, teams);

    state.lastResults = teams;
    state.lastQuery = trimmed;
    updateFilterOptions(teams);
    const filteredTeams = applyTeamFilters(teams);

    if (!filteredTeams.length) {
      const suggestion = renderDidYouMean(trimmed, teams);
      if (suggestion) {
        const next = teams.filter((t) => normalizeSearchText(t?.name) === normalizeSearchText(suggestion));
        if (next.length) {
          renderTeams(next, {
            title: `Results for "${suggestion}"`,
            subtitle: `${next.length} teams found`,
            emptyMessage: 'No teams found. Try another search or adjust filters.'
          });
          renderSearchSuggestions(suggestion, next);
          return;
        }
      }
    }

    renderTeams(filteredTeams, {
      title: `Results for "${trimmed}"`,
      subtitle: filteredTeams.length ? `${filteredTeams.length} teams found` : 'No matching teams yet',
      emptyMessage: 'No teams found. Try another search or adjust filters.'
    });
    renderSearchSuggestions(trimmed, filteredTeams);
  }

  async function loadTeamById(teamId) {
    if (!teamId) return false;
    setLoading(true, 'Loading team details...');
    loadSportsAssetManifestFromStorage();
    const localTeam = sportsAssetManifestById.get(String(teamId).trim()) || null;
    if (localTeam) {
      setHeroTeam(localTeam);
      setActiveCard(localTeam.id);
      state.lastResults = [localTeam];
      state.lastQuery = '';
      updateFilterOptions([localTeam]);
      renderTeams([localTeam], {
        title: 'Team spotlight',
        subtitle: 'Save this team to your profile.',
        keepHero: true
      });
      return true;
    }
    const payload = await fetchSportsDb('lookupteam.php', { id: teamId });
    const teamRaw = Array.isArray(payload?.teams) ? payload.teams[0] : null;
    const team = mapTeam(teamRaw);
    if (!team) {
      setLoading(false);
      return false;
    }
    setHeroTeam(team);
    setActiveCard(team.id);
    state.lastResults = [team];
    state.lastQuery = '';
    updateFilterOptions([team]);
    renderTeams([team], {
      title: 'Team spotlight',
      subtitle: 'Save this team to your profile.',
      keepHero: true
    });
    return true;
  }

  async function hydrateLeagueIfNeeded() {
    const selectedLeague = String(ui.filterLeague?.value || ui.filterLeagueModal?.value || '').trim();
    if (!selectedLeague || selectedLeague.toLowerCase() === 'all') return false;
    const key = normalizeSearchText(selectedLeague);
    if (state.leagueTeamsCache.has(key)) return false;
    const teams = await loadLeagueTeams(selectedLeague).catch(() => []);
    if (!teams.length) return false;
    state.lastResults = dedupeTeams([...(state.lastResults || []), ...teams]);
    return true;
  }

  async function handleFilterChange() {
    clearSearchSuggestions();
    const list = Array.isArray(state.lastResults) ? state.lastResults : [];
    if (!list.length) {
      loadFeaturedTeams().catch(() => {});
      return;
    }

    const didHydrate = await hydrateLeagueIfNeeded().catch(() => false);
    const working = didHydrate ? (Array.isArray(state.lastResults) ? state.lastResults : list) : list;
    const filtered = applyTeamFilters(working);
    const title = state.lastQuery ? `Results for "${state.lastQuery}"` : 'All teams';
    const subtitle = state.lastQuery
      ? (filtered.length ? `${filtered.length} teams found` : 'No matching teams yet')
      : `${filtered.length} teams shown`;
    renderTeams(filtered, {
      title,
      subtitle,
      emptyMessage: 'No teams match your filters yet.'
    });
    if (state.lastQuery) {
      renderSearchSuggestions(state.lastQuery, filtered);
    }
  }

  function wireSearch() {
    if (ui.searchInput) {
      ui.searchInput.addEventListener('input', () => {
        renderSearchSuggestions(ui.searchInput.value);
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(() => {
          searchTeams(ui.searchInput.value).catch(() => {});
        }, 100);
      });

      ui.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          clearSearchSuggestions();
          searchTeams(ui.searchInput.value).catch(() => {});
          return;
        }
        if (event.key === 'Escape') {
          clearSearchSuggestions();
        }
      });

      ui.searchInput.addEventListener('focus', () => {
        renderSearchSuggestions(ui.searchInput.value);
      });
    }

    if (ui.searchBtn) {
      ui.searchBtn.addEventListener('click', () => {
        clearSearchSuggestions();
        searchTeams(ui.searchInput?.value || '').catch(() => {});
      });
    }

    if (ui.searchTags) {
      ui.searchTags.querySelectorAll('[data-team]').forEach((button) => {
        button.addEventListener('click', () => {
          const teamName = button.getAttribute('data-team') || '';
          if (ui.searchInput) ui.searchInput.value = teamName;
          clearSearchSuggestions();
          searchTeams(teamName).catch(() => {});
        });
      });
    }

    if (ui.heroSave) {
      ui.heroSave.addEventListener('click', () => {
        if (!state.heroTeam) return;
        toggleFavorite(state.heroTeam);
      });
    }

    if (ui.filterSport) {
      ui.filterSport.addEventListener('change', handleFilterChange);
    }
    if (ui.filterCountry) {
      ui.filterCountry.addEventListener('change', handleFilterChange);
    }
    if (ui.filterLeague) {
      ui.filterLeague.addEventListener('change', handleFilterChange);
    }
    if (!ui.filterSport && ui.filterSportModal) {
      ui.filterSportModal.addEventListener('change', handleFilterChange);
    }
    if (!ui.filterCountry && ui.filterCountryModal) {
      ui.filterCountryModal.addEventListener('change', handleFilterChange);
    }
    if (!ui.filterLeague && ui.filterLeagueModal) {
      ui.filterLeagueModal.addEventListener('change', handleFilterChange);
    }
    bindMirroredFilterSelect(ui.filterSport, ui.filterSportModal);
    bindMirroredFilterSelect(ui.filterCountry, ui.filterCountryModal);
    bindMirroredFilterSelect(ui.filterLeague, ui.filterLeagueModal);
    if (ui.filterToggleBtn) {
      ui.filterToggleBtn.addEventListener('click', () => {
        syncFilterSelectMirrors();
        openFilterModal();
      });
    }
    if (ui.filterCloseBtn) {
      ui.filterCloseBtn.addEventListener('click', closeFilterModal);
    }
    if (ui.filterModal) {
      ui.filterModal.addEventListener('click', (event) => {
        if (event.target === ui.filterModal) closeFilterModal();
      });
    }

    document.addEventListener('click', (event) => {
      if (event.target.closest('.sports-search-bar')) return;
      clearSearchSuggestions();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeFilterModal();
    });
  }

  async function init() {
    loadSportsAssetManifestFromStorage();
    void ensureSportsAssetManifest();
    await ensureSupabase();
    await initAuth();
    initListMenu();
    wireSearch();

    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('id');
    const teamName = params.get('team');

    if (teamId) {
      const loaded = await loadTeamById(teamId);
      if (!loaded) {
        await loadFeaturedTeams();
      }
      return;
    }

    if (teamName) {
      if (ui.searchInput) ui.searchInput.value = teamName;
      await searchTeams(teamName, { preserveUrl: true });
      return;
    }

    await loadFeaturedTeams();
  }

  init().catch(() => {
    setHeroTeam(null);
  });
})();

