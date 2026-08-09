# R1 Pre-Push Engineering Review

Status: reviewed local candidate; production promotion pending

Review date: 2026-08-09

## Scope

This review covers the deployed R0, R1-A, and R1-B changes from
`0b65ede50f41b366b0f71659f5dd24262cc2a997` through
`6f3f23a53c721f84d3e37eb45ced158607c85aa1`, plus the local R1-C candidate.
It reviews production containment, log redaction, API routing, proxy/header/body
policy, and upload boundaries. It does not reopen unrelated schema, payment,
analytics, or product-design work.

## Review outcome

No new Critical issue was found in the reviewed changes. The deployed R0–R1-B
controls remain internally consistent and their tests still represent the
intended production contracts. The pre-push review identified four bounded
cleanup items in the active R1 surface; all four are included in R1-C.

| ID | Severity | Evidence | Disposition |
|---|---|---|---|
| R1-REV-001 | High | The legacy wildcard writer in `server/user/routes/uploadRoutes.ts` accepted an arbitrary streamed path and no byte/content contract. | Repaired locally: route registration and implementation removed. |
| R1-REV-002 | Medium | `server/user/routes/slipRoutes.ts:45` described Challenger-only uploads but previously enforced only authentication. | Repaired locally: existing `requireTier("premium")` guard added server-side. |
| R1-REV-003 | Low | The unused `src/shared/hooks/use-upload.ts` referenced an unimplemented request-url endpoint. | Removed locally after confirming zero consumers. |
| R1-REV-004 | Low | `server/admin-server.ts` lacked the generic JSON API `404` used by the production composition. | Repaired locally at `server/admin-server.ts:28`; contract test added. |
| R1-REV-005 | Informational | Deployment README still called the verified R1-B release a local candidate. | Documentation corrected locally with exact R1-B provenance. |

## Controls preserved

- Production configuration remains fail-closed in
  `server/config/productionSafety.ts:15-31`.
- Stripe raw-body middleware remains before JSON parsing in
  `server/user-server.ts:70-73`.
- The one-hop production proxy and selected security headers remain centralized
  in `server/middleware/httpSecurity.ts:18-35`.
- Ordinary JSON remains limited to 1 MB, with three documented 5 MB ingestion
  exceptions in `server/middleware/httpSecurity.ts:38-41`.
- Failed-request logging excludes bodies and route error text in
  `server/middleware/requestLogger.ts:11-27`.
- Structured log redaction remains centralized in
  `server/utils/logger.ts:24-64`.
- Unknown user and admin API routes remain inside the generic JSON boundary at
  `server/user-server.ts:157-159` and `server/admin-server.ts:28-29`.
- Bootstrap routes remain production-disabled at
  `server/user-server.ts:137-142`.

## Technical debt intentionally deferred

These are real issues, but combining them with R1-C would enlarge the rollback
surface or require provider/schema decisions.

| ID | Severity | Evidence | Required next slice |
|---|---|---|---|
| R1-DEBT-001 | Medium | Event images still use bounded local disk and claimed MIME metadata at `server/admin/routes/adminEventRoutes.ts:39-72`. | Migrate to the canonical object-storage contract with actual media validation. |
| R1-DEBT-002 | Medium | Slip images remain bounded but ephemeral local files at `server/user/routes/slipRoutes.ts:13-27` and `65-78`. | Move to durable private object storage with moderation-aware delivery and cleanup. |
| R1-DEBT-003 | Medium | Avatar confirmation accepts a client-supplied path at `server/user/routes/userRoutes.ts:111-131`; presigned PUTs do not bind content metadata at `server/services/storageService.ts:35-40`. | R1-D: canonical owned keys, signed content type, post-upload size/signature validation, and one public URL strategy. |
| R1-DEBT-004 | High | Fighter confirmation reads the complete remote object into memory and passes auto-detected bytes to `image-size@2.0.2` at `server/user/routes/fighterImageRoutes.ts:58-89`. Current advisories describe infinite-loop denial of service in ICNS/JXL/HEIF parsers. The route is admin-only, reducing exposure but not eliminating it. | R1-D: exact owned keys, allowlisted magic bytes, capped streaming validation, and post-upload size checks before image parsing. |
| R1-DEBT-005 | High pending full triage | The current dependency audit reports 38 advisories: 1 critical, 20 high, 16 moderate, and 1 low. The Critical `tar` chain is transitive through the Capacitor CLI; runtime reachability has not been established. | Dependency gate: trace reachable packages, update independently, rerun full regression/build, and avoid automatic major rewrites. |
| R1-DEBT-006 | Medium | CSP and HSTS remain intentionally disabled at `server/middleware/httpSecurity.ts:22-29`. | Inventory Clerk, Sentry, storage, OAuth, domains, and subdomain policy before staged enforcement. |

## Architecture clarification

MMA Grid and MMA Journal retain separate login and authorization lifecycles.
AI Battle is a public marketing application with no user login. This review does
not create cross-application sessions, shared cookies, or implicit identity.

## Promotion conditions

R1-C may be promoted only if focused contracts, the complete suite, TypeScript,
ESLint, the production build, diff integrity, source/remote reconciliation, and
post-deploy probes all pass. Production probes must prove the retired wildcard
upload returns the generic API `404`, ordinary protected writes remain rejected,
and the existing health/header contracts do not regress.

## Validation evidence

| Gate | Result |
|---|---|
| Focused R0–R1 contracts | 4 files, 18 tests passed |
| Complete Vitest suite | 37 files, 225 tests passed with `--maxWorkers=1` |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

The first default-parallel full-suite attempt exhausted this Windows host's
process capacity (`spawn UNKNOWN`) and caused four timeout/cascade failures.
The same complete suite passed with one worker. This is recorded as runner
capacity evidence, not converted into a false application failure or hidden
from the release record.
