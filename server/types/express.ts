export type UserRole = 'user' | 'admin';
export type UserTier = 'free' | 'medium' | 'premium';

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string | null;
      username?: string | null;
      role: UserRole;
      tier: UserTier;
      country?: string | null;
      isAiChatBlocked?: boolean;
      language?: string;
    }
  }
}

export {};
