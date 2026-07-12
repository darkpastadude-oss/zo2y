const fs = require('fs');

const brandQueries = {
    // Food
    "arbys": "Arby's food sandwich",
    "buffalowildwings": "Buffalo Wild Wings food",
    "burger-king": "Burger King Whopper",
    "carrabbas": "Carrabba's Italian Grill food",
    "chick-fil-a": "Chick-fil-A chicken",
    "chilis": "Chili's food meal",
    "chipotle": "Chipotle burrito bowl",
    "crackerbarrel": "Cracker Barrel breakfast",
    "culvers": "Culver's burger",
    "dairyqueen": "Dairy Queen ice cream",
    "dennys": "Denny's breakfast",
    "dominos": "Domino's pizza",
    "dunkin": "Dunkin Donuts coffee",
    "jackinthebox": "Jack in the Box burger",
    "kfc": "KFC fried chicken",
    "littlecaesars": "Little Caesars pizza",
    "mcdonalds": "McDonald's Big Mac",
    "nandos": "Nando's chicken",
    "pandaexpress": "Panda Express orange chicken",
    "panerabread": "Panera Bread bowl",
    "papajohns": "Papa John's pizza",
    "peets": "Peet's Coffee",
    "pizza-hut": "Pizza Hut pizza",
    "popeyes": "Popeyes chicken sandwich",
    "raisingcanes": "Raising Cane's chicken",
    "redlobster": "Red Lobster seafood",
    "redrobin": "Red Robin burger",
    "shake-shack": "Shake Shack burger",
    "smoothieking": "Smoothie King drink",
    "sonicdrivein": "Sonic Drive-In food",
    "starbucks": "Starbucks frappuccino",
    "subway": "Subway sandwich footlong",
    "sweetgreen": "Sweetgreen salad",
    "taco-bell": "Taco Bell food",
    "tacobell": "Taco Bell food",
    "texasroadhouse": "Texas Roadhouse steak",
    "thecapitalgrille": "Capital Grille steak",
    "thecheesecakefactory": "Cheesecake Factory cheesecake",
    "timhortons": "Tim Hortons coffee",
    "tljus": "Tous Les Jours bakery",
    "torchystacos": "Torchy's Tacos taco",
    "txchicken": "Texas Chicken fried chicken",
    "wagamama": "Wagamama ramen",
    "wendys": "Wendy's burger",
    "whataburger": "Whataburger meal",
    "whitecastle": "White Castle sliders",
    "wingstop": "Wingstop wings",
    "yosushi": "YO! Sushi rolls",
    "zaxbys": "Zaxby's chicken meal",
    "zippys": "Zippy's hawaii food",
    "zoeskitchen": "Zoe's Kitchen mediterranean food",

    // Cars
    "abarth": "Abarth 595 driving",
    "acura": "Acura NSX driving",
    "audi": "Audi R8 driving",
    "bmw": "BMW M4 driving",
    "bugatti": "Bugatti Chiron driving",
    "buick": "Buick Enclave driving",
    "cadillac": "Cadillac Escalade driving",
    "changan": "Changan car driving",
    "chevrolet": "Chevrolet Corvette driving",
    "chrysler": "Chrysler 300 driving",
    "citroen": "Citroen C4 driving",
    "dacia": "Dacia Duster driving",
    "daihatsu": "Daihatsu Copen driving",
    "dodge": "Dodge Challenger driving",
    "ferrari": "Ferrari 488 driving",
    "fiat": "Fiat 500 driving",
    "ford": "Ford Mustang driving",
    "geely": "Geely car driving",
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
    "tesla": "Tesla Model S driving",
    "toyota": "Toyota Supra driving",
    "vauxhall": "Vauxhall Corsa driving",
    "vinfast": "VinFast VF8 driving",
    "volkswagen": "Volkswagen Golf R driving",
    "volvocars": "Volvo XC90 driving",
    "westernstartrucks": "Western Star truck driving",
    "xiaopeng": "XPeng P7 driving",
    "zeekrlife": "Zeekr 001 driving",

    // Fashion
    "abercrombie": "Abercrombie clothing model",
    "adidas": "Adidas Ultraboost shoes",
    "allbirds": "Allbirds shoes",
    "ae": "American Eagle jeans model",
    "asics": "ASICS running shoes",
    "balenciaga": "Balenciaga Triple S shoes",
    "bape": "BAPE shark hoodie",
    "birkenstock": "Birkenstock Arizona sandals",
    "boohoo": "Boohoo fashion clothing",
    "canadagoose": "Canada Goose parka jacket",
    "champion": "Champion hoodie clothing",
    "clarks": "Clarks desert boots",
    "colehaan": "Cole Haan shoes",
    "converse": "Converse Chuck Taylor shoes",
    "cos": "COS fashion clothing",
    "drmartens": "Dr Martens 1460 boots",
    "express": "Express fashion clothing",
    "forever21": "Forever 21 clothing fashion",
    "gucci": "Gucci fashion runway bag",
    "hm": "H&M clothing fashion",
    "louis-vuitton": "Louis Vuitton bag",
    "nike": "Nike Air Jordan 1 shoes",
    "off-white": "Off-White sneakers fashion",
    "prada": "Prada bag fashion",
    "supreme": "Supreme clothing logo",
    "uniqlo": "Uniqlo clothing fashion",
    "zara": "Zara fashion campaign"
};

async function getImageUrl(query) {
    try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=15&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.query && data.query.search) {
            for (const item of data.query.search) {
                const title = item.title;
                // strict filters
                const badWords = /(logo|svg|pdf|building|store|shop|hq|headquarters|office|exterior|founder|portrait|ceo|map|chart|restaurant|dealership|sign)/i;
                if (!badWords.test(title)) {
                    // Bypass MD5 with Special:FilePath
                    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace('File:', ''))}?width=1200`;
                }
            }
        }
        return null;
    } catch (e) {
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
            console.log(" -> " + url);
        } else {
            console.log(" -> Not found");
        }
    }
    fs.writeFileSync('brand_specific_dict.json', JSON.stringify(dict, null, 2));
    console.log('done');
}

run();
