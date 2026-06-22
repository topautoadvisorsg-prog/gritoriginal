import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/use-auth';
import './LandingPage.css';

import { Navbar } from './landing/Navbar';
import { HeroSection } from './landing/HeroSection';
import { CoreFeaturesSection } from './landing/CoreFeaturesSection';
import { SocialProofStrip } from './landing/SocialProofStrip';
import { ShowcaseFighters } from './landing/ShowcaseSections';
import { AICompetitionBanner } from './landing/AICompetitionBanner';
import { LeaderboardPreview } from './landing/LeaderboardPreview';
import { CommunitySection } from './landing/CommunitySection';
import { EventPicksSection } from './landing/EventPicksSection';
import { HowItWorks } from './landing/HowItWorks';
import { FooterCTA } from './landing/FooterCTA';
import { StickyMobileCTA } from './landing/StickyMobileCTA';

export default function LandingPage() {
    const { login } = useAuth();
    const handleSignIn = () => login();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handler = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const vh = typeof window !== 'undefined' ? (window.innerHeight || 800) : 800;
    const overlayOpacity = Math.min(0.88, scrollY / (vh * 2));

    return (
        <div className="landing-page">
            <div
                className="lp-video-bg"
                role="img"
                aria-label="Empty mixed martial arts arena under broadcast lights"
            />
            <div
                className="lp-video-overlay"
                style={{ opacity: overlayOpacity }}
            />
            <Navbar onSignIn={handleSignIn} />
            <HeroSection onSignIn={handleSignIn} />
            <SocialProofStrip />
            <CoreFeaturesSection />
            <HowItWorks />
            <EventPicksSection />
            <ShowcaseFighters />
            <LeaderboardPreview />
            <AICompetitionBanner />
            <CommunitySection />
            <FooterCTA onSignIn={handleSignIn} />
            <StickyMobileCTA onSignIn={handleSignIn} />
        </div>
    );
}
