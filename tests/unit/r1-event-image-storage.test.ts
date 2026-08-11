import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const eventRouteSource = readFileSync(
  new URL('../../server/admin/routes/adminEventRoutes.ts', import.meta.url),
  'utf8',
);
const storageSource = readFileSync(
  new URL('../../server/services/storageService.ts', import.meta.url),
  'utf8',
);

describe('R1 event image object storage', () => {
  it('keeps the admin and multipart byte boundaries', () => {
    expect(eventRouteSource).toContain('isAuthenticated, requireAdmin');
    expect(eventRouteSource).toContain('multer.memoryStorage()');
    expect(eventRouteSource).toContain('fileSize: MAX_EVENT_IMAGE_BYTES');
    expect(eventRouteSource).toContain("uploadError.code === 'LIMIT_FILE_SIZE'");
  });

  it('checks bytes against the claimed media type before upload', () => {
    const detectIndex = eventRouteSource.indexOf('detectSupportedImageType(req.file.buffer)');
    const matchIndex = eventRouteSource.indexOf('detectedType !== req.file.mimetype');
    const dimensionsIndex = eventRouteSource.indexOf('hasReadableImageDimensions(req.file.buffer)');
    const putIndex = eventRouteSource.indexOf('objectStorageService.putObject(');

    expect(detectIndex).toBeGreaterThan(-1);
    expect(matchIndex).toBeGreaterThan(detectIndex);
    expect(dimensionsIndex).toBeGreaterThan(matchIndex);
    expect(putIndex).toBeGreaterThan(dimensionsIndex);
  });

  it('returns only a server-derived canonical public URL', () => {
    expect(eventRouteSource).toContain('const objectPath = `events/${uuidv4()}.${extension}`');
    expect(eventRouteSource).toContain('getPublicUrl(objectPath)');
    expect(eventRouteSource).not.toContain('EVENTS_UPLOAD_DIR');
  });

  it('enforces a second byte limit in the storage service', () => {
    expect(storageSource).toContain('async putObject(');
    expect(storageSource).toContain('body.byteLength > maxBytes');
    expect(storageSource).toContain('ContentLength: body.byteLength');
  });
});
