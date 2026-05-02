import crypto from "crypto";

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
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "connect-src 'self' https://gfkhjbztayjyojsgdpgk.supabase.co https://api.supabase.com https://image.tmdb.org https://covers.openlibrary.org https://books.googleusercontent.com https://i.scdn.co https://images.igdb.com https://flagcdn.com https://commons.wikimedia.org https://restcountries.com https://www.thesportsdb.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
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
    const msg = `[${level}] ${req.method} ${req.originalUrl || req.url} ${status} ${elapsed}ms ip=${ip} req_id=${req.requestId || "-"}`;
    // eslint-disable-next-line no-console
    console.log(msg);
  });

  next();
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
    path: req.originalUrl || req.url
  });
}

export function jsonErrorHandler(error, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[ERROR] request failed", {
    request_id: req.requestId || null,
    method: req.method,
    path: req.originalUrl || req.url,
    message: String(error?.message || error)
  });

  if (res.headersSent) return;
  res.status(500).json({
    message: "Internal server error",
    request_id: req.requestId || null
  });
}

