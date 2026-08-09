import { describe, expect, it } from 'vitest';
import {
  assertProductionBuildSafety,
  assertProductionRuntimeSafety,
  shouldRegisterBootstrapRoutes,
} from '../../server/config/productionSafety';

const safeProduction = {
  NODE_ENV: 'production',
  CLERK_SECRET_KEY: 'clerk-secret-not-a-real-key',
  CLERK_PUBLISHABLE_KEY: 'clerk-publishable-not-a-real-key',
  UI_AUDIT_FIXTURES: '0',
  ENABLE_BOOTSTRAP_ROUTES: '0',
  DATA_ENGINE_AUTO_APPLY: 'false',
};

describe('production runtime safety', () => {
  it('accepts a production runtime with authentication and all bypasses disabled', () => {
    expect(() => assertProductionRuntimeSafety(safeProduction)).not.toThrow();
  });

  it.each([
    ['missing Clerk secret', { CLERK_SECRET_KEY: '' }, /CLERK_SECRET_KEY/],
    ['missing Clerk publishable key', { CLERK_PUBLISHABLE_KEY: '' }, /CLERK_PUBLISHABLE_KEY/],
    ['UI audit fixtures', { UI_AUDIT_FIXTURES: '1' }, /UI_AUDIT_FIXTURES/],
    ['bootstrap routes', { ENABLE_BOOTSTRAP_ROUTES: '1' }, /ENABLE_BOOTSTRAP_ROUTES/],
    ['data auto-apply', { DATA_ENGINE_AUTO_APPLY: 'true' }, /DATA_ENGINE_AUTO_APPLY/],
  ] as const)('rejects %s in production', (_name, override, message) => {
    expect(() => assertProductionRuntimeSafety({ ...safeProduction, ...override }))
      .toThrow(message);
  });

  it('does not impose production requirements on local development', () => {
    expect(() => assertProductionRuntimeSafety({
      NODE_ENV: 'development',
      UI_AUDIT_FIXTURES: '1',
      ENABLE_BOOTSTRAP_ROUTES: '1',
    })).not.toThrow();
  });

  it('registers bootstrap routes only under an explicit non-production capability', () => {
    expect(shouldRegisterBootstrapRoutes({ NODE_ENV: 'development' })).toBe(false);
    expect(shouldRegisterBootstrapRoutes({
      NODE_ENV: 'test',
      ENABLE_BOOTSTRAP_ROUTES: '1',
    })).toBe(true);
    expect(shouldRegisterBootstrapRoutes({
      NODE_ENV: 'production',
      ENABLE_BOOTSTRAP_ROUTES: '1',
    })).toBe(false);
  });

  it('rejects fixture data embedded in a production frontend build', () => {
    expect(() => assertProductionBuildSafety('production', '1')).toThrow(/UI_AUDIT_FIXTURES/);
    expect(() => assertProductionBuildSafety('production', '0')).not.toThrow();
    expect(() => assertProductionBuildSafety('development', '1')).not.toThrow();
  });
});
