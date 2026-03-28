import React, { useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { userNavItems } from '@/shared/config/navigation';

export const TopTabNavigation: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const { t } = useTranslation();

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative w-full bg-background border-b border-white/5 flex items-center" style={{ height: '56px' }}>

            {/* Left Scroll Arrow (Desktop) */}
            <button
                onClick={() => handleScroll('left')}
                className="hidden md:flex absolute left-0 z-10 w-12 h-full items-center justify-center bg-gradient-to-r from-background via-background/90 to-transparent text-white/30 hover:text-white/70 transition-colors"
            >
                <ChevronLeft className="w-5 h-5 ml-2" />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex-1 flex items-center overflow-x-auto scroll-smooth gap-8 px-4 md:px-12 h-full [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {userNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={cn(
                                "relative flex-shrink-0 flex items-center gap-2 h-full transition-all duration-300 py-4 whitespace-nowrap group",
                                isActive
                                    ? "text-[#E8A020]"
                                    : "text-white/40 hover:text-white/80"
                            )}
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{t(item.labelKey)}</span>
                            
                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E8A020] animate-in slide-in-from-bottom-1 fade-in duration-300 shadow-[0_0_10px_rgba(232,160,32,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Right Scroll Arrow (Desktop) */}
            <button
                onClick={() => handleScroll('right')}
                className="hidden md:flex absolute right-0 z-10 w-12 h-full items-center justify-center bg-gradient-to-l from-background via-background/90 to-transparent text-white/30 hover:text-white/70 transition-colors"
            >
                <ChevronRight className="w-5 h-5 mr-2" />
            </button>

        </div>
    );
};
