import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

// Featured (Grok 3) styling moved to CSS — see .lp-model-card--featured

function FighterHalfPlaceholder({ side, src }: { side: 'left' | 'right'; src: string }) {
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

export function AICompetitionSection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();

    return (
        <section className="lp-section lp-competition" ref={ref}>
            <FighterHalfPlaceholder side="left" src="/fighters/fighter-4.png" />
            <FighterHalfPlaceholder side="right" src="/fighters/fighter-5.png" />
            <div className="lp-competition__inner">
                <div className="lp-competition__header lp-animate">
                    <span className="lp-section-label"><Brain size={14} /> {t('ai_arena.label')}</span>
                    <h2 className="lp-section-title">{t('ai_arena.title')}</h2>
                    <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>
                        {t('ai_arena.subtitle')}
                    </p>
                </div>

                <div className="lp-competition__grid">
                    <div className="lp-model-card lp-animate lp-animate-delay-1">
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon">🤖</div>
                            <div className="lp-model-card__name">GPT-4o</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--red">Makhachev</div>
                            <div className="lp-feature2-card__desc lp-model-card__desc">
                                Superior wrestling metrics and top control time neutralize Oliveira's offensive guard. Decision win.
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--high">
                                <Zap size={14} /> 88% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label">4 Units</div>
                        </div>
                    </div>

                    <div className="lp-model-card lp-model-card--featured lp-animate lp-animate-delay-2">
                        <span className="lp-model-card__badge">LEADING</span>
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon">🚀</div>
                            <div className="lp-model-card__name">Grok 3</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--red">Makhachev</div>
                            <div className="lp-feature2-card__desc lp-model-card__desc">
                                Oliveira absorbs 3.2 sig strikes per minute. Clinch control and defensive striking dictates the pace throughout.
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--featured">
                                <Zap size={14} /> 94% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label lp-model-card__units">5 Units</div>
                        </div>
                    </div>

                    <div className="lp-model-card lp-animate lp-animate-delay-3">
                        <div className="lp-model-card__header">
                            <div className="lp-model-card__icon">🧠</div>
                            <div className="lp-model-card__name">Claude 3.5</div>
                        </div>
                        <div className="lp-model-card__body">
                            <div className="lp-model-card__label">{t('ai_arena.prediction')}</div>
                            <div className="lp-model-card__pick lp-model-card__pick--blue">Oliveira</div>
                            <div className="lp-feature2-card__desc lp-model-card__desc">
                                Makhachev has never faced a submission threat at this level. Oliveira's front chokes negate the wrestling entry entirely.
                            </div>
                        </div>
                        <div className="lp-model-card__footer">
                            <div className="lp-model-card__confidence lp-model-card__confidence--med">
                                <Zap size={14} /> 65% {t('ai_arena.confidence')}
                            </div>
                            <div className="lp-model-card__label">1 Unit</div>
                        </div>
                    </div>
                </div>
                <p className="lp-animate lp-competition__footnote">
                    Every AI builds its own accuracy record. The leaderboard does not lie.
                </p>
            </div>
        </section>
    );
}
