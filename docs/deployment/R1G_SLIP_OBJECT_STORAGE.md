# R1-G Slip Image Object Storage

Status: local candidate; not deployed

Date: 2026-08-10

## Objective

Replace ephemeral and incorrectly addressed slip-image files with a bounded,
validated R2 lifecycle while preserving moderation, ownership, expiry, and
legacy-record behavior.

## Candidate changes

- Preserve authenticated Challenger-only upload and existing user/admin delete
  authorization.
- Keep multipart images in memory with a 5 MB limit, then require a matching
  JPEG/PNG/WebP signature and structurally readable dimensions.
- Store future images under the server-owned `slips/{slipUuid}.{extension}` R2
  prefix and persist only the canonical public URL.
- Delete the new object if the following database insert fails.
- Derive deletion keys only from the configured canonical public URL and owned
  `slips/` prefix; reject another origin, query, fragment, encoding, or path.
- Support deletion of existing `/uploads/slips/...` and `/objects/slips/...`
  records only through an allowlisted, traversal-safe local compatibility path.
- Change nightly expiry from bulk row deletion to per-slip object cleanup and
  row deletion. A cleanup failure preserves the row for a later retry.

## Confirmed defect repaired for future uploads

The previous route stored `/uploads/slips/...`, while the application exposes
legacy files at `/objects`. On ephemeral Railway storage those files were also
not durable. Future rows use canonical R2 URLs. This release does not claim
that historical local files still exist.

## Compatibility and exclusions

No table, column, migration, provider setting, bucket policy, secret, existing
row, or existing object is changed. The `imageUrl` response field remains an
opaque string to clients. Existing rows are not rewritten; any historical-data
reconciliation requires a separate read-only inventory and approved plan.

Object storage and PostgreSQL cannot participate in one atomic transaction.
This slice compensates a failed insert and makes deletion retryable, but a
database outage after a successful object deletion can temporarily leave a row
whose object is gone. A durable media lifecycle ledger is a future hardening
option if operational evidence warrants it.

## Validation

| Gate | Result |
|---|---|
| Focused slip/image/upload contracts | 3 files, 18 tests passed |
| Complete Vitest suite | 41 files, 245 tests passed with `--maxWorkers=1` |
| Changed storage-service TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

The repository-wide `npx tsc -b` check is not a clean baseline: it currently
reports ten unrelated frontend/type-contract errors. This is tracked under the
existing testing/CI debt finding and was not silently mixed into R1-G.

## Rollback

Revert only the R1-G application commit. Newly written R2 objects remain inert
for explicit review; do not restore ephemeral local writes as a compatibility
fix. Existing legacy paths remain untouched.

## Stop conditions

Do not promote if normal JPEG/PNG/WebP uploads fail, mismatched or malformed
bytes reach R2, a client controls an object key, a foreign URL can be deleted,
failed cleanup removes its database row, existing moderation contracts change,
or deployment identity cannot be proven.
