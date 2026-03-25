import { spawn } from "child_process";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = String(process.env.BASE_URL || "http://127.0.0.1:5000").trim().replace(/\/+$/, "");
const HEALTH_URL = `${BASE_URL}/api/health`;
const SIGNUP_URL = `${BASE_URL}/api/auth/password-signup`;
const SUPABASE_URL = "https://gfkhjbztayjyojsgdpgk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s";
const STORAGE_KEY = "sb-gfkhjbztayjyojsgdpgk-auth-token";

function log(message) {
  console.log(`[auth-smoke] ${message}`);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth() {
  try {
    const response = await fetch(HEALTH_URL);
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function waitForHealth(timeoutMs = 20000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeoutMs) {
    if (await checkHealth()) return true;
    await sleep(500);
  }
  return false;
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, options);
  child.on("error", (error) => {
    console.error(`[auth-smoke] Failed to start ${command}: ${error.message}`);
  });
  return child;
}

function createDualStorage({ disableLocalWrites = false } = {}) {
  const sessionStorage = new Map();
  const localStorage = new Map();
  return {
    sessionStorage,
    localStorage,
    adapter: {
      getItem(key) {
        if (sessionStorage.has(key)) return sessionStorage.get(key);
        if (localStorage.has(key)) return localStorage.get(key);
        return null;
      },
      setItem(key, value) {
        sessionStorage.set(key, value);
        if (!disableLocalWrites) {
          localStorage.set(key, value);
        }
      },
      removeItem(key) {
        sessionStorage.delete(key);
        localStorage.delete(key);
      }
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createPasswordUser(email, password, fullName) {
  const response = await fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    throw new Error(`Password signup failed: ${payload?.message || response.status}`);
  }
  return payload;
}

function createAuthClient(storageAdapter) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storageKey: STORAGE_KEY,
      storage: storageAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}

async function verifyLoginAndHomeRehydration({ disableLocalWrites = false } = {}) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `zo2y-auth-smoke-${unique}@example.com`;
  const password = `SmokePass!${unique.slice(-6)}A`;
  const fullName = `Zo2y Smoke ${unique.slice(-4)}`;

  log(`Creating test user ${email}`);
  await createPasswordUser(email, password, fullName);

  const storage = createDualStorage({ disableLocalWrites });
  const loginClient = createAuthClient(storage.adapter);
  const loginResult = await loginClient.auth.signInWithPassword({ email, password });
  if (loginResult.error) {
    throw new Error(`Password login failed: ${loginResult.error.message}`);
  }
  const loginSession = loginResult.data?.session || null;
  assert(loginSession?.user?.id, "Password login did not return a session user.");
  const storedPayload = storage.adapter.getItem(STORAGE_KEY);
  assert(storedPayload && storedPayload.includes("access_token"), "Session was not persisted into auth storage.");
  if (!disableLocalWrites) {
    assert(storage.localStorage.has(STORAGE_KEY), "Local storage did not receive the session snapshot.");
  } else {
    assert(!storage.localStorage.has(STORAGE_KEY), "Local storage should have stayed empty in quota-simulated mode.");
    assert(storage.sessionStorage.has(STORAGE_KEY), "Session storage should hold the session when local writes are unavailable.");
  }

  const homeClient = createAuthClient(storage.adapter);
  const sessionResult = await homeClient.auth.getSession();
  const homeSession = sessionResult.data?.session || null;
  assert(homeSession?.user?.id === loginSession.user.id, "Home-style client could not rehydrate the stored session.");

  const userResult = await homeClient.auth.getUser();
  if (userResult.error) {
    throw new Error(`Home-style getUser failed: ${userResult.error.message}`);
  }
  assert(userResult.data?.user?.email?.toLowerCase() === email.toLowerCase(), "Home-style client resolved the wrong user.");

  const signOutResult = await homeClient.auth.signOut();
  if (signOutResult.error) {
    throw new Error(`Sign-out failed: ${signOutResult.error.message}`);
  }
  assert(!storage.adapter.getItem(STORAGE_KEY), "Auth storage was not cleared after sign-out.");

  return {
    email,
    userId: loginSession.user.id,
    localWritesEnabled: !disableLocalWrites
  };
}

async function main() {
  let serverProcess = null;
  let launchedServer = false;

  if (!(await checkHealth())) {
    log(`Backend not running at ${BASE_URL}. Launching local server...`);
    serverProcess = spawnProcess("node", ["backend/index.js"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env }
    });
    launchedServer = true;
    const healthy = await waitForHealth();
    if (!healthy) {
      throw new Error("Backend did not become healthy in time.");
    }
  }

  try {
    const normalResult = await verifyLoginAndHomeRehydration({ disableLocalWrites: false });
    log(`Password signup/login rehydration passed for ${normalResult.email}`);

    const quotaResult = await verifyLoginAndHomeRehydration({ disableLocalWrites: true });
    log(`Quota-style sessionStorage fallback rehydration passed for ${quotaResult.email}`);

    log("All auth smoke checks passed.");
  } finally {
    if (launchedServer && serverProcess) {
      serverProcess.kill();
    }
  }
}

main().catch((error) => {
  console.error(`[auth-smoke] ${error.message}`);
  process.exit(1);
});
