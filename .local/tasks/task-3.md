---
title: Chat & Slip system — backend foundation
---
# Chat & Slip System — Backend Foundation

## What & Why
Build the full server-side foundation for the community chat upgrade and slip sharing system: database schema, API routes, and the daily cleanup cron job. All user-facing and admin UI tasks depend on this being in place first.

## Done looks like
- `chat_config` table stores the ON/OFF toggle and cooldown setting (default 30 min); single-row config pattern, readable by chat routes
- `chat_mutes` and `chat_bans` tables store per-user mute/ban records with optional expiry
- `slips` table stores uploaded slip images with status (pending/approved/rejected), featured flag, admin caption, 7-day expiry date, and per-user cooldown tracking
- `chat_notifications` table stores in-app rejection notices for users
- POST `/api/chat` rejects messages when chat is OFF (returns 403 with "Chat opens during live events") and rejects banned/muted users accordingly
- File upload endpoint at `/api/slips/upload` accepts JPG/PNG/WebP ≤5MB, saves to `uploads/slips/`, writes pending record to DB
- User slip routes: GET own slips with status + days remaining, DELETE own slip
- Slip cooldown: POST `/api/chat` with a slip message checks user's last slip post time; returns cooldown error if within window
- Admin slip routes: GET pending queue, PATCH approve/feature/reject, DELETE any slip; rejection triggers in-app notification record
- Admin chat routes: GET/DELETE messages, POST mute/ban, GET/DELETE mutes/bans, GET chat activity log
- Admin config route: GET/PATCH chat config (toggle + cooldown minutes)
- Public route: GET `/api/slip-wall` returns up to 6 most-recently-featured active slips (non-expired, is_featured=true)
- Daily cron task at midnight deletes all slips older than 7 days from filesystem and database
- All slip moderation actions written to existing admin audit log

## Out of scope
- Any frontend UI (admin or user-facing)
- Socket.IO real-time broadcast of slip messages (can be added in a follow-up; REST polling is sufficient for MVP)
- Auto-linking chat open/close to events system (flagged as future work per spec)

## Tasks
1. **Schema** — Add `chat_config`, `chat_mutes`, `chat_bans`, `slips`, and `chat_notifications` tables to shared schema. Run db:push to migrate.

2. **Chat enforcement middleware** — Update `chatService.postMessage` to check chat_config ON/OFF, check chat_bans and chat_mutes before inserting. Add a `messageType` field to `chatMessages` to support slip messages (`'text' | 'slip'`).

3. **Slip upload route** — Register `/api/slips/upload` on the user server. Validate file type and size, write to `uploads/slips/<userId>/<uuid>.<ext>`, insert pending slip record. Enforce one-pending-per-upload (no batching). Include 7-day expiry date calculation on insert.

4. **User slip routes** — GET `/api/slips/mine` (own slips with status, days remaining), DELETE `/api/slips/:id` (own, only pending/rejected). GET `/api/chat/notifications` for in-app rejection notices; PATCH to mark read.

5. **Admin slip routes** — Register on the admin server: GET `/api/admin/slips/pending`, PATCH `/api/admin/slips/:id` (approve, approve+feature, reject + write notification record, add caption), DELETE `/api/admin/slips/:id`. GET `/api/admin/slip-wall` all featured slips ordered by featuredAt desc.

6. **Admin chat management routes** — GET `/api/admin/chat/messages` (paginated), DELETE `/api/admin/chat/messages/:id`, POST `/api/admin/chat/mute` and `/ban`, DELETE mute/ban by id, GET `/api/admin/chat/config`, PATCH config (isOpen toggle + cooldownMinutes).

7. **Public slip wall route** — GET `/api/slip-wall` on user server, returns 6 most recently featured non-expired slips. No auth required.

8. **Slip cooldown enforcement** — On POST `/api/chat` when `messageType === 'slip'`, query slips table for user's last approved-slip-posted-at and compare against configured cooldown; return 429 with minutes-remaining if inside window.

9. **Daily slip cleanup cron** — Add task to `cronService.ts` scheduled at midnight (00:00 daily). Finds all slips where `expiresAt < now`, deletes files from filesystem, deletes DB records.

## Relevant files
- `shared/schema.ts`
- `server/services/chatService.ts`
- `server/services/cronService.ts`
- `server/services/storageService.ts`
- `server/user/routes/chatRoutes.ts`
- `server/user/routes/uploadRoutes.ts`
- `server/user-server.ts`
- `server/admin-server.ts`
- `server/admin/routes/adminRoutes.ts`
- `shared/models/auth.ts`