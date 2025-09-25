const restaurants = [
  { name:"Mori Sushi", category:"Japanese", desc:"Modern sushi chain serving rolls, sashimi & Japanese bites.", img:"images/mori.png", rating:4.7, link:"cards/mori.html" },
  { name:"Kilo Kebab", category:"Middle Eastern", desc:"Charcoal-grilled kebabs & hearty Middle Eastern plates.", img:"images/kilo.png", rating:4.5, link:"cards/kilo.html" },
  { name:"Hameed", category:"Fast Food", desc:"Local favorite for sandwiches & quick bites.", img:"images/hameed.png", rating:4.3, link:"cards/hameed.html" },
  { name:"Bazooka", category:"Burger & Fried Chicken", desc:"Loaded burgers & crispy fried chicken combos.", img:"images/bazooka.jpg", rating:4.2, link:"cards/bazooka.html" },
  { name:"Mexican Corn", category:"Mexican Street Food", desc:"Elote, tacos & cheesy Mexican street snacks.", img:"images/mexican.jpg", rating:4.0, link:"cards/mexican.html" },
  { name:"Chikin Worx", category:"Fried Chicken", desc:"Crunchy chicken, sandwiches & family buckets.", img:"images/chikin.png", rating:4.5, link:"cards/chikin.html" },
  { name:"Vasko", category:"Steakhouse & Café", desc:"Premium coffee, pastries & elegant café vibes.", img:"images/vasko.jpg", rating:4.6, link:"cards/vasko.html" },
  { name:"Second Cup", category:"Cafe", desc:"Canadian coffeehouse chain serving espresso, lattes & pastries.", img:"images/secondcup.png", rating:4.4, link:"cards/secondcup.html" },
  { name:"Pizza Station", category:"Pizza", desc:"Classic pizzas & comfort food.", img:"images/station.png", rating:4.3, link:"cards/station.html" },
  { name:"BRGR", category:"Burgers", desc:"Gourmet burgers with premium toppings & sides.", img:"images/brgr.jpg", rating:4.4, link:"cards/brgr.html" },
  { name:"Country Hills", category:"American Diner", desc:"Grilled meats, casual dining & family meals.", img:"images/country.jpg", rating:4.2, link:"cards/country.html" },
  { name:"Bayouki Rotisserie", category:"Rotisserie Chicken", desc:"Authentic grilled chicken & rotisserie meals.", img:"images/bayoki.png", rating:4.3, link:"cards/bayoki.html" },
  { name:"Maine", category:"Seafood", desc:"Fresh seafood, lobster rolls & New England classics.", img:"images/maine.jpg", rating:4.5, link:"cards/maine.html" },
  { name:"Barbar Shawarma", category:"Lebanese Street Food", desc:"Iconic shawarma spot serving beef, chicken & falafel.", img:"images/barbar.png", rating:4.4, link:"cards/barbar.html" },
  { name:"Labash", category:"Grilled Chicken & Sandwiches", desc:"Known for charcoal-grilled chicken, meat & fast bites.", img:"images/labash.jpg", rating:4.3, link:"cards/labash.html" },
  { name:"Pickl Egypt", category:"Burgers & Fried Chicken", desc:"Dubai’s famous burger chain now in Egypt — loaded burgers, crispy chicken & shakes.", img:"images/pickl.jpg", rating:4.6, link:"cards/pickl.html" },
  { name:"Akleh", category:"Lebanese Dining", desc:"Authentic Lebanese mezze, grills & traditional dishes in a cozy setting.", img:"images/akleh.jpg", rating:4.4, link:"cards/akleh.html" },
  { name:"Howlin' Birds", category:"Nashville Hot Chicken", desc:"Spicy fried chicken sandwiches, tenders & southern-style comfort food.", img:"images/howlin.png", rating:4.5, link:"cards/howlin.html" },
  { name:"Sauce", category:"American", desc:"Trendy burger & chicken spot with loaded fries, shakes & street food vibes.", img:"images/sauce.jpg", rating:4.4, link:"cards/sauce.html" }
];

// Shuffle function
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("restaurants");
  if (!container) return;

  // Shuffle and pick 5
  const randomRestaurants = shuffle([...restaurants]).slice(0, 5);

  // Render each restaurant card
  randomRestaurants.forEach(r => {
    const card = document.createElement("div");
    card.className = "restaurant-card"; // matches your CSS
    card.innerHTML = `
      <div class="icon-wrapper">
        <img src="${r.img}" alt="${r.name}" class="restaurant-icon">
      </div>
      <h3>${r.name}</h3>
      <p>${r.category}</p>
      <p>${r.desc}</p>
      <p class="stars">⭐ ${r.rating}</p>
    `;
    card.addEventListener('click', () => { window.location.href = r.link; });
    container.appendChild(card);
  });

  // "+ More" card
  const moreCard = document.createElement("div");
  moreCard.className = "restaurant-card more-icon";
  moreCard.innerHTML = `+`;
  moreCard.addEventListener('click', () => { window.location.href = 'restaurants.html'; });
  container.appendChild(moreCard);
});
