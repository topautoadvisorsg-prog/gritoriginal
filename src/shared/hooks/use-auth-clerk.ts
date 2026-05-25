/**
 * Clerk-aware useAuth hook.
 *
 * Combines Clerk's session (identity) with our local users-table record (domain data:
 * picks, badges, tier, stars, Stripe customer ID, etc).
 *
 * Returns the same shape as the legacy use-auth.ts so consuming components don't change
 * when we cut over.
 *
 * Cutover plan:
 *   1. Provision Clerk keys in .env
 *   2. Wrap App.tsx with <ClerkProvider>
 *   3. Replace `import { useAuth } from '@/shared/hooks/use-auth'` everywhere
 *      with `import { useAuth } from '@/shared/hooks/use-auth-clerk'`
 *   4. Delete use-auth.ts
 *
 * Until then this file coexists with the legacy hook.
 */
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import type { AuthUser } from '../../../shared/models/auth';

async function fetchLocalUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();

  // Only fetch local record when Clerk confirms signed in.
  const { data: localUser, isLoading: localLoading } = useQuery<AuthUser | null>({
    queryKey: ['/api/me', clerkUser?.id],
    queryFn: fetchLocalUser,
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 30_000,
  });

  const isLoading = !clerkLoaded || (isSignedIn && localLoading);

  return {
    user: localUser ?? null,
    clerkUser: clerkUser ?? null,
    isLoading,
    isAuthenticated: !!isSignedIn,
    login: () => clerk.openSignIn(),
    logout: () => clerk.signOut(),
    isLoggingOut: false,
  };
}
