import React from 'react';
import { Swords, ChevronRight, ShieldCheck } from 'lucide-react';
import { useScrollAnimation } from './hooks';
import { useTranslation } from 'react-i18next';

function FighterPlaceholder({ side, src }: { side: 'left' | 'right'; src: string }) {
    return (
        <div className={`lp-footer-cta__fighter-${side}`} aria-hidden="true">
            <img
                src={src}
                alt=""
                className={`lp-fighter-photo lp-fighter-photo--footer lp-fighter-photo--${side}`}
                loading="lazy"
            />
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
                <FighterPlaceholder side="left" src="/fighters/fighter-6.png" />
                <FighterPlaceholder side="right" src="/fighters/fighter-1.png" />
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
                    <div className="lp-footer-cta__trust"><ShieldCheck size={13} /> {t('footer_cta.trust')}</div>
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
