# Monetization Audit

## Verdict

GRIT does not currently have an end-to-end monetization system. It has a Stripe checkout endpoint and webhook, creator/token schema designs, marketing surfaces, and reward selection logic. Those pieces do not form a safe subscription, creator-payment, payout, or token lifecycle.

## Revenue stream matrix

| Stream | UI | API/service | Deployed storage | Settlement | Status |
|---|---|---|---|---|---|
| Platform premium | Pricing/account surfaces | Checkout + webhook | User subscription columns | Stripe | **Blocked**: one-time checkout grants subscription state |
| Creator subscription | Marketing/legal only | None | Table absent | None | Not built |
| Creator donation/tip | Chat “Boosts” visual rail | None | Table absent | None | Not built |
| Paid 1:1 chat | Legal/schema concept | None | Table absent | None | Not built |
| AI token packs | Static pack/pricing concepts | None | Tables absent | None | Not built |
| Event raffle | Dashboard/rules status | Pool/draw services | Pool/draw tables exist | No payout processor | Blocked |
| Monthly $550 bonus | Rules/notifications | Gated cron + selection | `cash_payouts` absent | Manual PayPal/USDC | Dormant and incomplete |

## Platform subscription findings

### P0: checkout is not a subscription

`server/services/stripeService.ts` creates a Checkout Session with `mode: 'payment'`. `server/api/webhooks/stripeWebhook.ts` treats `checkout.session.completed` as entitlement to premium and writes an active subscription status. This means a one-time payment can create open-ended paid access semantics, while renewal/cancellation webhook branches are never produced by that checkout.

Required correction: use an allowlisted recurring Stripe Price with `mode: 'subscription'`, persist Stripe customer/subscription identifiers, define entitlement from paid invoice/period state, and test renew, fail, cancel-at-period-end, refund, dispute, and webhook replay.

### P0: client controls the product and redirects

`POST /api/payments/create-checkout-session` accepts `priceId`, `successUrl`, and `cancelUrl` from the request. The server does not map a trusted internal plan to an allowlisted Stripe Price or constrain redirects to GRIT origins. The fulfillment webhook also does not verify that the completed session represents an approved product/amount before granting premium.

Impact: any reachable valid Stripe Price could be used to obtain premium, and attacker-controlled redirect destinations are possible.

### P1: lifecycle is incomplete

Webhook branches exist for subscription create/update/delete, and a daily expiration job downgrades expired accounts. Missing operational paths include:

- customer portal or authenticated cancellation endpoint;
- price-change/proration policy;
- invoice failure and recovery UX;
- refund/dispute entitlement reversal;
- idempotent event ledger and replay tooling;
- reconciliation between Stripe and local entitlements;
- verified webhook fixture tests.

The raw Stripe body is correctly registered before global JSON parsing in `server/user-server.ts`; preserve that ordering.

## Creator economy findings

The creator system is a design, not an implemented product. `creator_profiles`, `creator_subscriptions`, `creator_donations`, and related chat/payout concepts appear in staged schema and legal/marketing copy. They are absent from the connected database, and no production route/service performs creator onboarding, follow, subscribe, donate, visibility enforcement, Connect transfers, refunds, or payout reconciliation.

There is no implemented Stripe Connect account creation/onboarding/status flow despite a Connect client ID configuration field. Revenue split percentages (85/15 subscriptions and 95/5 donations) exist only as comments or prose; no calculation, transfer, application fee, ledger, or payout code enforces them.

The following promised creator behaviors are missing:

- follow/unfollow and follower graph;
- creator profile/trust qualification;
- free versus paid pick visibility;
- public and subscriber-only pick feeds;
- monthly creator subscriptions;
- one-time donations/boosts;
- paid chat booking, escrow, completion, cancel, and refund;
- Connect onboarding and payout status;
- creator revenue dashboard, tax identity, statements, and 1099 process.

Creator marketing and agreement language should be hidden or explicitly marked unavailable until the transaction lifecycle exists.

## Tokens and AI monetization

Token balances, transactions, grants, and feature costs are declared in the staged schema, but the database lacks the tables and no route buys or spends tokens. AI endpoints check premium tier, not balance. Therefore pack prices are not purchasable and tokens do not cap AI cost.

Before token sales, define immutable ledger semantics, grant/expiry/refund rules, atomic spend, idempotency keys, negative-balance prevention, admin adjustments, chargeback handling, and consumer disclosures. Never derive balance only from a mutable number without a transaction ledger.

## Rewards and prizes

### Event raffle

The pool service creates synthetic $0.50 contribution rows for eligible subscribers; it does not move or reserve money. Event close calls `drawRaffleWinner` without first calling `createRafflePoolEntries`, so the standard lifecycle normally has no entries. Selection uses `Math.random`, has no auditable seed or independent draw record before selection, and notifications do not constitute payout.

The user raffle routes also expose an older ticket model, creating two competing reward concepts.

### Monthly bonus

The $550 selector is implemented and unit tested. The cron is disabled unless `MONTHLY_BONUS_DRAW_ENABLED=true`, correctly acknowledging that `cash_payouts` is absent. Even after migration, it only records pending rows and asks for manual PayPal/USDC payment. There is no treasury funding, sanctions/location eligibility, identity verification, duplicate-run protection, approval workflow, payment evidence, failed-payment handling, tax threshold aggregation, or reconciliation.

### Compliance boundary

Before offering money or chance-based prizes, obtain jurisdiction-specific legal review. Engineering must support age/location eligibility, official rules/version acceptance, voided-event behavior, audit trails, draw reproducibility, payout identity, tax reporting, and exclusion controls. Current legal pages and schema declarations do not satisfy those operational requirements.

## Data and controls required before launch

1. A canonical product/price catalog controlled by the server.
2. An append-only payment/entitlement event ledger with Stripe event idempotency.
3. Stripe subscription checkout, customer portal, invoice/refund/dispute handling, and reconciliation jobs.
4. A separate internal ledger for creator earnings, platform fees, refunds, reserves, and payouts.
5. Stripe Connect onboarding plus account capability/state enforcement.
6. An auditable reward funding and payout workflow with legal eligibility controls.
7. Versioned legal acceptance records deployed and written during registration/payment.
8. End-to-end sandbox tests before any production Price or Connect account is enabled.
