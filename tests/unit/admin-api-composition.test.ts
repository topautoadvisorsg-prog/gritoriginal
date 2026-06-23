import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('admin API composition', () => {
  it('uses one authenticated route registrar in both runtimes', () => {
    const registrar = read('server/admin/registerAdminApi.ts');
    const userServer = read('server/user-server.ts');
    const adminServer = read('server/admin-server.ts');

    expect(registrar).toContain("app.use('/api/admin', authApiLimiter, isAuthenticated, requireAdmin)");
    expect(registrar).toContain('registerAdminChatRoutes(app)');
    expect(registrar).toContain('registerAdminSlipRoutes(app)');

    for (const server of [userServer, adminServer]) {
      expect(server).toContain("import { registerAdminApi } from './admin/registerAdminApi'");
      expect(server).toContain('registerAdminApi(app)');
      expect(server).toContain('app.use(apiErrorHandler)');
      expect(server).not.toContain('registerAdminChatRoutes(app)');
      expect(server).not.toContain('registerAdminSlipRoutes(app)');
    }
  });

  it('does not expose internal messages for unhandled server errors', () => {
    const handler = read('server/middleware/errorHandler.ts');
    expect(handler).toContain('status < 500 && httpError?.message');
    expect(handler).toContain("'Internal Server Error'");
  });
});
