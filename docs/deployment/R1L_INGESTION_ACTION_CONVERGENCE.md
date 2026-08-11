# R1-L Ingestion Action Convergence

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Prevent reviewed ingestion proposals from reporting success when their action is
unsupported, their target identity is missing, or the intended canonical row
does not exist.

## Delivered behavior

- External ingestion deletes are rejected with
  `INGESTION_DELETE_REQUIRES_POLICY` before submission, approval, or apply.
- Historical delete proposals cannot pass the approval or apply service
  boundaries.
- Fighter, fight-history, event, and news updates require the canonical local
  target UUID in `sourceId`.
- Odds retain their established target contract through validated
  `data.fightId`.
- Every update/correction checks `UPDATE ... RETURNING` and rejects a missing
  target with `PIPELINE_TARGET_NOT_FOUND` instead of marking the proposal
  applied.
- Approval uses a compare-and-set transition from `pending`; invalid entry and
  state transitions return explicit `404`/`409` policy errors.
- Apply locks the pipeline row, serializing concurrent apply attempts and
  preventing the same approved proposal from being applied twice in parallel.

## Preservation boundary

No tombstone or physical-deletion design has been approved. Rejection is
intentional and follows the platform rule to preserve first and never migrate
uncertainty. The parse schema retains `delete` only so callers and historical
rows receive an explicit policy response rather than an ambiguous validation
failure.

## Validation

- Focused action-policy coverage: 6 tests passed.
- Complete Vitest suite: 46 files, 267 tests passed.
- Repository TypeScript: passed.
- ESLint: zero errors; 15 pre-existing Fast Refresh warnings.
- Production build: passed; 3,931 modules.
- Hosted quality gate: run `31495559523`, success.
- Railway deployment `5851227350`: successful at 2026-08-11 13:21:45 UTC.
- Production root and health: `200`.
- Webhook without service authentication: `401`.
- Admin apply without user authentication: `401`.
- Unknown API route: `404`.

Verification performed no authenticated mutation and changed no production
row, database object, migration, provider setting, credential, variable, RLS
policy, or grant.

## Remaining boundary

The platform still needs approved tombstone, retention, dependency, correction
version, and downstream verification-receipt semantics. Until those exist,
deletion remains disabled and cross-system correction completion cannot be
declared solely from the local database result.

`GRID-INGEST-004` is therefore partially resolved and remains a production
blocker for complete delete/correction convergence.

## Rollback

Revert application commit `68771e25b04fa63c71b3a7e44ce1ce074a13075b`
and redeploy the previous immutable artifact. There is no schema or data
rollback.

