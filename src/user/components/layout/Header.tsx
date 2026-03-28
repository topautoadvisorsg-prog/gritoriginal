import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Search, Menu, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { UserMenu } from './UserMenu';
import { CountrySelector } from './CountrySelector';

interface HeaderProps {
  title: string;
  subtitle?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isSidebarCollapsed,
  onToggleSidebar,
  isAdmin = false,
}) => {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300',
        isAdmin ? (isSidebarCollapsed ? 'left-16' : 'left-64') : 'left-0'
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {isAdmin && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isSidebarCollapsed ? (
                <Menu className="h-5 w-5 text-muted-foreground" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}

          <div className={cn(!isAdmin && "pl-2")}>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('header.search_placeholder')}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
            />
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
            <CountrySelector />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
          </button>

          {/* Live Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-win/10 border border-win/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-win" />
            </span>
            <span className="text-xs font-medium text-win">{t('header.live_event')}</span>
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
