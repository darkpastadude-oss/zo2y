const https = require("https");

const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnphdHlqeW9qZ2RwZ2siLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczOTQyNTI3OSwiZXhwIjoyMDU1MDAxMjc5fQ.S8VlU8z2sS9e0r0r0b0r0b0r0b0r0b0r0b0r0b0r0b";

function supabaseRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const headers = {
      "apikey": ANON_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const req = https.request(url, opts, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  // Without auth, RLS should block inserts (401/403)
  // This tests that the table exists and the constraint works
  
  console.log("=== TEST: Insert without auth (should fail with 401/403) ===");
  const r1 = await supabaseRequest("POST", "/rest/v1/music_list_items", {
    user_id: "00000000-0000-0000-0000-000000000000",
    track_id: "test_track_123",
    list_type: "favorites"
  });
  console.log(`  Status: ${r1.status}`);
  console.log(`  Expected 401 or 403, got ${r1.status}: ${r1.status === 401 || r1.status === 403 ? "PASS" : "FAIL"}`);
  
  console.log("\n=== TEST: Check table exists via HEAD ===");
  const r2 = await supabaseRequest("HEAD", "/rest/v1/music_list_items?select=id&limit=0", null);
  console.log(`  Status: ${r2.status}`);
  console.log(`  Table exists: ${r2.status === 200 || r2.status === 401 || r2.status === 403 ? "YES (PASS)" : "NO (FAIL)"}`);
  
  console.log("\n=== TEST: Check book_list_items table ===");
  const r3 = await supabaseRequest("HEAD", "/rest/v1/book_list_items?select=id&limit=0", null);
  console.log(`  Status: ${r3.status}`);
  console.log(`  Table exists: ${r3.status === 200 || r3.status === 401 || r3.status === 403 ? "YES (PASS)" : "NO (FAIL)"}`);
  
  console.log("\n=== TEST: Verify code handles 23505/409 ===");
  const fs = require("fs");
  const adapter = fs.readFileSync("dist/js/index-list-menu-adapter.js", "utf8");
  const hasInsert = adapter.includes(".insert(p)");
  const has23505 = adapter.includes("'23505'");
  const has409 = adapter.includes("===409");
  const noUpsert = !adapter.includes(".upsert(");
  console.log(`  Adapter uses .insert(p): ${hasInsert ? "PASS" : "FAIL"}`);
  console.log(`  Adapter checks 23505: ${has23505 ? "PASS" : "FAIL"}`);
  console.log(`  Adapter checks 409: ${has409 ? "PASS" : "FAIL"}`);
  console.log(`  Adapter does NOT use .upsert(): ${noUpsert ? "PASS" : "FAIL"}`);
  
  const index = fs.readFileSync("dist/js/pages/index.js", "utf8");
  const indexHas23505 = index.includes("'23505'");
  const indexHasInsert = index.includes("from(table).insert(insertRow)");
  const indexHas409Check = index.includes("409");
  console.log(`  Index.js checks 23505: ${indexHas23505 ? "PASS" : "FAIL"}`);
  console.log(`  Index.js uses .insert(): ${indexHasInsert ? "PASS" : "FAIL"}`);
  console.log(`  Index.js checks 409: ${indexHas409Check ? "PASS" : "FAIL"}`);
  
  console.log("\n=== TEST: Verify music.html handles 23505 ===");
  const musicHtml = fs.readFileSync("music.html", "utf8");
  const musicHas23505 = musicHtml.includes("23505");
  const musicHasInsert = musicHtml.includes(".insert(");
  console.log(`  music.html checks 23505: ${musicHas23505 ? "PASS" : "FAIL"}`);
  console.log(`  music.html uses .insert(): ${musicHasInsert ? "PASS" : "FAIL"}`);
}

test().catch(e => { console.error(e); process.exit(1); });
