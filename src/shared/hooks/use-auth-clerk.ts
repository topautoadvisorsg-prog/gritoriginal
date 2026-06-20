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
import { isClerkEnabled } from '@/auth/clerkConfig';

const fixtureUser = {
  id: 'audit-user-03', email: 'long.audit.address@example.test', firstName: 'Jordan', lastName: 'Rivera',
  username: 'jordan_rivera', avatarUrl: null, profileImageUrl: null, socialLinks: {},
  privacySettings: { showAvatar: true, showSocialLinks: true, showUsername: true }, role: 'admin', tier: 'premium',
  totalPoints: 785, isVerified: true, country: 'MX', language: 'en', featuredInfluencer: false,
  starLevel: 4, progressBadge: 'master', currentStreak: 5, maxStreak: 8, lastProgressionCalc: null,
  monthlyLoginCount: 12, lastLoginMonth: null, lastLoginDate: null, isAiChatBlocked: false,
  subscriptionId: null, subscriptionStatus: 'active', currentPeriodEnd: null, subscriptionStartDate: null,
  yellowRedFlagsUsed: 1, flagBudget: 3, currentEventId: 'audit-event', lastFlagResetAt: null,
  createdAt: null, updatedAt: null, permissions: [],
} satisfies AuthUser;

async function fetchLocalUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export function useAuth() {
  if (import.meta.env.UI_AUDIT_FIXTURES === '1') {
    return { user: fixtureUser, clerkUser: null, isLoading: false, isAuthenticated: true,
      login: () => undefined, logout: () => undefined, isLoggingOut: false };
  }

  if (!isClerkEnabled) {
    return {
      user: null,
      clerkUser: null,
      isLoading: false,
      isAuthenticated: false,
      login: () => undefined,
      logout: () => undefined,
      isLoggingOut: false,
    };
  }

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
  const fallbackUser: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        profileImageUrl: clerkUser.imageUrl ?? null,
        username: null,
        avatarUrl: clerkUser.imageUrl ?? null,
        socialLinks: {},
        privacySettings: { showAvatar: true, showSocialLinks: true, showUsername: true },
        role: 'user',
        tier: 'free',
        totalPoints: 0,
        isVerified: false,
        country: null,
        language: 'en',
        featuredInfluencer: false,
        starLevel: 0,
        progressBadge: 'none',
        currentStreak: 0,
        maxStreak: 0,
        lastProgressionCalc: null,
        monthlyLoginCount: 0,
        lastLoginMonth: null,
        lastLoginDate: null,
        isAiChatBlocked: false,
        subscriptionId: null,
        subscriptionStatus: null,
        currentPeriodEnd: null,
        subscriptionStartDate: null,
        yellowRedFlagsUsed: 0,
        flagBudget: 0,
        currentEventId: null,
        lastFlagResetAt: null,
        createdAt: null,
        updatedAt: null,
        permissions: [],
      }
    : null;

  return {
    user: localUser ?? fallbackUser,
    clerkUser: clerkUser ?? null,
    isLoading,
    isAuthenticated: !!isSignedIn,
    login: () => clerk.openSignIn(),
    logout: () => clerk.signOut(),
    isLoggingOut: false,
  };
}
