import React from 'react';
import { CountryFlag } from '@/shared/components/CountryFlag';
import { cn } from '@/shared/lib/utils';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import {
  User,
  Settings,
  Search,
  Swords,
  Shield,
  LayoutDashboard,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { userNavItems, adminNavItems } from '@/shared/config/navigation';

interface SidebarProps {
  isCollapsed?: boolean;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  isAdmin = false,
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter display-font text-[#E8A020]">
                GRIT
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation - User Tabs */}
      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="space-y-1">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {!isCollapsed && <span>{t(item.labelKey)}</span>}
                {isActive && !isCollapsed && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Tabs - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            {!isCollapsed && (
              <div className="px-3 py-2">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {t('sidebar.admin')}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    {!isCollapsed && <span>{t(item.labelKey)}</span>}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <BottomNav isCollapsed={isCollapsed} isAdmin={isAdmin} />
    </aside>
  );
};

function BottomNav({ isCollapsed, isAdmin }: { isCollapsed: boolean; isAdmin: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const displayName = (user as any)?.username ||
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() ||
    'Guest';
  const roleLabel = isAdmin ? 'Administrator' : 'Member';
  const totalPoints = (user as any)?.totalPoints || 0;

  return (
    <div className="border-t border-sidebar-border p-2">
      {/* Settings Link */}
      <Link
        to="/settings"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isCollapsed && 'justify-center'
        )}
        data-testid="link-settings"
      >
        <Settings className="h-5 w-5" />
        {!isCollapsed && <span>{t('sidebar.settings')}</span>}
      </Link>

      {/* Admin Fight Cards Link (Admin only) */}
      {isAdmin && (
        <Link
          to="/admin/fight-cards"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed && 'justify-center'
          )}
          data-testid="link-admin-fights"
        >
          <Shield className="h-5 w-5" />
          {!isCollapsed && <span>{t('sidebar.fight_management')}</span>}
        </Link>
      )}

      {/* User Profile */}
      <div className={cn(
        'mt-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30',
        isCollapsed && 'justify-center'
      )}>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        {!isCollapsed && isAuthenticated && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-sm font-black text-white display-font italic truncate">{displayName}</div>
              <CountryFlag country={(user as any)?.country} className="shrink-0 text-sm" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{roleLabel}</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20" title="Total Intelligence Points">
                <Zap className="h-2.5 w-2.5 text-primary" />
                <span className="text-[10px] text-primary font-black">{totalPoints}</span>
              </div>
            </div>
          </div>
        )}
        {!isCollapsed && !isAuthenticated && (
          <div className="flex-1">
            <button
              onClick={() => window.location.href = "/api/login"}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('common.login')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
