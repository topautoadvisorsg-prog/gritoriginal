import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";

interface PrivacyTabProps {
  privacySettings: { showAvatar: boolean; showSocialLinks: boolean; showUsername: boolean };
  setPrivacySettings: React.Dispatch<React.SetStateAction<{ showAvatar: boolean; showSocialLinks: boolean; showUsername: boolean }>>;
}

export function PrivacyTab({ privacySettings, setPrivacySettings }: PrivacyTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control what others can see about you in the leaderboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Avatar</Label>
            <p className="text-sm text-muted-foreground">Display your profile picture in rankings</p>
          </div>
          <Switch
            checked={privacySettings.showAvatar}
            onCheckedChange={(checked) => setPrivacySettings(s => ({ ...s, showAvatar: checked }))}
            data-testid="switch-show-avatar"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Username</Label>
            <p className="text-sm text-muted-foreground">Display your username publicly</p>
          </div>
          <Switch
            checked={privacySettings.showUsername}
            onCheckedChange={(checked) => setPrivacySettings(s => ({ ...s, showUsername: checked }))}
            data-testid="switch-show-username"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Social Links</Label>
            <p className="text-sm text-muted-foreground">Display your social media links</p>
          </div>
          <Switch
            checked={privacySettings.showSocialLinks}
            onCheckedChange={(checked) => setPrivacySettings(s => ({ ...s, showSocialLinks: checked }))}
            data-testid="switch-show-social"
          />
        </div>
      </CardContent>
    </Card>
  );
}
