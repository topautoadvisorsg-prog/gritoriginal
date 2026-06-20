import { shadcn } from '@clerk/ui/themes';

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const isClerkEnabled = Boolean(clerkPublishableKey);

export const clerkAppearance = {
  theme: shadcn,
  variables: {
    colorPrimary: 'hsl(38 82% 52%)',
    colorBackground: 'hsl(220 25% 8%)',
    colorText: 'hsl(0 0% 95%)',
    colorInputBackground: 'hsl(220 25% 10%)',
    colorInputText: 'hsl(0 0% 95%)',
    borderRadius: '6px',
  },
  elements: {
    socialButtonsIconButton: {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
      color: '#111827',
    },
  },
} as const;
