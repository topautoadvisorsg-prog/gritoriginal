---
title: Chat & Slip UI — user-facing features
---
# Chat & Slip UI — User-Facing Features

## What & Why
Build all user-facing UI for the upgraded community chat and slip sharing system: tier-gated chat features, the slip posting flow in chat, the My Slips profile tab, and the in-app Slip Wall. Depends on the backend foundation task being complete.

## Done looks like
- Chat shows a "Chat is closed" state (locked icon, message: "Chat opens during live events") when the backend returns chat-is-closed; Contender users see this too
- Contender (free, tier='free') users can read and send text messages; the emoji button shows only the standard Unicode set; no slip button visible
- Challenger (paid, tier='premium' or subscriptionStatus='active') users see the full expanded emoji library and a slip sharing button in the chat input bar
- When a Challenger clicks the slip button, an overlay opens showing their approved slips; selecting one posts it to chat as a slip-type message displaying the image inline with a "SLIP" badge
- Slip cooldown: if a Challenger tries to post another slip before the cooldown window, a clear inline message shows "You can share another slip in X minutes"
- Founder/progression badges display next to the Challenger's username in every chat message (pulled from existing badge/rank system already in ChatHub)
- My Slips tab appears in the Settings page only for Challenger subscribers; free users do not see it
- In My Slips: user can upload a slip image (JPG/PNG/WebP ≤5MB); the 7-day expiry notice is shown prominently at upload; pending/approved/rejected slips are listed with days remaining and status indicators
- In-app Slip Wall: a dedicated view (accessible from chat area or community section) shows the full scrollable history of all featured slips with image, username, caption, date; visible to all logged-in users even when chat is closed

## Out of scope
- Admin moderation UI (separate task)
- Landing page slip wall section (separate task)
- Payment/upgrade flow for Contender→Challenger (Stripe integration already exists)

## Tasks
1. **Chat closed state** — Add a check in ChatHub that fetches chat config on mount; if `isOpen` is false, replace the message input with a locked banner ("Chat opens during live events"). Continue showing existing messages so users can still read them.

2. **Tier gating in chat** — Gate the emoji library expansion and slip button behind Challenger tier. Free users see a basic emoji picker with standard Unicode only. Paid users see the full expanded set. Slip button is hidden entirely from Contender users; show a subtle lock tooltip on hover if they ask why.

3. **Slip picker overlay** — Build the slip selection overlay: fetches `/api/slips/mine` filtered to approved status, shows thumbnail grid, clicking one posts a slip-type message to `/api/chat`. Include cooldown error handling with the "X minutes remaining" message.

4. **Slip message rendering** — In ChatHub's message list, detect `messageType === 'slip'` and render the slip image inline below the message bubble with a "SLIP" badge. Images loaded via the uploads path; use lazy loading.

5. **My Slips tab** — Add a "My Slips" tab to the Settings page (visible only when user is Challenger). The tab has an upload zone with file validation and the 7-day expiry notice. Below the upload zone, list all own slips from `/api/slips/mine` grouped by status (Pending, Approved, Rejected) with a days-remaining countdown badge and a delete button on pending/rejected slips.

6. **In-app Slip Wall** — Create a SlipWall component that fetches all featured slips from an admin-available endpoint (or a dedicated public endpoint returning all featured slips paginated). Render as a masonry-style card grid with slip image, username, admin caption, date. Mount this as a new tab or panel accessible from the chat/community area.

## Relevant files
- `src/user/components/chat/ChatHub.tsx`
- `src/user/pages/Settings.tsx`
- `src/user/pages/settings/`
- `src/user/pages/settings/AccountTab.tsx`
- `shared/models/auth.ts`