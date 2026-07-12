-- ============================================================
-- Seed brand images (logo_url) for fashion, food, and car brands
-- Source: Pexels (free stock photos, no attribution required)
-- Fashion & Food: UPDATE only where logo_url IS NULL (preserve existing logos)
-- Car brands: INSERT with ON CONFLICT DO NOTHING + UPDATE
-- ============================================================

-- ── FASHION BRANDS ────────────────────────────────────────────
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/35378539/pexels-photo-35378539.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'abercrombie' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/33023120/pexels-photo-33023120.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'allbirds' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/19599227/pexels-photo-19599227.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ae' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/6748310/pexels-photo-6748310.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'asics' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/11056192/pexels-photo-11056192.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'bape' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/7193872/pexels-photo-7193872.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'birkenstock' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/896293/pexels-photo-896293.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'boohoo' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/14483575/pexels-photo-14483575.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'canadagoose' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/38440086/pexels-photo-38440086.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'champion' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/12210298/pexels-photo-12210298.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'clarks' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/8553594/pexels-photo-8553594.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'colehaan' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/4271563/pexels-photo-4271563.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'converse' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/35188183/pexels-photo-35188183.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'cos' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/1159670/pexels-photo-1159670.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'drmartens' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/36730419/pexels-photo-36730419.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'express' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/2559487/pexels-photo-2559487.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'forever21' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/19599225/pexels-photo-19599225.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'gap' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/16791338/pexels-photo-16791338.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'givenchy' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/13430493/pexels-photo-13430493.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'guess' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/37919606/pexels-photo-37919606.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'hugoboss' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/8387807/pexels-photo-8387807.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'jcrew' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/17459731/pexels-photo-17459731.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'kith' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/9547926/pexels-photo-9547926.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lacoste' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/16811856/pexels-photo-16811856.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'levi' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/2433863/pexels-photo-2433863.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'longchamp' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/8872319/pexels-photo-8872319.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mango' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/267235/pexels-photo-267235.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'merrell' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/16387248/pexels-photo-16387248.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'michaelkors' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/28779294/pexels-photo-28779294.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'moncler' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/12284598/pexels-photo-12284598.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'newbalance' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/25078868/pexels-photo-25078868.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'oakley' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/18368120/pexels-photo-18368120.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'puma' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/31156334/pexels-photo-31156334.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ralphlauren' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/10050109/pexels-photo-10050109.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'reebok' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/10619446/pexels-photo-10619446.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'reiss' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/3809175/pexels-photo-3809175.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'rolex' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/6776082/pexels-photo-6776082.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'saucony' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/23319158/pexels-photo-23319158.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'timberland' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/19599225/pexels-photo-19599225.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tommy' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/9780700/pexels-photo-9780700.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'toryburch' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/3153853/pexels-photo-3153853.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tudorwatch' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/28934668/pexels-photo-28934668.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ugg' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/31125079/pexels-photo-31125079.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'umbro' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/38536842/pexels-photo-38536842.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'underarmour' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/6772843/pexels-photo-6772843.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'urbanoutfitters' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/19371811/pexels-photo-19371811.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'vacheron-constantin' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/10777479/pexels-photo-10777479.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'valentino' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/8079829/pexels-photo-8079829.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'vans' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/17395073/pexels-photo-17395073.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'versace' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/12713941/pexels-photo-12713941.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'victoriassecret' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/37780115/pexels-photo-37780115.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'vuoriclothing' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/36823890/pexels-photo-36823890.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'weekday' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/33188523/pexels-photo-33188523.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'wrangler' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/13794453/pexels-photo-13794453.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ysl' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/9168241/pexels-photo-9168241.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zalando' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/32642305/pexels-photo-32642305.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zegna' AND (logo_url IS NULL OR logo_url = '');
UPDATE fashion_brands SET logo_url = 'https://images.pexels.com/photos/18455538/pexels-photo-18455538.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zenith-watches' AND (logo_url IS NULL OR logo_url = '');

-- ── FOOD BRANDS ───────────────────────────────────────────────
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/5763203/pexels-photo-5763203.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'arbys' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/17398001/pexels-photo-17398001.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'buffalowildwings' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/13730502/pexels-photo-13730502.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'carrabbas' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36989888/pexels-photo-36989888.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'chilis' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/18210709/pexels-photo-18210709.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'crackerbarrel' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/31023379/pexels-photo-31023379.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'culvers' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/5738363/pexels-photo-5738363.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'dairyqueen' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/30837175/pexels-photo-30837175.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'dennys' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/20584517/pexels-photo-20584517.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'dunkin' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/35865625/pexels-photo-35865625.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'jackinthebox' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/14812895/pexels-photo-14812895.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'littlecaesars' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/9113979/pexels-photo-9113979.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'nandos' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/33336797/pexels-photo-33336797.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'pandaexpress' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/2969307/pexels-photo-2969307.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'panerabread' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/4833640/pexels-photo-4833640.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'papajohns' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36006047/pexels-photo-36006047.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'peets' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/793005/pexels-photo-793005.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'popeyes' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/14843552/pexels-photo-14843552.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'raisingcanes' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/3650124/pexels-photo-3650124.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'redlobster' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/31532252/pexels-photo-31532252.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'redrobin' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/9178986/pexels-photo-9178986.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'smoothieking' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/34194558/pexels-photo-34194558.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'sonicdrivein' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36285423/pexels-photo-36285423.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'sweetgreen' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/6400008/pexels-photo-6400008.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'taco-bell' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36498703/pexels-photo-36498703.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tacobell' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/5539072/pexels-photo-5539072.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'texasroadhouse' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36683028/pexels-photo-36683028.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'thecapitalgrille' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/28962830/pexels-photo-28962830.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'thecheesecakefactory' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/18372919/pexels-photo-18372919.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'timhortons' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/5713526/pexels-photo-5713526.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tljus' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/18319038/pexels-photo-18319038.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'torchystacos' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/36869209/pexels-photo-36869209.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'txchicken' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/11872317/pexels-photo-11872317.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'wagamama' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/30603926/pexels-photo-30603926.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'whataburger' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/13950603/pexels-photo-13950603.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'whitecastle' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/17398000/pexels-photo-17398000.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'wingstop' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/47546/sushi-eat-japanese-asia-47546.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'yosushi' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/19972937/pexels-photo-19972937.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zaxbys' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/4088769/pexels-photo-4088769.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zippys' AND (logo_url IS NULL OR logo_url = '');
UPDATE food_brands SET logo_url = 'https://images.pexels.com/photos/9213971/pexels-photo-9213971.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zoeskitchen' AND (logo_url IS NULL OR logo_url = '');

-- ── CAR BRANDS ────────────────────────────────────────────────
INSERT INTO car_brands (slug, name, logo_url) VALUES
  ('abarth', 'Abarth', 'https://images.pexels.com/photos/32923909/pexels-photo-32923909.png?auto=compress&cs=tinysrgb&w=800'),
  ('acura', 'Acura', 'https://images.pexels.com/photos/18150554/pexels-photo-18150554.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('audi', 'Audi', 'https://images.pexels.com/photos/12351517/pexels-photo-12351517.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('bmw', 'BMW', 'https://images.pexels.com/photos/14776716/pexels-photo-14776716.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('bugatti', 'Bugatti', 'https://images.pexels.com/photos/454604/pexels-photo-454604.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('buick', 'Buick', 'https://images.pexels.com/photos/28887156/pexels-photo-28887156.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('cadillac', 'Cadillac', 'https://images.pexels.com/photos/23319054/pexels-photo-23319054.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('changan', 'Changan', 'https://images.pexels.com/photos/10839743/pexels-photo-10839743.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('chevrolet', 'Chevrolet', 'https://images.pexels.com/photos/8561774/pexels-photo-8561774.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('chrysler', 'Chrysler', 'https://images.pexels.com/photos/26310010/pexels-photo-26310010.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('citroen', 'Citroën', 'https://images.pexels.com/photos/18659395/pexels-photo-18659395.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('dacia', 'Dacia', 'https://images.pexels.com/photos/19923026/pexels-photo-19923026.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('daihatsu', 'Daihatsu', 'https://images.pexels.com/photos/15275915/pexels-photo-15275915.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('dodge', 'Dodge', 'https://images.pexels.com/photos/20706251/pexels-photo-20706251.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('ferrari', 'Ferrari', 'https://images.pexels.com/photos/19444082/pexels-photo-19444082.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('fiat', 'Fiat', 'https://images.pexels.com/photos/32803827/pexels-photo-32803827.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('ford', 'Ford', 'https://images.pexels.com/photos/8516278/pexels-photo-8516278.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('geely', 'Geely', 'https://images.pexels.com/photos/13936546/pexels-photo-13936546.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('genesis', 'Genesis', 'https://images.pexels.com/photos/29566889/pexels-photo-29566889.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('honda', 'Honda', 'https://images.pexels.com/photos/25637367/pexels-photo-25637367.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('hyundai', 'Hyundai', 'https://images.pexels.com/photos/30334866/pexels-photo-30334866.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('isuzu', 'Isuzu', 'https://images.pexels.com/photos/38199714/pexels-photo-38199714.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('jaguar', 'Jaguar', 'https://images.pexels.com/photos/12175810/pexels-photo-12175810.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('jeep', 'Jeep', 'https://images.pexels.com/photos/17722340/pexels-photo-17722340.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('kia', 'Kia', 'https://images.pexels.com/photos/12032746/pexels-photo-12032746.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('lamborghini', 'Lamborghini', 'https://images.pexels.com/photos/17632050/pexels-photo-17632050.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('lancia', 'Lancia', 'https://images.pexels.com/photos/32729916/pexels-photo-32729916.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('lexus', 'Lexus', 'https://images.pexels.com/photos/19454579/pexels-photo-19454579.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('lincoln', 'Lincoln', 'https://images.pexels.com/photos/37687531/pexels-photo-37687531.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('lucidmotors', 'Lucid Motors', 'https://images.pexels.com/photos/35007643/pexels-photo-35007643.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('mahindra', 'Mahindra', 'https://images.pexels.com/photos/12937789/pexels-photo-12937789.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('maserati', 'Maserati', 'https://images.pexels.com/photos/17112582/pexels-photo-17112582.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('mazda', 'Mazda', 'https://images.pexels.com/photos/18880161/pexels-photo-18880161.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('mclaren', 'McLaren', 'https://images.pexels.com/photos/30869721/pexels-photo-30869721.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('mercedes-benz', 'Mercedes-Benz', 'https://images.pexels.com/photos/14667492/pexels-photo-14667492.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('mini', 'MINI', 'https://images.pexels.com/photos/28054233/pexels-photo-28054233.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('nio', 'NIO', 'https://images.pexels.com/photos/14401747/pexels-photo-14401747.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('opel', 'Opel', 'https://images.pexels.com/photos/4389244/pexels-photo-4389244.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('peugeot', 'Peugeot', 'https://images.pexels.com/photos/20667627/pexels-photo-20667627.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('polestar', 'Polestar', 'https://images.pexels.com/photos/15691825/pexels-photo-15691825.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('porsche', 'Porsche', 'https://images.pexels.com/photos/35715223/pexels-photo-35715223.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('proton', 'Proton', 'https://images.pexels.com/photos/17914708/pexels-photo-17914708.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('ramtrucks', 'Ram Trucks', 'https://images.pexels.com/photos/18491928/pexels-photo-18491928.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('renault', 'Renault', 'https://images.pexels.com/photos/16634642/pexels-photo-16634642.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('rimac-automobili', 'Rimac', 'https://images.pexels.com/photos/29410854/pexels-photo-29410854.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('rivian', 'Rivian', 'https://images.pexels.com/photos/38473354/pexels-photo-38473354.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('rolls-roycemotorcars', 'Rolls-Royce', 'https://images.pexels.com/photos/20943732/pexels-photo-20943732.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('saab', 'Saab', 'https://images.pexels.com/photos/34065481/pexels-photo-34065481.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('saicmotor', 'SAIC Motor', 'https://images.pexels.com/photos/21765032/pexels-photo-21765032.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('scania', 'Scania', 'https://images.pexels.com/photos/16966615/pexels-photo-16966615.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('seat', 'SEAT', 'https://images.pexels.com/photos/9016317/pexels-photo-9016317.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('skoda-auto', 'Škoda', 'https://images.pexels.com/photos/30749050/pexels-photo-30749050.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('smart', 'Smart', 'https://images.pexels.com/photos/213981/pexels-photo-213981.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('subaru', 'Subaru', 'https://images.pexels.com/photos/12920621/pexels-photo-12920621.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('tatamotors', 'Tata Motors', 'https://images.pexels.com/photos/17720659/pexels-photo-17720659.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('tesla', 'Tesla', 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('toyota', 'Toyota', 'https://images.pexels.com/photos/30287502/pexels-photo-30287502.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('vauxhall', 'Vauxhall', 'https://images.pexels.com/photos/7744713/pexels-photo-7744713.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('vinfast', 'VinFast', 'https://images.pexels.com/photos/21528473/pexels-photo-21528473.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('volkswagen', 'Volkswagen', 'https://images.pexels.com/photos/29352868/pexels-photo-29352868.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('volvocars', 'Volvo', 'https://images.pexels.com/photos/17312706/pexels-photo-17312706.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('westernstartrucks', 'Western Star', 'https://images.pexels.com/photos/31603934/pexels-photo-31603934.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('xiaopeng', 'XPeng', 'https://images.pexels.com/photos/35736774/pexels-photo-35736774.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('zeekrlife', 'Zeekr', 'https://images.pexels.com/photos/29802094/pexels-photo-29802094.jpeg?auto=compress&cs=tinysrgb&w=800')
ON CONFLICT (slug) DO NOTHING;

-- Update any car brands that already existed
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/32923909/pexels-photo-32923909.png?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'abarth';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/18150554/pexels-photo-18150554.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'acura';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/12351517/pexels-photo-12351517.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'audi';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/14776716/pexels-photo-14776716.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'bmw';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/454604/pexels-photo-454604.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'bugatti';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/28887156/pexels-photo-28887156.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'buick';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/23319054/pexels-photo-23319054.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'cadillac';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/10839743/pexels-photo-10839743.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'changan';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/8561774/pexels-photo-8561774.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'chevrolet';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/26310010/pexels-photo-26310010.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'chrysler';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/18659395/pexels-photo-18659395.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'citroen';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/19923026/pexels-photo-19923026.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'dacia';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/15275915/pexels-photo-15275915.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'daihatsu';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/20706251/pexels-photo-20706251.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'dodge';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/19444082/pexels-photo-19444082.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ferrari';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/32803827/pexels-photo-32803827.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'fiat';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/8516278/pexels-photo-8516278.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ford';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/13936546/pexels-photo-13936546.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'geely';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/29566889/pexels-photo-29566889.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'genesis';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/25637367/pexels-photo-25637367.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'honda';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/30334866/pexels-photo-30334866.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'hyundai';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/38199714/pexels-photo-38199714.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'isuzu';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/12175810/pexels-photo-12175810.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'jaguar';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17722340/pexels-photo-17722340.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'jeep';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/12032746/pexels-photo-12032746.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'kia';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17632050/pexels-photo-17632050.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lamborghini';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/32729916/pexels-photo-32729916.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lancia';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/19454579/pexels-photo-19454579.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lexus';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/37687531/pexels-photo-37687531.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lincoln';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/35007643/pexels-photo-35007643.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'lucidmotors';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/12937789/pexels-photo-12937789.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mahindra';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17112582/pexels-photo-17112582.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'maserati';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/18880161/pexels-photo-18880161.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mazda';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/30869721/pexels-photo-30869721.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mclaren';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/14667492/pexels-photo-14667492.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mercedes-benz';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/28054233/pexels-photo-28054233.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'mini';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/14401747/pexels-photo-14401747.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'nio';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/4389244/pexels-photo-4389244.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'opel';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/20667627/pexels-photo-20667627.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'peugeot';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/15691825/pexels-photo-15691825.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'polestar';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/35715223/pexels-photo-35715223.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'porsche';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17914708/pexels-photo-17914708.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'proton';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/18491928/pexels-photo-18491928.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'ramtrucks';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/16634642/pexels-photo-16634642.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'renault';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/29410854/pexels-photo-29410854.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'rimac-automobili';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/38473354/pexels-photo-38473354.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'rivian';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/20943732/pexels-photo-20943732.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'rolls-roycemotorcars';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/34065481/pexels-photo-34065481.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'saab';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/21765032/pexels-photo-21765032.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'saicmotor';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/16966615/pexels-photo-16966615.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'scania';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/9016317/pexels-photo-9016317.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'seat';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/30749050/pexels-photo-30749050.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'skoda-auto';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/213981/pexels-photo-213981.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'smart';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/12920621/pexels-photo-12920621.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'subaru';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17720659/pexels-photo-17720659.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tatamotors';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/10029873/pexels-photo-10029873.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'tesla';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/30287502/pexels-photo-30287502.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'toyota';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/7744713/pexels-photo-7744713.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'vauxhall';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/21528473/pexels-photo-21528473.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'vinfast';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/29352868/pexels-photo-29352868.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'volkswagen';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/17312706/pexels-photo-17312706.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'volvocars';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/31603934/pexels-photo-31603934.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'westernstartrucks';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/35736774/pexels-photo-35736774.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'xiaopeng';
UPDATE car_brands SET logo_url = 'https://images.pexels.com/photos/29802094/pexels-photo-29802094.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE slug = 'zeekrlife';
