import type { PipelineActionType } from './pipelineActionPolicy';

export type PipelineDataPolicyCode =
  | 'FIGHTER_IMAGE_REQUIRED'
  | 'FIGHTER_IMAGE_INVALID';

export class PipelineDataPolicyError extends Error {
  readonly statusCode = 422;

  constructor(
    public readonly code: PipelineDataPolicyCode,
    message: string,
  ) {
    super(message);
    this.name = 'PipelineDataPolicyError';
  }
}

function isReviewedImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    const marker = `${url.hostname}${url.pathname}`.toLowerCase();
    return !(
      url.hostname.endsWith('.example.com') ||
      url.hostname.endsWith('.example.test') ||
      url.hostname === 'example.com' ||
      url.hostname === 'example.test' ||
      /placeholder|default[-_]?avatar|unknown[-_]?fighter/.test(marker)
    );
  } catch {
    return false;
  }
}

/**
 * The current production fighters.image_url column is NOT NULL. Until the
 * schema baseline makes missing images nullable, a create must be held for
 * operator completion instead of fabricating an empty or placeholder value.
 * Partial updates may omit imageUrl and preserve the current value.
 */
export function assertFighterImageContract(
  actionType: PipelineActionType,
  data: Record<string, unknown>,
): void {
  const hasImage = Object.prototype.hasOwnProperty.call(data, 'imageUrl');
  const imageUrl = data.imageUrl;

  if (actionType === 'create' && !hasImage) {
    throw new PipelineDataPolicyError(
      'FIGHTER_IMAGE_REQUIRED',
      'Fighter creation requires a reviewed imageUrl until the database image field is nullable',
    );
  }

  if (hasImage && (!isReviewedImageUrl(imageUrl) || data.needsImage === true)) {
    throw new PipelineDataPolicyError(
      imageUrl === null || imageUrl === '' ? 'FIGHTER_IMAGE_REQUIRED' : 'FIGHTER_IMAGE_INVALID',
      'Fighter imageUrl must be a reviewed HTTP(S) URL; placeholder values are not permitted',
    );
  }
}
