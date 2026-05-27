import { SignIn } from '@clerk/clerk-react';
import { isClerkEnabled } from './clerkConfig';

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
        afterSignInUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: 'hsl(190 90% 50%)',
            colorBackground: 'hsl(220 25% 8%)',
            colorText: 'hsl(0 0% 95%)',
            colorInputBackground: 'hsl(220 25% 10%)',
            colorInputText: 'hsl(0 0% 95%)',
            borderRadius: '6px',
          },
        }}
      />
    </div>
  );
}

export default SignInPage;
