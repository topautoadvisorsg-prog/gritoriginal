---
title: Sync Schema Null Placeholder Support
---
# Sync Schema Null Placeholder Support

## What & Why
The data engine has established a rule: every field in a fight push is mandatory, and missing data uses standard placeholders (`"unknown"` for strings, `null` for numeric/date fields). Two fields in the current Zod validation schema will reject their payloads with a 422 error even though the placeholders are semantically valid.

## Done looks like
- A fight history webhook push with `"eventDate": null` returns HTTP 201 and queues to the pipeline (previously 422).
- A fight history webhook push with `"result": "Unknown"` returns HTTP 201 (previously 422 due to enum mismatch).
- All other existing fight, fighter, event, news, and odds validations are unchanged.

## Out of scope
- Changing how `applyFightData` handles the `"Unknown"` result value in the DB — the DB column is `varchar`, so it stores whatever string comes through.
- Any UI changes for displaying "Unknown" results.

## Tasks

1. **Fix `eventDate` null handling** — Change `eventDate` in `syncFightHistorySchema` from `z.string().datetime().optional()` to `.nullish()` (accepts both `null` and `undefined`). Do the same for any other date fields in the fight schema that may receive `null`.

2. **Add `"Unknown"` to result enum** — Extend the `result` enum in `syncFightHistorySchema` from `['Win', 'Loss', 'Draw', 'NC']` to `['Win', 'Loss', 'Draw', 'NC', 'Unknown']` so pre-result pushes pass validation cleanly.

## Relevant files
- `shared/sync-schemas.ts:64-91`