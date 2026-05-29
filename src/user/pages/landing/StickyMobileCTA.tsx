import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Persistent signup bar pinned to the bottom on mobile — appears after the
 * hero scrolls out of view. Standard high-conversion pattern on gamified
 * pick'em apps (DraftKings, Underdog). Hidden on desktop via CSS.
 */
export function StickyMobileCTA({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > (window.innerHeight || 800) * 0.9);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className={`lp-sticky-cta${visible ? ' lp-sticky-cta--visible' : ''}`}>
            <span className="lp-sticky-cta__hook">{t('hero.badge')}</span>
            <button className="lp-btn lp-btn--primary lp-sticky-cta__btn" onClick={onSignIn}>
                <Zap size={16} /> {t('hero.cta')}
            </button>
        </div>
    );
}
