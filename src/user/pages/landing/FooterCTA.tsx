import React from 'react';
import { Swords, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

function FighterPlaceholder({ side }: { side: 'left' | 'right' }) {
    return (
        <div className={`lp-footer-cta__fighter-${side}`} aria-hidden="true">
            <div className="lp-footer-cta__fighter-placeholder">
                <div className="lp-footer-cta__fighter-placeholder-label">
                    <span className="lp-footer-cta__fighter-placeholder-icon">◈</span>
                    <span>FIGHTER PHOTO</span>
                    <span style={{ opacity: 0.5, fontSize: '.6rem' }}>Full body cutout</span>
                </div>
            </div>
        </div>
    );
}

export function FooterCTA({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    return (
        <>
            <section className="lp-section lp-footer-cta" ref={ref}>
                <div className="lp-footer-cta__glow" />
                <FighterPlaceholder side="left" />
                <FighterPlaceholder side="right" />
                <div className="lp-footer-cta__corner lp-footer-cta__corner--tl" />
                <div className="lp-footer-cta__corner lp-footer-cta__corner--tr" />
                <div className="lp-footer-cta__corner lp-footer-cta__corner--bl" />
                <div className="lp-footer-cta__corner lp-footer-cta__corner--br" />
                <div className="lp-section__inner lp-animate" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <h2 className="lp-footer-cta__title">
                        <span className="lp-hero__title-main">{t('footer_cta.title1')}</span>
                        <span className="lp-hero__title-accent" data-text={t('footer_cta.title2')}>{t('footer_cta.title2')}</span>
                    </h2>
                    <p className="lp-footer-cta__subtitle">{t('footer_cta.subtitle')}</p>
                    <button className="lp-btn lp-btn--primary" onClick={onSignIn}><Swords size={18} /> {t('footer_cta.cta')} <ChevronRight size={18} /></button>
                </div>
            </section>
            <footer className="lp-footer">
                <div className="lp-footer__inner">
                    <div className="lp-footer__brand">
                        <div className="lp-footer__logo"><Swords size={14} color="white" /></div>
                        <span className="lp-footer__name">GRIT</span>
                    </div>
                    <span className="lp-footer__copy">© {new Date().getFullYear()} GRIT. All rights reserved.</span>
                </div>
            </footer>
        </>
    );
}
