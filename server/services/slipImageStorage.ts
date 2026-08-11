import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
    detectSupportedImageType,
    hasReadableImageDimensions,
    type SupportedImageContentType,
} from './imageValidation';
import { StorageService } from './storageService';

export const MAX_SLIP_IMAGE_BYTES = 5 * 1024 * 1024;

const SLIP_OBJECT_PREFIX = 'slips/';
const CONTENT_TYPE_EXTENSIONS: Record<SupportedImageContentType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export class InvalidSlipImageError extends Error {
    constructor(message = 'Slip image is invalid') {
        super(message);
        this.name = 'InvalidSlipImageError';
    }
}

export function validateSlipImage(
    buffer: Buffer,
    claimedContentType: string,
): { contentType: SupportedImageContentType; extension: string } {
    const normalizedContentType = claimedContentType === 'image/jpg'
        ? 'image/jpeg'
        : claimedContentType;
    const detectedContentType = detectSupportedImageType(buffer);

    if (!detectedContentType
        || detectedContentType !== normalizedContentType
        || !hasReadableImageDimensions(buffer)) {
        throw new InvalidSlipImageError();
    }

    return {
        contentType: detectedContentType,
        extension: CONTENT_TYPE_EXTENSIONS[detectedContentType],
    };
}

export async function storeSlipImage(
    slipId: string,
    buffer: Buffer,
    claimedContentType: string,
    storageService = new StorageService(),
): Promise<string> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slipId)) {
        throw new TypeError('Slip ID must be a server-generated UUID v4');
    }

    const { contentType, extension } = validateSlipImage(buffer, claimedContentType);
    const objectPath = `${SLIP_OBJECT_PREFIX}${slipId}.${extension}`;
    await storageService.putObject(objectPath, buffer, contentType, MAX_SLIP_IMAGE_BYTES);
    return storageService.getPublicUrl(objectPath);
}

export async function deleteSlipImage(
    imageUrl: string,
    options: { storageService?: StorageService; cwd?: string } = {},
): Promise<void> {
    if (/^https?:\/\//i.test(imageUrl)) {
        const storageService = options.storageService ?? new StorageService();
        const objectPath = storageService.getObjectPathFromPublicUrl(imageUrl);
        if (!objectPath || !objectPath.startsWith(SLIP_OBJECT_PREFIX)) {
            throw new Error('Slip image URL is outside the owned storage prefix');
        }
        await storageService.deleteObject(objectPath);
        return;
    }

    const legacyPath = resolveLegacySlipFilePath(options.cwd ?? process.cwd(), imageUrl);
    try {
        await fs.unlink(legacyPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
}

export function resolveLegacySlipFilePath(cwd: string, imageUrl: string): string {
    const prefixes = ['/uploads/slips/', '/objects/slips/'];
    const prefix = prefixes.find((candidate) => imageUrl.startsWith(candidate));
    if (!prefix || imageUrl.includes('\\') || imageUrl.includes('?') || imageUrl.includes('#')) {
        throw new Error('Unsupported legacy slip image path');
    }

    const relativePath = imageUrl.slice(prefix.length);
    const segments = relativePath.split('/');
    if (segments.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment)
        || segment === '.'
        || segment === '..')) {
        throw new Error('Unsafe legacy slip image path');
    }

    const storageRoot = path.resolve(cwd, 'uploads', 'slips');
    const candidatePath = path.resolve(storageRoot, ...segments);
    if (!candidatePath.startsWith(`${storageRoot}${path.sep}`)) {
        throw new Error('Legacy slip image path escaped its storage root');
    }
    return candidatePath;
}
