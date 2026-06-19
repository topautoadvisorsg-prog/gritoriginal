# GRIT Enterprise UI Audit Test Plan

Date: 2026-06-18

Benchmark: DraftKings / Underdog Fantasy

Primary viewports: 1440x1000 desktop, 1024x768 tablet, 390x844 mobile

Theme: dark, gold + red GRIT system

## Quality Gates

- No blank screens, clipped text, overlapping controls, broken media, emoji flags, or transparent auth surfaces.
- Every primary action has a visible hover, focus, disabled, loading, success, and error treatment where applicable.
- Dense gaming surfaces remain scannable: hierarchy, odds, pick state, lock state, and outcome are identifiable in under two seconds.
- Desktop and mobile retain the same information priority without horizontal overflow.
- Fighter imagery uses only face/headshots for avatars and quarter-to-half-body images for large fighter cards.
- Empty states look intentional and direct the next action; loading states preserve final layout dimensions.
- Gold and red remain functional accents, not uncontrolled decoration; body text meets practical dark-theme contrast.

## Execution Matrix

Each applicable screen is tested in:

| Dimension | Cases |
|---|---|
| Authentication | Logged out, new user, returning user, admin, unauthorized |
| Data | Realistic populated, empty, partial/missing image, long text, large counts |
| Network | Initial loading, slow response, API error, retry/recovery |
| Interaction | Default, hover, keyboard focus, disabled, active/selected, success/error toast |
| Viewport | 1440x1000, 1024x768, 390x844 |
| Theme | Current production dark theme |

## Public And Authentication

- `/` logged-out landing: navbar, hero media, social proof, features, how it works, event picks, fighter showcase, leaderboard preview, creator economy, AI banner, community, founder badges, pricing, footer CTA, sticky mobile CTA.
- Landing scroll behavior: fixed navigation, video readability, section transitions, CTA repetition, mobile sticky CTA collision.
- Clerk sign-in modal: opaque dark panel, email-only path, validation, loading, close behavior, mobile keyboard viewport.
- Clerk sign-up modal: email-only path, verification state, error state, return navigation.
- `/sign-in` and `/sign-up`: direct-route fallback and configured Clerk state.
- Legal pages: `/tos`, `/privacy`, `/cookie`, `/creator-agreement`, `/aup` on desktop/mobile.
- Unknown route: branded 404 with useful recovery action.

## New User And Global Shell

- First login and profile bootstrap.
- Seven-step onboarding flow: every step, back/next/skip, progress indication, mobile fit, completion.
- Legacy welcome modal if still reachable.
- Desktop shell: sidebar, header, top tabs, country selector, user menu, active route, collapsed state.
- Mobile shell: bottom navigation, header, safe areas, scrolling, keyboard/focus behavior.
- Global toasts, tooltips, dropdowns, popovers, skeletons, and generic error boundary.

## User Product Screens

- `/dashboard`: populated dashboard, zero stats, tracker enabled/disabled, activity empty/loading/error, countdown, progression.
- `/event`: populated upcoming/live/completed cards; empty calendar; loading/error.
- `/event/:eventId`: fight card sections, pick board, qualification progress, lock states, picks saved/edited/deleted, no odds, long fighter names.
- Inline pick modal: open/close, selection, confidence flags, validation, submitting, success/error, mobile.
- `/event/fight/:fightId`: fighter comparison, odds, fantasy pick, charts, notes, rating, unavailable data, post-fight state.
- `/fighter/index`: search, filters, organization/weight class, populated grid, no results, missing image, mobile list/grid.
- `/fighter/:id`: identity, headshot, metrics, last five, ledger, odds, tags, notes, correction dialog, missing/partial data.
- `/competition`: ranking scopes, populated leaderboard, current-user row, ties, long usernames, empty/loading/error.
- `/ai`: token/entitlement states, prediction cards, loading, empty, error, locked/upsell.
- `/chat`: event/country chat, slip wall, empty room, messages, composer, disabled/banned/muted, long content, mobile keyboard.
- `/news`: filters, populated cards, no results, loading/error, image crop behavior.
- `/news/:id`: article media, metadata, long article, related content, missing article.
- `/rules`: all rule sections, navigation/scanability, desktop/mobile.
- `/groups`: populated groups, no groups, create modal, validation, loading/error.
- `/groups/:groupId`: member/nonmember/owner states, roster, feed/chat, join/leave, missing group.
- `/settings`: profile, privacy, notifications, gamification, account, tracker, slips, stats; save/error/disabled states; delete account confirmation.

## Gamification And Secondary Surfaces

- Badge unlock modal and badge tooltip.
- Rank/streak/tier badges at minimum and maximum values.
- Slip picker and shared slip card.
- Export field selector and preview.
- Fighter correction dialog.
- Notification permission request behavior.
- Country selector using `flag-icons` SVG flags only.

## Admin Screens

- `/admin/fight-cards`: event accordion, result finalization dialog, validation, empty/loading/error.
- `/admin/create-event`: complete form, validation, date/time, mobile/tablet usability.
- `/admin/event-editor`: event selection, card editing, destructive confirmation.
- `/admin/import`: upload/import states, validation, progress, failure summary.
- `/admin/fighter-manager`: populated table/grid, search/filter, bulk selection/delete, edit form, image upload/crop dialog.
- `/admin/create-news`: editor, image/media, preview, validation.
- `/admin/admin-tags` and `/admin/admin-news-tags`: create/edit/delete, empty states.
- `/admin/admin-badges`, `/admin/admin-raffle`, `/admin/admin-verification`.
- `/admin/admin-odds`: event/fight selection, manual odds entry, save/error states.
- `/admin/admin-users`: populated table, role menu, ban dialog, AI access, long identities.
- `/admin/admin-audit`, `/admin/admin-settings`, `/admin/admin-suggested-questions`.
- `/admin/admin-intel-feed`, `/admin/admin-chat`, `/admin/admin-jobs`.
- Unauthorized access: no content flash, clear redirect/denial.

## Visual Evidence

Screenshots are stored in `docs/ui-audit/screenshots/` and named:

`NN-surface-auth-state-viewport.png`

The final report records viewport, account state, data state, outcome, and linked findings for each image.

## Exit Criteria

- All critical routes render at desktop and mobile sizes.
- Auth and admin coverage is completed or explicitly marked blocked with reason.
- Every P0/P1 issue includes reproducible steps and a concrete fix proposal.
- Screenshot index and prioritized findings report are complete.
- Typecheck, production build, and unit tests remain green after any audit-fixture changes.
