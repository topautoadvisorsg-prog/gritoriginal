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

type OutboundSyncSource = 'fighter' | 'event' | 'event_fight' | 'fight' | 'news';
type OutboundSyncAction = 'create' | 'update' | 'delete';

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
  const action: OutboundSyncAction = entry.actionType;

  switch (entry.sourceType) {
    case 'fighter':
      await syncFighterToSupabase(entry.data, action);
      break;
    case 'event':
      await syncEventToSupabase(entry.data, action);
      break;
    case 'event_fight':
      await syncEventFightToSupabase(entry.data, action);
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

  const candidate = new PgBoss(env.DATABASE_URL);
  try {
    candidate.on('error', (error: unknown) => logger.error('[pg-boss] Error:', error));
    
    await candidate.start();
    logger.info('[pg-boss] Job queue started successfully');

    await candidate.createQueue('outbound-sync');

    await candidate.work('outbound-sync', async (job: { data: OutboundSyncJob }) => {
      const { entry } = job.data;
      logger.info(`[pg-boss] Processing outbound-sync for entry ${entry.id}`);
      await runOutboundSync(entry);
    });

    boss = candidate;
    return boss;
  } catch (err) {
    logger.error('[pg-boss] Failed to start:', err);
    await candidate.stop().catch(() => undefined);
    throw err;
  }
}

export async function enqueueOutboundSync(entry: OutboundSyncEntry): Promise<string> {
  if (!boss) {
    throw new Error('Outbound-sync queue is not initialized');
  }

  // Enqueue with retry policy
  const jobId = await boss.send('outbound-sync', { entry }, {
    retryLimit: 5,
    retryDelay: 60, // 1 minute
  });
  if (!jobId) {
    throw new Error(`pg-boss did not create outbound-sync job for entry ${entry.id}`);
  }
  logger.info(`[pg-boss] Enqueued outbound-sync for entry ${entry.id}`);
  return jobId;
}

export function getBoss() {
  return boss;
}
