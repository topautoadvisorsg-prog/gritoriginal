# Community, Groups, and Chat Plan

**Current state:** global/event/country chat and groups are functional but need production verification. Public self-join, canonical group rankings, authenticated identity, honest persistence errors, and message limits are implemented; private membership workflows and realtime/moderation hardening remain.

## Decisions required

- Private request/approval/invite rules.
- Group ranking metric and season scope.
- Message retention/deletion/edit policy and moderation escalation.
- Realtime expectations and maximum group/member/message limits.

## Delivery phases

1. Define shared schemas for group creation, membership transitions, roles, and messages.
2. Add membership states: invited, requested, active, banned, left.
3. Implement private request/invite acceptance and owner/admin controls. Public self-join is implemented.
4. Authenticated context/API identity is implemented.
5. Mock/silent DB fallbacks are removed from group chat.
6. Group member rankings use canonical stored net units.
7. Add cursor pagination, length limits, per-user/group rate limits, report/block/mute enforcement.
8. Move group chat to authenticated Socket.IO rooms with REST history as durable authority.
9. Add moderation audit, retention cleanup, and abuse/support operations.

## Proof

Role/ownership matrix; concurrent join/member limit; private data access; banned/muted users; DB/socket outage; reconnect/order/deduplication; pagination; message loss prevention; multi-instance adapter; ranking consistency.

## Definition of done

Every membership transition is authorized/audited; messages never return false success; realtime and durable history reconcile; moderation and load tests pass; group rankings match canonical performance.

**Complexity:** L. **Production risk:** Medium-high.
