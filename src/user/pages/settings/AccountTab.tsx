import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { User2, Crown } from "lucide-react";
import type { UserProfile } from "./types";

interface AccountTabProps {
  profile: UserProfile;
  onDeleteAccount: () => void;
}

export function AccountTab({ profile, onDeleteAccount }: AccountTabProps) {
  const tierColors: Record<string, string> = {
    free: 'text-slate-400',
    premium: 'text-yellow-400',
    admin: 'text-purple-400',
  };

  const tierIcons: Record<string, React.ReactNode> = {
    free: <User2 className="w-5 h-5" />,
    premium: <Crown className="w-5 h-5 text-yellow-400" />,
    admin: <Crown className="w-5 h-5 text-purple-400" />,
  };

  const currentTier = (profile as any)?.tier || 'free';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User2 className="w-5 h-5" />
          Account Settings
        </CardTitle>
        <CardDescription>Manage your account and subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tierIcons[currentTier]}
              <div>
                <p className="font-medium">Current Tier</p>
                <p className={`text-lg font-bold capitalize ${tierColors[currentTier]}`}>
                  {currentTier}
                </p>
              </div>
            </div>
            {currentTier === 'free' && (
              <Button variant="default" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold text-primary">{profile.totalPoints}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Account Role</p>
            <p className="text-2xl font-bold capitalize">{profile.role}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
          <Button
            variant="destructive"
            onClick={onDeleteAccount}
            data-testid="button-delete-account"
          >
            Delete Account
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This action is permanent and cannot be undone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
