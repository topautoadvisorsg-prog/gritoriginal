import React from 'react';
import { Target } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

function StepVisual01() {
  return (
    <div className="lp-step__visual">
      <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="110" height="72" rx="10" fill="hsl(220 25% 10%)" stroke="hsl(354 90% 52% / .2)" strokeWidth="1" />
        <circle cx="24" cy="28" r="14" fill="hsl(354 90% 52% / .15)" stroke="hsl(354 90% 52% / .5)" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="6" fill="hsl(354 90% 52% / .4)" />
        <path d="M13 38 Q17 31 24 30 Q31 31 35 38" fill="hsl(354 90% 52% / .3)" />
        <rect x="44" y="18" width="50" height="7" rx="3" fill="hsl(210 20% 25%)" />
        <rect x="44" y="18" width="36" height="7" rx="3" fill="hsl(210 20% 40%)" />
        <rect x="44" y="30" width="40" height="5" rx="2.5" fill="hsl(210 20% 20%)" />
        <rect x="44" y="40" width="28" height="5" rx="2.5" fill="hsl(210 20% 20%)" />
        <rect x="6" y="56" width="22" height="10" rx="5" fill="hsl(150 60% 45% / .15)" stroke="hsl(150 60% 50% / .4)" strokeWidth="0.5" />
        <rect x="32" y="56" width="22" height="10" rx="5" fill="hsl(354 90% 52% / .1)" stroke="hsl(354 90% 52% / .3)" strokeWidth="0.5" />
        <text x="17" y="64" textAnchor="middle" fill="hsl(150 60% 55%)" fontSize="5" fontFamily="'Inter', sans-serif">🥷 NINJA</text>
        <text x="43" y="64" textAnchor="middle" fill="hsl(354 90% 62%)" fontSize="5" fontFamily="'Inter', sans-serif">USA 🇺🇸</text>
      </svg>
    </div>
  );
}

function StepVisual02() {
  return (
    <div className="lp-step__visual">
      <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="110" height="72" rx="10" fill="hsl(220 25% 10%)" stroke="hsl(354 90% 52% / .2)" strokeWidth="1" />
        <rect x="6" y="8" width="46" height="24" rx="6" fill="hsl(220 25% 13%)" stroke="hsl(210 20% 25%)" strokeWidth="1" />
        <rect x="58" y="8" width="46" height="24" rx="6" fill="hsl(354 90% 52% / .12)" stroke="hsl(354 90% 52% / .5)" strokeWidth="1" />
        <text x="29" y="24" textAnchor="middle" fill="hsl(210 20% 55%)" fontSize="7" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">OLIVEIRA</text>
        <text x="81" y="24" textAnchor="middle" fill="hsl(354 90% 65%)" fontSize="7" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">MAKHACHEV</text>
        <circle cx="55" cy="20" r="6" fill="hsl(220 25% 8%)" stroke="hsl(210 20% 25%)" strokeWidth="1" />
        <text x="55" y="23" textAnchor="middle" fill="hsl(210 20% 45%)" fontSize="8" fontFamily="sans-serif">VS</text>
        <circle cx="97" cy="10" r="5" fill="hsl(354 90% 52%)" />
        <path d="M94 10 L96 12 L100 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="40" width="98" height="24" rx="6" fill="hsl(220 25% 12%)" />
        <text x="18" y="52" fill="hsl(210 20% 50%)" fontSize="6" fontFamily="'Inter', sans-serif">CONFIDENCE</text>
        <rect x="6" y="56" width="88" height="4" rx="2" fill="hsl(210 20% 18%)" />
        <rect x="6" y="56" width="64" height="4" rx="2" fill="hsl(354 90% 52%)" />
        <text x="100" y="60" fill="hsl(354 90% 62%)" fontSize="5.5" fontFamily="'Inter', sans-serif">4u</text>
      </svg>
    </div>
  );
}

function StepVisual03() {
  return (
    <div className="lp-step__visual">
      <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="110" height="72" rx="10" fill="hsl(220 25% 10%)" stroke="hsl(354 90% 52% / .2)" strokeWidth="1" />
        <line x1="12" y1="60" x2="12" y2="12" stroke="hsl(210 20% 25%)" strokeWidth="1" />
        <line x1="12" y1="60" x2="102" y2="60" stroke="hsl(210 20% 25%)" strokeWidth="1" />
        {[10, 30, 50].map((x, i) => (
          <line key={i} x1="10" y1={55 - i * 14} x2="104" y2={55 - i * 14} stroke="hsl(210 20% 18%)" strokeWidth="0.5" />
        ))}
        <polyline
          points="16,54 28,50 40,45 52,42 64,35 76,28 88,20 100,14"
          stroke="hsl(150 60% 50%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M16,54 28,50 40,45 52,42 64,35 76,28 88,20 100,14 100,60 16,60 Z"
          fill="hsl(150 60% 50% / .08)"
        />
        {[16, 28, 40, 52, 64, 76, 88, 100].map((x, i) => {
          const ys = [54, 50, 45, 42, 35, 28, 20, 14];
          return <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="hsl(150 60% 50%)" />;
        })}
        <rect x="60" y="6" width="44" height="16" rx="4" fill="hsl(150 60% 45% / .15)" stroke="hsl(150 60% 50% / .3)" strokeWidth="0.5" />
        <text x="82" y="17" textAnchor="middle" fill="hsl(150 60% 55%)" fontSize="7" fontFamily="'Inter', sans-serif">+18.4u</text>
      </svg>
    </div>
  );
}

function StepVisual04() {
  return (
    <div className="lp-step__visual">
      <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="110" height="72" rx="10" fill="hsl(220 25% 10%)" stroke="hsl(354 90% 52% / .2)" strokeWidth="1" />
        <rect x="6" y="8" width="98" height="16" rx="4" fill="hsl(45 90% 55% / .08)" stroke="hsl(45 90% 55% / .3)" strokeWidth="1" />
        <text x="16" y="20" fill="hsl(45 90% 60%)" fontSize="8" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">#1</text>
        <text x="34" y="20" fill="hsl(210 40% 85%)" fontSize="7" fontFamily="sans-serif">NightHawk</text>
        <text x="90" y="20" textAnchor="middle" fill="hsl(45 90% 60%)" fontSize="7" fontFamily="'Inter', sans-serif">12,450</text>
        <rect x="6" y="28" width="98" height="12" rx="3" fill="hsl(220 25% 12%)" />
        <text x="16" y="38" fill="hsl(210 20% 50%)" fontSize="7" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">#2</text>
        <text x="34" y="38" fill="hsl(210 40% 70%)" fontSize="6.5" fontFamily="sans-serif">OctagonKing</text>
        <text x="90" y="38" textAnchor="middle" fill="hsl(210 20% 55%)" fontSize="7" fontFamily="'Inter', sans-serif">11,200</text>
        <rect x="6" y="44" width="98" height="12" rx="3" fill="hsl(220 25% 12%)" />
        <text x="16" y="54" fill="hsl(25 85% 55%)" fontSize="7" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">#3</text>
        <text x="34" y="54" fill="hsl(210 40% 60%)" fontSize="6.5" fontFamily="sans-serif">MatWarrior</text>
        <text x="90" y="54" textAnchor="middle" fill="hsl(210 20% 50%)" fontSize="7" fontFamily="'Inter', sans-serif">10,890</text>
        <rect x="6" y="58" width="98" height="10" rx="3" fill="hsl(45 90% 55% / .06)" stroke="hsl(45 90% 55% / .2)" strokeWidth="0.5" />
        <text x="55" y="66" textAnchor="middle" fill="hsl(45 90% 55%)" fontSize="5.5" fontFamily="'Inter', sans-serif" letterSpacing="1">★★★★★ GOAT UNLOCK</text>
      </svg>
    </div>
  );
}

const STEP_VISUALS = [StepVisual01, StepVisual02, StepVisual03, StepVisual04];

export function HowItWorks() {
  const { t } = useTranslation();
  const STEPS = [
    { num: '01', title: t('how_it_works.step1_title'), desc: t('how_it_works.step1_desc') },
    { num: '02', title: t('how_it_works.step2_title'), desc: t('how_it_works.step2_desc') },
    { num: '03', title: t('how_it_works.step3_title'), desc: t('how_it_works.step3_desc') },
    { num: '04', title: t('how_it_works.step4_title'), desc: t('how_it_works.step4_desc') },
  ];

  const ref = useScrollAnimation();
  return (
    <section className="lp-section lp-how" id="how-it-works" ref={ref}>
      <div className="lp-section__inner">
        <div className="lp-animate" style={{ textAlign: 'center' }}>
          <span className="lp-section-label"><Target size={14} /> {t('how_it_works.label')}</span>
          <h2 className="lp-section-title" style={{ margin: '0 auto 16px' }}>{t('how_it_works.title')}</h2>
          <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>{t('how_it_works.subtitle')}</p>
        </div>
        <div className="lp-how__timeline">
          {STEPS.map((s, i) => {
            const Visual = STEP_VISUALS[i];
            return (
              <div key={s.num} className={`lp-step lp-animate lp-animate-delay-${i + 1}`}>
                <h3 className="lp-step__title">{s.title}</h3>
                {s.desc && <p className="lp-step__desc">{s.desc}</p>}
                <Visual />
                <div className="lp-step__number-wrap"><div className="lp-step__number">{s.num}</div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
