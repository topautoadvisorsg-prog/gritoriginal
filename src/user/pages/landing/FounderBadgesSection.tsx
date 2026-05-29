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
    { title: t('founder_badges.tier3_title'), slots: t('founder_badges.tier3_slots'), status: t('founder_badges.tier3_status'), color: 'hsl(32 90% 55%)' },
    { title: t('founder_badges.tier4_title'), slots: t('founder_badges.tier4_slots'), status: t('founder_badges.tier4_status'), color: 'hsl(0 80% 60%)' },
  ];

  return (
    <section className="lp-section lp-founder-badges" ref={ref}>
      <div className="lp-section__inner lp-founder-badges__inner lp-animate">
        <div className="lp-founder-badges__head">
          <span className="lp-section-label lp-founder-badges__label">
            <Lock size={14} /> {t('founder_badges.label')}
          </span>
          <h2 className="lp-section-title lp-founder-badges__title">
            {t('founder_badges.title')}
          </h2>
          <p className="lp-founder-badges__desc">{t('founder_badges.desc')}</p>
        </div>

        <div className="lp-founder-badges__grid">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="lp-fb-card"
              style={{ '--fb-color': tier.color } as React.CSSProperties}
            >
              <span className="lp-fb-card__status">{tier.status}</span>
              <Crown size={22} className="lp-fb-card__crown" />
              <h3 className="lp-fb-card__title">{tier.title}</h3>
              <p className="lp-fb-card__slots">{tier.slots}</p>
              <div className="lp-fb-card__bar" aria-hidden="true">
                <div className="lp-fb-card__bar-fill" />
              </div>
            </div>
          ))}
        </div>

        <div className="lp-founder-badges__cta">
          <button className="lp-btn lp-btn--primary" onClick={onSignIn}>
            <Crown size={16} /> {t('nav.get_started')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default FounderBadgesSection;
