/**
 * D6 housekeeping: remove oversized avatar data-URIs from auth users' user_metadata.
 *
 * Background: profile.js previously wrote the base64 avatar into user_metadata via
 * supabase.auth.updateUser({ data: { avatar_url, avatar } }). GoTrue embeds
 * user_metadata in EVERY JWT, so an 18KB avatar → ~50KB JWT → proxy returns flat
 * 400 for every REST call → the account is soft-locked with no app-side escape.
 *
 * This script scans auth.users and clears ONLY the oversized avatar fields
 * (avatar / avatar_url), preserving username and other profile metadata.
 * Avatars stored in user_profiles are untouched.
 *
 * Usage:
 *   node scripts/clear-oversized-avatar-metadata.mjs
 * (reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .dev.vars)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadDotDevVars() {
  try {
    const txt = readFileSync(".dev.vars", "utf8");
    const out = {};
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

const vars = loadDotDevVars();
const SUPABASE_URL = process.env.SUPABASE_URL || vars.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || vars.SUPABASE_SERVICE_ROLE_KEY;
const MAX_AVATAR_META_LEN = 2048;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (env or .dev.vars)");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function avatarCandidates(meta) {
  return [meta.avatar_url, meta.avatar, meta.picture].filter((v) => typeof v === "string");
}

async function collectAllUsers() {
  const all = [];
  let page = 0;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: page + 1, perPage });
    if (error) throw new Error(`listUsers page ${page + 1}: ${error.message}`);
    const users = data && data.users ? data.users : [];
    all.push(...users);
    if (users.length < perPage) break;
    page++;
  }
  return all;
}

let cleared = 0;
let failed = 0;

for (const u of await collectAllUsers()) {
  const meta = (u && u.user_metadata) || {};
  const big = avatarCandidates(meta).find((v) => /^data:/i.test(v) && v.length > MAX_AVATAR_META_LEN);
  if (!big) continue;

  const patch = {};
  if (typeof meta.avatar_url === "string") patch.avatar_url = null;
  if (typeof meta.avatar === "string") patch.avatar = null;

  try {
    const { error } = await admin.auth.admin.updateUserById(u.id, {
      user_metadata: { ...meta, ...patch },
    });
    if (error) {
      failed++;
      console.warn(`FAILED ${u.email || u.id}: ${error.message}`);
    } else {
      cleared++;
      console.log(`cleared avatar metadata for ${u.email || u.id} (was ${big.length} chars)`);
    }
  } catch (e) {
    failed++;
    console.warn(`ERR ${u.email || u.id}: ${e.message}`);
  }
}

console.log(`\nDone. cleared=${cleared} failed=${failed}`);