# Notifications and Uploads Plan

## Notifications current state

OneSignal helpers/triggers/preferences exist but delivery, retries, receipts, and preference enforcement are not proven.

### Notification phases

1. Create a notification event/outbox record with unique business idempotency key.
2. Centralize preference/locale/channel evaluation.
3. Deliver asynchronously with retry/backoff/dead-letter state.
4. Record provider ID/status and expose admin replay/support view.
5. Prevent transactional failures from rolling back because push delivery failed.
6. Test duplicate events, invalid devices, provider outage, opt-out, locale fallback, and account deletion.

## Uploads current state

Avatar/slip/image validation exists, but local filesystem persistence is unsafe for ephemeral/multi-instance deployment.

### Upload phases

1. Move to isolated durable object storage with private/public bucket policy by asset type.
2. Use server-authorized signed upload flow, size/MIME/magic-byte/dimension validation, and randomized keys.
3. Add image normalization/metadata stripping and content/moderation scan policy.
4. Store asset ownership/state in DB; never trust user-provided object keys.
5. Add replacement/delete cleanup, orphan reconciliation, retention, and CDN/cache policy.
6. Test aborted upload, spoofed MIME, oversized/decompression payloads, unauthorized overwrite/read, duplicate completion, and storage outage.

## Definition of done

Notifications are durable/idempotent/preferences-aware with observable delivery; uploads survive redeploys and enforce ownership/content controls; provider outages have replay/reconciliation runbooks.

**Complexity:** notifications M-L; uploads M. **Production risk:** Medium-high.
