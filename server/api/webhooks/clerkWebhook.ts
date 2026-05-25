/**
 * Clerk webhook handler — keeps our `users` table in sync with Clerk's identity records.
 *
 * Mounted at POST /api/webhooks/clerk (raw body required for signature verification).
 *
 * ⚠️ MOUNTING ORDER MATTERS: this router MUST be registered in user-server.ts
 * BEFORE `app.use(express.json())`. svix signature verification needs the raw
 * request body; the global json parser would consume it first.
 * Follow the same pattern as registerStripeWebhook() at user-server.ts:86.
 *
 * Events handled:
 *   - user.created       → INSERT into users
 *   - user.updated       → UPDATE existing row
 *   - user.deleted       → DELETE (cascades remove picks, blocks, mutes, etc.)
 *   - session.created    → bump last_login_date (used by progression login bonus)
 *
 * Security:
 *   - Verifies svix signature using CLERK_WEBHOOK_SECRET. Rejects 401 if invalid.
 *   - Idempotent — duplicate deliveries are safe (upserts use ON CONFLICT, deletes are no-op if row gone).
 */
import express, { Request, Response, Router } from 'express';
import { Webhook } from 'svix';
import { db } from '../../db';
import { users } from '../../../shared/models/auth';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const router = Router();

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserPayload = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  public_metadata: { role?: string } | null;
  created_at: number;
  updated_at: number;
};

// Only the events we actively handle are typed. Anything else falls through to the
// default switch branch where we treat the payload as unknown and ignore it.
// Clerk adds event types over time; an unknown branch is more robust than enumerating.
type ClerkEvent =
  | { type: 'user.created' | 'user.updated'; data: ClerkUserPayload }
  | { type: 'user.deleted'; data: { id: string; deleted: boolean } }
  | { type: 'session.created'; data: { user_id: string } };

// Raw shape from svix.verify before we narrow into ClerkEvent.
type RawClerkEvent = { type: string; data: unknown };

function primaryEmailOf(user: ClerkUserPayload): string | null {
  if (!user.primary_email_address_id) return null;
  const match = user.email_addresses.find(e => e.id === user.primary_email_address_id);
  return match?.email_address ?? null;
}

router.post(
  '/webhooks/clerk',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const secret = env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('[clerk-webhook] CLERK_WEBHOOK_SECRET not configured');
      return res.status(503).json({ error: 'Webhook secret not configured' });
    }

    // svix expects the raw payload + 3 specific headers
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    let rawEvent: RawClerkEvent;
    try {
      const wh = new Webhook(secret);
      rawEvent = wh.verify(req.body, headers) as RawClerkEvent;
    } catch (err) {
      logger.warn('[clerk-webhook] signature verification failed', err);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    try {
      // svix.verify gives us a verified-but-untyped payload. Cast to our discriminated
      // union — TypeScript will narrow `event.data` inside each case. Unknown event
      // types still match (string includes the literal types) and fall to default.
      const event = rawEvent as ClerkEvent;
      switch (event.type) {
        case 'user.created': {
          const u = event.data;
          const email = primaryEmailOf(u);
          const role = u.public_metadata?.role === 'admin' ? 'admin' : 'user';
          await db
            .insert(users)
            .values({
              id: u.id,
              email,
              firstName: u.first_name,
              lastName: u.last_name,
              username: u.username,
              profileImageUrl: u.image_url,
              avatarUrl: u.image_url,
              role,
              tier: 'free',
            })
            .onConflictDoNothing();
          logger.info(`[clerk-webhook] user.created ${u.id} (${email})`);
          break;
        }

        case 'user.updated': {
          const u = event.data;
          const email = primaryEmailOf(u);
          const role = u.public_metadata?.role === 'admin' ? 'admin' : undefined;
          await db
            .update(users)
            .set({
              email,
              firstName: u.first_name,
              lastName: u.last_name,
              username: u.username,
              profileImageUrl: u.image_url,
              avatarUrl: u.image_url,
              ...(role ? { role } : {}),
              updatedAt: new Date(),
            })
            .where(eq(users.id, u.id));
          logger.info(`[clerk-webhook] user.updated ${u.id}`);
          break;
        }

        case 'user.deleted': {
          const { id } = event.data;
          await db.delete(users).where(eq(users.id, id));
          logger.info(`[clerk-webhook] user.deleted ${id}`);
          break;
        }

        case 'session.created': {
          const { user_id } = event.data;
          await db
            .update(users)
            .set({ lastLoginDate: new Date() })
            .where(eq(users.id, user_id));
          // Note: monthly login count bump is handled by progressionService.ts on first login of the month.
          break;
        }

        default:
          // Unhandled event type — log and 200 so Clerk doesn't retry.
          logger.info(`[clerk-webhook] ignoring event type: ${(rawEvent as RawClerkEvent).type}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error('[clerk-webhook] handler failed', err);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

export default router;
