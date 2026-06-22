import { useState, useEffect } from "react";
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
import OnboardingFlow from "@/user/components/OnboardingFlow";
import TermsOfService from "./legal/TermsOfService";
import PrivacyPolicy from "./legal/PrivacyPolicy";
import CookiePolicy from "./legal/CookiePolicy";
import CreatorAgreement from "./legal/CreatorAgreement";
import AcceptableUsePolicy from "./legal/AcceptableUsePolicy";
import SignInPage from "./auth/SignInPage";
import SignUpPage from "./auth/SignUpPage";
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
import Rules from "./user/pages/Rules";
import { MobileBottomNav } from "@/user/components/layout/MobileBottomNav";
import { GroupsHub } from "./user/pages/GroupsHub";
import { GroupDetailPage } from "./user/pages/GroupDetailPage";
import { EventHistoryPage } from "@/user/components/eventhistory/EventHistoryPage";
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
  const { user, isLoading, needsOnboarding: profileNeedsOnboarding } = useAuth();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  // Latch onboarding open once a signed-in user without a username appears.
  // OnboardingFlow persists the username at step 2; without this latch,
  // `!user.username` would flip to false and unmount the flow mid-way.
  // The flow stays mounted until the user explicitly finishes or skips.
  const [onboardingLatched, setOnboardingLatched] = useState(false);

  // Request notification permission on first login
  useRequestNotificationPermission();

  useEffect(() => {
    if (profileNeedsOnboarding && !onboardingDismissed) {
      setOnboardingLatched(true);
    }
  }, [profileNeedsOnboarding, onboardingDismissed]);

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
          borderTopColor: 'hsl(38 82% 52%)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/tos" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookie" element={<CookiePolicy />} />
        <Route path="/creator-agreement" element={<CreatorAgreement />} />
        <Route path="/aup" element={<AcceptableUsePolicy />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  const needsOnboarding = (onboardingLatched || profileNeedsOnboarding) && !onboardingDismissed;

  return (
    <>
      {needsOnboarding && (
        <OnboardingFlow onComplete={() => setOnboardingDismissed(true)} />
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
          <Route path="history" element={<EventHistoryPage />} />
          <Route path="ai" element={<AIPredictionsTab />} />
          <Route path="chat" element={<ChatHub />} />
          <Route path="settings" element={<Settings />} />
          <Route path="rules" element={<Rules />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:id" element={<NewsArticlePage />} />
          <Route path="groups" element={<GroupsHub />} />
          <Route path="groups/:groupId" element={<GroupDetailPage />} />
          <Route path="admin/fight-cards" element={<RequireAdmin><AdminFightCards /></RequireAdmin>} />
          <Route path="admin/:tab" element={<RequireAdmin><AdminTabPage /></RequireAdmin>} />
        </Route>
        {/* Legal pages — public, outside the layout shell */}
        <Route path="/tos" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookie" element={<CookiePolicy />} />
        <Route path="/creator-agreement" element={<CreatorAgreement />} />
        <Route path="/aup" element={<AcceptableUsePolicy />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
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
