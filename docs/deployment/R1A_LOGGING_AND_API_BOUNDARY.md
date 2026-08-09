# R1-A Logging and API Boundary

Status: local candidate verified; production promotion not yet approved

Date: 2026-08-09

## Objective

Remove known sensitive-value logging and keep unknown API requests inside a
predictable JSON boundary without changing database, authentication, payment,
or business-route behavior.

## Candidate changes

- Central logging recursively redacts credential-bearing structured fields,
  bearer tokens, JWTs, assigned secret strings, and database URL credentials.
- Operational token-count metrics remain visible because only credential token
  field names are redacted.
- Failed API request logs contain route, method, user identifier, status, and
  duration only. Request bodies and route error text are excluded.
- Data-engine configuration updates log the configuration key but never its
  value.
- Unknown `/api/*` requests receive a generic `404` JSON response before static
  assets or the SPA fallback are considered.

## Verification

| Gate | Result |
|---|---|
| Focused R1 contract | 4 tests passed |
| Full Vitest suite | 35 files, 215 tests passed |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |
| Diff integrity | `git diff --check` pass |

## Boundaries and remaining work

This slice resolves the code path described by `GRID-SEC-004`. It partially
mitigates `GRID-INGEST-006` by removing configuration values from logs, but does
not migrate or rotate plaintext integration credentials. It also does not:

- change Railway or Supabase secrets;
- remediate the Nixpacks Docker `ARG`/`ENV` warning;
- reduce the global 50 MB JSON body budget;
- establish trusted-proxy or security-header policy;
- retire the legacy upload path; or
- change public Supabase grants/RLS.

Those items require separate R1 slices with their own compatibility evidence.

## Rollback

There is no schema or data migration. Revert this application change and deploy
the previous verified R0 artifact. Do not restore body or secret-value logging
as part of rollback; if logger compatibility causes a regression, replace the
structured redactor while preserving the no-secret contract.

## Stop conditions

Do not promote if any test fails, an allowlisted operational value is lost, a
secret appears in test output, an API route is captured by the new 404, or the
reviewed commit cannot be linked to an immutable Railway deployment.
