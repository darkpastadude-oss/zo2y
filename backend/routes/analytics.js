import express from "express";
import { createRateLimiter, getClientIp, hashValue } from "../lib/guardrails.js";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";

const router = express.Router();

const MAX_EVENT_NAME = 80;
const MAX_SESSION_ID = 120;
const MAX_CLIENT_ID = 120;
const MAX_URL_LENGTH = 400;
const MAX_UA_LENGTH = 280;
const MAX_ERROR_MESSAGE = 1000;
const MAX_EVENTS_PER_BATCH = 40;
const EVENT_NAME_RE = /^[a-z0-9][a-z0-9_.:-]{1,79}$/i;

router.use(express.json({ limit: "96kb" }));
router.use(createRateLimiter({
  keyPrefix: "analytics",
  windowMs: 60_000,
  max: 180
}));

function normalizeText(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEventName(value) {
  const event = normalizeText(value, MAX_EVENT_NAME).toLowerCase();
  if (!event || !EVENT_NAME_RE.test(event)) return "";
  return event;
}

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function toJson(value, maxLength = 32_000) {
  try {
    const text = JSON.stringify(value ?? {});
    if (!text) return {};
    if (text.length <= maxLength) return JSON.parse(text);
    return JSON.parse(text.slice(0, maxLength));
  } catch (_err) {
    return {};
  }
}

function parseUuid(value) {
  const text = normalizeText(value, 100).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)) {
    return null;
  }
  return text;
}

function mapEventRow(req, payload) {
  const context = asObject(payload.context);
  const userAgent = normalizeText(context.user_agent || req.get("user-agent"), MAX_UA_LENGTH);
  const pageUrl = normalizeText(context.page_url || context.url || req.get("origin"), MAX_URL_LENGTH);
  const referrer = normalizeText(context.referrer || req.get("referer"), MAX_URL_LENGTH);
  const sessionId = normalizeText(payload.session_id || context.session_id, MAX_SESSION_ID);
  const clientId = normalizeText(payload.client_id || context.client_id, MAX_CLIENT_ID);
  const userId = parseUuid(payload.user_id || context.user_id);
  const ipHash = hashValue(getClientIp(req));

  return {
    event_name: normalizeEventName(payload.event),
    event_properties: toJson(asObject(payload.properties), 32_000),
    page_url: pageUrl || null,
    referrer: referrer || null,
    user_agent: userAgent || null,
    session_id: sessionId || null,
    client_id: clientId || null,
    user_id: userId,
    ip_hash: ipHash || null,
    source: "web",
    created_at: new Date().toISOString()
  };
}

async function insertEvents(rows) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return {
      ok: true,
      inserted: 0,
      storage: "disabled"
    };
  }

  try {
    const { error } = await client.from("analytics_events").insert(rows);
    if (error) {
      throw error;
    }
    return {
      ok: true,
      inserted: rows.length,
      storage: "supabase"
    };
  } catch (error) {
    // Analytics should never break user flows. Accept and drop on storage failure.
    console.warn("[analytics] dropping events due to storage error:", String(error?.message || error));
    return {
      ok: true,
      inserted: 0,
      storage: "dropped"
    };
  }
}

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "analytics",
    storage: getSupabaseAdminClient() ? "supabase" : "disabled"
  });
});

router.post("/track", async (req, res) => {
  try {
    const row = mapEventRow(req, asObject(req.body));
    if (!row.event_name) {
      return res.status(400).json({ message: "Invalid event name" });
    }

    const result = await insertEvents([row]);
    return res.status(202).json(result);
  } catch (error) {
    console.warn("[analytics] track handler failed:", String(error?.message || error));
    return res.status(202).json({
      ok: true,
      inserted: 0,
      storage: "dropped"
    });
  }
});

router.post("/batch", async (req, res) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    if (!events.length) {
      return res.status(400).json({ message: "events is required" });
    }
    if (events.length > MAX_EVENTS_PER_BATCH) {
      return res.status(400).json({ message: `Max ${MAX_EVENTS_PER_BATCH} events per batch` });
    }

    const rows = events
      .map((event) => mapEventRow(req, asObject(event)))
      .filter((row) => !!row.event_name);

    if (!rows.length) {
      return res.status(400).json({ message: "No valid events in batch" });
    }

    const result = await insertEvents(rows);
    return res.status(202).json(result);
  } catch (error) {
    console.warn("[analytics] batch handler failed:", String(error?.message || error));
    return res.status(202).json({
      ok: true,
      inserted: 0,
      storage: "dropped"
    });
  }
});

router.post("/error", async (req, res) => {
  try {
    const body = asObject(req.body);
    const row = mapEventRow(req, {
      event: "frontend_error",
      session_id: body.session_id,
      client_id: body.client_id,
      user_id: body.user_id,
      context: body.context,
      properties: {
        type: normalizeText(body.type, 80) || "error",
        message: normalizeText(body.message, MAX_ERROR_MESSAGE),
        stack: normalizeText(body.stack, 2500)
      }
    });
    if (!row.event_name) {
      return res.status(400).json({ message: "Invalid error payload" });
    }

    const result = await insertEvents([row]);
    return res.status(202).json(result);
  } catch (error) {
    console.warn("[analytics] error handler failed:", String(error?.message || error));
    return res.status(202).json({
      ok: true,
      inserted: 0,
      storage: "dropped"
    });
  }
});

export default router;

