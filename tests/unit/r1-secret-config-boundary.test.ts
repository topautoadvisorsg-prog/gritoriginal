import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertDatabaseConfigWriteAllowed,
  getPipelineSecretFromEnv,
  PipelineConfigWriteForbiddenError,
} from '../../server/config/pipelineConfigPolicy';

describe('R1 secret configuration boundary', () => {
  it('prefers the canonical Supabase service-role environment variable', () => {
    expect(getPipelineSecretFromEnv('SUPABASE_API_KEY', {
      SUPABASE_SERVICE_ROLE_KEY: 'canonical-service-role',
      SUPABASE_API_KEY: 'legacy-alias',
    })).toBe('canonical-service-role');

    expect(getPipelineSecretFromEnv('SUPABASE_API_KEY', {
      SUPABASE_API_KEY: 'legacy-alias',
    })).toBe('legacy-alias');
  });

  it('rejects database writes for secrets and mandatory-review controls', () => {
    for (const key of [
      'DATA_ENGINE_API_KEY',
      'SUPABASE_API_KEY',
      'SUPABASE_ANON_KEY',
      'WEBHOOK_SECRET',
      'DATA_ENGINE_AUTO_APPLY',
    ]) {
      expect(() => assertDatabaseConfigWriteAllowed(key))
        .toThrow(PipelineConfigWriteForbiddenError);
    }
    expect(() => assertDatabaseConfigWriteAllowed('SUPABASE_URL')).not.toThrow();
  });

  it('keeps defense in depth in the service and removes browser secret forms', () => {
    const service = readFileSync(
      new URL('../../server/services/dataEngineService.ts', import.meta.url),
      'utf8',
    );
    const settings = readFileSync(
      new URL('../../src/admin/components/AdminSystemSettings.tsx', import.meta.url),
      'utf8',
    );
    const configResolver = service.slice(
      service.indexOf('export async function getDataEngineConfig'),
      service.indexOf('const MAX_RETRIES'),
    );

    expect(service).toContain('assertDatabaseConfigWriteAllowed(key)');
    expect(configResolver.indexOf('getPipelineSecretFromEnv(key)'))
      .toBeLessThan(configResolver.indexOf('db.select()'));
    expect(settings).not.toContain('type="password"');
    expect(settings).toContain('database writes are disabled');
  });
});
