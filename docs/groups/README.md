# GRIT Groups

**Truth date:** June 21, 2026
**Release status:** core CRUD is partially implemented; groups are suitable for controlled QA, not production community launch.

## Existing storage

Group, group-member, and group-chat models exist in the active schema/database set. Membership roles are `owner`, `admin`, and `member`. Groups support public/private state, descriptions, images, member limits, and ownership.

## Mounted APIs

| API | Behavior |
|---|---|
| `POST /api/groups` | Authenticated group creation; owner membership created |
| `GET /api/groups/my` | Current user's groups |
| `GET /api/groups/browse` | Public group discovery |
| `GET /api/groups/:id` | Detail; private groups require membership |
| `POST /api/groups/:id/members` | Owner/admin adds a specified user |
| `DELETE /api/groups/:id/members/:userId` | Self-leave or admin removal |
| `PATCH /api/groups/:id/members/:userId/role` | Owner changes member/admin role |
| `POST /api/groups/:id/transfer` | Owner transfers ownership |
| `DELETE /api/groups/:id` | Owner deletes group |
| `GET/POST /api/groups/:id/chat` | Member-only chat history/send |

## What works

- authenticated creation and ownership;
- public discovery and private detail access checks;
- owner/admin-controlled member addition/removal;
- owner role assignment and ownership transfer;
- member-only chat authorization;
- frontend hub/detail/chat surfaces.

## Broken or missing behavior

- No public self-join or request/invitation acceptance flow.
- Discovery copy implies joining, but only an owner/admin can add a known user ID.
- Group leaderboard sorts `intelligencePoints`, but the group service does not supply that field.
- UI uses `window.currentUser`, which the application does not establish, for owner/current-message behavior.
- Group chat GET converts database errors to an empty list.
- Group chat POST converts insert failure to mock success, so the UI can claim a lost message was saved.
- Chat polls every three seconds instead of using the existing Socket.IO infrastructure.
- Message body has no shared schema, maximum length, pagination cursor, or group-specific rate limit.
- Role-management UI is incomplete despite backend endpoints.
- Group ranking has no documented relationship to canonical GRIT net-unit rankings.

## Required production model

1. Add explicit membership state: invited, requested, active, banned, left.
2. Add public join and private request/invite acceptance endpoints with shared validation.
3. Resolve current user only from authenticated React context/API data.
4. Select a canonical group ranking metric from the repaired ranking service.
5. Remove every mock/silent persistence fallback outside explicit fixture mode.
6. Add paginated durable chat and authenticated Socket.IO group rooms.
7. Add message limits, rate limiting, reports, moderation, deletion policy, and audit logs.
8. Cover permissions and concurrent membership limits with DB-backed tests.

## What can ship today

Internal QA of group CRUD and UI. Public community launch is blocked by missing join flow, false-success chat persistence, broken leaderboard data, identity handling, and moderation/abuse controls.
