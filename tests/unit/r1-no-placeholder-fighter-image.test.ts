import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertFighterImageContract,
  PipelineDataPolicyError,
} from '../../server/config/pipelineDataPolicy';

describe('R1 fighter image no-placeholder policy', () => {
  it('holds a fighter create for review when its required image is missing', () => {
    for (const data of [{}, { imageUrl: null }, { imageUrl: '' }]) {
      expect(() => assertFighterImageContract('create', data)).toThrowError(
        expect.objectContaining({
          name: 'PipelineDataPolicyError',
          code: 'FIGHTER_IMAGE_REQUIRED',
          statusCode: 422,
        }),
      );
    }
  });

  it('rejects invalid and obvious placeholder image values', () => {
    for (const imageUrl of [
      'not-a-url',
      'data:image/png;base64,abc',
      'https://example.com/fighter.jpg',
      'https://cdn.example.org/images/placeholder-fighter.png',
      'https://cdn.example.org/default_avatar.png',
    ]) {
      expect(() => assertFighterImageContract('create', { imageUrl })).toThrowError(
        expect.objectContaining({ code: 'FIGHTER_IMAGE_INVALID' }),
      );
    }
    expect(() => assertFighterImageContract('create', {
      imageUrl: 'https://cdn.intakemma.com/fighters/fighter-1.webp',
      needsImage: true,
    })).toThrowError(PipelineDataPolicyError);
  });

  it('accepts a reviewed image and preserves it when a partial update omits imageUrl', () => {
    expect(() => assertFighterImageContract('create', {
      imageUrl: 'https://cdn.intakemma.com/fighters/fighter-1.webp',
    })).not.toThrow();
    expect(() => assertFighterImageContract('update', { nickname: 'The Example' }))
      .not.toThrow();
    expect(() => assertFighterImageContract('update', { imageUrl: null }))
      .toThrowError(expect.objectContaining({ code: 'FIGHTER_IMAGE_REQUIRED' }));
  });

  it('enforces the contract before approval and apply without fabricating data', () => {
    const service = readFileSync(
      new URL('../../server/services/dataEngineService.ts', import.meta.url),
      'utf8',
    );
    const routes = readFileSync(
      new URL('../../server/admin/routes/adminDataPipelineRoutes.ts', import.meta.url),
      'utf8',
    );

    expect(service.match(/assertFighterImageContract\(/g)).toHaveLength(2);
    expect(service).toMatch(/sourceId: dataPipeline\.sourceId,\s+data: dataPipeline\.data,/);
    expect(service).not.toContain("out.imageUrl = ''");
    expect(routes).toContain('error instanceof PipelineDataPolicyError');
  });
});
