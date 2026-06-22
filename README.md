# GRIT

GRIT is a fantasy MMA prediction and community platform. Users make picks on real fight cards, compete on net units, follow event intelligence, chat, and review performance. It is not a sportsbook and does not accept wagers.

## Current status

The application is a React/Vite/TypeScript frontend with an Express 5 backend, PostgreSQL via Drizzle, Clerk authentication, Stripe integration, Supabase-backed data, Socket.IO chat, and OpenAI-powered analysis. It is deployed from the `main` branch, but the June 21, 2026 audit classifies it as **not ready for paid production launch**.

The launch blockers are documented in [`docs/system-audit/PRODUCTION_READINESS.md`](docs/system-audit/PRODUCTION_READINESS.md). The most important are:

- the pick contract is code-remediated but still needs isolated staging database proof;
- checkout creates a one-time Stripe payment while granting subscription access;
- checkout accepts arbitrary Stripe price and redirect values from the client;
- creator, AI-token, payout, and legal-acceptance tables are declared but not deployed;
- rankings, flag budgets, event snapshots, and dashboard event selection have integrity defects;
- advertised creator monetization and reward flows are not operational end to end.

Do not enable paid acquisition, creator payments, token sales, or cash rewards until the P0/P1 release gates are closed.

| Pipeline | Current evidence state |
|---|---|
| Picks | Code Verified / Staging DB Proof Pending |
| Rankings | Remediation In Progress / R0-R1 Staging Proof Pending |
| Groups | Functional / Production Verification Pending |
| AI | Functional / Production Verification Pending; UX refinement later |
| Payments | Audit Complete / Production Blocked |
| Creator economy | Audit Complete / Not Implemented |
| Production readiness | Core architecture is viable; launch is blocked by ranking remediation, payment safety, and staging proof |

## Audit documentation

- [Architecture](docs/architecture/README.md)
- [Backend capability ledger](docs/backend/README.md)
- [Backend master implementation plan](docs/backend/plans/MASTER_IMPLEMENTATION_PLAN.md)
- [Payments](docs/payments/README.md)
- [Rankings and picks](docs/rankings/README.md)
- [Creator economy](docs/creator-economy/README.md)
- [Groups](docs/groups/README.md)
- [Deployment](docs/deployment/README.md)
- [Audit index and system status](docs/system-audit/SYSTEM_STATUS_REPORT.md)
- [Monetization audit](docs/system-audit/MONETIZATION_AUDIT.md)
- [Payment flow diagrams](docs/system-audit/PAYMENT_FLOW.md)
- [Ranking and picks audit](docs/system-audit/RANKING_SYSTEM_AUDIT.md)
- [Production readiness](docs/system-audit/PRODUCTION_READINESS.md)
- [Missing features](docs/system-audit/MISSING_FEATURES.md)
- [Technical debt](docs/system-audit/TECHNICAL_DEBT.md)
- [Recommended next build order](docs/system-audit/RECOMMENDED_NEXT_BUILD_ORDER.md)

The older `STATUS.md`, `HANDOFF.md`, and `SPEC.md` describe historical plans and should not be treated as current implementation truth.

## Local development

Requirements: Node.js 20+, npm, and a fresh `.env` based on `.env.example`. Never reuse or commit credentials.

```bash
npm install
npm run dev
```

Development runs Vite plus the user and admin Express processes. Production uses the single server entry point:

```bash
npm run build
npm start
```

The production server mounts user and admin APIs, registers the Stripe webhook before JSON parsing, serves `dist/public`, and exposes `GET /api/health`.

## Verification

```bash
npx tsc --noEmit
npx vitest run
npm run build
npm audit --omit=dev
```

Audit baseline on June 21, 2026:

- TypeScript: pass
- Vitest: 25 files, 166 tests passed
- Production build: pass; main bundle is about 3.43 MB uncompressed / 766 KB gzip
- Dependency audit: 36 advisories (2 critical, 6 high, 28 moderate)

## Repository map

```text
src/                    React application
server/                 Express APIs, auth, jobs, services, webhooks
shared/                 Drizzle schemas and shared validation/types
migrations/             Baseline plus staged migrations
tests/                  Vitest and operational test scripts
docs/ui-audit/           Visual audit artifacts
docs/system-audit/       Current code-grounded platform audit
```

## Operational rules

- Work through reviewed branches and normal pushes; never force-push `main`.
- Treat schema declarations and migrations as separate from deployed database state.
- Never place fixture or fake audit data in the production database.
- Keep Stripe webhook signature verification and raw-body middleware ordering intact.
- Use `flag-icons` for countries and approved headshot/body imagery for fighters.
- Record product behavior in tests before enabling paid or prize-bearing workflows.
