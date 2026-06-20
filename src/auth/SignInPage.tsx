import { SignIn } from '@clerk/clerk-react';
import { clerkAppearance, isClerkEnabled } from './clerkConfig';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(220 25% 6%)',
        padding: 24,
      }}
    >
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </div>
  );
}

export default SignInPage;
