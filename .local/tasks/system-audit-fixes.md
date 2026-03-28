# System Audit: Code Cleanup + Config + Sync Gaps

## What & Why
A full-system audit uncovered four actionable items:
1. **Junk files** — `tmp/`, `attached_assets/`, `mp3 files/`, `scripts/archive/`, and root-level temp files (`finalize_test.ts`, `get_key_test.ts`, `verification_output.txt`) take up space with no runtime value.
2. **Unused UI components** — ~13 shadcn/ui components were scaffolded but never imported or rendered anywhere in the app.
3. **Supabase config not UI-accessible** — `SUPABASE_URL` and `SUPABASE_API_KEY` live in the `data_engine_config` table but are invisible in the Admin Settings UI. Only `DATA_ENGINE_API_KEY` is editable through the interface.
4. **event_fights outbound sync gap** — When an admin resolves a fight (sets winner, method, round, time end, fighter results), those resolution fields never push to the data engine's Supabase. The outbound sync service has no `event_fights` handler and is not wired into fight resolution routes.

Note: mock data files (`mockEvent.ts`, `mockFighter.ts`, `mockFighters.ts`) are explicitly preserved per project preferences and must NOT be deleted.

## Done looks like
- `tmp/`, `attached_assets/`, `mp3 files/`, `scripts/archive/`, and root-level temp files are gone.
- Unused shadcn/ui components that are never imported anywhere are removed.
- The Admin Settings panel shows editable fields for SUPABASE_URL, SUPABASE_API_KEY, and SUPABASE_ANON_KEY (in addition to the existing DATA_ENGINE_API_KEY field).
- When an admin resolves a fight result (via the fight resolution UI), the updated `event_fights` row (winner, method, round_end, time_end, fighter1_result, fighter2_result) is pushed to Supabase after the DB write.
- `replit.md` updated with audit findings and confirmed-clean status.

## Out of scope
- Brave and NanoBanana API keys — those are data engine internal services, not this app's concern.
- Changes to mock data files (explicitly preserved).
- Schema changes to add new columns — `event_fights` already has all result fields; only the sync wiring is missing.
- End-to-end test (covered by the separate Task #9).

## Tasks
1. **Dead file removal** — Delete `tmp/`, `attached_assets/`, `mp3 files/`, `scripts/archive/`, `finalize_test.ts`, `get_key_test.ts`, `verification_output.txt`. Also remove `src/admin/pages/DataPipelinePage.tsx` (dead page, not imported or routed) and `src/user/components/ObjectUploader.tsx` (never used).

2. **Unused UI components** — Remove the 13 unimported shadcn/ui components: `aspect-ratio`, `breadcrumb`, `calendar`, `chart`, `context-menu`, `drawer`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `radio-group`, `resizable`, `toggle-group`. Confirm none are imported before deleting.

3. **Supabase config in admin UI** — Add a "Supabase Configuration" section to `AdminSystemSettings.tsx` with save/load fields for `SUPABASE_URL`, `SUPABASE_API_KEY`, and `SUPABASE_ANON_KEY`. Use the same `data_engine_config` read/write pattern already used for `DATA_ENGINE_API_KEY`.

4. **event_fights outbound sync** — Add `syncEventFightToSupabase` to `outboundSyncService.ts`. Map our result fields (`winnerId`, `method`, `roundEnd`, `timeEnd`, `timeFormat`, `referee`, `fighter1Result`, `fighter2Result`) to Supabase snake_case. Wire the sync into `adminFightResolutionRoutes.ts` after the DB update commits, using the same non-blocking `setImmediate` pattern as other sync calls.

5. **replit.md audit update** — Add a short "System Audit Results" section documenting what was cleaned, what was confirmed healthy, and the event_fights sync gap that was closed.

## Relevant files
- `tmp/`
- `attached_assets/`
- `mp3 files/`
- `scripts/archive/`
- `src/admin/pages/DataPipelinePage.tsx`
- `src/user/components/ObjectUploader.tsx`
- `src/shared/components/ui/aspect-ratio.tsx`
- `src/shared/components/ui/breadcrumb.tsx`
- `src/shared/components/ui/calendar.tsx`
- `src/shared/components/ui/chart.tsx`
- `src/shared/components/ui/context-menu.tsx`
- `src/shared/components/ui/drawer.tsx`
- `src/shared/components/ui/hover-card.tsx`
- `src/shared/components/ui/input-otp.tsx`
- `src/shared/components/ui/menubar.tsx`
- `src/shared/components/ui/navigation-menu.tsx`
- `src/shared/components/ui/radio-group.tsx`
- `src/shared/components/ui/resizable.tsx`
- `src/shared/components/ui/toggle-group.tsx`
- `src/admin/components/AdminSystemSettings.tsx`
- `server/services/outboundSyncService.ts`
- `server/admin/routes/adminFightResolutionRoutes.ts`
- `server/admin/routes/adminDataPipelineRoutes.ts`
- `replit.md`
