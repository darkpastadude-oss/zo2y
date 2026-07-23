export const config = {
  runtime: 'nodejs'
};

function sanitizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

function toCommonsFilePath(filename, size) {
  const safeName = String(filename || '').replace(/\s+/g, '_');
  const width = Number.isFinite(size) ? size : 256;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(safeName)}?width=${width}`;
}

const TITLE_OVERRIDES = new Map([
  ['american eagle', 'American Eagle Outfitters'],
  ['american eagle outfitters', 'American Eagle Outfitters'],
  ['ae', 'American Eagle Outfitters'],
  ['arbys', "Arby's"],
  ['arby\'s', "Arby's"],
  ['chipotle', 'Chipotle Mexican Grill'],
  ['cava', 'Cava Group'],
  ['dunkin', "Dunkin'"],
  ['dunkin donuts', "Dunkin'"],
  ['chick-fil-a', 'Chick-fil-A'],
  ['chick fil a', 'Chick-fil-A'],
  ['popeyes', 'Popeyes'],
  ['burger king', 'Burger King'],
  ['kfc', 'KFC'],
  ['mcdonalds', "McDonald's"],
  ['mcdonald\'s', "McDonald's"],
  ['wendys', "Wendy's"],
  ['wendy\'s', "Wendy's"],
  ['in-n-out', 'In-N-Out Burger'],
  ['in n out', 'In-N-Out Burger'],
  ['subway', 'Subway (restaurant)'],
  ['taco bell', 'Taco Bell'],
  ['panda express', 'Panda Express'],
  ['dominos', "Domino's"],
  ['domino\'s', "Domino's"],
  ['pizza hut', 'Pizza Hut'],
  ['panera', 'Panera Bread'],
  ['panera bread', 'Panera Bread'],
  ['starbucks', 'Starbucks'],
  ['five guys', 'Five Guys'],
  ['shake shack', 'Shake Shack'],
  ['chipotle mexican grill', 'Chipotle Mexican Grill'],
  ['nike', 'Nike, Inc.'],
  ['adidas', 'Adidas'],
  ['new balance', 'New Balance'],
  ['under armour', 'Under Armour'],
  ['lululemon', 'Lululemon Athletica'],
  ['supreme', 'Supreme (skateboard shop)'],
  ['off-white', 'Off-White (brand)'],
  ['off white', 'Off-White (brand)'],
  ['h&m', 'H&M'],
  ['hm', 'H&M'],
  ['arcteryx', 'Arc\'teryx'],
  ['arc\'teryx', 'Arc\'teryx'],
  ['aritzia', 'Aritzia'],
  ['allbirds', 'Allbirds'],
  ['& other stories', '& Other Stories'],
  ['and other stories', '& Other Stories'],
  ['aerie', 'Aerie (brand)'],
  ['aeropostale', 'Aeropostale'],
  ['alexander mcqueen', 'Alexander McQueen'],
  ['abercrombie & fitch', 'Abercrombie & Fitch'],
  ['abercrombie and fitch', 'Abercrombie & Fitch'],
  ['asos', 'ASOS'],
  ['asics', 'ASICS'],
  ['stone island', 'Stone Island'],
  ['the north face', 'The North Face'],
  ['patagonia', 'Patagonia (clothing)'],
  ['gucci', 'Gucci'],
  ['prada', 'Prada'],
  ['louis vuitton', 'Louis Vuitton'],
  ['burberry', 'Burberry'],
  ['balenciaga', 'Balenciaga'],
  ['moncler', 'Moncler'],
  ['hermes', 'Hermès'],
  ['dior', 'Dior'],
  ['versace', 'Versace'],
  ['ralph lauren', 'Ralph Lauren Corporation'],
  ['calvin klein', 'Calvin Klein'],
  ['tommy hilfiger', 'Tommy Hilfiger'],
  ['coach', 'Coach (company)'],
  ['converse', 'Converse (shoe company)'],
  ['vans', 'Vans'],
  ['puma', 'Puma (brand)'],
  ['reebok', 'Reebok'],
  ['fila', 'Fila (company)'],
  ['gap', 'Gap Inc.'],
  ['old navy', 'Old Navy'],
  ['bananarepublic', 'Banana Republic'],
  ['banana republic', 'Banana Republic'],
  ['forever 21', 'Forever 21'],
  ['shein', 'Shein'],
  ['uniqlo', 'Uniqlo'],
  ['zara', 'Zara (retailer)'],
  ['cos', 'COS (fashion brand)'],
  ['arket', 'Arket'],
  ['bmw', 'BMW'],
  ['mercedes', 'Mercedes-Benz'],
  ['mercedes-benz', 'Mercedes-Benz'],
  ['vw', 'Volkswagen'],
  ['volkswagen', 'Volkswagen'],
  ['toyota', 'Toyota'],
  ['honda', 'Honda'],
  ['ford', 'Ford Motor Company'],
  ['chevrolet', 'Chevrolet'],
  ['nissan', 'Nissan'],
  ['hyundai', 'Hyundai Motor Company'],
  ['kia', 'Kia'],
  ['audi', 'Audi'],
  ['lexus', 'Lexus'],
  ['tesla', 'Tesla, Inc.'],
  ['porsche', 'Porsche'],
  ['ferrari', 'Ferrari'],
  ['lamborghini', 'Lamborghini'],
  ['land rover', 'Land Rover'],
  ['jaguar', 'Jaguar Cars'],
  ['volvo', 'Volvo Cars'],
  ['subaru', 'Subaru'],
  ['mazda', 'Mazda'],
  ['mitsubishi', 'Mitsubishi Motors'],
  ['suzuki', 'Suzuki'],
  ['peugeot', 'Peugeot'],
  ['renault', 'Renault'],
  ['fiat', 'Fiat'],
  ['alfa romeo', 'Alfa Romeo'],
  ['skoda', 'Skoda Auto'],
  ['seat', 'SEAT'],
  ['bentley', 'Bentley'],
  ['rolls-royce', 'Rolls-Royce Motor Cars'],
  ['mini', 'Mini (marque)'],
  ['jeep', 'Jeep'],
  ['gmc', 'GMC (automobile)'],
  ['cadillac', 'Cadillac'],
  ['buick', 'Buick'],
  ['dodge', 'Dodge'],
  ['chrysler', 'Chrysler'],
  ['acura', 'Acura'],
  ['infiniti', 'Infiniti'],
  ['genesis', 'Genesis Motor'],
  ['polestar', 'Polestar'],
  ['rivian', 'Rivian'],
  ['lucid', 'Lucid Motors'],
  ['byd', 'BYD Auto'],
  ['maserati', 'Maserati'],
  ['bugatti', 'Bugatti'],
  ['mclaren', 'McLaren'],
  ['aston martin', 'Aston Martin'],
  ['citroen', 'Citroen'],
  ['opel', 'Opel'],
  ['vauxhall', 'Vauxhall Motors'],
  ['lincoln', 'Lincoln Motor Company'],
  ['saab', 'Saab Automobile'],
  ['lancia', 'Lancia']
]);

const DOMAIN_TITLE_OVERRIDES = new Map([
  ['ae.com', 'American Eagle Outfitters'],
  ['americaneagle.com', 'American Eagle Outfitters'],
  ['aritzia.com', 'Aritzia'],
  ['arcteryx.com', 'Arc\'teryx'],
  ['abercrombie.com', 'Abercrombie & Fitch'],
  ['aeropostale.com', 'Aeropostale'],
  ['aerie.com', 'Aerie (brand)'],
  ['stories.com', '& Other Stories'],
  ['alexandermcqueen.com', 'Alexander McQueen'],
  ['arket.com', 'Arket'],
  ['erewhon.com', 'Erewhon'],
  ['hm.com', 'H&M'],
  ['supremenewyork.com', 'Supreme (skateboard shop)'],
  ['offwhite.com', 'Off-White (brand)'],
  ['lululemon.com', 'Lululemon Athletica'],
  ['patagonia.com', 'Patagonia (clothing)'],
  ['thenorthface.com', 'The North Face'],
  ['newbalance.com', 'New Balance'],
  ['underarmour.com', 'Under Armour'],
  ['allbirds.com', 'Allbirds'],
  ['asos.com', 'ASOS'],
  ['asics.com', 'ASICS'],
  ['nike.com', 'Nike, Inc.'],
  ['adidas.com', 'Adidas'],
  ['gucci.com', 'Gucci'],
  ['prada.com', 'Prada'],
  ['louisvuitton.com', 'Louis Vuitton'],
  ['burberry.com', 'Burberry'],
  ['balenciaga.com', 'Balenciaga'],
  ['mcdonalds.com', "McDonald's"],
  ['burgerking.com', 'Burger King'],
  ['kfc.com', 'KFC'],
  ['tacobell.com', 'Taco Bell'],
  ['dominos.com', "Domino's"],
  ['pizzahut.com', 'Pizza Hut'],
  ['subway.com', 'Subway (restaurant)'],
  ['starbucks.com', 'Starbucks'],
  ['chipotle.com', 'Chipotle Mexican Grill'],
  ['panerabread.com', 'Panera Bread'],
  ['chick-fil-a.com', 'Chick-fil-A'],
  ['fiveguys.com', 'Five Guys'],
  ['shakeshack.com', 'Shake Shack'],
  ['dunkin.com', "Dunkin'"],
  ['auntieannes.com', "Auntie Anne's"],
  ['baskinrobbins.com', 'Baskin-Robbins'],
  ['applebees.com', "Applebee's"],
  ['bojangles.com', "Bojangles'"],
  ['arbys.com', "Arby's"],
  ['pizzahut.com', 'Pizza Hut'],
  ['wendys.com', "Wendy's"],
  ['in-n-out.com', 'In-N-Out Burger'],
  ['toyota.com', 'Toyota'],
  ['honda.com', 'Honda'],
  ['ford.com', 'Ford Motor Company'],
  ['chevrolet.com', 'Chevrolet'],
  ['nissan-global.com', 'Nissan'],
  ['hyundai.com', 'Hyundai Motor Company'],
  ['kia.com', 'Kia'],
  ['bmw.com', 'BMW'],
  ['mercedes-benz.com', 'Mercedes-Benz'],
  ['audi.com', 'Audi'],
  ['lexus.com', 'Lexus'],
  ['tesla.com', 'Tesla, Inc.'],
  ['porsche.com', 'Porsche'],
  ['ferrari.com', 'Ferrari'],
  ['lamborghini.com', 'Lamborghini'],
  ['landrover.com', 'Land Rover'],
  ['jaguar.com', 'Jaguar Cars'],
  ['volvocars.com', 'Volvo Cars'],
  ['subaru.com', 'Subaru'],
  ['mazda.com', 'Mazda'],
  ['mitsubishi-motors.com', 'Mitsubishi Motors'],
  ['suzuki.com', 'Suzuki'],
  ['peugeot.com', 'Peugeot'],
  ['renault.com', 'Renault'],
  ['fiat.com', 'Fiat'],
  ['alfaromeo.com', 'Alfa Romeo'],
  ['skoda-auto.com', 'Skoda Auto'],
  ['seat.com', 'SEAT'],
  ['bentleymotors.com', 'Bentley'],
  ['rolls-roycemotorcars.com', 'Rolls-Royce Motor Cars'],
  ['mini.com', 'Mini (marque)'],
  ['jeep.com', 'Jeep'],
  ['gmc.com', 'GMC (automobile)'],
  ['cadillac.com', 'Cadillac'],
  ['buick.com', 'Buick'],
  ['dodge.com', 'Dodge'],
  ['chrysler.com', 'Chrysler'],
  ['acura.com', 'Acura'],
  ['infinitiusa.com', 'Infiniti'],
  ['genesis.com', 'Genesis Motor'],
  ['polestar.com', 'Polestar'],
  ['rivian.com', 'Rivian'],
  ['lucidmotors.com', 'Lucid Motors'],
  ['byd.com', 'BYD Auto'],
  ['maserati.com', 'Maserati'],
  ['bugatti.com', 'Bugatti'],
  ['mclaren.com', 'McLaren'],
  ['astonmartin.com', 'Aston Martin'],
  ['citroen.com', 'Citroen'],
  ['opel.com', 'Opel'],
  ['vauxhall.co.uk', 'Vauxhall Motors'],
  ['lincoln.com', 'Lincoln Motor Company']
]);

const MANUAL_LOGO_OVERRIDES = new Map([
  ['title:skoda', 'Skoda-Auto-Logo-2011-present.svg'],
  ['title:skoda auto', 'Skoda-Auto-Logo-2011-present.svg'],
  ['domain:skoda-auto.com', 'Skoda-Auto-Logo-2011-present.svg'],
  ['title:porsche', 'Porsche_Logo_2024.png'],
  ['domain:porsche.com', 'Porsche_Logo_2024.png'],
  ['title:volkswagen', 'Volkswagen_logo_2019.svg'],
  ['title:vw', 'Volkswagen_logo_2019.svg'],
  ['domain:volkswagen.com', 'Volkswagen_logo_2019.svg'],
  ['title:smart', 'Smart_2022.svg'],
  ['domain:smart.com', 'Smart_2022.svg'],
  ['title:alfa romeo', 'Logo_Alfa_Romeo_(2015).svg'],
  ['domain:alfaromeo.com', 'Logo_Alfa_Romeo_(2015).svg'],
  ['title:changan', 'Changan_icon.svg'],
  ['title:changan automobile', 'Changan_icon.svg'],
  ['domain:changan.com', 'Changan_icon.svg'],
  ['title:bentley', 'https://www.bentleymotors.com/content/dam/bm/websites/bmcom/bentleymotors-com/logos/Simplified%20Positive_BMdotCom_1000x500_2x1.png/_jcr_content/renditions/original./Simplified%20Positive_BMdotCom_1000x500_2x1.png'],
  ['domain:bentleymotors.com', 'https://www.bentleymotors.com/content/dam/bm/websites/bmcom/bentleymotors-com/logos/Simplified%20Positive_BMdotCom_1000x500_2x1.png/_jcr_content/renditions/original./Simplified%20Positive_BMdotCom_1000x500_2x1.png'],
  ['title:aston martin', '/assets/manual-logos/aston-martin.svg'],
  ['domain:astonmartin.com', '/assets/manual-logos/aston-martin.svg'],
  ['title:lee', '/assets/manual-logos/lee.svg'],
  ['domain:lee.com', '/assets/manual-logos/lee.svg'],
  ['title:first watch', 'https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png'],
  ['domain:firstwatch.com', 'https://upload.wikimedia.org/wikipedia/en/9/9a/First-watch-logo.png'],
  ['title:church\'s chicken', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg'],
  ['title:churchs chicken', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg'],
  ['domain:churchs.com', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg'],
  ['domain:churchschicken.com', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Churchs-logo.svg'],
  ['title:culichi town', 'https://d2gqo3h0psesgi.cloudfront.net/auto/culichi-town-restaurant-z7mnsplj-logo.png'],
  ['domain:culichitown.com', 'https://d2gqo3h0psesgi.cloudfront.net/auto/culichi-town-restaurant-z7mnsplj-logo.png'],
  ['title:zoe\'s kitchen', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['title:zoes kitchen', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['domain:zoeskitchen.com', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['title:taco bell', '/assets/manual-logos/taco-bell.svg'],
  ['domain:tacobell.com', '/assets/manual-logos/taco-bell.svg'],
  ['title:canada goose', 'Canada Goose 2023 logo.svg'],
  ['title:canada goose (clothing)', 'Canada Goose 2023 logo.svg'],
  ['domain:canadagoose.com', 'Canada Goose 2023 logo.svg'],
  ['domain:canadagoose.ca', 'Canada Goose 2023 logo.svg'],
  ['title:panda express', '/assets/manual-logos/panda-express.png'],
  ['domain:pandaexpress.com', '/assets/manual-logos/panda-express.png'],
  ['title:mcdonald\'s', 'McDonald\'s with slogan 2020.svg'],
  ['title:mcdonalds', 'McDonald\'s with slogan 2020.svg'],
  ['domain:mcdonalds.com', 'McDonald\'s with slogan 2020.svg'],
  ['title:kfc', 'Kfc textlogo.svg'],
  ['domain:kfc.com', 'Kfc textlogo.svg'],
  ['title:burger king', 'Burger King 2020.svg'],
  ['domain:burgerking.com', 'Burger King 2020.svg'],
  ['title:subway', 'Subway 2016 logo.svg'],
  ['domain:subway.com', 'Subway 2016 logo.svg'],
  ['title:domino\'s', 'Domino\'s 2025.svg'],
  ['title:dominos', 'Domino\'s 2025.svg'],
  ['domain:dominos.com', 'Domino\'s 2025.svg'],
  ['title:pizza hut', 'Pizza Hut classic logo.svg'],
  ['domain:pizzahut.com', 'Pizza Hut classic logo.svg'],
  ['title:starbucks', 'Starbucks coffee wordmark.png'],
  ['domain:starbucks.com', 'Starbucks coffee wordmark.png'],
  ['title:chipotle', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Chipotle_Mexican_Grill_logo.svg'],
  ['title:chipotle mexican grill', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Chipotle_Mexican_Grill_logo.svg'],
  ['domain:chipotle.com', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Chipotle_Mexican_Grill_logo.svg'],
  ['title:chick-fil-a', 'Chick-fil-A Logo.svg'],
  ['domain:chick-fil-a.com', 'Chick-fil-A Logo.svg'],
  ['title:wendy\'s', 'Wendy\'s logo 2012.svg'],
  ['title:wendys', 'Wendy\'s logo 2012.svg'],
  ['domain:wendys.com', 'Wendy\'s logo 2012.svg'],
  ['title:shake shack', 'Shake Shack logo.svg'],
  ['domain:shakeshack.com', 'Shake Shack logo.svg'],
  ['title:popeyes', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Popeyes_logo_%282023%29.svg'],
  ['domain:popeyes.com', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Popeyes_logo_%282023%29.svg'],
  ['title:dunkin\'', 'Dunkin\' 2022.svg'],
  ['title:dunkin', 'Dunkin\' 2022.svg'],
  ['title:dunkin donuts', 'Dunkin\' 2022.svg'],
  ['domain:dunkin.com', 'Dunkin\' 2022.svg'],
  ['title:little caesars', 'https://upload.wikimedia.org/wikipedia/en/5/57/Little_Caesars_logo.svg'],
  ['domain:littlecaesars.com', 'https://upload.wikimedia.org/wikipedia/en/5/57/Little_Caesars_logo.svg'],
  ['title:white castle', 'https://upload.wikimedia.org/wikipedia/en/e/e1/White_Castle_logo.svg'],
  ['domain:whitecastle.com', 'https://upload.wikimedia.org/wikipedia/en/e/e1/White_Castle_logo.svg'],
  ['title:wingstop', 'https://upload.wikimedia.org/wikipedia/en/0/0f/Wingstop_logo.svg'],
  ['domain:wingstop.com', 'https://upload.wikimedia.org/wikipedia/en/0/0f/Wingstop_logo.svg'],
  ['title:yo! sushi', 'https://upload.wikimedia.org/wikipedia/en/2/2d/YO%21_Sushi_logo.svg'],
  ['domain:yosushi.com', 'https://upload.wikimedia.org/wikipedia/en/2/2d/YO%21_Sushi_logo.svg'],
  ['title:zaxby\'s', 'https://upload.wikimedia.org/wikipedia/en/d/dd/Zaxby%27s_logo.png'],
  ['domain:zaxbys.com', 'https://upload.wikimedia.org/wikipedia/en/d/dd/Zaxby%27s_logo.png'],
  ['title:jaguar', 'Jaguar 1966 logo.svg'],
  ['domain:jaguar.com', 'Jaguar 1966 logo.svg'],
  ['title:proton', 'PROTON logo 2003.jpg'],
  ['domain:proton.com.my', 'PROTON logo 2003.jpg'],
  ['title:volvo cars', 'Volvo logo.svg'],
  ['domain:volvocars.com', 'Volvo logo.svg'],
  ['title:dacia', 'Dacia 2021 logo green.svg'],
  ['domain:daciavehicles.co.uk', 'Dacia 2021 logo green.svg'],
  ['title:genesis motor', 'Genesis division emblem.svg'],
  ['domain:genesis.com', 'Genesis division emblem.svg'],
  ['title:tommy hilfiger', 'Tommy Hilfiger logo.svg'],
  ['domain:tommyhilfiger.com', 'Tommy Hilfiger logo.svg'],
  ['title:ugg', 'UGG Australia logo.svg'],
  ['domain:ugg.com', 'UGG Australia logo.svg'],

  // ── FOOD BRANDS (comprehensive) ──────────────────────────────
  ['title:five guys', 'Five Guys logo.svg'],
  ['domain:fiveguys.com', 'Five Guys logo.svg'],
  ['title:in-n-out burger', 'InNOut 2021 logo.svg'],
  ['title:in-n-out', 'InNOut 2021 logo.svg'],
  ['domain:in-n-out.com', 'InNOut 2021 logo.svg'],
  ['title:panera bread', 'Panera Bread wordmark.svg'],
  ['title:panera', 'Panera Bread wordmark.svg'],
  ['domain:panerabread.com', 'Panera Bread wordmark.svg'],
  ['title:arby\'s', 'Arby\'s logo.svg'],
  ['title:arbys', 'Arby\'s logo.svg'],
  ['domain:arbys.com', 'Arby\'s logo.svg'],
  ['title:sonic drive-in', 'SONIC New Logo 2020.svg'],
  ['title:sonic', 'SONIC New Logo 2020.svg'],
  ['domain:sonicdrivein.com', 'SONIC New Logo 2020.svg'],
  ['title:carl\'s jr.', 'Carl\'s Jr logo.svg'],
  ['title:carl\'s jr', 'Carl\'s Jr logo.svg'],
  ['title:carls jr', 'Carl\'s Jr logo.svg'],
  ['domain:carlsjr.com', 'Carl\'s Jr logo.svg'],
  ['title:hardee\'s', 'Carl\'s Jr logo.svg'],
  ['title:hardees', 'Carl\'s Jr logo.svg'],
  ['domain:hardees.com', 'Carl\'s Jr logo.svg'],
  ['title:jack in the box', 'Jack in the Box 2009 logo.svg'],
  ['domain:jackinthebox.com', 'Jack in the Box 2009 logo.svg'],
  ['title:applebee\'s', 'AB Brand Refresh Logo R.png'],
  ['title:applebees', 'AB Brand Refresh Logo R.png'],
  ['domain:applebees.com', 'AB Brand Refresh Logo R.png'],
  ['title:olive garden', 'https://upload.wikimedia.org/wikipedia/en/1/14/Olive_Garden_Logo.svg'],
  ['domain:olivegarden.com', 'https://upload.wikimedia.org/wikipedia/en/1/14/Olive_Garden_Logo.svg'],
  ['title:red lobster', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Red_Lobster_Logo.svg'],
  ['domain:redlobster.com', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Red_Lobster_Logo.svg'],
  ['title:ihop', 'IHOP Restaurant logo.svg'],
  ['domain:ihop.com', 'IHOP Restaurant logo.svg'],
  ['title:denny\'s', 'Denny\'s Logo 06.2022.svg'],
  ['title:dennys', 'Denny\'s Logo 06.2022.svg'],
  ['domain:dennys.com', 'Denny\'s Logo 06.2022.svg'],
  ['title:waffle house', 'Waffle House Logo.svg'],
  ['domain:wafflehouse.com', 'Waffle House Logo.svg'],
  ['title:buffalo wild wings', 'https://upload.wikimedia.org/wikipedia/en/c/c0/Buffalo_Wild_Wings_2018.svg'],
  ['domain:buffalowildwings.com', 'https://upload.wikimedia.org/wikipedia/en/c/c0/Buffalo_Wild_Wings_2018.svg'],
  ['title:culver\'s', 'https://upload.wikimedia.org/wikipedia/en/5/59/Culver%27s_Logo.svg'],
  ['title:culvers', 'https://upload.wikimedia.org/wikipedia/en/5/59/Culver%27s_Logo.svg'],
  ['domain:culvers.com', 'https://upload.wikimedia.org/wikipedia/en/5/59/Culver%27s_Logo.svg'],
  ['title:whataburger', 'https://upload.wikimedia.org/wikipedia/en/4/48/Whataburger_logo.svg'],
  ['domain:whataburger.com', 'https://upload.wikimedia.org/wikipedia/en/4/48/Whataburger_logo.svg'],
  ['title:del taco', 'https://upload.wikimedia.org/wikipedia/en/f/f0/Del_Taco_logo.svg'],
  ['domain:deltaco.com', 'https://upload.wikimedia.org/wikipedia/en/f/f0/Del_Taco_logo.svg'],
  ['title:a&w', 'A%26W Logo.svg'],
  ['title:a&w restaurants', 'A%26W Logo.svg'],
  ['domain:awrestaurants.com', 'A%26W Logo.svg'],
  ['title:cinnabon', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Cinnabon_logo.svg'],
  ['domain:cinnabon.com', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Cinnabon_logo.svg'],
  ['title:auntie anne\'s', 'https://upload.wikimedia.org/wikipedia/en/0/05/Auntie_Anne%27s_logo.svg'],
  ['title:auntie annes', 'https://upload.wikimedia.org/wikipedia/en/0/05/Auntie_Anne%27s_logo.svg'],
  ['domain:auntieannes.com', 'https://upload.wikimedia.org/wikipedia/en/0/05/Auntie_Anne%27s_logo.svg'],
  ['title:baskin-robbins', 'Baskin-Robbins logo 2022.svg'],
  ['title:baskin robbins', 'Baskin-Robbins logo 2022.svg'],
  ['domain:baskinrobbins.com', 'Baskin-Robbins logo 2022.svg'],
  ['title:cold stone creamery', 'https://upload.wikimedia.org/wikipedia/en/b/bb/Cold_Stone_Creamery_logo.svg'],
  ['domain:coldstonecreamery.com', 'https://upload.wikimedia.org/wikipedia/en/b/bb/Cold_Stone_Creamery_logo.svg'],
  ['title:dairy queen', 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Dairy_Queen_logo.svg'],
  ['domain:dairyqueen.com', 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Dairy_Queen_logo.svg'],
  ['title:krispy kreme', 'Logo.KrispyKreme.svg'],
  ['domain:krispykreme.com', 'Logo.KrispyKreme.svg'],
  ['title:hooters', 'https://upload.wikimedia.org/wikipedia/en/0/09/Hooters_logo.svg'],
  ['domain:hooters.com', 'https://upload.wikimedia.org/wikipedia/en/0/09/Hooters_logo.svg'],
  ['title:cracker barrel', 'https://upload.wikimedia.org/wikipedia/en/4/4f/Cracker-Barrel-Logo.svg'],
  ['domain:crackerbarrel.com', 'https://upload.wikimedia.org/wikipedia/en/4/4f/Cracker-Barrel-Logo.svg'],
  ['title:texas roadhouse', 'https://upload.wikimedia.org/wikipedia/en/9/9b/Texas_Roadhouse.svg'],
  ['domain:texasroadhouse.com', 'https://upload.wikimedia.org/wikipedia/en/9/9b/Texas_Roadhouse.svg'],
  ['title:outback steakhouse', 'https://upload.wikimedia.org/wikipedia/en/b/b2/Outback_Steakhouse.svg'],
  ['domain:outback.com', 'https://upload.wikimedia.org/wikipedia/en/b/b2/Outback_Steakhouse.svg'],
  ['title:longhorn steakhouse', 'https://upload.wikimedia.org/wikipedia/en/a/a6/LongHorn_Steakhouse_logo.svg'],
  ['domain:longhornsteakhouse.com', 'https://upload.wikimedia.org/wikipedia/en/a/a6/LongHorn_Steakhouse_logo.svg'],
  ['title:nando\'s', 'Nando\'s wordmark.svg'],
  ['title:nandos', 'Nando\'s wordmark.svg'],
  ['domain:nandos.com', 'Nando\'s wordmark.svg'],
  ['title:tim hortons', 'https://upload.wikimedia.org/wikipedia/en/4/48/Tim_Hortons.svg'],
  ['domain:timhortons.com', 'https://upload.wikimedia.org/wikipedia/en/4/48/Tim_Hortons.svg'],
  ['title:jollibee', 'https://upload.wikimedia.org/wikipedia/en/8/84/Jollibee_2011_logo.svg'],
  ['domain:jollibee.com.ph', 'https://upload.wikimedia.org/wikipedia/en/8/84/Jollibee_2011_logo.svg'],
  ['title:smoothie king', 'https://upload.wikimedia.org/wikipedia/en/4/44/Smoothie_King_Logo.svg'],
  ['domain:smoothieking.com', 'https://upload.wikimedia.org/wikipedia/en/4/44/Smoothie_King_Logo.svg'],
  ['title:el pollo loco', 'https://upload.wikimedia.org/wikipedia/en/3/3e/El_Pollo_Loco_logo.svg'],
  ['domain:elpolloloco.com', 'https://upload.wikimedia.org/wikipedia/en/3/3e/El_Pollo_Loco_logo.svg'],
  ['title:golden corral', 'https://upload.wikimedia.org/wikipedia/en/d/d0/Golden_Corral_logo.svg'],
  ['domain:goldencorral.com', 'https://upload.wikimedia.org/wikipedia/en/d/d0/Golden_Corral_logo.svg'],
  ['title:raising cane\'s', 'https://upload.wikimedia.org/wikipedia/en/1/1b/Raising_Cane%27s_Chicken_Fingers_logo.svg'],
  ['title:raising canes', 'https://upload.wikimedia.org/wikipedia/en/1/1b/Raising_Cane%27s_Chicken_Fingers_logo.svg'],
  ['domain:raisingcanes.com', 'https://upload.wikimedia.org/wikipedia/en/1/1b/Raising_Cane%27s_Chicken_Fingers_logo.svg'],
  ['title:qdoba', 'https://upload.wikimedia.org/wikipedia/en/d/de/Qdoba_logo.svg'],
  ['domain:qdoba.com', 'https://upload.wikimedia.org/wikipedia/en/d/de/Qdoba_logo.svg'],
  ['title:checkers', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Checkers_Rally%27s_logo.svg'],
  ['title:rally\'s', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Checkers_Rally%27s_logo.svg'],
  ['domain:checkers.com', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Checkers_Rally%27s_logo.svg'],
  ['title:cava', 'https://upload.wikimedia.org/wikipedia/en/b/b5/Cava_Group_Logo.svg'],
  ['title:cava group', 'https://upload.wikimedia.org/wikipedia/en/b/b5/Cava_Group_Logo.svg'],
  ['domain:cava.com', 'https://upload.wikimedia.org/wikipedia/en/b/b5/Cava_Group_Logo.svg'],
  ['title:sweetgreen', 'https://upload.wikimedia.org/wikipedia/en/4/49/Sweetgreen_Logo.svg'],
  ['domain:sweetgreen.com', 'https://upload.wikimedia.org/wikipedia/en/4/49/Sweetgreen_Logo.svg'],
  ['title:moe\'s southwest grill', 'https://upload.wikimedia.org/wikipedia/en/9/99/Moe%27s_Southwest_Grill_logo.svg'],
  ['domain:moes.com', 'https://upload.wikimedia.org/wikipedia/en/9/99/Moe%27s_Southwest_Grill_logo.svg'],
  ['title:jamba', 'https://upload.wikimedia.org/wikipedia/en/f/f7/Jamba_logo.svg'],
  ['title:jamba juice', 'https://upload.wikimedia.org/wikipedia/en/f/f7/Jamba_logo.svg'],
  ['domain:jamba.com', 'https://upload.wikimedia.org/wikipedia/en/f/f7/Jamba_logo.svg'],
  ['title:p.f. chang\'s', 'https://upload.wikimedia.org/wikipedia/en/2/22/P._F._Chang%27s_logo.svg'],
  ['title:p.f. changs', 'https://upload.wikimedia.org/wikipedia/en/2/22/P._F._Chang%27s_logo.svg'],
  ['domain:pfchangs.com', 'https://upload.wikimedia.org/wikipedia/en/2/22/P._F._Chang%27s_logo.svg'],
  ['title:hard rock cafe', 'https://upload.wikimedia.org/wikipedia/en/0/0f/Hard_Rock_Cafe_Logo.svg'],
  ['domain:hardrockcafe.com', 'https://upload.wikimedia.org/wikipedia/en/0/0f/Hard_Rock_Cafe_Logo.svg'],
  ['title:benihana', 'https://upload.wikimedia.org/wikipedia/en/d/d2/Benihana_Logo.svg'],
  ['domain:benihana.com', 'https://upload.wikimedia.org/wikipedia/en/d/d2/Benihana_Logo.svg'],
  ['title:long john silver\'s', 'https://upload.wikimedia.org/wikipedia/en/7/78/Long_John_Silver%27s_logo.svg'],
  ['title:long john silvers', 'https://upload.wikimedia.org/wikipedia/en/7/78/Long_John_Silver%27s_logo.svg'],
  ['domain:ljsilvers.com', 'https://upload.wikimedia.org/wikipedia/en/7/78/Long_John_Silver%27s_logo.svg'],
  ['title:fatburger', 'https://upload.wikimedia.org/wikipedia/en/5/51/Fatburger_logo.svg'],
  ['domain:fatburger.com', 'https://upload.wikimedia.org/wikipedia/en/5/51/Fatburger_logo.svg'],
  ['title:johnny rockets', 'https://upload.wikimedia.org/wikipedia/en/d/d1/Johnny_Rockets_Logo.svg'],
  ['domain:johnnyrockets.com', 'https://upload.wikimedia.org/wikipedia/en/d/d1/Johnny_Rockets_Logo.svg'],

  // ── FASHION BRANDS (comprehensive) ───────────────────────────
  ['title:nike', 'Logo NIKE.svg'],
  ['title:nike, inc.', 'Logo NIKE.svg'],
  ['domain:nike.com', 'Logo NIKE.svg'],
  ['title:adidas', 'Adidas 2022 logo.svg'],
  ['domain:adidas.com', 'Adidas 2022 logo.svg'],
  ['title:puma', 'Puma-logo-(text).svg'],
  ['title:puma (brand)', 'Puma-logo-(text).svg'],
  ['domain:puma.com', 'Puma-logo-(text).svg'],
  ['title:reebok', 'Reebok International logo.svg'],
  ['domain:reebok.com', 'Reebok International logo.svg'],
  ['title:new balance', 'New Balance logo.svg'],
  ['domain:newbalance.com', 'New Balance logo.svg'],
  ['title:under armour', 'Under armour logo.svg'],
  ['domain:underarmour.com', 'Under armour logo.svg'],
  ['title:asics', 'Asics Logo.svg'],
  ['domain:asics.com', 'Asics Logo.svg'],
  ['title:saucony', 'Logo Saucony.svg'],
  ['domain:saucony.com', 'Logo Saucony.svg'],
  ['title:brooks', 'Brooks Sports Logo.svg'],
  ['title:brooks sports', 'Brooks Sports Logo.svg'],
  ['domain:brooksrunning.com', 'Brooks Sports Logo.svg'],
  ['title:hoka', 'Hoka logo.svg'],
  ['domain:hoka.com', 'Hoka logo.svg'],
  ['title:on running', 'On (Running Shoes) Logo.svg'],
  ['title:on (company)', 'On (Running Shoes) Logo.svg'],
  ['domain:on-running.com', 'On (Running Shoes) Logo.svg'],
  ['title:salomon', 'Salomon Group Logo.svg'],
  ['title:salomon group', 'Salomon Group Logo.svg'],
  ['domain:salomon.com', 'Salomon Group Logo.svg'],
  ['title:converse', 'Converse logo.svg'],
  ['title:converse (shoe company)', 'Converse logo.svg'],
  ['domain:converse.com', 'Converse logo.svg'],
  ['title:vans', 'Vans-logo.svg'],
  ['domain:vans.com', 'Vans-logo.svg'],
  ['title:skechers', 'https://upload.wikimedia.org/wikipedia/en/4/45/Skechers_logo.svg'],
  ['domain:skechers.com', 'https://upload.wikimedia.org/wikipedia/en/4/45/Skechers_logo.svg'],
  ['title:crocs', 'https://upload.wikimedia.org/wikipedia/en/a/a1/Crocs_wordmark.svg'],
  ['domain:crocs.com', 'https://upload.wikimedia.org/wikipedia/en/a/a1/Crocs_wordmark.svg'],
  ['title:birkenstock', 'Birkenstock logo.svg'],
  ['domain:birkenstock.com', 'Birkenstock logo.svg'],
  ['title:allbirds', 'Allbirds logo.svg'],
  ['domain:allbirds.com', 'Allbirds logo.svg'],
  ['title:zara', 'Zara Logo.svg'],
  ['title:zara (retailer)', 'Zara Logo.svg'],
  ['domain:zara.com', 'Zara Logo.svg'],
  ['title:h&m', 'H%26M-Logo.svg'],
  ['title:hm', 'H%26M-Logo.svg'],
  ['domain:hm.com', 'H%26M-Logo.svg'],
  ['title:uniqlo', 'UNIQLO logo (Japanese).svg'],
  ['domain:uniqlo.com', 'UNIQLO logo (Japanese).svg'],
  ['title:gap', 'Gap logo.svg'],
  ['title:gap inc.', 'Gap logo.svg'],
  ['domain:gap.com', 'Gap logo.svg'],
  ['title:old navy', 'https://upload.wikimedia.org/wikipedia/en/4/4d/Old_Navy_Logo.svg'],
  ['domain:oldnavy.com', 'https://upload.wikimedia.org/wikipedia/en/4/4d/Old_Navy_Logo.svg'],
  ['title:american eagle', 'American Eagle Outfitters wordmark.svg'],
  ['title:american eagle outfitters', 'American Eagle Outfitters wordmark.svg'],
  ['domain:ae.com', 'American Eagle Outfitters wordmark.svg'],
  ['title:abercrombie & fitch', 'Abercrombie %26 Fitch logo.svg'],
  ['title:abercrombie', 'Abercrombie %26 Fitch logo.svg'],
  ['domain:abercrombie.com', 'Abercrombie %26 Fitch logo.svg'],
  ['title:hollister', 'https://upload.wikimedia.org/wikipedia/en/2/2f/Hollister_Co._logo.svg'],
  ['title:hollister co.', 'https://upload.wikimedia.org/wikipedia/en/2/2f/Hollister_Co._logo.svg'],
  ['domain:hollisterco.com', 'https://upload.wikimedia.org/wikipedia/en/2/2f/Hollister_Co._logo.svg'],
  ['title:urban outfitters', 'Urban Outfitters logo.svg'],
  ['domain:urbanoutfitters.com', 'Urban Outfitters logo.svg'],
  ['title:free people', 'https://upload.wikimedia.org/wikipedia/en/8/83/Free_People_logo.svg'],
  ['domain:freepeople.com', 'https://upload.wikimedia.org/wikipedia/en/8/83/Free_People_logo.svg'],
  ['title:anthropologie', 'https://upload.wikimedia.org/wikipedia/en/d/df/Anthropologie_logo.svg'],
  ['domain:anthropologie.com', 'https://upload.wikimedia.org/wikipedia/en/d/df/Anthropologie_logo.svg'],
  ['title:madewell', 'https://upload.wikimedia.org/wikipedia/en/6/6b/Madewell_logo.svg'],
  ['domain:madewell.com', 'https://upload.wikimedia.org/wikipedia/en/6/6b/Madewell_logo.svg'],
  ['title:j.crew', 'JCrew logo.svg'],
  ['title:j crew', 'JCrew logo.svg'],
  ['domain:jcrew.com', 'JCrew logo.svg'],
  ['title:ralph lauren', 'Ralph Lauren logo.svg'],
  ['title:ralph lauren corporation', 'Ralph Lauren logo.svg'],
  ['domain:ralphlauren.com', 'Ralph Lauren logo.svg'],
  ['title:calvin klein', 'Calvin Klein Logo.svg'],
  ['domain:calvinklein.com', 'Calvin Klein Logo.svg'],
  ['title:lacoste', 'Lacoste wordmark 2011.svg'],
  ['domain:lacoste.com', 'Lacoste wordmark 2011.svg'],
  ['title:levi\'s', 'Levi\'s logo.svg'],
  ['title:levis', 'Levi\'s logo.svg'],
  ['domain:levi.com', 'Levi\'s logo.svg'],
  ['title:carhartt', 'Carhartt logo.svg'],
  ['domain:carhartt.com', 'Carhartt logo.svg'],
  ['title:dickies', 'Dickies Logo.svg'],
  ['domain:dickies.com', 'Dickies Logo.svg'],
  ['title:patagonia', 'Patagonia (Unternehmen) logo.svg'],
  ['title:patagonia (clothing)', 'Patagonia (Unternehmen) logo.svg'],
  ['domain:patagonia.com', 'Patagonia (Unternehmen) logo.svg'],
  ['title:the north face', 'The North Face logo.svg'],
  ['domain:thenorthface.com', 'The North Face logo.svg'],
  ['title:columbia sportswear', 'Columbia Sportswear Company Logo.svg'],
  ['title:columbia', 'Columbia Sportswear Company Logo.svg'],
  ['domain:columbia.com', 'Columbia Sportswear Company Logo.svg'],
  ['title:arc\'teryx', 'https://upload.wikimedia.org/wikipedia/en/4/46/Arcteryx_logo.svg'],
  ['title:arcteryx', 'https://upload.wikimedia.org/wikipedia/en/4/46/Arcteryx_logo.svg'],
  ['domain:arcteryx.com', 'https://upload.wikimedia.org/wikipedia/en/4/46/Arcteryx_logo.svg'],
  ['title:lululemon', 'Lululemon Athletica logo.svg'],
  ['title:lululemon athletica', 'Lululemon Athletica logo.svg'],
  ['domain:lululemon.com', 'Lululemon Athletica logo.svg'],
  ['title:gucci', 'Gucci Logo.svg'],
  ['domain:gucci.com', 'Gucci Logo.svg'],
  ['title:prada', 'Prada-Logo.svg'],
  ['domain:prada.com', 'Prada-Logo.svg'],
  ['title:louis vuitton', 'Louis Vuitton logo.svg'],
  ['domain:louisvuitton.com', 'Louis Vuitton logo.svg'],
  ['title:chanel', 'Chanel logo.svg'],
  ['domain:chanel.com', 'Chanel logo.svg'],
  ['title:dior', 'Christian Dior logo.svg'],
  ['title:christian dior', 'Christian Dior logo.svg'],
  ['domain:dior.com', 'Christian Dior logo.svg'],
  ['title:fendi', 'Fendi logo.svg'],
  ['domain:fendi.com', 'Fendi logo.svg'],
  ['title:celine', 'https://upload.wikimedia.org/wikipedia/en/6/62/Celine_Logo.svg'],
  ['domain:celine.com', 'https://upload.wikimedia.org/wikipedia/en/6/62/Celine_Logo.svg'],
  ['title:bottega veneta', 'https://upload.wikimedia.org/wikipedia/en/c/c8/Bottega_Veneta_Logo.svg'],
  ['domain:bottegaveneta.com', 'https://upload.wikimedia.org/wikipedia/en/c/c8/Bottega_Veneta_Logo.svg'],
  ['title:valentino', 'Valentino logo.svg'],
  ['domain:valentino.com', 'Valentino logo.svg'],
  ['title:givenchy', 'Givenchy - logo (France, 2003).svg'],
  ['domain:givenchy.com', 'Givenchy - logo (France, 2003).svg'],
  ['title:balenciaga', 'Balenciaga Logo.svg'],
  ['domain:balenciaga.com', 'Balenciaga Logo.svg'],
  ['title:saint laurent', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/YSL_logo.jpg'],
  ['title:yves saint laurent', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/YSL_logo.jpg'],
  ['title:ysl', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/YSL_logo.jpg'],
  ['domain:ysl.com', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/YSL_logo.jpg'],
  ['title:burberry', 'Burberry logo 2023.svg'],
  ['domain:burberry.com', 'Burberry logo 2023.svg'],
  ['title:hermès', 'Hermes Paris.svg'],
  ['title:hermes', 'Hermes Paris.svg'],
  ['domain:hermes.com', 'Hermes Paris.svg'],
  ['title:versace', 'Versace old logo.svg'],
  ['domain:versace.com', 'Versace old logo.svg'],
  ['title:victoria\'s secret', 'Victoria\'s Secret logo.svg'],
  ['title:victorias secret', 'Victoria\'s Secret logo.svg'],
  ['domain:victoriassecret.com', 'Victoria\'s Secret logo.svg'],
  ['title:coach', 'https://upload.wikimedia.org/wikipedia/en/f/f8/Coach_New_York_logo.svg'],
  ['title:coach (company)', 'https://upload.wikimedia.org/wikipedia/en/f/f8/Coach_New_York_logo.svg'],
  ['domain:coach.com', 'https://upload.wikimedia.org/wikipedia/en/f/f8/Coach_New_York_logo.svg'],
  ['title:michael kors', 'Michael Kors Logo.svg'],
  ['domain:michaelkors.com', 'Michael Kors Logo.svg'],
  ['title:tory burch', 'Tory Burch logo.svg'],
  ['domain:toryburch.com', 'Tory Burch logo.svg'],
  ['title:guess', 'Guess logo.svg'],
  ['title:guess (clothing)', 'Guess logo.svg'],
  ['domain:guess.com', 'Guess logo.svg'],
  ['title:hugo boss', 'Hugo Boss orange logo.svg'],
  ['domain:hugoboss.com', 'Hugo Boss orange logo.svg'],
  ['title:fila', 'https://upload.wikimedia.org/wikipedia/en/a/a4/Fila_logo.svg'],
  ['title:fila (company)', 'https://upload.wikimedia.org/wikipedia/en/a/a4/Fila_logo.svg'],
  ['domain:fila.com', 'https://upload.wikimedia.org/wikipedia/en/a/a4/Fila_logo.svg'],
  ['title:champion', 'Champion USA logo.svg'],
  ['title:champion (sportswear)', 'Champion USA logo.svg'],
  ['domain:champion.com', 'Champion USA logo.svg'],
  ['title:oakley', 'Oakley logo.svg'],
  ['title:oakley, inc.', 'Oakley logo.svg'],
  ['domain:oakley.com', 'Oakley logo.svg'],
  ['title:rolex', 'Rolex wordmark logo.svg'],
  ['domain:rolex.com', 'Rolex wordmark logo.svg'],
  ['title:banana republic', 'https://upload.wikimedia.org/wikipedia/en/7/74/Banana_Republic_logo.svg'],
  ['domain:bananarepublic.com', 'https://upload.wikimedia.org/wikipedia/en/7/74/Banana_Republic_logo.svg'],
  ['title:forever 21', 'Forever 21 logo.svg'],
  ['domain:forever21.com', 'Forever 21 logo.svg'],
  ['title:shein', 'https://upload.wikimedia.org/wikipedia/en/4/41/Shein_Logo.svg'],
  ['domain:shein.com', 'https://upload.wikimedia.org/wikipedia/en/4/41/Shein_Logo.svg'],
  ['title:asos', 'https://upload.wikimedia.org/wikipedia/en/d/d5/ASOS_logo.svg'],
  ['title:asos (retailer)', 'https://upload.wikimedia.org/wikipedia/en/d/d5/ASOS_logo.svg'],
  ['domain:asos.com', 'https://upload.wikimedia.org/wikipedia/en/d/d5/ASOS_logo.svg'],
  ['title:a bathing ape', 'https://upload.wikimedia.org/wikipedia/en/f/f5/A_Bathing_Ape_logo.svg'],
  ['title:bape', 'https://upload.wikimedia.org/wikipedia/en/f/f5/A_Bathing_Ape_logo.svg'],
  ['domain:bape.com', 'https://upload.wikimedia.org/wikipedia/en/f/f5/A_Bathing_Ape_logo.svg'],
  ['title:stone island', 'Stone-Island-Logo.svg'],
  ['domain:stoneisland.com', 'Stone-Island-Logo.svg'],
  ['title:off-white', 'Off-White Logo.svg'],
  ['title:off-white (brand)', 'Off-White Logo.svg'],
  ['domain:off---white.com', 'Off-White Logo.svg'],
  ['title:supreme', 'Supreme Logo.svg'],
  ['title:supreme (skateboard shop)', 'Supreme Logo.svg'],
  ['domain:supremenewyork.com', 'Supreme Logo.svg'],
  ['title:moncler', 'Logo Moncler Group.svg'],
  ['domain:moncler.com', 'Logo Moncler Group.svg'],
  ['title:mango', 'Logo of Mango (new).svg'],
  ['title:mango (retailer)', 'Logo of Mango (new).svg'],
  ['domain:mango.com', 'Logo of Mango (new).svg'],
  ['title:dr. martens', 'Dr. Martens Logo.svg'],
  ['title:dr martens', 'Dr. Martens Logo.svg'],
  ['domain:drmartens.com', 'Dr. Martens Logo.svg'],
  ['title:timberland', 'Timberland-logo.png'],
  ['domain:timberland.com', 'Timberland-logo.png'],
  ['title:clarks', 'C & J Clarks International company logo.svg'],
  ['title:clarks (shoe company)', 'C & J Clarks International company logo.svg'],
  ['domain:clarks.com', 'C & J Clarks International company logo.svg'],
  ['title:cole haan', 'Cole Haan Logo.svg'],
  ['domain:colehaan.com', 'Cole Haan Logo.svg'],
  ['title:longchamp', 'Longchamp logo.svg'],
  ['title:longchamp (company)', 'Longchamp logo.svg'],
  ['domain:longchamp.com', 'Longchamp logo.svg'],
  ['title:zegna', 'Zegna wordmark.svg'],
  ['domain:zegna.com', 'Zegna wordmark.svg'],
  ['title:boohoo', 'BoohooLogo.png'],
  ['domain:boohoo.com', 'BoohooLogo.png'],
  ['title:reiss', 'Reiss Marke.jpg'],
  ['domain:reiss.com', 'Reiss Marke.jpg'],
  ['title:kith', 'Kith brand logo.svg'],
  ['title:kith (brand)', 'Kith brand logo.svg'],
  ['domain:kith.com', 'Kith brand logo.svg'],
  ['title:umbro', 'Umbro logo (current).svg'],
  ['domain:umbro.com', 'Umbro logo (current).svg'],
  ['title:wrangler', 'Wrangler (Jeans) logo.svg'],
  ['domain:wrangler.com', 'Wrangler (Jeans) logo.svg'],
  ['title:cos', 'COS logo.png'],
  ['title:cos (fashion brand)', 'COS logo.png'],
  ['domain:cosstores.com', 'COS logo.png'],
  ['title:zalando', 'Zalando logo.svg'],
  ['domain:zalando.com', 'Zalando logo.svg'],
  ['title:express', 'Express Clothing Logo.SVG'],
  ['title:express, inc.', 'Express Clothing Logo.SVG'],
  ['domain:express.com', 'Express Clothing Logo.SVG'],
  ['title:merrell', 'Merrell-Logo.svg'],
  ['title:merrell (company)', 'Merrell-Logo.svg'],
  ['domain:merrell.com', 'Merrell-Logo.svg'],
  ['title:vacheron constantin', 'Vacheron logo.svg'],
  ['domain:vacheron-constantin.com', 'Vacheron logo.svg'],
  ['title:tudor', 'Tudor (Uhrenmarke) logo.svg'],
  ['domain:tudorwatch.com', 'Tudor (Uhrenmarke) logo.svg'],
  ['title:aritzia', 'https://upload.wikimedia.org/wikipedia/en/b/b3/Aritzia_Logo.svg'],
  ['domain:aritzia.com', 'https://upload.wikimedia.org/wikipedia/en/b/b3/Aritzia_Logo.svg'],
  ['title:aeropostale', 'https://upload.wikimedia.org/wikipedia/en/9/93/A%C3%A9ropostale_logo.svg'],
  ['domain:aeropostale.com', 'https://upload.wikimedia.org/wikipedia/en/9/93/A%C3%A9ropostale_logo.svg'],
  ['title:fjallraven', 'Fjallraven Logo.svg'],
  ['title:fjällräven', 'Fjallraven Logo.svg'],
  ['domain:fjallraven.com', 'Fjallraven Logo.svg'],
  ['title:helly hansen', 'Helly Hansen Logo.svg'],
  ['domain:hellyhansen.com', 'Helly Hansen Logo.svg'],
  ['title:acne studios', 'https://upload.wikimedia.org/wikipedia/en/3/3e/Acne_Studios_logo.svg'],
  ['domain:acnestudios.com', 'https://upload.wikimedia.org/wikipedia/en/3/3e/Acne_Studios_logo.svg'],
  ['title:comme des garçons', 'https://upload.wikimedia.org/wikipedia/en/4/47/Comme_des_Gar%C3%A7ons_logo.svg'],
  ['title:comme des garcons', 'https://upload.wikimedia.org/wikipedia/en/4/47/Comme_des_Gar%C3%A7ons_logo.svg'],
  ['domain:comme-des-garcons.com', 'https://upload.wikimedia.org/wikipedia/en/4/47/Comme_des_Gar%C3%A7ons_logo.svg'],
  ['title:kenzo', 'https://upload.wikimedia.org/wikipedia/en/a/a0/Kenzo_brand_logo.svg'],
  ['domain:kenzo.com', 'https://upload.wikimedia.org/wikipedia/en/a/a0/Kenzo_brand_logo.svg'],

  // Additional 100% Coverage Overrides
  ['title:krystal', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Krystal_Logo.svg'],
  ['domain:krystal.com', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Krystal_Logo.svg'],
  ['title:harvey\'s', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Harvey%27s_logo.svg'],
  ['title:harveys', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Harvey%27s_logo.svg'],
  ['domain:harveys.ca', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Harvey%27s_logo.svg'],
  ['title:menchie\'s', 'https://upload.wikimedia.org/wikipedia/en/e/e0/Menchie%27s_Frozen_Yogurt_logo.svg'],
  ['title:menchies', 'https://upload.wikimedia.org/wikipedia/en/e/e0/Menchie%27s_Frozen_Yogurt_logo.svg'],
  ['domain:menchies.com', 'https://upload.wikimedia.org/wikipedia/en/e/e0/Menchie%27s_Frozen_Yogurt_logo.svg'],
  ['title:yogurtland', 'https://upload.wikimedia.org/wikipedia/en/0/02/Yogurtland_logo.svg'],
  ['domain:yogurtland.com', 'https://upload.wikimedia.org/wikipedia/en/0/02/Yogurtland_logo.svg'],
  ['title:pinkberry', 'https://upload.wikimedia.org/wikipedia/en/8/87/Pinkberry_logo.svg'],
  ['domain:pinkberry.com', 'https://upload.wikimedia.org/wikipedia/en/8/87/Pinkberry_logo.svg'],
  ['title:the habit burger grill', 'https://upload.wikimedia.org/wikipedia/en/b/b5/The_Habit_Burger_Grill_logo.svg'],
  ['title:the habit', 'https://upload.wikimedia.org/wikipedia/en/b/b5/The_Habit_Burger_Grill_logo.svg'],
  ['domain:habitburger.com', 'https://upload.wikimedia.org/wikipedia/en/b/b5/The_Habit_Burger_Grill_logo.svg'],
  ['title:planet hollywood', 'https://upload.wikimedia.org/wikipedia/en/a/a1/Planet_Hollywood_logo.svg'],
  ['domain:planethollywood.com', 'https://upload.wikimedia.org/wikipedia/en/a/a1/Planet_Hollywood_logo.svg'],
  ['title:rainforest cafe', 'https://upload.wikimedia.org/wikipedia/en/8/83/Rainforest_Cafe_logo.svg'],
  ['domain:rainforestcafe.com', 'https://upload.wikimedia.org/wikipedia/en/8/83/Rainforest_Cafe_logo.svg'],
  ['title:buca di beppo', 'https://upload.wikimedia.org/wikipedia/en/2/29/Buca_di_Beppo_logo.svg'],
  ['domain:bucadibeppo.com', 'https://upload.wikimedia.org/wikipedia/en/2/29/Buca_di_Beppo_logo.svg'],
  ['title:carrabba\'s italian grill', 'https://upload.wikimedia.org/wikipedia/en/9/90/Carrabba%27s_Italian_Grill_logo.svg'],
  ['title:carrabba\'s', 'https://upload.wikimedia.org/wikipedia/en/9/90/Carrabba%27s_Italian_Grill_logo.svg'],
  ['domain:carrabbas.com', 'https://upload.wikimedia.org/wikipedia/en/9/90/Carrabba%27s_Italian_Grill_logo.svg'],
  ['title:maggiano\'s little italy', 'https://upload.wikimedia.org/wikipedia/en/b/ba/Maggiano%27s_Little_Italy_logo.svg'],
  ['title:maggiano\'s', 'https://upload.wikimedia.org/wikipedia/en/b/ba/Maggiano%27s_Little_Italy_logo.svg'],
  ['domain:maggianos.com', 'https://upload.wikimedia.org/wikipedia/en/b/ba/Maggiano%27s_Little_Italy_logo.svg'],
  ['title:pei wei', 'https://upload.wikimedia.org/wikipedia/en/5/52/Pei_Wei_Asian_Kitchen_logo.svg'],
  ['domain:peiwei.com', 'https://upload.wikimedia.org/wikipedia/en/5/52/Pei_Wei_Asian_Kitchen_logo.svg'],
  ['title:nobu', 'https://upload.wikimedia.org/wikipedia/en/e/e3/Nobu_logo.svg'],
  ['domain:noburestaurants.com', 'https://upload.wikimedia.org/wikipedia/en/e/e3/Nobu_logo.svg'],
  ['title:palace', 'https://upload.wikimedia.org/wikipedia/en/5/55/Palace_Skateboards_logo.svg'],
  ['title:palace skateboards', 'https://upload.wikimedia.org/wikipedia/en/5/55/Palace_Skateboards_logo.svg'],
  ['domain:palaceskateboards.com', 'https://upload.wikimedia.org/wikipedia/en/5/55/Palace_Skateboards_logo.svg'],
  ['title:stüssy', 'St%C3%BCssy_logo.svg'],
  ['title:stussy', 'St%C3%BCssy_logo.svg'],
  ['domain:stussy.com', 'St%C3%BCssy_logo.svg'],
  ['title:sacai', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Sacai_logo.svg'],
  ['domain:sacai.jp', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Sacai_logo.svg'],
  ['title:yohji yamamoto', 'https://upload.wikimedia.org/wikipedia/commons/2/28/Yohji_Yamamoto_logo.svg'],
  ['domain:yohjiyamamoto.co.jp', 'https://upload.wikimedia.org/wikipedia/commons/2/28/Yohji_Yamamoto_logo.svg'],
  ['title:issey miyake', 'https://upload.wikimedia.org/wikipedia/commons/7/78/Issey_Miyake_logo.svg'],
  ['domain:isseymiyake.com', 'https://upload.wikimedia.org/wikipedia/commons/7/78/Issey_Miyake_logo.svg'],
  ['title:aerie', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/American_Eagle_Outfitters_wordmark.svg/330px-American_Eagle_Outfitters_wordmark.svg.png'],
  ['domain:aerie.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/American_Eagle_Outfitters_wordmark.svg/330px-American_Eagle_Outfitters_wordmark.svg.png'],
  ['title:alexander mcqueen', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Alexander_McQueen_logo.svg/330px-Alexander_McQueen_logo.svg.png'],
  ['domain:alexandermcqueen.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Alexander_McQueen_logo.svg/330px-Alexander_McQueen_logo.svg.png'],
  ['title:& other stories', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/%26_Other_Stories_logo.svg/330px-%26_Other_Stories_logo.svg.png'],
  ['title:and other stories', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/%26_Other_Stories_logo.svg/330px-%26_Other_Stories_logo.svg.png'],
  ['domain:stories.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/%26_Other_Stories_logo.svg/330px-%26_Other_Stories_logo.svg.png'],
  ['title:arket', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Arket_logo.svg/330px-Arket_logo.svg.png'],
  ['domain:arket.com', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Arket_logo.svg/330px-Arket_logo.svg.png'],
  ['title:bojangles\'', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Bojangles_logo.svg'],
  ['title:bojangles', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Bojangles_logo.svg'],
  ['domain:bojangles.com', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Bojangles_logo.svg'],
  ['title:smashburger', 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Smashburger_logo.svg'],
  ['domain:smashburger.com', 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Smashburger_logo.svg'],
  ['title:zoë\'s kitchen', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['title:zoes kitchen', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['domain:zoeskitchen.com', 'https://upload.wikimedia.org/wikipedia/commons/5/57/Zoeslogo.jpg'],
  ['title:alo yoga', 'https://upload.wikimedia.org/wikipedia/commons/0/07/Alo_Yoga_logo.svg'],
  ['domain:aloyoga.com', 'https://upload.wikimedia.org/wikipedia/commons/0/07/Alo_Yoga_logo.svg'],
  ['title:athleta', 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Athleta_logo.svg'],
  ['domain:athleta.gap.com', 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Athleta_logo.svg'],
  ['title:weekday', 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Weekday_Logo.jpg'],
  ['domain:weekday.com', 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Weekday_Logo.jpg']
]);

function normalizeCommonsLogo(value, size) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/')) return raw;
  if (raw.includes('Special:FilePath/')) {
    const url = raw.split('?')[0];
    return `${url}?width=${Number.isFinite(size) ? size : 256}`;
  }
  if (raw.startsWith('http')) {
    if (!/wikimedia|wikipedia/i.test(raw)) return raw;
    const parts = raw.split('/');
    const filename = parts[parts.length - 1];
    return toCommonsFilePath(filename, size);
  }
  return toCommonsFilePath(raw, size);
}

function getManualLogoOverride(title, domain, size) {
  const titleKey = `title:${String(title || '').trim().toLowerCase()}`;
  const domainKey = `domain:${String(domain || '').trim().toLowerCase()}`;
  const match = MANUAL_LOGO_OVERRIDES.get(domainKey) || MANUAL_LOGO_OVERRIDES.get(titleKey) || '';
  return match ? normalizeCommonsLogo(match, size) : '';
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchWikiLogo(title, size) {
  if (!title) return '';
  const normalizedTitle = TITLE_OVERRIDES.get(String(title || '').trim().toLowerCase()) || title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!summaryRes.ok) return '';
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return '';

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!entityRes.ok) return '';
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const logoClaim = entity?.claims?.P154?.[0];
  const logoFile = logoClaim?.mainsnak?.datavalue?.value;
  if (!logoFile) return '';
  return normalizeCommonsLogo(logoFile, size);
}

async function fetchWikiSite(title) {
  if (!title) return '';
  const normalizedTitle = TITLE_OVERRIDES.get(String(title || '').trim().toLowerCase()) || title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}?redirect=true`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!summaryRes.ok) return '';
  const payload = await summaryRes.json();
  const wikibaseId = payload?.wikibase_item;
  if (!wikibaseId) return '';

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikibaseId)}.json`;
  const entityRes = await fetch(entityUrl, {
    headers: { 'User-Agent': 'Zo2yWikiLogo/1.0' }
  });
  if (!entityRes.ok) return '';
  const entityPayload = await entityRes.json();
  const entity = entityPayload?.entities?.[wikibaseId];
  const siteClaim = entity?.claims?.P856?.[0];
  const siteUrl = siteClaim?.mainsnak?.datavalue?.value;
  return siteUrl || '';
}

async function fetchWikiLogoByDomain(domain, size) {
  const cleanDomain = String(domain || '').trim().toLowerCase();
  if (!cleanDomain) return '';
  const domainPattern = escapeRegex(cleanDomain);
  const sparql = `
    SELECT ?logo WHERE {
      ?item wdt:P856 ?site .
      FILTER(REGEX(LCASE(STR(?site)), "^https?://(www\\.)?${domainPattern}(/|$)"))
      ?item wdt:P154 ?logo .
    } LIMIT 1
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Zo2yWikiLogo/1.0',
      'Accept': 'application/sparql-results+json'
    }
  });
  if (!response.ok) return '';
  const json = await response.json();
  const value = json?.results?.bindings?.[0]?.logo?.value;
  if (!value) return '';
  return normalizeCommonsLogo(value, size);
}

export default async function handler(req, res) {
  try {
    if (req.method && req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const query = req.query || {};
    const titleRaw = String(query.title || '').trim();
    const domainRaw = sanitizeDomain(query.domain || '');
    const sizeRaw = Number(query.size || 256);
    const size = Number.isFinite(sizeRaw) ? Math.max(64, Math.min(512, sizeRaw)) : 256;
    const logoOnly = String(query.mode || '').toLowerCase() === 'logo';
    const domainOverride = DOMAIN_TITLE_OVERRIDES.get(domainRaw) || '';
    const normalizedTitle = domainOverride || titleRaw;
    const manualLogo = getManualLogoOverride(normalizedTitle, domainRaw, size);

    if (manualLogo) {
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
      res.status(302);
      res.setHeader('Location', manualLogo);
      res.end();
      return;
    }

    if (domainRaw && logoOnly && typeof fetch === 'function') {
      try {
        const logoUrl = await fetchWikiLogoByDomain(domainRaw, size);
        if (logoUrl) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.status(302);
          res.setHeader('Location', logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
        // continue to fallback
      }
    }

    if (normalizedTitle && typeof fetch === 'function') {
      try {
        const logoUrl = await fetchWikiLogo(normalizedTitle, size);
        if (logoUrl) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.status(302);
          res.setHeader('Location', logoUrl);
          res.end();
          return;
        }
      } catch (_err) {
        // fall through to domain-based lookup
      }
    }

    if (domainRaw && !logoOnly && typeof fetch === 'function') {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainRaw)}&sz=${size}`;
        const googleRes = await fetch(googleUrl);
        if (googleRes.ok) {
          res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
          res.setHeader('Content-Type', googleRes.headers.get('content-type') || 'image/png');
          const buffer = Buffer.from(await googleRes.arrayBuffer());
          res.status(200);
          res.end(buffer);
          return;
        }
      } catch (_err) {
        // continue to fallback
      }

      try {
        const ddgUrl = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domainRaw)}.ico`;
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.status(302);
        res.setHeader('Location', ddgUrl);
        res.end();
        return;
      } catch (_err) {
        // final fallback below
      }
    }

    res.status(302);
    res.setHeader('Location', logoOnly ? '/logo-placeholder.svg' : '/newlogo.webp');
    res.end();
  } catch (_err) {
    res.status(302);
    res.setHeader('Location', '/logo-placeholder.svg');
    res.end();
  }
}

