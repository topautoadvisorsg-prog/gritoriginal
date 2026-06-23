import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { storage } from "../../storage";
import { insertFighterSchema } from "../../../shared/schema";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { bulkFightersSchema, bulkFightsSchema } from '../../schemas';
import { syncFighterToSupabase } from '../../services/outboundSyncService';

type CreatedFighter = Awaited<ReturnType<typeof storage.createFighter>>;
type UpdatedFighter = NonNullable<Awaited<ReturnType<typeof storage.updateFighter>>>;
type CreatedFightHistory = Awaited<ReturnType<typeof storage.createFightHistory>>;
type UpdatedFightHistory = NonNullable<Awaited<ReturnType<typeof storage.updateFightHistory>>>;

interface BulkImportError {
  fighter?: string;
  fight?: string;
  error: unknown;
}

/**
 * Admin-only fighter and fight history management.
 * Protected by isAuthenticated + requireAdmin.
 */
export function registerAdminFighterRoutes(app: Express) {

  // Create a new fighter (Admin only)
  app.post("/api/fighters", isAuthenticated, requireAdmin, validate(insertFighterSchema), async (req: Request, res: Response) => {
    try {
      // Body is already validated by middleware
      const fighter = await storage.createFighter(req.body);
      const fullName = `${fighter.firstName} ${fighter.lastName}`;
      await storage.linkUnlinkedFightHistory(fullName, fighter.id);

      // Outbound sync to data engine (non-blocking)
      setImmediate(() => syncFighterToSupabase(fighter, 'create').catch((e) =>
        logger.error('[OutboundSync] Fighter create sync failed:', e)
      ));

      res.status(201).json(fighter);
    } catch (error) {
      logger.error("Error creating fighter:", error);
      res.status(500).json({ error: "Failed to create fighter" });
    }
  });

  // Update a fighter (Admin only)
  app.put("/api/fighters/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const existingFighter = await storage.getFighter(req.params.id as string);
      if (!existingFighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }

      const mergedData = { ...existingFighter, ...req.body, lastUpdated: new Date().toISOString() };
      const validationResult = insertFighterSchema.safeParse(mergedData);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid fighter data after merge",
          details: validationResult.error.issues
        });
      }

      const fighter = await storage.updateFighter(req.params.id as string, validationResult.data);
      if (!fighter) {
        return res.status(500).json({ error: "Failed to update fighter" });
      }

      // Outbound sync to data engine (non-blocking)
      setImmediate(() => syncFighterToSupabase(fighter).catch((e) =>
        logger.error('[OutboundSync] Fighter update sync failed:', e)
      ));

      res.json(fighter);
    } catch (error) {
      logger.error("Error updating fighter:", error);
      res.status(500).json({ error: "Failed to update fighter" });
    }
  });

  // Delete a fighter (Admin only)
  app.delete("/api/fighters/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteFightHistoryByFighter(req.params.id as string);
      const deleted = await storage.deleteFighter(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting fighter:", error);
      res.status(500).json({ error: "Failed to delete fighter" });
    }
  });

  app.post("/api/fighters/bulk", isAuthenticated, requireAdmin, validate(bulkFightersSchema), async (req: Request, res: Response) => {
    try {
      const { fighters: fightersData } = req.body;
      if (!Array.isArray(fightersData)) {
        return res.status(400).json({ error: "Expected array of fighters" });
      }

      const created: CreatedFighter[] = [];
      const updated: UpdatedFighter[] = [];
      const errors: BulkImportError[] = [];

      for (const fighterData of fightersData) {
        try {
          const validationResult = insertFighterSchema.safeParse(fighterData);
          if (!validationResult.success) {
            errors.push({
              fighter: fighterData.firstName + " " + fighterData.lastName,
              error: validationResult.error.issues
            });
            continue;
          }

          const existing = await storage.getFighterByName(fighterData.firstName, fighterData.lastName) || null;

          if (existing) {
            const result = await storage.updateFighter(existing.id, validationResult.data);
            updated.push(result);
          } else {
            const fighter = await storage.createFighter(validationResult.data);
            created.push(fighter);
            const fullName = `${fighter.firstName} ${fighter.lastName}`;
            await storage.linkUnlinkedFightHistory(fullName, fighter.id);
          }
        } catch (err) {
          errors.push({
            fighter: fighterData.firstName + " " + fighterData.lastName,
            error: String(err)
          });
        }
      }

      res.status(201).json({
        created: created.length,
        updated: updated.length,
        errors: errors.length,
        fighters: [...created, ...updated],
        errorDetails: errors
      });
    } catch (error) {
      logger.error("Error in bulk create:", error);
      res.status(500).json({ error: "Failed to bulk create fighters" });
    }
  });

  app.post("/api/fighters/:id/relink", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const fighter = await storage.getFighter(req.params.id as string);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }
      const fullName = `${fighter.firstName} ${fighter.lastName}`;
      const linked = await storage.linkUnlinkedFightHistory(fullName, fighter.id);
      res.json({ linked, fighterName: fullName });
    } catch (error) {
      logger.error("Error re-linking fights:", error);
      res.status(500).json({ error: "Failed to re-link fights" });
    }
  });

  app.put("/api/fights/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateFightHistory(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Fight record not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error updating fight history:", error);
      res.status(500).json({ error: "Failed to update fight record" });
    }
  });

  app.delete("/api/fights/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteFightHistoryRecord(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Fight record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting fight history:", error);
      res.status(500).json({ error: "Failed to delete fight record" });
    }
  });

  app.post("/api/fights/bulk", isAuthenticated, requireAdmin, validate(bulkFightsSchema), async (req: Request, res: Response) => {
    try {
      const { fights: fightsData, mode = 'add' } = req.body;
      if (!Array.isArray(fightsData)) {
        return res.status(400).json({ error: "Expected array of fight records" });
      }

      const created: CreatedFightHistory[] = [];
      const updated: UpdatedFightHistory[] = [];
      const errors: BulkImportError[] = [];

      for (const fightData of fightsData) {
        try {
          if (mode === 'replace' && fightData.id) {
            const existing = await storage.updateFightHistory(fightData.id, fightData);
            if (existing) {
              updated.push(existing);
              continue;
            }
          }
          const fight = await storage.createFightHistory(fightData);
          created.push(fight);
        } catch (err) {
          errors.push({
            fight: `${fightData.fighterName || fightData.fighterId} vs ${fightData.opponentName}`,
            error: String(err)
          });
        }
      }

      res.status(201).json({
        created: created.length,
        updated: updated.length,
        errors: errors.length,
        fights: [...created, ...updated],
        errorDetails: errors
      });
    } catch (error) {
      logger.error("Error in bulk fight import:", error);
      res.status(500).json({ error: "Failed to bulk import fight history" });
    }
  });

  app.get("/api/admin/fighters/:id/corrections", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const corrections = await storage.getFighterCorrections(req.params.id as string);
      res.json(corrections);
    } catch (error) {
      logger.error("Error fetching corrections:", error);
      res.status(500).json({ error: "Failed to fetch corrections" });
    }
  });

  app.patch("/api/admin/corrections/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['pending', 'reviewed', 'resolved'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateFighterCorrectionStatus(req.params.id as string, status);
      if (!updated) {
        return res.status(404).json({ error: "Correction not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error("Error updating correction:", error);
      res.status(500).json({ error: "Failed to update correction" });
    }
  });

  app.post("/api/fighters/:id/import-history", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ error: "Missing csvData" });
      }

      const { handleFighterHistoryImport } = await import("../../statsIngest");
      const results = await handleFighterHistoryImport(req.params.id as string, csvData);

      res.json(results);
    } catch (error) {
      logger.error("Error importing history:", error);
      res.status(500).json({ error: "Failed to import history", details: String(error) });
    }
  });

}
