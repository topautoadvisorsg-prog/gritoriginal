# R1-E Avatar Confirmation

Status: local candidate; not deployed

Date: 2026-08-10

## Objective

Make the authenticated avatar flow validate the actual R2 object before
persisting its URL. This slice does not change the database schema, R2 policy,
event images, slips, or fighter images.

## Candidate changes

- Require a positive integer size no greater than 2 MB and an allowlisted
  JPEG/PNG/WebP content type before signing the upload.
- Accept confirmation only for `/objects/users/{authenticatedUserId}/avatar`.
- Read the corresponding R2 key with both declared-length and streaming byte
  limits.
- Reject unsupported file signatures before any database write.
- Persist the server-derived canonical R2 public URL, never a client-supplied
  path.
- Return 404 if the authenticated local user disappears before confirmation.

## Safety boundary

The candidate writes only the existing authenticated user's existing
`avatarUrl` column after validation. It adds no table, column, migration,
provider setting, bucket policy, secret, grant, or production data operation.

## Validation

| Gate | Result |
|---|---|
| Focused avatar/upload contracts | 3 files, 13 tests passed |
| Complete Vitest suite | 39 files, 233 tests passed with `--maxWorkers=1` |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

## Remaining scope

- Failed or abandoned R2 objects need an expiry/cleanup policy.
- Content-type receipt/checksum and scan-state persistence need a future upload
  state model if the platform requires stronger media provenance.
- Event and slip local-disk storage remain separate migrations.
- Existing avatar rows containing `/objects/users/...` are not rewritten by
  this application slice; a separately reviewed data audit is required first.

## Rollback

Revert only the R1-E application commit. Do not restore arbitrary confirmation
paths or client-controlled database URLs as a compatibility workaround.

## Stop conditions

Do not promote if a normal JPEG/PNG/WebP avatar flow breaks, another user's key
can be confirmed, an object over 2 MB is fully buffered, unsupported bytes reach
the database, or the deployment cannot be tied to the reviewed commit.
