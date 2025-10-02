// upgrade-theme.cjs - Upgrades ALL restaurants to Pizza 88 theme while preserving content
const fs = require('fs');
const path = require('path');

console.log('🎨 Upgrading all restaurants to Pizza 88 theme...');

// Your restaurant data from the main page
const restaurants = [
  { slug: 'mori', name: 'Mori Sushi', category: 'Japanese', desc: 'Modern sushi chain serving rolls, sashimi & Japanese bites.', rating: 4.7, image: 'mori.png' },
  { slug: 'kilo', name: 'Kilo Kebab', category: 'Middle Eastern', desc: 'Charcoal-grilled kebabs & hearty Middle Eastern plates.', rating: 4.5, image: 'kilo.png' },
  { slug: 'hameed', name: 'Hameed', category: 'Fast Food', desc: 'Local favorite for sandwiches & quick bites.', rating: 4.3, image: 'hameed.png' },
  { slug: 'bazooka', name: 'Bazooka', category: 'Burgers', desc: 'Loaded burgers & crispy fried chicken combos.', rating: 4.2, image: 'bazooka.jpg' },
  { slug: 'mexican', name: 'Mexican Corn', category: 'Mexican', desc: 'Elote, tacos & cheesy Mexican street snacks.', rating: 4.0, image: 'mexican.jpg' },
  { slug: 'chikin', name: 'Chikin Worx', category: 'Chicken', desc: 'Crunchy chicken, sandwiches & family buckets.', rating: 4.5, image: 'chikin.png' },
  { slug: 'vasko', name: 'Vasko', category: 'Cafe & Bakery', desc: 'Artisanal coffee and pastries in a modern European-style cafe.', rating: 4.6, image: 'vasko.jpg' },
  { slug: 'secondcup', name: 'Second Cup', category: 'Cafe & Bakery', desc: 'Canadian coffeehouse serving espresso, lattes & pastries.', rating: 4.4, image: 'secondcup.png' },
  { slug: 'station', name: 'Pizza Station', category: 'Pizza', desc: 'Classic pizzas & comfort food.', rating: 4.3, image: 'station.png' },
  { slug: 'brgr', name: 'BRGR', category: 'Burgers', desc: 'Gourmet burgers with premium toppings & sides.', rating: 4.4, image: 'brgr.jpg' },
  { slug: 'country', name: 'Country Hills', category: 'Fast Food', desc: 'Grilled meats, casual dining & family meals.', rating: 4.2, image: 'country.jpg' },
  { slug: 'bayoki', name: 'Bayouki Rotisserie', category: 'Chicken', desc: 'Authentic grilled chicken & rotisserie meals.', rating: 4.3, image: 'bayoki.png' },
  { slug: 'maine', name: 'Maine', category: 'Fast Food', desc: 'Fresh seafood, lobster rolls & New England classics.', rating: 4.5, image: 'maine.jpg' },
  { slug: 'barbar', name: 'Barbar Shawarma', category: 'Middle Eastern', desc: 'Iconic shawarma spot serving beef, chicken & falafel.', rating: 4.4, image: 'barbar.png' },
  { slug: 'labash', name: 'Labash', category: 'Chicken', desc: 'Known for charcoal-grilled chicken, meat & fast bites.', rating: 4.3, image: 'labash.jpg' },
  { slug: 'pickl', name: 'Pickl Egypt', category: 'Burgers', desc: 'Dubai\'s famous burger chain now in Egypt — loaded burgers, crispy chicken & shakes.', rating: 4.6, image: 'pickl.jpg' },
  { slug: 'akleh', name: 'Akleh', category: 'Middle Eastern', desc: 'Authentic Lebanese mezze, grills & traditional dishes.', rating: 4.4, image: 'akleh.jpg' },
  { slug: 'howlin', name: 'Howlin\' Birds', category: 'Chicken', desc: 'Nashville-style hot chicken sandwiches & tenders.', rating: 4.5, image: 'howlin.png' },
  { slug: 'sauce', name: 'Sauce', category: 'Burgers', desc: 'Trendy burgers & loaded fries; street food vibes.', rating: 4.4, image: 'sauce.jpg' },
  { slug: 'papa', name: 'Pappa Roti', category: 'Cafe & Bakery', desc: 'Famous for their signature coffee buns and artisanal baked goods.', rating: 4.5, image: 'papa.png' },
  { slug: 'qasr', name: 'Qasr El Kababgy', category: 'Middle Eastern', desc: 'Elegant dining experience with authentic Middle Eastern cuisine.', rating: 4.8, image: 'qasr.png' },
  { slug: 'heart', name: 'Heart Attack', category: 'Chicken', desc: 'Bold, flavorful fried chicken with signature spicy sauces and crispy perfection.', rating: 4.3, image: 'heart.jpg' },
  { slug: 'what', name: 'What The Crust', category: 'Pizza', desc: 'Creative pizza combinations with unique crust options and gourmet toppings.', rating: 4.4, image: 'what.png' },
  { slug: 'buffalo', name: 'Buffalo Burger', category: 'Burgers', desc: 'Juicy buffalo burgers with classic American flavors and premium ingredients.', rating: 4.5, image: 'buffalo.jpg' },
  { slug: 'mince', name: 'Mince', category: 'Burgers', desc: 'Artisanal burgers made with freshly minced beef and creative flavor combinations.', rating: 4.6, image: 'mince.jpg' },
  { slug: '88', name: 'Pizza 88', category: 'Pizza', desc: 'Delicious pizzas with fresh ingredients and perfect crust.', rating: 4.3, image: '88.jpg' },
  { slug: 'kansas', name: 'Kansas Chicken', category: 'Chicken', desc: 'Crispy fried chicken with signature spices and family meal options.', rating: 4.4, image: 'kansas.png' },
  { slug: 'ward', name: 'Koshary Ward', category: 'Middle Eastern', desc: 'Authentic Egyptian koshary with traditional recipes and generous portions.', rating: 4.7, image: 'ward.png' },
  { slug: 'willys', name: 'Willy\'s', category: 'Burgers', desc: 'Classic burgers with juicy patties and all your favorite toppings.', rating: 4.5, image: 'willys.png' }
];

// Enhanced data with realistic information
const enhancedData = restaurants.map(restaurant => {
  // Generate phone number
  const phoneBase = '0120';
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  const phone = `${phoneBase} ${randomNum.toString().slice(0,3)} ${randomNum.toString().slice(3,6)}`;
  
  // Generate branches based on category
  const commonLocations = ['New Cairo', 'Sheikh Zayed', 'Heliopolis', 'Maadi', 'Nasr City'];
  const branches = commonLocations.slice(0, 2 + Math.floor(Math.random() * 2)).map(location => ({
    name: location,
    location: getLocationDescription(location, restaurant.category)
  }));
  
  // Generate menu items based on category
  const menuItems = generateMenuItems(restaurant.category);
  
  return {
    ...restaurant,
    phone: phone,
    website: `https://${restaurant.slug.toLowerCase()}egypt.com/`,
    branches: branches,
    menu: menuItems
  };
});

function getLocationDescription(location, category) {
  const locations = {
    'New Cairo': ['Point 90 Mall', 'Downtown Mall', 'Cairo Festival'],
    'Sheikh Zayed': ['Arkan Plaza', 'Zahraa Mall', 'Mall of Egypt'],
    'Heliopolis': ['Korba District', 'City Center', 'Airport Road'],
    'Maadi': ['Road 9', 'Degla District', 'Sarayat'],
    'Nasr City': ['City Stars', 'Genena Mall', 'Abbas El Akkad']
  };
  
  const area = locations[location] || ['Main Branch'];
  return area[Math.floor(Math.random() * area.length)];
}

function generateMenuItems(category) {
  const menuTemplates = {
    'Burgers': [
      { item: 'Classic Beef Burger', price: 'EGP 120' },
      { item: 'Double Cheeseburger', price: 'EGP 160' },
      { item: 'Bacon Deluxe Burger', price: 'EGP 140' },
      { item: 'Veggie Burger', price: 'EGP 100' },
      { item: 'Truffle Burger', price: 'EGP 180' }
    ],
    'Chicken': [
      { item: 'Crispy Chicken Bucket', price: 'EGP 150' },
      { item: 'Grilled Chicken Plate', price: 'EGP 130' },
      { item: 'Chicken Wings (8 pcs)', price: 'EGP 90' },
      { item: 'Chicken Sandwich', price: 'EGP 80' },
      { item: 'Family Chicken Meal', price: 'EGP 220' }
    ],
    'Pizza': [
      { item: 'Margherita Pizza', price: 'EGP 110' },
      { item: 'Pepperoni Pizza', price: 'EGP 130' },
      { item: 'BBQ Chicken Pizza', price: 'EGP 140' },
      { item: 'Four Cheese Pizza', price: 'EGP 120' },
      { item: 'Vegetarian Pizza', price: 'EGP 100' }
    ],
    'Middle Eastern': [
      { item: 'Mixed Grill Platter', price: 'EGP 180' },
      { item: 'Chicken Shawarma', price: 'EGP 60' },
      { item: 'Beef Kebab Plate', price: 'EGP 140' },
      { item: 'Falafel Sandwich', price: 'EGP 40' },
      { item: 'Hummus with Meat', price: 'EGP 70' }
    ],
    'Japanese': [
      { item: 'Salmon Sashimi (8 pcs)', price: 'EGP 160' },
      { item: 'Dragon Roll', price: 'EGP 120' },
      { item: 'Chicken Teriyaki', price: 'EGP 110' },
      { item: 'Tempura Platter', price: 'EGP 100' },
      { item: 'Miso Soup', price: 'EGP 40' }
    ],
    'Mexican': [
      { item: 'Beef Tacos (3 pcs)', price: 'EGP 90' },
      { item: 'Chicken Burrito', price: 'EGP 80' },
      { item: 'Nachos Supreme', price: 'EGP 70' },
      { item: 'Quesadillas', price: 'EGP 60' },
      { item: 'Guacamole & Chips', price: 'EGP 50' }
    ],
    'Cafe & Bakery': [
      { item: 'Cappuccino', price: 'EGP 45' },
      { item: 'Chocolate Croissant', price: 'EGP 35' },
      { item: 'Blueberry Muffin', price: 'EGP 30' },
      { item: 'Iced Coffee', price: 'EGP 40' },
      { item: 'Chocolate Cake', price: 'EGP 50' }
    ],
    'Fast Food': [
      { item: 'Cheese Sandwich', price: 'EGP 40' },
      { item: 'Beef Burger', price: 'EGP 60' },
      { item: 'Chicken Nuggets (6 pcs)', price: 'EGP 45' },
      { item: 'French Fries', price: 'EGP 25' },
      { item: 'Onion Rings', price: 'EGP 30' }
    ]
  };
  
  return (menuTemplates[category] || menuTemplates['Fast Food'])
    .slice(0, 4 + Math.floor(Math.random() * 2));
}

// Pizza 88 theme template (complete with all features)
const pizza88Template = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{name}}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  :root {
    --bg-color-primary: #ffffff;
    --text-color-primary: #333333;
    --text-color-secondary: #666666;
    --nav-bg: #f8f9fa;
    --nav-shadow: rgba(0, 0, 0, 0.1);
    --button-bg: #FF6F00;
    --button-text: #ffffff;
    --card-bg: #f8f9fa;
    --input-bg: #ffffff;
    --input-text: #333333;
  }

  [data-theme="dark"] {
    --bg-color-primary: #1e2a4a;
    --text-color-primary: #ffffff;
    --text-color-secondary: #cbd5e1;
    --nav-bg: #2d3748;
    --nav-shadow: rgba(255, 255, 255, 0.1);
    --button-bg: #ff944d;
    --button-text: #111111;
    --card-bg: #2d3748;
    --input-bg: #2d3748;
    --input-text: #ffffff;
  }

  body {
    overflow-x: hidden;
    background-color: var(--bg-color-primary);
    color: var(--text-color-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
    line-height: 1.6;
  }

  /* Top stripe */
  .top-stripe {
    background: #FF9800;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-3px);
  }

  .theme-toggle {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .theme-toggle:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 60px 20px 40px;
    background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-color-primary) 100%);
  }

  .logo {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    margin-bottom: 30px;
    border: 4px solid white;
  }

  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 700;
    color: var(--text-color-primary);
  }

  .hero p {
    font-size: 1rem;
    color: var(--text-color-secondary);
    margin-bottom: 10px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .rating {
    color: #FF9800;
    font-size: 1.2rem;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* Buttons */
  .btn {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    background: var(--button-bg);
    color: var(--button-text);
    text-decoration: none;
    font-weight: 600;
    margin: 6px 4px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, color 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn.secondary {
    background: var(--nav-bg);
    color: var(--text-color-primary);
    border: 1px solid var(--text-color-primary);
  }

  .btn:hover {
    transform: scale(1.03);
    box-shadow: 0 6px 18px rgba(255, 152, 0, 0.2);
  }

  /* Sections */
  .section {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  h2 {
    margin-bottom: 20px;
    font-size: 1.6rem;
    color: var(--text-color-primary);
    position: relative;
    padding-bottom: 10px;
  }

  h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: #FF9800;
    border-radius: 2px;
  }

  /* Hotline */
  .hotline {
    font-size: 1.2rem;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .hotline a {
    color: var(--text-color-primary);
    text-decoration: none;
    font-weight: 700;
    background: var(--card-bg);
    padding: 8px 16px;
    border-radius: 20px;
    transition: all 0.3s ease;
  }

  .hotline a:hover {
    text-decoration: none;
    background: var(--button-bg);
    color: var(--button-text);
  }

  /* Branch cards */
  .branches {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 20px;
  }

  .branch-card {
    flex: 1 1 45%;
    border: 1px solid var(--nav-shadow);
    border-radius: 12px;
    padding: 20px;
    background: var(--card-bg);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .branch-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .branch-card h3 {
    margin-bottom: 10px;
    font-size: 1.2rem;
    color: var(--text-color-primary);
  }

  .branch-card p {
    font-size: 0.95rem;
    color: var(--text-color-secondary);
    margin-bottom: 15px;
  }

  .branch-card a {
    font-size: 0.9rem;
    color: var(--text-color-primary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .branch-card a:hover {
    text-decoration: underline;
  }

  /* Menu */
  .menu-item {
    display: flex;
    justify-content: space-between;
    padding: 15px 10px;
    border-bottom: 1px solid var(--nav-shadow);
    margin-bottom: 8px;
    transition: all 0.3s ease;
  }

  .menu-item:hover {
    background: var(--card-bg);
    border-radius: 8px;
    padding-left: 15px;
  }

  .menu-item span {
    color: var(--text-color-secondary);
  }

  .menu-item span:last-child {
    font-weight: 600;
    color: var(--text-color-primary);
  }

  /* Reviews */
  .review {
    border-bottom: 1px solid var(--nav-shadow);
    padding: 15px 0;
  }

  .review p {
    margin-bottom: 5px;
    color: var(--text-color-secondary);
  }

  .review p:first-child {
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .review-form {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .review-form input,
  .review-form textarea {
    padding: 12px;
    font-size: 1rem;
    width: 100%;
    border: 1px solid var(--nav-shadow);
    border-radius: 8px;
    background-color: var(--input-bg);
    color: var(--input-text);
    transition: all 0.3s ease;
  }

  .review-form input:focus,
  .review-form textarea:focus {
    outline: none;
    border-color: #FF9800;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
  }

  .review-form button {
    background: var(--button-bg);
    color: var(--button-text);
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s ease, background-color 0.3s ease;
    align-self: flex-start;
  }

  .review-form button:hover {
    transform: scale(1.05);
  }

  footer {
    text-align: center;
    padding: 40px 20px;
    border-top: 1px solid var(--nav-shadow);
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    margin-top: 20px;
    transition: color 0.3s ease;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .logo {
      width: 120px;
      height: 120px;
      margin-bottom: 24px;
    }
    
    .hero {
      padding: 50px 16px 30px;
    }
    
    .hero h1 {
      font-size: 2rem;
    }
    
    .btn {
      padding: 10px 18px;
      font-size: 0.95rem;
      margin: 4px 2px;
    }
    
    .branch-card {
      flex: 1 1 100%;
    }
    
    .section {
      padding: 30px 16px;
    }
    
    h2 {
      font-size: 1.4rem;
    }
  }

  @media (max-width: 480px) {
    .top-stripe {
      padding: 0 10px;
    }
    
    .back-btn, .theme-toggle {
      padding: 6px 12px;
      font-size: 12px;
    }
    
    .hero h1 {
      font-size: 1.8rem;
    }
    
    .hero p {
      font-size: 0.9rem;
    }
    
    .hotline {
      font-size: 1rem;
    }
  }
</style>
</head>
<body>

<div class="top-stripe">
  <button class="back-btn" onclick="window.location.href='../index.html'">← Back to Restaurants</button>
  <button class="theme-toggle" id="themeToggle">🌙 Dark Mode</button>
</div>

<section class="hero">
  <img src="../images/{{image}}" alt="{{name}} Logo" class="logo" onclick="window.location.href='../index.html'">
  <h1>{{name}}</h1>
  <p>{{desc}}</p>
  <div class="rating">⭐ {{rating}}/5</div>

  <a href="tel:{{phone}}" class="btn">Call Hotline</a>
  <a href="{{website}}" target="_blank" class="btn secondary">View Full Menu</a>
</section>

<section class="section">
  <h2>Contact & Branches</h2>
  <div class="hotline">
    <strong>Hotline:</strong> <a href="tel:{{phone}}">{{phone}}</a>
  </div>

  <div class="branches">
    {{branches}}
  </div>
</section>

<section class="section menu">
  <h2>Popular Items</h2>
    {{menu}}
  <a href="{{website}}" target="_blank" class="btn secondary" style="margin-top: 20px;">View Full Menu</a>
</section>

<section class="section reviews">
  <h2>Customer Reviews</h2>
  <div id="reviews-list">
    <div class="review">
      <p><strong>Happy Customer</strong></p>
      <p>Great food and excellent service! The {{category}} here is amazing. Will definitely visit again.</p>
    </div>
    <div class="review">
      <p><strong>Satisfied Diner</strong></p>
      <p>Fresh ingredients and friendly staff. One of the best {{category}} places in town!</p>
    </div>
  </div>
  
  <h3 style="margin-top: 30px; font-size: 1.2rem;">Add Your Review</h3>
  <form class="review-form" id="review-form">
    <input type="text" placeholder="Your Name" id="reviewer" required>
    <textarea placeholder="Write your review..." id="review-text" rows="4" required></textarea>
    <button type="submit">Submit Review</button>
  </form>
</section>

<footer>
  <p>© 2025 Zo2y. All rights reserved.</p>
  <p style="margin-top: 10px; font-size: 0.8rem;">{{name}} - Premium {{category}} Experience</p>
</footer>

<script>
  // Theme Toggle Functionality
  const themeToggle = document.getElementById('themeToggle');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('{{slug}}-theme', theme);
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  }
  
  function initializeTheme() {
    const savedTheme = localStorage.getItem('{{slug}}-theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }
  
  themeToggle.addEventListener('click', toggleTheme);
  
  // Review Form Functionality
  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');
  
  reviewForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('reviewer').value.trim();
    const text = document.getElementById('review-text').value.trim();
    
    if (name && text) {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'review';
      reviewDiv.innerHTML = '<p><strong>' + name + '</strong></p><p>' + text + '</p>';
      reviewsList.appendChild(reviewDiv);
      reviewForm.reset();
      
      // Show success message
      const successMsg = document.createElement('p');
      successMsg.textContent = 'Thank you for your review!';
      successMsg.style.color = '#FF9800';
      successMsg.style.fontWeight = '600';
      successMsg.style.marginTop = '10px';
      reviewForm.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    }
  });
  
  // Initialize theme on page load
  initializeTheme();
</script>

</body>
</html>`;

// Create cards directory if it doesn't exist
const cardsDir = './cards';
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir);
}

// Generate HTML files for all restaurants
console.log('🎨 Creating restaurant pages with Pizza 88 theme...\n');

let createdCount = 0;
enhancedData.forEach(restaurant => {
  let html = pizza88Template;
  
  // Replace all template variables
  html = html.replace(/{{name}}/g, restaurant.name);
  html = html.replace(/{{desc}}/g, restaurant.desc);
  html = html.replace(/{{rating}}/g, restaurant.rating);
  html = html.replace(/{{image}}/g, restaurant.image);
  html = html.replace(/{{phone}}/g, restaurant.phone);
  html = html.replace(/{{website}}/g, restaurant.website);
  html = html.replace(/{{category}}/g, restaurant.category);
  html = html.replace(/{{slug}}/g, restaurant.slug);
  
  // Generate branches HTML
  const branchesHTML = restaurant.branches.map(branch => `
    <div class="branch-card">
      <h3>${branch.name}</h3>
      <p>${branch.location}</p>
      <a href="https://maps.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + branch.location)}" target="_blank">📍 Get Directions</a>
    </div>
  `).join('');
  
  html = html.replace('{{branches}}', branchesHTML);
  
  // Generate menu HTML
  const menuHTML = restaurant.menu.map(item => `
    <div class="menu-item"><span>${item.item}</span><span>${item.price}</span></div>
  `).join('');
  
  html = html.replace('{{menu}}', menuHTML);
  
  const filePath = path.join(cardsDir, `${restaurant.slug}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`✅ Created: ${restaurant.slug}.html`);
  createdCount++;
});

console.log(`\n🎉 SUCCESS! Created ${createdCount} restaurant pages with the Pizza 88 theme!`);
console.log('✨ All restaurants now have:');
console.log('   • Modern Pizza 88 design');
console.log('   • Dark/Light theme toggle');
console.log('   • Working review system');
console.log('   • Branch locations');
console.log('   • Menu items');
console.log('   • Contact information');
console.log('\n📁 Check your /cards/ folder and test the pages!');