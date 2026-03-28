import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const ADMIN_EMAIL = env.ADMIN_EMAIL ?? "saraimateo1612@proton.me";

/**
 * Standard authentication check.
 * Verifies that the user has a valid session.
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: No session' });
};

/**
 * Admin authorization check.
 * Grants access if user.role is 'admin' or email matches ADMIN_EMAIL.
 * Must be used AFTER isAuthenticated.
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
    }

    const user = req.user;
    if (user.role === 'admin' || (ADMIN_EMAIL && user.email === ADMIN_EMAIL)) {
        return next();
    }

    res.status(403).json({ message: 'Forbidden: Admin access required' });
};

/**
 * Helper to check admin status for inline logic.
 */
export function isAdmin(req: Request): boolean {
    const user = req.user;
    if (!user) return false;
    return user.role === 'admin' || (!!ADMIN_EMAIL && user.email === ADMIN_EMAIL);
}

/**
 * Tier hierarchy for gatekeeping.
 */
const TIER_LEVELS: Record<string, number> = {
    free: 0,
    medium: 1,
    premium: 2,
};

export type UserTier = 'free' | 'medium' | 'premium';

/**
 * Feature definitions and their required tiers.
 */
const FEATURE_REQUIREMENTS: Record<string, UserTier> = {
    'basic_badges': 'free',
    'custom_emojis': 'medium',
    'advanced_analytics': 'premium',
    'priority_support': 'premium',
    'extended_history': 'medium',
};

/**
 * Middleware to require a minimum tier level.
 * Must be used AFTER isAuthenticated.
 */
export function requireTier(minTier: UserTier): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
        }

        // Admins bypass all tier gates
        if ((req.user as any).role === 'admin') {
            return next();
        }

        const userTier = (req.user as any).tier || 'free';

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

/**
 * Middleware to require access to a specific feature.
 * Must be used AFTER isAuthenticated.
 */
export function requireFeature(feature: string): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
        }

        const userTier = (req.user as any).tier || 'free';
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
