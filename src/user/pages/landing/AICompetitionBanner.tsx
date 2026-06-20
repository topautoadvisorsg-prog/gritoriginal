import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

const TEAL = 'hsl(45 90% 52%)';
const TEAL_BG = 'hsl(45 90% 50% / .15)';
const TEAL_BORDER = 'hsl(45 90% 50% / .4)';
const TEAL_ICON_BG = 'hsl(45 90% 50% / .2)';
const TEAL_SHADOW = '0 0 20px -8px hsl(45 90% 50% / .15)';

const MODELS = [
    {
        icon: '🤖', name: 'GPT-4o',
        pick: 'Makhachev', pickColor: 'hsl(355 85% 65%)',
        confidence: '88%',
        confClass: 'lp-model-card__confidence--high',
        confStyle: {}, cardStyle: {},
    },
    {
        icon: '🚀', name: 'Grok 3',
        pick: 'Makhachev', pickColor: 'hsl(355 85% 65%)',
        confidence: '94%',
        confClass: 'lp-model-card__confidence--high',
        confStyle: { color: TEAL, background: TEAL_BG },
        cardStyle: { borderColor: TEAL_BORDER, boxShadow: TEAL_SHADOW },
    },
    {
        icon: '🧠', name: 'Claude 3.5',
        pick: 'Oliveira', pickColor: 'hsl(45 90% 60%)',
        confidence: '65%',
        confClass: 'lp-model-card__confidence--med',
        confStyle: {}, cardStyle: {},
    },
];

export function AICompetitionBanner() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-ai-banner" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-ai-banner__layout lp-animate">
                    <div className="lp-ai-banner__copy">
                        <span className="lp-section-label" style={{ marginBottom: 10, display: 'inline-flex' }}>
                            <Brain size={14} /> {t('ai_banner.label')}
                        </span>
                        <h3 className="lp-ai-banner__title">{t('ai_banner.title')}</h3>
                        <p className="lp-ai-banner__desc">{t('ai_banner.desc')}</p>
                    </div>
                    <div className="lp-ai-banner__cards">
                        {MODELS.map((m, i) => (
                            <div
                                key={m.name}
                                className={`lp-ai-banner__card lp-animate lp-animate-delay-${i + 1}`}
                                style={m.cardStyle}
                            >
                                <div className="lp-ai-banner__card-header">
                                    <span className="lp-ai-banner__card-icon"
                                        style={m.name === 'Grok 3' ? { background: TEAL_ICON_BG, color: TEAL } : {}}>
                                        {m.icon}
                                    </span>
                                    <span className="lp-ai-banner__card-name"
                                        style={m.name === 'Grok 3' ? { color: TEAL } : {}}>
                                        {m.name}
                                    </span>
                                </div>
                                <div className="lp-ai-banner__card-pick" style={{ color: m.pickColor }}>
                                    {m.pick}
                                </div>
                                <div className="lp-ai-banner__card-footer">
                                    <span className={`lp-model-card__confidence ${m.confClass}`}
                                        style={m.confStyle}>
                                        <Zap size={11} /> {m.confidence}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
