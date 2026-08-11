export type PipelineSourceType = 'fighter' | 'fight' | 'news' | 'odds' | 'event';
export type PipelineActionType = 'create' | 'update' | 'delete';

export type PipelineActionPolicyCode =
  | 'INGESTION_DELETE_REQUIRES_POLICY'
  | 'PIPELINE_ENTRY_NOT_FOUND'
  | 'PIPELINE_STATE_CONFLICT'
  | 'PIPELINE_TARGET_ID_REQUIRED'
  | 'PIPELINE_TARGET_NOT_FOUND';

/**
 * Fail-closed policy for canonical MMA mutations proposed by an external
 * ingestion source. Physical deletion remains disabled until the platform has
 * an approved tombstone, retention, dependency, and downstream replay policy.
 */
export class PipelineActionPolicyError extends Error {
  constructor(
    public readonly code: PipelineActionPolicyCode,
    message: string,
    public readonly statusCode = 422,
  ) {
    super(message);
    this.name = 'PipelineActionPolicyError';
  }
}

export function pipelineEntryNotFound(entryId: string): PipelineActionPolicyError {
  return new PipelineActionPolicyError(
    'PIPELINE_ENTRY_NOT_FOUND',
    `Pipeline entry not found: ${entryId}`,
    404,
  );
}

export function pipelineStateConflict(message: string): PipelineActionPolicyError {
  return new PipelineActionPolicyError('PIPELINE_STATE_CONFLICT', message, 409);
}

export function assertPipelineTargetChanged(
  rows: Array<{ id: string }>,
  entity: string,
  id: string,
): void {
  if (rows.length !== 1) {
    throw new PipelineActionPolicyError(
      'PIPELINE_TARGET_NOT_FOUND',
      `${entity} target not found: ${id}`,
      409,
    );
  }
}

export function assertPipelineActionAllowed(
  sourceType: PipelineSourceType,
  actionType: PipelineActionType,
  sourceId?: string | null,
): void {
  if (actionType === 'delete') {
    throw new PipelineActionPolicyError(
      'INGESTION_DELETE_REQUIRES_POLICY',
      `${sourceType} delete proposals are disabled until tombstone and retention policy is approved`,
    );
  }

  // Odds target identity is carried by the separately validated data.fightId.
  if (actionType === 'update' && sourceType !== 'odds' && !sourceId) {
    throw new PipelineActionPolicyError(
      'PIPELINE_TARGET_ID_REQUIRED',
      `sourceId is required for ${sourceType} update proposals`,
    );
  }
}
