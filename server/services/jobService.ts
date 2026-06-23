import { PgBoss } from 'pg-boss';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  syncFighterToSupabase,
  syncEventToSupabase,
  syncFightHistoryToSupabase,
  syncNewsToSupabase,
  syncEventFightToSupabase,
} from './outboundSyncService';

let boss: PgBoss | null = null;

type OutboundSyncSource = 'fighter' | 'event' | 'fight' | 'news';
type OutboundSyncAction = 'create' | 'update';

export interface OutboundSyncEntry {
  id: string;
  sourceType: OutboundSyncSource;
  actionType: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
}

interface OutboundSyncJob {
  entry: OutboundSyncEntry;
}

async function runOutboundSync(entry: OutboundSyncEntry): Promise<void> {
  const action: OutboundSyncAction = entry.actionType === 'create' ? 'create' : 'update';

  switch (entry.sourceType) {
    case 'fighter':
      await syncFighterToSupabase(entry.data, action);
      break;
    case 'event':
      await syncEventToSupabase(entry.data, action);
      break;
    case 'fight':
      await syncFightHistoryToSupabase(entry.data, action);
      break;
    case 'news':
      await syncNewsToSupabase(entry.data, action);
      break;
  }
}

export async function initJobService() {
  if (boss) return boss;

  try {
    boss = new PgBoss(env.DATABASE_URL);
    
    boss.on('error', (error: unknown) => logger.error('[pg-boss] Error:', error));
    
    await boss.start();
    logger.info('[pg-boss] Job queue started successfully');

    await boss.createQueue('outbound-sync').catch(() => {});

    await boss.work('outbound-sync', async (job: { data: OutboundSyncJob }) => {
      const { entry } = job.data;
      logger.info(`[pg-boss] Processing outbound-sync for entry ${entry.id}`);
      await runOutboundSync(entry);
    });

    return boss;
  } catch (err) {
    logger.error('[pg-boss] Failed to start:', err);
    throw err;
  }
}

export async function enqueueOutboundSync(entry: OutboundSyncEntry) {
  if (!boss) {
    logger.warn('[pg-boss] Queue not initialized, falling back to setImmediate');
    setImmediate(async () => {
      try {
        await runOutboundSync(entry);
      } catch (e) {
        logger.error('[OutboundSync Fallback] Post-apply sync failed:', e);
      }
    });
    return;
  }

  // Enqueue with retry policy
  await boss.send('outbound-sync', { entry }, {
    retryLimit: 5,
    retryDelay: 60, // 1 minute
  });
  logger.info(`[pg-boss] Enqueued outbound-sync for entry ${entry.id}`);
}

export function getBoss() {
  return boss;
}
