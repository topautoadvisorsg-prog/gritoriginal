import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertPipelineActionAllowed,
  assertPipelineTargetChanged,
  pipelineEntryNotFound,
  pipelineStateConflict,
  PipelineActionPolicyError,
  type PipelineSourceType,
} from '../../server/config/pipelineActionPolicy';

describe('R1 pipeline action and target policy', () => {
  it('allows creates and only targeted updates', () => {
    expect(() => assertPipelineActionAllowed('fighter', 'create')).not.toThrow();
    expect(() => assertPipelineActionAllowed('fight', 'update', 'target-id')).not.toThrow();
    expect(() => assertPipelineActionAllowed('odds', 'update')).not.toThrow();

    expect(() => assertPipelineActionAllowed('event', 'update')).toThrowError(
      expect.objectContaining({
        code: 'PIPELINE_TARGET_ID_REQUIRED',
        statusCode: 422,
      }),
    );
  });

  it('rejects physical ingestion deletes for every canonical source', () => {
    const sources: PipelineSourceType[] = ['fighter', 'fight', 'event', 'news', 'odds'];
    for (const source of sources) {
      expect(() => assertPipelineActionAllowed(source, 'delete', 'target-id')).toThrowError(
        expect.objectContaining({
          name: 'PipelineActionPolicyError',
          code: 'INGESTION_DELETE_REQUIRES_POLICY',
          statusCode: 422,
        }),
      );
    }
  });

  it('reports a missing correction target as a conflict', () => {
    expect(() => assertPipelineTargetChanged([], 'Fighter', 'missing-id')).toThrowError(
      expect.objectContaining({
        code: 'PIPELINE_TARGET_NOT_FOUND',
        statusCode: 409,
      }),
    );
    expect(() => assertPipelineTargetChanged([{ id: 'fighter-1' }], 'Fighter', 'fighter-1'))
      .not.toThrow();
  });

  it('returns explicit not-found and state-conflict semantics', () => {
    expect(pipelineEntryNotFound('entry-1')).toMatchObject({
      code: 'PIPELINE_ENTRY_NOT_FOUND',
      statusCode: 404,
    });
    expect(pipelineStateConflict('not pending')).toMatchObject({
      code: 'PIPELINE_STATE_CONFLICT',
      statusCode: 409,
    });
  });

  it('keeps the policy enforced at every ingestion mutation boundary', () => {
    const webhook = readFileSync(
      new URL('../../server/api/webhooks/dataEngineWebhook.ts', import.meta.url),
      'utf8',
    );
    const service = readFileSync(
      new URL('../../server/services/dataEngineService.ts', import.meta.url),
      'utf8',
    );
    const adminRoutes = readFileSync(
      new URL('../../server/admin/routes/adminDataPipelineRoutes.ts', import.meta.url),
      'utf8',
    );

    expect(webhook.indexOf('assertPipelineActionAllowed('))
      .toBeLessThan(webhook.indexOf('submitToPipeline({'));
    expect(service.match(/assertPipelineActionAllowed\(/g)).toHaveLength(3);
    expect(service).toContain(".for('update')");
    expect(service).not.toContain("entry.actionType === 'delete'");
    expect(service.match(/assertPipelineTargetChanged\(/g)?.length).toBeGreaterThanOrEqual(6);
    expect(adminRoutes).toContain('error instanceof PipelineActionPolicyError');
    expect(adminRoutes).toContain('res.status(error.statusCode)');
  });

  it('uses a typed policy error rather than an unclassified failure', () => {
    try {
      assertPipelineActionAllowed('news', 'delete', 'article-id');
      throw new Error('expected policy rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(PipelineActionPolicyError);
    }
  });
});
