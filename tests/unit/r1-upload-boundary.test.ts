import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('R1 legacy upload retirement', () => {
  it('does not mount the arbitrary local-filesystem upload route', () => {
    const server = read('server/user-server.ts');

    expect(server).not.toContain('registerUploadRoutes');
    expect(server).not.toContain('/api/uploads/');
  });

  it('removes the legacy filesystem writer implementation', () => {
    expect(existsSync(resolve(process.cwd(), 'server/user/routes/uploadRoutes.ts'))).toBe(false);
  });

  it('removes the unused client hook for an unimplemented upload endpoint', () => {
    expect(existsSync(resolve(process.cwd(), 'src/shared/hooks/use-upload.ts'))).toBe(false);
  });

  it('keeps current browser uploads on presigned object-storage URLs', () => {
    const settings = read('src/user/pages/Settings.tsx');
    const fighterUpload = read('src/shared/hooks/use-fighter-image-upload.ts');

    expect(settings).toContain('const { uploadURL, objectPath }');
    expect(settings).toContain('fetch(uploadURL');
    expect(fighterUpload).toContain('const { uploadURL, objectPath }');
    expect(fighterUpload).toContain('fetch(uploadURL');
  });

  it('enforces the documented Challenger entitlement on slip uploads', () => {
    const slipRoutes = read('server/user/routes/slipRoutes.ts');

    expect(slipRoutes).toContain(
      'app.post("/api/slips/upload", isAuthenticated, requireTier("premium")',
    );
  });
});
