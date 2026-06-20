import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../../../shared/models/auth';
import { shouldStartOnboarding } from './auth-state';

const profile = (username: string | null): AuthUser => ({ username } as AuthUser);

describe('shouldStartOnboarding', () => {
  it('waits for a successfully loaded local profile', () => {
    expect(shouldStartOnboarding(undefined, false)).toBe(false);
    expect(shouldStartOnboarding(null, true)).toBe(false);
  });

  it('starts only when the persisted profile is missing a username', () => {
    expect(shouldStartOnboarding(profile(null), true)).toBe(true);
    expect(shouldStartOnboarding(profile('fightfan'), true)).toBe(false);
  });
});
