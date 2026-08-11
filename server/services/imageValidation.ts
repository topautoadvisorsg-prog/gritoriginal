export const SUPPORTED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SupportedImageContentType = typeof SUPPORTED_IMAGE_CONTENT_TYPES[number];

export type ImageDimensions = {
  width: number;
  height: number;
};

export function isSupportedImageContentType(value: unknown): value is SupportedImageContentType {
  return typeof value === 'string'
    && SUPPORTED_IMAGE_CONTENT_TYPES.includes(value as SupportedImageContentType);
}

/** Detect only formats the application intentionally parses. */
export function detectSupportedImageType(buffer: Buffer): SupportedImageContentType | null {
  if (buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }

  if (buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }

  return null;
}

function validDimensions(width: number, height: number): ImageDimensions | null {
  return Number.isSafeInteger(width)
    && Number.isSafeInteger(height)
    && width > 0
    && height > 0
    ? { width, height }
    : null;
}

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24 || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    return null;
  }
  return validDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
}

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) return null;

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      continue;
    }
    if (marker === 0xda) return null;
    if (offset + 2 > buffer.length) return null;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 7) return null;
      return validDimensions(
        buffer.readUInt16BE(offset + 5),
        buffer.readUInt16BE(offset + 3),
      );
    }

    offset += segmentLength;
  }

  return null;
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 20) return null;

  const chunkType = buffer.subarray(12, 16).toString('ascii');
  const chunkSize = buffer.readUInt32LE(16);
  if (chunkSize > buffer.length - 20) return null;

  if (chunkType === 'VP8X' && chunkSize >= 10 && buffer.length >= 30) {
    return validDimensions(
      readUInt24LE(buffer, 24) + 1,
      readUInt24LE(buffer, 27) + 1,
    );
  }

  if (chunkType === 'VP8L' && chunkSize >= 5 && buffer.length >= 25 && buffer[20] === 0x2f) {
    return validDimensions(
      1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
      1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
    );
  }

  if (chunkType === 'VP8 ' && chunkSize >= 10 && buffer.length >= 30
    && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return validDimensions(
      buffer.readUInt16LE(26) & 0x3fff,
      buffer.readUInt16LE(28) & 0x3fff,
    );
  }

  return null;
}

/** Read dimensions only for the three explicitly allowlisted image formats. */
export function readSupportedImageDimensions(buffer: Buffer): ImageDimensions | null {
  switch (detectSupportedImageType(buffer)) {
    case 'image/jpeg':
      return readJpegDimensions(buffer);
    case 'image/png':
      return readPngDimensions(buffer);
    case 'image/webp':
      return readWebpDimensions(buffer);
    default:
      return null;
  }
}

/** Confirm that allowlisted image bytes are structurally readable. */
export function hasReadableImageDimensions(buffer: Buffer): boolean {
  return readSupportedImageDimensions(buffer) !== null;
}
