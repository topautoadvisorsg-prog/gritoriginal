import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../../.github/workflows/quality.yml', import.meta.url),
  'utf8',
);
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { engines: { node: string }; scripts: Record<string, string> };
const testEnvironment = readFileSync(
  new URL('../setup/test-environment.ts', import.meta.url),
  'utf8',
);

describe('R1 CI quality gate', () => {
  it('runs for pull requests and main with read-only repository permission', () => {
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches:\n      - main');
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('timeout-minutes: 20');
  });

  it('pins third-party actions to immutable revisions', () => {
    expect(workflow).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
    expect(workflow).toContain('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020');
    expect(workflow).not.toMatch(/uses:\s+[^\s]+@v\d/);
  });

  it('uses the locked dependency tree and every local quality gate', () => {
    expect(workflow).toContain('node-version: 22.13.0');
    expect(packageJson.engines.node).toBe('>=22.13.0 <23.0.0');
    expect(workflow).toContain('run: npm ci');
    for (const command of ['typecheck', 'test:ci', 'lint', 'build']) {
      expect(workflow).toContain(`run: npm run ${command}`);
      expect(packageJson.scripts[command]).toBeTruthy();
    }
    expect(packageJson.scripts['test:ci']).toContain('--maxWorkers=1');
  });

  it('contains no deployment, database, or provider-secret step', () => {
    expect(workflow).not.toMatch(/DATABASE_URL|DIRECT_URL|SUPABASE|CLERK|STRIPE|R2_/);
    expect(workflow).not.toMatch(/railway|deploy|migration|db:push/i);
  });

  it('forces tests away from developer and production credentials', () => {
    expect(testEnvironment).toContain("process.env.NODE_ENV = 'test'");
    expect(testEnvironment).toContain('@127.0.0.1:1/grit_ci');
    expect(testEnvironment).not.toMatch(/SUPABASE|CLERK|STRIPE|R2_/);
  });
});
