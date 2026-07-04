## Goal
Fix Books and Music list saving so adding/removing items from lists produces zero network or runtime errors (no 409, no 503).

## Constraints
- No refactoring Books, Music, APIs, search, or homepage rails.
- No ignoring errors, wrapping in try/catch, retrying endlessly, removing constraints, or allowing duplicate rows.

## Done
- Identified root cause: all save paths used `insert()` → 409 on duplicate-key conflicts against `NULLS NOT DISTINCT` unique indexes → 409 swallowed but network error still fired.
- `book.html` `toggleList()`: `insert()` → `upsert({ onConflict: 'user_id,book_id,list_type,list_id', ignoreDuplicates: true })`, removed 409 swallowing.
- `music.html` `toggleDefaultList()`: `insert()` → `upsert({ onConflict: 'user_id,track_id,list_type,list_id', ignoreDuplicates: true })`, removed 409 swallowing.
- `index-list-menu-adapter.js` fallback path: `insert()` → `upsert({ onConflict: …, ignoreDuplicates: true })`, removed conflict-swallowing.
- `song.html` (2 locations): `insert()` → `upsert({ onConflict: …, ignoreDuplicates: true })`, removed check-if-exists guard + 409 swallowing.
- `list-utils.js` `addItemToList()`: `insert()` → `upsert({ onConflict: …, ignoreDuplicates: true })`, removed check-if-exists guard + 409 swallowing. `saveCustomListChanges` already used upsert.
- `books.js`: Added `bookListStatusMap` + `loadBookListStatus()` + `getQuickStatusForItem` bridge function so initial menu state shows correct saved/unsaved status on the books listing page.

## Not Yet Fixed / Remaining
- The 503 "Offline" error cause is still undetermined — upsert doesn't change request volume; it may be a real Supabase transient (rate-limiting / network). Frontend has no offline-mode logic.
- Other media types (movies, TV, anime, games, brands) still use `insert()` with 23505-swallowing in their own files — not in scope for this fix.
- The `isConflictError()` function in `list-utils.js` is retained as a safety net in `saveCustomListChanges`.

## Key Changes Summary
| File | What Changed |
|---|---|
| `book.html` | `insert()` → `upsert()` in `toggleList()` |
| `music.html` | `insert()` → `upsert()` in `toggleDefaultList()` |
| `js/index-list-menu-adapter.js` | `insert()` → `upsert()` in fallback path |
| `song.html` | `insert()` → `upsert()` in two list toggle functions |
| `js/list-utils.js` | `insert()` → `upsert()` in `addItemToList()` |
| `js/pages/books.js` | Added `bookListStatusMap`, `loadBookListStatus()`, `getQuickStatusForItem` |
