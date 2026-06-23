import { lazy, Suspense, useState, useEffect } from "react";
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
import { RequireAdmin } from "@/shared/components/RequireAdmin";
import { MobileBottomNav } from "@/user/components/layout/MobileBottomNav";
import { useRequestNotificationPermission } from "@/shared/hooks/use-request-notification-permission";

const Index = lazy(() => import('./user/pages/Index'));
const LandingPage = lazy(() => import('./user/pages/LandingPage'));
const OnboardingFlow = lazy(() => import('@/user/components/OnboardingFlow'));
const TermsOfService = lazy(() => import('./legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./legal/CookiePolicy'));
const CreatorAgreement = lazy(() => import('./legal/CreatorAgreement'));
const AcceptableUsePolicy = lazy(() => import('./legal/AcceptableUsePolicy'));
const SignInPage = lazy(() => import('./auth/SignInPage'));
const SignUpPage = lazy(() => import('./auth/SignUpPage'));
const FightDetail = lazy(() => import('./user/pages/FightDetail'));
const Settings = lazy(() => import('./user/pages/Settings'));
const AdminFightCards = lazy(() => import('@/admin/pages/AdminFightCards'));
const AdminTabPage = lazy(() => import('@/admin/pages/AdminTabPage'));
const NotFound = lazy(() => import('./user/pages/NotFound'));
const FighterProfilePage = lazy(() => import('./user/pages/FighterProfilePage'));
const Dashboard = lazy(() => import('@/user/components/dashboard').then(module => ({ default: module.Dashboard })));
const EventListPage = lazy(() => import('@/user/components/event/EventListPage').then(module => ({ default: module.EventListPage })));
const EventCardRoute = lazy(() => import('./user/pages/EventCardRoute'));
const MMAMetricsRankings = lazy(() => import('@/user/components/rankings/MMAMetricsRankings').then(module => ({ default: module.MMAMetricsRankings })));
const AIPredictionsTab = lazy(() => import('@/user/components/ai').then(module => ({ default: module.AIPredictionsTab })));
const ChatHub = lazy(() => import('@/user/components/chat/ChatHub').then(module => ({ default: module.ChatHub })));
const FighterIndex = lazy(() => import('@/user/components/fighter/FighterIndex').then(module => ({ default: module.FighterIndex })));
const NewsPage = lazy(() => import('@/user/components/news/NewsPage').then(module => ({ default: module.NewsPage })));
const NewsArticlePage = lazy(() => import('./user/pages/NewsArticlePage'));
const Rules = lazy(() => import('./user/pages/Rules'));
const GroupsHub = lazy(() => import('./user/pages/GroupsHub').then(module => ({ default: module.GroupsHub })));
const GroupDetailPage = lazy(() => import('./user/pages/GroupDetailPage').then(module => ({ default: module.GroupDetailPage })));
const EventHistoryPage = lazy(() => import('@/user/components/eventhistory/EventHistoryPage').then(module => ({ default: module.EventHistoryPage })));

const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex min-h-[45vh] items-center justify-center bg-background">
    <span className="text-sm font-black uppercase tracking-[0.25em] text-primary">Loading GRIT</span>
  </div>
);

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
      <div role="status" aria-live="polite" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        background: 'hsl(220 25% 6%)',
      }}>
        <div style={{ color: 'hsl(38 82% 52%)', fontSize: 34, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em' }}>GRIT</div>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid hsl(210 25% 18%)',
          borderTopColor: 'hsl(38 82% 52%)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'hsl(210 12% 55%)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Loading your arena
        </span>
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
                <Suspense fallback={<RouteFallback />}>
                  <AppRoutes />
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </FightHistoryProvider>
      </FighterDataProvider>
    </GamificationProvider>
  </QueryClientProvider>
);

export default App;
