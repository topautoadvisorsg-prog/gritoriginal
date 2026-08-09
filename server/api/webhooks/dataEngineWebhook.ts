import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import * as dataEngineService from '../../services/dataEngineService';
import {
  syncPayloadSchema,
  syncFighterSchema,
  syncFightHistorySchema,
  syncNewsSchema,
  syncOddsSchema,
  syncEventSchema,
} from '../../../shared/sync-schemas';
import { strictApiLimiter } from '../../middleware/rateLimiter';
import { env } from '../../config/env';

const router = Router();
router.use('/data-engine/webhook', strictApiLimiter);

/**
 * Accept a validated external proposal into the pending pipeline.
 * Applying data requires a separate authenticated administrator review,
 * approval, and apply action; this boundary never writes canonical entities.
 */
router.post('/data-engine/webhook', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!env.WEBHOOK_KEY || apiKey !== env.WEBHOOK_KEY) {
      logger.warn('[Data Engine Webhook] Invalid or missing x-api-key from %s', req.ip);
      return res.status(401).end();
    }

    const payloadResult = syncPayloadSchema.safeParse(req.body);
    if (!payloadResult.success) {
      logger.warn('[Data Engine Webhook] Invalid payload structure: %o', payloadResult.error.issues);
      return res.status(422).json({
        error: 'Invalid payload structure',
        details: payloadResult.error.issues,
      });
    }

    const payload = payloadResult.data;
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
        logger.error(
          '[Data Engine Webhook] Validation failed for %s: %o',
          payload.sourceType,
          dataValidation.error.format(),
        );
        return res.status(422).json({
          error: `Validation failed for ${payload.sourceType}`,
          details: dataValidation.error.issues,
        });
      }
      validatedData = dataValidation.data;
    } else if (!payload.sourceId) {
      return res.status(422).json({ error: 'sourceId is required for delete actions' });
    }

    const entryId = await dataEngineService.submitToPipeline({
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      actionType: payload.actionType,
      dataType: payload.dataType,
      data: validatedData,
      submittedBy: 'external-data-engine',
    });

    logger.info(
      '[Data Engine Webhook] Queued %s/%s for mandatory administrator review -> entry %s',
      payload.actionType,
      payload.sourceType,
      entryId,
    );

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
