(() => {
  const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
  const SPORTSDB_PROXY_BASE = String(window.ZO2Y_SPORTSDB_PROXY || '/api/sportsdb').trim() || '/api/sportsdb';
  const SPORTSDB_DIRECT_KEY = String(window.ZO2Y_SPORTSDB_KEY || '3').trim() || '3';
  const SPORTSDB_DIRECT_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_DIRECT_KEY}`;
  const FALLBACK_IMAGE = '/newlogo.webp';
  const FALLBACK_BADGE = '/file.svg';
  const SPORTS_LISTS_ENABLED = window.ZO2Y_SPORTS_LISTS === true;
  const SPORTS_FEATURED_CACHE_KEY = 'zo2y_sports_featured_cache_v1';
  const SPORTS_FEATURED_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
  const FALLBACK_LEAGUES = [
    'English Premier League',
    'Spanish La Liga',
    'Italian Serie A',
    'German Bundesliga',
    'French Ligue 1',
    'UEFA Champions League',
    'UEFA Europa League',
    'UEFA Europa Conference League',
    'CAF Champions League',
    'AFC Champions League',
    'Major League Soccer',
    'NWSL',
    'Portuguese Primeira Liga',
    'Dutch Eredivisie',
    'Scottish Premiership',
    'Turkish Super Lig',
    'Belgian Pro League',
    'Greek Super League',
    'Brazilian Serie A',
    'Argentine Primera Division',
    'Liga MX',
    'Egyptian Premier League',
    'Saudi Pro League',
    'Saudi Professional League',
    'Roshn Saudi League',
    'UAE Pro League',
    'Qatar Stars League',
    'Indian Super League',
    'J1 League',
    'K League 1',
    'NBA',
    'WNBA',
    'NFL',
    'MLB',
    'NHL',
    'NCAA Basketball',
    'NCAA Football',
    'Indian Premier League',
    'Big Bash League',
    'Pakistan Super League',
    'AFL',
    'National Rugby League',
    'Super Rugby',
    'Formula 1',
    'MotoGP'
  ];
  const SHORT_FALLBACK_LEAGUES = [
    'English Premier League',
    'Spanish La Liga',
    'Egyptian Premier League',
    'Saudi Pro League',
    'NBA',
    'NFL',
    'MLB',
    'Indian Premier League'
  ];
  const FEATURED_LEAGUES = [
    'English Premier League',
    'Spanish La Liga',
    'Saudi Pro League',
    'NBA',
    'NFL',
    'MLB',
    'Indian Premier League',
    'NHL'
  ];
  const SEED_TEAMS = [
    'Liverpool',
    'Real Madrid',
    'FC Barcelona',
    'Manchester City',
    'Bayern Munich',
    'Juventus',
    'Al Ahly',
    'Al Hilal',
    'Raja Casablanca',
    'Kaizer Chiefs',
    'Boca Juniors',
    'Flamengo',
    'LA Galaxy',
    'New Zealand All Blacks',
    'Mumbai Indians',
    'Chennai Super Kings',
    'Los Angeles Lakers',
    'Golden State Warriors',
    'New York Yankees',
    'Dallas Cowboys',
    'Toronto Maple Leafs',
    'New Zealand Warriors'
  ];
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
    soccer: [
      'English Premier League',
      'Spanish La Liga',
      'Italian Serie A',
      'German Bundesliga',
      'French Ligue 1',
      'Saudi Pro League',
      'Egyptian Premier League',
      'Major League Soccer',
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
    'roshn league': ['Roshn Saudi League', 'Saudi Pro League'],
    'premier league': ['English Premier League'],
    'epl': ['English Premier League'],
    'la liga': ['Spanish La Liga'],
    'serie a': ['Italian Serie A'],
    'bundesliga': ['German Bundesliga'],
    'ligue 1': ['French Ligue 1'],
    'mls': ['Major League Soccer'],
    'liga mx': ['Liga MX'],
    'ipl': ['Indian Premier League'],
    'nba': ['NBA'],
    'wnba': ['WNBA'],
    'nfl': ['NFL'],
    'mlb': ['MLB'],
    'nhl': ['NHL']
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
    teamMap: new Map(),
    searchTimer: null,
    searchSeq: 0,
    searchCache: new Map(),
    leagueTeamsCache: new Map(),
    leagueTeamsPending: new Map(),
    lastResults: [],
    lastQuery: ''
  };

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
    searchTags: document.getElementById('sportsSearchTags'),
    searchSuggest: document.getElementById('sportsSearchSuggest'),
    filterSport: document.getElementById('sportsFilterSport'),
    filterCountry: document.getElementById('sportsFilterCountry'),
    resultsTitle: document.getElementById('sportsResultsTitle'),
    resultsSubtitle: document.getElementById('sportsResultsSubtitle'),
    grid: document.getElementById('sportsGrid'),
    empty: document.getElementById('sportsEmpty'),
    loading: document.getElementById('sportsLoading'),
    toast: document.getElementById('sportsToast')
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
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
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
    const sport = normalizeFilterValue(ui.filterSport?.value || '');
    const country = normalizeFilterValue(ui.filterCountry?.value || '');
    return { sport, country };
  }

  function applyTeamFilters(teams) {
    const { sport, country } = getActiveFilters();
    if (!sport && !country) return Array.isArray(teams) ? teams : [];
    return (Array.isArray(teams) ? teams : []).filter((team) => {
      const teamSport = normalizeSearchText(team?.sport || '');
      const teamCountry = normalizeSearchText(team?.country || '');
      if (sport && !teamSport.includes(sport)) return false;
      if (country && !teamCountry.includes(country)) return false;
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

  function updateFilterOptions(teams) {
    const sports = new Set();
    const countries = new Set();
    (Array.isArray(teams) ? teams : []).forEach((team) => {
      const sport = String(team?.sport || '').trim();
      const country = String(team?.country || '').trim();
      if (sport) sports.add(sport);
      if (country) countries.add(country);
    });
    const sportList = Array.from(sports).sort((a, b) => a.localeCompare(b));
    const countryList = Array.from(countries).sort((a, b) => a.localeCompare(b));
    setSelectOptions(ui.filterSport, sportList, 'All sports', ui.filterSport?.value);
    setSelectOptions(ui.filterCountry, countryList, 'All countries', ui.filterCountry?.value);
  }

  function buildTeamSearchText(team) {
    if (!team) return '';
    const parts = [
      team.name,
      team.league,
      team.sport,
      team.country,
      team.stadium
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
    const words = haystack.split(' ').filter(Boolean);
    let matches = 0;
    tokens.forEach((token) => {
      if (!token) return;
      if (haystack.includes(token)) {
        matches += 1;
        return;
      }
      if (words.some((word) => word.startsWith(token))) {
        matches += 1;
      }
    });
    const minMatch = tokens.length <= 2 ? tokens.length : Math.max(2, Math.ceil(tokens.length * 0.6));
    return matches >= Math.min(tokens.length, minMatch);
  }

  function getCachedTeams() {
    const bucket = [];
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
      : rankTeamsByQuery(getCachedTeams().filter((team) => teamMatchesQuery(team, q)), q);
    const suggestions = applyTeamFilters(list).slice(0, 6);
    if (!suggestions.length) {
      clearSearchSuggestions();
      return;
    }
    ui.searchSuggest.innerHTML = suggestions.map((team) => {
      const meta = [team.league, team.country].filter(Boolean).join(' · ');
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
      const teams = Array.isArray(payload?.teams) ? payload.teams.map(mapTeam).filter(Boolean) : [];
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
    const leagues = pickFallbackLeagues(query).slice(0, 8);
    const responses = await Promise.all(leagues.map((league) => loadLeagueTeams(league)));
    const matches = [];
    responses.forEach((teams) => {
      (teams || []).forEach((team) => {
        if (teamMatchesQuery(team, query)) matches.push(team);
      });
    });
    return matches;
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
    ui.grid.querySelectorAll('.sports-card').forEach((card) => {
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

  function mapTeam(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.strTeam || '').trim();
    const rawId = String(raw.idTeam || '').trim();
    const sportsDbId = /^\d+$/.test(rawId) ? rawId : '';
    if (!name) return null;
    const team = {
      id: sportsDbId || name,
      sportsDbId,
      name,
      sport: String(raw.strSport || '').trim(),
      league: String(raw.strLeague || '').trim(),
      country: String(raw.strCountry || '').trim(),
      stadium: String(raw.strStadium || '').trim(),
      badge: toHttps(raw.strBadge || raw.strTeamBadge || raw.strLogo || raw.strTeamLogo || ''),
      banner: toHttps(raw.strBanner || raw.strTeamBanner || ''),
      fanart: toHttps(
        raw.strFanart1 || raw.strFanart2 || raw.strFanart3 || raw.strFanart4 ||
        raw.strTeamFanart1 || raw.strTeamFanart2 || raw.strTeamFanart3 || ''
      ),
      stadiumThumb: toHttps(raw.strStadiumThumb || ''),
      jersey: toHttps(raw.strEquipment || raw.strTeamJersey || '')
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
      const heroLogo = team.badge || team.jersey || FALLBACK_BADGE;
      ui.heroLogo.src = heroLogo;
      ui.heroLogo.alt = `${team.name} logo`;
      ui.heroLogo.referrerPolicy = 'no-referrer';
      ui.heroLogo.style.opacity = heroLogo ? '0.6' : '0.25';
    }
    if (ui.heroMeta) ui.heroMeta.innerHTML = metaHtml;

    const heroImage = team.fanart || team.stadiumThumb || team.banner || FALLBACK_IMAGE;
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

  function buildCard(team) {
    const card = document.createElement('article');
    card.className = 'sports-card';
    card.dataset.teamId = team.id;
    card.dataset.itemId = team.id;
    card.dataset.title = team.name;
    card.tabIndex = 0;

    const mediaImage = team.fanart || team.stadiumThumb || team.jersey || team.banner || team.badge || FALLBACK_IMAGE;
    const logo = team.badge || FALLBACK_BADGE;
    const usesBannerOnly = !team.fanart && !team.stadiumThumb && !team.jersey && !!team.banner;
    const usesBadgeOnly = !team.fanart && !team.stadiumThumb && !team.jersey && !team.banner && !!team.badge;
    const metaLine = [team.league, team.sport].filter(Boolean).join(' | ') || 'Team';
    const showMenu = SPORTS_LISTS_ENABLED && typeof window.openIndexStyleListMenu === 'function';
    card.dataset.subtitle = metaLine;
    card.dataset.image = mediaImage;
    card.dataset.listImage = logo;
    card.dataset.mediaFit = (usesBannerOnly || usesBadgeOnly) ? 'contain' : 'cover';

    card.innerHTML = `
      <div class="sports-card-media">
        <img src="${escapeHtml(mediaImage)}" alt="${escapeHtml(team.name)} banner" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />
      </div>
      <div class="sports-card-logo"><img src="${escapeHtml(logo)}" alt="${escapeHtml(team.name)} logo" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_BADGE}';" /></div>
      <div class="sports-card-body">
        <div class="sports-card-title">${escapeHtml(team.name)}</div>
        <div class="sports-card-meta">${escapeHtml(metaLine)}</div>
        ${team.stadium ? `<div class="sports-card-stadium"><i class="fas fa-location-dot"></i> ${escapeHtml(team.stadium)}</div>` : ''}
        <div class="sports-card-actions">
          ${showMenu ? `
            <button class="card-menu-btn" type="button" aria-label="Add to lists">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn && showMenu) {
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (typeof window.openIndexStyleListMenu === 'function') {
          window.openIndexStyleListMenu(card);
        }
      });
    }

    card.addEventListener('click', () => {
      navigateToTeam(team);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      navigateToTeam(team);
    });

    return card;
  }

  function renderTeams(teams, options = {}) {
    if (!ui.grid) return;
    const list = Array.isArray(teams) ? teams : [];
    ui.grid.innerHTML = '';
    state.teamMap.clear();

    if (ui.resultsTitle && options.title) ui.resultsTitle.textContent = options.title;
    if (ui.resultsSubtitle && options.subtitle) ui.resultsSubtitle.textContent = options.subtitle;

    if (!list.length) {
      if (ui.empty) {
        ui.empty.textContent = options.emptyMessage || 'No teams found. Try another search.';
        ui.empty.classList.add('visible');
      }
      setLoading(false);
      return;
    }

    if (ui.empty) ui.empty.classList.remove('visible');
    setLoading(false);

    const fragment = document.createDocumentFragment();
    list.forEach((team) => {
      state.teamMap.set(team.id, team);
      fragment.appendChild(buildCard(team));
    });
    ui.grid.appendChild(fragment);

    if (!options.keepHero && list.length) {
      setHeroTeam(list[0]);
      setActiveCard(list[0].id);
    }

    syncSavedButtons();
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
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        window.__ZO2Y_SUPABASE_CLIENT = state.supabase;
        return state.supabase;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
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
    const title = String(card.dataset.title || card.querySelector('.sports-card-title')?.textContent || id).trim();
    const subtitle = String(card.dataset.subtitle || card.querySelector('.sports-card-meta')?.textContent || '').trim();
    const [league, sport] = subtitle.split('|').map((value) => String(value || '').trim());
    const logo = String(card.dataset.listImage || card.querySelector('.sports-card-logo img')?.getAttribute('src') || '').trim();
    const banner = String(card.dataset.image || card.querySelector('.sports-card-media img')?.getAttribute('src') || '').trim();
    return {
      id,
      name: title || id,
      league: league || '',
      sport: sport || '',
      badge: logo,
      banner,
      fanart: banner
    };
  }

  function initListMenu() {
    if (!SPORTS_LISTS_ENABLED) return;
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: 'sports',
      getCurrentUser: () => state.currentUser,
      ensureClient: ensureSupabase,
      notify: (message, isError) => showToast(message, isError ? 'error' : 'info'),
      getItemFromCard: (card) => {
        const team = buildTeamFromCard(card);
        if (!team) return null;
        return {
          mediaType: 'sports',
          itemId: team.id,
          title: team.name,
          subtitle: [team.league, team.sport].filter(Boolean).join(' | '),
          image: team.badge || team.banner || ''
        };
      },
      getVisibleItemIds: () => {
        if (!ui.grid) return [];
        return Array.from(ui.grid.querySelectorAll('.sports-card'))
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
      banner_url: team.banner || null,
      stadium: team.stadium || null,
      stadium_url: team.stadiumThumb || null,
      jersey_url: team.jersey || null,
      fanart_url: team.fanart || null
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
    setLoading(true, 'Loading featured teams...');
    const cached = readSportsFeaturedCache().filter((team) => team && team.name);
    if (cached.length) {
      state.lastResults = cached;
      state.lastQuery = '';
      updateFilterOptions(cached);
      const filtered = applyTeamFilters(cached);
      renderTeams(filtered, {
        title: 'Featured teams',
        subtitle: 'Tap a team to see details and save it.',
        emptyMessage: 'No teams match your filters yet.'
      });
      return;
    }

    const picks = [];
    const seen = new Set();
    const leagues = FEATURED_LEAGUES.slice(0, 8);
    const responses = await Promise.allSettled(leagues.map((league) => loadLeagueTeams(league)));
    responses.forEach((result) => {
      if (picks.length >= 20) return;
      if (!result || result.status !== 'fulfilled') return;
      const teams = Array.isArray(result.value) ? result.value : [];
      shuffleArray(teams)
        .filter((team) => team?.badge)
        .slice(0, 4)
        .forEach((team) => {
          if (picks.length >= 20) return;
          if (seen.has(team.id)) return;
          seen.add(team.id);
          picks.push(team);
        });
    });

    if (picks.length < 12) {
      const seeds = SEED_TEAMS.slice(0, 12);
      const seedResponses = await Promise.allSettled(
        seeds.map((seed) => fetchSportsDb('searchteams.php', { t: seed }))
      );
      seedResponses.forEach((result) => {
        if (picks.length >= 20) return;
        if (!result || result.status !== 'fulfilled') return;
        const teamRaw = Array.isArray(result.value?.teams) ? result.value.teams[0] : null;
        const mapped = mapTeam(teamRaw);
        if (!mapped || !mapped.badge) return;
        if (seen.has(mapped.id)) return;
        seen.add(mapped.id);
        picks.push(mapped);
      });
    }

    if (picks.length) writeSportsFeaturedCache(picks);

    state.lastResults = picks;
    state.lastQuery = '';
    updateFilterOptions(picks);
    const filtered = applyTeamFilters(picks);

    renderTeams(filtered, {
      title: 'Featured teams',
      subtitle: 'Tap a team to see details and save it.',
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
    combined = dedupeTeams([...combined, ...getCachedTeams()]);
    const sportConfig = getSportSearchConfig(trimmed);
    if (Array.isArray(sportConfig?.sportTokens) && sportConfig.sportTokens.length) {
      combined = filterTeamsBySportTokens(combined, sportConfig.sportTokens);
    }

    const filtered = combined.filter((team) => teamMatchesQuery(team, trimmed));
    const ranked = rankTeamsByQuery(filtered.length ? filtered : combined, trimmed);
    const teams = ranked.filter((team) => teamMatchesQuery(team, trimmed));
    state.searchCache.set(cacheKey, teams);

    state.lastResults = teams;
    state.lastQuery = trimmed;
    updateFilterOptions(teams);
    const filteredTeams = applyTeamFilters(teams);

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

  function handleFilterChange() {
    clearSearchSuggestions();
    const list = Array.isArray(state.lastResults) ? state.lastResults : [];
    if (!list.length) {
      loadFeaturedTeams().catch(() => {});
      return;
    }
    const filtered = applyTeamFilters(list);
    const title = state.lastQuery ? `Results for "${state.lastQuery}"` : 'Featured teams';
    const subtitle = state.lastQuery
      ? (filtered.length ? `${filtered.length} teams found` : 'No matching teams yet')
      : 'Tap a team to see details and save it.';
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
        }, 220);
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

    document.addEventListener('click', (event) => {
      if (event.target.closest('.sports-search-bar')) return;
      clearSearchSuggestions();
    });
  }

  async function init() {
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
