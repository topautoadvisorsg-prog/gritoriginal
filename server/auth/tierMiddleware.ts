import type { RequestHandler } from 'express';
import type { UserTier } from '../types/express';

// Tier hierarchy for comparison
const TIER_LEVELS: Record<UserTier, number> = {
    free: 0,
    medium: 1,
    premium: 2,
};

export type { UserTier };

// Feature definitions
const FEATURE_REQUIREMENTS: Record<string, UserTier> = {
    'basic_badges': 'free',
    'custom_emojis': 'medium',
    'advanced_analytics': 'premium',
    'priority_support': 'premium',
    'extended_history': 'medium',
};

/**
 * Check if a user has at least the specified tier level
 */
export function hasTier(userTier: string | undefined, requiredTier: UserTier): boolean {
    const userLevel = TIER_LEVELS[userTier || 'free'] ?? 0;
    const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;
    return userLevel >= requiredLevel;
}

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(userTier: string | undefined, feature: string): boolean {
    const requiredTier = FEATURE_REQUIREMENTS[feature];
    if (!requiredTier) return true; // Unknown features default to allowed
    return hasTier(userTier, requiredTier);
}

/**
 * Middleware to require minimum tier level
 * Must be used AFTER isAuthenticated
 */
export function requireTier(minTier: UserTier): RequestHandler {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
        }

        // Admins bypass all tier gates
        if (req.user.role === 'admin') {
            return next();
        }

        const userTier = req.user.tier || 'free';

        if (!hasTier(userTier, minTier)) {
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
 * Middleware to require access to a specific feature
 * Must be used AFTER isAuthenticated
 */
export function requireFeature(feature: string): RequestHandler {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Not authenticated' });
        }

        const userTier = req.user.tier || 'free';

        if (!hasFeatureAccess(userTier, feature)) {
            const requiredTier = FEATURE_REQUIREMENTS[feature] || 'premium';
            return res.status(403).json({
                message: `Forbidden: ${feature} requires ${requiredTier} tier`,
                feature,
                currentTier: userTier,
                requiredTier,
            });
        }

        next();
    };
}
