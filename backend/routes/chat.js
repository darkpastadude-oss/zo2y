import express from "express";
import { createRateLimiter } from "../lib/guardrails.js";
import { getSupabaseAdminClient } from "../lib/supabase-admin.js";

const router = express.Router();

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
const MAX_MESSAGE_LENGTH = 500;
const MAX_CANDIDATES = 60;
const MAX_RECOMMENDATIONS = 8;

router.use(express.json({ limit: "128kb" }));
router.use(createRateLimiter({
  keyPrefix: "chat",
  windowMs: 60_000,
  max: 60
}));

function normalizeText(value, maxLen = 240) {
  return String(value || "").trim().slice(0, maxLen);
}

function parseUuid(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)) {
    return null;
  }
  return text;
}

function normalizeMediaType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "movie" || raw === "tv" || raw === "game" || raw === "book" || raw === "music") return raw;
  return "mixed";
}

function sanitizeCandidates(rows = []) {
  const out = [];
  for (const row of (Array.isArray(rows) ? rows : [])) {
    if (out.length >= MAX_CANDIDATES) break;
    const media_type = normalizeMediaType(row?.media_type || row?.mediaType);
    const item_id = normalizeText(row?.item_id || row?.itemId, 120);
    const title = normalizeText(row?.title, 180);
    const subtitle = normalizeText(row?.subtitle, 180);
    const image = normalizeText(row?.image, 400);
    const href = normalizeText(row?.href, 400);
    if (!title) continue;
    out.push({ media_type, item_id, title, subtitle, image, href });
  }
  return out;
}

async function loadUserSignals(userId) {
  const client = getSupabaseAdminClient();
  if (!client || !userId) return { liked: [], follows_count: 0 };

  const tableMap = [
    { table: "movie_list_items", field: "movie_id", media: "movie" },
    { table: "tv_list_items", field: "tv_id", media: "tv" },
    { table: "game_list_items", field: "game_id", media: "game" },
    { table: "book_list_items", field: "book_id", media: "book" },
    { table: "music_list_items", field: "track_id", media: "music" }
  ];

  const liked = [];
  await Promise.all(tableMap.map(async (cfg) => {
    try {
      const { data } = await client
        .from(cfg.table)
        .select(`${cfg.field}, list_type`)
        .eq("user_id", userId)
        .in("list_type", ["favorites", "watched", "read", "listened", "played"])
        .limit(24);
      (data || []).forEach((row) => {
        const id = String(row?.[cfg.field] || "").trim();
        if (!id) return;
        liked.push({ media_type: cfg.media, item_id: id, list_type: String(row?.list_type || "") });
      });
    } catch (_err) {}
  }));

  let follows_count = 0;
  try {
    const { count } = await client
      .from("follows")
      .select("*", { head: true, count: "exact" })
      .eq("follower_id", userId);
    follows_count = Number(count || 0);
  } catch (_err) {}

  return { liked: liked.slice(0, 80), follows_count };
}

function extractJson(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (_err) {
    return null;
  }
}

function extractOutputText(responseJson) {
  const direct = String(responseJson?.output_text || "").trim();
  if (direct) return direct;
  const chunks = [];
  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
  output.forEach((entry) => {
    const content = Array.isArray(entry?.content) ? entry.content : [];
    content.forEach((part) => {
      const text = String(part?.text || part?.output_text || "").trim();
      if (text) chunks.push(text);
    });
  });
  return chunks.join("\n").trim();
}

async function requestOpenAI({ message, mediaType, candidates, signals }) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.statusCode = 503;
    throw error;
  }

  const prompt = [
    "You are a recommendation assistant for an entertainment app.",
    "Return STRICT JSON only with this shape:",
    "{\"reply\":\"string\",\"recommendations\":[{\"media_type\":\"movie|tv|game|book|music\",\"item_id\":\"string\",\"title\":\"string\",\"reason\":\"string\"}]}",
    `User intent media type hint: ${mediaType}`,
    `User message: ${message}`,
    `Candidates: ${JSON.stringify(candidates)}`,
    `User signals: ${JSON.stringify(signals)}.`,
    "Rules:",
    "1) Pick only from candidates by exact title+media_type match.",
    "2) Provide 4 to 8 recommendations max.",
    "3) Keep reasons concise and specific."
  ].join("\n");

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      temperature: 0.4,
      max_output_tokens: 700
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    const error = new Error(`OpenAI request failed (${res.status}): ${detail}`);
    error.statusCode = 502;
    throw error;
  }

  const json = await res.json();
  const text = extractOutputText(json);
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") {
    const error = new Error("Model response could not be parsed.");
    error.statusCode = 502;
    throw error;
  }
  return parsed;
}

function fallbackRecommendations(message, mediaType, candidates) {
  const lc = String(message || "").toLowerCase();
  const energetic = /hype|fast|action|adrenaline|party|workout/.test(lc);
  const calm = /calm|chill|relax|cozy|soft|quiet/.test(lc);

  const pool = mediaType === "mixed"
    ? [...candidates]
    : candidates.filter((item) => item.media_type === mediaType);

  const picks = pool.slice(0, MAX_RECOMMENDATIONS).map((item) => ({
    media_type: item.media_type,
    item_id: item.item_id,
    title: item.title,
    reason: energetic
      ? "High momentum pick."
      : (calm ? "A more relaxed option." : "Strong fit for your request.")
  }));

  const reply = picks.length
    ? "Here are recommendations picked from the live feed."
    : "I could not find enough live candidates right now.";

  return { reply, recommendations: picks };
}

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "chat",
    model: OPENAI_MODEL,
    configured: !!String(process.env.OPENAI_API_KEY || "").trim()
  });
});

router.post("/recommend", async (req, res) => {
  try {
    const message = normalizeText(req.body?.message, MAX_MESSAGE_LENGTH);
    if (!message) return res.status(400).json({ message: "message is required" });

    const mediaType = normalizeMediaType(req.body?.media_type || req.body?.mediaType || "mixed");
    const candidates = sanitizeCandidates(req.body?.candidates);
    if (!candidates.length) {
      return res.status(400).json({ message: "candidates are required" });
    }

    const userId = parseUuid(req.body?.user_id || req.body?.userId);
    const signals = await loadUserSignals(userId);

    let result;
    try {
      result = await requestOpenAI({ message, mediaType, candidates, signals });
    } catch (modelErr) {
      const msg = String(modelErr?.message || "");
      const statusCode = Number(modelErr?.statusCode || 0);
      const hardFail =
        statusCode === 503 ||
        /OPENAI_API_KEY/i.test(msg) ||
        /not configured/i.test(msg) ||
        /invalid api key/i.test(msg) ||
        /incorrect api key/i.test(msg);
      if (hardFail) throw modelErr;
      result = fallbackRecommendations(message, mediaType, candidates);
    }

    const recs = Array.isArray(result?.recommendations) ? result.recommendations : [];
    const normalized = recs
      .map((row) => ({
        media_type: normalizeMediaType(row?.media_type),
        item_id: normalizeText(row?.item_id, 120),
        title: normalizeText(row?.title, 180),
        reason: normalizeText(row?.reason, 200)
      }))
      .filter((row) => row.title)
      .slice(0, MAX_RECOMMENDATIONS);

    const byKey = new Map(candidates.map((c) => [`${c.media_type}:${c.title.toLowerCase()}`, c]));
    const hydrated = normalized.map((row) => {
      const key = `${row.media_type}:${row.title.toLowerCase()}`;
      const source = byKey.get(key);
      return {
        ...row,
        item_id: row.item_id || String(source?.item_id || ""),
        href: String(source?.href || ""),
        image: String(source?.image || "")
      };
    });

    return res.json({
      reply: normalizeText(result?.reply, 500) || "Here are some recommendations.",
      recommendations: hydrated
    });
  } catch (error) {
    const status = Number(error?.statusCode || 500);
    return res.status(status).json({
      message: status >= 500 ? "Chat recommendation failed" : String(error?.message || "Invalid request")
    });
  }
});

export default router;
