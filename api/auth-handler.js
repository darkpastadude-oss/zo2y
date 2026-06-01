import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";
import { sendVerificationEmail, emailConfigured } from "../backend/lib/email/service.js";

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

function profileUpsertNeedsFallback(error, columnName) {
  const msg = String(error?.message || "").toLowerCase();
  if (!msg) return false;
  if (columnName && msg.includes(String(columnName).toLowerCase())) return true;
  return msg.includes("column") && msg.includes("does not exist");
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
  if (normalized.includes("password")) return { status: 400, message };
  if (normalized.includes("email")) return { status: 400, message };
  return { status: Number(error?.status || 500) || 500, message };
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

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const method = String(req.method || "GET").toUpperCase();

  if (!section || (section === "health" && method === "GET")) {
    return res.status(200).json({
      ok: true,
      service: "auth",
      supabase_admin: Boolean(getSupabaseAdminClient())
    });
  }

  if (section === "password-signup" && method === "POST") {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");

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

      const baseUrl = String(process.env.APP_BASE_URL || "https://zo2y.com").replace(/\/+$/, "");
      const redirectTo = `${baseUrl}/auth-callback.html?flow=signup`;

      const { data, error } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo,
          should_include_email: false,
          data: { needs_username: true }
        }
      });

      if (error || !data?.user?.id) {
        const mapped = mapSupabaseSignupError(error);
        return res.status(mapped.status).json({
          success: false,
          message: mapped.message
        });
      }

      // Create empty profile - username will be set later via popup
      const profilePayload = {
        id: data.user.id,
        user_id: data.user.id,
        username: null,
        full_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let profileWrite = await admin
        .from("user_profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileWrite.error && (shouldStripProfileColumn(profileWrite.error, "user_id"))) {
        const fallbackPayload = { ...profilePayload };
        if (shouldStripProfileColumn(profileWrite.error, "user_id")) delete fallbackPayload.user_id;
        profileWrite = await admin
          .from("user_profiles")
          .upsert(fallbackPayload, { onConflict: "id" });
      }

      if (profileWrite.error && profileUpsertNeedsFallback(profileWrite.error, "id")) {
        const fallbackPayload = { ...profilePayload };
        if (profileUpsertNeedsFallback(profileWrite.error, "id")) delete fallbackPayload.id;
        profileWrite = await admin
          .from("user_profiles")
          .upsert(fallbackPayload, { onConflict: "user_id" });
      }

      if (profileWrite.error) {
        console.error("Profile write failed:", profileWrite.error.message);
        return res.status(500).json({
          success: false,
          message: "Account was created, but the profile could not be saved."
        });
      }

      // Send verification email via Resend
      if (emailConfigured()) {
        const confirmationUrl = data?.properties?.action_link || "";
        if (confirmationUrl) {
          try {
            await sendVerificationEmail({
              to: email,
              name: email.split("@")[0],
              confirmationUrl
            });
          } catch (emailError) {
            console.error("Failed to send verification email:", emailError?.message || emailError);
          }
        }
      }

      return res.status(201).json({
        success: true,
        verification_sent: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          needs_username: true
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Signup failed"
      });
    }
  }

  if (section === "resend-verification" && method === "POST") {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
      }

      const admin = getSupabaseAdminClient();
      if (!admin) {
        return res.status(500).json({ success: false, message: "Verification service is not configured." });
      }

      const baseUrl = String(process.env.APP_BASE_URL || "https://zo2y.com").replace(/\/+$/, "");
      const redirectTo = `${baseUrl}/auth-callback.html?flow=signup`;

      const { data, error } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        options: {
          redirectTo,
          should_include_email: false
        }
      });

      if (error) {
        console.error("Verification link generation failed:", error.message);
        return res.status(500).json({ success: false, message: "Could not generate verification link." });
      }

      if (emailConfigured()) {
        const confirmationUrl = data?.properties?.action_link || "";
        if (confirmationUrl) {
          await sendVerificationEmail({
            to: email,
            name: email.split("@")[0],
            confirmationUrl
          });
        }
      }

      return res.status(200).json({ success: true, message: "Verification email sent." });
    } catch (error) {
      return res.status(500).json({ success: false, message: error?.message || "Could not resend verification." });
    }
  }

  return res.status(404).json({ message: "Not found" });
}
