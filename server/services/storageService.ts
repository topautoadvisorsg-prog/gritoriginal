import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
    async getUploadURLForPath(objectPath: string): Promise<string> {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        const command = new PutObjectCommand({ Bucket: this.bucket, Key: cleanPath });
        return getSignedUrl(this.client, command, { expiresIn: 300 });
    }

    // Downloads the object's bytes (used server-side for validation, e.g.
    // checking aspect ratio, before trusting a client-reported upload).
    async getObjectBuffer(objectPath: string): Promise<Buffer> {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: cleanPath });
        const response = await this.client.send(command);
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    // Public read URL for a stored object — served directly from R2, never
    // proxied through this app (that's the point: zero egress cost to us).
    getPublicUrl(objectPath: string): string {
        const cleanPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
        return `${this.publicUrl}/${cleanPath}`;
    }
}
