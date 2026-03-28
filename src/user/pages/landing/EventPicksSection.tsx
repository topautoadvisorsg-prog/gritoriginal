import React from 'react';
import { Lock, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation, use3DTilt } from './hooks';

const METHODS = [
    { label: 'KO / TKO', active: false },
    { label: 'Submission', active: false },
    { label: 'Decision', active: true },
];

function PicksMockup() {
    return (
        <div className="lp-t2-mockup lp-picks-mockup">
            <div className="lp-picks-mockup__header">
                <span className="lp-picks-mockup__event">UFC 312 · LW Championship</span>
                <span className="lp-picks-mockup__live">● OPEN</span>
            </div>
            <div className="lp-picks-mockup__matchup">
                <div className="lp-picks-mockup__fighter lp-picks-mockup__fighter--selected">
                    <div className="lp-picks-mockup__flag">🇷🇺</div>
                    <div className="lp-picks-mockup__name">MAKHACHEV</div>
                    <div className="lp-picks-mockup__odds">-240</div>
                </div>
                <div className="lp-picks-mockup__vs">VS</div>
                <div className="lp-picks-mockup__fighter">
                    <div className="lp-picks-mockup__flag">🇧🇷</div>
                    <div className="lp-picks-mockup__name">OLIVEIRA</div>
                    <div className="lp-picks-mockup__odds">+195</div>
                </div>
            </div>
            <div className="lp-picks-mockup__methods">
                <span className="lp-picks-mockup__methods-label">METHOD</span>
                <div className="lp-picks-mockup__method-pills">
                    {METHODS.map((m) => (
                        <button
                            key={m.label}
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
                    <button className="lp-conf-unit">1u</button>
                    <button className="lp-conf-unit">2u</button>
                    <button className="lp-conf-unit lp-conf-unit--active">3u</button>
                    <button className="lp-conf-unit">4u</button>
                    <button className="lp-conf-unit">5u</button>
                </div>
            </div>
            <button className="lp-picks-mockup__lock">
                <Lock size={12} /> LOCK IN PICK
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
