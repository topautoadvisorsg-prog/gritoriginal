import React from 'react';
import { LayoutDashboard, Target, Users, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

const FEATURE_COLORS = ['#38bdf8', '#f43f5e', '#facc15', '#34d399'];
const FEATURE_ICONS = [LayoutDashboard, Target, Users, MessageSquare];

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
    ];

    return (
        <section className="lp-section lp-core-features" id="features" ref={ref}>
            {/* Swapped left/right so fighters face inward toward the content */}
            <FighterFlank side="left" src="/fighters/fighter-3.png" />
            <FighterFlank side="right" src="/fighters/fighter-2.png" />
            <div className="lp-section__inner lp-core-features__inner">
                <div className="lp-animate lp-core-features__head">
                    <span className="lp-section-label">
                        <LayoutDashboard size={14} /> {t('core_features.label')}
                    </span>
                    <h2 className="lp-section-title lp-core-features__title">{t('core_features.title')}</h2>
                    <p className="lp-section-subtitle lp-core-features__subtitle">
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
                                style={{ '--tile-accent': f.color } as React.CSSProperties}
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
