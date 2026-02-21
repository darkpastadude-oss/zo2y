import express from "express";
import {
  attachRequestContext,
  applySecurityHeaders,
  createRateLimiter,
  requestLogger
} from "../backend/lib/guardrails.js";

export function applyApiGuardrails(app, options = {}) {
  const keyPrefix = String(options.keyPrefix || "vercel-api");
  const windowMs = Number(options.windowMs || process.env.API_RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Number(options.max || process.env.API_RATE_LIMIT_MAX || 180);

  app.disable("x-powered-by");
  app.use(attachRequestContext);
  app.use(applySecurityHeaders);
  app.use(requestLogger);
  app.use(express.json({ limit: "96kb" }));
  app.use(createRateLimiter({
    keyPrefix,
    windowMs,
    max,
    skip: (req) => req.method === "OPTIONS"
  }));
}

