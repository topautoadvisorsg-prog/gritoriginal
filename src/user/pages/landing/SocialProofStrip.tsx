import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

const FALLBACK_ITEMS = [
    { emoji: '⚡', content: 'Makhachev training camp day 14 — wrestling sharp — odds holding at -420' },
    { emoji: '🏕️', content: 'Topuria weight cut green — no flags — 48hrs to fight night' },
    { emoji: '📊', content: 'UFC 316 full card confirmed — 12 bouts, three title fights' },
    { emoji: '📉', content: 'Jones injury update — no return timeline given by management' },
    { emoji: '📈', content: 'Yan camp: striking volume up 22% — expect early pressure' },
    { emoji: '⚡', content: 'Holloway signed for UFC 318 headliner — city TBC' },
    { emoji: '🔴', content: 'Izzy drops to middleweight — opens -180 favourite vs Whittaker' },
    { emoji: '🏕️', content: 'Poirier retirement press conference scheduled — Chicago' },
    { emoji: '📊', content: "O'Malley vs Dvalishvili 2 in talks — Q3 target date" },
    { emoji: '⚡', content: 'Volk vs Gaethje sharp action — odds moving toward Gaethje' },
    { emoji: '🧠', content: 'AI model accuracy this week: Grok 3 leads at 76.4%' },
    { emoji: '🏆', content: 'Global leaderboard update — top 10 all within 12 units' },
];

interface FeedItem {
    id: string;
    emoji: string;
    content: string;
}

export function SocialProofStrip() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const [items, setItems] = useState(FALLBACK_ITEMS);

    useEffect(() => {
        fetch('/api/intel-feed')
            .then((r) => r.json())
            .then((data: FeedItem[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setItems(data.map((d) => ({ emoji: d.emoji, content: d.content })));
                }
            })
            .catch(() => {});
    }, []);

    const doubled = [...items, ...items];

    return (
        <section className="lp-section lp-intel-section" ref={ref}>
            <div className="lp-section__inner">
                <div className="lp-intel-section__heading lp-animate">
                    <span className="lp-intel-section__dot" />
                    <span className="lp-intel-section__title">{t('intel_section.title')}</span>
                    <span className="lp-intel-section__sub">{t('intel_section.sub')}</span>
                </div>
            </div>
            <div className="lp-ticker">
                <div className="lp-ticker__label">
                    <span className="lp-ticker__dot" />
                    {t('intel_section.title')}
                </div>
                <div className="lp-ticker__track">
                    <div className="lp-ticker__inner">
                        {doubled.map((item, i) => (
                            <span key={i} className="lp-ticker__item">
                                {item.emoji} {item.content}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
