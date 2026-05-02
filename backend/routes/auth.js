import express from "express";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";
import { createRateLimiter } from "../lib/guardrails.js";

const router = express.Router();

router.use(express.json({ limit: "48kb" }));

// Stricter rate limiting for auth routes: 5 attempts per 15 minutes
router.use(createRateLimiter({
  keyPrefix: "auth",
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5
}));

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFullName(value) {
  return String(value || "").trim().slice(0, 80);
}

function normalizeUsername(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return normalized.length >= 3 ? normalized : "";
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function isValidUsername(value) {
  return /^[a-z0-9_]{3,30}$/.test(String(value || ""));
}

function shouldStripProfileColumn(error, columnName) {
  return String(error?.message || "").toLowerCase().includes(String(columnName || "").toLowerCase());
}

function mapSupabaseSignupError(error) {
  const message = String(error?.message || "").trim() || "Signup failed";
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return { status: 409, message: "This email is already registered. Please log in instead." };
  }
  if (normalized.includes("invalid api key")) {
    return { status: 503, message: "Signup is temporarily unavailable because the server auth key is invalid." };
  }
  if (normalized.includes("password") || normalized.includes("email")) {
    return { status: 400, message };
  }
  return { status: Number(error?.status || 500) || 500, message };
}

router.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "zo2y-auth",
    supabase_admin: Boolean(getSupabaseAdminClient())
  });
});

router.post("/password-signup", async (req, res) => {
  try {
    const fullName = normalizeFullName(req.body?.fullName);
    const username = normalizeUsername(req.body?.username);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const onboardingCompletedAt = new Date().toISOString();

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters and use only letters, numbers, or underscores."
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: "Signup service is not configured."
      });
    }

    const existingUsername = await admin
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .limit(1);
    if (existingUsername.error) {
      return res.status(500).json({
        success: false,
        message: existingUsername.error.message || "Could not verify username availability."
      });
    }
    if (Array.isArray(existingUsername.data) && existingUsername.data.length > 0) {
      return res.status(409).json({
        success: false,
        message: "That username is already taken."
      });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        name: fullName,
        username,
        zo2y_username: username,
        onboarding_completed_at: onboardingCompletedAt,
        zo2y_onboarded_at: onboardingCompletedAt
      }
    });

    if (error || !data?.user?.id) {
      const mapped = mapSupabaseSignupError(error);
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message
      });
    }

    const profilePayload = {
      id: data.user.id,
      user_id: data.user.id,
      username,
      full_name: fullName,
      onboarding_completed_at: onboardingCompletedAt,
      created_at: onboardingCompletedAt,
      updated_at: onboardingCompletedAt
    };

    let profileWrite = await admin
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileWrite.error && (shouldStripProfileColumn(profileWrite.error, "user_id") || shouldStripProfileColumn(profileWrite.error, "onboarding_completed_at"))) {
      const fallbackPayload = { ...profilePayload };
      if (shouldStripProfileColumn(profileWrite.error, "user_id")) delete fallbackPayload.user_id;
      if (shouldStripProfileColumn(profileWrite.error, "onboarding_completed_at")) delete fallbackPayload.onboarding_completed_at;
      profileWrite = await admin
        .from("user_profiles")
        .upsert(fallbackPayload, { onConflict: "id" });
    }

    if (profileWrite.error) {
      return res.status(500).json({
        success: false,
        message: profileWrite.error.message || "Account was created, but the profile could not be saved."
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName,
        username
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Signup failed"
    });
  }
});

export default router;
