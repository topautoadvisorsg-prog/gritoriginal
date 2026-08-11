import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../server/user/routes/userRoutes.ts', import.meta.url),
  'utf8',
);

describe('R1 avatar object contract', () => {
  it('requires a positive bounded size and supported signed content type', () => {
    expect(source).toContain('Number.isSafeInteger(size)');
    expect(source).toContain('size <= 0');
    expect(source).toContain('size > MAX_AVATAR_SIZE');
    expect(source).toContain('isSupportedImageContentType(contentType)');
    expect(source).toContain('getUploadURLForPath(storagePath, contentType)');
  });

  it('accepts confirmation only for the authenticated user owned key', () => {
    expect(source).toContain('const storagePath = `users/${userId}/avatar`');
    expect(source).toContain('const expectedObjectPath = `/objects/${storagePath}`');
    expect(source).toContain('objectPath !== expectedObjectPath');
  });

  it('validates bounded object bytes before persisting a canonical public URL', () => {
    const readIndex = source.indexOf('getObjectBuffer(storagePath, MAX_AVATAR_SIZE)');
    const detectIndex = source.indexOf('detectSupportedImageType(buffer)');
    const urlIndex = source.indexOf('getPublicUrl(storagePath)');
    const writeIndex = source.indexOf('avatarUrl: publicUrl');

    expect(readIndex).toBeGreaterThan(-1);
    expect(detectIndex).toBeGreaterThan(readIndex);
    expect(urlIndex).toBeGreaterThan(detectIndex);
    expect(writeIndex).toBeGreaterThan(urlIndex);
  });
});
