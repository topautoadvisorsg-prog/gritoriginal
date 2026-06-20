# GRIT UI Audit - Second Pass

Date: 2026-06-19

Benchmark: DraftKings / FanDuel / Underdog Fantasy

## Verdict

The visual identity is distinctive, but the product is not ready for a populated pick-flow sign-off. Production is healthy yet `GET /api/fighters` returns an empty array, so users cannot browse real fighters or create real picks. The current landing page also presents several preview states with enough specificity to look like live product data.

## P0 - Release Blockers

1. **No production fighter catalog.** `GET /api/fighters` returns `[]`. There is no event-to-fighter-to-pick journey to test on the deployed app.
2. **No isolated populated visual environment.** Previous smoke tests created disposable fighters, events, fights, and picks, then deleted them. They were pipeline fixtures, not a persistent demo catalog.
3. **Local environment drift.** The root `.env` was absent. The newest local backup starts the servers but is not compatible with the current database schema, and local fighter/health requests return 500. A dedicated staging project is still required.

## P1 - Visual And Product Findings

1. **Watermarked hero media.** The deployed hero visibly shows a `Veo` watermark. Replaced locally with a project-owned 145 KB WebP arena image.
2. **Hero hierarchy clips at desktop height.** The final headline line falls below a 1280x720 first viewport. Reduced type scale, spacing, and hero padding locally.
3. **Preview content presents as live data.** The fallback intelligence feed, leaderboard, and chat include named fighters, exact odds, rankings, and online counts. Locally changed fallback surfaces to clearly labeled previews.
4. **Landing pick mock contradicts scoring.** The visual still offered 1-5 unit buttons while the canonical model is one unit per pick. Replaced with a fixed `1 UNIT` value.
5. **Spanish landing falls back into English.** The Spanish hero object used an older translation schema, producing a mixed-language headline and controls. Updated the schema and corrected stale leaderboard/feature copy.
6. **First viewport lacks a product-state preview.** The hero establishes brand well, but does not show the actual event card, pick slip, or current competition state. Once staging data exists, a compact real event module should appear within the first two scroll sections.

## P2 - Commercial Polish

- The production bundle is approximately 3.4 MB JavaScript and 658 KB CSS before gzip. Route-level code splitting is warranted before a large launch.
- The landing page is extremely long and repeats several claims. Consolidate sections around three decisions: understand the contest, inspect the product, join.
- CTA vocabulary is inconsistent across languages and sections (`Comenzar`, `Únete a la Liga`, `Claim Your Spot`). Use one primary verb per locale.
- Promotional visuals should never contain factual-looking odds, rankings, online counts, or model accuracy unless they come from a live endpoint and include a timestamp.

## Recommended Next Phase

1. Provision an isolated staging Supabase + Clerk environment.
2. Seed 24 fighters, one 12-fight card, odds, picks, results, and leaderboard rows in staging.
3. Execute the signed-in journey at desktop and mobile: event list -> card -> fight -> pick -> edit -> lock -> recap.
4. Capture populated, loading, empty, error, locked, and completed states.
5. Run authenticated HTTP and Railway Socket.IO load tests against that same staging stack.

## Evidence

- `screenshots-pass-2/01-live-landing-desktop.png` - deployed 1280x720 hero before remediation; watermark and headline clipping are visible.

## Verification

- `npm run build` - passing.
- `npm run test` - 91/91 passing across 12 files.
- Production `/api/health` - 200.
- Production `/api/fighters` - 200 with `[]`.
