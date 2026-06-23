import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type AdminComponent = LazyExoticComponent<ComponentType>;

export const ADMIN_TAB_COMPONENTS: Record<string, AdminComponent> = {
  'create-event': lazy(() => import('@/admin/components/CreateEvent').then(module => ({ default: module.CreateEvent }))),
  'event-editor': lazy(() => import('@/admin/components/AdminEventEditor').then(module => ({ default: module.AdminEventEditor }))),
  'import': lazy(() => import('@/admin/components/import/ImportPage')),
  'fighter-manager': lazy(() => import('@/admin/components/FighterManager').then(module => ({ default: module.FighterManager }))),
  'create-news': lazy(() => import('@/admin/components/CreateNews').then(module => ({ default: module.CreateNews }))),
  'admin-tags': lazy(() => import('@/admin/components/AdminTagManager').then(module => ({ default: module.AdminTagManager }))),
  'admin-news-tags': lazy(() => import('@/admin/components/tags/AdminNewsTagManager').then(module => ({ default: module.AdminNewsTagManager }))),
  'admin-badges': lazy(() => import('@/admin/components/AdminBadgeManager').then(module => ({ default: module.AdminBadgeManager }))),
  'admin-raffle': lazy(() => import('@/admin/components/AdminRaffleManager').then(module => ({ default: module.AdminRaffleManager }))),
  'admin-verification': lazy(() => import('@/admin/components/AdminUserVerification').then(module => ({ default: module.AdminUserVerification }))),
  'admin-odds': lazy(() => import('@/admin/components/AdminOddsEditor').then(module => ({ default: module.AdminOddsEditor }))),
  'admin-users': lazy(() => import('@/admin/components/AdminUserManager').then(module => ({ default: module.AdminUserManager }))),
  'admin-audit': lazy(() => import('@/admin/components/AdminAuditLog').then(module => ({ default: module.AdminAuditLog }))),
  'admin-settings': lazy(() => import('@/admin/components/AdminSystemSettings').then(module => ({ default: module.AdminSystemSettings }))),
  'admin-suggested-questions': lazy(() => import('@/admin/components/AdminSuggestedQuestions').then(module => ({ default: module.AdminSuggestedQuestions }))),
  'admin-intel-feed': lazy(() => import('@/admin/components/AdminIntelFeed').then(module => ({ default: module.AdminIntelFeed }))),
  'admin-chat': lazy(() => import('@/admin/components/AdminChatManagement').then(module => ({ default: module.AdminChatManagement }))),
  'admin-jobs': lazy(() => import('@/admin/components/AdminJobsQueue').then(module => ({ default: module.AdminJobsQueue }))),
};

export const ADMIN_TAB_IDS = Object.keys(ADMIN_TAB_COMPONENTS);

export function isAdminTab(tabId: string): boolean {
  return ADMIN_TAB_IDS.includes(tabId);
}
