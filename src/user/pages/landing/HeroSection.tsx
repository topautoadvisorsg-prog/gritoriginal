import React from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeroSection({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    return (
        <section className="lp-hero">
            <div className="lp-hero__bg" />
            <div className="lp-hero__scan" />
            <div className="lp-hero__grid" />
            <div className="lp-hero__octagon lp-hero__octagon--1" />
            <div className="lp-hero__octagon lp-hero__octagon--2" />
            <div className="lp-hero__octagon lp-hero__octagon--3" />
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
                    <div className="lp-hero__subtitle-wrap">{t('hero.subtitle')}</div>
                </div>
            </div>
        </section>
    );
}
