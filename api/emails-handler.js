import dotenv from "dotenv";
import {
  emailConfigured,
  sendReminderEmail,
  sendWelcomeEmail,
} from "../backend/lib/email/service.js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

function getHeader(req, name) {
  const key = String(name || "").toLowerCase();
  if (!key) return "";
  const headers = req?.headers || {};
  const direct = headers[key];
  if (Array.isArray(direct)) return String(direct[0] || "").trim();
  if (direct !== undefined && direct !== null) return String(direct).trim();
  if (typeof req?.get === "function") {
    return String(req.get(name) || "").trim();
  }
  return "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function normalizeText(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
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
  return String(rawPath || "")
    .split("/")
    .filter(Boolean);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
}

function requireEmailApiKey(req) {
  const expected = normalizeText(process.env.EMAIL_API_KEY, 200);
  if (!expected) return true;
  const provided = normalizeText(getHeader(req, "x-email-api-key"), 200);
  return !!provided && provided === expected;
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

function getBearerToken(req) {
  const authHeader = getHeader(req, "authorization");
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
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

function json(res, status, body, extraHeaders = {}) {
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      res.setHeader(key, value);
    }
  });
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  try {
    const query = readQuery(req);
    const pathParts = readPathParts(query);
    const section = String(pathParts[0] || "").trim().toLowerCase();
    const subSection = String(pathParts[1] || "").trim().toLowerCase();
    const method = String(req.method || "GET").toUpperCase();

    if (!section || (section === "health" && method === "GET")) {
      return json(res, 200, {
        configured: emailConfigured(),
        hasApiKeyProtection: Boolean(normalizeText(process.env.EMAIL_API_KEY, 200)),
        hasSupabaseAdmin: Boolean(getSupabaseAdminClient()),
      });
    }

    if (section === "welcome" && subSection === "trigger" && method === "POST") {
      if (!emailConfigured()) {
        return json(res, 200, {
          success: true,
          status: "skipped_unconfigured"
        });
      }

      const auth = await getAuthenticatedSupabaseUser(req);
      if (auth.error || !auth.user || !auth.admin) {
        return json(res, auth.status || 401, { success: false, message: auth.error || "Unauthorized" });
      }

      const body = await readJsonBody(req);
      const appUrl = String(body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const { data: fullUserData, error: fullUserError } = await auth.admin.auth.admin.getUserById(auth.user.id);
      if (fullUserError || !fullUserData?.user) {
        return json(res, 500, {
          success: false,
          message: fullUserError?.message || "Failed to load authenticated user",
        });
      }

      const fullUser = fullUserData.user;
      const appMetadata = fullUser.app_metadata || {};
      if (appMetadata.zo2y_welcome_email_sent_at) {
        return json(res, 200, {
          success: true,
          status: "already_sent",
          sent_at: appMetadata.zo2y_welcome_email_sent_at,
        });
      }

      const to = normalizeEmail(fullUser.email);
      if (!to || !isValidEmail(to)) {
        return json(res, 400, { success: false, message: "Authenticated user email is unavailable" });
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
        return json(res, 500, {
          success: false,
          message: `Welcome email sent but user metadata update failed: ${updateError.message}`,
        });
      }

      return json(res, 200, {
        success: true,
        status: "sent",
        sent_at: sentAt,
        message_id: result?.id || null,
      });
    }

    if (section === "welcome" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }

      const body = await readJsonBody(req);
      const to = normalizeEmail(body?.email);
      const name = normalizeText(body?.name, 120);
      const appUrl = String(body?.appUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();

      if (!to || !isValidEmail(to)) {
        return json(res, 400, { message: "Valid email is required" });
      }

      const result = await sendWelcomeEmail({ to, name, appUrl });
      return json(res, 200, { success: true, result });
    }

    if (section === "reminder" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }

      const body = await readJsonBody(req);
      const to = normalizeEmail(body?.email);
      const name = normalizeText(body?.name, 120);
      const reminderText = normalizeText(body?.reminderText, 2000);
      const actionUrl = String(body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const actionLabel = normalizeText(body?.actionLabel || "Open Zo2y", 120);

      if (!to || !isValidEmail(to)) {
        return json(res, 400, { message: "Valid email is required" });
      }
      if (!reminderText) {
        return json(res, 400, { message: "reminderText is required" });
      }

      const result = await sendReminderEmail({
        to,
        name,
        reminderText,
        actionUrl,
        actionLabel,
      });
      return json(res, 200, { success: true, result });
    }

    if (section === "reminders" && subSection === "bulk" && method === "POST") {
      if (!requireEmailApiKey(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }

      const body = await readJsonBody(req);
      const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
      const reminderText = normalizeText(body?.reminderText, 2000);
      const actionUrl = String(body?.actionUrl || process.env.APP_BASE_URL || "https://zo2y.com").trim();
      const actionLabel = normalizeText(body?.actionLabel || "Open Zo2y", 120);

      if (!recipients.length) {
        return json(res, 400, { message: "recipients is required" });
      }
      if (recipients.length > 100) {
        return json(res, 400, { message: "Maximum 100 recipients per request" });
      }
      if (!reminderText) {
        return json(res, 400, { message: "reminderText is required" });
      }

      const results = await Promise.all(recipients.map(async (item) => {
        const to = normalizeEmail(item?.email);
        const name = normalizeText(item?.name, 120);
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
          return { email: to, success: false, message: error?.message || "Failed" };
        }
      }));

      const sent = results.filter((row) => row.success).length;
      const failed = results.length - sent;
      return json(res, 200, { success: true, sent, failed, results });
    }

    return json(res, 404, { message: "Not found" });
  } catch (error) {
    return json(res, 500, {
      success: false,
      message: error?.message || "Failed to handle email request"
    });
  }
}
