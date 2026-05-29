import React from 'react';
import { Lock, Target, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation, use3DTilt } from './hooks';

const METHODS = [
    { label: 'KO / TKO', active: false },
    { label: 'Submission', active: false },
    { label: 'Decision', active: true },
];

function PicksMockup() {
    return (
        <div className="lp-t2-mockup lp-picks-mockup lp-picks-mockup--v2">
            <div className="lp-picks-mockup__header">
                <div className="lp-picks-mockup__header-left">
                    <span className="lp-picks-mockup__event-badge">MAIN EVENT</span>
                    <span className="lp-picks-mockup__event">UFC 312 · LW Championship</span>
                </div>
                <span className="lp-picks-mockup__live">● OPEN</span>
            </div>

            {/* New 2-up fighter cards with photos */}
            <div className="lp-picks-mockup__matchup-v2">
                <button
                    type="button"
                    className="lp-pick-card lp-pick-card--red lp-pick-card--selected"
                    aria-label="Pick Makhachev"
                >
                    <div className="lp-pick-card__photo">
                        <img src="/fighters/fighter-1.png" alt="" loading="lazy" />
                    </div>
                    <div className="lp-pick-card__body">
                        <div className="lp-pick-card__flag">🇷🇺</div>
                        <div className="lp-pick-card__name">MAKHACHEV</div>
                        <div className="lp-pick-card__odds">−240</div>
                        <div className="lp-pick-card__corner">RED CORNER</div>
                    </div>
                    <div className="lp-pick-card__check" aria-hidden="true">
                        <Lock size={11} /> LOCKED
                    </div>
                </button>

                <div className="lp-picks-mockup__vs-v2">
                    <span className="lp-picks-mockup__vs-label">VS</span>
                    <span className="lp-picks-mockup__rounds">5 RNDS</span>
                </div>

                <button
                    type="button"
                    className="lp-pick-card lp-pick-card--blue"
                    aria-label="Pick Oliveira"
                >
                    <div className="lp-pick-card__photo lp-pick-card__photo--mirror">
                        <img src="/fighters/fighter-4.png" alt="" loading="lazy" />
                    </div>
                    <div className="lp-pick-card__body">
                        <div className="lp-pick-card__flag">🇧🇷</div>
                        <div className="lp-pick-card__name">OLIVEIRA</div>
                        <div className="lp-pick-card__odds lp-pick-card__odds--blue">+195</div>
                        <div className="lp-pick-card__corner lp-pick-card__corner--blue">BLUE CORNER</div>
                    </div>
                </button>
            </div>

            <div className="lp-picks-mockup__methods">
                <span className="lp-picks-mockup__methods-label">METHOD</span>
                <div className="lp-picks-mockup__method-pills">
                    {METHODS.map((m) => (
                        <button
                            key={m.label}
                            type="button"
                            className={`lp-method-pill${m.active ? ' lp-method-pill--active' : ''}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="lp-picks-mockup__confidence">
                <span className="lp-picks-mockup__conf-label">CONFIDENCE</span>
                <div className="lp-picks-mockup__conf-units">
                    <button type="button" className="lp-conf-unit">1u</button>
                    <button type="button" className="lp-conf-unit">2u</button>
                    <button type="button" className="lp-conf-unit lp-conf-unit--active">3u</button>
                    <button type="button" className="lp-conf-unit">4u</button>
                    <button type="button" className="lp-conf-unit">5u</button>
                </div>
            </div>

            <button type="button" className="lp-picks-mockup__lock">
                <Lock size={14} /> LOCK IN PICK <ChevronRight size={14} />
            </button>
        </div>
    );
}

export function EventPicksSection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt = use3DTilt();

    return (
        <section className="lp-showcase lp-showcase--reverse lp-event-picks" ref={ref}>
            <div className="lp-showcase__inner">
                <div
                    className="lp-showcase__visual lp-animate lp-animate-delay-2"
                    ref={tilt.ref}
                    onMouseMove={tilt.onMouseMove}
                    onMouseLeave={tilt.onMouseLeave}
                >
                    <PicksMockup />
                </div>
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label">
                        <Target size={14} /> {t('event_picks.label')}
                    </span>
                    <h3>{t('event_picks.title')}</h3>
                    <p>{t('event_picks.desc')}</p>
                    <div className="lp-showcase__features">
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--red">1</div>
                            {t('event_picks.feat1')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--gold">2</div>
                            {t('event_picks.feat2')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan">3</div>
                            {t('event_picks.feat3')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--green">
                                <Lock size={13} />
                            </div>
                            {t('event_picks.feat4')}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
