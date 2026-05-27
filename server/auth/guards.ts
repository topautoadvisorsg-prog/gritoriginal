import type { Request, RequestHandler, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { eq } from 'drizzle-orm';

import { env } from '../config/env';
import { db } from '../db';
import { users } from '../../shared/models/auth';
import { logger } from '../utils/logger';

const ADMIN_EMAIL = env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  throw new Error(
    'ADMIN_EMAIL environment variable is required. Set it in your environment before starting the server.',
  );
}

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
 * Resolve the Clerk-authenticated user into a hydrated Express.User.
 *
 * Hot path (existing user): DB lookup by Clerk userId — no Clerk API call.
 * Cold path (first sign-in only): one Clerk getUser() + insert.
 *
 * This keeps every authenticated request fast (single DB read) instead of
 * paying the Clerk API round-trip on every call. Webhooks (user.created /
 * user.updated) keep the local row in sync, so we don't need to re-fetch
 * from Clerk per request.
 */
async function resolveClerkUser(req: Request): Promise<Express.User | null> {
  const auth = getAuth(req);
  if (!auth.userId) return null;

  // ---- HOT PATH: existing local row ----
  const [existing] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);

  if (existing) {
    const bootstrapAdmin = existing.email === ADMIN_EMAIL;
    return {
      id: existing.id,
      email: existing.email,
      username: existing.username,
      role: bootstrapAdmin ? 'admin' : existing.role ?? 'user',
      tier: (existing.tier ?? 'free') as Express.User['tier'],
      country: existing.country,
      isAiChatBlocked: existing.isAiChatBlocked ?? false,
      language: existing.language ?? 'en',
    };
  }

  // ---- COLD PATH: first time we've seen this Clerk user (webhook hasn't
  // synced yet, or this is a brand-new sign-up). Fetch from Clerk + insert. ----
  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const primaryEmail =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null;
  const roleFromClerk = clerkUser.publicMetadata?.role === 'admin' ? 'admin' : undefined;
  const bootstrapAdmin = primaryEmail === ADMIN_EMAIL;

  const [created] = await db
    .insert(users)
    .values({
      id: auth.userId,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      profileImageUrl: clerkUser.imageUrl,
      avatarUrl: clerkUser.imageUrl,
      role: roleFromClerk ?? (bootstrapAdmin ? 'admin' : 'user'),
      tier: 'free',
    })
    .returning();

  return {
    id: created.id,
    email: created.email,
    username: created.username,
    role: roleFromClerk ?? (bootstrapAdmin ? 'admin' : created.role ?? 'user'),
    tier: (created.tier ?? 'free') as Express.User['tier'],
    country: created.country,
    isAiChatBlocked: created.isAiChatBlocked ?? false,
    language: created.language ?? 'en',
  };
}

/**
 * Clerk authentication check.
 * Also hydrates req.user so existing route handlers continue to work.
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const user = await resolveClerkUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: No session' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('[auth] Clerk user resolution failed', error);
    res.status(500).json({ message: 'Auth check failed' });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
  }

  if (req.user.role === 'admin' || req.user.email === ADMIN_EMAIL) {
    return next();
  }

  res.status(403).json({ message: 'Forbidden: Admin access required' });
};

export function isAdmin(req: Request): boolean {
  const user = req.user;
  if (!user) return false;
  return user.role === 'admin' || user.email === ADMIN_EMAIL;
}

export function requireTier(minTier: UserTier): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    if (req.user.role === 'admin') return next();

    const userTier = req.user.tier || 'free';
    const userLevel = TIER_LEVELS[userTier] ?? 0;
    const requiredLevel = TIER_LEVELS[minTier] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: `Forbidden: ${minTier} tier or higher required`,
        currentTier: userTier,
        requiredTier: minTier,
      });
    }

    next();
  };
}

export function requireFeature(feature: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    const userTier = req.user.tier || 'free';
    const requiredTier = FEATURE_REQUIREMENTS[feature];

    if (requiredTier) {
      const userLevel = TIER_LEVELS[userTier] ?? 0;
      const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          message: `Forbidden: ${feature} requires ${requiredTier} tier`,
          feature,
          currentTier: userTier,
          requiredTier,
        });
      }
    }

    next();
  };
}
