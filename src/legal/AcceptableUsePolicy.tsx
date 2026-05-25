import LegalLayout from './LegalLayout';

export default function AcceptableUsePolicy() {
  return (
    <LegalLayout title="Acceptable Use Policy" effectiveDate="2026-05-23 (Skeleton — Pre-Launch)">
      <h2>1. Purpose</h2>
      <p>
        This policy describes behaviors that are not allowed on GRIT. Violations are grounds
        for warning, mute, suspension, account termination, and forfeiture of pending prizes.
      </p>

      <h2>2. Prohibited Behaviors</h2>

      <h3>Cheating and Fraud</h3>
      <ul>
        <li>Creating multiple accounts to game raffles, founder slots, or monthly bonus prizes</li>
        <li>Using bots or scripts to make picks or game the system</li>
        <li>Submitting picks on behalf of another person</li>
        <li>Falsely claiming achievements (keys, badges) you did not earn</li>
        <li>Attempting to manipulate creator ratings or fighter community ratings via brigading</li>
      </ul>

      <h3>Hate Speech and Harassment</h3>
      <ul>
        <li>Slurs, threats, or attacks targeting any user, fighter, or group based on race, religion, gender, sexual orientation, nationality, or any other characteristic</li>
        <li>Doxxing — sharing private information about other users or fighters</li>
        <li>Coordinated harassment campaigns</li>
      </ul>

      <h3>Scams and Misrepresentation</h3>
      <ul>
        <li>Pretending to be GRIT staff, UFC, or any other party</li>
        <li>"DM for picks" or off-platform monetization schemes</li>
        <li>Pump-and-dump links (e.g., telegram channels, crypto pumps)</li>
        <li>Phishing or credential theft attempts</li>
      </ul>

      <h3>Spam and Disruption</h3>
      <ul>
        <li>Posting the same message repeatedly in chat (3+ times in 5 minutes)</li>
        <li>Mass-posting URLs (2+ URLs per message is blocked unless you are a verified Creator)</li>
        <li>Flooding any feature to disrupt other users</li>
      </ul>

      <h3>Content Restrictions</h3>
      <ul>
        <li>Adult content, gore, or shock content</li>
        <li>Copyright infringement</li>
        <li>Illegal content of any kind</li>
      </ul>

      <h2>3. Moderation</h2>
      <p>
        We use a combination of automated filtering and human review. Reports flow to admin
        review queues. Repeat offenders face progressive penalties:
      </p>
      <ul>
        <li><strong>First offense:</strong> Warning (private notification)</li>
        <li><strong>Second:</strong> 24-hour mute</li>
        <li><strong>Third:</strong> 7-day mute</li>
        <li><strong>Fourth:</strong> Account suspension</li>
      </ul>
      <p>
        Severe violations (e.g., threats of violence, doxxing, fraud rings) may result in
        immediate suspension without warning.
      </p>

      <h2>4. Reporting Violations</h2>
      <p>
        Every chat message, slip, user profile, and creator listing has a "Report" option.
        Reports include categories: Spam, Harassment, Inappropriate, Scam, Fake Creator,
        or Other. Three reports against the same user automatically escalate the case to
        admin review.
      </p>

      <h2>5. Appeals</h2>
      <p>
        If you believe a moderation action was applied in error, contact
        <a href="mailto:appeals@gritmma.com"> appeals@gritmma.com</a>. We review all appeals
        but reserve final discretion. Legitimate shared-device cases (couples, families,
        roommates) flagged by our multi-account detection can be whitelisted by admin.
      </p>

      <h2>6. Updates</h2>
      <p>
        This policy may be updated as new abuse patterns emerge. Material changes will be
        announced in-app.
      </p>
    </LegalLayout>
  );
}
