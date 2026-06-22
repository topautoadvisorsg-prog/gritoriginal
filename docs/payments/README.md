# GRIT Payments

**Truth date:** June 21, 2026
**Release status:** payment code exists, but no money-bearing flow is production-ready.

Dedicated backend audit: [`../backend/PAYMENTS_CREATOR_AUDIT.md`](../backend/PAYMENTS_CREATOR_AUDIT.md).

## Status matrix

| Capability | Status | Actual implementation |
|---|---|---|
| Stripe SDK | Exists | `server/services/stripeService.ts` |
| Platform checkout endpoint | Partial/unsafe | Authenticated endpoint accepts browser-supplied Price and redirect URLs |
| Stripe webhook | Partial | Raw-body ordering and signature rejection are correct; lifecycle logic is incomplete |
| Stripe Billing subscription | Not implemented | Checkout uses `mode: payment`, not `subscription` |
| Customer portal/cancel | Missing | No mounted endpoint |
| Renewal/failure recovery | Partial declarations | Subscription webhook branches exist but current checkout cannot create that subscription |
| Refund/dispute flow | Missing | No handlers, policy state, or entitlement reversal |
| Stripe Connect | Configuration only | Client ID field exists; no onboarding/account/charge/transfer APIs |
| Creator payouts | Missing | No Connect transfers or reconciliation |
| Ledger/accounting | Missing | No append-only payment, entitlement, fee, earning, refund, or payout ledger |
| AI token purchase/spend | Staged design only | Tables declared but absent from DB; no mounted APIs |
| Cash reward payouts | Missing | Monthly bonus can only target an absent `cash_payouts` table and is disabled |

## Mounted payment API

### `POST /api/payments/create-checkout-session`

Requires authentication. Body is `priceId`, `successUrl`, and `cancelUrl`. It creates a Stripe Checkout Session with one line item and `mode: payment`; metadata contains only `userId`.

Production blockers:

- the browser chooses any syntactically valid Price ID;
- redirects are not constrained to GRIT origins;
- the server has no internal plan-to-Price allowlist;
- a one-time payment is fulfilled as premium subscription access;
- no Stripe Customer is deliberately created/reused;
- no idempotency key protects session creation.

### `POST /api/webhooks/stripe`

Registered before global JSON parsing and uses `express.raw`. It rejects requests when `STRIPE_WEBHOOK_SECRET` or the Stripe signature is absent and verifies valid signatures with Stripe.

Handled events:

- `checkout.session.completed`: sets the local user to premium/active;
- `customer.subscription.created`: records subscription ID/start date when metadata contains `userId`;
- `customer.subscription.updated`: updates status/period or resets resubscription state;
- `customer.subscription.deleted`: downgrades to free;
- `payment_intent.succeeded`: logs only.

Missing controls:

- persistent Stripe event ID idempotency;
- approved product/Price/currency/amount verification before fulfillment;
- invoice-paid authority for entitlement periods;
- payment failure, refund, chargeback, dispute, and fraud handling;
- event replay/reconciliation tooling;
- customer/subscription ownership validation;
- creator/token transaction routing.

## Required platform subscription architecture

```text
internal plan code
  -> server-owned Stripe Price allowlist
  -> Checkout mode=subscription
  -> signed webhook
  -> idempotent payment event record
  -> verified invoice/subscription state
  -> bounded entitlement period
  -> portal/cancel/refund/dispute lifecycle
  -> scheduled Stripe-to-local reconciliation
```

The local `users` subscription columns can remain a read model, but must not be the financial ledger or ultimate payment authority.

## Required creator-payment architecture

Use Stripe Connect onboarding and connected-account capability checks. Keep these ledgers separate:

1. Customer charge/payment/refund/dispute.
2. Subscriber entitlement to a creator.
3. Gross creator earning.
4. GRIT platform fee.
5. Reserve/refund adjustment.
6. Transfer and payout reconciliation.

Whether GRIT or the connected creator is merchant of record, and whether to use direct or destination charges, is a product/legal/accounting decision that must be documented before implementation. Stripe's charge type controls statement identity and responsibility for refunds/chargebacks.

## AI tokens

Token tables describe packs, balances, append-only transactions, and feature costs. None is deployed or used. The current AI chat is premium-gated and OpenMeter records usage without enforcing a balance.

Tokens can be built later, but only after safe platform subscriptions. Required invariants:

- server-owned pack catalog and Stripe Prices;
- webhook-confirmed credit exactly once;
- atomic balance lock/debit before an AI request;
- append-only ledger with `balanceAfter` and idempotency key;
- refund and chargeback reversal rules;
- no negative balances;
- failed AI call compensation policy;
- admin adjustments recorded, never silent mutation.

## What can ship today

Stripe test-mode engineering only. No real platform subscription, creator membership, tip, token sale, or payout should be enabled.

## Production gates

1. Build recurring platform subscriptions from a server-owned catalog.
2. Add event/entitlement ledgers and webhook replay protection.
3. Implement portal, cancel, invoice failure, refund, and dispute behavior.
4. Pass full Stripe sandbox lifecycle tests.
5. Reconcile existing local premium state before accepting real money.
6. Implement Connect and creator ledgers before creator monetization.
7. Implement token ledger only after subscription/payment foundations are stable.

Related: [monetization audit](../system-audit/MONETIZATION_AUDIT.md) and [payment diagrams](../system-audit/PAYMENT_FLOW.md).
