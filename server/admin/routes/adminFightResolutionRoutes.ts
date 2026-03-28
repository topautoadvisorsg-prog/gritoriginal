import type { Express, Request, Response } from "express";

import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { finalizeFightResult } from '../../services/scoringService';
import { logger } from '../../utils/logger';
import { verifyFightState } from '../../middleware/fightState';
import { syncEventFightToSupabase } from '../../services/outboundSyncService';
import { storage } from '../../storage';

/**
 * Admin-only route for finalizing fight results.
 * Protected by isAuthenticated + requireAdmin middleware.
 * Business logic is delegated to scoringService.
 */
export function registerAdminFightResolutionRoutes(app: Express): void {

    // Admin: Finalize a fight result
    app.post("/api/fights/:fightId/result", isAuthenticated, requireAdmin, verifyFightState(['LIVE', 'CLOSED']), async (req: Request, res: Response) => {
        try {
            const { fightId } = req.params;
            const resultData = req.body;

            const result = await finalizeFightResult(fightId, resultData);

            // Outbound sync to Supabase (non-blocking) — push updated event_fights row
            setImmediate(async () => {
                try {
                    const fight = await storage.getEventFight(fightId);
                    if (fight) {
                        await syncEventFightToSupabase(fight as any, 'update');
                    }
                } catch (syncErr) {
                    logger.error('[OutboundSync] EventFight post-resolution sync failed:', syncErr);
                }
            });

            res.json({
                message: "Fight result saved successfully",
                result,
            });
        } catch (error: any) {
            if (error.message === 'FIGHT_NOT_FOUND') {
                return res.status(404).json({ message: "Fight not found" });
            }
            if (error.message === 'FIGHT_ALREADY_FINALIZED') {
                return res.status(409).json({ message: "Fight has already been finalized. Re-finalization is blocked for integrity." });
            }
            logger.error("Error saving fight result:", error);
            res.status(500).json({ message: "Failed to save fight result" });
        }
    });
}
