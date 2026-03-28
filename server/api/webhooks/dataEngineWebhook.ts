import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import * as dataEngineService from '../../services/dataEngineService';
import { 
  syncPayloadSchema, 
  syncFighterSchema, 
  syncFightHistorySchema, 
  syncNewsSchema, 
  syncOddsSchema, 
  syncEventSchema 
} from '../../../shared/sync-schemas';
import { strictApiLimiter } from '../../middleware/rateLimiter';
import { env } from '../../config/env';

const router = Router();
router.use('/data-engine/webhook', strictApiLimiter);

/**
 * Webhook endpoint for external data engine to push data.
 *
 * Auto-apply: When DATA_ENGINE_AUTO_APPLY=true in data_engine_config,
 * incoming payloads are immediately approved and applied without admin
 * review. The pipeline entry is still created for audit purposes.
 */
router.post('/data-engine/webhook', async (req: Request, res: Response) => {
  try {
    // 1. Verify static environment API key (Critical Security)
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!env.WEBHOOK_KEY || apiKey !== env.WEBHOOK_KEY) {
      logger.warn('[Data Engine Webhook] Invalid or missing x-api-key from %s', req.ip);
      return res.status(401).end();
    }

    // 2. Validate basic payload structure
    const payloadResult = syncPayloadSchema.safeParse(req.body);
    if (!payloadResult.success) {
      logger.warn('[Data Engine Webhook] Invalid payload structure: %o', payloadResult.error.issues);
      return res.status(422).json({ 
        error: 'Invalid payload structure', 
        details: payloadResult.error.issues 
      });
    }

    const payload = payloadResult.data;

    // 3. Conditional validation of the "data" object based on sourceType
    // Delete actions only require sourceId — skip full data validation
    let validatedData = payload.data;
    if (payload.actionType !== 'delete') {
      let dataValidation;
      switch (payload.sourceType) {
        case 'fighter':
          dataValidation = syncFighterSchema.safeParse(payload.data);
          break;
        case 'fight':
          dataValidation = syncFightHistorySchema.safeParse(payload.data);
          break;
        case 'news':
          dataValidation = syncNewsSchema.safeParse(payload.data);
          break;
        case 'odds':
          dataValidation = syncOddsSchema.safeParse(payload.data);
          break;
        case 'event':
          dataValidation = syncEventSchema.safeParse(payload.data);
          break;
        default:
          return res.status(400).json({ error: `Unknown sourceType: ${payload.sourceType}` });
      }

      if (!dataValidation.success) {
        logger.error('[Data Engine Webhook] Validation failed for %s: %o',
          payload.sourceType, dataValidation.error.format());
        return res.status(422).json({ 
          error: `Validation failed for ${payload.sourceType}`, 
          details: dataValidation.error.issues 
        });
      }
      validatedData = dataValidation.data;
    } else if (!payload.sourceId) {
      return res.status(422).json({ error: 'sourceId is required for delete actions' });
    }

    // 4. Submit to pipeline for admin review (or auto-apply)
    const entryId = await dataEngineService.submitToPipeline({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      actionType: payload.actionType,
      dataType: payload.dataType,
      data: validatedData,
      submittedBy: 'external-data-engine',
    });

    logger.info('[Data Engine Webhook] Queued %s/%s → entry %s',
      payload.actionType, payload.sourceType, entryId);

    // 5. Auto-apply if enabled
    const autoApply = await dataEngineService.getDataEngineConfig('DATA_ENGINE_AUTO_APPLY');
    if (autoApply === 'true') {
      try {
        await dataEngineService.approveEntry(entryId, 'auto-apply');
        await dataEngineService.applyEntry(entryId);
        logger.info('[Data Engine Webhook] Auto-applied entry %s (%s/%s)',
          entryId, payload.actionType, payload.sourceType);
        return res.status(200).json({ 
          message: 'Data received and applied automatically',
          entryId,
          applied: true,
        });
      } catch (applyErr: any) {
        logger.error('[Data Engine Webhook] Auto-apply failed for entry %s: %s',
          entryId, applyErr.message);
        // Fall through — entry is queued in pending state, admin can apply manually
        return res.status(202).json({
          message: 'Data received and queued (auto-apply failed — entry pending admin review)',
          entryId,
          applied: false,
          applyError: applyErr.message,
        });
      }
    }

    res.status(201).json({ 
      message: 'Data received and queued for review',
      entryId,
      applied: false,
    });
  } catch (error) {
    logger.error('[Data Engine Webhook] Unhandled error: %o', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
