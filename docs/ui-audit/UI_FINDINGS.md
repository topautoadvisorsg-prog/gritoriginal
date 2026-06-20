# GRIT Enterprise UI Findings

Date: 2026-06-18

Benchmark: DraftKings / Underdog Fantasy

Verdict: **Not launch-ready at enterprise visibility.** The visual foundation is credible, but two broken first-session flows and multiple mobile defects block a commercial release.

## Remediation Status (2026-06-19)

All P0/P1 findings and the listed P2 polish items have been remediated on `codex/ui-audit-2026-06-18`. A read-only `UI_AUDIT_FIXTURES=1` mode now provides the populated QA matrix without database writes. Verification evidence is indexed in `SCREENSHOT_INDEX.md`.

## Executive Summary

The English landing hero, Clerk modal, Rules page, typography, and core gold/red identity show a strong product direction. The application falls below that bar once a user signs in: the new-user dashboard crashes, onboarding cannot reliably reach all seven steps, responsive settings are unusable, and empty/shared-data states expose implementation language or fabricated live context. Admin tools are broad but read as internal scaffolding rather than a finished operations product.

No fake fighters or events were written to Supabase because this checkout targets the live shared database. Populated-state coverage needs an isolated fixture mode before visual QA can be considered complete.

## P0 - Release Blockers

### 1. New-user dashboard crashes

- Evidence: `09-dashboard-new-user-desktop.png`.
- Reproduction: create a user with no progression history, complete the profile step, then open `/dashboard`.
- Cause: `src/user/components/dashboard/Dashboard.tsx` calls `dashboard.progression.badge.toUpperCase()` without a fallback.
- Fix: normalize the dashboard payload at the query boundary and render a stable zero-state badge; add a new-user fixture and component test.

### 2. Seven-step onboarding is interrupted after profile save

- Evidence: `06-onboarding-step-1-desktop.png`, `07-onboarding-profile-desktop.png`.
- Cause: `src/App.tsx` mounts onboarding only while `!user.username`; the profile step saves the username before later steps complete.
- Fix: persist an explicit `onboardingCompletedAt` or versioned completion flag. Do not infer completion from username.

## P1 - High Severity

### 3. Mobile settings are unusable

- Evidence: `17-settings-mobile.png`.
- Tabs overlap into a single unreadable line, the email is clipped, and the fixed bottom navigation covers content.
- Fix: replace the tab row with a select/menu or two-row responsive control, constrain identity text, and add bottom safe-area padding.

### 4. Mobile landing navigation collides

- Evidence: `05-landing-logged-out-mobile.png`.
- The founder badge, login action, and `Claim Your Spot` CTA compete for the same narrow header area.
- Fix: use a compact menu at mobile widths and retain one primary CTA only.

### 5. Onboarding violates the product image and color system

- Evidence: `06-onboarding-step-1-desktop.png`, `07-onboarding-profile-desktop.png`.
- Cyan progress/actions do not match GRIT gold/red. Emoji country flags and emoji avatar choices violate the required SVG flag and photographic identity rules.
- Fix: use GRIT tokens, `flag-icons`, and a real headshot upload/default silhouette. Reserve quarter/half-body photography for fighter cards.

### 6. Misleading live and prize content appears without live data

- Evidence: `08-event-empty-desktop.png`, `13-chat-desktop.png`, `20-admin-fighter-manager-desktop.png`.
- The global shell shows `Live Event` with no event. Chat source hardcodes `UFC 300: PEREIRA VS HILL` and `TOTAL PRIZE POOL: $250,000`.
- Fix: derive all live labels and event/prize copy from current event state; hide the module when no event exists.

### 7. Rankings hierarchy and metric labels are inconsistent

- Evidence: `11-rankings-empty-desktop.png`.
- The current user at rank 3 appears before ranks 1 and 2, and global ranking says `POINTS` while the product model is net units.
- Fix: keep podium/order semantics intact, pin the current user in a separately labeled row, and use canonical metric naming everywhere.

### 8. Direct auth routes are unreachable while logged out

- `/sign-in` and `/sign-up` are declared, but the logged-out branch returns the landing page before route matching.
- Fix: resolve public/auth/legal routes first, then use the landing page as the public index.

### 9. Empty screens expose operator language and raw ad scaffolding

- Evidence: `10-fighter-index-desktop.png`, `15-settings-desktop.png`, `18-admin-fight-cards-desktop.png`.
- User copy says `Import fighter data`; visible `AD SPACE (BANNER - DEFAULT-SLOT)` placeholders obscure content.
- Fix: use audience-appropriate empty copy and suppress ad containers until a real creative is available.

### 10. Localization is inconsistent

- Spanish initialization produced a locale parse warning and mixed Spanish/English UI. Spanish landing copy still references the previous 1u-5u model.
- Fix: validate locale JSON in CI, remove stale scoring copy, and add a route-level translation completeness check.

## P2 - Commercial Polish

- Admin sidebar is excessively long and shows untranslated `sidebar.news_tag_manager`; group tools by workflow and fix the missing translation key.
- Admin create-event uses cyan and blue/purple accents outside the gold/red system; use semantic GRIT tokens.
- Desktop settings tabs clip at 1440px; adopt responsive overflow with a visible affordance.
- Fighter/news/event empty states leave large dead areas; use compact branded empty states with one relevant action.
- Chat presents a nearly blank canvas with secondary donation UI competing for attention; lead with the active event conversation or a clear no-event state.
- Country identity still renders emoji in rankings, settings, onboarding, and the admin profile; route all country rendering through the shared flag component.
- The mobile product shell exposes only the first portion of horizontal navigation with no clear overflow control.
- Admin page titles are duplicated between the global header and content panels, reducing density and hierarchy.

## What Already Meets The Bar

- The English logged-out hero has a clear hierarchy, premium media treatment, and recognizable GRIT identity (`03-landing-english-desktop.png`).
- The Clerk modal remains a solid dark surface with clear controls (`04-clerk-sign-in-modal-desktop.png`).
- The Rules page is coherent, scannable, and visually closest to a finished authenticated product (`14-rules-desktop.png`).
- Desktop typography, iconography, spacing tokens, and gold active states provide a usable foundation for the remediation pass.

## Recommended Fix Order

1. Fix the dashboard crash and onboarding completion model.
2. Repair mobile settings and landing navigation.
3. Remove fabricated live/prize content and raw ad placeholders.
4. Standardize flags, imagery, metrics, and locale copy.
5. Add an isolated `UI_AUDIT_FIXTURES=1` mode with realistic events, fighters, picks, rankings, news, and profiles using approved photographic assets.
6. Re-run the full matrix at desktop, tablet, and mobile, including loading/error/partial-image states.

## Fixture Pack Required For Final Visual Sign-Off

The isolated fixture set should include one twelve-fight event, twenty-four fighters, three completed fights, nine saved picks, a 25-user leaderboard, six news stories, and an active chat. Use face/headshots only for avatars and quarter-to-half-body photographs for large fighter cards. Include long names, missing optional stats, underdog/favorite odds, locked picks, win/loss outcomes, and one image failure fallback. Keep fixtures local or in a dedicated non-production Supabase project.
