import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('authentication architecture', () => {
  it('keeps one active server authorization implementation', () => {
    const clerk = readFileSync(resolve(process.cwd(), 'server/auth/clerk.ts'), 'utf8');
    const aiRoutes = readFileSync(resolve(process.cwd(), 'server/ai/aiRoutes.ts'), 'utf8');

    expect(clerk).toContain('export const clerkMiddleware');
    expect(clerk).not.toContain('export const requireAuth');
    expect(aiRoutes).toContain("from '../auth/guards'");
    expect(existsSync(resolve(process.cwd(), 'server/auth/tierMiddleware.ts'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'server/replit_integrations/auth/replitAuth.ts'))).toBe(false);
  });

  it('does not carry retired session and OIDC dependencies', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    const dependencies = packageJson.dependencies as Record<string, string>;

    for (const retired of [
      'connect-pg-simple',
      'express-session',
      'memorystore',
      'openid-client',
      'passport',
      'passport-openidconnect',
    ]) {
      expect(dependencies).not.toHaveProperty(retired);
    }
  });
});
