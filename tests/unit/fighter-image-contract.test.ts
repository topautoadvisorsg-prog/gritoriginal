import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('fighter image presentation contract', () => {
  it('loads body art only for desktop hero presentation', () => {
    const source = readSource('src/shared/components/FighterImage.tsx');

    expect(source).toContain("variant?: 'headshot' | 'hero'");
    expect(source).toContain('media="(min-width: 768px)"');
    expect(source).toContain('srcSet={body}');
    expect(source).toContain('src={headshot}');
    expect(source).not.toContain('via.placeholder.com');
  });

  it('routes approved large fighter surfaces through the shared component', () => {
    for (const path of [
      'src/user/components/fighter/FighterIdentityBlock.tsx',
      'src/user/components/event/EventListPage.tsx',
      'src/user/components/event/EventHeader.tsx',
      'src/user/components/fightdetail/FighterComparisonCard.tsx',
      'src/user/components/chat/ChatHub.tsx',
    ]) {
      const source = readSource(path);
      expect(source).toContain("@/shared/components/FighterImage");
      expect(source).toContain('variant="hero"');
    }
  });
});
