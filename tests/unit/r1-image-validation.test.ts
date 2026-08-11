import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  detectSupportedImageType,
  hasReadableImageDimensions,
  isSupportedImageContentType,
  readSupportedImageDimensions,
} from '../../server/services/imageValidation';
import {
  collectBodyWithLimit,
  ObjectSizeLimitError,
} from '../../server/services/storageService';

async function* chunks(...values: number[][]): AsyncIterable<Uint8Array> {
  for (const value of values) yield Uint8Array.from(value);
}

function pngHeader(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function jpegHeader(width: number, height: number): Buffer {
  return Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x07, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
  ]);
}

function webpExtendedHeader(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write('VP8X', 12, 'ascii');
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

function webpLosslessHeader(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(25);
  const encodedWidth = width - 1;
  const encodedHeight = height - 1;
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write('VP8L', 12, 'ascii');
  buffer.writeUInt32LE(5, 16);
  buffer[20] = 0x2f;
  buffer[21] = encodedWidth & 0xff;
  buffer[22] = ((encodedWidth >> 8) & 0x3f) | ((encodedHeight & 0x03) << 6);
  buffer[23] = (encodedHeight >> 2) & 0xff;
  buffer[24] = (encodedHeight >> 10) & 0x0f;
  return buffer;
}

function webpLossyHeader(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write('VP8 ', 12, 'ascii');
  buffer.writeUInt32LE(10, 16);
  Buffer.from([0x9d, 0x01, 0x2a]).copy(buffer, 23);
  buffer.writeUInt16LE(width, 26);
  buffer.writeUInt16LE(height, 28);
  return buffer;
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

  it('reads bounded dimensions for each supported image family', () => {
    expect(readSupportedImageDimensions(pngHeader(800, 600)))
      .toEqual({ width: 800, height: 600 });
    expect(readSupportedImageDimensions(jpegHeader(512, 768)))
      .toEqual({ width: 512, height: 768 });
    expect(readSupportedImageDimensions(webpExtendedHeader(640, 480)))
      .toEqual({ width: 640, height: 480 });
    expect(readSupportedImageDimensions(webpLosslessHeader(320, 240)))
      .toEqual({ width: 320, height: 240 });
    expect(readSupportedImageDimensions(webpLossyHeader(1280, 720)))
      .toEqual({ width: 1280, height: 720 });
  });

  it('rejects malformed segment lengths and unsupported parser families', () => {
    const malformedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xff]);
    expect(readSupportedImageDimensions(malformedJpeg)).toBeNull();
    expect(readSupportedImageDimensions(Buffer.from('icnsxxxx', 'ascii'))).toBeNull();
    expect(readSupportedImageDimensions(Buffer.from('ftypheic', 'ascii'))).toBeNull();
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
