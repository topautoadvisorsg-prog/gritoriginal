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
                    <span className="lp-intel-section__title">{isLiveFeed ? t('intel_section.title') : 'INTELLIGENCE FEED PREVIEW'}</span>
                    <span className="lp-intel-section__sub">{isLiveFeed ? t('intel_section.sub') : 'Examples of operator-curated signals available in GRIT'}</span>
                </div>
            </div>
            <div className="lp-ticker">
                <div className="lp-ticker__label">
                    <span className="lp-ticker__dot" />
                    {isLiveFeed ? 'INTEL' : 'EXAMPLE'}
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
