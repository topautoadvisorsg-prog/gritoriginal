export type ProductionSafetyEnv = {
  NODE_ENV?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  UI_AUDIT_FIXTURES?: string;
  ENABLE_BOOTSTRAP_ROUTES?: string;
  DATA_ENGINE_AUTO_APPLY?: string;
};

/**
 * Production must never boot with authentication missing or a development-only
 * write bypass enabled. Keep this check free of database and network imports so
 * entrypoints can fail before any runtime side effect begins.
 */
export function assertProductionRuntimeSafety(env: ProductionSafetyEnv): void {
  if (env.NODE_ENV !== 'production') return;

  const violations: string[] = [];
  if (!env.CLERK_SECRET_KEY?.trim()) violations.push('CLERK_SECRET_KEY is required');
  if (!env.CLERK_PUBLISHABLE_KEY?.trim()) violations.push('CLERK_PUBLISHABLE_KEY is required');
  if (env.UI_AUDIT_FIXTURES === '1') violations.push('UI_AUDIT_FIXTURES must not be enabled');
  if (env.ENABLE_BOOTSTRAP_ROUTES === '1') violations.push('ENABLE_BOOTSTRAP_ROUTES must not be enabled');
  if (env.DATA_ENGINE_AUTO_APPLY === 'true') violations.push('DATA_ENGINE_AUTO_APPLY must not be enabled');

  if (violations.length > 0) {
    throw new Error(`Unsafe production configuration:\n- ${violations.join('\n- ')}`);
  }
}

export function shouldRegisterBootstrapRoutes(env: ProductionSafetyEnv): boolean {
  return env.NODE_ENV !== 'production' && env.ENABLE_BOOTSTRAP_ROUTES === '1';
}

export function assertProductionBuildSafety(mode: string, fixtureFlag?: string): void {
  if (mode === 'production' && fixtureFlag === '1') {
    throw new Error('UI_AUDIT_FIXTURES must not be embedded in a production build.');
  }
}
