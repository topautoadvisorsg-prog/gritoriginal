# GRIT UI Audit Screenshot Index

## Remediation Verification (2026-06-19)

- `22-settings-desktop-remediated.png` - responsive desktop settings tabs at 1440px.
- `23-rankings-fixture-desktop.png` - 25-user fixture leaderboard with pinned current-user position and net units.
- `24-settings-mobile-remediated.png` - 390px settings navigation, constrained identity, and bottom-nav clearance.
- `25-fixture-event-desktop.png` - isolated 12-fight fixture event with photographic fighter imagery.
- `26-admin-create-event-remediated.png` - grouped admin navigation and GRIT gold/red event workflow.
- `27-landing-mobile-remediated.png` - 390px logged-out landing with one compact primary header CTA.

## Fighter Image System Verification (2026-06-22)

- `fighter-image-system-event-desktop-1440.png` - event carousel at 1440px; dedicated body artwork selected for the featured matchup.
- `fighter-image-system-event-mobile-390.png` - same event at 390px; headshots selected, with no horizontal overflow.

Date: 2026-06-18

Desktop viewport: 1440x1000

Mobile viewport: 390x844

| # | File | State | Result |
|---|---|---|---|
| 01 | `01-landing-logged-out-desktop.png` | Logged out, desktop, Spanish locale | Rendered; mixed-language and hierarchy issues |
| 02 | `02-landing-logged-out-desktop-full.png` | Logged out, full-page landing | Rendered; complete visual baseline |
| 03 | `03-landing-english-desktop.png` | Logged out, desktop, English locale | Strongest public surface |
| 04 | `04-clerk-sign-in-modal-desktop.png` | Clerk sign-in modal | Passed opaque dark-panel requirement |
| 05 | `05-landing-logged-out-mobile.png` | Logged out, mobile | Failed navigation/CTA collision check |
| 06 | `06-onboarding-step-1-desktop.png` | New user, onboarding step 1 | Rendered; cyan styling is off-brand |
| 07 | `07-onboarding-profile-desktop.png` | New user, onboarding profile | Failed image and flag rules |
| 08 | `08-event-empty-desktop.png` | Signed in, no events | Rendered; sparse and misleading live status |
| 09 | `09-dashboard-new-user-desktop.png` | Signed in, new user | Failed with runtime error |
| 10 | `10-fighter-index-desktop.png` | Signed in, no fighters | Rendered; operator language leaks to users |
| 11 | `11-rankings-empty-desktop.png` | Signed in, zero activity | Rendered; order and metric-label defects |
| 12 | `12-news-desktop.png` | Signed in, empty news | Rendered; weak empty state |
| 13 | `13-chat-desktop.png` | Signed in, empty chat | Rendered; large unused canvas |
| 14 | `14-rules-desktop.png` | Signed in, rules | Strong authenticated surface |
| 15 | `15-settings-desktop.png` | Signed in, settings | Failed tab-fit/ad-overlay check |
| 16 | `16-event-empty-mobile.png` | Signed in, event, mobile | Rendered; shell/navigation concerns |
| 17 | `17-settings-mobile.png` | Signed in, settings, mobile | Failed due to overlapping tabs and clipped identity |
| 18 | `18-admin-fight-cards-desktop.png` | Admin, no cards | Rendered; oversized empty canvas |
| 19 | `19-admin-create-event-desktop.png` | Admin, create event | Rendered; dense and off-system accents |
| 20 | `20-admin-fighter-manager-desktop.png` | Admin, no fighters | Rendered; untranslated key and raw ad visible |
| 21 | `21-admin-odds-desktop.png` | Admin, no events | Rendered; oversized empty canvas |

## Execution Notes

- `/admin/admin-users` and `/admin/import` rendered and were inspected, but Playwright timed out while waiting for web fonts during screenshot capture.
- Populated event, fighter, picks, and leaderboard states were not injected because the local environment uses the live shared Supabase database. A dedicated local fixture mode or isolated audit database is required for repeatable populated-state screenshots without contaminating production data.
- Clerk sign-up, email verification, profile creation, authenticated navigation, and admin authorization were exercised with a disposable audit account.
