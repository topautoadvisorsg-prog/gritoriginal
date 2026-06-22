import { describe, expect, it } from 'vitest';
import { assertSafeStagingTarget } from '../../scripts/staging/stagingGuard';

const base = {
  ALLOW_STAGING_WRITES: '1',
  NODE_ENV: 'staging',
  STAGING_ENVIRONMENT_ID: 'grit-staging-picks-20260621',
  STAGING_DATABASE_URL: 'postgresql://postgres.staging:secret@staging.pooler.test:5432/grit_stage',
  DATABASE_URL: 'postgresql://postgres.production:secret@production.pooler.test:5432/grit_prod',
  DIRECT_URL: 'postgresql://postgres.production:secret@production.direct.test:5432/grit_prod',
  SUPABASE_PROJECT_REF: 'production',
};

describe('staging database safety guard', () => {
  it('accepts an explicitly authorized, distinct staging target', () => {
    expect(assertSafeStagingTarget(base)).toMatchObject({
      environmentId: 'grit-staging-picks-20260621',
      displayTarget: 'staging.pooler.test:5432/grit_stage',
    });
  });

  it.each([
    ['missing write authorization', { ALLOW_STAGING_WRITES: '0' }],
    ['development runtime', { NODE_ENV: 'development' }],
    ['missing marker identity', { STAGING_ENVIRONMENT_ID: '' }],
    ['production Railway runtime', { RAILWAY_ENVIRONMENT_NAME: 'production' }],
  ])('rejects %s', (_label, override) => {
    expect(() => assertSafeStagingTarget({ ...base, ...override })).toThrow();
  });

  it('rejects the exact production database even under a staging variable name', () => {
    expect(() => assertSafeStagingTarget({
      ...base,
      STAGING_DATABASE_URL: base.DATABASE_URL,
    })).toThrow(/same database identity/);
  });

  it('rejects the same ordinary database reached with a different role', () => {
    expect(() => assertSafeStagingTarget({
      ...base,
      DATABASE_URL: 'postgresql://production_role:secret@database.internal:5432/grit',
      STAGING_DATABASE_URL: 'postgresql://staging_role:secret@database.internal:5432/grit',
    })).toThrow(/same database identity/);
  });

  it('does not mistake dotted ordinary roles for Supabase project identities', () => {
    expect(() => assertSafeStagingTarget({
      ...base,
      DATABASE_URL: 'postgresql://app.production:secret@database.internal:5432/grit',
      STAGING_DATABASE_URL: 'postgresql://app.staging:secret@database.internal:5432/grit',
    })).toThrow(/same database identity/);
  });

  it('recognizes the same Supabase project across pooler and direct URLs', () => {
    expect(() => assertSafeStagingTarget({
      ...base,
      SUPABASE_PROJECT_REF: '',
      DATABASE_URL: 'postgresql://postgres.prodref:secret@us-east-1.pooler.supabase.com:6543/postgres',
      STAGING_DATABASE_URL: 'postgresql://postgres:secret@db.prodref.supabase.co:5432/postgres',
    })).toThrow(/same database identity/);
  });

  it('allows distinct Supabase projects on the same shared pooler', () => {
    expect(assertSafeStagingTarget({
      ...base,
      SUPABASE_PROJECT_REF: 'prodref',
      DATABASE_URL: 'postgresql://postgres.prodref:secret@us-east-1.pooler.supabase.com:6543/postgres',
      DIRECT_URL: 'postgresql://postgres:secret@db.prodref.supabase.co:5432/postgres',
      STAGING_DATABASE_URL: 'postgresql://postgres.stageref:secret@us-east-1.pooler.supabase.com:6543/postgres',
    }).environmentId).toBe(base.STAGING_ENVIRONMENT_ID);
  });

  it('rejects a production project reference hidden in a different host', () => {
    expect(() => assertSafeStagingTarget({
      ...base,
      STAGING_DATABASE_URL: 'postgresql://postgres.production:secret@other.pooler.test:5432/grit_stage',
    })).toThrow(/production SUPABASE_PROJECT_REF/);
  });

  it('never returns credentials in its display target', () => {
    const target = assertSafeStagingTarget(base);
    expect(target.displayTarget).not.toContain('secret');
    expect(target.displayTarget).not.toContain('@');
  });
});
