import { emailConfigured } from "../../backend/lib/email/service.js";
import { requireEmailApiKey, requireGet } from "../_email-utils.js";

export default function handler(req, res) {
  if (!requireGet(req, res)) return;
  if (!requireEmailApiKey(req, res)) return;

  res.status(200).json({
    configured: emailConfigured(),
    hasApiKeyProtection: Boolean(String(process.env.EMAIL_API_KEY || "").trim()),
  });
}
