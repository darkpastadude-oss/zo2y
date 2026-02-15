import { sendReminderEmail } from "../../backend/lib/email/service.js";
import {
  isValidEmail,
  normalizeEmail,
  readJsonBody,
  requireEmailApiKey,
  requireEmailRateLimit,
  requirePost,
} from "../_email-utils.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  if (!requireEmailApiKey(req, res)) return;
  if (!requireEmailRateLimit(req, res, { pathKey: "emails:reminder", maxRequests: 5, windowMs: 60_000 })) return;

  try {
    const body = readJsonBody(req);
    const to = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const reminderText = String(body.reminderText || "").trim();
    const actionUrl = String(body.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
    const actionLabel = String(body.actionLabel || "Open Zo2y").trim();

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
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send reminder email",
    });
  }
}
