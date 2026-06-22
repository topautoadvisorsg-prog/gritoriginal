import { describe, expect, it } from 'vitest';
import { updateProfileSchema } from '../../server/schemas';
import { normalizeCountryCode } from '../../src/shared/lib/countries';

describe('country identity contract', () => {
  it('normalizes legacy country names and codes for display/editing', () => {
    expect(normalizeCountryCode('Mexico')).toBe('MX');
    expect(normalizeCountryCode('mx')).toBe('MX');
    expect(normalizeCountryCode('United States')).toBe('US');
    expect(normalizeCountryCode('unknown')).toBeNull();
  });

  it('stores new profile country writes as uppercase ISO alpha-2 codes', () => {
    expect(updateProfileSchema.parse({ country: 'mx' }).country).toBe('MX');
    expect(() => updateProfileSchema.parse({ country: 'Mexico' })).toThrow();
  });
});
