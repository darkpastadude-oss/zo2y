import { createClient } from "@supabase/supabase-js";

let cachedClient;
let attempted = false;

function readEnv() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
  return { url, serviceRoleKey };
}

export function getSupabaseAdminClient() {
  if (attempted) return cachedClient || null;
  attempted = true;

  const { url, serviceRoleKey } = readEnv();
  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  return cachedClient;
}

