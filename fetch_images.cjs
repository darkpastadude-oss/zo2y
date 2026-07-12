const fs = require('fs');
const ddg = require('duckduckgo-images-api');

const brandQueries = {
    // Food
    "arbys": "Arby's sandwich",
    "buffalowildwings": "Buffalo Wild Wings wings food",
    "burger-king": "Burger King Whopper",
    "carrabbas": "Carrabba's Italian Grill food",
    "chick-fil-a": "Chick-fil-A chicken sandwich meal",
    "chilis": "Chili's baby back ribs meal",
    "chipotle": "Chipotle burrito bowl",
    "crackerbarrel": "Cracker Barrel breakfast food",
    "culvers": "Culver's ButterBurger",
    "dairyqueen": "Dairy Queen Blizzard ice cream",
    "dennys": "Denny's Grand Slam breakfast",
    "dominos": "Domino's pizza pepperoni",
    "dunkin": "Dunkin Donuts coffee donut",
    "jackinthebox": "Jack in the Box Jumbo Jack burger",
    "kfc": "KFC fried chicken bucket",
    "littlecaesars": "Little Caesars pizza",
    "mcdonalds": "McDonald's Big Mac fries",
    "nandos": "Nando's peri peri chicken meal",
    "pandaexpress": "Panda Express orange chicken",
    "panerabread": "Panera Bread bread bowl soup",
    "papajohns": "Papa John's pizza",
    "peets": "Peet's Coffee cup",
    "pizza-hut": "Pizza Hut pan pizza",
    "popeyes": "Popeyes chicken sandwich meal",
    "raisingcanes": "Raising Cane's chicken fingers box",
    "redlobster": "Red Lobster cheddar bay biscuits seafood",
    "redrobin": "Red Robin gourmet burger",
    "shake-shack": "Shake Shack burger fries",
    "smoothieking": "Smoothie King drink",
    "sonicdrivein": "Sonic Drive-In burger tater tots",
    "starbucks": "Starbucks frappuccino cup",
    "subway": "Subway footlong sandwich",
    "sweetgreen": "Sweetgreen salad bowl",
    "taco-bell": "Taco Bell crunchwrap supreme",
    "tacobell": "Taco Bell crunchwrap supreme",
    "texasroadhouse": "Texas Roadhouse steak dinner",
    "thecapitalgrille": "The Capital Grille steak dinner fine dining",
    "thecheesecakefactory": "The Cheesecake Factory slice of cheesecake",
    "timhortons": "Tim Hortons coffee timbits",
    "tljus": "Tous Les Jours bakery bread",
    "torchystacos": "Torchy's Tacos taco",
    "txchicken": "Texas Chicken fried chicken",
    "wagamama": "Wagamama ramen bowl",
    "wendys": "Wendy's Dave's Single burger",
    "whataburger": "Whataburger meal",
    "whitecastle": "White Castle sliders",
    "wingstop": "Wingstop wings fries",
    "yosushi": "YO! Sushi rolls",
    "zaxbys": "Zaxby's chicken fingers meal",
    "zippys": "Zippy's chili rice hawaii",
    "zoeskitchen": "Zoe's Kitchen mediterranean food",

    // Cars
    "abarth": "Abarth 595 driving",
    "acura": "Acura NSX driving",
    "audi": "Audi R8 driving",
    "bmw": "BMW M4 driving",
    "bugatti": "Bugatti Chiron driving",
    "buick": "Buick Enclave driving",
    "cadillac": "Cadillac Escalade driving",
    "changan": "Changan UNI-T driving",
    "chevrolet": "Chevrolet Corvette driving",
    "chrysler": "Chrysler 300 driving",
    "citroen": "Citroen C4 driving",
    "dacia": "Dacia Duster driving",
    "daihatsu": "Daihatsu Copen driving",
    "dodge": "Dodge Challenger driving",
    "ferrari": "Ferrari 488 driving",
    "fiat": "Fiat 500 driving",
    "ford": "Ford Mustang driving",
    "geely": "Geely Xingyue driving",
    "genesis": "Genesis G80 driving",
    "honda": "Honda Civic Type R driving",
    "hyundai": "Hyundai Ioniq 5 driving",
    "isuzu": "Isuzu D-Max driving",
    "jaguar": "Jaguar F-Type driving",
    "jeep": "Jeep Wrangler off road",
    "kia": "Kia EV6 driving",
    "lamborghini": "Lamborghini Aventador driving",
    "lancia": "Lancia Delta Integrale driving",
    "lexus": "Lexus LC500 driving",
    "lincoln": "Lincoln Navigator driving",
    "lucidmotors": "Lucid Air driving",
    "mahindra": "Mahindra Thar off road",
    "maserati": "Maserati MC20 driving",
    "mazda": "Mazda RX-7 driving",
    "mclaren": "McLaren 720S driving",
    "mercedes-benz": "Mercedes AMG GT driving",
    "mini": "MINI Cooper driving",
    "nio": "NIO ET7 driving",
    "opel": "Opel Astra driving",
    "peugeot": "Peugeot 508 driving",
    "polestar": "Polestar 2 driving",
    "porsche": "Porsche 911 GT3 driving",
    "proton": "Proton X50 driving",
    "ramtrucks": "Ram 1500 TRX off road",
    "renault": "Renault Megane RS driving",
    "rimac-automobili": "Rimac Nevera driving",
    "rivian": "Rivian R1T driving",
    "rolls-roycemotorcars": "Rolls-Royce Phantom driving",
    "saab": "Saab 9-3 driving",
    "saicmotor": "MG Cyberster driving",
    "scania": "Scania truck driving",
    "seat": "SEAT Leon Cupra driving",
    "skoda-auto": "Skoda Octavia vRS driving",
    "smart": "Smart Fortwo driving",
    "subaru": "Subaru WRX STI driving",
    "tatamotors": "Tata Safari driving",
    "tesla": "Tesla Model S Plaid driving",
    "toyota": "Toyota Supra Mk4 driving",
    "vauxhall": "Vauxhall Corsa driving",
    "vinfast": "VinFast VF8 driving",
    "volkswagen": "Volkswagen Golf R driving",
    "volvocars": "Volvo XC90 driving",
    "westernstartrucks": "Western Star truck driving",
    "xiaopeng": "XPeng P7 driving",
    "zeekrlife": "Zeekr 001 driving",

    // Fashion
    "abercrombie": "Abercrombie clothing campaign",
    "adidas": "Adidas Ultraboost shoes",
    "allbirds": "Allbirds wool runners shoes",
    "ae": "American Eagle jeans clothing",
    "asics": "ASICS running shoes",
    "balenciaga": "Balenciaga Triple S shoes",
    "bape": "BAPE shark hoodie",
    "birkenstock": "Birkenstock Arizona sandals",
    "boohoo": "Boohoo fashion clothing",
    "canadagoose": "Canada Goose parka jacket snow",
    "champion": "Champion hoodie clothing",
    "clarks": "Clarks desert boots",
    "colehaan": "Cole Haan zerogrand shoes",
    "converse": "Converse Chuck Taylor shoes",
    "cos": "COS minimalist fashion clothing",
    "drmartens": "Dr Martens 1460 boots",
    "express": "Express fashion clothing",
    "forever21": "Forever 21 clothing fashion",
    "gucci": "Gucci fashion runway bag",
    "hm": "H&M clothing fashion",
    "louis-vuitton": "Louis Vuitton monogram bag",
    "nike": "Nike Air Jordan 1 shoes",
    "off-white": "Off-White sneakers fashion",
    "prada": "Prada bag fashion",
    "supreme": "Supreme box logo clothing",
    "uniqlo": "Uniqlo heattech clothing",
    "zara": "Zara fashion campaign"
};

async function getImageUrl(query) {
    try {
        const results = await ddg.image_search({ query: query, moderate: true });
        // find a good horizontal or square high res image
        for (const r of results) {
            if (r.width >= 800 && r.width >= r.height && !r.image.includes('svg')) {
                return r.image;
            }
        }
        return results[0].image;
    } catch (e) {
        console.error("Error for " + query, e);
        return null;
    }
}

async function run() {
    const dict = {};
    const entries = Object.entries(brandQueries);
    for (let i = 0; i < entries.length; i++) {
        const [slug, q] = entries[i];
        console.log(`Fetching ${i+1}/${entries.length}: ${slug} ("${q}")`);
        const url = await getImageUrl(q);
        if (url) {
            dict[slug] = url;
        }
    }
    fs.writeFileSync('brand_specific_dict.json', JSON.stringify(dict, null, 2));
    console.log('done');
}

run();
