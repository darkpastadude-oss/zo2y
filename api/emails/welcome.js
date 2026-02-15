import { sendWelcomeEmail } from "../../backend/lib/email/service.js";
import {
  isValidEmail,
  normalizeEmail,
  readJsonBody,
  requireEmailApiKey,
  requirePost,
} from "../_email-utils.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  if (!requireEmailApiKey(req, res)) return;

  try {
    const body = readJsonBody(req);
    const to = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const appUrl = String(body.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();

    if (!to || !isValidEmail(to)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const result = await sendWelcomeEmail({ to, name, appUrl });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send welcome email",
    });
  }
}
