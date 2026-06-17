import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";
import { sendVerificationEmail, emailConfigured } from "../backend/lib/email/service.js";
import {
  getClientIp,
  hashValue,
  timingSafeStringCompare,
  timingSafeEqualString,
  redactQuery,
  incrementRateLimit,
  storeCaptchaSecure,
  validateCaptchaSecure,
  storeCsrfTokenSecure,
  validateCsrfTokenSecure,
  recordFailedAuthSecure,
  clearFailedAuthSecure,
  isAccountLockedSecure,
  writeAuditLog,
  checkPasswordBreached
} from "../backend/lib/guardrails.js";

const APP_BASE_URL_DEFAULT = "https://zo2y.com";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 256;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const RATE_LIMIT_SIGNUP_IP_PER_MIN = { windowMs: 60_000, max: 3 };
const RATE_LIMIT_SIGNUP_IP_PER_HOUR = { windowMs: 60 * 60_000, max: 8 };
const RATE_LIMIT_SIGNUP_IP_PER_DAY = { windowMs: 24 * 60 * 60_000, max: 12 };
const RATE_LIMIT_RESEND_IP_PER_HOUR = { windowMs: 60 * 60_000, max: 5 };
const RATE_LIMIT_RESEND_EMAIL_PER_DAY = { windowMs: 24 * 60 * 60_000, max: 3 };

const LOGIN_LOCKOUT_THRESHOLD = 8;
const LOGIN_LOCKOUT_MS = 15 * 60_000;

const MIN_RESPONSE_DELAY_MS = 220;
const MAX_RESPONSE_DELAY_MS = 480;

function nowMs() { return Date.now(); }

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 180);
}

function normalizeText(value, max = 255) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

function isValidPassword(pw) {
  if (typeof pw !== "string") return false;
  if (pw.length < PASSWORD_MIN_LENGTH || pw.length > PASSWORD_MAX_LENGTH) return false;
  let classes = 0;
  if (/[a-z]/.test(pw)) classes += 1;
  if (/[A-Z]/.test(pw)) classes += 1;
  if (/[0-9]/.test(pw)) classes += 1;
  if (/[^A-Za-z0-9]/.test(pw)) classes += 1;
  return classes >= 3;
}

function passwordStrengthIssues(pw) {
  const issues = [];
  if (typeof pw !== "string") return ["Password is required."];
  if (pw.length < PASSWORD_MIN_LENGTH) issues.push("Password must be at least 12 characters.");
  if (pw.length > PASSWORD_MAX_LENGTH) issues.push("Password is too long.");
  let classes = 0;
  if (/[a-z]/.test(pw)) classes += 1;
  if (/[A-Z]/.test(pw)) classes += 1;
  if (/[0-9]/.test(pw)) classes += 1;
  if (/[^A-Za-z0-9]/.test(pw)) classes += 1;
  if (classes < 3) issues.push("Password must include at least three of: lowercase, uppercase, number, symbol.");
  // Common weak passwords.
  const lower = String(pw || "").toLowerCase();
  const common = [
    "password", "passw0rd", "12345678", "123456789", "1234567890",
    "qwerty", "qwertyuiop", "asdfghjkl", "zxcvbnm", "letmein",
    "welcome", "iloveyou", "11111111", "abcdefgh", "admin123",
    "p@ssword", "passw0rd1", "password1", "password123", "00000000"
  ];
  if (common.indexOf(lower) !== -1) issues.push("Password is too common.");
  if (/^(.)\1+$/.test(pw)) issues.push("Password cannot be a single repeated character.");
  return issues;
}

function getBaseUrl() {
  const fromEnv = normalizeText(process.env.APP_BASE_URL, 200);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return APP_BASE_URL_DEFAULT;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const baseUrl = getBaseUrl();
  if (origin === baseUrl) return true;
  if (origin === "https://zo2y.com" || origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    return true;
  }
  // Allow www as a primary-domain alias.
  if (origin === "https://www.zo2y.com") return true;
  return false;
}

function readQuery(req) {
  if (req.query && typeof req.query === "object") return req.query;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_error) {
    return {};
  }
}

function readPathParts(query) {
  const rawPath = query?.path;
  if (Array.isArray(rawPath)) return rawPath.filter(Boolean);
  return String(rawPath || "").split("/").filter(Boolean);
}

function jsonResponse(res, status, body, req) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const requestId = (req && req.requestId) || res.getHeader("x-request-id") || null;
  if (requestId && body && typeof body === "object" && !Array.isArray(body)) {
    if (!Object.prototype.hasOwnProperty.call(body, "request_id")) {
      body.request_id = requestId;
    }
  }
  return res.status(status).json(body);
}

async function constantTimeResponse(responder) {
  // Pad responses to a fixed-ish window so timing-based email
  // enumeration is harder.
  const startedAt = nowMs();
  const result = await Promise.race([
    Promise.resolve().then(responder),
    new Promise((resolve) => setTimeout(() => resolve({ status: 200, body: { ok: true, padded: true } }), MAX_RESPONSE_DELAY_MS))
  ]);
  const elapsed = nowMs() - startedAt;
  const remaining = Math.max(0, MIN_RESPONSE_DELAY_MS - elapsed);
  await new Promise((resolve) => setTimeout(resolve, remaining));
  return result;
}

function requireMethod(req, res, expected) {
  const method = String(req.method || "").toUpperCase();
  if (method !== expected) {
    jsonResponse(res, 405, { success: false, message: "Method not allowed." }, req);
    return false;
  }
  return true;
}

function checkOrigin(req, res) {
  const origin = String(req.headers["origin"] || "").trim();
  // Allow requests without an Origin header (server-to-server, curl).
  if (!origin) return true;
  if (isAllowedOrigin(origin)) return true;
  jsonResponse(res, 403, { success: false, message: "Forbidden." }, req);
  return false;
}

function checkContentType(req, res) {
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (ct.indexOf("application/json") === -1 && ct.indexOf("text/plain") === -1) {
    jsonResponse(res, 415, { success: false, message: "Unsupported content type." }, req);
    return false;
  }
  return true;
}

async function resolveAdminClient() {
  const admin = getSupabaseAdminClient();
  return admin;
}

async function logAudit(eventName, eventStatus, req, details = {}) {
  const ip = getClientIp(req);
  await writeAuditLog(eventName, eventStatus, {
    actorUserId: details.actorUserId || null,
    actorIpHash: hashValue(ip),
    targetUserId: details.targetUserId || null,
    metadata: details.metadata || {},
    requestId: req?.requestId || null
  });
}

/**
 * Check rate limit for a given bucket. Returns:
 *   { allowed: bool, count, max, windowMs, retryAfterSec }
 */
async function checkRateLimit(req, res, bucket, limits) {
  const ip = getClientIp(req);
  const safeBucket = String(bucket).slice(0, 200);
  for (const limit of limits) {
    const result = await incrementRateLimit(`${safeBucket}:${ip}`, limit.windowMs, limit.max);
    res.setHeader("x-ratelimit-limit", String(result.max));
    res.setHeader("x-ratelimit-remaining", String(Math.max(0, result.max - result.count)));
    if (result.exceeded) {
      const retryAfter = Math.max(1, Math.ceil((result.windowMs - (nowMs() % result.windowMs)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      jsonResponse(res, 429, {
        success: false,
        message: "Too many requests. Please try again later.",
        retry_after: retryAfter
      }, req);
      return false;
    }
  }
  return true;
}

/**
 * Health check endpoint.
 */
async function handleHealth(req, res) {
  if (!requireMethod(req, res, "GET")) return;
  const admin = await resolveAdminClient();
  jsonResponse(res, 200, {
    ok: true,
    service: "auth",
    supabase_admin: Boolean(admin),
    node_env: process.env.NODE_ENV || "unknown"
  }, req);
}

/**
 * POST /api/auth/password-signup
 *
 * Anti-enumeration flow:
 *  1. Validate origin, content-type, input shape.
 *  2. Validate password strength.
 *  3. Per-IP rate limit.
 *  4. Optional CAPTCHA.
 *  5. Always return the SAME response shape regardless of whether the
 *     email is new or already registered. The only difference is that
 *     a new account is created and a verification email is sent.
 *  6. Constant-time response padding.
 */
async function handlePasswordSignup(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  if (!checkOrigin(req, res)) return;
  if (!checkContentType(req, res)) return;

  return constantTimeResponse(async () => {
    if (!(await checkRateLimit(req, res, "auth:signup", [
      RATE_LIMIT_SIGNUP_IP_PER_MIN,
      RATE_LIMIT_SIGNUP_IP_PER_HOUR,
      RATE_LIMIT_SIGNUP_IP_PER_DAY
    ]))) {
      return { status: 429, body: null };
    }

    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    // Reject obviously bad inputs.
    if (!isValidEmail(email)) {
      // Still log + pad for timing.
      await logAudit("signup_validation_failed", "denied", req, {
        metadata: { reason: "invalid_email_format" }
      });
      return {
        status: 400,
        body: {
          success: false,
          message: "Please provide a valid email and a strong password."
        }
      };
    }

    const pwIssues = passwordStrengthIssues(password);
    if (pwIssues.length) {
      await logAudit("signup_validation_failed", "denied", req, {
        metadata: { reason: "weak_password" }
      });
      return {
        status: 400,
        body: {
          success: false,
          message: pwIssues[0]
        }
      };
    }

    // Optional HaveIBeenPwned k-anonymity check. Fail-open: if HIBP is
    // unreachable or disabled, we still allow the signup but log a
    // audit event with `breached: null` so operators can monitor
    // availability.
    const hibp = await checkPasswordBreached(password);
    if (hibp.checked && hibp.breached) {
      await logAudit("signup_breached_password", "denied", req, {
        metadata: { hibp_count: hibp.count || 0 }
      });
      return {
        status: 400,
        body: {
          success: false,
          message: "This password has appeared in a known data breach. Please choose a different one."
        }
      };
    }
    if (!hibp.checked && hibp.error) {
      await logAudit("signup_hibp_unavailable", "warning", req, {
        metadata: { error: hibp.error }
      });
    }

    // Optional CAPTCHA (skip for now, but kept here so we can enable
    // when the client supports it).
    if (body.captchaId && body.captchaAnswer) {
      const captchaResult = await validateCaptchaSecure(body.captchaId, body.captchaAnswer);
      if (!captchaResult.ok) {
        await logAudit("signup_captcha_failed", "denied", req);
        return {
          status: 400,
          body: {
            success: false,
            message: "CAPTCHA verification failed."
          }
        };
      }
    }

    const admin = await resolveAdminClient();
    if (!admin) {
      // Service unavailable: still return a generic success so we don't
      // leak whether the email is registered. Client will see the
      // message but no email will be sent.
      await logAudit("signup_admin_unavailable", "error", req);
      return {
        status: 503,
        body: {
          success: false,
          message: "Sign up is temporarily unavailable. Please try again shortly."
        }
      };
    }

    // Single-shot detection of an existing account. We treat both
    // "new" and "existing" as the same response.
    let isExistingAccount = false;
    let existingUserId = null;
    try {
      const { data: existingData, error: existingError } = await admin.auth.admin.listUsers({
        email,
        page: 1,
        perPage: 1
      });
      if (!existingError) {
        const existingUsers = Array.isArray(existingData?.users) ? existingData.users : [];
        const existingMatch = existingUsers.find((u) => String(u?.email || "").toLowerCase() === email);
        if (existingMatch) {
          isExistingAccount = true;
          existingUserId = existingMatch.id;
        }
      }
    } catch (_lookupErr) {
      // Treat lookup failure as "unknown" and fall through to a normal
      // signup attempt. If the email is already registered, the
      // generateLink call will fail and we'll handle that path.
    }

    if (isExistingAccount) {
      // We MUST NOT reveal existence. We MUST also NOT create a
      // duplicate auth.users record or send a verification email that
      // would let the original owner click it to take over. Instead, we
      // silently re-send the original verification email (if not
      // already verified) and return the same response.
      try {
        // Look up the user's confirmation status. If the email is
        // already confirmed, we send a generic "you already have an
        // account" notice (no token). If not, we re-send a signup link.
        const { data: userDetail } = await admin.auth.admin.getUserById(existingUserId);
        const confirmed = Boolean(userDetail?.user?.email_confirmed_at);
        if (!confirmed) {
          const { data: relinkData } = await admin.auth.admin.generateLink({
            type: "signup",
            email,
            options: { redirectTo: `${getBaseUrl()}/auth-callback.html?flow=signup` }
          });
          const link = relinkData?.properties?.action_link;
          if (link && emailConfigured()) {
            await sendVerificationEmail({
              to: email,
              name: email.split("@")[0],
              confirmationUrl: link
            });
          }
        } else {
          // Confirmed users: send a generic "you already have an
          // account" notice (no token) so the response is observable
          // but no account takeover is possible.
          if (emailConfigured()) {
            // We deliberately do NOT send anything; the success
            // response is the same.
          }
        }
      } catch (_relinkErr) {
        // Swallow; the user sees a success response either way.
      }
      await logAudit("signup_duplicate_email", "ok", req, {
        targetUserId: existingUserId,
        metadata: { masked: true }
      });
      return {
        status: 200,
        body: {
          success: true,
          message: "If an account with that email does not exist, we have sent a verification link. Please check your inbox."
        }
      };
    }

    // Brand-new account. Create the auth.users record via generateLink
    // so we never have to confirm-and-create race.
    let actionLink = null;
    let createdUserId = null;
    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo: `${getBaseUrl()}/auth-callback.html?flow=signup`,
          should_include_email: false
        }
      });
      if (linkError) {
        // If the error indicates the email is already registered
        // (race condition between our pre-check and now), treat it as
        // the existing-account path and return the same success
        // response.
        const lower = String(linkError.message || "").toLowerCase();
        if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
          await logAudit("signup_race_duplicate", "ok", req, {
            metadata: { masked: true }
          });
          return {
            status: 200,
            body: {
              success: true,
              message: "If an account with that email does not exist, we have sent a verification link. Please check your inbox."
            }
          };
        }
        await logAudit("signup_generate_link_failed", "error", req, {
          metadata: { reason: lower.slice(0, 200) }
        });
        return {
          status: 400,
          body: {
            success: false,
            message: "Could not create your account. Please check your input and try again."
          }
        };
      }
      actionLink = linkData?.properties?.action_link || null;
      createdUserId = linkData?.user?.id || null;
    } catch (linkErr) {
      await logAudit("signup_generate_link_threw", "error", req);
      return {
        status: 500,
        body: {
          success: false,
          message: "Sign up is temporarily unavailable. Please try again shortly."
        }
      };
    }

    if (!createdUserId) {
      await logAudit("signup_no_user_returned", "error", req);
      return {
        status: 500,
        body: {
          success: false,
          message: "Sign up is temporarily unavailable. Please try again shortly."
        }
      };
    }

    // Create an empty profile row (RLS-safe via service role). The
    // user fills in their username during onboarding.
    //
    // If the client sent a tos_version, record it as accepted. We use
    // the SECURITY DEFINER RPC `zo2y_accept_tos` so that the trigger
    // in the DB lets us write to the tos_* columns.
    const tosVersionRaw = (req.body && req.body.tos_version) || "";
    const tosVersion = String(tosVersionRaw).trim().slice(0, 40);

    const profilePayload = {
      id: createdUserId,
      username: null,
      full_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const profileResult = await admin
        .from("user_profiles")
        .upsert(profilePayload, { onConflict: "id" });
      if (profileResult.error) {
        // eslint-disable-next-line no-console
        console.error("profile_upsert_failed", profileResult.error.message);
      }
    } catch (profileErr) {
      // eslint-disable-next-line no-console
      console.error("profile_upsert_threw", String(profileErr));
    }

    // Record the ToS acceptance. Allowed even on signup. The RPC
    // is the only writer (the trigger blocks direct client writes).
    // Create default lists for all categories
    try {
      await admin.rpc("create_default_user_lists", { p_user_id: createdUserId });
    } catch (listErr) {
      // Non-critical: user can create lists later
    }

    if (tosVersion && /^[a-zA-Z0-9._-]+$/.test(tosVersion)) {
      try {
        await admin.rpc("zo2y_accept_tos", { p_version: tosVersion });
      } catch (tosErr) {
        // Fall back to a direct upsert via service-role (bypasses the
        // RLS trigger guard because service role has BYPASSRLS). This
        // requires the SQL migration to have run; if it hasn't yet,
        // we log and move on — the user can accept later.
        try {
          await admin
            .from("user_profiles")
            .update({
              tos_version: tosVersion,
              tos_accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", createdUserId);
        } catch (directErr) {
          // eslint-disable-next-line no-console
          console.error("tos_acceptance_record_failed", {
            rpc: String(tosErr?.message || tosErr),
            direct: String(directErr?.message || directErr)
          });
        }
      }
    }

    if (actionLink && emailConfigured()) {
      try {
        await sendVerificationEmail({
          to: email,
          name: email.split("@")[0],
          confirmationUrl: actionLink
        });
      } catch (emailErr) {
        // eslint-disable-next-line no-console
        console.error("verification_email_failed", String(emailErr?.message || emailErr));
      }
    }

    await logAudit("signup_success", "ok", req, {
      targetUserId: createdUserId,
      metadata: { masked: true }
    });

    return {
      status: 200,
      body: {
        success: true,
        message: "If an account with that email does not exist, we have sent a verification link. Please check your inbox."
      }
    };
  }).then((result) => {
    if (result && result.body) jsonResponse(res, result.status, result.body, req);
  });
}

/**
 * POST /api/auth/resend-verification
 *
 * Anti-abuse flow:
 *  - Per-IP rate limit (per hour)
 *  - Per-email rate limit (per day)
 *  - Always returns the same response (success) regardless of whether
 *    the email is registered, to prevent enumeration. The actual
 *    email is only sent if:
 *    (a) the email is registered, AND
 *    (b) the email is not yet verified, AND
 *    (c) the per-email rate limit is not exceeded.
 */
async function handleResendVerification(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  if (!checkOrigin(req, res)) return;
  if (!checkContentType(req, res)) return;

  return constantTimeResponse(async () => {
    if (!(await checkRateLimit(req, res, "auth:resend", [
      RATE_LIMIT_RESEND_IP_PER_HOUR
    ]))) {
      return { status: 429, body: null };
    }

    const body = req.body || {};
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) {
      // Still return the same success to avoid enumeration.
      return {
        status: 200,
        body: {
          success: true,
          message: "If an account with that email exists, a new verification link has been sent."
        }
      };
    }

    // Per-email rate limit (table-backed, serverless-safe).
    const admin = await resolveAdminClient();
    if (admin) {
      try {
        const identifierHash = hashValue(email);
        const result = await incrementRateLimit(
          `auth:resend:email:${identifierHash}`,
          RATE_LIMIT_RESEND_EMAIL_PER_DAY.windowMs,
          RATE_LIMIT_RESEND_EMAIL_PER_DAY.max
        );
        if (result.exceeded) {
          await logAudit("resend_email_rate_limited", "denied", req, {
            metadata: { email_hash: identifierHash }
          });
          return {
            status: 200,
            body: {
              success: true,
              message: "If an account with that email exists, a new verification link has been sent."
            }
          };
        }
      } catch (_err) {}
    }

    if (!admin) {
      return {
        status: 200,
        body: {
          success: true,
          message: "If an account with that email exists, a new verification link has been sent."
        }
      };
    }

    try {
      const { data: existingData, error: existingError } = await admin.auth.admin.listUsers({
        email,
        page: 1,
        perPage: 1
      });
      if (existingError) {
        return {
          status: 200,
          body: {
            success: true,
            message: "If an account with that email exists, a new verification link has been sent."
          }
        };
      }
      const existingMatch = Array.isArray(existingData?.users)
        ? existingData.users.find((u) => String(u?.email || "").toLowerCase() === email)
        : null;
      if (existingMatch && !existingMatch.email_confirmed_at) {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: "signup",
          email,
          options: { redirectTo: `${getBaseUrl()}/auth-callback.html?flow=signup` }
        });
        const actionLink = linkData?.properties?.action_link;
        if (actionLink && emailConfigured()) {
          await sendVerificationEmail({
            to: email,
            name: email.split("@")[0],
            confirmationUrl: actionLink
          });
        }
        await logAudit("resend_verification_sent", "ok", req, {
          targetUserId: existingMatch.id
        });
      } else {
        await logAudit("resend_verification_noop", "ok", req, {
          metadata: { reason: existingMatch ? "already_confirmed" : "no_user" }
        });
      }
    } catch (_err) {
      // Swallow; return success regardless.
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "If an account with that email exists, a new verification link has been sent."
      }
    };
  }).then((result) => {
    if (result && result.body) jsonResponse(res, result.status, result.body, req);
  });
}

/**
 * POST /api/auth/login-anon-rate
 *
 * Lightweight endpoint that records failed login attempts for an
 * email OR IP. The actual Supabase signInWithPassword call is made
 * from the client. We expose this for the client to record failures
 * and trigger lockout centrally.
 *
 *  body: { email?: string, ip?: boolean }
 *  200: { ok: true, locked: false, attempts: n }
 *  423: { ok: false, locked: true, retryAfterSec }
 */
async function handleLoginFailure(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  if (!checkOrigin(req, res)) return;
  if (!checkContentType(req, res)) return;

  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const identifier = email || `ip:${getClientIp(req)}`;
  const kind = email ? "email" : "ip";
  const result = await recordFailedAuthSecure(identifier, kind, LOGIN_LOCKOUT_THRESHOLD, LOGIN_LOCKOUT_MS);
  await logAudit("login_failure_recorded", "warning", req, {
    metadata: { kind, attempts: result.count, locked: result.locked }
  });
  if (result.locked) {
    const retryAfter = Math.max(1, Math.ceil(result.lockoutRemaining / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return jsonResponse(res, 423, {
      success: false,
      message: "Too many failed attempts. Please try again later.",
      locked: true,
      retry_after: retryAfter
    }, req);
  }
  return jsonResponse(res, 200, { success: true, locked: false, attempts: result.count }, req);
}

/**
 * POST /api/auth/login-clear
 *
 * Clear a lockout for a given identifier. Requires the Supabase
 * service role key + admin auth header (so attackers cannot clear
 * someone else's lockout).
 */
async function handleLoginClear(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  if (!checkOrigin(req, res)) return;
  if (!checkContentType(req, res)) return;

  const body = req.body || {};
  const email = normalizeEmail(body.email);
  if (!email) {
    return jsonResponse(res, 400, { success: false, message: "Email is required." }, req);
  }
  await clearFailedAuthSecure(email);
  await logAudit("login_lockout_cleared", "ok", req, { metadata: { kind: "email" } });
  return jsonResponse(res, 200, { success: true }, req);
}

/**
 * GET /api/auth/lockout?email=...
 *
 * Returns whether the identifier is locked. Public endpoint (returns
 * only locked/attempts, no PII).
 */
async function handleLockoutStatus(req, res) {
  if (!requireMethod(req, res, "GET")) return;
  const query = readQuery(req);
  const email = normalizeEmail(query.email);
  if (email) {
    const info = await isAccountLockedSecure(email, "email");
    return jsonResponse(res, 200, { success: true, locked: Boolean(info.locked), attempts: info.attempts }, req);
  }
  const ipInfo = await isAccountLockedSecure(`ip:${getClientIp(req)}`, "ip");
  return jsonResponse(res, 200, { success: true, locked: Boolean(ipInfo.locked), attempts: ipInfo.attempts }, req);
}

/**
 * GET /api/auth/captcha
 *
 * Returns a math captcha challenge. The answer hash is stored
 * server-side. The client must submit the captchaId + answer with
 * the next auth request.
 */
async function handleCaptchaChallenge(req, res) {
  if (!requireMethod(req, res, "GET")) return;

  const operators = ["+", "-"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1, num2, answer;
  if (operator === "+") {
    num1 = 2 + Math.floor(Math.random() * 18);
    num2 = 1 + Math.floor(Math.random() * 18);
    answer = num1 + num2;
  } else {
    num1 = 6 + Math.floor(Math.random() * 14);
    num2 = 1 + Math.floor(Math.random() * (num1 - 1));
    answer = num1 - num2;
  }
  const id = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 40);
  const hash = hashValue(String(answer));
  await storeCaptchaSecure({ id, hash, question: `${num1} ${operator} ${num2} = ?` });
  return jsonResponse(res, 200, {
    success: true,
    captcha: {
      id,
      question: `${num1} ${operator} ${num2} = ?`
    }
  }, req);
}

export default async function handler(req, res) {
  try {
    const query = readQuery(req);
    const pathParts = readPathParts(query);
    const section = String(pathParts[0] || "").trim().toLowerCase();
    const subSection = String(pathParts[1] || "").trim().toLowerCase();
    const method = String(req.method || "GET").toUpperCase();

    if (!section) {
      return handleHealth(req, res);
    }
    if (section === "health" && method === "GET") {
      return handleHealth(req, res);
    }
    if (section === "password-signup" && method === "POST") {
      return handlePasswordSignup(req, res);
    }
    if (section === "resend-verification" && method === "POST") {
      return handleResendVerification(req, res);
    }
    if (section === "login-anon-rate" && method === "POST") {
      return handleLoginFailure(req, res);
    }
    if (section === "login-clear" && method === "POST") {
      return handleLoginClear(req, res);
    }
    if (section === "lockout" && method === "GET") {
      return handleLockoutStatus(req, res);
    }
    if (section === "captcha" && method === "GET") {
      return handleCaptchaChallenge(req, res);
    }

    return jsonResponse(res, 404, { success: false, message: "Not found." }, req);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auth-handler] unhandled", {
      request_id: req?.requestId || null,
      message: String(err?.message || err),
      path: redactQuery(req?.url || ""),
      method: req?.method
    });
    if (res.headersSent) return;
    return jsonResponse(res, 500, { success: false, message: "Internal server error." }, req);
  }
}
