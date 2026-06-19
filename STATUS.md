# GRIT — Live Status

> **Latest update 2026-06-19 by Cody:** Enterprise UI remediation closed both P0 first-session blockers and the primary P1 batch: onboarding stays mounted through all seven steps, the new-user dashboard has a safe zero state, mobile Settings uses a compact section picker, the mobile landing header no longer collides, direct Clerk routes work while logged out, rankings preserve rank order, fake live/prize/ad scaffolding is removed, country flags use SVGs, and stale 1u-5u locale copy was replaced. Verification: `npx tsc --noEmit`, `npm run test` = 90/90, locale JSON validation, and `npm run build`.
> **The handoff doc.** Whoever opens the repo next picks up from here. Only one dev works at a time. No collision concerns — just a clean "what's done, what's next" baton pass.
>
> Different from `HANDOFF.md` (cold-pickup onboarding) and `SPEC.md` (the build plan).

---

## Snapshot — Updated 2026-06-19 by Cody

| Field | Value |
|---|---|
| **Current Phase** | Phase 1 |
| **Current Week** | Week 1 — Auth + Stack Provisioning |
| **Week 1 Status** | Scaffolding done. Cutover waiting on founder's Clerk keys. |
| **Phase 1 Overall** | Week 0 complete · Week 1 ~30% (scaffolding only) |
| **Last Build/Test Run** | ✅ All green · **90/90 Vitest tests pass** across 11 files · pipeline smoke 7/7 passing · production build passes · `npx tsc --noEmit` passes · audit reduced 39 → 10 moderate |
| **Production DB** | Supabase us-west-2 · 52 tables · 0 users · fresh Drizzle baseline |
| **Focus Area** | **`gritapp/` (main app) ONLY.** `dataintakegrit/` is parked until Phase 2 unless founder flags an issue. |
| **No-Remote Rule** | ✅ Locked. Zero remote git. Local-only working tree. |

---

## Pick Up Here (next dev or future session)

### 🧭 Ownership Model (revised 2026-05-23 by Claudio after founder feedback)

**Work is PRIORITY-DRIVEN, not layer-driven.** Either dev picks up whatever
moves the product forward fastest. Cody is a dev, not a UI specialist —
he can and should touch backend.

| Role | Person | Scope |
|---|---|---|
| Senior CTO / Chief | Claudio | Architecture decisions, schema design, scoring/auth/Stripe rewrites, migration approval, code review |
| Dev | Cody | Implementation work pulled from the priority queue. Can pick backend OR frontend tasks. |
| Migrations (the only hard lane) | Claudio only | Never run `drizzle-kit migrate` without explicit Claudio sign-off |

**Why this matters:** the current core pipeline (data → picks → scoring →
progression → notifications) is ~50% incomplete or broken. UI work on top
of an unproven pipeline is wasted effort. Backend pipeline gets priority
until it's smoke-tested end-to-end. UI polish (Rules Tab, Onboarding,
Betting Tracker widget) is Week 8 work and waits.

**Rule:** if either dev is unsure whether to take a task, leave a note in
"Open Questions" — Claudio reprioritizes.

### Active Work
- Enterprise UI audit remediation is in progress on `codex/ui-audit-2026-06-18`; P0 and primary P1 findings are fixed. Remaining visual sign-off needs isolated populated fixtures and a Clerk dashboard application-name update.

### Enterprise UI remediation (2026-06-19 by Cody)
- Fixed the new-user dashboard null-badge crash and onboarding step-2 unmount bug.
- Reskinned onboarding to GRIT gold, replaced emoji identity choices with photo upload and SVG flags, removed fabricated chat/live/prize content, hid empty ad scaffolding, and rewrote operator-only empty-state copy.
- Rebuilt mobile Settings navigation, simplified the mobile landing header, restored logged-out `/sign-in` and `/sign-up`, kept leaderboard rows in canonical rank order, and corrected stale confidence-unit translations across supported locales.
- Audit plan, 21-screen visual record, and prioritized report live in `docs/ui-audit/`.

### Landing Page Rewrite (late 2026-05-23 by Claudio — full CTO authority exercised)
- ✅ **Full rewrite of `public/locales/en/translation.json`** — sharper copy throughout. Hero says "PROVE YOUR FIGHT IQ. REAL DATA. REAL ODDS. REAL RANK." with subtitle "No betting. No luck. Just your knowledge against the world." Mission-driven, blueprint-correct positioning.
- ✅ **Killed the phantom "Pro $9.99" tier** from PricingSection — not in blueprint. Now Contender (free) + Challenger ($4.99) only.
- ✅ **Added AI Token Packs row to Pricing** ($5/100 STARTER, $10/220 STANDARD, $20/500 POWER with "Best Value" badge) per blueprint §18. Visually separated from subscription tiers so "AI is an add-on, not the headline feature."
- ✅ **3 new landing sections built:**
  - `FounderBadgesSection.tsx` — scarcity-driven (first 10/50/500/1000, color-coded by tier, permanent-on-cancel messaging)
  - `CreatorEconomySection.tsx` — purple-themed, ends the MMA pick-selling scam culture pitch, full revenue split detail
  - ~~`MissionSection.tsx`~~ — created then REMOVED at founder's direction. Surfaced private/internal vision in a customer-facing section. Will not be re-added without explicit founder request.
- ✅ **Section reorder for narrative flow:** Hero → Social Proof → Core Features → How It Works → Event Picks → Showcase Fighters → Leaderboard → Creator Economy → AI Banner (Phase 3) → Community → Founder Badges → Pricing → Mission → Footer CTA. "How It Works" moved BEFORE Pricing (was after — bad UX).
- ✅ **Fixed factual error in copy** — "1u cautious to 5u max conviction" was OLD scoring model. Replaced with blueprint's 1 unit per pick + confidence flags (none/green/yellow/red).
- ✅ **Sharper CTAs throughout** — "ENTER THE ARENA" → "Claim Your Spot" with Founder badge urgency hook in the hero badge.
- ✅ All 90 Vitest tests still pass. Frontend typecheck clean on the 3 new components + PricingSection rewrite.

### dataintakegrit Polish (late 2026-05-23 by Claudio)
- ✅ CORS fixed in `backend/app/main.py` — wildcard + credentials combo (browsers reject) replaced with explicit allow-list configurable via `CORS_ORIGINS` env. Default covers local dev (`localhost:5000`, `localhost:5173`, plus 127.0.0.1 variants).
- ✅ `backend/.env.example` rewritten to match real env vars used in code. Removed stale `REPLICATE_API_KEY` and `FIRECRAWL_API_KEY` (never read). Added missing `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `CORS_ORIGINS`. Each var documented with which Agent uses it.
- ✅ `dataintakegrit/README.md` updated — added "Tomorrow's Testing Checklist" section at the top with prereqs, boot commands, 4 smoke-test steps (health → connection test → dashboard load → manual ingestion end-to-end), known landmines (`MANUAL_INGESTION_MODE`, Agent 7 skipped, no SSL verify, plaintext API keys), and error recovery tips.
- ℹ️ Note: founder will need to `pip install -r backend/requirements.txt` before first boot (FastAPI + supabase-py + anthropic + openai + Pillow + beautifulsoup4 etc.).

### Last Thing Shipped (Claudio batch 2026-05-23 evening — 6 items)
- ✅ **Week 2 migration review document** at `docs/WEEK2_MIGRATION_REVIEW.md`. 30-second approval sheet for founder — confirms 13 new tables, zero destructive ops, all FK constraints sound, safe to apply.
- ✅ **OneSignal rank-change notifications** wired into `createLeaderboardSnapshot`. Compares against previous snapshot of same scope; pushes "Rank Up/Down" to changed users. Gracefully skips without OneSignal keys.
- ✅ **OneSignal "Event Going Live" notification** wired into admin event-status transition (`adminEventRoutes.ts`).
- ✅ **Monthly bonus draw cron** wired at 1st-of-month 00:05 UTC. Gated by `MONTHLY_BONUS_DRAW_ENABLED` env var (flip to 'true' after Week 2 migration applies). New `server/services/monthlyBonusDrawJob.ts` builds candidate list from leaderboard/picks/events tables and delegates to Cody's pure monthlyBonusService.
- ✅ **7-step Onboarding flow** built at `src/user/components/OnboardingFlow.tsx`. Replaces single `WelcomeModal`. Skippable, progress bar, all 7 blueprint §13 steps (Welcome / Profile / Picks / Scoring / Progression / Qualification / Dashboard CTA). Profile step saves via existing `PATCH /api/me`.
- ✅ **Real Betting Tracker widget** verified end-to-end — widget, settings toggle (TrackerTab), and `/api/me/stats` backend all already wired. Confirmed working, no changes needed.
- ✅ **5 legal page skeletons** at `src/legal/`: TermsOfService, PrivacyPolicy, CookiePolicy, CreatorAgreement, AcceptableUsePolicy. Each includes blueprint hard rules (refund policy, founder badge permanence, AI token rules, creator splits). Routes mounted at `/tos`, `/privacy`, `/cookie`, `/creator-agreement`, `/aup`. Disclaimer banner: "skeleton — attorney review required before production."

### Cody's Earlier Today Wins
- ✅ **AI prompt context typing hardening shipped.** Removed local `any` usage from `server/ai/promptBuilder.ts` by typing fighters/fight history from schema and reading legacy `record`/`performance` JSON through unknown-safe helpers. This preserves AI prediction context shape while making missing/malformed JSON values fall back to zeros/nulls cleanly. Verification: prompt builder direct import passes; `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Admin event route typing hardening shipped.** Added explicit Express type imports in `server/admin/routes/adminEventRoutes.ts`, replaced upload `catch (error: any)` with unknown-safe error messaging, changed event validation details from `(error as any).errors` to Zod `.issues`, and added a typed card-placement guard instead of `fight.cardPlacement as any`. Verification: admin event route direct import passes; `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Admin route unknown-safe error handling shipped.** Replaced `catch (error: any)` in `server/admin/routes/adminFightResolutionRoutes.ts` and the pipeline apply handler in `server/admin/routes/adminDataPipelineRoutes.ts` with `unknown`-safe message helpers. Preserved existing response behavior for `FIGHT_NOT_FOUND`, `FIGHT_ALREADY_FINALIZED`, and pipeline apply error details. Verification: touched route direct imports pass; `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Outbound sync typing cleanup shipped.** Widened public sync function inputs in `server/services/outboundSyncService.ts` from `Record<string, unknown>` to `object`, then converts to a record internally before snake-case mapping/filtering. This removed sync-call `as any` casts from admin fighter create/update, admin event create/update, fight result post-resolution sync, and data-engine event-fight sync paths without changing outbound payload behavior. Verification: outbound sync and fight-resolution route direct imports pass; `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Pick failure metric typing hardening shipped.** Removed the remaining `(req as any).user?.id` from the live pick submission failure path in `server/user/routes/picksRoutes.ts`; failed pick metrics now use typed `req.user?.id ?? 'unknown'` without changing pick behavior. Verification: `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **AI route typing hardening shipped.** Removed route-level `req: any`, `req.user as any`, and prediction-path `catch (error: any)` from `server/ai/aiRoutes.ts`; prediction errors now use an `unknown`-safe message helper and OpenMeter tracking is explicitly fire-and-forget. Added AI endpoint inventory coverage to `tests/unit/user-route-registration.test.ts`. Verification: AI route direct import passes; `npm run test` = 90/90 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Admin data-pipeline typing + founder key-injection placeholders shipped.** Removed safe leftover casts in `server/admin/routes/adminDataPipelineRoutes.ts` by adding a typed data-pipeline status guard and using typed `req.user.id` for approval/rejection/config writes. Review caught and fixed a route-ordering bug where `/api/admin/pipeline/:status` could swallow `/api/admin/pipeline/health`; health is now registered first and covered by route-registration regression coverage. Added explicit founder-facing placeholder comments to `.env.example` for Clerk, OneSignal, data engine webhook, Stripe Connect, Upstash, Resend, and PostHog keys, plus a README "Founder Key Injection" checklist with priority order and post-injection verification commands. Verification: admin data-pipeline route direct import passes; `npm run test` = 89/89 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Fighter/admin/auth snapshot type hardening shipped.** Fixed stale DB/schema imports in `server/user/routes/fighterRoutes.ts` by replacing runtime dynamic imports with correct top-level imports, removed safe leftover `any` casts from fighter correction submission, auth tier middleware, admin export audit logging, dashboard leaderboard net-unit reads, and leaderboard snapshot writes. Updated `leaderboardSnapshots.rankings` JSON typing to reflect net-unit snapshots, and expanded route-registration coverage for fighter routes. Verification: fighter route direct import passes; `npm run test` = 88/88 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Group service Drizzle cleanup shipped.** Replaced avoidable raw SQL in `server/services/groupService.ts`: the user-group lookup now uses `inArray(groups.id, groupIds)` instead of hand-built `sql.join/sql.lit`, and public group browsing now uses `desc(groups.createdAt)` instead of raw order SQL. Kept `count(*)` as raw SQL because it is the normal aggregate pattern. Verification: group service direct import passes; `npm run test` = 87/87 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Group chat route coverage shipped.** Added `tests/unit/groups-routes.test.ts`, an Express-backed route test with mocked auth/group service/db coverage for loading group chat messages, sending trimmed messages, and denying non-member access. This directly exercises the handlers that previously referenced `groupChat`, so missing route dependencies are harder to miss. Verification: `npm run test` = 87/87 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Groups route hardening shipped.** Removed easy `req as any` and `group as any` casts from `server/user/routes/groupsRoutes.ts` now that Express user typing and group service return types are available. Also fixed a latent route-load bug by importing `groupChat`, which the chat endpoints referenced without importing. Verification: `npx tsx -e "import('./server/user/routes/groupsRoutes.ts').then(() => console.log('groups route imports ok'))"` passes; `npm run test` = 84/84 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Small route type hardening shipped.** Removed redundant `req.user as any` casts from user settings, export, fight-note routes, and auth tier/feature guards now that `server/types/express.ts` provides the user shape. Review pass also trimmed stale imports in the touched route files. This was intentionally scoped to low-risk files; larger route casts remain for future touch-when-open cleanup. Verification: `npm run test` = 84/84 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Activity feed hardening shipped.** Added `server/services/activityFeedService.ts` with pure helpers for peer-member dedupe, fighter-name fallback formatting, frontend-safe method/unit/createdAt defaults, and feed item shaping. Updated `/api/activity/feed` to batch-load fighters, fights, and events instead of doing per-pick enrichment queries. Added `tests/unit/activity-feed.test.ts`. Verification: `npm run test` = 84/84 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Orphan user route cleanup shipped.** Moved pick distribution and activity feed route modules from `server/routes/` into `server/user/routes/`, updated `server/user-server.ts` imports, and fixed the activity feed route so `/api/activity/feed` is actually mounted under `/api/activity`. Review pass also replaced the pick-distribution raw `ANY(...)` fighter lookup with Drizzle `inArray` plus an empty-list guard. Added `tests/unit/user-route-registration.test.ts` to keep both mounts visible. Verification: `npm run test` = 78/78 passing; `npx tsc --noEmit` passes; `npm run build` passes.
- 2026-05-23 — **Net-unit display/API drift cleanup shipped.** Added `server/utils/netUnits.ts` so user-facing aggregate routes read stored `points_awarded` hundredths as the source of truth instead of recomputing profit from odds. Updated `/api/me/dashboard` betting stats/recent activity and `/api/me/stats` pick/per-event totals. Added `tests/unit/net-units.test.ts`. Verification: `npm run test` = 76/76 passing; `npm run build` passes; `npm run smoke:pipeline` = 7/7 passing.
- 2026-05-23 — **Progression Grandmaster + 1-unit tolerance shipped.** Added `grandmaster` to `config.BADGE_TIERS`, added `ROI_LOSS_TOLERANCE_UNITS = 1`, and centralized progression rule application so per-event/monthly paths both treat losses from 0u to -1u as neutral while losses beyond -1u regress. Added pure coverage for Grandmaster ladder and loss tolerance in `tests/unit/progression.test.ts`. No migration needed because `users.progress_badge` is varchar(20). Verification: `npm run test` = 73/73 passing; `npm run build` passes; `npm run smoke:pipeline` = 7/7 passing.
- 2026-05-23 — **Safe dependency audit fix shipped.** Ran plain `npm audit fix` only; reduced audit from 39 vulnerabilities (1 critical, 14 high, 23 moderate, 1 low) to 10 moderate. Verified `npm run test` = 69/69 and `npm run build` passes on Vite 5.4.21. Did **not** run `npm audit fix --force`: npm proposes breaking/downgrade paths (`vite@8.0.14`, `drizzle-kit@0.18.1`, `@google-cloud/storage@5.20.4`). Remaining audit items are documented in Open Questions.
- 2026-05-23 — **Pick lock timezone cleanup shipped.** Moved per-fight lock parsing out of `picksRoutes.ts` into `server/utils/fightLockTime.ts`, defaulted timezone-less scheduled fight strings to UTC instead of PST, added support for explicit UTC/numeric offsets, and kept legacy PST/PDT/EST/etc. abbreviation support for existing admin-created cards. Added `tests/unit/fight-lock-time.test.ts` for UTC defaulting, numeric offsets, legacy abbreviations, and malformed input. Verification: `npm run test` = 69/69 passing; `npm run build` passes.
- 2026-05-23 — **Monthly Bonus Draw service drafted.** Added `server/services/monthlyBonusService.ts` with fixed $550 pool rules: $300/$100/$50 to top-3 net-unit ROI users qualified for 2+ events, plus two $50 random qualified Challenger/current-paid users. Added pending `cash_payouts` recording helper, kept dormant until staged payout table is approved/applied. Added `tests/unit/monthly-bonus.test.ts` for eligibility, top-3 ranking, random draw, fixed total, and earliest full-card-lock tiebreaker. Verification: `npm run test` = 64/64 passing; `npm run build` passes.
- 2026-05-23 — **Founder badge atomic allocation service drafted.** Added `server/services/founderBadgeService.ts` with first-1,000 global slot planning, permanent existing-slot detection, conflict-safe `INSERT ... ON CONFLICT DO NOTHING RETURNING`, and retry handling for concurrent subscribers. Added `tests/unit/founder-badge.test.ts` for Founder I-IV boundaries and sold-out behavior. Not wired to Stripe yet because `founder_badge_slots` is in the staged Week 2 migration and does not exist live until approved. Verification: `npm run test` = 58/58 passing; `npm run build` passes.
- 2026-05-23 — **Scoring rewrite shipped: flat points → net units.** Added pure scoring coverage for Blueprint §7 moneyline net-unit math, rewired `finalizeFightResult` to store signed net-unit hundredths in legacy `points_awarded`, fixed streak logic to use freshly-scored picks, tightened clean-sweep eligibility to correct no-flag/green picks, and made leaderboard snapshots read the stored score instead of recomputing from odds. Updated pipeline smoke expectation to `1000` for ten +100 wins. Verification: `npm run test` = 52/52 passing; `npm run smoke:pipeline` = 7/7 passing against Supabase; `npm run build` passes.
- 2026-05-23 — **End-to-end pipeline smoke test shipped + leaderboard snapshot bug fixed.** Added `npm run smoke:pipeline`, which seeds disposable `CODY_SMOKE_*` data, finalizes 10 fight results through `finalizeFightResult`, verifies scoring, fight history, clean-sweep key, event progression, leaderboard snapshot, and notification invocation, then cleans up. First run found a real `varchar = uuid` failure in `createLeaderboardSnapshot`; fixed both joins in `server/services/leaderboardService.ts` with the existing `user_picks.fight_id::uuid = event_fights.id` pattern. Verification: pipeline smoke 7/7 passing against Supabase; `npm run test` = 52/52 passing.
- 2026-05-23 — **In-App Rules Tab shipped.** Added `/rules` route, main navigation entry, casino-style rules reference UI, English nav labels, and `tests/unit/rules-content.test.ts` coverage for blueprint section inventory, fixed participation table, and flag states. Verification: `npm run test` = 52/52 passing across 4 files; `npm run build` passes.
- 2026-05-23 — **Vitest tests for qualification + progression endpoints.** 42 new pure-logic tests (24 picks-qualification + 18 progression). Total suite now 49 tests passing across 3 files. Caught a real edge-case bug in `config.getRequiredPicks` (negative budget for sub-10-fight cards) — documented in test, marked for Phase 2 polish. Pattern is reusable — Cody can mirror this shape for other endpoints.
- 2026-05-23 — **🚨 Week 2 schema DRAFT — PENDING FOUNDER REVIEW (DO NOT RUN MIGRATIONS).** 13 new tables added to `shared/schema.ts` under a clearly-marked block. Migration SQL generated at `migrations/0001_week2_creator_token_rating_antifraud.sql` (224 lines). Journal entry exists. **`npx drizzle-kit migrate` WILL APPLY these tables — do not run it until founder signs off.**

   Tables added:
   - Token economy: `token_packs`, `token_balances`, `token_transactions`, `token_feature_costs`
   - Creator economy: `creator_profiles`, `creator_subscriptions`, `creator_donations`, `chat_sessions`
   - Live rating: `fighter_ratings` (5 criteria + 5-layer anti-spam metadata)
   - Anti-fraud: `device_fingerprints`, `multi_account_flags`
   - Founder badges: `founder_badge_slots` (atomic allocation pattern)
   - Compliance: `legal_acceptances`, `cash_payouts` (1099-NEC tracking)

- 2026-05-23 — **Flag budget hardcoding fix.** `FightDetail.tsx:525-526` no longer uses literals `flagBudget={5}` `flagsUsed={0}`. Extended `GET /api/picks/event/:eventId/qualification` to also return `flagBudget`, `flagsUsed`, `totalFights`.
- 2026-05-23 — **`progressionRoutes.ts` wired (was a 4-line stub).** Three new endpoints live:
  - `GET /api/me/progression` — starLevel, progressBadge, currentStreak, maxStreak, keysCount, keysUntilGoldKey, hasGoldKey, nextBadge, starsToNextBadge
  - `GET /api/me/progression/streak` — fresh streak calc on demand
  - `GET /api/me/keys` — full keys collection list
- 2026-05-23 — SPEC v2.1 self-audit. Found and fixed 9 gaps including the tier enum data model error (Creator is a role, not a tier). SPEC is now 1,286 lines, 47 sections + §32a.
- 2026-05-23 — STATUS.md simplified to handoff doc (no collision protocol — one dev at a time).

### 🚨 Important For The Next Dev (Cody / Codex)
- **DO NOT run `npx drizzle-kit migrate`** until founder reviews `migrations/0001_week2_creator_token_rating_antifraud.sql` and approves. Pending tables: token economy, creator economy, fighter ratings, anti-fraud, founder slots, legal acceptances, payouts.
- The schema file `shared/schema.ts` already imports the new types — code that uses them will compile; the tables just don't exist in the DB yet.
- UI tasks are paused for now. Pipeline tasks below have priority; Week 2 tables still must not be migrated without approval.

### Current Priority Queue — Pipeline First
Revised 2026-05-23 after founder feedback. Work is no longer split by frontend/backend layer. The next dev should pull the highest-impact pipeline task that is not blocked.

| # | Task | Effort | Why now |
|---|---|---|---|
| 1 | ~~End-to-end smoke test of current pipeline~~ | ✅ DONE 2026-05-23 | Added `npm run smoke:pipeline`; current disposable-data path passes 7/7 |
| 2 | ~~Rewrite scoring engine: flat points → net units~~ | ✅ DONE 2026-05-23 | Net-unit scoring is wired through finalization, leaderboard snapshots, unit tests, and smoke. |
| 3 | **Wire OneSignal notification triggers properly** | BLOCKED | Jovan confirmed OneSignal keys are not available yet. Existing smoke only verifies notification code paths are invoked. |
| 4 | ~~Founder badge atomic allocation service~~ | ✅ DONE 2026-05-23 | Service/tests drafted; not wired until staged Week 2 migration is approved/applied. |
| 5 | ~~Monthly bonus draw service~~ | ✅ DONE 2026-05-23 | Selection and pending payout-recording service drafted; cron/Inngest/admin wiring waits on `cash_payouts` migration approval. |
| 6 | **Token economy service layer** | BLOCKED | Depends on pending Week 2 migration approval before any DB-backed runtime use. |
| 7 | ~~`npm audit fix` + review vulnerabilities~~ | ✅ DONE 2026-05-23 | Safe fix reduced 39 → 10 moderate; force fixes deferred for dependency-owner review. |
| 8 | ~~Replace hardcoded PST/EST time zone map in `picksRoutes.ts:39-44`~~ | ✅ DONE 2026-05-23 | Route now uses tested UTC-first helper with numeric offset and legacy abbreviation support. |
| 9 | ~~Progression Grandmaster + 1-unit tolerance~~ | ✅ DONE 2026-05-23 | Config/rules updated; tests/build/smoke green. |
| 10 | ~~Align dashboard/stats displays with stored net units~~ | ✅ DONE 2026-05-23 | User-facing aggregate APIs now read `points_awarded` hundredths instead of recomputing from odds. |
| 11 | ~~Move orphan `server/routes` user modules~~ | ✅ DONE 2026-05-23 | `picksDistribution` and `activityFeed` now live under `server/user/routes`; `/api/activity/feed` is mounted and covered. |
| 12 | ~~Harden `/api/activity/feed` query shaping~~ | ✅ DONE 2026-05-23 | Activity feed now batch-loads enrichment data and has pure helper coverage for dedupe/fallback/frontend-safe response shaping. |
| 13 | ~~Small route type hardening~~ | ✅ DONE 2026-05-23 | Removed easy `req.user as any` casts from low-risk user/auth routes; full type-check remains green. |
| 14 | ~~Groups route hardening~~ | ✅ DONE 2026-05-23 | Removed easy groups route casts and fixed missing `groupChat` import so the route module loads directly. |
| 15 | ~~Group chat route coverage~~ | ✅ DONE 2026-05-23 | Express-backed tests now cover group chat load/send/deny paths with mocked auth/service/db. |
| 16 | ~~Group service Drizzle cleanup~~ | ✅ DONE 2026-05-23 | Replaced avoidable raw SQL in group lookups/order with Drizzle helpers while keeping aggregate `count(*)`. |
| 17 | ~~Fighter/admin/auth snapshot type hardening~~ | ✅ DONE 2026-05-23 | Fixed a stale fighter route import path, removed safe leftover casts, and added fighter route registration coverage. |
| 18 | ~~Admin data-pipeline typing + founder key-injection placeholders~~ | ✅ DONE 2026-05-23 | Hardened admin pipeline status/user typing and documented exactly where founder service keys go tomorrow. |
| 19 | ~~AI route typing hardening~~ | ✅ DONE 2026-05-23 | Removed easy AI route casts and added route inventory coverage for prediction/model endpoints. |
| 20 | ~~Pick failure metric typing hardening~~ | ✅ DONE 2026-05-23 | Removed the last easy pick-route request cast in the failure metric path. |
| 21 | ~~Outbound sync typing cleanup~~ | ✅ DONE 2026-05-23 | Widened sync service inputs and removed sync-call casts from event/fighter/fight-resolution paths. |
| 22 | ~~Admin route unknown-safe error handling~~ | ✅ DONE 2026-05-23 | Removed unsafe `catch (error: any)` in pipeline apply and fight resolution handlers. |
| 23 | ~~Admin event route typing hardening~~ | ✅ DONE 2026-05-23 | Removed easy validation/error casts from event create/upload paths. |
| 24 | ~~AI prompt context typing hardening~~ | ✅ DONE 2026-05-23 | Removed local prompt-builder casts around fighter record/performance JSON. |

**UI work paused:** 7-step onboarding and Betting Tracker widget are deferred until the backend pipeline is blueprint-correct.

### Open Questions (cross-owner gaps surface here)

- 2026-06-19 — Cody — Clerk's direct sign-in page currently says "Sign in to My Application." Rename the Clerk application to **GRIT** in the Clerk Dashboard; this is dashboard configuration, not a frontend code string. — needs: Jovan

- 2026-05-23 — Cody review note — Manual odds entry path exists (`AdminOddsEditor` → `PUT /api/admin/fights/:fightId/odds`) and correctly updates `event_fights.odds`, which the pick route uses to lock odds at submission. However, this manual admin path does **not** currently insert into `fight_odds_history`; only the data-engine odds path does. Core picks/scoring still work, but manual line movement history will be incomplete unless we add a history insert on admin odds save. Recommendation: add a small backend patch before relying on line-movement analytics. — needs: Cody/Claudio
- 2026-05-23 — Cody — OneSignal delivery itself is not proven because `ONESIGNAL_APP_ID` / `ONESIGNAL_API_KEY` are not configured. Smoke verifies notification code paths are invoked by counting the existing "OneSignal not configured" skip logs. — needs: Jovan
- 2026-05-23 — Cody — Founder badge service uses the staged `founder_badge_slots` table. Keep it dormant until Claudio/Jovan approve and apply `0001_week2_creator_token_rating_antifraud.sql`; after that, wire `allocateFounderBadgeSlot(userId)` into the successful first-subscription Stripe path. — needs: Claudio/Jovan after migration approval
- 2026-05-23 — Cody — Monthly bonus payout recording uses staged `cash_payouts`. Keep payout recording and cron/Inngest wiring dormant until migration approval; selection logic is safe and covered now. — needs: Claudio/Jovan after migration approval
- 2026-05-23 — Cody review note — Monthly bonus payout recording needs an idempotency decision before cron/Inngest wiring. Current staged `cash_payouts` has no period key or unique draw id, so a retried monthly job could duplicate payout rows. Recommendation: Claudio reviews whether to add `period_month`/`draw_id` uniqueness to the staged migration, or require an admin-confirmed single-run workflow. — needs: Claudio
- 2026-05-23 — Cody — Audit remaining after safe fix: 10 moderate vulnerabilities. Do not force blindly. npm proposes breaking/downgrade fixes for `vite`/`esbuild`, `drizzle-kit`, and `@google-cloud/storage`; `npm ls` also reports a peer-resolution warning around Vitest's nested Vite/esbuild even though `npm run test` and `npm run build` pass. Recommendation: Claudio reviews dependency strategy separately from feature work. — needs: Claudio

### What's Blocked (Don't Bang Head Against These)
| Blocker | What it unblocks | Wait for |
|---|---|---|
| Clerk API keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`) | Week 1 auth cutover | Founder finishes Clerk dashboard signup |
| Stripe Connect Client ID | Week 5 creator payouts | Founder enables Stripe Connect |
| Upstash / Inngest / OneSignal / Resend / PostHog keys | Weeks 4-8 (2-3 day buffer each) | Founder signup at each service |
| 11 SVG brand assets | Week 9 landing polish | Founder Fiverr order ($20-30) |

---

## Phase 1 Week Tracker

| Week | Title | Status |
|---|---|---|
| Week 0 | Emergency Stabilization | ✅ DONE — 24 items shipped, DB synced |
| Week 1 | Auth + Stack Provisioning | 🟡 Scaffolding done; cutover waits on keys |
| Week 2 | Schema Alignment + Tier Rename | ⏳ Queued (can draft now) |
| Week 3 | Scoring + Progression Rewrite | ⏳ Queued |
| Week 4 | Engagement Layer | ⏳ Queued |
| Week 5 | Stripe Layer | ⏳ Queued |
| Week 6 | Creator Economy | ⏳ Queued |
| Week 7 | Slips + Chat Upgrade + Moderation | ⏳ Queued |
| Week 8 | Compliance + Operational | ⏳ Queued |
| Week 9 | Polish + Deploy | ⏳ Queued |

---

## Architecture Flags (Review Done 2026-05-23 — Fixes Deferred)

Founder asked for a folder architecture review. Below is what I'd flag for delete/rebuild/refactor. **Nothing fixed yet** — just documented so we don't lose track.

### Critical — Must Address In Phase 1

| Item | Issue | When |
|---|---|---|
| `server/replit_integrations/` | Replit OIDC code. Being replaced by Clerk. | Week 1 (already in SPEC) |
| `.replit_integration_files/` + `.replit` + `.agents/` + `.local/` | Replit-specific scaffolding. We're moving OFF Replit to Vercel + Railway. | Delete after Clerk cutover succeeds (end of Week 1) |
| `server/types/express.d.ts` | Pre-existing TS hole — `req.user` typed as Passport's `Express.User`, missing `role`/`email`. Audit caught this. | Fix during Week 1 Clerk cutover (req.auth replaces req.user) |
| `server/routes/` (vs `server/user/routes/` and `server/admin/routes/`) | ✅ Fixed 2026-05-23: moved the 2 orphan user route files into `server/user/routes/` and restored `/api/activity/feed` mounting. | Done |

### Medium — Phase 2 Cleanup

| Item | Issue | When |
|---|---|---|
| `server/storage/` folder | Legacy DB ops layer from before full Drizzle migration. Likely redundant with `services/`. | Audit. Delete if unused, otherwise document. Phase 2. |
| `server/statsIngest.ts` + `server/roiCalculator.ts` at server root (not in `services/`) | Inconsistent organization — every other service lives in `server/services/`. Move both into `server/services/` for consistency. (Note: verified `server/index.ts` does NOT exist — earlier flag was wrong. Real entry points are `production.ts` (prod), `user-server.ts` (mounts everything), `admin-server.ts` (dev-only). Clean.) | Phase 2 |
| `scripts/` — 5 seed scripts (`seedAiConfig.ts`, `seedTestData.ts`, `seed_ai_data.ts`, `seed_news_tags.ts`, `superSeed.ts`) + `scripts/archive/` + `seeds/seedSuggestedQuestions.ts` | Two seeding locations + multiple overlapping seed scripts. | Consolidate into a single `npm run seed` command. Phase 2. |
| `src/user/api/` folder | Possible redundancy with TanStack Query fetching pattern used elsewhere. | Audit + consolidate if redundant. Phase 2. |
| `src/user/hooks/` vs `src/shared/hooks/` | Two hooks directories. Some hooks should be shared, some user-only. | Audit boundary. Phase 2. |
| 115 `as any` + 22 raw `sql\`\`` queries (from Week 0 audit) | Type safety holes scattered across the codebase | Touch when in the file. Long-tail. |

### Low Priority / Acceptable As-Is

| Item | Why OK |
|---|---|
| `src/admin/` + `src/user/` + `src/shared/` + `src/auth/` (peer folders) | Clean separation by domain. Consistent with `server/admin/` + `server/user/` |
| `server/utils/` + `server/middleware/` + `server/system/` | Small focused folders, reasonable separation |
| `uploads/` (empty at root) | Runtime upload target. Will migrate to Supabase Storage in Phase 2 anyway. |
| `migrations/_archive_pre_phase1/` | Historical reference, well-documented |
| `docs/_archive/` | Pre-Phase-1 doc archive, well-organized |
| `public/brand/` | SVG drop zone, ready for assets |
| `public/locales/` | i18n framework folder (9 langs scaffolded) |

---

## Reset — Where We Stand (Main App Only)

Founder's point: most of the app is built. We're refining, not building from scratch. Honest inventory:

### What's ALREADY BUILT (and works)

**Backend (`server/`):**
- Pick system core (moneyline + method + round, confidence flags, locked odds, multi-layer locking)
- Event lifecycle (Upcoming → Live → Completed → Closed → Archived — 5 states intact in DB)
- Fighter database + history + tagging
- Raffle pool + draws + Stripe auto-add
- Community chat (Socket.io)
- Pick Board (html2canvas share)
- Stripe subscriptions + webhooks (basic — no Connect yet)
- AI: OpenAI GPT-4o-mini (primary) + Anthropic Claude Sonnet 4.6 (fallback) — model bumped Week 0
- Cron framework (node-cron + pg-boss)
- Drizzle ORM with 52-table schema
- 21 admin route files + 25 user route files
- 20 services
- Sentry, OneSignal SDK, OpenMeter SDK (all installed)
- Pick Distribution + Activity Feed
- Winning Streak logic
- Heartbeat / health endpoint
- Bootstrap reset endpoints (API-key protected)
- Outbound sync to Supabase via pg-boss

**Frontend (`src/`):**
- React 18 + Vite + Tailwind + shadcn/ui setup
- 12 routed user pages (Dashboard, Event List, Fight Detail, Fighter Index, Fighter Profile, etc.)
- 91 user components feature-grouped
- 15+ admin components (`AdminEventEditor`, `AdminBadgeManager`, etc.)
- Dashboard widgets (all on real data per Week 0 audit)
- Pick Board UI
- Mobile bottom nav
- Sounds + i18n scaffolding (9 languages — only English wired)
- AuthContext, FighterDataContext, GamificationContext

**Database (52 tables):**
- All user/picks/results/badges/keys tables
- Slips, fight_notes, intel_feed_items tables (schema exists — UI missing)
- Groups, group_members, group_chat
- Data pipeline tables
- AI cache + chat tables

### What's WRONG (needs fixing, not rebuilding)

| Item | Fix | Effort |
|---|---|---|
| Tier enum `free\|medium\|premium` | Rename to `free\|challenger`; add `creator_profiles` separately | 1d (Week 2) |
| Badge tier missing `grandmaster` | ✅ Fixed 2026-05-23: `progress_badge` is varchar, so config/service update was enough | Done |
| Scoring used flat points (+1/+2/+3) | ✅ Fixed 2026-05-23: net units from moneyline only, stored as hundredths in legacy `points_awarded` | Done |
| Star tolerance band missing | ✅ Fixed 2026-05-23: losses from 0u to -1u are neutral; below -1u regresses | Done |
| Method/round affected scoring | ✅ Fixed 2026-05-23: final scoring now uses fighter result + locked moneyline only | Done |
| Auth = Replit OIDC | Migrate to Clerk (touches every route — scaffolding done) | 3d (Week 1) |
| Time zone hardcoded PST/EST map | ✅ Fixed 2026-05-23: per-fight pick lock parsing is UTC-first with explicit offset and legacy abbreviation support | Done |
| Flag budget hardcoded in `FightDetail.tsx:525-526` | Wire from server | 1h |
| `progressionRoutes.ts` stub | Add endpoints | 2h |
| `MANUAL_INGESTION_MODE=True` in data engine (parked per scope) | Documented in README; defer to Phase 2 | n/a |

### What's MISSING (must build from scratch)

| System | Effort |
|---|---|
| AI Token Economy (meter, packs, cost map, payment fallback, admin pricing dashboard) | Week 5 — 5d |
| Creator Economy (paid eligibility, donations, 1-on-1 chat, Stripe Connect, escrow) | Week 6 — 5d |
| Live Fighter Rating (5 criteria + 5-layer anti-spam) | Week 4 — 2d |
| Per-Fight Notes UI (table exists — needs UI) | Week 4 — 1d |
| Event Recap view + Claude summary | Week 4 — 2d |
| 7-step Onboarding (replaces single `WelcomeModal`) | Week 8 — 1d |
| In-App Rules Tab (content from blueprint) | Week 8 — 4h |
| Monthly Bonus Draw + payout dashboard + Inngest job | Week 8 — 1d |
| Slip upload + admin queue + Slip Wall | Week 7 — 2d |
| Founder badge slot tracking (atomic) + Gold Key frontend | Week 3 — 1d |
| Chat tier gating + per-event admin toggle + profanity filter | Week 7 — 2d |
| Block + Mute + Report UI | Week 7 — 1d |
| 5 legal pages (ToS / Privacy / Cookie / Creator Agreement / AUP) | Week 8 — 1d |
| 1099-NEC tracking dashboard | Week 8 — 1d |
| Multi-account detection (FingerprintJS + Stripe fingerprint + IP/ASN) | Week 8 — 2d |
| Backup runbook docs + restore test schedule | Week 8 — 0.5d |
| Account deletion + GDPR data export | Week 8 — 1d |
| Refund flow with Stripe metadata + ToS mirror | Week 5 — 1d |
| Intel feed admin publish UI + Challenger gate | Week 4 — 1d |
| Real Betting Tracker dashboard widget surface | Week 4 — 4h |

**Realistic Phase 1 total:** ~35–40 dev-days of actual building (plus QA + buffer). Spread across 9 calendar weeks with founder provisioning + Fiverr asset wait time. Could compress to 6-7 weeks if everything went perfectly.

Founder's instinct ("shouldn't be a 20-month project") is correct. Most of the heavy plumbing is already in place. We're filling in features on top of existing scaffolding + fixing the rules where they drifted from blueprint.

---

## Pending Tasks Snapshot

Cross-reference with TaskList tool (session-local). This is the durable mirror.

**Completed Week 0:** 24 items (see SPEC §4.1 for detail)

**In progress:**
- #26 — Founder provisioning sprint (on founder)

**Pending Week 1 (queued, blocked on Clerk keys):**
- #28 Wire Clerk middleware + ClerkProvider
- #29 Swap auth guards to Clerk session
- #30 Register Clerk webhook
- #31 2FA enforcement for Challenger tier
- #32 Delete Replit OIDC code + cleanup
- #33 Vitest auth guard tests + final verify

**Available right now (un-blocked):**
- No high-priority core pipeline task remains unblocked without provider keys or staged migration approval.
- Optional next cleanup if Claudio/Jovan want continued backend hardening before provisioning: review remaining route-level `as any`/raw SQL touchpoints.

**Pending later weeks:**
- #4 Monthly progression → snapshot-only (Week 3)

---

*Last updated: 2026-05-23 by Cody. Whoever picks up next: update this file before reporting back. It's the only thing that prevents context loss.*
