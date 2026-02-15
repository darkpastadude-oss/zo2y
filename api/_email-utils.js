import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

export function requirePost(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireGet(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireEmailApiKey(req, res) {
  const expected = String(process.env.EMAIL_API_KEY || "").trim();
  if (!expected) return true;
  const provided = String(req.headers?.["x-email-api-key"] || "").trim();
  if (!provided || provided !== expected) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return {};
}
