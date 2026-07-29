import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Brain,
  Calendar,
  History,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Newspaper,
  Settings,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';

interface MobileNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  activePrefixes?: string[];
}

const primaryNavItems: MobileNavItem[] = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/event',
    icon: Calendar,
    label: 'Events',
  },
  {
    to: '/fighter/index',
    icon: User,
    label: 'Fighters',
    activePrefixes: ['/fighter'],
  },
  {
    to: '/groups',
    icon: Users,
    label: 'Groups',
  },
  {
    to: '/competition',
    icon: Trophy,
    label: 'Rankings',
  },
];

const secondaryNavItems: MobileNavItem[] = [
  {
    to: '/history',
    icon: History,
    label: 'History',
  },
  {
    to: '/news',
    icon: Newspaper,
    label: 'News',
  },
  {
    to: '/ai',
    icon: Brain,
    label: 'AI Analyst',
  },
  {
    to: '/chat',
    icon: MessageSquare,
    label: 'Chat',
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
  },
];

const routesWithoutMobileNav = [
  '/admin',
  '/sign-in',
  '/sign-up',
  '/tos',
  '/privacy',
  '/cookie',
  '/creator-agreement',
  '/aup',
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  const shouldHide = routesWithoutMobileNav.some((path) => (
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  ));

  if (shouldHide) {
    return null;
  }

  const isItemActive = (item: MobileNavItem) => {
    if (item.activePrefixes?.some((prefix) => location.pathname.startsWith(prefix))) {
      return true;
    }

    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  const isMoreActive = secondaryNavItems.some(isItemActive);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 shadow-[0_-18px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl safe-area-bottom md:hidden"
      aria-label="Mobile primary navigation"
    >
      <div className="grid grid-cols-6 items-stretch">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2',
                'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
                isActive
                  ? 'text-[#E8A020]'
                  : 'text-white/40 hover:text-white/60'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive && 'drop-shadow-[0_0_8px_rgba(232,160,32,0.5)]'
                )}
              />
              <span className="max-w-full truncate text-[8px] font-black uppercase leading-none tracking-[0.08em]">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8A020] rounded-t-full" />
              )}
            </Link>
          );
        })}

        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger
            className={cn(
              'relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2',
              'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
              isMoreActive || isMoreOpen
                ? 'text-[#E8A020]'
                : 'text-white/40 hover:text-white/60'
            )}
            aria-label="Open more navigation"
            aria-pressed={isMoreActive || isMoreOpen}
          >
            <MoreHorizontal
              className={cn(
                'h-5 w-5 shrink-0',
                (isMoreActive || isMoreOpen) && 'drop-shadow-[0_0_8px_rgba(232,160,32,0.5)]'
              )}
            />
            <span className="max-w-full truncate text-[8px] font-black uppercase leading-none tracking-[0.08em]">
              More
            </span>
            {(isMoreActive || isMoreOpen) && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8A020] rounded-t-full" />
            )}
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl border-white/10 bg-black/95 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5"
          >
            <SheetHeader className="pr-10 text-left">
              <SheetTitle className="display-font text-2xl font-black italic tracking-tight text-primary">
                GRIT Menu
              </SheetTitle>
              <SheetDescription>
                More ways to move through the app on mobile.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);

                return (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        'flex min-h-[64px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200',
                        isActive
                          ? 'border-primary/60 bg-primary/15 text-primary shadow-[0_0_18px_rgba(232,160,32,0.12)]'
                          : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-[0.12em]">
                        {item.label}
                      </span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
