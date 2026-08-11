import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  detectSupportedImageType,
  hasReadableImageDimensions,
  isSupportedImageContentType,
} from '../../server/services/imageValidation';
import {
  collectBodyWithLimit,
  ObjectSizeLimitError,
} from '../../server/services/storageService';

async function* chunks(...values: number[][]): AsyncIterable<Uint8Array> {
  for (const value of values) yield Uint8Array.from(value);
}

describe('R1 owned image validation', () => {
  it('allowlists the three supported content types', () => {
    expect(isSupportedImageContentType('image/jpeg')).toBe(true);
    expect(isSupportedImageContentType('image/png')).toBe(true);
    expect(isSupportedImageContentType('image/webp')).toBe(true);
    expect(isSupportedImageContentType('image/heif')).toBe(false);
  });

  it('detects supported magic bytes and rejects other parser formats', () => {
    expect(detectSupportedImageType(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe('image/jpeg');
    expect(detectSupportedImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(detectSupportedImageType(Buffer.from('RIFFxxxxWEBP', 'ascii'))).toBe('image/webp');
    expect(detectSupportedImageType(Buffer.from('icnsxxxx', 'ascii'))).toBeNull();
    expect(detectSupportedImageType(Buffer.from('ftypheic', 'ascii'))).toBeNull();
  });

  it('rejects a supported signature when the image structure is unreadable', () => {
    expect(hasReadableImageDimensions(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(false);
  });

  it('collects an object only within the explicit byte budget', async () => {
    await expect(collectBodyWithLimit(chunks([1, 2], [3]), 3))
      .resolves.toEqual(Buffer.from([1, 2, 3]));
    await expect(collectBodyWithLimit(chunks([1, 2], [3, 4]), 3))
      .rejects.toBeInstanceOf(ObjectSizeLimitError);
  });

  it('keeps fighter object keys server-owned and tied to an existing fighter', () => {
    const routeSource = readFileSync(
      new URL('../../server/user/routes/fighterImageRoutes.ts', import.meta.url),
      'utf8',
    );

    expect(routeSource.match(/await storage\.getFighter\(fighterId\)/g)).toHaveLength(2);
    expect(routeSource).toContain('objectPath !== expectedObjectPath');
    expect(routeSource).toContain('getUploadURLForPath(objectPath, contentType)');
  });

  it('fails fast on a declared oversized object before streaming it', () => {
    const storageSource = readFileSync(
      new URL('../../server/services/storageService.ts', import.meta.url),
      'utf8',
    );

    expect(storageSource).toContain("typeof response.ContentLength === 'number'");
    expect(storageSource).toContain('response.ContentLength > maxBytes');
  });
});
