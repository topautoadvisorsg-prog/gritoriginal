import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'build/**'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['server/services/**', 'server/auth/**', 'server/api/webhooks/**'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
    // Critical path tests should pass before merge; full suite can take longer.
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
