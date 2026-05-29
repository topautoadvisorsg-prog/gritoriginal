import React from 'react';
import { Target, Swords, Hand, Award, Lock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation, use3DTilt } from './hooks';

const METHODS = [
    { id: 'ko', label: 'KO/TKO', Icon: Swords, active: false },
    { id: 'sub', label: 'Submission', Icon: Hand, active: false },
    { id: 'dec', label: 'Decision', Icon: Award, active: true },
];

// Faithful reproduction of the real in-app pick flow:
// FighterComparisonCard (vertical cards) + FantasyPickSection ("Make Your
// Prediction" → method buttons → units → Lock In). Red corner = accent,
// blue corner = primary (cyan), exactly like the live FightDetail page.
function PicksMockup() {
    return (
        <div className="lp-t2-mockup lp-picks-mockup lp-picks-mockup--v2">
            <div className="lp-picks-mockup__header">
                <div className="lp-picks-mockup__header-left">
                    <span className="lp-picks-mockup__event-badge">MAIN EVENT</span>
                    <span className="lp-picks-mockup__event">UFC 312 · LW TITLE</span>
                </div>
                <span className="lp-picks-mockup__live">● OPEN</span>
            </div>

            {/* Fighter comparison cards — mirror of FighterComparisonCard */}
            <div className="lp-picks-mockup__matchup-v2">
                <div className="lp-pick-card lp-pick-card--red lp-pick-card--selected">
                    <span className="lp-pick-card__strip" aria-hidden="true" />
                    <div className="lp-pick-card__badge">
                        <Target size={10} /> YOUR PICK
                    </div>
                    <div className="lp-pick-card__photo">
                        <img src="/fighters/fighter-1.png" alt="" loading="lazy" />
                    </div>
                    <div className="lp-pick-card__name">Islam Makhachev</div>
                    <div className="lp-pick-card__nick">"The Eagle's Heir"</div>
                    <div className="lp-pick-card__record-row">
                        <span className="lp-pick-card__record">26-1</span>
                        <span className="lp-pick-card__streak">
                            <TrendingUp size={10} /> W14
                        </span>
                    </div>
                    <div className="lp-pick-card__ml lp-pick-card__ml--red">−240</div>
                </div>

                <div className="lp-picks-mockup__vs-v2">
                    <span className="lp-picks-mockup__vs-label">VS</span>
                    <span className="lp-picks-mockup__rounds">5 RNDS</span>
                </div>

                <div className="lp-pick-card lp-pick-card--blue">
                    <span className="lp-pick-card__strip lp-pick-card__strip--blue" aria-hidden="true" />
                    <div className="lp-pick-card__photo lp-pick-card__photo--mirror">
                        <img src="/fighters/fighter-4.png" alt="" loading="lazy" />
                    </div>
                    <div className="lp-pick-card__name">Charles Oliveira</div>
                    <div className="lp-pick-card__nick">"do Bronx"</div>
                    <div className="lp-pick-card__record-row">
                        <span className="lp-pick-card__record">35-10</span>
                        <span className="lp-pick-card__streak lp-pick-card__streak--win">
                            <TrendingUp size={10} /> W3
                        </span>
                    </div>
                    <div className="lp-pick-card__ml lp-pick-card__ml--blue">+195</div>
                </div>
            </div>

            {/* Make Your Prediction — mirror of FantasyPickSection */}
            <div className="lp-picks-mockup__predict">
                <div className="lp-picks-mockup__predict-head">
                    <div className="lp-picks-mockup__predict-icon">
                        <Target size={13} />
                    </div>
                    <div>
                        <div className="lp-picks-mockup__predict-title">Make Your Prediction</div>
                        <div className="lp-picks-mockup__predict-sub">How will Makhachev win?</div>
                    </div>
                </div>

                <div className="lp-picks-mockup__method-grid">
                    {METHODS.map(({ id, label, Icon, active }) => (
                        <button
                            key={id}
                            type="button"
                            className={`lp-method-card${active ? ' lp-method-card--active' : ''}`}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="lp-picks-mockup__confidence">
                <span className="lp-picks-mockup__conf-label">HOW MANY UNITS?</span>
                <div className="lp-picks-mockup__conf-units">
                    {[1, 2, 3, 4, 5].map((u) => (
                        <button
                            key={u}
                            type="button"
                            className={`lp-conf-unit${u === 3 ? ' lp-conf-unit--active' : ''}`}
                        >
                            {u}u
                        </button>
                    ))}
                </div>
            </div>

            <button type="button" className="lp-picks-mockup__lock">
                <Lock size={14} /> LOCK IN PREDICTION
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
