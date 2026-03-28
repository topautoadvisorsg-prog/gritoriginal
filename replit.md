# GRIT

## Overview

GRIT is a professional Global MMA Fantasy League platform for analytics, scouting, and competition. It centralizes fighter data, fight history, events, rankings, and user picks into a unified system, with the **Fighter Profile as the Source of Truth**.

## User Preferences

- No duplicated logic
- No unused files
- No hardcoded mock data in production paths
- Strict TypeScript typing
- Consistent naming conventions
- Follow existing patterns
- Do NOT introduce parallel data systems
- All fighter data flows through Fighter Profiles
- Use existing hooks and contexts
- DO NOT DELETE MOCK DATA — preserve all mock files for testing/development
- Every implemented feature MUST:
    - Update this README
    - Document new fields
    - Document schema changes
    - Document new API endpoints

## System Architecture

The application is built with a **Fighter Profile as the Source of Truth** architecture, where all fighter data originates from and is managed through the Fighter Profile module.

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI
- **State Management:** TanStack Query, React Context
- **Backend:** Express.js
- **Database:** PostgreSQL (Neon-backed via Replit)
- **ORM:** Drizzle ORM
- **Authentication:** Replit Auth (OpenID Connect PKCE)
- **Storage:** Replit Object Storage (GCS-backed)
- **Validation:** Zod schemas with Express middleware
- **Rate Limiting:** express-rate-limit (3 tiers: public/strict/auth)
- **Logging:** Centralized logger (`server/utils/logger.ts`) — all server files use `logger.info/error/debug/warn`

**Domain-Separated Architecture:**
The codebase is organized into `admin/`, `user/`, and `shared/` domains for both frontend and backend components, ensuring clear separation of concerns.

**Core Modules:**
- **Fighter Database:** Centralized fighter profiles with verified status.
- **Fight History Ledger:** API-driven fight records (GET /api/fights, POST /api/fights/bulk) persisted to PostgreSQL. No localStorage dependency.
- **Events & Fight Cards:** Management of upcoming and completed events with per-fight `scheduledTime` and event-level `lockTime` pick gate.
- **Rankings & Metrics:** Leaderboards based on prediction accuracy and comprehensive fighter performance metrics.
- **User Picks & Leaderboards:** System for user predictions (winner, method, round) and competitive leaderboards with a fantasy scoring system. Pick submission and deletion are blocked (HTTP 423) once `event.lockTime` has passed.
- **News System:** Curated articles and research content.
- **Real-Time Chat:** Socket.IO-powered chat system with AI Grok assistant integration. Messages stored in PostgreSQL (`chat_messages` table). Admin moderation controls. 500-char effective limit enforced at service layer.
- **Slips System:** Fight prediction slips — users generate shareable image cards from their picks. Backend: `POST /api/slips` (create), `GET /api/slips/:id` (fetch), `GET /api/slips/user/me` (user's slips). Files stored at `/uploads/slips/<userId>/<uuid>.ext`. Admin view at `GET /api/admin/slips`.
- **Data Engine Pipeline:** External webhook integration for automated MMA data ingestion. Endpoint: `POST /api/data-engine/webhook` (mounted at `/api` via user-server). Authenticated via `x-data-engine-api-key` header (key stored in `data_engine_config` table). Supports `create`/`update` actions for fighters, events, fight history, news, and odds. Auto-apply mode (`DATA_ENGINE_AUTO_APPLY=true` in `data_engine_config`) immediately approves and applies incoming payloads without admin review. Admin UI at `/admin` → Data Pipeline tab.
- **Import/Export Engine:** Tools for data ingestion (CSV) and extraction (CSV) with flexible field mapping. Utility modules: `csvParser.ts`, `autoMapper.ts`, `duplicateDetection.ts`.
- **Admin Panel:** Comprehensive management interface for events, fighters, news, data imports, chat moderation, slip review, and data pipeline monitoring.
- **Dashboard Widgets:** StatsWidget, CountdownWidget, BadgeWidget, ActivityWidget — real API data bindings.

**Data Flow Model:**
Data is ingested via CSV, API, or Admin Input, populates Fighter & Fight History Tables, which then feed into **Fighter Profiles (Source of Truth)**. This central data then drives Events, Rankings, Picks, Analytics, and the User Interface.

**UI/UX Decisions:**
The frontend utilizes React with Tailwind CSS for a modern, responsive design. Key UI components include:
- **Event Card Tab:** Displays upcoming fights, fighter details, and title fight indicators.
- **MMA Metrics Rankings Tab:** Shows fantasy leaderboards with user rankings and points.
- **Fighter Profiles Tab:** Central hub for fighter data, including identity, stats, physical attributes, performance metrics, fight history, betting odds, risk signals, and notes, with filtering options.
- **Event History Tab:** Allows review of completed events and tracks user pick performance.
- **News Tab:** Displays MMA news articles.
- **Export Tab:** Facilitates data extraction to CSV.
- **Admin Tabs:** Dedicated sections for `Create Event`, `Import Data`, `Fighter Manager`, and `Create News`.
- **Standalone Pages:** `Fight Detail Page`, `Settings Page`, `Admin Fight Cards Page`.

**Authentication & Authorization:**
Admin access is controlled by a user's `role` field in the database or matching the `ADMIN_EMAIL` environment variable, enforced by `requireAdmin` middleware for all admin endpoints.

## Component Structure

**Split Pages (modularized):**
- `src/pages/LandingPage.tsx` → 12 components in `src/pages/landing/` (hooks, Navbar, HeroSection, AICompetitionSection, SocialProofStrip, IntroSection, ShowcaseSections, Tier2Features, HowItWorks, LeaderboardPreview, PricingSection, FooterCTA)
- `src/pages/Settings.tsx` → 6 components in `src/pages/settings/` (types, ProfileTab, PrivacyTab, NotificationsTab, GamificationTab, AccountTab)
- `src/admin/components/import/ImportPage.tsx` → 3 utility modules (csvParser, autoMapper, duplicateDetection)

## Server Middleware

- **Validation:** `server/middleware/validate.ts` — Generic Zod validation middleware
- **Rate Limiting:** `server/middleware/rateLimiter.ts` — 3 tiers: publicApiLimiter (100/15min), strictApiLimiter (30/15min), authApiLimiter (200/15min)
- **Schemas:** `server/schemas/index.ts` — 12 Zod schemas for POST/PUT/PATCH endpoints
- **Pagination:** `server/utils/pagination.ts` — Backward-compatible pagination for list endpoints (fighters, fights, events, news, leaderboard)

## API Pagination

List endpoints support optional `?page=N&limit=M` query parameters:
- Without params: Returns all results (backward compatible)
- With params: Returns `{ data: [...], pagination: { page, limit, total, totalPages, hasMore } }`
- Supported endpoints: GET /api/fighters, GET /api/fights, GET /api/events, GET /api/events/completed, GET /api/news, GET /api/leaderboard

## Mock Data (DO NOT DELETE)

- `src/shared/data/mockFighters.ts` (329 lines)
- `src/shared/data/mockFighter.ts` (265 lines)
- `src/shared/data/mockEvent.ts` (156 lines)
- `generateMockActivities` function in Dashboard widgets

## External Dependencies

- **Replit Auth:** Used for user authentication via OpenID Connect PKCE.
- **Replit Object Storage:** Utilized for storing assets like fighter images and user avatars, backed by Google Cloud Storage.
- **Neon (PostgreSQL):** Provides the managed PostgreSQL database service.

## Deployment

**Build command:** `npm run build` → Vite builds frontend to `dist/public/`
**Run command:** `npx tsx server/production.ts` → starts both Express servers

**Production entry point:** `server/production.ts`
- Imports `server/admin-server.ts` (starts admin server on `ADMIN_PORT` / 3002)
- Imports `server/user-server.ts` (starts user server on `PORT` — Replit autoscale injects this)

**Production-only middleware in `user-server.ts`:**
- Proxies `/api/admin/*` → `localhost:3002` using Node's built-in `http` module
- Serves Vite build static assets from `dist/public/`
- SPA fallback: all unmatched GET routes return `dist/public/index.html`

**Data engine webhook auth key:** Stored in `data_engine_config` table under key `DATA_ENGINE_API_KEY`. Sent by data engine in `x-data-engine-api-key` header.

**Bidirectional Supabase sync:** Outbound sync service (`server/services/outboundSyncService.ts`) pushes approved data changes back to the data engine's Supabase instance.
- Credentials stored in `data_engine_config`: `SUPABASE_URL`, `SUPABASE_API_KEY`, `SUPABASE_ANON_KEY` — editable via Admin → System Settings → "Supabase Outbound Sync" section
- Triggers: pipeline `applyEntry()` (post-commit), admin fighter create/update, admin event create/update, fight result finalization
- Method: PATCH (updates) / POST (creates) to Supabase REST API
- Entities synced: `fighters`, `events`, `fight_history`, `news_articles`, `event_fights` (result fields: `winner_id`, `method`, `round_end`, `time_end`, `fighter1_result`, `fighter2_result`)
- Failures are logged but non-blocking — DB transaction is never rolled back due to sync failure

## Recent Changes

- **2026-03-25:** API key wiring + bio schema fix:
  - `DATA_ENGINE_API_KEY` stored as shared environment variable
  - `getDataEngineConfig()` now falls back to `process.env[key]` when `data_engine_config` table has no value — webhook auth active in production without requiring DB row
  - `syncFighterSchema` now includes `bio: z.string().optional()` — biography data from data engine will no longer be stripped by Zod validation

- **2026-03-25:** Pipeline E2E Test — UFC Fight Night: Adesanya vs. Pyfer (full system test):
  - Data engine pipeline end-to-end test completed
  - **Fixed:** Webhook path was wrong in data engine (`/api/webhooks/data-engine/webhook` → `/api/data-engine/webhook`)
  - **Fixed:** Payload schema issues in data engine mapper — dateOfBirth needs Z suffix, stance must be omitted when unknown, imageUrl must be valid URL or omitted, dataType field required
  - **Result:** 30 fighter entries queued in production `data_pipeline` table (status=pending)
  - **Known GRIT-side gap:** `syncFighterSchema` has no `bio`/`biography` field — Zod strips it; bio arrives empty for all fighters
  - **Known data engine gaps (their side):** gender detection wrong for female fighters (Bruna Brasil, Alexa Grasso, Gabriella Fernandes, Maycee Barber, Casey O'Neill all sent as Male), nationality always "Unknown", Marcin Tybura duplicated 3×, reach_inch=0 (expected, known scraper gap)
  - **Production state as of this test:** 0 fighters, 0 events, 0 users, 0 fight history, 0 news articles in production DB — fresh deployment, no data applied yet
  - **Admin access:** `saraimateo1612@proton.me` has hardcoded admin fallback via `guards.ts` — this email gets admin role automatically on login
  - **data_engine_config table is empty in production** — no API key set, no auto-apply configured
  - **Do NOT approve the 30 pending entries** until data engine fixes gender, nationality, bio, and deduplication issues

- **2026-03-24:** Task #8 (System Audit Fixes) — COMPLETE:
  - Deleted dead temp/test files, unused `DataPipelinePage.tsx`, `ObjectUploader.tsx`, and 13 unused shadcn/ui components
  - `event_fights` outbound sync added: `syncEventFightToSupabase()` in `outboundSyncService.ts`, wired into fight resolution route via `setImmediate` post-finalization
  - Admin → System Settings now shows "Supabase Outbound Sync" card with editable `SUPABASE_URL`, `SUPABASE_API_KEY`, `SUPABASE_ANON_KEY` fields (read/write via `/api/admin/pipeline/config`)

- **2026-03-24:** Bidirectional Supabase sync — COMPLETE:
  - `server/services/outboundSyncService.ts` created — pushes fighters, events, fight_history, news to data engine's Supabase via REST API
  - Supabase credentials stored in `data_engine_config` table (`SUPABASE_URL`, `SUPABASE_API_KEY`, `SUPABASE_ANON_KEY`)
  - `dataEngineService.ts`: `applyEntry()` fires outbound sync after transaction commits (non-blocking `setImmediate`)
  - `adminFighterRoutes.ts`: fighter create/update both fire sync post-write
  - `adminEventRoutes.ts`: event create/update both fire sync post-write
  - camelCase → snake_case field mapping per entity; allowed-fields filter strips fields absent in Supabase
  - PATCH strategy for updates; POST for creates (avoids NOT NULL constraint failures on partial updates)
  - Sync failures logged via `[OutboundSync]` prefix but never propagate to HTTP response

- **2026-03-24:** Task #10 — Pipeline Auto-Apply, Field Hardening & E2E Validation:
  - `DATA_ENGINE_AUTO_APPLY` config key in `data_engine_config` — when `"true"`, webhook payloads are immediately approved+applied without admin review; HTTP 200 (applied) vs 201 (queued)
  - `fighters.stance` made nullable in DB and schema (`syncFighterSchema.stance` is now optional) — data engine may omit stance
  - `events.lockTime` made optional in `syncEventSchema` — omit from payloads when unknown
  - `syncEventFightSchema` added to `shared/sync-schemas.ts` — validates embedded fight matchups in event payloads
  - `applyEventData()` now fully processes embedded `eventFights` array — upserts into `event_fights` by fighter1Id+fighter2Id+eventId; syncs each fight to Supabase via `setImmediate` post-commit
  - Date normalization fix: ISO date strings in event payloads (`date`, `lockTime`) are now converted to `Date` objects before Drizzle insert to avoid `toISOString is not a function` error
  - Resolved event ID threading: `applyEventData` returns the generated `eventId`; `applyEntry` injects it into `appliedEntry.data` so `syncEventToSupabase` receives a valid ID and does not skip
  - Admin UI expanded: `ApiKeysConfigSection` added to Admin → System Settings for `ANTHROPIC_API_KEY`, `BRAVE_SEARCH_API_KEY`, `NANO_BANANA_API_KEY`; auto-apply toggle added to `DataEngineConfigSection`
  - E2E live test confirmed: fighter push (no stance) → applied + Supabase synced; event push (with embedded fights) → event + fight_matchup created in DB, both synced to Supabase
  - Webhook URL clarified: `POST /api/data-engine/webhook` (not `/api/webhooks/...`)

- **2026-03-24:** Deployment fixed — production entry point created:
  - `server/production.ts` added as unified production entry point (imports both servers)
  - `vite.config.ts` updated: frontend build output changed from `dist/` → `dist/public/`
  - `server/user-server.ts`: production-only block added — proxies `/api/admin/*` to admin server (port 3002), serves `dist/public/` static assets, SPA fallback for unknown routes
  - Deployment run command: `npx tsx server/production.ts` (was: `node ./dist/index.cjs`)
  - Data engine API key (`DATA_ENGINE_API_KEY`) generated and stored in `data_engine_config` table
  - Production URL: `https://workspace--davidpalomeraaz.replit.app`

- **2026-03-24:** Task #7 — Sync Schema Null Placeholder Support:
  - `syncFightHistorySchema.result` enum extended: added `"Unknown"` (was `['Win','Loss','Draw','NC']`)
  - `syncFightHistorySchema.eventDate` changed from `.optional()` to `.nullish()` — accepts `null` placeholder from data engine
  - Both changes targeted at allowing data engine pushes for pre-result or data-incomplete fights

- **2026-03-24:** Task #6 — Data Engine Integration Readiness Fixes:
  - `fighters.gym` made nullable in DB (data engine omits when unknown)
  - `fight_history` snapshot columns made nullable: `event_name`, `event_date`, `fight_type`, `location`
  - DB altered via `db:push`; SQL migration documented in `migrations/0001_data_engine_nullable_fields.sql`
  - `syncFightHistorySchema`: snapshot fields (`eventName`, `eventDate`, `fightType`, `location`) added as optional; `location` typed as `{ city, state, country, venue }`; `eventPromotion` relaxed to optional
  - Pick locking wired to `event.lockTime`:
    - `POST /api/picks` — returns HTTP 423 if `now >= event.lockTime`
    - `DELETE /api/picks/:fightId` — same 423 gate; both bypass for admin users

- **2026-03-25:** Task #2 — Data Engine E2E + Production Seeding:
  - `shared/sync-schemas.ts` `syncEventSchema.status` expanded to include all admin-compatible status values (`Upcoming`, `Live`, `Completed`, `Closed`, `Archived`, `Cancelled`, `Postponed`) alongside the original `OPEN/LIVE/CLOSED/ARCHIVED` set — default changed to `'Upcoming'`.
  - `server/api/bootstrapRoute.ts` — NEW file: API-key-protected bootstrap/setup endpoints (no user session required).
    - `POST /api/setup/reject-pending-entries` — bulk-rejects all pending pipeline entries; auth via `x-data-engine-api-key` header.
    - `GET /api/setup/status` — returns fighter count, event count, pending pipeline count (public, no auth).
  - `server/user-server.ts` — bootstrapRouter registered at `/api` prefix (after data engine webhook).
  - `DATA_ENGINE_AUTO_APPLY=true` set as shared env var — webhook now auto-applies all incoming data without admin review.
  - `DATA_ENGINE_API_KEY` set as shared env var — `getDataEngineConfig()` falls back to `process.env[key]` when DB table is empty (no DB row required).

- **2026-03-24:** Task #1 — Landing Page Restructure:
  - Section order: Hero → CoreFeaturesSection → SocialProofStrip → ShowcaseFighters → AICompetitionBanner → LeaderboardPreview → CommunitySection → EventPicksSection → HowItWorks → PricingSection → FooterCTA
  - NEW `CoreFeaturesSection.tsx` — 5-tile feature grid (Dashboard, Event Picks, Fighter Profiles, Chat, AI) with fighter flankers
  - NEW `AICompetitionBanner.tsx` — compact 3-model AI card row (GPT-4o / Grok 3 / Claude 3.5) with copy
  - NEW `CommunitySection.tsx` — live chat mockup + 5 premium feature cards (emoji, slips, badges, AI tokens)
  - NEW `EventPicksSection.tsx` — picks mockup (winner / method / confidence) with reversed layout
  - UPDATED `ShowcaseSections.tsx` — `ShowcaseFighters` enhanced with AI Scout Brief block + 4-badge chip row; `ShowcaseAI` and `ShowcaseRankings` removed
  - UPDATED `LeaderboardPreview.tsx` — badge progression grid added (Ninja → Samurai → Master → GOAT)
  - UPDATED `SocialProofStrip.tsx` — wrapped in `.lp-intel-section` with visible heading and live dot
  - UPDATED `PricingSection.tsx` — feature comparison table (9 rows, Contender vs Challenger columns)
  - DELETED `IntroSection.tsx`, `Tier2Features.tsx`
  - ADDED new CSS classes to `LandingPage.css`: `.lp-core-features`, `.lp-core-feature-tile`, `.lp-intel-section`, `.lp-ai-banner`, `.lp-scout-brief`, `.lp-badge-chips`, `.lp-lb-badge-grid`, `.lp-community__*`, `.lp-compare-table`

- **2026-03-24:** Task #5 — Admin Chat Management + Landing Page:
  - Admin chat moderation UI added under `/admin` → Chat tab
  - Admin can view all chat rooms, messages, flag/unflag content, delete messages
  - New admin routes: `GET /api/admin/chat/rooms`, `GET /api/admin/chat/rooms/:id/messages`, `DELETE /api/admin/chat/messages/:id`, `PATCH /api/admin/chat/messages/:id/flag`
  - Landing page updates (copy, layout, or section changes per design brief)
  - `adminNavItems` and `tabTitles` in `src/shared/config/navigation.ts` updated to include Chat tab

- **2026-03-24:** Task #4 — Chat & Slip UI:
  - Chat UI wired to Socket.IO backend — real-time message send/receive, room switching, Grok AI reply indicator
  - Slip card UI — users can generate a shareable fight prediction slip image from their picks
  - Slip preview modal, download/share actions, user slip history view
  - Grok AI assistant card styled in teal `hsl(190 90% 52%)` throughout

- **2026-03-24:** Task #3 — Chat & Slip Backend:
  - Socket.IO real-time chat service (`server/services/socketService.ts`) — room-based messaging, auth-gated connections
  - `chat_messages` table: `id`, `room_id`, `user_id`, `content`, `is_ai`, `is_flagged`, `created_at`
  - Slip generation backend: `POST /api/slips` creates slip record + saves image file
  - Slip storage: local filesystem at `/uploads/slips/<userId>/<uuid>.ext`; served via `/objects/slips/...`
  - `GET /api/slips/:id`, `GET /api/slips/user/me` — fetch slip(s)
  - `GET /api/admin/slips` — admin view of all slips
  - `data_engine_config` table added: `config_key`, `config_value`, `description`, `updated_by` — used to store webhook auth key and other engine settings

- **2026-03-14:** Event & Fight Card Creation — Full Implementation:
  - **Admin event API routes migrated:** All write endpoints moved from `/api/events/*` to `/api/admin/events/*` in `adminEventRoutes.ts` (POST create, PUT update, PUT status, PUT fight, DELETE fight, DELETE event). Fixes "Unexpected token" JSON error caused by Vite proxy mismatch.
  - **Resource scoping:** Fight update/delete endpoints now verify `fight.eventId === :eventId` before operating, preventing cross-event mutations. New `getEventFight(id)` method added to storage layer.
  - **`scheduledTime` field:** Added `scheduled_time VARCHAR(20)` column to `event_fights` table. Wired through create and update routes.
  - **CreateEvent.tsx rewritten:** Fixed POST URL to `/api/admin/events` with `credentials: 'include'`. Added fight scheduling (auto-defaults: Prelim 1:00 PM PST, Main Card 7:00 PM PST, +25 min intervals). Added bout-order move-up/move-down controls. City/state/country fields use ComboInput dropdowns with preset MMA locations + free-text fallback.
  - **AdminEventEditor.tsx updated:** All mutation fetch URLs changed from `/api/events/:id*` to `/api/admin/events/:id*`. Location fields converted to ComboInput dropdowns matching CreateEvent.
  - **New API endpoints:** None new — existing routes moved to correct admin proxy path.
  - **Schema changes:** `eventFights.scheduledTime` (varchar, nullable).
  - **Storage changes:** `getEventFight(id)` added to `IEventStorage` interface and `EventStorage` class.

- **2026-03-08:** Fighter data management improvements:
  - **Name-match upsert on re-import:** Bulk fighter import now matches existing fighters by first+last name when no ID is present — re-importing a CSV updates the record instead of creating a duplicate. Storage layer: `getFighterByName(firstName, lastName)` added.
  - **Bulk delete in Fighter Manager:** Multi-select checkboxes on all fighter rows, "Select All" toggle, "Delete Selected (N)" button with confirmation dialog. Fires `DELETE /api/fighters/:id` per selected fighter.
  - **Suggest Correction (user-facing):** "Report incorrect info" button on every fighter profile page opens a modal with "What's wrong?" + source link fields. Submits to `POST /api/fighters/:id/corrections` (auth required).
  - **Corrections inbox (admin):** Fighter edit form now has a 5th "Reports" tab with a red badge showing pending count. Admin can read submissions and click "Mark Resolved" per item (`PATCH /api/admin/corrections/:id`).
  - **New DB table:** `fighter_corrections` (id, fighter_id FK, submitted_by, what_is_wrong, source_link, status, created_at).
  - **New API endpoints:** `GET /api/admin/fighters/:id/corrections`, `PATCH /api/admin/corrections/:id`, `POST /api/fighters/:id/corrections`.

- **2026-03-01:** News/Blog system wired to routing (all components and APIs already existed):
  - Added `/news` route to `App.tsx` → renders `NewsPage` (list view with filters)
  - Added `/news/:id` route → renders new `NewsArticlePage` (fetches article by ID, shows `NewsArticleDetail`, graceful not-found state)
  - Added `news` entry to `userNavItems` in `navigation.ts` — News now appears in the sidebar for all logged-in users
  - Added `news` to `tabTitles` in `navigation.ts` for header display
  - Fixed dead links in `FighterArticles.tsx`: replaced `href={article.slug ? ... : '#'}` with `<Link to={/news/${article.id}}>` (no slug column exists; UUID is correct)
  - Fixed `NewsArticleDetail.tsx` importing `NewsArticle` from `NewsPage` (circular) → now imports from `@/shared/types/fighter`
  - Blog creation: already at `/admin/create-news` (admin only). Tag visualization: already in fighter profiles via `FighterTagsSection`. Both fully operational — no code changes required.
- **2026-03-01:** Fixed two UX-breaking issues in admin interface:
  - `mockEvents is not defined` crash on Rankings page (`/competition`) — replaced dead `mockEvents` reference with the correct `eventOptions` variable already computed from the live API in `MMAMetricsRankings.tsx`
  - Admin sidebar/navigation disappearing on all admin routes — moved `admin/fight-cards` and `admin/:tab` routes inside the `<Route path="/" element={<Index />}>` layout block in `App.tsx` so sidebar stays mounted. Updated `Index.tsx` header title resolution to correctly extract the tab segment from `/admin/:tab` paths.
- **2026-03-01:** Closed Beta Stress-Test — COMPLETE. Full 10-task audit finished (T001–T010). All test data removed (T011). DB restored: admin total_points=0, progress_badge='none', 0 test events/fighters/picks/keys. Audit findings:
  - T007: All protected routes enforce 401 unauthenticated. Public routes return 200. Admin API isolated to port 3002 by design.
  - T008: Chat service enforces 500-char limit (MESSAGE_TOO_LONG). XSS payloads stored as literal text, inert in React JSX rendering. Rate limiter: 15min/60req (AI+chat), 1min/10req (streaming).
  - T009: All /api/ai/* routes return 401 unauthenticated. Admin bypass live via tierMiddleware.ts.
  - T010: /api/user/export/picks and /api/admin/export/fighters both return 401 unauthenticated. CSV Content-Type confirmed.
  - Ultra badge (totalKeys === 5): code is correct. Milestone check fires inside finalizeFight transaction only — direct SQL key insertion bypasses it by design.
- **2026-03-01:** Security hardening (Closed Beta stress-test phase):
  - Fixed `/admin/fight-cards` route missing `<RequireAdmin>` wrapper in `App.tsx`
  - Added `UNIQUE INDEX user_picks_user_id_fight_id_idx ON user_picks (user_id, fight_id)` — `ON CONFLICT (user_id, fight_id)` upsert in picks API now works correctly at DB level
  - Schema updated: `uniqueIndex` added to `userPicks` table in `shared/models/auth.ts`
  - Admin bypass added to both `requireTier` implementations (`server/auth/guards.ts`, `server/auth/tierMiddleware.ts`) — admins always pass tier gates regardless of their `tier` field
  - Chat limit policy: API route checks >1000 chars (intentional outer bound); service enforces >500 chars (effective limit). Documented, not changed.
- **2026-03-01:** Configured `saraimateo1612@proton.me` as the primary administrator for Closed Beta testing. Verified `requireAdmin` middleware correctly identifies this identity via the `ADMIN_EMAIL` environment variable.
- **2026-02-21:** Full i18n wiring — all 10+ landing page components use `useTranslation()` with 144 keys across 8 locale files (en, es, fr, pt, ja, ko, ru + en-US/es-ES variants). Language selector in Navbar. Login flow fixed for iframe context (`window.open` instead of `location.href`). ADMIN_EMAIL updated.
- **2026-02-21:** Conservative cleanup pass — removed dead code (ParticleCanvas.tsx, auth-utils.ts, NavLink.tsx, .lp-hero__canvas CSS), added es-ES locale bundle, orphan scan verified no false removals
- **2026-02-21:** Hero video background — replaced ParticleCanvas/frame animation with a single `<video>` element (`public/hero_bg.mp4`) using autoplay, loop, muted, playsInline. Hardware-decoded by browser, no JS animation overhead. Dark gradient overlay for text readability.
- **2026-02-21:** Centralized logger migration (35+ server files), component splits (LandingPage/Settings/ImportPage), Zod validation on 11 endpoints, rate limiting on all API paths, pagination on 6 list endpoints
- **2026-02-21:** Fight History API migration (localStorage → PostgreSQL), Dashboard widget activation, architecture isolation verification
