# Zo2y Product Contract

Deterministic rules for Zo2y core behavior. Every rule has an ID so code,
tests, and QA can reference it. A feature is **not done** until its rules pass
the "no refresh required" + "refresh still correct" checks.

Architecture direction: `Supabase → Services → Canonical State → Components`.
Components never become mini-backends.

---

## 1. Authentication

| ID  | Rule |
|-----|------|
| A1  | No protected page initializes its data layer before `Auth.ready()` resolves. |
| A2  | `Auth.ready()` guarantees a usable session object (`id` available) OR a clean signed-out state. It must not resolve to a half-restored session. |
| A3  | A valid persisted session is never discarded because of a temporary network failure. |
| A4  | Login produces one canonical user state usable by every page immediately. |
| A5  | Logout clears all user-specific runtime state (canonical state, caches, subscriptions). |
| A6  | Refresh preserves authenticated state. |
| A7  | There is exactly one shared Supabase client per page load (no page re-creates its own). |

## 2. Canonical User State

| ID  | Rule |
|-----|------|
| C1  | `UserStore` is the only runtime authority for `id, username, avatarUrl, bannerUrl`. |
| C2  | Database → `UserStore` → UI. No component reads a private copy of user data. |
| C3  | Every `UserStore.set(...)` notifies subscribers via the event bus. |
| C4  | UI never renders a stale copy: after any mutation, the visible value equals `UserStore` value. |

## 3. Profile

| ID  | Rule |
|-----|------|
| P1  | `ProfileService` is the only authority for profile mutations (avatar, banner, username, save). |
| P2  | A profile mutation updates DB **and** `UserStore` in one operation, then emits `profile:updated`. |
| P3  | Username, avatar, and banner always come from canonical profile state. |
| P4  | Changing the avatar updates the avatar everywhere AND refreshes the banner (banner source chain is deterministic, not "hopefully notices"). |
| P5  | Opening the profile loads profile data completely on the first attempt (no second-click / refresh magic). |
| P6  | Every profile network operation has LOADING / SUCCESS / ERROR (and EMPTY where applicable) states — never an indefinite blank. |

## 4. Lists

| ID  | Rule |
|-----|------|
| L1  | Add to list: item appears immediately in UI **and** persists in DB. |
| L2  | Remove from list: item disappears immediately **and** persists in DB. |
| L3  | Toggle/click performs exactly one action — duplicates are impossible (operation lock). |
| L4  | List mutations never produce a network or runtime error (409/23503-class errors are impossible). |
| L5  | No refresh required to see a list result; after refresh the result must still exist. |

## 5. UI

| ID  | Rule |
|-----|------|
| U1  | Every button has exactly one handler, and the whole hit area is clickable. |
| U2  | Every async action is protected against duplicate execution (single-execution lock). |
| U3  | Every async action has LOADING / SUCCESS / ERROR states. |
| U4  | No feature depends on timing luck or requires a refresh. |
| U5  | Navigation does not lose state; coming back shows the same data as leaving. |

## 6. Data Flow

| ID  | Rule |
|-----|------|
| D1  | Data flows one direction: `Supabase → Services → Canonical State → Components`. |
| D2  | The event bus (`AppEvents`) is the only runtime signal for cross-component updates. |
| D3  | Realtime subscriptions refresh canonical state from DB; they are not a second runtime source of truth. |
| D4  | There is exactly one source of truth per field (no localStorage copies that can go stale). |
| D5  | Reload returns the same state from DB as was last persisted. |
| D6  | `user_metadata` / JWT claims never carry large payloads (base64 avatars). The JWT must stay well under the proxy header-size limit (~32KB); GoTrue embeds `user_metadata` in every token, so an avatar data-URI breaks EVERY authenticated request with `400 Bad Request`. Verified: 18KB avatar in metadata → 50KB JWT → all REST 400; clearing metadata → 1.5KB JWT → 200. |

---

## Acceptance ("boring consistency") QA

For each feature, run the fixed sequence:

```
ACTION
  → UI immediately correct
  → database correct
  → refresh
  → UI still correct
```

Fail any step → the feature is not finished.

### Test matrix
- auth: login / refresh / logout / login again / session survive temporary network loss
- profile: load-first-attempt, avatar, banner, username, navigate away+back, refresh, change avatar → banner updates
- lists: add / remove / double-click / refresh-persist
- search, movies, tv, anime, books, games, music, community, settings
- devices: desktop, iPhone Safari, iPhone Chrome, Android

## Status

| Area | Current status |
|------|----------------|
| AUTH (A1–A7) | Partially satisfied (bootstrap-auth restores session; page-level gates vary) |
| STATE (C1–C4) | In progress — `UserStore` being introduced |
| PROFILE (P1–P6) | In progress |
| LISTS (L1–L5) | Mostly satisfied (upsert + parent-record ensure); duplicate-click lock pending |
| UI (U1–U5) | In progress |
| DATA (D1–D5) | In progress |
| DATA (D6 JWT bloat) | **FIXED** in profile.js `saveAvatar` (base64 never written to `user_metadata`; only `user_profiles`). Ran `scripts/clear-oversized-avatar-metadata.mjs`: cleaned 6 real accounts (incl. zo2yhq) whose JWTs had balloon-past-32KB. |
