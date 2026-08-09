import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('R0 containment contract', () => {
  it('keeps destructive bootstrap routes behind the production safety policy', () => {
    const server = read('server/user-server.ts');
    const guard = 'if (shouldRegisterBootstrapRoutes(env))';
    const mount = "app.use('/api', bootstrapRouter);";
    expect(server.split(mount)).toHaveLength(2);
    expect(server.indexOf(guard)).toBeLessThan(server.indexOf(mount));
  });

  it('does not contain an inbound auto-apply execution path', () => {
    const webhook = read('server/api/webhooks/dataEngineWebhook.ts');
    expect(webhook).not.toContain('DATA_ENGINE_AUTO_APPLY');
    expect(webhook).not.toContain('approveEntry(');
    expect(webhook).not.toContain('applyEntry(');
    expect(webhook).toContain('mandatory administrator review');
  });

  it('removes the auto-apply control from the administrator UI', () => {
    const settings = read('src/admin/components/AdminSystemSettings.tsx');
    expect(settings).not.toContain('toggleAutoApply');
    expect(settings).not.toContain('Auto-Apply Incoming Payloads');
    expect(settings).toContain('Operator Review Required');
  });

  it('guards the smoke pipeline before loading database-backed services', () => {
    const smoke = read('tests/pipeline_smoke_test.ts');
    expect(smoke).not.toContain('from "../server/db"');
    expect(smoke).toContain('assertSafeStagingTarget(process.env)');
    expect(smoke).toContain('verifyStagingMarker');
    expect(smoke.indexOf('assertSafeStagingTarget(process.env)'))
      .toBeLessThan(smoke.indexOf("import('../server/db')"));
  });
});
