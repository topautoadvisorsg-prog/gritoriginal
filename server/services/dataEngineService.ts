import { db } from "../db";
import { dataPipeline, dataEngineConfig, fighters, fightHistory, newsArticles, events, eventFights, fightOddsHistory } from "../../shared/schema";
import { eq, desc, and, sql, lt, lte } from "drizzle-orm";
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from "uuid";
import {
  syncFighterToSupabase,
  syncEventToSupabase,
  syncFightHistoryToSupabase,
  syncNewsToSupabase,
  syncEventFightToSupabase,
} from './outboundSyncService';
import { enqueueOutboundSync } from './jobService';

export type DataPipelineStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'failed';
export type SourceType = 'fighter' | 'fight' | 'news' | 'odds' | 'event';
export type ActionType = 'create' | 'update' | 'delete';

interface PipelineData {
  sourceType: SourceType;
  sourceId?: string;
  actionType: ActionType;
  dataType: string;
  data: any;
  submittedBy?: string;
  isPotentialDuplicate?: boolean;
  errorLog?: string;
}

/** Normalize a name string: lowercase + trim for comparison only. */
function normalizeName(name: string): string {
  return (name || '').toLowerCase().trim();
}

/**
 * Submit data to the pipeline for admin review.
 */
export async function submitToPipeline(payload: PipelineData): Promise<string> {
  try {
    let isPotentialDuplicate = payload.isPotentialDuplicate || false;

    // Duplicate Detection for Fighters (normalized name + optional weight class secondary check)
    if (payload.sourceType === 'fighter' && payload.actionType === 'create' && !payload.sourceId) {
      const { firstName, lastName, weightClass } = payload.data;
      const normFirst = normalizeName(firstName);
      const normLast = normalizeName(lastName);

      // Targeted duplicate detection instead of loading all fighters into memory
      // 1. Check exact name match
      let isDuplicate = false;
      const exactMatch = await db.select({ id: fighters.id })
        .from(fighters)
        .where(
          and(
            eq(sql`lower(${fighters.firstName})`, normFirst),
            eq(sql`lower(${fighters.lastName})`, normLast)
          )
        )
        .limit(1);

      if (exactMatch.length > 0) {
        isDuplicate = true;
        logger.info(`[Data Pipeline] Duplicate detected (name match): ${firstName} ${lastName} (existing id: ${exactMatch[0].id})`);
      } else if (weightClass) {
        // 2. Check similar match (last name + weight class)
        const similarMatch = await db.select({ id: fighters.id })
          .from(fighters)
          .where(
            and(
              eq(sql`lower(${fighters.lastName})`, normLast),
              eq(fighters.weightClass, weightClass)
            )
          )
          .limit(1);

        if (similarMatch.length > 0) {
          isDuplicate = true;
          logger.info(`[Data Pipeline] Potential duplicate detected (last name + weight class): ${firstName} ${lastName} (existing id: ${similarMatch[0].id})`);
        }
      }
      isPotentialDuplicate = isPotentialDuplicate || isDuplicate;
    }

    const [entry] = await db.insert(dataPipeline)
      .values({
        id: uuidv4(),
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        actionType: payload.actionType,
        dataType: payload.dataType,
        data: payload.data,
        submittedBy: payload.submittedBy || 'external-api',
        status: 'pending',
        isPotentialDuplicate,
        errorLog: payload.errorLog,
      })
      .returning();

    logger.info(`[Data Pipeline] Entry created: ${entry.id} - ${payload.sourceType}/${payload.actionType}`);
    
    return entry.id;
  } catch (error) {
    logger.error('[Data Pipeline] Error submitting to pipeline:', error);
    throw new Error('Failed to submit data to pipeline');
  }
}

/**
 * Get all pending pipeline entries for admin review.
 */
export async function getPendingPipelineEntries(): Promise<any[]> {
  try {
    const entries = await db.select()
      .from(dataPipeline)
      .where(eq(dataPipeline.status, 'pending'))
      .orderBy(desc(dataPipeline.submittedAt));

    return entries;
  } catch (error) {
    logger.error('[Data Pipeline] Error fetching pending entries:', error);
    return [];
  }
}

/**
 * Get pipeline entries by status.
 */
export async function getPipelineEntriesByStatus(status: DataPipelineStatus): Promise<any[]> {
  try {
    const entries = await db.select()
      .from(dataPipeline)
      .where(eq(dataPipeline.status, status))
      .orderBy(desc(dataPipeline.submittedAt))
      .limit(100);

    return entries;
  } catch (error) {
    logger.error('[Data Pipeline] Error fetching entries by status:', error);
    return [];
  }
}

/**
 * Update the data payload of a pipeline entry (Edit by Admin).
 */
export async function updatePipelineEntryData(entryId: string, data: any): Promise<void> {
  try {
    await db.update(dataPipeline)
      .set({ 
        data,
        isPotentialDuplicate: false // Reset flag if edited
      })
      .where(eq(dataPipeline.id, entryId));
    
    logger.info(`[Data Pipeline] Entry ${entryId} data updated by admin`);
  } catch (error) {
    logger.error(`[Data Pipeline] Error updating entry ${entryId}:`, error);
    throw new Error('Failed to update entry data');
  }
}

/**
 * Approve a pipeline entry (but don't apply yet).
 */
export async function approveEntry(entryId: string, adminUserId: string): Promise<void> {
  try {
    await db.update(dataPipeline)
      .set({
        status: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      })
      .where(eq(dataPipeline.id, entryId));

    logger.info(`[Data Pipeline] Entry ${entryId} approved by admin ${adminUserId}`);
  } catch (error) {
    logger.error('[Data Pipeline] Error approving entry:', error);
    throw new Error('Failed to approve entry');
  }
}

/**
 * Reject a pipeline entry with reason.
 */
export async function rejectEntry(entryId: string, adminUserId: string, reason: string): Promise<void> {
  try {
    await db.update(dataPipeline)
      .set({
        status: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      })
      .where(eq(dataPipeline.id, entryId));

    logger.info(`[Data Pipeline] Entry ${entryId} rejected by admin ${adminUserId}: ${reason}`);
  } catch (error) {
    logger.error('[Data Pipeline] Error rejecting entry:', error);
    throw new Error('Failed to reject entry');
  }
}

/**
 * Apply an approved entry to the database.
 * This is the actual data integration step.
 */
export async function applyEntry(entryId: string): Promise<void> {
  // Capture entry before transaction for post-commit outbound sync
  let appliedEntry: any = null;

  await db.transaction(async (tx) => {
    try {
      const [entry] = await tx.select()
        .from(dataPipeline)
        .where(eq(dataPipeline.id, entryId));

      if (!entry) {
        throw new Error('Entry not found');
      }

      if (entry.status !== 'approved') {
        throw new Error('Entry must be approved before applying');
      }

      // Apply based on source type and action; capture resolved IDs where needed
      let resolvedId: string | undefined;
      switch (entry.sourceType) {
        case 'fighter':
          await applyFighterData(tx, entry);
          break;
        case 'fight':
          await applyFightData(tx, entry);
          break;
        case 'event':
          resolvedId = await applyEventData(tx, entry);
          break;
        case 'news':
          await applyNewsData(tx, entry);
          break;
        case 'odds':
          await applyOddsData(tx, entry);
          break;
        default:
          throw new Error(`Unknown source type: ${entry.sourceType}`);
      }

      // Mark as applied
      await tx.update(dataPipeline)
        .set({
          status: 'applied',
          appliedAt: new Date(),
        })
        .where(eq(dataPipeline.id, entryId));

      // Inject resolved ID into data so outbound sync has access to it
      appliedEntry = resolvedId
        ? { ...entry, data: { ...entry.data, id: resolvedId } }
        : entry;
      logger.info(`[Data Pipeline] Entry ${entryId} applied successfully`);
    } catch (error) {
      logger.error('[Data Pipeline] Error applying entry:', error);
      throw error;
    }
  });

  // After transaction commits, push to data engine's Supabase (non-blocking, durable)
  if (appliedEntry) {
    await enqueueOutboundSync(appliedEntry).catch((err) =>
      logger.error('[OutboundSync] Post-apply enqueue failed:', err)
    );
  }
}

/**
 * Fire outbound sync to Supabase for a just-applied pipeline entry.
 * Runs outside the DB transaction so failures don't roll back the apply.
 */
async function _outboundSyncEntry(entry: any): Promise<void> {
  const data = entry.data as Record<string, unknown>;
  const action = entry.actionType === 'create' ? 'create' : 'update';
  switch (entry.sourceType) {
    case 'fighter':
      await syncFighterToSupabase(data, action);
      break;
    case 'event':
      await syncEventToSupabase(data, action);
      break;
    case 'fight':
      await syncFightHistoryToSupabase(data, action);
      break;
    case 'news':
      await syncNewsToSupabase(data, action);
      break;
    default:
      // odds — no direct Supabase table mapping currently
      break;
  }
}

/**
 * Apply event data updates.
 * If the payload includes an `eventFights` array, each fight is upserted
 * into the event_fights table and synced to Supabase after commit.
 */
async function applyEventData(tx: any, entry: any): Promise<string | undefined> {
  const eventData = entry.data;
  const { eventFights: fights, ...metadata } = eventData;

  let resolvedEventId: string;

  // Convert ISO date strings to Date objects for timestamp columns
  const normalizeEventMeta = (m: any) => ({
    ...m,
    date: m.date ? new Date(m.date) : undefined,
    lockTime: m.lockTime ? new Date(m.lockTime) : undefined,
  });

  if (entry.actionType === 'create') {
    resolvedEventId = uuidv4();
    await tx.insert(events).values({
      id: resolvedEventId,
      ...normalizeEventMeta(metadata),
    });
    logger.info(`[Data Pipeline] Created event ${resolvedEventId} (${metadata.name})`);
  } else if (entry.actionType === 'update') {
    if (!entry.sourceId) throw new Error('sourceId required for update');
    resolvedEventId = entry.sourceId;
    await tx.update(events)
      .set(normalizeEventMeta(metadata))
      .where(eq(events.id, resolvedEventId));
    logger.info(`[Data Pipeline] Updated event ${resolvedEventId}`);
  } else {
    return undefined;
  }

  // Insert or update embedded fight matchups if provided
  if (Array.isArray(fights) && fights.length > 0) {
    logger.info(`[Data Pipeline] Processing ${fights.length} embedded event fights for event ${resolvedEventId}`);
    const fightRows: any[] = [];

    for (const fight of fights) {
      const existing = await tx
        .select({ id: eventFights.id })
        .from(eventFights)
        .where(
          and(
            eq(eventFights.eventId, resolvedEventId),
            eq(eventFights.fighter1Id, fight.fighter1Id),
            eq(eventFights.fighter2Id, fight.fighter2Id),
          )
        );

      if (existing.length > 0) {
        // Update existing fight
        const fightId = existing[0].id;
        await tx.update(eventFights)
          .set({ ...fight, eventId: resolvedEventId })
          .where(eq(eventFights.id, fightId));
        fightRows.push({ id: fightId, ...fight, eventId: resolvedEventId });
        logger.info(`[Data Pipeline] Updated event_fight ${fightId}`);
      } else {
        // Insert new fight
        const fightId = uuidv4();
        await tx.insert(eventFights).values({
          id: fightId,
          eventId: resolvedEventId,
          status: 'OPEN',
          ...fight,
        });
        fightRows.push({ id: fightId, ...fight, eventId: resolvedEventId, status: 'OPEN' });
        logger.info(`[Data Pipeline] Inserted event_fight ${fightId} (${fight.fighter1Id} vs ${fight.fighter2Id})`);
      }
    }

    // Outbound sync for each event fight (non-blocking, after transaction)
    setImmediate(() => {
      for (const row of fightRows) {
        syncEventFightToSupabase(row as any, 'update').catch((err) =>
          logger.error('[OutboundSync] EventFight (from event payload) sync failed:', err)
        );
      }
    });
  }

  return resolvedEventId;
}

/**
 * Normalize fighter data: convert ISO date strings to Date objects for timestamp columns.
 * JSONB payloads store dates as strings; Drizzle timestamp columns require Date objects.
 */
function normalizeFighterData(data: any): any {
  const out = { ...data };
  if (out.dateOfBirth && typeof out.dateOfBirth === 'string') {
    const d = new Date(out.dateOfBirth);
    out.dateOfBirth = isNaN(d.getTime()) ? undefined : d;
  }
  // image_url is NOT NULL in DB — default to empty string if omitted
  if (!out.imageUrl) {
    out.imageUrl = '';
  }
  return out;
}

/**
 * Apply fighter data updates.
 */
async function applyFighterData(tx: any, entry: any): Promise<void> {
  const fighterData = normalizeFighterData(entry.data);
  
  if (entry.actionType === 'create') {
    // Final normalized name check before insert
    if (!entry.sourceId) {
      const normFirst = normalizeName(fighterData.firstName);
      const normLast = normalizeName(fighterData.lastName);
      
      const existing = await tx.select({ id: fighters.id })
        .from(fighters)
        .where(
          and(
            eq(sql`lower(${fighters.firstName})`, normFirst),
            eq(sql`lower(${fighters.lastName})`, normLast)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Upgrade 'create' to 'update' — merge into the existing record
        await tx.update(fighters)
          .set({ ...fighterData, lastUpdated: new Date() })
          .where(eq(fighters.id, existing[0].id));
        logger.info(`[Data Pipeline] applyFighterData: upgraded create→update for existing fighter ${existing[0].id}`);
        return;
      }
    }

    await tx.insert(fighters).values({
      id: uuidv4(),
      ...fighterData,
    });
  } else if (entry.actionType === 'update') {
    if (!entry.sourceId) {
      throw new Error('sourceId required for update');
    }
    await tx.update(fighters)
      .set({ ...fighterData, lastUpdated: new Date() })
      .where(eq(fighters.id, entry.sourceId));
  } else if (entry.actionType === 'delete') {
    if (!entry.sourceId) {
      throw new Error('sourceId required for delete');
    }
    await tx.delete(fighters)
      .where(eq(fighters.id, entry.sourceId));
  }
}

/**
 * Normalize fight history data before DB write.
 * Promotes location subfields into flat columns (eventCity, eventState,
 * eventCountry, eventVenue). Flat fields in the payload take priority;
 * falls back to extracting from the nested `location` JSONB object when present.
 * The `location` JSONB column is retained as-is for snapshot/backward compat.
 */
function normalizeFightData(data: any): any {
  const out = { ...data };
  const loc: Record<string, string | undefined> = (out.location && typeof out.location === 'object') ? out.location : {};
  out.eventCity    = out.eventCity    ?? loc.city    ?? undefined;
  out.eventState   = out.eventState   ?? loc.state   ?? undefined;
  out.eventCountry = out.eventCountry ?? loc.country ?? undefined;
  out.eventVenue   = out.eventVenue   ?? loc.venue   ?? undefined;
  return out;
}

/**
 * Apply fight history data updates.
 * Snapshot fields (eventName, eventDate, fightType, location) are nullable
 * in the DB and optional in syncFightHistorySchema — they are passed through
 * via spread and silently omitted when absent.
 * Flat location columns (eventCity, eventState, eventCountry, eventVenue) are
 * populated by normalizeFightData from either flat payload fields or the nested
 * location object.
 */
async function applyFightData(tx: any, entry: any): Promise<void> {
  const fightData = normalizeFightData(entry.data);
  
  if (entry.actionType === 'create') {
    await tx.insert(fightHistory).values({
      id: uuidv4(),
      ...fightData,
    });
  } else if (entry.actionType === 'update') {
    if (!entry.sourceId) {
      throw new Error('sourceId required for update');
    }
    await tx.update(fightHistory)
      .set(fightData)
      .where(eq(fightHistory.id, entry.sourceId));
  }
}

/**
 * Apply news article data.
 */
async function applyNewsData(tx: any, entry: any): Promise<void> {
  const newsData = entry.data;
  
  if (entry.actionType === 'create') {
    await tx.insert(newsArticles).values({
      id: uuidv4(),
      ...newsData,
    });
  } else if (entry.actionType === 'update') {
    if (!entry.sourceId) {
      throw new Error('sourceId required for update');
    }
    await tx.update(newsArticles)
      .set(newsData)
      .where(eq(newsArticles.id, entry.sourceId));
  }
}

/**
 * Apply odds data.
 */
async function applyOddsData(tx: any, entry: any): Promise<void> {
  const oddsData = entry.data;
  const { fightId, ...oddsFields } = oddsData;

  // 1. Update live odds on the fight
  await tx.update(eventFights)
    .set({ odds: oddsFields })
    .where(eq(eventFights.id, fightId));

  // 2. Log to history
  await tx.insert(fightOddsHistory).values({
    id: uuidv4(),
    fightId,
    ...oddsFields,
  });
}

/**
 * Get data engine configuration value.
 */
export async function getDataEngineConfig(key: string): Promise<string | null> {
  try {
    const [config] = await db.select()
      .from(dataEngineConfig)
      .where(eq(dataEngineConfig.configKey, key));

    if (config?.configValue) return config.configValue;

    // Fall back to environment variable if DB has no value set
    const envVal = process.env[key];
    return envVal || null;
  } catch (error) {
    logger.error('[Data Engine Config] Error fetching config:', error);
    // Still try env var on DB error
    return process.env[key] || null;
  }
}

const MAX_RETRIES = 3;

/**
 * Retry all failed pipeline entries that haven't yet reached MAX_RETRIES.
 * Called by the cron job every 30 minutes.
 * Returns counts of { attempted, succeeded, failed }.
 */
export async function retryFailedEntries(): Promise<{ attempted: number; succeeded: number; failed: number }> {
  let attempted = 0, succeeded = 0, failed = 0;

  try {
    const failedEntries = await db.select()
      .from(dataPipeline)
      .where(
        and(
          eq(dataPipeline.status, 'failed'),
          lt(dataPipeline.retryCount, MAX_RETRIES)
        )
      )
      .orderBy(dataPipeline.submittedAt);

    attempted = failedEntries.length;

    for (const entry of failedEntries) {
      try {
        // Re-approve the entry so applyEntry() can run
        await db.update(dataPipeline)
          .set({
            status: 'approved',
            retryCount: (entry.retryCount ?? 0) + 1,
            lastRetryAt: new Date(),
            errorLog: null,
          })
          .where(eq(dataPipeline.id, entry.id));

        await applyEntry(entry.id);
        succeeded++;
        logger.info(`[Data Pipeline] Retry succeeded for entry ${entry.id} (attempt ${(entry.retryCount ?? 0) + 1})`);
      } catch (err: any) {
        failed++;
        await db.update(dataPipeline)
          .set({
            status: 'failed',
            errorLog: err.message,
          })
          .where(eq(dataPipeline.id, entry.id));
        logger.warn(`[Data Pipeline] Retry failed for entry ${entry.id}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error('[Data Pipeline] retryFailedEntries encountered an error:', err);
  }

  logger.info(`[Data Pipeline] Retry run complete: ${attempted} attempted, ${succeeded} succeeded, ${failed} failed`);
  return { attempted, succeeded, failed };
}

/**
 * Set data engine configuration value.
 */
export async function setDataEngineConfig(key: string, value: string, description?: string, adminUserId?: string): Promise<void> {
  try {
    const existing = await getDataEngineConfig(key);
    
    if (existing !== null) {
      await db.update(dataEngineConfig)
        .set({
          configValue: value,
          description: description || null,
          updatedBy: adminUserId,
        })
        .where(eq(dataEngineConfig.configKey, key));
    } else {
      await db.insert(dataEngineConfig).values({
        id: uuidv4(),
        configKey: key,
        configValue: value,
        description: description || null,
        updatedBy: adminUserId,
      });
    }

    logger.info(`[Data Engine Config] ${key} = ${value}`);
  } catch (error) {
    logger.error('[Data Engine Config] Error setting config:', error);
    throw new Error('Failed to set configuration');
  }
}
