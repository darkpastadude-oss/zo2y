(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || 'https://gfkhjbztayjyojsgdpgk.supabase.co';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const FALLBACK_BADGE = '/file.svg';
  const LOCAL_MANIFEST_URL = '/assets/sports-badges/local-manifest.json';
  const HOME_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
        <rect width='24' height='24' fill='#10224a'/>
      </svg>
    `)}`;

  const BADGE_OVERRIDES = {
    'atletico madrid': '/assets/sports-badges/atletico-madrid.png',
    'psg': '/assets/sports-badges/psg.png',
    'paris saint germain': '/assets/sports-badges/psg.png',
    'sao paulo': '/assets/sports-badges/s-o-paulo.png',
    'al hilal': '/assets/sports-badges/al-hilal.png',
    'al-hilal': '/assets/sports-badges/al-hilal.png',
    'al nassr': '/assets/sports-badges/al-nassr.png',
    'al ahly': '/assets/sports-badges/al-ahly.png',

    // National teams (common DB/Wiki variants)
    'usa': '/assets/sports-badges/united-states.svg',
    'united states of america': '/assets/sports-badges/united-states.svg',
    "cote d'ivoire": '/assets/sports-badges/ivory-coast.svg',
    'cote divoire': '/assets/sports-badges/ivory-coast.svg',
    'czech republic': '/assets/sports-badges/czech-republic.svg',
    'korea republic': '/assets/sports-badges/south-korea.png',
    'korea republic (south korea)': '/assets/sports-badges/south-korea.png',
    'iran ir': '/assets/sports-badges/iran.svg',
    'saudi': '/assets/sports-badges/saudi-arabia.svg',
    'uae': '/assets/sports-badges/uae.svg',
    'united arab emirates': '/assets/sports-badges/uae.svg',
    'dr congo': '/assets/sports-badges/dr-congo.svg',
    'd.r. congo': '/assets/sports-badges/dr-congo.svg',
    'republic of ireland': '/assets/sports-badges/republic-of-ireland.png',

    'ferrari': '/assets/sports-badges/scuderia-ferrari-hp.png',
    'scuderia ferrari hp': '/assets/sports-badges/scuderia-ferrari-hp.png',
    'red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
    'oracle red bull racing': '/assets/sports-badges/oracle-red-bull-racing.png',
    'mercedes': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
    'mercedes-amg petronas formula one team': '/assets/sports-badges/mercedes-amg-petronas-formula-one-team.png',
    'mclaren': '/assets/sports-badges/mclaren-formula-1-team.png',
    'mclaren formula 1 team': '/assets/sports-badges/mclaren-formula-1-team.png',
    'aston martin': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
    'aston martin aramco formula one team': '/assets/sports-badges/aston-martin-aramco-formula-one-team.png',
    'alpine': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
    'bwt alpine formula one team': '/assets/sports-badges/bwt-alpine-formula-one-team.png',
    'williams': '/assets/sports-badges/williams-racing.png',
    'williams racing': '/assets/sports-badges/williams-racing.png',
    'rb': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
    'racing bulls': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
    'visa cash app rb': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
    'visa cash app racing bulls': '/assets/sports-badges/visa-cash-app-racing-bulls-formula-one-team.png',
    'kick sauber': '/assets/sports-badges/kick-sauber.png',
    'stake f1 team kick sauber': '/assets/sports-badges/kick-sauber.png',
    'haas': '/assets/sports-badges/moneygram-haas-f1-team.png',
    'moneygram haas f1 team': '/assets/sports-badges/moneygram-haas-f1-team.png',
    'audi': '/assets/sports-badges/audi-revolut-f1-team.png',
    'audi revolut f1 team': '/assets/sports-badges/audi-revolut-f1-team.png',
    'cadillac': '/assets/sports-badges/cadillac-formula-1-team.png',
    'cadillac formula 1 team': '/assets/sports-badges/cadillac-formula-1-team.png'
  };

  const POPULAR_TEAMS = new Set([
    'real madrid', 'barcelona', 'liverpool', 'manchester city', 'manchester united',
    'arsenal', 'chelsea', 'bayern munich', 'borussia dortmund', 'paris saint germain',
    'inter milan', 'ac milan', 'juventus', 'napoli', 'atletico madrid',
    'los angeles lakers', 'boston celtics', 'golden state warriors', 'chicago bulls',
    'miami heat', 'milwaukee bucks', 'new york knicks', 'phoenix suns',
    'kansas city chiefs', 'dallas cowboys', 'san francisco 49ers',
    'philadelphia eagles', 'buffalo bills', 'green bay packers',
    'ferrari', 'mercedes', 'red bull racing', 'mclaren', 'aston martin',
    'new york yankees', 'los angeles dodgers', 'boston red sox', 'chicago cubs',
    'toronto maple leafs', 'montreal canadiens', 'boston bruins', 'edmonton oilers',
    'ufc', 'flamengo', 'boca juniors', 'river plate', 'al ahly', 'al hilal', 'al nassr',
    'brazil', 'argentina', 'germany', 'france', 'spain', 'england', 'italy',
    'portugal', 'netherlands', 'belgium', 'croatia', 'mexico', 'japan',
    'south korea', 'australia', 'united states', 'canada', 'morocco',
    'senegal', 'nigeria', 'egypt', 'tunisia', 'algeria', 'cameroon',
    'ghana', 'ivory coast', 'south africa', 'uruguay', 'colombia',
    'chile', 'peru', 'ecuador', 'saudi arabia', 'iran', 'qatar'
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
    'f1': 'formula 1'
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
    'netherlands': 'netherlands',
    'portugal': 'portugal',
    'japan': 'japan',
    'singapore': 'singapore'
  };

  const COUNTRY_BADGES = {
    'algeria': '/assets/sports-badges/algeria.svg',
    'argentina': '/assets/sports-badges/argentina.png',
    'australia': '/assets/sports-badges/australia.svg',
    'belgium': '/assets/sports-badges/belgium.png',
    'brazil': '/assets/sports-badges/brazil.png',
    'cameroon': '/assets/sports-badges/cameroon.svg',
    'canada': '/assets/sports-badges/canada.png',
    'chile': '/assets/sports-badges/chile.png',
    'colombia': '/assets/sports-badges/colombia.svg',
    'croatia': '/assets/sports-badges/croatia.png',
    "cote d'ivoire": '/assets/sports-badges/ivory-coast.svg',
    'ecuador': '/assets/sports-badges/ecuador.png',
    'egypt': '/assets/sports-badges/egypt.svg',
    'england': '/assets/sports-badges/england.png',
    'france': '/assets/sports-badges/france.png',
    'germany': '/assets/sports-badges/germany.png',
    'ghana': '/assets/sports-badges/ghana.svg',
    'iran': '/assets/sports-badges/iran.svg',
    'italy': '/assets/sports-badges/italy.png',
    'ivory coast': '/assets/sports-badges/ivory-coast.svg',
    'japan': '/assets/sports-badges/japan.png',
    'mexico': '/assets/sports-badges/mexico.png',
    'morocco': '/assets/sports-badges/morocco.svg',
    'netherlands': '/assets/sports-badges/netherlands.svg',
    'nigeria': '/assets/sports-badges/nigeria.png',
    'peru': '/assets/sports-badges/peru.png',
    'portugal': '/assets/sports-badges/portugal.png',
    'qatar': '/assets/sports-badges/qatar.svg',
    'saudi arabia': '/assets/sports-badges/saudi-arabia.svg',
    'senegal': '/assets/sports-badges/senegal.svg',
    'south africa': '/assets/sports-badges/south-africa.svg',
    'south korea': '/assets/sports-badges/south-korea.png',
    'spain': '/assets/sports-badges/spain.png',
    'tunisia': '/assets/sports-badges/tunisia.png',
    'united states': '/assets/sports-badges/united-states.svg',
    'uruguay': '/assets/sports-badges/uruguay.png'
  };

  const NATIONAL_TEAM_SET = new Set(Object.keys(COUNTRY_BADGES));

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
  let favorites = new Set();
  let imageObserver = null;

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
      const res = await fetch(LOCAL_MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return;
      localBadgeMap = await res.json();
      Object.entries(localBadgeMap).forEach(([name, path]) => {
        localBadgeMapLower[name.toLowerCase()] = path;
      });
    } catch (_) {}
  }

  function getBadge(team) {
    const nameKey = normalize(team.name);
    if (BADGE_OVERRIDES[nameKey]) return BADGE_OVERRIDES[nameKey];
    if (localBadgeMap[team.name]) return localBadgeMap[team.name];
    if (localBadgeMapLower[nameKey]) return localBadgeMapLower[nameKey];
    if (COUNTRY_BADGES[nameKey]) return COUNTRY_BADGES[nameKey];
    const match = Object.keys(localBadgeMapLower).find(c => nameKey.includes(c));
    if (match) return localBadgeMapLower[match];
    const countryMatch = Object.keys(COUNTRY_BADGES).find(c => nameKey.includes(c));
    if (countryMatch) return COUNTRY_BADGES[countryMatch];
    return FALLBACK_BADGE;
  }

  function resolveNationalCountry(nameKey, leagueKey) {
    const exact = resolveCountry(nameKey);
    if (NATIONAL_TEAM_SET.has(exact)) return exact;
    const partial = Object.keys(COUNTRY_BADGES).find(c => nameKey.includes(c));
    if (partial) return partial;
    if (leagueKey === 'national team') return nameKey;
    return exact;
  }

  function dedupeNationalTeams(teams) {
    const chosenByCountry = new Map();

    teams.forEach(team => {
      const nameKey = normalize(team.name);
      const leagueKey = normalize(team.league);
      const resolvedCountry = resolveNationalCountry(nameKey, leagueKey);
      if (!NATIONAL_TEAM_SET.has(resolvedCountry) && leagueKey !== 'national team') return;

      const existing = chosenByCountry.get(resolvedCountry);
      if (!existing) {
        chosenByCountry.set(resolvedCountry, team);
        return;
      }

      const existingScore = scoreTeam(existing);
      const nextScore = scoreTeam(team);
      if (nextScore > existingScore) chosenByCountry.set(resolvedCountry, team);
    });

    if (!chosenByCountry.size) return teams;

    const seen = new Set(chosenByCountry.values());
    const output = [];
    const countryAlreadyAdded = new Set();
    teams.forEach(team => {
      const nameKey = normalize(team.name);
      const leagueKey = normalize(team.league);
      const resolvedCountry = resolveNationalCountry(nameKey, leagueKey);
      if (!NATIONAL_TEAM_SET.has(resolvedCountry) && leagueKey !== 'national team') {
        output.push(team);
        return;
      }
      if (countryAlreadyAdded.has(resolvedCountry)) return;
      output.push(chosenByCountry.get(resolvedCountry));
      countryAlreadyAdded.add(resolvedCountry);
    });

    const removed = teams.length - output.length;
    if (removed > 0) console.log(`[sports] Deduped ${removed} national-team rows`);
    return output;
  }

  async function loadFavorites() {
    const client = ensureSupabase();
    if (!client || !currentUser) return;
    try {
      const { data: rows } = await client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', currentUser.id);
      favorites = new Set((rows || []).map(r => String(r.team_id)));
    } catch (_) {}
  }

  async function loadTeams() {
    const client = ensureSupabase();
    if (!client) return [];
    try {
      const { data, error, count } = await client
        .from('teams')
        .select('id,name,sport,league,stadium', { count: 'exact' })
        .order('name')
        .limit(5000);
      if (error) return [];
      const teams = (data || []).map(row => ({
        id: String(row.id || '').trim(),
        name: String(row.name || '').trim(),
        sport: String(row.sport || '').trim(),
        league: String(row.league || '').trim(),
        stadium: String(row.stadium || '').trim()
      })).filter(t => t.name);
      const deduped = dedupeNationalTeams(teams);
      console.log(`[sports] Loaded ${teams.length} teams (showing ${deduped.length})`);
      return deduped;
    } catch (err) {
      console.error('[sports] Load error:', err);
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
        await client.from('user_favorite_teams').delete()
          .eq('user_id', currentUser.id).eq('team_id', team.id);
        favorites.delete(team.id);
        showToast('Removed from favorites.');
      } else {
        await client.from('teams').upsert({
          id: team.id, name: team.name, sport: team.sport || null,
          league: team.league || null, logo_url: getBadge(team),
          stadium: team.stadium || null
        }, { onConflict: 'id' });
        await client.from('user_favorite_teams').upsert(
          { user_id: currentUser.id, team_id: team.id },
          { onConflict: 'user_id,team_id' }
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

  function getImageObserver() {
    if (imageObserver) return imageObserver;
    if (typeof window.IntersectionObserver !== 'function') return null;
    imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        observer.unobserve(img);
        const src = img.getAttribute('data-home-src');
        if (src) {
          img.removeAttribute('data-home-src');
          img.src = src;
        }
      });
    }, { rootMargin: '300px 0px', threshold: 0.01 });
    return imageObserver;
  }

  function primeImages(scope) {
    const root = scope || document;
    const images = Array.from(root.querySelectorAll('img[data-home-src]'));
    if (!images.length) return;
    const observer = getImageObserver();
    if (!observer) {
      images.forEach(img => {
        const src = img.getAttribute('data-home-src');
        if (src) { img.removeAttribute('data-home-src'); img.src = src; }
      });
      return;
    }
    images.forEach(img => observer.observe(img));
  }

  function wireImageState(scope) {
    const root = scope || document;
    root.querySelectorAll('img[data-home-image="1"]').forEach(img => {
      const wrap = img.closest('.card-media');
      const markReady = () => {
        img.setAttribute('data-image-ready', '1');
        if (wrap) wrap.classList.remove('is-loading-media');
      };
      const handleError = () => {
        const fallback = img.getAttribute('data-fallback-image');
        if (fallback && !img.src.endsWith(fallback)) {
          img.src = fallback;
        }
        markReady();
      };
      img.addEventListener('load', markReady);
      img.addEventListener('error', handleError);
      if (img.complete && !img.hasAttribute('data-home-src')) markReady();
    });
  }

  function createCard(team) {
    const badge = getBadge(team);
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
      <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
      <div class="card-media brand-cover is-loading-media">
        <img
          src="${HOME_IMAGE_PLACEHOLDER}"
          data-home-src="${escapeHtml(badge)}"
          data-fallback-image="${FALLBACK_BADGE}"
          data-home-image="1"
          data-image-ready="0"
          alt="${escapeHtml(title)} badge"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
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
    wireImageState(grid);
    primeImages(grid);
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
            await client.from('user_favorite_teams').delete()
              .eq('user_id', currentUser.id).eq('team_id', itemId);
            favorites.delete(itemId);
            return { ok: true, saved: false };
          }
          const team = allTeams.find(t => t.id === itemId) || {};
          await client.from('teams').upsert({
            id: itemId, name: team.name || '',
            sport: team.sport || null, league: team.league || null,
            logo_url: getBadge(team)
          }, { onConflict: 'id' });
          await client.from('user_favorite_teams').upsert(
            { user_id: currentUser.id, team_id: itemId },
            { onConflict: 'user_id,team_id' }
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

  async function boot() {
    wireEvents();
    await loadLocalManifest();
    const client = await ensureSupabase();
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
