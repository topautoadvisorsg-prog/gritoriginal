import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('route code splitting', () => {
  it('lazy loads product routes behind a suspense boundary', () => {
    const app = read('src/App.tsx');
    expect(app).toContain("const EventListPage = lazy(");
    expect(app).toContain("const AdminTabPage = lazy(");
    expect(app).toContain('<Suspense fallback={<RouteFallback />}>');
  });

  it('lazy loads individual admin workflows', () => {
    const registry = read('src/admin/AdminPanel.tsx');
    const page = read('src/admin/pages/AdminTabPage.tsx');

    expect(registry).toContain("'create-event': lazy(");
    expect(registry).toContain("'admin-jobs': lazy(");
    expect(page).toContain('const AdminComponent = ADMIN_TAB_COMPONENTS[tab]');
    expect(page).toContain('<AdminComponent />');
  });

  it('separates long-lived providers from application routes', () => {
    const vite = read('vite.config.ts');
    expect(vite).toContain("'react-vendor'");
    expect(vite).toContain("'clerk-vendor'");
    expect(vite).toContain("'sentry-vendor'");
  });
});
