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
| `POST /api/groups/:id/join` | Authenticated self-join for public groups with serialized capacity enforcement |
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
- public self-join with real member counts and idempotent existing-member handling;
- owner/admin-controlled member addition/removal;
- owner role assignment and ownership transfer;
- member-only chat authorization;
- durable chat failures surface as errors instead of empty/mock success states;
- authenticated user identity drives owner/current-message behavior;
- group member rankings use canonical stored net units;
- chat messages enforce a 2,000-character maximum;
- frontend hub/detail/chat surfaces.

## Broken or missing behavior

- No private request/invitation acceptance flow.
- Chat polls every three seconds instead of using the existing Socket.IO infrastructure.
- Message body has no shared schema, pagination cursor, or group-specific rate limit.
- Role-management UI is incomplete despite backend endpoints.
- Group ranking has no documented relationship to canonical GRIT net-unit rankings.

## Required production model

1. Add explicit membership state: invited, requested, active, banned, left.
2. Add private request/invite acceptance endpoints with shared validation.
3. Resolve current user only from authenticated React context/API data.
4. Select a canonical group ranking metric from the repaired ranking service.
5. Remove every mock/silent persistence fallback outside explicit fixture mode.
6. Add paginated durable chat and authenticated Socket.IO group rooms.
7. Add message limits, rate limiting, reports, moderation, deletion policy, and audit logs.
8. Cover permissions and concurrent membership limits with DB-backed tests.

## What can ship today

Internal QA of group CRUD, public self-join, and UI. Public community launch is blocked by private invite/request flows, realtime pagination, and moderation/abuse controls.
