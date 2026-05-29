import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeroSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const scrollToHow = () =>
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    return (
        <section className="lp-hero">
            {/* cinematic vignette + grain — replaces the old pulsing radial glows */}
            <div className="lp-hero__vignette" aria-hidden="true" />
            <div className="lp-hero__grain" aria-hidden="true" />
            <div className="lp-hero__grid" aria-hidden="true" />
            <div className="lp-hero__fade-bottom" aria-hidden="true" />

            <div className="lp-hero__content">
                <div className="lp-hero__badge"><span className="lp-hero__badge-dot" /> {t('hero.badge')}</div>
                <h1 className="lp-hero__title">
                    <span className="lp-hero__title-main">
                        {t('hero.title_main')} <span className="lp-hero__title-red">{t('hero.title_main_red')}</span>
                    </span>
                    <span className="lp-hero__title-accent">
                        <span className="lp-hero__title-red">{t('hero.title_accent_red1')}</span>{' '}
                        {t('hero.title_accent_white')}{' '}
                        <span className="lp-hero__title-red">{t('hero.title_accent_red2')}</span>
                    </span>
                </h1>
                <p className="lp-hero__desc">{t('hero.desc')}</p>
                <div className="lp-hero__ctas">
                    <button className="lp-btn lp-btn--primary" onClick={onSignIn}><Zap size={18} /> {t('hero.cta')}</button>
                    <button className="lp-btn lp-btn--ghost" onClick={scrollToHow}>{t('hero.cta_secondary')}</button>
                </div>
                <div className="lp-hero__trust"><ShieldCheck size={13} /> {t('hero.trust')}</div>
            </div>
        </section>
    );
}
