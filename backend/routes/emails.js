import express from "express";
import { createRateLimiter } from "../lib/guardrails.js";
import {
  emailConfigured,
  sendReminderEmail,
  sendWelcomeEmail,
} from "../lib/email/service.js";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";

const router = express.Router();
router.use(express.json({ limit: "48kb" }));
router.use(createRateLimiter({
  keyPrefix: "emails",
  windowMs: 60_000,
  max: 24
}));

function requireEmailApiKey(req, res, next) {
  const expected = String(process.env.EMAIL_API_KEY || "").trim();
  if (!expected) return next();
  const provided = String(req.get("x-email-api-key") || "").trim();
  if (!provided || provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function getBearerToken(req) {
  const authHeader = String(req.get("authorization") || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}

function resolveWelcomeName(user) {
  const metadata = user?.user_metadata || {};
  const fullName = String(
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "there"
  ).trim();
  return fullName || "there";
}

async function getAuthenticatedSupabaseUser(req) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return { error: "Missing bearer token", status: 401, admin: null, user: null };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return { error: "Supabase admin client is not configured", status: 500, admin: null, user: null };
  }

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user?.id) {
    return {
      error: error?.message || "Invalid session",
      status: 401,
      admin,
      user: null,
    };
  }

  return { error: null, status: 200, admin, user: data.user };
}

router.get("/health", (_req, res) => {
  res.json({
    configured: emailConfigured(),
    hasApiKeyProtection: Boolean(String(process.env.EMAIL_API_KEY || "").trim()),
    hasSupabaseAdmin: Boolean(getSupabaseAdminClient()),
  });
});

router.post("/welcome/trigger", async (req, res) => {
  try {
    if (!emailConfigured()) {
      return res.status(200).json({
        success: true,
        status: "skipped_unconfigured"
      });
    }

    const auth = await getAuthenticatedSupabaseUser(req);
    if (auth.error || !auth.user || !auth.admin) {
      return res.status(auth.status || 401).json({ success: false, message: auth.error || "Unauthorized" });
    }

    const appUrl = String(req.body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
    const { data: fullUserData, error: fullUserError } = await auth.admin.auth.admin.getUserById(auth.user.id);
    if (fullUserError || !fullUserData?.user) {
      return res.status(500).json({
        success: false,
        message: fullUserError?.message || "Failed to load authenticated user",
      });
    }

    const fullUser = fullUserData.user;
    const appMetadata = fullUser.app_metadata || {};
    if (appMetadata.zo2y_welcome_email_sent_at) {
      return res.status(200).json({
        success: true,
        status: "already_sent",
        sent_at: appMetadata.zo2y_welcome_email_sent_at,
      });
    }

    const to = normalizeEmail(fullUser.email);
    if (!to || !isValidEmail(to)) {
      return res.status(400).json({ success: false, message: "Authenticated user email is unavailable" });
    }

    const result = await sendWelcomeEmail({
      to,
      name: resolveWelcomeName(fullUser),
      appUrl,
    });

    const sentAt = new Date().toISOString();
    const nextAppMetadata = {
      ...appMetadata,
      zo2y_welcome_email_sent_at: sentAt,
      zo2y_welcome_email_provider: "resend",
      zo2y_welcome_email_message_id: result?.id || null,
    };

    const { error: updateError } = await auth.admin.auth.admin.updateUserById(fullUser.id, {
      app_metadata: nextAppMetadata,
    });

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: `Welcome email sent but user metadata update failed: ${updateError.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      status: "sent",
      sent_at: sentAt,
      message_id: result?.id || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to trigger welcome email",
    });
  }
});

router.post("/welcome", requireEmailApiKey, async (req, res) => {
  try {
    const to = normalizeEmail(req.body?.email);
    const name = String(req.body?.name || "").trim();
    const appUrl = String(req.body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();

    if (!to || !isValidEmail(to)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const result = await sendWelcomeEmail({ to, name, appUrl });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to send welcome email" });
  }
});

router.post("/reminder", requireEmailApiKey, async (req, res) => {
  try {
    const to = normalizeEmail(req.body?.email);
    const name = String(req.body?.name || "").trim();
    const reminderText = String(req.body?.reminderText || "").trim();
    const actionUrl = String(req.body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
    const actionLabel = String(req.body?.actionLabel || "Open Zo2y").trim();

    if (!to || !isValidEmail(to)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!reminderText) {
      return res.status(400).json({ message: "reminderText is required" });
    }

    const result = await sendReminderEmail({
      to,
      name,
      reminderText,
      actionUrl,
      actionLabel,
    });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to send reminder email" });
  }
});

router.post("/reminders/bulk", requireEmailApiKey, async (req, res) => {
  try {
    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
    const reminderText = String(req.body?.reminderText || "").trim();
    const actionUrl = String(req.body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
    const actionLabel = String(req.body?.actionLabel || "Open Zo2y").trim();

    if (!recipients.length) {
      return res.status(400).json({ message: "recipients is required" });
    }
    if (recipients.length > 100) {
      return res.status(400).json({ message: "Maximum 100 recipients per request" });
    }
    if (!reminderText) {
      return res.status(400).json({ message: "reminderText is required" });
    }

    const jobs = recipients.map(async (item) => {
      const to = normalizeEmail(item?.email);
      const name = String(item?.name || "").trim();
      if (!to || !isValidEmail(to)) {
        return { email: to, success: false, message: "Invalid email" };
      }
      try {
        const result = await sendReminderEmail({
          to,
          name,
          reminderText,
          actionUrl,
          actionLabel,
        });
        return { email: to, success: true, result };
      } catch (error) {
        return { email: to, success: false, message: error.message || "Failed" };
      }
    });

    const results = await Promise.all(jobs);
    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;
    return res.status(200).json({ success: true, sent, failed, results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to send reminders" });
  }
});

export default router;
