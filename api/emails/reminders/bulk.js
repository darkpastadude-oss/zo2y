import { sendReminderEmail } from "../../../backend/lib/email/service.js";
import {
  isValidEmail,
  normalizeEmail,
  readJsonBody,
  requireEmailApiKey,
  requirePost,
} from "../../_email-utils.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  if (!requireEmailApiKey(req, res)) return;

  try {
    const body = readJsonBody(req);
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    const reminderText = String(body.reminderText || "").trim();
    const actionUrl = String(body.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
    const actionLabel = String(body.actionLabel || "Open Zo2y").trim();

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
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send reminders",
    });
  }
}
