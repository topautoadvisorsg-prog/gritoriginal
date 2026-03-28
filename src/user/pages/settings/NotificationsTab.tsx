import { useGamification } from "@/shared/context/GamificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Bell } from "lucide-react";

export function NotificationsTab() {
  const { notificationSettings, updateNotificationSettings } = useGamification();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>Control when and how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Event Reminders</Label>
            <p className="text-sm text-muted-foreground">Get notified before events start</p>
          </div>
          <Switch
            checked={notificationSettings.eventReminders}
            onCheckedChange={(checked) => updateNotificationSettings({ eventReminders: checked })}
            data-testid="switch-event-reminders"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Pick Deadline Alerts</Label>
            <p className="text-sm text-muted-foreground">Remind me before picks lock</p>
          </div>
          <Switch
            checked={notificationSettings.pickDeadlineAlerts}
            onCheckedChange={(checked) => updateNotificationSettings({ pickDeadlineAlerts: checked })}
            data-testid="switch-pick-deadline"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Result Notifications</Label>
            <p className="text-sm text-muted-foreground">Notify me when fight results are in</p>
          </div>
          <Switch
            checked={notificationSettings.resultNotifications}
            onCheckedChange={(checked) => updateNotificationSettings({ resultNotifications: checked })}
            data-testid="switch-result-notifications"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Leaderboard Updates</Label>
            <p className="text-sm text-muted-foreground">Notify me when my rank changes</p>
          </div>
          <Switch
            checked={notificationSettings.leaderboardUpdates}
            onCheckedChange={(checked) => updateNotificationSettings({ leaderboardUpdates: checked })}
            data-testid="switch-leaderboard-updates"
          />
        </div>
      </CardContent>
    </Card>
  );
}
