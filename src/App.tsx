import { useState } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { FighterDataProvider } from "@/shared/context/FighterDataContext";
import { FightHistoryProvider } from "@/shared/context/FightHistoryContext";
import { GamificationProvider } from "@/shared/context/GamificationContext";
import { useAuth } from "@/shared/hooks/use-auth";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import Index from "./user/pages/Index";
import LandingPage from "./user/pages/LandingPage";
import WelcomeModal from "@/user/components/WelcomeModal";
import FightDetail from "./user/pages/FightDetail";
import Settings from "./user/pages/Settings";
import AdminFightCards from "@/admin/pages/AdminFightCards";
import AdminTabPage from "@/admin/pages/AdminTabPage";
import { RequireAdmin } from "@/shared/components/RequireAdmin";
import NotFound from "./user/pages/NotFound";
import FighterProfilePage from "./user/pages/FighterProfilePage";
import { Dashboard } from "@/user/components/dashboard";
import { EventListPage } from "@/user/components/event/EventListPage";
import EventCardRoute from "./user/pages/EventCardRoute";
import { MMAMetricsRankings } from "@/user/components/rankings/MMAMetricsRankings";
import { AIPredictionsTab } from "@/user/components/ai";
import { ChatHub } from "@/user/components/chat/ChatHub";
import { FighterIndex } from "@/user/components/fighter/FighterIndex";
import { NewsPage } from "@/user/components/news/NewsPage";
import NewsArticlePage from "./user/pages/NewsArticlePage";
import { MobileBottomNav } from "@/user/components/layout/MobileBottomNav";
import { useRequestNotificationPermission } from "@/shared/hooks/use-request-notification-permission";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always refetch on mount/query key change - aligns with backend's intentional update model
      retry: false,
      refetchOnWindowFocus: true, // Refetch when user returns to tab to ensure fresh data
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

function AppRoutes() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Request notification permission on first login
  useRequestNotificationPermission();

  // Block all rendering until the session check resolves.
  // Without this guard, the router renders before AuthContext knows if
  // the user is authenticated, causing a flash of the wrong view.
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(220 25% 6%)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid hsl(210 25% 18%)',
          borderTopColor: 'hsl(190 90% 50%)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const needsOnboarding = !user.username && !onboardingDismissed;

  return (
    <>
      {needsOnboarding && (
        <WelcomeModal onComplete={() => setOnboardingDismissed(true)} />
      )}
      <Routes>
        <Route path="/" element={<Index />}>
          <Route index element={<Navigate to="/event" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event" element={<EventListPage />} />
          <Route path="event/fight/:fightId" element={<FightDetail />} />
          <Route path="event/:eventId" element={<EventCardRoute />} />
          <Route path="fighter" element={<Navigate to="/fighter/index" replace />} />
          <Route path="fighter/index" element={<FighterIndex onFighterSelect={(f) => navigate(`/fighter/${f.id}`)} />} />
          <Route path="fighter/:id" element={<FighterProfilePage />} />
          <Route path="competition" element={<MMAMetricsRankings />} />
          <Route path="ai" element={<AIPredictionsTab />} />
          <Route path="chat" element={<ChatHub />} />
          <Route path="settings" element={<Settings />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:id" element={<NewsArticlePage />} />
          <Route path="admin/fight-cards" element={<RequireAdmin><AdminFightCards /></RequireAdmin>} />
          <Route path="admin/:tab" element={<RequireAdmin><AdminTabPage /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MobileBottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GamificationProvider>
      <FighterDataProvider>
        <FightHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </FightHistoryProvider>
      </FighterDataProvider>
    </GamificationProvider>
  </QueryClientProvider>
);

export default App;
