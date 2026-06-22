# Payments and Creator Economy Backend Audit

**Audit date:** June 21, 2026
**State:** audit complete; both pipelines are blocked/not implemented for production.
**Production writes:** none.

## Executive verdict

Platform payment code is a prototype, not a subscription lifecycle. Creator monetization is a staged schema/product design with no deployed storage or mounted APIs. No real money flow can ship safely today.

## Capability matrix

| Capability | Evidence state | What exists | What is missing/blocking |
|---|---|---|---|
| Stripe SDK/config | Implemented | Stripe client, secret/publishable/webhook env fields | API version is pinned old; readiness does not require payment configuration |
| Stripe Billing | Blocked | One authenticated Checkout endpoint | Uses `mode: payment`, not recurring subscription Billing |
| Checkout catalog | Blocked | Browser sends `priceId` | No server-owned plan/Price allowlist or product/amount/currency verification |
| Checkout redirects | Blocked | Browser sends success/cancel URLs | No trusted-origin allowlist |
| Pricing UI | Missing connection | Static pricing/sign-in surface | No production UI caller to the checkout endpoint was found |
| Stripe Customer model | Missing | Local subscription columns only | No Stripe customer ID, customer reuse, ownership/reconciliation model |
| Webhook signature boundary | Implemented | Raw body registered before JSON; absent secret/signature rejected; Stripe verification used | No automated webhook tests |
| Webhook idempotency | Missing | Some state updates are naturally repeatable | No stored Stripe event ID; replay can reset timestamps/retrigger work |
| Subscription fulfillment | Blocked | Checkout success sets premium; subscription create/update/delete branches exist | Current checkout cannot produce the expected recurring lifecycle; metadata linkage is unproven |
| Webhook failure behavior | Blocked | Logs failures | Checkout fulfillment catches DB failure and still returns HTTP 200, preventing Stripe retry |
| Renewal/invoice handling | Missing | Generic subscription status update | No `invoice.paid`, `invoice.payment_failed`, grace/recovery, or payment-period authority |
| Cancellation/customer portal | Missing | Delete webhook downgrades | No user portal/cancel endpoint or cancel-at-period-end UX |
| Refunds/disputes | Missing | Legal copy describes policies | No refund, charge-refund, dispute, chargeback, entitlement reversal, or reserve code |
| Entitlement ledger | Missing | `users.tier/status/periodEnd` read model | No append-only payment/entitlement history or reconciliation |
| Stripe Connect | Missing | Client ID env and staged profile fields | No connected account creation, onboarding, capabilities, account webhooks, charges, transfers, or payout controls |
| Creator profiles/follows | Missing | Staged creator profile table only | No deployed table, follower table, routes, service, or authorization |
| Creator subscriptions | Missing | Staged subscription table and prose split | No product/Price creation, Checkout, entitlement, cancel/refund, fee/earning ledger |
| Tips/support | Missing | Static/fixture Boost presentation; staged donation table | No mounted payment/API, settlement, refund/dispute treatment, or receipts |
| Creator payouts | Missing | Staged Connect fields and cash-payout concept | No earnings balance, reserves, transfers, payout reconciliation, failed payout handling |
| Accounting/ledger | Missing | Comments state percentage splits | No gross/fee/net/refund/dispute/transfer/payout entries; percentages are unenforced prose |
| Tax/identity operations | Missing | Staged fields/legal prose | No Connect tax onboarding, W-9/W-8 workflow, reporting reconciliation, or support process |
| AI token payments | Missing | Staged tables only | Tables absent; no purchase webhook, atomic debit, refund/recredit, or balance reconciliation |

## Deployed database truth

Read-only inspection confirmed core user subscription columns exist. The following are absent from the connected database:

- creator profiles, subscriptions, and donations;
- token packs, balances, transactions, and feature costs;
- cash payouts and legal acceptances.

The staged migration and Drizzle declarations are not deployed capabilities.

## Critical findings

### P0: one-time payment grants subscription-like access

Checkout creates `mode: payment`. On `checkout.session.completed`, the webhook sets `tier=premium`, `subscriptionStatus=active`, and a start date. There is no bounded paid period from an invoice/subscription. This can create indefinite premium semantics from one payment.

### P0: client chooses the commercial terms

The authenticated caller supplies Stripe Price ID and both redirects. Fulfillment does not retrieve and verify approved product, Price, amount, currency, payment state, or environment before granting access.

### P0: failed fulfillment can be acknowledged as successful

The checkout handler catches a database update failure, logs it, then returns HTTP 200 for the webhook. Stripe will consider the event delivered, while the user may have paid without receiving access.

### P0: no financial event ledger/idempotency

No Stripe event ID is persisted. There is no authoritative payment, invoice, entitlement, refund, dispute, creator earning, platform fee, transfer, or payout ledger. Local user columns cannot explain or reconcile money movement.

### P0: creator claims have no runtime implementation

Creator Agreement and marketing text describe visibility, subscriptions, donations, splits, refunds, escrow, termination, and tax behavior. None is backed by deployed tables/routes/services/Connect flows. Those claims must remain disabled until the lifecycle exists and is approved.

## Recommended architecture

### Platform subscriptions first

```text
internal plan code
 -> server-owned Stripe Price
 -> Checkout mode=subscription
 -> signed webhook
 -> stored Stripe event (unique)
 -> verified customer/subscription/invoice
 -> payment ledger + bounded entitlement
 -> portal/cancel/failure/refund/dispute
 -> scheduled Stripe reconciliation
```

Keep `users.tier/status/periodEnd` only as a rebuildable entitlement read model.

### Creator marketplace second

```text
creator Connect onboarding/capability approval
 -> creator product/price
 -> subscriber charge
 -> payment + entitlement ledger
 -> gross earning / platform fee / reserve
 -> refund/dispute adjustments
 -> Connect transfer/payout
 -> payout and tax reconciliation
```

Merchant-of-record responsibility and Connect charge model must be selected with legal/accounting input before implementation. Tips should be labeled Support/Tip/Boost, not charitable donations.

## Resolution order and complexity

| Priority | Work | Complexity | Deployment risk |
|---|---|---:|---:|
| 1 | Disable real checkout/creator claims until safe | S | Low |
| 2 | Server-owned plan catalog and recurring Billing checkout | M | Medium |
| 3 | Payment-event and entitlement ledgers with webhook idempotency | L | High |
| 4 | Invoice paid/failed, portal/cancel, refund/dispute lifecycle | L | High |
| 5 | Stripe/local reconciliation and admin operations | L | Medium |
| 6 | Deploy creator/follow/visibility model after ranking integrity | L | High |
| 7 | Connect onboarding/capability/account webhooks | L | High |
| 8 | Creator subscription, fee, earning, reserve ledgers | XL | High |
| 9 | Tips after subscription settlement is proven | M | Medium |
| 10 | Transfers, payouts, tax/support reconciliation | XL | High |
| 11 | AI token ledger after ordinary payments stabilize | L | High |

## Required proof before money

- Stripe test-mode buy/renew/fail/recover/cancel/refund/dispute/replay matrix.
- Duplicate and out-of-order webhook delivery.
- DB failure returns retryable webhook status and later reconciliation repairs access.
- Cross-user/customer/Price tampering rejection.
- Ledger balances reconcile exactly to Stripe test transactions.
- Creator Connect onboarding, disabled capabilities, refund reserve, failed payout, and negative-balance scenarios.
- Account deletion preserves legally required financial records while removing non-required personal data.
- No production mode until legal documents and versioned acceptance match actual behavior.

## Production status

- **Payments Pipeline: Audit Complete / Production Blocked.**
- **Creator Economy Pipeline: Audit Complete / Not Implemented.**

No implementation should begin until the platform-subscription data model and merchant/Connect responsibility decisions are approved.
