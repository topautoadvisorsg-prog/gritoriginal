import type { Express, Response } from 'express';
import { isAuthenticated } from '../auth/guards';
import { requireTier } from '../auth/tierMiddleware';
import { generatePrediction } from './openaiClient';
import { buildFightContext } from './promptBuilder';
import { getCachedPrediction, cachePrediction } from './predictionCache';
import { db } from '../db';
import { eventFights, events } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { openmeterService } from '../services/openmeterService';

export function registerAIRoutes(app: Express) {

    // Get AI prediction for a specific fight (Premium only)
    app.post('/api/ai/predict', isAuthenticated, requireTier('premium'), async (req: any, res: Response) => {
        try {
            const { fightId } = req.body;

            if (!fightId) {
                return res.status(400).json({ message: 'fightId is required' });
            }

            // Check if fight exists
            const [fight] = await db.select().from(eventFights).where(eq(eventFights.id, fightId));
            if (!fight) {
                return res.status(404).json({ message: 'Fight not found' });
            }

            // Check cache first
            const cached = await getCachedPrediction(fightId);
            if (cached) {
                return res.json({
                    ...cached,
                    fromCache: true,
                });
            }

            // Build context and generate prediction
            const context = await buildFightContext(fightId);
            const prediction = await generatePrediction(fightId, context);

            // Cache the result
            await cachePrediction(prediction);

            res.json({
                ...prediction,
                fromCache: false,
            });

            // Track usage asynchronously (only for new predictions, not cache hits)
            const userId = (req.user as any)?.id;
            if (userId) {
                openmeterService.trackUsage(userId, 'ai_prediction');
            }

        } catch (error: any) {
            logger.error('AI prediction error:', error);

            if (error.message?.includes('API key')) {
                return res.status(500).json({ message: 'AI service not configured' });
            }

            res.status(500).json({
                message: 'Failed to generate prediction',
                error: error.message,
            });
        }
    });

    // Get cached prediction for a fight (Premium only)
    app.get('/api/ai/predictions/:fightId', isAuthenticated, requireTier('premium'), async (req: any, res: Response) => {
        try {
            const { fightId } = req.params;

            const cached = await getCachedPrediction(fightId);
            if (!cached) {
                return res.status(404).json({ message: 'No prediction cached for this fight' });
            }

            res.json(cached);
        } catch (error) {
            logger.error('Error fetching cached prediction:', error);
            res.status(500).json({ message: 'Failed to fetch prediction' });
        }
    });

    // Get all fights for an event that can be analyzed (Premium only)
    app.get('/api/ai/event/:eventId/fights', isAuthenticated, requireTier('premium'), async (req: any, res: Response) => {
        try {
            const { eventId } = req.params;

            // Verify event exists
            const [event] = await db.select().from(events).where(eq(events.id, eventId));
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            // Get all fights for event
            const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, eventId));

            // Check which have cached predictions
            const fightsWithCacheStatus = await Promise.all(
                fights.map(async (fight) => {
                    const cached = await getCachedPrediction(fight.id);
                    return {
                        ...fight,
                        hasCachedPrediction: !!cached,
                    };
                })
            );

            res.json({
                event,
                fights: fightsWithCacheStatus,
            });

        } catch (error) {
            logger.error('Error fetching event fights for AI:', error);
            res.status(500).json({ message: 'Failed to fetch event data' });
        }
    });

    // List available AI models (for future expansion)
    app.get('/api/ai/models', isAuthenticated, requireTier('premium'), async (_req, res: Response) => {
        res.json([
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                provider: 'openai',
                description: 'Fast and cost-effective model for fight analysis',
                available: true,
            },
            // Future models can be added here
            // {
            //     id: 'gpt-4o',
            //     name: 'GPT-4o',
            //     provider: 'openai',
            //     description: 'Most capable model for in-depth analysis',
            //     available: false,
            // },
        ]);
    });

}
