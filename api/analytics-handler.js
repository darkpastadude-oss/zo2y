import express from "express";
import dotenv from "dotenv";
import analyticsRoutes from "../backend/routes/analytics.js";
import { applyApiGuardrails } from "./_guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-analytics", max: 300 });
app.use("/api/analytics", analyticsRoutes);

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

export default function handler(req, res) {
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
}

