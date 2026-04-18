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

  const supabaseUrlSet = bool(process.env.SUPABASE_URL);
  const supabaseServiceRoleSet = bool(process.env.SUPABASE_SERVICE_ROLE_KEY) || bool(process.env.SUPABASE_SERVICE_KEY);

  return res.status(200).json({
    ok: true,
    service: "zo2y-api",
    now: new Date().toISOString(),
    config: {
      supabase_admin: supabaseUrlSet && supabaseServiceRoleSet,
      supabase_url_set: supabaseUrlSet,
      supabase_service_role_set: supabaseServiceRoleSet,
      spotify: bool(process.env.SPOTIFY_CLIENT_ID) && bool(process.env.SPOTIFY_CLIENT_SECRET),
      igdb: bool(process.env.TWITCH_CLIENT_ID) && bool(process.env.TWITCH_CLIENT_SECRET),
      tmdb: bool(process.env.TMDB_TOKEN) || bool(process.env.TMDB_API_KEY) || bool(process.env.TMDB_ACCESS_TOKEN) || bool(process.env.TMDB_BEARER_TOKEN) || bool(process.env.TMDB_API_READ_TOKEN),
      books: bool(process.env.GOOGLE_BOOKS_KEY),
      resend: bool(process.env.RESEND_API_KEY)
    }
  });
}


