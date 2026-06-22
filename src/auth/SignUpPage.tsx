import { SignUp } from '@clerk/clerk-react';
import { clerkAppearance, isClerkEnabled } from './clerkConfig';
import { AuthShell } from './AuthShell';

export function SignUpPage() {
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
    <AuthShell eyebrow="Claim your place in the league">
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}

export default SignUpPage;
