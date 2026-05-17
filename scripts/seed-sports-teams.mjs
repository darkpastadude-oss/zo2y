import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.vercel',
  '.env.vercel.prod'
].map((file) => path.join(ROOT, file));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      env[key] = value;
    }
  });
  return env;
}

function hydrateEnv() {
  const merged = {};
  ENV_FILES.forEach((filePath) => {
    Object.assign(merged, loadEnvFile(filePath));
  });
  Object.entries(merged).forEach(([key, value]) => {
    if (!(key in process.env)) process.env[key] = value;
  });
}

function normalizeSupabaseUrl(value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `https://${value}.supabase.co`;
}

hydrateEnv();

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const teams = [
  // === ENGLISH PREMIER LEAGUE ===
  { name: 'Arsenal', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Emirates Stadium' },
  { name: 'Aston Villa', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Villa Park' },
  { name: 'Bournemouth', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Vitality Stadium' },
  { name: 'Brentford', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Gtech Community Stadium' },
  { name: 'Brighton', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Amex Stadium' },
  { name: 'Chelsea', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Stamford Bridge' },
  { name: 'Crystal Palace', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Selhurst Park' },
  { name: 'Everton', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Goodison Park' },
  { name: 'Fulham', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Craven Cottage' },
  { name: 'Ipswich Town', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Portman Road' },
  { name: 'Leicester City', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'King Power Stadium' },
  { name: 'Liverpool', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Anfield' },
  { name: 'Manchester City', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Etihad Stadium' },
  { name: 'Manchester United', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Old Trafford' },
  { name: 'Newcastle United', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'St James Park' },
  { name: 'Nottingham Forest', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'City Ground' },
  { name: 'Southampton', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'St Marys Stadium' },
  { name: 'Tottenham', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Tottenham Hotspur Stadium' },
  { name: 'West Ham', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'London Stadium' },
  { name: 'Wolverhampton Wanderers', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Molineux Stadium' },

  // === SPANISH LA LIGA ===
  { name: 'Real Madrid', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Santiago Bernabeu' },
  { name: 'Barcelona', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Camp Nou' },
  { name: 'Atletico Madrid', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Wanda Metropolitano' },
  { name: 'Athletic Bilbao', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'San Mames' },
  { name: 'Real Sociedad', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Anoeta Stadium' },
  { name: 'Villarreal', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Estadio de la Ceramica' },
  { name: 'Real Betis', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Benito Villamarin' },
  { name: 'Sevilla', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Ramon Sanchez Pizjuan' },
  { name: 'Valencia', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Mestalla' },
  { name: 'Girona', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Estadi Montilivi' },
  { name: 'Mallorca', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Son Moix' },
  { name: 'Osasuna', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'El Sadar' },
  { name: 'Getafe', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Coliseum Alfonso Perez' },
  { name: 'Celta Vigo', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Balaidos' },
  { name: 'Rayo Vallecano', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Campo de Futbol de Vallecas' },
  { name: 'Las Palmas', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Estadio Gran Canaria' },
  { name: 'Alaves', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Mendizorroza' },
  { name: 'Espanyol', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'RCDE Stadium' },
  { name: 'Real Valladolid', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Jose Zorrilla' },
  { name: 'Leganes', sport: 'Football', league: 'Spanish La Liga', country: 'Spain', stadium: 'Butarque' },

  // === GERMAN BUNDESLIGA ===
  { name: 'Bayern Munich', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Allianz Arena' },
  { name: 'Borussia Dortmund', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Signal Iduna Park' },
  { name: 'RB Leipzig', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Red Bull Arena' },
  { name: 'Bayer Leverkusen', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'BayArena' },
  { name: 'Eintracht Frankfurt', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Deutsche Bank Park' },
  { name: 'VfB Stuttgart', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'MHPArena' },
  { name: 'Freiburg', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Europa-Park Stadion' },
  { name: 'Wolfsburg', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Volkswagen Arena' },
  { name: 'Borussia Monchengladbach', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Borussia-Park' },
  { name: 'Union Berlin', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Stadion An der Alten Forsterei' },
  { name: 'Werder Bremen', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Weserstadion' },
  { name: 'Mainz 05', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Mewa Arena' },
  { name: 'Hoffenheim', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'PreZero Arena' },
  { name: 'FC Augsburg', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'WWK Arena' },
  { name: 'Heidenheim', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Voith-Arena' },
  { name: 'St Pauli', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Millerntor-Stadion' },
  { name: 'Holstein Kiel', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Holstein-Stadion' },
  { name: 'VfL Bochum', sport: 'Football', league: 'German Bundesliga', country: 'Germany', stadium: 'Vonovia Ruhrstadion' },

  // === ITALIAN SERIE A ===
  { name: 'Inter Milan', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'San Siro' },
  { name: 'AC Milan', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'San Siro' },
  { name: 'Juventus', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Allianz Stadium' },
  { name: 'Napoli', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Diego Armando Maradona' },
  { name: 'Roma', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Olimpico' },
  { name: 'Lazio', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Olimpico' },
  { name: 'Atalanta', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Gewiss Stadium' },
  { name: 'Fiorentina', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Artemio Franchi' },
  { name: 'Bologna', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Renato Dall Ara' },
  { name: 'Torino', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Olimpico Grande Torino' },
  { name: 'Udinese', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Dacia Arena' },
  { name: 'Genoa', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Luigi Ferraris' },
  { name: 'Sampdoria', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Luigi Ferraris' },
  { name: 'Monza', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'U-Power Stadium' },
  { name: 'Lecce', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Via del Mare' },
  { name: 'Cagliari', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Unipol Domus' },
  { name: 'Empoli', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Carlo Castellani' },
  { name: 'Parma', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Ennio Tardini' },
  { name: 'Como', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Giuseppe Sinigaglia' },
  { name: 'Venezia', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Pier Luigi Penzo' },

  // === FRENCH LIGUE 1 ===
  { name: 'PSG', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Parc des Princes' },
  { name: 'Marseille', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Orange Velodrome' },
  { name: 'Monaco', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Louis II' },
  { name: 'Lyon', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Groupama Stadium' },
  { name: 'Lille', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Pierre-Mauroy' },
  { name: 'Nice', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Allianz Riviera' },
  { name: 'Lens', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Bollaert-Delelis' },
  { name: 'Rennes', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Roazhon Park' },
  { name: 'Strasbourg', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade de la Meinau' },
  { name: 'Toulouse', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stadium de Toulouse' },
  { name: 'Montpellier', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade de la Mosson' },
  { name: 'Nantes', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade de la Beaujoire' },
  { name: 'Reims', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Auguste-Delaune' },
  { name: 'Brest', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Francis-Le Ble' },
  { name: 'Le Havre', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Oceane' },
  { name: 'Angers', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Raymond Kopa' },
  { name: 'Auxerre', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade de l Abbe-Deschamps' },
  { name: 'Saint-Etienne', sport: 'Football', league: 'French Ligue 1', country: 'France', stadium: 'Stade Geoffroy-Guichard' },

  // === UEFA CHAMPIONS LEAGUE (as a league entry) ===
  { name: 'Real Madrid', sport: 'Football', league: 'UEFA Champions League', country: 'Spain', stadium: 'Santiago Bernabeu' },
  { name: 'Barcelona', sport: 'Football', league: 'UEFA Champions League', country: 'Spain', stadium: 'Camp Nou' },
  { name: 'Bayern Munich', sport: 'Football', league: 'UEFA Champions League', country: 'Germany', stadium: 'Allianz Arena' },
  { name: 'Manchester City', sport: 'Football', league: 'UEFA Champions League', country: 'England', stadium: 'Etihad Stadium' },
  { name: 'Liverpool', sport: 'Football', league: 'UEFA Champions League', country: 'England', stadium: 'Anfield' },
  { name: 'Inter Milan', sport: 'Football', league: 'UEFA Champions League', country: 'Italy', stadium: 'San Siro' },
  { name: 'PSG', sport: 'Football', league: 'UEFA Champions League', country: 'France', stadium: 'Parc des Princes' },
  { name: 'Arsenal', sport: 'Football', league: 'UEFA Champions League', country: 'England', stadium: 'Emirates Stadium' },
  { name: 'Borussia Dortmund', sport: 'Football', league: 'UEFA Champions League', country: 'Germany', stadium: 'Signal Iduna Park' },
  { name: 'Juventus', sport: 'Football', league: 'UEFA Champions League', country: 'Italy', stadium: 'Allianz Stadium' },
  { name: 'AC Milan', sport: 'Football', league: 'UEFA Champions League', country: 'Italy', stadium: 'San Siro' },
  { name: 'Atletico Madrid', sport: 'Football', league: 'UEFA Champions League', country: 'Spain', stadium: 'Wanda Metropolitano' },
  { name: 'Napoli', sport: 'Football', league: 'UEFA Champions League', country: 'Italy', stadium: 'Stadio Diego Armando Maradona' },
  { name: 'Benfica', sport: 'Football', league: 'UEFA Champions League', country: 'Portugal', stadium: 'Estadio da Luz' },
  { name: 'Porto', sport: 'Football', league: 'UEFA Champions League', country: 'Portugal', stadium: 'Estadio do Dragao' },
  { name: 'Sporting CP', sport: 'Football', league: 'UEFA Champions League', country: 'Portugal', stadium: 'Jose Alvalade Stadium' },
  { name: 'Ajax', sport: 'Football', league: 'UEFA Champions League', country: 'Netherlands', stadium: 'Johan Cruyff Arena' },
  { name: 'PSV Eindhoven', sport: 'Football', league: 'UEFA Champions League', country: 'Netherlands', stadium: 'Philips Stadion' },
  { name: 'Feyenoord', sport: 'Football', league: 'UEFA Champions League', country: 'Netherlands', stadium: 'De Kuip' },
  { name: 'Celtic', sport: 'Football', league: 'UEFA Champions League', country: 'Scotland', stadium: 'Celtic Park' },
  { name: 'Club Brugge', sport: 'Football', league: 'UEFA Champions League', country: 'Belgium', stadium: 'Jan Breydel Stadium' },
  { name: 'Galatasaray', sport: 'Football', league: 'UEFA Champions League', country: 'Turkey', stadium: 'Rams Park' },
  { name: 'Fenerbahce', sport: 'Football', league: 'UEFA Champions League', country: 'Turkey', stadium: 'Sukru Saracoglu Stadium' },
  { name: 'Red Bull Salzburg', sport: 'Football', league: 'UEFA Champions League', country: 'Austria', stadium: 'Red Bull Arena' },
  { name: 'Shakhtar Donetsk', sport: 'Football', league: 'UEFA Champions League', country: 'Ukraine', stadium: 'Arena Lviv' },
  { name: 'Dinamo Zagreb', sport: 'Football', league: 'UEFA Champions League', country: 'Croatia', stadium: 'Stadion Maksimir' },
  { name: 'Young Boys', sport: 'Football', league: 'UEFA Champions League', country: 'Switzerland', stadium: 'Wankdorf Stadium' },

  // === BRAZILIAN SERIE A ===
  { name: 'Flamengo', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Maracana' },
  { name: 'Palmeiras', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Allianz Parque' },
  { name: 'Corinthians', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Neo Quimica Arena' },
  { name: 'Sao Paulo', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Morumbi' },
  { name: 'Santos', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Vila Belmiro' },
  { name: 'Atletico Mineiro', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Arena MRV' },
  { name: 'Cruzeiro', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Mineirao' },
  { name: 'Gremio', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Arena do Gremio' },
  { name: 'Internacional', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Beira-Rio' },
  { name: 'Botafogo', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Nilton Santos Stadium' },
  { name: 'Fluminense', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Maracana' },
  { name: 'Vasco da Gama', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Sao Januario' },
  { name: 'Bahia', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Arena Fonte Nova' },
  { name: 'Fortaleza', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Castelao' },
  { name: 'Athletico Paranaense', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Ligga Arena' },
  { name: 'Coritiba', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Couto Pereira' },
  { name: 'Atletico Goianiense', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Antonio Accioly' },
  { name: 'Bragantino', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Nabi Abi Chedid' },
  { name: 'Cuiaba', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Arena Pantanal' },
  { name: 'Juventude', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Alfredo Jaconi' },

  // === EGYPTIAN PREMIER LEAGUE ===
  { name: 'Al Ahly', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Al Ahly WE Stadium' },
  { name: 'Zamalek', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Cairo International Stadium' },
  { name: 'Pyramids FC', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: '30 June Stadium' },
  { name: 'Ismaily', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Ismailia Stadium' },
  { name: 'ENPPI', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Petrosport Stadium' },
  { name: 'Ceramica Cleopatra', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Suez Stadium' },
  { name: 'Future FC', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Al Salam Stadium' },
  { name: 'Al Masry', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Port Said Stadium' },
  { name: 'Smouha', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Alexandria Stadium' },
  { name: 'Ghazl El Mahalla', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Ghazl El Mahalla Stadium' },
  { name: 'National Bank of Egypt', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Suez Stadium' },
  { name: 'Pharco FC', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Al Salam Stadium' },
  { name: 'El Gouna', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'El Gouna Stadium' },
  { name: 'ZED FC', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Suez Stadium' },
  { name: 'Al Ittihad Alexandria', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Alexandria Stadium' },
  { name: 'Modern Sport', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Al Salam Stadium' },
  { name: 'Petrojet', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Suez Stadium' },
  { name: 'Baladiyat El Mahalla', sport: 'Football', league: 'Egyptian Premier League', country: 'Egypt', stadium: 'Ghazl El Mahalla Stadium' },

  // === NBA ===
  { name: 'Boston Celtics', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'TD Garden' },
  { name: 'Los Angeles Lakers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Crypto.com Arena' },
  { name: 'Golden State Warriors', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Chase Center' },
  { name: 'Milwaukee Bucks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Fiserv Forum' },
  { name: 'Denver Nuggets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Ball Arena' },
  { name: 'Phoenix Suns', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Footprint Center' },
  { name: 'Miami Heat', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Kaseya Center' },
  { name: 'Philadelphia 76ers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Wells Fargo Center' },
  { name: 'Dallas Mavericks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'American Airlines Center' },
  { name: 'Brooklyn Nets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Barclays Center' },
  { name: 'New York Knicks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Madison Square Garden' },
  { name: 'Chicago Bulls', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'United Center' },
  { name: 'Cleveland Cavaliers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Rocket Mortgage FieldHouse' },
  { name: 'Memphis Grizzlies', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'FedExForum' },
  { name: 'Los Angeles Clippers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Intuit Dome' },
  { name: 'Minnesota Timberwolves', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Target Center' },
  { name: 'Sacramento Kings', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Golden 1 Center' },
  { name: 'New Orleans Pelicans', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Smoothie King Center' },
  { name: 'Atlanta Hawks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'State Farm Arena' },
  { name: 'Indiana Pacers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Gainbridge Fieldhouse' },
  { name: 'Oklahoma City Thunder', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Paycom Center' },
  { name: 'Toronto Raptors', sport: 'Basketball', league: 'NBA', country: 'Canada', stadium: 'Scotiabank Arena' },
  { name: 'Orlando Magic', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Amway Center' },
  { name: 'San Antonio Spurs', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Frost Bank Center' },
  { name: 'Utah Jazz', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Delta Center' },
  { name: 'Portland Trail Blazers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Moda Center' },
  { name: 'Houston Rockets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Toyota Center' },
  { name: 'Washington Wizards', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Capital One Arena' },
  { name: 'Detroit Pistons', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Little Caesars Arena' },
  { name: 'Charlotte Hornets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Spectrum Center' },

  // === NFL ===
  { name: 'Kansas City Chiefs', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'GEHA Field at Arrowhead Stadium' },
  { name: 'San Francisco 49ers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: "Levi's Stadium" },
  { name: 'Dallas Cowboys', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'AT&T Stadium' },
  { name: 'Buffalo Bills', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Highmark Stadium' },
  { name: 'Philadelphia Eagles', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lincoln Financial Field' },
  { name: 'Baltimore Ravens', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'M&T Bank Stadium' },
  { name: 'Detroit Lions', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Ford Field' },
  { name: 'Miami Dolphins', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Hard Rock Stadium' },
  { name: 'Cincinnati Bengals', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Paycor Stadium' },
  { name: 'Green Bay Packers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lambeau Field' },
  { name: 'Minnesota Vikings', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'U.S. Bank Stadium' },
  { name: 'Los Angeles Rams', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'SoFi Stadium' },
  { name: 'Tampa Bay Buccaneers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Raymond James Stadium' },
  { name: 'Seattle Seahawks', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lumen Field' },
  { name: 'New England Patriots', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Gillette Stadium' },
  { name: 'Pittsburgh Steelers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Acrisure Stadium' },
  { name: 'Las Vegas Raiders', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Allegiant Stadium' },
  { name: 'New York Giants', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'MetLife Stadium' },
  { name: 'New York Jets', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'MetLife Stadium' },
  { name: 'Washington Commanders', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Northwest Stadium' },
  { name: 'Chicago Bears', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Soldier Field' },
  { name: 'Atlanta Falcons', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Mercedes-Benz Stadium' },
  { name: 'New Orleans Saints', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Caesars Superdome' },
  { name: 'Carolina Panthers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Bank of America Stadium' },
  { name: 'Los Angeles Chargers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'SoFi Stadium' },
  { name: 'Denver Broncos', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Empower Field at Mile High' },
  { name: 'Cleveland Browns', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Cleveland Browns Stadium' },
  { name: 'Indianapolis Colts', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lucas Oil Stadium' },
  { name: 'Houston Texans', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'NRG Stadium' },
  { name: 'Jacksonville Jaguars', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'EverBank Stadium' },
  { name: 'Tennessee Titans', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Nissan Stadium' },
  { name: 'Arizona Cardinals', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'State Farm Stadium' },

  // === MLB ===
  { name: 'New York Yankees', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Yankee Stadium' },
  { name: 'Los Angeles Dodgers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Dodger Stadium' },
  { name: 'Boston Red Sox', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Fenway Park' },
  { name: 'Chicago Cubs', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Wrigley Field' },
  { name: 'San Francisco Giants', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oracle Park' },
  { name: 'St Louis Cardinals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Busch Stadium' },
  { name: 'Atlanta Braves', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Truist Park' },
  { name: 'Houston Astros', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Minute Maid Park' },
  { name: 'Philadelphia Phillies', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Citizens Bank Park' },
  { name: 'San Diego Padres', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Petco Park' },
  { name: 'New York Mets', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Citi Field' },
  { name: 'Texas Rangers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Globe Life Field' },
  { name: 'Seattle Mariners', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'T-Mobile Park' },
  { name: 'Tampa Bay Rays', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Tropicana Field' },
  { name: 'Toronto Blue Jays', sport: 'Baseball', league: 'MLB', country: 'Canada', stadium: 'Rogers Centre' },
  { name: 'Baltimore Orioles', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oriole Park at Camden Yards' },
  { name: 'Cleveland Guardians', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Progressive Field' },
  { name: 'Minnesota Twins', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Target Field' },
  { name: 'Chicago White Sox', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Guaranteed Rate Field' },
  { name: 'Detroit Tigers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Comerica Park' },
  { name: 'Kansas City Royals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Kauffman Stadium' },
  { name: 'Milwaukee Brewers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'American Family Field' },
  { name: 'Cincinnati Reds', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Great American Ball Park' },
  { name: 'Pittsburgh Pirates', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'PNC Park' },
  { name: 'Arizona Diamondbacks', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Chase Field' },
  { name: 'Colorado Rockies', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Coors Field' },
  { name: 'Los Angeles Angels', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Angel Stadium' },
  { name: 'Oakland Athletics', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oakland Coliseum' },
  { name: 'Miami Marlins', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'LoanDepot Park' },
  { name: 'Washington Nationals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Nationals Park' },

  // === NHL ===
  { name: 'Edmonton Oilers', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Rogers Place' },
  { name: 'Florida Panthers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Amerant Bank Arena' },
  { name: 'Colorado Avalanche', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Ball Arena' },
  { name: 'Boston Bruins', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'TD Garden' },
  { name: 'Toronto Maple Leafs', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Scotiabank Arena' },
  { name: 'New York Rangers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Madison Square Garden' },
  { name: 'Carolina Hurricanes', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'PNC Arena' },
  { name: 'Dallas Stars', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'American Airlines Center' },
  { name: 'Vegas Golden Knights', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'T-Mobile Arena' },
  { name: 'Tampa Bay Lightning', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Amalie Arena' },
  { name: 'Winnipeg Jets', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Canada Life Centre' },
  { name: 'Vancouver Canucks', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Rogers Arena' },
  { name: 'Los Angeles Kings', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Crypto.com Arena' },
  { name: 'Nashville Predators', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Bridgestone Arena' },
  { name: 'Pittsburgh Penguins', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'PPG Paints Arena' },
  { name: 'Washington Capitals', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Capital One Arena' },
  { name: 'New Jersey Devils', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Prudential Center' },
  { name: 'Detroit Red Wings', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Little Caesars Arena' },
  { name: 'Minnesota Wild', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Xcel Energy Center' },
  { name: 'St Louis Blues', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Enterprise Center' },
  { name: 'Calgary Flames', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Scotiabank Saddledome' },
  { name: 'Ottawa Senators', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Canadian Tire Centre' },
  { name: 'Montreal Canadiens', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Bell Centre' },
  { name: 'Seattle Kraken', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Climate Pledge Arena' },
  { name: 'Philadelphia Flyers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Wells Fargo Center' },
  { name: 'Buffalo Sabres', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'KeyBank Center' },
  { name: 'New York Islanders', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'UBS Arena' },
  { name: 'Columbus Blue Jackets', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Nationwide Arena' },
  { name: 'Anaheim Ducks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Honda Center' },
  { name: 'San Jose Sharks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'SAP Center' },
  { name: 'Arizona Coyotes', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Mullett Arena' },
  { name: 'Chicago Blackhawks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'United Center' },

  // === FORMULA 1 (Teams/Constructors) ===
  { name: 'Red Bull Racing', sport: 'Motorsport', league: 'Formula 1', country: 'Austria', stadium: '' },
  { name: 'Ferrari', sport: 'Motorsport', league: 'Formula 1', country: 'Italy', stadium: '' },
  { name: 'Mercedes', sport: 'Motorsport', league: 'Formula 1', country: 'Germany', stadium: '' },
  { name: 'McLaren', sport: 'Motorsport', league: 'Formula 1', country: 'UK', stadium: '' },
  { name: 'Aston Martin', sport: 'Motorsport', league: 'Formula 1', country: 'UK', stadium: '' },
  { name: 'Alpine', sport: 'Motorsport', league: 'Formula 1', country: 'France', stadium: '' },
  { name: 'Williams', sport: 'Motorsport', league: 'Formula 1', country: 'UK', stadium: '' },
  { name: 'RB', sport: 'Motorsport', league: 'Formula 1', country: 'Italy', stadium: '' },
  { name: 'Kick Sauber', sport: 'Motorsport', league: 'Formula 1', country: 'Switzerland', stadium: '' },
  { name: 'Haas', sport: 'Motorsport', league: 'Formula 1', country: 'USA', stadium: '' },

  // === BOXING ASSOCIATIONS ===
  { name: 'WBC', sport: 'Boxing', league: 'World Boxing Council', country: 'Mexico', stadium: '' },
  { name: 'WBA', sport: 'Boxing', league: 'World Boxing Association', country: 'Panama', stadium: '' },
  { name: 'IBF', sport: 'Boxing', league: 'International Boxing Federation', country: 'USA', stadium: '' },
  { name: 'WBO', sport: 'Boxing', league: 'World Boxing Organization', country: 'Puerto Rico', stadium: '' },
  { name: 'Top Rank', sport: 'Boxing', league: 'Top Rank Boxing', country: 'USA', stadium: '' },
  { name: 'Golden Boy Promotions', sport: 'Boxing', league: 'Golden Boy Promotions', country: 'USA', stadium: '' },
  { name: 'Matchroom Boxing', sport: 'Boxing', league: 'Matchroom Boxing', country: 'UK', stadium: '' },
  { name: 'Queensberry Promotions', sport: 'Boxing', league: 'Queensberry Promotions', country: 'UK', stadium: '' },
  { name: 'PBC', sport: 'Boxing', league: 'Premier Boxing Champions', country: 'USA', stadium: '' },
  { name: 'MGB Promotions', sport: 'Boxing', league: 'MGB Promotions', country: 'UK', stadium: '' },
  { name: 'Wasserman Boxing', sport: 'Boxing', league: 'Wasserman Boxing', country: 'UK', stadium: '' },
  { name: 'Boxxer', sport: 'Boxing', league: 'Boxxer Promotions', country: 'UK', stadium: '' },

  // === UFC ===
  { name: 'UFC', sport: 'MMA', league: 'Ultimate Fighting Championship', country: 'USA', stadium: '' },

  // === KICKBOXING ASSOCIATIONS ===
  { name: 'Glory Kickboxing', sport: 'Kickboxing', league: 'Glory', country: 'Netherlands', stadium: '' },
  { name: 'ONE Championship', sport: 'Kickboxing', league: 'ONE Championship', country: 'Singapore', stadium: '' },
  { name: 'K-1', sport: 'Kickboxing', league: 'K-1', country: 'Japan', stadium: '' },
  { name: 'WAKO', sport: 'Kickboxing', league: 'World Association of Kickboxing Organizations', country: 'Austria', stadium: '' },
  { name: 'ISKA', sport: 'Kickboxing', league: 'International Sport Karate Association', country: 'USA', stadium: '' },
  { name: 'WMC', sport: 'Kickboxing', league: 'World Muaythai Council', country: 'Thailand', stadium: '' },
  { name: 'IFMA', sport: 'Kickboxing', league: 'International Federation of Muaythai Associations', country: 'Thailand', stadium: '' },
  { name: 'WKN', sport: 'Kickboxing', league: 'World Kickboxing Network', country: 'UK', stadium: '' },
  { name: 'Enfusion', sport: 'Kickboxing', league: 'Enfusion', country: 'Netherlands', stadium: '' },
  { name: 'Krush', sport: 'Kickboxing', league: 'Krush', country: 'Japan', stadium: '' },
];

async function seedTeams() {
  console.log(`Seeding ${teams.length} teams...`);

  const seen = new Set();
  const uniqueTeams = [];
  for (const team of teams) {
    const key = `${slugify(team.name)}|${slugify(team.league)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTeams.push({
      id: slugify(`${team.name}-${team.league}`),
      name: team.name,
      sport: team.sport,
      league: team.league,
      stadium: team.stadium || '',
      logo_url: '',
      banner_url: '',
      stadium_url: '',
      jersey_url: '',
      fanart_url: ''
    });
  }

  console.log(`Inserting ${uniqueTeams.length} unique teams...`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const team of uniqueTeams) {
    const { error } = await supabase
      .from('teams')
      .upsert(team, { onConflict: 'id' });

    if (error) {
      console.error(`Failed to insert ${team.name}:`, error.message);
      errors++;
    } else {
      success++;
    }
  }

  console.log(`Done! ${success} inserted, ${skipped} skipped, ${errors} errors`);
}

seedTeams().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
