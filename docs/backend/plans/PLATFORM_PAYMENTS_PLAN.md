# Platform Payments Resolution Plan

**Current state:** Audit Complete / Production Blocked. One-time Checkout currently grants subscription-like premium access.

## Decisions required

- GRIT Pro plans, prices, currencies, trial/grace policy, and launch countries.
- Refund window, cancellation timing, failed-payment grace, and dispute policy.
- Tax collection provider/configuration and merchant-of-record responsibility.
- Existing premium-user reconciliation/migration policy.

## Delivery phases

1. Disable production checkout until the new flow is proven.
2. Create a server-owned plan catalog mapping internal codes to allowlisted recurring Stripe Prices.
3. Add payment-event, subscription, invoice, and entitlement tables; Stripe event ID is unique.
4. Create/reuse Stripe Customer and Checkout `mode=subscription`; trusted server redirects only.
5. Fulfill from verified invoice/subscription state, not checkout success alone.
6. Handle invoice paid/failed, subscription update/delete, refunds, disputes, and out-of-order/replayed events.
7. Add customer portal/cancel endpoints and clear access-period UX.
8. Build Stripe-to-local reconciliation and admin replay/repair tools.
9. Migrate existing premium rows only after comparing them with Stripe truth.

## Failure rules

- Webhook DB failure returns retryable non-2xx.
- Persist event before side effects; process idempotently.
- User entitlement is a rebuildable read model.
- Product, Price, amount, currency, environment, customer, and ownership are verified.
- Refund/dispute reversals are ledger entries, never destructive mutation.

## Proof

Stripe test-mode buy, duplicate submit, replay, out-of-order events, renew, fail, recover, cancel-now/end-period, refund, partial refund if supported, dispute, webhook outage, DB outage, and reconciliation. Ledger must equal Stripe for every fixture.

## Definition of done

No client-owned commercial terms; bounded entitlements match paid invoices; every Stripe event is processed once; portal/refund/dispute flows work; reconciliation repairs drift; staging and rollback runbooks pass.

**Complexity:** XL. **Production risk:** High.
