# R1-F Event Image Storage

Status: deployed and production-verified

Date: 2026-08-10

## Objective

Replace ephemeral local-disk event-image writes with bounded R2 object storage
without changing event records, the event editor contract, or provider policy.

## Candidate changes

- Preserve authenticated administrator-only access.
- Receive the existing multipart `image` field in memory with a 5 MB Multer
  limit instead of writing it to the Railway container filesystem.
- Allow only JPEG and PNG MIME claims, detect the actual signature, require the
  signature to match the claim, and reject structurally unreadable images.
- Use a server-generated `events/{uuid}.{jpg|png}` object key.
- Enforce the byte limit again in the R2 storage service and bind content type
  and content length to the object write.
- Return the canonical R2 public URL through the existing `{ url }` response.

## Compatibility and exclusions

The existing admin client posts multipart data and treats `url` as opaque, so
the response shape is unchanged. Existing event rows and legacy local event
files are not migrated or deleted. Slip storage and all of its moderation and
expiry deletion paths remain a separate slice.

## Validation

| Gate | Result |
|---|---|
| Focused event-image/storage contracts | 3 files, 15 tests passed |
| Complete Vitest suite | 40 files, 238 tests passed with `--maxWorkers=1` |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

## Rollback

Revert only the R1-F application commit. Existing R2 objects remain inert and
can be reviewed separately; do not restore ephemeral writes as a permanent
compatibility fix.

## Production promotion

| Evidence | Identity / result |
|---|---|
| Reviewed commit | `eefd9db653d1cf71da138061e75b3e1e61c787a6` |
| Railway deployment | `2af11f7b-d361-4d54-95c8-99ef495aba1e` |
| GitHub deployment status | Success, 2026-08-11 05:49:34 UTC |
| `GET /api/health` | `200` JSON |
| Event-image upload without authentication | `401` JSON |
| Avatar confirmation without authentication | `401` JSON |
| Fighter presign without authentication | `401` JSON |
| Retired wildcard upload | `404` JSON |
| Unknown API path | `404` JSON |
| Oversized ordinary JSON | `413` JSON |
| R1-B header contract | Preserved |

The production probes used no application credential and created no upload,
R2 object, event change, or database row. Media validation and bounded R2-write
behavior is established by reviewed source and contract tests.

## Stop conditions

Do not promote if authenticated admin JPEG/PNG uploads fail, unsupported or
mismatched bytes reach R2, a file over 5 MB reaches the object client, the
response ceases to be `{ url }`, or deployment identity cannot be proven.
