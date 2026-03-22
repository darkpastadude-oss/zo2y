import express from "express";
import dotenv from "dotenv";
import emailRoutes from "../backend/routes/emails.js";
import { applyApiGuardrails } from "../backend/lib/api-guardrails.js";

dotenv.config();
dotenv.config({ path: "backend/.env" });

const app = express();
applyApiGuardrails(app, { keyPrefix: "api-emails", max: 80 });
app.use("/api/emails", emailRoutes);

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
  const parsedUrl = new URL(req.url || "/", "http://localhost");
  const query = req.query || Object.fromEntries(parsedUrl.searchParams.entries());
  const pathFromHandlerUrl = parsedUrl.pathname.startsWith("/api/emails-handler")
    ? parsedUrl.pathname.slice("/api/emails-handler".length)
    : "";
  const pathFromEmailsUrl = parsedUrl.pathname.startsWith("/api/emails")
    ? parsedUrl.pathname.slice("/api/emails".length)
    : "";
  const rawPath = query.path || pathFromHandlerUrl || pathFromEmailsUrl;
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
  req.url = `/api/emails${suffix}${search ? `?${search}` : ""}`;

  return app(req, res);
}
