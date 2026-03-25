import dotenv from "dotenv";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFullName(value) {
  return String(value || "").trim().slice(0, 80);
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

function mapSupabaseSignupError(error) {
  const message = String(error?.message || "").trim() || "Signup failed";
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return { status: 409, message: "This email is already registered. Please log in instead." };
  }
  if (normalized.includes("password")) {
    return { status: 400, message };
  }
  if (normalized.includes("email")) {
    return { status: 400, message };
  }
  return { status: Number(error?.status || 500) || 500, message };
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
    const method = String(req.method || "GET").toUpperCase();

    if (!section || (section === "health" && method === "GET")) {
      return json(res, 200, {
        ok: true,
        service: "auth",
        hasSupabaseAdmin: Boolean(getSupabaseAdminClient())
      });
    }

    if (section === "password-signup" && method === "POST") {
      const body = await readJsonBody(req);
      const fullName = normalizeFullName(body?.fullName);
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || "");

      if (!fullName || fullName.length < 2) {
        return json(res, 400, { success: false, message: "Full name is required." });
      }
      if (!isValidEmail(email)) {
        return json(res, 400, { success: false, message: "Please provide a valid email address." });
      }
      if (password.length < 8) {
        return json(res, 400, { success: false, message: "Password must be at least 8 characters." });
      }

      const admin = getSupabaseAdminClient();
      if (!admin) {
        return json(res, 500, {
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
        return json(res, mapped.status, {
          success: false,
          message: mapped.message
        });
      }

      return json(res, 201, {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName
        }
      });
    }

    return json(res, 404, { message: "Not found" });
  } catch (error) {
    return json(res, 500, {
      success: false,
      message: normalizeText(error?.message || "Auth handler failed", 300)
    });
  }
}
