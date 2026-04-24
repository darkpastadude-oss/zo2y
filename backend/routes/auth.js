import express from "express";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";
import { createRateLimiter } from "../lib/guardrails.js";

const router = express.Router();

router.use(express.json({ limit: "48kb" }));
router.use(createRateLimiter({
  keyPrefix: "auth",
  windowMs: 60_000,
  max: 30
}));

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFullName(value) {
  return String(value || "").trim().slice(0, 80);
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
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
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, message: "Full name is required." });
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

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        name: fullName
      }
    });

    if (error || !data?.user?.id) {
      const mapped = mapSupabaseSignupError(error);
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName
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
