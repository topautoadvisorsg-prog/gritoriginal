/**
 * Clerk auth integration — replaces Replit OIDC.
 *
 * Architecture:
 * - `clerkMiddleware()` from @clerk/express decorates every request with `req.auth()`.
 *   Mounted globally in user-server.ts.
 * - `requireAuth()` returns 401 if no Clerk session.
 * - `requireAdmin()` returns 403 if the authenticated user is not admin.
 *   Admin is decided by:
 *     1. Clerk public metadata `role: 'admin'`, OR
 *     2. Email match against `ADMIN_EMAIL` env var (bootstrap path until DB-driven admin UI ships)
 * - `requireTier(min)` returns 403 if the user's `tier` column < min (free|medium|premium for now;
 *   renaming to contender|challenger|creator in Week 2).
 * - `requireFeature(name)` gates by feature → required tier mapping.
 *
 * Webhook sync:
 * - Clerk owns auth identity. Our `users` table owns picks/badges/Stripe state.
 * - `/api/webhooks/clerk` (see server/api/webhooks/clerkWebhook.ts) keeps the two in sync.
 *
 * Migration notes:
 * - When this file is wired in user-server.ts, replace the imports of `isAuthenticated`/`requireAdmin`
 *   from './guards' with imports from './clerk'.
 * - The old guards.ts will be deleted once cutover is verified.
 */
import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { clerkMiddleware as clerkExpressMiddleware, getAuth, clerkClient } from '@clerk/express';
import { env } from '../config/env';
import { db } from '../db';
import { users } from '../../shared/models/auth';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// ────────────────────────────────────────────────────────────────────────────
// Boot-time validation
// ────────────────────────────────────────────────────────────────────────────

if (!env.ADMIN_EMAIL) {
  throw new Error('ADMIN_EMAIL environment variable is required for admin bootstrap.');
}
const ADMIN_EMAIL = env.ADMIN_EMAIL;

if (!env.CLERK_SECRET_KEY) {
  // Soft-warn during Week 1 transition; tests boot without Clerk keys.
  // After cutover, this should throw.
  logger.warn('[clerk] CLERK_SECRET_KEY not set. Clerk auth will reject all requests until configured.');
}

// ────────────────────────────────────────────────────────────────────────────
// Middleware — mount globally
// ────────────────────────────────────────────────────────────────────────────

/**
 * Global Clerk middleware. Attaches `req.auth()` to every request without
 * blocking unauthenticated requests (use `requireAuth` per-route for that).
 */
export const clerkMiddleware = clerkExpressMiddleware();

// ────────────────────────────────────────────────────────────────────────────
// User resolution
// ────────────────────────────────────────────────────────────────────────────

/**
 * Look up our local `users` row by Clerk user ID.
 * Clerk's user.id is stored verbatim in `users.id` (varchar) — see Clerk webhook.
 * Returns null if the user isn't synced yet (race: webhook hasn't fired).
 */
export async function getLocalUser(clerkUserId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
  return u ?? null;
}

/**
 * Helper for routes: pull the local user record off the request.
 * Returns null if unauthenticated or unsynced.
 */
export async function getCurrentUser(req: Request) {
  const auth = getAuth(req);
  if (!auth.userId) return null;
  return getLocalUser(auth.userId);
}

// ────────────────────────────────────────────────────────────────────────────
// Guards
// ────────────────────────────────────────────────────────────────────────────

/**
 * Standard auth gate. Returns 401 if no Clerk session.
 * Use as: `router.get('/me', requireAuth, handler)`.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ message: 'Unauthorized: No session' });
  }
  next();
};

/**
 * Admin gate. Must follow `requireAuth` (relies on Clerk session being present).
 * Grants access if:
 *   - Clerk publicMetadata.role === 'admin', OR
 *   - User email matches ADMIN_EMAIL env var (bootstrap path)
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    const role = clerkUser.publicMetadata?.role;
    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (role === 'admin' || primaryEmail === ADMIN_EMAIL) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  } catch (err) {
    logger.error('[requireAdmin] failed to fetch Clerk user', err);
    return res.status(500).json({ message: 'Auth check failed' });
  }
};

/**
 * Tier hierarchy. Mirrors the legacy guards exactly for Week 1; Week 2 migration
 * will rename to contender|challenger|creator and update this map in one place.
 */
const TIER_LEVELS: Record<string, number> = {
  free: 0,
  medium: 1,
  premium: 2,
};

export type UserTier = 'free' | 'medium' | 'premium';

const FEATURE_REQUIREMENTS: Record<string, UserTier> = {
  basic_badges: 'free',
  custom_emojis: 'medium',
  advanced_analytics: 'premium',
  priority_support: 'premium',
  extended_history: 'medium',
};

/**
 * Tier gate. Must follow `requireAuth`. Admins bypass tier checks.
 */
export function requireTier(minTier: UserTier): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    if (user.role === 'admin') return next();

    const userLevel = TIER_LEVELS[user.tier] ?? 0;
    const requiredLevel = TIER_LEVELS[minTier] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: `Forbidden: ${minTier} tier or higher required`,
        currentTier: user.tier,
        requiredTier: minTier,
      });
    }

    next();
  };
}

/**
 * Feature flag gate. Returns 403 if user's tier doesn't unlock the feature.
 */
export function requireFeature(feature: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    const requiredTier = FEATURE_REQUIREMENTS[feature];
    if (!requiredTier) return next(); // unknown feature = allow

    const userLevel = TIER_LEVELS[user.tier] ?? 0;
    const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: `Forbidden: ${feature} requires ${requiredTier} tier`,
        feature,
        currentTier: user.tier,
        requiredTier,
      });
    }

    next();
  };
}

/**
 * Inline admin check for one-off conditional logic (not middleware).
 */
export async function isAdmin(req: Request): Promise<boolean> {
  const auth = getAuth(req);
  if (!auth.userId) return false;

  try {
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    const role = clerkUser.publicMetadata?.role;
    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    return role === 'admin' || primaryEmail === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

// Legacy alias for routes still using the old name. Remove once cutover is complete.
export const isAuthenticated = requireAuth;
