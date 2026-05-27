# GRIT

**MMA intelligence + fantasy prediction platform.** Not a sportsbook. Fans compete on real fight cards using real data, real odds, and AI.

> 🕒 **Last Updated:** 2026-05-23 by Claudio (late night — landing page rewrite)
> 📍 **Current Status:** Phase 1 · Week 1 (Auth + Stack Provisioning) — scaffolding done, waiting on founder's provisioning sprint
> 🧪 **Build State:** 90/90 Vitest tests passing · Pipeline smoke 7/7 passing · Production build passes · audit 39→10 moderate · DB 52 tables on Supabase us-west-2

---

## New here? Read in this order:

1. **[`STATUS.md`](./STATUS.md)** — Live progress board. Where the project is RIGHT NOW. Updated after every work session. **Read this first.**
2. **[`HANDOFF.md`](./HANDOFF.md)** — Onboarding context. What GRIT is, how to boot locally, architecture rules, landmines.
3. **[`SPEC.md`](./SPEC.md)** — Phase 1 build plan (v2.1, blueprint-first). Part I product spec / Part II build plan / Part III reconciliation against code.
4. **`~/Downloads/grit-blueprint-v6.1.2-production.html`** — Master product blueprint. Ultimate source of truth.

**Second dev joining?** Multiple people work on this codebase. The founder switches between them (only one runs at a time). Read STATUS.md first to know exactly where the previous person left off — no remote git, coordination is via that doc.

Skip the rest of this README and start with `STATUS.md`.

---

## Recent Changes Log

Anyone reviewing should add a dated entry to the top whenever they ship something meaningful. Keep it tight — one line per session.

### 2026-05-26 - Cody
- Clerk CLI setup completed for app `app_3EGsEMT8R3SfiR84VAShHSOxW1c`; local Clerk env pulled without reading/printing `.env`, frontend and backend auth cut over to Clerk, sign-in/sign-up/user controls added, and verification passed (`clerk doctor`, typecheck, build, 90/90 tests, pipeline smoke 7/7).

### 2026-05-23 · Claudio (late night — landing page rewrite)
- ✅ Full rewrite of `public/locales/en/translation.json` — sharper copy, blueprint-correct positioning ("MMA intelligence, not a sportsbook"), Founder badge urgency baked in, mission-driven CTAs.
- ✅ Killed the wrong "Pro $9.99" tier from PricingSection (not in blueprint). Now shows Contender (free) + Challenger ($4.99) + separate **AI Token Packs** add-on row ($5/$10/$20) matching blueprint §18.
- ✅ Added 2 new landing sections: `FounderBadgesSection` (first 10/50/500/1000 scarcity) and `CreatorEconomySection` (legitimate pick marketplace, ends scam culture). A third "MissionSection" was added then immediately removed at founder's direction — surfaced private/internal vision content that shouldn't be customer-facing.
- ✅ Reordered landing flow: Hero → Social Proof → Core Features → How It Works → Event Picks → Showcase Fighters → Leaderboard → Creator Economy → AI Banner → Community → Founder Badges → Pricing → Mission → Footer CTA. "How It Works" now comes BEFORE Pricing (was after).
- ✅ Fixed wrong confidence-units copy ("1u-5u" model is OLD; blueprint says 1 unit per pick + confidence FLAGS none/green/yellow/red).
- ✅ All 90 Vitest tests still pass. Frontend typecheck clean on landing.

### 2026-05-23 · Claudio (late evening — dataintakegrit polish)
- ✅ Fixed broken CORS in `dataintakegrit/backend/app/main.py` (was `allow_origins=["*"]` + `allow_credentials=True` — invalid combo). Now uses explicit allow-list, configurable via `CORS_ORIGINS` env.
- ✅ Rewrote `dataintakegrit/backend/.env.example` to match real env vars used in code. Dropped stale `REPLICATE_API_KEY` + `FIRECRAWL_API_KEY` entries (never read). Added `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `CORS_ORIGINS`.
- ✅ Added "Tomorrow's Testing Checklist" section to top of `dataintakegrit/README.md` — prereqs, boot commands, 4 smoke checks, known landmines, error recovery.

### 2026-05-23 · Claudio (evening batch — 6 items)
- ✅ Wrote `docs/WEEK2_MIGRATION_REVIEW.md` — 30-second founder approval sheet confirming the 13-table Week 2 migration is safe (zero destructive ops, all FKs sound).
- ✅ Wired OneSignal rank-change notifications inside `createLeaderboardSnapshot` (compares against prior snapshot, pushes to changed users, skips gracefully without OneSignal keys).
- ✅ Wired OneSignal "Event Going Live" notification into admin event-status transition.
- ✅ Wired monthly bonus draw to cron (1st-of-month 00:05 UTC). Gated by `MONTHLY_BONUS_DRAW_ENABLED` env var until Week 2 migration applies. New `server/services/monthlyBonusDrawJob.ts` ties Cody's pure logic to live leaderboard/picks data.
- ✅ Built 7-step Onboarding flow (`src/user/components/OnboardingFlow.tsx`), replaced `WelcomeModal` in App.tsx. Blueprint §13 — Welcome / Profile / Picks / Scoring / Progression / Qualification / Dashboard CTA. Skippable.
- ✅ Verified Real Betting Tracker fully wired end-to-end (widget + TrackerTab toggle + `/api/me/stats` backend all already in place).
- ✅ Shipped 5 legal page skeletons at `src/legal/` (ToS, Privacy, Cookie, Creator Agreement, AUP). Routes mounted at `/tos`, `/privacy`, `/cookie`, `/creator-agreement`, `/aup`. Blueprint hard rules embedded; disclaimer "attorney review required before production."

### 2026-05-23 · Cody
- ✅ Hardened AI prompt context JSON parsing for fighter record/performance data; unit suite 90/90, type-check and build passing.
- ✅ Hardened admin event route validation/error typing and added explicit Express type imports; unit suite 90/90, type-check and build passing.
- ✅ Hardened admin pipeline/fight-resolution error handling from `any` to `unknown` without changing responses; unit suite 90/90, type-check and build passing.
- ✅ Widened outbound sync input typing and removed sync-call `as any` casts from event/fighter/fight-resolution paths; unit suite 90/90, type-check and build passing.
- ✅ Hardened pick failure metrics to use typed `req.user` in the live pick submission route; unit suite 90/90, type-check and build passing.
- ✅ Hardened AI route typing and added AI route-registration coverage; unit suite 90/90, type-check and build passing.
- ✅ Added founder key-injection placeholders/checklist, hardened admin data-pipeline route typing, and fixed `/api/admin/pipeline/health` route ordering; unit suite 89/89, type-check and build passing.
- ✅ Hardened fighter/admin/auth snapshot type touchpoints: fixed stale fighter route DB/schema imports, removed more safe `any` casts, and expanded route-registration coverage; unit suite 88/88, type-check and build passing.
- ✅ Cleaned avoidable raw SQL in `groupService.ts` by using Drizzle `inArray`/`desc`; unit suite 87/87, type-check and build passing.
- ✅ Added Express-backed group chat route tests for member load/send/deny paths; unit suite 87/87, type-check and build passing.
- ✅ Hardened `groupsRoutes.ts`: removed easy `req/group as any` casts and fixed missing `groupChat` import; unit suite 84/84, type-check, direct route import, and build passing.
- ✅ Removed easy `req.user as any` casts from settings/export/fight-note routes and auth tier guards; unit suite 84/84, type-check and build passing.
- ✅ Hardened `/api/activity/feed` with batched enrichment lookups, frontend-safe fallback shaping, and pure activity-feed tests; unit suite 84/84, type-check and build passing.
- ✅ Moved orphan user routes into `server/user/routes`, restored `/api/activity/feed` mounting, and added route-registration coverage; unit suite 78/78, build passing.
- ✅ Aligned dashboard/stats profit displays with canonical stored net-unit hundredths; unit suite 76/76, pipeline smoke 7/7, build passing.
- ✅ Fixed progression Grandmaster tier and 1-unit loss tolerance; unit suite 73/73, pipeline smoke 7/7, build passing.
- ✅ Ran safe dependency audit fix: 39 vulnerabilities reduced to 10 moderate; force/breaking fixes deferred for Claudio review.
- ✅ Replaced route-local PST/EST pick-lock parsing with tested UTC-first fight lock helper; unit suite now 69/69 and build passing.
- ✅ Drafted monthly bonus draw service and unit coverage; payout recording stays dormant until `cash_payouts` is approved live.
- ✅ Drafted founder badge atomic allocation service and unit coverage; service is migration-safe/dormant until `founder_badge_slots` is approved live.
- ✅ Rewrote scoring from flat points to moneyline net units end-to-end; unit suite 52/52, pipeline smoke 7/7, production build passing.
- ✅ Shipped end-to-end pipeline smoke test (`npm run smoke:pipeline`) and fixed leaderboard snapshot `varchar = uuid` join bug; smoke now passes 7/7 against Supabase.
- ✅ Cody shipped the In-App Rules Tab: `/rules` route, main navigation entry, casino-style rules reference UI, and rules-content Vitest coverage.

### 2026-05-23 · Claudio
- ⚠️ **Week 2 schema staged (13 new tables) — PENDING FOUNDER REVIEW.** Migration file at `migrations/0001_week2_creator_token_rating_antifraud.sql`. **Do NOT run `npx drizzle-kit migrate` until founder approves.**
- ✅ Vitest suite expanded to 49 tests (was 7). New: 24 picks/qualification + 18 progression tests.
- ✅ `progressionRoutes.ts` wired (was a 4-line stub). Three new live endpoints: `GET /api/me/progression`, `/api/me/progression/streak`, `/api/me/keys`.
- ✅ Flag budget hardcoded TODO at `FightDetail.tsx:525-526` fixed. Now reads from extended `/api/picks/event/:eventId/qualification` response (which now also returns `flagBudget`, `flagsUsed`, `totalFights`).
- ✅ SPEC v2.1 self-audit completed. 9 gaps fixed including the tier-enum data model error (Creator is a role, NOT a tier — DB enum is `free|challenger`).
- ✅ STATUS.md simplified to handoff doc (no collision protocol — one dev at a time per founder's direction).
- ✅ Architecture review: 4 critical Phase 1 flags + 6 medium Phase 2 flags documented in STATUS.md.

### 2026-05-22 · Claudio
- ✅ Clerk SDK scaffolding shipped (5 files: `server/auth/clerk.ts`, `server/api/webhooks/clerkWebhook.ts`, `src/shared/hooks/use-auth-clerk.ts`, `src/auth/SignInPage.tsx`, `src/auth/SignUpPage.tsx`). Cutover blocked on founder's Clerk keys.
- ✅ SPEC v2.0 → blueprint-first rewrite (47 sections). Old code-first SPEC archived to `docs/_archive/`.
- ✅ HANDOFF.md written (cold-pickup onboarding).
- ✅ Founder provisioning checklist delivered (7 services, ~30 min of dashboard work).

### 2026-05-21 · Claudio (Week 0 closeout)
- ✅ 24 cleanup items shipped. See SPEC §4.1 for full list.
- ✅ Production DB went 30 → 52 tables. Drizzle baseline regenerated. Old broken migrations archived.
- ✅ Dead code removed (statsIngest verified alive — kept; 12 unused frontend components + 5 empty dirs deleted).
- ✅ 5 critical runtime bugs fixed (scoringService, notificationService, groupService, App.tsx Groups routes, Python reconciler).
- ✅ Anthropic model bumped to `claude-sonnet-4-6`. `expirationService` wired to daily cron. Hardcoded admin email removed.
- ✅ Vitest stood up with 7 baseline scoring tests.
- ✅ `BrandAsset` placeholder + `public/brand/` drop zone ready for Fiverr SVGs.

---

## Quick Stack Summary

| Layer | Tech | Status |
|---|---|---|
| Backend | Node 20+, Express, TypeScript | ✅ Live |
| Frontend | React 18, Vite, Tailwind, shadcn/ui | ✅ Live |
| ORM / DB | Drizzle + PostgreSQL via Supabase (us-west-2) | ✅ Live |
| Auth | Replit OIDC → Clerk | 🟡 Migrating Week 1 (scaffolding done) |
| Payments | Stripe + Stripe Connect | 🟡 Connect added Week 5 |
| Jobs | node-cron + pg-boss → Inngest | 🟡 Inngest joins Week 8 |
| AI | Anthropic `claude-sonnet-4-6` + OpenAI GPT-4o-mini | ✅ Live |
| Push Notifications | OneSignal | 🟡 Partial — full wiring Week 4 |
| Email | Resend | 🟡 Wires Week 1 |
| Cache / Rate Limit | Upstash Redis | 🟡 Wires Week 1 |
| Analytics | PostHog | 🟡 Wires Week 1 |
| Observability | Sentry | ✅ Live (initialized when DSN present) |
| Testing | Vitest | ✅ 87 tests passing |

Two repos work together:
- **gritapp** (this repo) — main user app
- **dataintakegrit** (`../dataintakegrit`) — Python pipeline scraping MMA data into gritapp via webhook. Parked until Phase 2 unless something breaks.

---

## Boot

```bash
npm install
npm run test       # 90 Vitest tests
npm run dev        # frontend + user-server + admin-server
```

Production entry: `npm start` → `tsx server/production.ts` (single-port deploy for Railway).

Full setup details in `HANDOFF.md`.

> ⚠️ **Important:** Do NOT run `npx drizzle-kit migrate` until founder reviews the pending Week 2 schema migration (`migrations/0001_week2_creator_token_rating_antifraud.sql`). 13 new tables staged but not approved. STATUS.md has the details.

## Founder Key Injection

When Jovan is ready to provision services, add real values in `.env` using [`.env.example`](./.env.example) as the map. The placeholders are intentional and safe to leave blank today.

Priority order:

1. `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`, `VITE_CLERK_PUBLISHABLE_KEY` — unblocks Week 1 auth cutover testing.
2. `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` — unblocks real push notification delivery tests.
3. `DATA_ENGINE_API_URL`, `DATA_ENGINE_API_KEY`, `WEBHOOK_KEY` — unblocks real `dataintakegrit` -> `gritapp` ingestion testing.
4. `STRIPE_CONNECT_CLIENT_ID` — unblocks creator payout/Connect work later.
5. `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `POSTHOG_API_KEY` — unblocks cache/rate limit, email, and analytics wiring.

After injecting keys, run `npm run test`, `npm run build`, and the relevant smoke path from `STATUS.md`. Still do not run migrations until the staged Week 2 SQL is explicitly approved.

---

## Project Structure

See `HANDOFF.md` — "Repository Map — What Lives Where" for the full tree with annotations on what each folder/file is for.

---

## Architecture Rules

All new code follows the principles in `HANDOFF.md` — "Architecture Principles Going Forward". Summary:

- Schema is source of truth for DB. No `db:push --force` against prod. Use `drizzle-kit generate` → review SQL → founder approves → `drizzle-kit migrate`.
- Routes are thin. Services own logic. Components are dumb.
- Config in `server/config/env.ts`. Never raw `process.env.X` in services.
- No silent security fallbacks. Throw at boot if critical env missing.
- Leave files cleaner than you found them.
- **No remote git.** Local-only. Never `git push`, never `git remote add`.

---

## Docs Layout

```
gritapp/
├── README.md           # You are here — entry point + recent changes log
├── STATUS.md           # LIVE progress board. Read first.
├── HANDOFF.md          # Cold-pickup onboarding
├── SPEC.md             # Phase 1 plan (v2.1 blueprint-first)
└── docs/
    └── _archive/
        ├── SPEC_v1.2_code-first.md   # Old code-first SPEC (superseded by v2.0+)
        ├── README_pre_phase1.md      # Pre-cleanup ~1300-line README (outdated)
        └── (17 other archived docs)  # Pre-Phase-1 audits, week summaries, etc.
```

The pre-Phase-1 docs are kept for historical reference only. **Do not trust them** for current behavior — `STATUS.md` (current), `HANDOFF.md` (onboarding), `SPEC.md` (plan), and the code are the source of truth.

---

## License

Copyright © 2026 Smart Click Agency. All rights reserved.
