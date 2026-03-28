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

export async function initJobService() {
  if (boss) return boss;

  try {
    boss = new PgBoss(env.DATABASE_URL);
    
    boss.on('error', (error: any) => logger.error('[pg-boss] Error:', error));
    
    await boss.start();
    logger.info('[pg-boss] Job queue started successfully');

    await boss.work('outbound-sync', async (job: any) => {
      const { entry } = job.data as { entry: any };
      logger.info(`[pg-boss] Processing outbound-sync for entry ${entry.id}`);
      
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
      }
    });

    return boss;
  } catch (err) {
    logger.error('[pg-boss] Failed to start:', err);
    throw err;
  }
}

export async function enqueueOutboundSync(entry: any) {
  if (!boss) {
    logger.warn('[pg-boss] Queue not initialized, falling back to setImmediate');
    setImmediate(async () => {
      // Fallback if boss isn't initialized
      const data = entry.data as Record<string, unknown>;
      const action = entry.actionType === 'create' ? 'create' : 'update';
      try {
        if (entry.sourceType === 'fighter') await syncFighterToSupabase(data, action);
        else if (entry.sourceType === 'event') await syncEventToSupabase(data, action);
        else if (entry.sourceType === 'fight') await syncFightHistoryToSupabase(data, action);
        else if (entry.sourceType === 'news') await syncNewsToSupabase(data, action);
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
