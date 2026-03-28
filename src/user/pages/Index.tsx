
import React, { useState } from 'react';
import { Sidebar } from '@/user/components/layout/Sidebar';
import { Header } from '@/user/components/layout/Header';
import { TopTabNavigation } from '@/user/components/layout/TopTabNavigation';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/use-auth';
import { AdBanner } from '@/user/components/ads/AdBanner';
import { tabTitles } from '@/shared/config/navigation';

const Index = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading) return null;

  const isAdmin = user?.role === "admin";

  // Derive active tab from pathname for header title
  // For /admin/:tab paths, use the second segment (the actual tab id) for the lookup
  const segments = location.pathname.split('/').filter(Boolean);
  const lookupKey = segments[0] === 'admin' && segments[1] ? segments[1] : segments[0] || 'event';
  const currentTabInfo = tabTitles[lookupKey] || tabTitles.eventcard;

  return (
    <div className="min-h-screen bg-background">
      {isAdmin && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isAdmin={isAdmin}
        />
      )}

      <Header
        title={currentTabInfo?.title || 'GRIT'}
        subtitle={currentTabInfo?.subtitle || ''}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isAdmin={isAdmin}
      />

      {!isAdmin && (
        <div className="fixed top-16 left-0 right-0 z-20">
          <TopTabNavigation />
        </div>
      )}

      <main
        className={cn(
          'pb-8 px-4 lg:px-8 transition-all duration-300',
          isAdmin 
            ? (isSidebarCollapsed ? 'ml-16 pt-20' : 'ml-64 pt-20') 
            : 'ml-0 pt-[130px]' // 16px (1rem) higher than 120 buffer to prevent content being under fixed top nav
        )}
      >
        <Outlet />
      </main>
      <AdBanner />
    </div>
  );
};
export default Index;
