const SENSITIVE_CONFIG_KEY = /(API_KEY|_KEY|SECRET|TOKEN|PASSWORD)$/i;

const SECRET_ENV_ALIASES: Readonly<Record<string, readonly string[]>> = {
  SUPABASE_API_KEY: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_API_KEY'],
};

export class PipelineConfigWriteForbiddenError extends Error {
  constructor(public readonly key: string) {
    super(`Configuration key ${key} must not be stored in the database`);
    this.name = 'PipelineConfigWriteForbiddenError';
  }
}

export function isSensitivePipelineConfigKey(key: string): boolean {
  return SENSITIVE_CONFIG_KEY.test(key);
}

export function isForbiddenPipelineConfigKey(key: string): boolean {
  return key === 'DATA_ENGINE_AUTO_APPLY' || isSensitivePipelineConfigKey(key);
}

export function assertDatabaseConfigWriteAllowed(key: string): void {
  if (isForbiddenPipelineConfigKey(key)) {
    throw new PipelineConfigWriteForbiddenError(key);
  }
}

export function getPipelineSecretFromEnv(
  key: string,
  source: NodeJS.ProcessEnv = process.env,
): string | null {
  if (!isSensitivePipelineConfigKey(key)) return null;

  const aliases = SECRET_ENV_ALIASES[key] ?? [key];
  for (const alias of aliases) {
    const value = source[alias]?.trim();
    if (value) return value;
  }
  return null;
}

export function serializePipelineConfigValue(key: string, value: string) {
  return isSensitivePipelineConfigKey(key)
    ? { key, value: '', configured: true }
    : { key, value, configured: true };
}
