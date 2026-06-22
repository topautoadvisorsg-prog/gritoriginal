import type { ReactNode } from 'react';

interface AuthShellProps {
  eyebrow: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, children }: AuthShellProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        background: 'radial-gradient(circle at 50% 18%, hsl(38 82% 52% / 0.08), transparent 34%), hsl(220 25% 6%)',
        padding: 24,
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <a
          href="/"
          aria-label="Back to GRIT home"
          style={{ color: 'hsl(38 82% 52%)', fontSize: 30, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', textDecoration: 'none' }}
        >
          GRIT
        </a>
        <p style={{ margin: '4px 0 0', color: 'hsl(210 12% 60%)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {eyebrow}
        </p>
      </header>
      {children}
      <p style={{ margin: 0, color: 'hsl(210 12% 45%)', fontSize: 11 }}>
        Skill-based MMA competition. No real-money wagering.
      </p>
    </main>
  );
}
