# GRIT Current Engineering State

**Evidence cutoff:** August 11, 2026

**Runtime baseline:** `c77f71e97cbb0d3d4dec990ee98f563023a72637`

**Documentation baseline:** R1-O

This page is the repository entry point for current implementation and release
state. It supersedes historical progress boards, handoffs, audit snapshots, and
target plans when their claims conflict.

## Current deployment

- GitHub `main` is the reviewed release branch.
- Railway project `virtuous-freedom`, service `gritoriginal`, deploys that
  branch to the production environment.
- Runtime commit `c77f71e` passed hosted quality gate `31500110247`; its exact
  Railway promotion evidence is recorded in the R1-O release document.
- The deployed root and liveness endpoint returned `200`; unauthenticated data
  ingestion and administrator mutation probes returned `401`.
- Production write guards, explicit review-before-write, and destructive-route
  containment remain fail-closed.

## Verified quality baseline

| Gate | Result |
|---|---|
| TypeScript project references | Pass |
| Vitest | 47 files, 273 tests pass |
| ESLint | 0 errors; 15 known Fast Refresh warnings |
| Production build | Pass; 3,752 modules |
| Production dependency policy | Pass; 0 Critical/High, 2 Moderate |
| GitHub Actions | Pass |

These checks prove the reviewed application artifact. They do not prove schema
parity, third-party sandbox behavior, horizontal scaling, payment correctness,
or production data quality.

## Implemented safety and reliability slices

R0 and R1-A through R1-O are deployed. Their immutable evidence, boundaries,
and rollback instructions live in [`deployment/`](deployment/README.md).
Material controls include production containment, HTTP and upload boundaries,
hosted quality gates, environment-only integration-secret reads, retryable
outbound delivery, preservation-first ingestion actions, and the
no-placeholder fighter image contract, documentation authority, and a
CI-enforced production dependency severity ceiling.

## Open release gates

The platform is not approved for paid, prize-bearing, or viral-scale launch.
Open gates include:

- authoritative schema reconciliation and disposable production-shaped proof;
- admin authority/revocation policy and signed identity-lifecycle integration;
- canonical ownership and identity rules for shared MMA data;
- transactional outbox receipts and replay/reconciliation tooling;
- safe multi-replica jobs, connection budgets, distributed rate limits, and
  dependency-aware readiness;
- Stripe entitlement/event-ledger correctness and reward containment;
- public Supabase exposure remediation under an approved compatibility plan;
- the React Router v7 compatibility migration, development-tool advisory
  cleanup, SBOM ownership, observability, load, rollback, and recovery evidence.

No plan document, schema declaration, or UI state closes a release gate without
an executable control, passing validation, deployed revision, and rollback
record.

## Document authority

Use [`DOCUMENT_AUTHORITY.md`](DOCUMENT_AUTHORITY.md) to distinguish current
runtime truth, immutable release evidence, historical audit snapshots, target
architecture, and archives.
