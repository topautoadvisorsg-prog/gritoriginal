import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { logger } from '../../utils/logger';

export function isSensitivePipelineConfigKey(key: string): boolean {
  return /(API_KEY|SECRET|TOKEN|PASSWORD)$/i.test(key);
}

export function serializePipelineConfigValue(key: string, value: string) {
  return isSensitivePipelineConfigKey(key)
    ? { key, value: '', configured: true }
    : { key, value, configured: true };
}
import * as dataEngineService from '../../services/dataEngineService';
import { db } from '../../db';
import { dataPipeline, fighters, events, eventFights } from '../../../shared/schema';
import { eq, count } from 'drizzle-orm';

const DATA_PIPELINE_STATUSES: dataEngineService.DataPipelineStatus[] = ['pending', 'approved', 'rejected', 'applied', 'failed'];

function isDataPipelineStatus(status: string): status is dataEngineService.DataPipelineStatus {
  return DATA_PIPELINE_STATUSES.includes(status as dataEngineService.DataPipelineStatus);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

async function sendPipelineHealthResponse(res: Response) {
  const [appliedCountResult] = await db.select({ count: count() })
    .from(dataPipeline)
    .where(eq(dataPipeline.status, 'applied'));
  const [failedCountResult] = await db.select({ count: count() })
    .from(dataPipeline)
    .where(eq(dataPipeline.status, 'failed'));
  const [pendingCountResult] = await db.select({ count: count() })
    .from(dataPipeline)
    .where(eq(dataPipeline.status, 'pending'));

  const [fighterCountResult] = await db.select({ count: count() }).from(fighters);
  const [eventCountResult] = await db.select({ count: count() }).from(events);
  const [fightCountResult] = await db.select({ count: count() }).from(eventFights);

  const appliedCount = Number(appliedCountResult.count);
  const fighterCount = Number(fighterCountResult.count);
  const eventCount = Number(eventCountResult.count);
  const fightCount = Number(fightCountResult.count);

  res.json({
    webhook_receiving_data: true,
    fighters_created: fighterCount > 0,
    events_created: eventCount > 0,
    event_fights_created: fightCount > 0,
    data_integrity_valid: appliedCount >= 0,
    pipeline_stats: {
      applied: appliedCount,
      failed: Number(failedCountResult.count),
      pending: Number(pendingCountResult.count),
    },
    db_counts: {
      fighters: fighterCount,
      events: eventCount,
      event_fights: fightCount,
    },
  });
}

/**
 * Admin data pipeline management routes.
 */
export function registerAdminDataPipelineRoutes(app: Express) {

  // Get all pending entries awaiting review
  app.get("/api/admin/pipeline/pending", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const entries = await dataEngineService.getPendingPipelineEntries();
      res.json(entries);
    } catch (error) {
      logger.error("Error fetching pending pipeline entries:", error);
      res.status(500).json({ error: "Failed to fetch pending entries" });
    }
  });

  // Integration health check must be registered before /:status.
  app.get("/api/admin/pipeline/health", isAuthenticated, requireAdmin, async (_req: Request, res: Response) => {
    try {
      await sendPipelineHealthResponse(res);
    } catch (error) {
      logger.error("Error running pipeline health check:", error);
      res.status(500).json({
        webhook_receiving_data: false,
        fighters_created: false,
        events_created: false,
        event_fights_created: false,
        data_integrity_valid: false,
        error: "Health check failed - database may be unreachable",
      });
    }
  });

  // Get entries by status (approved, rejected, applied, failed)
  app.get("/api/admin/pipeline/:status", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.params.status as string;
      
      if (!isDataPipelineStatus(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const entries = await dataEngineService.getPipelineEntriesByStatus(status);
      res.json(entries);
    } catch (error) {
      logger.error("Error fetching pipeline entries by status:", error);
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  // Update an entry's data (Edit functionality)
  app.patch("/api/admin/pipeline/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ error: "Data payload required" });
      }

      await dataEngineService.updatePipelineEntryData(id, data);
      
      res.json({ message: "Entry updated successfully", entryId: id });
    } catch (error) {
      logger.error("Error updating pipeline entry:", error);
      res.status(500).json({ error: "Failed to update entry" });
    }
  });

  // Approve an entry (ready to apply)
  app.post("/api/admin/pipeline/:id/approve", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const adminUserId = req.user.id;

      await dataEngineService.approveEntry(id, adminUserId);
      
      res.json({ message: "Entry approved successfully", entryId: id });
    } catch (error) {
      logger.error("Error approving pipeline entry:", error);
      res.status(500).json({ error: "Failed to approve entry" });
    }
  });

  // Reject an entry with reason
  app.post("/api/admin/pipeline/:id/reject", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const adminUserId = req.user.id;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Rejection reason required" });
      }

      await dataEngineService.rejectEntry(id, adminUserId, reason);
      
      res.json({ message: "Entry rejected", entryId: id });
    } catch (error) {
      logger.error("Error rejecting pipeline entry:", error);
      res.status(500).json({ error: "Failed to reject entry" });
    }
  });

  // Apply an approved entry to the database
  app.post("/api/admin/pipeline/:id/apply", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      await dataEngineService.applyEntry(id);
      
      res.json({ message: "Entry applied successfully", entryId: id });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logger.error("Error applying pipeline entry:", error);
      res.status(500).json({ 
        error: "Failed to apply entry",
        details: errorMessage
      });
    }
  });

  // Bulk approve multiple entries
  app.post("/api/admin/pipeline/bulk/approve", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { entryIds } = req.body;
      const adminUserId = req.user.id;

      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(400).json({ error: "Valid entryIds array required" });
      }

      const results = await Promise.all(
        entryIds.map((id: string) => 
          dataEngineService.approveEntry(id, adminUserId).catch(err => ({ id, error: err.message }))
        )
      );

      res.json({ 
        message: `Approved ${results.filter(r => !r).length} entries`,
        results 
      });
    } catch (error) {
      logger.error("Error bulk approving entries:", error);
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });

  // Get configuration value
  app.get("/api/admin/pipeline/config/:key", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const key = req.params.key as string;
      const value = await dataEngineService.getDataEngineConfig(key);
      
      if (!value) {
        return res.status(404).json({ error: "Configuration key not found" });
      }

      res.json(serializePipelineConfigValue(key, value));
    } catch (error) {
      logger.error("Error fetching config:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // Set configuration value
  app.post("/api/admin/pipeline/config", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key, value, description } = req.body;
      const adminUserId = req.user.id;

      if (!key || !value) {
        return res.status(400).json({ error: "Key and value required" });
      }

      await dataEngineService.setDataEngineConfig(key, value, description, adminUserId);
      
      res.json({ message: "Configuration saved successfully", key, configured: true });
    } catch (error) {
      logger.error("Error saving config:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // Manual retry trigger — re-attempts all failed entries under MAX_RETRIES
  app.post("/api/admin/pipeline/retry-failed", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await dataEngineService.retryFailedEntries();
      res.json({ message: "Retry run complete", ...result });
    } catch (error) {
      logger.error("Error running retry:", error);
      res.status(500).json({ error: "Failed to run retry" });
    }
  });

}
