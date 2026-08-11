import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../../.github/workflows/quality.yml', import.meta.url),
  'utf8',
);
const packageJson = JSON.parse(readFileSync(
  new URL('../../package.json', import.meta.url),
  'utf8',
)) as { scripts: Record<string, string> };

describe('R1 CI quality gate', () => {
  it('runs for pull requests and main with read-only repository permission', () => {
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches:\n      - main');
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('timeout-minutes: 20');
  });

  it('pins third-party actions to immutable revisions', () => {
    expect(workflow).toContain('actions/checkout@11d5960a326750d5838078e36cf38b85af677262');
    expect(workflow).toContain('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020');
    expect(workflow).not.toMatch(/uses:\s+[^\s]+@v\d/);
  });

  it('uses the locked dependency tree and every local quality gate', () => {
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
});
