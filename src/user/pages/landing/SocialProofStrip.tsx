import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from './hooks';

const FALLBACK_ITEMS = [
    { emoji: '⚡', content: 'Camp update example - pace and conditioning trend noted' },
    { emoji: '📊', content: 'Card update example - bout order confirmed by the operator' },
    { emoji: '📉', content: 'Odds example - meaningful line movement flagged for review' },
    { emoji: '🧠', content: 'Model example - matchup confidence changed after new data' },
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
    const [isLiveFeed, setIsLiveFeed] = useState(false);

    useEffect(() => {
        fetch('/api/intel-feed')
            .then((r) => r.json())
            .then((data: FeedItem[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setItems(data.map((d) => ({ emoji: d.emoji, content: d.content })));
                    setIsLiveFeed(true);
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
                    <span className="lp-intel-section__title">{t(isLiveFeed ? 'intel_section.title' : 'intel_section.preview_title')}</span>
                    <span className="lp-intel-section__sub">{t(isLiveFeed ? 'intel_section.sub' : 'intel_section.preview_sub')}</span>
                </div>
            </div>
            <div className="lp-ticker">
                <div className="lp-ticker__label">
                    <span className="lp-ticker__dot" />
                    {t(isLiveFeed ? 'intel_section.live_badge' : 'intel_section.preview_badge')}
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
