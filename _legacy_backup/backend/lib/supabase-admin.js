import { createClient } from "@supabase/supabase-js";

let cachedClient;
let attempted = false;

function readEnv() {
  const rawUrl = String(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_REF || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();

  let url = rawUrl;
  if (url && !/^https?:\/\//i.test(url)) {
    if (/^[a-z0-9]{20}$/i.test(url)) {
      url = `https://${url}.supabase.co`;
    } else if (/supabase\.co/i.test(url)) {
      url = `https://${url}`;
    }
  }

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

