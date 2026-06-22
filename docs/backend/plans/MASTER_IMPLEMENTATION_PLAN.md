# GRIT Backend Master Implementation Plan

**Purpose:** one dependency-ordered execution plan for all unresolved backend pipelines. Plans define work; they do not mark implementation complete.

## Current evidence baseline

| Pipeline | State |
|---|---|
| Build/type/test | Verified Complete |
| Pick create/edit/delete | Code Verified / Staging DB Proof Pending |
| Rankings | Remediation In Progress / R0-R1 Staging Proof Pending |
| Groups | Functional / Production Verification Pending |
| AI chat | Functional / Production Verification Pending |
| Payments | Audit Complete / Production Blocked |
| Creator economy | Audit Complete / Not Implemented |
| Deployment | Partial |

## Dependency order

### Stage 0: Safe environments and evidence

- **Implemented:** fail-closed staging target guard, isolated env-file loading,
  production identity comparison, in-database marker verification, and unit evidence.
- **Pending:** provision the isolated database and apply reviewed schema/migrations.
- Provision isolated staging PostgreSQL and credentials.
- Add CI, schema parity/readiness, fixture manifest, and evidence retention.
- Execute pick staging proof.

**Exit:** Pick pipeline can be honestly promoted or returns to remediation.

### Stage 1: Competition authority

- Resolve event status model.
- Implement canonical eligible scored-pick predicate. **Code implemented; historical reconciliation pending.**
- Approve tie/qualification/legacy/history decisions.
- Repair scoped rankings, idempotent snapshots, and event close.
- **Implemented in code:** explicit global/event/period read scopes and event-associated dashboard snapshot reads.
- **Implemented in code:** stable unique keys for new snapshots and retry reuse; legacy cleanup/version policy pending.
- **Implemented in code:** durable close record, commit-before-snapshot ordering, and admin snapshot retry. Automatic progression is deferred; raffle is removed from close.
- **Implemented in code:** transactional per-user/event progression applications, close status inspection, and manual retry. Automatic activation waits for canonical performance policy and staging proof.
- Reconcile dashboard/progression.

**Exit:** all ranking consumers agree for global/event/month/year and retry/correction.

### Stage 2: Identity, legal, and data lifecycle

- Complete authenticated staging lifecycle.
- Deploy versioned legal acceptance.
- Complete export/deletion/audit trails.

**Exit:** identity and legal evidence support paid operation.

### Stage 3: Platform subscriptions

- Server-owned recurring Billing.
- Payment/invoice/entitlement ledgers.
- Webhook idempotency, portal, failure, refund, dispute, reconciliation.

**Exit:** full Stripe test lifecycle and ledger reconciliation pass.

### Stage 4: Operational hardening

- Durable jobs, shared rate limits/cache/socket adapter, object storage.
- Dependency remediation, readiness, monitoring, load and recovery tests.

**Exit:** controlled public free beta, then limited paid platform launch can be evaluated.

### Stage 5: Community and retention

- Groups/join/realtime/moderation.
- Notes/history.
- Notification delivery and upload lifecycle.

**Exit:** engagement features are durable, authorized, and supportable.

### Stage 6: Creator free layer

- Creator profiles, follows, public/authorized publication, immutable performance.

**Exit:** free creator discovery works without money.

### Stage 7: Creator money

- Connect onboarding.
- Creator subscriptions and financial ledgers.
- Refunds/reserves/transfers/payouts/tax reconciliation.
- Tips after subscriptions; paid chat last.

**Exit:** one creator completes a fully reconciled staging lifecycle.

### Stage 8: AI tokens

- Hard quota/cost controls first.
- Token purchase and atomic spend ledger after ordinary payments stabilize.

**Exit:** provider cost and every token reconcile.

### Stage 9: Optional promotions

- Only after counsel approval; separate no-purchase promotion system.

**Exit:** funded, rules-versioned, auditable draw and payout.

## Cross-pipeline definition of done

Every promoted pipeline must have:

1. Approved product decisions and shared contract.
2. Server/database invariants.
3. Authorization, privacy, and abuse controls.
4. Transaction/idempotency/concurrency behavior.
5. Failure, retry, rollback, and reconciliation.
6. Unit, route, DB integration, staging, and load evidence appropriate to risk.
7. Observability and support/admin operations.
8. Current README and ledger state.
9. Exact commit/migration/config evidence.
10. No production fixtures or destructive test writes.

## Plan index

- [Authentication and accounts](AUTH_ACCOUNT_PLAN.md)
- [Picks, locking, and scoring](PICKS_SCORING_PLAN.md)
- [Rankings resolution](../RANKINGS_RESOLUTION_PLAN.md)
- [Dashboard and stats](DASHBOARD_STATS_PLAN.md)
- [Platform payments](PLATFORM_PAYMENTS_PLAN.md)
- [Creator economy](CREATOR_ECONOMY_PLAN.md)
- [AI and tokens](AI_TOKENS_PLAN.md)
- [Community/groups/chat](COMMUNITY_GROUPS_CHAT_PLAN.md)
- [Notes/history](NOTES_HISTORY_PLAN.md)
- [Notifications/uploads](NOTIFICATIONS_UPLOADS_PLAN.md)
- [Rewards/legal](REWARDS_LEGAL_PLAN.md)
- [Deployment/operations](DEPLOYMENT_OPERATIONS_PLAN.md)
- [Pick staging proof](../PICK_STAGING_PROOF.md)
