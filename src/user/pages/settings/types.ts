export interface UserProfile {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  avatarUrl?: string | null;
  socialLinks?: { twitter?: string; instagram?: string; tiktok?: string };
  privacySettings?: { showAvatar: boolean; showSocialLinks: boolean; showUsername: boolean };
  country?: string | null;
  language?: string | null;
  role?: string;
  tier?: string;
  totalPoints?: number;
  fightingOutOf?: string;
  style?: string;
  bio?: string;
  aiPreferences?: { enabled: boolean };
}
