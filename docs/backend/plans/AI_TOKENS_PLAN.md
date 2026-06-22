# AI Chat and Token Economy Plan

**Current state:** AI chat is functional with production verification pending. Tokens are a staged design only.

## Decisions required

- Which subscription tiers include AI and included monthly usage.
- Token pack sizes/prices, expiry, refund/recredit, and subscription-lapse policy.
- Cost per AI feature and whether streaming chat charges per message or reserved maximum.
- Failed/aborted/moderated/cached-request charging policy.

## Delivery phases

1. Measure real provider cost/latency by feature and enforce a simple hard per-user quota first.
2. Add distributed user/account rate limits and concurrent-stream limits.
3. Add provider timeout, retry/fallback budget, circuit breaker, and cost alerts.
4. Review/deploy token pack, balance, transaction, and feature-cost tables only after platform Billing is stable.
5. Credit token purchases only from idempotent verified payment events.
6. Reserve/debit atomically before AI work; finalize actual charge or compensate according to policy.
7. Freeze/unfreeze and refund/chargeback through append-only ledger entries.
8. Add admin grants/revokes with reason/audit, user statements, and reconciliation.

## Invariants

- Balance never goes negative.
- Every balance equals the ordered transaction ledger.
- Same payment or AI request cannot credit/debit twice.
- Cached/moderated/aborted/fallback calls follow explicit charge rules.
- Provider cost cannot exceed the configured user/platform budget silently.

## Proof

Concurrent token spends at exact balance, duplicate purchase webhook, chargeback, failed stream, user abort, moderation rejection, cache hit, provider fallback, outage, subscription lapse, admin adjustment, and ledger rebuild.

## Definition of done

AI access and cost are bounded; every token is financially and operationally explainable; duplicate/concurrent requests are safe; provider and token reconciliation pass in staging.

**Complexity:** L after payments; **Production risk:** High.
