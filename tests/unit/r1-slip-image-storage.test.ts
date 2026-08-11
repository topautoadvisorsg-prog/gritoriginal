import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  InvalidSlipImageError,
  MAX_SLIP_IMAGE_BYTES,
  deleteSlipImage,
  resolveLegacySlipFilePath,
  storeSlipImage,
  validateSlipImage,
} from '../../server/services/slipImageStorage';
import { extractObjectPathFromPublicUrl, type StorageService } from '../../server/services/storageService';

const VALID_ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlSAAAAAASUVORK5CYII=',
  'base64',
);

const slipRouteSource = readFileSync(
  new URL('../../server/user/routes/slipRoutes.ts', import.meta.url),
  'utf8',
);
const adminSlipRouteSource = readFileSync(
  new URL('../../server/admin/routes/adminSlipRoutes.ts', import.meta.url),
  'utf8',
);
const cronSource = readFileSync(
  new URL('../../server/services/cronService.ts', import.meta.url),
  'utf8',
);

describe('R1 slip image object lifecycle', () => {
  it('validates readable media bytes against the normalized claim', () => {
    expect(validateSlipImage(VALID_ONE_PIXEL_PNG, 'image/png')).toEqual({
      contentType: 'image/png',
      extension: 'png',
    });
    expect(() => validateSlipImage(VALID_ONE_PIXEL_PNG, 'image/jpeg'))
      .toThrow(InvalidSlipImageError);
    expect(() => validateSlipImage(Buffer.from('not an image'), 'image/png'))
      .toThrow(InvalidSlipImageError);
  });

  it('uploads only a server-generated slip key under the bounded prefix', async () => {
    const putObject = vi.fn().mockResolvedValue(undefined);
    const getPublicUrl = vi.fn((key: string) => `https://cdn.example.test/${key}`);
    const storage = { putObject, getPublicUrl } as unknown as StorageService;
    const slipId = 'a3f0bb72-b8cb-4a93-a6f6-dad37b37acef';

    await expect(storeSlipImage(slipId, VALID_ONE_PIXEL_PNG, 'image/png', storage))
      .resolves.toBe(`https://cdn.example.test/slips/${slipId}.png`);
    expect(putObject).toHaveBeenCalledWith(
      `slips/${slipId}.png`,
      VALID_ONE_PIXEL_PNG,
      'image/png',
      MAX_SLIP_IMAGE_BYTES,
    );
  });

  it('accepts only exact canonical object URLs without query or traversal syntax', () => {
    const base = 'https://cdn.example.test/public-assets';
    expect(extractObjectPathFromPublicUrl(base, `${base}/slips/id.png`)).toBe('slips/id.png');
    expect(extractObjectPathFromPublicUrl(base, 'https://other.example/slips/id.png')).toBeNull();
    expect(extractObjectPathFromPublicUrl(base, `${base}/slips/id.png?token=x`)).toBeNull();
    expect(extractObjectPathFromPublicUrl(base, `${base}/slips/%2e%2e/secret`)).toBeNull();
  });

  it('deletes only canonical objects under the owned slip prefix', async () => {
    const base = 'https://cdn.example.test/public-assets';
    const deleteObject = vi.fn().mockResolvedValue(undefined);
    const storage = {
      getObjectPathFromPublicUrl: (url: string) => extractObjectPathFromPublicUrl(base, url),
      deleteObject,
    } as unknown as StorageService;

    await deleteSlipImage(`${base}/slips/id.png`, { storageService: storage });
    expect(deleteObject).toHaveBeenCalledWith('slips/id.png');
    await expect(deleteSlipImage(`${base}/events/id.png`, { storageService: storage }))
      .rejects.toThrow('outside the owned storage prefix');
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it('maps only allowlisted legacy paths inside the slip storage root', () => {
    const cwd = path.resolve('C:/safe/app');
    expect(resolveLegacySlipFilePath(cwd, '/uploads/slips/user_1/id.png'))
      .toBe(path.resolve(cwd, 'uploads', 'slips', 'user_1', 'id.png'));
    expect(resolveLegacySlipFilePath(cwd, '/objects/slips/user_1/id.png'))
      .toBe(path.resolve(cwd, 'uploads', 'slips', 'user_1', 'id.png'));
    expect(() => resolveLegacySlipFilePath(cwd, '/uploads/slips/../secret'))
      .toThrow('Unsafe legacy slip image path');
    expect(() => resolveLegacySlipFilePath(cwd, '/uploads/events/id.png'))
      .toThrow('Unsupported legacy slip image path');
  });

  it('compensates a failed database insert and keeps cleanup before row deletion', () => {
    const storeIndex = slipRouteSource.indexOf('imageUrl = await storeSlipImage(');
    const insertIndex = slipRouteSource.indexOf('await db.insert(slips)');
    const compensateIndex = slipRouteSource.indexOf('await deleteSlipImage(imageUrl)');
    expect(storeIndex).toBeGreaterThan(-1);
    expect(insertIndex).toBeGreaterThan(storeIndex);
    expect(compensateIndex).toBeGreaterThan(insertIndex);

    for (const source of [slipRouteSource, adminSlipRouteSource]) {
      const deleteImageIndex = source.lastIndexOf('await deleteSlipImage(slip.imageUrl)');
      const deleteRowIndex = source.lastIndexOf('await db.delete(slips)');
      expect(deleteImageIndex).toBeGreaterThan(-1);
      expect(deleteRowIndex).toBeGreaterThan(deleteImageIndex);
    }
  });

  it('expires slips individually and preserves failed rows for retry', () => {
    expect(cronSource).toContain('await deleteSlipImage(slip.imageUrl)');
    expect(cronSource).toContain('await db.delete(slips).where(eq(slips.id, slip.id))');
    expect(cronSource).toContain('row preserved for retry');
    expect(cronSource).not.toContain('await db.delete(slips).where(lt(slips.expiresAt, now))');
  });
});
