import LegalLayout from './LegalLayout';

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="2026-05-23 (Skeleton — Pre-Launch)">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account on GRIT (the "Platform"), you agree to these Terms of Service
        ("Terms"). If you do not agree, do not use the Platform. GRIT is operated by
        a US LLC (jurisdiction: State of Delaware).
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use the Platform. By signing up you represent
        that you meet this requirement. We may require phone and email verification before
        granting access to certain features.
      </p>

      <h2>3. Not a Sportsbook</h2>
      <p>
        GRIT is a competitive MMA analytics and fantasy prediction platform. We do not
        accept real-money wagers on fight outcomes. All "picks" are abstract unit
        predictions; no money is risked on the outcome of any fight.
      </p>

      <h2>4. Account Security</h2>
      <p>
        You are responsible for keeping your account credentials secure. Subscribers
        (Challenger tier and Paid Creators) are required to enable two-factor authentication.
      </p>

      <h2>5. Subscriptions (Challenger Tier — $4.99/month)</h2>
      <p>
        Challenger subscriptions auto-renew monthly until you cancel. Cancellation takes
        effect at the end of the current billing period; you retain access until then.
      </p>

      <h2>6. AI Tokens</h2>
      <p>
        AI tokens are purchased separately from Challenger subscriptions and are required
        to use AI-powered features. Token packs are priced at $5 / $10 / $20 and grant
        100 / 220 / 500 tokens respectively. Tokens have no cash value and cannot be
        transferred or sold. Tokens freeze on subscription lapse and resume on renewal.
      </p>

      <h2>7. Refund Policy</h2>
      <p>
        <strong>Challenger Subscription:</strong> Refundable in full within 7 days of purchase. After
        7 days no refunds; access continues to end of billing period if you cancel.
      </p>
      <p>
        <strong>AI Token Packs:</strong> Refundable in full within 7 days of purchase ONLY if zero
        tokens from that pack have been spent. Any token spent invalidates the refund for
        that pack. After 7 days no refunds; tokens remain in your account while your
        subscription is active.
      </p>
      <p>
        <strong>Donations to Creators:</strong> Non-refundable.
      </p>
      <p>
        <strong>1-on-1 Creator Chat Sessions:</strong> Funds held in Stripe escrow. Auto-refunded if
        the creator does not appear within 10 minutes of the session start time. Otherwise
        released to creator on session completion.
      </p>

      <h2>8. Creator Economy</h2>
      <p>
        Any user may become a Free Creator (donations only) on day one. Paid Creators
        (charging subscriptions or 1-on-1 sessions) must meet trust signals: 30-day account
        age, 3+ qualified events, 2FA enabled, no active moderation actions, Stripe Connect
        verified. Detailed terms are in the separate Creator Agreement.
      </p>

      <h2>9. Achievements and Prizes</h2>
      <p>
        Stars, badges, keys, founder badges, raffle wins, and monthly bonus payouts are
        awarded based on platform rules published at the time of each event. Founder badge
        slots are limited and permanent — once earned, they remain with the user even after
        subscription cancellation. Cash prize payouts are made manually (PayPal or USDC/USDT).
        US users receiving $600+ in cash payouts per calendar year will receive a 1099-NEC
        form.
      </p>

      <h2>10. Acceptable Use</h2>
      <p>
        See the separate Acceptable Use Policy. Cheating, multi-account fraud, hate speech,
        scam content, and harassment of fighters or other users will result in account
        termination and forfeiture of any pending prizes.
      </p>

      <h2>11. Content Ownership</h2>
      <p>
        You retain ownership of content you post (picks, notes, ratings, slips). By posting,
        you grant GRIT a non-exclusive, royalty-free license to display the content on the
        Platform. Per-fight private notes are never displayed to anyone but you.
      </p>

      <h2>12. AI Usage</h2>
      <p>
        AI features use third-party language models (currently Anthropic Claude). Your queries
        may be transmitted to those providers per their terms. AI outputs are predictions, not
        guarantees. Use at your own discretion.
      </p>

      <h2>13. Account Termination</h2>
      <p>
        You may delete your account at any time from Settings. We may suspend or terminate
        accounts that violate these Terms. Founder badges and slips remain associated with
        terminated accounts only as platform records; no platform access is restored.
      </p>

      <h2>14. Disclaimer of Warranties</h2>
      <p>
        The Platform is provided "as is" without warranty of any kind. We do not guarantee
        uninterrupted service or the accuracy of any data displayed.
      </p>

      <h2>15. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, GRIT's total liability to you for any claim
        arising from your use of the Platform is limited to the amounts you have paid to
        GRIT in the 12 months preceding the claim.
      </p>

      <h2>16. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated
        in-app and via email. Continued use after changes constitutes acceptance.
      </p>

      <h2>17. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware. Any disputes will be
        resolved in the courts of Delaware.
      </p>
    </LegalLayout>
  );
}
