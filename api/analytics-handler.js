import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

function acceptedDroppedPayload(extra = {}) {
  return {
    ok: true,
    inserted: 0,
    storage: "dropped",
    ...extra
  };
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
  if (!chunks.length) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

export default async function handler(req, res) {
  const query = readQuery(req);
  const pathParts = readPathParts(query);
  const section = String(pathParts[0] || "").trim().toLowerCase();
  const method = String(req.method || "GET").toUpperCase();

  if (!section) {
    return res.json({ ok: true, service: "analytics", storage: "dropped" });
  }

  if (section === "health") {
    return res.json({ ok: true, service: "analytics", storage: "dropped" });
  }

  if (section === "track" && method === "POST") {
    return res.status(202).json(acceptedDroppedPayload());
  }

  if (section === "error" && method === "POST") {
    return res.status(202).json(acceptedDroppedPayload());
  }

  if (section === "batch" && method === "POST") {
    const body = await readJsonBody(req);
    const events = Array.isArray(body?.events) ? body.events : [];
    return res.status(202).json(acceptedDroppedPayload({
      dropped_count: events.length
    }));
  }

  return res.status(404).json({ message: "Not found" });
}
