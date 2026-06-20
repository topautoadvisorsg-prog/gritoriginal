import type { AuthUser } from '../../../shared/models/auth';

export function shouldStartOnboarding(
  localUser: AuthUser | null | undefined,
  localProfileLoaded: boolean,
): boolean {
  return localProfileLoaded && localUser != null && !localUser.username;
}
