import React from 'react';
import { LayoutDashboard, Target, Users, MessageSquare, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

const FEATURE_COLORS = ['#38bdf8', '#f43f5e', '#facc15', '#34d399', '#a78bfa'];
const FEATURE_ICONS = [LayoutDashboard, Target, Users, MessageSquare, Brain];

function FighterFlank({ side, src }: { side: 'left' | 'right'; src: string }) {
    return (
        <div className={`lp-competition__flanker lp-competition__flanker--${side}`} aria-hidden="true">
            <img
                src={src}
                alt=""
                className={`lp-fighter-photo lp-fighter-photo--flanker lp-fighter-photo--${side}`}
                loading="lazy"
            />
        </div>
    );
}

export function CoreFeaturesSection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();

    const features = [
        { icon: FEATURE_ICONS[0], label: t('core_features.feat1_label'), desc: t('core_features.feat1_desc'), color: FEATURE_COLORS[0] },
        { icon: FEATURE_ICONS[1], label: t('core_features.feat2_label'), desc: t('core_features.feat2_desc'), color: FEATURE_COLORS[1] },
        { icon: FEATURE_ICONS[2], label: t('core_features.feat3_label'), desc: t('core_features.feat3_desc'), color: FEATURE_COLORS[2] },
        { icon: FEATURE_ICONS[3], label: t('core_features.feat4_label'), desc: t('core_features.feat4_desc'), color: FEATURE_COLORS[3] },
        { icon: FEATURE_ICONS[4], label: t('core_features.feat5_label'), desc: t('core_features.feat5_desc'), color: FEATURE_COLORS[4] },
    ];

    return (
        <section className="lp-section lp-core-features" id="features" ref={ref}>
            <FighterFlank side="left" src="/fighters/fighter-2.png" />
            <FighterFlank side="right" src="/fighters/fighter-3.png" />
            <div className="lp-section__inner lp-core-features__inner">
                <div className="lp-animate" style={{ textAlign: 'center', marginBottom: 48 }}>
                    <span className="lp-section-label">
                        <LayoutDashboard size={14} /> {t('core_features.label')}
                    </span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 12px' }}>{t('core_features.title')}</h2>
                    <p className="lp-section-subtitle" style={{ margin: '0 auto', maxWidth: 540 }}>
                        {t('core_features.subtitle')}
                    </p>
                </div>
                <div className="lp-core-features__grid">
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.label}
                                className={`lp-core-feature-tile lp-animate lp-animate-delay-${i + 1}`}
                            >
                                <div
                                    className="lp-core-feature-tile__icon"
                                    style={{
                                        color: f.color,
                                        background: `${f.color}18`,
                                        border: `1px solid ${f.color}30`,
                                    }}
                                >
                                    <Icon size={22} />
                                </div>
                                <div className="lp-core-feature-tile__label">{f.label}</div>
                                <div className="lp-core-feature-tile__desc">{f.desc}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
