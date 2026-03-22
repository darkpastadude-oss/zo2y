import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "backend/.env" });

function bool(value) {
  return Boolean(String(value || "").trim());
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return res.status(200).json({
    ok: true,
    service: "zo2y-api",
    now: new Date().toISOString(),
    config: {
      supabase_admin: bool(process.env.SUPABASE_URL) && bool(process.env.SUPABASE_SERVICE_ROLE_KEY),
      spotify: bool(process.env.SPOTIFY_CLIENT_ID) && bool(process.env.SPOTIFY_CLIENT_SECRET),
      igdb: bool(process.env.TWITCH_CLIENT_ID) && bool(process.env.TWITCH_CLIENT_SECRET),
      tmdb: bool(process.env.TMDB_TOKEN),
      books: bool(process.env.GOOGLE_BOOKS_KEY),
      resend: bool(process.env.RESEND_API_KEY)
    }
  });
}

