# GRIT Test Status - 2026-06-19

## Current Verdict

The primary UI audit remediation, disposable scoring pipeline smoke, and single-process Socket.IO concurrency target are green. GRIT is not yet production-load certified because database-backed chat writes, Clerk authentication at volume, Railway networking, and multi-replica fanout have not been measured in an isolated staging environment.

## Data Created During Tests

- UI audit: one disposable Clerk audit account. No permanent fake event or fighter catalog was left in the shared database.
- Pipeline smoke: one prefixed user, 20 fighters, one event, 10 fights, and 10 picks were created, verified, and deleted automatically.
- Chat load: 1,000 and 1,500 synthetic authenticated users existed only in memory inside a local test server. No Clerk, Supabase, OpenAI, OneSignal, Stripe, or Railway calls were made by the load harness.

## Automated Results

| Area | Result | Scope |
|---|---:|---|
| Vitest | 91/91 passing | 12 test files |
| Pipeline smoke | 7/7 passing | Fighters, event, picks, results, net-unit scoring, history, key, progression, leaderboard, notification invocation |
| Chat auth regression | Passing | Rejects unauthenticated sockets and broadcasts to authenticated global clients |
| Real Clerk browser handshake | Passing | Existing audit account connected from `/chat` with a verified Clerk session token |
| Chat load requirement | 1,000/1,000 connected | 50-client batches every 50 ms |
| Chat load headroom | 1,500/1,500 connected | 15,000/15,000 deliveries |
| Chat p95 at 1,000 | 147 ms | Local single-process broadcast |
| Chat p95 at 1,500 | 210 ms | Local single-process broadcast |

An intentionally unrealistic zero-ramp burst admitted only 232 of 1,000 clients before local WebSocket errors. The product therefore needs connection ramping/retry behavior and a production reconnect-storm test.

## Defects Found And Fixed

1. Socket.IO still authenticated through the retired Replit Passport session after the Clerk migration.
2. The React socket hook stored the socket only in a ref, so consumers were not reliably re-rendered when the connection became available.
3. Global chat clients did not join the `global` room, so typing-presence events targeted a room with no members.

The server now verifies Clerk session tokens, resolves the local GRIT user, joins authenticated clients to the global room, and supports an injectable in-memory resolver exclusively for isolated tests. The frontend sends its Clerk token during the Socket.IO handshake and exposes the connection through React state.

## Still Required Before "Ready For Thousands"

1. Provision an isolated staging Supabase project and staging Clerk instance. Do not volume-test the shared production database.
2. Seed a realistic 12-fight card, 24 fighters, 100 user profiles, picks, rankings, chat history, and news in staging.
3. Run authenticated HTTP load against `POST /api/chat`, message history, picks, dashboard, event card, and leaderboard while measuring Postgres pool saturation and p95/p99 latency.
4. Run a 1,000-client test against a Railway staging deployment, including gradual ramp, reconnect storm, slow clients, and moderation events.
5. Add a Socket.IO Redis adapter before using multiple Railway replicas; the current in-memory room state cannot fan out across processes.
6. Re-run populated desktop/mobile visual QA against staging and preserve screenshots.

## Commands

```bash
npm run test
npm run smoke:pipeline
npm run test:load:chat
```

Optional local headroom run:

```powershell
$env:CHAT_LOAD_CLIENTS='1500'; npm run test:load:chat
```
