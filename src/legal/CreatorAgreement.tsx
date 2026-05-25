import LegalLayout from './LegalLayout';

export default function CreatorAgreement() {
  return (
    <LegalLayout title="Creator Agreement" effectiveDate="2026-05-23 (Skeleton — Pre-Launch)">
      <h2>1. Scope</h2>
      <p>
        This Agreement applies to users who enable creator features on GRIT, including Free
        Creators (donations only) and Paid Creators (subscriptions and 1-on-1 paid chat sessions).
        These terms supplement, and do not replace, the Terms of Service.
      </p>

      <h2>2. Eligibility</h2>
      <p><strong>Free Creator:</strong> Available to any user from day one. Donations only.</p>
      <p><strong>Paid Creator:</strong> Requires all of the following:</p>
      <ul>
        <li>Account age of at least 30 days</li>
        <li>3 or more qualified events on record (met participation minimum)</li>
        <li>Two-factor authentication enabled</li>
        <li>No active moderation actions (warnings, mutes, bans)</li>
        <li>Stripe Connect account fully verified (charges_enabled and payouts_enabled both true)</li>
      </ul>
      <p>
        If you lose any of these standards while operating as a Paid Creator (e.g., you are
        banned for ToS violation, or your Stripe Connect status fails), paid features will be
        disabled immediately. New subscriptions will be blocked; existing subscriptions will
        be handled per Section 6 below.
      </p>

      <h2>3. Revenue Splits</h2>
      <ul>
        <li><strong>Creator subscriptions:</strong> 85% creator / 15% platform</li>
        <li><strong>Donations:</strong> 95% creator / 5% platform</li>
        <li><strong>1-on-1 paid chat sessions:</strong> 80% creator / 20% platform</li>
      </ul>
      <p>
        Splits apply after Stripe processing fees. Payouts are issued monthly (around the 20th)
        via Stripe Connect to the bank account you connected.
      </p>

      <h2>4. 1-on-1 Paid Chat Sessions</h2>
      <p>
        Sessions are TEXT ONLY (no video). You set the duration (default 30 minutes) and
        price. Booking fees are held in Stripe escrow until session completion. If you do not
        join the session within 10 minutes of the scheduled start time, the booking is
        auto-refunded and you receive a no-show flag. <strong>Three no-show flags will remove
        your creator privileges.</strong>
      </p>

      <h2>5. Pick Visibility and Content</h2>
      <p>
        For each pick you submit, you may choose visibility: public, subscribers-only, or
        reveal-after-fight. Pick visibility is enforced at the database level (Supabase RLS).
        You may not circumvent visibility by posting picks outside the Platform.
      </p>

      <h2>6. Termination Handling</h2>
      <p>If your creator account is terminated:</p>
      <ul>
        <li><strong>Voluntary stop:</strong> Subscriptions auto-cancel at the end of each subscriber's paid period. Subscribers are notified 7 days in advance.</li>
        <li><strong>Banned for ToS violation:</strong> Subscriptions cancel immediately. Subscribers receive pro-rated refunds. Refunds are funded first from your pending payout balance; GRIT covers any shortfall.</li>
        <li><strong>Inactive 60+ days:</strong> Account auto-pauses. No new charges to subscribers. You can resume by logging in.</li>
        <li><strong>Account deletion / death:</strong> Subscriptions cancel immediately. No refund (this is end of service, not fraud).</li>
      </ul>

      <h2>7. Refund Responsibility</h2>
      <p>
        Subscribers may request a refund within 7 days of any subscription charge. Refunds
        granted within this window are deducted from your pending payout balance. After 7 days,
        no refunds are issued.
      </p>

      <h2>8. Tax Responsibility</h2>
      <p>
        You are responsible for declaring all earnings on your tax return in your country of
        residence. GRIT (a US LLC) does not withhold taxes from your payouts. US-based
        creators receiving $600+ in a calendar year will receive a 1099-NEC form by January 31
        of the following year. Non-US creators may be asked to complete a W-8BEN form.
      </p>

      <h2>9. Content Standards</h2>
      <p>
        You may not post: hate speech, harassment of fighters or users, false claims of
        partnership with GRIT or UFC, scams, copyright infringement, illegal content, or
        adult content. Violations are grounds for immediate termination.
      </p>

      <h2>10. Platform Discretion</h2>
      <p>
        GRIT may, at its discretion, feature creators on the Platform homepage, recommend them
        to users, or promote them in marketing materials. We do not guarantee any minimum
        number of subscribers, donations, or income.
      </p>

      <h2>11. Changes</h2>
      <p>
        Material changes to this Agreement (including revenue splits) will be communicated
        in-app and via email at least 30 days before taking effect, giving you time to opt out.
      </p>
    </LegalLayout>
  );
}
