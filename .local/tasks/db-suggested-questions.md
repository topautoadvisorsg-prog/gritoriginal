# DB-Managed Suggested Questions

## What & Why
Suggested questions for the fight analyst chat are currently hardcoded in the server source. The document requires them to be stored in the database so they can be updated by admins without a code deployment.

A new `ai_suggested_questions` table holds the global template questions (not per-fight). The existing API endpoint that serves them to the frontend reads from this table instead of the hardcoded array. An admin UI panel lets admins add, reorder, toggle, and delete questions through the admin dashboard.

## Done looks like
- A new `ai_suggested_questions` table exists in the database with the 8 seed questions already populated
- `GET /api/ai/fight/:fightId/suggested-questions` reads from the DB and returns only active questions ordered by `sortOrder`
- The admin dashboard has a "Suggested Questions" panel (under AI or System Settings) where admins can: view all questions, add new ones, toggle active/inactive, reorder via sort number, and delete
- Admin changes to suggested questions are reflected immediately for new fight analyst sessions (no redeploy needed)
- The hardcoded `SUGGESTED_QUESTIONS` array in `fightQaCache.ts` is removed; `isSuggested` detection in the cache store also reads from DB (or falls back gracefully)

## Out of scope
- Per-fight custom question sets (all fights share the same global list)
- Phase 2 embedding/semantic matching
- Any change to the cache lookup or archive logic

## Tasks
1. **Schema and seed** — Add `ai_suggested_questions` table to `shared/schema.ts` (id uuid PK, question text, sortOrder integer, isActive boolean default true, createdAt timestamp). Run `db:push` to create it. Seed with the 8 current hardcoded questions so existing fight sessions are unaffected immediately.

2. **Update suggested questions API** — Modify `GET /api/ai/fight/:fightId/suggested-questions` in `aiChatRoutes.ts` to query the `ai_suggested_questions` table for active questions ordered by `sortOrder`. Remove reliance on the hardcoded `SUGGESTED_QUESTIONS` array. Update `isSuggested` detection in cache store to compare against DB-sourced list.

3. **Admin CRUD endpoints** — Add admin-only REST endpoints: `GET /api/admin/ai/suggested-questions`, `POST /api/admin/ai/suggested-questions`, `PATCH /api/admin/ai/suggested-questions/:id`, `DELETE /api/admin/ai/suggested-questions/:id`. Register on the admin server.

4. **Admin UI panel** — Build a "Suggested Questions" management panel in the admin dashboard. Display the list with sort order, active toggle, and delete button. Include an "Add question" form. Wire to the admin endpoints.

## Relevant files
- `shared/schema.ts`
- `server/ai/fightQaCache.ts`
- `server/user/routes/aiChatRoutes.ts:78-90`
- `server/admin-server.ts`
- `src/user/components/aichat/AIChatTab.tsx`
