# R1-M No-Placeholder Fighter Image Contract

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Stop the ingestion importer from fabricating an empty fighter image value while
preserving operator review and the current production schema.

## Delivered behavior

- Fighter proposals may enter the pending review queue without an image.
- A fighter create cannot be approved or applied until an operator supplies a
  reviewed HTTP(S) `imageUrl`.
- Null, empty, malformed, data-URI, example-domain, and obvious placeholder
  image values fail with a stable `422` policy response.
- A fighter partial update may omit `imageUrl`; the existing canonical value is
  then preserved.
- A partial update cannot explicitly replace the canonical image with a null,
  empty, invalid, or placeholder value.
- The importer no longer converts a missing image into an empty string.

## Schema boundary

This slice does not change `fighters.image_url`, migrations, or production
data. The current `NOT NULL` constraint remains authoritative for the deployed
schema. If an approved baseline later makes the column nullable, that decision
must be handled in its own schema gate.

## Validation

- Focused no-placeholder coverage: 4 tests passed.
- Complete Vitest suite: 47 files, 271 tests passed.
- Repository TypeScript: passed.
- ESLint: zero errors; 15 pre-existing Fast Refresh warnings.
- Production build: passed; 3,931 modules.
- Hosted quality gate: run `31496743135`, success.
- Railway deployment `5851460185`: successful at 2026-08-11 13:35:12 UTC.
- Production root and health: `200` / `200`.
- Webhook without service authentication: `401`.
- Admin approval/apply without user authentication: `401` / `401`.
- Unknown API route: `404`.

Verification performs no authenticated mutation and changes no production row,
database object, migration, provider setting, credential, variable, RLS policy,
or grant.

## Finding disposition

`GRID-DATA-003` is resolved. The specific fabrication path has been removed and
missing required data now remains visible as a review blocker. Broader schema
authority and nullable-field decisions remain tracked independently.

## Rollback

Revert application commit `599dca8ba7668d5b7f4351d24ad64db854ffc21c`
and redeploy its predecessor. There is no schema or data rollback.
