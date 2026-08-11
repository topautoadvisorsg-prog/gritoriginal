export const SUPPORTED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SupportedImageContentType = typeof SUPPORTED_IMAGE_CONTENT_TYPES[number];

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

/** Confirm that allowlisted image bytes are structurally readable. */
export function hasReadableImageDimensions(buffer: Buffer): boolean {
  try {
    const dimensions = sizeOf(buffer);
    return Number.isSafeInteger(dimensions.width)
      && Number.isSafeInteger(dimensions.height)
      && dimensions.width > 0
      && dimensions.height > 0;
  } catch {
    return false;
  }
}
import sizeOf from 'image-size';
