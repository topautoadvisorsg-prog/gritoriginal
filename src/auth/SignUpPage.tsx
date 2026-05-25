import { SignUp } from '@clerk/clerk-react';

export function SignUpPage() {
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
      <SignUp
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
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

export default SignUpPage;
