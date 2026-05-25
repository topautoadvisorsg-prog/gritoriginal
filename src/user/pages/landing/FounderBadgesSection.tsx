import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

interface FounderTier {
  title: string;
  slots: string;
  status: string;
  color: string;
}

export function FounderBadgesSection({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useTranslation();
  const ref = useScrollAnimation();

  const tiers: FounderTier[] = [
    { title: t('founder_badges.tier1_title'), slots: t('founder_badges.tier1_slots'), status: t('founder_badges.tier1_status'), color: 'hsl(45 100% 60%)' },
    { title: t('founder_badges.tier2_title'), slots: t('founder_badges.tier2_slots'), status: t('founder_badges.tier2_status'), color: 'hsl(280 80% 65%)' },
    { title: t('founder_badges.tier3_title'), slots: t('founder_badges.tier3_slots'), status: t('founder_badges.tier3_status'), color: 'hsl(190 90% 55%)' },
    { title: t('founder_badges.tier4_title'), slots: t('founder_badges.tier4_slots'), status: t('founder_badges.tier4_status'), color: 'hsl(0 80% 60%)' },
  ];

  return (
    <section className="lp-section lp-founder-badges" ref={ref}>
      <div className="lp-section__inner lp-animate" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="lp-section-label" style={{ justifyContent: 'center' }}>
            <Lock size={14} /> {t('founder_badges.label')}
          </span>
          <h2 className="lp-section-title" style={{ margin: '16px auto 16px' }}>
            {t('founder_badges.title')}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', maxWidth: 680, margin: '0 auto' }}>
            {t('founder_badges.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}>
          {tiers.map((tier, i) => (
            <div key={i} style={{
              padding: '24px 20px',
              background: 'rgba(20, 20, 28, 0.6)',
              border: `1px solid ${tier.color}40`,
              borderRadius: 8,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, right: 0,
                padding: '4px 10px',
                background: `${tier.color}20`,
                borderLeft: `1px solid ${tier.color}40`,
                borderBottom: `1px solid ${tier.color}40`,
                color: tier.color,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                {tier.status}
              </div>
              <Crown size={22} style={{ color: tier.color, marginBottom: 10 }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: tier.color, letterSpacing: 2, marginBottom: 6 }}>
                {tier.title}
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                {tier.slots}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="lp-btn lp-btn--primary" onClick={onSignIn}>
            <Crown size={16} /> {t('nav.get_started')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default FounderBadgesSection;
