# GRIT Tab-to-Backend Audit

**Audit date:** June 21, 2026
**Branch baseline:** `main` at `3f12b57`

## Status scale

- **Solid (code):** UI contract, mounted API, authorization, persistence path, and automated coverage agree. Live/staging data may still be empty.
- **Partial:** the main path exists, but a required lifecycle, external dependency, operational proof, or secondary behavior remains.
- **Broken:** a visible control calls no route, uses the wrong contract, fabricates success, or exposes an unsafe behavior.
- **Blocked:** deliberately must not operate until legal, financial, migration, or environment gates are satisfied.
- **Static:** no backend is expected; content still requires product/legal ownership.

## Public, auth, and legal surfaces

| Surface | Frontend | Backend / dependency | Status | Evidence and remaining work |
|---|---|---|---|---|
| Landing `/` | `LandingPage` | `/api/intel-feed`; Clerk CTA | Partial | Responsive remediation is complete. Undeployed creator, founder subscription, pricing, and token sections are suppressed; real event preview still requires populated staging. |
| Sign in `/sign-in` | `SignInPage` | Clerk | Solid (code) | Public route ordering and Clerk modal flow are repaired. Provider/email flow still needs environment smoke proof after key rotation. |
| Sign up `/sign-up` | `SignUpPage` | Clerk + local `/api/me` bootstrap | Partial | Route is reachable and email-first flow is wired. Full Clerk webhook/local-user reconciliation needs staging evidence. |
| Terms `/tos` | legal page | none | Static | Attorney review required. Acceptance is not stored. |
| Privacy `/privacy` | legal page | none | Static | Attorney review and data-retention reconciliation required. |
| Cookies `/cookie` | legal page | none | Static | Consent enforcement is not implemented. |
| Creator agreement `/creator-agreement` | legal page | undeployed creator economy | Blocked | Must not imply operational creator payments before Connect/ledger deployment. |
| Acceptable use `/aup` | legal page | moderation systems | Static | Text exists; versioned acceptance is not recorded. |

## User navigation tabs

| Tab / route | Backend chain | Status | Evidence and remaining work |
|---|---|---|---|
| Dashboard `/dashboard` | `/api/me/dashboard`, `/api/me/stats`, `/api/activity/feed` | Partial | Zero-state, event/snapshot association, and canonical net units are repaired. Populated staging and query-failure browser proof remain. |
| Events `/event` | `/api/events`, `/api/events/:id` | Solid (code) | Empty/error/loading states and event detail contract exist. Live catalog remains an environment/data dependency. |
| Event card `/event/:eventId` | event detail + picks APIs | Partial | Pick create/edit/delete contract and transaction rules are code verified; isolated DB concurrency proof remains. |
| Fight detail `/event/fight/:fightId` | event detail, pick, result, notes, ratings | Partial | Pick pipeline is repaired. Notes are time-limited and have no journal/draft recovery; result lifecycle needs staging. |
| Fighters `/fighter/index` | `/api/fighters` | Solid (code) | Browse contract is mounted and rate limited; production catalog was empty at last inspection. |
| Fighter profile `/fighter/:id` | fighter, fights, tags, ratings, corrections | Partial | Reads and correction submission exist. Image/object-storage durability and populated proof remain. |
| Rankings `/competition` | global/event/period leaderboard APIs | Partial | Scoping, canonical eligibility, idempotent snapshots, dashboard association, and progression consumption are repaired. Tie/qualification/legacy policy and staging reconciliation remain. |
| AI analyst `/ai` | events/fighters + `/api/ai/chat` | Partial | Dead `/api/ai/events` dependency is replaced by mounted event/fighter APIs. Premium chat is gated, but hard per-user budget enforcement and provider staging proof remain. |
| Chat `/chat` | `/api/chat`, config, slips, Socket.IO | Partial | Auth/fanout and honest empty states are implemented. Distributed adapter/rate limit, durable multi-instance proof, and moderation load proof remain. |
| News `/news` | `/api/news`, tags | Solid (code) | Public published-feed and article contracts are mounted. Content population is operational. |
| News article `/news/:id` | `/api/news/:id` | Solid (code) | Direct article lookup and 404 path exist. |
| Groups `/groups` | group CRUD, browse, public join | Partial | Public self-join, serialized capacity checks, real counts, and canonical net units are implemented. Private requests/invites and DB concurrency proof remain. |
| Group detail `/groups/:groupId` | membership, chat, rankings | Partial | Auth identity and honest persistence errors are fixed. Realtime rooms, pagination, and moderation remain. |
| Rules `/rules` | none | Static | Operational pick/progression/community rules remain; undeployed cash rewards, founder subscriptions, creator money, raffles, and token sales are suppressed. |

## Settings tabs

| Settings tab | Backend chain | Status | Evidence and remaining work |
|---|---|---|---|
| Profile | `/api/me`, username check, avatar upload | Partial | Profile and headshot paths are wired; new country writes are canonical ISO alpha-2 codes with legacy-name display compatibility. Durable object storage and historical country migration remain. |
| My Stats | `/api/me/stats` | Partial | Canonical stored net-unit reads are implemented. Historical/legacy interpretation remains a rankings decision. |
| Privacy | `/api/me` privacy JSON | Partial | Preferences persist, but every consuming surface and export/deletion policy needs verification. |
| Real Tracker | `/api/me/settings`, `/api/me/stats` | Solid (code) | Setting and unit size persist; stats use canonical stored outcomes. |
| Notifications | `/api/me/settings` + OneSignal | Partial | Preferences persist. Delivery, revocation, and device lifecycle need staging proof. |
| Gamification | `/api/me/settings` + local audio state | Partial | Badge/streak visibility and effects persist; music volume is intentionally device-local. Progression staging proof remains. |
| My Slips | `/api/slips/*` + local upload storage | Partial | CRUD exists; ephemeral filesystem storage and moderation lifecycle block production reliability. |
| Account | `/api/me/delete` + Clerk | Partial | Active app picks/user and Clerk deletion are attempted, and UI no longer promises universal immediate erasure. Uploads, chat/AI logs, payments, and retained-record reconciliation remain. |

## Admin tabs

| Admin tab | Backend chain | Status | Evidence and remaining work |
|---|---|---|---|
| Create Event | admin event/image APIs | Partial | Canonical lifecycle contract is implemented; object storage and staging event creation remain. |
| Event Editor | event reads + admin update/status/fight APIs | Partial | Mounted contracts align. Close/retry behavior needs migration and staging proof. |
| Fight Cards | admin fights + result resolution | Partial | Resolution/scoring chain is code covered; full card replay/correction proof remains. |
| Import | data pipeline APIs | Partial | Approval/apply paths exist. External engine credentials, staging replay, and payload reconciliation remain. |
| Fighter Manager | fighter CRUD/corrections/import | Partial | CRUD paths align; populated data, imports, and image durability remain. |
| Create News | `/api/admin/news` CRUD | Solid (code) | Dead namespace mismatch and 204 parsing are repaired; route registration is covered. |
| Fighter Tags | tag definitions + fighter tag APIs | Solid (code) | Dead paths and single-tag/replacement payload mismatch are repaired. |
| News Tags | `/api/admin/tags` | Solid (code) | CRUD contracts align and are admin guarded. |
| Badge Manager | admin user badge APIs | Partial | CRUD aligns. Badge policy and legacy emoji/icon data need canonicalization. |
| Raffle Manager | event pool/draw APIs | Blocked | Obsolete global-ticket controls are replaced by an event-scoped read-only audit view. Draw/funding/payout/legal gates are unresolved; operations remain deliberately disabled. |
| User Verification | influencer + verify/feature APIs | Solid (code) | Contracts align and are admin guarded. |
| Odds Editor | event detail + admin odds update | Solid (code) | Dead event-fights endpoint is replaced by mounted event detail reads. |
| User Manager | admin users/ban/role/AI access | Partial | Contracts align. Clerk entitlement/ban reconciliation needs staging proof. |
| Audit Log | `/api/admin/audit-logs` | Solid (code) | Read contract and admin guard align; retention/export policy remains operational. |
| System Settings | pipeline configuration | Partial | Secret reads are write-only metadata and save responses no longer echo values. Nonfunctional maintenance/alert controls were removed. Encryption-at-rest and rotation still need review. |
| Suggested Questions | admin AI suggested-question APIs | Solid (code) | CRUD contracts align and are guarded. |
| Intel Feed | admin intel-feed APIs | Solid (code) | CRUD contracts align; content freshness is operational. |
| Chat Management | admin chat/slip/moderation APIs | Partial | Contracts align; high-volume, retention, and distributed moderation proof remain. |
| Jobs Queue | failed/retry job APIs | Partial | Read/retry exists. Durable distributed execution and replay identifiers remain. |

## Cross-cutting release blockers

1. Apply and verify migrations `0002` through `0005` in an isolated environment before any lifecycle/ranking promotion.
2. Complete the deterministic pick/ranking/event-close staging proof and reconciliation.
3. Keep raffle/reward operations disabled until funding, payout reconciliation, official rules, and counsel approval exist.
4. Replace one-time/client-controlled Stripe checkout with server-owned recurring plans and idempotent entitlement ledgers.
5. Deploy versioned legal acceptance and complete cross-store account deletion/export.
6. Move uploads and chat/job coordination to durable multi-instance infrastructure.
7. Resolve runtime dependency advisories and add CI migration/API-contract gates.
