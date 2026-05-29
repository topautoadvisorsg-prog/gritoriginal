import React from 'react';
import {
    Users, BarChart3, Flame, LineChart, Crosshair, Brain,
} from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';
import { NinjaBadge, SamuraiBadge, MasterBadge, GoatBadge } from './Badges';

const SCOUT_LINES = [
    'Grappling edge — 3.4 TD attempts / 15 min, 62% success rate.',
    'Defensive specialist — 91% takedown defense, elite top control.',
    'Striking liability — absorbs 3.2 sig strikes / min under high pressure.',
];

const BADGE_CHIPS = [
    { Badge: NinjaBadge, label: 'Ninja' },
    { Badge: SamuraiBadge, label: 'Samurai' },
    { Badge: MasterBadge, label: 'Master' },
    { Badge: GoatBadge, label: 'GOAT' },
] as const;

export function ShowcaseFighters() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-showcase lp-showcase--fighters lp-animate" ref={ref}>
            <div className="lp-showcase-fighters__bg" />
            <div className="lp-showcase__inner">
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label"><Crosshair size={14} /> {t('showcase_fighters.label')}</span>
                    <h3>{t('showcase_fighters.title')}</h3>
                    <p>{t('showcase_fighters.desc')}</p>
                    <div className="lp-showcase__features">
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan"><Users size={15} /></div>
                            {t('showcase_fighters.feat1')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--red"><Flame size={15} /></div>
                            {t('showcase_fighters.feat2')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--gold"><BarChart3 size={15} /></div>
                            {t('showcase_fighters.feat3')}
                        </div>
                        <div className="lp-showcase__feat">
                            <div className="lp-showcase__feat-icon lp-showcase__feat-icon--purple"><LineChart size={15} /></div>
                            {t('showcase_fighters.feat4')}
                        </div>
                    </div>
                </div>
                <div className="lp-showcase__visual lp-showcase-fighters__card lp-animate lp-animate-delay-2">
                    <div className="lp-showcase-fighters__card-inner">
                        <div className="lp-showcase-fighters__centerpiece">
                            <img
                                src="/fighters/fighter-1.png"
                                alt="Showcase fighter"
                                className="lp-fighter-photo lp-fighter-photo--centerpiece"
                                loading="lazy"
                            />
                            <div className="lp-showcase-fighters__centerpiece-overlay">
                                <div className="lp-showcase-fighters__name">Alex Volkanovski</div>
                                <div className="lp-showcase-fighters__record">26-4-0 · Featherweight</div>
                                <div className="lp-mock-fighter__tags" style={{ marginTop: 6 }}>
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--striker">Elite Striker</span>
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--ko">13 KOs</span>
                                    <span className="lp-mock-fighter__tag lp-mock-fighter__tag--champ">Ex-Champ</span>
                                </div>
                            </div>
                        </div>

                        <div className="lp-showcase-fighters__stats lp-showcase-fighters__stats--compact">
                            <div className="lp-mock-stat">
                                <div className="lp-mock-stat__label"><span>Striking Accuracy</span><span>94%</span></div>
                                <div className="lp-mock-stat__bar">
                                    <div className="lp-mock-stat__fill lp-mock-stat__fill--red lp-stat-animate"
                                        style={{ '--stat-w': '94%' } as React.CSSProperties} />
                                </div>
                            </div>
                            <div className="lp-mock-stat">
                                <div className="lp-mock-stat__label"><span>Cardio Rating</span><span>97%</span></div>
                                <div className="lp-mock-stat__bar">
                                    <div className="lp-mock-stat__fill lp-mock-stat__fill--gold lp-stat-animate"
                                        style={{ '--stat-w': '97%' } as React.CSSProperties} />
                                </div>
                            </div>
                            <div className="lp-mock-stat">
                                <div className="lp-mock-stat__label"><span>Sig. Strikes/min</span><span>8.2</span></div>
                                <div className="lp-mock-stat__bar">
                                    <div className="lp-mock-stat__fill lp-mock-stat__fill--cyan lp-stat-animate"
                                        style={{ '--stat-w': '82%' } as React.CSSProperties} />
                                </div>
                            </div>
                        </div>

                        <div className="lp-showcase-fighters__intel">
                            <div className="lp-showcase-fighters__intel-dot" />
                            <span>AI INTEL ACTIVE — 47 data points loaded</span>
                        </div>

                        <div className="lp-scout-brief">
                            <div className="lp-scout-brief__header">
                                <Brain size={12} style={{ color: 'hsl(45 90% 52%)' }} />
                                <span>AI SCOUT BRIEF</span>
                            </div>
                            <ul className="lp-scout-brief__lines">
                                {SCOUT_LINES.map((line, i) => (
                                    <li key={i}>{line}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="lp-badge-chips">
                            {BADGE_CHIPS.map(({ Badge, label }) => (
                                <div key={label} className="lp-badge-chip" title={label}>
                                    <Badge size={28} showLabel={false} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
