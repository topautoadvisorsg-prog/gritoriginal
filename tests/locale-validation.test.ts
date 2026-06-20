import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const localeRoot = path.resolve(process.cwd(), 'public/locales');
const routeSections = ['sidebar', 'header', 'common', 'nav'];

describe('locale resources', () => {
  const locales = fs.readdirSync(localeRoot).filter((name) => fs.statSync(path.join(localeRoot, name)).isDirectory());
  const english = JSON.parse(fs.readFileSync(path.join(localeRoot, 'en/translation.json'), 'utf8'));

  it('defines every route navigation key used by the shell', () => {
    expect(english.sidebar.news_tag_manager).toBeTruthy();
  });

  it.each(locales)('%s is valid JSON with complete route navigation keys', (locale) => {
    const resource = JSON.parse(fs.readFileSync(path.join(localeRoot, locale, 'translation.json'), 'utf8'));
    for (const section of routeSections) {
      expect(Object.keys(resource[section] ?? {}).sort()).toEqual(Object.keys(english[section] ?? {}).sort());
    }
  });
});
