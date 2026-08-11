# R1-N Documentation Authority

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Prevent historical audits and target plans from being mistaken for current
runtime guarantees.

## Delivered behavior

- `docs/CURRENT_STATE.md` is the repository-level current implementation and
  release summary.
- `docs/DOCUMENT_AUTHORITY.md` defines precedence for current state, immutable
  release evidence, component contracts, audit/target plans, and archives.
- The root README uses the verified R1-M quality baseline instead of stale June
  counts and points operators to current state first.
- Older system audits, the backend capability ledger, and the pre-test debt
  register are explicitly historical while remaining intact as evidence.
- The deployment index covers deployed slices through R1-N.

## Authentication dependency discovered

The implemented Clerk webhook remains unmounted. It must not be activated until
the authoritative administrator-role policy is approved and `GRID-AUTH-002` is
repaired: the current update handler can promote an administrator but does not
reliably revoke the persisted role after Clerk metadata removes it.

## Validation

- Relative Markdown links: 8 edited documents validated.
- Git whitespace check: passed.
- Hosted quality gate: run `31497472957`, success.
- Railway deployment `5851605561`: success at 2026-08-11 13:43:15 UTC.
- Production root and liveness: `200` / `200`.

This slice changes no runtime code, schema, migration, production data,
provider configuration, secret, grant, RLS policy, or access rule.

## Finding disposition

`GRID-DOC-001` is resolved. Repository document classes now have explicit
authority and evidence cutoffs. Future release gates must update current state
and their immutable evidence together.

## Rollback

Revert documentation commit `738a707cfd89edcbeeaffbf8348676b2e3a2a4b2`
and redeploy its predecessor. There is no runtime, schema, or data rollback.
