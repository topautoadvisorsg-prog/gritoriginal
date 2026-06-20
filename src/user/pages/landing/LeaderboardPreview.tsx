import React from 'react';
import { Trophy, Crown, BarChart3, Shield, TrendingUp, Award } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';
import { NinjaBadge, SamuraiBadge, MasterBadge, GoatBadge } from './Badges';

// Ranked by NET UNITS only — the single metric the real leaderboard uses
// ("Just pure net units. Highest net units = Rank 1.")
const LB = [
    { rank: 1, name: 'Challenger 01', units: '+24.8u', BadgeComponent: GoatBadge, rc: 'lp-lb__rank--gold' },
    { rank: 2, name: 'Challenger 02', units: '+21.1u', BadgeComponent: MasterBadge, rc: 'lp-lb__rank--silver' },
    { rank: 3, name: 'Challenger 03', units: '+19.3u', BadgeComponent: SamuraiBadge, rc: 'lp-lb__rank--bronze' },
    { rank: 4, name: 'Challenger 04', units: '+16.7u', BadgeComponent: NinjaBadge, rc: '' },
    { rank: 5, name: 'Challenger 05', units: '+15.1u', BadgeComponent: null, rc: '' },
];

const BADGE_TIERS = [
    { Badge: NinjaBadge, stars: 1, bg: 'hsl(210 25% 10%)', border: 'hsl(210 20% 25% / .5)' },
    { Badge: SamuraiBadge, stars: 2, bg: 'hsl(355 85% 50% / .06)', border: 'hsl(355 85% 50% / .2)' },
    { Badge: MasterBadge, stars: 4, bg: 'hsl(280 80% 55% / .06)', border: 'hsl(280 80% 55% / .2)' },
    { Badge: GoatBadge, stars: 5, bg: 'hsl(45 90% 55% / .08)', border: 'hsl(45 90% 55% / .25)' },
] as const;

export function LeaderboardPreview() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <section className="lp-section lp-competitive" id="competitive" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate">
                    <span className="lp-section-label"><Crown size={14} /> {t('leaderboard.label')}</span>
                    <h2 className="lp-section-title">{t('leaderboard.title')}<br />{t('leaderboard.title2')}</h2>
                </div>
                <div className="lp-competitive__layout">
                    <div className="lp-competitive__text lp-animate lp-animate-delay-1">
                        <h3>{t('leaderboard.subtitle')}</h3>
                        <p>{t('leaderboard.desc')}</p>
                        <div className="lp-competitive__highlights">
                            <div className="lp-highlight">
                                <div className="lp-highlight__icon"><BarChart3 size={20} /></div>
                                <span className="lp-highlight__text">{t('leaderboard.highlight1')}</span>
                            </div>
                            <div className="lp-highlight">
                                <div className="lp-highlight__icon"><Shield size={20} /></div>
                                <span className="lp-highlight__text">{t('leaderboard.highlight2')}</span>
                            </div>
                            <div className="lp-highlight">
                                <div className="lp-highlight__icon"><TrendingUp size={20} /></div>
                                <span className="lp-highlight__text">{t('leaderboard.highlight3')}</span>
                            </div>
                            <div className="lp-highlight">
                                <div className="lp-highlight__icon"><Award size={20} /></div>
                                <span className="lp-highlight__text">{t('leaderboard.highlight4')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="lp-lb lp-animate lp-animate-delay-3">
                        <div className="lp-lb__header">
                            <Trophy size={16} /> {t('leaderboard.header')}
                            <span className="lp-lb__live">PREVIEW</span>
                        </div>
                        {LB.map((e) => (
                            <div key={e.rank} className="lp-lb__row">
                                <span className={`lp-lb__rank ${e.rc}`}>#{e.rank}</span>
                                {e.BadgeComponent ? (
                                    <div className="lp-lb__badge-svg">
                                        <e.BadgeComponent size={32} showLabel={false} />
                                    </div>
                                ) : (
                                    <div className="lp-lb__avatar lp-lb__avatar--empty" />
                                )}
                                <span className="lp-lb__name">{e.name}</span>
                                <span className="lp-lb__units">{e.units}<small>{t('leaderboard.net_units')}</small></span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lp-lb-badge-grid lp-animate lp-animate-delay-4">
                    <div className="lp-lb-badge-grid__label">{t('leaderboard.badge_progression')}</div>
                    <div className="lp-lb-badge-grid__tiers">
                        {BADGE_TIERS.map(({ Badge, stars, bg, border }, i) => (
                            <div
                                key={i}
                                className="lp-lb-badge-grid__tier"
                                style={{ background: bg, border: `1px solid ${border}` }}
                            >
                                <Badge size={44} showLabel={true} />
                                <div className="lp-lb-badge-grid__stars">
                                    {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lp-lb-badge-grid__monthly">
                        <span style={{ color: 'hsl(45 90% 60%)', fontSize: '1.1rem', letterSpacing: 2 }}>★★★☆☆</span>
                        <span style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '.75rem', color: 'hsl(45 90% 60%)' }}>3 / 5 {t('leaderboard.stars_this_month')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
