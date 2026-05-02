import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read from wrangler.toml
const wranglerPath = join(__dirname, "..", "wrangler.toml");
const wranglerContent = readFileSync(wranglerPath, "utf-8");

// Parse SUPABASE_URL from wrangler.toml
const supabaseUrlMatch = wranglerContent.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1] : null;

// Get service role key from CLI argument or environment
const supabaseServiceKey = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error("Error: Could not find SUPABASE_URL in wrangler.toml");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("\nRun with:");
  console.error("  node scripts/clear-usernames.mjs YOUR_SERVICE_ROLE_KEY");
  console.error("\nOr set as environment variable:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/clear-usernames.mjs");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearUsernames() {
  console.log("Clearing all usernames from user_profiles table...");
  
  try {
    // First, get the current count
    const { count: beforeCount, error: countError } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    
    if (countError) throw countError;
    console.log(`Profiles before: ${beforeCount}`);
    
    // Clear username field from all profiles
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ username: null, full_name: null })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all rows
    
    if (updateError) throw updateError;
    
    // Also clear from auth metadata
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) throw usersError;
    
    console.log(`Updating ${users.users.length} user auth metadata...`);
    
    for (const user of users.users) {
      if (user.user_metadata) {
        const metadata = { ...user.user_metadata };
        delete metadata.username;
        delete metadata.zo2y_username;
        delete metadata.full_name;
        delete metadata.name;
        
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: metadata
        });
      }
    }
    
    // Get the count after
    const { count: afterCount, error: afterCountError } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    
    if (afterCountError) throw afterCountError;
    console.log(`Profiles after: ${afterCount}`);
    
    console.log("✅ Successfully cleared all usernames");
  } catch (error) {
    console.error("❌ Error clearing usernames:", error.message);
    process.exit(1);
  }
}

clearUsernames();
