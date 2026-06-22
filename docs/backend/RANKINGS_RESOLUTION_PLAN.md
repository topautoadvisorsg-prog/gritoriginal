# Rankings Audit Resolution Plan

**Plan date:** June 21, 2026
**Implementation status:** R0/R1/R3, R4 idempotency, durable close, R7 dashboard repair, and replay-safe per-user progression applications are implemented in code. Progression now consumes the canonical stored net-unit score and shared eligibility policy; staging proof, legacy cleanup, and product decisions remain.

## Scale

- **Severity:** Critical, High, Medium, Low.
- **Complexity:** S (hours), M (1-3 focused days), L (3-7 days), XL (multi-stage migration/operations).
- **Production risk:** risk introduced while deploying the correction, not the risk of leaving the defect open.

## Resolution matrix

| ID | Finding | Severity | Impact | Recommended fix | Complexity | Production risk |
|---|---|---:|---|---|---:|---:|
| R0 | Event status validator accepts only `draft/ready`, while lifecycle requires `Upcoming/Live/Completed/Closed/...` | Critical | Normal lock/close/snapshot/progression path cannot be expressed through the validated API | Define one shared event-status enum and transition schema; migrate existing values; contract-test every transition | M | High: status migration can strand events if mapping is wrong |
| R1 | `users.totalPoints` sums red and voided picks that snapshots exclude | Critical | Global and period winners can disagree; creator records and future money decisions become untrustworthy | Shared predicate and staging-only drift/rebuild command implemented; execute against isolated staging, retain evidence, and define production rollout | L | High: visible ranks will change |
| R2 | Event close performs snapshot/progression/reward side effects before status update, without idempotency | Critical | Partial failure and retry can duplicate snapshots/notifications or leave mismatched event state | Closed state now commits first; durable run records snapshot outcome and retry; raffle removed and progression explicitly deferred pending replay safety | L | High: lifecycle orchestration and recovery migration |
| R3 | `GET /api/leaderboard?eventId=` ignores `eventId` | High | API returns lifetime data when event data was requested | Implemented: global rejects `eventId`; event route validates UUID and selects newest event snapshot; latest is period-only | M | Medium: callers may rely on accidental behavior |
| R4 | Snapshot creation always inserts; event read returns an unordered match | High | Multiple competing “final” event rankings and duplicate rank notifications | New writes now use a unique scope key, retries reuse existing rows, reads are deterministic; clean legacy duplicates and define version/correction policy | L | High: constraint migration needs reconciliation |
| R5 | Tie policy is undefined and equal scores receive different ranks | High | Awards, badges, creator credibility, and UI positions can be unfair | Founder selects competition, dense, or deterministic tiebreak; implement one pure rank function and fixtures | M | Medium: existing displayed ranks change |
| R6 | Historical 1-5 unit picks can mix with new fixed one-unit picks | High | Lifetime comparison can reward legacy variable stakes and distort creator performance | Choose legacy policy: preserve separate era, normalize/recalculate, or start a new season; never silently mix | XL | High: irreversible historical interpretation |
| R7 | Dashboard selects newest snapshot without exact type/event and reuses it for recent rank | High | Users can see rank from the wrong event/period | Implemented in code: select latest closed event, then newest snapshot for that exact event/type; staging proof pending | M | Medium |
| R8 | Progression independently recalculates ROI/net units | High | Stars/streaks can disagree with rankings after rule changes | Implemented in code: exactly-once user/event ledger and retry runner consume stored net-unit hundredths through the shared ranking eligibility policy | L | High: progression history may need rebuild |
| R9 | Qualification policy is not centralized for leaderboard inclusion | High | Low-participation users may rank differently across surfaces | Put qualification in the canonical ranking domain and return eligibility/reason explicitly | M | Medium |
| R10 | Month/year membership uses event date with undocumented timezone/boundary | Medium | Events near boundaries can land in the wrong period | Define period timestamp/timezone; persist period key or calculate in UTC consistently | M | Medium |
| R11 | Country values are not canonicalized | Medium | Equivalent countries split country leaderboards | Store/render ISO country code and migrate aliases | M | Medium |
| R12 | Snapshot identity/privacy policy is undefined | Medium | Historical username/avatar privacy can conflict with current preferences | Decide immutable-at-event versus current-profile projection; separate user ID/result from display projection | M | Medium |
| R13 | Legacy names `pointsAwarded/totalPoints` represent net-unit hundredths | Medium | Future code can apply wrong units/formulas | Introduce typed `netUnitsHundredths` domain value; migrate column/API names after compatibility period | L | Medium |
| R14 | Snapshot type schema comments and runtime values disagree | Low | Maintenance and migration errors | Shared event/monthly/yearly enum and route validation implemented; legacy comments/storage cleanup remains | S | Low |

## Decision gate

Founder/product must approve these before R1/R5/R6/R9/R10/R12 implementation:

1. Final versus provisional ranking authority.
2. Tie policy.
3. Qualification needed to appear in rankings.
4. Legacy variable-unit history policy.
5. Monthly/yearly timezone and boundary timestamp.
6. Correction/reopen/version policy.
7. Historical identity/privacy behavior.

## Recommended delivery sequence

1. R0 shared status model and transition tests. **Code complete; migration/staging pending.**
2. R1/R9 canonical eligible-pick and qualification domain. **Eligibility and reconciliation tooling implemented; DB execution/qualification pending.**
3. R5 deterministic tie function after decision.
4. R3 explicit scoped read API. **Code implemented; staging/browser proof pending.**
5. R4 versioned/idempotent snapshots. **New-write idempotency implemented; legacy cleanup/version policy pending.**
6. R2 durable event-close orchestration. **Snapshot phase implemented; progression deferred and staging proof pending.**
7. R7/R8 downstream dashboard/progression consumers. **Implemented in code; staging proof and historical rebuild policy pending.**
8. R6 legacy-season migration.
9. R10-R14 normalization and naming cleanup.
10. Isolated PostgreSQL proof, reconciliation, and staging UI confirmation.

## Release gate

Rankings can move to **Verified complete** only when every Critical/High item is resolved, reconciliation produces zero unexplained drift, retrying event close is harmless, scope/tie/qualification fixtures pass, and the isolated staging dataset proves global/event/month/year/dashboard/progression consistency.
