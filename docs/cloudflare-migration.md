# Cloudflare Migration

## Pages Project

- Framework preset: `None`
- Build command: `node scripts/build-cloudflare-pages.mjs`
- Build output directory: `dist`
- Root directory: repository root

## Wrangler Commands

```bash
npm install
npm install -g wrangler
wrangler login
wrangler pages project create zo2y
wrangler pages secret put SUPABASE_URL --project-name zo2y
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name zo2y
wrangler pages secret put TMDB_TOKEN --project-name zo2y
wrangler pages secret put GOOGLE_BOOKS_KEY --project-name zo2y
wrangler pages secret put RESEND_API_KEY --project-name zo2y
wrangler pages secret put EMAIL_FROM --project-name zo2y
wrangler pages secret put EMAIL_REPLY_TO --project-name zo2y
wrangler pages secret put EMAIL_API_KEY --project-name zo2y
wrangler pages secret put SUPPORT_ADMIN_API_KEY --project-name zo2y
wrangler pages secret put SPORTSDB_API_KEY --project-name zo2y
wrangler pages secret put TWITCH_CLIENT_ID --project-name zo2y
wrangler pages secret put TWITCH_CLIENT_SECRET --project-name zo2y
wrangler pages secret put SPOTIFY_CLIENT_ID --project-name zo2y
wrangler pages secret put SPOTIFY_CLIENT_SECRET --project-name zo2y
wrangler pages dev dist
wrangler pages deploy dist --project-name zo2y
```

## Notes

- `/api/*` now runs through Cloudflare Pages Functions in `functions/api/[[path]].js`.
- Static assets are staged into `dist/` so backend source files are not published.
- Vercel header rules were translated into `_headers`.
