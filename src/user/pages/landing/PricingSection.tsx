import React from 'react';
import { Zap, Check, X, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

export function PricingSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const ref = useScrollAnimation();

    const contenderFeatures = [
        t('pricing.free_feat1'),
        t('pricing.free_feat2'),
        t('pricing.free_feat3'),
        t('pricing.free_feat4'),
        t('pricing.free_feat5'),
    ];

    const challengerFeatures = [
        t('pricing.plus_feat1'),
        t('pricing.plus_feat2'),
        t('pricing.plus_feat3'),
        t('pricing.plus_feat4'),
        t('pricing.plus_feat5'),
        t('pricing.plus_feat6'),
        t('pricing.plus_feat7'),
    ];

    const tokenPacks = [
        {
            label: t('pricing.tokens_pack1_label'),
            price: t('pricing.tokens_pack1_price'),
            value: t('pricing.tokens_pack1_value'),
            rate: t('pricing.tokens_pack1_rate'),
            badge: null as string | null,
        },
        {
            label: t('pricing.tokens_pack2_label'),
            price: t('pricing.tokens_pack2_price'),
            value: t('pricing.tokens_pack2_value'),
            rate: t('pricing.tokens_pack2_rate'),
            badge: null as string | null,
        },
        {
            label: t('pricing.tokens_pack3_label'),
            price: t('pricing.tokens_pack3_price'),
            value: t('pricing.tokens_pack3_value'),
            rate: t('pricing.tokens_pack3_rate'),
            badge: t('pricing.tokens_pack3_badge'),
        },
    ];

    const compareRows = [
        { feature: t('pricing.compare_feat1'), contender: true, challenger: true },
        { feature: t('pricing.compare_feat2'), contender: true, challenger: true },
        { feature: t('pricing.compare_feat3'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat4'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat5'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat6'), contender: false, challenger: true },
        { feature: t('pricing.compare_feat7'), contender: false, challenger: true },
    ];

    return (
        <section className="lp-section lp-pricing" id="pricing" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-animate" style={{ textAlign: 'center' }}>
                    <span className="lp-section-label"><Zap size={14} /> {t('pricing.label')}</span>
                    <h2 className="lp-section-title" style={{ margin: '0 auto 12px' }}>{t('pricing.title')}</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', maxWidth: 640, margin: '0 auto 28px' }}>
                        {t('pricing.subtitle')}
                    </p>
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

                {/* AI Token Add-On — separate purchase, Challenger-gated */}
                <div className="lp-animate lp-animate-delay-4" style={{ marginTop: 56, padding: '32px 24px', background: 'rgba(0, 201, 255, 0.04)', border: '1px solid rgba(0, 201, 255, 0.18)', borderRadius: 10 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <span className="lp-section-label" style={{ justifyContent: 'center', color: 'rgb(0, 201, 255)' }}>
                            <Coins size={14} /> {t('pricing.tokens_label')}
                        </span>
                        <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.5px', margin: '12px 0 8px' }}>
                            {t('pricing.tokens_title')}
                        </h3>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
                            {t('pricing.tokens_subtitle')}
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {tokenPacks.map((pack, i) => (
                            <div key={i} style={{
                                padding: '18px 16px',
                                background: 'rgba(20, 20, 28, 0.55)',
                                border: pack.badge
                                    ? '1px solid rgba(0, 201, 255, 0.6)'
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 8,
                                position: 'relative',
                                textAlign: 'center',
                            }}>
                                {pack.badge && (
                                    <div style={{
                                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                                        padding: '3px 10px',
                                        background: 'rgb(0, 201, 255)',
                                        color: 'hsl(220 25% 8%)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
                                        borderRadius: 4,
                                    }}>{pack.badge}</div>
                                )}
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                                    {pack.label}
                                </div>
                                <div style={{ fontSize: 30, fontWeight: 800, color: 'rgb(0, 201, 255)', marginBottom: 4 }}>
                                    {pack.price}
                                </div>
                                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', marginBottom: 2 }}>
                                    {pack.value}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {pack.rate}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
