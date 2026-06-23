# GRIT Runtime Pipelines

This is the ownership map for locating a product issue from screen to persistence. Route modules own HTTP validation and authorization; services own business rules; storage modules and Drizzle own persistence.

## Runtime Entry Points

| Runtime | Entry point | Purpose |
|---|---|---|
| Production | `server/production.ts` | Sets production mode and starts the single-port user server. |
| User API | `server/user-server.ts` | Public/user APIs, webhooks, sockets, jobs, and the production frontend. |
| Admin development API | `server/admin-server.ts` | Separate local admin port using the same canonical admin registrar. |
| Frontend | `src/main.tsx` -> `src/App.tsx` | Clerk, React Query, routing, layouts, and pages. |

Both server runtimes mount admin APIs through `server/admin/registerAdminApi.ts`. Do not add admin route registration directly to a server entry point.

## Product Surface Map

| Surface | Frontend owner | API owner | Business/data owner |
|---|---|---|---|
| Dashboard | `src/user/components/dashboard/` | `server/user/routes/dashboardRoutes.ts`, `activityFeedRoutes.ts`, `statsRoutes.ts` | dashboard, scoring, progression, and storage services |
| Event card and picks | `src/user/components/event/` | `eventRoutes.ts`, `picksRoutes.ts`, `picksDistributionRoutes.ts` | event lifecycle, pick, scoring, and event storage |
| Fighter profiles | `src/user/components/fighter/` | `fighterRoutes.ts`, `fighterRatingsRoutes.ts`, `fightNotesRoutes.ts` | fighter context, fighter storage, ratings |
| Rankings | `src/user/components/rankings/` | `leaderboardRoutes.ts`, `snapshotRoutes.ts` | leaderboard and snapshot services/storage |
| Event history | `src/user/components/eventhistory/` | `eventRoutes.ts`, `fightResultsRoutes.ts` | event and result storage |
| News and intel | `src/user/components/news/` | `newsRoutes.ts`, `intelFeedRoutes.ts`, `tagRoutes.ts` | news and tag storage |
| AI analysis | `src/user/components/ai/`, `aichat/` | `server/ai/aiRoutes.ts`, `user/routes/aiChatRoutes.ts` | AI clients, usage metering, suggested questions |
| Chat and slips | `src/user/components/chat/` | `chatRoutes.ts`, `slipRoutes.ts` | chat, socket, notification, and slip storage |
| Groups | `src/user/pages/GroupsHub.tsx`, `GroupDetailPage.tsx` | `groupsRoutes.ts` | group service/storage |
| Settings/account | `src/user/pages/settings/` | `userRoutes.ts`, `userSettingsRoutes.ts`, `paymentRoutes.ts` | Clerk identity, users table, Stripe |
| Admin operations | `src/admin/` | `server/admin/registerAdminApi.ts` -> `server/admin/routes/` | admin services, audit log, jobs, domain storage |

## Cross-Cutting Pipelines

### Authentication

1. `server/auth/clerk.ts` attaches Clerk session data.
2. `server/auth/guards.ts` resolves and hydrates the local user.
3. Route guards enforce authenticated, admin, tier, or feature access.
4. `server/api/webhooks/clerkWebhook.ts` synchronizes Clerk identity to the users table.

There is one authorization implementation: `guards.ts`. Do not introduce a second Clerk guard stack.

### Admin API

1. Either server calls `registerAdminApi(app)`.
2. `/api/admin` passes rate limiting, user hydration, then admin authorization.
3. The canonical registrar mounts every admin route module.
4. `apiErrorHandler` logs unexpected errors and hides internal 5xx messages.

### Event Closure and Scoring

1. Admin event routes request closure or retry.
2. Event lifecycle and scoring services validate state and settle picks.
3. Progression and ranking totals update from settled results.
4. Job/outbox services handle retryable side effects.

Never write scoring totals directly from a UI route. Keep scoring mutations inside the service pipeline and reconciliation tools staging-only.

### External Data Engine

1. `server/api/webhooks/dataEngineWebhook.ts` authenticates incoming provider data.
2. `server/services/dataEngineService.ts` normalizes and stages changes.
3. Admin pipeline routes expose review/approve/reject/apply workflows.
4. Approved changes flow through domain storage, not direct frontend writes.

### Background Work

`server/services/cronService.ts` schedules work and `jobService.ts` owns durable jobs. Fixture mode disables seeds, cron tasks, and the job queue. Production-only work must remain idempotent and retryable.

## Change Rules

- Add a screen API in its domain route module; do not mount endpoints in entry points.
- Put reusable business decisions in a service and persistence in storage.
- Add every admin module only to `registerAdminApi.ts`.
- Use `guards.ts` for auth and tier checks.
- Add a focused contract test when changing route composition, authorization, scoring, or job behavior.
- Never use audit fixtures outside `UI_AUDIT_FIXTURES=1` and never point fixtures at production data.
