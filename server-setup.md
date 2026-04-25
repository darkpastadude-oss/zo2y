SPAs Routing and Auth Persistence Guidance

- Goals
  - Sessions persist across page refresh and browser restarts
  - Onboarding shows only once per user
  - Direct URL access (e.g. /dashboard) works on refresh

- SPA Auth Persistence (Supabase/JWT)
  - If using Supabase: ensure persistSession is enabled and session restoration runs at startup
  - Supabase integration pattern in this codebase:
    - In auth-gate.js, persistSession is forced to true for reliability across reloads
    - On startup, auth.waitForSupabase(...) followed by getActiveSession(client, { restore: true, refreshIfNeeded: true }) is used to restore sessions
    - onAuthStateChange updates the persisted session and keeps it in the storage bridges
  - If using JWT/custom auth: store token securely in localStorage or cookies and rehydrate on app init

- Onboarding Persistence
  - Do not rely on in-memory flags. Persist onboarding via:
    - A user profile flag (e.g. onboarding_completed_at) or
    - A localStorage flag (e.g. onboarded=true) tied to user identity
  - In this repo, onboarding_completed_at is stored in user_metadata via Supabase user record on completion
  - Additionally, to prevent cross-device confusion, also set localStorage.onboarded = true on completion
  - On app load, check onboarding_completed_at (server) or onboarded flag (local) before showing onboarding

- SPA Routing / Index.html Refresh
  - Ensure the server routes all paths to index.html so the SPA can handle client-side routing
- If using Vite + React Router, enable history API fallback (development and production environments)
- Nginx: add try_files $uri /index.html;
- Cloudflare Pages: use root-level Functions or `_routes.json`/middleware as needed so unknown app routes still resolve to the built app entry.
- For other hosts, configure a catch-all route to serve /index.html so SPA routing works on refresh.

- Direct URL Access Example Mappings
  - /dashboard -> index.html (client handles route)
  - /settings   -> index.html (client handles route)

- Quick Implementation Checklist (in this repo)
  1. Auth persistence: enforced in code (see patches to js/auth-gate.js)
  2. Onboarding persistence: skip onboarding if onboarding_completed_at exists or onboarded flag is set
  3. SPA routing: provide server config guidance for Cloudflare Pages and other static hosts
  4. Test: refresh, direct URL navigation, and new tab reopen should preserve session and onboarding state

- Notes
  - This guide helps ensure production-like behavior for SPA routing and authentication, reducing risk of memory loss across refreshes.
