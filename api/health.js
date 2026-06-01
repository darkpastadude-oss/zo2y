export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return res.status(200).json({
    ok: true,
    service: "zo2y-api",
    now: new Date().toISOString()
  });
}


