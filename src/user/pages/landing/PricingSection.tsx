import React from 'react';
import { Zap, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

export function PricingSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const ref = useScrollAnimation();

    const contenderFeatures = [
        t('pricing.free_feat1'),
        t('pricing.free_feat2'),
        t('pricing.free_feat3'),
    ];

    const challengerFeatures = [
        t('pricing.plus_feat1'),
        t('pricing.plus_feat2'),
        t('pricing.plus_feat3'),
        t('pricing.plus_feat4'),
        t('pricing.plus_feat5'),
    ];

    const compareRows = [
        { feature: t('pricing.compare_feat1'), contender: true, challenger: true },
        { feature: t('pricing.compare_feat2'), contender: true, challenger: true },
        { feature: t('pricing.compare_feat3'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat4'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat5'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat6'), contender: false, challenger: true },
    ];

    return (
        <section className="lp-section lp-pricing" id="pricing" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate" style={{ textAlign: 'center' }}>
                    <span className="lp-section-label"><Zap size={14} /> {t('pricing.label')}</span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 16px' }}>{t('pricing.title')}</h2>
                </div>
                <div className="lp-pricing__grid">
                    <div className="lp-price-card lp-animate lp-animate-delay-1">
                        <h3 className="lp-price-card__name">{t('pricing.free_name')}</h3>
                        <div className="lp-price-card__price">{t('pricing.free_price')} <span>{t('pricing.free_period')}</span></div>
                        <ul className="lp-price-card__features">
                            {contenderFeatures.map((f, i) => (
                                <li key={i}><span className="check"><Check size={11} /></span> {f}</li>
                            ))}
                        </ul>
                        <button className="lp-btn lp-btn--ghost" onClick={onSignIn} style={{ width: '100%', justifyContent: 'center' }}>
                            {t('pricing.free_cta')}
                        </button>
                    </div>

                    <div className="lp-price-card lp-price-card--featured lp-animate lp-animate-delay-2">
                        <span className="lp-price-card__popular">{t('pricing.plus_popular')}</span>
                        <h3 className="lp-price-card__name">{t('pricing.plus_name')}</h3>
                        <div className="lp-price-card__price">{t('pricing.plus_price')} <span>{t('pricing.plus_period')}</span></div>
                        <ul className="lp-price-card__features">
                            {challengerFeatures.map((f, i) => (
                                <li key={i}><span className="check"><Check size={11} /></span> {f}</li>
                            ))}
                        </ul>
                        <button className="lp-btn lp-btn--primary" onClick={onSignIn} style={{ width: '100%', justifyContent: 'center' }}>
                            <Zap size={16} /> {t('pricing.plus_cta')}
                        </button>
                    </div>
                </div>

                <div className="lp-compare-table lp-animate lp-animate-delay-3">
                    <div className="lp-compare-table__header">
                        <div className="lp-compare-table__feature-col">{t('pricing.compare_header')}</div>
                        <div className="lp-compare-table__tier-col">{t('pricing.free_name')}</div>
                        <div className="lp-compare-table__tier-col lp-compare-table__tier-col--featured">{t('pricing.plus_name')}</div>
                    </div>
                    {compareRows.map((row) => (
                        <div key={row.feature} className="lp-compare-table__row">
                            <div className="lp-compare-table__feature-col">{row.feature}</div>
                            <div className="lp-compare-table__tier-col">
                                {row.contender
                                    ? <Check size={15} className="lp-compare-check" />
                                    : <X size={14} className="lp-compare-cross" />
                                }
                            </div>
                            <div className="lp-compare-table__tier-col lp-compare-table__tier-col--featured">
                                {row.challenger
                                    ? <Check size={15} className="lp-compare-check" />
                                    : <X size={14} className="lp-compare-cross" />
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
