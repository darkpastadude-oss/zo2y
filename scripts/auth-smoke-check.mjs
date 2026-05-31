import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();
const authGatePath = path.join(rootDir, "dist", "js", "auth-gate.js");
const loginPath = path.join(rootDir, "dist", "login.html");
const signupPath = path.join(rootDir, "dist", "sign-up.html");

function extractVar(content, name) {
  const match = content.match(new RegExp(`var\\s+${name}\\s*=\\s*'([^']*)'`));
  return match ? String(match[1] || "").trim() : "";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const authGate = await readFile(authGatePath, "utf8");
  const loginHtml = await readFile(loginPath, "utf8");
  const signupHtml = await readFile(signupPath, "utf8");

  const projectRef = extractVar(authGate, "PROJECT_REF") || extractVar(authGate, "DEFAULT_PROJECT_REF");
  const supabaseUrl = extractVar(authGate, "SUPABASE_URL") || extractVar(authGate, "DEFAULT_SUPABASE_URL");
  const supabaseKey = extractVar(authGate, "SUPABASE_KEY") || extractVar(authGate, "DEFAULT_SUPABASE_KEY");

  assert(projectRef === "gfkhjbztayjyojsgdpgk", "auth smoke: Supabase project ref is missing or unexpected");
  assert(supabaseUrl === "https://gfkhjbztayjyojsgdpgk.supabase.co", "auth smoke: Supabase URL is missing or unexpected");
  assert(/^sb_(publishable|anon)_/.test(supabaseKey), "auth smoke: Supabase public key is missing");
  assert(!authGate.includes("resolveInjectedConfigValue('__SUPABASE_"), "auth smoke: dist auth-gate still contains unresolved Supabase config");
  assert(loginHtml.includes("js/pages/auth-login.js"), "auth smoke: login page is missing auth-login script");
  assert(signupHtml.includes("js/pages/auth-signup.js"), "auth smoke: signup page is missing auth-signup script");

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const oauthResult = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://zo2y.com/index.html?flow=login&next=index.html",
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account"
      }
    }
  });

  if (oauthResult.error) throw oauthResult.error;
  const oauthUrl = String(oauthResult.data?.url || "");
  assert(oauthUrl.includes(`${supabaseUrl}/auth/v1/authorize`), "auth smoke: Google OAuth URL was not created");
  assert(oauthUrl.includes("provider=google"), "auth smoke: Google OAuth provider is missing");

  console.log("OK  auth config and Google OAuth smoke passed");
}

main().catch((error) => {
  console.error(`Auth smoke failed: ${error.message}`);
  process.exit(1);
});
