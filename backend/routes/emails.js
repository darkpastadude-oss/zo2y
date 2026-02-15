import express from "express";
import {
  emailConfigured,
  sendReminderEmail,
  sendWelcomeEmail,
} from "../lib/email/service.js";

const router = express.Router();

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

router.get("/health", requireEmailApiKey, (req, res) => {
  res.json({
    configured: emailConfigured(),
    hasApiKeyProtection: Boolean(String(process.env.EMAIL_API_KEY || "").trim()),
  });
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
