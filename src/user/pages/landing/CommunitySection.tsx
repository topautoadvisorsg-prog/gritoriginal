import React from 'react';
import { MessageSquare, Globe, Image, Zap, Award, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation, use3DTilt } from './hooks';

function ChatMockup() {
    const msgs = [
        { user: 'NightHawk', initials: 'NH', time: '2m', text: 'Makhachev by decision, no question 🔒', highlight: false },
        { user: 'MatWarrior', initials: 'MW', time: '1m', text: 'Oliveira by sub R2, book it. Front choke all day', highlight: false },
        { user: 'StrikeForce', initials: 'SF', time: '30s', text: "+180 on the upset. I'm in 🔥", highlight: true },
    ];
    return (
        <div className="lp-t2-mockup lp-chat-mockup">
            <div className="lp-chat-mockup__header">
                <span className="lp-chat-mockup__title">EVENT FIGHT CHAT</span>
                <span className="lp-picks-mockup__live">PREVIEW</span>
            </div>
            <div className="lp-chat-mockup__msgs">
                {msgs.map((m, i) => (
                    <div key={i} className={`lp-chat-msg${m.highlight ? ' lp-chat-msg--hot' : ''}`}>
                        <div className="lp-chat-msg__avatar">{m.initials}</div>
                        <div className="lp-chat-msg__body">
                            <div className="lp-chat-msg__meta">
                                <span className="lp-chat-msg__user">{m.user}</span>
                                <span className="lp-chat-msg__time">{m.time} ago</span>
                            </div>
                            <div className="lp-chat-msg__text">{m.text}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="lp-chat-mockup__input">
                <div className="lp-chat-mockup__input-field">Your take...</div>
            </div>
        </div>
    );
}

export function CommunitySection() {
    const { t } = useTranslation();
    const ref = useScrollAnimation();
    const tilt = use3DTilt();

    const premiumFeatures = [
        { icon: Globe, labelKey: 'community.feat1_label', descKey: 'community.feat1_desc' },
        { icon: Image, labelKey: 'community.feat2_label', descKey: 'community.feat2_desc' },
        { icon: Award, labelKey: 'community.feat3_label', descKey: 'community.feat3_desc' },
        { icon: Smile, labelKey: 'community.feat4_label', descKey: 'community.feat4_desc' },
        { icon: Zap, labelKey: 'community.feat5_label', descKey: 'community.feat5_desc' },
    ];

    return (
        <section className="lp-showcase lp-community" ref={ref}>
            <div className="lp-showcase__inner">
                <div className="lp-showcase__text lp-animate">
                    <span className="lp-section-label">
                        <MessageSquare size={14} /> {t('community.label')}
                    </span>
                    <h3>{t('community.title')}</h3>
                    <p>{t('community.desc')}</p>
                    <div className="lp-community__features">
                        {premiumFeatures.map(({ icon: Icon, labelKey, descKey }) => (
                            <div key={labelKey} className="lp-community__feat">
                                <div className="lp-showcase__feat-icon lp-showcase__feat-icon--cyan">
                                    <Icon size={14} />
                                </div>
                                <div>
                                    <div className="lp-community__feat-label">{t(labelKey)}</div>
                                    <div className="lp-community__feat-desc">{t(descKey)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    className="lp-showcase__visual lp-animate lp-animate-delay-2"
                    ref={tilt.ref}
                    onMouseMove={tilt.onMouseMove}
                    onMouseLeave={tilt.onMouseLeave}
                >
                    <ChatMockup />
                </div>
            </div>
        </section>
    );
}
