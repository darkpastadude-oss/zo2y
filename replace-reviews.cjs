const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://qtgxffeeukdiaovynmdo.supabase.co";
const supabaseKey = "PUT-YOUR-KEY-HERE";

// map filenames to restaurant IDs
const restaurantIdMap = {
  mori: 1,
  mera: 2,
  ocean: 3
  // add the rest OR it'll just skip
};

async function updateRestaurantFiles() {
  const folder = path.join(__dirname, "cards");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".html"));

  for (const file of files) {
    const name = file.replace(".html", "").toLowerCase();
    const restaurantId = restaurantIdMap[name] || null;

    if (!restaurantId) {
      console.log(`Skipping ${file}: no ID found.`);
      continue;
    }

    const filePath = path.join(folder, file);
    let html = fs.readFileSync(filePath, "utf8");

    // remove old reviews section (more flexible)
    html = html.replace(
      /<section[^>]*class="[^"]*reviews[^"]*"[^>]*>[\s\S]*?<\/section>/i,
      ""
    );

    const newSection = `
<section class="section reviews">
  <div id="reviews"></div>
</section>

<script type="module">
  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const supabase = createClient("${supabaseUrl}", "${supabaseKey}");
  const restaurantId = ${restaurantId};

  const reviewsBox = document.getElementById("reviews");

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function loadReviews() {
    reviewsBox.innerHTML = "Loading reviews...";

    const session = await supabase.auth.getSession();
    const user = session.data.session?.user;

    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, user_id, created_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      reviewsBox.innerHTML = "Failed to load reviews.";
      return;
    }

    let html = "<h2>Reviews</h2>";

    if (user) {
      html += \`
      <div class="review-form">
        <select id="rating">
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
        <textarea id="comment"></textarea>
        <button id="submitReview">Submit</button>
      </div>\`;
    } else {
      html += "<p><a href='/login.html'>Log in to leave a review</a></p>";
    }

    data.forEach(r => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      html += \`
        <div class="review">
          <p><strong>\${r.user_id}</strong></p>
          <p>\${stars}</p>
          <p>\${escapeHTML(r.comment)}</p>
        </div>\`;
    });

    reviewsBox.innerHTML = html;

    if (user) {
      document.getElementById("submitReview").onclick = submitReview;
    }
  }

  async function submitReview() {
    const rating = Number(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value;

    const session = await supabase.auth.getSession();
    const user = session.data.session.user;

    await supabase.from("reviews").insert({
      restaurant_id: restaurantId,
      user_id: user.id,
      rating,
      comment
    });

    loadReviews();
  }

  loadReviews();
</script>
`;

    // inject before </body>
    html = html.replace(/<\/body>/i, newSection + "\n</body>");

    fs.writeFileSync(filePath, html);
    console.log(`Updated: ${file}`);
  }
}

updateRestaurantFiles();
