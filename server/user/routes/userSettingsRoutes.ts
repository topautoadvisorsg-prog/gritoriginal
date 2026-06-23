import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../../auth/guards';
import { db } from '../../db';
import { userSettings } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const router = Router();

interface UserSettingsType {
    enableSounds: boolean;
    enableCelebrations: boolean;
    showStreaks: boolean;
    showBadges: boolean;
    enablePushNotifications: boolean;
    enableEventReminders: boolean;
    enableResultAlerts: boolean;
    enableLeaderboardUpdates: boolean;
    showBettingTracker: boolean;
    unitSize: number;
}

type SettingValue = boolean | number;

const DEFAULT_SETTINGS: UserSettingsType = {
    enableSounds: true,
    enableCelebrations: true,
    showStreaks: true,
    showBadges: true,
    enablePushNotifications: true,
    enableEventReminders: true,
    enableResultAlerts: true,
    enableLeaderboardUpdates: false,
    showBettingTracker: false,
    unitSize: 0,
};

router.get('/me/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

        if (!settings) {
            return res.json(DEFAULT_SETTINGS);
        }

        const mergedSettings: UserSettingsType = {
            enableSounds: settings.enableSounds ?? DEFAULT_SETTINGS.enableSounds,
            enableCelebrations: settings.enableCelebrations ?? DEFAULT_SETTINGS.enableCelebrations,
            showStreaks: settings.showStreaks ?? DEFAULT_SETTINGS.showStreaks,
            showBadges: settings.showBadges ?? DEFAULT_SETTINGS.showBadges,
            enablePushNotifications: settings.enablePushNotifications ?? DEFAULT_SETTINGS.enablePushNotifications,
            enableEventReminders: settings.enableEventReminders ?? DEFAULT_SETTINGS.enableEventReminders,
            enableResultAlerts: settings.enableResultAlerts ?? DEFAULT_SETTINGS.enableResultAlerts,
            enableLeaderboardUpdates: settings.enableLeaderboardUpdates ?? DEFAULT_SETTINGS.enableLeaderboardUpdates,
            showBettingTracker: settings.showBettingTracker ?? DEFAULT_SETTINGS.showBettingTracker,
            unitSize: settings.unitSize ?? DEFAULT_SETTINGS.unitSize,
        };

        res.json(mergedSettings);
    } catch (err) {
        logger.error('Error in GET /me/settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/me/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const updates = req.body as Partial<UserSettingsType>;

        const dbUpdates: Partial<UserSettingsType> & { updatedAt: Date } = { updatedAt: new Date() };
        if (updates.enableSounds !== undefined) dbUpdates.enableSounds = updates.enableSounds;
        if (updates.enableCelebrations !== undefined) dbUpdates.enableCelebrations = updates.enableCelebrations;
        if (updates.showStreaks !== undefined) dbUpdates.showStreaks = updates.showStreaks;
        if (updates.showBadges !== undefined) dbUpdates.showBadges = updates.showBadges;
        if (updates.enablePushNotifications !== undefined) dbUpdates.enablePushNotifications = updates.enablePushNotifications;
        if (updates.enableEventReminders !== undefined) dbUpdates.enableEventReminders = updates.enableEventReminders;
        if (updates.enableResultAlerts !== undefined) dbUpdates.enableResultAlerts = updates.enableResultAlerts;
        if (updates.enableLeaderboardUpdates !== undefined) dbUpdates.enableLeaderboardUpdates = updates.enableLeaderboardUpdates;
        if (updates.showBettingTracker !== undefined) dbUpdates.showBettingTracker = updates.showBettingTracker;
        if (updates.unitSize !== undefined) dbUpdates.unitSize = updates.unitSize;

        const [data] = await db
            .insert(userSettings)
            .values({ userId, ...dbUpdates })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: dbUpdates,
            })
            .returning();

        res.json({ success: true, settings: data });
    } catch (err) {
        logger.error('Error in PUT /me/settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/me/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { key, value } = req.body as { key: keyof UserSettingsType; value: SettingValue };

        const expectedType = key === 'unitSize' ? 'number' : 'boolean';
        if (typeof value !== expectedType) {
            return res.status(400).json({ error: `Value must be a ${expectedType}` });
        }

        const keyMap: Record<keyof UserSettingsType, string> = {
            enableSounds: 'enableSounds',
            enableCelebrations: 'enableCelebrations',
            showStreaks: 'showStreaks',
            showBadges: 'showBadges',
            enablePushNotifications: 'enablePushNotifications',
            enableEventReminders: 'enableEventReminders',
            enableResultAlerts: 'enableResultAlerts',
            enableLeaderboardUpdates: 'enableLeaderboardUpdates',
            showBettingTracker: 'showBettingTracker',
            unitSize: 'unitSize',
        };

        const dbKey = keyMap[key];
        if (!dbKey) {
            return res.status(400).json({ error: 'Invalid setting key' });
        }

        await db
            .insert(userSettings)
            .values({ userId, [dbKey]: value })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: { [dbKey]: value, updatedAt: new Date() },
            });

        res.json({ success: true, [key]: value });
    } catch (err) {
        logger.error('Error in PATCH /me/settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
