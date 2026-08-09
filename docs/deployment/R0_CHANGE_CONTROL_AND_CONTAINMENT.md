# R0 — Change Control and Containment

Status: **deployed and verified**
Date: 2026-08-09

## Objective

Prevent known development, destructive, and review-bypass behavior from entering
the production composition, while proving the current release chain.

## Implemented locally

- Production runtime requires Clerk secret and publishable configuration.
- Production runtime rejects `UI_AUDIT_FIXTURES=1`.
- Production frontend builds reject fixture embedding.
- Production runtime rejects `ENABLE_BOOTSTRAP_ROUTES=1`.
- Bootstrap/reset routes mount only when an explicit non-production capability
  is enabled.
- Production rejects the retired `DATA_ENGINE_AUTO_APPLY=true` environment flag.
- The inbound data-engine webhook no longer contains any approval/apply branch;
  every accepted proposal remains pending.
- The administrator UI no longer offers auto-apply, and the configuration API
  rejects attempts to restore that key.
- `smoke:pipeline` validates a distinct staging database and its marker before
  dynamically loading any database-backed module.
- Railway project/service/deployment-to-Git provenance is recorded in
  `RELEASE_PROVENANCE.md`.

## Validation

The local candidate passed:

- TypeScript validation;
- 34 Vitest files and 211 tests using one worker, with exit code 0;
- ESLint with zero errors and 15 pre-existing Fast Refresh warnings;
- the production build (3,931 modules); and
- `git diff --check` with exit code 0.

Focused contract tests cover runtime/build rejection, bootstrap composition,
review-before-write, administrator UI state, and smoke-test import order. A
negative staging rehearsal with no write authorization exited nonzero at
`assertSafeStagingTarget` before database-backed modules were loaded.

The destructive smoke workflow itself was not run because no explicitly
approved, marked disposable staging database was supplied.

The repository declares Node `>=20 <23`, but the available system and bundled
local runtimes are Node 24.x. The clean local suite is useful evidence, but a
clean CI run on Node 20 or 22 remains a promotion requirement. No dependency or
runtime installation was performed to conceal this environment limitation.

## Production state

Railway deployment `6b6e67f0-0b06-4332-a51e-0d9ed156bd75` is active from
commit `0b65ede50f41b366b0f71659f5dd24262cc2a997`. Health returned `200` JSON, the
bootstrap status path returned the frontend fallback instead of bootstrap JSON,
and the unauthenticated data-engine webhook returned `401`. No variable, domain,
database, Supabase, Clerk, Stripe, or secret setting changed during promotion.

## Rollback

Before deployment, record the current active deployment ID
`261e8781-428b-4680-8603-c2e636f4e956`. The code change has no DDL or data
migration. Application rollback is therefore an immutable-artifact rollback to
that deployment. Do not roll back by weakening production safety variables.

## Completion gate

R0 production containment is complete. Broader release readiness still requires:

- verification on the repository-supported Node range;
- marked disposable-staging smoke evidence;
- fixture, bootstrap/reset, and auto-apply regression coverage to remain green;
- the previous deployment to remain available until the containment release is
  superseded by another verified artifact; and
- all later gates to retain the fail-closed production policy.
