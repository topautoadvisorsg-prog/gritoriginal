import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="2026-05-23 (Skeleton — Pre-Launch)">
      <h2>1. What We Collect</h2>
      <p>
        <strong>Account data:</strong> email, username, display name, country, optional avatar,
        password hash (via our auth provider Clerk).
      </p>
      <p>
        <strong>Payment data:</strong> handled by Stripe. We store only customer IDs, subscription
        IDs, and the last four digits of payment methods for receipts. We never see full card
        numbers.
      </p>
      <p>
        <strong>Activity data:</strong> picks, ratings, notes, chat messages, slips, badges, stars,
        and other platform interactions.
      </p>
      <p>
        <strong>Device + fraud data:</strong> device fingerprint, IP address, and ASN (network owner)
        are logged at signup, payment events, and prize-eligible events. This data is retained
        for 24 months and used solely for multi-account / sockpuppet detection.
      </p>
      <p>
        <strong>Analytics:</strong> anonymous usage data (page views, feature usage) via PostHog
        to improve the product. You may opt out of analytics in Settings.
      </p>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>Provide the Platform and its features (picks, scoring, leaderboards, creator economy)</li>
        <li>Process payments (Stripe) and creator payouts (Stripe Connect)</li>
        <li>Send transactional notifications (event reminders, achievements) via OneSignal push and Resend email</li>
        <li>Detect fraud and multi-account abuse</li>
        <li>Comply with US tax law (1099-NEC issuance to US users with $600+ in cash payouts per year)</li>
        <li>Provide AI features (queries sent to Anthropic Claude per their terms)</li>
      </ul>

      <h2>3. Third Parties We Share With</h2>
      <ul>
        <li><strong>Clerk:</strong> identity and authentication</li>
        <li><strong>Supabase:</strong> primary database and file storage</li>
        <li><strong>Stripe / Stripe Connect:</strong> payment processing and creator payouts</li>
        <li><strong>Anthropic:</strong> AI query processing</li>
        <li><strong>OneSignal:</strong> push notifications</li>
        <li><strong>Resend:</strong> transactional email</li>
        <li><strong>PostHog:</strong> anonymous analytics</li>
        <li><strong>Sentry:</strong> error tracking</li>
        <li><strong>FingerprintJS:</strong> device fingerprinting for fraud detection</li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>

      <h2>4. Your Rights</h2>
      <p>
        You may request a copy of all your data ("data export") via the Settings page before
        deleting your account. Per GDPR (applies to EU users), you may also request correction
        or deletion of personal data at any time.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Pick history, ratings, and notes are retained for the lifetime of your account.
        Device fingerprint and IP logs are retained for 24 months. On account deletion, all
        personally identifying data is purged within 30 days; aggregate, anonymized statistics
        may be retained indefinitely.
      </p>

      <h2>6. Cookies</h2>
      <p>See our separate Cookie Policy.</p>

      <h2>7. Children</h2>
      <p>
        The Platform is not intended for users under 18. We do not knowingly collect data
        from children. If we discover a child has signed up, we will delete the account.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        Material changes will be communicated in-app and via email at least 7 days before
        taking effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy inquiries: <a href="mailto:privacy@gritmma.com">privacy@gritmma.com</a>
      </p>
    </LegalLayout>
  );
}
