# R1-D Fighter Image Validation

Status: deployed and production-verified

Date: 2026-08-10

## Objective

Prevent arbitrary or oversized R2 objects from reaching automatic image-format
parsing in the administrator fighter-image workflow. This is a bounded first
part of R1-D; avatar, event-image, and slip storage remain separate slices.

## Candidate changes

- Require positive integer size and allowlisted JPEG/PNG/WebP content type
  before issuing a fighter-image upload URL.
- Refuse to issue or confirm a fighter object key unless the fighter exists.
- Bind the supplied content type into the signed R2 PUT request.
- Accept confirmation only for the exact server-derived
  `fighters/{fighterId}/{face|body}.jpg` key.
- Reject a declared object size above 5 MB before streaming and stop collecting
  remote object bytes if the stream crosses that limit.
- Detect JPEG, PNG, or WebP magic bytes before invoking `image-size`; reject
  ICNS, JXL, HEIF, and other formats outside the application contract.
- Reuse content-type-bound signing for avatar upload URLs without changing the
  existing avatar confirmation contract in this slice.

## Validation

| Gate | Result |
|---|---|
| Focused R1-D/R1 contracts | 5 files, 23 tests passed |
| Complete Vitest suite | 38 files, 230 tests passed with `--maxWorkers=1` |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

Tests prove the content-type allowlist, JPEG/PNG/WebP signatures, rejection of
ICNS/HEIF signatures, existing-fighter ownership checks, exact server-owned
keys, declared-length rejection, successful bounded collection, and failure
above the byte budget.

## Remaining scope

- Avatar confirmation still requires exact owned-key and post-upload media
  validation plus canonical public R2 URLs.
- Event and slip uploads still require durable object-storage migration.
- Bucket policy, expiry/cleanup, scan state, and moderation delivery need their
  own provider-compatible design.
- The aggregate dependency advisory backlog remains separately gated.

## Rollback

There is no database, data, or provider configuration mutation. Revert the
application commit and redeploy verified R1-C deployment
`1518fe37-219e-456f-8d5a-526d39276d1f`. Do not compensate by allowing unbounded
or auto-detected object formats.

## Production promotion

| Evidence | Identity / result |
|---|---|
| Reviewed commit | `31b4ffcf5fb3475d89b9c957bc26edab31413363` |
| Railway deployment | `d2c10de6-8812-4f91-a50d-a4ef5b0f100c` |
| GitHub deployment status | Success, 2026-08-11 05:28:54 UTC |
| `GET /api/health` | `200` JSON |
| Fighter presign without authentication | `401` JSON |
| Fighter confirmation without authentication | `401` JSON |
| Retired wildcard upload | `404` JSON |
| Unknown API path | `404` JSON |
| Oversized ordinary JSON | `413` JSON |
| R1-B header contract | Preserved |

The probes used no user or administrator credential and did not issue an upload
URL, create an object, or mutate a fighter or database row. Owned-key and media
validation behavior is established by the reviewed source and contract tests.

## Stop conditions

Do not promote if current JPEG/PNG/WebP fighter uploads fail, a mismatched object
key reaches storage or database logic, an object over 5 MB is fully buffered,
an unsupported signature reaches `image-size`, or the deployment cannot be tied
to the reviewed commit.
