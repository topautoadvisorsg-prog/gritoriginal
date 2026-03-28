import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Swords, Users, Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const navItems = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/event',
    icon: Swords,
    label: 'Events',
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

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-black border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-4 min-w-[64px] min-h-[48px]',
                'transition-all duration-200',
                isActive
                  ? 'text-[#E8A020]'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 mb-1',
                  isActive && 'drop-shadow-[0_0_8px_rgba(232,160,32,0.5)]'
                )}
              />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E8A020] rounded-t-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
