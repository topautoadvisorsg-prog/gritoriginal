import { Router } from 'express';
import { isAuthenticated } from '../../auth/guards';
import { db } from '../../db';
import { userBadges } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { unlockBadgeSchema } from '../../schemas';

const router = Router();

router.get('/api/me/badges', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
        res.json(badges);
    } catch (error) {
        logger.error('Error fetching badges:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

router.post('/api/me/badges/unlock', isAuthenticated, validate(unlockBadgeSchema), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { badgeType, metadata } = req.body;

        if (!badgeType) {
            return res.status(400).json({ error: 'Badge type is required' });
        }

        const [existing] = await db
            .select()
            .from(userBadges)
            .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)));

        if (existing) {
            return res.json({ success: true, message: 'Badge already unlocked', badge: existing });
        }

        const [newBadge] = await db
            .insert(userBadges)
            .values({
                userId,
                badgeType,
                metadata: metadata || {},
            })
            .returning();

        res.json({ success: true, message: 'Badge unlocked', badge: newBadge });
    } catch (error) {
        const pgError = error as { code?: string };
        if (pgError?.code === '23505') {
            return res.json({ success: true, message: 'Badge already unlocked' });
        }
        logger.error('Error unlocking badge:', error);
        res.status(500).json({ error: 'Failed to unlock badge' });
    }
});

export default router;
