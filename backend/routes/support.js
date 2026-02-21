import express from "express";
import { createRateLimiter, getClientIp, hashValue } from "../lib/guardrails.js";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";

const router = express.Router();
router.use(express.json({ limit: "96kb" }));
router.use(createRateLimiter({
  keyPrefix: "support",
  windowMs: 60_000,
  max: 40
}));

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

function parseUuid(value) {
  const text = normalizeText(value, 100).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)) {
    return null;
  }
  return text;
}

function supportAdminAuthed(req) {
  const expected = normalizeText(process.env.SUPPORT_ADMIN_API_KEY, 200);
  if (!expected) return false;
  const provided = normalizeText(req.get("x-support-api-key"), 200);
  return provided && provided === expected;
}

function requireSupportAdmin(req, res, next) {
  if (!supportAdminAuthed(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

function inferPriority(category) {
  if (category === "abuse") return "high";
  if (category === "billing") return "medium";
  if (category === "bug") return "medium";
  return "low";
}

function supportStorage() {
  return getSupabaseAdminClient();
}

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "support",
    storage: supportStorage() ? "supabase" : "disabled",
    admin_api_key_configured: Boolean(normalizeText(process.env.SUPPORT_ADMIN_API_KEY, 200))
  });
});

router.post("/tickets", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const honeypot = normalizeText(body.website, 120);
    if (honeypot) {
      return res.status(202).json({ ok: true });
    }

    const name = normalizeText(body.name, 120);
    const email = normalizeEmail(body.email);
    const categoryRaw = normalizeText(body.category, 50).toLowerCase();
    const category = SUPPORT_CATEGORIES.has(categoryRaw) ? categoryRaw : "other";
    const message = normalizeText(body.message, 4000);
    const pageUrl = normalizeText(body.page_url || body.pageUrl, 400);
    const userAgent = normalizeText(req.get("user-agent"), 280);
    const userId = parseUuid(body.user_id || body.userId);
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

    if (!message || message.length < 12) {
      return res.status(400).json({ message: "Please provide more detail (min 12 chars)." });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const client = supportStorage();
    if (!client) {
      return res.status(503).json({ message: "Support storage is not configured." });
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

    return res.status(201).json({
      ok: true,
      ticket: data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not submit support ticket",
      error: String(error?.message || error)
    });
  }
});

router.get("/tickets", requireSupportAdmin, async (req, res) => {
  try {
    const client = supportStorage();
    if (!client) {
      return res.status(503).json({ message: "Support storage is not configured." });
    }

    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 40)));
    const statusRaw = normalizeText(req.query.status, 40).toLowerCase();

    let query = client
      .from("support_tickets")
      .select("id,name,email,category,message,status,priority,page_url,user_id,source,created_at,updated_at,admin_note")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusRaw && SUPPORT_STATUSES.has(statusRaw)) {
      query = query.eq("status", statusRaw);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ ok: true, tickets: data || [] });
  } catch (error) {
    return res.status(500).json({
      message: "Could not load support tickets",
      error: String(error?.message || error)
    });
  }
});

router.patch("/tickets/:id", requireSupportAdmin, async (req, res) => {
  try {
    const client = supportStorage();
    if (!client) {
      return res.status(503).json({ message: "Support storage is not configured." });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid ticket id." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const status = normalizeText(body.status, 40).toLowerCase();
    const adminNote = normalizeText(body.admin_note || body.adminNote, 1200);

    const update = {};
    if (status && SUPPORT_STATUSES.has(status)) update.status = status;
    if (adminNote) update.admin_note = adminNote;
    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "No supported fields to update." });
    }

    const { data, error } = await client
      .from("support_tickets")
      .update(update)
      .eq("id", id)
      .select("id,status,priority,updated_at,admin_note")
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, ticket: data });
  } catch (error) {
    return res.status(500).json({
      message: "Could not update support ticket",
      error: String(error?.message || error)
    });
  }
});

export default router;

