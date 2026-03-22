import express from "express";
import dotenv from "dotenv";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-analytics", max: 300 });

function pushQueryParam(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry === undefined || entry === null) return;
      params.append(key, String(entry));
    });
    return;
  }
  params.append(key, String(value));
}

function acceptedDroppedPayload(extra = {}) {
  return {
    ok: true,
    inserted: 0,
    storage: "dropped",
    ...extra
  };
}

app.get("/api/analytics", (_req, res) => {
  return res.json({
    ok: true,
    service: "analytics",
    storage: "dropped"
  });
});

app.get("/api/analytics/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "analytics",
    storage: "dropped"
  });
});

app.post("/api/analytics/track", (_req, res) => {
  return res.status(202).json(acceptedDroppedPayload());
});

app.post("/api/analytics/error", (_req, res) => {
  return res.status(202).json(acceptedDroppedPayload());
});

app.post("/api/analytics/batch", (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  return res.status(202).json(acceptedDroppedPayload({
    dropped_count: events.length
  }));
});

app.use("/api/analytics/*", (_req, res) => {
  return res.status(404).json({ message: "Not found" });
});

app.use((error, _req, res, _next) => {
  console.error("[analytics-handler] unexpected error:", String(error?.message || error));
  if (res.headersSent) return;
  return res.status(202).json(acceptedDroppedPayload());
});

export default function handler(req, res) {
  try {
    const query = req.query || {};
    const rawPath = query.path;
    const pathParts = Array.isArray(rawPath)
      ? rawPath
      : String(rawPath || "")
        .split("/")
        .filter(Boolean);

    const nextParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key === "path") return;
      pushQueryParam(nextParams, key, value);
    });

    const suffix = pathParts.length ? `/${pathParts.join("/")}` : "";
    const search = nextParams.toString();
    req.url = `/api/analytics${suffix}${search ? `?${search}` : ""}`;
    return app(req, res);
  } catch (error) {
    console.error("[analytics-handler] invocation fallback:", String(error?.message || error));
    if (res.headersSent) return;
    return res.status(202).json(acceptedDroppedPayload());
  }
}
