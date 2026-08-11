# R1-J Secret Configuration Boundary

Status: local candidate; not deployed

Date: 2026-08-11

## Objective

Stop creating new plaintext integration-secret rows while preserving current
inbound and outbound data behavior during the separately gated Railway-variable
migration.

## Candidate changes

- Classify API keys, secrets, tokens, and passwords as deployment-managed.
- Reject secret database writes in both the authenticated admin route and the
  underlying configuration service.
- Reject `DATA_ENGINE_AUTO_APPLY` through the same fail-closed policy.
- Prefer environment secrets before querying legacy database configuration.
- Resolve the legacy `SUPABASE_API_KEY` request from the canonical
  `SUPABASE_SERVICE_ROLE_KEY` environment variable when present.
- Retain a logged, value-free database read fallback so missing production
  variables do not silently disable existing integrations during migration.
- Remove secret-entry forms from the admin UI; retain configured/missing status
  and allow the non-secret `SUPABASE_URL` setting to remain editable.

## Compatibility evidence

A masked, read-only Railway inspection confirmed that production currently has
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and
`SUPABASE_PROJECT_REF`. It did not show `SUPABASE_API_KEY`, `SUPABASE_URL`, or
`DATA_ENGINE_API_KEY`. No value was revealed or changed. The compatibility
fallback is therefore required until the provider-variable migration is
reviewed and verified in staging.

## Safety boundary

This slice does not delete or rewrite an existing configuration row, rotate a
credential, add a Railway variable, change a provider, alter schema, or change
review-before-write behavior. Logs contain a configuration key name only when a
legacy fallback is used; they never contain the value.

## Validation gate

- Secret-policy and admin route regressions: 2 files, 10 tests passed.
- Repository TypeScript: passed.
- Complete Vitest suite: 44 files, 256 tests passed.
- ESLint: zero errors; 15 pre-existing Fast Refresh warnings.
- Production build: passed; 3,931 modules.
- Hosted secret-free quality gate before Railway promotion.
- Unauthenticated production regression probes after exact deployment identity
  is confirmed.

## Remaining migration

After staging verification, add the reviewed canonical environment variables,
deploy env-only resolution, rotate affected credentials, and remove legacy
database secret values through a separately authorized data operation.

## Rollback

Revert only the R1-J application commit. Existing database values are preserved
during this slice, so rollback requires no database restoration.
