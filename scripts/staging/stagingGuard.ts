export type StagingGuardEnv = Record<string, string | undefined>;

export type SafeStagingTarget = {
  connectionString: string;
  environmentId: string;
  displayTarget: string;
};

function required(env: StagingGuardEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parsePostgresUrl(value: string, name: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`);
  }
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(`${name} must use postgres:// or postgresql://.`);
  }
  if (!url.hostname || !url.pathname || url.pathname === '/') {
    throw new Error(`${name} must include a host and database name.`);
  }
  return url;
}

function identity(url: URL): string {
  const hostname = url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname).toLowerCase();
  const username = decodeURIComponent(url.username).toLowerCase();
  const isSupabasePooler = /(^|\.)pooler\.supabase\.(com|net)$/.test(hostname);
  const poolerProjectRef = isSupabasePooler
    ? username.match(/^[^.]+\.([a-z0-9-]+)$/)?.[1]
    : undefined;
  const directProjectRef = hostname.match(/^db\.([a-z0-9-]+)\.supabase\.co$/)?.[1];
  const supabaseProjectRef = poolerProjectRef ?? directProjectRef;

  // Supabase poolers share a host/database name, so project ref is the identity.
  // Ordinary PostgreSQL identities deliberately ignore role/user names.
  return supabaseProjectRef
    ? `supabase|${supabaseProjectRef}|${database}`
    : `postgres|${hostname}|${url.port || '5432'}|${database}`;
}

function displayTarget(url: URL): string {
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  return `${url.hostname}:${url.port || '5432'}/${database}`;
}

export function assertSafeStagingTarget(env: StagingGuardEnv): SafeStagingTarget {
  if (env.ALLOW_STAGING_WRITES !== '1') {
    throw new Error('ALLOW_STAGING_WRITES must be exactly "1".');
  }
  if (env.NODE_ENV !== 'test' && env.NODE_ENV !== 'staging') {
    throw new Error('NODE_ENV must be "test" or "staging" for staging proof commands.');
  }

  const environmentId = required(env, 'STAGING_ENVIRONMENT_ID');
  if (!/^grit-staging-[a-z0-9][a-z0-9-]{7,}$/i.test(environmentId)) {
    throw new Error('STAGING_ENVIRONMENT_ID must start with "grit-staging-" and be specific to this environment.');
  }

  const connectionString = required(env, 'STAGING_DATABASE_URL');
  const staging = parsePostgresUrl(connectionString, 'STAGING_DATABASE_URL');
  const stagingIdentity = identity(staging);

  for (const name of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = env[name]?.trim();
    if (!value) continue;
    const production = parsePostgresUrl(value, name);
    if (stagingIdentity === identity(production)) {
      throw new Error(`STAGING_DATABASE_URL resolves to the same database identity as ${name}.`);
    }
  }

  const productionProjectRef = env.SUPABASE_PROJECT_REF?.trim().toLowerCase();
  const stagingIdentityText = `${staging.hostname}|${decodeURIComponent(staging.username)}`.toLowerCase();
  if (productionProjectRef && stagingIdentityText.includes(productionProjectRef)) {
    throw new Error('STAGING_DATABASE_URL contains the production SUPABASE_PROJECT_REF.');
  }

  const railwayEnvironment = env.RAILWAY_ENVIRONMENT_NAME?.trim().toLowerCase();
  if (railwayEnvironment === 'production') {
    throw new Error('Staging proof commands cannot run in the Railway production environment.');
  }

  if (/example|placeholder|your-project|dbname/i.test(connectionString)) {
    throw new Error('STAGING_DATABASE_URL still contains a placeholder value.');
  }

  return {
    connectionString,
    environmentId,
    displayTarget: displayTarget(staging),
  };
}
