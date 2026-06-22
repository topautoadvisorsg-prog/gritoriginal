# Authentication and Account Lifecycle Plan

**Current state:** Clerk login/local-user provisioning is implemented but not fully proven. Legal acceptance and cross-system deletion are incomplete.

## Decisions required

- Supported sign-in methods and whether usernames remain app-only.
- Minimum age and supported launch jurisdictions.
- Account deletion retention rules for financial, moderation, chat, AI, and ranking records.
- Session/device revocation and admin-account MFA requirements.

## Delivery phases

1. Define one authenticated-user contract from Clerk identity plus local domain profile.
2. Add authenticated route tests for first login, returning login, missing local row, suspended user, admin, and logout/revocation.
3. Deploy versioned legal-acceptance storage and record ToS/privacy/AUP versions during onboarding.
4. Add account export and deletion orchestration across Clerk, app tables, uploads, notifications, AI/chat data, and legally retained records.
5. Add audit events for role/tier/security-sensitive changes.
6. Add staging browser proof for OAuth/email flows, refresh, multi-tab behavior, and revoked sessions.

## Safety and rollback

- Never infer authorization from frontend Clerk state.
- Preserve stable local user IDs and explicitly map Clerk IDs.
- Feature-flag acceptance enforcement until existing users are migrated.
- Deletion uses a durable job with per-system completion records and retry.

## Definition of done

Authenticated staging tests pass; unauthorized requests fail closed; role/tier changes are auditable; acceptance versions are queryable; export/deletion reconciliation has zero unexplained records; runbooks cover Clerk outage and webhook replay.

**Complexity:** L. **Production risk:** High because identity and deletion affect every pipeline.
