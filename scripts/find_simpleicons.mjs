import fs from 'fs';

const icons = await fetch('https://cdn.jsdelivr.net/npm/simple-icons@latest/_data/simple-icons.json');
const data = await icons.json();

const foodTerms = ["Burger King", "KFC", "McDonald", "Starbucks", "Taco Bell", "Domino", "Pizza Hut", "Popeyes", "Subway", "Chipotle", "Arby", "Sonic", "Dunkin", "Krispy Kreme", "Jollibee", "Papa John", "Shake Shack", "Wendy", "Raising Cane", "Wingstop", "Five Guys", "Chick-fil", "Panera", "Dairy Queen", "Panda Express", "Del Taco", "Jack in the Box", "Tim Hortons", "Buffalo Wild", "Red Robin", "White Castle", "Cinnabon", "Costa Coffee", "Auntie Anne", "Jamba", "Cold Stone", "Sweetgreen", "Cava", "Qdoba", "Smashburger", "Little Caesars", "Church's", "El Pollo", "In-N-Out", "Red Lobster", "Olive Garden", "Outback", "Cheesecake Factory", "IHOP", "Applebee", "Denny", "Cracker Barrel", "Texas Roadhouse", "TGI", "LongHorn", "Nando", "Wagamama", "Heinz", "Nestle", "Kellogg", "Nutella", "Ferrero", "Godiva", "Lindt", "Danone", "Ben & Jerry"];

for (const [key, val] of Object.entries(data)) {
  if (foodTerms.some(n => val.title?.includes(n))) {
    const slug = val.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log(`"${val.title}" -> "${slug}"`);
  }
}
