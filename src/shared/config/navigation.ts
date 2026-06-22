
import {
    User,
    Trophy,
    Calendar,
    Newspaper,
    History,
    MessageSquare,
    Download,
    Brain,
    Bot,
    Gift,
    BadgeCheck,
    LayoutDashboard,
    PlusSquare,
    Pencil,
    Upload,
    FileEdit,
    Tags,
    Award,
    Ticket,
    TrendingUp,
    Info,
    BookOpenCheck,
    Settings,
    Zap,
    Swords,
    Activity
} from 'lucide-react';

export interface NavItem {
    id: string;
    labelKey: string;
    icon: any;
    path: string;
}

// User-facing tabs (Simplified for stabilization)
export const userNavItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'event', labelKey: 'sidebar.eventcard', icon: Calendar, path: '/event' },
    { id: 'fighters', labelKey: 'sidebar.fighters', icon: User, path: '/fighter/index' },
    { id: 'competition', labelKey: 'sidebar.rankings', icon: Trophy, path: '/competition' },
    { id: 'news', labelKey: 'sidebar.news', icon: Newspaper, path: '/news' },
    { id: 'ai', labelKey: 'sidebar.ai_fight_analyst', icon: Brain, path: '/ai' },
    { id: 'chat', labelKey: 'sidebar.chat', icon: MessageSquare, path: '/chat' },
    { id: 'rules', labelKey: 'sidebar.rules', icon: BookOpenCheck, path: '/rules' },
];

// Admin-only tabs
export const adminNavItems: NavItem[] = [
    { id: 'create-event', labelKey: 'sidebar.create_event', icon: PlusSquare, path: '/admin/create-event' },
    { id: 'event-editor', labelKey: 'sidebar.event_editor', icon: Pencil, path: '/admin/event-editor' },
    { id: 'fight-cards', labelKey: 'sidebar.fight_cards', icon: Swords, path: '/admin/fight-cards' },
    { id: 'import', labelKey: 'sidebar.import', icon: Upload, path: '/admin/import' },
    { id: 'fighter-manager', labelKey: 'sidebar.fighter_manager', icon: User, path: '/admin/fighter-manager' },
    { id: 'create-news', labelKey: 'sidebar.create_news', icon: FileEdit, path: '/admin/create-news' },
    { id: 'admin-tags', labelKey: 'sidebar.tag_manager', icon: Tags, path: '/admin/admin-tags' },
    { id: 'admin-news-tags', labelKey: 'sidebar.news_tag_manager', icon: Tags, path: '/admin/admin-news-tags' },
    { id: 'admin-badges', labelKey: 'sidebar.badge_manager', icon: Award, path: '/admin/admin-badges' },
    { id: 'admin-raffle', labelKey: 'sidebar.raffle_manager', icon: Ticket, path: '/admin/admin-raffle' },
    { id: 'admin-verification', labelKey: 'sidebar.user_verification', icon: BadgeCheck, path: '/admin/admin-verification' },
    { id: 'admin-odds', labelKey: 'sidebar.odds_editor', icon: TrendingUp, path: '/admin/admin-odds' },
    { id: 'admin-users', labelKey: 'sidebar.user_manager', icon: User, path: '/admin/admin-users' },
    { id: 'admin-audit', labelKey: 'sidebar.audit_log', icon: History, path: '/admin/admin-audit' },
    { id: 'admin-settings', labelKey: 'sidebar.system_settings', icon: Settings, path: '/admin/admin-settings' },
    { id: 'admin-suggested-questions', labelKey: 'sidebar.suggested_questions', icon: MessageSquare, path: '/admin/admin-suggested-questions' },
    { id: 'admin-intel-feed', labelKey: 'sidebar.intel_feed', icon: Zap, path: '/admin/admin-intel-feed' },
    { id: 'admin-chat', labelKey: 'sidebar.chat_management', icon: MessageSquare, path: '/admin/admin-chat' },
    { id: 'admin-jobs', labelKey: 'sidebar.jobs_queue', icon: Activity, path: '/admin/admin-jobs' },
];

export const adminNavGroups = [
    { label: 'Events', ids: ['create-event', 'event-editor', 'fight-cards', 'admin-odds'] },
    { label: 'Content', ids: ['import', 'fighter-manager', 'create-news', 'admin-tags', 'admin-news-tags', 'admin-intel-feed'] },
    { label: 'Community', ids: ['admin-users', 'admin-verification', 'admin-badges', 'admin-raffle', 'admin-chat'] },
    { label: 'Operations', ids: ['admin-jobs', 'admin-audit', 'admin-settings', 'admin-suggested-questions'] },
].map((group) => ({ ...group, items: group.ids.map((id) => adminNavItems.find((item) => item.id === id)!).filter(Boolean) }));

// Tab Titles Helper
export const tabTitles: Record<string, { title: string; subtitle: string }> = {
    // User tabs
    dashboard: { title: 'Dashboard', subtitle: 'Your fantasy MMA journey' },
    event: { title: 'Event Card', subtitle: 'Full fight card view' },
    fighter: { title: 'Fighter Profiles', subtitle: 'Comprehensive fighter database' },
    competition: { title: 'MMA Metrics Rankings', subtitle: 'Event fantasy leaderboards' },
    news: { title: 'News', subtitle: 'Latest MMA news and fighter updates' },
    ai: { title: 'AI Fight Analyst', subtitle: 'Premium fight matchup analysis' },
    chat: { title: 'Chat', subtitle: 'Global, event, and country chat rooms' },
    rules: { title: 'Rules', subtitle: 'Picks, scoring, progression, prizes, and platform rules' },
    settings: { title: 'Settings', subtitle: 'Manage your profile and preferences' },
    // Admin tabs
    'create-event': { title: 'Create Event', subtitle: 'Admin - Create new events' },
    'event-editor': { title: 'Event Editor', subtitle: 'Admin - Edit events, status, and fights' },
    'fight-cards': { title: 'Fight Card Management', subtitle: 'Admin - Finalize fights and enter results' },
    'import': { title: 'Import', subtitle: 'Admin - Import fighters or create manually' },
    'fighter-manager': { title: 'Fighter Manager', subtitle: 'Admin - Edit fighter profiles and images' },
    'create-news': { title: 'Create News', subtitle: 'Admin - Post announcements' },
    'admin-tags': { title: 'Tag Manager', subtitle: 'Admin - Manage fighter scouting tags' },
    'admin-news-tags': { title: 'News Tag Manager', subtitle: 'Admin - Manage tags for news & signals' },
    'admin-badges': { title: 'Badge Manager', subtitle: 'Admin - Assign user badges' },
    'admin-raffle': { title: 'Reward Pool Audit', subtitle: 'Admin - Read-only event reward inspection' },
    'admin-verification': { title: 'User Verification', subtitle: 'Admin - Verify users & feature influencers' },
    'admin-odds': { title: 'Odds Editor', subtitle: 'Admin - Set fight odds per event' },
    'admin-users': { title: 'User Manager', subtitle: 'Admin - Manage platform users' },
    'admin-audit': { title: 'Audit Log', subtitle: 'Admin - View system activity logs' },
    'admin-settings': { title: 'System Settings', subtitle: 'Admin - Configure system-wide settings' },
    'admin-suggested-questions': { title: 'Suggested Questions', subtitle: 'Admin - Manage AI chat suggested questions' },
    'admin-intel-feed': { title: 'Intel Feed', subtitle: 'Admin - Manage the live intel ticker on the landing page' },
    'admin-chat': { title: 'Chat & Slip Management', subtitle: 'Admin - Moderate chat, slips, mutes, bans and the featured wall' },
    'admin-jobs': { title: 'Jobs Queue', subtitle: 'Admin - Monitor & retry failed background jobs' },
};
