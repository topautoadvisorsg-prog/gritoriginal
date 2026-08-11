# R1-E Avatar Confirmation

Status: deployed and production-verified

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

## Production promotion

| Evidence | Identity / result |
|---|---|
| Reviewed commit | `c0a741ef00b5feb720c8f06be5458aa91272c3d3` |
| Railway deployment | `7d19679b-3ea0-400c-98e6-73ce2316c57d` |
| GitHub deployment status | Success, 2026-08-11 05:35:14 UTC |
| `GET /api/health` | `200` JSON |
| Avatar presign without authentication | `401` JSON |
| Avatar confirmation without authentication | `401` JSON |
| Fighter presign without authentication | `401` JSON |
| Retired wildcard upload | `404` JSON |
| Unknown API path | `404` JSON |
| Oversized ordinary JSON | `413` JSON |
| R1-B header contract | Preserved |

The production probes used no application credential and therefore created no
upload URL, object, user update, or database row. Owned-key, byte, signature,
and canonical-URL behavior is established by reviewed source and contract tests.

## Stop conditions

Do not promote if a normal JPEG/PNG/WebP avatar flow breaks, another user's key
can be confirmed, an object over 2 MB is fully buffered, unsupported bytes reach
the database, or the deployment cannot be tied to the reviewed commit.
