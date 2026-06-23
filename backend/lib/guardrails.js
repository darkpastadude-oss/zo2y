import crypto from "node:crypto";
import { getSupabaseAdminClient } from "./supabase-admin.js";

const rateLimitBuckets = new Map();
const failedAuthAttempts = new Map();
const csrfTokens = new Map();

function nowMs() {
  return Date.now();
}

function pruneRateLimitBuckets(maxSize = 4000) {
  if (rateLimitBuckets.size <= maxSize) return;
  const keys = rateLimitBuckets.keys();
  while (rateLimitBuckets.size > maxSize) {
    const key = keys.next().value;
    if (!key) break;
    rateLimitBuckets.delete(key);
  }
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const socketIp = req.socket?.remoteAddress || "";
  const raw = forwarded || realIp || socketIp || "unknown";
  return String(raw).split(",")[0].trim() || "unknown";
}

export function hashValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Constant-time string comparison. Both inputs are coerced to Buffers
 * of the same length using length-prefixed hashing so the comparison
 * time is independent of the inputs.
 */
export function timingSafeEqualString(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const a = crypto.createHash("sha256").update(String(provided)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Constant-time string compare without hashing. Requires equal length.
 */
export function timingSafeStringCompare(provided, expected) {
  const a = String(provided || "");
  const b = String(expected || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * Redact sensitive keys/headers from a flat object. Used by the
 * request logger so we never write secrets / tokens to stdout.
 */
const REDACTED_HEADERS = new Set([
  "authorization",
  "x-support-api-key",
  "x-email-api-key",
  "x-csrf-token",
  "x-session-id",
  "cookie",
  "set-cookie",
  "x-supabase-api-key",
  "x-api-key"
]);

const REDACTED_QUERY_KEYS = new Set([
  "code",
  "access_token",
  "refresh_token",
  "token",
  "token_hash",
  "type",
  "error",
  "error_description",
  "scope",
  "state",
  "api_key",
  "apikey",
  "password",
  "csrf",
  "csrf_token"
]);

export function redactHeaders(headers) {
  const out = {};
  if (!headers || typeof headers !== "object") return out;
  for (const key of Object.keys(headers)) {
    const lower = String(key).toLowerCase();
    if (REDACTED_HEADERS.has(lower)) {
      out[key] = "[redacted]";
    } else {
      out[key] = headers[key];
    }
  }
  return out;
}

export function redactQuery(queryString) {
  if (!queryString) return "";
  const text = String(queryString);
  if (!text) return "";
  // Cheap check: does it contain any sensitive key?
  const lower = text.toLowerCase();
  let hasSensitive = false;
  for (const k of REDACTED_QUERY_KEYS) {
    if (lower.indexOf(k + "=") !== -1) { hasSensitive = true; break; }
  }
  if (!hasSensitive) return text;
  // Replace only the sensitive values, keep structure.
  try {
    const params = new URLSearchParams(text.startsWith("?") ? text.slice(1) : text);
    for (const key of Array.from(params.keys())) {
      if (REDACTED_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, "[redacted]");
      }
    }
    return "?" + params.toString();
  } catch (_err) {
    return "[redacted-query]";
  }
}

export function safeStringifyForLog(value, maxLen = 500) {
  try {
    const seen = new WeakSet();
    const json = JSON.stringify(value, (k, v) => {
      if (typeof v === "string" && v.length > 200) return v.slice(0, 200) + "…";
      if (v && typeof v === "object") {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
    if (!json) return "";
    return json.length > maxLen ? json.slice(0, maxLen) + "…" : json;
  } catch (_err) {
    return "[Unserializable]";
  }
}

/**
 * HaveIBeenPwned k-anonymity check.
 *
 * Splits the SHA-1 hash of the password into a 5-character prefix
 * (sent over the wire) and a 35-character suffix (kept locally). The
 * HIBP API returns all suffix:count pairs for that prefix; we scan for
 * ours. HIBP never learns the full hash.
 *
 * Disabled by default. Enable by setting `HIBP_API_URL` (defaults to
 * the public endpoint) and `process.env.PASSWORD_HIBP_CHECK === "true"`.
 * Returns `{ checked, breached, count }`. If the upstream is
 * unreachable or times out, returns `{ checked: false, breached: false }`
 * so we never fail closed.
 *
 * @param {string} password
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=800]
 * @param {string} [opts.endpoint]
 * @returns {Promise<{checked:boolean, breached:boolean, count?:number, error?:string}>}
 */
export async function checkPasswordBreached(password, opts = {}) {
  if (!password || typeof password !== "string") {
    return { checked: false, breached: false };
  }
  if (String(process.env.PASSWORD_HIBP_CHECK || "").toLowerCase() !== "true") {
    return { checked: false, breached: false };
  }
  const endpoint = String(opts.endpoint || process.env.HIBP_API_URL || "https://api.pwnedpasswords.com/range/");
  const timeoutMs = Math.max(100, Number(opts.timeoutMs) || 800);

  const sha1 = crypto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  if (!/^[A-F0-9]{5}$/.test(prefix) || !/^[A-F0-9]{35}$/.test(suffix)) {
    return { checked: false, breached: false };
  }

  let controller;
  let timer;
  try {
    controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controller) timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(endpoint + prefix, {
      method: "GET",
      headers: { "Add-Padding": "true", "User-Agent": "zo2y-auth" },
      signal: controller ? controller.signal : undefined
    });
    if (timer) clearTimeout(timer);
    if (!res.ok) {
      return { checked: false, breached: false, error: `upstream_${res.status}` };
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const [s, c] = line.split(":");
      if (s && s.trim().toUpperCase() === suffix) {
        const count = Number((c || "").trim()) || 0;
        return { checked: true, breached: count > 0, count };
      }
    }
    return { checked: true, breached: false, count: 0 };
  } catch (err) {
    if (timer) clearTimeout(timer);
    return { checked: false, breached: false, error: String(err?.message || err) };
  }
}

/**
 * Serverless-safe (Supabase-backed) rate limit. Falls back to in-memory
 * only if the admin client is not configured. Returns the new count
 * after incrementing.
 *
 * bucket: string identifier (e.g. `signup:ip:1.2.3.4`)
 * windowMs: window length
 * max: maximum hits per window
 */
export async function incrementRateLimit(bucket, windowMs, max) {
  const client = getSupabaseAdminClient();
  const safeBucket = String(bucket || "").slice(0, 200);
  const safeWindow = Math.max(1000, Number(windowMs) || 60_000);
  const safeMax = Math.max(1, Number(max) || 1);

  if (!client) {
    // In-memory fallback (insecure on serverless runtimes such as
    // Cloudflare Pages Functions, only for local dev).
    const now = nowMs();
    const current = rateLimitBuckets.get(safeBucket);
    if (!current || (now - current.startAt) > safeWindow) {
      rateLimitBuckets.set(safeBucket, { startAt: now, count: 1 });
      return { count: 1, max: safeMax, exceeded: false, windowMs: safeWindow };
    }
    current.count += 1;
    return { count: current.count, max: safeMax, exceeded: current.count > safeMax, windowMs: safeWindow };
  }

  const now = new Date();
  const expires = new Date(now.getTime() + safeWindow);
  try {
    // Upsert: if exists, increment; else insert with count=1.
    const { data, error } = await client
      .rpc("zo2y_increment_rate_limit", {
        p_bucket: safeBucket,
        p_window_ms: safeWindow,
        p_expires_at: expires.toISOString()
      });
    if (error || !data) {
      throw error || new Error("rate_limit_rpc_failed");
    }
    const count = Number(data?.count || 0);
    return { count, max: safeMax, exceeded: count > safeMax, windowMs: safeWindow };
  } catch (_rpcErr) {
    // Fallback: in-memory (less safe, but never throw 5xx to clients).
    const now2 = nowMs();
    const current = rateLimitBuckets.get(safeBucket);
    if (!current || (now2 - current.startAt) > safeWindow) {
      rateLimitBuckets.set(safeBucket, { startAt: now2, count: 1 });
      return { count: 1, max: safeMax, exceeded: false, windowMs: safeWindow };
    }
    current.count += 1;
    return { count: current.count, max: safeMax, exceeded: current.count > safeMax, windowMs: safeWindow };
  }
}

/**
 * Serverless-safe (Supabase-backed) captcha storage. Stores only a
 * hash of the answer; never the plaintext. Validates by re-hashing
 * the submitted answer and comparing in constant time.
 */
export async function storeCaptchaSecure(captcha) {
  const client = getSupabaseAdminClient();
  if (!client) {
    // Fallback: in-memory.
    captchaStore.set(captcha.id, {
      hash: captcha.hash,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    return true;
  }
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error } = await client
      .from("security_captcha")
      .upsert({
        id: String(captcha.id).slice(0, 64),
        answer_hash: String(captcha.hash).slice(0, 128),
        hint: String(captcha.question || "").slice(0, 200),
        expires_at: expiresAt
      }, { onConflict: "id" });
    if (error) throw error;
    return true;
  } catch (_err) {
    captchaStore.set(captcha.id, {
      hash: captcha.hash,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    return true;
  }
}

export async function validateCaptchaSecure(captchaId, answer) {
  const safeId = String(captchaId || "").slice(0, 64);
  const safeAnswer = String(answer || "").slice(0, 200);
  if (!safeId || !safeAnswer) return { ok: false, reason: "missing" };

  const client = getSupabaseAdminClient();
  let storedHash = null;
  let source = "memory";

  if (client) {
    try {
      const { data, error } = await client
        .from("security_captcha")
        .select("answer_hash, expires_at, consumed")
        .eq("id", safeId)
        .maybeSingle();
      if (error) throw error;
      if (data && !data.consumed && new Date(data.expires_at) > new Date()) {
        storedHash = data.answer_hash;
        source = "db";
        // Mark as consumed (best-effort, do not block on failure).
        try {
          await client
            .from("security_captcha")
            .update({ consumed: true, consumed_at: new Date().toISOString() })
            .eq("id", safeId);
        } catch (_consumeErr) {}
      }
    } catch (_err) {}
  }

  if (!storedHash) {
    const stored = captchaStore.get(safeId);
    if (stored && stored.expiresAt > Date.now()) {
      storedHash = stored.hash;
      source = "memory";
    }
    captchaStore.delete(safeId);
  }

  if (!storedHash) return { ok: false, reason: "not_found" };

  const providedHash = crypto.createHash("sha256").update(safeAnswer).digest("hex");
  const ok = timingSafeStringCompare(providedHash, storedHash);
  return { ok, reason: ok ? "ok" : "mismatch", source };
}

/**
 * Serverless-safe (Supabase-backed) CSRF token storage.
 * Token is returned to caller; only its sha256 is stored.
 */
export async function storeCsrfTokenSecure(token, sessionHint) {
  const client = getSupabaseAdminClient();
  if (!client) {
    csrfTokens.set(token, {
      sessionHint: sessionHint || "anonymous",
      createdAt: Date.now()
    });
    return true;
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const { error } = await client
      .from("security_csrf")
      .upsert({
        token_hash: tokenHash,
        session_hint: String(sessionHint || "anonymous").slice(0, 200),
        expires_at: expiresAt
      }, { onConflict: "token_hash" });
    if (error) throw error;
    return true;
  } catch (_err) {
    csrfTokens.set(token, {
      sessionHint: sessionHint || "anonymous",
      createdAt: Date.now()
    });
    return true;
  }
}

export async function validateCsrfTokenSecure(token, sessionHint) {
  const safeToken = String(token || "").trim();
  if (!safeToken) return { ok: false, reason: "missing" };

  const client = getSupabaseAdminClient();
  const tokenHash = crypto.createHash("sha256").update(safeToken).digest("hex");
  let stored = null;

  if (client) {
    try {
      const { data, error } = await client
        .from("security_csrf")
        .select("session_hint, expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (!error && data && new Date(data.expires_at) > new Date()) {
        stored = { sessionHint: data.session_hint, createdAt: Date.now() };
        try {
          await client.from("security_csrf").delete().eq("token_hash", tokenHash);
        } catch (_delErr) {}
      }
    } catch (_err) {}
  }

  if (!stored) {
    stored = csrfTokens.get(safeToken);
    if (stored) csrfTokens.delete(safeToken);
  }

  if (!stored) return { ok: false, reason: "not_found" };

  if (sessionHint
      && stored.sessionHint
      && stored.sessionHint !== "anonymous"
      && stored.sessionHint !== sessionHint) {
    return { ok: false, reason: "session_mismatch" };
  }
  return { ok: true, reason: "ok" };
}

/**
 * Serverless-safe (Supabase-backed) account lockout. Returns the new
 * failed_count after incrementing. If >= threshold, sets locked_until.
 */
export async function recordFailedAuthSecure(identifier, kind, threshold, lockoutMs) {
  const client = getSupabaseAdminClient();
  if (!client) {
    const key = hashValue(identifier);
    const now = nowMs();
    const attempts = failedAuthAttempts.get(key) || { count: 0, firstAttempt: now };
    if (now - attempts.firstAttempt > lockoutMs) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    attempts.count += 1;
    failedAuthAttempts.set(key, attempts);
    return {
      count: attempts.count,
      locked: attempts.count >= threshold,
      lockoutRemaining: Math.max(0, lockoutMs - (now - attempts.firstAttempt))
    };
  }
  try {
    const identifierHash = hashValue(identifier);
    const { data, error } = await client.rpc("zo2y_record_failed_auth", {
      p_identifier_hash: identifierHash,
      p_kind: String(kind || "ip"),
      p_threshold: Number(threshold) || 5,
      p_lockout_ms: Number(lockoutMs) || 900000
    });
    if (error || !data) throw error || new Error("lockout_rpc_failed");
    return {
      count: Number(data?.count || 0),
      locked: Boolean(data?.locked),
      lockoutRemaining: Number(data?.lockout_remaining || 0)
    };
  } catch (_rpcErr) {
    const key = hashValue(identifier);
    const now = nowMs();
    const attempts = failedAuthAttempts.get(key) || { count: 0, firstAttempt: now };
    if (now - attempts.firstAttempt > lockoutMs) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    attempts.count += 1;
    failedAuthAttempts.set(key, attempts);
    return {
      count: attempts.count,
      locked: attempts.count >= threshold,
      lockoutRemaining: Math.max(0, lockoutMs - (now - attempts.firstAttempt))
    };
  }
}

export async function clearFailedAuthSecure(identifier) {
  const client = getSupabaseAdminClient();
  if (!client) {
    failedAuthAttempts.delete(hashValue(identifier));
    return;
  }
  try {
    const identifierHash = hashValue(identifier);
    await client.from("security_lockout").delete().eq("identifier_hash", identifierHash);
  } catch (_err) {
    failedAuthAttempts.delete(hashValue(identifier));
  }
}

export async function isAccountLockedSecure(identifier, kind) {
  const client = getSupabaseAdminClient();
  if (!client) {
    const attempts = failedAuthAttempts.get(hashValue(identifier));
    if (!attempts) return { locked: false, attempts: 0 };
    return { locked: attempts.count >= LOCKOUT_THRESHOLD, attempts: attempts.count };
  }
  try {
    const identifierHash = hashValue(identifier);
    const { data, error } = await client
      .from("security_lockout")
      .select("failed_count, locked_until, last_failed_at")
      .eq("identifier_hash", identifierHash)
      .eq("identifier_kind", String(kind || "ip"))
      .maybeSingle();
    if (error || !data) return { locked: false, attempts: 0 };
    const locked = data.locked_until && new Date(data.locked_until) > new Date();
    return { locked: Boolean(locked), attempts: Number(data.failed_count || 0) };
  } catch (_err) {
    return { locked: false, attempts: 0 };
  }
}

/**
 * Append a row to security_audit_log. Never throws.
 */
export async function writeAuditLog(eventName, eventStatus, details) {
  const safeName = String(eventName || "unknown").slice(0, 80);
  const safeStatus = ["ok", "denied", "error", "warning"].includes(String(eventStatus)) ? String(eventStatus) : "ok";
  const client = getSupabaseAdminClient();
  if (!client) {
    return false;
  }
  try {
    const { error } = await client.from("security_audit_log").insert({
      event_name: safeName,
      event_status: safeStatus,
      actor_user_id: details?.actorUserId || null,
      actor_ip_hash: details?.actorIpHash || null,
      target_user_id: details?.targetUserId || null,
      metadata: details?.metadata || {},
      request_id: details?.requestId || null
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("audit_log_insert_failed", error.message);
      return false;
    }
    return true;
  } catch (_err) {
    return false;
  }
}

// Account lockout tracking
const LOCKOUT_THRESHOLD = 5; // Failed attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Simple CAPTCHA generation and validation
export function generateMathCaptcha() {
  const operators = ['+', '-'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1, num2, answer;
  
  if (operator === '+') {
    num1 = Math.floor(Math.random() * 10) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    answer = num1 + num2;
  } else {
    num1 = Math.floor(Math.random() * 10) + 5;
    num2 = Math.floor(Math.random() * 5) + 1;
    answer = num1 - num2;
  }
  
  const captchaId = crypto.randomBytes(16).toString('hex');
  const captchaHash = crypto.createHash('sha256').update(String(answer)).digest('hex');
  
  return {
    id: captchaId,
    question: `${num1} ${operator} ${num2} = ?`,
    hash: captchaHash
  };
}

const captchaStore = new Map();

export function storeCaptcha(captcha) {
  captchaStore.set(captcha.id, {
    hash: captcha.hash,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
}

export function validateCaptcha(captchaId, answer) {
  const stored = captchaStore.get(captchaId);
  
  if (!stored) return false;
  
  // Check expiration
  if (Date.now() > stored.expiresAt) {
    captchaStore.delete(captchaId);
    return false;
  }
  
  const answerHash = crypto.createHash('sha256').update(String(answer)).digest('hex');
  const isValid = answerHash === stored.hash;
  
  // Remove after validation (one-time use)
  captchaStore.delete(captchaId);
  
  return isValid;
}

export function requireCaptcha(req, res, next) {
  const captchaId = String(req.body?.captchaId || "").trim();
  const captchaAnswer = String(req.body?.captchaAnswer || "").trim();
  
  if (!captchaId || !captchaAnswer) {
    return res.status(400).json({
      success: false,
      message: "CAPTCHA is required",
      requiresCaptcha: true
    });
  }
  
  if (!validateCaptcha(captchaId, captchaAnswer)) {
    return res.status(400).json({
      success: false,
      message: "Invalid CAPTCHA",
      requiresCaptcha: true
    });
  }
  
  next();
}

// CSRF Token generation and validation
const CSRF_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  csrfTokens.set(tokenHash, {
    sessionId: sessionId || 'anonymous',
    createdAt: Date.now()
  });
  
  return token;
}

export function validateCsrfToken(token, sessionId) {
  if (!token) return false;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const stored = csrfTokens.get(tokenHash);
  
  if (!stored) return false;
  
  // Check expiration
  if (Date.now() - stored.createdAt > CSRF_TOKEN_TTL) {
    csrfTokens.delete(tokenHash);
    return false;
  }
  
  // For authenticated sessions, verify session matches
  if (sessionId && stored.sessionId !== 'anonymous' && stored.sessionId !== sessionId) {
    return false;
  }
  
  // One-time use - remove after validation
  csrfTokens.delete(tokenHash);
  
  return true;
}

export function requireCsrf(req, res, next) {
  const token = String(req.get('x-csrf-token') || req.body?.csrfToken || "").trim();
  const sessionId = String(req.get('x-session-id') || "").trim();
  
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "CSRF token is required"
    });
  }
  
  if (!validateCsrfToken(token, sessionId)) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired CSRF token"
    });
  }
  
  next();
}

export function getCsrfToken(req, res) {
  const sessionId = String(req.get('x-session-id') || "").trim();
  const token = generateCsrfToken(sessionId);
  
  res.setHeader('x-csrf-token', token);
  return res.status(200).json({
    csrfToken: token
  });
}

export function recordFailedAuth(identifier) {
  const key = hashValue(identifier);
  const now = nowMs();
  const attempts = failedAuthAttempts.get(key) || { count: 0, firstAttempt: now };
  
  // Reset if lockout period has expired
  if (now - attempts.firstAttempt > LOCKOUT_DURATION_MS) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }
  
  attempts.count += 1;
  failedAuthAttempts.set(key, attempts);
  
  return {
    count: attempts.count,
    locked: attempts.count >= LOCKOUT_THRESHOLD,
    lockoutRemaining: Math.max(0, LOCKOUT_DURATION_MS - (now - attempts.firstAttempt))
  };
}

export function isAccountLocked(identifier) {
  const key = hashValue(identifier);
  const attempts = failedAuthAttempts.get(key);
  
  if (!attempts) return false;
  
  const now = nowMs();
  
  // Reset if lockout period has expired
  if (now - attempts.firstAttempt > LOCKOUT_DURATION_MS) {
    failedAuthAttempts.delete(key);
    return false;
  }
  
  return attempts.count >= LOCKOUT_THRESHOLD;
}

export function clearFailedAuth(identifier) {
  const key = hashValue(identifier);
  failedAuthAttempts.delete(key);
}

export function getLockoutInfo(identifier) {
  const key = hashValue(identifier);
  const attempts = failedAuthAttempts.get(key);
  
  if (!attempts) return { locked: false, attempts: 0, remainingMs: 0 };
  
  const now = nowMs();
  const elapsed = now - attempts.firstAttempt;
  
  // Reset if lockout period has expired
  if (elapsed > LOCKOUT_DURATION_MS) {
    failedAuthAttempts.delete(key);
    return { locked: false, attempts: 0, remainingMs: 0 };
  }
  
  return {
    locked: attempts.count >= LOCKOUT_THRESHOLD,
    attempts: attempts.count,
    remainingMs: Math.max(0, LOCKOUT_DURATION_MS - elapsed)
  };
}

export function attachRequestContext(req, res, next) {
  const existing = String(req.get("x-request-id") || "").trim();
  const requestId = existing || crypto.randomUUID();
  req.requestId = requestId;
  req.requestStartAt = nowMs();
  res.setHeader("x-request-id", requestId);
  next();
}

export function applySecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // 2-year HSTS including subdomains; safe for `*.zo2y.com` once
  // rolled out to all subdomains. Send only on HTTPS so dev/preview
  // hosts (zo2y.pages.dev, localhost) don't get locked out.
  if (String(_req?.headers?.["x-forwarded-proto"] || "").toLowerCase() === "https" || _req?.protocol === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  // Modern CSP violation reporting endpoint. Browsers that support
  // Reporting-Endpoints will POST JSON to /api/csp-report.
  res.setHeader("Reporting-Endpoints", 'csp-endpoint="/api/csp-report"');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "connect-src 'self' https://api.rawg.io https://gfkhjbztayjyojsgdpgk.supabase.co https://api.supabase.com https://image.tmdb.org https://covers.openlibrary.org https://books.googleusercontent.com https://i.scdn.co https://images.igdb.com https://flagcdn.com https://commons.wikimedia.org https://www.thesportsdb.com https://media.rawg.io https://is1-ssl.mzstatic.com https://itunes.apple.com https://images.unsplash.com https://en.wikipedia.org https://*.wikidata.org https://wikimedia.org",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report",
    "report-to csp-endpoint"
  ].join("; ");
  
  res.setHeader("Content-Security-Policy", cspDirectives);
  
  next();
}

export function requestLogger(req, res, next) {
  const shouldLog = String(process.env.LOG_HTTP || "true").toLowerCase() !== "false";
  if (!shouldLog) return next();

  const started = nowMs();
  res.on("finish", () => {
    const elapsed = nowMs() - started;
    const status = Number(res.statusCode || 0);
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    const ip = getClientIp(req);
    const redactedUrl = redactQuery(req.originalUrl || req.url || "");
    const msg = `[${level}] ${req.method} ${redactedUrl} ${status} ${elapsed}ms ip=${ip} req_id=${req.requestId || "-"}`;
    // eslint-disable-next-line no-console
    console.log(msg);
  });

  next();
}

/**
 * Verify a Bearer access token via Supabase admin SDK and attach the
 * authenticated user to req. Returns 401 if missing/invalid. Use this
 * for any state-changing API endpoint that should not be callable
 * anonymously.
 *
 *   import { requireAuth } from "./guardrails.js";
 *   app.post("/api/admin/x", requireAuth, async (req, res) => { ... })
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = String(req.get("authorization") || "").trim();
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        request_id: req.requestId || null
      });
    }
    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        request_id: req.requestId || null
      });
    }
    const client = getSupabaseAdminClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        message: "Auth backend unavailable.",
        request_id: req.requestId || null
      });
    }
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data?.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
        request_id: req.requestId || null
      });
    }
    // Enforce email verification server-side. By default the caller
    // must have a confirmed email to use this middleware. Routes that
    // should allow unverified users (e.g. resend-verification, profile
    // read-only) can set `req.allowUnverifiedEmail = true` BEFORE
    // calling requireAuth, or wrap with `requireAuthUnverified`.
    const allowUnverified = req.allowUnverifiedEmail === true;
    if (!allowUnverified) {
      const confirmedAt = data.user.email_confirmed_at || data.user.confirmed_at || null;
      if (!confirmedAt) {
        await writeAuditLog("auth_unverified_rejected", "denied", {
          actorUserId: data.user.id,
          actorIpHash: hashValue(getClientIp(req)),
          requestId: req.requestId || null,
          metadata: { path: redactQuery(req.originalUrl || req.url || "") }
        });
        return res.status(403).json({
          success: false,
          message: "Please verify your email address before continuing.",
          code: "email_not_verified",
          request_id: req.requestId || null
        });
      }
    }
    req.auth = {
      userId: data.user.id,
      email: data.user.email || null,
      emailConfirmed: Boolean(data.user.email_confirmed_at || data.user.confirmed_at),
      session: data,
      accessToken
    };
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Auth verification failed.",
      request_id: req.requestId || null
    });
  }
}

export function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const max = Number(options.max || 120);
  const keyPrefix = String(options.keyPrefix || "api");
  const skip = typeof options.skip === "function" ? options.skip : () => false;

  return function rateLimitMiddleware(req, res, next) {
    if (skip(req)) return next();

    const ip = getClientIp(req);
    const bucketKey = `${keyPrefix}:${req.method}:${req.path}:${ip}`;
    const now = nowMs();
    const current = rateLimitBuckets.get(bucketKey);

    if (!current || (now - current.startAt) > windowMs) {
      rateLimitBuckets.set(bucketKey, { startAt: now, count: 1 });
      res.setHeader("x-ratelimit-limit", String(max));
      res.setHeader("x-ratelimit-remaining", String(Math.max(0, max - 1)));
      return next();
    }

    current.count += 1;
    const remaining = Math.max(0, max - current.count);
    res.setHeader("x-ratelimit-limit", String(max));
    res.setHeader("x-ratelimit-remaining", String(remaining));

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - current.startAt)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: "Rate limit exceeded. Try again shortly.",
        request_id: req.requestId || null
      });
    }

    pruneRateLimitBuckets();
    return next();
  };
}

export function notFoundJson(req, res) {
  return res.status(404).json({
    message: "Not found",
    request_id: req.requestId || null,
    path: redactQuery(req.originalUrl || req.url || "")
  });
}

export function jsonErrorHandler(error, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[ERROR] request failed", {
    request_id: req.requestId || null,
    method: req.method,
    path: redactQuery(req.originalUrl || req.url || ""),
    message: String(error?.message || error)
  });

  if (res.headersSent) return;
  res.status(500).json({
    message: "Internal server error",
    request_id: req.requestId || null
  });
}


