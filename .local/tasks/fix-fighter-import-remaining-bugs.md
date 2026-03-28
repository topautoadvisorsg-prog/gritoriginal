# Fix Remaining Fighter Import Bugs

## What & Why

The server routing fix is already in place — `registerAdminFighterRoutes` is called on the user-server (port 3001). Three bugs remain that prevent reliable import and corrupt the saved data:

1. **Empty-string `dateOfBirth` fails server validation** — `transformCsvToFighter` uses `getMappedValue(...) || ''` as the fallback. When a CSV cell is empty, this sends `''` to the server where `z.coerce.date().optional()` rejects it ("Invalid date"). The fix is to use `|| undefined` so Zod treats it as absent.

2. **`addFighters` is called without `await` in the import wizard** — the complete screen and success toast appear *before* the DB write finishes. If the write fails, the user sees "Import complete" while fighters are silently dropped. Fight history already uses `await` correctly; fighters must match.

3. **`wins`, `losses`, `draws`, `nc` integer columns stay at 0 after import** — `transformFighterToDb` sends only the `record` JSONB blob, never the top-level integer columns. Any query or ranking logic reading those columns (e.g. leaderboards, win-rate filters) will show every fighter as 0-0-0.

4. **Performance stat CSV columns are not auto-mapped** — headers like `performance_slpm`, `performance_strAcc`, `performance_sapm`, `performance_strDef`, `performance_tdAvg`, `performance_tdAcc`, `performance_tdDef`, `performance_subAvg` do not match any alias or exact system-field name. The CSV's performance data is silently discarded. Fix: add `performanceslpm`, `performancestracc`, etc. to the existing alias table.

## Done looks like

- Importing the full fighter CSV saves every row to the database; `SELECT COUNT(*) FROM fighters` returns the expected count after import
- Refreshing the page after import still shows all imported fighters
- The `wins`, `losses`, `draws`, `nc` integer columns in PostgreSQL match the values from the CSV
- The performance JSONB field is populated with strike accuracy, takedown averages, etc. from the CSV
- The import wizard's "complete" screen only appears after the database write is confirmed; if the write fails, an error toast is shown instead

## Out of scope

- Fixing the same `|| ''` pattern for other optional string fields (they fall through to defaults rather than failing validation)
- Resolving the `height` / `reach` inches dual-column issue
- Migrating to a single-server architecture

## Tasks

1. **Fix empty-string `dateOfBirth` fallback** — Change `getMappedValue(row, mappings, 'date_of_birth') || ''` to `|| undefined` in `transformCsvToFighter` so empty CSV cells are treated as absent rather than an invalid date string.

2. **Await `addFighters` in the import wizard** — Add `await` to both `addFighters` calls in `handleConfirmImport` and wrap them in a `try/catch` that shows an error toast on failure, matching the pattern already used for fight-history imports.

3. **Populate integer record columns in `transformFighterToDb`** — Add explicit `wins`, `losses`, `draws`, `nc` fields sourced from `fighter.record` so those DB columns receive the correct CSV values instead of defaulting to 0.

4. **Add `performance_xxx` aliases to the auto-mapper** — Extend the alias table so `performance_slpm → strikes_landed_per_min`, `performance_strAcc → strike_accuracy`, `performance_sapm → strikes_absorbed_per_min`, `performance_strDef → strike_defense`, `performance_tdAvg → takedown_avg`, `performance_tdAcc → takedown_accuracy`, `performance_tdDef → takedown_defense`, `performance_subAvg → submission_avg`.

## Relevant files

- `src/shared/utils/fighterTransform.ts:144`
- `src/admin/components/import/ImportPage.tsx:119-205`
- `src/shared/context/FighterDataContext.tsx:66-107`
- `src/admin/components/import/autoMapper.ts:21-39`
