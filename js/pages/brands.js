(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL = String(supabaseConfig.url || '').trim() || '__SUPABASE_URL__';
  const SUPABASE_KEY = String(supabaseConfig.key || '').trim();

  const BRAND_TYPE = String(document.body?.dataset?.brandType || 'fashion').toLowerCase();
  const BRAND_LABEL = BRAND_TYPE === 'food' ? 'Food' : (BRAND_TYPE === 'car' ? 'Cars' : 'Fashion');
  const BRAND_ICON = BRAND_TYPE === 'food' ? 'fa-burger' : (BRAND_TYPE === 'car' ? 'fa-car' : 'fa-shirt');
  const BRAND_TABLE = BRAND_TYPE === 'food' ? 'food_brands' : (BRAND_TYPE === 'car' ? 'car_brands' : 'fashion_brands');
  const HOME_DEFAULT_LIST_TABLES = {
    fashion: { table: 'fashion_list_items', itemField: 'brand_id' },
    food: { table: 'food_list_items', itemField: 'brand_id' },
    car: { table: 'car_list_items', itemField: 'brand_id' }
  };

  const FALLBACKS = BRAND_TYPE === 'food'
    ? [
        { id: 'b5be652a-1f9b-498c-90c8-325cb9e2d887', name: "McDonald's", category: 'Fast Food', domain: 'mcdonalds.com', description: 'American fast-food chain.' },
        { id: 'ae58f6af-fc0c-48bc-893b-22b8c9bea2f3', name: 'KFC', category: 'Fast Food', domain: 'kfc.com', description: 'Fried chicken specialists.' },
        { id: 'e89ab03c-f3eb-4e8a-9ac6-7a78dd8cfebf', name: 'Burger King', category: 'Fast Food', domain: 'burgerking.com', description: 'Home of the Whopper.' },
        { id: 'e43b76c1-9592-4451-a376-beb5cadaead0', name: 'Subway', category: 'Fast Food', domain: 'subway.com', description: 'Sandwich chain.' },
        { id: 'dcbdebe1-e413-45f3-b73b-3680c7449687', name: 'Taco Bell', category: 'Fast Food', domain: 'tacobell.com', description: 'Mexican-inspired fast food.' },
        { id: '212ce36e-df31-4c8e-a8f1-8640b5b47602', name: 'Starbucks', category: 'Coffee', domain: 'starbucks.com', description: 'Coffeehouse chain.' },
        { id: '65836949-6f8c-4d12-9601-1b37030a8d4f', name: "Domino's", category: 'Pizza', domain: 'dominos.com', description: 'Pizza delivery chain.' },
        { id: 'e2e4a465-c9e9-4124-b600-4e587e973b52', name: 'Pizza Hut', category: 'Pizza', domain: 'pizzahut.com', description: 'Pizza restaurant chain.' }
      ]
    : (BRAND_TYPE === 'car'
      ? [
          { id: 'b4bd539e-490f-406a-89b0-6d4c52043154', name: 'Toyota', category: 'Automaker', domain: 'toyota.com', description: 'Global automaker.' },
          { id: '8d466b94-2cde-446b-b17f-05160ce9c92a', name: 'Honda', category: 'Automaker', domain: 'honda.com', description: 'Japanese automaker.' },
          { id: '8a5091a6-a0b6-46ae-9adf-9ef96012fe1d', name: 'BMW', category: 'Luxury', domain: 'bmw.com', description: 'German luxury automaker.' },
          { id: 'd569b2c2-8738-4f3a-b2aa-066d6b7a303d', name: 'Mercedes-Benz', category: 'Luxury', domain: 'mercedes-benz.com', description: 'German luxury automaker.' },
          { id: '7125a959-48c6-458b-873f-3256ecba9813', name: 'Audi', category: 'Luxury', domain: 'audi.com', description: 'German luxury automaker.' },
          { id: '163c6005-e94b-4b0d-ae95-b9210bd20571', name: 'Ford', category: 'Automaker', domain: 'ford.com', description: 'American automaker.' },
          { id: 'c65e5725-4f9a-40ab-97b1-51b17ecfd52a', name: 'Chevrolet', category: 'Automaker', domain: 'chevrolet.com', description: 'American automaker.' },
          { id: 'ae7822a8-c2cc-462b-84bc-16f70c256992', name: 'Tesla', category: 'EV', domain: 'tesla.com', description: 'Electric vehicle maker.' }
        ]
      : [
          { id: 'fab6ce34-9e00-4d2a-a4ad-ebb69a8a318c', name: 'Nike', category: 'Sportswear', domain: 'nike.com', description: 'Global sportswear brand.' },
          { id: '1982d6c7-716d-4f92-8529-039e03d83b72', name: 'Adidas', category: 'Sportswear', domain: 'adidas.com', description: 'Athletic apparel and footwear.' },
          { id: '520d0db2-1e34-4076-9db7-06b7dccc9643', name: 'Zara', category: 'Fast Fashion', domain: 'zara.com', description: 'Spanish fashion retailer.' },
          { id: '1d7003d5-dcce-4506-8cb3-2da40b6e8f24', name: 'Uniqlo', category: 'Basics', domain: 'uniqlo.com', description: 'Japanese casualwear brand.' },
          { id: '6c5bbaa5-7007-4c62-b143-e5f89926b649', name: 'H&M', category: 'Fast Fashion', domain: 'hm.com', description: 'Global fashion retailer.' },
          { id: 'a733512f-2667-4e87-9486-ec2be20fc557', name: 'Gucci', category: 'Luxury', domain: 'gucci.com', description: 'Italian luxury fashion.' },
          { id: '0d44e575-c7d4-40fc-9489-1eaa69cb7663', name: 'Prada', category: 'Luxury', domain: 'prada.com', description: 'Luxury fashion house.' },
          { id: 'dfe029f5-dee4-434a-bb6c-5015bc36c334', name: 'Louis Vuitton', category: 'Luxury', domain: 'louisvuitton.com', description: 'French luxury fashion.' }
        ]);

  const BRAND_TYPO_MAP = {
    mac: ['mcdonalds', "mcdonald's"], macdonalds: ['mcdonalds', "mcdonald's"], mcdonald: ['mcdonalds', "mcdonald's"], mcd: ['mcdonalds', "mcdonald's"], mcdonalds: ['mcdonalds', "mcdonald's"], macd: ['mcdonalds', "mcdonald's"],
    bk: ['burger king'], bking: ['burger king'], burgking: ['burger king'], burgerking: ['burger king'], 'burger king': ['burger king'],
    kfc: ['kfc'], kfcs: ['kfc'], kcf: ['kfc'], kentucky: ['kfc'], 'kentucky fried chicken': ['kfc'],
    sbux: ['starbucks'], starbcks: ['starbucks'], starbuck: ['starbucks'], starbuks: ['starbucks'], starbux: ['starbucks'], starbucks: ['starbucks'], starbu: ['starbucks'], starbuc: ['starbucks'], starbuk: ['starbucks'],
    subway: ['subway'], sub: ['subway'], subways: ['subway'], subwy: ['subway'],
    tb: ['taco bell'], tacobell: ['taco bell'], taco: ['taco bell'], 'taco bell': ['taco bell'],
    dominos: ["domino's"], domino: ["domino's"], "domino's": ["domino's"],
    pizzahut: ['pizza hut'], 'pizza hut': ['pizza hut'], ph: ['pizza hut'], phut: ['pizza hut'], pizza: ['pizza hut'],
    wendys: ["wendy's"], wendy: ["wendy's"], "wendy's": ["wendy's"],
    chickfila: ['chick-fil-a'], 'chick-fil-a': ['chick-fil-a'], cfa: ['chick-fil-a'], chick: ['chick-fil-a'],
    fiveguys: ['five guys'], 'five guys': ['five guys'], five: ['five guys'],
    inandout: ['in-n-out'], 'in-n-out': ['in-n-out'], ino: ['in-n-out'],
    chipotle: ['chipotle'], chip: ['chipotle'], cmg: ['chipotle mexican grill'], 'chipotle mexican grill': ['chipotle mexican grill'],
    panera: ['panera bread'], 'panera bread': ['panera bread'],
    sonic: ['sonic'],
    arbys: ["arby's"], arby: ["arby's"], "arby's": ["arby's"],
    carls: ["carl's jr"], carl: ["carl's jr"], "carl's jr": ["carl's jr"],
    jackinthebox: ['jack in the box'], 'jack in the box': ['jack in the box'], jib: ['jack in the box'], jack: ['jack in the box'],
    popeyes: ["popeye's"], popeye: ["popeye's"], "popeye's": ["popeye's"],
    daveandbusters: ["dave & buster's"], "dave & buster's": ["dave & buster's"], dave: ["dave & buster's"],
    hooters: ['hooters'],
    applebees: ["applebee's"], "applebee's": ["applebee's"], apple: ["applebee's"],
    olivegarden: ['olive garden'], 'olive garden': ['olive garden'], og: ['olive garden'], olive: ['olive garden'],
    redlobster: ['red lobster'], 'red lobster': ['red lobster'], red: ['red lobster'],
    longhorn: ['longhorn steakhouse'], 'longhorn steakhouse': ['longhorn steakhouse'],
    outback: ['outback steakhouse'], 'outback steakhouse': ['outback steakhouse'],
    texasroadhouse: ['texas roadhouse'], 'texas roadhouse': ['texas roadhouse'], tr: ['texas roadhouse'], texas: ['texas roadhouse'],
    crackerbarrel: ['cracker barrel'], 'cracker barrel': ['cracker barrel'], cb: ['cracker barrel'], cracker: ['cracker barrel'],
    dennys: ["denny's"], denny: ["denny's"], "denny's": ["denny's"],
    ihop: ['ihop'],
    wafflehouse: ['waffle house'], 'waffle house': ['waffle house'], wh: ['waffle house'], waffle: ['waffle house'],
    golden: ['golden corral'], corral: ['golden corral'], 'golden corral': ['golden corral'], gc: ['golden corral'],
    buffalowildwings: ['buffalo wild wings'], 'buffalo wild wings': ['buffalo wild wings'], bww: ['buffalo wild wings'], buffalo: ['buffalo wild wings'],
    zaxbys: ["zaxby's"], zaxby: ["zaxby's"], "zaxby's": ["zaxby's"],
    culvers: ["culver's"], culver: ["culver's"], "culver's": ["culver's"],
    whataburger: ['whataburger'], wb: ['whataburger'],
    elpollo: ['el pollo loco'], 'el pollo loco': ['el pollo loco'], epl: ['el pollo loco'], pollo: ['el pollo loco'],
    deltaco: ['del taco'], 'del taco': ['del taco'], del: ['del taco'],
    checkers: ['checkers'], rallys: ['raleys'],
    whitecastle: ['white castle'], 'white castle': ['white castle'], wc: ['white castle'], white: ['white castle'],
    krystal: ['krystal'],
    harveys: ["harvey's"], harvey: ["harvey's"], "harvey's": ["harvey's"],
    bojhangles: ["bojangles'"], bojangles: ["bojangles'"], "bojangles'": ["bojangles'"],
    churchs: ["church's chicken"], 'churchs chicken': ["church's chicken"], church: ["church's chicken"],
    longjohn: ["long john silver's"], 'long john silvers': ["long john silver's"], ljs: ["long john silver's"], silvers: ["long john silver's"],
    aww: ["a&w"], aw: ["a&w"], 'a and w': ["a&w"],
    greatamerican: ['great american cookies'],
    cinnabon: ['cinnabon'],
    auntieannes: ["auntie anne's"], "auntie anne's": ["auntie anne's"], auntie: ["auntie anne's"],
    jamba: ['jamba juice'], 'jamba juice': ['jamba juice'],
    smoothie: ['smoothie king'], 'smoothie king': ['smoothie king'],
    baskin: ['baskin robbins'], 'baskin robbins': ['baskin robbins'], br31: ['baskin robbins'], robbins: ['baskin robbins'],
    coldstone: ['cold stone creamery'], 'cold stone': ['cold stone creamery'], cold: ['cold stone creamery'],
    menchie: ["menchie's"], "menchie's": ["menchie's"],
    yogurtland: ['yogurtland'],
    pinkberry: ['pinkberry'],
    sweetgreen: ['sweetgreen'], 'sweet green': ['sweetgreen'],
    qdoba: ['qdoba'],
    moes: ["moe's southwest grill"], "moe's": ["moe's southwest grill"],
    freal: ['freal'],
    shake: ['shake shack'], 'shake shack': ['shake shack'], shack: ['shake shack'],
    smashburger: ['smashburger'], smash: ['smashburger'],
    habit: ['the habit burger grill'], 'the habit': ['the habit burger grill'],
    umami: ['umami burger'], 'umami burger': ['umami burger'],
    fatburger: ['fatburger'], fat: ['fatburger'],
    johnny: ["johnny rockets"], 'johnny rockets': ["johnny rockets"], rockets: ["johnny rockets"],
    hardrock: ['hard rock cafe'], 'hard rock': ['hard rock cafe'], hard: ['hard rock cafe'],
    planet: ['planet hollywood'], 'planet hollywood': ['planet hollywood'], hollywood: ['planet hollywood'],
    rainforest: ['rainforest cafe'], 'rainforest cafe': ['rainforest cafe'],
    bucadibeppo: ["buca di beppo"], "buca di beppo": ["buca di beppo"],
    carrabbas: ["carrabba's italian grill"], "carrabba's": ["carrabba's italian grill"], carrabba: ["carrabba's italian grill"],
    maggianos: ["maggiano's little italy"], "maggiano's": ["maggiano's little italy"], magiano: ["maggiano's little italy"],
    pfg: ['p.f. changs'], 'p f changs': ['p.f. changs'], 'p.f. changs': ['p.f. changs'], changs: ['p.f. changs'],
    peiwei: ['pei wei'], 'pei wei': ['pei wei'],
    panda: ['panda express'], 'panda express': ['panda express'],
    teriyaki: ['teriyaki madness'], 'teriyaki madness': ['teriyaki madness'],
    benihana: ['benihana'],
    nobu: ['nobu'],
    bmw: ['bmw'], mercedes: ['mercedes-benz', 'mercedes benz'], benz: ['mercedes-benz', 'mercedes benz'], vw: ['volkswagen'], volkswagen: ['volkswagen'],
    chevy: ['chevrolet'], ford: ['ford'], honda: ['honda'], toyota: ['toyota'], nissan: ['nissan'], hyundai: ['hyundai'], kia: ['kia'],
    mazda: ['mazda'], subaru: ['subaru'], jeep: ['jeep'], ram: ['ram'], dodge: ['dodge'], chrysler: ['chrysler'], buick: ['buick'],
    cadillac: ['cadillac'], gmc: ['gmc'], lincoln: ['lincoln'], tesla: ['tesla'], audi: ['audi'], porsche: ['porsche'],
    ferrari: ['ferrari'], lamborghini: ['lamborghini'], maserati: ['maserati'], bentley: ['bentley'],
    rolls: ['rolls-royce'], 'rolls royce': ['rolls-royce'], aston: ['aston martin'], 'aston martin': ['aston martin'],
    mclaren: ['mclaren'], bugatti: ['bugatti'], lotus: ['lotus'], alfa: ['alfa romeo'], 'alfa romeo': ['alfa romeo'],
    fiat: ['fiat'], saab: ['saab'], volvo: ['volvo'], jaguar: ['jaguar'], land: ['land rover'], 'land rover': ['land rover'],
    range: ['range rover'], 'range rover': ['range rover'], mini: ['mini'], smart: ['smart'],
    polestar: ['polestar'], rivian: ['rivian'], lucid: ['lucid'], byd: ['byd'],
    nike: ['nike'], adidas: ['adidas'], puma: ['puma'], reebok: ['reebok'],
    newbalance: ['new balance'], 'new balance': ['new balance'], nb: ['new balance'],
    underarmour: ['under armour'], 'under armour': ['under armour'], ua: ['under armour'],
    asics: ['asics'], saucony: ['saucony'], brooks: ['brooks'], hoka: ['hoka'],
    on: ['on running'], 'on running': ['on running'], salomon: ['salomon'], merrell: ['merrell'],
    timberland: ['timberland'], timber: ['timberland'],
    drmartens: ['dr. martens'], 'dr martens': ['dr. martens'], docs: ['dr. martens'],
    converse: ['converse'], vans: ['vans'], sketchers: ['skechers'], skechers: ['skechers'],
    crocs: ['crocs'], birkenstock: ['birkenstock'], birken: ['birkenstock'],
    ugg: ['ugg'], uggs: ['ugg'], allbirds: ['allbirds'], rothy: ['rothy'], rothys: ['rothy'],
    zara: ['zara'], hm: ['h&m', 'h and m'], 'h&m': ['h&m', 'h and m'], 'h and m': ['h&m', 'h and m'],
    uniqlo: ['uniqlo'], gap: ['gap'], oldnavy: ['old navy'], 'old navy': ['old navy'], old: ['old navy'],
    bananarepublic: ['banana republic'], 'banana republic': ['banana republic'],
    americaneagle: ['american eagle'], 'american eagle': ['american eagle'], ae: ['american eagle'],
    abercrombie: ['abercrombie & fitch'], 'abercrombie fitch': ['abercrombie & fitch'], af: ['abercrombie & fitch'],
    hollister: ['hollister'], urban: ['urban outfitters'], 'urban outfitters': ['urban outfitters'],
    freepeople: ['free people'], 'free people': ['free people'], free: ['free people'], anthropologie: ['anthropologie'], madewell: ['madewell'],
    jcrew: ['j.crew'], 'j crew': ['j.crew'], 'j.crew': ['j.crew'],
    ralphlauren: ['ralph lauren'], 'ralph lauren': ['ralph lauren'], polo: ['ralph lauren', 'polo ralph lauren'],
    tommy: ['tommy hilfiger'], 'tommy hilfiger': ['tommy hilfiger'],
    calvinklein: ['calvin klein'], 'calvin klein': ['calvin klein'], ck: ['calvin klein'],
    lacoste: ['lacoste'], levi: ["levi's"], "levi's": ["levi's"], levis: ["levi's"],
    wrangler: ['wrangler'], lee: ['lee'], dickies: ['dickies'], carhartt: ['carhartt'],
    patagonia: ['patagonia'], northface: ['the north face'], 'the north face': ['the north face'], tnfs: ['the north face'],
    columbia: ['columbia'], arcteryx: ['arcteryx'], mammut: ['mammut'], marmot: ['marmot'],
    lululemon: ['lululemon'], lululemen: ['lululemon'], lulu: ['lululemon'], athleta: ['athleta'],
    alo: ['alo yoga'], 'alo yoga': ['alo yoga'],
    gucci: ['gucci'], prada: ['prada'], lv: ['louis vuitton'], 'louis vuitton': ['louis vuitton'],
    chanel: ['chanel'], dior: ['dior'], fendi: ['fendi'], celine: ['celine'],
    bottega: ['bottega veneta'], 'bottega veneta': ['bottega veneta'], bv: ['bottega veneta'],
    valentino: ['valentino'], givenchy: ['givenchy'], balenciaga: ['balenciaga'],
    ysl: ['saint laurent', 'ysl'], 'saint laurent': ['saint laurent', 'ysl'],
    burberry: ['burberry'], hermes: ['hermes', 'hermès'], 'hermès': ['hermes', 'hermès'],
    moncler: ['moncler'], canada: ['canada goose'], 'canada goose': ['canada goose'],
    stoneisland: ['stone island'], 'stone island': ['stone island'],
    acnestudios: ['acne studios'], 'acne studios': ['acne studios'],
    offwhite: ['off-white'], 'off white': ['off-white'], supreme: ['supreme'], palace: ['palace'], stussy: ['stussy'],
    bape: ['a bathing ape', 'bape'], 'a bathing ape': ['a bathing ape', 'bape'],
    kenzo: ['kenzo'], sacai: ['sacai'],
    comme: ['comme des garcons'], 'comme des garcons': ['comme des garcons'], cdg: ['comme des garcons'],
    yohji: ['yohji yamamoto'], 'yohji yamamoto': ['yohji yamamoto'],
    issey: ['issey miyake'], 'issey miyake': ['issey miyake'],
    fjallraven: ['fjallraven'], 'fjall raven': ['fjallraven'],
    helly: ['helly hansen'], 'helly hansen': ['helly hansen'], hh: ['helly hansen']
  };

  function normalizeBrandSearch(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function expandBrandSearchTokens(query) {
    const normalized = normalizeBrandSearch(query);
    if (!normalized) return [];
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const expanded = new Set(tokens);
    tokens.forEach(token => {
      const aliases = BRAND_TYPO_MAP[token];
      if (aliases) aliases.forEach(alias => normalizeBrandSearch(alias).split(/\s+/).forEach(t => expanded.add(t)));
    });
    const noSpace = normalized.replace(/\s+/g, '');
    const fullAliases = BRAND_TYPO_MAP[noSpace];
    if (fullAliases) fullAliases.forEach(alias => normalizeBrandSearch(alias).split(/\s+/).forEach(t => expanded.add(t)));
    return Array.from(expanded);
  }

  const grid = document.getElementById('brandGrid');
  const spotlight = {
    bg: document.getElementById('brandSpotlightBg'),
    kicker: document.getElementById('brandSpotlightKicker'),
    title: document.getElementById('brandSpotlightTitle'),
    meta: document.getElementById('brandSpotlightMeta'),
    summary: document.getElementById('brandSpotlightSummary'),
    logo: document.getElementById('brandSpotlightLogo'),
    open: document.getElementById('brandSpotlightOpen')
  };
  const BRAND_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='none'>
      <rect width='24' height='24' fill='#10224a'/>
    </svg>
  `)}`;

  let supabaseClient = null;
  let currentUser = null;
  let allBrands = [];
  let brandImageObserver = null;
  let brandSpotlightTimer = null;
  let brandSpotlightItems = [];
  let brandSpotlightIndex = 0;
  let brandBackgroundManifest = null;
  let brandBackgroundManifestPromise = null;

  function ensureSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      supabaseClient = window.__ZO2Y_SUPABASE_CLIENT;
      return supabaseClient;
    }
    if (!window.supabase) return null;
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'zo2y-auth-v2'
      }
    });
    window.__ZO2Y_SUPABASE_CLIENT = supabaseClient;
    return supabaseClient;
  }

  function resolveLogo(value, domain, name) {
    const direct = String(value || '').trim();
    if (direct) {
      if (/^https?:\/\//i.test(direct) || direct.startsWith('/') || direct.startsWith('data:')) {
        return direct;
      }
    }
    const title = String(name || '').trim();
    if (title) {
      const params = new URLSearchParams();
      params.set('title', title);
      const domainRaw = String(domain || '').trim();
      if (domainRaw) params.set('domain', domainRaw);
      params.set('mode', 'logo');
      return '/api/logo?' + params.toString();
    }
    const domainRaw = String(domain || '').trim();
    const candidate = domainRaw;
    if (!candidate) return '';
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate)) {
      return '/api/logo?domain=' + encodeURIComponent(candidate) + '&size=128&mode=logo';
    }
    if (/^https?:\/\//i.test(candidate)) {
      const match = candidate.match(/\/\/([^\/\?]+)/i);
      if (match && match[1]) return '/api/logo?domain=' + encodeURIComponent(match[1]) + '&size=128&mode=logo';
      return candidate;
    }
    return '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getBrandImageObserver() {
    if (brandImageObserver || typeof window.IntersectionObserver !== 'function') return brandImageObserver;
    brandImageObserver = new IntersectionObserver((entries, observer) => {
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
      rootMargin: '260px 0px',
      threshold: 0.01
    });
    return brandImageObserver;
  }

  function primeBrandImages(scope) {
    const root = scope || document;
    const images = Array.from(root.querySelectorAll('img[data-defer-src]'));
    if (!images.length) return;
    const observer = getBrandImageObserver();
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

  function wireBrandImageState(scope) {
    const root = scope || document;
    // Index-style card images (matches css/pages/index.css)
    root.querySelectorAll('img[data-home-image="1"]').forEach((img) => {
      const wrap = img.closest('.card-media');
      const markReady = () => {
        img.setAttribute('data-image-ready', '1');
        if (wrap) wrap.classList.remove('is-loading-media');
      };
      const handleError = () => {
        const fallback = '/newlogo.webp';
        if (img.src.endsWith(fallback)) {
          markReady();
          return;
        }
        img.removeAttribute('data-defer-src');
        img.src = fallback;
      };
      img.addEventListener('load', markReady);
      img.addEventListener('error', handleError);
      if (img.complete && !img.hasAttribute('data-defer-src')) {
        markReady();
      }
    });
  }

  function showBrandsToast(message, isError = false) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, isError ? 'error' : 'success');
      return;
    }
    if (isError) console.error(message);
    else console.log(message);
  }

  function supportsHomeLists(mediaType) {
    const type = String(mediaType || '').toLowerCase();
    return type === 'fashion' || type === 'food' || type === 'car';
  }

  function getHomeDefaultListTable(mediaType) {
    const type = String(mediaType || '').toLowerCase();
    return HOME_DEFAULT_LIST_TABLES[type] || null;
  }

  function normalizeHomeDefaultItemId(mediaType, itemId) {
    const type = String(mediaType || '').toLowerCase();
    if (type === 'travel') {
      const code = String(itemId || '').trim().toUpperCase();
      return code || null;
    }
    const text = String(itemId || '').trim();
    return text || null;
  }

  function normalizeBrand(row = {}) {
    return {
      id: String(row.id || row.slug || row.domain || row.name || '').trim(),
      name: String(row.name || row.brand_name || '').trim() || 'Brand',
      category: String(row.category || row.type || '').trim(),
      domain: String(row.domain || '').trim(),
      logo: resolveLogo(row.logo_url || row.logo, row.domain, row.name || row.brand_name),
      description: String(row.description || row.extract || '').trim(),
      country: String(row.country || '').trim(),
      founded: String(row.founded || '').trim(),
      slug: String(row.slug || '').trim(),
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function dedupeBrands(items = []) {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((brand) => {
      const domainKey = String(brand.domain || '').trim().toLowerCase();
      const slugKey = String(brand.slug || '').trim().toLowerCase();
      const nameKey = String(brand.name || '').trim().toLowerCase();
      const key = domainKey || slugKey || nameKey;
      if (!key) return;
      const score = (brand.logo ? 2 : 0)
        + (brand.description ? 1 : 0)
        + (brand.country ? 1 : 0);
      if (!map.has(key)) {
        map.set(key, { brand, score });
        return;
      }
      const existing = map.get(key);
      if (score > existing.score) {
        map.set(key, { brand, score });
      }
    });
    return Array.from(map.values()).map((entry) => entry.brand);
  }

  async function ensureBrandBackgroundManifest() {
    if (brandBackgroundManifest) return brandBackgroundManifest;
    if (brandBackgroundManifestPromise) return brandBackgroundManifestPromise;
    const manifestUrl = `${SUPABASE_URL}/storage/v1/object/public/brand-backgrounds/manifest/brand-backgrounds.json`;
    brandBackgroundManifestPromise = fetch(manifestUrl, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload || typeof payload !== 'object') return null;
        brandBackgroundManifest = payload;
        return brandBackgroundManifest;
      })
      .catch(() => null)
      .finally(() => { brandBackgroundManifestPromise = null; });
    return brandBackgroundManifestPromise;
  }

  function getBrandSpotlightBackground(brand) {
    const slug = String(brand?.slug || '').trim().toLowerCase();
    const direct = slug && brandBackgroundManifest?.[BRAND_TABLE]
      ? String(brandBackgroundManifest[BRAND_TABLE][slug] || '').trim()
      : '';
    if (direct) return direct;
    const fallbackName = BRAND_TYPE === 'food' ? 'food.jpg' : (BRAND_TYPE === 'car' ? 'cars.jpg' : 'fashion.jpg');
    return `${SUPABASE_URL}/storage/v1/object/public/home-spotlights/${fallbackName}`;
  }

  function normalizeBrandSearch(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function buildBrandSpotlightPool(items = []) {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter((brand) => {
      const key = normalizeBrandSearch(brand?.name) || String(brand?.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 18);
  }

  function renderBrandSpotlightItem(brand) {
    if (!spotlight.section || !brand) return;
    const background = getBrandSpotlightBackground(brand);
    spotlight.section.hidden = false;
    if (spotlight.bg) {
      spotlight.bg.style.backgroundImage = `linear-gradient(120deg, rgba(8, 14, 31, 0.72), rgba(11, 23, 49, 0.4)), url("${background}")`;
    }
    if (spotlight.kicker) spotlight.kicker.textContent = `${BRAND_LABEL} Spotlight`;
    if (spotlight.title) spotlight.title.textContent = brand.name || BRAND_LABEL;
    if (spotlight.meta) {
      spotlight.meta.textContent = [brand.category, brand.country, brand.founded ? `since ${brand.founded}` : '']
        .filter(Boolean)
        .join(' · ');
    }
    if (spotlight.summary) {
      spotlight.summary.textContent = brand.description || `A standout ${BRAND_LABEL.toLowerCase()} pick from the local catalog.`;
    }
    if (spotlight.logo) {
      spotlight.logo.src = brand.logo || '/newlogo.webp';
      spotlight.logo.alt = `${brand.name || BRAND_LABEL} logo`;
    }
    if (spotlight.open) {
      const id = encodeURIComponent(brand.id || brand.slug || brand.domain || brand.name);
      spotlight.open.href = `brand.html?type=${encodeURIComponent(BRAND_TYPE)}&id=${id}`;
    }
  }

  function resetBrandSpotlightTimer() {
    if (brandSpotlightTimer) clearInterval(brandSpotlightTimer);
    if (brandSpotlightItems.length < 2) return;
    brandSpotlightTimer = window.setInterval(() => {
      brandSpotlightIndex = (brandSpotlightIndex + 1) % brandSpotlightItems.length;
      renderBrandSpotlightItem(brandSpotlightItems[brandSpotlightIndex]);
    }, 6000);
  }

  function updateBrandSpotlight(items = []) {
    if (!spotlight.section) return;
    brandSpotlightItems = buildBrandSpotlightPool(items.length ? items : allBrands);
    brandSpotlightIndex = 0;
    if (!brandSpotlightItems.length) {
      spotlight.section.hidden = true;
      if (brandSpotlightTimer) clearInterval(brandSpotlightTimer);
      return;
    }
    renderBrandSpotlightItem(brandSpotlightItems[0]);
    resetBrandSpotlightTimer();
  }

  async function saveToListFromHome(payload) {
    const result = { ok: false, saved: null };
    const client = await ensureSupabase();
    if (!client) {
      showBrandsToast('List service unavailable', true);
      return result;
    }
    if (!currentUser?.id) {
      window.location.href = 'login.html';
      return result;
    }

    const mediaType = String(payload.mediaType || '').toLowerCase();
    const listType = payload.listType;
    const nextSaved = typeof payload.nextSaved === 'boolean' ? payload.nextSaved : null;
    if (!payload.itemId || !listType) return result;
    if (!supportsHomeLists(mediaType)) {
      showBrandsToast('Lists are not available for this media yet.');
      return result;
    }

    const ensureLinkedMediaRecord = async (_itemId) => true;

    try {
      const defaultListTable = getHomeDefaultListTable(mediaType);
      const itemId = normalizeHomeDefaultItemId(mediaType, payload.itemId);

      if (defaultListTable) {
        if (itemId === null) {
          showBrandsToast('Could not update list', true);
          return result;
        }
        const { table, itemField } = defaultListTable;

        if (nextSaved === false) {
          const { error: deleteError } = await client
            .from(table)
            .delete()
            .eq('user_id', currentUser.id)
            .eq(itemField, itemId)
            .eq('list_type', listType);
          if (deleteError) {
            showBrandsToast('Could not update list', true);
            return result;
          }
          showBrandsToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        if (nextSaved === true) {
          const ensured = await ensureLinkedMediaRecord(itemId);
          if (!ensured) {
            showBrandsToast('Book info is unavailable right now.', true);
            return result;
          }
          const insertRow = { user_id: currentUser.id, list_type: listType };
          insertRow[itemField] = itemId;
          const { error: insertError } = await client.from(table).insert(insertRow);
          if (insertError && String(insertError.code || '') !== '23505') {
            showBrandsToast('Could not add to list', true);
            return result;
          }
          showBrandsToast('Added to list');
          result.ok = true;
          result.saved = true;
          return result;
        }

        const { data: existing } = await client
          .from(table)
          .select('id')
          .eq('user_id', currentUser.id)
          .eq(itemField, itemId)
          .eq('list_type', listType)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          const { error: deleteError } = await client.from(table).delete().eq('id', existing.id);
          if (deleteError) {
            showBrandsToast('Could not update list', true);
            return result;
          }
          showBrandsToast('Removed from list');
          result.ok = true;
          result.saved = false;
          return result;
        }

        await ensureLinkedMediaRecord(itemId);
        const insertRow = { user_id: currentUser.id, list_type: listType };
        insertRow[itemField] = itemId;
        const { error: insertError } = await client.from(table).insert(insertRow);
        if (insertError && String(insertError.code || '') !== '23505') {
          showBrandsToast('Could not add to list', true);
          return result;
        }
        showBrandsToast('Added to list');
        result.ok = true;
        result.saved = true;
        return result;
      }
    } catch (_err) {
      showBrandsToast('Could not add to list', true);
    }
    return result;
  }

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    return await saveToListFromHome({
      mediaType: BRAND_TYPE,
      itemId,
      listType,
      nextSaved
    });
  }

  function renderCategories(items = []) {
    if (!categorySelect) return;
    const categories = Array.from(new Set(items.map((b) => b.category).filter(Boolean))).sort();
    categorySelect.innerHTML = `
      <option value="all">All ${escapeHtml(BRAND_LABEL)} Brands</option>
      ${categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
    `;
  }

  function normalizeBrandSearch(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getFilteredBrands() {
    const search = String(searchInput?.value || '').trim();
    const category = String(categorySelect?.value || 'all').toLowerCase();
    
    // If no search query, just apply category filter
    if (!search) {
      clearDidYouMean();
      return allBrands.filter((brand) => {
        if (category !== 'all' && String(brand.category || '').toLowerCase() !== category) return false;
        return true;
      });
    }
    
    const searchNormalized = normalizeBrandSearch(search);
    const searchTokens = searchNormalized.split(/\s+/).filter(Boolean);
    const expandedTokens = expandBrandSearchTokens(search);
    
    if (!searchTokens.length) {
      clearDidYouMean();
      return allBrands.filter((brand) => {
        if (category !== 'all' && String(brand.category || '').toLowerCase() !== category) return false;
        return true;
      });
    }
    
    // Score and rank results for better accuracy
    const scored = allBrands
      .map((brand) => {
        if (category !== 'all' && String(brand.category || '').toLowerCase() !== category) return null;
        
        const brandName = normalizeBrandSearch(brand.name || '');
        const brandCategory = normalizeBrandSearch(brand.category || '');
        const brandDescription = normalizeBrandSearch(brand.description || '');
        const brandCountry = normalizeBrandSearch(brand.country || '');
        const brandTags = Array.isArray(brand.tags) ? brand.tags.map(t => normalizeBrandSearch(t)).join(' ') : '';
        
        let score = 0;
        let matchCount = 0;
        
        // Build searchable fields
        const nameWords = brandName.split(' ').filter(Boolean);
        const searchableText = `${brandName} ${brandCategory} ${brandDescription} ${brandCountry} ${brandTags}`;
        
        // Check each search token (including expanded aliases)
        expandedTokens.forEach((token) => {
          // Exact name match (highest priority)
          if (brandName === token) {
            score += 100;
            matchCount++;
            return;
          }
          
          // Name starts with token
          if (brandName.startsWith(token)) {
            score += 80;
            matchCount++;
            return;
          }
          
          // Name contains token
          if (brandName.includes(token)) {
            score += 60;
            matchCount++;
            return;
          }
          
          // Category match
          if (brandCategory.includes(token)) {
            score += 40;
            matchCount++;
            return;
          }
          
          // Country match
          if (brandCountry.includes(token)) {
            score += 35;
            matchCount++;
            return;
          }
          
          // Tags match
          if (brandTags.includes(token)) {
            score += 30;
            matchCount++;
            return;
          }
          
          // Description match (lowest priority)
          if (searchableText.includes(token)) {
            score += 10;
            matchCount++;
            return;
          }
        });
        
        // Bonus for matching all tokens
        if (matchCount >= searchTokens.length) {
          score += 50;
        }
        
        // Only include brands that matched at least one token
        if (matchCount === 0) return null;
        
        return { brand, score };
      })
      .filter(Boolean);
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(item => item.brand);
  }

  function updateCount(count) {
    if (countText) {
      countText.textContent = `${count} ${count === 1 ? 'brand' : 'brands'} shown`;
    }
  }

  function createCard(brand) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;

    const id = String(brand.id || brand.slug || brand.domain || brand.name || '').trim();
    const href = `brand.html?type=${encodeURIComponent(BRAND_TYPE)}&id=${encodeURIComponent(id)}`;
    const title = String(brand.name || '').trim() || 'Brand';
    const subtitle = [brand.category, brand.country].filter(Boolean).join(' • ') || BRAND_LABEL;
    const extra = String(brand.description || '').trim() || ' ';
    const image = String(brand.logo || '/newlogo.webp').trim();

    // Dataset fields used by the index-style list menu adapter
    card.dataset.href = href;
    card.dataset.title = title;
    card.dataset.subtitle = subtitle;
    card.dataset.mediaType = BRAND_TYPE;
    card.dataset.itemId = id;
    card.dataset.image = image;
    card.dataset.listImage = image;

    const showMenu = typeof window.openIndexStyleListMenu === 'function';
    const trailingControl = showMenu
      ? `
        <div class="card-menu-wrap">
          <button class="card-menu-btn" type="button" aria-label="Add to lists"><i class="fas fa-ellipsis-v"></i></button>
        </div>
      `
      : `
        <div class="card-menu-wrap">
          <a class="card-open-link" href="${escapeHtml(href)}" aria-label="Open brand"><i class="fas fa-arrow-up-right-from-square"></i></a>
        </div>
      `;

    const iconClass = BRAND_TYPE === 'food' ? 'fa-burger' : (BRAND_TYPE === 'car' ? 'fa-car' : 'fa-shirt');
    const label = BRAND_TYPE === 'food' ? 'Food' : (BRAND_TYPE === 'car' ? 'Cars' : 'Fashion');

    card.innerHTML = `
      <div class="card-hover-cue"><i class="fas fa-arrow-up-right-from-square"></i> Open</div>
      <div class="card-media brand-cover is-loading-media">
        <img
          src="${BRAND_IMAGE_PLACEHOLDER}"
          data-defer-src="${escapeHtml(image)}"
          data-fallback-image="/newlogo.webp"
          data-home-image="1"
          data-image-ready="0"
          alt="${escapeHtml(title)} logo"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
      <div class="card-meta">
        <span class="card-type"><i class="fa-solid ${escapeHtml(iconClass)}"></i> ${escapeHtml(label)}</span>
        <div class="card-meta-top">
          <p class="card-name">${escapeHtml(title)}</p>
          ${trailingControl}
        </div>
        <p class="card-sub">${escapeHtml(subtitle)}</p>
        <p class="card-extra">${escapeHtml(extra)}</p>
      </div>
    `;

    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (window.openIndexStyleListMenu) window.openIndexStyleListMenu(card);
      });
    }

    const navigate = () => {
      window.location.href = href;
    };

    card.addEventListener('click', (event) => {
      if (event?.target?.closest?.('.card-menu-btn') || event?.target?.closest?.('.card-open-link')) return;
      navigate();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      navigate();
    });

    return card;
  }

  function renderGrid() {
    if (!grid) return;
    const filtered = getFilteredBrands();
    grid.innerHTML = '';
    updateCount(filtered.length);
    clearDidYouMean();
    
    if (!filtered.length) {
      const q = String(searchInput?.value || '').trim();
      const helper = window.ZO2Y_DID_YOU_MEAN;
      if (q && helper?.suggest) {
        const suggestion = helper.suggest(q, allBrands.map((b) => b?.name).filter(Boolean), { maxDistance: 4 });
        if (suggestion && helper.normalize(suggestion) !== helper.normalize(q)) {
          const matches = allBrands.filter((b) => helper.normalize(b?.name) === helper.normalize(suggestion));
          if (matches.length) {
            updateCount(matches.length);
            showDidYouMean(q, suggestion);
            const fragment = document.createDocumentFragment();
            matches.forEach((brand) => fragment.appendChild(createCard(brand)));
            grid.appendChild(fragment);
            wireBrandImageState(grid);
            primeBrandImages(grid);
            updateBrandSpotlight(matches);
            return;
          }
        }
      }
      showDidYouMean(q, null);
      grid.innerHTML = `<div class="empty-state">No ${escapeHtml(BRAND_LABEL)} brands found.</div>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    filtered.forEach((brand) => fragment.appendChild(createCard(brand)));
    grid.appendChild(fragment);
    wireBrandImageState(grid);
    primeBrandImages(grid);
    updateBrandSpotlight(filtered);
  }

  function clearDidYouMean() {
    if (didYouMeanText) didYouMeanText.textContent = '';
  }

  function showDidYouMean(query, suggestion) {
    if (!didYouMeanText) return;
    if (!suggestion) {
      didYouMeanText.textContent = '';
      return;
    }
    didYouMeanText.textContent = `Showing "${suggestion}" instead of "${query}"`;
  }

  async function loadSession() {
    const client = ensureSupabase();
    if (!client?.auth?.getSession) return null;
    try {
      const { data } = await client.auth.getSession();
      currentUser = data?.session?.user || null;
      return currentUser;
    } catch (_err) {
      return null;
    }
  }

  async function loadBrands() {
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state">Loading brands...</div>';
    const client = ensureSupabase();
    if (!client) {
      allBrands = FALLBACKS.map(normalizeBrand);
      renderCategories(allBrands);
      renderGrid();
      return;
    }

    const { data, error } = await client
      .from(BRAND_TABLE)
      .select('id,name,slug,domain,logo_url,description,category,country,founded,tags')
      .order('name', { ascending: true })
      .limit(500);

    if (error || !Array.isArray(data) || !data.length) {
      allBrands = dedupeBrands(FALLBACKS.map(normalizeBrand));
    } else {
      allBrands = dedupeBrands(data.map(normalizeBrand));
    }

    renderCategories(allBrands);
    renderGrid();
    updateBrandSpotlight(getFilteredBrands());
    void ensureBrandBackgroundManifest().then(() => updateBrandSpotlight(getFilteredBrands()));
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== 'function') return;
    window.initIndexStyleListMenu({
      mediaType: BRAND_TYPE,
      getCurrentUser: () => currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) => {
        if (typeof window.showToast === 'function') window.showToast(message, isError ? 'error' : 'success');
        else if (isError) console.error(message);
      }
    });
    if (window.ListUtils && typeof window.ListUtils.bindGlobalListUx === 'function') {
      window.ListUtils.bindGlobalListUx();
    }
  }

  function wireEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', renderGrid);
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', renderGrid);
    }
    if (categorySelect) {
      categorySelect.addEventListener('change', renderGrid);
    }
    if (filterBtn && filterModal) {
      filterBtn.addEventListener('click', () => {
        filterModal.classList.add('show');
        filterModal.setAttribute('aria-hidden', 'false');
      });
    }
    if (filterCloseBtn && filterModal) {
      filterCloseBtn.addEventListener('click', () => {
        filterModal.classList.remove('show');
        filterModal.setAttribute('aria-hidden', 'true');
      });
    }
    if (filterModal) {
      filterModal.addEventListener('click', (event) => {
        if (event.target !== filterModal) return;
        filterModal.classList.remove('show');
        filterModal.setAttribute('aria-hidden', 'true');
      });
    }
  }

  function initPageMeta() {
    const title = `${BRAND_LABEL} Brands · Zo2y`;
    document.title = title;
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.innerHTML = `${BRAND_LABEL} <span><i class="fa-solid ${BRAND_ICON}"></i></span>`;
    if (subtitleEl) subtitleEl.textContent = `Discover and review ${BRAND_LABEL.toLowerCase()} brands you actually wear or eat.`;
  }

  async function boot() {
    initPageMeta();
    wireEvents();
    await loadSession();
    initMenuBridge();
    await loadBrands();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();







