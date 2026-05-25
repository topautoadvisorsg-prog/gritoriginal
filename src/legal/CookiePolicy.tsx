import LegalLayout from './LegalLayout';

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" effectiveDate="2026-05-23 (Skeleton — Pre-Launch)">
      <h2>1. What Cookies We Use</h2>
      <p>
        GRIT uses cookies and similar storage technologies for the following purposes:
      </p>

      <h3>Strictly Necessary (cannot be disabled)</h3>
      <ul>
        <li><strong>Session cookies</strong> (via Clerk) — keep you signed in</li>
        <li><strong>CSRF token cookies</strong> — protect against cross-site request forgery</li>
        <li><strong>Preference cookies</strong> — remember your time zone, language, and dark/light theme</li>
      </ul>

      <h3>Analytics (opt-in)</h3>
      <ul>
        <li><strong>PostHog</strong> — anonymous usage analytics. You may opt out via the cookie banner or Settings.</li>
      </ul>

      <h3>Fraud Detection</h3>
      <ul>
        <li><strong>FingerprintJS</strong> — generates a device fingerprint at signup and payment events to detect multi-account abuse. Used only for security; not for marketing.</li>
      </ul>

      <h2>2. Cookie Banner</h2>
      <p>
        On your first visit, a banner offers a choice to accept or decline analytics cookies.
        Strictly necessary cookies are always set because the Platform cannot function without
        them. Your choice is remembered and can be changed in Settings.
      </p>

      <h2>3. Third-Party Cookies</h2>
      <p>
        Some embedded services (e.g., Stripe Checkout for payments) may set their own cookies
        when you interact with them. See those providers' privacy policies for details.
      </p>

      <h2>4. EU Compliance</h2>
      <p>
        Users located in the EU are presented with explicit accept/decline options for any
        non-essential cookies, in compliance with the ePrivacy Directive and GDPR.
      </p>

      <h2>5. Changes</h2>
      <p>
        We will update this policy as we add or remove services. Material changes will be
        announced in-app.
      </p>
    </LegalLayout>
  );
}
