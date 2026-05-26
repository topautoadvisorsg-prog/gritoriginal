import React from 'react';
import { Users, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

export function CreatorEconomySection() {
  const { t } = useTranslation();
  const ref = useScrollAnimation();

  const features = [
    t('creator.feat1'),
    t('creator.feat2'),
    t('creator.feat3'),
    t('creator.feat4'),
  ];

  return (
    <section className="lp-section lp-creator-economy" ref={ref}>
      <div className="lp-section__inner lp-creator__inner lp-animate">
        <div className="lp-creator__head">
          <span className="lp-section-label lp-creator__label">
            <Users size={14} /> {t('creator.label')}
          </span>
          <h2 className="lp-section-title lp-creator__title">
            {t('creator.title')}
          </h2>
          <p className="lp-creator__desc">{t('creator.desc')}</p>
        </div>

        <div className="lp-creator__grid">
          {features.map((f, i) => (
            <div key={i} className="lp-creator__feat">
              <span className="lp-creator__feat-icon">
                <Check size={14} />
              </span>
              <span className="lp-creator__feat-text">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CreatorEconomySection;
