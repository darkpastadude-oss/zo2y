## Goal
Fix Books and Music list saving so adding/removing items from lists produces zero network or runtime errors.

## Constraints
- No refactoring Books, Music, APIs, search, or homepage rails.
- No ignoring errors, wrapping in try/catch, retrying endlessly, removing constraints, or allowing duplicate rows.

## Phase 1 — Fix 409 (duplicate key conflicts) — DONE
**Root cause**: All save paths used `insert()` against `NULLS NOT DISTINCT` unique indexes. Duplicate clicks caused 409 Conflict. The 409 was swallowed in JS but the network error still fired.

**Fix**: `insert()` → `upsert({ onConflict: …, ignoreDuplicates: true })` in all 5 save paths.

| File | What changed |
|---|---|
| `book.html` `toggleList()` | `insert()` → `upsert()` |
| `music.html` `toggleDefaultList()` | `insert()` → `upsert()` |
| `js/index-list-menu-adapter.js` fallback | `insert()` → `upsert()` |
| `song.html` (2 locations) | `insert()` → `upsert()` |
| `js/list-utils.js` `addItemToList()` | `insert()` → `upsert()` + removed check-if-exists guard |

## Phase 2 — Fix FK 23503 (missing parent record) — DONE
**Root cause**: The adapter fallback path and `addItemToList` upsert into `book_list_items` / `music_list_items` WITHOUT first ensuring the parent record exists in `books` / `tracks`. The FK constraints are:
- `book_list_items.book_id` → `books(id)` (NOT NULL, not deferrable)
- `music_list_items.track_id` → `tracks(id)` (NOT NULL, not deferrable)

**Scenario**: Bridge path fails (auth/client issue → parent record not created) → adapter falls through to fallback → fallback upserts items table → FK 23503.

**Fix**: Added minimal `tracks`/`books` upsert before the items upsert in all 3 write paths:

| File | What changed |
|---|---|
| `js/index-list-menu-adapter.js` line 222 | Before fallback items upsert, upserts minimal track/book record using `item.title`, `item.subtitle`, `item.image` from the bridge's card data |
| `js/list-utils.js` `addItemToList()` | Always ensures parent record (previously only when `itemPayload` provided). If no `itemPayload`, upserts minimal record with `normalizedItemId` |
| `js/list-utils.js` `saveCustomListChanges()` | Same fix: always ensures parent record, not just when `itemPayload` provided |

## Phase 3 — "No API key found" — UNRESOLVED
**Observation**: Some requests reach Supabase without the `apikey` header.

**Static analysis**: All `createClient()` calls pass `SUPABASE_KEY`. The `apikey` header is set by postgrest-js internally. No raw `fetch()` is used for items-table writes (except `syncBookRecordViaApi` which is a fallback that sends `x-zo2y-supabase-key` as a custom header, not `apikey`).

**Hypothesis**: Race condition in the adapter's `ensureClient()` (index-list-menu-adapter.js:163). The adapter may reject the bridge's client if `__zo2yAuthListenersBound` is not set and `__ZO2Y_ENSURE_SUPABASE_CLIENT` is available. The adapter then creates its own client via `ensureSharedSupabaseClient` which uses `attachClientListeners`. If this shared-client creation path fails or returns null, `ensureClient()` falls through to `ZO2Y_AUTH.ensureClient()` which might return a different object that does not set the `apikey` header.

**Cannot fix from static analysis alone** — needs runtime debugging with network tab open.

## Remaining
- **503 "Offline"**: Not yet investigated. Possibly real Supabase transient.
- **song.html redundant SELECT guard**: Unnecessary `SELECT maybeSingle()` before upsert (lines 861-868, 973-980). Harmless but adds one extra DB query per save.
- **books.js stale cache**: `loadBookListStatus()` only runs on initial load. After search/pagination, adapter falls through to direct Supabase query. Performance issue, not correctness.
- **Other media types** (movies, TV, games): Same `insert()` + 23505-swallowing pattern. Not in scope.
