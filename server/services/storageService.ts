import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 storage. R2 speaks the S3 API, so the standard AWS SDK works
// against it unmodified — just point the endpoint at the R2 account URL and
// use the R2 API token as the access key pair. Zero egress fees is the whole
// reason this replaced local-disk storage: images are served directly from
// R2's public bucket URL, not proxied through this app.
export class StorageService {
    private client: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        this.bucket = process.env.R2_BUCKET_NAME || '';
        this.publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

        if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket || !this.publicUrl) {
            throw new Error(
                'R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, ' +
                'R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.'
            );
        }

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
        });
    }

    // Returns a presigned URL the frontend can PUT the file directly to R2 with.
    async getUploadURLForPath(objectPath: string, contentType: string): Promise<string> {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: cleanPath,
            ContentType: contentType,
        });
        return getSignedUrl(this.client, command, { expiresIn: 300 });
    }

    // Uploads a server-received object only after the caller's byte budget has
    // been enforced. Used for small multipart admin flows that do not need a
    // browser presign round trip.
    async putObject(
        objectPath: string,
        body: Buffer,
        contentType: string,
        maxBytes: number,
    ): Promise<void> {
        assertPositiveByteLimit(maxBytes);
        if (body.byteLength > maxBytes) {
            throw new ObjectSizeLimitError(maxBytes);
        }

        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: cleanPath,
            Body: body,
            ContentType: contentType,
            ContentLength: body.byteLength,
        });
        await this.client.send(command);
    }

    // Deletes an exact server-owned object key. S3/R2 deletion is idempotent,
    // which lets cleanup jobs retry safely after partial application failures.
    async deleteObject(objectPath: string): Promise<void> {
        const cleanPath = normalizeObjectPath(objectPath);
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: cleanPath,
        });
        await this.client.send(command);
    }

    // Downloads the object's bytes (used server-side for validation, e.g.
    // checking aspect ratio, before trusting a client-reported upload).
    async getObjectBuffer(objectPath: string, maxBytes: number): Promise<Buffer> {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: cleanPath });
        const response = await this.client.send(command);
        if (typeof response.ContentLength === 'number' && response.ContentLength > maxBytes) {
            throw new ObjectSizeLimitError(maxBytes);
        }
        if (!response.Body) {
            throw new Error('Object response body missing');
        }
        return collectBodyWithLimit(response.Body as AsyncIterable<Uint8Array>, maxBytes);
    }

    // Public read URL for a stored object — served directly from R2, never
    // proxied through this app (that's the point: zero egress cost to us).
    getPublicUrl(objectPath: string): string {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        return `${this.publicUrl}/${cleanPath}`;
    }


    getObjectPathFromPublicUrl(candidateUrl: string): string | null {
        return extractObjectPathFromPublicUrl(this.publicUrl, candidateUrl);
    }
}

export class ObjectSizeLimitError extends Error {
    constructor(readonly maxBytes: number) {
        super(`Object exceeds ${maxBytes} byte limit`);
        this.name = 'ObjectSizeLimitError';
    }
}

export async function collectBodyWithLimit(
    body: AsyncIterable<Uint8Array>,
    maxBytes: number,
): Promise<Buffer> {
    assertPositiveByteLimit(maxBytes);

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    for await (const chunk of body) {
        totalBytes += chunk.byteLength;
        if (totalBytes > maxBytes) {
            throw new ObjectSizeLimitError(maxBytes);
        }
        chunks.push(chunk);
    }
    return Buffer.concat(chunks, totalBytes);
}

function assertPositiveByteLimit(maxBytes: number): void {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
        throw new TypeError('maxBytes must be a positive safe integer');
    }
}


export function extractObjectPathFromPublicUrl(
    publicUrl: string,
    candidateUrl: string,
): string | null {
    // Canonical URLs produced by this service contain only the safe object-key
    // alphabet. Reject encoded or backslash paths before URL normalization can
    // collapse traversal segments and obscure their original form.
    if (candidateUrl.includes('%') || candidateUrl.includes('\\')) return null;

    try {
        const base = new URL(publicUrl);
        const candidate = new URL(candidateUrl);
        const basePath = base.pathname.replace(/\/+$/, '');
        const objectPrefix = `${basePath}/`;

        if (candidate.origin !== base.origin
            || candidate.search !== ''
            || candidate.hash !== ''
            || !candidate.pathname.startsWith(objectPrefix)) {
            return null;
        }

        const objectPath = candidate.pathname.slice(objectPrefix.length);
        return isSafeObjectPath(objectPath) ? objectPath : null;
    } catch {
        return null;
    }
}


function normalizeObjectPath(objectPath: string): string {
    const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
    if (!isSafeObjectPath(cleanPath)) {
        throw new TypeError('Invalid object path');
    }
    return cleanPath;
}


function isSafeObjectPath(objectPath: string): boolean {
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(objectPath)) return false;
    return objectPath.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}
