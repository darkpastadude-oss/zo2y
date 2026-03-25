import dotenv from "dotenv";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";
import { getClientIp, hashValue } from "../backend/lib/guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const SUPPORT_STATUSES = new Set(["open", "triaged", "in_progress", "resolved", "closed", "spam"]);
const SUPPORT_CATEGORIES = new Set(["bug", "billing", "account", "feature", "abuse", "other"]);

function normalizeText(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEmail(value) {
  return normalizeText(value, 180).toLowerCase();
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function normalizeFullName(value) {
  return normalizeText(value, 80);
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

function parseUuid(value) {
  const text = normalizeText(value, 100).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)) {
    return null;
  }
  return text;
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

function getHeader(req, name) {
  const key = String(name || "").toLowerCase();
  const headers = req?.headers || {};
  const direct = headers[key];
  if (Array.isArray(direct)) return String(direct[0] || "").trim();
  if (direct !== undefined && direct !== null) return String(direct).trim();
  if (typeof req?.get === "function") return String(req.get(name) || "").trim();
  return "";
}

function supportStorage() {
  return getSupabaseAdminClient();
}

function supportAdminAuthed(req) {
  const expected = normalizeText(process.env.SUPPORT_ADMIN_API_KEY, 200);
  if (!expected) return false;
  const provided = normalizeText(getHeader(req, "x-support-api-key"), 200);
  return !!provided && provided === expected;
}

function inferPriority(category) {
  if (category === "abuse") return "high";
  if (category === "billing") return "medium";
  if (category === "bug") return "medium";
  return "low";
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
    const maybeId = String(pathParts[1] || "").trim();
    const method = String(req.method || "GET").toUpperCase();

    if (section === "auth" && maybeId === "password-signup" && method === "POST") {
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

    if (section === "auth" && maybeId === "health" && method === "GET") {
      return json(res, 200, {
        ok: true,
        service: "auth",
        storage: getSupabaseAdminClient() ? "supabase" : "disabled"
      });
    }

    if (!section || (section === "health" && method === "GET")) {
      return json(res, 200, {
        ok: true,
        service: "support",
        storage: supportStorage() ? "supabase" : "disabled",
        admin_api_key_configured: Boolean(normalizeText(process.env.SUPPORT_ADMIN_API_KEY, 200))
      });
    }

    if (section === "tickets" && method === "POST") {
      const body = await readJsonBody(req);
      const honeypot = normalizeText(body.website, 120);
      if (honeypot) {
        return json(res, 202, { ok: true });
      }

      const name = normalizeText(body.name, 120);
      const email = normalizeEmail(body.email);
      const categoryRaw = normalizeText(body.category, 50).toLowerCase();
      const category = SUPPORT_CATEGORIES.has(categoryRaw) ? categoryRaw : "other";
      const message = normalizeText(body.message, 4000);
      const pageUrl = normalizeText(body.page_url || body.pageUrl, 400);
      const userAgent = normalizeText(getHeader(req, "user-agent"), 280);
      const userId = parseUuid(body.user_id || body.userId);
      const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

      if (!message || message.length < 12) {
        return json(res, 400, { message: "Please provide more detail (min 12 chars)." });
      }
      if (email && !isValidEmail(email)) {
        return json(res, 400, { message: "Please provide a valid email address." });
      }

      const client = supportStorage();
      if (!client) {
        return json(res, 503, { message: "Support storage is not configured." });
      }

      const row = {
        name: name || null,
        email: email || null,
        category,
        message,
        status: "open",
        priority: inferPriority(category),
        page_url: pageUrl || null,
        user_agent: userAgent || null,
        user_id: userId,
        ip_hash: hashValue(getClientIp(req)) || null,
        metadata,
        source: "web"
      };

      const { data, error } = await client
        .from("support_tickets")
        .insert(row)
        .select("id,status,priority,created_at")
        .single();
      if (error) throw error;

      return json(res, 201, { ok: true, ticket: data });
    }

    if (section === "tickets" && method === "GET" && !maybeId) {
      if (!supportAdminAuthed(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }

      const client = supportStorage();
      if (!client) {
        return json(res, 503, { message: "Support storage is not configured." });
      }

      const limit = Math.max(1, Math.min(200, Number(query.limit || 40)));
      const statusRaw = normalizeText(query.status, 40).toLowerCase();

      let supabaseQuery = client
        .from("support_tickets")
        .select("id,name,email,category,message,status,priority,page_url,user_id,source,created_at,updated_at,admin_note")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (statusRaw && SUPPORT_STATUSES.has(statusRaw)) {
        supabaseQuery = supabaseQuery.eq("status", statusRaw);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;
      return json(res, 200, { ok: true, tickets: data || [] });
    }

    if (section === "tickets" && method === "PATCH" && maybeId) {
      if (!supportAdminAuthed(req)) {
        return json(res, 401, { message: "Unauthorized" });
      }

      const client = supportStorage();
      if (!client) {
        return json(res, 503, { message: "Support storage is not configured." });
      }

      const id = Number(maybeId);
      if (!Number.isFinite(id) || id <= 0) {
        return json(res, 400, { message: "Invalid ticket id." });
      }

      const body = await readJsonBody(req);
      const status = normalizeText(body.status, 40).toLowerCase();
      const adminNote = normalizeText(body.admin_note || body.adminNote, 1200);

      const update = {};
      if (status && SUPPORT_STATUSES.has(status)) update.status = status;
      if (adminNote) update.admin_note = adminNote;
      if (!Object.keys(update).length) {
        return json(res, 400, { message: "No supported fields to update." });
      }

      const { data, error } = await client
        .from("support_tickets")
        .update(update)
        .eq("id", id)
        .select("id,status,priority,updated_at,admin_note")
        .single();
      if (error) throw error;

      return json(res, 200, { ok: true, ticket: data });
    }

    return json(res, 404, { message: "Not found" });
  } catch (error) {
    return json(res, 500, {
      message: "Could not handle support request",
      error: String(error?.message || error)
    });
  }
}
