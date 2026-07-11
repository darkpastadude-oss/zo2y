const fs = require('fs');

const brands = [
  // Fashion
  { slug: 'nike', search: 'Nike Air Max 1' },
  { slug: 'adidas', search: 'Adidas Ultraboost' },
  { slug: 'zara', search: 'Zara fashion' },
  { slug: 'uniqlo', search: 'Uniqlo store' }, // Wait, no storefronts! 'Uniqlo apparel'
  { slug: 'hm', search: 'H&M clothing' },
  { slug: 'gucci', search: 'Gucci bag' },
  { slug: 'prada', search: 'Prada bag' },
  { slug: 'louis-vuitton', search: 'Louis Vuitton bag' },
  { slug: 'supreme', search: 'Supreme clothing' },
  { slug: 'off-white', search: 'Off-White sneaker' },
  { slug: 'balenciaga', search: 'Balenciaga sneaker' },
  { slug: 'stone-island', search: 'Stone Island jacket' },

  // Food
  { slug: 'mcdonalds', search: 'Big Mac' },
  { slug: 'kfc', search: 'Fried chicken' },
  { slug: 'burger-king', search: 'Whopper' },
  { slug: 'subway', search: 'Subway sandwich' },
  { slug: 'taco-bell', search: 'Tacos' },
  { slug: 'dominos', search: 'Pepperoni pizza' },
  { slug: 'pizza-hut', search: 'Pizza slice' },
  { slug: 'starbucks', search: 'Starbucks coffee cup' },
  { slug: 'chipotle', search: 'Burrito bowl' },
  { slug: 'chick-fil-a', search: 'Chicken sandwich' },
  { slug: 'wendys', search: 'Hamburger' },
  { slug: 'shake-shack', search: 'Shake Shack burger' }
];

async function run() {
  const dict = {};
  for (const b of brands) {
    // try to get a good image
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(b.search)}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        // filter out buildings
        const goodPage = pages.find(p => !/(building|store|shop|hq|office|headquarters|exterior)/i.test(p.title));
        const page = goodPage || pages[0];
        const info = page.imageinfo[0];
        dict[b.slug] = info.thumburl || info.url;
      }
    } catch (e) {}
  }
  fs.writeFileSync('brand_dict.json', JSON.stringify(dict, null, 2));
  console.log('done');
}
run();
