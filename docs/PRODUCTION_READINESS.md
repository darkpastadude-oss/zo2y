# Zo2y Production Readiness Checklist

This checklist is the go/no-go gate before paid acquisition campaigns.

## 1) Reliability Guardrails
- [ ] `/api/health`, `/api/analytics/health`, `/api/support/health` return 200 in production.
- [ ] Request IDs and HTTP logs are enabled (`LOG_HTTP=true`).
- [ ] API rate limiting is configured (`API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`).
- [ ] Frontend runtime captures unhandled errors and submits to `/api/analytics/error`.
- [ ] Rollback plan exists:
  - previous deployment alias is kept,
  - DB migrations are forward-only and idempotent,
  - emergency feature kill is possible via env vars.

## 2) Performance SLOs
- [ ] Median mobile LCP under 2.5s.
- [ ] P75 CLS under 0.10.
- [ ] P75 INP under 200ms (or best available proxy while collecting INP).
- [ ] Core feed paints in one pass (no blocking user-auth personalization path).
- [ ] `web_vital_*` events are visible in analytics storage.

## 3) Security / Auth / Data Integrity
- [ ] All collaborative-list policies are deployed from `sql/collaborative_lists.sql`.
- [ ] `zo2y_custom_list_owner_matches` is active to prevent owner spoofing.
- [ ] Service keys are server-only (`SUPABASE_SERVICE_ROLE_KEY` never exposed in frontend).
- [ ] Admin support endpoints require `x-support-api-key`.

## 4) Abuse Protection
- [ ] Global API rate limiting active (server + serverless handlers).
- [ ] Support form has honeypot and message validation.
- [ ] Auth signup/login are rate limited and input validated.
- [ ] Email endpoints remain protected with `EMAIL_API_KEY`.

## 5) Funnel Analytics
- [ ] `page_view`, `session_start`, `signup_submit`, `login_submit`, and support events are tracked.
- [ ] Consent banner is shown before non-essential analytics.
- [ ] Analytics storage table exists (`analytics_events`).

## 6) Automated QA
- [ ] CI syntax checks pass.
- [ ] `npm run smoke` passes against staging/prod URL.
- [ ] Manual smoke done: signup, login, add item to list, create collaborative list, support ticket submit.

## 7) Legal / Compliance
- [ ] `privacy.html` published and reachable.
- [ ] `terms.html` published and reachable.
- [ ] Consent behavior verified for analytics.

## 8) Support + Moderation
- [ ] `support.html` live and writing tickets.
- [ ] Admin triage flow tested: GET/PATCH support tickets with API key.
- [ ] SLA defined for first response (for example 24-48h).

## Environment Variables (minimum)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPPORT_ADMIN_API_KEY`
- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`
- `LOG_HTTP`
- Existing provider keys (IGDB/TMDB/Books/Spotify/Resend)

## Runbook Commands
- Local backend start: `npm run dev`
- Smoke checks: `npm run smoke`
- Deploy SQL:
  - `sql/production_readiness_core.sql`
  - `sql/collaborative_lists.sql` (updated hardening)

