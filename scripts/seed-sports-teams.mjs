import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env', '.env.local', '.env.vercel', '.env.vercel.prod'].map((file) => path.join(ROOT, file));

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
    if (!(key in process.env)) process.env[key] = value;
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
  // === ENGLISH PREMIER LEAGUE (20) ===
  { name: 'Arsenal', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Emirates Stadium' },
  { name: 'Aston Villa', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Villa Park' },
  { name: 'Bournemouth', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Vitality Stadium' },
  { name: 'Brentford', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Gtech Community Stadium' },
  { name: 'Brighton and Hove Albion', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Amex Stadium' },
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
  { name: 'Tottenham Hotspur', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Tottenham Hotspur Stadium' },
  { name: 'West Ham United', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'London Stadium' },
  { name: 'Wolverhampton Wanderers', sport: 'Football', league: 'English Premier League', country: 'England', stadium: 'Molineux Stadium' },

  // === SPANISH LA LIGA (20) ===
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

  // === GERMAN BUNDESLIGA (18) ===
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

  // === ITALIAN SERIE A (20) ===
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
  { name: 'Monza', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'U-Power Stadium' },
  { name: 'Lecce', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Via del Mare' },
  { name: 'Cagliari', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Unipol Domus' },
  { name: 'Empoli', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Carlo Castellani' },
  { name: 'Parma', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Ennio Tardini' },
  { name: 'Como', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Giuseppe Sinigaglia' },
  { name: 'Venezia', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Pier Luigi Penzo' },
  { name: 'Hellas Verona', sport: 'Football', league: 'Italian Serie A', country: 'Italy', stadium: 'Stadio Marcantonio Bentegodi' },

  // === FRENCH LIGUE 1 (18) ===
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

  // === BRAZILIAN SERIE A (20) ===
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
  { name: 'Bragantino', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Nabi Abi Chedid' },
  { name: 'Cuiaba', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Arena Pantanal' },
  { name: 'Juventude', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Alfredo Jaconi' },
  { name: 'Atletico Goianiense', sport: 'Football', league: 'Brazilian Serie A', country: 'Brazil', stadium: 'Antonio Accioly' },

  // === ARGENTINA PRIMERA DIVISION (28) ===
  { name: 'Boca Juniors', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'La Bombonera' },
  { name: 'River Plate', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Monumental' },
  { name: 'Racing Club', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Presidente Peron' },
  { name: 'Independiente', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Libertadores de America' },
  { name: 'San Lorenzo', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Pedro Bidegain' },
  { name: 'Velez Sarsfield', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Jose Amalfitani' },
  { name: 'Estudiantes', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Jorge Luis Hirschi' },
  { name: 'Gimnasia La Plata', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Juan Carmelo Zerillo' },
  { name: 'Lanus', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Ciudad de Lanus' },
  { name: 'Argentinos Juniors', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Diego Armando Maradona' },
  { name: 'Huracan', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Tomas Adolfo Duco' },
  { name: 'Newells Old Boys', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Marcelo Bielsa' },
  { name: 'Rosario Central', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Gigante de Arroyito' },
  { name: 'Talleres', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Mario Alberto Kempes' },
  { name: 'Belgrano', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Julio Cesar Villagra' },
  { name: 'Banfield', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Florencio Sola' },
  { name: 'Defensa y Justicia', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Norberto Tomaghello' },
  { name: 'Godoy Cruz', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Malvinas Argentinas' },
  { name: 'Instituto', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Juan Domingo Peron' },
  { name: 'Platense', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Ciudad de Vicente Lopez' },
  { name: 'Sarmiento', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Eva Peron' },
  { name: 'Tigre', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Jose Dellagiovanna' },
  { name: 'Union Santa Fe', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio 15 de Abril' },
  { name: 'Central Cordoba', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Alfredo Terrera' },
  { name: 'Atletico Tucuman', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Monumental Jose Fierro' },
  { name: 'Barracas Central', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Claudio Chiqui Tapia' },
  { name: 'Deportivo Riestra', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Guillermo Laza' },
  { name: 'Independiente Rivadavia', sport: 'Football', league: 'Argentina Primera Division', country: 'Argentina', stadium: 'Estadio Bautista Gargantini' },

  // === EGYPTIAN PREMIER LEAGUE (18) ===
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

  // === SAUDI PRO LEAGUE (18) ===
  { name: 'Al Hilal', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Fahd International Stadium' },
  { name: 'Al Nassr', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Al-Awwal Park' },
  { name: 'Al Ahli', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Abdullah Sports City' },
  { name: 'Al Ittihad', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Abdullah Sports City' },
  { name: 'Al Shabab', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Faisal bin Fahd Stadium' },
  { name: 'Al Raed', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Abdullah Sport City Stadium' },
  { name: 'Al Fateh', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Abdullah bin Jalawi Stadium' },
  { name: 'Al Taawoun', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Abdullah Sport City Stadium' },
  { name: 'Al Feiha', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Al Majmaah Sports City' },
  { name: 'Al Khaleej', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Mohamed bin Fahd Stadium' },
  { name: 'Al Riyadh', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Turki bin Abdulaziz Stadium' },
  { name: 'Al Qadsiah', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Saud bin Jalawi Stadium' },
  { name: 'Damac', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Sultan bin Abdulaziz Stadium' },
  { name: 'Al Okhdood', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Hathloul bin Abdulaziz Stadium' },
  { name: 'Al Wehda', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'King Abdulaziz Stadium' },
  { name: 'Al Tai', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Al Tayar Stadium' },
  { name: 'Abha', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Prince Sultan bin Abdulaziz Stadium' },
  { name: 'Al Hazem', sport: 'Football', league: 'Saudi Pro League', country: 'Saudi Arabia', stadium: 'Al Hazem Club Stadium' },

  // === NATIONAL FOOTBALL TEAMS ===
  { name: 'Argentina', sport: 'Football', league: 'National Team', country: 'Argentina', stadium: '' },
  { name: 'Brazil', sport: 'Football', league: 'National Team', country: 'Brazil', stadium: '' },
  { name: 'Germany', sport: 'Football', league: 'National Team', country: 'Germany', stadium: '' },
  { name: 'France', sport: 'Football', league: 'National Team', country: 'France', stadium: '' },
  { name: 'Spain', sport: 'Football', league: 'National Team', country: 'Spain', stadium: '' },
  { name: 'Italy', sport: 'Football', league: 'National Team', country: 'Italy', stadium: '' },
  { name: 'England', sport: 'Football', league: 'National Team', country: 'England', stadium: '' },
  { name: 'Portugal', sport: 'Football', league: 'National Team', country: 'Portugal', stadium: '' },
  { name: 'Netherlands', sport: 'Football', league: 'National Team', country: 'Netherlands', stadium: '' },
  { name: 'Belgium', sport: 'Football', league: 'National Team', country: 'Belgium', stadium: '' },
  { name: 'Croatia', sport: 'Football', league: 'National Team', country: 'Croatia', stadium: '' },
  { name: 'Uruguay', sport: 'Football', league: 'National Team', country: 'Uruguay', stadium: '' },
  { name: 'Mexico', sport: 'Football', league: 'National Team', country: 'Mexico', stadium: '' },
  { name: 'USA', sport: 'Football', league: 'National Team', country: 'USA', stadium: '' },
  { name: 'Japan', sport: 'Football', league: 'National Team', country: 'Japan', stadium: '' },
  { name: 'South Korea', sport: 'Football', league: 'National Team', country: 'South Korea', stadium: '' },
  { name: 'Australia', sport: 'Football', league: 'National Team', country: 'Australia', stadium: '' },
  { name: 'Morocco', sport: 'Football', league: 'National Team', country: 'Morocco', stadium: '' },
  { name: 'Senegal', sport: 'Football', league: 'National Team', country: 'Senegal', stadium: '' },
  { name: 'Switzerland', sport: 'Football', league: 'National Team', country: 'Switzerland', stadium: '' },
  { name: 'Poland', sport: 'Football', league: 'National Team', country: 'Poland', stadium: '' },
  { name: 'Denmark', sport: 'Football', league: 'National Team', country: 'Denmark', stadium: '' },
  { name: 'Sweden', sport: 'Football', league: 'National Team', country: 'Sweden', stadium: '' },
  { name: 'Colombia', sport: 'Football', league: 'National Team', country: 'Colombia', stadium: '' },
  { name: 'Chile', sport: 'Football', league: 'National Team', country: 'Chile', stadium: '' },
  { name: 'Ecuador', sport: 'Football', league: 'National Team', country: 'Ecuador', stadium: '' },
  { name: 'Peru', sport: 'Football', league: 'National Team', country: 'Peru', stadium: '' },
  { name: 'Paraguay', sport: 'Football', league: 'National Team', country: 'Paraguay', stadium: '' },
  { name: 'Bolivia', sport: 'Football', league: 'National Team', country: 'Bolivia', stadium: '' },
  { name: 'Venezuela', sport: 'Football', league: 'National Team', country: 'Venezuela', stadium: '' },
  { name: 'Egypt', sport: 'Football', league: 'National Team', country: 'Egypt', stadium: '' },
  { name: 'Nigeria', sport: 'Football', league: 'National Team', country: 'Nigeria', stadium: '' },
  { name: 'Ghana', sport: 'Football', league: 'National Team', country: 'Ghana', stadium: '' },
  { name: 'Ivory Coast', sport: 'Football', league: 'National Team', country: 'Ivory Coast', stadium: '' },
  { name: 'Cameroon', sport: 'Football', league: 'National Team', country: 'Cameroon', stadium: '' },
  { name: 'Algeria', sport: 'Football', league: 'National Team', country: 'Algeria', stadium: '' },
  { name: 'Tunisia', sport: 'Football', league: 'National Team', country: 'Tunisia', stadium: '' },
  { name: 'Saudi Arabia', sport: 'Football', league: 'National Team', country: 'Saudi Arabia', stadium: '' },
  { name: 'Iran', sport: 'Football', league: 'National Team', country: 'Iran', stadium: '' },
  { name: 'China', sport: 'Football', league: 'National Team', country: 'China', stadium: '' },
  { name: 'Canada', sport: 'Football', league: 'National Team', country: 'Canada', stadium: '' },
  { name: 'Costa Rica', sport: 'Football', league: 'National Team', country: 'Costa Rica', stadium: '' },
  { name: 'Panama', sport: 'Football', league: 'National Team', country: 'Panama', stadium: '' },
  { name: 'Jamaica', sport: 'Football', league: 'National Team', country: 'Jamaica', stadium: '' },
  { name: 'Wales', sport: 'Football', league: 'National Team', country: 'Wales', stadium: '' },
  { name: 'Scotland', sport: 'Football', league: 'National Team', country: 'Scotland', stadium: '' },
  { name: 'Northern Ireland', sport: 'Football', league: 'National Team', country: 'Northern Ireland', stadium: '' },
  { name: 'Republic of Ireland', sport: 'Football', league: 'National Team', country: 'Republic of Ireland', stadium: '' },
  { name: 'Austria', sport: 'Football', league: 'National Team', country: 'Austria', stadium: '' },
  { name: 'Czech Republic', sport: 'Football', league: 'National Team', country: 'Czech Republic', stadium: '' },
  { name: 'Ukraine', sport: 'Football', league: 'National Team', country: 'Ukraine', stadium: '' },
  { name: 'Russia', sport: 'Football', league: 'National Team', country: 'Russia', stadium: '' },
  { name: 'Turkey', sport: 'Football', league: 'National Team', country: 'Turkey', stadium: '' },
  { name: 'Greece', sport: 'Football', league: 'National Team', country: 'Greece', stadium: '' },
  { name: 'Serbia', sport: 'Football', league: 'National Team', country: 'Serbia', stadium: '' },
  { name: 'Slovakia', sport: 'Football', league: 'National Team', country: 'Slovakia', stadium: '' },
  { name: 'Slovenia', sport: 'Football', league: 'National Team', country: 'Slovenia', stadium: '' },
  { name: 'Norway', sport: 'Football', league: 'National Team', country: 'Norway', stadium: '' },
  { name: 'Finland', sport: 'Football', league: 'National Team', country: 'Finland', stadium: '' },
  { name: 'Iceland', sport: 'Football', league: 'National Team', country: 'Iceland', stadium: '' },
  { name: 'Hungary', sport: 'Football', league: 'National Team', country: 'Hungary', stadium: '' },
  { name: 'Romania', sport: 'Football', league: 'National Team', country: 'Romania', stadium: '' },
  { name: 'Bulgaria', sport: 'Football', league: 'National Team', country: 'Bulgaria', stadium: '' },
  { name: 'Albania', sport: 'Football', league: 'National Team', country: 'Albania', stadium: '' },
  { name: 'North Macedonia', sport: 'Football', league: 'National Team', country: 'North Macedonia', stadium: '' },
  { name: 'Bosnia and Herzegovina', sport: 'Football', league: 'National Team', country: 'Bosnia and Herzegovina', stadium: '' },
  { name: 'Montenegro', sport: 'Football', league: 'National Team', country: 'Montenegro', stadium: '' },
  { name: 'Kosovo', sport: 'Football', league: 'National Team', country: 'Kosovo', stadium: '' },
  { name: 'Belarus', sport: 'Football', league: 'National Team', country: 'Belarus', stadium: '' },
  { name: 'Moldova', sport: 'Football', league: 'National Team', country: 'Moldova', stadium: '' },
  { name: 'Georgia', sport: 'Football', league: 'National Team', country: 'Georgia', stadium: '' },
  { name: 'Armenia', sport: 'Football', league: 'National Team', country: 'Armenia', stadium: '' },
  { name: 'Azerbaijan', sport: 'Football', league: 'National Team', country: 'Azerbaijan', stadium: '' },
  { name: 'Kazakhstan', sport: 'Football', league: 'National Team', country: 'Kazakhstan', stadium: '' },
  { name: 'Uzbekistan', sport: 'Football', league: 'National Team', country: 'Uzbekistan', stadium: '' },
  { name: 'Iraq', sport: 'Football', league: 'National Team', country: 'Iraq', stadium: '' },
  { name: 'Syria', sport: 'Football', league: 'National Team', country: 'Syria', stadium: '' },
  { name: 'Jordan', sport: 'Football', league: 'National Team', country: 'Jordan', stadium: '' },
  { name: 'Lebanon', sport: 'Football', league: 'National Team', country: 'Lebanon', stadium: '' },
  { name: 'Oman', sport: 'Football', league: 'National Team', country: 'Oman', stadium: '' },
  { name: 'Qatar', sport: 'Football', league: 'National Team', country: 'Qatar', stadium: '' },
  { name: 'UAE', sport: 'Football', league: 'National Team', country: 'United Arab Emirates', stadium: '' },
  { name: 'India', sport: 'Football', league: 'National Team', country: 'India', stadium: '' },
  { name: 'Pakistan', sport: 'Football', league: 'National Team', country: 'Pakistan', stadium: '' },
  { name: 'Bangladesh', sport: 'Football', league: 'National Team', country: 'Bangladesh', stadium: '' },
  { name: 'Indonesia', sport: 'Football', league: 'National Team', country: 'Indonesia', stadium: '' },
  { name: 'Thailand', sport: 'Football', league: 'National Team', country: 'Thailand', stadium: '' },
  { name: 'Vietnam', sport: 'Football', league: 'National Team', country: 'Vietnam', stadium: '' },
  { name: 'Malaysia', sport: 'Football', league: 'National Team', country: 'Malaysia', stadium: '' },
  { name: 'Singapore', sport: 'Football', league: 'National Team', country: 'Singapore', stadium: '' },
  { name: 'Philippines', sport: 'Football', league: 'National Team', country: 'Philippines', stadium: '' },
  { name: 'New Zealand', sport: 'Football', league: 'National Team', country: 'New Zealand', stadium: '' },
  { name: 'Fiji', sport: 'Football', league: 'National Team', country: 'Fiji', stadium: '' },
  { name: 'Papua New Guinea', sport: 'Football', league: 'National Team', country: 'Papua New Guinea', stadium: '' },
  { name: 'Solomon Islands', sport: 'Football', league: 'National Team', country: 'Solomon Islands', stadium: '' },
  { name: 'Vanuatu', sport: 'Football', league: 'National Team', country: 'Vanuatu', stadium: '' },
  { name: 'Tahiti', sport: 'Football', league: 'National Team', country: 'Tahiti', stadium: '' },
  { name: 'South Africa', sport: 'Football', league: 'National Team', country: 'South Africa', stadium: '' },
  { name: 'Zambia', sport: 'Football', league: 'National Team', country: 'Zambia', stadium: '' },
  { name: 'Zimbabwe', sport: 'Football', league: 'National Team', country: 'Zimbabwe', stadium: '' },
  { name: 'Kenya', sport: 'Football', league: 'National Team', country: 'Kenya', stadium: '' },
  { name: 'Ethiopia', sport: 'Football', league: 'National Team', country: 'Ethiopia', stadium: '' },
  { name: 'Tanzania', sport: 'Football', league: 'National Team', country: 'Tanzania', stadium: '' },
  { name: 'Uganda', sport: 'Football', league: 'National Team', country: 'Uganda', stadium: '' },
  { name: 'DR Congo', sport: 'Football', league: 'National Team', country: 'DR Congo', stadium: '' },
  { name: 'Mozambique', sport: 'Football', league: 'National Team', country: 'Mozambique', stadium: '' },
  { name: 'Angola', sport: 'Football', league: 'National Team', country: 'Angola', stadium: '' },
  { name: 'Gabon', sport: 'Football', league: 'National Team', country: 'Gabon', stadium: '' },
  { name: 'Guinea', sport: 'Football', league: 'National Team', country: 'Guinea', stadium: '' },
  { name: 'Mali', sport: 'Football', league: 'National Team', country: 'Mali', stadium: '' },
  { name: 'Burkina Faso', sport: 'Football', league: 'National Team', country: 'Burkina Faso', stadium: '' },
  { name: 'Niger', sport: 'Football', league: 'National Team', country: 'Niger', stadium: '' },
  { name: 'Chad', sport: 'Football', league: 'National Team', country: 'Chad', stadium: '' },
  { name: 'Sudan', sport: 'Football', league: 'National Team', country: 'Sudan', stadium: '' },
  { name: 'Libya', sport: 'Football', league: 'National Team', country: 'Libya', stadium: '' },
  { name: 'Togo', sport: 'Football', league: 'National Team', country: 'Togo', stadium: '' },
  { name: 'Benin', sport: 'Football', league: 'National Team', country: 'Benin', stadium: '' },
  { name: 'Cape Verde', sport: 'Football', league: 'National Team', country: 'Cape Verde', stadium: '' },
  { name: 'Equatorial Guinea', sport: 'Football', league: 'National Team', country: 'Equatorial Guinea', stadium: '' },
  { name: 'Central African Republic', sport: 'Football', league: 'National Team', country: 'Central African Republic', stadium: '' },
  { name: 'Congo', sport: 'Football', league: 'National Team', country: 'Congo', stadium: '' },
  { name: 'Gambia', sport: 'Football', league: 'National Team', country: 'Gambia', stadium: '' },
  { name: 'Guinea-Bissau', sport: 'Football', league: 'National Team', country: 'Guinea-Bissau', stadium: '' },
  { name: 'Sierra Leone', sport: 'Football', league: 'National Team', country: 'Sierra Leone', stadium: '' },
  { name: 'Liberia', sport: 'Football', league: 'National Team', country: 'Liberia', stadium: '' },
  { name: 'Sao Tome and Principe', sport: 'Football', league: 'National Team', country: 'Sao Tome and Principe', stadium: '' },
  { name: 'Cuba', sport: 'Football', league: 'National Team', country: 'Cuba', stadium: '' },
  { name: 'Haiti', sport: 'Football', league: 'National Team', country: 'Haiti', stadium: '' },
  { name: 'Dominican Republic', sport: 'Football', league: 'National Team', country: 'Dominican Republic', stadium: '' },
  { name: 'Trinidad and Tobago', sport: 'Football', league: 'National Team', country: 'Trinidad and Tobago', stadium: '' },
  { name: 'Barbados', sport: 'Football', league: 'National Team', country: 'Barbados', stadium: '' },
  { name: 'Bahamas', sport: 'Football', league: 'National Team', country: 'Bahamas', stadium: '' },
  { name: 'Honduras', sport: 'Football', league: 'National Team', country: 'Honduras', stadium: '' },
  { name: 'El Salvador', sport: 'Football', league: 'National Team', country: 'El Salvador', stadium: '' },
  { name: 'Guatemala', sport: 'Football', league: 'National Team', country: 'Guatemala', stadium: '' },
  { name: 'Nicaragua', sport: 'Football', league: 'National Team', country: 'Nicaragua', stadium: '' },
  { name: 'Curacao', sport: 'Football', league: 'National Team', country: 'Curacao', stadium: '' },
  { name: 'Suriname', sport: 'Football', league: 'National Team', country: 'Suriname', stadium: '' },
  { name: 'Guyana', sport: 'Football', league: 'National Team', country: 'Guyana', stadium: '' },
  { name: 'Belize', sport: 'Football', league: 'National Team', country: 'Belize', stadium: '' },
  { name: 'Grenada', sport: 'Football', league: 'National Team', country: 'Grenada', stadium: '' },
  { name: 'Saint Kitts and Nevis', sport: 'Football', league: 'National Team', country: 'Saint Kitts and Nevis', stadium: '' },
  { name: 'Saint Lucia', sport: 'Football', league: 'National Team', country: 'Saint Lucia', stadium: '' },
  { name: 'Saint Vincent and the Grenadines', sport: 'Football', league: 'National Team', country: 'Saint Vincent and the Grenadines', stadium: '' },
  { name: 'Antigua and Barbuda', sport: 'Football', league: 'National Team', country: 'Antigua and Barbuda', stadium: '' },
  { name: 'Dominica', sport: 'Football', league: 'National Team', country: 'Dominica', stadium: '' },
  { name: 'Bermuda', sport: 'Football', league: 'National Team', country: 'Bermuda', stadium: '' },
  { name: 'Cayman Islands', sport: 'Football', league: 'National Team', country: 'Cayman Islands', stadium: '' },
  { name: 'Turks and Caicos Islands', sport: 'Football', league: 'National Team', country: 'Turks and Caicos Islands', stadium: '' },
  { name: 'British Virgin Islands', sport: 'Football', league: 'National Team', country: 'British Virgin Islands', stadium: '' },
  { name: 'US Virgin Islands', sport: 'Football', league: 'National Team', country: 'US Virgin Islands', stadium: '' },
  { name: 'Anguilla', sport: 'Football', league: 'National Team', country: 'Anguilla', stadium: '' },
  { name: 'Montserrat', sport: 'Football', league: 'National Team', country: 'Montserrat', stadium: '' },
  { name: 'Puerto Rico', sport: 'Football', league: 'National Team', country: 'Puerto Rico', stadium: '' },
  { name: 'American Samoa', sport: 'Football', league: 'National Team', country: 'American Samoa', stadium: '' },
  { name: 'Samoa', sport: 'Football', league: 'National Team', country: 'Samoa', stadium: '' },
  { name: 'Tonga', sport: 'Football', league: 'National Team', country: 'Tonga', stadium: '' },
  { name: 'New Caledonia', sport: 'Football', league: 'National Team', country: 'New Caledonia', stadium: '' },
  { name: 'Kiribati', sport: 'Football', league: 'National Team', country: 'Kiribati', stadium: '' },
  { name: 'Marshall Islands', sport: 'Football', league: 'National Team', country: 'Marshall Islands', stadium: '' },
  { name: 'Micronesia', sport: 'Football', league: 'National Team', country: 'Micronesia', stadium: '' },
  { name: 'Palau', sport: 'Football', league: 'National Team', country: 'Palau', stadium: '' },
  { name: 'Nauru', sport: 'Football', league: 'National Team', country: 'Nauru', stadium: '' },
  { name: 'Tuvalu', sport: 'Football', league: 'National Team', country: 'Tuvalu', stadium: '' },
  { name: 'Luxembourg', sport: 'Football', league: 'National Team', country: 'Luxembourg', stadium: '' },
  { name: 'Liechtenstein', sport: 'Football', league: 'National Team', country: 'Liechtenstein', stadium: '' },
  { name: 'San Marino', sport: 'Football', league: 'National Team', country: 'San Marino', stadium: '' },
  { name: 'Vatican City', sport: 'Football', league: 'National Team', country: 'Vatican City', stadium: '' },
  { name: 'Andorra', sport: 'Football', league: 'National Team', country: 'Andorra', stadium: '' },
  { name: 'Malta', sport: 'Football', league: 'National Team', country: 'Malta', stadium: '' },
  { name: 'Cyprus', sport: 'Football', league: 'National Team', country: 'Cyprus', stadium: '' },
  { name: 'Gibraltar', sport: 'Football', league: 'National Team', country: 'Gibraltar', stadium: '' },
  { name: 'Faroe Islands', sport: 'Football', league: 'National Team', country: 'Faroe Islands', stadium: '' },
  { name: 'Greenland', sport: 'Football', league: 'National Team', country: 'Greenland', stadium: '' },
  { name: 'Palestine', sport: 'Football', league: 'National Team', country: 'Palestine', stadium: '' },
  { name: 'Israel', sport: 'Football', league: 'National Team', country: 'Israel', stadium: '' },
  { name: 'Hong Kong', sport: 'Football', league: 'National Team', country: 'Hong Kong', stadium: '' },
  { name: 'Macau', sport: 'Football', league: 'National Team', country: 'Macau', stadium: '' },
  { name: 'Taiwan', sport: 'Football', league: 'National Team', country: 'Taiwan', stadium: '' },
  { name: 'North Korea', sport: 'Football', league: 'National Team', country: 'North Korea', stadium: '' },
  { name: 'Mongolia', sport: 'Football', league: 'National Team', country: 'Mongolia', stadium: '' },
  { name: 'Kyrgyzstan', sport: 'Football', league: 'National Team', country: 'Kyrgyzstan', stadium: '' },
  { name: 'Tajikistan', sport: 'Football', league: 'National Team', country: 'Tajikistan', stadium: '' },
  { name: 'Turkmenistan', sport: 'Football', league: 'National Team', country: 'Turkmenistan', stadium: '' },
  { name: 'Afghanistan', sport: 'Football', league: 'National Team', country: 'Afghanistan', stadium: '' },
  { name: 'Nepal', sport: 'Football', league: 'National Team', country: 'Nepal', stadium: '' },
  { name: 'Bhutan', sport: 'Football', league: 'National Team', country: 'Bhutan', stadium: '' },
  { name: 'Sri Lanka', sport: 'Football', league: 'National Team', country: 'Sri Lanka', stadium: '' },
  { name: 'Maldives', sport: 'Football', league: 'National Team', country: 'Maldives', stadium: '' },
  { name: 'Myanmar', sport: 'Football', league: 'National Team', country: 'Myanmar', stadium: '' },
  { name: 'Laos', sport: 'Football', league: 'National Team', country: 'Laos', stadium: '' },
  { name: 'Cambodia', sport: 'Football', league: 'National Team', country: 'Cambodia', stadium: '' },
  { name: 'Brunei', sport: 'Football', league: 'National Team', country: 'Brunei', stadium: '' },
  { name: 'Timor-Leste', sport: 'Football', league: 'National Team', country: 'Timor-Leste', stadium: '' },
  { name: 'Estonia', sport: 'Football', league: 'National Team', country: 'Estonia', stadium: '' },
  { name: 'Latvia', sport: 'Football', league: 'National Team', country: 'Latvia', stadium: '' },
  { name: 'Lithuania', sport: 'Football', league: 'National Team', country: 'Lithuania', stadium: '' },

  // === NBA (30) ===
  { name: 'Boston Celtics', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'TD Garden' },
  { name: 'Brooklyn Nets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Barclays Center' },
  { name: 'New York Knicks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Madison Square Garden' },
  { name: 'Philadelphia 76ers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Wells Fargo Center' },
  { name: 'Toronto Raptors', sport: 'Basketball', league: 'NBA', country: 'Canada', stadium: 'Scotiabank Arena' },
  { name: 'Chicago Bulls', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'United Center' },
  { name: 'Cleveland Cavaliers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Rocket Mortgage FieldHouse' },
  { name: 'Detroit Pistons', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Little Caesars Arena' },
  { name: 'Indiana Pacers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Gainbridge Fieldhouse' },
  { name: 'Milwaukee Bucks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Fiserv Forum' },
  { name: 'Atlanta Hawks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'State Farm Arena' },
  { name: 'Charlotte Hornets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Spectrum Center' },
  { name: 'Miami Heat', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Kaseya Center' },
  { name: 'Orlando Magic', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Amway Center' },
  { name: 'Washington Wizards', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Capital One Arena' },
  { name: 'Denver Nuggets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Ball Arena' },
  { name: 'Minnesota Timberwolves', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Target Center' },
  { name: 'Oklahoma City Thunder', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Paycom Center' },
  { name: 'Portland Trail Blazers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Moda Center' },
  { name: 'Utah Jazz', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Delta Center' },
  { name: 'Golden State Warriors', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Chase Center' },
  { name: 'Los Angeles Clippers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Intuit Dome' },
  { name: 'Los Angeles Lakers', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Crypto.com Arena' },
  { name: 'Phoenix Suns', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Footprint Center' },
  { name: 'Sacramento Kings', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Golden 1 Center' },
  { name: 'Dallas Mavericks', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'American Airlines Center' },
  { name: 'Houston Rockets', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Toyota Center' },
  { name: 'Memphis Grizzlies', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'FedExForum' },
  { name: 'New Orleans Pelicans', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Smoothie King Center' },
  { name: 'San Antonio Spurs', sport: 'Basketball', league: 'NBA', country: 'USA', stadium: 'Frost Bank Center' },

  // === NFL (32) ===
  { name: 'Arizona Cardinals', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'State Farm Stadium' },
  { name: 'Atlanta Falcons', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Mercedes-Benz Stadium' },
  { name: 'Baltimore Ravens', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'M&T Bank Stadium' },
  { name: 'Buffalo Bills', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Highmark Stadium' },
  { name: 'Carolina Panthers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Bank of America Stadium' },
  { name: 'Chicago Bears', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Soldier Field' },
  { name: 'Cincinnati Bengals', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Paycor Stadium' },
  { name: 'Cleveland Browns', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Cleveland Browns Stadium' },
  { name: 'Dallas Cowboys', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'AT&T Stadium' },
  { name: 'Denver Broncos', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Empower Field at Mile High' },
  { name: 'Detroit Lions', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Ford Field' },
  { name: 'Green Bay Packers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lambeau Field' },
  { name: 'Houston Texans', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'NRG Stadium' },
  { name: 'Indianapolis Colts', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lucas Oil Stadium' },
  { name: 'Jacksonville Jaguars', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'EverBank Stadium' },
  { name: 'Kansas City Chiefs', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'GEHA Field at Arrowhead Stadium' },
  { name: 'Las Vegas Raiders', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Allegiant Stadium' },
  { name: 'Los Angeles Chargers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'SoFi Stadium' },
  { name: 'Los Angeles Rams', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'SoFi Stadium' },
  { name: 'Miami Dolphins', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Hard Rock Stadium' },
  { name: 'Minnesota Vikings', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'U.S. Bank Stadium' },
  { name: 'New England Patriots', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Gillette Stadium' },
  { name: 'New Orleans Saints', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Caesars Superdome' },
  { name: 'New York Giants', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'MetLife Stadium' },
  { name: 'New York Jets', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'MetLife Stadium' },
  { name: 'Philadelphia Eagles', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lincoln Financial Field' },
  { name: 'Pittsburgh Steelers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Acrisure Stadium' },
  { name: 'San Francisco 49ers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: "Levi's Stadium" },
  { name: 'Seattle Seahawks', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Lumen Field' },
  { name: 'Tampa Bay Buccaneers', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Raymond James Stadium' },
  { name: 'Tennessee Titans', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Nissan Stadium' },
  { name: 'Washington Commanders', sport: 'American Football', league: 'NFL', country: 'USA', stadium: 'Northwest Stadium' },

  // === MLB (30) ===
  { name: 'Arizona Diamondbacks', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Chase Field' },
  { name: 'Atlanta Braves', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Truist Park' },
  { name: 'Baltimore Orioles', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oriole Park at Camden Yards' },
  { name: 'Boston Red Sox', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Fenway Park' },
  { name: 'Chicago Cubs', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Wrigley Field' },
  { name: 'Chicago White Sox', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Guaranteed Rate Field' },
  { name: 'Cincinnati Reds', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Great American Ball Park' },
  { name: 'Cleveland Guardians', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Progressive Field' },
  { name: 'Colorado Rockies', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Coors Field' },
  { name: 'Detroit Tigers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Comerica Park' },
  { name: 'Houston Astros', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Minute Maid Park' },
  { name: 'Kansas City Royals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Kauffman Stadium' },
  { name: 'Los Angeles Angels', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Angel Stadium' },
  { name: 'Los Angeles Dodgers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Dodger Stadium' },
  { name: 'Miami Marlins', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'LoanDepot Park' },
  { name: 'Milwaukee Brewers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'American Family Field' },
  { name: 'Minnesota Twins', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Target Field' },
  { name: 'New York Mets', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Citi Field' },
  { name: 'New York Yankees', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Yankee Stadium' },
  { name: 'Oakland Athletics', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oakland Coliseum' },
  { name: 'Philadelphia Phillies', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Citizens Bank Park' },
  { name: 'Pittsburgh Pirates', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'PNC Park' },
  { name: 'San Diego Padres', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Petco Park' },
  { name: 'San Francisco Giants', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Oracle Park' },
  { name: 'Seattle Mariners', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'T-Mobile Park' },
  { name: 'St Louis Cardinals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Busch Stadium' },
  { name: 'Tampa Bay Rays', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Tropicana Field' },
  { name: 'Texas Rangers', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Globe Life Field' },
  { name: 'Toronto Blue Jays', sport: 'Baseball', league: 'MLB', country: 'Canada', stadium: 'Rogers Centre' },
  { name: 'Washington Nationals', sport: 'Baseball', league: 'MLB', country: 'USA', stadium: 'Nationals Park' },

  // === NHL (32) ===
  { name: 'Anaheim Ducks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Honda Center' },
  { name: 'Boston Bruins', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'TD Garden' },
  { name: 'Buffalo Sabres', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'KeyBank Center' },
  { name: 'Calgary Flames', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Scotiabank Saddledome' },
  { name: 'Carolina Hurricanes', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'PNC Arena' },
  { name: 'Chicago Blackhawks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'United Center' },
  { name: 'Colorado Avalanche', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Ball Arena' },
  { name: 'Columbus Blue Jackets', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Nationwide Arena' },
  { name: 'Dallas Stars', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'American Airlines Center' },
  { name: 'Detroit Red Wings', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Little Caesars Arena' },
  { name: 'Edmonton Oilers', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Rogers Place' },
  { name: 'Florida Panthers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Amerant Bank Arena' },
  { name: 'Los Angeles Kings', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Crypto.com Arena' },
  { name: 'Minnesota Wild', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Xcel Energy Center' },
  { name: 'Montreal Canadiens', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Bell Centre' },
  { name: 'Nashville Predators', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Bridgestone Arena' },
  { name: 'New Jersey Devils', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Prudential Center' },
  { name: 'New York Islanders', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'UBS Arena' },
  { name: 'New York Rangers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Madison Square Garden' },
  { name: 'Ottawa Senators', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Canadian Tire Centre' },
  { name: 'Philadelphia Flyers', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Wells Fargo Center' },
  { name: 'Pittsburgh Penguins', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'PPG Paints Arena' },
  { name: 'San Jose Sharks', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'SAP Center' },
  { name: 'Seattle Kraken', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Climate Pledge Arena' },
  { name: 'St Louis Blues', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Enterprise Center' },
  { name: 'Tampa Bay Lightning', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Amalie Arena' },
  { name: 'Toronto Maple Leafs', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Scotiabank Arena' },
  { name: 'Vancouver Canucks', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Rogers Arena' },
  { name: 'Vegas Golden Knights', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'T-Mobile Arena' },
  { name: 'Washington Capitals', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Capital One Arena' },
  { name: 'Winnipeg Jets', sport: 'Ice Hockey', league: 'NHL', country: 'Canada', stadium: 'Canada Life Centre' },
  { name: 'Utah Hockey Club', sport: 'Ice Hockey', league: 'NHL', country: 'USA', stadium: 'Delta Center' },

  // === FORMULA 1 (10) ===
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

  // === UFC ===
  { name: 'UFC', sport: 'MMA', league: 'Ultimate Fighting Championship', country: 'USA', stadium: '' },

  // === BOXING ===
  { name: 'WBC', sport: 'Boxing', league: 'World Boxing Council', country: 'Mexico', stadium: '' },
  { name: 'WBA', sport: 'Boxing', league: 'World Boxing Association', country: 'Panama', stadium: '' },
  { name: 'IBF', sport: 'Boxing', league: 'International Boxing Federation', country: 'USA', stadium: '' },
  { name: 'WBO', sport: 'Boxing', league: 'World Boxing Organization', country: 'Puerto Rico', stadium: '' },
  { name: 'Top Rank', sport: 'Boxing', league: 'Top Rank Boxing', country: 'USA', stadium: '' },
  { name: 'Golden Boy Promotions', sport: 'Boxing', league: 'Golden Boy Promotions', country: 'USA', stadium: '' },
  { name: 'Matchroom Boxing', sport: 'Boxing', league: 'Matchroom Boxing', country: 'UK', stadium: '' },
  { name: 'PBC', sport: 'Boxing', league: 'Premier Boxing Champions', country: 'USA', stadium: '' },
];

async function seedTeams() {
  console.log(`Preparing ${teams.length} teams...`);

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

  console.log(`Done! ${success} inserted/updated, ${skipped} skipped, ${errors} errors`);
}

seedTeams().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
