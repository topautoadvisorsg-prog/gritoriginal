# Payment Flow Diagrams

## Current platform checkout

```mermaid
sequenceDiagram
    participant U as User browser
    participant API as GRIT API
    participant S as Stripe
    participant DB as Users table
    U->>API: POST priceId, successUrl, cancelUrl
    API->>S: Create Checkout Session, mode=payment
    S-->>U: Hosted one-time checkout
    S->>API: checkout.session.completed webhook
    API->>DB: Set tier=premium, status=active
    Note over API,DB: Product/amount is not allowlisted
    Note over S,DB: No recurring subscription is created
```

This flow is unsafe because the browser selects the Stripe Price and redirects, while a one-time success grants subscription-like access.

## Required platform subscription flow

```mermaid
sequenceDiagram
    participant U as User browser
    participant API as GRIT API
    participant S as Stripe
    participant L as Payment event ledger
    participant E as Entitlements
    U->>API: Select internal plan code
    API->>API: Map plan to allowlisted recurring Price
    API->>S: Create subscription Checkout Session
    S-->>U: Hosted checkout
    S->>API: Signed webhook
    API->>L: Insert Stripe event idempotently
    API->>S: Retrieve/verify customer, product, amount, status
    API->>E: Grant entitlement for paid period
    S->>API: invoice.paid / payment_failed / subscription.updated
    API->>L: Record each event once
    API->>E: Renew, grace, or revoke by policy
    U->>API: Request billing portal
    API->>S: Create portal session with trusted return URL
```

## Required creator payment flow

```mermaid
flowchart LR
    A[Subscriber or supporter] --> B[GRIT server product catalog]
    B --> C[Stripe Checkout]
    C --> D[Signed webhook and idempotency ledger]
    D --> E[Gross payment]
    E --> F[Platform fee ledger]
    E --> G[Creator pending earnings]
    G --> H{Refund or dispute window}
    H -->|Cleared| I[Stripe Connect transfer/payout]
    H -->|Refunded or disputed| J[Reverse earnings and entitlement]
    I --> K[Reconciled payout statement]
```

No box after “GRIT server product catalog” is currently implemented for creator payments. Split percentages in prose must not substitute for ledger entries and Connect transfers.

## Required reward flow

```mermaid
flowchart TD
    A[Approved reward budget] --> B[Funded treasury ledger]
    B --> C[Eligibility snapshot at event close]
    C --> D[Immutable entrant list]
    D --> E[Auditable draw or ranked selection]
    E --> F[Admin/compliance approval]
    F --> G[Payout provider]
    G --> H[Payment confirmation]
    H --> I[Winner notification and reconciliation]
    G -->|Failed| J[Retry or alternate payout workflow]
```

Raffle code remains incomplete and is no longer invoked during event close; it does not provide funded entry, disbursement, or reconciliation lifecycle. Monthly bonus code selects winners and creates pending records only when an undeployed table and feature flag are enabled.
