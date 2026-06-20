import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SelectContent modal stacking', () => {
  it('renders portal content above onboarding and welcome overlays', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/shared/components/ui/select.tsx'), 'utf8');
    expect(source).toContain('z-[10000]');
  });
});
