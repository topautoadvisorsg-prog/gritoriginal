import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eventFights, events } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Middleware to enforce fight status.
 * Expects `fightId` to be in `req.params.fightId`, `req.params.id`, or `req.body.fightId`.
 * Checks both the event's status and the fight's status.
 */
export function verifyFightState(allowedStates: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const fightId = req.params.fightId || req.params.id || req.body.fightId;
            if (!fightId) {
                return res.status(400).json({ error: 'fightId is required to verify state' });
            }

            const [fight] = await db.select().from(eventFights).where(eq(eventFights.id, fightId));
            if (!fight) {
                return res.status(404).json({ error: 'Fight not found' });
            }

            const [event] = await db.select().from(events).where(eq(events.id, fight.eventId));
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Both event and fight must be in the allowed states
            // Wait, the prompt says "State transitions must be server-enforced, NOT just UI logic."
            // "Add verifyFightState(['OPEN']) on pick submission routes"
            // We check if the event's status is in the allowed states. It's safer to check the fight's status directly,
            // but the prompt specified the states for the event. Let's check both or whatever is more restrictive.
            
            if (!allowedStates.includes(event.status)) {
                return res.status(403).json({ 
                    error: `Action not allowed. Event status is ${event.status}, but requires one of: ${allowedStates.join(', ')}` 
                });
            }

            // Also check the specific fight status if it diverges from the event
            if (!allowedStates.includes(fight.status)) {
                return res.status(403).json({ 
                    error: `Action not allowed. Fight status is ${fight.status}, but requires one of: ${allowedStates.join(', ')}` 
                });
            }

            // Pass fight and event into locals for downstream routes
            res.locals.fight = fight;
            res.locals.event = event;
            next();
        } catch (error) {
            logger.error('Error in verifyFightState middleware:', error);
            res.status(500).json({ error: 'Internal server error verifying fight state' });
        }
    };
}
