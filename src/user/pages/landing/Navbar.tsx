import React, { useEffect, useState, useRef } from 'react';
import { Swords, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

function LanguageSelector() {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) || LANGUAGES[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="lp-lang" ref={ref}>
            <button
                className="lp-lang__trigger"
                onClick={() => setOpen(o => !o)}
                aria-label="Select language"
            >
                <Globe size={16} />
                <span className="lp-lang__current">{currentLang.flag}</span>
            </button>
            {open && (
                <ul className="lp-lang__dropdown">
                    {LANGUAGES.map(lang => (
                        <li key={lang.code}>
                            <button
                                className={`lp-lang__option ${i18n.language.startsWith(lang.code) ? 'lp-lang__option--active' : ''}`}
                                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                            >
                                <span className="lp-lang__flag">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function Navbar({ onSignIn }: { onSignIn: () => void }) {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);
    const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    return (
        <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
            <div className="lp-nav__inner">
                <div className="lp-nav__brand">
                    <div className="lp-nav__logo"><Swords size={20} color="white" /></div>
                    <span className="lp-nav__name">GRIT</span>
                </div>
                <div className="lp-nav__links">
                    <span className="lp-nav__link lp-nav__link--desktop" onClick={() => go('features')}>{t('nav.features')}</span>
                    <span className="lp-nav__link lp-nav__link--desktop" onClick={() => go('how-it-works')}>{t('nav.how_it_works')}</span>
                    <span className="lp-nav__link lp-nav__link--desktop" onClick={() => go('pricing')}>{t('nav.pricing')}</span>
                    <LanguageSelector />
                    <span className="lp-nav__link lp-nav__login" onClick={onSignIn}>{t('common.login')}</span>
                    <button className="lp-btn lp-btn--primary lp-nav__cta" onClick={onSignIn}>{t('nav.get_started')}</button>
                </div>
            </div>
        </nav>
    );
}
