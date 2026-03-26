import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

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
  }

  return res.status(404).json({ message: "Not found" });
}
