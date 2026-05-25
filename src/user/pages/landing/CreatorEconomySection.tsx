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
      <div className="lp-section__inner lp-animate" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="lp-section-label" style={{ justifyContent: 'center' }}>
            <Users size={14} /> {t('creator.label')}
          </span>
          <h2 className="lp-section-title" style={{ margin: '16px auto 16px' }}>
            {t('creator.title')}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', maxWidth: 720, margin: '0 auto' }}>
            {t('creator.desc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
          maxWidth: 920,
          margin: '0 auto',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 12,
              padding: '16px 18px',
              background: 'rgba(181, 123, 255, 0.06)',
              border: '1px solid rgba(181, 123, 255, 0.25)',
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.85)',
            }}>
              <Check size={16} style={{ color: 'rgb(181, 123, 255)', flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CreatorEconomySection;
