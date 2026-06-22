# GRIT Architecture

**Truth date:** June 21, 2026
**Authority:** mounted runtime code, connected database inspection, and current build configuration. Product plans and schema declarations alone are not implementation evidence.

## Runtime topology

```text
Browser (React 18 + Vite + TanStack Query)
  -> Express 5 single production process
     -> Clerk authentication
     -> User and admin REST routes
     -> Socket.IO chat
     -> PostgreSQL/Supabase through Drizzle + pg
     -> Stripe, OpenAI/Anthropic, OneSignal, Sentry
     -> node-cron and pg-boss background work
```

Production starts `server/production.ts`, sets `NODE_ENV=production`, and imports `server/user-server.ts`. That server mounts both user and admin APIs, serves `dist/public`, initializes Socket.IO, starts cron jobs and pg-boss, and listens on `PORT`. `server/admin-server.ts` is development-only convenience on `ADMIN_PORT`.

## Code ownership

| Path | Current responsibility |
|---|---|
| `src/` | React application, auth pages, user/admin UI, legal pages |
| `server/user/routes/` | User-facing HTTP routes |
| `server/admin/routes/` | Admin HTTP routes; mounted behind `requireAdmin` in production |
| `server/services/` | Business logic, integrations, jobs; boundaries are not consistently enforced |
| `server/api/webhooks/` | Stripe, Clerk, and data-engine webhooks |
| `server/auth/` | Clerk middleware, local-user synchronization, authorization guards |
| `shared/schema.ts` | Domain Drizzle declarations, including staged undeployed tables |
| `shared/models/auth.ts` | Users, picks, leaderboard snapshots, moderation models |
| `migrations/` | Database changes; migration presence does not prove deployment |
| `tests/` | Vitest plus operational scripts |

## Sources of truth

Use this order when implementation and documentation disagree:

1. Connected database schema and constraints.
2. Routes actually mounted by `server/user-server.ts`.
3. Services called by those routes and scheduled jobs.
4. Frontend requests and rendering behavior.
5. Tests that execute the same contract.
6. Current subsystem READMEs.
7. Product plans and archived documentation.

`shared/schema.ts` contains a section explicitly marked pending founder review. Its creator, token, payout, antifraud, and legal tables are designs until their migration is reviewed, applied, and verified.

## Connected database state

Read-only inspection found 52 public tables. Core event, fight, pick, user, snapshot, group, chat, raffle-pool, and raffle-draw storage exists. These declared tables were absent:

- creator profiles, subscriptions, and donations;
- token packs/balances/transactions/feature costs;
- cash payouts;
- legal acceptances.

The event table had zero rows during the audit, so populated production workflows were not proven by database data.

## Authentication and authorization

Clerk is the active authentication system. `server/auth/guards.ts` resolves the Clerk identity and creates/updates the local user row. API access uses `isAuthenticated`, `requireTier`, feature gates, and `requireAdmin`. Legacy Replit auth files remain but are not the production auth path.

Public routes include health, selected content APIs, landing/auth/legal frontend routes, Stripe webhook, and API-key-protected integration/bootstrap routes. Admin APIs are mounted after `/api/admin` receives rate limiting and `requireAdmin`, with individual route guards still present in many files.

## Background and realtime behavior

- Socket.IO authenticates Clerk tokens and supports community chat.
- Group chat currently polls and does not use the socket layer.
- `node-cron` runs snapshots, progression, expiration, cleanup, retries, and the disabled monthly bonus job.
- pg-boss initializes a durable job queue for outbox synchronization.
- Process-local cron, caches, and rate limiting are not horizontally coordinated.

## Architectural blockers

- Pick submission now uses a shared canonical schema and transactional service; isolated staging database proof remains before it is marked complete.
- Payment, subscription, entitlement, creator earning, and payout ledgers do not exist.
- Event statuses are free-form strings with incompatible casing.
- Event close has non-transactional side effects.
- Rankings have multiple competing sources of truth.
- Several routes contain substantial business logic and direct database operations.
- Local filesystem uploads are unsafe for ephemeral or multi-instance production.
- Process-local rate limiting and cron are not scale-safe.

## What can ship today

Controlled internal QA of authentication, browsing, admin UI, chat surfaces, AI surfaces, and deterministic UI fixtures. Free public beta still requires the P0 pick/ranking corrections because picks are the core product contract.

Paid subscriptions, creator monetization, token purchases, and prizes cannot ship today. See [payments](../payments/README.md), [creator economy](../creator-economy/README.md), [rankings](../rankings/README.md), [groups](../groups/README.md), and [deployment](../deployment/README.md).
