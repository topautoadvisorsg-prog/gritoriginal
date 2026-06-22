import { SignIn } from '@clerk/clerk-react';
import { clerkAppearance, isClerkEnabled } from './clerkConfig';
import { AuthShell } from './AuthShell';

export function SignInPage() {
  if (!isClerkEnabled) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'hsl(220 25% 6%)',
          color: 'hsl(0 0% 95%)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        Clerk authentication is not configured yet.
      </div>
    );
  }

  return (
    <AuthShell eyebrow="Welcome back to the arena">
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

export default SignInPage;
